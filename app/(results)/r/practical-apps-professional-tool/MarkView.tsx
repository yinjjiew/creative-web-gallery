"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { Focus } from "./App";
import { SCRIPT_BY_ID, scriptText } from "./corpus";
import { fmtDuration, scriptNo } from "./format";
import ReturnSheet from "./ReturnSheet";
import s from "./marking.module.css";
import {
  ASSIGNMENT,
  BANDS,
  MAX_PER_STRAND,
  MAX_TOTAL,
  STRANDS,
  STRAND_IDS,
  bandFor,
  type StrandId,
} from "./rubric";
import {
  STEMS,
  STEM_BY_ID,
  missingSlots,
  normaliseCompletion,
  parseTemplate,
  type Slot,
  type Stem,
} from "./stems";
import {
  isComplete,
  judgementOf,
  queueOf,
  standingMarks,
  strandsSet,
  totalOf,
  type Action,
  type Clip,
  type Doc,
  type Judgement,
  type MarkSet,
} from "./state";

type Props = {
  doc: Doc;
  run: (action: Action, toast?: string, undoable?: boolean) => void;
  focus: Focus;
  setFocus: (focus: Focus) => void;
  openScript: (scriptId: number, mode?: "review" | "reread") => void;
  goConsistency: () => void;
};

type Draft = {
  stemId: string;
  values: Record<string, string>;
  clipIds: string[];
  armed: string | null;
};

type Selection = { start: number; end: number; text: string };

/**
 * A clock that only runs while the tab is in front. The pace figures are the
 * one place this tool makes a quantitative claim about her, so it should not
 * count the twenty minutes the laptop spent shut.
 */
