/**
 * The document, the reducer, the undo stack and the persistence layer.
 *
 * Two rules hold this together, and both exist because a marking tool that
 * quietly corrupts its own numbers is worse than no tool at all.
 *
 * 1. STORE DECISIONS, DERIVE EVERYTHING ELSE. The document contains only things
 *    she did: an integer 0..6 against a strand, a clip with character offsets,
 *    a comment with the slots she filled, a timestamp. No total, no mean, no
 *    band, no count and no rank is ever written into it. Every number on screen
 *    is recomputed from the decisions each render. There is therefore no path
 *    by which a displayed figure can drift away from the thing it describes,
 *    because there is nothing to drift.
 *
 * 2. UNDO BY SNAPSHOT, NOT BY INVERSE. Each mutation pushes the whole previous
 *    document onto a stack. Documents are plain data with structural sharing,
 *    so a snapshot of a hundred-odd judgements costs a few object references.
 *    Hand-written inverse operations are where undo bugs live; there are none
 *    here to get wrong.
 *
 * Marks are integers throughout. Nothing rounds, so nothing accumulates
 * rounding. Means are computed for display, formatted at the edge, and never
 * read back into the document.
 */

import { MARKING_ORDER, SCRIPTS } from "./corpus";
import { MAX_PER_STRAND, STRAND_IDS, type StrandId } from "./rubric";

/* -------------------------------------------------------------------------- */
/* Document shape                                                              */
/* -------------------------------------------------------------------------- */

export type MarkSet = Partial<Record<StrandId, number>>;

/** A passage lifted out of the script, by character offset into its full text. */
export type Clip = {
  id: string;
  start: number;
  end: number;
  text: string;
  at: number;
};

export type CommentInstance = {
  id: string;
  stemId: string;
  /** slotId → what she put in it. Quote slots hold the clipped text. */
  values: Record<string, string>;
  clipIds: string[];
  at: number;
};

export type Revision = {
  at: number;
  kind: "reopened" | "anchor-conflict" | "reread";
  from: MarkSet;
  to: MarkSet;
  note: string;
};

export type Judgement = {
  scriptId: number;
  marks: MarkSet;
  clips: Clip[];
  comments: CommentInstance[];
  nextStep: string;
  committedAt: number | null;
  sittingId: string | null;
  secondsSpent: number;
  /** Script ids of the marked work she was shown alongside this one. */
  anchors: number[];
  /** A blind second reading. Kept beside the first mark; never replaces it. */
  reread: { marks: MarkSet; at: number; sittingId: string | null } | null;
  resolution: { at: number; kept: "first" | "second"; note: string } | null;
  revisions: Revision[];
  flagged: boolean;
};

export type Sitting = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  /** Part of the pre-loaded sample history rather than this session's work. */
  sample: boolean;
};

export type Doc = {
  version: 1;
  judgements: Record<number, Judgement>;
  sittings: Sitting[];
  currentSittingId: string | null;
  /** Scripts pushed to the back of the queue rather than marked. */
  deferred: number[];
  /** Scripts drawn for a blind second reading, in the order drawn. */
  rereadQueue: number[];
  settings: {
    revealNames: boolean;
    showAnchors: boolean;
  };
  /** When the sample history was laid down, so the interface can say so. */
  sampleSeededAt: number;
};

export type State = {
  doc: Doc;
  past: Doc[];
  future: Doc[];
  /** Label of the action that would be undone, for the status line. */
  lastLabel: string | null;
  /** Set when an action was merged into the previous one, to keep merging. */
  coalesceKey: string | null;
  coalesceAt: number;
};

export const UNDO_DEPTH = 80;

export function emptyJudgement(scriptId: number): Judgement {
  return {
    scriptId,
    marks: {},
    clips: [],
    comments: [],
    nextStep: "",
    committedAt: null,
    sittingId: null,
    secondsSpent: 0,
    anchors: [],
    reread: null,
    resolution: null,
    revisions: [],
    flagged: false,
  };
}

