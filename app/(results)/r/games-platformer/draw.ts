/**
 * Last light on a granite spine. The picture is ink and wash, not a tileset:
 * pewter sky, a thin gold at the horizon, wet rock, lichen, heather. Distant
 * ridges parallax a little. Stones keep the seed they were born with so a cairn
 * looks stacked, not stamped.
 */
import {
  PH,
  PW,
  ROCK,
  SCREE,
  SUMMIT,
  WORLD_H,
  WORLD_W,
  type Game,
  type Stone,
} from "./sim";

const SKY_TOP = "#4e5256";
const SKY_GOLD = "#c9a57a";
const SKY_BAND = "#b7a48a";
const FAR = "#6a6660";
const MID = "#4c4843";
const NEAR = "#2e2b27";
const ROCK_FACE = "#3c3833";
const ROCK_WET = "#8a8070";
const LICHEN = "#6e6438";
const HEATHER = "#4a3a40";
const BONE = "#e6d8c2";
const WALKER = "#161411";

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export class Stage {
  w = 800;
  h = 600;
  dpr = 1;
  camX = 80;
  camY = 320;
  viewW = 430;
  viewH = 280;
  reduced = false;
  dust: { x: number; y: number; vx: number; vy: number; t: number; life: number }[] =
    [];
  mist = 0;
  flash = 0;

  constructor(reduced: boolean) {
    this.reduced = reduced;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.w = cssW;
    this.h = cssH;
    this.dpr = dpr;
    if (cssW < 16 || cssH < 16) return;
    const aspect = cssW / cssH;
    if (aspect < 0.72) {
      this.viewW = 280;
      this.viewH = this.viewW / aspect;
    } else if (aspect > 1.85) {
      this.viewW = 520;
      this.viewH = this.viewW / aspect;
    } else {
      this.viewW = 400;
      this.viewH = this.viewW / aspect;
    }
  }

  follow(g: Game, dt: number) {
    const look = g.facing * (36 + Math.abs(g.vx) * 0.14);
    const aimX = g.x + PW / 2 + look;
    /* Sit the walker in the lower third so the next jump is the picture. */
    const aimY = g.y - this.viewH * 0.18;
    const k = this.reduced ? 1 : 1 - Math.pow(0.0018, dt);
    this.camX += (aimX - this.camX) * k;
    this.camY += (aimY - this.camY) * k;
    const halfW = this.viewW / 2;
    const halfH = this.viewH / 2;
    this.camX = Math.max(halfW, Math.min(WORLD_W - halfW, this.camX));
    this.camY = Math.max(halfH - 40, Math.min(WORLD_H - halfH - 20, this.camY));
  }

  puff(x: number, y: number, n: number, hard: number) {
    if (this.reduced) return;
    for (let i = 0; i < n; i++) {
      this.dust.push({
        x: x + (hash(i + y) - 0.5) * 8,
        y,
        vx: (hash(i * 3 + x) - 0.5) * 40 * (0.4 + hard),
        vy: -12 - hash(i * 7) * 28 * hard,
        t: 0,
        life: 0.28 + hash(i + 9) * 0.3,
      });
    }
  }

  update(g: Game, dt: number) {
    this.follow(g, dt);
    this.mist += dt;
    this.flash = Math.max(0, this.flash - dt * 3.2);
    if (this.reduced) {
      this.dust.length = 0;
      return;
    }
    for (let i = this.dust.length - 1; i >= 0; i--) {
      const p = this.dust[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      if (p.t > p.life) this.dust.splice(i, 1);
    }
  }

  private toScreen(x: number, y: number) {
    const sx = ((x - this.camX) / this.viewW) * this.w + this.w / 2;
    const sy = ((y - this.camY) / this.viewH) * this.h + this.h / 2;
    return { sx, sy };
  }

  private scale() {
    return this.w / this.viewW;
  }

  draw(ctx: CanvasRenderingContext2D, g: Game) {
    const { w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = SKY_TOP;
    ctx.fillRect(0, 0, w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, SKY_TOP);
    sky.addColorStop(0.46, "#6d6a66");
    sky.addColorStop(0.62, SKY_GOLD);
    sky.addColorStop(0.7, SKY_BAND);
    sky.addColorStop(1, "#7a7064");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.drawSun(ctx);
    this.drawRidges(ctx, g);
    this.drawMist(ctx, 0.08, 0.55);
    this.drawRock(ctx);
    this.drawScree(ctx);
    this.drawSummit(ctx);
    this.drawStones(ctx, g.stones);
    this.drawHeather(ctx);
    this.drawWalker(ctx, g);
    this.drawDust(ctx);
    this.drawNearMist(ctx);
    this.drawGlen(ctx);

    if (g.shake > 0 && !this.reduced) {
      /* shake is applied as a world offset in follow via g.shake — here a veil */
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(230, 216, 194, ${0.18 * this.flash})`;
      ctx.fillRect(0, 0, w, h);
    }

    const vig = ctx.createRadialGradient(
      w * 0.5,
      h * 0.46,
      h * 0.2,
      w * 0.5,
      h * 0.5,
      h * 0.78,
    );
    vig.addColorStop(0, "rgba(20, 18, 16, 0)");
    vig.addColorStop(1, "rgba(20, 18, 16, 0.38)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  private drawSun(ctx: CanvasRenderingContext2D) {
    const x = this.w * 0.72;
    const y = this.h * 0.52;
    const glow = ctx.createRadialGradient(x, y, 4, x, y, this.h * 0.28);
    glow.addColorStop(0, "rgba(232, 196, 140, 0.55)");
    glow.addColorStop(0.35, "rgba(201, 165, 122, 0.18)");
    glow.addColorStop(1, "rgba(201, 165, 122, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = "#e8c48a";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(5, this.h * 0.012), 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRidges(ctx: CanvasRenderingContext2D, g: Game) {
    const t = this.reduced ? 0 : this.mist;
    const layers = [
      { color: FAR, par: 0.12, y: 0.48, amp: 36, seed: 2 },
      { color: MID, par: 0.28, y: 0.56, amp: 42, seed: 5 },
      { color: NEAR, par: 0.48, y: 0.64, amp: 26, seed: 9 },
    ];
    for (const L of layers) {
      const shift = (this.camX * L.par + t * 4) % 400;
      ctx.fillStyle = L.color;
      ctx.beginPath();
      ctx.moveTo(-20, this.h + 20);
      const base = this.h * L.y;
      for (let i = 0; i <= 20; i++) {
        const x = (i / 20) * (this.w + 40) - 20;
        const n = hash(L.seed * 17 + i * 3 + Math.floor(shift / 80));
        const y = base - L.amp * (0.35 + n) - Math.sin((i + shift / 40) * 0.7) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.w + 20, this.h + 20);
      ctx.fill();
    }
    void g;
  }

  private drawMist(ctx: CanvasRenderingContext2D, a: number, yNorm: number) {
    const y = this.h * yNorm;
    const g = ctx.createLinearGradient(0, y - 40, 0, y + 50);
    g.addColorStop(0, `rgba(198, 188, 172, 0)`);
    g.addColorStop(0.5, `rgba(198, 188, 172, ${a})`);
    g.addColorStop(1, `rgba(198, 188, 172, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 40, this.w, 90);
  }

  private drawNearMist(ctx: CanvasRenderingContext2D) {
    this.drawMist(ctx, 0.05, 0.88);
  }

  private drawGlen(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, this.h * 0.7, 0, this.h);
    g.addColorStop(0, "rgba(22, 20, 18, 0)");
    g.addColorStop(1, "rgba(22, 20, 18, 0.62)");
    ctx.fillStyle = g;
    ctx.fillRect(0, this.h * 0.7, this.w, this.h * 0.3);
  }

  private boxPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const s = this.scale();
    const p = this.toScreen(x, y);
    ctx.fillRect(p.sx, p.sy, w * s, h * s);
  }

  private drawRock(ctx: CanvasRenderingContext2D) {
    const s = this.scale();
    for (let i = 0; i < ROCK.length; i++) {
      const r = ROCK[i];
      if (r.y <= 4 && r.h > 400) {
        const p = this.toScreen(r.x, r.y);
        ctx.fillStyle = "#1f1c19";
        ctx.fillRect(p.sx, p.sy, r.w * s, Math.min(r.h, 80) * s);
        continue;
      }
      const p = this.toScreen(r.x, r.y);
      const rw = r.w * s;
      /* A slab, not a building. Collision can run to the void; the picture stops. */
      const face = Math.min(r.h, r.h > 90 ? 52 : r.h);
      const rh = face * s;
      ctx.fillStyle = ROCK_FACE;
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy + 3);
      const steps = Math.max(3, Math.floor(r.w / 28));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const jag = (hash(i * 31 + k * 7) - 0.5) * 4;
        ctx.lineTo(p.sx + t * rw, p.sy + jag);
      }
      ctx.lineTo(p.sx + rw, p.sy + rh);
      ctx.lineTo(p.sx, p.sy + rh);
      ctx.closePath();
      ctx.fill();

      if (r.h > face + 8) {
        ctx.fillStyle = "rgba(28, 26, 23, 0.35)";
        ctx.fillRect(p.sx, p.sy + rh - 1, rw, 22 * s);
      }

      ctx.fillStyle = ROCK_WET;
      ctx.globalAlpha = 0.62;
      ctx.fillRect(p.sx, p.sy - 1, rw, Math.max(2, 2.4 * s));
      ctx.globalAlpha = 1;

      for (let k = 0; k < 3; k++) {
        const hx = hash(i * 13 + k * 19);
        if (hx < 0.4) continue;
        ctx.fillStyle = LICHEN;
        ctx.globalAlpha = 0.35 + hx * 0.2;
        const lx = p.sx + rw * hash(i + k * 3);
        const ly = p.sy + 5 + 10 * hash(k + 4);
        ctx.beginPath();
        ctx.ellipse(lx, ly, 4 + hx * 6, 2 + hx * 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawScree(ctx: CanvasRenderingContext2D) {
    const s = this.scale();
    ctx.fillStyle = "#5a4034";
    for (const hz of SCREE) {
      const p = this.toScreen(hz.x, hz.y);
      const n = Math.max(4, Math.floor(hz.w / 6));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = p.sx + t * hz.w * s + hash(i + hz.x) * 3;
        const h = (5 + hash(i * 4) * 6) * s;
        ctx.beginPath();
        ctx.moveTo(x, p.sy + hz.h * s);
        ctx.lineTo(x + 2.4 * s, p.sy + hz.h * s - h);
        ctx.lineTo(x + 4.6 * s, p.sy + hz.h * s);
        ctx.fill();
      }
    }
  }

  private drawSummit(ctx: CanvasRenderingContext2D) {
    const s = this.scale();
    const base = this.toScreen(SUMMIT.x + 8, 248);
    ctx.fillStyle = "#4a453c";
    const rocks = [
      [0, 0, 14, 9],
      [11, -1, 12, 8],
      [5, -8, 11, 8],
      [8, -15, 8, 8],
      [10, -21, 6, 7],
    ];
    for (const [dx, dy, w, h] of rocks) {
      ctx.fillRect(base.sx + dx * s, base.sy + dy * s, w * s, h * s);
    }
    ctx.fillStyle = BONE;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(base.sx + 11 * s, base.sy - 26 * s, 1.4 * s, 28 * s);
    ctx.globalAlpha = 1;
  }

  private drawStones(ctx: CanvasRenderingContext2D, stones: Stone[]) {
    const s = this.scale();
    for (const st of stones) {
      if (!Number.isFinite(st.x) || !Number.isFinite(st.y)) continue;
      const p = this.toScreen(st.x, st.y);
      const w = st.w * s;
      const h = st.h * s;
      ctx.fillStyle = (st.seed & 1) === 0 ? "#4a453c" : "#3a3630";
      ctx.fillRect(p.sx, p.sy, w, h);
      ctx.fillStyle = ROCK_WET;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(p.sx, p.sy, w, Math.max(1.2, 1.5 * s));
      ctx.globalAlpha = 1;
    }
  }

  private drawHeather(ctx: CanvasRenderingContext2D) {
    if (this.viewW > 500) return;
    const s = this.scale();
    const t = this.reduced ? 0 : Math.sin(this.mist * 1.4);
    ctx.strokeStyle = HEATHER;
    ctx.lineWidth = Math.max(1, 0.8 * s);
    ctx.beginPath();
    for (const r of ROCK) {
      if (r.w < 40 || r.y < 80) continue;
      const start = this.toScreen(r.x, r.y);
      const blades = Math.min(28, Math.floor(r.w / 14));
      for (let i = 0; i < blades; i++) {
        const hx = hash(r.x + i * 11);
        if (hx < 0.35) continue;
        const x = start.sx + (i / blades) * r.w * s;
        const lean = t * 1.6 * s;
        ctx.moveTo(x, start.sy);
        ctx.lineTo(x + lean, start.sy - (4 + hx * 6) * s);
      }
    }
    ctx.stroke();
  }

  private drawWalker(ctx: CanvasRenderingContext2D, g: Game) {
    const s = this.scale();
    const p = this.toScreen(g.x + PW / 2, g.y + PH);
    const shakeX =
      g.shake > 0 && !this.reduced ? Math.sin(g.time * 90) * 2.2 * g.shake : 0;
    ctx.save();
    ctx.translate(p.sx + shakeX, p.sy);
    ctx.scale(g.facing * 1.15, 1.15);

    const run = g.grounded ? Math.sin(g.walk * 0.72) : 0;
    const air = g.grounded ? 0 : 1;
    const squat = g.grounded && g.hitstop > 0 ? 1.4 * s : 0;

    ctx.fillStyle = WALKER;
    ctx.strokeStyle = "rgba(230, 216, 194, 0.28)";
    ctx.globalAlpha = g.invuln > 0 ? 0.55 : 1;

    /* legs */
    ctx.lineWidth = Math.max(1.6, 1.7 * s);
    ctx.strokeStyle = WALKER;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -6 * s + squat);
    ctx.lineTo(-2.2 * s - run * 2.4 * s, air ? -3 * s : 0);
    ctx.moveTo(0, -6 * s + squat);
    ctx.lineTo(2.4 * s + run * 2.4 * s, air ? -3.2 * s : 0);
    ctx.stroke();

    /* coat — a wool shape, not a crate */
    const flap = Math.abs(g.vx) * 0.012 * s;
    ctx.beginPath();
    ctx.moveTo(-2.8 * s, -15.6 * s + squat);
    ctx.quadraticCurveTo(0.2 * s, -17.2 * s + squat, 2.6 * s, -15.4 * s + squat);
    ctx.quadraticCurveTo(4.2 * s + flap, -10 * s + squat, 3.2 * s + flap, -6.2 * s + squat);
    ctx.lineTo(-3.6 * s, -6 * s + squat);
    ctx.quadraticCurveTo(-4.4 * s, -10.4 * s + squat, -2.8 * s, -15.6 * s + squat);
    ctx.fill();
    ctx.strokeStyle = "rgba(230, 216, 194, 0.22)";
    ctx.lineWidth = Math.max(1, 0.55 * s);
    ctx.stroke();

    /* pack */
    ctx.fillRect(-3.8 * s, -14.2 * s + squat, 2.1 * s, 3.4 * s);

    /* head */
    ctx.beginPath();
    ctx.ellipse(0.4 * s, -18.2 * s + squat, 2 * s, 2.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawDust(ctx: CanvasRenderingContext2D) {
    if (!this.dust.length) return;
    ctx.fillStyle = "rgba(200, 188, 168, 0.55)";
    for (const p of this.dust) {
      const q = this.toScreen(p.x, p.y);
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = a * 0.7;
      ctx.fillRect(q.sx, q.sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}
