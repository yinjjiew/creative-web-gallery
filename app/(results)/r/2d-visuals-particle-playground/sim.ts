import {
  ANNOUNCE,
  CAPTIONS,
  MAX_POLES,
  ejectFromMagnet,
  insideMagnet,
  needleDelta,
  sampleField,
  writePoles,
  type Magnet,
  type Preset,
} from "./physics";

export type { Magnet, Preset };

const FMAX = 22;
const ALIGN = 14;
const FORCE = 2.8;
const DRAG = 5.4;
const CELL = 0.92;
const MIN_D = 0.46;
const MIN_D2 = MIN_D * MIN_D;

export class Sim {
  magnets: Magnet[] = [];
  selected = 0;
  preset: Preset = "unlike";

  readonly px: Float32Array;
  readonly py: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly angle: Float32Array;
  readonly shade: Float32Array;
  readonly length: Float32Array;
  count: number;

  worldW = 80;
  worldH = 50;
  stir = 0;
  mobility = 1;

  private readonly poleX = new Float32Array(MAX_POLES);
  private readonly poleY = new Float32Array(MAX_POLES);
  private readonly poleQ = new Float32Array(MAX_POLES);
  private nPoles = 0;
  private readonly sample = new Float32Array(5);

  private cols = 1;
  private rows = 1;
  private heads = new Int32Array(1);
  private next: Int32Array;
  private originX = 0;
  private originY = 0;
  private frame = 0;

