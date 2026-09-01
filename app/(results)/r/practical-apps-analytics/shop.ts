/**
 * Quire, 14 Silver Street. One room, about nine thousand titles, two hundred
 * and forty face-out slots. The figures below are modelled from three years of
 * typical independent-shop till patterns and made internally consistent. They
 * are not an extract from a real till. The interface says so.
 *
 * Two timescales are kept distinct:
 *   - section contribution is the last twelve months (what a metre earned)
 *   - a title's face-out weeks run over three years (whether anyone saw it)
 *   - last sale is counted from Sunday 6 September 2026
 *
 * Most of the nine thousand are not listed. The long tail is represented by
 * the decisions it forces — returns, tests, a metre given back — not by a
 * scrollable catalogue.
 */

export const TODAY = "Sunday 6 September 2026";
export const MONDAY = "Monday 7 September";
export const DEAD_AFTER_DAYS = 426; // fourteen months
export const FACE_SLOTS = 240;
export const SHOP_METRES = 65.3;

export type SectionId =
  | "fiction"
  | "crime"
  | "poetry"
  | "local"
  | "table"
  | "biography"
  | "nature"
  | "cookery"
  | "children"
  | "politics"
  | "new";

export type Facing = "face" | "spine";

export type Section = {
  id: SectionId;
  name: string;
  metres: number;
  faceSlots: number;
  /** Last-12-month contribution after cost of stock, pence. */
  yearPence: number;
  door?: boolean;
};

export type Title = {
  id: string;
  title: string;
  author: string;
  section: SectionId;
  copies: number;
  costPence: number;
  retailPence: number;
  /** Days since last till ring. Null = never sold in the three years. */
  lastSaleDays: number | null;
  /** Weeks of the last 156 in which this title stood face-out. */
  faceOutWeeks: number;
  /** Units in the last twelve months while face-out. */
  unitsFace: number;
  /** Units in the last twelve months from the spine. */
  unitsSpine: number;
  returnable: boolean;
  /** Per-copy cost of a return (carriage + publisher penalty), pence. */
  returnCostPence: number;
  facing: Facing;
  publisher: string;
  /** True when a returns window closes this month. */
  windowCloses?: string;
  forthcoming?: {
    pub: string;
    comparableId: string;
  };
};

export const SECTIONS: Section[] = [
  { id: "new", name: "New & noticed", metres: 4.0, faceSlots: 24, yearPence: 720_000 },
  { id: "table", name: "Door table", metres: 1.6, faceSlots: 6, yearPence: 340_000, door: true },
  { id: "fiction", name: "Fiction", metres: 16.0, faceSlots: 52, yearPence: 1_840_000 },
  { id: "crime", name: "Crime", metres: 7.5, faceSlots: 22, yearPence: 810_000 },
  { id: "children", name: "Children", metres: 9.0, faceSlots: 28, yearPence: 990_000 },
  { id: "cookery", name: "Cookery", metres: 5.5, faceSlots: 18, yearPence: 620_000 },
  { id: "nature", name: "Nature", metres: 4.5, faceSlots: 16, yearPence: 480_000 },
  { id: "biography", name: "Biography", metres: 6.0, faceSlots: 20, yearPence: 540_000 },
  { id: "politics", name: "Politics", metres: 4.0, faceSlots: 12, yearPence: 360_000 },
  { id: "local", name: "Local wall", metres: 3.0, faceSlots: 10, yearPence: 210_000 },
  { id: "poetry", name: "Poetry", metres: 4.2, faceSlots: 14, yearPence: 92_000 },
];

export const SHOP_YEAR_PENCE = SECTIONS.reduce((n, s) => n + s.yearPence, 0);

