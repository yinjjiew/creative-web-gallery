import { BEDS, NOTES, type BedId, type Maturity, type Note } from "./notes";

export type Part = { t: "text"; v: string } | { t: "link"; id: string; v: string };

export type View = "beds" | "undergrowth" | "whole";

export const BY_ID: Map<string, Note> = new Map(NOTES.map((n) => [n.id, n]));

export const NOTES_IN_BED: Record<BedId, Note[]> = {
  ledger: [],
  pull: [],
  dirt: [],
  tuesday: [],
  for: [],
};

for (const note of NOTES) {
  NOTES_IN_BED[note.bed].push(note);
}

const WIKI = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function parse(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  const re = new RegExp(WIKI.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: "text", v: text.slice(last, m.index) });
    const id = m[1];
    const note = BY_ID.get(id);
    parts.push({ t: "link", id, v: m[2] ?? note?.title ?? id });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: "text", v: text.slice(last) });
  return parts;
}

function slugsIn(text: string): string[] {
  return [...text.matchAll(new RegExp(WIKI.source, "g"))].map((m) => m[1]);
}

export const OUT: Map<string, string[]> = new Map();
export const IN: Map<string, string[]> = new Map();

for (const note of NOTES) {
  const seen = new Set<string>();
  for (const graf of note.body) {
    for (const id of slugsIn(graf.text)) {
      if (id === note.id || !BY_ID.has(id) || seen.has(id)) continue;
      seen.add(id);
    }
  }
  OUT.set(note.id, [...seen]);
  for (const id of seen) {
    const list = IN.get(id) ?? [];
    list.push(note.id);
    IN.set(id, list);
  }
}

export const AGAINST: Map<string, string[]> = new Map();

for (const note of NOTES) {
  for (const id of note.contradicts ?? []) {
    const list = AGAINST.get(id) ?? [];
    list.push(note.id);
    AGAINST.set(id, list);
  }
}

export function neighbours(id: string): Set<string> {
  const set = new Set<string>();
  for (const x of OUT.get(id) ?? []) set.add(x);
  for (const x of IN.get(id) ?? []) set.add(x);
  for (const x of BY_ID.get(id)?.contradicts ?? []) set.add(x);
  for (const x of AGAINST.get(id) ?? []) set.add(x);
  set.delete(id);
  return set;
}

export function inView(note: Note, view: View): boolean {
  if (view === "whole") return true;
  if (view === "beds") {
    return note.maturity === "established" || note.maturity === "growing";
  }
  return note.maturity === "seedling" || note.maturity === "left";
}

export function span(note: Note): string {
  const a = note.planted.slice(0, 4);
  const b = note.lastTended.slice(0, 4);
  if (a === b) return a;
  return `${a}–${b.slice(2)}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function longMonth(iso: string): string {
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7));
  return `${MONTHS[m - 1] ?? ""} ${y}`.trim();
}

export function bedOf(id: BedId) {
  return BEDS.find((b) => b.id === id) ?? BEDS[0];
}

export function maturityLabel(m: Maturity): string {
  if (m === "established") return "tended";
  if (m === "growing") return "being worked";
  if (m === "seedling") return "just put in";
  return "left";
}

export function tendedPhrase(n: number): string {
  if (n === 1) return "once";
  if (n === 2) return "twice";
  const words = [
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
  ];
  return `${words[n - 3] ?? String(n)} times`;
}

export const TENDED = NOTES.filter(
  (n) => n.maturity === "established" || n.maturity === "growing",
).length;

export const LEFT = NOTES.filter((n) => n.maturity === "left").length;

export const SEEDLINGS = NOTES.filter((n) => n.maturity === "seedling").length;

export const KEY: { id: string; maturity: Maturity }[] = [
  { id: "the-plane", maturity: "established" },
  { id: "the-specification", maturity: "growing" },
  { id: "a-thistle-i-left", maturity: "seedling" },
  { id: "natives", maturity: "left" },
];