export function judgementOf(doc: Doc, scriptId: number): Judgement {
  return doc.judgements[scriptId] ?? emptyJudgement(scriptId);
}

/* -------------------------------------------------------------------------- */
/* Derived values — every one of these is recomputed, never stored             */
/* -------------------------------------------------------------------------- */

export function isComplete(marks: MarkSet): boolean {
  return STRAND_IDS.every((strand) => typeof marks[strand] === "number");
}

/** Sum of the strands that have been set. Integers only, so exact. */
export function totalOf(marks: MarkSet): number {
  let total = 0;
  for (const strand of STRAND_IDS) total += marks[strand] ?? 0;
  return total;
}

export function strandsSet(marks: MarkSet): number {
  return STRAND_IDS.filter((strand) => typeof marks[strand] === "number").length;
}

/** The mark that stands: the first reading unless she chose the second. */
export function standingMarks(judgement: Judgement): MarkSet {
  if (judgement.resolution?.kept === "second" && judgement.reread) {
    return judgement.reread.marks;
  }
  return judgement.marks;
}

export function committedList(doc: Doc): Judgement[] {
  return Object.values(doc.judgements)
    .filter((judgement) => judgement.committedAt !== null)
    .sort((a, b) => (a.committedAt ?? 0) - (b.committedAt ?? 0));
}

/** 1-based place in the sequence she actually marked in. */
export function markingSequence(doc: Doc): Map<number, number> {
  const map = new Map<number, number>();
  committedList(doc).forEach((judgement, index) => {
    map.set(judgement.scriptId, index + 1);
  });
  return map;
}

/** Mean to one decimal, computed for display only and never written back. */
export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Next script to mark: registered order, skipping done, deferred at the back. */
export function queueOf(doc: Doc): number[] {
  const deferred = new Set(doc.deferred);
  const outstanding = MARKING_ORDER.filter(
    (id) => doc.judgements[id]?.committedAt == null
  );
  return [
    ...outstanding.filter((id) => !deferred.has(id)),
    ...outstanding.filter((id) => deferred.has(id)),
  ];
}

export function sittingOf(doc: Doc, id: string | null): Sitting | null {
  if (!id) return null;
  return doc.sittings.find((sitting) => sitting.id === id) ?? null;
}

/**
 * How far apart two readings of the same script are: the largest single-strand
 * disagreement, and the difference in total. Reported as two numbers because
 * they say different things — five strands each a point adrift is a different
 * problem from one strand three adrift.
 */
