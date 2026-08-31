/**
 * The press.
 *
 * One pass per plate, in plate order, exactly like a Riso:
 *
 *   1. Paper. Stock colour, then two scales of grain — blotch and tooth.
 *   2. For each plate: render its coverage field, screen it into a dot pattern
 *      at that plate's angle, and lay the ink down. Multiply inks tint the
 *      paper and each other; opaque inks (white, metallic) sit on top.
 *   3. Finish. A little tooth back over the ink, because paper texture reads
 *      through a printed film.
 *
 * Resolution independence is deliberate: the coverage field is always rendered
 * at a fixed reference size and sampled, while the dots themselves are drawn at
 * the real output size. So a 320px preview and a 3024px export are the same
 * composition with the same screen — the export is not an upscale, and the
 * preview is not a lie.
 */
import { toFrac, furnitureFor, type Device } from "./devices";
import { PLATE_ANGLES, type Ink, type Palette } from "./inks";
import { Rng, fbm, hash2, hashSeed } from "./rng";
import { buildScore, type Frame, type ScoreId } from "./scores";

export type Recipe = {
  edition: string;
  score: ScoreId;
  palette: string;
  /** 0–100. Total film laid down. */
  weight: number;
  /** Screen ruling, in dot rows across the sheet diagonal. */
  ruling: number;
  /** Misregistration between plates, in tenths of a millimetre of paper. */
  slip: number;
  /** 0–100. Paper grain. */
  grain: number;
  /** Hold ink back where the OS puts the clock and the dock. */
  quiet: boolean;
  /** Plate indices switched off at the press. */
  hidden: number[];
  device: string;
};

const TAU = Math.PI * 2;
const REF_LONG = 1500;

export type PressJob = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  recipe: Recipe;
  palette: Palette;
  device: Device;
  /** Render only the first n plates. Used for the plate-by-plate reveal. */
  plateLimit?: number;
};

/* ------------------------------------------------------------------ paper -- */

type Tile = HTMLCanvasElement;
const tiles = new Map<string, Tile>();

function periodicNoise(x: number, y: number, period: number, seed: number): number {
  const wrap = (v: number) => ((v % period) + period) % period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = x - xi;
  const ty = y - yi;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash2(wrap(xi), wrap(yi), seed);
  const b = hash2(wrap(xi + 1), wrap(yi), seed);
  const c = hash2(wrap(xi), wrap(yi + 1), seed);
  const d = hash2(wrap(xi + 1), wrap(yi + 1), seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

function tile(key: string, build: (data: Uint8ClampedArray, size: number) => void): Tile {
  const cached = tiles.get(key);
  if (cached) return cached;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(size, size);
    build(img.data, size);
    ctx.putImageData(img, 0, 0);
  }
  tiles.set(key, canvas);
  return canvas;
}

function blotchTile(light: boolean): Tile {
  return tile(`blotch-${light ? "l" : "d"}`, (data, size) => {
    const seed = light ? 9931 : 4177;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const u = (x / size) * 6;
        const v = (y / size) * 6;
        let n = 0;
        n += periodicNoise(u, v, 6, seed) * 0.6;
        n += periodicNoise(u * 2, v * 2, 12, seed + 71) * 0.3;
        n += periodicNoise(u * 4, v * 4, 24, seed + 143) * 0.1;
        const a = Math.pow(Math.max(0, n), 2.1);
        const i = (y * size + x) * 4;
        const c = light ? 255 : 0;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = Math.round(a * 255);
      }
    }
  });
}

function toothTile(light: boolean): Tile {
  return tile(`tooth-${light ? "l" : "d"}`, (data, size) => {
    const seed = light ? 2207 : 8123;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const r = hash2(x, y, seed);
        const i = (y * size + x) * 4;
        const c = light ? 255 : 0;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = r > 0.55 ? Math.round(Math.pow((r - 0.55) / 0.45, 1.4) * 255) : 0;
      }
    }
  });
}

