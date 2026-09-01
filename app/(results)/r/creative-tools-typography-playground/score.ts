/**
 * An axis value is a function, not a number. The score is that function:
 * a polyline over a driver in [0, 1], sampled independently for each letter
 * after a phase offset. Time, pointer distance and scroll progress are the
 * same kind of input. The wave is one mechanism.
 */

export type AxisId = "wght" | "SOFT" | "WONK" | "opsz";
export type Driver = "time" | "pointer" | "scroll";

export type Knot = { x: number; y: number };

export type Axis = {
  id: AxisId;
  name: string;
  min: number;
  max: number;
  decimals: number;
  note: string;
};

export const AXIS_ORDER: AxisId[] = ["wght", "SOFT", "WONK", "opsz"];

export const AXES: Axis[] = [
  {
    id: "wght",
    name: "Weight",
    min: 100,
    max: 900,
    decimals: 0,
    note: "Hairline to black. The registered axis every variable face shares.",
  },
  {
    id: "SOFT",
    name: "Soft",
    min: 0,
    max: 100,
    decimals: 1,
    note: "Sharp cut to ink-spread. Fraunces’ own axis — not a blur.",
  },
  {
    id: "WONK",
    name: "Wonk",
    min: 0,
    max: 1,
    decimals: 2,
    note: "Optical terminal correction. The face treats it as a gate, so a curve here pops.",
  },
  {
    id: "opsz",
    name: "Optical size",
    min: 9,
    max: 144,
    decimals: 1,
    note: "Caption to display. Designed to track rendered size; here it is a material.",
  },
];

export const AXIS_BY_ID = new Map(AXES.map((axis) => [axis.id, axis]));

export const REST: Record<AxisId, number> = {
  wght: 320,
  SOFT: 0,
  WONK: 0.5,
  opsz: 144,
};

export type Piece = {
  id: string;
  title: string;
  line: string;
  driver: Driver;
  period: number;
  stagger: number;
  axis: AxisId;
  knots: Knot[];
  blurb: string;
};

export const PERIODS = [1, 2, 4, 8] as const;
export const STAGGERS = [0, 1 / 24, 1 / 12, 1 / 8, 1 / 6] as const;

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function wrap01(n: number): number {
  return ((n % 1) + 1) % 1;
}

/** Linear polyline. Honest: what you draw is what the letter gets. */
export function sampleCurve(knots: readonly Knot[], t: number): number {
  if (knots.length === 0) return 0.5;
  const x = clamp(t, 0, 1);
  const sorted = [...knots].sort((a, b) => a.x - b.x || a.y - b.y);
  if (x <= sorted[0].x) return clamp(sorted[0].y, 0, 1);
  const last = sorted[sorted.length - 1];
  if (x >= last.x) return clamp(last.y, 0, 1);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (x >= a.x && x <= b.x) {
      const span = b.x - a.x;
      const u = span === 0 ? 0 : (x - a.x) / span;
      return clamp(a.y + (b.y - a.y) * u, 0, 1);
    }
  }
  return clamp(last.y, 0, 1);
}

export function mapAxis(axis: Axis, y: number): number {
  return axis.min + (axis.max - axis.min) * clamp(y, 0, 1);
}

export function formatAxis(axis: Axis, value: number): string {
  return value.toFixed(axis.decimals);
}

export function settingsFor(axis: Axis, value: number): string {
  const values = { ...REST, [axis.id]: value };
  return AXIS_ORDER.map((id) => {
    const spec = AXIS_BY_ID.get(id)!;
    return `"${id}" ${formatAxis(spec, values[id])}`;
  }).join(", ");
}

export function driverAt(
  driver: Driver,
  clock: number,
  index: number,
  stagger: number,
  proximity: number
): number {
  if (driver === "pointer") return clamp(proximity, 0, 1);
  return wrap01(clock - index * stagger);
}

