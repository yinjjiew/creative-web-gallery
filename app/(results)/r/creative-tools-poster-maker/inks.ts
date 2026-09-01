/**
 * Five ink sets. The desk does not offer a colour picker — a poster that can
 * be any colour will be no colour. Each set is two working inks on a stock,
 * plus one accent used for kickers and structural rules.
 */

export type InkSet = {
  id: string;
  name: string;
  /** The sheet. */
  paper: string;
  /** Body ink — headline, dek, most type. */
  ink: string;
  /** Spot — kicker, bars, folio marks. */
  accent: string;
  note: string;
};

export const INKS: InkSet[] = [
  {
    id: "broadsheet",
    name: "Broadsheet",
    paper: "#efe6d2",
    ink: "#1a1612",
    accent: "#b42318",
    note: "Warm newsprint, black, one vermillion.",
  },
  {
    id: "night",
    name: "Night",
    paper: "#12110f",
    ink: "#efe6d2",
    accent: "#d4a017",
    note: "Bone and a single gold on near-black.",
  },
  {
    id: "safety",
    name: "Safety",
    paper: "#f0c400",
    ink: "#141414",
    accent: "#141414",
    note: "Chrome yellow. The type is the warning.",
  },
  {
    id: "cyanotype",
    name: "Cyanotype",
    paper: "#0c3358",
    ink: "#dbe8f0",
    accent: "#8ec8e8",
    note: "Prussian ground, bleached highlights.",
  },
  {
    id: "offset",
    name: "Offset",
    paper: "#f6f3ec",
    ink: "#0e0e0e",
    accent: "#0a7aa3",
    note: "Gallery stock, process cyan as the spot.",
  },
];

export const INK_BY_ID = new Map(INKS.map((i) => [i.id, i]));

export function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function channelLum(hex: string): number {
  const [r, g, b] = hexRgb(hex).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const L1 = channelLum(a);
  const L2 = channelLum(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
