"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { addDays, longDate, monthYear, shortDate, TODAY, untilPhrase, weeksOut } from "./dates";
import s from "./desk.module.css";
import {
  authorLetter,
  clocksOf,
  conflictsFor,
  currentImprint,
  deskNotes,
  imprintMates,
  indexRows,
  isOpen,
  lastTime,
  liveOf,
  shareableNotes,
  type Clock,
  type IndexRow,
  type LiveSubmission,
} from "./memory";
import { clear, load, save } from "./persist";
import { AGENT, AUTHOR_BY_ID, AUTHORS, BOOK_BY_ID, EDITOR_BY_ID } from "./seed";
import type { Editor, Note, Saved } from "./types";

type Mode = "desk" | "letter";
type Sel =
  | { kind: "editor"; id: string }
  | { kind: "author"; id: string }
  | { kind: "book"; id: string }
  | null;

const EMPTY: Saved = { chases: {}, exclusives: {}, bids: {}, notes: [] };

export default function App() {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [booted, setBooted] = useState(false);
  const [mode, setMode] = useState<Mode>("desk");
  const [sel, setSel] = useState<Sel>(null);
  const [query, setQuery] = useState("");
  const [letterAuthor, setLetterAuthor] = useState("srahman");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const mainRef = useRef<HTMLElement>(null);
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaved(load());
    setBooted(true);
  }, []);

  useEffect(() => {
    if (booted) save(saved);
  }, [booted, saved]);

  const live = useMemo(() => liveOf(saved), [saved]);
  const clocks = useMemo(() => clocksOf(live), [live]);
  const rows = useMemo(() => indexRows(live, clocks, query), [live, clocks, query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (event.key === "Escape") {
        if (typing) {
          (target as HTMLElement).blur();
          return;
        }
        setSel(null);
        return;
      }
      if (event.key === "/" && !typing) {
        event.preventDefault();
        findRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!sel) return;
    const heading = mainRef.current?.querySelector<HTMLElement>("h2");
    heading?.focus();
  }, [sel]);

  function openClock(clock: Clock) {
    setMode("desk");
    setSel({ kind: "editor", id: clock.editorId });
  }

  function recordChase(submissionId: string, note: string) {
    setSaved((prev) => ({
      ...prev,
      chases: {
        ...prev.chases,
        [submissionId]: [...(prev.chases[submissionId] ?? []), { at: TODAY, note }],
      },
    }));
    setDrafts((prev) => ({ ...prev, [submissionId]: "" }));
  }

  function expireExclusive(submissionId: string, note: string) {
    setSaved((prev) => ({
      ...prev,
      exclusives: {
        ...prev.exclusives,
        [submissionId]: { action: "expired", at: TODAY, note },
      },
    }));
    setDrafts((prev) => ({ ...prev, [submissionId]: "" }));
  }

  function extendExclusive(submissionId: string) {
    const sub = live.find((row) => row.id === submissionId);
    const from = sub?.exclusiveUntil ?? TODAY;
    const until = addDays(from, 7);
    setSaved((prev) => ({
      ...prev,
      exclusives: {
        ...prev.exclusives,
        [submissionId]: {
          action: "extended",
          at: TODAY,
          until,
          note: `They asked for another week, to ${shortDate(until)}.`,
        },
      },
    }));
  }

  function recordBids(ids: string[], note: string) {
    setSaved((prev) => {
      const bids = { ...prev.bids };
      for (const id of ids) {
        bids[id] = [...(bids[id] ?? []), { at: TODAY, note }];
      }
      return { ...prev, bids };
    });
    setDrafts((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = "";
      return next;
    });
  }

  function addDeskNote(personId: string, text: string) {
    const note: Note = {
      id: `note:${personId}:${Date.now()}`,
      at: TODAY,
      text,
      audience: "desk",
    };
    setSaved((prev) => ({ ...prev, notes: [...prev.notes, note] }));
    setDrafts((prev) => ({ ...prev, [personId]: "" }));
  }

  function reset() {
    clear();
    setSaved(EMPTY);
    setSel(null);
    setDrafts({});
  }

  function draftOf(id: string): string {
    return drafts[id] ?? "";
  }

  function setDraft(id: string, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  }

  const letterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of live) ids.add(row.author.id);
    for (const author of AUTHORS) {
      if (author.notes.length) ids.add(author.id);
    }
    return AUTHORS.filter((author) => ids.has(author.id));
  }, [live]);

  if (!booted) {
    return <div className={s.shell} aria-busy="true" />;
  }

  return (
    <div className={s.shell}>
      <a className={s.escape} href="/tasks/practical-apps-crm">
        Task
      </a>

      <header className={s.mast}>
        <p className={s.house}>
          {AGENT.house}
          <span aria-hidden="true"> · </span>
          {AGENT.name}
        </p>
        <h1 className={s.question}>
          What do I know about this person, and what happened last time?
        </h1>
        <p className={s.asof}>{longDate(TODAY)}</p>
        <div className={s.views} role="group" aria-label="Whose eyes">
          <button
            type="button"
            className={s.viewBtn}
            aria-pressed={mode === "desk"}
            onClick={() => setMode("desk")}
          >
            Desk
          </button>
          <button
            type="button"
            className={s.viewBtn}
            aria-pressed={mode === "letter"}
            onClick={() => {
              setMode("letter");
              if (sel?.kind === "author") setLetterAuthor(sel.id);
            }}
          >
            What they see
          </button>
        </div>
      </header>

      {mode === "letter" ? (
        <Letter
          authorId={letterAuthor}
          authors={letterIds}
          live={live}
          extra={saved.notes}
          onPick={setLetterAuthor}
        />
      ) : (
        <div className={s.layout}>
          <aside className={s.railClocks}>
            <p className={s.sectionLabel}>Clocks</p>
            {clocks.length === 0 ? (
              <p className={s.empty}>Nothing ringing.</p>
            ) : (
              <ul className={s.clockList}>
                {clocks.map((clock) => (
                  <li key={clock.id}>
                    <button type="button" className={s.clockItem} onClick={() => openClock(clock)}>
                      <span className={s.clockKind} data-kind={clock.kind}>
                        {clock.kind}
                        {clock.severity === "late" ? " · late" : ""}
                      </span>
                      <span className={s.clockBody}>{clock.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <aside className={s.railPeople}>
            <p className={s.sectionLabel}>Before an email</p>
            <input
              ref={findRef}
              className={s.find}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="A name, an imprint, a book"
              aria-label="Find a person"
            />
            <PeopleList rows={rows} query={query} sel={sel} onPick={setSel} />
          </aside>

          <main className={s.main} ref={mainRef}>
            {!sel ? (
              <Morning
                clocks={clocks}
                live={live}
                draftOf={draftOf}
                setDraft={setDraft}
                onOpen={openClock}
                onChase={recordChase}
                onExpire={expireExclusive}
                onExtend={extendExclusive}
                onBids={recordBids}
              />
            ) : sel.kind === "editor" && EDITOR_BY_ID[sel.id] ? (
              <Dossier
                editor={EDITOR_BY_ID[sel.id]}
                live={live}
                extra={saved.notes}
                draftOf={draftOf}
                setDraft={setDraft}
                onChase={recordChase}
                onExpire={expireExclusive}
                onExtend={extendExclusive}
                onBids={recordBids}
                onNote={addDeskNote}
                onOpenAuthor={(id) => setSel({ kind: "author", id })}
                onOpenBook={(id) => setSel({ kind: "book", id })}
              />
            ) : sel.kind === "author" ? (
              <AuthorFile
                authorId={sel.id}
                live={live}
                extra={saved.notes}
                onEditor={(id) => setSel({ kind: "editor", id })}
                onLetter={() => {
                  setLetterAuthor(sel.id);
                  setMode("letter");
                }}
              />
            ) : (
              <BookFile
                bookId={sel.id}
                live={live}
                onEditor={(id) => setSel({ kind: "editor", id })}
                onAuthor={(id) => setSel({ kind: "author", id })}
              />
            )}
          </main>
        </div>
      )}

      <p className={s.fine}>
        {AGENT.provenance}{" "}
        <button type="button" className={s.rowBtn} onClick={reset}>
          Restore the morning of the 31st.
        </button>
      </p>
    </div>
  );
}

function PeopleList({
  rows,
  query,
  sel,
  onPick,
}: {
  rows: IndexRow[];
  query: string;
  sel: Sel;
  onPick: (sel: Sel) => void;
}) {
  const searching = query.trim().length > 0;
  const front = searching ? rows : rows.filter((row) => row.live);
  const rest = searching ? [] : rows.filter((row) => !row.live && row.kind === "editor");

  return (
    <>
      <RowList rows={front} sel={sel} onPick={onPick} />
      {rest.length > 0 ? (
        <details className={s.more}>
          <summary>The rest of the address book — {rest.length} editors</summary>
          <RowList rows={rest} sel={sel} onPick={onPick} />
        </details>
      ) : null}
    </>
  );
}

function RowList({
  rows,
  sel,
  onPick,
}: {
  rows: IndexRow[];
  sel: Sel;
  onPick: (sel: Sel) => void;
}) {
  return (
    <ul className={s.people}>
      {rows.map((row) => {
        const current =
          (sel?.kind === "editor" && sel.id === row.id && row.kind === "editor") ||
          (sel?.kind === "author" && sel.id === row.id && row.kind === "author");
        return (
          <li key={`${row.kind}-${row.id}`}>
            <button
              type="button"
              className={s.personBtn}
              aria-current={current ? "true" : undefined}
              onClick={() => onPick({ kind: row.kind, id: row.id })}
            >
              <span className={s.personName}>{row.name}</span>
              <span className={s.personMeta}>{row.line}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Morning({
  clocks,
  live,
  draftOf,
  setDraft,
  onOpen,
  onChase,
  onExpire,
  onExtend,
  onBids,
}: {
  clocks: Clock[];
  live: LiveSubmission[];
  draftOf: (id: string) => string;
  setDraft: (id: string, value: string) => void;
  onOpen: (clock: Clock) => void;
  onChase: (id: string, note: string) => void;
  onExpire: (id: string, note: string) => void;
  onExtend: (id: string) => void;
  onBids: (ids: string[], note: string) => void;
}) {
  const unique = uniqueClocks(clocks);
  return (
    <article>
      <h2 tabIndex={-1} className={s.fileTitle}>
        This morning
      </h2>
      <p className={s.now}>
        Not a forecast. The four kinds of clock that actually change what she
        does today: a chase, an exclusive about to lapse, an offer that starts
        time for everyone else, and an auction that has to stay clean.
      </p>
      {unique.map((clock) => {
        const sub = live.find((row) => row.id === clock.submissionId);
        if (!sub) return null;
        return (
          <ClockPanel
            key={clock.id}
            clock={clock}
            sub={sub}
            live={live}
            draftOf={draftOf}
            setDraft={setDraft}
            onOpen={() => onOpen(clock)}
            onChase={onChase}
            onExpire={onExpire}
            onExtend={onExtend}
            onBids={onBids}
          />
        );
      })}
    </article>
  );
}

function uniqueClocks(clocks: Clock[]): Clock[] {
  const seen = new Set<string>();
  return clocks.filter((clock) => {
    const key = `${clock.kind}:${clock.bookId}`;
    if (clock.kind === "auction" || clock.kind === "offer") {
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });
}

function ClockPanel({
  clock,
  sub,
  live,
  draftOf,
  setDraft,
  onOpen,
  onChase,
  onExpire,
  onExtend,
  onBids,
}: {
  clock: Clock;
  sub: LiveSubmission;
  live: LiveSubmission[];
  draftOf: (id: string) => string;
  setDraft: (id: string, value: string) => void;
  onOpen: () => void;
  onChase: (id: string, note: string) => void;
  onExpire: (id: string, note: string) => void;
  onExtend: (id: string) => void;
  onBids: (ids: string[], note: string) => void;
}) {
  return (
    <section className={s.clockPanel} data-kind={clock.kind}>
      <span className={s.clockKind} data-kind={clock.kind}>
        {clock.kind}
      </span>
      <p>
        <button type="button" className={s.rowBtn} onClick={onOpen}>
          {sub.editor.name}
        </button>
        {" on "}
        <span className={s.bookTitle}>{sub.book.title}</span>
        {" — "}
        {clock.detail}
      </p>
      {clock.kind === "chase" ? (
        <>
          {sub.chases.length > 0 ? (
            <p className={s.muted}>
              Last chased {shortDate(sub.chases[sub.chases.length - 1].at)}
              {sub.chases[sub.chases.length - 1].note
                ? ` — ${sub.chases[sub.chases.length - 1].note}`
                : ""}
            </p>
          ) : (
            <p className={s.muted}>Not chased since it went out {weeksOut(sub.sent)} ago.</p>
          )}
          <label className={s.stampLabel} htmlFor={`chase-${sub.id}`}>
            A line for the file
          </label>
          <textarea
            id={`chase-${sub.id}`}
            className={s.noteBox}
            value={draftOf(sub.id)}
            onChange={(event) => setDraft(sub.id, event.target.value)}
            placeholder="Left a voicemail; he is in Sicily until Thursday."
          />
          <div className={s.actions}>
            <button
              type="button"
              className={s.action}
              onClick={() => onChase(sub.id, draftOf(sub.id).trim())}
            >
              Record a chase
            </button>
          </div>
        </>
      ) : null}
      {clock.kind === "exclusive" ? (
        <ExclusiveActions
          sub={sub}
          draftOf={draftOf}
          setDraft={setDraft}
          onExpire={onExpire}
          onExtend={onExtend}
        />
      ) : null}
      {clock.kind === "offer" ? <OfferBoard sub={sub} live={live} /> : null}
      {clock.kind === "auction" ? (
        <AuctionBoard
          bookId={sub.bookId}
          live={live}
          draftOf={draftOf}
          setDraft={setDraft}
          onBids={onBids}
        />
      ) : null}
    </section>
  );
}

function ExclusiveActions({
  sub,
  draftOf,
  setDraft,
  onExpire,
  onExtend,
}: {
  sub: LiveSubmission;
  draftOf: (id: string) => string;
  setDraft: (id: string, value: string) => void;
  onExpire: (id: string, note: string) => void;
  onExtend: (id: string) => void;
}) {
  if (sub.exclusive?.action === "expired") {
    return (
      <p className={s.muted}>
        Exclusive marked lapsed on {shortDate(sub.exclusive.at)}. The list is
        open.
        {sub.exclusive.note ? ` ${sub.exclusive.note}` : ""}
      </p>
    );
  }
  if (sub.exclusive?.action === "extended" && sub.exclusiveUntil) {
    return (
      <p className={s.muted}>
        Extended to {shortDate(sub.exclusiveUntil)}. {sub.exclusive.note}
      </p>
    );
  }
  return (
    <>
      <p className={s.muted}>
        {sub.exclusiveUntil
          ? `Ends ${untilPhrase(sub.exclusiveUntil)}. After that the list is open — unless they ask for time, which is a different decision.`
          : "No exclusive on the file."}
      </p>
      <label className={s.stampLabel} htmlFor={`ex-${sub.id}`}>
        A line for the file
      </label>
      <textarea
        id={`ex-${sub.id}`}
        className={s.noteBox}
        value={draftOf(sub.id)}
        onChange={(event) => setDraft(sub.id, event.target.value)}
        placeholder="She has not written. I am not chasing inside an exclusive."
      />
      <div className={s.actions}>
        <button
          type="button"
          className={s.action}
          onClick={() => onExpire(sub.id, draftOf(sub.id).trim() || "Exclusive lapsed. List is open.")}
        >
          Mark expired — the list is open
        </button>
        <button type="button" className={s.ghost} onClick={() => onExtend(sub.id)}>
          They asked for another week
        </button>
      </div>
    </>
  );
}

function OfferBoard({ sub, live }: { sub: LiveSubmission; live: LiveSubmission[] }) {
  if (sub.state.kind !== "offer") return null;
  const others = live.filter(
    (row) => row.bookId === sub.bookId && row.id !== sub.id && isOpen(row),
  );
  return (
    <div>
      <p>
        {sub.editor.name} offered on {shortDate(sub.state.at)}. The number stays
        off this page. Everyone else has until {shortDate(sub.state.othersBy)}.
      </p>
      <ul className={s.plain}>
        {others.map((row) => (
          <li key={row.id}>
            {row.editor.name}, {currentImprint(row.editor).imprint} — out{" "}
            {weeksOut(row.sent)}, now on the offer clock.
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuctionBoard({
  bookId,
  live,
  draftOf,
  setDraft,
  onBids,
}: {
  bookId: string;
  live: LiveSubmission[];
  draftOf: (id: string) => string;
  setDraft: (id: string, value: string) => void;
  onBids: (ids: string[], note: string) => void;
}) {
  const seats = live.filter((row) => row.bookId === bookId && row.state.kind === "auction");
  const close = seats[0];
  return (
    <div>
      <p>
        Same manuscript, same noon
        {close && close.state.kind === "auction" ? ` — ${close.state.closeLabel}` : ""}.
        Nobody gets a hint the others do not have.
      </p>
      <ul className={s.plain}>
        {seats.map((row) => (
          <li key={row.id}>
            {row.editor.name}, {currentImprint(row.editor).imprint}
            {row.bids.length
              ? ` — ${row.bids.map((bid) => bid.note).join("; ")}`
              : " — materials with them"}
          </li>
        ))}
      </ul>
      {seats[0] ? (
        <>
          <label className={s.stampLabel} htmlFor="bid">
            Note a bid against the first seat — it is visible on every seat
          </label>
          <textarea
            id="bid"
            className={s.noteBox}
            value={draftOf(bookId)}
            onChange={(event) => setDraft(bookId, event.target.value)}
            placeholder="Opening from Faber, floor held."
          />
          <div className={s.actions}>
            <button
              type="button"
              className={s.action}
              onClick={() => {
                const note = draftOf(bookId).trim();
                if (!note) return;
                onBids(
                  seats.map((seat) => seat.id),
                  note,
                );
                setDraft(bookId, "");
              }}
            >
              Record on the board
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Dossier({
  editor,
  live,
  extra,
  draftOf,
  setDraft,
  onChase,
  onExpire,
  onExtend,
  onBids,
  onNote,
  onOpenAuthor,
  onOpenBook,
}: {
  editor: Editor;
  live: LiveSubmission[];
  extra: Note[];
  draftOf: (id: string) => string;
  setDraft: (id: string, value: string) => void;
  onChase: (id: string, note: string) => void;
  onExpire: (id: string, note: string) => void;
  onExtend: (id: string) => void;
  onBids: (ids: string[], note: string) => void;
  onNote: (personId: string, text: string) => void;
  onOpenAuthor: (id: string) => void;
  onOpenBook: (id: string) => void;
}) {
  const now = currentImprint(editor);
  const last = lastTime(editor.id, live);
  const mine = live.filter((row) => row.editorId === editor.id);
  const open = mine.filter(isOpen);
  const passes = mine.filter((row) => row.state.kind === "pass");
  const conflicts = conflictsFor(editor, live);
  const mates = imprintMates(editor);
  const privateNotes = deskNotes(editor.notes, extra, editor.id);
  const moved = editor.tenures.length > 1;

  return (
    <article className={s.dossier}>
      <h2 tabIndex={-1}>
        {editor.name}
      </h2>
      <p className={s.now}>
        {now.role}, {now.imprint}
        <span aria-hidden="true"> · </span>
        {now.house}
      </p>

      {moved ? (
        <div className={s.block}>
          <p className={s.sectionLabel}>The person, not the imprint</p>
          <ul className={s.tenure}>
            {editor.tenures.map((tenure, index) => (
              <li key={`${tenure.imprint}-${tenure.from}`} className={tenure.to ? undefined : s.tenureNow}>
                <span className={s.tenureWhen}>
                  {monthYear(tenure.from + "-01")}
                  {tenure.to ? ` – ${monthYear(tenure.to + "-01")}` : " –"}
                </span>
                {tenure.role}, {tenure.imprint}
                {index === editor.tenures.length - 1 && moved
                  ? " — the relationship came with her."
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={s.block}>
        <p className={s.sectionLabel}>What they read for</p>
        <p>{editor.taste}</p>
      </div>

      {last ? (
        <div className={s.block}>
          <p className={s.sectionLabel}>Last time</p>
          <LastRead sub={last} onOpenBook={onOpenBook} onOpenAuthor={onOpenAuthor} />
        </div>
      ) : (
        <p className={s.muted}>Nothing on the file before this morning.</p>
      )}

      {conflicts.length > 0 ? (
        <p className={s.warn} role="status">
          {now.imprint} already has{" "}
          {conflicts.map((row) => row.book.title).join(", ")} — with{" "}
          {conflicts.map((row) => row.editor.name).join(", ")}. Do not approach{" "}
          {editor.name} with the same book. Two editors at one imprint is one
          conversation, and the wrong one.
        </p>
      ) : null}

      {mates.length > 0 && conflicts.length === 0 ? (
        <p className={s.muted}>
          Also at {now.imprint}: {mates.map((mate) => mate.name).join(", ")}. Not
          simultaneously.
        </p>
      ) : null}

      {open.length > 0 ? (
        <div className={s.block}>
          <p className={s.sectionLabel}>Out with them now</p>
          {open.map((sub) => (
            <OpenRead
              key={sub.id}
              sub={sub}
              live={live}
              draftOf={draftOf}
              setDraft={setDraft}
              onChase={onChase}
              onExpire={onExpire}
              onExtend={onExtend}
              onBids={onBids}
              onOpenBook={onOpenBook}
              onOpenAuthor={onOpenAuthor}
            />
          ))}
        </div>
      ) : null}

      {passes.length > 0 ? (
        <div className={s.block}>
          <p className={s.sectionLabel}>A no is not a dead end</p>
          {passes.map((sub) => (
            <div key={sub.id} className={s.intel}>
              <p className={s.intelHead}>
                {shortDate(sub.state.kind === "pass" ? sub.state.at : sub.sent)}
                {" · "}
                <span className={s.bookTitle}>{sub.book.title}</span>
                {" · "}
                at {sub.imprintThen}
              </p>
              <p>{sub.state.kind === "pass" ? sub.state.intelligence : ""}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={s.block}>
        <p className={s.sectionLabel}>Desk only</p>
        {privateNotes.length === 0 ? (
          <p className={s.empty}>No private note on this person.</p>
        ) : (
          privateNotes.map((note) => (
            <div key={note.id} className={s.private}>
              <span className={s.stampLabel}>Desk · {shortDate(note.at)}</span>
              {note.text}
            </div>
          ))
        )}
        <label className={s.stampLabel} htmlFor={`note-${editor.id}`}>
          Add a line they will never see
        </label>
        <textarea
          id={`note-${editor.id}`}
          className={s.noteBox}
          value={draftOf(editor.id)}
          onChange={(event) => setDraft(editor.id, event.target.value)}
          placeholder="For the file, not for the author."
        />
        <div className={s.actions}>
          <button
            type="button"
            className={s.ghost}
            onClick={() => {
              const text = draftOf(editor.id).trim();
              if (text) onNote(editor.id, text);
            }}
          >
            Keep on the desk
          </button>
        </div>
      </div>
    </article>
  );
}

function LastRead({
  sub,
  onOpenBook,
  onOpenAuthor,
}: {
  sub: LiveSubmission;
  onOpenBook: (id: string) => void;
  onOpenAuthor: (id: string) => void;
}) {
  return (
    <p>
      <button type="button" className={s.rowBtn} onClick={() => onOpenBook(sub.bookId)}>
        <span className={s.bookTitle}>{sub.book.title}</span>
      </button>
      {" by "}
      <button type="button" className={s.rowBtn} onClick={() => onOpenAuthor(sub.author.id)}>
        {sub.author.name}
      </button>
      {sub.state.kind === "pass" ? (
        <>
          , passed {shortDate(sub.state.at)} while at {sub.imprintThen}.{" "}
          {sub.state.intelligence}
        </>
      ) : sub.state.kind === "withdrawn" ? (
        <>
          , {sub.state.reason}
        </>
      ) : (
        <>
          , still with them.
        </>
      )}
    </p>
  );
}

function OpenRead({
  sub,
  live,
  draftOf,
  setDraft,
  onChase,
  onExpire,
  onExtend,
  onBids,
  onOpenBook,
  onOpenAuthor,
}: {
  sub: LiveSubmission;
  live: LiveSubmission[];
  draftOf: (id: string) => string;
  setDraft: (id: string, value: string) => void;
  onChase: (id: string, note: string) => void;
  onExpire: (id: string, note: string) => void;
  onExtend: (id: string) => void;
  onBids: (ids: string[], note: string) => void;
  onOpenBook: (id: string) => void;
  onOpenAuthor: (id: string) => void;
}) {
  const due = sub.daysOut >= 56 && (sub.state.kind === "out" || sub.state.kind === "held");
  const lastChase = sub.chases[sub.chases.length - 1];
  return (
    <div className={s.clockPanel} data-kind={sub.exclusiveUntil ? "exclusive" : sub.state.kind === "offer" ? "offer" : due ? "chase" : undefined}>
      <p>
        <button type="button" className={s.rowBtn} onClick={() => onOpenBook(sub.bookId)}>
          <span className={s.bookTitle}>{sub.book.title}</span>
        </button>
        {" · "}
        <button type="button" className={s.rowBtn} onClick={() => onOpenAuthor(sub.author.id)}>
          {sub.author.name}
        </button>
        {" · out "}
        {weeksOut(sub.sent)}
        {sub.exclusiveUntil ? ` · exclusive until ${shortDate(sub.exclusiveUntil)}` : ""}
      </p>
      {due ? (
        <>
          <p className={s.muted}>
            {lastChase
              ? `Last chased ${shortDate(lastChase.at)}.`
              : "Not chased."}{" "}
            {sub.daysOut >= 77 ? "Eleven weeks is late." : "Eight weeks is time."}
          </p>
          <div className={s.actions}>
            <button
              type="button"
              className={s.action}
              onClick={() => onChase(sub.id, draftOf(sub.id).trim())}
            >
              Record a chase
            </button>
          </div>
        </>
      ) : null}
      {sub.exclusiveUntil || sub.exclusive ? (
        <ExclusiveActions
          sub={sub}
          draftOf={draftOf}
          setDraft={setDraft}
          onExpire={onExpire}
          onExtend={onExtend}
        />
      ) : null}
      {sub.state.kind === "offer" ? <OfferBoard sub={sub} live={live} /> : null}
      {sub.state.kind === "auction" ? (
        <AuctionBoard
          bookId={sub.bookId}
          live={live}
          draftOf={draftOf}
          setDraft={setDraft}
          onBids={onBids}
        />
      ) : null}
    </div>
  );
}

function AuthorFile({
  authorId,
  live,
  extra,
  onEditor,
  onLetter,
}: {
  authorId: string;
  live: LiveSubmission[];
  extra: Note[];
  onEditor: (id: string) => void;
  onLetter: () => void;
}) {
  const author = AUTHOR_BY_ID[authorId];
  if (!author) return <p className={s.empty}>No file for that name.</p>;
  const mine = live.filter((row) => row.author.id === authorId);
  const open = mine.filter(isOpen);
  const passes = mine.filter((row) => row.state.kind === "pass");
  const privateNotes = deskNotes(author.notes, extra, authorId);

  return (
    <article className={s.dossier}>
      <h2 tabIndex={-1}>{author.name}</h2>
      <p className={s.now}>
        Author · {open.length} out
        {passes.length ? ` · ${passes.length} on the file as intelligence` : ""}
      </p>
      <p>
        <button type="button" className={s.ghost} onClick={onLetter}>
          See the copy they are allowed
        </button>
      </p>

      {open.length > 0 ? (
        <div className={s.block}>
          <p className={s.sectionLabel}>Out</p>
          {open.map((sub) => (
            <div key={sub.id} className={s.row}>
              <span>
                <span className={s.bookTitle}>{sub.book.title}</span>
                {" · "}
                <button type="button" className={s.rowBtn} onClick={() => onEditor(sub.editorId)}>
                  {sub.editor.name}
                </button>
                , {currentImprint(sub.editor).imprint}
              </span>
              <span className={s.muted}>{weeksOut(sub.sent)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {passes.length > 0 ? (
        <div className={s.block}>
          <p className={s.sectionLabel}>Intelligence — not for them</p>
          {passes.map((sub) => (
            <div key={sub.id} className={s.intel}>
              <p className={s.intelHead}>
                {sub.editor.name} at {sub.imprintThen}
                {" · "}
                <span className={s.bookTitle}>{sub.book.title}</span>
              </p>
              <p>{sub.state.kind === "pass" ? sub.state.intelligence : ""}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={s.block}>
        <p className={s.sectionLabel}>Desk only</p>
        {privateNotes.map((note) => (
          <div key={note.id} className={s.private}>
            <span className={s.stampLabel}>Desk · {shortDate(note.at)}</span>
            {note.text}
          </div>
        ))}
        {privateNotes.length === 0 ? <p className={s.empty}>No private note.</p> : null}
      </div>
    </article>
  );
}

function BookFile({
  bookId,
  live,
  onEditor,
  onAuthor,
}: {
  bookId: string;
  live: LiveSubmission[];
  onEditor: (id: string) => void;
  onAuthor: (id: string) => void;
}) {
  const book = BOOK_BY_ID[bookId];
  if (!book) return <p className={s.empty}>No manuscript under that title.</p>;
  const mine = live.filter((row) => row.bookId === bookId);
  const open = mine.filter(isOpen);
  const byImprint = new Map<string, LiveSubmission[]>();
  for (const sub of open) {
    const imprint = currentImprint(sub.editor).imprint;
    const list = byImprint.get(imprint) ?? [];
    list.push(sub);
    byImprint.set(imprint, list);
  }
  const doubled = [...byImprint.entries()].filter(([, list]) => list.length > 1);

  return (
    <article className={s.dossier}>
      <h2 tabIndex={-1} className={s.bookTitle}>
        {book.title}
      </h2>
      <p className={s.now}>
        {book.kind}
        {" · "}
        <button type="button" className={s.rowBtn} onClick={() => onAuthor(book.authorId)}>
          {AUTHOR_BY_ID[book.authorId].name}
        </button>
      </p>
      <p>{book.line}</p>
      {doubled.length > 0 ? (
        <p className={s.warn} role="status">
          Same imprint twice:{" "}
          {doubled.map(([imprint, list]) => `${imprint} (${list.map((row) => row.editor.name).join(", ")})`).join("; ")}
          . Pull one back.
        </p>
      ) : null}
      {mine.map((sub) => (
        <div key={sub.id} className={s.row}>
          <span>
            <button type="button" className={s.rowBtn} onClick={() => onEditor(sub.editorId)}>
              {sub.editor.name}
            </button>
            , {sub.imprintThen}
            {currentImprint(sub.editor).imprint !== sub.imprintThen
              ? ` — now ${currentImprint(sub.editor).imprint}`
              : ""}
            {" · "}
            {sub.state.kind}
          </span>
          <span className={s.muted}>{weeksOut(sub.sent)}</span>
        </div>
      ))}
    </article>
  );
}

function Letter({
  authorId,
  authors,
  live,
  extra,
  onPick,
}: {
  authorId: string;
  authors: { id: string; name: string }[];
  live: LiveSubmission[];
  extra: Note[];
  onPick: (id: string) => void;
}) {
  const author = AUTHOR_BY_ID[authorId];
  if (!author) return <p className={s.empty}>No file for that name.</p>;
  const letter = authorLetter(author, live, extra);
  const shareable = shareableNotes(author.notes, extra, author.id);

  return (
    <article className={s.letter}>
      <p className={s.sectionLabel}>The copy {author.name} is allowed</p>
      <div className={s.authorPick} role="group" aria-label="Which author">
        {authors.map((row) => (
          <button
            key={row.id}
            type="button"
            className={s.ghost}
            aria-pressed={row.id === authorId}
            onClick={() => onPick(row.id)}
          >
            {row.name}
          </button>
        ))}
      </div>
      <hr className={s.letterRule} />
      <h2 tabIndex={-1}>{author.name}</h2>
      <p className={s.muted}>{longDate(TODAY)}</p>

      {shareable.map((note) => (
        <p key={note.id}>{note.text}</p>
      ))}

      {letter.open.length > 0 ? (
        <>
          <p>
            Currently being read, named only by house — not by how long, and not
            by anyone&apos;s private opinion:
          </p>
          <ul className={s.plain}>
            {[...new Map(letter.open.map((row) => [row.book.title + currentImprint(row.editor).imprint, row])).values()].map(
              (row) => (
                <li key={row.id}>
                  <span className={s.bookTitle}>{row.book.title}</span>
                  , {currentImprint(row.editor).imprint}
                  {row.state.kind === "offer"
                    ? " — we have an offer; I will telephone, not write the figure here."
                    : row.state.kind === "auction"
                      ? " — in a process with a shared deadline."
                      : row.exclusiveUntil
                        ? " — a single exclusive read, by agreement."
                        : ""}
                </li>
              ),
            )}
          </ul>
        </>
      ) : shareable.length === 0 && letter.passCount === 0 ? (
        <p className={s.muted}>
          {letter.between ?? "Nothing is out this morning."}
        </p>
      ) : null}

      {letter.passCount > 0 ? (
        <p>
          I am not going to list the houses that have said no, or how many.
          What I can tell you is placement, not a scoreboard
          {letter.shareablePass.length
            ? `: ${letter.shareablePass.join(" ")}`
            : "."}
        </p>
      ) : null}

      <p className={s.fine}>
        Private notes from the desk do not appear on this page. A rejection
        kept as intelligence for the next list is not a sentence I send you.
      </p>
    </article>
  );
}