function useActiveClock(key: number | null) {
  const accumulated = useRef(0);
  const since = useRef<number | null>(null);

  useEffect(() => {
    accumulated.current = 0;
    since.current = document.visibilityState === "visible" ? Date.now() : null;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        since.current = Date.now();
      } else if (since.current !== null) {
        accumulated.current += Date.now() - since.current;
        since.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [key]);

  return useCallback(() => {
    const live = since.current !== null ? Date.now() - since.current : 0;
    return (accumulated.current + live) / 1000;
  }, []);
}

function Elapsed({ read }: { read: () => number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = read();
  const over = seconds > ASSIGNMENT.budgetSecondsPerScript;
  return (
    <span className={over ? s.statusWarn : undefined}>
      {fmtDuration(seconds)}
      {over ? " over" : ""}
    </span>
  );
}

/* ------------------------------------------------------------------ clips */

type Segment = { start: number; end: number; clip: Clip | null };

function segmentsFor(from: number, to: number, clips: Clip[]): Segment[] {
  const inside = clips
    .filter((clip) => clip.start < to && clip.end > from)
    .sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = from;
  for (const clip of inside) {
    const start = Math.max(from, clip.start);
    const end = Math.min(to, clip.end);
    if (start < cursor) continue; // overlapping clip — keep the first one
    if (start > cursor) out.push({ start: cursor, end: start, clip: null });
    out.push({ start, end, clip });
    cursor = end;
  }
  if (cursor < to) out.push({ start: cursor, end: to, clip: null });
  return out;
}

/** Absolute character offset of a DOM position inside the rendered script. */
function absoluteOffset(node: Node, offset: number, root: HTMLElement): number | null {
  let element: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
  while (element && element !== root && !element.dataset.off) {
    element = element.parentElement;
  }
  if (!element || !element.dataset.off) return null;
  const base = Number(element.dataset.off);
  if (!Number.isFinite(base)) return null;
  return base + (node.nodeType === Node.TEXT_NODE ? offset : 0);
}

/* -------------------------------------------------------------- mark view */

export default function MarkView({ doc, run, focus, setFocus, openScript, goConsistency }: Props) {
  const queue = useMemo(() => queueOf(doc), [doc]);
  const targetId = focus?.scriptId ?? queue[0] ?? null;
  const script = targetId !== null ? SCRIPT_BY_ID.get(targetId) : undefined;

  const isReread = focus?.mode === "reread";
  const judgement = targetId !== null ? judgementOf(doc, targetId) : null;
  const committed = judgement?.committedAt != null;
  const editable = judgement ? (isReread ? true : !committed) : false;

  const marks: MarkSet = isReread ? (judgement?.reread?.marks ?? {}) : (judgement?.marks ?? {});
  const total = totalOf(marks);
  const setCount = strandsSet(marks);
  const complete = isComplete(marks);

  const [activeStrand, setActiveStrand] = useState<StrandId>(STRAND_IDS[0]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pane, setPane] = useState<"script" | "return" | "compare">("script");
  const [compareWith, setCompareWith] = useState<number | null>(null);
  const [conflict, setConflict] = useState<null | { anchorId: number; verdict: "this" | "anchor" }>(
    null
  );
  const [reveal, setReveal] = useState(false);
  const [slashArmed, setSlashArmed] = useState(false);
  const [mobileTab, setMobileTab] = useState<"script" | "marks">("script");
  const [hoverLevel, setHoverLevel] = useState<{ strand: StrandId; level: number } | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const readClock = useActiveClock(targetId);

  const fullText = useMemo(() => (script ? scriptText(script) : ""), [script]);
  const paragraphSpans = useMemo(() => {
    if (!script) return [];
    const spans: Array<{ start: number; end: number }> = [];
    let cursor = 0;
    for (const paragraph of script.paragraphs) {
      spans.push({ start: cursor, end: cursor + paragraph.length });
      cursor += paragraph.length + 2;
    }
    return spans;
  }, [script]);

  /* --------------------------------------------------- reset on new script */

  useEffect(() => {
    setDraft(null);
    setSelection(null);
    setPane("script");
    setCompareWith(null);
    setConflict(null);
    setReveal(false);
    setSlashArmed(false);
    setMobileTab("script");
    scrollRef.current?.scrollTo({ top: 0 });
  }, [targetId, isReread]);

  useEffect(() => {
    const firstUnset = STRAND_IDS.find((strand) => typeof marks[strand] !== "number");
    setActiveStrand(firstUnset ?? STRAND_IDS[0]);
    // Only when the script changes: moving between strands is her business.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, isReread]);

  /* -------------------------------------------------------------- anchors */

  const anchors = useMemo(() => {
    const others = Object.values(doc.judgements).filter(
      (candidate) => candidate.committedAt !== null && candidate.scriptId !== targetId
    );
    if (!others.length) return [];
    if (setCount === 0) {
      // Nothing marked yet on this one, so show the standing reference set:
      // one script she has already placed in each band, cheapest possible way
      // of remembering what a 22 looked like last Tuesday.
      const chosen: Judgement[] = [];
      for (const band of BANDS) {
        const middle = (band.min + band.max) / 2;
        const inBand = others.filter((candidate) => {
          const t = totalOf(standingMarks(candidate));
          return t >= band.min && t <= band.max;
        });
        if (!inBand.length) continue;
        inBand.sort(
          (a, b) =>
            Math.abs(totalOf(standingMarks(a)) - middle) -
            Math.abs(totalOf(standingMarks(b)) - middle)
        );
        chosen.push(inBand[0]);
      }
      return chosen;
    }
    return [...others]
      .sort(
        (a, b) =>
          Math.abs(totalOf(standingMarks(a)) - total) -
          Math.abs(totalOf(standingMarks(b)) - total)
      )
      .slice(0, 5)
      .sort((a, b) => totalOf(standingMarks(a)) - totalOf(standingMarks(b)));
  }, [doc.judgements, targetId, total, setCount]);

  const nearestAnchor = useMemo(() => {
    if (!anchors.length) return null;
    if (setCount === 0) return anchors[Math.floor(anchors.length / 2)];
    return [...anchors].sort(
      (a, b) =>
        Math.abs(totalOf(standingMarks(a)) - total) - Math.abs(totalOf(standingMarks(b)) - total)
    )[0];
  }, [anchors, total, setCount]);

  /* ------------------------------------------------------------ selection */

  useEffect(() => {
    function onSelectionChange() {
      const root = sheetRef.current;
      if (!root) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
      const rawStart = absoluteOffset(range.startContainer, range.startOffset, root);
      const rawEnd = absoluteOffset(range.endContainer, range.endOffset, root);
      if (rawStart === null || rawEnd === null) {
        setSelection(null);
        return;
      }
      let start = Math.min(rawStart, rawEnd);
      let end = Math.max(rawStart, rawEnd);
      while (start < end && /\s/.test(fullText[start])) start += 1;
      while (end > start && /\s/.test(fullText[end - 1])) end -= 1;
      if (end - start < 4) {
        setSelection(null);
        return;
      }
      setSelection({ start, end, text: fullText.slice(start, end) });
    }

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [fullText]);

  const clips = judgement?.clips ?? [];

  const fillQuoteSlot = useCallback((clip: Clip) => {
    setDraft((current) => {
      if (!current) return current;
      const stem = STEM_BY_ID[current.stemId];
      if (!stem) return current;
      const slotId =
        current.armed && stem.slots.some((slot) => slot.id === current.armed && slot.kind === "quote")
          ? current.armed
          : stem.slots.find((slot) => slot.kind === "quote" && !current.values[slot.id])?.id;
      if (!slotId) return current;
      return {
        ...current,
        values: { ...current.values, [slotId]: clip.text },
        clipIds: current.clipIds.includes(clip.id) ? current.clipIds : [...current.clipIds, clip.id],
        armed: null,
      };
    });
  }, []);

  const takeClip = useCallback(() => {
    if (!selection || targetId === null || !judgement) return;
    const overlaps = judgement.clips.some(
      (clip) => clip.start < selection.end && clip.end > selection.start
    );
    const clip: Clip = {
      id: `clip-${targetId}-${selection.start}-${selection.end}`,
      start: selection.start,
      end: selection.end,
      text: selection.text,
      at: Date.now(),
    };
    if (!overlaps) run({ type: "add-clip", scriptId: targetId, clip });
    fillQuoteSlot(clip);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, [selection, targetId, judgement, run, fillQuoteSlot]);

  /* ---------------------------------------------------------------- draft */

  const openStem = useCallback(
    (stemId: string) => {
      const stem = STEM_BY_ID[stemId];
      if (!stem) return;
      const values: Record<string, string> = {};
      for (const slot of stem.slots) {
        if (slot.kind === "pick") values[slot.id] = "";
      }
      const firstQuote = stem.slots.find((slot) => slot.kind === "quote");
      setDraft({ stemId, values, clipIds: [], armed: firstQuote?.id ?? null });
      if (selection) {
        // She highlighted first and then chose the comment, which is the order
        // it happens in when reading. Use what is already selected.
        window.setTimeout(() => takeClip(), 0);
      }
    },
    [selection, takeClip]
  );

  const insertComment = useCallback(() => {
    if (!draft || targetId === null) return;
    const stem = STEM_BY_ID[draft.stemId];
    if (!stem || missingSlots(stem, draft.values).length) return;
    run({
      type: "add-comment",
      scriptId: targetId,
      comment: {
        id: `cmt-${targetId}-${Date.now().toString(36)}`,
        stemId: draft.stemId,
        values: draft.values,
        clipIds: draft.clipIds,
        at: Date.now(),
      },
    });
    setDraft(null);
  }, [draft, targetId, run]);

  /* -------------------------------------------------------------- actions */

  const setMark = useCallback(
    (strand: StrandId, value: number) => {
      if (targetId === null || !editable) return;
      run(
        isReread
          ? { type: "set-reread-mark", scriptId: targetId, strand, value }
          : { type: "set-mark", scriptId: targetId, strand, value }
      );
      const index = STRAND_IDS.indexOf(strand);
      const next = STRAND_IDS.slice(index + 1).find(
        (candidate) => typeof marks[candidate] !== "number"
      );
      setActiveStrand(next ?? STRAND_IDS[Math.min(index + 1, STRAND_IDS.length - 1)]);
    },
    [targetId, editable, isReread, run, marks]
  );

  const commit = useCallback(() => {
    if (targetId === null || !judgement || !complete) return;
    if (isReread) {
      setReveal(true);
      return;
    }
    run(
      {
        type: "commit",
        scriptId: targetId,
        seconds: readClock(),
        anchors: anchors.map((anchor) => anchor.scriptId),
      },
      `Script ${scriptNo(targetId)} filed at ${total}/${MAX_TOTAL}.`
    );
    setFocus(null);
  }, [targetId, judgement, complete, isReread, run, readClock, anchors, total, setFocus]);

  /* ------------------------------------------------------------- keyboard */

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const node = event.target as HTMLElement | null;
      const typing =
        !!node &&
        (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.isContentEditable);
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        if (draft) {
          setDraft(null);
          event.preventDefault();
        } else if (pane !== "script") {
          setPane("script");
          event.preventDefault();
        } else if (focus) {
          setFocus(null);
          event.preventDefault();
        }
        return;
      }

      if (typing) return;

      if (slashArmed) {
        const stem = STEMS.find((candidate) => candidate.key === event.key);
        setSlashArmed(false);
        if (stem) {
          event.preventDefault();
          openStem(stem.id);
        }
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        setSlashArmed(true);
        return;
      }

      if (/^[0-6]$/.test(event.key) && editable) {
        event.preventDefault();
        setMark(activeStrand, Number(event.key));
        return;
      }

      const key = event.key.toLowerCase();
      const index = STRAND_IDS.indexOf(activeStrand);

      if (event.key === "ArrowDown" || key === "j") {
        event.preventDefault();
        setActiveStrand(STRAND_IDS[Math.min(index + 1, STRAND_IDS.length - 1)]);
        return;
      }
      if (event.key === "ArrowUp" || key === "k") {
        event.preventDefault();
        setActiveStrand(STRAND_IDS[Math.max(index - 1, 0)]);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
        return;
      }
      if (key === "q" && selection) {
        event.preventDefault();
        takeClip();
        return;
      }
      if (key === "n" && targetId !== null && !committed) {
        event.preventDefault();
        run({ type: "defer", scriptId: targetId }, `Script ${scriptNo(targetId)} put to the back.`);
        setFocus(null);
        return;
      }
      if (key === "f" && targetId !== null) {
        event.preventDefault();
        run({ type: "toggle-flag", scriptId: targetId });
        return;
      }
      if (key === "a" && nearestAnchor) {
        event.preventDefault();
        setCompareWith(nearestAnchor.scriptId);
        setPane(pane === "compare" ? "script" : "compare");
        return;
      }
      if (key === "p") {
        event.preventDefault();
        setPane(pane === "return" ? "script" : "return");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeStrand,
    commit,
    committed,
    draft,
    editable,
    focus,
    nearestAnchor,
    openStem,
    pane,
    run,
    selection,
    setFocus,
    setMark,
    slashArmed,
    takeClip,
    targetId,
  ]);

  /* ----------------------------------------------------------- empty desk */

  if (targetId === null || !script || !judgement) {
    return (
      <div className={s.scrollView}>
        <div className={s.viewInner}>
          <h1 className={s.viewTitle}>Every script is marked.</h1>
          <p className={s.viewLede}>
            All {ASSIGNMENT.setSize} are filed. Before you hand them back, draw a second
            reading sample — a blind re-mark of a dozen scripts is the cheapest evidence you
            will ever have that the set is internally consistent, and it is the thing you
            will want at moderation.
          </p>
          <button type="button" className={s.btn} onClick={goConsistency}>
            Go to consistency
          </button>
        </div>
      </div>
    );
  }

  const dupIndex = buildDuplicateIndex(doc, targetId);

  return (
    <>
      <div className={s.mark}>
        <div className={s.mobileTabs}>
          <button
            type="button"
            className={mobileTab === "script" ? `${s.mobileTab} ${s.mobileTabOn}` : s.mobileTab}
            onClick={() => setMobileTab("script")}
          >
            The script
          </button>
          <button
            type="button"
            className={mobileTab === "marks" ? `${s.mobileTab} ${s.mobileTabOn}` : s.mobileTab}
            onClick={() => setMobileTab("marks")}
          >
            Marks &amp; comments
            {complete ? ` · ${total}` : ""}
          </button>
        </div>

        <div className={mobileTab === "script" ? s.left : `${s.left} ${s.leftHidden}`}>
          <div className={s.sheetScroll} ref={scrollRef}>
            <div className={s.sheetHead}>
              <span className={s.candNo}>{scriptNo(script.id)}</span>
              <span className={s.candMeta}>
                {doc.settings.revealNames ? (
                  <>
                    <b>{script.name}</b> · {script.form}
                  </>
                ) : (
                  <>candidate {script.candidate}</>
                )}{" "}
                · {script.wordCount} words
              </span>
              <button
                type="button"
                className={s.anonPill}
                onClick={() =>
                  run(
                    {
                      type: "set-setting",
                      key: "revealNames",
                      value: !doc.settings.revealNames,
                    },
                    undefined,
                    false
                  )
                }
              >
                {doc.settings.revealNames ? "hide names" : "names hidden"}
              </button>
              {judgement.flagged ? (
                <span className={`${s.modTag} ${s.tagFlag}`}>flagged</span>
              ) : null}
              <span className={s.candMeta} style={{ marginLeft: "auto" }}>
                {pane === "script" ? (
                  <>
                    <button
                      type="button"
                      className={s.anonPill}
                      onClick={() => setPane("return")}
                    >
                      student&rsquo;s sheet · p
                    </button>{" "}
                    {nearestAnchor ? (
                      <button
                        type="button"
                        className={s.anonPill}
                        onClick={() => {
                          setCompareWith(nearestAnchor.scriptId);
                          setPane("compare");
                        }}
                      >
                        compare · a
                      </button>
                    ) : null}
                  </>
                ) : (
                  <button type="button" className={s.anonPill} onClick={() => setPane("script")}>
                    back to the script · esc
                  </button>
                )}
              </span>
            </div>

            {isReread ? (
              <div className={s.blindBar}>
                <b>Second reading.</b> Your first mark for this script is hidden until you file
                this one. Mark it as though you had never seen it.
              </div>
            ) : committed ? (
              <div className={s.blindBar} style={{ background: "var(--amber-wash)", borderColor: "var(--amber)", color: "var(--amber)" }}>
                <b>Already filed.</b> Marks are locked. Reopening records a revision on the
                moderation record, which is the point of it.
                <button
                  type="button"
                  className={s.rowBtn}
                  onClick={() =>
                    run(
                      { type: "reopen", scriptId: script.id, note: "Reopened from the marking desk." },
                      `Script ${scriptNo(script.id)} reopened.`
                    )
                  }
                >
                  Reopen
                </button>
              </div>
            ) : null}

            {pane === "return" ? (
              <ReturnSheet judgement={judgement} candidate={script.candidate} preview />
            ) : pane === "compare" && compareWith !== null ? (
              <ComparePane
                doc={doc}
                thisId={script.id}
                anchorId={compareWith}
                thisTotal={total}
                thisComplete={complete}
                onVerdict={(verdict) => setConflict({ anchorId: compareWith, verdict })}
              />
            ) : (
              <div className={s.sheet} ref={sheetRef}>
                {script.paragraphs.map((paragraph, index) => {
                  const span = paragraphSpans[index];
                  return (
                    <p key={index} className={s.para}>
                      {segmentsFor(span.start, span.end, clips).map((segment) =>
                        segment.clip ? (
                          <mark
                            key={segment.start}
                            data-off={segment.start}
                            className={
                              draft?.clipIds.includes(segment.clip.id)
                                ? `${s.clipped} ${s.clipUsed}`
                                : s.clipped
                            }
                            title="Clipped passage"
                          >
                            {fullText.slice(segment.start, segment.end)}
                          </mark>
                        ) : (
                          <span key={segment.start} data-off={segment.start}>
                            {fullText.slice(segment.start, segment.end)}
                          </span>
                        )
                      )}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          <div className={s.sheetFoot}>
            {selection ? (
              <>
                <button type="button" className={s.btnGhost} onClick={takeClip}>
                  Clip &ldquo;{selection.text.slice(0, 34)}
                  {selection.text.length > 34 ? "…" : ""}&rdquo;
                </button>
                <span className={s.clipCue}>or press q</span>
              </>
            ) : (
              <span>
                Select any passage in the script to clip it — {clips.length}{" "}
                {clips.length === 1 ? "clip" : "clips"} on this one.
              </span>
            )}
            <span className={s.sampleNote}>
              Sample script — generated, not written by a student.
            </span>
          </div>
        </div>

        <div className={mobileTab === "marks" ? s.panel : `${s.panel} ${s.panelHidden}`}>
          <div className={s.panelSection}>
            <div className={s.sectionLabel}>
              {isReread ? "Second reading" : "Rubric"}
              <span>
                {setCount}/{STRANDS.length} strands
              </span>
            </div>
            {STRANDS.map((strand) => {
              const value = marks[strand.id];
              const shown =
                hoverLevel && hoverLevel.strand === strand.id ? hoverLevel.level : value;
              const active = activeStrand === strand.id;
              return (
                <div
                  key={strand.id}
                  className={active ? `${s.strand} ${s.strandActive}` : s.strand}
                >
                  <div className={s.strandName}>
                    <span className={s.strandKey} aria-hidden="true">
                      {strand.key}
                    </span>
                    {strand.name}
                  </div>
                  <div
                    className={s.chips}
                    role="radiogroup"
                    aria-label={`${strand.name} — ${strand.gloss}`}
                  >
                    {Array.from({ length: MAX_PER_STRAND + 1 }, (_, level) => (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={value === level}
                        aria-label={`${strand.name} ${level}: ${strand.descriptors[level]}`}
                        disabled={!editable}
                        className={[
                          s.chip,
                          isReread ? s.chipSecond : "",
                          value === level ? s.chipOn : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onMouseEnter={() => setHoverLevel({ strand: strand.id, level })}
                        onMouseLeave={() => setHoverLevel(null)}
                        onFocus={() => setActiveStrand(strand.id)}
                        onClick={() => setMark(strand.id, level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div
                    className={
                      typeof shown === "number" ? s.descriptor : `${s.descriptor} ${s.descriptorEmpty}`
                    }
                  >
                    {typeof shown === "number" ? strand.descriptors[shown] : strand.gloss}
                  </div>
                </div>
              );
            })}
            <p className={s.rubricNote}>
              Sample rubric. Written for this demonstration by a fictional department — not
              AQA, Edexcel, OCR or WJEC, and not any awarding body&rsquo;s mark scheme.
            </p>
          </div>

          <div className={s.totalRow}>
            <span className={complete ? s.totalNum : `${s.totalNum} ${s.totalIncomplete}`}>
              {total}
            </span>
            <span className={s.totalOf}>/ {MAX_TOTAL}</span>
            <span className={s.totalBand}>
              {complete ? (
                <>
                  <b>Band {bandFor(total).label}</b>
                  <i>{bandFor(total).note}</i>
                </>
              ) : (
                <>
                  <b>{STRANDS.length - setCount} still blank</b>
                  <i>the band appears when all five are in</i>
                </>
              )}
            </span>
          </div>

          <div className={s.composer}>
            {draft ? (
              <DraftEditor
                draft={draft}
                setDraft={setDraft}
                clips={clips}
                dupIndex={dupIndex}
                onInsert={insertComment}
                onCancel={() => setDraft(null)}
                onRemoveClip={(clipId) =>
                  run({ type: "remove-clip", scriptId: script.id, clipId })
                }
              />
            ) : (
              <>
                <div className={s.sectionLabel}>
                  Your eleven
                  <span>{slashArmed ? "press its number…" : "/ then a number"}</span>
                </div>
                <div className={s.bank}>
                  {STEMS.map((stem) => {
                    const usage = countUsage(doc, stem.id);
                    return (
                      <button
                        key={stem.id}
                        type="button"
                        className={s.bankItem}
                        onClick={() => openStem(stem.id)}
                      >
                        <span className={s.bankKey}>{stem.key}</span>
                        <span
                          className={`${s.bankDot} ${
                            stem.tone === "credit"
                              ? s.toneCredit
                              : stem.tone === "push"
                                ? s.tonePush
                                : s.toneFix
                          }`}
                          aria-hidden="true"
                        />
                        <span className={s.bankLabel}>{stem.label}</span>
                        <span
                          className={
                            usage.repeats > 0 ? `${s.bankUse} ${s.bankUseHot}` : s.bankUse
                          }
                          title={
                            usage.repeats > 0
                              ? `${usage.used} times, but only ${usage.distinct} different completions`
                              : `${usage.used} times`
                          }
                        >
                          {usage.used}
                          {usage.repeats > 0 ? `·${usage.distinct}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className={s.written}>
              {judgement.comments.length ? (
                judgement.comments.map((comment) => {
                  const stem = STEM_BY_ID[comment.stemId];
                  if (!stem) return null;
                  return (
                    <div key={comment.id} className={s.writtenItem}>
                      <div>{renderInline(stem, comment.values)}</div>
                      <button
                        type="button"
                        className={s.writtenKill}
                        aria-label="Remove this comment"
                        onClick={() =>
                          run(
                            { type: "remove-comment", scriptId: script.id, commentId: comment.id },
                            "Comment removed."
                          )
                        }
                      >
                        ×
                      </button>
                      <span className={s.writtenStem}>{stem.label}</span>
                    </div>
                  );
                })
              ) : (
                <p className={s.emptyNote}>
                  No comments on this script yet. Every one of your eleven needs something out
                  of this essay before it will go in.
                </p>
              )}
            </div>
          </div>

          <div className={s.foot}>
            <label className={s.fieldLabel} htmlFor="next-step" style={{ margin: "0 0 4px" }}>
              One thing for next time — leads the student&rsquo;s sheet
            </label>
            <textarea
              id="next-step"
              className={s.nextStep}
              value={judgement.nextStep}
              disabled={!editable}
              placeholder="The single change that would move this essay furthest."
              onChange={(event) =>
                run({ type: "set-next-step", scriptId: script.id, text: event.target.value })
              }
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  commit();
                }
              }}
            />
            <div className={s.commitRow}>
              <span className={s.commitWarn}>
                {!complete
                  ? `${STRANDS.length - setCount} strand${STRANDS.length - setCount === 1 ? "" : "s"} to go`
                  : !judgement.comments.length
                    ? "Filing with no comments — the student gets a number and nothing else"
                    : !judgement.nextStep.trim()
                      ? "No next step written"
                      : ""}
              </span>
              {!isReread && !committed ? (
                <button
                  type="button"
                  className={s.btnGhost}
                  onClick={() =>
                    run(
                      { type: "defer", scriptId: script.id },
                      `Script ${scriptNo(script.id)} put to the back of the queue.`
                    )
                  }
                >
                  Put back
                </button>
              ) : null}
              <button
                type="button"
                className={s.commitBtn}
                disabled={!complete || (committed && !isReread)}
                onClick={commit}
              >
                {isReread ? "File second reading" : committed ? "Filed" : "File and next"}
                <kbd>↵</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={s.anchors}>
        <div className={s.anchorsWhy}>
          <b>Anchors</b>
          {setCount === 0
            ? "One script you have already placed in each band. Read the nearest one before you decide."
            : `Your own decisions nearest ${total}. The question is not “is this a ${total}?” but “is this above or below these?”`}
        </div>
        <div className={s.anchorRow}>
          {anchors.length ? (
            anchors.map((anchor) => {
              const anchorScript = SCRIPT_BY_ID.get(anchor.scriptId);
              const anchorTotal = totalOf(standingMarks(anchor));
              const anchorMarks = standingMarks(anchor);
              return (
                <button
                  key={anchor.scriptId}
                  type="button"
                  className={
                    compareWith === anchor.scriptId ? `${s.anchor} ${s.anchorSelf}` : s.anchor
                  }
                  onClick={() => {
                    setCompareWith(anchor.scriptId);
                    setPane("compare");
                    setMobileTab("script");
                  }}
                >
                  <span className={s.anchorTop}>
                    <span className={s.anchorTotal}>{anchorTotal}</span>
                    <span>script {scriptNo(anchor.scriptId)}</span>
                  </span>
                  <span className={s.anchorStrands}>
                    {STRANDS.map((strand) => `${strand.key}${anchorMarks[strand.id] ?? "–"}`).join(
                      "  "
                    )}
                  </span>
                  <span className={s.anchorLine}>
                    {anchor.clips[0]?.text ?? anchorScript?.paragraphs[1] ?? ""}
                  </span>
                </button>
              );
            })
          ) : (
            <span className={s.emptyNote}>
              Nothing marked yet, so there is nothing to anchor against. The first dozen are
              always the hardest; come back and re-read them once the set has a shape.
            </span>
          )}
        </div>
      </div>

      {conflict ? (
        <ConflictDialog
          doc={doc}
          thisId={script.id}
          thisTotal={total}
          conflict={conflict}
          onClose={() => setConflict(null)}
          onReopenAnchor={() => {
            run(
              {
                type: "reopen",
                scriptId: conflict.anchorId,
                note: `Reopened after comparing against script ${scriptNo(script.id)}.`,
              },
              `Script ${scriptNo(conflict.anchorId)} reopened.`
            );
            setConflict(null);
            openScript(conflict.anchorId, "review");
          }}
        />
      ) : null}

      {reveal && judgement.reread ? (
        <RevealDialog
          judgement={judgement}
          onClose={() => setReveal(false)}
          onResolve={(kept, note) => {
            run({ type: "resolve-reread", scriptId: script.id, kept, note });
            run(
              { type: "file-reread", scriptId: script.id },
              kept === "second"
                ? `Second reading stands on script ${scriptNo(script.id)}.`
                : `First mark stands on script ${scriptNo(script.id)}.`
            );
            setReveal(false);
            setFocus(null);
          }}
        />
      ) : null}

      <div style={{ display: "none" }} aria-live="polite">
        <Elapsed read={readClock} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------- sub-views */

function renderInline(stem: Stem, values: Record<string, string>): React.ReactNode {
  return parseTemplate(stem.template).map((part, index) => {
    if ("text" in part) return <span key={index}>{part.text}</span>;
    const slot = stem.slots.find((candidate) => candidate.id === part.slot);
    const value = values[part.slot] ?? "";
    if (slot?.kind === "quote") return <q key={index}>{value}</q>;
    return <span key={index}>{value}</span>;
  });
}

function countUsage(doc: Doc, stemId: string): { used: number; distinct: number; repeats: number } {
  let used = 0;
  const seen = new Set<string>();
  for (const judgement of Object.values(doc.judgements)) {
    for (const comment of judgement.comments) {
      if (comment.stemId !== stemId) continue;
      used += 1;
      const stem = STEM_BY_ID[stemId];
      const notes = stem
        ? stem.slots
            .filter((slot) => slot.kind !== "quote")
            .map((slot) => normaliseCompletion(comment.values[slot.id] ?? ""))
            .join("|")
        : "";
      seen.add(notes);
    }
  }
  return { used, distinct: seen.size, repeats: Math.max(0, used - seen.size) };
}

/** Every completion she has already written, and where. */
function buildDuplicateIndex(doc: Doc, exceptScript: number): Map<string, number[]> {
  const index = new Map<string, number[]>();
  for (const judgement of Object.values(doc.judgements)) {
    if (judgement.scriptId === exceptScript) continue;
    for (const comment of judgement.comments) {
      const stem = STEM_BY_ID[comment.stemId];
      if (!stem) continue;
      for (const slot of stem.slots) {
        if (slot.kind !== "note") continue;
        const key = normaliseCompletion(comment.values[slot.id] ?? "");
        if (key.length < 8) continue;
        const list = index.get(key) ?? [];
        if (!list.includes(judgement.scriptId)) list.push(judgement.scriptId);
        index.set(key, list);
      }
    }
  }
  return index;
}

function DraftEditor({
  draft,
  setDraft,
  clips,
  dupIndex,
  onInsert,
  onCancel,
  onRemoveClip,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  clips: Clip[];
  dupIndex: Map<string, number[]>;
  onInsert: () => void;
  onCancel: () => void;
  onRemoveClip: (clipId: string) => void;
}) {
  const stem = STEM_BY_ID[draft.stemId];
  const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [draft.stemId]);

  if (!stem) return null;
  const missing = missingSlots(stem, draft.values);

  const duplicates: Array<{ slot: Slot; scripts: number[] }> = [];
  for (const slot of stem.slots) {
    if (slot.kind !== "note") continue;
    const key = normaliseCompletion(draft.values[slot.id] ?? "");
    if (key.length < 8) continue;
    const found = dupIndex.get(key);
    if (found?.length) duplicates.push({ slot, scripts: found });
  }

  let assigned = false;

  return (
    <div
      className={s.draft}
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          onInsert();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <div className={s.draftHead}>
        {stem.label}
        <button type="button" onClick={onCancel}>
          discard · esc
        </button>
      </div>

      <div className={s.draftBody}>
        {parseTemplate(stem.template).map((part, index) => {
          if ("text" in part) return <span key={index}>{part.text}</span>;
          const slot = stem.slots.find((candidate) => candidate.id === part.slot);
          if (!slot) return null;
          const value = draft.values[slot.id] ?? "";

          if (slot.kind === "quote") {
            return (
              <button
                key={index}
                type="button"
                className={[
                  s.slotQuote,
                  value ? "" : s.slotQuoteEmpty,
                  draft.armed === slot.id ? s.slotArmed : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? { ...current, armed: current.armed === slot.id ? null : slot.id }
                      : current
                  )
                }
              >
                {value || slot.hint}
              </button>
            );
          }

          if (slot.kind === "pick") {
            const isFirst = !assigned;
            assigned = true;
            return (
              <select
                key={index}
                className={s.slotPick}
                value={value}
                ref={
                  isFirst
                    ? (node) => {
                        firstFieldRef.current = node;
                      }
                    : undefined
                }
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, values: { ...current.values, [slot.id]: event.target.value } }
                      : current
                  )
                }
              >
                <option value="">{slot.hint}</option>
                {slot.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }

          const isFirst = !assigned;
          assigned = true;
          return (
            <input
              key={index}
              className={s.slotNote}
              value={value}
              placeholder={slot.hint}
              size={Math.max(slot.hint.length, value.length + 2)}
              ref={
                isFirst
                  ? (node) => {
                      firstFieldRef.current = node;
                    }
                  : undefined
              }
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? { ...current, values: { ...current.values, [slot.id]: event.target.value } }
                    : current
                )
              }
            />
          );
        })}
      </div>

      {draft.armed && clips.length ? (
        <div className={s.draftFoot}>
          <span>Fill it from a clip:</span>
          {clips.map((clip) => (
            <span key={clip.id} style={{ display: "inline-flex", gap: 2 }}>
              <button
                type="button"
                className={s.btnGhost}
                onClick={() =>
                  setDraft((current) =>
                    current && current.armed
                      ? {
                          ...current,
                          values: { ...current.values, [current.armed]: clip.text },
                          clipIds: current.clipIds.includes(clip.id)
                            ? current.clipIds
                            : [...current.clipIds, clip.id],
                          armed: null,
                        }
                      : current
                  )
                }
              >
                {clip.text.slice(0, 26)}
                {clip.text.length > 26 ? "…" : ""}
              </button>
              <button
                type="button"
                className={s.writtenKill}
                aria-label="Delete this clip"
                onClick={() => onRemoveClip(clip.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {duplicates.map(({ slot, scripts }) => (
        <p key={slot.id} className={s.dupWarn}>
          You have written this exact sentence on{" "}
          {scripts.length === 1 ? "script" : "scripts"}{" "}
          {scripts.slice(0, 4).map(scriptNo).join(", ")}
          {scripts.length > 4 ? ` and ${scripts.length - 4} more` : ""}. Left as it is, it will
          read as a form letter to all of them.
        </p>
      ))}

      <div className={s.draftFoot}>
        <span>
          {missing.length
            ? `${missing.length} hole${missing.length === 1 ? "" : "s"} still open: ${missing
                .map((slot) => slot.hint)
                .join("; ")}`
            : "Ready."}
        </span>
        <button
          type="button"
          className={s.btn}
          style={{ marginLeft: "auto" }}
          disabled={missing.length > 0}
          onClick={onInsert}
        >
          Put it in <kbd style={{ font: "inherit", fontSize: 10, opacity: 0.7 }}>⌘↵</kbd>
        </button>
      </div>
    </div>
  );
}

function ComparePane({
  doc,
  thisId,
  anchorId,
  thisTotal,
  thisComplete,
  onVerdict,
}: {
  doc: Doc;
  thisId: number;
  anchorId: number;
  thisTotal: number;
  thisComplete: boolean;
  onVerdict: (verdict: "this" | "anchor") => void;
}) {
  const left = SCRIPT_BY_ID.get(thisId);
  const right = SCRIPT_BY_ID.get(anchorId);
  const anchorJudgement = judgementOf(doc, anchorId);
  const anchorTotal = totalOf(standingMarks(anchorJudgement));
  if (!left || !right) return null;

  const columns: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 0,
  };

  return (
    <div>
      <div style={columns}>
        {[
          { script: left, label: `This one · ${thisComplete ? thisTotal : "unmarked"}`, own: true },
          { script: right, label: `Script ${scriptNo(anchorId)} · ${anchorTotal}`, own: false },
        ].map((column) => (
          <div
            key={column.script.id}
            style={{
              borderRight: column.own ? "1px solid var(--rule)" : undefined,
              padding: "10px 18px 24px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: column.own ? "var(--red)" : "var(--ink-3)",
                borderBottom: "1px solid var(--rule-soft)",
                paddingBottom: 5,
                marginBottom: 9,
              }}
            >
              {column.label}
            </div>
            {column.script.paragraphs.map((paragraph, index) => (
              <p key={index} className={s.para} style={{ fontSize: 14.5, lineHeight: 1.55 }}>
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div
        className={s.sheetFoot}
        style={{ position: "sticky", bottom: 0, borderTop: "1px solid var(--rule)" }}
      >
        <span>Set them beside each other and answer the easier question:</span>
        <button type="button" className={s.btnGhost} onClick={() => onVerdict("this")}>
          This one is stronger
        </button>
        <button type="button" className={s.btnGhost} onClick={() => onVerdict("anchor")}>
          Script {scriptNo(anchorId)} is stronger
        </button>
      </div>
    </div>
  );
}

function ConflictDialog({
  doc,
  thisId,
  thisTotal,
  conflict,
  onClose,
  onReopenAnchor,
}: {
  doc: Doc;
  thisId: number;
  thisTotal: number;
  conflict: { anchorId: number; verdict: "this" | "anchor" };
  onClose: () => void;
  onReopenAnchor: () => void;
}) {
  const anchorTotal = totalOf(standingMarks(judgementOf(doc, conflict.anchorId)));
  const contradicts =
    (conflict.verdict === "this" && thisTotal < anchorTotal) ||
    (conflict.verdict === "anchor" && thisTotal > anchorTotal);

  return (
    <div className={s.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.dialog} role="dialog" aria-modal="true" aria-label="Comparison">
        <h2 className={s.dialogTitle}>
          {contradicts ? "That does not match the marks." : "The marks agree with you."}
        </h2>
        <div className={s.dialogBody}>
          <p>
            You have this script at <b>{thisTotal}</b> and script {scriptNo(conflict.anchorId)} at{" "}
            <b>{anchorTotal}</b>, and you have just said{" "}
            {conflict.verdict === "this"
              ? "this one is stronger"
              : `script ${scriptNo(conflict.anchorId)} is stronger`}
            .
          </p>
          {contradicts ? (
            <p>
              Nothing has been changed and nothing will be. Which of the two marks is wrong is a
              judgement, and it is yours — the tool can only tell you that they cannot both be
              right.
            </p>
          ) : (
            <p>
              Rank order holds. Worth nothing on its own, but a hundred of these is what you
              take to moderation.
            </p>
          )}
        </div>
        <div className={s.dialogRow}>
          <button type="button" className={s.btnGhost} onClick={onClose}>
            Leave both as they are
          </button>
          {contradicts ? (
            <>
              <button type="button" className={s.btnGhost} onClick={onReopenAnchor}>
                Reopen script {scriptNo(conflict.anchorId)}
              </button>
              <button type="button" className={s.btn} onClick={onClose}>
                Adjust this one
              </button>
            </>
          ) : null}
        </div>
        <p className={s.caveat} style={{ marginTop: 14 }}>
          Recorded either way: script {scriptNo(thisId)} was read beside script{" "}
          {scriptNo(conflict.anchorId)}, and this is on both moderation records.
        </p>
      </div>
    </div>
  );
}

function RevealDialog({
  judgement,
  onClose,
  onResolve,
}: {
  judgement: Judgement;
  onClose: () => void;
  onResolve: (kept: "first" | "second", note: string) => void;
}) {
  const [note, setNote] = useState("");
  const first = judgement.marks;
  const second = judgement.reread?.marks ?? {};
  const firstTotal = totalOf(first);
  const secondTotal = totalOf(second);
  const gap = secondTotal - firstTotal;

  return (
    <div className={s.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.dialog} role="dialog" aria-modal="true" aria-label="Both readings">
        <h2 className={s.dialogTitle}>
          {gap === 0
            ? "Both readings agree."
            : `${gap > 0 ? "Harder" : "Softer"} the first time, by ${Math.abs(gap)}.`}
        </h2>
        <div className={s.dialogBody}>
          <div className={s.revealGrid}>
            <span />
            <i>first</i>
            <i>second</i>
            <span />
            {STRANDS.map((strand) => {
              const a = first[strand.id];
              const b = second[strand.id];
              const differs = typeof a === "number" && typeof b === "number" && a !== b;
              return (
                <div key={strand.id} style={{ display: "contents" }}>
                  <span>{strand.name}</span>
                  <span style={{ textAlign: "center", color: "var(--red)", fontWeight: 600 }}>
                    {a ?? "—"}
                  </span>
                  <span style={{ textAlign: "center", color: "var(--green)", fontWeight: 600 }}>
                    {b ?? "—"}
                  </span>
                  <span className={differs ? s.revealDiff : undefined}>
                    {differs ? `${(b ?? 0) > (a ?? 0) ? "+" : ""}${(b ?? 0) - (a ?? 0)}` : ""}
                  </span>
                </div>
              );
            })}
            <span style={{ fontWeight: 600, borderTop: "1px solid var(--rule)", paddingTop: 4 }}>
              Total
            </span>
            <span
              style={{
                textAlign: "center",
                fontWeight: 600,
                color: "var(--red)",
                borderTop: "1px solid var(--rule)",
                paddingTop: 4,
              }}
            >
              {firstTotal}
            </span>
            <span
              style={{
                textAlign: "center",
                fontWeight: 600,
                color: "var(--green)",
                borderTop: "1px solid var(--rule)",
                paddingTop: 4,
              }}
            >
              {secondTotal}
            </span>
            <span
              className={Math.abs(gap) >= 3 ? s.revealDiff : undefined}
              style={{ borderTop: "1px solid var(--rule)", paddingTop: 4 }}
            >
              {gap > 0 ? `+${gap}` : gap}
            </span>
          </div>

          <p style={{ marginTop: 14 }}>
            Both readings are kept. Choose which one stands, and say why in a line — that line
            is what makes this defensible to a colleague in March.
          </p>
          <label className={s.fieldLabel} htmlFor="resolve-note">
            Why
          </label>
          <textarea
            id="resolve-note"
            className={s.field}
            rows={2}
            value={note}
            placeholder={
              gap === 0
                ? "Agreed on a second reading — no change."
                : "e.g. the second reading is right; I was tired and under-credited Method."
            }
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <div className={s.dialogRow}>
          <button type="button" className={s.btnGhost} onClick={onClose}>
            Not yet
          </button>
          <button
            type="button"
            className={s.btnGhost}
            onClick={() => onResolve("first", note.trim() || "First mark stands.")}
          >
            First mark stands
          </button>
          <button
            type="button"
            className={s.btn}
            onClick={() => onResolve("second", note.trim() || "Second reading stands.")}
          >
            Second reading stands
          </button>
        </div>
      </div>
    </div>
  );
}
