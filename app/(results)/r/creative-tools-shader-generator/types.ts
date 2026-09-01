export const KINDS = [
  "fill",
  "drift",
  "grain",
  "vein",
  "cell",
  "band",
  "fiber",
  "speck",
  "ridge",
  "wash",
] as const;

export type Kind = (typeof KINDS)[number];

export const BLENDS = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "softlight",
  "add",
  "subtract",
  "burn",
  "dodge",
  "difference",
] as const;

export type Blend = (typeof BLENDS)[number];

export type Layer = {
  id: string;
  name: string;
  kind: Kind;
  blend: Blend;
  opacity: number;
  visible: boolean;
  clip: boolean;
  invert: boolean;
  colorA: string;
  colorB: string;
  scale: number;
  rotate: number;
  seed: number;
  sharpness: number;
  warp: number;
};

export type Recipe = {
  id: string;
  name: string;
  note: string;
  layers: Layer[];
};

export const KIND_LABEL: Record<Kind, string> = {
  fill: "Ground",
  drift: "Drift",
  grain: "Grain",
  vein: "Vein",
  cell: "Cell",
  band: "Band",
  fiber: "Fiber",
  speck: "Speck",
  ridge: "Ridge",
  wash: "Wash",
};

export const KIND_HINT: Record<Kind, string> = {
  fill: "A flat pigment. The bed everything else sits on.",
  drift: "Soft fractal sediment. Clouds, staining, uneven ground.",
  grain: "Fine film grain. Resolution-independent.",
  vein: "Domain-warped marble. The warp is the geology.",
  cell: "Worley cells. Terrazzo chips, cracked glaze.",
  band: "Directional stripes. Brush, carded wool, rolled metal.",
  fiber: "A warp and a weft. Linen, canvas, newsprint.",
  speck: "Sparse flecks. Grit, ink, oxide.",
  ridge: "Ridged noise. Broken stone, bark, slag.",
  wash: "A soft falloff from the centre. Vignette, kiln fade.",
};

export const BLEND_LABEL: Record<Blend, string> = {
  normal: "Normal",
  multiply: "Multiply",
  screen: "Screen",
  overlay: "Overlay",
  softlight: "Soft light",
  add: "Add",
  subtract: "Subtract",
  burn: "Color burn",
  dodge: "Color dodge",
  difference: "Difference",
};

export const KIND_PARAMS: Record<Kind, (keyof Layer)[]> = {
  fill: ["colorA"],
  drift: ["colorA", "colorB", "scale", "seed", "sharpness", "warp"],
  grain: ["colorA", "colorB", "scale", "seed", "sharpness"],
  vein: ["colorA", "colorB", "scale", "rotate", "seed", "sharpness", "warp"],
  cell: ["colorA", "colorB", "scale", "seed", "sharpness"],
  band: ["colorA", "colorB", "scale", "rotate", "sharpness", "warp"],
  fiber: ["colorA", "colorB", "scale", "rotate", "sharpness"],
  speck: ["colorA", "colorB", "scale", "seed", "sharpness"],
  ridge: ["colorA", "colorB", "scale", "seed", "sharpness", "warp"],
  wash: ["colorA", "colorB", "scale", "sharpness"],
};

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `l${Math.random().toString(36).slice(2, 10)}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full.padEnd(6, "0").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function glslFloat(n: number): string {
  if (!Number.isFinite(n)) return "0.0";
  const s = n.toFixed(4);
  return s.includes(".") ? s : `${s}.0`;
}

export function glslVec3(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `vec3(${glslFloat(r)}, ${glslFloat(g)}, ${glslFloat(b)})`;
}

export function layer(partial: Partial<Layer> & Pick<Layer, "kind">): Layer {
  return {
    id: uid(),
    name: KIND_LABEL[partial.kind],
    blend: "normal",
    opacity: 1,
    visible: true,
    clip: false,
    invert: false,
    colorA: "#c8bda8",
    colorB: "#5a5348",
    scale: 4,
    rotate: 0,
    seed: 0,
    sharpness: 0.45,
    warp: 0.25,
    ...partial,
  };
}