export function disagreement(a: MarkSet, b: MarkSet): { worst: number; total: number } {
  let worst = 0;
  for (const strand of STRAND_IDS) {
    const left = a[strand];
    const right = b[strand];
    if (typeof left === "number" && typeof right === "number") {
      worst = Math.max(worst, Math.abs(left - right));
    }
  }
  return { worst, total: totalOf(b) - totalOf(a) };
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                     */
/* -------------------------------------------------------------------------- */

export type Action =
  | { type: "hydrate"; doc: Doc }
  | { type: "set-mark"; scriptId: number; strand: StrandId; value: number }
  | { type: "clear-mark"; scriptId: number; strand: StrandId }
  | { type: "add-clip"; scriptId: number; clip: Clip }
  | { type: "remove-clip"; scriptId: number; clipId: string }
  | { type: "add-comment"; scriptId: number; comment: CommentInstance }
  | { type: "remove-comment"; scriptId: number; commentId: string }
  | { type: "set-next-step"; scriptId: number; text: string }
  | { type: "toggle-flag"; scriptId: number }
  | { type: "commit"; scriptId: number; seconds: number; anchors: number[] }
  | { type: "reopen"; scriptId: number; note: string }
  | { type: "defer"; scriptId: number }
  | { type: "set-reread-queue"; ids: number[] }
  | { type: "set-reread-mark"; scriptId: number; strand: StrandId; value: number }
  | { type: "file-reread"; scriptId: number }
  | { type: "resolve-reread"; scriptId: number; kept: "first" | "second"; note: string }
  | { type: "discard-reread"; scriptId: number }
  | { type: "set-setting"; key: keyof Doc["settings"]; value: boolean }
  | { type: "clear-all" }
  | { type: "undo" }
  | { type: "redo" };

/** Actions that should not be individually undoable, or not undoable at all. */
const NOT_UNDOABLE = new Set<Action["type"]>(["hydrate", "undo", "redo", "set-setting"]);

function labelFor(action: Action, doc: Doc): string {
  const script = (id: number) => `script ${String(id).padStart(3, "0")}`;
  switch (action.type) {
    case "set-mark":
      return `${action.strand} ${action.value} on ${script(action.scriptId)}`;
    case "clear-mark":
      return `cleared ${action.strand} on ${script(action.scriptId)}`;
    case "add-clip":
      return `clipping on ${script(action.scriptId)}`;
    case "remove-clip":
      return `removed a clip on ${script(action.scriptId)}`;
    case "add-comment":
      return `comment on ${script(action.scriptId)}`;
    case "remove-comment":
      return `removed a comment on ${script(action.scriptId)}`;
    case "set-next-step":
      return `next step on ${script(action.scriptId)}`;
    case "toggle-flag":
      return `${judgementOf(doc, action.scriptId).flagged ? "unflagged" : "flagged"} ${script(action.scriptId)}`;
    case "commit":
      return `marking ${script(action.scriptId)}`;
    case "reopen":
      return `reopening ${script(action.scriptId)}`;
    case "defer":
      return `deferring ${script(action.scriptId)}`;
    case "set-reread-queue":
      return `drawing ${action.ids.length} for second reading`;
    case "set-reread-mark":
      return `second reading of ${script(action.scriptId)}`;
    case "file-reread":
      return `filing second reading of ${script(action.scriptId)}`;
    case "resolve-reread":
      return `resolving ${script(action.scriptId)}`;
    case "discard-reread":
      return `discarding second reading of ${script(action.scriptId)}`;
    case "clear-all":
      return "clearing every mark";
    default:
      return "that";
  }
}

/**
 * Keystroke-level edits inside one text field become one undo step rather than
 * eighty. Anything without a key is its own step, which is what she expects of
 * a mark: one press, one undo.
 */
function coalesceKeyFor(action: Action): string | null {
  switch (action.type) {
    case "set-next-step":
      return `next-step:${action.scriptId}`;
    default:
      return null;
  }
}

const COALESCE_WINDOW_MS = 1500;

function withJudgement(
  doc: Doc,
  scriptId: number,
  update: (judgement: Judgement) => Judgement
): Doc {
  const current = judgementOf(doc, scriptId);
  return {
    ...doc,
    judgements: { ...doc.judgements, [scriptId]: update(current) },
  };
}

function applyToDoc(doc: Doc, action: Action, now: number): Doc {
  switch (action.type) {
    case "set-mark": {
      const value = Math.max(0, Math.min(MAX_PER_STRAND, Math.round(action.value)));
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        marks: { ...judgement.marks, [action.strand]: value },
      }));
    }
    case "clear-mark":
      return withJudgement(doc, action.scriptId, (judgement) => {
        const marks = { ...judgement.marks };
        delete marks[action.strand];
        return { ...judgement, marks };
      });
    case "add-clip":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        clips: [...judgement.clips, action.clip],
      }));
    case "remove-clip":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        clips: judgement.clips.filter((clip) => clip.id !== action.clipId),
        comments: judgement.comments.map((comment) => ({
          ...comment,
          clipIds: comment.clipIds.filter((id) => id !== action.clipId),
        })),
      }));
    case "add-comment":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        comments: [...judgement.comments, action.comment],
      }));
    case "remove-comment":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        comments: judgement.comments.filter((comment) => comment.id !== action.commentId),
      }));
    case "set-next-step":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        nextStep: action.text,
      }));
    case "toggle-flag":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        flagged: !judgement.flagged,
      }));
    case "commit": {
      const sitting = ensureSitting(doc, now);
      return withJudgement(
        { ...sitting.doc, deferred: sitting.doc.deferred.filter((id) => id !== action.scriptId) },
        action.scriptId,
        (judgement) => ({
          ...judgement,
          committedAt: now,
          sittingId: sitting.id,
          secondsSpent: judgement.secondsSpent + Math.max(0, Math.round(action.seconds)),
          anchors: action.anchors,
        })
      );
    }
    case "reopen":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        committedAt: null,
        revisions: [
          ...judgement.revisions,
          {
            at: now,
            kind: "reopened",
            from: { ...judgement.marks },
            to: { ...judgement.marks },
            note: action.note,
          },
        ],
      }));
    case "defer":
      return {
        ...doc,
        deferred: doc.deferred.includes(action.scriptId)
          ? doc.deferred
          : [...doc.deferred, action.scriptId],
      };
    case "set-reread-queue":
      return { ...doc, rereadQueue: action.ids };
    case "set-reread-mark": {
      const value = Math.max(0, Math.min(MAX_PER_STRAND, Math.round(action.value)));
      const sitting = ensureSitting(doc, now);
      return withJudgement(sitting.doc, action.scriptId, (judgement) => ({
        ...judgement,
        reread: {
          marks: { ...(judgement.reread?.marks ?? {}), [action.strand]: value },
          at: judgement.reread?.at ?? now,
          sittingId: sitting.id,
        },
      }));
    }
    case "file-reread":
      return {
        ...doc,
        rereadQueue: doc.rereadQueue.filter((id) => id !== action.scriptId),
      };
    case "resolve-reread":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        resolution: { at: now, kept: action.kept, note: action.note },
        revisions:
          action.kept === "second" && judgement.reread
            ? [
                ...judgement.revisions,
                {
                  at: now,
                  kind: "reread",
                  from: { ...judgement.marks },
                  to: { ...judgement.reread.marks },
                  note: action.note,
                },
              ]
            : judgement.revisions,
      }));
    case "discard-reread":
      return withJudgement(doc, action.scriptId, (judgement) => ({
        ...judgement,
        reread: null,
        resolution: null,
      }));
    case "set-setting":
      return { ...doc, settings: { ...doc.settings, [action.key]: action.value } };
    case "clear-all":
      return {
        ...doc,
        judgements: {},
        deferred: [],
        rereadQueue: [],
        sittings: [],
        currentSittingId: null,
      };
    default:
      return doc;
  }
}

