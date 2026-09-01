/**
 * The body of work. Sizes are real millimetres. A visiting card and an A1
 * poster share the same space, which is the whole reason the chest exists.
 *
 * The practice is modelled — invented for this piece, labelled in the interface.
 */

export type Kind = "book" | "poster" | "sheet" | "card" | "pack";

export type Piece = {
  id: string;
  drawer: number;
  title: string;
  client: string;
  year: string;
  role: string;
  paper: string;
  /** Finished size, millimetres. */
  wMm: number;
  hMm: number;
  /** Thickness, millimetres. Weight lives here as much as in the gsm. */
  dMm: number;
  /** A print-shop line: stock + weight. */
  stock: string;
  note: string;
  kind: Kind;
};

export type Drawer = {
  id: number;
  name: string;
  short: string;
};

export const DRAWERS: Drawer[] = [
  { id: 0, name: "Books", short: "Bound" },
  { id: 1, name: "Posters", short: "Sheets" },
  { id: 2, name: "Identity", short: "Cards" },
  { id: 3, name: "Packing", short: "Objects" },
];

export const PIECES: Piece[] = [
  {
    id: "fjord",
    drawer: 0,
    title: "Fjord",
    client: "Nasjonalmuseet",
    year: "2024",
    role: "Design, typesetting, binding specification",
    paper: "Munken Print Cream 90 gsm, cloth boards",
    wMm: 170,
    hMm: 240,
    dMm: 22,
    stock: "168 pp · 410 g",
    note: "A coastal atlas: one spread per fjord, the type held smaller than the water.",
    kind: "book",
  },
  {
    id: "broth",
    drawer: 0,
    title: "Broth",
    client: "Kadeau",
    year: "2023",
    role: "Design and production",
    paper: "Munken Pure 80 gsm, uncoated boards",
    wMm: 145,
    hMm: 210,
    dMm: 14,
    stock: "88 pp · 240 g",
    note: "A kitchen book. Recipes set like notes, not like a brand.",
    kind: "book",
  },
  {
    id: "glass-hours",
    drawer: 0,
    title: "Glass Hours",
    client: "Edition of 200",
    year: "2025",
    role: "Concept, design, binding",
    paper: "Translucent 90 gsm interleaves, grey boards",
    wMm: 210,
    hMm: 280,
    dMm: 8,
    stock: "48 pp · 180 g",
    note: "An artist book. Each leaf hides the one beneath; you read by lifting.",
    kind: "book",
  },
  {
    id: "season",
    drawer: 1,
    title: "Season IV",
    client: "Koncerthuset",
    year: "2024",
    role: "Poster and series system",
    paper: "Munken Kristall 170 gsm",
    wMm: 841,
    hMm: 594,
    dMm: 0.3,
    stock: "A1 · 170 gsm",
    note: "One colour, one numeral. Meant to read from across a station hall.",
    kind: "poster",
  },
  {
    id: "type-walk",
    drawer: 1,
    title: "Type Walk",
    client: "Grafisk Litteratur",
    year: "2023",
    role: "Poster",
    paper: "Colorplan Cool Grey 175 gsm",
    wMm: 841,
    hMm: 594,
    dMm: 0.3,
    stock: "A1 · 175 gsm",
    note: "A walking tour of lettering. The line of type gets larger as you get closer.",
    kind: "poster",
  },
  {
    id: "harvest",
    drawer: 1,
    title: "Harvest 24",
    client: "Torvehallerne",
    year: "2024",
    role: "Poster",
    paper: "Cyclus Offset 140 gsm",
    wMm: 594,
    hMm: 420,
    dMm: 0.25,
    stock: "A2 · 140 gsm",
    note: "A market poster. Wood-type weight, vegetable colour, no photograph.",
    kind: "poster",
  },
  {
    id: "bruun-card",
    drawer: 2,
    title: "Bruun",
    client: "Bruun Ceramics",
    year: "2024",
    role: "Identity and print specification",
    paper: "Colorplan Stone 350 gsm, letterpress",
    wMm: 85,
    hMm: 55,
    dMm: 0.45,
    stock: "Visiting card · 350 gsm",
    note: "A potter's card. The mark is a thrown circle, not a logo drawn in software.",
    kind: "card",
  },
  {
    id: "bruun-letter",
    drawer: 2,
    title: "Bruun letter",
    client: "Bruun Ceramics",
    year: "2024",
    role: "Letterhead",
    paper: "Munken Pure 120 gsm",
    wMm: 210,
    hMm: 297,
    dMm: 0.15,
    stock: "A4 · 120 gsm",
    note: "Same mark, almost no ink. The paper does the work.",
    kind: "sheet",
  },
  {
    id: "havn",
    drawer: 2,
    title: "Havn",
    client: "Havn Inn, Skagen",
    year: "2025",
    role: "Identity, cards, tags",
    paper: "Colorplan Mid Blue 270 gsm",
    wMm: 85,
    hMm: 55,
    dMm: 0.4,
    stock: "Visiting card · 270 gsm",
    note: "A small inn. Navy, cream, a wave that is only a rule.",
    kind: "card",
  },
  {
    id: "ore",
    drawer: 2,
    title: "Øre",
    client: "Øre Records",
    year: "2023",
    role: "Label and sleeve insert",
    paper: "Uncoated 300 gsm, die-cut",
    wMm: 120,
    hMm: 120,
    dMm: 0.5,
    stock: "7-inch insert · 300 gsm",
    note: "A record label that still prints paper. Square, centred, one number.",
    kind: "card",
  },
  {
    id: "nord-salt",
    drawer: 3,
    title: "Nord",
    client: "Nord Salt",
    year: "2024",
    role: "Packaging and wrap",
    paper: "Greyboard + uncoated wrap 150 gsm",
    wMm: 90,
    hMm: 90,
    dMm: 90,
    stock: "Cube · 210 g filled",
    note: "A salt tin's paper jacket. The type is the weight of the contents.",
    kind: "pack",
  },
  {
    id: "birch",
    drawer: 3,
    title: "Birch",
    client: "Birch Tea",
    year: "2025",
    role: "Carton and label",
    paper: "Uncoated carton 300 gsm",
    wMm: 70,
    hMm: 110,
    dMm: 40,
    stock: "Carton · 55 g empty",
    note: "Loose-leaf tea. Pale green, a bark mark, no gold.",
    kind: "pack",
  },
  {
    id: "stub",
    drawer: 3,
    title: "Stub",
    client: "Koncerthuset",
    year: "2024",
    role: "Ticket",
    paper: "Ticket stock 240 gsm, perforated",
    wMm: 160,
    hMm: 70,
    dMm: 0.35,
    stock: "Ticket · 240 gsm",
    note: "A concert stub. Numbered, torn, meant to live in a pocket.",
    kind: "card",
  },
];

export const STUDIO = {
  name: "Holm",
  person: "Lin Holm",
  line: "Graphic design for print",
  city: "Copenhagen",
  email: "studio@holm.work",
  modelled:
    "A modelled practice. The work is written for this chest — sizes, stocks and weights are specified as they would be to a printer.",
};

export const CARD_MM = 85;

export function pieceById(id: string): Piece | undefined {
  return PIECES.find((p) => p.id === id);
}

export function piecesIn(drawer: number): Piece[] {
  return PIECES.filter((p) => p.drawer === drawer);
}

/** How many visiting-card lengths this piece is, on its long side. */
export function cardLengths(piece: Piece): number {
  const long = Math.max(piece.wMm, piece.hMm);
  return long / CARD_MM;
}
