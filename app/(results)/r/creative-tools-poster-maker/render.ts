/**
 * One draw path for the proof and the export. Regions are normalized; type
 * is fitted into them. Changing stock size changes how the copy wraps, not
 * how much the finished sheet is scaled.
 */

import { contrastRatio, type InkSet } from "./inks";
import {
  aspectOf,
  compose,
  liveRect,
  type Hierarchy,
  type Rect,
  type Regions,
  type SystemId,
} from "./systems";
import { drawCover, type Gravity } from "./treat";

export type Copy = {
  kicker: string;
  headline: string;
  dek: string;
  meta: string;
};

export type Fonts = {
  display: string;
  serif: string;
};

export type DrawJob = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  system: SystemId;
  hierarchy: Hierarchy;
  ink: InkSet;
  copy: Copy;
  fonts: Fonts;
  plate: CanvasImageSource | null;
  plateW: number;
  plateH: number;
  gravity: Gravity;
  showGrid: boolean;
};

export type Reading = {
  contrast: number;
  headFrac: number;
  holds: boolean;
  note: string;
};

function px(rect: Rect, w: number, h: number) {
  return {
    x: rect.x * w,
    y: rect.y * h,
    w: rect.w * w,
    h: rect.h * h,
  };
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxW || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxH: number,
  family: string,
  weight: string,
  minPx: number,
  maxPx: number,
  leading: number,
  style = "normal"
): { lines: string[]; size: number } {
  if (!text.trim() || maxW < 4 || maxH < 4) return { lines: [], size: minPx };
  let lo = minPx;
  let hi = maxPx;
  let best = { lines: wrap(ctx, text, maxW), size: minPx };
  for (let i = 0; i < 12; i += 1) {
    const size = (lo + hi) / 2;
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    const lines = wrap(ctx, text, maxW);
    const height = lines.length * size * leading;
    const wide = lines.some((line) => ctx.measureText(line).width > maxW + 1);
    if (height <= maxH && !wide && lines.length > 0) {
      best = { lines, size };
      lo = size;
    } else {
      hi = size;
    }
  }
  ctx.font = `${style} ${weight} ${best.size}px ${family}`;
  return { ...best, lines: wrap(ctx, text, maxW) };
}

function fillLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  size: number,
  leading: number,
  color: string,
  align: CanvasTextAlign = "left"
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  const lh = size * leading;
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], x, y + i * lh);
  }
}

