/**
 * Skip — the lake, drawn as light on water.
 *
 * A half-resolution ImageData of the water plane, inverse-projected so a
 * ripple sits where the stone actually struck. Sky, sun path, fresnel and a
 * few Gerstner-ish waves; no textures, no photographs.
 */
import { waterHeight, type Game, type WaterId } from "./sim";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Ripple {
  x: number;
  z: number;
  t: number;
  amp: number;
  n: number;
}

interface Drop {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
}

interface Place {
  skyTop: [number, number, number];
  skyHor: [number, number, number];
  sun: [number, number, number];
  deep: [number, number, number];
  shallow: [number, number, number];
  hill: [number, number, number];
  sunAlt: number;
  sunAz: number;
  specPow: number;
}

const PLACES: Record<WaterId, Place> = {
  still: {
    skyTop: [86, 108, 128],
    skyHor: [214, 176, 132],
    sun: [255, 214, 150],
    deep: [22, 38, 42],
    shallow: [48, 68, 66],
    hill: [28, 30, 28],
    sunAlt: 0.2,
    sunAz: 0.42,
    specPow: 36,
  },
  fetch: {
    skyTop: [78, 118, 148],
    skyHor: [176, 200, 214],
    sun: [255, 240, 210],
    deep: [18, 40, 52],
    shallow: [42, 70, 80],
    hill: [36, 44, 42],
    sunAlt: 0.38,
    sunAz: 0.28,
    specPow: 36,
  },
  rain: {
    skyTop: [92, 98, 100],
    skyHor: [148, 150, 146],
    sun: [200, 200, 196],
    deep: [28, 34, 32],
    shallow: [50, 56, 50],
    hill: [40, 44, 40],
    sunAlt: 0.55,
    sunAz: 0.1,
    specPow: 18,
  },
};

export class Stage {
  w = 1;
  h = 1;
  dpr = 1;
  camX = 0;
  horizon = 0;
  reduced = false;
  private water: ImageData | null = null;
  private ww = 0;
  private wh = 0;
  private ripples: Ripple[] = [];
  private drops: Drop[] = [];
  private flash = 0;
  private trail: { x: number; y: number; z: number; a: number }[] = [];

  constructor(reduced: boolean) {
    this.reduced = reduced;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.horizon = h * 0.38;
    const ww = Math.max(2, Math.floor(w * 0.4));
    const wh = Math.max(2, Math.floor((h - this.horizon) * 0.4));
    if (ww !== this.ww || wh !== this.wh) {
      this.ww = ww;
      this.wh = wh;
      this.water = new ImageData(ww, wh);
    }
  }

  ripple(x: number, z: number, amp: number, n: number) {
    this.ripples.push({ x, z, t: 0, amp, n });
    if (this.ripples.length > 14) this.ripples.shift();
  }

