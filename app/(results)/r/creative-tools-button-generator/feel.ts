/**
 * A feel recipe is the whole design. Appearance is not in here.
 * The numbers couple: mass and return set the natural frequency,
 * damping is a ratio of critical, detent lives on the commit line,
 * hold and busy durations stretch with travel and mass.
 */

export type Recipe = {
  /** Key travel in millimetres. Visual stroke and a slight hold stretch. */
  travel: number;
  /** Inertia. Higher = the plunger lags the finger. */
  mass: number;
  /** Damping ratio ζ. Below 1 overshoots; above 1 creeps. */
  damping: number;
  /** Return spring. Higher = snaps home. */
  stiffness: number;
  /** Stiction at rest. Force that must be beaten before motion starts. */
  preload: number;
  /** Hill on the commit line: resists, then snaps through. */
  detent: number;
  /** Travel fraction that fires the action and the click. */
  commit: number;
  /** Click fundamental, hertz. */
  pitch: number;
  /** Noise attack versus tonal body. */
  hardness: number;
  /** Click decay, seconds. */
  body: number;
};

export type Role = "momentary" | "latch" | "hold" | "busy" | "dead";

export const RANGES = {
  travel: { min: 1.2, max: 4.0, step: 0.05, unit: "mm" },
  mass: { min: 0.35, max: 2.4, step: 0.05, unit: "" },
  damping: { min: 0.16, max: 1.35, step: 0.01, unit: "ζ" },
  stiffness: { min: 0.45, max: 2.4, step: 0.05, unit: "" },
  preload: { min: 0, max: 0.58, step: 0.01, unit: "" },
  detent: { min: 0, max: 1, step: 0.01, unit: "" },
  commit: { min: 0.28, max: 0.92, step: 0.01, unit: "" },
  pitch: { min: 180, max: 2400, step: 10, unit: "Hz" },
  hardness: { min: 0.12, max: 1, step: 0.01, unit: "" },
  body: { min: 0.016, max: 0.28, step: 0.002, unit: "ms" },
} as const;

export type Dim = keyof Recipe;

export const DIMS: { id: Dim; label: string; hint: string }[] = [
  { id: "travel", label: "Travel", hint: "How far the stem moves" },
  { id: "mass", label: "Inertia", hint: "Lag behind the finger" },
  { id: "damping", label: "Damping", hint: "Settle versus overshoot" },
  { id: "stiffness", label: "Return", hint: "How eagerly it comes home" },
  { id: "preload", label: "Preload", hint: "Stiction before it gives" },
  { id: "detent", label: "Detent", hint: "Bump on the commit line" },
  { id: "commit", label: "Commit", hint: "Where the action fires" },
  { id: "pitch", label: "Pitch", hint: "Click fundamental" },
  { id: "hardness", label: "Hardness", hint: "Noise tick versus tone" },
  { id: "body", label: "Body", hint: "How long the click hangs" },
];

export type Preset = {
  id: string;
  name: string;
  note: string;
  recipe: Recipe;
};

export const PRESETS: Preset[] = [
  {
    id: "shutter",
    name: "Shutter",
    note: "Short throw, late fire, bright snap. A leaf shutter.",
    recipe: {
      travel: 1.55,
      mass: 0.45,
      damping: 0.4,
      stiffness: 1.9,
      preload: 0.4,
      detent: 0.18,
      commit: 0.8,
      pitch: 1520,
      hardness: 0.9,
      body: 0.026,
    },
  },
  {
    id: "buckle",
    name: "Buckle",
    note: "A tactile hill at mid-travel, then a sudden give.",
    recipe: {
      travel: 3.45,
      mass: 0.95,
      damping: 0.36,
      stiffness: 1.35,
      preload: 0.22,
      detent: 0.92,
      commit: 0.5,
      pitch: 640,
      hardness: 0.74,
      body: 0.052,
    },
  },
  {
    id: "toggle",
    name: "Toggle",
    note: "Long throw, heavy oil, low thunk. An aircraft switch.",
    recipe: {
      travel: 3.85,
      mass: 1.75,
      damping: 0.98,
      stiffness: 0.82,
      preload: 0.3,
      detent: 0.35,
      commit: 0.72,
      pitch: 230,
      hardness: 0.42,
      body: 0.17,
    },
  },
  {
    id: "mute",
    name: "Mute",
    note: "Overdamped, early fire, soft tick. A console silent.",
    recipe: {
      travel: 2.15,
      mass: 1.15,
      damping: 1.18,
      stiffness: 0.68,
      preload: 0.06,
      detent: 0.04,
      commit: 0.38,
      pitch: 360,
      hardness: 0.2,
      body: 0.088,
    },
  },
  {
    id: "pusher",
    name: "Pusher",
    note: "Tiny travel, high return, jewelled click. A watch stem.",
    recipe: {
      travel: 1.3,
      mass: 0.38,
      damping: 0.26,
      stiffness: 2.25,
      preload: 0.16,
      detent: 0.28,
      commit: 0.6,
      pitch: 2140,
      hardness: 0.96,
      body: 0.018,
    },
  },
];

export const DEFAULT_RECIPE: Recipe = PRESETS[0].recipe;

export function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}

export function clampRecipe(r: Recipe): Recipe {
  const out = { ...r };
  for (const id of Object.keys(RANGES) as Dim[]) {
    const spec = RANGES[id];
    out[id] = clamp(out[id], spec.min, spec.max);
  }
  return out;
}

export function travelPx(travel: number): number {
  return Math.round(travel * 28);
}

export function holdNeed(r: Recipe): number {
  return 0.3 + r.travel * 0.045;
}

export function busyNeed(r: Recipe): number {
  return 0.85 + r.mass * 0.18;
}

export function matchPreset(r: Recipe): Preset | null {
  for (const p of PRESETS) {
    let ok = true;
    for (const id of Object.keys(RANGES) as Dim[]) {
      if (Math.abs(r[id] - p.recipe[id]) > RANGES[id].step * 1.1) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return null;
}

export function formatDim(id: Dim, value: number): string {
  if (id === "body") return `${Math.round(value * 1000)} ms`;
  if (id === "pitch") return `${Math.round(value)} Hz`;
  if (id === "travel") return `${value.toFixed(2)} mm`;
  if (id === "commit") return `${Math.round(value * 100)}%`;
  if (id === "damping") return `${value.toFixed(2)} ζ`;
  return value.toFixed(2);
}

export type Coeffs = {
  k: number;
  m: number;
  c: number;
  preloadF: number;
};

/** Shared by the live bench and the pasted-out module. */
export function coeffs(r: Recipe): Coeffs {
  const k = 28 * r.stiffness;
  const m = 0.12 * r.mass;
  const c = 2 * r.damping * Math.sqrt(k * m);
  const preloadF = r.preload * k * 0.38;
  return { k, m, c, preloadF };
}

export function detentForce(x: number, r: Recipe, k: number): number {
  if (r.detent < 0.01) return 0;
  const d = x - r.commit;
  const w = 0.055;
  return r.detent * k * 0.2 * (d / (w * w)) * Math.exp(-(d * d) / (2 * w * w));
}