function trackedKicker(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  size: number,
  family: string,
  color: string
) {
  const src = text.toUpperCase();
  ctx.font = `600 ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const tracking = size * 0.16;
  const widths = [...src].map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + tracking * Math.max(0, src.length - 1);
  const scale = total > maxW ? maxW / total : 1;
  let cursor = x;
  for (let i = 0; i < src.length; i += 1) {
    ctx.save();
    ctx.translate(cursor, y);
    ctx.scale(scale, 1);
    ctx.fillText(src[i], 0, 0);
    ctx.restore();
    cursor += (widths[i] + tracking) * scale;
  }
}

function paperGrain(ctx: CanvasRenderingContext2D, w: number, h: number, dark: boolean) {
  const n = Math.min(9000, Math.floor((w * h) / 70));
  ctx.save();
  for (let i = 0; i < n; i += 1) {
    const x = Math.abs(Math.sin(i * 12.9898 + 1.1) * 43758.5453) % 1;
    const y = Math.abs(Math.sin(i * 78.233 + 2.3) * 43758.5453) % 1;
    const a = 0.03 + (Math.abs(Math.sin(i * 4.13)) % 1) * 0.055;
    ctx.fillStyle = dark ? `rgba(255,255,255,${a})` : `rgba(18,14,10,${a})`;
    ctx.fillRect(x * w, y * h, 1, 1);
  }
  ctx.restore();
}

export function drawPoster(job: DrawJob): Reading {
  const { ctx, w, h, ink, copy, fonts } = job;
  const aspect = aspectOf(w, h);
  const regions = compose(job.system, job.hierarchy, aspect);
  const paperDark = contrastRatio(ink.ink, "#000") < contrastRatio(ink.paper, "#000");

  ctx.save();
  ctx.fillStyle = ink.paper;
  ctx.fillRect(0, 0, w, h);

  const plate = px(regions.plate, w, h);
  if (job.plate && plate.w > 2 && plate.h > 2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(plate.x, plate.y, plate.w, plate.h);
    ctx.clip();
    drawCover(
      ctx,
      job.plate,
      job.plateW,
      job.plateH,
      plate.x,
      plate.y,
      plate.w,
      plate.h,
      job.gravity
    );
    ctx.restore();
  }

  if (regions.veil && regions.ground !== "paper") {
    const veil = px(regions.veil, w, h);
    ctx.fillStyle = ink.paper;
    ctx.globalAlpha = 0.88;
    ctx.fillRect(veil.x, veil.y, veil.w, veil.h);
    ctx.globalAlpha = 1;
  }

  const short = Math.min(w, h);
  const typeColor = ink.ink;
  const kickerColor = ink.accent;

  for (const rule of regions.rules) {
    ctx.strokeStyle = rule.weight === "spot" ? ink.accent : ink.ink;
    ctx.globalAlpha = rule.weight === "hair" ? 0.55 : 1;
    ctx.lineWidth =
      rule.weight === "bar"
        ? Math.max(2, short * 0.012)
        : rule.weight === "spot"
          ? Math.max(2, short * 0.006)
          : Math.max(1, short * 0.0022);
    ctx.beginPath();
    ctx.moveTo(rule.x1 * w, rule.y1 * h);
    ctx.lineTo(rule.x2 * w, rule.y2 * h);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (liveRect(regions.kicker) && copy.kicker.trim()) {
    const r = px(regions.kicker, w, h);
    const size = Math.min(r.h * 0.7, short * 0.028);
    trackedKicker(
      ctx,
      copy.kicker,
      r.x,
      r.y + r.h * 0.15,
      r.w,
      Math.max(8, size),
      fonts.display,
      kickerColor
    );
  }

  let headSize = short * 0.08;
  if (liveRect(regions.headline) && copy.headline.trim()) {
    const r = px(regions.headline, w, h);
    const upper = job.system === "banner" || job.hierarchy === "name";
    const text = upper ? copy.headline.toUpperCase() : copy.headline;
    const max = Math.min(r.h * 0.72, short * (job.hierarchy === "name" ? 0.22 : 0.14));
    const min = Math.max(10, short * 0.028);
    const fitted = fit(
      ctx,
      text,
      r.w,
      r.h,
      fonts.display,
      "800",
      min,
      max,
      job.system === "banner" ? 0.88 : 0.92
    );
    headSize = fitted.size;
    ctx.font = `800 ${fitted.size}px ${fonts.display}`;
    fillLines(ctx, fitted.lines, r.x, r.y, fitted.size, job.system === "banner" ? 0.88 : 0.92, typeColor);
  }

  if (liveRect(regions.dek) && copy.dek.trim()) {
    const r = px(regions.dek, w, h);
    const fitted = fit(
      ctx,
      copy.dek,
      r.w,
      r.h,
      fonts.serif,
      "400",
      Math.max(8, short * 0.018),
      Math.min(r.h * 0.4, short * 0.042),
      1.28,
      "italic"
    );
    ctx.font = `italic 400 ${fitted.size}px ${fonts.serif}`;
    fillLines(ctx, fitted.lines, r.x, r.y, fitted.size, 1.28, typeColor);
  }

  if (liveRect(regions.meta) && copy.meta.trim()) {
    const r = px(regions.meta, w, h);
    if (job.hierarchy === "fact") {
      const parts = copy.meta.split("·").map((p) => p.trim()).filter(Boolean);
      const lead = parts[0] ?? copy.meta;
      const rest = parts.slice(1).join("  ·  ");
      const leadFit = fit(
        ctx,
        lead.toUpperCase(),
        r.w,
        r.h * (rest ? 0.72 : 1),
        fonts.display,
        "800",
        Math.max(12, short * 0.04),
        Math.min(r.h * 0.7, short * 0.2),
        0.9
      );
      ctx.font = `800 ${leadFit.size}px ${fonts.display}`;
      fillLines(ctx, leadFit.lines, r.x, r.y, leadFit.size, 0.9, typeColor);
      if (rest) {
        const y = r.y + leadFit.lines.length * leadFit.size * 0.95;
        const sub = fit(
          ctx,
          rest,
          r.w,
          Math.max(8, r.h - (y - r.y)),
          fonts.display,
          "600",
          8,
          Math.min(r.h * 0.2, short * 0.032),
          1.15
        );
        ctx.font = `600 ${sub.size}px ${fonts.display}`;
        fillLines(ctx, sub.lines, r.x, y, sub.size, 1.15, typeColor);
      }
    } else {
      const fitted = fit(
        ctx,
        copy.meta,
        r.w,
        r.h,
        fonts.display,
        "600",
        Math.max(8, short * 0.016),
        Math.min(r.h * 0.7, short * 0.028),
        1.15
      );
      ctx.font = `600 ${fitted.size}px ${fonts.display}`;
      fillLines(ctx, fitted.lines, r.x, r.y + r.h * 0.1, fitted.size, 1.15, typeColor);
    }
  }

  paperGrain(ctx, w, h, paperDark);

  if (job.showGrid) {
    drawGrid(ctx, w, h, regions, ink);
  }

  ctx.restore();

  const contrast = contrastRatio(ink.ink, ink.paper);
  const headFrac = headSize / short;
  const holds = contrast >= 3 && headFrac >= 0.07;
  const note = !copy.headline.trim()
    ? "No title set."
    : contrast < 3
      ? "Type and stock are too close. Change inks."
      : holds
        ? "Title holds from across a room."
        : "Legible up close. Banner or Name will carry further.";

  return { contrast, headFrac, holds, note };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  regions: Regions,
  ink: InkSet
) {
  ctx.save();
  ctx.strokeStyle = ink.accent;
  ctx.fillStyle = ink.accent;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0016);
  ctx.font = `600 ${Math.max(9, Math.min(w, h) * 0.018)}px sans-serif`;
  ctx.textBaseline = "top";
  const named: [string, Rect][] = [
    ["PLATE", regions.plate],
    ["KICK", regions.kicker],
    ["HEAD", regions.headline],
    ["DEK", regions.dek],
    ["META", regions.meta],
  ];
  for (const [label, rect] of named) {
    if (!liveRect(rect)) continue;
    const r = px(rect, w, h);
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.globalAlpha = 0.95;
    ctx.fillText(label, r.x + 4, r.y + 4);
    ctx.globalAlpha = 0.7;
  }
  ctx.restore();
}

export function fileStem(copy: Copy, formatId: string, system: SystemId): string {
  const title =
    copy.headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "untitled";
  return `signal-${title}-${system}-${formatId}`;
}
