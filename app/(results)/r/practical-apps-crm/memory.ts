import { daysBetween, shortDate, TODAY } from "./dates";
import { AUTHOR_BY_ID, BOOK_BY_ID, EDITOR_BY_ID, SUBMISSIONS } from "./seed";
import type {
  Author,
  Book,
  Editor,
  ExclusiveAction,
  Note,
  Saved,
  Submission,
} from "./types";

/** First chase is polite at eight weeks; eleven is late. */
export const CHASE_DUE = 56;
export const CHASE_LATE = 77;

export type LiveSubmission = Submission & {
  book: Book;
  editor: Editor;
  author: Author;
  chases: { at: string; note: string }[];
  exclusive: ExclusiveAction | null;
  bids: { at: string; note: string }[];
  daysOut: number;
  exclusiveUntil: string | null;
};

export type ClockKind = "chase" | "exclusive" | "offer" | "auction";

export type Clock = {
  id: string;
  kind: ClockKind;
  severity: "due" | "late" | "soon" | "running";
  title: string;
  detail: string;
  editorId: string;
  bookId: string;
  authorId: string;
  submissionId: string;
};

export function currentImprint(editor: Editor): { imprint: string; house: string; role: string } {
  const now = editor.tenures.find((t) => t.to === null) ?? editor.tenures[editor.tenures.length - 1];
  return { imprint: now.imprint, house: now.house, role: now.role };
}

export function liveOf(saved: Saved): LiveSubmission[] {
  return SUBMISSIONS.map((sub) => {
    const book = BOOK_BY_ID[sub.bookId];
    const editor = EDITOR_BY_ID[sub.editorId];
    const author = AUTHOR_BY_ID[book.authorId];
    const exclusive = saved.exclusives[sub.id] ?? null;
    let exclusiveUntil =
      sub.state.kind === "out" && sub.state.exclusiveUntil ? sub.state.exclusiveUntil : null;
    if (exclusive?.action === "expired") exclusiveUntil = null;
    if (exclusive?.action === "extended" && exclusive.until) exclusiveUntil = exclusive.until;
    return {
      ...sub,
      book,
      editor,
      author,
      chases: saved.chases[sub.id] ?? [],
      exclusive,
      bids: saved.bids[sub.id] ?? [],
      daysOut: daysBetween(sub.sent, TODAY),
      exclusiveUntil,
    };
  });
}

export function isOpen(sub: LiveSubmission): boolean {
  if (sub.state.kind === "pass" || sub.state.kind === "withdrawn") return false;
  return true;
}

