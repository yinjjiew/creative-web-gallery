/**
 * The shop, drawn.
 *
 * A village smithy at dusk: brick, coal, one anvil, the colour of the iron.
 * Beat marks live on the anvil face and on the bar — not a neon highway.
 * The bar's silhouette is the score, live.
 */

import { type Game, type Segment, steelRgb, upcoming, workOf } from "./engine";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

let grain: HTMLCanvasElement | null = null;

function grainCanvas() {
  if (grain) return grain;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const x = c.getContext("2d");
  if (!x) return c;
  const img = x.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 18 + hash(i * 0.17) * 28;
    img.data[i] = n;
    img.data[i + 1] = n * 0.92;
    img.data[i + 2] = n * 0.8;
    img.data[i + 3] = 36 + hash(i * 0.31) * 40;
  }
  x.putImageData(img, 0, 0);
  grain = c;
  return c;
}

let shop: HTMLCanvasElement | null = null;
let shopKey = "";

export function resize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const dpr = 1;
  const w = Math.max(1, canvas.clientWidth);
  const h = Math.max(1, canvas.clientHeight);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    shop = null;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr };
}

function rgb(r: number, g: number, b: number, a = 1) {
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}

function brickWall(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  seed: number
) {
  const bw = 28;
  const bh = 12;
  for (let y = y0, row = 0; y < y1; y += bh, row++) {
    const off = row % 2 === 0 ? 0 : bw * 0.5;
    for (let x = x0 - off; x < x1; x += bw) {
      const n = hash(seed + row * 19 + x * 0.13);
      const r = 58 + n * 42;
      const g = 28 + n * 16;
      const b = 20 + n * 10;
      ctx.fillStyle = rgb(r, g, b);
      ctx.fillRect(x + 0.6, y + 0.5, bw - 1.2, bh - 0.9);
    }
  }
}

