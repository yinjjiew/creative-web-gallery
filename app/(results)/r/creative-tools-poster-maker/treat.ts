/**
 * Image treatments that share inks with the type. A photograph sitting
 * untouched behind a headline is the failure this desk exists to refuse.
 */

import { channelLum, hexRgb, type InkSet } from "./inks";

export type Treatment = "duotone" | "halftone" | "threshold";
export type Cut = "low" | "mid" | "high";
export type Ruling = "coarse" | "medium" | "fine";
export type Gravity = "top" | "center" | "bottom";

export const TREATMENTS: { id: Treatment; name: string; job: string }[] = [
  { id: "duotone", name: "Duotone", job: "Luminance mapped onto the two working inks." },
  { id: "halftone", name: "Halftone", job: "A news plate. Dots of ink on the stock." },
  { id: "threshold", name: "Threshold", job: "A hard cut. Graphic, not photographic." },
];

const CUT_VALUE: Record<Cut, number> = { low: 0.36, mid: 0.5, high: 0.64 };
const RULING_DIV: Record<Ruling, number> = { coarse: 42, medium: 68, fine: 96 };

export function treatPlate(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  ink: InkSet,
  treatment: Treatment,
  cut: Cut,
  ruling: Ruling
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(source, 0, 0, sw, sh);
  const image = ctx.getImageData(0, 0, sw, sh);
  const data = image.data;

  const paper = hexRgb(ink.paper);
  const body = hexRgb(ink.ink);
  const paperL = channelLum(ink.paper);
  const inkL = channelLum(ink.ink);
  const shadow = paperL < inkL ? paper : body;
  const highlight = paperL < inkL ? body : paper;
  const dark = paperL < inkL ? body : paper;

  if (treatment === "halftone") {
    ctx.fillStyle = ink.paper;
    ctx.fillRect(0, 0, sw, sh);
    const cell = Math.max(3, Math.round(Math.min(sw, sh) / RULING_DIV[ruling]));
    ctx.fillStyle = `rgb(${dark[0]},${dark[1]},${dark[2]})`;
    for (let y = cell / 2; y < sh; y += cell) {
      const offset = Math.round(y / cell) % 2 === 0 ? 0 : cell / 2;
      for (let x = cell / 2 + offset; x < sw; x += cell) {
        const lum = sampleLum(data, sw, sh, x, y, cell);
        /* Darker source → larger ink dot. */
        const inkAmt = paperL < inkL ? 1 - lum : lum;
        const radius = inkAmt * cell * 0.52;
        if (radius < 0.35) continue;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return canvas;
  }

  const cutV = CUT_VALUE[cut];
  for (let i = 0; i < data.length; i += 4) {
    const y =
      (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    let r: number;
    let g: number;
    let b: number;
    if (treatment === "threshold") {
      const on = y < cutV;
      const c = on ? body : paper;
      r = c[0];
      g = c[1];
      b = c[2];
    } else {
      const t = y * y * (3 - 2 * y);
      r = shadow[0] + (highlight[0] - shadow[0]) * t;
      g = shadow[1] + (highlight[1] - shadow[1]) * t;
      b = shadow[2] + (highlight[2] - shadow[2]) * t;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function sampleLum(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
  cell: number
): number {
  const x0 = Math.max(0, Math.floor(x - cell / 2));
  const y0 = Math.max(0, Math.floor(y - cell / 2));
  const x1 = Math.min(w, Math.ceil(x + cell / 2));
  const y1 = Math.min(h, Math.ceil(y + cell / 2));
  let sum = 0;
  let n = 0;
  for (let yy = y0; yy < y1; yy += 2) {
    for (let xx = x0; xx < x1; xx += 2) {
      const i = (yy * w + xx) * 4;
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      n += 1;
    }
  }
  return n ? sum / n / 255 : 0.5;
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  gravity: Gravity
) {
  if (iw < 1 || ih < 1 || dw < 1 || dh < 1) return;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy =
    gravity === "top" ? 0 : gravity === "bottom" ? ih - sh : (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