export const TITLES: Title[] = [
  // — poetry, the expensive metre —
  {
    id: "p-ash",
    title: "Woodpecker",
    author: "unsigned pamphlet",
    section: "poetry",
    copies: 4,
    costPence: 420,
    retailPence: 900,
    lastSaleDays: 610,
    faceOutWeeks: 11,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 95,
    facing: "spine",
    publisher: "Small Press Collective",
    windowCloses: "18 September",
  },
  {
    id: "p-fen",
    title: "Fen Verses",
    author: "M. Hargreaves",
    section: "poetry",
    copies: 6,
    costPence: 380,
    retailPence: 800,
    lastSaleDays: 488,
    faceOutWeeks: 8,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 80,
    facing: "spine",
    publisher: "Carcanet",
    windowCloses: "18 September",
  },
  {
    id: "p-gutter",
    title: "The Gutter Sequence",
    author: "Jo Laird",
    section: "poetry",
    copies: 5,
    costPence: 500,
    retailPence: 1000,
    lastSaleDays: 540,
    faceOutWeeks: 14,
    unitsFace: 1,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 110,
    facing: "face",
    publisher: "Picador",
    windowCloses: "18 September",
  },
  {
    id: "p-night",
    title: "Night Watch",
    author: "S. Okonkwo",
    section: "poetry",
    copies: 3,
    costPence: 450,
    retailPence: 950,
    lastSaleDays: 72,
    faceOutWeeks: 6,
    unitsFace: 4,
    unitsSpine: 2,
    returnable: true,
    returnCostPence: 90,
    facing: "face",
    publisher: "Faber",
  },
  {
    id: "p-river",
    title: "River Sonnets",
    author: "Helen Quayle",
    section: "poetry",
    copies: 4,
    costPence: 400,
    retailPence: 850,
    lastSaleDays: 18,
    faceOutWeeks: 9,
    unitsFace: 7,
    unitsSpine: 3,
    returnable: false,
    returnCostPence: 0,
    facing: "face",
    publisher: "Bloodaxe",
  },
  {
    id: "p-unseen-1",
    title: "A Calendar of Moths",
    author: "P. N. Ware",
    section: "poetry",
    copies: 3,
    costPence: 360,
    retailPence: 750,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 70,
    facing: "spine",
    publisher: "Small Press Collective",
    windowCloses: "18 September",
  },
  {
    id: "p-unseen-2",
    title: "Letters from the Stack",
    author: "R. Ibbotson",
    section: "poetry",
    copies: 2,
    costPence: 400,
    retailPence: 800,
    lastSaleDays: 701,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 80,
    facing: "spine",
    publisher: "Carcanet",
    windowCloses: "18 September",
  },

  // — local wall + door table —
  {
    id: "l-flood",
    title: "Silver Street in the Flood",
    author: "Parish Society",
    section: "table",
    copies: 7,
    costPence: 620,
    retailPence: 1250,
    lastSaleDays: 6,
    faceOutWeeks: 22,
    unitsFace: 18,
    unitsSpine: 1,
    returnable: false,
    returnCostPence: 0,
    facing: "face",
    publisher: "Parish Society",
  },
  {
    id: "l-walks",
    title: "Twelve Walks from the Market",
    author: "D. Pell",
    section: "table",
    copies: 8,
    costPence: 480,
    retailPence: 999,
    lastSaleDays: 3,
    faceOutWeeks: 18,
    unitsFace: 14,
    unitsSpine: 0,
    returnable: false,
    returnCostPence: 0,
    facing: "face",
    publisher: "Local Walks Press",
  },
  {
    id: "l-castle",
    title: "The Castle Guide",
    author: "Trust handbook",
    section: "table",
    copies: 11,
    costPence: 350,
    retailPence: 750,
    lastSaleDays: 1,
    faceOutWeeks: 40,
    unitsFace: 31,
    unitsSpine: 4,
    returnable: true,
    returnCostPence: 40,
    facing: "face",
    publisher: "English Heritage",
  },
  {
    id: "l-dead",
    title: "Georgian Shopfronts of the Midlands",
    author: "A. Crowe",
    section: "local",
    copies: 5,
    costPence: 1400,
    retailPence: 2500,
    lastSaleDays: 520,
    faceOutWeeks: 9,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 180,
    facing: "spine",
    publisher: "Phillimore",
    windowCloses: "30 September",
  },
  {
    id: "l-rail",
    title: "The Branch Line Remembered",
    author: "Ken Ullman",
    section: "local",
    copies: 4,
    costPence: 900,
    retailPence: 1800,
    lastSaleDays: 455,
    faceOutWeeks: 7,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 140,
    facing: "spine",
    publisher: "Oakwood",
    windowCloses: "30 September",
  },
  {
    id: "l-unseen",
    title: "A History of the Maltings",
    author: "E. Voss",
    section: "local",
    copies: 3,
    costPence: 800,
    retailPence: 1600,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 120,
    facing: "spine",
    publisher: "Phillimore",
  },
  {
    id: "l-nat",
    title: "National Trust Handbook 2025",
    author: "National Trust",
    section: "table",
    copies: 6,
    costPence: 700,
    retailPence: 1499,
    lastSaleDays: 40,
    faceOutWeeks: 8,
    unitsFace: 3,
    unitsSpine: 5,
    returnable: true,
    returnCostPence: 90,
    facing: "face",
    publisher: "National Trust",
  },

  // — fiction / new: slot wasters and display-dependent —
  {
    id: "f-habits",
    title: "Atomic Habits",
    author: "James Clear",
    section: "new",
    copies: 6,
    costPence: 720,
    retailPence: 1699,
    lastSaleDays: 4,
    faceOutWeeks: 20,
    unitsFace: 9,
    unitsSpine: 11,
    returnable: true,
    returnCostPence: 110,
    facing: "face",
    publisher: "Random House",
  },
  {
    id: "f-lessons",
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    section: "fiction",
    copies: 4,
    costPence: 540,
    retailPence: 999,
    lastSaleDays: 9,
    faceOutWeeks: 16,
    unitsFace: 6,
    unitsSpine: 8,
    returnable: true,
    returnCostPence: 80,
    facing: "face",
    publisher: "Doubleday",
  },
  {
    id: "f-orbits",
    title: "Orbital",
    author: "Samantha Harvey",
    section: "new",
    copies: 5,
    costPence: 780,
    retailPence: 1699,
    lastSaleDays: 2,
    faceOutWeeks: 14,
    unitsFace: 12,
    unitsSpine: 2,
    returnable: true,
    returnCostPence: 120,
    facing: "face",
    publisher: "Cape",
  },
  {
    id: "f-puffin",
    title: "The Puffin Book of the Week",
    author: "various",
    section: "children",
    copies: 8,
    costPence: 320,
    retailPence: 799,
    lastSaleDays: 5,
    faceOutWeeks: 12,
    unitsFace: 10,
    unitsSpine: 9,
    returnable: true,
    returnCostPence: 55,
    facing: "face",
    publisher: "Puffin",
  },
  {
    id: "f-display",
    title: "The Lost Rainforests of Britain",
    author: "Guy Shrubsole",
    section: "nature",
    copies: 4,
    costPence: 850,
    retailPence: 1899,
    lastSaleDays: 11,
    faceOutWeeks: 7,
    unitsFace: 8,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 130,
    facing: "spine",
    publisher: "William Collins",
  },
  {
    id: "f-display-2",
    title: "A Line in the World",
    author: "Dorthe Nors",
    section: "nature",
    copies: 3,
    costPence: 700,
    retailPence: 1499,
    lastSaleDays: 28,
    faceOutWeeks: 5,
    unitsFace: 6,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 110,
    facing: "spine",
    publisher: "Pushkin",
  },
  {
    id: "f-dead-seen",
    title: "The Midwinter House",
    author: "Clare Pender",
    section: "fiction",
    copies: 4,
    costPence: 820,
    retailPence: 1699,
    lastSaleDays: 470,
    faceOutWeeks: 10,
    unitsFace: 1,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 140,
    facing: "spine",
    publisher: "Cape",
    windowCloses: "18 September",
  },
  {
    id: "f-dead-seen-2",
    title: "Everyone in This Room Will Someday Be Dead",
    author: "Emily Austin",
    section: "fiction",
    copies: 3,
    costPence: 500,
    retailPence: 999,
    lastSaleDays: 512,
    faceOutWeeks: 6,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 80,
    facing: "spine",
    publisher: "Atlantic",
    windowCloses: "18 September",
  },
  {
    id: "c-dead",
    title: "The Last Jury",
    author: "R. J. Keene",
    section: "crime",
    copies: 3,
    costPence: 780,
    retailPence: 1699,
    lastSaleDays: 498,
    faceOutWeeks: 8,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 130,
    facing: "spine",
    publisher: "Michael Joseph",
    windowCloses: "18 September",
  },
  {
    id: "b-dead",
    title: "A Life in Briefings",
    author: "Rt Hon. P. Mallory",
    section: "biography",
    copies: 4,
    costPence: 900,
    retailPence: 2000,
    lastSaleDays: 560,
    faceOutWeeks: 9,
    unitsFace: 1,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 150,
    facing: "spine",
    publisher: "William Collins",
    windowCloses: "30 September",
  },
  {
    id: "k-dead",
    title: "Air Fryer Every Day",
    author: "studio tie-in",
    section: "cookery",
    copies: 5,
    costPence: 600,
    retailPence: 1499,
    lastSaleDays: 444,
    faceOutWeeks: 12,
    unitsFace: 2,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 100,
    facing: "spine",
    publisher: "Octopus",
    windowCloses: "18 September",
  },
  {
    id: "pol-dead",
    title: "The Coalition Years, volume two",
    author: "diary, 2012–15",
    section: "politics",
    copies: 3,
    costPence: 850,
    retailPence: 1800,
    lastSaleDays: 603,
    faceOutWeeks: 7,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 140,
    facing: "spine",
    publisher: "Bodley Head",
    windowCloses: "30 September",
  },

  // — unseen long-tail (the blind spot), various sections —
  {
    id: "u-1",
    title: "Essays on a Closed Library",
    author: "N. Pellam",
    section: "biography",
    copies: 2,
    costPence: 700,
    retailPence: 1400,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 110,
    facing: "spine",
    publisher: "Small Press Collective",
  },
  {
    id: "u-2",
    title: "Hedgerow Calendar",
    author: "N. Wynn",
    section: "nature",
    copies: 3,
    costPence: 650,
    retailPence: 1400,
    lastSaleDays: 680,
    faceOutWeeks: 1,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 100,
    facing: "spine",
    publisher: "William Collins",
  },
  {
    id: "u-3",
    title: "Maps for a Smaller Country",
    author: "I. Wren",
    section: "politics",
    copies: 2,
    costPence: 720,
    retailPence: 1500,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 115,
    facing: "spine",
    publisher: "Verso",
  },
  {
    id: "u-4",
    title: "Bread without a Mixer",
    author: "L. M. Orth",
    section: "cookery",
    copies: 3,
    costPence: 550,
    retailPence: 1200,
    lastSaleDays: 590,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 90,
    facing: "spine",
    publisher: "Quadrille",
  },
  {
    id: "u-5",
    title: "The Other Twin",
    author: "S. K. Renn",
    section: "crime",
    copies: 3,
    costPence: 420,
    retailPence: 899,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 70,
    facing: "spine",
    publisher: "Viper",
  },
  {
    id: "u-6",
    title: "Sunday Horses",
    author: "Tilly March",
    section: "children",
    copies: 4,
    costPence: 360,
    retailPence: 799,
    lastSaleDays: 640,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 60,
    facing: "spine",
    publisher: "Chicken House",
  },
  {
    id: "u-rain",
    title: "Rain over the Maltings",
    author: "C. Adeyemi",
    section: "fiction",
    copies: 3,
    costPence: 680,
    retailPence: 1499,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 110,
    facing: "spine",
    publisher: "Canongate",
  },

  // — forthcoming order decision —
  {
    id: "ord-flood",
    title: "Silver Street at Christmas",
    author: "Parish Society",
    section: "table",
    copies: 0,
    costPence: 640,
    retailPence: 1299,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 80,
    facing: "spine",
    publisher: "Parish Society",
    forthcoming: { pub: "14 October", comparableId: "l-flood" },
  },
  {
    id: "ord-novel",
    title: "The Watch House",
    author: "Samantha Harvey",
    section: "new",
    copies: 0,
    costPence: 820,
    retailPence: 1899,
    lastSaleDays: null,
    faceOutWeeks: 0,
    unitsFace: 0,
    unitsSpine: 0,
    returnable: true,
    returnCostPence: 140,
    facing: "spine",
    publisher: "Cape",
    forthcoming: { pub: "24 September", comparableId: "f-orbits" },
  },

  // — living stock, so the shop is not only problems —
  {
    id: "live-1",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    section: "fiction",
    copies: 3,
    costPence: 500,
    retailPence: 999,
    lastSaleDays: 8,
    faceOutWeeks: 11,
    unitsFace: 5,
    unitsSpine: 6,
    returnable: true,
    returnCostPence: 80,
    facing: "spine",
    publisher: "Vintage",
  },
  {
    id: "live-2",
    title: "Piranesi",
    author: "Susanna Clarke",
    section: "fiction",
    copies: 3,
    costPence: 480,
    retailPence: 999,
    lastSaleDays: 12,
    faceOutWeeks: 8,
    unitsFace: 4,
    unitsSpine: 5,
    returnable: true,
    returnCostPence: 75,
    facing: "spine",
    publisher: "Bloomsbury",
  },
  {
    id: "live-3",
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    section: "crime",
    copies: 5,
    costPence: 420,
    retailPence: 899,
    lastSaleDays: 2,
    faceOutWeeks: 15,
    unitsFace: 7,
    unitsSpine: 14,
    returnable: true,
    returnCostPence: 70,
    facing: "spine",
    publisher: "Penguin",
  },
];

