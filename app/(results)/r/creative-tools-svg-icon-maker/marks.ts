/**
 * A mark is geometry only. It has no stroke, no cap, no radius of its own.
 * Those belong to the family, which is why editing the spec recuts every
 * punch at once. The types here are the local document; `system.ts` is the
 * metal they are struck in.
 */

export type Point = readonly [number, number];

export type LineMark = { id: string; kind: "line"; a: Point; b: Point };
export type PolyMark = { id: string; kind: "poly"; points: Point[] };
export type RectMark = { id: string; kind: "rect"; a: Point; b: Point };
export type CircleMark = { id: string; kind: "circle"; c: Point; r: number };
export type DotMark = { id: string; kind: "dot"; c: Point };

export type Mark = LineMark | PolyMark | RectMark | CircleMark | DotMark;

export type Cap = "butt" | "round" | "square";
export type Join = "miter" | "round" | "bevel";

export type Family = {
  weight: number;
  cap: Cap;
  join: Join;
  radius: number;
  optical: boolean;
};

export const DEFAULT_FAMILY: Family = {
  weight: 2,
  cap: "round",
  join: "round",
  radius: 1,
  optical: true,
};

export const WEIGHTS = [1, 1.5, 2, 2.5] as const;
export const RADII = [0, 1, 2, 3] as const;

export const GRID = 24;
export const SNAP = 1;

export type DrawOp = {
  key: string;
  d?: string;
  circle?: { cx: number; cy: number; r: number };
  strokeWidth: number;
  fill: "none" | "currentColor";
  cap: Cap;
  join: Join;
};

export function snap(n: number): number {
  return Math.round(n / SNAP) * SNAP;
}

export function clampGrid(n: number): number {
  return Math.max(0, Math.min(GRID, snap(n)));
}

export function same(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function n(v: number): string {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}

export function np(p: Point): string {
  return `${n(p[0])} ${n(p[1])}`;
}

function norm(a: Point, b: Point): Point | null {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const l = Math.hypot(dx, dy);
  if (l < 1e-6) return null;
  return [dx / l, dy / l];
}

/**
 * How diagonal a segment is: 0 on the axes, 1 at 45°. Used to fatten
 * strokes that would otherwise read thinner than their vertical neighbours.
 */
export function diagonalness(a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return 0;
  return Math.abs(Math.sin(2 * Math.atan2(dy, dx)));
}

export function strokeFor(a: Point, b: Point, family: Family): number {
  if (!family.optical) return family.weight;
  return family.weight * (1 + 0.16 * diagonalness(a, b));
}

function polyWeight(points: Point[], family: Family): number {
  if (!family.optical || points.length < 2) return family.weight;
  let diag = 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = dist(points[i], points[i + 1]);
    total += len;
    diag += len * diagonalness(points[i], points[i + 1]);
  }
  const mix = total === 0 ? 0 : diag / total;
  return family.weight * (1 + 0.16 * mix);
}

/**
 * Circle overshoot. A circle and a square of the same nominal size do not
 * look the same size — the circle reads smaller. Squares are left alone:
 * insetting them would break any mark that shares a corner with a rect.
 * Amounts are in grid units on a 24 body.
 */
export function opticalRadius(r: number, family: Family): number {
  if (!family.optical) return r;
  return r + 0.55;
}

function cornerFillet(
  prev: Point,
  curr: Point,
  next: Point,
  radius: number
): { a: Point; b: Point; r: number; sweep: 0 | 1 } | null {
  const v1 = norm(prev, curr);
  const v2 = norm(next, curr);
  if (!v1 || !v2) return null;
  const d1 = dist(prev, curr);
  const d2 = dist(next, curr);
  const r = Math.min(radius, d1 / 2, d2 / 2);
  if (r < 0.02) return null;
  const cross = v1[0] * v2[1] - v1[1] * v2[0];
  if (Math.abs(cross) < 1e-6) return null;
  const a: Point = [curr[0] + v1[0] * r, curr[1] + v1[1] * r];
  const b: Point = [curr[0] + v2[0] * r, curr[1] + v2[1] * r];
  return { a, b, r, sweep: cross < 0 ? 1 : 0 };
}

