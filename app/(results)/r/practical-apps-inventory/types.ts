export type CompatGroup =
  | "flammable"
  | "organic-acid"
  | "mineral-acid"
  | "oxidizing-acid"
  | "base"
  | "oxidizer"
  | "toxic"
  | "water-reactive"
  | "general";

export type SourceId =
  | "clp-annex-vi"
  | "prudent-2011"
  | "epa-600"
  | "kelly-1996"
  | "reg-273"
  | "epp-2023"
  | "hsg51"
  | "departmental";

export type Chemical = {
  id: string;
  name: string;
  cas: string;
  group: CompatGroup;
  /** GHS hazard classes as they appear on Annex VI / the C&L Inventory. */
  ghs: string[];
  classSource: SourceId;
  liquid: boolean;
  /** g·mL⁻¹ for liquids; unused for solids. */
  density: number;
  peroxide?: {
    kellyGroup: "A" | "B";
    /** Opened-bottle test interval used in this store. */
    testDays: number;
    testDaysKind: "kelly" | "departmental";
  };
  controlled?: {
    regime: "273/2004" | "EPP-2023";
    category: string;
  };
  leadDays: number;
  moqPacks: number;
  packSize: number;
  packUnit: "mL" | "g";
  packGbp: number;
  glass: "amber" | "clear" | "white" | "dark";
};

export type Cabinet = {
  id: string;
  name: string;
  plate: string;
  accepts: CompatGroup[];
  /** Capacity in mL (liquids) or g (solids). */
  capacity: number;
  liquid: boolean;
  stripe: string;
  note: string;
};

export type Bottle = {
  id: string;
  chemicalId: string;
  /** Fill remaining, mL or g matching the chemical. */
  remaining: number;
  size: number;
  lot: string;
  received: string;
  opened: string | null;
  cabinetId: string | null;
  /** receiving | stored | quarantine | issued | held origin tracked separately */
  state: "receiving" | "stored" | "quarantine" | "issued";
};

export type Need = {
  chemicalId: string;
  amount: number;
};

export type Practical = {
  id: string;
  course: string;
  courseName: string;
  title: string;
  date: string;
  students: number;
  needs: Need[];
};

export type AuditKind = "receive" | "move" | "issue" | "quarantine" | "test" | "order";

export type AuditEvent = {
  id: string;
  at: string;
  chemicalId: string;
  bottleId: string | null;
  amount: number;
  unit: "mL" | "g";
  kind: AuditKind;
  from: string;
  to: string;
  by: string;
  purpose: string;
};

export type OrderStatus = "raised" | "blocked-capacity" | "blocked-budget";

export type Order = {
  id: string;
  chemicalId: string;
  packs: number;
  raised: string;
  status: OrderStatus;
};

export type Refusal = {
  cabinetId: string;
  bottleId: string;
  title: string;
  body: string;
  source: SourceId;
  kind: "class" | "matrix" | "capacity" | "peroxide" | "state";
};

export type Persist = {
  bottles: Bottle[];
  heldId: string | null;
  origin: { bottleId: string; cabinetId: string | null; state: Bottle["state"] } | null;
  audit: AuditEvent[];
  orders: Order[];
  tested: Record<string, string>;
};