function layTile(
  ctx: CanvasRenderingContext2D,
  t: Tile,
  w: number,
  h: number,
  scale: number,
  alpha: number
) {
  if (alpha <= 0.002) return;
  const pattern = ctx.createPattern(t, "repeat");
  if (!pattern) return;
  pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* --------------------------------------------------------------- screening -- */

function bilinear(d: Uint8ClampedArray, dw: number, dh: number, fx: number, fy: number): number {
  const x = Math.min(dw - 1, Math.max(0, fx * dw - 0.5));
  const y = Math.min(dh - 1, Math.max(0, fy * dh - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(dw - 1, x0 + 1);
  const y1 = Math.min(dh - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const i00 = (y0 * dw + x0) * 4;
  const i10 = (y0 * dw + x1) * 4;
  const i01 = (y1 * dw + x0) * 4;
  const i11 = (y1 * dw + x1) * 4;
  const a = d[i00] + (d[i10] - d[i00]) * tx;
  const b = d[i01] + (d[i11] - d[i01]) * tx;
  return a + (b - a) * ty;
}

/**
 * Dot radius for a given coverage, as a fraction of the cell pitch.
 *
 * Below 78.5% the dots do not touch, so area is πr². Above it they merge and
 * the growth has to slow down, reaching 0.707 — the radius that fills a square
 * cell completely — at full coverage. The 1.06 is dot gain: ink spreads on
 * contact, and midtones always print heavier than the file says.
 */
function radiusForCoverage(c: number): number {
  const g = Math.min(1, c * 1.06);
  if (g <= 0.7854) return Math.sqrt(g / Math.PI);
  const t = (g - 0.7854) / 0.2146;
  return 0.5 + 0.2071 * Math.pow(t, 0.7);
}

function screen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dens: Uint8ClampedArray,
  dw: number,
  dh: number,
  pitch: number,
  angleDeg: number,
  ink: Ink,
  seed: number
) {
  const th = (angleDeg * Math.PI) / 180;
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const cx = w / 2;
  const cy = h / 2;
  const reach = Math.hypot(w, h) / 2 + pitch * 2;
  const n = Math.ceil(reach / pitch);
  const cw = pitch / w;
  const ch = pitch / h;
  const jitter = pitch * 0.07;
  const aspect = h / w;

  ctx.save();
  ctx.globalCompositeOperation = ink.mode === "multiply" ? "multiply" : "source-over";
  ctx.globalAlpha = ink.alpha;
  ctx.fillStyle = ink.hex;
  ctx.beginPath();

  for (let iv = -n; iv <= n; iv += 1) {
    const v = iv * pitch;
    for (let iu = -n; iu <= n; iu += 1) {
      const u = iu * pitch;
      const x = cx + u * cs - v * sn;
      if (x < -pitch || x > w + pitch) continue;
      const y = cy + u * sn + v * cs;
      if (y < -pitch || y > h + pitch) continue;

      const fx = x / w;
      const fy = y / h;
      // Five taps across the cell: a centre sample would drop hairlines at a
      // coarse ruling, which is the one thing a screen must not do.
      let sum = bilinear(dens, dw, dh, fx, fy);
      sum += bilinear(dens, dw, dh, fx - cw * 0.34, fy - ch * 0.34);
      sum += bilinear(dens, dw, dh, fx + cw * 0.34, fy - ch * 0.34);
      sum += bilinear(dens, dw, dh, fx - cw * 0.34, fy + ch * 0.34);
      sum += bilinear(dens, dw, dh, fx + cw * 0.34, fy + ch * 0.34);
      let c = sum / 1275;
      if (c <= 0.004) continue;

      // Uneven inking across the drum, plus the odd missed dot.
      c *= 0.9 + 0.2 * fbm(fx * 4.5, fy * 4.5 * aspect, seed, 2);
      if (hash2(iu, iv, seed) < 0.0035) continue;

      const r = radiusForCoverage(c) * pitch;
      if (r < 0.16) continue;
      const jx = (hash2(iu, iv, seed + 7717) - 0.5) * jitter;
      const jy = (hash2(iu, iv, seed + 3313) - 0.5) * jitter;
      ctx.moveTo(x + jx + r, y + jy);
      ctx.arc(x + jx, y + jy, r, 0, TAU);
    }
  }

  ctx.fill();
  ctx.restore();
}

/* -------------------------------------------------------------------- job -- */

function attenuate(
  ctx: CanvasRenderingContext2D,
  dw: number,
  dh: number,
  keep: { top: number; bottom: number }
) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const top = Math.max(1, keep.top * dh * 1.45);
  let g = ctx.createLinearGradient(0, 0, 0, top);
  g.addColorStop(0, "rgba(0,0,0,0.66)");
  g.addColorStop(0.55, "rgba(0,0,0,0.3)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, dw + 2, top + 1);

  const bottom = Math.max(1, keep.bottom * dh * 1.5);
  g = ctx.createLinearGradient(0, dh, 0, dh - bottom);
  g.addColorStop(0, "rgba(0,0,0,0.58)");
  g.addColorStop(0.5, "rgba(0,0,0,0.26)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-1, dh - bottom, dw + 2, bottom + 2);
  ctx.restore();
}

export function plateSlip(recipe: Recipe, index: number, plates: number) {
  const rng = new Rng(hashSeed(`${recipe.edition}|slip|${index}`));
  if (index === 0 || recipe.slip === 0) return { dx: 0, dy: 0, rot: 0, mm: 0 };
  const mm = (recipe.slip / 10) * (0.55 + (0.45 * index) / Math.max(1, plates - 1));
  const dir = rng.range(0, TAU);
  return {
    dx: Math.cos(dir) * mm,
    dy: Math.sin(dir) * mm,
    rot: (rng.next() - 0.5) * mm * 0.0026,
    mm,
  };
}

export function plateAngle(index: number) {
  return PLATE_ANGLES[index % PLATE_ANGLES.length];
}

/**
 * The press run as a generator, so the same code can print in one blocking
 * call (preview) or yield between plates (export progress, plate reveal).
 */
export function* pressRun(job: PressJob): Generator<string> {
  const { ctx, w, h, recipe, palette, device } = job;
  const grain = recipe.grain / 100;
  const dark = !!palette.stock.dark;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.stock.hex;
  ctx.fillRect(0, 0, w, h);

  const blotchScale = Math.max(0.35, w / 900);
  layTile(ctx, blotchTile(false), w, h, blotchScale, (dark ? 0.2 : 0.13) * grain);
  layTile(ctx, blotchTile(true), w, h, blotchScale * 1.31, (dark ? 0.17 : 0.09) * grain);
  const toothScale = Math.max(0.5, w / 1600);
  layTile(ctx, toothTile(false), w, h, toothScale, (dark ? 0.1 : 0.08) * grain);
  layTile(ctx, toothTile(true), w, h, toothScale * 1.7, (dark ? 0.12 : 0.05) * grain);
  yield "paper";

  const plates = palette.inks.length;
  const long = Math.max(w, h);
  const dw = Math.max(64, Math.round((REF_LONG * w) / long));
  const dh = Math.max(64, Math.round((REF_LONG * h) / long));
  const dDiag = Math.hypot(dw, dh);

  const density = document.createElement("canvas");
  density.width = dw;
  density.height = dh;
  const dctx = density.getContext("2d", { willReadFrequently: true });
  if (!dctx) return;

  const frame: Frame = {
    w: dw,
    h: dh,
    unit: Math.min(dw, dh),
    diag: dDiag,
    portrait: h >= w,
    keepTop: 0,
    keepBottom: 0,
  };
  const furniture = furnitureFor(device);
  const clock = toFrac(furniture.clock.box, device);
  const dock = toFrac(furniture.dock.box, device);
  frame.keepTop = clock.y + clock.h;
  frame.keepBottom = 1 - dock.y;

  const seed = hashSeed(`${recipe.edition}|${recipe.score}|${plates}`);
  const draws = buildScore(recipe.score, seed, frame, plates, recipe.weight / 100);
  const pitch = Math.hypot(w, h) / recipe.ruling;
  const limit = job.plateLimit ?? plates;

  for (let i = 0; i < plates && i < limit; i += 1) {
    if (recipe.hidden.includes(i)) {
      yield `plate ${i + 1}`;
      continue;
    }
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.globalCompositeOperation = "source-over";
    dctx.globalAlpha = 1;
    dctx.fillStyle = "#000";
    dctx.fillRect(0, 0, dw, dh);

    const slip = plateSlip(recipe, i, plates);
    dctx.save();
    dctx.translate(dw / 2 + slip.dx * dDiag * 0.0028, dh / 2 + slip.dy * dDiag * 0.0028);
    dctx.rotate(slip.rot);
    dctx.translate(-dw / 2, -dh / 2);
    draws[i](dctx);
    dctx.restore();

    if (recipe.quiet) attenuate(dctx, dw, dh, { top: frame.keepTop, bottom: frame.keepBottom });

    const data = dctx.getImageData(0, 0, dw, dh).data;
    screen(ctx, w, h, data, dw, dh, pitch, plateAngle(i), palette.inks[i], seed + i * 977);
    yield `plate ${i + 1}`;
  }

  layTile(ctx, toothTile(false), w, h, toothScale, (dark ? 0.05 : 0.045) * grain);
  layTile(ctx, toothTile(true), w, h, toothScale * 2.3, 0.03 * grain);
  yield "done";
}

/** The preview: pull the generator to completion in one blocking pass. */
export function press(job: PressJob): void {
  const run = pressRun(job);
  let step = run.next();
  while (!step.done) step = run.next();
}

export async function pressAsync(job: PressJob, onStep: (label: string) => void): Promise<void> {
  for (const label of pressRun(job)) {
    onStep(label);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });
  }
}