export const LONG_TAIL_DEAD = 200;
export const LONG_TAIL_UNSEEN = 174;

export function sectionById(id: SectionId): Section {
  const found = SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`unknown section ${id}`);
  return found;
}

export function titleById(id: string): Title | undefined {
  return TITLES.find((t) => t.id === id);
}

export function pounds(pence: number): string {
  const sign = pence < 0 ? "−" : "";
  const abs = Math.abs(pence);
  const whole = Math.floor(abs / 100);
  const part = abs % 100;
  return `${sign}£${whole.toLocaleString("en-GB")}.${String(part).padStart(2, "0")}`;
}

export function poundsWhole(pence: number): string {
  const sign = pence < 0 ? "−" : "";
  return `${sign}£${Math.round(Math.abs(pence) / 100).toLocaleString("en-GB")}`;
}

export function perMetre(section: Section): number {
  return Math.round(section.yearPence / section.metres);
}

export function shopPerMetre(): number {
  return Math.round(SHOP_YEAR_PENCE / SHOP_METRES);
}

export function stockTied(title: Title): number {
  return title.copies * title.costPence;
}

export function isDead(title: Title): boolean {
  if (title.forthcoming) return false;
  if (title.lastSaleDays === null) return true;
  return title.lastSaleDays >= DEAD_AFTER_DAYS;
}

/** Had enough face-out time that a null sale is evidence, not fog. */
export function wasSeen(title: Title): boolean {
  return title.faceOutWeeks >= 6;
}

/** Never, or almost never, stood where anyone would notice it. */
export function unseen(title: Title): boolean {
  return title.faceOutWeeks <= 1 && !title.forthcoming;
}

export function displayDependent(title: Title): boolean {
  return title.unitsFace >= 5 && title.unitsSpine <= 1;
}

/** Currently face-out, and the spine already sells it. Wasting a slot. */
export function slotWaster(title: Title): boolean {
  return (
    title.facing === "face" &&
    title.unitsSpine >= title.unitsFace &&
    title.unitsSpine >= 5 &&
    !title.forthcoming
  );
}

export function monthsQuiet(title: Title): string {
  if (title.lastSaleDays === null) return "never sold in three years";
  const months = Math.round(title.lastSaleDays / 30.4);
  if (months < 1) return "sold this month";
  if (months === 1) return "quiet one month";
  return `quiet ${months} months`;
}
