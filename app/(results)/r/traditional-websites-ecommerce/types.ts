export const CATALOGUE_CLAIM = 4200;

export type Category =
  | "wood-screws"
  | "machine-screws"
  | "self-tappers"
  | "nails"
  | "bolts"
  | "nuts"
  | "washers"
  | "plugs"
  | "hinges"
  | "locks"
  | "chain"
  | "hammers"
  | "tools"
  | "ironmongery";

export type Unit = "pack" | "metre" | "each";

export type Spec = { label: string; value: string };

export type Product = {
  sku: string;
  name: string;
  category: Category;
  familyId: string;
  familyName: string;
  specs: Spec[];
  material: string;
  finish: string;
  packQty: number;
  unit: Unit;
  pricePence: number;
  for: string[];
  notFor: string[];
  keywords: string[];
  counterNote: string;
};

export type TicketLine = {
  sku: string;
  qty: number;
};

export type Ticket = {
  id: string;
  lines: TicketLine[];
  placedAt: string;
};

export type Mode = "shutter" | "trade" | "ask" | "product" | "checkout" | "done";

export const CATEGORY_LABEL: Record<Category, string> = {
  "wood-screws": "Wood screws",
  "machine-screws": "Machine screws",
  "self-tappers": "Self-tappers",
  nails: "Nails & pins",
  bolts: "Bolts",
  nuts: "Nuts",
  washers: "Washers",
  plugs: "Plugs & anchors",
  hinges: "Hinges",
  locks: "Locks & latches",
  chain: "Chain",
  hammers: "Hammers",
  tools: "Hand tools",
  ironmongery: "Ironmongery",
};
