import { layer, type Layer, type Recipe } from "./types";

function recipe(id: string, name: string, note: string, layers: Layer[]): Recipe {
  return {
    id,
    name,
    note,
    layers: layers.map((L, i) => ({ ...L, id: `${id}-${i}` })),
  };
}

export const RECIPES: Recipe[] = [
  recipe(
    "portland",
    "Portland",
    "Warm limestone. A bed, a ridge, a grain, a kiln fade.",
    [
      layer({ kind: "fill", name: "Bed", colorA: "#c8b89c" }),
      layer({
        kind: "ridge",
        name: "Break",
        blend: "overlay",
        opacity: 0.82,
        colorA: "#efe4cc",
        colorB: "#4a3828",
        scale: 2.2,
        sharpness: 0.68,
        warp: 0.48,
        seed: 0.4,
      }),
      layer({
        kind: "grain",
        name: "Dust",
        blend: "overlay",
        opacity: 0.46,
        colorA: "#f0e6d4",
        colorB: "#3a3026",
        scale: 42,
        sharpness: 0.58,
        seed: 1.2,
      }),
      layer({
        kind: "wash",
        name: "Kiln",
        blend: "multiply",
        opacity: 0.2,
        colorA: "#8a7d68",
        colorB: "#d4c9b4",
        scale: 4.5,
        sharpness: 0.35,
      }),
    ],
  ),
  recipe(
    "linen",
    "Linen",
    "Flax ground, a warp and weft, then the nap.",
    [
      layer({ kind: "fill", name: "Flax", colorA: "#e6dcc8" }),
      layer({
        kind: "fiber",
        name: "Weave",
        blend: "multiply",
        opacity: 0.62,
        colorA: "#a89270",
        colorB: "#efe6d4",
        scale: 28,
        rotate: 3,
        sharpness: 0.45,
      }),
      layer({
        kind: "grain",
        name: "Nap",
        blend: "overlay",
        opacity: 0.16,
        colorA: "#d8cfc0",
        colorB: "#7a7060",
        scale: 64,
        sharpness: 0.38,
        seed: 2.1,
      }),
      layer({
        kind: "wash",
        name: "Selvedge",
        blend: "multiply",
        opacity: 0.14,
        colorA: "#b0a488",
        colorB: "#e6dcc8",
        scale: 5.2,
        sharpness: 0.3,
      }),
    ],
  ),
  recipe(
    "terrazzo",
    "Terrazzo",
    "A pale binder, two sizes of chip, then grit.",
    [
      layer({ kind: "fill", name: "Binder", colorA: "#e8ddd4" }),
      layer({
        kind: "cell",
        name: "Chip",
        blend: "normal",
        opacity: 0.78,
        colorA: "#c45a3a",
        colorB: "#e8ddd4",
        scale: 7.2,
        sharpness: 0.62,
        seed: 0.8,
      }),
      layer({
        kind: "cell",
        name: "Slate",
        blend: "multiply",
        opacity: 0.3,
        colorA: "#4a5560",
        colorB: "#e8ddd4",
        scale: 5.1,
        sharpness: 0.7,
        seed: 2.4,
      }),
      layer({
        kind: "speck",
        name: "Grit",
        blend: "multiply",
        opacity: 0.38,
        colorA: "#2c2a28",
        colorB: "#e8ddd4",
        scale: 22,
        sharpness: 0.35,
        seed: 1.6,
      }),
      layer({
        kind: "grain",
        name: "Polish",
        blend: "overlay",
        opacity: 0.1,
        colorA: "#f0e8e0",
        colorB: "#8a8078",
        scale: 70,
        sharpness: 0.3,
      }),
    ],
  ),
  recipe(
    "iron",
    "Iron",
    "Rolled plate, the brush of the mill, then soot.",
    [
      layer({ kind: "fill", name: "Plate", colorA: "#5c5a56" }),
      layer({
        kind: "band",
        name: "Brush",
        blend: "overlay",
        opacity: 0.58,
        colorA: "#9a9890",
        colorB: "#3e3c38",
        scale: 22,
        rotate: 8,
        sharpness: 0.35,
        warp: 0.4,
      }),
      layer({
        kind: "grain",
        name: "Scale",
        blend: "overlay",
        opacity: 0.28,
        colorA: "#888680",
        colorB: "#2a2824",
        scale: 80,
        sharpness: 0.42,
        seed: 0.9,
      }),
      layer({
        kind: "wash",
        name: "Soot",
        blend: "multiply",
        opacity: 0.24,
        colorA: "#2a2824",
        colorB: "#5c5a56",
        scale: 4.8,
        sharpness: 0.4,
      }),
    ],
  ),
  recipe(
    "calacatta",
    "Calacatta",
    "A white bed, a warm vein, a fainter gold, then dust.",
    [
      layer({ kind: "fill", name: "Bed", colorA: "#f3efe8" }),
      layer({
        kind: "vein",
        name: "Seam",
        blend: "multiply",
        opacity: 0.52,
        colorA: "#8a8478",
        colorB: "#f3efe8",
        scale: 2.8,
        rotate: 18,
        warp: 0.85,
        sharpness: 0.7,
        seed: 0.3,
      }),
      layer({
        kind: "vein",
        name: "Gold",
        blend: "softlight",
        opacity: 0.32,
        colorA: "#c4b49a",
        colorB: "#f3efe8",
        scale: 4.2,
        rotate: -12,
        warp: 0.6,
        sharpness: 0.62,
        seed: 3.1,
      }),
      layer({
        kind: "grain",
        name: "Dust",
        blend: "overlay",
        opacity: 0.08,
        colorA: "#ebe4d8",
        colorB: "#9a9286",
        scale: 70,
        sharpness: 0.28,
      }),
    ],
  ),
  recipe(
    "verdigris",
    "Verdigris",
    "Copper gone green. Patches, bright oxide, then slag.",
    [
      layer({ kind: "fill", name: "Plate", colorA: "#2d6a58" }),
      layer({
        kind: "drift",
        name: "Bloom",
        blend: "overlay",
        opacity: 0.55,
        colorA: "#4a9a7e",
        colorB: "#1a3d38",
        scale: 2.6,
        warp: 0.4,
        sharpness: 0.48,
        seed: 1.1,
      }),
      layer({
        kind: "speck",
        name: "Oxide",
        blend: "screen",
        opacity: 0.28,
        colorA: "#c47a3a",
        colorB: "#2d6a58",
        scale: 18,
        sharpness: 0.25,
        seed: 2.2,
      }),
      layer({
        kind: "ridge",
        name: "Slag",
        blend: "multiply",
        opacity: 0.22,
        colorA: "#1a3028",
        colorB: "#2d6a58",
        scale: 4,
        warp: 0.3,
        sharpness: 0.5,
        seed: 0.7,
      }),
      layer({
        kind: "grain",
        name: "Film",
        blend: "overlay",
        opacity: 0.14,
        colorA: "#5a8a78",
        colorB: "#143028",
        scale: 72,
        sharpness: 0.36,
      }),
    ],
  ),
  recipe(
    "newsprint",
    "Newsprint",
    "Stock, a faint fibre, ink flecks, the tooth of the sheet.",
    [
      layer({ kind: "fill", name: "Stock", colorA: "#e4dccb" }),
      layer({
        kind: "fiber",
        name: "Pulp",
        blend: "multiply",
        opacity: 0.22,
        colorA: "#c8c0ae",
        colorB: "#e4dccb",
        scale: 48,
        rotate: 0,
        sharpness: 0.32,
      }),
      layer({
        kind: "speck",
        name: "Ink",
        blend: "multiply",
        opacity: 0.32,
        colorA: "#2a2820",
        colorB: "#e4dccb",
        scale: 28,
        sharpness: 0.22,
        seed: 4.4,
      }),
      layer({
        kind: "grain",
        name: "Tooth",
        blend: "overlay",
        opacity: 0.24,
        colorA: "#d0c8b6",
        colorB: "#5a5448",
        scale: 90,
        sharpness: 0.4,
      }),
    ],
  ),
  recipe(
    "enamel",
    "Enamel",
    "A cream ground, a faint blush, the fade of the kiln.",
    [
      layer({ kind: "fill", name: "Slip", colorA: "#f0ebe0" }),
      layer({
        kind: "drift",
        name: "Blush",
        blend: "softlight",
        opacity: 0.28,
        colorA: "#e8d4c4",
        colorB: "#f0ebe0",
        scale: 1.8,
        warp: 0.2,
        sharpness: 0.4,
        seed: 0.5,
      }),
      layer({
        kind: "wash",
        name: "Kiln",
        blend: "multiply",
        opacity: 0.16,
        colorA: "#c4b8a4",
        colorB: "#f0ebe0",
        scale: 5,
        sharpness: 0.28,
      }),
      layer({
        kind: "grain",
        name: "Craze",
        blend: "overlay",
        opacity: 0.08,
        colorA: "#f7f2e8",
        colorB: "#8a8274",
        scale: 100,
        sharpness: 0.25,
      }),
    ],
  ),
];

