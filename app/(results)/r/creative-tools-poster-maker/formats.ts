/**
 * Destinations are different shapes, not different scales. Each stock is a
 * real pixel size someone would actually post or print. The composer reflows
 * the editorial grid into that rectangle; it never letterboxes a square into
 * a story and calls the job done.
 */

export type Format = {
  id: string;
  name: string;
  w: number;
  h: number;
  /** How the stock is used, in the language of the desk. */
  use: string;
};

export const FORMATS: Format[] = [
  {
    id: "ig-portrait",
    name: "Post",
    w: 1080,
    h: 1350,
    use: "Instagram 4:5",
  },
  {
    id: "story",
    name: "Story",
    w: 1080,
    h: 1920,
    use: "9:16 story / reel",
  },
  {
    id: "square",
    name: "Square",
    w: 1080,
    h: 1080,
    use: "1:1 feed",
  },
  {
    id: "og",
    name: "Card",
    w: 1200,
    h: 630,
    use: "Open Graph 1.91:1",
  },
  {
    id: "wide",
    name: "Wide",
    w: 1600,
    h: 900,
    use: "16:9 share",
  },
  {
    id: "a3",
    name: "A3",
    w: 1754,
    h: 2480,
    use: "297×420 mm @ 150 dpi",
  },
  {
    id: "tabloid",
    name: "Tabloid",
    w: 1650,
    h: 2550,
    use: "11×17 in @ 150 dpi",
  },
];

export const FORMAT_BY_ID = new Map(FORMATS.map((f) => [f.id, f]));

export function aspectLabel(w: number, h: number): string {
  const r = w / h;
  if (r >= 1.6) return "wide";
  if (r >= 1.15) return "landscape";
  if (r <= 0.62) return "tower";
  if (r <= 0.88) return "portrait";
  return "square";
}