/** Four hours of silence ends a sitting; the next mark opens a new one. */
const SITTING_GAP_MS = 4 * 60 * 60 * 1000;

function ensureSitting(doc: Doc, now: number): { doc: Doc; id: string } {
  const current = doc.sittings.find((sitting) => sitting.id === doc.currentSittingId);
  if (current && !current.endedAt && now - current.startedAt < SITTING_GAP_MS) {
    return { doc, id: current.id };
  }
  const id = `sit-${now.toString(36)}`;
  const sittings = doc.sittings.map((sitting) =>
    sitting.id === current?.id ? { ...sitting, endedAt: sitting.endedAt ?? now } : sitting
  );
  return {
    doc: {
      ...doc,
      sittings: [...sittings, { id, startedAt: now, endedAt: null, sample: false }],
      currentSittingId: id,
    },
    id,
  };
}

export function reducer(state: State, action: Action): State {
  const now = Date.now();

  if (action.type === "hydrate") {
    return { doc: action.doc, past: [], future: [], lastLabel: null, coalesceKey: null, coalesceAt: 0 };
  }

  if (action.type === "undo") {
    if (!state.past.length) return state;
    const previous = state.past[state.past.length - 1];
    return {
      doc: previous,
      past: state.past.slice(0, -1),
      future: [state.doc, ...state.future].slice(0, UNDO_DEPTH),
      lastLabel: null,
      coalesceKey: null,
      coalesceAt: 0,
    };
  }

  if (action.type === "redo") {
    if (!state.future.length) return state;
    const next = state.future[0];
    return {
      doc: next,
      past: [...state.past, state.doc].slice(-UNDO_DEPTH),
      future: state.future.slice(1),
      lastLabel: null,
      coalesceKey: null,
      coalesceAt: 0,
    };
  }

  const nextDoc = applyToDoc(state.doc, action, now);
  if (nextDoc === state.doc) return state;

  if (NOT_UNDOABLE.has(action.type)) {
    return { ...state, doc: nextDoc };
  }

  const key = coalesceKeyFor(action);
  const merge =
    key !== null && key === state.coalesceKey && now - state.coalesceAt < COALESCE_WINDOW_MS;

  return {
    doc: nextDoc,
    past: merge ? state.past : [...state.past, state.doc].slice(-UNDO_DEPTH),
    future: [],
    lastLabel: labelFor(action, state.doc),
    coalesceKey: key,
    coalesceAt: now,
  };
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * localStorage, and nothing else. There is no server here and the interface
 * says so where it matters: this is a demonstration, her work lives in one
 * browser profile on one machine, and clearing site data destroys it. That is
 * why Export exists and why it is one keystroke.
 */
export const STORAGE_KEY = "marking/aic-responsibility/v1";

export function serialise(doc: Doc): string {
  return JSON.stringify(doc);
}

/** Returns null for anything that is not a document of this exact shape. */
export function deserialise(raw: string): Doc | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Partial<Doc>;
  if (candidate.version !== 1) return null;
  if (typeof candidate.judgements !== "object" || candidate.judgements === null) return null;
  if (!Array.isArray(candidate.sittings)) return null;

  const known = new Set(SCRIPTS.map((script) => script.id));
  const judgements: Record<number, Judgement> = {};
  for (const [key, value] of Object.entries(candidate.judgements)) {
    const scriptId = Number(key);
    if (!known.has(scriptId)) continue;
    const judgement = value as Partial<Judgement>;
    const marks: MarkSet = {};
    for (const strand of STRAND_IDS) {
      const mark = judgement.marks?.[strand];
      if (typeof mark === "number" && Number.isInteger(mark) && mark >= 0 && mark <= MAX_PER_STRAND) {
        marks[strand] = mark;
      }
    }
    judgements[scriptId] = {
      ...emptyJudgement(scriptId),
      ...judgement,
      scriptId,
      marks,
      clips: Array.isArray(judgement.clips) ? judgement.clips : [],
      comments: Array.isArray(judgement.comments) ? judgement.comments : [],
      revisions: Array.isArray(judgement.revisions) ? judgement.revisions : [],
      anchors: Array.isArray(judgement.anchors) ? judgement.anchors : [],
      nextStep: typeof judgement.nextStep === "string" ? judgement.nextStep : "",
    };
  }

  return {
    version: 1,
    judgements,
    sittings: candidate.sittings,
    currentSittingId: candidate.currentSittingId ?? null,
    deferred: Array.isArray(candidate.deferred) ? candidate.deferred.filter((id) => known.has(id)) : [],
    rereadQueue: Array.isArray(candidate.rereadQueue)
      ? candidate.rereadQueue.filter((id) => known.has(id))
      : [],
    settings: {
      revealNames: candidate.settings?.revealNames ?? false,
      showAnchors: candidate.settings?.showAnchors ?? true,
    },
    sampleSeededAt: typeof candidate.sampleSeededAt === "number" ? candidate.sampleSeededAt : 0,
  };
}
