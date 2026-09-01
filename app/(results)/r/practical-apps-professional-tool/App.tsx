"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import ConsistencyView from "./ConsistencyView";
import MarkView from "./MarkView";
import ModerationView from "./ModerationView";
import { SCRIPTS } from "./corpus";
import { daysBetween, fmtDay, fmtDuration, fmtSpan } from "./format";
import s from "./marking.module.css";
import { ASSIGNMENT } from "./rubric";
import { buildSampleDoc } from "./seed";
import {
  committedList,
  deserialise,
  median,
  queueOf,
  reducer,
  serialise,
  STORAGE_KEY,
  type Action,
  type Doc,
  type State,
} from "./state";

export type View = "mark" | "consistency" | "moderation";

/** Where the mark view is pointed, when it is not simply at the queue head. */
export type Focus = { scriptId: number; mode: "review" | "reread" } | null;

function initialState(): State {
  let doc: Doc | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) doc = deserialise(raw);
  } catch {
    doc = null;
  }
  return {
    doc: doc ?? buildSampleDoc(Date.now()),
    past: [],
    future: [],
    lastLabel: null,
    coalesceKey: null,
    coalesceAt: 0,
  };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [view, setView] = useState<View>("mark");
  const [focus, setFocus] = useState<Focus>(null);
  const [notice, setNotice] = useState<{ text: string; undoable: boolean } | null>(null);
  const [dialog, setDialog] = useState<null | "keys" | "storage" | "clear">(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "failed">("saved");
  const leader = useRef<{ key: string; at: number } | null>(null);

  const doc = state.doc;

  /* --------------------------------------------------------- persistence */

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // Lay the sample history down on the very first visit so a reload
      // returns the same desk rather than a freshly generated one.
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          window.localStorage.setItem(STORAGE_KEY, serialise(doc));
        }
      } catch {
        setSaveState("failed");
      }
      return;
    }
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, serialise(doc));
        setSaveState("saved");
      } catch {
        setSaveState("failed");
      }
    }, 320);
    return () => window.clearTimeout(timer);
  }, [doc]);

  const run = useCallback((action: Action, toast?: string, undoable = true) => {
    dispatch(action);
    if (toast) setNotice({ text: toast, undoable });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const undo = useCallback(() => {
    if (!state.past.length) return;
    const label = state.lastLabel;
    dispatch({ type: "undo" });
    setNotice({ text: label ? `Undone — ${label}.` : "Undone.", undoable: false });
  }, [state.past.length, state.lastLabel]);

  const redo = useCallback(() => {
    if (!state.future.length) return;
    dispatch({ type: "redo" });
    setNotice({ text: "Redone.", undoable: false });
  }, [state.future.length]);

  /* ------------------------------------------------------------- derived */

  const queue = useMemo(() => queueOf(doc), [doc]);
  const done = useMemo(() => committedList(doc), [doc]);
  const rereadWaiting = doc.rereadQueue.length;

  const pace = useMemo(() => {
    const recent = done.slice(-25).map((judgement) => judgement.secondsSpent);
    const typical = median(recent) ?? ASSIGNMENT.budgetSecondsPerScript;
    return { typical, remaining: queue.length * typical };
  }, [done, queue.length]);

  const dueAt = useMemo(() => {
    const seeded = doc.sampleSeededAt || Date.now();
    const due = new Date(seeded);
    due.setDate(due.getDate() + 5);
    due.setHours(8, 30, 0, 0);
    return due.getTime();
  }, [doc.sampleSeededAt]);

  const daysLeft = daysBetween(Date.now(), dueAt);

  /* ------------------------------------------------------------- exports */

  const exportJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note:
        "Marking record exported from a demonstration tool. The 124 scripts are " +
        "synthetic sample data and no student wrote them; the rubric is a fictional " +
        "departmental rubric and is not an awarding body mark scheme.",
      assignment: ASSIGNMENT,
      document: doc,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marking-record-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice({ text: "Exported to your downloads folder.", undoable: false });
  }, [doc]);

  /* ------------------------------------------------------------ keyboard */

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (mod && event.key.toLowerCase() === "e") {
        event.preventDefault();
        exportJson();
        return;
      }

      if (event.key === "Escape") {
        if (dialog) {
          event.preventDefault();
          setDialog(null);
        }
        return;
      }

      if (typing || mod || event.altKey) return;

      if (event.key === "?") {
        event.preventDefault();
        setDialog("keys");
        return;
      }

      // `g` is a leader: g-m marking, g-c consistency, g-r moderation record.
      const now = Date.now();
      if (leader.current && now - leader.current.at < 1200) {
        const which = event.key.toLowerCase();
        leader.current = null;
        if (which === "m") {
          setView("mark");
          return;
        }
        if (which === "c") {
          setView("consistency");
          return;
        }
        if (which === "r") {
          setView("moderation");
          return;
        }
      }
      if (event.key.toLowerCase() === "g") {
        leader.current = { key: "g", at: now };
        return;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, exportJson, redo, undo]);

  /* ---------------------------------------------------------------- view */

  const openScript = useCallback((scriptId: number, mode: "review" | "reread" = "review") => {
    setFocus({ scriptId, mode });
    setView("mark");
  }, []);

  return (
    <div className={s.shell}>
      <header className={s.head}>
        <div className={s.setId}>
          <div className={s.setIdTop}>
            <span>{ASSIGNMENT.cohort}</span>
            <span>·</span>
            <span>{SCRIPTS.length} scripts</span>
            <span>·</span>
            <span>five strands, 30 marks</span>
          </div>
          <div className={s.setIdMain}>
            <em>{ASSIGNMENT.text}</em> — how does Priestley present {ASSIGNMENT.shortQuestion}?
          </div>
        </div>

        <nav className={s.tabs} aria-label="Views">
          {(
            [
              ["mark", "Marking", `${queue.length} left`],
              ["consistency", "Consistency", rereadWaiting ? `${rereadWaiting} to re-read` : ""],
              ["moderation", "Record", `${done.length}`],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              className={view === id ? `${s.tab} ${s.tabOn}` : s.tab}
              aria-current={view === id ? "page" : undefined}
              onClick={() => setView(id)}
            >
              {label}
              {count ? <span className={s.tabCount}>{count}</span> : null}
            </button>
          ))}
        </nav>

        <div className={s.headRight}>
          <div className={s.headStat}>
            <span className={s.headStatLabel}>Marked</span>
            <span className={s.headStatValue}>
              <b>{done.length}</b> of {SCRIPTS.length}
            </span>
          </div>
          <div className={s.headStat}>
            <span className={s.headStatLabel}>At {fmtDuration(pace.typical)} each</span>
            <span className={s.headStatValue}>{fmtSpan(pace.remaining)} to go</span>
          </div>
          <div className={s.headStat}>
            <span className={s.headStatLabel}>Back to students</span>
            <span className={s.headStatValue}>
              {fmtDay(dueAt)} · {daysLeft}d
            </span>
          </div>
          <div className={s.headBtns}>
            <button
              type="button"
              className={s.headBtn}
              onClick={undo}
              disabled={!state.past.length}
              title={state.lastLabel ? `Undo ${state.lastLabel}` : "Nothing to undo"}
            >
              Undo<kbd>⌘Z</kbd>
            </button>
            <button
              type="button"
              className={s.headBtn}
              onClick={redo}
              disabled={!state.future.length}
            >
              Redo
            </button>
            <button type="button" className={s.headBtn} onClick={exportJson}>
              Export<kbd>⌘E</kbd>
            </button>
            <button type="button" className={s.headBtn} onClick={() => setDialog("keys")}>
              Keys<kbd>?</kbd>
            </button>
          </div>
        </div>
      </header>

      {view === "mark" ? (
        <MarkView
          doc={doc}
          run={run}
          focus={focus}
          setFocus={setFocus}
          openScript={openScript}
          goConsistency={() => setView("consistency")}
        />
      ) : view === "consistency" ? (
        <ConsistencyView doc={doc} run={run} openScript={openScript} />
      ) : (
        <ModerationView doc={doc} run={run} openScript={openScript} exportJson={exportJson} />
      )}

      <div className={s.status}>
        <span className={s.statusCell}>
          <b>{done.length}</b> marked · <b>{queue.length}</b> in the queue
          {doc.deferred.length ? ` · ${doc.deferred.length} put back` : ""}
        </span>
        <span className={s.statusCell}>
          {saveState === "failed" ? (
            <span className={s.statusWarn}>Could not save to this browser</span>
          ) : (
            <>
              {saveState === "saving" ? "Saving" : "Saved"} in this browser only —{" "}
              <button type="button" className={s.statusBtn} onClick={() => setDialog("storage")}>
                what that means
              </button>
            </>
          )}
        </span>
        <span className={s.statusCell}>
          Undo:{" "}
          <button
            type="button"
            className={s.statusBtn}
            onClick={undo}
            disabled={!state.past.length}
          >
            {state.past.length ? (state.lastLabel ?? "last change") : "nothing yet"}
          </button>
        </span>
        <span className={`${s.statusCell} ${s.statusPush}`}>
          <button type="button" className={s.statusBtn} onClick={() => setDialog("clear")}>
            Reset the desk
          </button>
          <a className={s.statusLink} href="/tasks/practical-apps-professional-tool">
            task ↗
          </a>
        </span>
      </div>

      {notice ? (
        <div className={s.toast} role="status">
          <span>{notice.text}</span>
          {notice.undoable && state.past.length ? (
            <button type="button" onClick={undo}>
              Undo
            </button>
          ) : null}
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ) : null}

      {dialog === "keys" ? <KeysDialog onClose={() => setDialog(null)} /> : null}
      {dialog === "storage" ? <StorageDialog onClose={() => setDialog(null)} /> : null}
      {dialog === "clear" ? (
        <ClearDialog
          onClose={() => setDialog(null)}
          onClear={() => {
            run({ type: "clear-all" }, "Every mark cleared. One undo brings it all back.", true);
            setFocus(null);
            setDialog(null);
          }}
          onResample={() => {
            dispatch({ type: "hydrate", doc: buildSampleDoc(Date.now()) });
            setFocus(null);
            setDialog(null);
            setNotice({ text: "Sample history laid down again.", undoable: false });
          }}
          count={done.length}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- dialogs */

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      className={s.scrim}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <h2 className={s.dialogTitle}>{title}</h2>
        <div className={s.dialogBody}>{children}</div>
      </div>
    </div>
  );
}

const KEYS: Array<[string, string]> = [
  ["1–6", "mark the strand you are on, then move to the next"],
  ["0", "mark the strand zero"],
  ["↑ ↓", "move between strands"],
  ["q", "clip the passage you have selected in the script"],
  ["/ then 1–0, -", "open one of your eleven comments"],
  ["Tab", "next hole in the comment"],
  ["⌘↵", "put the comment in"],
  ["↵", "file this script and pull the next"],
  ["n", "put this one back — it goes to the end of the queue"],
  ["f", "flag it for moderation"],
  ["a", "read it beside the marked script nearest to it"],
  ["p", "see the sheet the student gets"],
  ["g then m / c / r", "marking · consistency · record"],
  ["⌘Z / ⌘⇧Z", "undo · redo"],
  ["⌘E", "export the whole record"],
  ["Esc", "back out of whatever is open"],
];

function KeysDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keys" onClose={onClose}>
      <p>
        The repetitive path is the keyboard path. Five digits and a return mark a script;
        everything else is for the moments the marking goes wrong.
      </p>
      <div className={s.keyGrid}>
        {KEYS.map(([key, what]) => (
          <div key={key} className={s.keyRow}>
            <kbd>{key}</kbd>
            <span>{what}</span>
          </div>
        ))}
      </div>
      <div className={s.dialogRow}>
        <button type="button" className={s.btn} onClick={onClose}>
          Close
        </button>
      </div>
    </Dialog>
  );
}

function StorageDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Where this is kept" onClose={onClose}>
      <p>
        Everything you do here is written to this browser&rsquo;s local storage on this
        machine, a fraction of a second after each change. There is no server, no account
        and no sync. Nothing you type is sent anywhere.
      </p>
      <p>
        That has a hard consequence and it would be dishonest to soften it: clearing site
        data, using a private window, or switching to a different browser or laptop means
        the marking is gone. This is a demonstration of a marking tool, not a system of
        record.
      </p>
      <p>
        <b>Export</b> (⌘E) writes the whole document — every mark, clip, comment, timestamp
        and revision — to a JSON file you keep. It is the only copy that survives this
        browser.
      </p>
      <div className={s.dialogRow}>
        <button type="button" className={s.btn} onClick={onClose}>
          Understood
        </button>
      </div>
    </Dialog>
  );
}

function ClearDialog({
  onClose,
  onClear,
  onResample,
  count,
}: {
  onClose: () => void;
  onClear: () => void;
  onResample: () => void;
  count: number;
}) {
  return (
    <Dialog title="Reset the desk" onClose={onClose}>
      <p>
        There are <b>{count}</b> marked scripts on this desk. Both of these are undoable
        with ⌘Z, but export first if you want a copy that outlives this browser.
      </p>
      <div className={s.dialogRow}>
        <button type="button" className={s.btnGhost} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={s.btnGhost} onClick={onResample}>
          Lay the sample history down again
        </button>
        <button type="button" className={s.btn} onClick={onClear}>
          Clear every mark
        </button>
      </div>
    </Dialog>
  );
}