export function clocksOf(live: LiveSubmission[]): Clock[] {
  const clocks: Clock[] = [];

  for (const sub of live) {
    if (!isOpen(sub)) continue;
    const title = sub.book.title;
    const who = sub.editor.name;

    if (sub.exclusive?.action === "expired") {
      clocks.push({
        id: `ex-${sub.id}`,
        kind: "exclusive",
        severity: "running",
        title,
        detail: `${who}'s exclusive on ${title} lapsed this morning. The list is open.`,
        editorId: sub.editorId,
        bookId: sub.bookId,
        authorId: sub.author.id,
        submissionId: sub.id,
      });
    } else if (sub.exclusiveUntil) {
      const days = daysBetween(TODAY, sub.exclusiveUntil);
      clocks.push({
        id: `ex-${sub.id}`,
        kind: "exclusive",
        severity: days < 0 ? "late" : days <= 3 ? "soon" : "running",
        title,
        detail:
          days < 0
            ? `${who}'s exclusive on ${title} lapsed ${-days === 1 ? "yesterday" : `${-days} days ago`}.`
            : days === 0
              ? `${who}'s exclusive on ${title} ends today.`
              : `${who}'s exclusive on ${title} ends in ${days} day${days === 1 ? "" : "s"}.`,
        editorId: sub.editorId,
        bookId: sub.bookId,
        authorId: sub.author.id,
        submissionId: sub.id,
      });
    }

    if (sub.state.kind === "offer") {
      const days = daysBetween(TODAY, sub.state.othersBy);
      clocks.push({
        id: `off-${sub.id}`,
        kind: "offer",
        severity: days <= 2 ? "soon" : "running",
        title,
        detail: `${who} offered on ${title}. Everyone else answers by ${shortDate(sub.state.othersBy)} — ${days} day${days === 1 ? "" : "s"}.`,
        editorId: sub.editorId,
        bookId: sub.bookId,
        authorId: sub.author.id,
        submissionId: sub.id,
      });
    }

    if (sub.state.kind === "auction") {
      const days = daysBetween(TODAY, sub.state.close);
      clocks.push({
        id: `auc-${sub.id}`,
        kind: "auction",
        severity: days <= 2 ? "soon" : "running",
        title,
        detail: `${title} closes ${sub.state.closeLabel}. ${who} is in.`,
        editorId: sub.editorId,
        bookId: sub.bookId,
        authorId: sub.author.id,
        submissionId: sub.id,
      });
    }

    if (sub.state.kind === "out" || sub.state.kind === "held") {
      const lastChase = sub.chases[sub.chases.length - 1];
      const chasedToday = lastChase?.at === TODAY;
      const chasedRecently = lastChase && daysBetween(lastChase.at, TODAY) < 14;
      if (chasedToday || (!chasedRecently && sub.daysOut >= CHASE_DUE)) {
        const weeks = Math.round(sub.daysOut / 7);
        clocks.push({
          id: `ch-${sub.id}`,
          kind: "chase",
          severity: chasedToday ? "running" : sub.daysOut >= CHASE_LATE ? "late" : "due",
          title,
          detail: chasedToday
            ? `Chased this morning. ${who} still has ${title} — ${weeks} weeks.`
            : `${who} has had ${title} for ${weeks} weeks${lastChase ? `; last chased ${lastChase.at}` : ""}.`,
          editorId: sub.editorId,
          bookId: sub.bookId,
          authorId: sub.author.id,
          submissionId: sub.id,
        });
      }
    }
  }

  const rank = { late: 0, due: 1, soon: 2, running: 3 };
  const kindRank = { chase: 0, exclusive: 1, offer: 2, auction: 3 };
  clocks.sort((a, b) => {
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    return kindRank[a.kind] - kindRank[b.kind];
  });

  // One auction clock is enough — the clean board is the point, not four identical alarms.
  const seenAuction = new Set<string>();
  return clocks.filter((clock) => {
    if (clock.kind !== "auction") return true;
    if (seenAuction.has(clock.bookId)) return false;
    seenAuction.add(clock.bookId);
    clock.detail = `${clock.title} closes Friday 4 September, noon London. Same information to every house.`;
    return true;
  });
}

export function imprintMates(editor: Editor): Editor[] {
  const here = currentImprint(editor).imprint;
  return Object.values(EDITOR_BY_ID).filter(
    (other) => other.id !== editor.id && currentImprint(other).imprint === here,
  );
}

/** Another editor at the same imprint already has this book. */
export function conflictsFor(editor: Editor, live: LiveSubmission[]): LiveSubmission[] {
  const here = currentImprint(editor).imprint;
  const mateIds = new Set(imprintMates(editor).map((m) => m.id));
  return live.filter(
    (sub) =>
      isOpen(sub) &&
      mateIds.has(sub.editorId) &&
      currentImprint(sub.editor).imprint === here,
  );
}

export function lastTime(editorId: string, live: LiveSubmission[]): LiveSubmission | null {
  const past = live
    .filter((sub) => sub.editorId === editorId && !isOpen(sub))
    .sort((a, b) => (b.state.kind === "pass" || b.state.kind === "withdrawn" ? b.state.at : b.sent).localeCompare(
      a.state.kind === "pass" || a.state.kind === "withdrawn" ? a.state.at : a.sent,
    ));
  return past[0] ?? null;
}