  constructor(count: number) {
    this.count = count;
    this.px = new Float32Array(count);
    this.py = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.angle = new Float32Array(count);
    this.shade = new Float32Array(count);
    this.length = new Float32Array(count);
    this.next = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      this.shade[i] = hash(i * 3.1);
      this.length[i] = 0.62 + hash(i * 7.7) * 0.38;
      this.angle[i] = hash(i * 2.2) * Math.PI;
    }
  }

  setBounds(w: number, h: number): void {
    this.worldW = w;
    this.worldH = h;
    this.originX = -w * 0.5;
    this.originY = -h * 0.5;
    this.cols = Math.max(1, Math.ceil(w / CELL) + 1);
    this.rows = Math.max(1, Math.ceil(h / CELL) + 1);
    this.heads = new Int32Array(this.cols * this.rows);
    for (const m of this.magnets) this.clampMagnet(m);
  }

  applyPreset(kind: Preset): void {
    this.preset = kind;
    const span = Math.min(this.worldW, this.worldH);
    const len = clamp(span * 0.2, 11, 16);
    const width = len * 0.28;
    const q = 88;
    const gap = clamp(span * 0.28, 14, 22);

    if (kind === "single") {
      this.magnets = [
        { x: 0, y: 0, angle: 0, length: len, width, strength: q, flipped: false },
      ];
    } else {
      const like = kind === "like";
      this.magnets = [
        {
          x: -gap * 0.5,
          y: 0,
          angle: 0,
          length: len,
          width,
          strength: q,
          flipped: false,
        },
        {
          x: gap * 0.5,
          y: 0,
          angle: like ? Math.PI : 0,
          length: len,
          width,
          strength: q,
          flipped: false,
        },
      ];
    }
    this.selected = 0;
    this.refreshPoles();
    this.scatter();
    this.seedAlongLines();
    this.snapAngles();
  }

  caption(): string {
    return CAPTIONS[this.preset];
  }

  announce(): string {
    return ANNOUNCE[this.preset];
  }

  tap(): void {
    this.stir = 1;
  }

  flipSelected(): void {
    const m = this.magnets[this.selected];
    if (!m) return;
    m.flipped = !m.flipped;
    this.refreshPoles();
    this.retitleFromPoles();
  }

  rotateSelected(delta: number): void {
    const m = this.magnets[this.selected];
    if (!m) return;
    m.angle += delta;
    this.clampMagnet(m);
    this.refreshPoles();
  }

  nudgeSelected(dx: number, dy: number): void {
    const m = this.magnets[this.selected];
    if (!m) return;
    m.x += dx;
    m.y += dy;
    this.clampMagnet(m);
    this.refreshPoles();
  }

  refreshPoles(): void {
    this.nPoles = writePoles(this.magnets, this.poleX, this.poleY, this.poleQ);
  }

  step(dt: number): void {
    const n = this.count;
    const stir = this.stir;
    this.stir = Math.max(0, this.stir - dt * 1.6);
    const mobile = this.mobility * (0.35 + stir * 1.8);
    const damp = Math.exp(-DRAG * dt);
    const out = this.sample;
    const px = this.px;
    const py = this.py;
    const vx = this.vx;
    const vy = this.vy;

    this.refreshPoles();

    for (let i = 0; i < n; i++) {
      sampleField(px[i], py[i], this.poleX, this.poleY, this.poleQ, this.nPoles, out);
      const bx = out[0];
      const by = out[1];
      const b2 = bx * bx + by * by;

      if (b2 > 1e-6) {
        this.angle[i] += needleDelta(this.angle[i], Math.atan2(by, bx)) * Math.min(1, ALIGN * dt);
      }

      let fx = out[3] * FORCE;
      let fy = out[4] * FORCE;
      const f2 = fx * fx + fy * fy;
      if (f2 > FMAX * FMAX) {
        const s = FMAX / Math.sqrt(f2);
        fx *= s;
        fy *= s;
      }

      if (stir > 0.05) {
        const j = (hash(i + this.frame * 0.017) - 0.5) * stir * 6;
        fx += j;
        fy += (hash(i * 1.3 + 9) - 0.5) * stir * 6;
      }

      vx[i] = (vx[i] + fx * mobile * dt) * damp;
      vy[i] = (vy[i] + fy * mobile * dt) * damp;
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
    }

    this.keepOnPaper();
    this.frame += 1;
    if (this.frame % 3 === 0) this.separate();
    this.avoidBars();
  }

  settle(steps: number, dt = 1 / 45): void {
    const was = this.mobility;
    this.mobility = 1.6;
    this.stir = 0.4;
    for (let i = 0; i < steps; i++) this.step(dt);
    this.mobility = was;
    this.stir = 0;
    this.vx.fill(0);
    this.vy.fill(0);
    this.snapAngles();
  }

  snapAngles(): void {
    const out = this.sample;
    for (let i = 0; i < this.count; i++) {
      sampleField(this.px[i], this.py[i], this.poleX, this.poleY, this.poleQ, this.nPoles, out);
      const b2 = out[0] * out[0] + out[1] * out[1];
      if (b2 > 1e-6) this.angle[i] = Math.atan2(out[1], out[0]);
    }
  }

  private scatter(): void {
    const hw = this.worldW * 0.48;
    const hh = this.worldH * 0.48;
    for (let i = 0; i < this.count; i++) {
      this.px[i] = (hash(i * 13.1 + 1) * 2 - 1) * hw;
      this.py[i] = (hash(i * 9.4 + 4) * 2 - 1) * hh;
      this.vx[i] = 0;
      this.vy[i] = 0;
    }
  }

  /**
   * Place a majority of needles on integrated field lines so the plate is
   * readable before anyone taps. The rest stay as a random scatter — the
   * weak-field regions of a real sheet.
   */
  private seedAlongLines(): void {
    this.refreshPoles();
    const want = Math.floor(this.count * 0.62);
    const placed: number[] = [];
    const rays = 32;
    const steps = 72;
    const ds = 0.5;
    const out = this.sample;

    for (let p = 0; p < this.nPoles; p++) {
      for (const dir of [1, -1]) {
        for (let r = 0; r < rays; r++) {
          const theta = ((r + 0.37) / rays) * Math.PI * 2;
          let x = this.poleX[p] + Math.cos(theta) * 1.7;
          let y = this.poleY[p] + Math.sin(theta) * 1.7;
          for (let s = 0; s < steps; s++) {
            sampleField(x, y, this.poleX, this.poleY, this.poleQ, this.nPoles, out);
            const mag = Math.hypot(out[0], out[1]);
            if (mag < 0.018) break;
            x += (dir * out[0] * ds) / mag;
            y += (dir * out[1] * ds) / mag;
            if (!this.onPaper(x, y)) break;
            if (this.inAnyMagnet(x, y)) continue;
            if (s % 2 === 0 || mag > 1.1) {
              placed.push(x, y);
              if (placed.length >= want * 2) break;
            }
          }
          if (placed.length >= want * 2) break;
        }
        if (placed.length >= want * 2) break;
      }
      if (placed.length >= want * 2) break;
    }

    const nPlace = Math.min(want, Math.floor(placed.length / 2));
    for (let i = 0; i < nPlace; i++) {
      this.px[i] = placed[i * 2];
      this.py[i] = placed[i * 2 + 1];
    }
  }

  private keepOnPaper(): void {
    const hw = this.worldW * 0.5 - 0.4;
    const hh = this.worldH * 0.5 - 0.4;
    for (let i = 0; i < this.count; i++) {
      if (this.px[i] > hw) {
        this.px[i] = hw;
        this.vx[i] *= -0.2;
      } else if (this.px[i] < -hw) {
        this.px[i] = -hw;
        this.vx[i] *= -0.2;
      }
      if (this.py[i] > hh) {
        this.py[i] = hh;
        this.vy[i] *= -0.2;
      } else if (this.py[i] < -hh) {
        this.py[i] = -hh;
        this.vy[i] *= -0.2;
      }
    }
  }

  private avoidBars(): void {
    for (const m of this.magnets) {
      const reach = m.length * 0.55 + m.width * 0.55;
      const reach2 = reach * reach;
      for (let i = 0; i < this.count; i++) {
        const dx = this.px[i] - m.x;
        const dy = this.py[i] - m.y;
        if (dx * dx + dy * dy > reach2) continue;
        if (insideMagnet(this.px[i], this.py[i], m, 0.12)) {
          const p = ejectFromMagnet(this.px[i], this.py[i], m);
          this.px[i] = p.x;
          this.py[i] = p.y;
          this.vx[i] *= 0.3;
          this.vy[i] *= 0.3;
        }
      }
    }
  }

  private separate(): void {
    const cols = this.cols;
    const rows = this.rows;
    const heads = this.heads;
    const next = this.next;
    const n = this.count;
    heads.fill(-1);

    for (let i = 0; i < n; i++) {
      const cx = Math.floor((this.px[i] - this.originX) / CELL);
      const cy = Math.floor((this.py[i] - this.originY) / CELL);
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) {
        next[i] = -1;
        continue;
      }
      const c = cy * cols + cx;
      next[i] = heads[c];
      heads[c] = i;
    }

    const px = this.px;
    const py = this.py;
    for (let i = 0; i < n; i++) {
      const cx = Math.floor((px[i] - this.originX) / CELL);
      const cy = Math.floor((py[i] - this.originY) / CELL);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const x = cx + ox;
          const y = cy + oy;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          let j = heads[y * cols + x];
          let seen = 0;
          while (j >= 0 && seen < 8) {
            if (j > i) {
              const dx = px[j] - px[i];
              const dy = py[j] - py[i];
              const d2 = dx * dx + dy * dy;
              if (d2 < MIN_D2 && d2 > 1e-10) {
                const d = Math.sqrt(d2);
                const push = (MIN_D - d) * 0.46;
                const nx = dx / d;
                const ny = dy / d;
                px[i] -= nx * push;
                py[i] -= ny * push;
                px[j] += nx * push;
                py[j] += ny * push;
              }
            }
            j = next[j];
            seen += 1;
          }
        }
      }
    }
  }

  private onPaper(x: number, y: number): boolean {
    return Math.abs(x) < this.worldW * 0.48 && Math.abs(y) < this.worldH * 0.48;
  }

  private inAnyMagnet(x: number, y: number): boolean {
    for (const m of this.magnets) {
      if (insideMagnet(x, y, m, 0.2)) return true;
    }
    return false;
  }

  clampMagnet(m: Magnet): void {
    const pad = m.length * 0.55;
    m.x = clamp(m.x, -this.worldW * 0.5 + pad, this.worldW * 0.5 - pad);
    m.y = clamp(m.y, -this.worldH * 0.5 + pad, this.worldH * 0.5 - pad);
  }

  private retitleFromPoles(): void {
    if (this.magnets.length < 2) {
      this.preset = "single";
      return;
    }
    const a = this.magnets[0];
    const b = this.magnets[1];
    const facing = facingCharges(a, b);
    this.preset = facing < 0 ? "unlike" : "like";
  }
}

