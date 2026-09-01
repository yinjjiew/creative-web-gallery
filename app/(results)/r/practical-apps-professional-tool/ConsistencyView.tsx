"use client";

import { useMemo } from "react";

import { fmtDay, fmtSigned, fmtTime, fmtWeekday, scriptNo } from "./format";
import s from "./marking.module.css";
import { MAX_TOTAL, STRANDS } from "./rubric";
import {
  committedList,
  disagreement,
  judgementOf,
  markingSequence,
  mean,
  standingMarks,
  totalOf,
  type Action,
  type Doc,
  type Judgement,
} from "./state";

type Props = {
  doc: Doc;
  run: (action: Action, toast?: string, undoable?: boolean) => void;
  openScript: (scriptId: number, mode?: "review" | "reread") => void;
};

/** Population standard deviation. Descriptive only — nothing is inferred. */
function sd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length);
}

export default function ConsistencyView({ doc, run, openScript }: Props) {
  const done = useMemo(() => committedList(doc), [doc]);
  const sequence = useMemo(() => markingSequence(doc), [doc]);
  const totals = useMemo(() => done.map((j) => totalOf(standingMarks(j))), [done]);
  const overall = mean(totals);
  const spread = sd(totals);

  const bySitting = useMemo(() => {
    return doc.sittings
      .map((sitting) => {
        const members = done.filter((judgement) => judgement.sittingId === sitting.id);
        const memberTotals = members.map((judgement) => totalOf(standingMarks(judgement)));
        return {
          sitting,
          members,
          totals: memberTotals,
          mean: mean(memberTotals),
          /** Roughly how far chance alone moves a mean of this many scripts. */
          noise: memberTotals.length ? spread / Math.sqrt(memberTotals.length) : 0,
        };
      })
      .filter((row) => row.members.length > 0)
      .sort((a, b) => a.sitting.startedAt - b.sitting.startedAt);
  }, [doc.sittings, done, spread]);

  const orderSplit = useMemo(() => {
    if (done.length < 12) return null;
    const third = Math.floor(done.length / 3);
    const early = done.slice(0, third).map((j) => totalOf(standingMarks(j)));
    const late = done.slice(-third).map((j) => totalOf(standingMarks(j)));
    return { early: mean(early), late: mean(late), n: third };
  }, [done]);

  const distribution = useMemo(() => {
    const columns: Judgement[][] = Array.from({ length: MAX_TOTAL + 1 }, () => []);
    for (const judgement of done) {
      const total = totalOf(standingMarks(judgement));
      columns[Math.max(0, Math.min(MAX_TOTAL, total))].push(judgement);
    }
    return columns;
  }, [done]);

  const tallest = Math.max(1, ...distribution.map((column) => column.length));

  const rereads = useMemo(
    () => done.filter((judgement) => judgement.reread !== null),
    [done]
  );

  const rereadStats = useMemo(() => {
    const resolved = rereads.filter((judgement) => judgement.resolution !== null);
    if (!resolved.length) return null;
    const gaps = resolved.map(
      (judgement) => totalOf(judgement.reread?.marks ?? {}) - totalOf(judgement.marks)
    );
    const exact = resolved.filter(
      (judgement) => disagreement(judgement.marks, judgement.reread?.marks ?? {}).worst === 0
    ).length;
    const within1 = resolved.filter(
      (judgement) => disagreement(judgement.marks, judgement.reread?.marks ?? {}).worst <= 1
    ).length;
    return {
      n: resolved.length,
      exact,
      within1,
      meanGap: mean(gaps) ?? 0,
      changed: resolved.filter((judgement) => judgement.resolution?.kept === "second").length,
    };
  }, [rereads]);

  /**
   * How the sample is drawn, stated because a sample she cannot explain is
   * worthless at moderation: the first scripts she marked, the sitting furthest
   * from her own average, and an even sweep of the mark range.
   */
  function drawSample() {
    const chosen: number[] = [];
    const add = (id: number) => {
      if (!chosen.includes(id) && !doc.rereadQueue.includes(id)) chosen.push(id);
    };

    for (const judgement of done.slice(0, 16).filter((_, i) => i % 4 === 0)) {
      add(judgement.scriptId);
    }

    if (overall !== null) {
      const outlier = [...bySitting]
        .filter((row) => row.mean !== null)
        .sort(
          (a, b) => Math.abs((b.mean ?? 0) - overall) - Math.abs((a.mean ?? 0) - overall)
        )[0];
      if (outlier) {
        outlier.members
          .filter((_, index) => index % Math.max(1, Math.floor(outlier.members.length / 4)) === 0)
          .slice(0, 4)
          .forEach((judgement) => add(judgement.scriptId));
      }
    }

    const ranked = [...done].sort(
      (a, b) => totalOf(standingMarks(a)) - totalOf(standingMarks(b))
    );
    for (let i = 0; i < 4; i += 1) {
      const at = Math.floor(((i + 0.5) / 4) * ranked.length);
      if (ranked[at]) add(ranked[at].scriptId);
    }

    run(
      { type: "set-reread-queue", ids: [...doc.rereadQueue, ...chosen] },
      `${chosen.length} scripts drawn for a blind second reading.`
    );
  }

  return (
    <div className={s.scrollView}>
      <div className={s.viewInner}>
        <h1 className={s.viewTitle}>Consistency</h1>
        <p className={s.viewLede}>
          Not a report on the students. A report on the marking — on whether the twenty-second
          script and the ninety-first were held to the same standard, and on whether Thursday
          at ten past ten agrees with Sunday at half nine. Everything below is arithmetic over
          your own decisions. None of it changes a mark.
        </p>

        {/* ---------------------------------------------------- distribution */}
        <section className={s.block}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>The set so far</h2>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
              {done.length} marked · mean {overall !== null ? overall.toFixed(1) : "—"} ·
              spread ±{spread.toFixed(1)}
            </span>
          </div>
          <p className={s.blockNote}>
            Every mark you have given, stacked. One block is one script; click it to read it
            again. What you are looking for is not a nice shape but a block in the wrong
            column — a script you would not now defend at that mark.
          </p>
          <div className={s.dist} style={{ minHeight: Math.min(150, tallest * 10 + 14) }}>
            {distribution.map((column, total) => (
              <div key={total} className={s.distCol}>
                {column.map((judgement) => {
                  const split =
                    judgement.reread &&
                    disagreement(judgement.marks, judgement.reread.marks).worst >= 2;
                  return (
                    <button
                      key={judgement.scriptId}
                      type="button"
                      className={[
                        s.distDot,
                        judgement.flagged ? s.distDotFlag : "",
                        split ? s.distDotSplit : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      title={`Script ${scriptNo(judgement.scriptId)} — ${total}/${MAX_TOTAL}`}
                      aria-label={`Script ${scriptNo(judgement.scriptId)}, ${total} out of ${MAX_TOTAL}. Open it.`}
                      onClick={() => openScript(judgement.scriptId, "review")}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className={s.distAxis} aria-hidden="true">
            {distribution.map((_, total) => (
              <span
                key={total}
                className={total % 5 === 0 ? `${s.distTick} ${s.distTickMajor}` : s.distTick}
              >
                {total % 5 === 0 ? total : "·"}
              </span>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- sittings */}
        <section className={s.block}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>By sitting</h2>
          </div>
          <p className={s.blockNote}>
            The queue was shuffled before you started, so the scripts in each sitting are a
            random draw from the same set. That is what makes this comparison worth anything: a
            gap between two sittings is more likely to be you than them.
          </p>
          <table className={s.sitTable}>
            <thead>
              <tr>
                <th>Sitting</th>
                <th className={s.numCell}>n</th>
                <th className={s.numCell}>mean</th>
                <th className={s.numCell}>vs. you</th>
                <th style={{ width: "40%" }}>0 to {MAX_TOTAL}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bySitting.map((row) => {
                const gap = row.mean !== null && overall !== null ? row.mean - overall : 0;
                const notable = Math.abs(gap) > row.noise * 1.5 && Math.abs(gap) > 0.8;
                return (
                  <tr key={row.sitting.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {fmtWeekday(row.sitting.startedAt)}, {fmtTime(row.sitting.startedAt)}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
                        {fmtDay(row.sitting.startedAt)}
                        {row.sitting.sample ? " · sample" : " · this session"}
                      </div>
                    </td>
                    <td className={s.numCell}>{row.members.length}</td>
                    <td className={s.numCell}>{row.mean?.toFixed(1) ?? "—"}</td>
                    <td className={`${s.numCell} ${notable ? s.sitLow : ""}`}>
                      {fmtSigned(gap)}
                      <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>
                        {" "}
                        ±{row.noise.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <div className={s.strip}>
                        {row.totals.map((total, index) => (
                          <span
                            key={index}
                            className={s.stripTick}
                            style={{ left: `${(total / MAX_TOTAL) * 100}%` }}
                          />
                        ))}
                        {row.mean !== null ? (
                          <span
                            className={s.stripMean}
                            style={{ left: `${(row.mean / MAX_TOTAL) * 100}%` }}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={s.rowBtn}
                        onClick={() =>
                          run(
                            {
                              type: "set-reread-queue",
                              ids: [
                                ...doc.rereadQueue,
                                ...row.members
                                  .filter((m) => !doc.rereadQueue.includes(m.scriptId))
                                  .map((m) => m.scriptId),
                              ],
                            },
                            `${row.members.length} scripts from that sitting queued for a second reading.`
                          )
                        }
                      >
                        Re-read this sitting
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className={s.caveat}>
            The ± is the amount chance alone moves a mean of that many scripts, given the spread
            of the whole set. A gap smaller than it means nothing. A gap much larger than it is
            worth a second reading — which is a reason to look again, not a reason to move
            marks. Nothing here is adjusted, ever: a mark you did not make is not your mark, and
            it would be indefensible at moderation.
          </p>
        </section>

        {/* ----------------------------------------------------------- order */}
        {orderSplit && overall !== null ? (
          <section className={s.block}>
            <div className={s.blockHead}>
              <h2 className={s.blockTitle}>Early against late</h2>
            </div>
            <p className={s.blockNote}>
              Total mark against the order you marked in. You calibrate as you go; this is where
              that shows.
            </p>
            <div className={s.scatter}>
              <span
                className={s.scatterBand}
                style={{ left: 0, width: `${(orderSplit.n / done.length) * 100}%` }}
              />
              <span
                className={s.scatterBand}
                style={{
                  right: 0,
                  width: `${(orderSplit.n / done.length) * 100}%`,
                }}
              />
              {done.map((judgement) => {
                const place = sequence.get(judgement.scriptId) ?? 1;
                const total = totalOf(standingMarks(judgement));
                return (
                  <span
                    key={judgement.scriptId}
                    className={s.scatterDot}
                    style={{
                      left: `${((place - 0.5) / done.length) * 100}%`,
                      top: `${(1 - total / MAX_TOTAL) * 100}%`,
                    }}
                  />
                );
              })}
              {orderSplit.early !== null ? (
                <span
                  className={s.scatterMean}
                  style={{
                    left: 0,
                    width: `${(orderSplit.n / done.length) * 100}%`,
                    top: `${(1 - orderSplit.early / MAX_TOTAL) * 100}%`,
                  }}
                />
              ) : null}
              {orderSplit.late !== null ? (
                <span
                  className={s.scatterMean}
                  style={{
                    right: 0,
                    width: `${(orderSplit.n / done.length) * 100}%`,
                    top: `${(1 - orderSplit.late / MAX_TOTAL) * 100}%`,
                  }}
                />
              ) : null}
            </div>
            <div className={s.axisNote}>
              <span>
                first {orderSplit.n} marked — mean {orderSplit.early?.toFixed(1)}
              </span>
              <span>order you marked in →</span>
              <span>
                last {orderSplit.n} — mean {orderSplit.late?.toFixed(1)}
              </span>
            </div>
            <p className={s.caveat}>
              {orderSplit.early !== null && orderSplit.late !== null
                ? Math.abs(orderSplit.late - orderSplit.early) < 0.9
                  ? "Difference of less than a mark between the two ends. Within the noise for a set this size."
                  : `The last ${orderSplit.n} run ${Math.abs(orderSplit.late - orderSplit.early).toFixed(1)} ${orderSplit.late > orderSplit.early ? "above" : "below"} the first ${orderSplit.n}. The scripts were shuffled, so the essays are not the reason. The remedy is to re-read some of the early ones blind, not to move anything.`
                : ""}
            </p>
          </section>
        ) : null}

        {/* -------------------------------------------------- second reading */}
        <section className={s.block}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>Second reading</h2>
            {doc.rereadQueue.length ? (
              <button
                type="button"
                className={s.btn}
                onClick={() => openScript(doc.rereadQueue[0], "reread")}
              >
                Read script {scriptNo(doc.rereadQueue[0])} blind
              </button>
            ) : (
              <button type="button" className={s.btn} onClick={drawSample} disabled={done.length < 8}>
                Draw a sample
              </button>
            )}
          </div>
          <p className={s.blockNote}>
            The only honest test of whether you are marking consistently is to mark something
            twice without knowing what you gave it the first time. The sample is drawn from
            three places, and you can say so to a colleague: a quarter of your earliest
            scripts, four from whichever sitting sits furthest from your own average, and four
            spread evenly across the range. Both marks are kept. You decide which stands.
          </p>

          {doc.rereadQueue.length ? (
            <p className={s.blockNote} style={{ color: "var(--green)" }}>
              {doc.rereadQueue.length} waiting:{" "}
              {doc.rereadQueue.map(scriptNo).join(", ")}
            </p>
          ) : null}

          {rereadStats ? (
            <p className={s.blockNote}>
              <b>{rereadStats.n}</b> second readings resolved. {rereadStats.exact} matched
              exactly, {rereadStats.within1} were within one mark on every strand. Your second
              readings ran {fmtSigned(rereadStats.meanGap)} against your first on average, and
              you changed {rereadStats.changed} of them.
            </p>
          ) : null}

          <div className={s.rrGrid}>
            {rereads.map((judgement) => {
              const gap = disagreement(judgement.marks, judgement.reread?.marks ?? {});
              const secondTotal = totalOf(judgement.reread?.marks ?? {});
              return (
                <div
                  key={judgement.scriptId}
                  className={judgement.resolution ? s.rrCard : `${s.rrCard} ${s.rrCardOpen}`}
                >
                  <div className={s.rrTop}>
                    <b>{scriptNo(judgement.scriptId)}</b>
                    <span>{judgement.resolution ? "resolved" : "awaiting your call"}</span>
                  </div>
                  <div className={s.rrPair}>
                    <span className={s.rrFirst}>{totalOf(judgement.marks)}</span>
                    <span style={{ color: "var(--ink-4)" }}>→</span>
                    <span className={s.rrSecond}>{secondTotal}</span>
                    <span className={gap.worst >= 2 ? `${s.rrDelta} ${s.rrDeltaBig}` : s.rrDelta}>
                      worst strand {gap.worst}
                    </span>
                  </div>
                  {judgement.resolution ? (
                    <div className={s.rrKept}>
                      {judgement.resolution.kept === "second" ? "Second" : "First"} stands —{" "}
                      {judgement.resolution.note}
                    </div>
                  ) : (
                    <div className={s.rrKept}>
                      <button
                        type="button"
                        className={s.rowBtn}
                        onClick={() => openScript(judgement.scriptId, "reread")}
                      >
                        Finish it
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!rereads.length && !doc.rereadQueue.length ? (
            <p className={s.emptyNote} style={{ marginTop: 12 }}>
              No second readings yet. Ninety seconds each, and it is the only part of this that
              a moderator will take at face value.
            </p>
          ) : null}
        </section>

        {/* ----------------------------------------------------- strand drift */}
        <section className={s.block}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>Which strand is moving</h2>
          </div>
          <p className={s.blockNote}>
            A whole-total drift usually hides in one or two strands. Mean per strand, by
            sitting, out of six.
          </p>
          <table className={s.sitTable}>
            <thead>
              <tr>
                <th>Sitting</th>
                {STRANDS.map((strand) => (
                  <th key={strand.id} className={s.numCell}>
                    {strand.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bySitting.map((row) => (
                <tr key={row.sitting.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {fmtWeekday(row.sitting.startedAt).slice(0, 3)} {fmtTime(row.sitting.startedAt)}
                  </td>
                  {STRANDS.map((strand) => {
                    const values = row.members
                      .map((judgement) => standingMarks(judgement)[strand.id])
                      .filter((value): value is number => typeof value === "number");
                    const m = mean(values);
                    const all = done
                      .map((judgement) => standingMarks(judgement)[strand.id])
                      .filter((value): value is number => typeof value === "number");
                    const base = mean(all);
                    const off = m !== null && base !== null ? m - base : 0;
                    return (
                      <td key={strand.id} className={s.numCell}>
                        <span style={{ fontWeight: 500 }}>{m?.toFixed(1) ?? "—"}</span>
                        <span
                          style={{
                            color: Math.abs(off) >= 0.6 ? "var(--amber)" : "var(--ink-4)",
                            marginLeft: 5,
                            fontSize: 10.5,
                          }}
                        >
                          {fmtSigned(off)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className={s.caveat} style={{ marginTop: 26 }}>
          Sample data. Fifty-nine of these judgements were laid down by a generator so that
          these views have a set to work on, and the generator was written to include drift —
          the late Thursday sitting really was made harsher on purpose. They are not
          measurements of a real teacher, and no claim is made here about how much real markers
          drift. Everything you mark yourself is treated identically to them, and{" "}
          <button
            type="button"
            className={s.statusBtn}
            onClick={() =>
              run({ type: "set-reread-queue", ids: [] }, "Second-reading queue emptied.")
            }
          >
            the queue can be emptied
          </button>{" "}
          at any point.
        </p>
      </div>
    </div>
  );
}
