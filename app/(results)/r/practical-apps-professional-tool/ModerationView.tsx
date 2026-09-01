"use client";

import { useMemo, useState } from "react";

import { fmtDuration, fmtWhen, scriptNo } from "./format";
import s from "./marking.module.css";
import { ASSIGNMENT, MAX_TOTAL, STRANDS, bandFor } from "./rubric";
import { STEMS } from "./stems";
import {
  committedList,
  sittingOf,
  standingMarks,
  totalOf,
  type Action,
  type Doc,
  type Judgement,
} from "./state";

type Filter = "all" | "flagged" | "split" | "revised";

type Props = {
  doc: Doc;
  run: (action: Action, toast?: string, undoable?: boolean) => void;
  openScript: (scriptId: number, mode?: "review" | "reread") => void;
  exportJson: () => void;
};

function fillStem(template: string, values: Record<string, string>) {
  return template.replace(/\{([a-z0-9]+)\}/gi, (_, id: string) => values[id] ?? "…");
}

function isSplit(judgement: Judgement) {
  if (!judgement.reread) return false;
  return Math.abs(totalOf(judgement.reread.marks) - totalOf(judgement.marks)) >= 2;
}

export default function ModerationView({ doc, run, openScript, exportJson }: Props) {
  const done = useMemo(() => committedList(doc), [doc]);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<number | null>(done[0]?.scriptId ?? null);

  const rows = useMemo(() => {
    return done.filter((judgement) => {
      if (filter === "flagged") return judgement.flagged;
      if (filter === "split") return isSplit(judgement);
      if (filter === "revised") return judgement.revisions.length > 0;
      return true;
    });
  }, [done, filter]);

  const current = rows.find((judgement) => judgement.scriptId === openId) ?? rows[0] ?? null;

  return (
    <div className={s.moderation}>
      <div className={s.modList}>
        <div className={s.modFilters}>
          <div className={s.sectionLabel}>
            The record <span>{done.length} filed</span>
          </div>
          <div className={s.filterRow}>
            {(
              [
                ["all", "All"],
                ["flagged", "Flagged"],
                ["split", "Split"],
                ["revised", "Revised"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${s.filterBtn} ${filter === id ? s.filterOn : ""}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className={s.emptyNote} style={{ padding: "16px 12px" }}>
            Nothing in this cut. Mark and flag from the desk; this page only reconstructs what
            you already decided.
          </p>
        ) : (
          rows.map((judgement) => {
            const total = totalOf(standingMarks(judgement));
            return (
              <button
                key={judgement.scriptId}
                type="button"
                className={`${s.modItem} ${current?.scriptId === judgement.scriptId ? s.modItemOn : ""}`}
                onClick={() => setOpenId(judgement.scriptId)}
              >
                <span className={s.modNo}>{scriptNo(judgement.scriptId)}</span>
                <span>
                  {judgement.flagged ? <span className={`${s.modTag} ${s.tagFlag}`}>flag</span> : null}{" "}
                  {isSplit(judgement) ? <span className={`${s.modTag} ${s.tagSplit}`}>split</span> : null}
                </span>
                <span className={s.modTotal}>
                  {total}/{MAX_TOTAL}
                </span>
                <span className={s.modWhen}>
                  {judgement.committedAt ? fmtWhen(judgement.committedAt) : "uncommitted"}
                  {judgement.secondsSpent
                    ? ` · ${fmtDuration(judgement.secondsSpent)}`
                    : ""}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className={s.modSheet}>
        {current ? (
          <Record
            judgement={current}
            doc={doc}
            openScript={openScript}
            exportJson={exportJson}
            toggleFlag={() =>
              run({ type: "toggle-flag", scriptId: current.scriptId }, undefined, true)
            }
          />
        ) : (
          <div className={s.modInner}>
            <h1 className={s.viewTitle}>Moderation record</h1>
            <p className={s.viewLede}>
              This is the reconstruction a colleague can sit down with. It is built only from
              decisions already on the scripts — marks, clips, filled stems, second readings.
              Nothing here generates a mark.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Record({
  judgement,
  doc,
  openScript,
  exportJson,
  toggleFlag,
}: {
  judgement: Judgement;
  doc: Doc;
  openScript: (scriptId: number, mode?: "review" | "reread") => void;
  exportJson: () => void;
  toggleFlag: () => void;
}) {
  const marks = standingMarks(judgement);
  const total = totalOf(marks);
  const band = bandFor(total);
  const sitting = sittingOf(doc, judgement.sittingId);
  const firstTotal = totalOf(judgement.marks);
  const secondTotal = judgement.reread ? totalOf(judgement.reread.marks) : null;

  return (
    <div className={s.modInner}>
      <div className={s.recordHead}>
        <div>
          <div className={s.setIdTop}>{ASSIGNMENT.cohort} · {ASSIGNMENT.text}</div>
          <div className={s.recordNo}>Script {scriptNo(judgement.scriptId)}</div>
        </div>
        <div className={s.recordTotal}>
          <div className={s.recordTotalNum}>
            {total}/{MAX_TOTAL}
          </div>
          <div>Band {band.label} · {band.note}</div>
        </div>
      </div>

      <p className={s.blockNote}>
        {ASSIGNMENT.question} This page is the reconstruction, not the marking. Open the
        script if you need to change a decision.
      </p>

      <div className={s.recordGrid}>
        {STRANDS.map((strand) => {
          const value = marks[strand.id];
          return (
            <div key={strand.id} style={{ display: "contents" }}>
              <span className={s.recordStrand}>{strand.name}</span>
              <span className={s.recordMark}>{value ?? "—"}</span>
              <span className={s.recordDesc}>
                {value === undefined ? strand.gloss : strand.descriptors[value]}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className={s.recordSub}>When and how</h2>
      <div className={s.meta}>
        <div className={s.metaItem}>
          <b>Filed</b>
          {judgement.committedAt ? fmtWhen(judgement.committedAt) : "Not yet committed"}
        </div>
        <div className={s.metaItem}>
          <b>Time on this script</b>
          {fmtDuration(judgement.secondsSpent)}
        </div>
        <div className={s.metaItem}>
          <b>Sitting</b>
          {sitting ? fmtWhen(sitting.startedAt) : "—"}
        </div>
        <div className={s.metaItem}>
          <b>Shown against</b>
          {judgement.anchors.length
            ? judgement.anchors.map((id) => scriptNo(id)).join(", ")
            : "no anchors"}
        </div>
      </div>

      {judgement.reread ? (
        <>
          <h2 className={s.recordSub}>Second reading</h2>
          <p className={s.blockNote}>
            First mark {firstTotal}/{MAX_TOTAL}. Blind second {secondTotal}/{MAX_TOTAL}.
            {judgement.resolution
              ? ` She kept the ${judgement.resolution.kept} reading${
                  judgement.resolution.note ? ` — ${judgement.resolution.note}` : "."
                }`
              : " Not yet resolved."}
          </p>
        </>
      ) : null}

      {judgement.revisions.length ? (
        <>
          <h2 className={s.recordSub}>Revisions</h2>
          {judgement.revisions.map((revision, index) => (
            <p key={`${revision.at}-${index}`} className={s.blockNote}>
              {revision.kind} · {fmtWhen(revision.at)} · {revision.note || "no note"} ·{" "}
              {totalOf(revision.from)} → {totalOf(revision.to)}
            </p>
          ))}
        </>
      ) : null}

      <h2 className={s.recordSub}>Comments as filed</h2>
      {judgement.comments.length === 0 ? (
        <p className={s.blockNote}>No comments were attached to this script.</p>
      ) : (
        judgement.comments.map((comment) => {
          const stem = STEMS.find((entry) => entry.id === comment.stemId);
          const text = stem ? fillStem(stem.template, comment.values) : Object.values(comment.values).join(" ");
          return (
            <div key={comment.id} className={s.commentOut}>
              {text}
            </div>
          );
        })
      )}

      {judgement.clips.length ? (
        <>
          <h2 className={s.recordSub}>Evidence clipped from the script</h2>
          {judgement.clips.map((clip) => (
            <blockquote key={clip.id} className={s.evidence}>
              {clip.text}
            </blockquote>
          ))}
        </>
      ) : null}

      {judgement.nextStep ? (
        <>
          <h2 className={s.recordSub}>What to do next</h2>
          <p className={s.blockNote}>{judgement.nextStep}</p>
        </>
      ) : null}

      <div className={s.filterRow} style={{ marginTop: 28 }}>
        <button type="button" className={s.filterBtn} onClick={() => openScript(judgement.scriptId, "review")}>
          Open on the desk
        </button>
        <button type="button" className={s.filterBtn} onClick={toggleFlag}>
          {judgement.flagged ? "Clear flag" : "Flag for the sample"}
        </button>
        <button type="button" className={s.filterBtn} onClick={exportJson}>
          Export the set
        </button>
      </div>
    </div>
  );
}