function facingCharges(a: Magnet, b: Magnet): number {
  const qa = a.flipped ? -1 : 1;
  const qb = b.flipped ? -1 : 1;
  const aN = {
    x: a.x + Math.cos(a.angle) * a.length * 0.5 * qa,
    y: a.y + Math.sin(a.angle) * a.length * 0.5 * qa,
  };
  const aS = {
    x: a.x - Math.cos(a.angle) * a.length * 0.5 * qa,
    y: a.y - Math.sin(a.angle) * a.length * 0.5 * qa,
  };
  const bN = {
    x: b.x + Math.cos(b.angle) * b.length * 0.5 * qb,
    y: b.y + Math.sin(b.angle) * b.length * 0.5 * qb,
  };
  const bS = {
    x: b.x - Math.cos(b.angle) * b.length * 0.5 * qb,
    y: b.y - Math.sin(b.angle) * b.length * 0.5 * qb,
  };
  const pairs = [
    [dist2(aN, bN), 1],
    [dist2(aS, bS), 1],
    [dist2(aN, bS), -1],
    [dist2(aS, bN), -1],
  ];
  pairs.sort((p, q) => p[0] - q[0]);
  return pairs[0][1];
}

function dist2(p: { x: number; y: number }, q: { x: number; y: number }): number {
  const dx = p.x - q.x;
  const dy = p.y - q.y;
  return dx * dx + dy * dy;
}

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function particleCount(width: number, height: number, reduced: boolean): number {
  const mobile = Math.min(width, height) < 700 || width < 520;
  if (reduced) return mobile ? 10000 : 16000;
  return mobile ? 12000 : 22000;
}
