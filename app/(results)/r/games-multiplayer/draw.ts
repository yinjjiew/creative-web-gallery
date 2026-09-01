/**
 * Night club slalom, seen from just behind the skier, looking down the fall
 * line. The piste is a floodlit ribbon; pines hold the dark; gates recede.
 * Nothing here is in the encoded run — tracks are regenerated from the same
 * stepper the ghost already trusts.
 */

import {
  FINISH_Y,
  GATES,
  PISTE_HALF,
  TREES,
  type Gate,
  type Run,
  type Skier,
} from "./sim";

const NIGHT = "#101412";
const RIDGE = "#161c1a";
const SNOW_FAR = "#6e6a62";
const SNOW_NEAR = "#d4ccbe";
const SNOW_BANK = "#9a9488";
const PINE = "#0b0f0d";
const PINE_LIT = "#1a221c";
const RED = "#c4452c";
const BLUE = "#3d5870";
const INK = "#141210";
const PAPER = "#e4dbc8";
const GHOST = "#9a4a32";
const AMBER = "rgba(212, 176, 104, 0.11)";

const LOOK = 82;

export interface Pose {
  x: number;
  y: number;
  heading: number;
  lean: number;
  speed: number;
}

interface Spray {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

interface Flake {
  x: number;
  y: number;
  z: number;
  v: number;
}

interface TrackPt {
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class Stage {
  w = 1;
  h = 1;
  dpr = 1;
  camY = -10;
  camX = 0;
  reduced = false;
  time = 0;
  wand = 1;
  private spray: Spray[] = [];
  private flakes: Flake[] = [];
  playerTrack: TrackPt[] = [];
  ghostTrack: TrackPt[] = [];
  private grain: HTMLCanvasElement | null = null;

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.grain = null;
  }

  resetFx() {
    this.spray.length = 0;
    this.playerTrack.length = 0;
    this.ghostTrack.length = 0;
    this.wand = 1;
    this.camY = -10;
    this.camX = 0;
  }

  private ensureGrain() {
    if (this.grain) return this.grain;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    if (!g) return null;
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 118 + ((Math.random() * 40) | 0);
      img.data[i] = n;
      img.data[i + 1] = n - 4;
      img.data[i + 2] = n - 10;
      img.data[i + 3] = 22;
    }
    g.putImageData(img, 0, 0);
    this.grain = c;
    return c;
  }

  project(wx: number, wy: number) {
    const t = (wy - this.camY) / LOOK;
    // Near the camera sits at the bottom of the frame; the fall line climbs
    // toward a low horizon, the way a downhill is actually seen.
    const sy = this.h * (0.93 - clamp(t, -0.12, 1.18) * 0.78);
    const sc = lerp(44, 7.4, clamp(t, 0, 1));
    const sx = this.w / 2 + (wx - this.camX * 0.22) * sc;
    return { sx, sy, sc, t };
  }

  puff(pose: Pose) {
    if (this.reduced) return;
    const skid = Math.abs(pose.lean) * pose.speed;
    if (skid < 3.2) return;
    const n = 1 + ((skid / 8) | 0);
    for (let i = 0; i < n && this.spray.length < 80; i++) {
      const side = -Math.sign(pose.lean || 1);
      this.spray.push({
        x: pose.x + side * 0.25 + (Math.random() - 0.5) * 0.2,
        y: pose.y - 0.4,
        vx: side * (0.6 + Math.random()) + Math.sin(pose.heading) * -0.4,
        vy: -0.8 - Math.random() * 0.8,
        life: 0,
        max: 0.28 + Math.random() * 0.22,
      });
    }
  }

  noteTrack(list: TrackPt[], pose: Pose, racing: boolean) {
    if (!racing) return;
    const last = list[list.length - 1];
    if (!last || Math.hypot(pose.x - last.x, pose.y - last.y) > 0.55) {
      list.push({ x: pose.x, y: pose.y });
      if (list.length > 220) list.shift();
    }
  }