  splash(x: number, y: number, z: number, energy: number) {
    const n = this.reduced ? 5 : 10 + Math.round(energy * 8);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.4 + Math.random() * 2.2 * energy;
      this.drops.push({
        x,
        y: y + 0.02,
        z,
        vx: Math.cos(a) * s * 0.35,
        vy: 1.2 + Math.random() * 2.8 * energy,
        life: 0.35 + Math.random() * 0.45,
        age: 0,
      });
    }
  }

  kick(n: number) {
    this.flash = Math.min(1, 0.18 + n * 0.025);
  }

  clearTrail() {
    this.trail.length = 0;
  }

  private project(x: number, y: number, z: number) {
    const camX = -3.2 + this.camX;
    const camY = 1.35;
    const camZ = 0.12;
    const dx = x - camX;
    const dy = y - camY;
    const dz = z - camZ;
    const depth = Math.max(0.85, dx);
    const f = 1.12 * this.h;
    return {
      sx: this.w * 0.36 + (dz / depth) * f,
      sy: this.horizon - (dy / depth) * f,
      depth,
      sc: 1 / depth,
    };
  }

  private inverseWater(sx: number, sy: number) {
    const camX = -3.2 + this.camX;
    const camY = 1.35;
    const camZ = 0.12;
    const f = 1.12 * this.h;
    const dy = this.horizon - sy;
    // y = 0 plane: 0 - camY = dy * depth / f  => depth = -camY * f / dy
    if (dy >= -0.4) return null;
    const depth = (-camY * f) / dy;
    if (depth < 0.85 || depth > 140) return null;
    const dz = ((sx - this.w * 0.36) / f) * depth;
    return { x: camX + depth, z: camZ + dz, depth };
  }

  update(g: Game, dt: number) {
    const target =
      g.phase === "flight" || g.phase === "sunk"
        ? clamp(g.body.x - 6.5, 0, 48)
        : 0;
    if (this.reduced) {
      this.camX = target;
    } else {
      this.camX += (target - this.camX) * (1 - Math.exp(-dt * 2.2));
    }

    for (const r of this.ripples) r.t += dt;
    this.ripples = this.ripples.filter((r) => r.t < 3.6);
    for (const d of this.drops) {
      d.age += dt;
      d.vy -= 9.8 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vx * 0.15 * dt;
    }
    this.drops = this.drops.filter((d) => d.age < d.life && d.y > -0.2);
    this.flash = Math.max(0, this.flash - dt * 2.4);

    if (g.phase === "flight") {
      this.trail.push({
        x: g.body.x,
        y: g.body.y,
        z: g.body.z,
        a: 1,
      });
      if (this.trail.length > 80) this.trail.shift();
    }
    for (const p of this.trail) p.a -= dt * 0.85;
    this.trail = this.trail.filter((p) => p.a > 0);
    if (g.phase === "idle" || g.phase === "wind") this.trail.length = 0;
  }

  private rippleH(x: number, z: number) {
    let h = 0;
    let nx = 0;
    let nz = 0;
    for (const r of this.ripples) {
      const dx = x - r.x;
      const dz = z - r.z;
      const d = Math.hypot(dx, dz);
      const rad = 0.25 + r.t * (2.4 + Math.min(1.2, r.n * 0.08));
      const w = 0.14 + r.t * 0.06;
      const q = (d - rad) / w;
      const env = Math.exp(-q * q) * r.amp * Math.exp(-r.t * 0.85);
      h += env;
      const deriv = env * (-2 * q) / w;
      if (d > 1e-4) {
        nx += deriv * (dx / d);
        nz += deriv * (dz / d);
      }
    }
    return { h, nx, nz };
  }

  private paintWater(g: Game) {
    const img = this.water;
    if (!img) return;
    const place = PLACES[g.water.id];
    const data = img.data;
    const ww = this.ww;
    const wh = this.wh;
    const t = this.reduced ? 8.2 : g.t;
    const sunX = place.sunAz;
    const sunY = place.sunAlt;
    const sunZ = Math.sqrt(Math.max(0, 1 - sunX * sunX - sunY * sunY));
    const sl = Math.hypot(sunX, sunY, sunZ) || 1;
    const sX = sunX / sl;
    const sY = sunY / sl;
    const sZ = sunZ / sl;

    for (let j = 0; j < wh; j++) {
      const sy = this.horizon + ((j + 0.5) / wh) * (this.h - this.horizon);
      for (let i = 0; i < ww; i++) {
        const sx = ((i + 0.5) / ww) * this.w;
        const hit = this.inverseWater(sx, sy);
        const o = (j * ww + i) * 4;
        if (!hit) {
          data[o] = place.deep[0];
          data[o + 1] = place.deep[1];
          data[o + 2] = place.deep[2];
          data[o + 3] = 255;
          continue;
        }
        const { x, z, depth } = hit;
        const base = waterHeight(x, z, t, g.water, this.reduced);
        const rip = this.rippleH(x, z);
        const hx = waterHeight(x + 0.12, z, t, g.water, this.reduced) - base;
        const hz = waterHeight(x, z + 0.12, t, g.water, this.reduced) - base;
        let nx = -hx / 0.12 - rip.nx;
        let nz = -hz / 0.12 - rip.nz;
        let ny = 1;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl;
        ny /= nl;
        nz /= nl;

        const camWx = -3.2 + this.camX;
        const camWy = 1.35;
        const camWz = 0.12;
        let vX = camWx - x;
        let vY = camWy;
        let vZ = camWz - z;
        const vl = Math.hypot(vX, vY, vZ) || 1;
        vX /= vl;
        vY /= vl;
        vZ /= vl;
        const ndotv = Math.max(0, nx * vX + ny * vY + nz * vZ);
        const fres = 0.03 + 0.97 * (1 - ndotv) ** 5;

        const rY = clamp(vY * 1.4 + ny * 0.2, 0, 1);
        const skyR = lerp(place.skyHor[0], place.skyTop[0], rY);
        const skyG = lerp(place.skyHor[1], place.skyTop[1], rY);
        const skyB = lerp(place.skyHor[2], place.skyTop[2], rY);

        const near = clamp(2.4 / depth, 0, 1);
        const deepR = lerp(place.deep[0], place.shallow[0], near * 0.7);
        const deepG = lerp(place.deep[1], place.shallow[1], near * 0.7);
        const deepB = lerp(place.deep[2], place.shallow[2], near * 0.7);

        let rr = lerp(deepR, skyR, fres);
        let gg = lerp(deepG, skyG, fres);
        let bb = lerp(deepB, skyB, fres);

        let hX = vX + sX;
        let hY = vY + sY;
        let hZ = vZ + sZ;
        const hl = Math.hypot(hX, hY, hZ) || 1;
        const ndoth = Math.max(0, nx * (hX / hl) + ny * (hY / hl) + nz * (hZ / hl));
        const shine = ndoth ** place.specPow;
        const sunAmt = shine * (g.water.id === "rain" ? 0.4 : 1.15);
        rr += place.sun[0] * sunAmt;
        gg += place.sun[1] * sunAmt;
        bb += place.sun[2] * sunAmt;

        // A wide glitter road so the path of light reads at a glance.
        const vScan = (sy - this.horizon) / Math.max(1, this.h - this.horizon);
        const pathX = 0.58 + place.sunAz * 0.12;
        const pathW = 0.035 + vScan * 0.11;
        const path =
          Math.exp(-((sx / this.w - pathX) ** 2) / (2 * pathW * pathW)) *
          Math.pow(vScan, 0.35) *
          (g.water.id === "rain" ? 0.22 : 0.55);
        rr += place.sun[0] * path;
        gg += place.sun[1] * path;
        bb += place.sun[2] * path;

        if (rip.h > 0.004) {
          const k = clamp(rip.h * 14, 0, 0.55);
          rr += 180 * k;
          gg += 190 * k;
          bb += 200 * k;
        }

        const fog = clamp((depth - 14) / 50, 0, 0.45);
        rr = lerp(rr, place.skyHor[0], fog);
        gg = lerp(gg, place.skyHor[1], fog);
        bb = lerp(bb, place.skyHor[2], fog);

        data[o] = rr < 0 ? 0 : rr > 255 ? 255 : rr;
        data[o + 1] = gg < 0 ? 0 : gg > 255 ? 255 : gg;
        data[o + 2] = bb < 0 ? 0 : bb > 255 ? 255 : bb;
        data[o + 3] = 255;
      }
    }
  }

  private sky(ctx: CanvasRenderingContext2D, g: Game) {
    const p = PLACES[g.water.id];
    const grd = ctx.createLinearGradient(0, 0, 0, this.horizon + 8);
    grd.addColorStop(0, rgb(p.skyTop));
    grd.addColorStop(0.72, rgb(mix(p.skyTop, p.skyHor, 0.55)));
    grd.addColorStop(1, rgb(p.skyHor));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.w, this.horizon + 10);

    const sun = this.project(42, 4.2 + p.sunAlt * 10, 10 + p.sunAz * 16);
    const R = this.h * (g.water.id === "rain" ? 0.04 : 0.07);
    const glow = ctx.createRadialGradient(sun.sx, sun.sy, 0, sun.sx, sun.sy, R * 6);
    glow.addColorStop(0, rgba(p.sun, g.water.id === "rain" ? 0.35 : 0.85));
    glow.addColorStop(0.18, rgba(p.sun, 0.22));
    glow.addColorStop(1, rgba(p.sun, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(sun.sx - R * 6, sun.sy - R * 6, R * 12, R * 12);
    if (g.water.id !== "rain") {
      ctx.fillStyle = rgb(p.sun);
      ctx.beginPath();
      ctx.arc(sun.sx, sun.sy, R * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far shore.
    ctx.fillStyle = rgb(p.hill);
    ctx.beginPath();
    ctx.moveTo(0, this.horizon + 2);
    const seed = g.water.id === "still" ? 1.1 : g.water.id === "fetch" ? 2.4 : 0.7;
    for (let i = 0; i <= 32; i++) {
      const u = i / 32;
      const y =
        this.horizon -
        (4 + 10 * Math.abs(Math.sin(u * 3.1 + seed)) + 6 * Math.sin(u * 7 + seed)) *
          (this.h / 900);
      ctx.lineTo(u * this.w, y);
    }
    ctx.lineTo(this.w, this.horizon + 2);
    ctx.closePath();
    ctx.fill();
  }

  private glint(ctx: CanvasRenderingContext2D, g: Game) {
    const p = PLACES[g.water.id];
    const mirror = ctx.createLinearGradient(
      0,
      this.horizon,
      0,
      this.horizon + this.h * 0.22
    );
    mirror.addColorStop(0, rgba(p.skyHor, 0.62));
    mirror.addColorStop(1, rgba(p.skyHor, 0));
    ctx.fillStyle = mirror;
    ctx.fillRect(0, this.horizon - 1, this.w, this.h * 0.24);

    const sunX = this.w * (0.58 + p.sunAz * 0.1);
    const rain = g.water.id === "rain";
    const glow = ctx.createRadialGradient(
      sunX,
      this.horizon + this.h * 0.04,
      this.h * 0.02,
      sunX,
      this.h * 0.7,
      this.w * (rain ? 0.22 : 0.4)
    );
    glow.addColorStop(0, rgba(p.sun, rain ? 0.28 : 0.62));
    glow.addColorStop(0.28, rgba(p.sun, rain ? 0.09 : 0.2));
    glow.addColorStop(1, rgba(p.sun, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, this.horizon, this.w, this.h - this.horizon);
  }

  private shore(ctx: CanvasRenderingContext2D, g: Game) {
    const p = PLACES[g.water.id];
    // Near bank as world-space rocks so it stays under the stone.
    for (let i = 0; i < 18; i++) {
      const x = -0.4 + i * 0.16 + (i % 3) * 0.03;
      const z = -0.55 + (i % 5) * 0.22 - 0.3;
      const y = 0.02 + (i % 4) * 0.012;
      const pr = this.project(x, y, z);
      const r = (10 + (i % 5) * 3) * pr.sc * this.h * 0.22;
      ctx.fillStyle = `rgb(${34 + (i % 4) * 6},${28 + (i % 3) * 4},${22})`;
      ctx.beginPath();
      ctx.ellipse(pr.sx, pr.sy, r, r * 0.42, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    const a = this.project(-0.6, 0.02, -1.1);
    const b = this.project(1.35, 0, 0.4);
    const c = this.project(0.2, 0.16, -0.2);
    const bank = ctx.createLinearGradient(0, this.h * 0.78, 0, this.h);
    bank.addColorStop(0, rgba(p.deep, 0));
    bank.addColorStop(1, "rgba(14, 12, 10, 0.38)");
    ctx.fillStyle = bank;
    ctx.fillRect(0, this.h * 0.78, this.w * 0.48, this.h * 0.22);
    void a;
    void b;
    void c;

    // Reeds.
    ctx.strokeStyle = "rgba(28, 36, 28, 0.7)";
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 7; i++) {
      const x = 0.15 + i * 0.09;
      const z = -0.7 + (i % 3) * 0.12;
      const base = this.project(x, 0.02, z);
      const tip = this.project(x + 0.02, 0.55 + (i % 3) * 0.08, z);
      ctx.beginPath();
      ctx.moveTo(base.sx, base.sy);
      ctx.quadraticCurveTo(
        base.sx + 3 + i,
        (base.sy + tip.sy) / 2,
        tip.sx,
        tip.sy
      );
      ctx.stroke();
    }
  }

  private stone(ctx: CanvasRenderingContext2D, g: Game) {
    const b = g.body;
    if (g.phase === "sunk" && b.y < -0.12) return;
    const pr = this.project(b.x, Math.max(b.y, 0.01), b.z);
    const stone = g.stone;
    const rx = stone.radius * pr.sc * this.h * 2.85;
    const ry = rx * (0.28 + (1 - stone.flatness) * 0.35);
    const tilt = b.attack;
    const spin = b.roll;

    // Shadow on the water.
    const sh = this.project(b.x, 0.001, b.z);
    ctx.fillStyle = `rgba(4, 10, 12, ${0.28 * clamp(1.4 / pr.depth, 0.12, 0.4)})`;
    ctx.beginPath();
    ctx.ellipse(sh.sx, sh.sy, rx * 1.15, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(pr.sx, pr.sy);
    ctx.rotate(-tilt * 0.85);
    const [cr, cg, cb] = stone.color;
    const [er, eg, eb] = stone.edge;
    const grd = ctx.createLinearGradient(-rx, -ry, rx, ry);
    grd.addColorStop(0, `rgb(${er},${eg},${eb})`);
    grd.addColorStop(0.4, `rgb(${cr},${cg},${cb})`);
    grd.addColorStop(1, `rgb(${er * 0.7},${eg * 0.7},${eb * 0.7})`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(20, 16, 12, 0.45)`;
    ctx.lineWidth = Math.max(0.6, rx * 0.06);
    ctx.stroke();

    // A vein so spin is visible.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = `rgba(30, 24, 18, 0.55)`;
    ctx.lineWidth = Math.max(1, rx * 0.08);
    const vx = Math.cos(spin) * rx * 0.72;
    const vy = Math.sin(spin) * ry * 0.72;
    ctx.beginPath();
    ctx.moveTo(-vx, -vy);
    ctx.lineTo(vx, vy);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  private windLine(ctx: CanvasRenderingContext2D, g: Game) {
    if (g.phase !== "wind") return;
    const b = g.body;
    const pr = this.project(b.x, b.y, b.z);
    const back = this.project(
      b.x - 0.15 - g.power * 1.1,
      b.y + 0.08 + g.power * 0.15,
      b.z
    );
    ctx.strokeStyle = "rgba(234, 217, 188, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(pr.sx, pr.sy);
    ctx.lineTo(back.sx, back.sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(234, 217, 188, 0.55)";
    ctx.beginPath();
    ctx.arc(back.sx, back.sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private fx(ctx: CanvasRenderingContext2D) {
    for (const p of this.trail) {
      const pr = this.project(p.x, p.y, p.z);
      ctx.fillStyle = `rgba(236, 228, 210, ${0.22 * p.a})`;
      ctx.beginPath();
      ctx.arc(pr.sx, pr.sy, Math.max(0.8, 2.2 * pr.sc * this.h * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const d of this.drops) {
      const pr = this.project(d.x, d.y, d.z);
      const a = 1 - d.age / d.life;
      ctx.fillStyle = `rgba(220, 230, 232, ${0.55 * a})`;
      ctx.beginPath();
      ctx.arc(pr.sx, pr.sy, Math.max(0.7, 1.6 * pr.sc * this.h * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 244, 220, ${this.flash * 0.08})`;
      ctx.fillRect(0, this.horizon, this.w, this.h - this.horizon);
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: Game) {
    const p = PLACES[g.water.id];
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = rgb(p.skyTop);
    ctx.fillRect(0, 0, this.w, this.h);

    this.sky(ctx, g);
    this.paintWater(g);
    if (this.water) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        imageOf(this.water),
        0,
        this.horizon - 1,
        this.w,
        this.h - this.horizon + 1
      );
    }
    this.glint(ctx, g);
    this.fx(ctx);
    this.shore(ctx, g);
    this.windLine(ctx, g);
    this.stone(ctx, g);
  }
}

const images = new WeakMap<ImageData, HTMLCanvasElement>();

function imageOf(img: ImageData) {
  let c = images.get(img);
  if (!c) {
    c = document.createElement("canvas");
    images.set(img, c);
  }
  if (c.width !== img.width || c.height !== img.height) {
    c.width = img.width;
    c.height = img.height;
  }
  const x = c.getContext("2d");
  if (x) x.putImageData(img, 0, 0);
  return c;
}

function rgb(c: [number, number, number]) {
  return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
}
function rgba(c: [number, number, number], a: number) {
  return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
}
function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
