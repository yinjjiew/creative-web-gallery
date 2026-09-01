"use client";

import {
  MONTH_BLOCKS,
  alongYear,
  longDate,
  monthName,
  seasonInk,
} from "./model";
import s from "./walk.module.css";

/**
 * One year, laid out left to right, October to September. Each morning that
 * said something is a hairline, coloured by its time of year.
 *
 * This is the piece that makes accumulation visible: standing at one place, the
 * strip is the shape of a year's attention to it — where she looked often, the
 * weeks she said nothing, the month it was every single morning.
 *
 * In the overview it is a picture and nothing else, so it is hidden from
 * assistive technology and a written summary is given instead. In the place
 * view every mark is a button.
 */
type Props = {
  dates: string[];
  /** 0–1 per date; drives mark height where length is the point. */
  heights?: Map<string, number>;
  interactive?: boolean;
  selected?: string | null;
  onPick?: (date: string) => void;
  months?: boolean;
  /** Read out instead of the marks when the strip is decorative. */
  summary?: string;
};

export default function YearStrip({
  dates,
  heights,
  interactive = false,
  selected = null,
  onPick,
  months = false,
  summary,
}: Props) {
  const marks = dates.map((date) => {
    const x = alongYear(date);
    const h = heights?.get(date);
    const style = {
      left: `${String(x * 100)}%`,
      background: seasonInk(date),
      ...(h === undefined ? {} : { height: `${String(28 + h * 72)}%` }),
    };
    if (!interactive) {
      return <span key={date} className={s.mark} style={style} />;
    }
    return (
      <button
        key={date}
        type="button"
        className={`${s.markHit} ${date === selected ? s.markHitOn : ""}`}
        style={{ left: `${String(x * 100)}%` }}
        onClick={() => onPick?.(date)}
        aria-pressed={date === selected}
      >
        <span className={s.mark} style={{ background: seasonInk(date) }} />
        <span className={s.hidden}>{longDate(date)}</span>
      </button>
    );
  });

  return (
    <div className={s.stripWrap}>
      <div
        className={s.strip}
        {...(interactive ? {} : { "aria-hidden": true as const })}
      >
        <span className={s.stripRule} />
        {marks}
      </div>
      {summary ? <p className={s.hidden}>{summary}</p> : null}
      {months ? (
        <div className={s.stripMonths} aria-hidden>
          {MONTH_BLOCKS.map((b) => (
            <span
              key={b.key}
              className={s.stripMonth}
              style={{ left: `${String(alongYear(b.days[0]) * 100)}%` }}
            >
              {monthName(b.month).slice(0, 3)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
