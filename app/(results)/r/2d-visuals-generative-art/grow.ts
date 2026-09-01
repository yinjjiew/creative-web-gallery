/**
 * Differential line growth.
 *
 * A closed polyline lengthens by inserting vertices on edges that have
 * stretched, while every vertex is pushed away from every other within a
 * radius. The curve cannot occupy itself, so added length has to fold. Local
 * density gates insertion: when a midpoint has no room, that edge stops
 * growing. The future of the line is a function of its own accumulated shape.
 *
 * No noise field is sampled. The only irregularity is the seed — a few
 * harmonics on the opening loop — and whatever the visitor pulls.
 */

export type Attract = {
  x: number;
  y: number;
};

export type LineStatus = {
  nodes: number;
  max: number;
  settled: boolean;
  plate: number;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hypot2(dx: number, dy: number) {
  return dx * dx + dy * dy;
}

export class Growth {
  readonly plate: number;
  nodes: Node[] = [];
  settled = false;
  max: number;

  private rest: number;
  private maxLen: number;
  private reject: number;
  private reject2: number;
  private cell: number;
  private cx: number;
  private cy: number;
  private boundR: number;
  private span: number;
  private quiet = 0;
  private age = 0;
  private wind = 1;

  constructor(width: number, height: number, seed: number) {
    this.plate = seed >>> 0;
    const field = fieldOf(width, height);
    this.cx = field.x + field.w * 0.5;
    this.cy = field.y + field.h * 0.48;
    this.span = Math.min(field.w, field.h);
    this.boundR = this.span * 0.62;
    this.rest = Math.max(5.2, this.span * 0.0105);
    this.maxLen = this.rest * 1.08;
    this.reject = this.rest * 3.05;
    this.reject2 = this.reject * this.reject;
    this.cell = this.reject;
    this.max = clamp(
      Math.floor(
        (Math.PI * (this.span * 0.28) ** 2) / (this.rest * this.reject * 0.82),
      ),
      380,
      780,
    );

    const rand = mulberry32(this.plate);
    const r0 = this.span * 0.13;
    const n = Math.max(24, Math.round((2 * Math.PI * r0) / this.rest));
    const p1 = rand() * Math.PI * 2;
    const p2 = rand() * Math.PI * 2;
    const p3 = rand() * Math.PI * 2;
    // A slightly off-centre seed so an unattended plate is a composition,
    // not a medallion.
    const ox = (rand() - 0.5) * this.span * 0.06;
    const oy = (rand() - 0.5) * this.span * 0.05;

    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const r =
        r0 *
        (1 +
          0.16 * Math.sin(2 * t + p1) +
          0.11 * Math.sin(3 * t + p2) +
          0.07 * Math.cos(5 * t + p3));
      this.nodes.push({
        x: this.cx + ox + Math.cos(t) * r,
        y: this.cy + oy + Math.sin(t) * r,
        vx: 0,
        vy: 0,
      });
    }
    // Canvas y grows down, so a trigonometric loop is clockwise on the
    // page. Pick the winding whose first normal points away from the centre.
    this.wind = 1;
    {
      const a = this.nodes[0];
      const prev = this.nodes[this.nodes.length - 1];
      const next = this.nodes[1];
      const nx = -(next.y - prev.y);
      const ny = next.x - prev.x;
      if (nx * (a.x - this.cx) + ny * (a.y - this.cy) < 0) this.wind = -1;
    }
  }

  status(): LineStatus {
    return {
      nodes: this.nodes.length,
      max: this.max,
      settled: this.settled,
      plate: this.plate,
    };
  }

  step(attract: Attract | null) {
    if (this.settled) return;

    const nodes = this.nodes;
    const n = nodes.length;
    const hash = this.buildHash();
    const rest = this.rest;
    const springK = 0.28;
    const rejectK = 0.09;
    const growK = 0.32;
    const attractR = this.span * 0.2;
    const attractR2 = attractR * attractR;
    const attractK = 0.55;
    const damp = 0.44;
    const maxV = this.rest * 0.55;

    let energy = 0;

    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      const prev = nodes[(i + n - 1) % n];
      const next = nodes[(i + 1) % n];
      let fx = 0;
      let fy = 0;

      // Springs to the two neighbours — the line remains a line.
      const dpx = prev.x - a.x;
      const dpy = prev.y - a.y;
      const lp = Math.hypot(dpx, dpy) || 1e-6;
      const sp = (lp - rest) * springK;
      fx += (dpx / lp) * sp;
      fy += (dpy / lp) * sp;

      const dnx = next.x - a.x;
      const dny = next.y - a.y;
      const ln = Math.hypot(dnx, dny) || 1e-6;
      const sn = (ln - rest) * springK;
      fx += (dnx / ln) * sn;
      fy += (dny / ln) * sn;

      // Local outward puff. After folds, "outward" is only local, which is
      // what turns a wrinkle into a lobe.
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const tl = Math.hypot(tx, ty) || 1e-6;
      fx += (-ty / tl) * growK * this.wind;
      fy += (tx / tl) * growK * this.wind;

      // Self-avoidance via the hash. Immediate neighbours are excluded so
      // the springs are not fighting the reject radius.
      const i0 = Math.floor(a.x / this.cell);
      const j0 = Math.floor(a.y / this.cell);
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const bucket = hash.get(cellKey(i0 + di, j0 + dj));
          if (!bucket) continue;
          for (let k = 0; k < bucket.length; k++) {
            const j = bucket[k];
            if (j === i) continue;
            const d = (j - i + n) % n;
            if (d === 1 || d === n - 1) continue;
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = hypot2(dx, dy);
            if (d2 > this.reject2 || d2 < 1e-8) continue;
            const dist = Math.sqrt(d2);
            const push = ((this.reject - dist) / this.reject) * rejectK;
            fx += (dx / dist) * push;
            fy += (dy / dist) * push;
          }
        }
      }

      if (attract) {
        const dx = attract.x - a.x;
        const dy = attract.y - a.y;
        const d2 = hypot2(dx, dy);
        if (d2 < attractR2 && d2 > 1e-6) {
          const dist = Math.sqrt(d2);
          const fall = 1 - dist / attractR;
          const pull = attractK * fall * fall;
          fx += (dx / dist) * pull;
          fy += (dy / dist) * pull;
        }
      }

      // Soft circular safety wall — sized larger than the intended mass, so
      // a finished plate rarely leans on it.
      const wx = a.x - this.cx;
      const wy = a.y - this.cy;
      const wr = Math.hypot(wx, wy);
      if (wr > this.boundR) {
        const over = wr - this.boundR;
        fx -= (wx / wr) * over * 0.18;
        fy -= (wy / wr) * over * 0.18;
      }

      a.vx = (a.vx + fx) * damp;
      a.vy = (a.vy + fy) * damp;
      const v = Math.hypot(a.vx, a.vy);
      if (v > maxV) {
        a.vx = (a.vx / v) * maxV;
        a.vy = (a.vy / v) * maxV;
      }
      energy += a.vx * a.vx + a.vy * a.vy;
    }

    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
    }

    const inserted = this.insert(attract, this.buildHash());
    this.age += 1;

    const packed =
      this.nodes.length >= this.max ||
      (inserted === 0 && this.nodes.length > this.max * 0.45 && this.age > 800);
    if (packed && energy < this.nodes.length * 0.012) {
      this.quiet += 1;
    } else {
      this.quiet = 0;
    }
    if (this.quiet > 64) {
      this.settled = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, ink: string, weight: number) {
    const nodes = this.nodes;
    const n = nodes.length;
    if (n < 2) return;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
    ctx.closePath();
    ctx.strokeStyle = ink;
    ctx.lineWidth = weight;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  /**
   * Run without drawing until the plate settles. Used when the visitor has
   * asked not to watch the growth.
   */
  finish() {
    let guard = 0;
    while (!this.settled && guard++ < 10_000) this.step(null);
    this.settled = true;
  }

  private insert(attract: Attract | null, hash: Map<number, number[]>) {
    if (this.nodes.length >= this.max) return 0;
    const nodes = this.nodes;
    const n = nodes.length;
    // One birth per step keeps the lengthening watchable.
    let best = -1;
    let bestScore = 0;
    const mid = { x: 0, y: 0 };

    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      mid.x = (a.x + b.x) * 0.5;
      mid.y = (a.y + b.y) * 0.5;

      const c = curvature(nodes[(i + n - 1) % n], a, b);
      let thresh = this.maxLen * (1 - 0.38 * c);
      if (attract) {
        const d = Math.hypot(attract.x - mid.x, attract.y - mid.y);
        if (d < this.span * 0.2) thresh *= 0.72;
      }
      if (len <= thresh) continue;
      if (!this.hasRoom(mid.x, mid.y, hash, i, (i + 1) % n)) continue;
      if (len > bestScore) {
        bestScore = len;
        best = i;
      }
    }

    if (best < 0) return 0;
    const a = nodes[best];
    const b = nodes[(best + 1) % n];
    nodes.splice(best + 1, 0, {
      x: (a.x + b.x) * 0.5,
      y: (a.y + b.y) * 0.5,
      vx: (a.vx + b.vx) * 0.5,
      vy: (a.vy + b.vy) * 0.5,
    });
    return 1;
  }

  private hasRoom(
    x: number,
    y: number,
    hash: Map<number, number[]>,
    ignoreA: number,
    ignoreB: number,
  ) {
    const min2 = (this.rest * 0.92) ** 2;
    const i0 = Math.floor(x / this.cell);
    const j0 = Math.floor(y / this.cell);
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const bucket = hash.get(cellKey(i0 + di, j0 + dj));
        if (!bucket) continue;
        for (let k = 0; k < bucket.length; k++) {
          const idx = bucket[k];
          if (idx === ignoreA || idx === ignoreB) continue;
          const node = this.nodes[idx];
          if (hypot2(node.x - x, node.y - y) < min2) return false;
        }
      }
    }
    return true;
  }

  private buildHash() {
    const map = new Map<number, number[]>();
    const nodes = this.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const key = cellKey(
        Math.floor(nodes[i].x / this.cell),
        Math.floor(nodes[i].y / this.cell),
      );
      const bucket = map.get(key);
      if (bucket) bucket.push(i);
      else map.set(key, [i]);
    }
    return map;
  }
}

export function fieldOf(width: number, height: number) {
  const left = Math.max(28, width * 0.08);
  const right = Math.max(28, width * 0.08);
  const top = Math.max(48, height * 0.1);
  const bottom = Math.max(64, height * 0.155);
  return {
    x: left,
    y: top,
    w: width - left - right,
    h: height - top - bottom,
  };
}

function cellKey(i: number, j: number) {
  return i * 73856093 + j * 19349663;
}

function curvature(prev: Node, cur: Node, next: Node) {
  const ax = cur.x - prev.x;
  const ay = cur.y - prev.y;
  const bx = next.x - cur.x;
  const by = next.y - cur.y;
  const al = Math.hypot(ax, ay) || 1e-6;
  const bl = Math.hypot(bx, by) || 1e-6;
  const dot = (ax / al) * (bx / bl) + (ay / al) * (by / bl);
  return clamp((1 - dot) * 0.5, 0, 1);
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
