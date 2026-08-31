/**
 * Ink and paper.
 *
 * Hex values are approximations of Riso drum inks as they print on white stock,
 * read off published Z-type swatch charts — a screen can only ever approximate
 * a fluorescent pigment, so these are colour targets rather than measurements.
 *
 * The important part is the behaviour, not the hex. A Riso drum lays a
 * semi-transparent film, so two plates that overlap MULTIPLY: pink over blue is
 * a deep aubergine, not pink. `multiply` inks do exactly that. Dark stocks are
 * printed with the opaque inks (white, metallic), which sit on top of the paper
 * instead of tinting it, so those are composited normally with a little alpha
 * left over for the paper grain to read through.
 */

export type InkMode = "multiply" | "opaque";

export type Ink = {
  name: string;
  hex: string;
  /** Film opacity of one pass of this drum. */
  alpha: number;
  mode: InkMode;
};

export type Stock = {
  name: string;
  hex: string;
  /** Dark stocks flip the furniture overlays and the grain balance. */
  dark?: boolean;
};

export type Palette = {
  id: string;
  name: string;
  note: string;
  stock: Stock;
  inks: Ink[];
};

const multiply = (name: string, hex: string, alpha = 0.9): Ink => ({
  name,
  hex,
  alpha,
  mode: "multiply",
});

const opaque = (name: string, hex: string, alpha = 0.92): Ink => ({
  name,
  hex,
  alpha,
  mode: "opaque",
});

export const PALETTES: Palette[] = [
  {
    id: "kiosk",
    name: "Kiosk",
    note: "Fluorescent pink over federal blue. The loudest pairing the press owns.",
    stock: { name: "Bright White", hex: "#FBFAF5" },
    inks: [multiply("Fluorescent Pink", "#FF48B0", 0.94), multiply("Federal Blue", "#3D5588", 0.9)],
  },
  {
    id: "field-guide",
    name: "Field Guide",
    note: "Green and brown on natural. Quiet enough to live behind a full icon grid.",
    stock: { name: "Natural", hex: "#F1E9D5" },
    inks: [multiply("Green", "#00A95C", 0.88), multiply("Brown", "#925F52", 0.9)],
  },
  {
    id: "orchard",
    name: "Orchard",
    note: "Sunflower, red and a green third pass. Warm, high-key, three plates.",
    stock: { name: "Cream", hex: "#F7F0DE" },
    inks: [
      multiply("Sunflower", "#FFB511", 0.92),
      multiply("Bright Red", "#F15060", 0.88),
      multiply("Green", "#00A95C", 0.8),
    ],
  },
  {
    id: "graphite",
    name: "Graphite",
    note: "Black and light grey on fog. The safest thing to put behind small type.",
    stock: { name: "Fog", hex: "#E4E2D9" },
    inks: [multiply("Black", "#17171A", 0.92), multiply("Light Grey", "#88898A", 0.85)],
  },
  {
    id: "tide",
    name: "Tide",
    note: "Teal under aqua. Analogous, cool, almost nothing to argue with.",
    stock: { name: "Cool White", hex: "#EDF1EF" },
    inks: [multiply("Teal", "#00838A", 0.9), multiply("Aqua", "#5EC8E5", 0.86)],
  },
  {
    id: "dusk",
    name: "Dusk",
    note: "Purple and orange on newsprint. Complements, held apart by dot angle.",
    stock: { name: "Newsprint", hex: "#E9E3D3" },
    inks: [multiply("Purple", "#765BA7", 0.9), multiply("Orange", "#FF6C2F", 0.86)],
  },
  {
    id: "night-press",
    name: "Night Press",
    note: "Opaque white and fluorescent pink on charcoal card. Dark, and legible.",
    stock: { name: "Charcoal", hex: "#211F1E", dark: true },
    inks: [opaque("Opaque White", "#F3F0E4", 0.9), opaque("Fluorescent Pink", "#FF48B0", 0.82)],
  },
  {
    id: "late-edition",
    name: "Late Edition",
    note: "Metallic gold and pale aqua on ink blue. For a lock screen at night.",
    stock: { name: "Ink Blue", hex: "#182231", dark: true },
    inks: [opaque("Metallic Gold", "#C9A75C", 0.9), opaque("Aqua", "#8FD3E8", 0.7)],
  },
];

export const PALETTE_BY_ID = new Map(PALETTES.map((p) => [p.id, p]));

/**
 * Classic screen angles. Keeping plates 30° apart is what turns overlapping
 * dots into a rosette instead of a moiré bruise.
 */
export const PLATE_ANGLES = [15, 75, 45, 0];

export function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
