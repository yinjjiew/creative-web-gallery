/**
 * Her eleven comments.
 *
 * The brief this tool answers names the real problem with a comment bank: she
 * writes the same eleven remarks hundreds of times, and students correctly read
 * the result as generic. A bank of *finished sentences* makes that worse, fast.
 *
 * So nothing in here is a finished sentence. Each entry is a stem with holes in
 * it, and at least one hole in every stem can only be filled from the essay in
 * front of her — a passage clipped out of the student's own writing, or a note
 * she types about this script. The composer refuses to insert a comment while a
 * hole is empty. The fixed part carries her expertise; the holes carry the
 * evidence that she read *this* one.
 *
 * Nothing here is generated. The stems are fixed text she wrote once; every
 * completion is hers, typed or clipped, at the moment of marking.
 */

import type { StrandId } from "./rubric";

export type Slot =
  | { id: string; kind: "quote"; hint: string }
  | { id: string; kind: "note"; hint: string; min: number }
  | { id: string; kind: "pick"; hint: string; options: string[] };

export type Stem = {
  id: string;
  /** Digit typed after `/` to insert without reaching for the mouse. */
  key: string;
  /** Short name in the bank list. */
  label: string;
  tone: "credit" | "push" | "fix";
  strands: StrandId[];
  /** `{slotId}` tokens are replaced by the filled slots. */
  template: string;
  slots: Slot[];
};

const DEVICES = [
  "the dramatic irony",
  "the stage direction",
  "the interruption",
  "the list of three",
  "the shift in register",
  "the entrance",
  "the pause",
  "the repetition",
  "the lighting change",
  "the cliffhanger",
];

export const STEMS: Stem[] = [
  {
    id: "strongest",
    key: "1",
    label: "Strongest moment",
    tone: "credit",
    strands: ["argument", "method"],
    template: "The best thing you do is here — “{quote}”. It works because {why}.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip the sentence that is doing it" },
      { id: "why", kind: "note", hint: "why this one and not the others", min: 12 },
    ],
  },
  {
    id: "unevidenced",
    key: "2",
    label: "Claim with no evidence",
    tone: "push",
    strands: ["evidence", "argument"],
    template:
      "You say “{quote}” and I believe you, but the essay never shows it. The moment you want is {where}.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip the unsupported claim" },
      { id: "where", kind: "note", hint: "point at the scene or line", min: 8 },
    ],
  },
  {
    id: "dropped",
    key: "3",
    label: "Quotation dropped",
    tone: "push",
    strands: ["evidence", "method"],
    template:
      "You quote “{quote}” and then move straight on. One more sentence — what is Priestley doing with {word}? — turns evidence into analysis.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip the quotation and what follows it" },
      { id: "word", kind: "note", hint: "the word or choice that matters", min: 4 },
    ],
  },
  {
    id: "named",
    key: "4",
    label: "Device named, not read",
    tone: "push",
    strands: ["method"],
    template:
      "You name {device} and stop. Not “it emphasises” — what does it make an audience {effect}, at that exact point in the play?",
    slots: [
      { id: "device", kind: "pick", hint: "which device", options: DEVICES },
      { id: "effect", kind: "note", hint: "feel, notice, suspect…", min: 6 },
    ],
  },
  {
    id: "context-parked",
    key: "5",
    label: "Context parked",
    tone: "fix",
    strands: ["context"],
    template:
      "“{quote}” is true about {period}, but it is parked next to the argument rather than inside it. Attach it: {how}.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip the free-standing context" },
      {
        id: "period",
        kind: "pick",
        hint: "which context",
        options: [
          "1912",
          "1945",
          "the Edwardian class system",
          "post-war Britain",
          "the audience of the first London production",
        ],
      },
      { id: "how", kind: "note", hint: "what it would prove for you", min: 12 },
    ],
  },
  {
    id: "retelling",
    key: "6",
    label: "Retelling the plot",
    tone: "fix",
    strands: ["argument", "evidence"],
    template:
      "From “{quote}” you are retelling the story. I know what happens. Spend those lines on {instead} instead.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip where the retelling starts" },
      { id: "instead", kind: "note", hint: "the idea worth the words", min: 10 },
    ],
  },
  {
    id: "order",
    key: "7",
    label: "Wrong paragraph first",
    tone: "fix",
    strands: ["argument"],
    template:
      "Your strongest paragraph is the one about {which}, and it is currently {position}. Lead with your best ground.",
    slots: [
      { id: "which", kind: "note", hint: "which paragraph", min: 6 },
      {
        id: "position",
        kind: "pick",
        hint: "where it sits",
        options: ["second", "third", "fourth", "last", "buried in the middle"],
      },
    ],
  },
  {
    id: "question-word",
    key: "8",
    label: "Not yet answering",
    tone: "fix",
    strands: ["argument"],
    template:
      "This is about the play but not yet about {word}. Put that word in every topic sentence and see which paragraphs survive it.",
    slots: [
      {
        id: "word",
        kind: "pick",
        hint: "the question's word",
        options: ["responsibility", "collective responsibility", "blame", "consequence", "duty"],
      },
    ],
  },
  {
    id: "register",
    key: "9",
    label: "Spoken, not written",
    tone: "fix",
    strands: ["expression"],
    template: "“{quote}” — that is how you would say it, not how you would write it. Try: {rewrite}.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip the spoken sentence" },
      { id: "rewrite", kind: "note", hint: "give her the better version", min: 12 },
    ],
  },
  {
    id: "unsigned-turn",
    key: "0",
    label: "Unsigned change of mind",
    tone: "push",
    strands: ["argument"],
    template:
      "You change your mind between “{quote}” and the end, without telling me. Either commit, or make the change of mind part of the argument — the second is harder and better.",
    slots: [{ id: "quote", kind: "quote", hint: "clip the earlier position" }],
  },
  {
    id: "topic-sentence",
    key: "-",
    label: "Topic sentence is a subject",
    tone: "push",
    strands: ["argument", "expression"],
    template:
      "Your topic sentence is “{quote}”. That announces a subject, not an idea. Rewrite it as a claim: {claim}.",
    slots: [
      { id: "quote", kind: "quote", hint: "clip the topic sentence" },
      { id: "claim", kind: "note", hint: "the claim it should have made", min: 12 },
    ],
  },
];

export const STEM_BY_ID: Record<string, Stem> = Object.fromEntries(
  STEMS.map((stem) => [stem.id, stem])
);

/** Splits a template into literal text and `{slotId}` references, in order. */
export function parseTemplate(template: string): Array<{ text: string } | { slot: string }> {
  const out: Array<{ text: string } | { slot: string }> = [];
  const pattern = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    if (match.index > last) out.push({ text: template.slice(last, match.index) });
    out.push({ slot: match[1] });
    last = match.index + match[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

/** Renders a stem with the slot values she filled. Empty slots stay visible. */
export function renderComment(stem: Stem, values: Record<string, string>): string {
  return parseTemplate(stem.template)
    .map((part) => ("text" in part ? part.text : values[part.slot] || "…"))
    .join("");
}

export function missingSlots(stem: Stem, values: Record<string, string>): Slot[] {
  return stem.slots.filter((slot) => {
    const value = (values[slot.id] ?? "").trim();
    if (!value) return true;
    if (slot.kind === "note" && value.length < slot.min) return true;
    return false;
  });
}

/**
 * Normalised form used to notice that she has typed the identical completion on
 * another script. Not fuzzy on purpose: a near-match between two essays is
 * often correct, an exact one almost never is, and a warning that fires too
 * often gets ignored.
 */
export function normaliseCompletion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