export function notesFor(
  personNotes: Note[],
  extra: Note[],
  personId: string,
  audience: "desk" | "author",
): Note[] {
  const mine = extra.filter((n) => n.id.startsWith(`note:${personId}:`));
  const all = [...personNotes, ...mine];
  const visible =
    audience === "author" ? all.filter((n) => n.audience === "shareable") : all;
  return visible.sort((a, b) => b.at.localeCompare(a.at));
}

export function deskNotes(personNotes: Note[], extra: Note[], personId: string): Note[] {
  return notesFor(personNotes, extra, personId, "desk").filter((n) => n.audience === "desk");
}

export function shareableNotes(personNotes: Note[], extra: Note[], personId: string): Note[] {
  return notesFor(personNotes, extra, personId, "author");
}

export function authorLetter(author: Author, live: LiveSubmission[], extra: Note[]) {
  const books = live.filter((s) => s.author.id === author.id);
  const open = books.filter(isOpen);
  const openBooks = new Set(open.map((row) => row.bookId));
  const passes = books.filter(
    (s) =>
      s.state.kind === "pass" && (openBooks.size === 0 || openBooks.has(s.bookId)),
  );
  const shareablePass = passes
    .map((s) => (s.state.kind === "pass" ? s.state.shareable : undefined))
    .filter((line): line is string => Boolean(line));
  const shareable = shareableNotes(author.notes, extra, author.id);

  return {
    open,
    passCount: passes.length,
    shareablePass,
    shareable,
    between: author.betweenBooks ?? null,
  };
}

export type IndexRow = {
  id: string;
  kind: "editor" | "author";
  name: string;
  line: string;
  clock?: ClockKind;
  /** Has something out, or a clock — keep them above the fold. */
  live: boolean;
};

export function indexRows(live: LiveSubmission[], clocks: Clock[], query: string): IndexRow[] {
  const q = query.trim().toLowerCase();
  const clockByEditor = new Map<string, ClockKind>();
  for (const clock of clocks) {
    if (!clockByEditor.has(clock.editorId)) clockByEditor.set(clock.editorId, clock.kind);
  }

  const editors: IndexRow[] = Object.values(EDITOR_BY_ID).map((editor) => {
    const now = currentImprint(editor);
    const last = lastTime(editor.id, live);
    const openNow = live.filter((sub) => sub.editorId === editor.id && isOpen(sub));
    const lastLine = last
      ? last.state.kind === "pass"
        ? `Last time: passed on ${last.book.title}`
        : `Last time: ${last.book.title}`
      : openNow.length
        ? `Has ${openNow.map((sub) => sub.book.title).join(", ")}.`
        : "No history on the desk yet";
    return {
      id: editor.id,
      kind: "editor" as const,
      name: editor.name,
      line: `${now.role}, ${now.imprint}. ${lastLine}`,
      clock: clockByEditor.get(editor.id),
      live: openNow.length > 0 || Boolean(clockByEditor.get(editor.id)),
    };
  });

  const authors: IndexRow[] = Object.values(AUTHOR_BY_ID).map((author) => {
    const open = live.filter((s) => s.author.id === author.id && isOpen(s));
    const line =
      open.length > 0
        ? `${open.length} out. ${[...new Set(open.map((s) => s.book.title))].join("; ")}.`
        : author.betweenBooks ?? "Nothing out.";
    return {
      id: author.id,
      kind: "author" as const,
      name: author.name,
      line,
      live: open.length > 0,
    };
  });

  const rows = [...editors, ...authors];
  if (!q) {
    const ringing = editors.filter((row) => row.clock);
    const restEditors = editors.filter((row) => !row.clock);
    const withBooks = authors.filter((row) => /\d+ out/.test(row.line));
    return [...ringing, ...withBooks, ...restEditors];
  }

  return rows.filter((row) => {
    const editor = row.kind === "editor" ? EDITOR_BY_ID[row.id] : null;
    const imprint = editor ? currentImprint(editor).imprint.toLowerCase() : "";
    const house = editor ? currentImprint(editor).house.toLowerCase() : "";
    return (
      row.name.toLowerCase().includes(q) ||
      row.line.toLowerCase().includes(q) ||
      imprint.includes(q) ||
      house.includes(q)
    );
  });
}