export function filletPoly(points: Point[], radius: number): string {
  if (points.length < 2) return "";
  if (radius < 0.02 || points.length === 2) {
    return `M ${np(points[0])}` + points.slice(1).map((p) => ` L ${np(p)}`).join("");
  }
  const parts: string[] = [`M ${np(points[0])}`];
  for (let i = 1; i < points.length - 1; i++) {
    const fillet = cornerFillet(points[i - 1], points[i], points[i + 1], radius);
    if (!fillet) {
      parts.push(`L ${np(points[i])}`);
      continue;
    }
    parts.push(`L ${np(fillet.a)}`);
    parts.push(
      `A ${n(fillet.r)} ${n(fillet.r)} 0 0 ${fillet.sweep} ${np(fillet.b)}`
    );
  }
  parts.push(`L ${np(points[points.length - 1])}`);
  return parts.join(" ");
}

export function roundedRect(a: Point, b: Point, radius: number): string {
  const x = Math.min(a[0], b[0]);
  const y = Math.min(a[1], b[1]);
  const w = Math.abs(b[0] - a[0]);
  const h = Math.abs(b[1] - a[1]);
  const r = Math.min(radius, w / 2, h / 2);
  if (r < 0.02) {
    return `M ${n(x)} ${n(y)} h ${n(w)} v ${n(h)} h ${n(-w)} Z`;
  }
  const hw = w - 2 * r;
  const hh = h - 2 * r;
  return [
    `M ${n(x + r)} ${n(y)}`,
    `h ${n(hw)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}`,
    `v ${n(hh)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}`,
    `h ${n(-hw)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}`,
    `v ${n(-hh)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}`,
    "Z",
  ].join(" ");
}

export function drawMark(mark: Mark, family: Family): DrawOp[] {
  switch (mark.kind) {
    case "line": {
      if (same(mark.a, mark.b)) return [];
      return [
        {
          key: mark.id,
          d: `M ${np(mark.a)} L ${np(mark.b)}`,
          strokeWidth: strokeFor(mark.a, mark.b, family),
          fill: "none",
          cap: family.cap,
          join: family.join,
        },
      ];
    }
    case "poly": {
      if (mark.points.length < 2) return [];
      return [
        {
          key: mark.id,
          d: filletPoly(mark.points, family.radius),
          strokeWidth: polyWeight(mark.points, family),
          fill: "none",
          cap: family.cap,
          join: family.join,
        },
      ];
    }
    case "rect": {
      if (same(mark.a, mark.b)) return [];
      return [
        {
          key: mark.id,
          d: roundedRect(mark.a, mark.b, family.radius),
          strokeWidth: family.weight,
          fill: "none",
          cap: family.cap,
          join: family.join,
        },
      ];
    }
    case "circle": {
      if (mark.r < 0.5) return [];
      return [
        {
          key: mark.id,
          circle: {
            cx: mark.c[0],
            cy: mark.c[1],
            r: opticalRadius(mark.r, family),
          },
          strokeWidth: family.weight,
          fill: "none",
          cap: family.cap,
          join: family.join,
        },
      ];
    }
    case "dot": {
      const r = Math.max(family.weight * 0.55, 0.55);
      return [
        {
          key: mark.id,
          circle: { cx: mark.c[0], cy: mark.c[1], r },
          strokeWidth: 0,
          fill: "currentColor",
          cap: family.cap,
          join: family.join,
        },
      ];
    }
  }
}

export function drawMarks(marks: Mark[], family: Family): DrawOp[] {
  return marks.flatMap((m) => drawMark(m, family));
}

function markLength(mark: Mark): number {
  switch (mark.kind) {
    case "line":
      return dist(mark.a, mark.b);
    case "poly": {
      let s = 0;
      for (let i = 0; i < mark.points.length - 1; i++) {
        s += dist(mark.points[i], mark.points[i + 1]);
      }
      return s;
    }
    case "rect":
      return 2 * (Math.abs(mark.b[0] - mark.a[0]) + Math.abs(mark.b[1] - mark.a[1]));
    case "circle":
      return 2 * Math.PI * mark.r;
    case "dot":
      return 2 * Math.PI * 0.6;
  }
}

/** Stroke-length × weight over the 24 body. A density, not a pixel count. */
export function density(marks: Mark[], weight: number): number {
  const ink = marks.reduce((s, m) => s + markLength(m), 0) * weight;
  return ink / (GRID * GRID);
}

export function markLabel(mark: Mark): string {
  switch (mark.kind) {
    case "line":
      return `line  ${mark.a.join(",")} → ${mark.b.join(",")}`;
    case "poly":
      return `poly  ${mark.points.map((p) => p.join(",")).join(" · ")}`;
    case "rect":
      return `rect  ${mark.a.join(",")} / ${mark.b.join(",")}`;
    case "circle":
      return `ring  ${mark.c.join(",")} r${mark.r}`;
    case "dot":
      return `dot   ${mark.c.join(",")}`;
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
