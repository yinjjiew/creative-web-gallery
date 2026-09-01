/**
 * The five-strand rubric the marking is done against.
 *
 * PROVENANCE. This is a *fictional* departmental rubric, written for this
 * demonstration. It is not AQA, Edexcel, OCR, WJEC or CIE, and it does not
 * reproduce any awarding body's mark scheme or grade boundaries. The interface
 * says so where the rubric is shown. Real mark schemes are copyright and
 * getting one subtly wrong in a tool a teacher trusts would be worse than
 * having none.
 *
 * Descriptors are written the way a department writes them: in the second
 * person, about what the essay does, short enough to be read in the two seconds
 * a marker actually has.
 */

export const STRAND_IDS = [
  "argument",
  "evidence",
  "method",
  "context",
  "expression",
] as const;

export type StrandId = (typeof STRAND_IDS)[number];

export type Strand = {
  id: StrandId;
  /** Single letter used in dense columns and in the keyboard map. */
  key: string;
  name: string;
  /** What the strand is for, in one line, shown under the name. */
  gloss: string;
  /** Index 0..6 — descriptor for that mark. */
  descriptors: string[];
};

export const MAX_PER_STRAND = 6;
export const STRAND_COUNT = STRAND_IDS.length;
export const MAX_TOTAL = MAX_PER_STRAND * STRAND_COUNT;

export const STRANDS: Strand[] = [
  {
    id: "argument",
    key: "A",
    name: "Argument",
    gloss: "A line of thought that answers the question and is held to the end",
    descriptors: [
      "Nothing here to assess.",
      "Writes about the play. The question is not in view.",
      "Answers the question in places and loses it in others. Points arrive in the order they occurred to you.",
      "A position is stated and mostly held. Paragraphs relate to the question but not yet to each other.",
      "A clear position, held across the whole essay. Each paragraph takes the previous one somewhere.",
      "A position that has been thought about: it admits what complicates it and is stronger for admitting it.",
      "An argument you could not have reached without writing it. The question is answered and gently re-framed.",
    ],
  },
  {
    id: "evidence",
    key: "E",
    name: "Evidence",
    gloss: "Quotation chosen well, kept short, and welded to the point",
    descriptors: [
      "Nothing here to assess.",
      "No quotation, or quotation that is not in the play.",
      "Quotation is present but long, dropped in, or unrelated to the sentence above it.",
      "Relevant quotation, mostly short, mostly attached to the point it is supporting.",
      "Well-chosen short quotation, built into your own sentence, earning its place.",
      "Quotation chosen for the exact word that matters, and returned to later in the essay.",
      "Evidence includes what is not said — a stage direction, an interruption, a structural choice — used precisely.",
    ],
  },
  {
    id: "method",
    key: "M",
    name: "Method",
    gloss: "What the writer does, and what it does to an audience",
    descriptors: [
      "Nothing here to assess.",
      "Characters are treated as people and events as facts. The playwright is absent.",
      "Names a device and moves on. 'This shows that…' without saying what it shows.",
      "Identifies a method and offers an effect, though the effect stays general.",
      "Explains what the method does to an audience, in the moment it happens.",
      "Reads how one word or one choice is doing the work, and ties it back to the argument.",
      "Reads form and structure as decisions, across the whole play and not only line by line.",
    ],
  },
  {
    id: "context",
    key: "C",
    name: "Context",
    gloss: "Ideas about the play's world, in service of the argument",
    descriptors: [
      "Nothing here to assess.",
      "No context, or context copied in with no relation to the essay around it.",
      "A fact about 1912 or 1945 is stated and left standing on its own.",
      "Context is relevant but sits beside the argument rather than inside it.",
      "Context is used to explain why a choice mattered to the audience that first met it.",
      "Uses the gap between when the play is set and when it was first performed, and does something with it.",
      "Treats context as contested. Knows that 'the audience' was never one thing.",
    ],
  },
  {
    id: "expression",
    key: "X",
    name: "Expression",
    gloss: "Accuracy, control, and the register of criticism",
    descriptors: [
      "Nothing here to assess.",
      "Errors get in the way of the meaning.",
      "Frequent errors. Sentences run into each other. The register slips into speech.",
      "Generally accurate. Limited sentence variety, and the critical vocabulary is sometimes approximate.",
      "Accurate and controlled. The vocabulary of criticism is used correctly.",
      "Precise. Sentence length is doing work. Nothing is padded.",
      "Prose worth reading for its own sake, and unmistakably yours.",
    ],
  },
];

export const STRAND_BY_ID: Record<StrandId, Strand> = Object.fromEntries(
  STRANDS.map((strand) => [strand.id, strand])
) as Record<StrandId, Strand>;

/**
 * Departmental bands. Deliberately *not* grades: a total out of thirty on a
 * rubric invented for a demonstration cannot be mapped to a GCSE grade, and
 * pretending otherwise is the kind of false precision this tool exists to
 * resist. The interface repeats the caveat where the band is shown.
 */
export type Band = { label: string; min: number; max: number; note: string };

export const BANDS: Band[] = [
  { label: "1", min: 0, max: 5, note: "Below the standard of the task" },
  { label: "2", min: 6, max: 11, note: "Beginning to answer the question" },
  { label: "3", min: 12, max: 17, note: "Secure, with the argument intermittent" },
  { label: "4", min: 18, max: 23, note: "Clear, sustained, well evidenced" },
  { label: "5", min: 24, max: 30, note: "Assured; reads the play rather than reports it" },
];

export function bandFor(total: number): Band {
  for (const band of BANDS) {
    if (total >= band.min && total <= band.max) return band;
  }
  return BANDS[BANDS.length - 1];
}

/** The set being marked. Fictional school, fictional cohort. */
export const ASSIGNMENT = {
  cohort: "Year 11",
  text: "An Inspector Calls",
  question:
    "How does Priestley present responsibility in An Inspector Calls? Write about the ideas about responsibility in the play, and the methods Priestley uses to present them.",
  shortQuestion: "responsibility",
  setSize: 124,
  /** Days from the day the set was collected to the day it is due back. */
  returnWindowDays: 14,
  /** Her own working estimate, and the budget the pace panel is measured against. */
  budgetSecondsPerScript: 240,
  sittingMinutes: 90,
} as const;
