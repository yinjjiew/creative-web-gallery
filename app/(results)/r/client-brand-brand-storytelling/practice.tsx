"use client";

/**
 * §5 — the practical half, and the reason this page is not a lament.
 *
 * Every entry on the ledger is lost by one of seven mechanisms, and every one of
 * the seven has an answer that fits in a paragraph and costs nothing. The ledger
 * links straight into this list, so no loss on the page is ever displayed
 * without the practice that would have prevented it sitting one click away.
 */

import { useEffect, useRef } from "react";

import {
  DIFFICULTY_LABEL,
  LESSONS,
  PRACTICE,
  lesson as findLesson,
} from "./data/saving";
import type { LessonId } from "./data/varieties";
import s from "./kirkwall.module.css";

const POLLINATION: Record<string, string> = {
  self: "selfs",
  insect: "insects",
  wind: "wind",
};

export default function Practice({
  open,
  onOpen,
}: {
  open: LessonId;
  onOpen: (id: LessonId) => void;
}) {
  const l = findLesson(open);
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // The ledger can jump here from a lost variety. Announce the change without
  // moving the page under anyone who simply clicked down the list.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    panel.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <div className={s.practiceGrid}>
        <ul className={s.lessonList}>
          {LESSONS.map((item) => (
            <li className={s.lessonItem} key={item.id}>
              <button
                type="button"
                className={`${s.lessonBtn} ${open === item.id ? s.lessonBtnOn : ""}`}
                aria-pressed={open === item.id}
                onClick={() => {
                  onOpen(item.id);
                }}
              >
                <span>{item.title}</span>
                <span className={s.lessonFail}>
                  answers: {item.failure}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div
          className={s.lessonPanel}
          ref={panel}
          tabIndex={-1}
          aria-live="polite"
        >
          <h3>{l.title}</h3>
          {l.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.practiceTable}>
          <caption>
            What each crop actually asks of you — working guidance from the
            seed-saving handbooks, note&nbsp;5
          </caption>
          <thead>
            <tr>
              <th scope="col">Crop</th>
              <th scope="col">Pollinated by</th>
              <th scope="col">Seed in</th>
              <th scope="col">Keep apart by</th>
              <th scope="col">Save from</th>
              <th scope="col">Effort</th>
              <th scope="col">The catch</th>
            </tr>
          </thead>
          <tbody>
            {PRACTICE.map((p) => (
              <tr key={p.crop}>
                <th scope="row">{p.crop}</th>
                <td>{POLLINATION[p.pollination]}</td>
                <td>{p.cycle === "annual" ? "one season" : "two seasons"}</td>
                <td>{p.isolation}</td>
                <td>{p.plants}</td>
                <td>
                  <span className={s.pips} title={DIFFICULTY_LABEL[p.difficulty]}>
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        className={`${s.pip} ${n <= p.difficulty ? s.pipOn : ""}`}
                        key={n}
                      />
                    ))}
                  </span>
                  <span className={s.srOnly}>
                    {p.difficulty} of 4 — {DIFFICULTY_LABEL[p.difficulty]}
                  </span>
                </td>
                <td>{p.catch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={s.plateCap}>
        Three crops in that table carry one pip — pea, French bean, tomato — and
        lettuce is only harder because it has to be left in the ground a month
        longer than feels reasonable. All four self-pollinate, all four are
        annual, and all four are finished with a paper bag and a dry fortnight in
        September. Everything with four pips is a job for a group, which is the
        honest reason a library of this size has members rather than customers.
      </p>
    </>
  );
}
