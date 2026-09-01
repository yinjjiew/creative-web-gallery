export type Block =
  | { t: "p"; text: string; drop?: boolean }
  | { t: "h2"; id: string; text: string }
  | { t: "h3"; text: string }
  | { t: "pull"; text: string }
  | { t: "sidebar"; title: string; text: string }
  | { t: "table"; caption: string; heads: string[]; rows: string[][] }
  | { t: "figure"; id: "train" | "grid" | "heat" | "sewer"; caption: string };

export type Note = { n: number; text: string };

export type FeatureDoc = {
  toc: { id: string; label: string }[];
  blocks: Block[];
  notes: Note[];
};

export type DispatchDoc = {
  dateline: string;
  blocks: Block[];
};

export type Plate = {
  n: string;
  figure: "boards" | "oil" | "tram" | "busbar" | "handle" | "yard";
  caption: string;
};

export type EssayDoc = {
  stand: string;
  plates: Plate[];
};

export type Turn = { q: string; a: string[] };

export type InterviewDoc = {
  subject: string;
  setting: string;
  turns: Turn[];
};

export type DiagramDoc = {
  figure: "grid" | "heat";
  lede: string;
  blocks: Block[];
  notes?: Note[];
};
