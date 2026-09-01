/**
 * The sample marking history.
 *
 * SAMPLE DATA. Fifty-nine of the hundred and twenty-four scripts arrive
 * already marked, across five sittings laid out over the past nine days. No
 * teacher made these judgements; they are generated from a fixed seed so that
 * the consistency views have a real set to work on the moment the page opens.
 * A tool whose whole argument is about drift across a large set is untestable
 * and unreviewable with an empty queue.
 *
 * The sample deliberately contains the drift it is designed to catch. The
 * Thursday sitting that began at ten past ten at night runs about a mark and a
 * half below the two Sunday-morning sittings, and gets harsher as it goes on.
 * That is a property of the generator, stated here and stated in the interface
 * — it is not a measurement of any real marker, and no claim is made that real
 * markers drift by that amount.
 *
 * Everything downstream of this file treats these judgements exactly like ones
 * she makes herself. They can be undone, reopened, re-read blind and cleared.
 */

import { MARKING_ORDER, SCRIPT_BY_ID, rng, scriptText, type Script } from "./corpus";
import { MAX_PER_STRAND, STRAND_IDS, type StrandId } from "./rubric";
import { STEM_BY_ID, type Stem } from "./stems";
import type { Clip, CommentInstance, Doc, Judgement, MarkSet, Sitting } from "./state";

/* -------------------------------------------------------------------------- */
/* Sentence offsets, so a seeded clip points at real text                      */
/* -------------------------------------------------------------------------- */

export type Sentence = { start: number; end: number; text: string };

