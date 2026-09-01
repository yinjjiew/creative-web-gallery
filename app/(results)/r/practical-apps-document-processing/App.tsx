"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { citeField, downloadText, editionJson, editionText, filenameStem } from "./edition";
import Facsimile from "./Facsimile";
import s from "./register.module.css";
import { PROVENANCE, SCHOLAR, THIS_SITTING, buildDoc } from "./seed";
import {
  CERTAINTIES,
  FIELD_LABEL,
  FIELD_SHORT,
  STORAGE_KEY,
  deserialise,
  findLine,
  folioOf,
  neighbour,
  openQuestions,
  reducer,
  serialise,
  type Certainty,
  type Focus,
  type State,
} from "./state";
import { fieldCaption, suggestionLabel, suggestionsFor } from "./suggest";

type Panel = "desk" | "edition" | "keys";

function initialState(): State {
  let doc = buildDoc();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? deserialise(raw) : null;
    if (stored) doc = { ...stored, activeFolioId: "f47" };
  } catch {
    /* memory only */
  }
  return {
    doc,
    focus: { lineId: "f47-l3", fieldId: "surname" },
    linking: false,
    past: [],
    future: [],
  };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [panel, setPanel] = useState<Panel>("desk");
  const [save, setSave] = useState<"saved" | "failed">("saved");
  const [copied, setCopied] = useState(false);
  const valueRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  const doc = state.doc;
  const folio = folioOf(doc);
  const questions = useMemo(() => openQuestions(doc), [doc]);
  const focused = state.focus ? findLine(doc, state.focus.lineId) : null;
  const field = focused && state.focus ? focused.line.fields[state.focus.fieldId] : null;
  const suggestions = state.focus ? suggestionsFor(doc, state.focus) : [];

  useEffect(() => {
    if (first.current) {
      first.current = false;
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          window.localStorage.setItem(STORAGE_KEY, serialise(doc));
        }
      } catch {
        setSave("failed");
      }
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, serialise(doc));
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, [doc]);

  const setFocus = useCallback((focus: Focus | null) => {
    dispatch({ type: "focus", focus });
    dispatch({ type: "linking", on: false });
    setPanel("desk");
  }, []);

  function write(partial: { value?: string; certainty?: Certainty; caveat?: string; origin?: "judgement" | "suggestion" }, reason: string) {
    if (!state.focus) return;
    dispatch({
      type: "patch",
      lineId: state.focus.lineId,
      fieldId: state.focus.fieldId,
      patch: partial,
      reason,
    });
  }

  function nextQuestion() {
    if (!questions.length) return;
    const i = state.focus
      ? questions.findIndex((q) => q.lineId === state.focus?.lineId && q.fieldId === state.focus.fieldId)
      : -1;
    setFocus(questions[(i + 1) % questions.length]);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const t = event.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        setPanel((p) => (p === "keys" ? "desk" : "keys"));
        return;
      }
      if (event.key === "Escape") {
        if (typing) {
          (t as HTMLElement).blur();
          return;
        }
        if (state.linking) {
          dispatch({ type: "linking", on: false });
          return;
        }
        if (panel !== "desk") {
          setPanel("desk");
          return;
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        return;
      }
      if (typing) return;
      if (event.key === "n") {
        event.preventDefault();
        nextQuestion();
        return;
      }
      if (event.key === "e") {
        setPanel((p) => (p === "edition" ? "desk" : "edition"));
        return;
      }
      if (event.key === "[" || event.key === "]") {
        const i = doc.folios.findIndex((f) => f.id === folio.id);
        const next = doc.folios[event.key === "]" ? i + 1 : i - 1];
        if (next) dispatch({ type: "folio", id: next.id });
        return;
      }
      if (!state.focus) {
        if (event.key === "Enter" || event.key === "j" || event.key === "ArrowDown") {
          event.preventDefault();
          setFocus({ lineId: folio.lines[0].id, fieldId: "when" });
        }
        return;
      }
      if (event.key >= "1" && event.key <= "4") {
        const certainty = CERTAINTIES[Number(event.key) - 1];
        write({ certainty }, "certainty");
        return;
      }
      if (event.key === "l") {
        dispatch({ type: "linking", on: !state.linking });
        return;
      }
      if (event.key === "Enter") {
        valueRef.current?.focus();
        return;
      }
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocus(neighbour(folio, state.focus, 1, 0));
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocus(neighbour(folio, state.focus, -1, 0));
      }
      if (event.key === "Tab") {
        event.preventDefault();
        setFocus(neighbour(folio, state.focus, 0, event.shiftKey ? -1 : 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cite =
    focused && field && state.focus
      ? citeField(doc, focused.line, field, FIELD_LABEL[state.focus.fieldId], focused.folio)
      : null;

  return (
    <div className={`${s.shell} ${state.linking ? s.linking : ""}`}>
      <header className={s.head}>
        <div className={s.brand}>
          <h1 className={s.title}>Register</h1>
          <p className={s.who}>
            {SCHOLAR} · {THIS_SITTING} · a sitting, not a spreadsheet
          </p>
        </div>
        <p className={s.stats}>
          {folio.church}, {folio.parish} · folio {folio.folio} · {String(folio.year)} ·{" "}
          {String(questions.length)} open{" "}
          {questions.length === 1 ? "question" : "questions"} · certainty is about the ink
        </p>
        <nav className={s.nav} aria-label="Views">
          <button type="button" aria-pressed={panel === "desk"} onClick={() => setPanel("desk")}>
            Desk
          </button>
          <button type="button" aria-pressed={panel === "edition"} onClick={() => setPanel("edition")}>
            Edition
          </button>
          <button type="button" aria-pressed={panel === "keys"} onClick={() => setPanel("keys")}>
            Keys
          </button>
          <button type="button" onClick={nextQuestion}>
            Next open
          </button>
        </nav>
        <Link className={s.escape} href="/tasks/practical-apps-document-processing">
          the brief
        </Link>
      </header>

      {panel === "edition" ? (
        <section className={s.edition} aria-labelledby="edition-title">
          <p className={s.kicker}>Publishable</p>
          <h2 id="edition-title">What another scholar can cite</h2>
          <p className={s.prompt}>
            Every field keeps its certainty, its caveat, its origin, the region of the plate it
            came from, and the first reading. Suggestions remain labelled. This is the record —
            there is no parallel document of caveats to fall out of sync.
          </p>
          <div className={s.editionBar}>
            <button
              type="button"
              className={s.ghost}
              onClick={() =>
                downloadText(`${filenameStem(doc)}.txt`, editionText(doc), "text/plain")
              }
            >
              Download the edition
            </button>
            <button
              type="button"
              className={s.ghost}
              onClick={() =>
                downloadText(`${filenameStem(doc)}.json`, editionJson(doc), "application/json")
              }
            >
              Download JSON
            </button>
            <button
              type="button"
              className={s.ghost}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(editionText(doc));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy the edition"}
            </button>
          </div>
          <pre>{editionText(doc)}</pre>
        </section>
      ) : null}

      {panel === "keys" ? (
        <section className={s.keys} aria-labelledby="keys-title">
          <p className={s.kicker}>Speed</p>
          <h2 id="keys-title">Four hours at a time</h2>
          <p className={s.prompt}>
            Touch a cell on the plate, or a row in the open list. Certainty is one key. A
            suggestion never becomes a judgement unless she says so.
          </p>
          <dl>
            <dt>n</dt>
            <dd>Next open question</dd>
            <dt>1–4</dt>
            <dd>Certain, probable, guess, illegible</dd>
            <dt>j / k</dt>
            <dd>Line down / up</dd>
            <dt>Tab</dt>
            <dd>Next field on the line</dd>
            <dt>Enter</dt>
            <dd>Type the reading</dd>
            <dt>l</dt>
            <dd>Link a region by dragging on the plate</dd>
            <dt>e</dt>
            <dd>The edition</dd>
            <dt>⌃Z</dt>
            <dd>Undo the last change; the original reading is still in the history</dd>
            <dt>[ / ]</dt>
            <dd>Previous / next folio</dd>
          </dl>
        </section>
      ) : null}

      {panel === "desk" ? (
        <div className={s.desk}>
          <section className={s.plateWrap} aria-label="Facsimile">
            <div className={s.plateCap}>
              <span>
                <strong>
                  {folio.church} · folio {folio.folio}
                </strong>
                <br />
                Synthesized plate · Rose’s Act form
              </span>
              <div className={s.folios} role="group" aria-label="Folio">
                {doc.folios.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={f.id === folio.id}
                    onClick={() => dispatch({ type: "folio", id: f.id })}
                  >
                    {f.folio} / {String(f.year)}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.plate}>
              <Facsimile
                folio={folio}
                focus={state.focus}
                linking={state.linking}
                onFocus={setFocus}
                onRegion={(region) => {
                  if (!state.focus) return;
                  dispatch({
                    type: "region",
                    lineId: state.focus.lineId,
                    fieldId: state.focus.fieldId,
                    region,
                  });
                }}
              />
            </div>
            <p className={s.plateHint}>
              {state.linking
                ? "Drag on the plate to bind this reading to a region. The first box is kept until she draws another."
                : folio.damage[0]}
            </p>
          </section>

          <section className={s.paper} aria-label="Working paper">
            <div className={s.queueBlock}>
            <p className={s.kicker}>Open questions</p>
            <h2>Uncertainty is the record</h2>
            <p className={s.prompt}>
              A cell that can only hold Whitaker or nothing forced her to lie. Here a field
              holds a reading, a certainty, a caveat, and the patch of the plate it came from.
              Touch a rust mark — or a row below — and the page answers.
            </p>
            <ul className={s.queue}>
              {questions.map((q) => {
                const found = findLine(doc, q.lineId);
                if (!found) return null;
                const f = found.line.fields[q.fieldId];
                const current =
                  state.focus?.lineId === q.lineId && state.focus.fieldId === q.fieldId;
                return (
                  <li key={`${q.lineId}-${q.fieldId}`}>
                    <button
                      type="button"
                      aria-current={current || undefined}
                      data-origin={f.origin}
                      onClick={() => setFocus(q)}
                    >
                      <span className={s.loc}>
                        f.{found.folio.folio} l.{String(found.line.n)} {FIELD_SHORT[q.fieldId]}
                      </span>
                      <span className={s.val} data-origin={f.origin}>
                        {f.value || "∅"}
                      </span>
                      <span className={s.badge} data-origin={f.origin}>
                        {f.origin === "suggestion" ? "suggested" : f.certainty}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            </div>

            {state.focus && focused && field ? (
              <div className={s.work}>
                <p className={s.kicker}>{fieldCaption(doc, state.focus)}</p>
                <div className={s.fieldBlock}>
                  <div className={s.labelRow}>
                    <label htmlFor="reading">{FIELD_LABEL[state.focus.fieldId]}</label>
                    <span className={s.originTag} data-origin={field.origin}>
                      {field.origin === "suggestion"
                        ? "suggestion — not her judgement"
                        : "her judgement"}
                    </span>
                  </div>
                  <input
                    id="reading"
                    ref={valueRef}
                    className={s.valueInput}
                    data-origin={field.origin}
                    data-certainty={field.certainty}
                    value={field.value}
                    aria-invalid={field.origin === "suggestion" || undefined}
                    onChange={(event) => write({ value: event.target.value }, "typed")}
                  />
                  <input
                    className={s.caveatInput}
                    value={field.caveat}
                    aria-label="Caveat"
                    placeholder="Caveat — stain, later hand, blank, impossible day…"
                    onChange={(event) => write({ caveat: event.target.value }, "caveat")}
                  />
                  <div className={s.sure} role="group" aria-label="Certainty about the ink">
                    {CERTAINTIES.map((level) => (
                      <button
                        key={level}
                        type="button"
                        data-level={level}
                        aria-pressed={field.certainty === level}
                        onClick={() => write({ certainty: level }, "certainty")}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className={s.legend}>
                    Certain means she can read the graphs, not that the fact is true. Illegible
                    is a reading: unread, not absent.
                  </p>
                  <div className={s.actions}>
                    <button
                      type="button"
                      className={s.ghost}
                      aria-pressed={state.linking}
                      onClick={() => dispatch({ type: "linking", on: !state.linking })}
                    >
                      {state.linking ? "Drawing region…" : "Link region"}
                    </button>
                    <button
                      type="button"
                      className={s.confirm}
                      disabled={field.origin !== "suggestion"}
                      onClick={() => write({ origin: "judgement" }, "confirmed as judgement")}
                    >
                      This is my reading
                    </button>
                  </div>
                </div>

                {suggestions.length ? (
                  <aside className={s.suggest} aria-label="Suggestions, not readings">
                    <h3>Suggestions — not readings</h3>
                    <p>
                      The machine may offer a glossary, a spelling attested elsewhere, or a
                      calendar warning. None of these is written as her judgement unless she
                      adopts one, and even then it stays marked until she confirms.
                    </p>
                    <ul>
                      {suggestions.map((item) => (
                        <li key={item.id}>
                          <span className={s.kind}>{suggestionLabel(item.kind)}</span>
                          <span className={item.adoptable ? s.text : s.warn}>{item.text}</span>
                          <span>{item.note}</span>
                          {item.adoptable ? (
                            <button
                              type="button"
                              className={s.adopt}
                              onClick={() =>
                                write(
                                  { value: item.text, origin: "suggestion" },
                                  "adopted suggestion",
                                )
                              }
                            >
                              Adopt as suggestion
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </aside>
                ) : (
                  <p className={s.legend}>No suggestion on this field. The machine stays quiet.</p>
                )}

                <div className={s.history}>
                  <p className={s.kicker}>Revision — the first reading is kept</p>
                  <ol>
                    {field.revisions.map((rev, i) => (
                      <li key={`${rev.seq}-${rev.reason}`}>
                        <div>
                          <div className={s.old} data-origin={rev.origin}>
                            {rev.value || "∅"} [{rev.certainty}]
                            {rev.origin === "suggestion" ? " · suggestion" : ""}
                          </div>
                          <div className={s.meta}>
                            {rev.sitting} · {rev.reason}
                            {i === 0 ? " · original" : ""}
                            {rev.caveat ? ` · ${rev.caveat}` : ""}
                          </div>
                        </div>
                        {i < field.revisions.length - 1 ? (
                          <button
                            type="button"
                            className={s.restore}
                            onClick={() =>
                              dispatch({
                                type: "restore",
                                lineId: state.focus!.lineId,
                                fieldId: state.focus!.fieldId,
                                seq: rev.seq,
                              })
                            }
                          >
                            Restore
                          </button>
                        ) : (
                          <span className={s.meta}>now</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                {cite ? (
                  <p className={s.cite} data-origin={field.origin}>
                    {cite}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className={s.prompt}>
                The rust marks on the plate are fields she has not settled. The first touch
                opens one. Nothing on this desk fabricates a graph she has not read.
              </p>
            )}

            <p className={s.legend} style={{ marginTop: "1.2rem" }}>
              {PROVENANCE[0]}
            </p>
          </section>
        </div>
      ) : null}

      <footer className={s.foot}>
        <span>
          <kbd>n</kbd> next open · <kbd>1–4</kbd> certainty · <kbd>l</kbd> link region ·{" "}
          <kbd>?</kbd> keys
        </span>
        <span>
          {save === "saved" ? "sitting kept on this machine" : "could not keep the sitting"}
          {state.past.length ? ` · ${String(state.past.length)} to undo` : ""}
        </span>
      </footer>
      <p className={s.live} aria-live="polite">
        {field
          ? `${FIELD_SHORT[state.focus!.fieldId]} ${field.certainty}${field.origin === "suggestion" ? ", suggestion" : ""}`
          : ""}
      </p>
    </div>
  );
}
