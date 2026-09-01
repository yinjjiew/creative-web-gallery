"use client";

import { useEffect } from "react";

import {
  DAY_BY_DATE,
  MONTH_BLOCKS,
  MOST_WORDS,
  WORDS_BY_DATE,
  longDate,
  monthName,
  neighbourDate,
  seasonInk,
  typeset,
} from "./model";
import { STATIONS, type StationId } from "./route-data";
import s from "./walk.module.css";

/**
 * One morning, walked in order.
 *
 * The nine places are always all present, including the ones she said nothing
 * about, because the walk went through them either way. A morning with one note
 * is mostly empty route, and that is the truth of it.
 *
 * Above it, the year as twelve rows of days, each written morning a bar as tall
 * as the number of words she had that day. Nobody is told what to look for in
 * it.
 */
export default function Morning({
  date,
  onDate,
  onStation,
}: {
  date: string;
  onDate: (date: string) => void;
  onStation: (id: StationId) => void;
}) {
  const day = DAY_BY_DATE.get(date);
  const previous = neighbourDate(date, -1);
  const next = neighbourDate(date, 1);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowLeft" && previous) onDate(previous);
      if (event.key === "ArrowRight" && next) onDate(next);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [previous, next, onDate]);

  const written = WORDS_BY_DATE.get(date) ?? 0;

  return (
    <div className={s.pane}>
      <div className={s.calendar}>
        {MONTH_BLOCKS.map((block) => (
          <div key={block.key} className={s.calMonth}>
            <span className={s.calLabel}>
              {monthName(block.month).slice(0, 3)}
            </span>
            <div className={s.calDays}>
              {block.days.map((iso) => {
                const w = WORDS_BY_DATE.get(iso);
                if (w === undefined) {
                  return <span key={iso} className={s.calGap} />;
                }
                const height = 20 + Math.sqrt(w / MOST_WORDS) * 80;
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`${s.calDay} ${iso === date ? s.calDayOn : ""}`}
                    onClick={() => onDate(iso)}
                    aria-pressed={iso === date}
                    aria-label={`${longDate(iso)}, ${String(w)} words`}
                  >
                    <span
                      className={s.calBar}
                      style={{
                        height: `${String(height)}%`,
                        background: seasonInk(iso),
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className={s.calKey}>
          Twelve months, October to September. Every morning she wrote is a
          mark; the taller it is, the more she had to say.
        </p>
      </div>

      <header className={s.morningHead}>
        <div className={s.morningNav}>
          <button
            type="button"
            className={s.step}
            onClick={() => previous && onDate(previous)}
            disabled={!previous}
          >
            ← the morning before
          </button>
          <button
            type="button"
            className={s.step}
            onClick={() => next && onDate(next)}
            disabled={!next}
          >
            the morning after →
          </button>
        </div>
        <h2 className={s.morningDate}>
          <span
            className={s.seasonMark}
            style={{ background: seasonInk(date) }}
            aria-hidden
          />
          {longDate(date)}
        </h2>
        <p className={s.morningStats}>
          {day ? day.notes.length : 0}{" "}
          {day && day.notes.length === 1 ? "note" : "notes"} · {written} words
        </p>
      </header>

      <ol className={s.walkRows}>
        {STATIONS.map((station) => {
          const here = day?.notes.filter((n) => n.at === station.id) ?? [];
          return (
            <li
              key={station.id}
              className={`${s.walkRow} ${here.length ? "" : s.walkRowQuiet}`}
            >
              <div className={s.walkRowHead}>
                <span className={s.walkMinute}>{station.at}′</span>
                <button
                  type="button"
                  className={s.walkPlace}
                  onClick={() => onStation(station.id)}
                  title={`stand at ${station.name} for the whole year`}
                >
                  {typeset(station.name)}
                </button>
              </div>
              {here.length ? (
                <div className={s.walkNotes}>
                  {here.map((note, i) => (
                    <p key={i} className={s.entryText}>
                      {typeset(note.text)}
                    </p>
                  ))}
                </div>
              ) : (
                <div className={s.walkNotes}>
                  <p className={s.walkNothing}>—</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className={s.morningTail}>
        Arrow keys move a morning at a time. A place name takes you to that place
        across the whole year.
      </p>
    </div>
  );
}
