/**
 * House plate. A generated still of a hall, so the desk is never empty and
 * the treatments have something photographic to bite. It is labelled in the
 * interface as generated — it is not a stock photograph.
 */

function hash(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

export function makeHousePlate(w = 960, h = 1280): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  paintHall(ctx, w, h);
  return canvas;
}

function paintHall(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w * 0.5;
  const vanishY = h * 0.38;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#4a4034");
  sky.addColorStop(0.34, "#1c1814");
  sky.addColorStop(1, "#080706");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  /* Side walls, converging. */
  ctx.fillStyle = "#2c261e";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(cx - w * 0.18, vanishY);
  ctx.lineTo(cx - w * 0.18, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#221c16";
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(cx + w * 0.18, vanishY);
  ctx.lineTo(cx + w * 0.18, h);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  /* Window bays on the left wall. */
  ctx.fillStyle = "#c8b48a";
  for (let i = 0; i < 4; i += 1) {
    const t = 0.18 + i * 0.16;
    const x = t * (cx - w * 0.2);
    const y = vanishY * (0.35 + t * 0.15);
    const bw = 10 + t * 22;
    const bh = 28 + t * 70;
    ctx.globalAlpha = 0.35 + t * 0.35;
    ctx.fillRect(x, y, bw, bh);
  }
  ctx.globalAlpha = 1;

  /* Far wall / proscenium. */
  const stageW = w * 0.4;
  const stageH = h * 0.24;
  const stageX = cx - stageW / 2;
  const stageY = vanishY - stageH * 0.58;
  ctx.fillStyle = "#0c0a08";
  ctx.fillRect(stageX - 14, stageY - 14, stageW + 28, stageH + 36);

  const glow = ctx.createRadialGradient(
    cx,
    stageY + stageH * 0.45,
    4,
    cx,
    stageY + stageH * 0.45,
    stageW * 0.78
  );
  glow.addColorStop(0, "#fff6d8");
  glow.addColorStop(0.28, "#e8c878");
  glow.addColorStop(1, "#3a2a10");
  ctx.fillStyle = glow;
  ctx.fillRect(stageX, stageY, stageW, stageH);

  /* Screen grid — a window of panes. */
  ctx.strokeStyle = "rgba(20, 16, 10, 0.45)";
  ctx.lineWidth = Math.max(1, w * 0.003);
  const cols = 6;
  const rows = 4;
  for (let i = 1; i < cols; i += 1) {
    const x = stageX + (stageW * i) / cols;
    ctx.beginPath();
    ctx.moveTo(x, stageY);
    ctx.lineTo(x, stageY + stageH);
    ctx.stroke();
  }
  for (let j = 1; j < rows; j += 1) {
    const y = stageY + (stageH * j) / rows;
    ctx.beginPath();
    ctx.moveTo(stageX, y);
    ctx.lineTo(stageX + stageW, y);
    ctx.stroke();
  }

  /* Seat rows receding. */
  const seats = 14;
  for (let i = 0; i < seats; i += 1) {
    const t = i / (seats - 1);
    const y = vanishY + 20 + t * t * (h - vanishY - 20);
    const half = w * (0.18 + t * 0.42);
    const thick = 3 + t * 10;
    ctx.fillStyle = `rgba(${28 + i * 4}, ${24 + i * 3}, ${20 + i * 2}, ${0.55 + t * 0.35})`;
    ctx.fillRect(cx - half, y, half * 2, thick);
    /* aisle cut */
    ctx.fillStyle = "#0c0b0a";
    ctx.fillRect(cx - w * 0.03 * (0.4 + t), y - 1, w * 0.06 * (0.4 + t), thick + 2);
  }

  /* Columns. */
  ctx.fillStyle = "#2a241c";
  const colW = w * 0.035;
  ctx.fillRect(w * 0.08, h * 0.08, colW, h * 0.92);
  ctx.fillRect(w * 0.88, h * 0.1, colW, h * 0.9);
  ctx.fillStyle = "#3a3228";
  ctx.fillRect(w * 0.08, h * 0.08, colW * 0.28, h * 0.92);
  ctx.fillRect(w * 0.88, h * 0.1, colW * 0.28, h * 0.9);

  /* Ceiling spots. */
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const x = cx + (t - 0.5) * w * 0.42;
    const y = h * 0.07 + Math.abs(t - 0.5) * 12;
    const r = 3 + (1 - Math.abs(t - 0.5)) * 4;
    const lamp = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
    lamp.addColorStop(0, "rgba(240, 220, 170, 0.85)");
    lamp.addColorStop(1, "rgba(240, 220, 170, 0)");
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(x, y, r * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Vignette. */
  const vig = ctx.createRadialGradient(cx, h * 0.42, w * 0.15, cx, h * 0.5, w * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  /* Grain. */
  const grains = Math.floor((w * h) / 28);
  for (let i = 0; i < grains; i += 1) {
    const x = hash(i, 1, 3) * w;
    const y = hash(i, 2, 5) * h;
    const a = 0.04 + hash(i, 3, 7) * 0.1;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

export async function rasterizeFile(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(bitmap.width * scale));
  canvas.height = Math.max(2, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}
