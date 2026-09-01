export type Dept = "set" | "costume" | "lx" | "sound" | "props" | "cast" | "foh";

export type Kind = "work" | "lead" | "event" | "gate";

export type Task = {
  id: string;
  name: string;
  dept: Dept;
  owner: string;
  /** Calendar days of attention once this can start. Events and gates may be 0. */
  days: number;
  /** Calendar days successors must wait after this finishes (supplier lead). */
  wait: number;
  depends: string[];
  kind: Kind;
  /** Earliest this can start — hire arrival, previous get-out, a booked slot. */
  gate?: string;
  /** Immovable calendar date this occurs. Slack through this node is zero. */
  on?: string;
  /** She cannot make this faster. */
  external?: boolean;
  note?: string;
};

export type Production = {
  title: string;
  writer: string;
  venue: string;
  today: string;
  opening: string;
  tasks: Task[];
  /** Completions already true in the modelled moment, ISO date finished. */
  already: Record<string, string>;
};

export type Scheduled = {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  slack: number;
  /** Days from as-of until latest start. Negative = already late. */
  untilStart: number;
  late: boolean;
  critical: boolean;
  /** Immovable event this most tightly feeds, if any. */
  feeds: string | null;
  /** Whether the tightest immovable is already missed. */
  misses: boolean;
};

export type Plan = {
  asOf: number;
  opening: number;
  horizon: number;
  byId: Record<string, Scheduled>;
  successors: Record<string, string[]>;
};

export type View = "tonight" | "chain" | "dept";
