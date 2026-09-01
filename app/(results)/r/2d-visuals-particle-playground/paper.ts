/** Laid rag, generated once. No photograph, no hosted asset. */

export function makePaperCanvas(size = 1024): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.fillStyle = "#e2d8c4";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(78, 62, 40, 0.038)";
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 5) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.05) * 0.6);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(60, 48, 32, 0.045)";
  for (let x = 0; x < size; x += 31) {
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(x * 0.02) * 0.8, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (hash(i) - 0.5) * 18;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n * 0.9);
    d[i + 2] = clamp(d[i + 2] + n * 0.74);
  }

  for (let k = 0; k < 14; k++) {
    const cx = hash(k * 17 + 3) * size;
    const cy = hash(k * 29 + 8) * size;
    const r = 40 + hash(k * 11) * 90;
    stain(d, size, cx, cy, r, 8 + hash(k) * 10);
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function makeMagnetCanvas(fontFamily: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#2a241c";
  roundRect(ctx, 2, 10, 508, 108, 8);
  ctx.fill();

  ctx.fillStyle = "#1a1612";
  roundRect(ctx, 10, 18, 492, 92, 5);
  ctx.fill();

  ctx.fillStyle = "#cfc4ae";
  ctx.font = `italic 52px ${fontFamily}, "Iowan Old Style", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", 78, 66);
  ctx.fillText("N", 434, 66);

  ctx.strokeStyle = "rgba(207, 196, 174, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(130, 64);
  ctx.lineTo(382, 64);
  ctx.stroke();

  return canvas;
}

function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function stain(
  d: Uint8ClampedArray,
  size: number,
  cx: number,
  cy: number,
  r: number,
  amt: number,
): void {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(size - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(size - 1, Math.ceil(cy + r));
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const q = dx * dx + dy * dy;
      if (q > r2) continue;
      const t = 1 - q / r2;
      const k = amt * t * t;
      const i = (y * size + x) * 4;
      d[i] = clamp(d[i] - k * 0.55);
      d[i + 1] = clamp(d[i + 1] - k * 0.85);
      d[i + 2] = clamp(d[i + 2] - k * 1.15);
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
