"use client";

import { useEffect, useRef, useState } from "react";

import {
  BY_STATION,
  STATION_STATS,
  longDate,
  seasonInk,
  shortDate,
  typeset,
} from "./model";
import { STATION_BY_ID, type StationId } from "./route-data";
import YearStrip from "./YearStrip";
import s from "./walk.module.css";

/**
 * One place, every morning it produced, in date order — the reading this diary
 * needs and a dated list cannot give. The year runs down a single column, so
 * February and July are the same bridge four screens apart, and the weeks she
 * had nothing to say about the scrapyard are a hole you can see.
 */
export default function Place({
  station,
  onMorning,
}: {
  station: StationId;
  onMorning: (date: string) => void;
}) {
  const place = STATION_BY_ID[station];
  const entries = BY_STATION[station];
  const stats = STATION_STATS[station];
  /*
   * The picked morning is stored with the place it was picked in, so moving to
   * another place drops the highlight without an effect having to clear it.
   */
  const [picked, setPicked] = useState<{ at: StationId; date: string } | null>(
    null,
  );
  const focus = picked && picked.at === station ? picked.date : null;
  const rows = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    if (!focus) return;
    const row = rows.current.get(focus);
    if (!row) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollIntoView({
      block: "center",
      behavior: still ? "auto" : "smooth",
    });
  }, [focus]);

  return (
    <div className={s.pane}>
      <header className={s.placeHead}>
        <span className={s.placeMinute}>
          {place.at === 0
            ? "the front door"
            : `${String(place.at)} minutes out`}
        </span>
        <h2 className={s.placeName}>{typeset(place.name)}</h2>
        <p className={s.standing}>{typeset(place.standing)}</p>
        <p className={s.placeStats}>
          <span>{stats.mornings} mornings</span>
          {stats.silence && stats.silence.mornings > 1 ? (
            <span>
              longest silence {stats.silence.mornings} mornings running,{" "}
              {shortDate(stats.silence.from)} to {shortDate(stats.silence.to)}
            </span>
          ) : null}
        </p>
      </header>

      <div className={s.placeStrip}>
        <YearStrip
          dates={entries.map((e) => e.date)}
          interactive
          months
          selected={focus}
          onPick={(date) => {
            setPicked({ at: station, date });
          }}
        />
      </div>

      <ol className={s.entries}>
        {entries.map((entry) => (
          <li
            key={`${entry.date}-${entry.note.at}`}
            className={`${s.entry} ${focus === entry.date ? s.entryOn : ""}`}
            ref={(el) => {
              if (el) rows.current.set(entry.date, el);
              else rows.current.delete(entry.date);
            }}
          >
            <div className={s.entryMargin}>
              <span
                className={s.seasonMark}
                style={{ background: seasonInk(entry.date) }}
                aria-hidden
              />
              <button
                type="button"
                className={s.dateLink}
                onClick={() => onMorning(entry.date)}
                title={`the whole of ${longDate(entry.date)}`}
              >
                {shortDate(entry.date)}
              </button>
            </div>
            <p className={s.entryText}>{typeset(entry.note.text)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
