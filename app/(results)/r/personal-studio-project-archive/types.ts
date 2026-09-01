export type ThreadId =
  | "tide"
  | "hand"
  | "ledger"
  | "birds"
  | "salt"
  | "errata"
  | "glass";

/** How a relationship is known. */
export type RelKind = "artist" | "series" | "plate" | "site";

export type MediumKind = "print" | "sculpture" | "book" | "commission";

export type Fate = "kept" | "dormant" | "abandoned" | "late" | "broken";

export type Pair = {
  id: string;
  kind: RelKind;
  /** Short label, e.g. "artist's note, 21 years later". */
  label: string;
};

export type Work = {
  id: string;
  cat: string;
  title: string;
  year: number;
  medium: string;
  kind: MediumKind;
  /** centimetres; 0 means dimensions variable */
  w: number;
  h: number;
  d?: number;
  edition: string;
  location: string;
  threads: ThreadId[];
  /** Per-thread: artist's claim vs an established fact. */
  claims: Partial<Record<ThreadId, RelKind>>;
  series?: string;
  note?: string;
  pairs?: Pair[];
};

export type ThreadMeta = {
  id: ThreadId;
  name: string;
  fate: Fate;
  fateLabel: string;
  copy: string;
  color: string;
  start: number;
  end: number;
  /** Inclusive quiet span. */
  quiet?: [number, number];
  quietKind?: "dormant" | "broken";
};
