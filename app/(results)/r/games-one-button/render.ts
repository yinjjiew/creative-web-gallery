/**
 * Trapeze — the picture.
 *
 * One hall, one follow spot, two silhouettes. The palette is three values of the
 * same warm bone against near-black ink, plus a single earth red that is only
 * ever used for a fall, so it means something when it appears. Everything is
 * drawn: no images, no gradients used as decoration, and the only light effects
 * present are the ones the subject actually has — a spot, its dust, and the pool
 * it throws on the net.
 */
import {
  BAR_CABLE,
  CATCHER_HAND_R,
  CATCH_CABLE,
  FLOOR_Y,
  NET_Y,
  START_AMP,
  catchPoint,
  catchR,
  hangPos,
  holdSwing,
  predictArc,
  stretchOf,
  targetSwing,
  type Game,
  type Swing,
  type Vec2,
} from "./sim";
import {
  POSES,
  catcherSkeleton,
  drawSkeleton,
  hands,
  mixPose,
  skeleton,
  type Brush,
  type P,
  type Pose,
} from "./figures";

const INK = "#0c0b0a";
const BLACK = "#000000";
/** Warm bone. Used only through alpha, never as a fill at full strength. */
const LIT = "232, 216, 184";
const FALL = "170, 62, 42";

/** Metres of world the framing tries to keep visible on a landscape screen. */
const FRAME_W = 11.9;
const FRAME_H = 11.0;
/**
 * On a phone held upright the world cannot be both wide and tall enough, and
 * showing 24 m of empty hall to satisfy the width is the worse trade: the act
 * happens in a 10 m band and the picture should be that band. So a narrow
 * viewport gets a tighter horizontal window and leans on the camera instead.
 */
const NARROW_W = 7.4;
const NARROW_H = 12.6;

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
/** Frame-rate independent approach, so the camera feels the same at any fps. */
const approach = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  ph: number;
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
}

export class Stage {
  w = 0;
  h = 0;
  dpr = 1;
  scale = 90;
  /** Half the world width on screen, plus a margin. Set by resize. */
  halfW = FRAME_W;
  camX = 0;
  camY = 4.3;
  zoom = 1;
  shake = 0;
  shakeSeed = Math.random() * 100;
  /** The spot lags the flyer, which is what makes it feel operated. */
  spotAimX = 0;
  spotAimY = 3;
  spotX = 0;
  t = 0;
  flash = 0;
  redFlash = 0;

  private motes: Mote[] = [];
  private puffs: Puff[] = [];
  private trail: { x: number; y: number; a: number }[] = [];
  private arc: Vec2[] = [];
  /**
   * The light — beam, scrim, lamps, the pool on the net — is rendered into a
   * third-size buffer and blown back up. Nothing in it has an edge, so the
   * resampling is invisible, and it turns six full-frame gradient fills into one
   * image copy. The difference between 20 fps and 60 fps on a modest machine.
   */
  private lit: HTMLCanvasElement | null = null;
  private litCtx: CanvasRenderingContext2D | null = null;
  /** Vignette and grain, which never move: built once per resize. */
  private print: HTMLCanvasElement | null = null;