  update(dt: number, player: Pose, ghost: Pose | null, racing: boolean) {
    this.time += dt;
    const aimY = player.y - 9.4;
    const aimX = player.x;
    const follow = this.reduced ? 0.35 : 0.085;
    this.camY += (aimY - this.camY) * follow;
    this.camX += (aimX - this.camX) * follow * 0.7;
    this.wand += ((racing ? 0 : 1) - this.wand) * 0.18;

    this.puff(player);
    this.noteTrack(this.playerTrack, player, racing);
    if (ghost) this.noteTrack(this.ghostTrack, ghost, racing);

    for (let i = this.spray.length - 1; i >= 0; i--) {
      const p = this.spray[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 3.2 * dt;
      if (p.life > p.max) this.spray.splice(i, 1);
    }

    if (!this.reduced) {
      if (this.flakes.length < 36) {
        this.flakes.push({
          x: (Math.random() - 0.5) * 28,
          y: this.camY + Math.random() * LOOK,
          z: 0.3 + Math.random(),
          v: 1.2 + Math.random() * 2.2,
        });
      }
      for (const f of this.flakes) {
        f.y += f.v * dt;
        f.x += Math.sin(this.time * 0.4 + f.z * 8) * 0.15 * dt;
        if (f.y > this.camY + LOOK + 4) {
          f.y = this.camY - 6;
          f.x = (Math.random() - 0.5) * 28;
        }
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    player: Pose,
    ghost: Pose | null,
    playerRun: Run,
    ghostRun: Run | null,
    racing: boolean,
    idleLean: number
  ) {
    const { w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    sky.addColorStop(0, "#0c1012");
    sky.addColorStop(1, "#18201c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.42);

    this.ridges(ctx);
    this.piste(ctx);
    this.tracks(ctx, this.ghostTrack, GHOST, 0.35);
    this.tracks(ctx, this.playerTrack, INK, 0.42);
    this.finish(ctx);
    this.gates(ctx, playerRun, ghostRun);
    this.trees(ctx, true);
    if (ghost) this.skier(ctx, ghost, true, 0);
    const lean = racing ? player.lean : player.lean + idleLean;
    this.skier(ctx, { ...player, lean }, false, idleLean);
    this.wandGate(ctx);
    this.trees(ctx, false);
    this.drawSpray(ctx);
    this.drawFlakes(ctx);
    this.vignette(ctx);
  }

  private ridges(ctx: CanvasRenderingContext2D) {
    const { w, h } = this;
    ctx.fillStyle = RIDGE;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.28);
    ctx.lineTo(w * 0.12, h * 0.2);
    ctx.lineTo(w * 0.22, h * 0.26);
    ctx.lineTo(w * 0.38, h * 0.16);
    ctx.lineTo(w * 0.52, h * 0.24);
    ctx.lineTo(w * 0.7, h * 0.14);
    ctx.lineTo(w * 0.86, h * 0.22);
    ctx.lineTo(w, h * 0.17);
    ctx.lineTo(w, h * 0.42);
    ctx.lineTo(0, h * 0.42);
    ctx.fill();
    ctx.fillStyle = "#121816";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.32);
    ctx.lineTo(w * 0.18, h * 0.26);
    ctx.lineTo(w * 0.34, h * 0.3);
    ctx.lineTo(w * 0.58, h * 0.22);
    ctx.lineTo(w * 0.8, h * 0.28);
    ctx.lineTo(w, h * 0.24);
    ctx.lineTo(w, h * 0.42);
    ctx.lineTo(0, h * 0.42);
    ctx.fill();
  }

  private piste(ctx: CanvasRenderingContext2D) {
    const { w } = this;
    const near = this.camY - 4;
    const far = this.camY + LOOK + 8;
    const left: { sx: number; sy: number }[] = [];
    const right: { sx: number; sy: number }[] = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const y = lerp(far, near, i / steps);
      left.push(this.project(-PISTE_HALF - 0.7, y));
      right.push(this.project(PISTE_HALF + 0.7, y));
    }
    const top = this.project(0, far);
    const bot = this.project(0, near);
    const snow = ctx.createLinearGradient(0, top.sy, 0, bot.sy);
    snow.addColorStop(0, SNOW_FAR);
    snow.addColorStop(1, SNOW_NEAR);
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(left[0].sx, left[0].sy);
    for (const p of left) ctx.lineTo(p.sx, p.sy);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].sx, right[i].sy);
    ctx.closePath();
    ctx.fill();

    // Banks
    for (const side of [-1, 1] as const) {
      const y0 = far;
      const y1 = near;
      const inner = this.project(side * (PISTE_HALF - 0.15), y0);
      const outer = this.project(side * (PISTE_HALF + 1.8), y0);
      const inner2 = this.project(side * (PISTE_HALF - 0.15), y1);
      const outer2 = this.project(side * (PISTE_HALF + 1.8), y1);
      ctx.fillStyle = SNOW_BANK;
      ctx.beginPath();
      ctx.moveTo(inner.sx, inner.sy);
      ctx.lineTo(outer.sx, outer.sy);
      ctx.lineTo(outer2.sx, outer2.sy);
      ctx.lineTo(inner2.sx, inner2.sy);
      ctx.closePath();
      ctx.fill();
    }

    const flood = ctx.createLinearGradient(w * 0.7, 0, w * 0.2, this.h);
    flood.addColorStop(0, AMBER);
    flood.addColorStop(1, "rgba(212, 176, 104, 0)");
    ctx.fillStyle = flood;
    const fa = this.project(-PISTE_HALF, near);
    const fb = this.project(PISTE_HALF, near);
    const fc = this.project(PISTE_HALF, far);
    const fd = this.project(-PISTE_HALF, far);
    ctx.beginPath();
    ctx.moveTo(fa.sx, fa.sy);
    ctx.lineTo(fb.sx, fb.sy);
    ctx.lineTo(fc.sx, fc.sy);
    ctx.lineTo(fd.sx, fd.sy);
    ctx.closePath();
    ctx.fill();

    const grain = this.ensureGrain();
    if (grain) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = ctx.createPattern(grain, "repeat") ?? SNOW_NEAR;
      const ga = this.project(-PISTE_HALF - 0.7, near);
      const gb = this.project(PISTE_HALF + 0.7, near);
      const gc = this.project(PISTE_HALF + 0.7, far);
      const gd = this.project(-PISTE_HALF - 0.7, far);
      ctx.beginPath();
      ctx.moveTo(ga.sx, ga.sy);
      ctx.lineTo(gb.sx, gb.sy);
      ctx.lineTo(gc.sx, gc.sy);
      ctx.lineTo(gd.sx, gd.sy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private tracks(ctx: CanvasRenderingContext2D, pts: TrackPt[], color: string, alpha: number) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    for (const p of pts) {
      const q = this.project(p.x, p.y);
      if (q.t < -0.05 || q.t > 1.05) continue;
      ctx.lineWidth = Math.max(1, q.sc * 0.08);
      if (!started) {
        ctx.moveTo(q.sx, q.sy);
        started = true;
      } else ctx.lineTo(q.sx, q.sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  private gates(ctx: CanvasRenderingContext2D, player: Run, ghost: Run | null) {
    for (let i = GATES.length - 1; i >= 0; i--) {
      const g = GATES[i];
      if (g.y < this.camY - 4 || g.y > this.camY + LOOK + 6) continue;
      const taken = player.nextGate > i;
      const ghostTaken = ghost ? ghost.nextGate > i : false;
      this.pole(ctx, g, taken, ghostTaken);
    }
  }

  private pole(ctx: CanvasRenderingContext2D, g: Gate, taken: boolean, ghostTaken: boolean) {
    const foot = this.project(g.poleX, g.y);
    if (foot.t < -0.04 || foot.t > 1.08) return;
    const h = foot.sc * 1.85;
    const color = g.hue === "red" ? RED : BLUE;
    ctx.save();
    ctx.globalAlpha = taken ? 0.28 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.4, foot.sc * 0.07);
    ctx.beginPath();
    ctx.moveTo(foot.sx, foot.sy);
    ctx.lineTo(foot.sx, foot.sy - h);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(foot.sx, foot.sy - h);
    ctx.lineTo(foot.sx + (g.pass > 0 ? 1 : -1) * foot.sc * 0.42, foot.sy - h * 0.72);
    ctx.lineTo(foot.sx, foot.sy - h * 0.58);
    ctx.closePath();
    ctx.fill();
    if (ghostTaken && !taken) {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = GHOST;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(foot.sx, foot.sy);
      ctx.lineTo(foot.sx, foot.sy - h);
      ctx.stroke();
    }
    ctx.restore();
  }

  private finish(ctx: CanvasRenderingContext2D) {
    if (FINISH_Y < this.camY - 2 || FINISH_Y > this.camY + LOOK + 4) return;
    const l = this.project(-PISTE_HALF + 0.2, FINISH_Y);
    const r = this.project(PISTE_HALF - 0.2, FINISH_Y);
    ctx.save();
    ctx.strokeStyle = PAPER;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = Math.max(2, l.sc * 0.08);
    ctx.beginPath();
    ctx.moveTo(l.sx, l.sy - l.sc * 2.1);
    ctx.lineTo(r.sx, r.sy - r.sc * 2.1);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.9;
    const mid = this.project(0, FINISH_Y);
    ctx.font = `600 ${Math.max(9, mid.sc * 0.38)}px ui-sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = PAPER;
    ctx.fillText("FINISH", mid.sx, mid.sy - mid.sc * 2.35);
    ctx.restore();
  }

  private wandGate(ctx: CanvasRenderingContext2D) {
    const y = 3.2;
    if (y < this.camY - 2 || y > this.camY + LOOK) return;
    const l = this.project(-1.4, y);
    const r = this.project(1.4, y);
    ctx.save();
    ctx.strokeStyle = PAPER;
    ctx.globalAlpha = 0.55 + 0.35 * this.wand;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(l.sx, l.sy - l.sc * 1.6);
    ctx.lineTo(r.sx, r.sy - r.sc * 1.6 * (1 - (1 - this.wand) * 0.85));
    ctx.stroke();
    ctx.restore();
  }

  private trees(ctx: CanvasRenderingContext2D, far: boolean) {
    for (const t of TREES) {
      const q = this.project(t.x, t.y);
      if (q.t < -0.06 || q.t > 1.1) continue;
      const nearish = q.t < 0.55;
      if (far && nearish) continue;
      if (!far && !nearish) continue;
      const hh = q.sc * t.h * 0.55;
      const ww = hh * 0.38;
      ctx.fillStyle = nearish ? PINE : PINE_LIT;
      ctx.beginPath();
      ctx.moveTo(q.sx, q.sy - hh);
      ctx.lineTo(q.sx + ww, q.sy + hh * 0.08);
      ctx.lineTo(q.sx - ww, q.sy + hh * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0a0c0b";
      ctx.fillRect(q.sx - ww * 0.08, q.sy, ww * 0.16, hh * 0.12);
    }
  }

  private skier(ctx: CanvasRenderingContext2D, pose: Pose, ghost: boolean, idle: number) {
    const q = this.project(pose.x, pose.y);
    if (q.t < -0.08 || q.t > 1.05) return;
    const s = q.sc * 0.118;
    ctx.save();
    ctx.translate(q.sx, q.sy);
    ctx.scale(s, s);
    ctx.transform(1, 0, pose.lean * 0.28, 1, 0, 0);
    ctx.rotate(pose.heading * 0.5);
    ctx.globalAlpha = ghost ? 0.5 : 1;

    const ski = ghost ? GHOST : INK;
    const suit = ghost ? GHOST : "#1c1814";
    const light = ghost ? "rgba(232, 223, 208, 0.35)" : PAPER;

    ctx.strokeStyle = ski;
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2.6, 7.4);
    ctx.quadraticCurveTo(-3.2, 0, -2.4, -8.4);
    ctx.moveTo(2.6, 7.4);
    ctx.quadraticCurveTo(3.2, 0, 2.4, -8.4);
    ctx.stroke();

    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.moveTo(-1.1, 5.2);
    ctx.lineTo(1.1, 5.2);
    ctx.lineTo(2.4, 1.2);
    ctx.lineTo(1.6, -3.8);
    ctx.lineTo(-1.6, -3.8);
    ctx.lineTo(-2.4, 1.2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(0.15, -5.2, 1.25, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ghost ? GHOST : "#2a241c";
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(-5.2, -1.6 + idle * 1.4);
    ctx.lineTo(-1.2, 3.6);
    ctx.moveTo(5.2, -1.6 - idle * 1.4);
    ctx.lineTo(1.2, 3.6);
    ctx.stroke();

    ctx.restore();
  }

  private drawSpray(ctx: CanvasRenderingContext2D) {
    if (this.reduced) return;
    ctx.save();
    ctx.fillStyle = PAPER;
    for (const p of this.spray) {
      const q = this.project(p.x, p.y);
      if (q.t < 0 || q.t > 1) continue;
      ctx.globalAlpha = 0.45 * (1 - p.life / p.max);
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, Math.max(0.8, q.sc * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawFlakes(ctx: CanvasRenderingContext2D) {
    if (this.reduced) return;
    ctx.save();
    ctx.fillStyle = PAPER;
    for (const f of this.flakes) {
      const q = this.project(f.x, f.y);
      if (q.t < 0 || q.t > 1) continue;
      ctx.globalAlpha = 0.22 * f.z;
      ctx.fillRect(q.sx, q.sy, 1.2, 1.2);
    }
    ctx.restore();
  }

  private vignette(ctx: CanvasRenderingContext2D) {
    const { w, h } = this;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.55, h * 0.2, w * 0.5, h * 0.5, h * 0.78);
    g.addColorStop(0, "rgba(16, 20, 18, 0)");
    g.addColorStop(1, "rgba(8, 10, 9, 0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}