/** Sentence spans over the script's full text, by character offset. */
export function sentencesOf(text: string): Sentence[] {
  const out: Sentence[] = [];
  const pattern = /[^.!?\n]+[.!?]+["”']?|\n\n/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    if (!raw.trim()) continue;
    const leading = raw.length - raw.trimStart().length;
    const start = match.index + leading;
    const end = match.index + raw.trimEnd().length;
    if (end - start < 24) continue;
    out.push({ start, end, text: text.slice(start, end) });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* The sittings                                                                */
/* -------------------------------------------------------------------------- */

type SampleSitting = {
  /** Days before the most recent Sunday. */
  daysBefore: number;
  hour: number;
  minute: number;
  count: number;
  /** Mean shift applied to every strand in this sitting. */
  bias: number;
  /** Additional shift accumulated from the first script to the last. */
  fatigue: number;
};

const SAMPLE_SITTINGS: SampleSitting[] = [
  { daysBefore: 7, hour: 9, minute: 35, count: 14, bias: 0.35, fatigue: -0.2 },
  { daysBefore: 6, hour: 19, minute: 50, count: 12, bias: -0.05, fatigue: -0.45 },
  { daysBefore: 4, hour: 21, minute: 20, count: 13, bias: -0.5, fatigue: -0.6 },
  { daysBefore: 3, hour: 22, minute: 10, count: 11, bias: -0.95, fatigue: -0.95 },
  { daysBefore: 0, hour: 10, minute: 5, count: 9, bias: 0.4, fatigue: -0.15 },
];

export const SAMPLE_MARKED_COUNT = SAMPLE_SITTINGS.reduce((sum, s) => sum + s.count, 0);

/** Midnight on the most recent Sunday at or before `now`, in local time. */
function lastSunday(now: number): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

/* -------------------------------------------------------------------------- */
/* Her completions                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Sample completions, in her voice. Some appear on several scripts on purpose:
 * that is the behaviour the tool is built to surface, and a sample history with
 * no repetition in it would make the duplicate warning look like it never
 * fires.
 */
const NOTES: Record<string, string[]> = {
  "strongest.why": [
    "you have read the line rather than reported it",
    "it is the only place you let a sentence be short",
    "the point survives without the quotation, which is rare",
    "you use the word Priestley chose, not a synonym for it",
    "you have noticed something the class did not say",
  ],
  "unevidenced.where": [
    "Act One, just before the doorbell",
    "Mrs Birling in Act Two, the charity refusal",
    "the Inspector's final speech",
    "Sheila at Milwards, Act One",
    "Eric's row with his father in Act Three",
  ],
  "dropped.word": [
    "the word 'members'",
    "the stage direction, not the line",
    "'still left with us'",
    "the plural",
    "the dash at the end",
  ],
  "named.effect": [
    "distrust everything he says next",
    "notice the family cannot hear it",
    "feel the room get colder",
    "wait, which is the point",
  ],
  "context-parked.how": [
    "use it to explain why Birling is confident, not just that he is",
    "make it the reason the first audience laughed here",
    "let it explain the gap between 1912 and 1945",
    "tie it to your claim about the younger generation",
  ],
  "retelling.instead": [
    "the paragraph about the lighting, which you cut short",
    "what the Inspector's method does to the audience",
    "your point about Eva never speaking",
    "why nobody in the room can see the whole chain",
  ],
  "order.which": [
    "the structure of the ending",
    "Eva's absence",
    "the Inspector's method",
    "Birling and the Titanic",
  ],
  "register.rewrite": [
    "Priestley presents Birling as unable to imagine obligation without a price",
    "the effect on the audience is one of withheld relief",
    "this positions the audience outside the family's comfort",
    "Priestley withholds the resolution the structure has promised",
  ],
  "topic-sentence.claim": [
    "Priestley uses the lighting to make the family's self-image visible",
    "Eva's silence is what makes the responsibility unanswerable",
    "the Inspector's authority is dramatic rather than legal",
    "Birling's economics are discredited before he states them",
  ],
};

const NEXT_STEPS = [
  "One thing: put the question's word into every topic sentence before you write the paragraph.",
  "One thing: cut every quotation down to five words and see whether the point survives.",
  "One thing: write the conclusion first next time, then delete it and write it again.",
  "One thing: after each quotation, ask 'why that word' and answer it in one sentence.",
  "One thing: move your best paragraph to the front.",
  "One thing: no plot for a whole essay. If I know it happens, do not tell me it happens.",
  "One thing: one stage direction, read as carefully as you read a line of speech.",
];

/* -------------------------------------------------------------------------- */
/* Building a seeded judgement                                                 */
/* -------------------------------------------------------------------------- */

function seededMarks(script: Script, shift: number, random: () => number): MarkSet {
  const marks: MarkSet = {};
  for (const strand of STRAND_IDS) {
    const raw = script.latent[strand] + shift + (random() - 0.5) * 1.15;
    marks[strand] = Math.max(0, Math.min(MAX_PER_STRAND, Math.round(raw)));
  }
  return marks;
}

function choose<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

function stemsFor(marks: MarkSet, random: () => number): Stem[] {
  const wanted: string[] = [];
  const strong = STRAND_IDS.filter((strand) => (marks[strand] ?? 0) >= 4);
  if (strong.length) wanted.push("strongest");
  if ((marks.evidence ?? 0) <= 3) wanted.push(random() < 0.5 ? "dropped" : "unevidenced");
  if ((marks.method ?? 0) <= 3) wanted.push("named");
  if ((marks.argument ?? 0) <= 3) wanted.push(random() < 0.5 ? "question-word" : "order");
  if ((marks.context ?? 0) <= 2) wanted.push("context-parked");
  if ((marks.expression ?? 0) <= 2) wanted.push("register");
  if ((marks.argument ?? 0) >= 4 && random() < 0.35) wanted.push("topic-sentence");
  if (!wanted.length) wanted.push("strongest");

  const shuffled = wanted
    .map((id) => ({ id, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.id);

  const take = 1 + Math.floor(random() * 2.6);
  const seen = new Set<string>();
  const out: Stem[] = [];
  for (const id of shuffled) {
    if (seen.has(id)) continue;
    seen.add(id);
    const stem = STEM_BY_ID[id];
    if (stem) out.push(stem);
    if (out.length >= take) break;
  }
  return out;
}

function buildComment(
  stem: Stem,
  script: Script,
  sentences: Sentence[],
  random: () => number,
  at: number,
  index: number
): { comment: CommentInstance; clips: Clip[] } {
  const values: Record<string, string> = {};
  const clips: Clip[] = [];
  for (const slot of stem.slots) {
    if (slot.kind === "quote") {
      const sentence = choose(random, sentences);
      const clip: Clip = {
        id: `clip-${script.id}-${index}-${slot.id}`,
        start: sentence.start,
        end: sentence.end,
        text: sentence.text,
        at,
      };
      clips.push(clip);
      values[slot.id] = clip.text;
    } else if (slot.kind === "pick") {
      values[slot.id] = choose(random, slot.options);
    } else {
      const bank = NOTES[`${stem.id}.${slot.id}`] ?? ["needs a specific note here"];
      values[slot.id] = choose(random, bank);
    }
  }
  return {
    comment: {
      id: `cmt-${script.id}-${index}`,
      stemId: stem.id,
      values,
      clipIds: clips.map((clip) => clip.id),
      at,
    },
    clips,
  };
}

/** Builds the whole sample document. Deterministic apart from `now`. */
export function buildSampleDoc(now: number): Doc {
  const random = rng(0xa11_ce_09);
  const sunday = lastSunday(now);

  const sittings: Sitting[] = [];
  const judgements: Record<number, Judgement> = {};

  let cursor = 0;
  SAMPLE_SITTINGS.forEach((plan, sittingIndex) => {
    const start = new Date(sunday);
    start.setDate(start.getDate() - plan.daysBefore);
    start.setHours(plan.hour, plan.minute, 0, 0);
    const startedAt = start.getTime();

    const id = `sample-${sittingIndex + 1}`;
    let clock = startedAt;

    for (let n = 0; n < plan.count; n += 1) {
      const scriptId = MARKING_ORDER[cursor];
      cursor += 1;
      const script = SCRIPT_BY_ID.get(scriptId);
      if (!script) continue;

      const progress = plan.count > 1 ? n / (plan.count - 1) : 0;
      const shift = plan.bias + plan.fatigue * progress;
      const marks = seededMarks(script, shift, random);

      // Time per script: mostly under the four-minute budget, occasionally not.
      const seconds = Math.round(150 + random() * 190 + (random() < 0.12 ? 160 : 0));
      clock += seconds * 1000 + Math.round(random() * 25_000);

      const text = scriptText(script);
      const sentences = sentencesOf(text);
      const comments: CommentInstance[] = [];
      const clips: Clip[] = [];
      if (sentences.length) {
        stemsFor(marks, random).forEach((stem, index) => {
          const built = buildComment(stem, script, sentences, random, clock, index);
          comments.push(built.comment);
          clips.push(...built.clips);
        });
      }

      judgements[scriptId] = {
        scriptId,
        marks,
        clips,
        comments,
        nextStep: random() < 0.82 ? choose(random, NEXT_STEPS) : "",
        committedAt: clock,
        sittingId: id,
        secondsSpent: seconds,
        anchors: [],
        reread: null,
        resolution: null,
        revisions: [],
        flagged: random() < 0.06,
      };
    }

    sittings.push({ id, startedAt, endedAt: clock, sample: true });
  });

  return {
    version: 1,
    judgements,
    sittings,
    currentSittingId: null,
    deferred: [],
    rereadQueue: [],
    settings: { revealNames: false, showAnchors: true },
    sampleSeededAt: now,
  };
}
