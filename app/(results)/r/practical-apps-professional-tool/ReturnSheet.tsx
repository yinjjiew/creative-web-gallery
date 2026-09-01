"use client";

import { scriptNo } from "./format";
import s from "./marking.module.css";
import { ASSIGNMENT, MAX_PER_STRAND, MAX_TOTAL, STRANDS, bandFor } from "./rubric";
import { STEM_BY_ID, parseTemplate } from "./stems";
import { isComplete, totalOf, type Judgement } from "./state";

/**
 * What the student actually gets.
 *
 * The brief is blunt about the reader: fifteen years old, will look at the
 * number, and needs a reason to read anything else. So the sheet is ordered
 * against that instinct. The first thing on it is a sentence of their own
 * writing with her reason for liking it — the only part of the feedback that
 * could not have been written about anybody else's essay. Then the one thing to
 * do next. The marks are third, small, and set as bars because a bar shows
 * where the effort should go and a number does not.
 *
 * Nothing here is generated. Every word that is not a heading was either typed
 * by her or lifted out of the student's essay.
 */

function renderText(stemId: string, values: Record<string, string>): React.ReactNode {
  const stem = STEM_BY_ID[stemId];
  if (!stem) return null;
  return parseTemplate(stem.template).map((part, index) => {
    if ("text" in part) return <span key={index}>{part.text}</span>;
    const slot = stem.slots.find((candidate) => candidate.id === part.slot);
    const value = values[part.slot] ?? "";
    if (slot?.kind === "quote") {
      return <q key={index}>{value}</q>;
    }
    return <span key={index}>{value}</span>;
  });
}

export default function ReturnSheet({
  judgement,
  candidate,
  preview,
}: {
  judgement: Judgement;
  candidate: string;
  preview: boolean;
}) {
  const marks = judgement.resolution?.kept === "second" && judgement.reread
    ? judgement.reread.marks
    : judgement.marks;
  const total = totalOf(marks);
  const complete = isComplete(marks);
  const band = bandFor(total);

  const lead = judgement.comments.find((comment) => comment.stemId === "strongest");
  const rest = judgement.comments.filter((comment) => comment !== lead);

  return (
    <div className={s.returnSheet}>
      <div className={s.returnTop}>
        <span>
          {ASSIGNMENT.cohort} · <span style={{ fontStyle: "italic" }}>{ASSIGNMENT.text}</span> ·{" "}
          {ASSIGNMENT.shortQuestion}
        </span>
        <span>Candidate {candidate}</span>
      </div>

      {lead ? (
        <>
          <p className={s.returnLead}>
            The best thing you do is here — <q>{lead.values.quote}</q>
          </p>
          <p className={s.returnWhy}>It works because {lead.values.why}.</p>
        </>
      ) : (
        <p className={s.returnWhy} style={{ marginBottom: 26 }}>
          {preview
            ? "Nothing leads this sheet yet. The strongest-moment comment is what a student reads first — without it they start at the number."
            : "No leading comment was written for this script."}
        </p>
      )}

      {judgement.nextStep ? (
        <div className={s.returnNext}>
          <div className={s.returnNextLabel}>One thing for the next essay</div>
          <div className={s.returnNextBody}>{judgement.nextStep}</div>
        </div>
      ) : preview ? (
        <div className={s.returnNext} style={{ borderStyle: "dashed", opacity: 0.7 }}>
          <div className={s.returnNextLabel}>One thing for the next essay</div>
          <div className={s.returnNextBody} style={{ fontStyle: "italic", fontSize: 13 }}>
            Not written yet.
          </div>
        </div>
      ) : null}

      <div className={s.returnMarks}>
        {STRANDS.map((strand) => {
          const mark = marks[strand.id];
          return (
            <div key={strand.id} className={s.returnMarkRow}>
              <div>
                <span style={{ fontWeight: 500 }}>{strand.name}</span>
                <span style={{ color: "var(--ink-3)", fontSize: 11.5, marginLeft: 8 }}>
                  {typeof mark === "number" ? strand.descriptors[mark] : "not marked"}
                </span>
              </div>
              <div className={s.returnBarWrap}>
                <span className={s.returnBar} aria-hidden="true">
                  <span
                    className={s.returnBarFill}
                    style={{ width: `${((mark ?? 0) / MAX_PER_STRAND) * 100}%` }}
                  />
                </span>
                <span style={{ minWidth: 26, textAlign: "right" }}>
                  {typeof mark === "number" ? `${mark}/6` : "—"}
                </span>
              </div>
            </div>
          );
        })}
        <div className={s.returnTotal}>
          <b>
            {total}/{MAX_TOTAL}
          </b>
          <span>
            {complete ? `Departmental band ${band.label} — ${band.note.toLowerCase()}` : "incomplete"}
          </span>
        </div>
      </div>

      {rest.length ? (
        <div className={s.returnRest}>
          {rest.map((comment) => (
            <p key={comment.id} className={s.returnRestItem}>
              {renderText(comment.stemId, comment.values)}
            </p>
          ))}
        </div>
      ) : null}

      <div className={s.returnFoot}>
        Marked by hand against the department&rsquo;s five-strand rubric, which is printed in
        the front of your book. The band is ours, not an exam grade. If you think a mark is
        wrong, say so — bring the essay and the strand you disagree with.
        {preview ? (
          <>
            {" "}
            <span style={{ color: "var(--ink-4)" }}>
              (Preview. This is the sheet {candidate} would be handed.)
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