export function formulaOf(piece: {
  axis: AxisId;
  driver: Driver;
  stagger: number;
}): string {
  const axis = AXIS_BY_ID.get(piece.axis)!;
  const name = axis.id;
  if (piece.driver === "pointer") {
    return `${name} = curve( 1 − dist(pointer, glyph) / r )`;
  }
  const step = piece.stagger === 0 ? "t" : `t − ${formatStep(piece.stagger)}·i`;
  const inner = piece.driver === "scroll" ? step.replace("t", "scroll") : `fract(${step})`;
  return `${name} = curve( ${inner} )`;
}

function formatStep(stagger: number): string {
  if (stagger === 0) return "0";
  const den = Math.round(1 / stagger);
  return den > 0 && Math.abs(1 / den - stagger) < 1e-6 ? `1/${den}` : stagger.toFixed(3);
}

export function sineKnots(): Knot[] {
  return [
    { x: 0, y: 0.5 },
    { x: 0.25, y: 1 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0 },
    { x: 1, y: 0.5 },
  ];
}

export function riseKnots(): Knot[] {
  return [
    { x: 0, y: 0.08 },
    { x: 0.28, y: 0.12 },
    { x: 0.62, y: 0.78 },
    { x: 1, y: 1 },
  ];
}

export function pulseKnots(): Knot[] {
  return [
    { x: 0, y: 0 },
    { x: 0.32, y: 0 },
    { x: 0.4, y: 1 },
    { x: 0.56, y: 1 },
    { x: 0.64, y: 0 },
    { x: 1, y: 0 },
  ];
}

export function meltKnots(): Knot[] {
  return [
    { x: 0, y: 0 },
    { x: 0.22, y: 0.04 },
    { x: 0.55, y: 0.55 },
    { x: 0.82, y: 0.96 },
    { x: 1, y: 1 },
  ];
}

export const PIECES: Piece[] = [
  {
    id: "breath",
    title: "Breath",
    line: "the wave",
    driver: "time",
    period: 2,
    stagger: 1 / 12,
    axis: "wght",
    knots: sineKnots(),
    blurb: "Weight rides the clock. Each letter is a twelfth of a cycle behind the last.",
  },
  {
    id: "melt",
    title: "Melt",
    line: "hold still",
    driver: "pointer",
    period: 2,
    stagger: 0,
    axis: "SOFT",
    knots: meltKnots(),
    blurb: "Soft follows the hand. Distance from each glyph is the only input.",
  },
  {
    id: "flick",
    title: "Flick",
    line: "wonky",
    driver: "time",
    period: 1,
    stagger: 1 / 8,
    axis: "WONK",
    knots: pulseKnots(),
    blurb: "Wonk as a gate. The face snaps; the curve is a shutter, not a swell.",
  },
  {
    id: "near",
    title: "Near",
    line: "come closer",
    driver: "scroll",
    period: 4,
    stagger: 1 / 24,
    axis: "opsz",
    knots: riseKnots(),
    blurb: "Optical size on the scroll. Near the top it reads as a caption; at the end, a poster.",
  },
];

export const PIECE_BY_ID = new Map(PIECES.map((piece) => [piece.id, piece]));

export function clonePiece(piece: Piece): Piece {
  return {
    ...piece,
    knots: piece.knots.map((knot) => ({ ...knot })),
  };
}

export function staggerLabel(stagger: number): string {
  if (stagger === 0) return "together";
  if (Math.abs(stagger - 1 / 24) < 1e-6) return "a hair";
  if (Math.abs(stagger - 1 / 12) < 1e-6) return "a beat";
  if (Math.abs(stagger - 1 / 8) < 1e-6) return "a bar";
  if (Math.abs(stagger - 1 / 6) < 1e-6) return "a rest";
  return `${stagger.toFixed(3)} cycle`;
}

export function periodLabel(period: number): string {
  return `${period}s`;
}

export function driverLabel(driver: Driver): string {
  if (driver === "time") return "clock";
  if (driver === "pointer") return "pointer";
  return "scroll";
}
