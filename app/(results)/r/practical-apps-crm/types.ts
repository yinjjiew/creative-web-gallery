export type Audience = "desk" | "shareable";

export type Tenure = {
  imprint: string;
  house: string;
  role: string;
  from: string;
  to: string | null;
};

export type Note = {
  id: string;
  at: string;
  text: string;
  audience: Audience;
};

export type Editor = {
  id: string;
  name: string;
  tenures: Tenure[];
  taste: string;
  notes: Note[];
};

export type Author = {
  id: string;
  name: string;
  notes: Note[];
  betweenBooks?: string;
};

export type Book = {
  id: string;
  authorId: string;
  title: string;
  kind: string;
  line: string;
};

export type Pass = {
  kind: "pass";
  at: string;
  /** Why they said no — the actual asset. */
  intelligence: string;
  /** The one sentence she is willing to pass on, if any. */
  shareable?: string;
};

export type Out = {
  kind: "out";
  exclusiveUntil?: string;
};

export type Held = {
  kind: "held";
  at: string;
  until?: string;
};

export type Offer = {
  kind: "offer";
  at: string;
  terms: string;
  /** Everyone else must answer by this date. */
  othersBy: string;
};

export type Auction = {
  kind: "auction";
  close: string;
  closeLabel: string;
};

export type Withdrawn = {
  kind: "withdrawn";
  at: string;
  reason: string;
};

export type ReadState = Out | Held | Offer | Auction | Pass | Withdrawn;

export type Submission = {
  id: string;
  bookId: string;
  editorId: string;
  sent: string;
  /** Imprint at the moment of sending — the person may have moved since. */
  imprintThen: string;
  state: ReadState;
};

export type Chase = {
  at: string;
  note: string;
};

export type ExclusiveAction = {
  action: "expired" | "extended";
  at: string;
  until?: string;
  note: string;
};

export type Bid = {
  at: string;
  note: string;
};

export type Saved = {
  chases: Record<string, Chase[]>;
  exclusives: Record<string, ExclusiveAction>;
  bids: Record<string, Bid[]>;
  notes: Note[];
};
