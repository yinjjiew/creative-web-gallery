/**
 * The two artifacts a person leaves with.
 *
 * The sheet is what you paste into Figma: every punch drawn as real paths on
 * one artboard, inked in a concrete colour, spaced on a 40-unit cell. The
 * sprite is what you drop into a codebase: `<symbol>` elements, `currentColor`,
 * 24-unit viewBoxes. Same geometry, two jobs.
 */

import {
  drawMarks,
  n,
  type Family,
  type Mark,
} from "./marks";

export type Punch = {
  id: string;
  name: string;
  marks: Mark[];
};

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "icon";
}

export function uniqueSlugs(punches: Punch[]): string[] {
  const seen = new Map<string, number>();
  return punches.map((p) => {
    const base = slug(p.name);
    const k = seen.get(base) ?? 0;
    seen.set(base, k + 1);
    return k === 0 ? base : `${base}-${k + 1}`;
  });
}

function opInner(op: ReturnType<typeof drawMarks>[number], stroke: string): string {
  const sw = n(op.strokeWidth);
  const common =
    `stroke="${op.fill === "currentColor" ? "none" : stroke}" ` +
    `stroke-width="${sw}" ` +
    `stroke-linecap="${op.cap}" ` +
    `stroke-linejoin="${op.join}" ` +
    `fill="${op.fill === "currentColor" ? stroke : "none"}"`;
  if (op.circle) {
    return `<circle cx="${n(op.circle.cx)}" cy="${n(op.circle.cy)}" r="${n(op.circle.r)}" ${common}/>`;
  }
  if (op.d) {
    return `<path d="${op.d}" ${common}/>`;
  }
  return "";
}

function punchInner(marks: Mark[], family: Family, stroke: string): string {
  return drawMarks(marks, family)
    .map((op) => opInner(op, stroke))
    .filter(Boolean)
    .join("\n    ");
}

export function specLine(family: Family): string {
  const cap =
    family.cap === "round" ? "round terminals" : family.cap === "square" ? "square terminals" : "flush terminals";
  const join =
    family.join === "round" ? "round joins" : family.join === "bevel" ? "bevelled joins" : "mitred joins";
  return `${family.weight} · ${cap} · ${join} · r${family.radius} · optical ${family.optical ? "on" : "off"}`;
}

export function emitPunch(marks: Mark[], family: Family, name: string): string {
  const inner = punchInner(marks, family, "currentColor");
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="24" height="24">`,
    `  <title>${escapeXml(name)}</title>`,
    `  ${inner}`,
    `</svg>`,
    ``,
  ].join("\n");
}

/**
 * A specimen sheet: titled, specced, icons on a grid. Designed to land in
 * Figma as editable vectors, not a flattened picture.
 */
export function emitSheet(punches: Punch[], family: Family): string {
  const ids = uniqueSlugs(punches);
  const cols = Math.min(6, Math.max(1, punches.length));
  const rows = Math.max(1, Math.ceil(punches.length / cols));
  const cell = 40;
  const pad = 16;
  const head = 28;
  const width = pad * 2 + cols * cell;
  const height = pad + head + rows * cell + 18;

  const groups = punches.map((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * cell + (cell - 24) / 2;
    const y = pad + head + row * cell + 4;
    const inner = punchInner(p.marks, family, "#1c1914");
    const label = escapeXml(ids[i] ?? slug(p.name));
    return [
      `  <g transform="translate(${n(x)} ${n(y)})">`,
      `    ${inner}`,
      `    <text x="12" y="32" text-anchor="middle" fill="#6e6858" font-size="4" font-family="ui-monospace, monospace">${label}</text>`,
      `  </g>`,
    ].join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 ${width} ${height}" width="${width * 3}" height="${height * 3}">`,
    `  <title>Stroke — ${punches.length} punches</title>`,
    `  <desc>${escapeXml(specLine(family))}. Vector paths, not a raster. Paste into Figma as editable strokes.</desc>`,
    `  <rect width="${width}" height="${height}" fill="#f6f1e4"/>`,
    `  <text x="${pad}" y="${pad + 10}" fill="#1c1914" font-size="8" font-family="ui-serif, Georgia, serif">Stroke</text>`,
    `  <text x="${pad}" y="${pad + 18}" fill="#6e6858" font-size="4.5" font-family="ui-monospace, monospace">${escapeXml(specLine(family))}</text>`,
    ...groups,
    `</svg>`,
    ``,
  ].join("\n");
}

/** A developer sprite: one symbol per punch, currentColor, 24 viewBox. */
export function emitSprite(punches: Punch[], family: Family): string {
  const ids = uniqueSlugs(punches);
  const symbols = punches.map((p, i) => {
    const id = ids[i] ?? slug(p.name);
    const inner = punchInner(p.marks, family, "currentColor");
    return `  <symbol id="${id}" viewBox="0 0 24 24">\n    ${inner}\n  </symbol>`;
  });

  const uses = ids.map((id, i) => {
    const x = (i % 8) * 32;
    const y = Math.floor(i / 8) * 32;
    return `  <use href="#${id}" x="${x}" y="${y}" width="24" height="24"/>`;
  });

  const rows = Math.max(1, Math.ceil(punches.length / 8));
  const w = Math.min(8, punches.length) * 32;
  const h = rows * 32;

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 ${w} ${h}" width="${w * 3}" height="${h * 3}">`,
    `  <title>Stroke sprite</title>`,
    `  <desc>${escapeXml(specLine(family))}. Reference a symbol by id, or style the svg with color.</desc>`,
    ...symbols,
    ...uses,
    `</svg>`,
    ``,
  ].join("\n");
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function downloadSvg(filename: string, text: string): void {
  const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