  constructor(private reduced: boolean) {}

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.scale =
      w / h < 0.85
        ? Math.min(w / NARROW_W, h / NARROW_H)
        : Math.min(w / FRAME_W, h / FRAME_H);
    // How much world is actually on screen, which is what culling should use.
    this.halfW = w / this.scale / 2 + 1.5;
    this.lit = null;
    this.litCtx = null;
    this.print = null;
  }

  private ensureMotes() {
    const want = this.reduced ? 90 : 260;
    while (this.motes.length < want) {
      this.motes.push({
        x: this.camX + (Math.random() - 0.5) * this.halfW * 2.2,
        y: -2 + Math.random() * (FLOOR_Y + 2),
        vx: (Math.random() - 0.5) * 0.09,
        vy: (Math.random() - 0.5) * 0.06 - 0.012,
        r: 0.012 + Math.random() * 0.026,
        ph: Math.random() * 6.28,
      });
    }
    if (this.motes.length > want) this.motes.length = want;
  }

  /** Chalk. Only ever emitted by hands leaving or meeting something. */
  puff(x: number, y: number, vx: number, vy: number, n: number, spread = 1) {
    const count = this.reduced ? Math.ceil(n * 0.3) : n;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 0.9 * spread;
      const max = 0.5 + Math.random() * 1.5;
      this.puffs.push({
        x,
        y,
        vx: vx * 0.28 + Math.cos(a) * s,
        vy: vy * 0.28 + Math.sin(a) * s - 0.2,
        r: 0.03 + Math.random() * 0.07,
        life: max,
        max,
      });
    }
    if (this.puffs.length > 460) this.puffs.splice(0, this.puffs.length - 460);
  }

  update(g: Game, dt: number) {
    this.t += dt;
    this.ensureMotes();

    const f = g.flyer;
    const target = targetSwing(g);

    // Framing: mostly the flyer, pulled towards whatever they are aiming at so
    // the decision and its consequence are in the same picture.
    const down = g.phase === "falling" || g.phase === "over";
    let wantX = f.pos.x;
    if (target && !down) wantX = f.pos.x * 0.6 + target.px * 0.4;
    // Where type sits over the picture, the action is pushed out of its way:
    // the lower left on the title card, and again on the card after a fall.
    if (g.phase === "board") wantX = f.pos.x + 1.2;
    if (down) wantX = f.pos.x - 1.9;
    const rate = g.phase === "flight" ? 7.5 : 3.4;
    this.camX = approach(this.camX, wantX, rate, dt);

    // A tall screen shows more height than the act needs, so the surplus is
    // spent on the floor below the net rather than on empty air above the truss.
    const lift = clamp(this.h / this.scale - 11.4, 0, 8) * 0.34;
    let wantY = 3.95 + lift + clamp((f.pos.y - 4.0) * 0.16, -0.5, 1.0);
    // The fall is the one thing the player has to be shown. The spot follows the
    // body down and the frame goes with it instead of watching from up in the rig.
    if (down) wantY = f.pos.y - 1.5 + lift * 0.5;
    this.camY = approach(this.camY, wantY, down ? 3.1 : 2.2, dt);

    // A breath out during the flight, a small punch in on the catch, and a slow
    // press in on the body in the net.
    let wantZoom = g.phase === "flight" ? 0.955 : 1;
    if (g.hitstop > 0) wantZoom = 1.035;
    if (down) wantZoom = 1.1;
    this.zoom = approach(this.zoom, wantZoom, g.phase === "over" ? 1.4 : 6, dt);

    this.spotX = approach(this.spotX, f.pos.x + 0.4, 2.6, dt);
    this.spotAimX = approach(this.spotAimX, f.pos.x, 5.5, dt);
    this.spotAimY = approach(this.spotAimY, f.pos.y, 5.5, dt);

    this.shake = g.shake;
    this.flash = Math.max(0, this.flash - dt * 5.5);
    this.redFlash = Math.max(0, this.redFlash - dt * 1.6);

    for (const m of this.motes) {
      m.ph += dt * 0.6;
      m.x += (m.vx + Math.sin(m.ph) * 0.02) * dt;
      m.y += m.vy * dt;
      if (m.y < -2.4) m.y = FLOOR_Y;
      if (m.y > FLOOR_Y) m.y = -2.4;
      const dx = m.x - this.camX;
      if (dx < -this.halfW) m.x += this.halfW * 2;
      if (dx > this.halfW) m.x -= this.halfW * 2;
    }

    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.puffs.splice(i, 1);
        continue;
      }
      p.vx *= 1 - 2.4 * dt;
      p.vy = p.vy * (1 - 2.4 * dt) + 0.32 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += dt * 0.11;
    }

    // Trail. Informational as much as decorative: it is the shape of the swing.
    if (g.phase === "hold" || g.phase === "flight") {
      const last = this.trail[this.trail.length - 1];
      if (!last || Math.hypot(last.x - f.pos.x, last.y - f.pos.y) > 0.075) {
        this.trail.push({ x: f.pos.x, y: f.pos.y, a: 1 });
      }
    }
    const decay = g.phase === "flight" ? 1.05 : 1.9;
    for (const p of this.trail) p.a -= dt * decay;
    while (this.trail.length && this.trail[0].a <= 0) this.trail.shift();
    if (this.trail.length > 260) this.trail.shift();
  }

  clearTrail() {
    this.trail.length = 0;
  }

  /**
   * The paper: a vignette and a grain that is half specks of light and half
   * specks of dark, so laying it over the frame stays value-neutral instead of
   * fogging the blacks. Neither depends on the camera, so it is built once.
   */
  private printOverlay() {
    if (this.print) return this.print;
    const { w, h } = this;
    if (w < 2 || h < 2) return null;
    const k = 0.5;
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(w * k));
    c.height = Math.max(2, Math.round(h * k));
    const p = c.getContext("2d");
    if (!p) return null;

    const vg = p.createRadialGradient(
      c.width / 2,
      c.height * 0.46,
      Math.min(c.width, c.height) * 0.32,
      c.width / 2,
      c.height * 0.46,
      Math.max(c.width, c.height) * 0.78
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.38)");
    p.fillStyle = vg;
    p.fillRect(0, 0, c.width, c.height);

    const n = 128;
    const tile = document.createElement("canvas");
    tile.width = n;
    tile.height = n;
    const tc = tile.getContext("2d");
    if (tc) {
      const img = tc.createImageData(n, n);
      for (let i = 0; i < n * n; i++) {
        // Sparse, and weighted towards specks of dark: light specks would lift
        // the blacks, and the blacks are the drawing.
        if (Math.random() > 0.34) continue;
        const up = Math.random() < 0.38;
        img.data[i * 4] = up ? 214 : 0;
        img.data[i * 4 + 1] = up ? 202 : 0;
        img.data[i * 4 + 2] = up ? 180 : 0;
        img.data[i * 4 + 3] = Math.random() * (up ? 7 : 12);
      }
      tc.putImageData(img, 0, 0);
      const pat = p.createPattern(tile, "repeat");
      if (pat) {
        p.fillStyle = pat;
        p.fillRect(0, 0, c.width, c.height);
      }
    }

    this.print = c;
    return c;
  }

  /** The low-resolution buffer the light is accumulated in. */
  private litBuffer() {
    if (this.lit && this.litCtx) return this.litCtx;
    const { w, h } = this;
    if (w < 2 || h < 2) return null;
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(w / 3));
    c.height = Math.max(2, Math.round(h / 3));
    const cx = c.getContext("2d");
    if (!cx) return null;
    this.lit = c;
    this.litCtx = cx;
    return cx;
  }

  draw(ctx: CanvasRenderingContext2D, g: Game) {
    const { w, h } = this;
    const scale = this.scale * this.zoom;
    let sx = 0;
    let sy = 0;
    if (this.shake > 0.001 && !this.reduced) {
      const k = this.shake * this.shake * 9;
      const t = this.t * 47 + this.shakeSeed;
      sx = Math.sin(t) * k + Math.sin(t * 2.7) * k * 0.4;
      sy = Math.cos(t * 1.3) * k * 0.8;
    }
    const ox = w / 2 - this.camX * scale + sx;
    const oy = h / 2 - this.camY * scale + sy;
    const to = (p: P): P => ({ x: p.x * scale + ox, y: p.y * scale + oy });
    const brush: Brush = { to, scale, ctx };

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    /* ── the hall ─────────────────────────────────────────────────────────── */
    const spotSrc = { x: this.spotX, y: -4.6 };
    const aim = { x: this.spotAimX, y: this.spotAimY };

    const lx = this.litBuffer();
    if (lx && this.lit) {
      const k = this.lit.width / w;
      lx.setTransform(k, 0, 0, k, 0, 0);
      lx.globalCompositeOperation = "source-over";
      lx.globalAlpha = 1;
      lx.fillStyle = INK;
      lx.fillRect(0, 0, w, h);
      this.drawBackdrop(lx, to, scale);
      this.drawBeam(lx, to, scale, spotSrc, aim);
      this.drawSecondLamp(lx, to, scale, g);
      this.drawNetPool(lx, to, scale, spotSrc, aim);
      ctx.drawImage(this.lit, 0, 0, w, h);
    } else {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, w, h);
    }

    this.drawStructure(ctx, to, scale, g);
    this.drawMotes(ctx, to, scale, spotSrc, aim);
    this.drawNetMesh(ctx, to, scale, spotSrc, aim);

    /* ── the act ──────────────────────────────────────────────────────────── */
    this.drawSweep(ctx, to, scale, g);
    this.drawTrail(ctx, to, scale);
    this.drawPrediction(ctx, to, scale, g);

    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    for (const s of g.swings) this.drawApparatus(brush, s, g);
    for (const s of g.swings) if (s.kind === "catcher") this.drawCatcher(brush, s, g);
    this.drawFlyer(brush, g);

    this.drawPuffs(ctx, to, scale);

    /* ── the print ────────────────────────────────────────────────────────── */
    const print = this.printOverlay();
    if (print) ctx.drawImage(print, 0, 0, w, h);
    if (this.redFlash > 0.001) {
      ctx.save();
      ctx.globalAlpha = this.redFlash * 0.1;
      ctx.fillStyle = FALL;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ── layers ───────────────────────────────────────────────────────────────── */

  /**
   * The lit ground the whole picture depends on: a warm scrim across the middle
   * of the hall, brightest at the height the act happens at and falling away
   * above the truss and below the net. Without it a black silhouette has nothing
   * to be black against, and the drawing disappears.
   */
  private drawBackdrop(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number
  ) {
    const top = to({ x: 0, y: -2.6 }).y;
    const bot = to({ x: 0, y: FLOOR_Y }).y;
    const band = ctx.createLinearGradient(0, top, 0, bot);
    band.addColorStop(0, `rgba(${LIT}, 0)`);
    band.addColorStop(0.28, `rgba(${LIT}, 0.055)`);
    band.addColorStop(0.62, `rgba(${LIT}, 0.075)`);
    band.addColorStop(0.9, `rgba(${LIT}, 0.02)`);
    band.addColorStop(1, `rgba(${LIT}, 0)`);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = band;
    ctx.fillRect(0, top, this.w, bot - top);
    ctx.restore();
    void scale;
  }

  /** The rig, mostly unlit: a top truss in black and towers as faint structure. */
  private drawStructure(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    g: Game
  ) {
    const left = this.camX - this.halfW;
    const right = this.camX + this.halfW;

    // Guy wires running back to the floor. Enough structure to place the rig in
    // a building; not enough to become detail. Towers were tried and removed —
    // at this scale they read as a floating ladder rather than as depth.
    ctx.strokeStyle = `rgba(${LIT}, 0.032)`;
    ctx.lineWidth = 1;
    const first = Math.floor(left / 12) * 12;
    ctx.beginPath();
    for (let x = first; x < right + 12; x += 12) {
      for (const k of [-1, 1]) {
        const a = to({ x: x + 4, y: -1.2 });
        const b = to({ x: x + 4 + k * 4.6, y: NET_Y + 0.5 });
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
    }
    ctx.stroke();

    // The truss the whole act hangs from, solid black.
    const t0 = to({ x: left, y: -1.62 });
    const t1 = to({ x: right, y: -1.16 });
    ctx.fillStyle = BLACK;
    ctx.fillRect(t0.x, t0.y, t1.x - t0.x, t1.y - t0.y);
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = Math.max(1, 0.05 * scale);
    ctx.beginPath();
    for (let x = Math.floor(left); x < right + 1; x += 0.62) {
      const a = to({ x, y: -1.16 });
      const b = to({ x: x + 0.31, y: -1.62 });
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    const b0 = to({ x: left, y: -1.16 });
    ctx.fillRect(b0.x, b0.y, t1.x - t0.x, Math.max(1.5, 0.055 * scale));

    // Hangers from the truss to each pivot.
    ctx.lineWidth = Math.max(1, 0.035 * scale);
    ctx.beginPath();
    for (const s of g.swings) {
      const a = to({ x: s.px, y: -1.16 });
      const b = to({ x: s.px, y: 0 });
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // The board the flyer leaves from, which only exists at the start.
    const start = g.swings.find((s) => s.id === 0);
    if (start && this.camX < 6) {
      const bx = -BAR_CABLE * Math.sin(START_AMP) - 0.55;
      const byTop = 3.9 * Math.cos(START_AMP) + 0.98;
      const p = to({ x: bx - 1.95, y: byTop });
      const q = to({ x: bx + 0.4, y: byTop + 0.15 });
      ctx.fillStyle = BLACK;
      ctx.fillRect(p.x, p.y, q.x - p.x, Math.max(2, q.y - p.y));
      ctx.lineWidth = Math.max(1, 0.07 * scale);
      ctx.beginPath();
      const l1 = to({ x: bx - 1.8, y: byTop });
      const l2 = to({ x: bx - 2.35, y: NET_Y + 0.5 });
      const l3 = to({ x: bx + 0.22, y: byTop });
      const l4 = to({ x: bx + 0.8, y: NET_Y + 0.5 });
      ctx.moveTo(l1.x, l1.y);
      ctx.lineTo(l2.x, l2.y);
      ctx.moveTo(l3.x, l3.y);
      ctx.lineTo(l4.x, l4.y);
      ctx.stroke();
    }
  }

  private drawBeam(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    src: P,
    aim: P
  ) {
    const dx = aim.x - src.x;
    const dy = aim.y - src.y;
    const len = Math.hypot(dx, dy) || 1;
    const ax = dx / len;
    const ay = dy / len;
    const far = (FLOOR_Y - src.y) / Math.max(0.2, ay);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const s = to(src);
    // Several thin wedges rather than three fat ones, so the edge of the beam
    // falls off instead of banding.
    const layers: [number, number][] = [
      [0.25, 0.016],
      [0.205, 0.017],
      [0.163, 0.019],
      [0.124, 0.022],
      [0.088, 0.026],
      [0.055, 0.03],
    ];
    for (const [half, alpha] of layers) {
      const spread = Math.tan(half) * far;
      const px = -ay;
      const py = ax;
      const e1 = to({ x: src.x + ax * far + px * spread, y: src.y + ay * far + py * spread });
      const e2 = to({ x: src.x + ax * far - px * spread, y: src.y + ay * far - py * spread });
      const grad = ctx.createLinearGradient(s.x, s.y, (e1.x + e2.x) / 2, (e1.y + e2.y) / 2);
      grad.addColorStop(0, `rgba(${LIT}, ${alpha * 1.7})`);
      grad.addColorStop(0.5, `rgba(${LIT}, ${alpha})`);
      grad.addColorStop(1, `rgba(${LIT}, ${alpha * 0.35})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e1.x, e1.y);
      ctx.lineTo(e2.x, e2.y);
      ctx.closePath();
      ctx.fill();
    }

    // The lamp itself, and a haze around the performer so a black silhouette
    // always has something to be black against.
    const hz = to(aim);
    const hr = 3.6 * scale;
    const halo = ctx.createRadialGradient(hz.x, hz.y, 0, hz.x, hz.y, hr);
    halo.addColorStop(0, `rgba(${LIT}, ${0.135 + this.flash * 0.11})`);
    halo.addColorStop(0.55, `rgba(${LIT}, 0.05)`);
    halo.addColorStop(1, `rgba(${LIT}, 0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * A second, much dimmer lamp on whatever is being aimed at. Reading the
   * catcher's phase is the game, so the catcher cannot be allowed to sit in the
   * dark just because the follow spot is on the flyer.
   */
  private drawSecondLamp(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    g: Game
  ) {
    const target = targetSwing(g);
    if (!target) return;
    const cp = catchPoint(target);
    const c = to({ x: cp.x, y: cp.y - 0.4 });
    const r = 3.3 * scale;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    grad.addColorStop(0, `rgba(${LIT}, 0.062)`);
    grad.addColorStop(0.6, `rgba(${LIT}, 0.022)`);
    grad.addColorStop(1, `rgba(${LIT}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMotes(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    src: P,
    aim: P
  ) {
    const dx = aim.x - src.x;
    const dy = aim.y - src.y;
    const len = Math.hypot(dx, dy) || 1;
    const ax = dx / len;
    const ay = dy / len;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of this.motes) {
      const rx = m.x - src.x;
      const ry = m.y - src.y;
      const along = rx * ax + ry * ay;
      if (along < 0.4) continue;
      const perp = Math.abs(rx * -ay + ry * ax);
      const radius = along * 0.238;
      const edge = 1 - perp / radius;
      if (edge <= 0) continue;
      const a = Math.min(1, edge * edge * 1.25) * 0.5 * (1 - along / 15);
      if (a <= 0.004) continue;
      const p = to(m);
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${LIT})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, m.r * scale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Where the axis of the spot meets the net. */
  private poolX(src: P, aim: P) {
    const dy = aim.y - src.y;
    return src.x + (aim.x - src.x) * ((NET_Y - src.y) / (dy || 1));
  }

  /** The pool of light on the net. Smooth, so it lives in the light buffer. */
  private drawNetPool(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    src: P,
    aim: P
  ) {
    const left = this.camX - this.halfW;
    const right = this.camX + this.halfW;
    const poolX = this.poolX(src, aim);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const c = to({ x: poolX, y: NET_Y + 0.1 });
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 6.2 * scale);
    grad.addColorStop(0, `rgba(${LIT}, 0.15)`);
    grad.addColorStop(0.4, `rgba(${LIT}, 0.055)`);
    grad.addColorStop(1, `rgba(${LIT}, 0)`);
    ctx.fillStyle = grad;
    ctx.save();
    ctx.beginPath();
    const nl = to({ x: left, y: NET_Y - 0.1 });
    const nr = to({ x: right, y: FLOOR_Y });
    ctx.rect(nl.x, nl.y, nr.x - nl.x, nr.y - nl.y);
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 6.2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /** The mesh and the lit edge, which need their lines crisp. */
  private drawNetMesh(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    src: P,
    aim: P
  ) {
    const left = this.camX - this.halfW;
    const right = this.camX + this.halfW;
    const poolX = this.poolX(src, aim);
    const sag = (x: number) => {
      const u = ((x - poolX) / 9) ** 2;
      return NET_Y + 0.22 * Math.max(0, 1 - u);
    };

    // The mesh, only visible where the light falls on it.
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      const dir = i ? 1 : -1;
      for (let x = Math.floor(left) - 2; x < right + 2; x += 0.46) {
        const a = to({ x, y: sag(x) });
        const b = to({ x: x + dir * 0.5, y: sag(x) + 0.52 });
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      const fade = ctx.createLinearGradient(
        to({ x: poolX - 8, y: 0 }).x,
        0,
        to({ x: poolX + 8, y: 0 }).x,
        0
      );
      fade.addColorStop(0, `rgba(${LIT}, 0)`);
      fade.addColorStop(0.5, `rgba(${LIT}, 0.115)`);
      fade.addColorStop(1, `rgba(${LIT}, 0)`);
      ctx.strokeStyle = fade;
      ctx.stroke();
    }

    // The taut edge of the net is the one line in the picture that is properly lit.
    ctx.beginPath();
    for (let x = Math.floor(left) - 2; x < right + 2; x += 0.4) {
      const p = to({ x, y: sag(x) });
      if (x === Math.floor(left) - 2) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    const edge = ctx.createLinearGradient(
      to({ x: poolX - 10, y: 0 }).x,
      0,
      to({ x: poolX + 10, y: 0 }).x,
      0
    );
    edge.addColorStop(0, `rgba(${LIT}, 0.04)`);
    edge.addColorStop(0.5, `rgba(${LIT}, 0.34)`);
    edge.addColorStop(1, `rgba(${LIT}, 0.04)`);
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(1.2, 0.028 * scale);
    ctx.stroke();
  }

  /** The arc the target's hands sweep. Reading it is the whole game. */
  private drawSweep(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    g: Game
  ) {
    const target = targetSwing(g);
    if (!target) return;
    const r = catchR(target);
    const o = to({ x: target.px, y: 0 });
    ctx.save();
    ctx.strokeStyle = `rgba(${LIT}, 0.11)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(o.x, o.y, r * scale, Math.PI / 2 - target.amp, Math.PI / 2 + target.amp);
    ctx.stroke();
    ctx.restore();
  }

  private drawTrail(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number
  ) {
    if (this.trail.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const alpha = Math.max(0, Math.min(a.a, 1)) * 0.2;
      if (alpha < 0.005) continue;
      ctx.strokeStyle = `rgba(${LIT}, ${alpha})`;
      ctx.lineWidth = Math.max(0.7, 0.035 * scale * Math.min(1, a.a));
      const p = to(a);
      const q = to(b);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * For the first two passes only, the parabola a release right now would give.
   * It teaches the one thing that has to be learned and then it leaves, because
   * a game that keeps showing you the answer has stopped asking a question.
   */
  private drawPrediction(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number,
    g: Game
  ) {
    if (!g.showArc || g.phase !== "hold") return;
    predictArc(g, this.arc, 1.35);
    if (this.arc.length < 2) return;
    ctx.save();
    ctx.setLineDash([0.1 * scale, 0.16 * scale]);
    ctx.strokeStyle = `rgba(${LIT}, 0.3)`;
    ctx.lineWidth = Math.max(1, 0.022 * scale);
    ctx.beginPath();
    const p0 = to(this.arc[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < this.arc.length; i++) {
      const p = to(this.arc[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Cables and the bar itself. */
  private drawApparatus(brush: Brush, s: Swing, g: Game) {
    const { ctx, scale, to } = brush;
    const cable = s.kind === "bar" ? BAR_CABLE : CATCH_CABLE;
    const r = cable + stretchOf(s);
    const mid = { x: s.px + r * Math.sin(s.theta), y: r * Math.cos(s.theta) };
    const perp = { x: Math.cos(s.theta), y: -Math.sin(s.theta) };
    const halfBar = 0.34;
    const ends = [-1, 1].map((k) => ({
      x: mid.x + perp.x * halfBar * k,
      y: mid.y + perp.y * halfBar * k,
    }));

    ctx.strokeStyle = BLACK;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1, 0.032 * scale);
    ctx.beginPath();
    for (const e of ends) {
      const a = to({ x: s.px, y: 0 });
      const b = to(e);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    ctx.lineWidth = Math.max(2, 0.085 * scale);
    const e0 = to(ends[0]);
    const e1 = to(ends[1]);
    ctx.beginPath();
    ctx.moveTo(e0.x, e0.y);
    ctx.lineTo(e1.x, e1.y);
    ctx.stroke();

    // The pivot fitting.
    const o = to({ x: s.px, y: 0 });
    ctx.beginPath();
    ctx.arc(o.x, o.y, Math.max(2, 0.085 * scale), 0, Math.PI * 2);
    ctx.fill();

    // The bar to be caught has to be tellable from a spent one, but a ring
    // around it reads as a reticle from a different game. Instead the light
    // catches its steel: a glint and a soft halo, which is what would actually
    // happen and needs no explaining.
    if (s.id === g.targetId && s.kind === "bar") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const m = to(mid);
      const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 0.62 * scale);
      halo.addColorStop(0, `rgba(${LIT}, 0.13)`);
      halo.addColorStop(1, `rgba(${LIT}, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 0.62 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${LIT}, 0.42)`;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.2, 0.03 * scale);
      ctx.beginPath();
      ctx.moveTo(e0.x + (e1.x - e0.x) * 0.18, e0.y + (e1.y - e0.y) * 0.18);
      ctx.lineTo(e0.x + (e1.x - e0.x) * 0.82, e0.y + (e1.y - e0.y) * 0.82);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawCatcher(brush: Brush, s: Swing, g: Game) {
    const { ctx } = brush;
    const r = CATCH_CABLE + stretchOf(s);
    const bar = { x: s.px + r * Math.sin(s.theta), y: r * Math.cos(s.theta) };
    const outward = { x: Math.sin(s.theta), y: Math.cos(s.theta) };
    const handR = CATCHER_HAND_R + stretchOf(s);
    const handTarget = {
      x: s.px + handR * Math.sin(s.theta),
      y: handR * Math.cos(s.theta),
    };
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    const sk = catcherSkeleton(bar, handTarget, outward, s.theta);
    drawSkeleton(brush, sk, 1.06);

    // If he has the flyer, his arms are loaded and the wrists lock.
    if (s.carrying && s.id === g.holdId) {
      const h = brush.to(handTarget);
      ctx.beginPath();
      ctx.arc(h.x, h.y, Math.max(2, 0.1 * brush.scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFlyer(brush: Brush, g: Game) {
    const { ctx } = brush;
    const f = g.flyer;
    const hold = holdSwing(g);
    const target = targetSwing(g);

    let angle = 0;
    let pose: Pose = POSES.hang;
    let reach: P | null = null;

    // The body hangs along its cable, so its "up" points back at the pivot:
    // that is -theta, not theta.
    if (g.phase === "board" && hold) {
      angle = START_AMP;
      // On the board the torso already leans out along the bar while the legs
      // stay vertical under the feet, which is the real ready position.
      pose = { ...POSES.board, hip: -START_AMP };
      const r = BAR_CABLE + stretchOf(hold);
      reach = { x: hold.px + r * Math.sin(hold.theta), y: r * Math.cos(hold.theta) };
    } else if (g.phase === "hold" && hold) {
      angle = -hold.theta;
      const r =
        (hold.kind === "bar" ? BAR_CABLE : CATCHER_HAND_R) + stretchOf(hold);
      reach = { x: hold.px + r * Math.sin(hold.theta), y: r * Math.cos(hold.theta) };
      if (hold.kind === "bar") {
        // The beat: legs sweep forward on the way up, arch on the way back.
        const k = clamp(hold.theta / Math.max(0.2, hold.amp), -1, 1);
        pose =
          k > 0
            ? mixPose(POSES.hang, POSES.beatFwd, k)
            : mixPose(POSES.hang, POSES.beatBack, -k);
      } else {
        pose = POSES.caught;
      }
      if (g.hitstop > 0) pose = mixPose(pose, POSES.caught, 0.6);
    } else if (g.phase === "flight") {
      const settle = clamp(f.air / 0.3, 0, 1);
      angle = f.relAngle * (1 - settle) + f.body;
      pose = f.tucked ? POSES.tuck : POSES.fly;
      if (target) {
        const cp = catchPoint(target);
        const d = Math.hypot(cp.x - f.pos.x, cp.y - f.pos.y);
        if (!f.tucked && d < 3.4) reach = cp;
      }
    } else {
      angle = f.body;
      pose = g.phase === "over" ? POSES.netted : POSES.loose;
    }

    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    const sk = skeleton(f.pos, angle, pose, reach);
    drawSkeleton(brush, sk, 1);
    void hands;
  }

  /** Where the hands are right now, so chalk comes off the right place. */
  handPoint(g: Game): P {
    const hold = holdSwing(g);
    if (hold && (g.phase === "hold" || g.phase === "board")) {
      const r = (hold.kind === "bar" ? BAR_CABLE : CATCHER_HAND_R) + stretchOf(hold);
      return { x: hold.px + r * Math.sin(hold.theta), y: r * Math.cos(hold.theta) };
    }
    return g.flyer.pos;
  }

  private drawPuffs(
    ctx: CanvasRenderingContext2D,
    to: (p: P) => P,
    scale: number
  ) {
    if (!this.puffs.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.puffs) {
      const k = p.life / p.max;
      const a = k * k * 0.3;
      if (a < 0.004) continue;
      const s = to(p);
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${LIT})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.6, p.r * scale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

}

export { NET_Y, FLOOR_Y, hangPos };