function coals(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  t: number,
  reduced: boolean
) {
  const flicker = reduced ? 0 : Math.sin(t * 7.2) * 0.08 + Math.sin(t * 11.1) * 0.04;
  const glow = 0.72 + flicker;
  const rad = ctx.createRadialGradient(cx, cy, 4, cx, cy + 8, w * 0.72);
  rad.addColorStop(0, rgb(250, 220, 140, 0.95 * glow));
  rad.addColorStop(0.18, rgb(236, 120, 36, 0.75 * glow));
  rad.addColorStop(0.45, rgb(180, 36, 14, 0.45 * glow));
  rad.addColorStop(1, rgb(20, 8, 4, 0));
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, w * 0.7, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 10; i++) {
    const px = cx + (hash(i * 3.1) - 0.5) * w * 1.15;
    const py = cy + (hash(i * 5.7) - 0.35) * h * 0.85;
    const s = 5 + hash(i * 2.2) * 11;
    ctx.fillStyle = rgb(18 + hash(i) * 16, 12, 10, 0.92);
    ctx.beginPath();
    ctx.ellipse(px, py, s, s * 0.62, hash(i * 8) * 1.2, 0, Math.PI * 2);
    ctx.fill();
    if (hash(i * 9.2) > 0.45) {
      ctx.fillStyle = rgb(240, 90 + hash(i) * 80, 20, 0.35 + glow * 0.25);
      ctx.beginPath();
      ctx.ellipse(px, py + 1, s * 0.35, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function forgeMouth(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  g: Game
) {
  const { fx, fy, fw, fh } = L;

  ctx.fillStyle = "#1a100c";
  ctx.beginPath();
  ctx.moveTo(fx, fy + fh);
  ctx.lineTo(fx, fy + 28);
  ctx.quadraticCurveTo(fx + fw * 0.5, fy - 22, fx + fw, fy + 28);
  ctx.lineTo(fx + fw, fy + fh);
  ctx.closePath();
  ctx.fill();

  const inset = 10;
  const glow = ctx.createRadialGradient(
    fx + fw * 0.5,
    fy + fh * 0.62,
    6,
    fx + fw * 0.5,
    fy + fh * 0.7,
    fw * 0.62
  );
  const pulse = g.reduced ? 0.85 : 0.78 + Math.sin(g.fireAge * 3.4) * 0.1;
  glow.addColorStop(0, rgb(255, 210, 120, pulse));
  glow.addColorStop(0.35, rgb(230, 90, 28, 0.7 * pulse));
  glow.addColorStop(1, rgb(30, 8, 4, 0.15));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(fx + inset, fy + fh - 4);
  ctx.lineTo(fx + inset, fy + 34);
  ctx.quadraticCurveTo(
    fx + fw * 0.5,
    fy - 6,
    fx + fw - inset,
    fy + 34
  );
  ctx.lineTo(fx + fw - inset, fy + fh - 4);
  ctx.closePath();
  ctx.fill();

  coals(
    ctx,
    fx + fw * 0.5,
    fy + fh * 0.72,
    fw * 0.72,
    fh * 0.38,
    g.fireAge,
    g.reduced
  );

  if (g.phase === "fire" || g.phase === "title") {
    const [sr, sg, sb] = steelRgb(g.phase === "title" ? 0.62 : g.heat);
    ctx.save();
    ctx.translate(fx + fw * 0.52, fy + fh * 0.58);
    ctx.rotate(-0.35);
    const bloom = ctx.createRadialGradient(0, 0, 2, 0, 0, 52);
    bloom.addColorStop(0, rgb(sr, sg, sb, 0.9));
    bloom.addColorStop(1, rgb(sr, sg, sb, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(sr, sg, sb);
    ctx.fillRect(-36, -6, 72, 12);
    ctx.restore();
  }
}

type Layout = {
  w: number;
  h: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  fw: number;
  fh: number;
};

function layout(w: number, h: number): Layout {
  const tall = h > w * 1.15;
  const ax = tall ? w * 0.56 : w * 0.6;
  const ay = tall ? h * 0.36 : h * 0.4;
  const fw = Math.min(w * 0.5, tall ? 220 : 440);
  const fh = Math.min(h * 0.42, tall ? 210 : 340);
  const fx = w * 0.03;
  const fy = tall ? h * 0.08 : h * 0.07;
  return { w, h, ax, ay, fx, fy, fw, fh };
}

function unit(L: Layout) {
  return Math.min(L.w, L.h) * 0.32;
}

function anvil(ctx: CanvasRenderingContext2D, L: Layout, shake: number) {
  const { ax, ay } = L;
  const s = unit(L);
  ctx.save();
  ctx.translate(ax + shake * 3, ay + shake * 1.5);
  ctx.scale(s, s);

  ctx.fillStyle = "#1c1916";
  ctx.beginPath();
  ctx.moveTo(-0.55, 0.72);
  ctx.lineTo(-0.38, 0.42);
  ctx.lineTo(0.4, 0.42);
  ctx.lineTo(0.58, 0.72);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2a2622";
  ctx.fillRect(-0.18, 0.08, 0.36, 0.36);

  ctx.fillStyle = "#3a342e";
  ctx.beginPath();
  ctx.moveTo(-0.92, 0.02);
  ctx.quadraticCurveTo(-0.7, -0.12, -0.42, -0.06);
  ctx.lineTo(-0.42, 0.14);
  ctx.quadraticCurveTo(-0.68, 0.16, -0.88, 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#4a433c";
  ctx.beginPath();
  ctx.moveTo(-0.42, -0.1);
  ctx.lineTo(0.48, -0.1);
  ctx.lineTo(0.62, 0.02);
  ctx.lineTo(0.5, 0.16);
  ctx.lineTo(-0.42, 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#6a6258";
  ctx.fillRect(-0.4, -0.16, 0.86, 0.09);
  ctx.fillStyle = "rgba(210, 190, 150, 0.18)";
  ctx.fillRect(-0.36, -0.155, 0.78, 0.02);

  ctx.fillStyle = "#2e2924";
  ctx.beginPath();
  ctx.ellipse(0.22, -0.1, 0.045, 0.028, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2a1c";
  ctx.beginPath();
  ctx.moveTo(-0.42, 0.72);
  ctx.lineTo(-0.32, 1.05);
  ctx.lineTo(0.34, 1.05);
  ctx.lineTo(0.44, 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0.04, 1.08, 0.55, 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function beatRings(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  g: Game,
  now: number
) {
  const marks = upcoming(g, now);
  const { ax, ay } = L;
  const faceY = ay - unit(L) * 0.14;
  for (const m of marks) {
    if (m.kind === "count") {
      const u = clamp(1 - m.t / 0.55, 0, 1);
      const r = 10 + (1 - u) * 46;
      ctx.strokeStyle = rgb(200, 160, 110, 0.18 + u * 0.35);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(ax, faceY, r * 1.6, r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const u = clamp(1 - m.t / 0.7, 0, 1);
      const r = 8 + (1 - u) * 38;
      ctx.strokeStyle = rgb(230, 140, 70, 0.12 + u * 0.5);
      ctx.lineWidth = g.reduced ? 1.4 : 1.1;
      ctx.beginPath();
      ctx.ellipse(ax + 8, faceY, r * 1.5, r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function barOnAnvil(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  segments: Segment[],
  heat: number,
  hide: boolean
) {
  if (hide || !segments.length) return;
  const { ax, ay } = L;
  const scale = unit(L);
  const y = ay - scale * 0.2;
  const len = scale * 1.15;
  const x0 = ax - len * 0.42;
  const [sr, sg, sb] = steelRgb(heat);
  const n = segments.length;

  ctx.save();
  if (heat > 0.25) {
    const bloom = ctx.createRadialGradient(ax, y, 4, ax, y, len * 0.7);
    bloom.addColorStop(0, rgb(sr, sg, sb, 0.35));
    bloom.addColorStop(1, rgb(sr, sg, sb, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.ellipse(ax, y, len * 0.62, 28 + heat * 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const seg = segments[i];
    const x = x0 + t * len;
    const thick = (6 + seg.r * 16) * (1 - seg.flat * 0.45);
    const lift = -seg.bend * 26;
    if (i === 0) ctx.moveTo(x, y + lift - thick);
    else ctx.lineTo(x, y + lift - thick);
  }
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1);
    const seg = segments[i];
    const x = x0 + t * len;
    const thick = (6 + seg.r * 16) * (1 - seg.flat * 0.45);
    const lift = -seg.bend * 26;
    ctx.lineTo(x, y + lift + thick);
  }
  ctx.closePath();
  ctx.fillStyle = rgb(sr, sg, sb);
  ctx.fill();
  ctx.strokeStyle = rgb(sr * 0.45, sg * 0.4, sb * 0.35, 0.7);
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const seg = segments[i];
    if (seg.nick < 0.08) continue;
    const t = i / (n - 1);
    const x = x0 + t * len;
    const lift = -seg.bend * 26;
    ctx.fillStyle = rgb(20, 12, 8, 0.35 + seg.nick * 0.4);
    ctx.beginPath();
    ctx.ellipse(x, y + lift, 3 + seg.nick * 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function punchMarks(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  g: Game,
  now: number
) {
  if (g.phase !== "count" && g.phase !== "work") return;
  const work = workOf(g);
  const heat = work.heats[g.heatIndex];
  if (!heat) return;
  const { ax, ay } = L;
  const scale = unit(L);
  const y = ay + scale * 0.22;
  const len = scale * 0.9;
  const x0 = ax - len * 0.45;
  const n = heat.pattern.length;
  const last = heat.pattern[n - 1] || 1;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const t = last === 0 ? 0 : heat.pattern[i] / last;
    const x = x0 + t * len;
    const beat = g.beats.find(
      (b) => b.kind === "work" && b.heat === g.heatIndex && b.index === i
    );
    const done = beat?.consumed ?? false;
    const soon = beat ? clamp(1 - (beat.audioT - now) / 0.55, 0, 1) : 0;
    ctx.fillStyle = done
      ? rgb(40, 32, 26, 0.55)
      : rgb(230, 190, 130, 0.2 + soon * 0.7);
    ctx.beginPath();
    ctx.arc(x, y, done ? 2.2 : 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hammer(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  g: Game
) {
  if (g.phase === "inspect") return;
  const { ax, ay } = L;
  const scale = unit(L);
  const rest = g.phase === "title" || g.phase === "fire" || g.phase === "calibrate";
  const down = rest
    ? 0.92
    : Math.max(g.hammer, g.phase === "work" ? g.ghost * 0.85 : 0);
  const raised = 1 - down;
  ctx.save();
  ctx.translate(ax + scale * 0.18, ay - scale * 0.22 - raised * scale * 0.42);
  ctx.rotate(-0.7 + down * 0.82);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#5c4030";
  ctx.fillRect(-0.018, 0.04, 0.036, 0.48);
  ctx.fillStyle = "#2a2622";
  ctx.fillRect(-0.1, -0.065, 0.24, 0.1);
  ctx.fillStyle = "#3c362f";
  ctx.fillRect(-0.082, -0.085, 0.09, 0.036);
  ctx.restore();
}

function sparks(ctx: CanvasRenderingContext2D, L: Layout, g: Game) {
  if (g.reduced) return;
  for (const sp of g.sparks) {
    const x = sp.x * L.w;
    const y = sp.y * L.h;
    const a = 1 - sp.life / sp.max;
    const [r, gc, b] = steelRgb(0.55 + sp.warm * 0.4);
    ctx.fillStyle = rgb(r, gc, b, a);
    ctx.fillRect(x, y, 2.2, 2.2);
  }
}

function lantern(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  t: number,
  reduced: boolean
) {
  const x = L.w * 0.88;
  const y = L.h * 0.1;
  const flick = reduced ? 0.85 : 0.8 + Math.sin(t * 5.1) * 0.08;
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y);
  ctx.stroke();
  const glow = ctx.createRadialGradient(x, y + 16, 2, x, y + 16, 70);
  glow.addColorStop(0, rgb(255, 196, 110, 0.2 * flick));
  glow.addColorStop(1, rgb(255, 180, 80, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + 16, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a3024";
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 8, y);
  ctx.lineTo(x + 6, y + 20);
  ctx.lineTo(x - 6, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgb(255, 186, 88, 0.55 * flick);
  ctx.fillRect(x - 4, y + 5, 8, 10);
}

function bakeShop(w: number, h: number, L: Layout) {
  const key = `${w}x${h}`;
  if (shop && shopKey === key) return shop;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  if (!x) return c;
  x.fillStyle = "#100c0a";
  x.fillRect(0, 0, w, h);
  const back = x.createLinearGradient(0, 0, 0, h);
  back.addColorStop(0, "#16110e");
  back.addColorStop(0.55, "#120e0b");
  back.addColorStop(1, "#0c0908");
  x.fillStyle = back;
  x.fillRect(0, 0, w, h);
  brickWall(x, L.fx - 24, L.fy - 40, L.fx + L.fw + 80, L.fy + L.fh + 50, 1);
  x.fillStyle = "#16110d";
  x.fillRect(0, L.ay + unit(L) * 0.55, w, h);
  x.save();
  x.globalCompositeOperation = "multiply";
  x.drawImage(grainCanvas(), 0, 0, w, h);
  x.restore();
  const vig = x.createRadialGradient(
    w * 0.42,
    h * 0.42,
    Math.min(w, h) * 0.18,
    w * 0.5,
    h * 0.52,
    Math.max(w, h) * 0.7
  );
  vig.addColorStop(0, rgb(0, 0, 0, 0));
  vig.addColorStop(1, rgb(0, 0, 0, 0.5));
  x.fillStyle = vig;
  x.fillRect(0, 0, w, h);
  shop = c;
  shopKey = key;
  return c;
}

export function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  g: Game,
  now: number
) {
  const L = layout(w, h);
  ctx.drawImage(bakeShop(w, h, L), 0, 0);

  lantern(ctx, L, g.fireAge, g.reduced);
  forgeMouth(ctx, L, g);

  const room = ctx.createRadialGradient(
    L.fx + L.fw * 0.5,
    L.fy + L.fh * 0.62,
    12,
    L.ax,
    L.ay,
    Math.max(w, h) * 0.7
  );
  room.addColorStop(0, rgb(120, 36, 10, 0.1));
  room.addColorStop(1, rgb(0, 0, 0, 0.28));
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, w, h);

  anvil(ctx, L, g.reduced ? 0 : g.shake);
  beatRings(ctx, L, g, now);

  const hideBar = g.phase === "fire" || g.phase === "title";
  if (g.phase !== "calibrate") {
    barOnAnvil(ctx, L, g.segments, g.heat, hideBar);
  } else {
    barOnAnvil(ctx, L, g.segments, 0.08, false);
  }
  punchMarks(ctx, L, g, now);
  hammer(ctx, L, g);
  sparks(ctx, L, g);

  if (g.flash > 0.02 && !g.reduced) {
    ctx.fillStyle = rgb(255, 200, 120, g.flash * 0.07);
    ctx.fillRect(0, 0, w, h);
  }
}