export const DEFAULT_RECIPE = RECIPES[0]!;

export function applyRecipe(recipe: Recipe): Layer[] {
  return recipe.layers.map((L) => ({ ...L }));
}

const PALETTES: { ground: string; a: string; b: string }[] = [
  { ground: "#d4c9b4", a: "#8a7a64", b: "#cfc6b4" },
  { ground: "#e6dcc8", a: "#c4b49a", b: "#7a7060" },
  { ground: "#e8ddd4", a: "#c45a3a", b: "#4a5560" },
  { ground: "#5c5a56", a: "#9a9890", b: "#2a2824" },
  { ground: "#f3efe8", a: "#8a8478", b: "#c4b49a" },
  { ground: "#2d6a58", a: "#4a9a7e", b: "#c47a3a" },
  { ground: "#e4dccb", a: "#2a2820", b: "#c8c0ae" },
  { ground: "#f0ebe0", a: "#e8d4c4", b: "#c4b8a4" },
  { ground: "#7a3a28", a: "#c47a48", b: "#2a1810" },
  { ground: "#3d4a48", a: "#8aa09a", b: "#1c2422" },
];

function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function resample(seed = Date.now()): Layer[] {
  const rand = mulberry(seed);
  const pal = PALETTES[Math.floor(rand() * PALETTES.length)]!;
  const extra = 2 + Math.floor(rand() * 3);
  const kinds = ["ridge", "drift", "grain", "vein", "cell", "band", "fiber", "speck", "wash"] as const;
  const blends = ["multiply", "overlay", "softlight", "normal", "screen"] as const;
  const layers: Layer[] = [
    layer({ kind: "fill", name: "Bed", colorA: pal.ground }),
  ];
  for (let i = 0; i < extra; i++) {
    const kind = kinds[Math.floor(rand() * kinds.length)]!;
    layers.push(
      layer({
        kind,
        blend: blends[Math.floor(rand() * blends.length)]!,
        opacity: 0.16 + rand() * 0.55,
        colorA: rand() > 0.5 ? pal.a : pal.b,
        colorB: pal.ground,
        scale: kind === "grain" ? 40 + rand() * 60 : kind === "fiber" ? 20 + rand() * 40 : 1.6 + rand() * 12,
        rotate: (rand() - 0.5) * 40,
        seed: rand() * 6,
        sharpness: 0.25 + rand() * 0.5,
        warp: rand() * 0.7,
      }),
    );
  }
  return layers;
}

export function nudgeLayer(L: Layer, seed = Date.now()): Layer {
  const rand = mulberry(seed + L.seed * 1000);
  const walk = (v: number, span: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v + (rand() - 0.5) * span));
  return {
    ...L,
    scale: walk(L.scale, L.scale * 0.28 + 0.4, 0.4, 120),
    rotate: walk(L.rotate, 14, -180, 180),
    seed: walk(L.seed, 1.4, 0, 12),
    sharpness: walk(L.sharpness, 0.16, 0.05, 0.95),
    warp: walk(L.warp, 0.18, 0, 1),
    opacity: walk(L.opacity, 0.08, 0.06, 1),
  };
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "material";
}
