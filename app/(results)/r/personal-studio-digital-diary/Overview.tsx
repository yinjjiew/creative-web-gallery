"use client";

import {
  BY_STATION,
  MONTH_BLOCKS,
  STATION_STATS,
  TOTAL_NOTES,
  alongYear,
  monthName,
  parts,
  shortDate,
  typeset,
} from "./model";
import { STATIONS, type StationId } from "./route-data";
import YearStrip from "./YearStrip";
import s from "./walk.module.css";

/**
 * The front door, and an argument about the material: the walk itself, nine
 * places in the order they happen, each with the shape of its year underneath
 * it and one morning quoted.
 *
 * A reverse-chronological list would open on 30 September and tell you nothing.
 * This opens on the thing that did not change.
 */

/**
 * One morning quoted per place: hand-picked, an editor's choice rather than an
 * algorithm's, and chosen not to spend the year's few heavy notes on a reader
 * who has been here nine seconds. The ones that hurt are in there to be found.
 */
const EXEMPLAR: Record<StationId, string> = {
  step: "2024-01-08",
  ginnel: "2024-05-13",
  towpath: "2023-11-08",
  bridge41: "2024-02-12",
  iron: "2024-02-21",
  veritys: "2024-07-08",
  pool: "2024-04-22",
  footbridge: "2023-11-14",
  back: "2023-12-11",
};

function busiestMonth(id: StationId): string {
  const counts = new Map<number, number>();
  for (const st of BY_STATION[id]) {
    const m = parts(st.date).month;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  let best = -1;
  let bestN = -1;
  for (const [m, n] of counts) {
    if (n > bestN) {
      best = m;
      bestN = n;
    }
  }
  return best < 0 ? "" : monthName(best);
}

export default function Overview({
  onStation,
}: {
  onStation: (id: StationId) => void;
}) {
  return (
    <div className={s.pane}>
      <div className={s.frontMatter}>
        <p className={s.lede}>
          Out of the house at quarter to seven, down the ginnel to the canal,
          under two bridges, past the scrapyard, past the pool where the heron
          stands when he is in, over Ladyshaw footbridge and home along the far
          bank. Twenty minutes. The same twenty minutes every morning for a
          year.
        </p>
        <p className={s.frontNote}>
          She wrote the notes as she walked, one for each thing she noticed,
          which means every note knows where on the route it was taken. So the
          year can be read down the calendar — one morning at a time, in order,
          the way she lived it — or across the route: stand at one bridge and
          read every morning it produced, October to September, in a single
          column. The second way is the one that shows you what this is.
        </p>
      </div>

      <div className={s.ruler} aria-hidden>
        <span className={s.rulerLabel}>the year, across</span>
        <div className={s.rulerMonths}>
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
      </div>

      <ol className={s.stations}>
        {STATIONS.map((station) => {
          const entries = BY_STATION[station.id];
          const stats = STATION_STATS[station.id];
          const pickDate = EXEMPLAR[station.id];
          const quoted =
            entries.find((e) => e.date === pickDate) ??
            entries[entries.length - 1];
          const month = busiestMonth(station.id);
          return (
            <li key={station.id} className={s.stationBlock}>
              <div className={s.stationHead}>
                <span className={s.minute}>
                  {station.at === 0 ? "0" : String(station.at)}
                  <span className={s.minuteMark}>′</span>
                </span>
                <h2 className={s.stationName}>
                  <button
                    type="button"
                    className={s.stationOpen}
                    onClick={() => onStation(station.id)}
                  >
                    {typeset(station.name)}
                  </button>
                </h2>
                <span className={s.stationCount}>
                  {stats.mornings} mornings
                </span>
              </div>
              <p className={s.standing}>{typeset(station.standing)}</p>
              <YearStrip
                dates={entries.map((e) => e.date)}
                summary={`${String(stats.mornings)} mornings at ${station.name}, most often in ${month}.`}
              />
              {quoted ? (
                <blockquote className={s.quoted}>
                  <p>{typeset(quoted.note.text)}</p>
                  <cite>{shortDate(quoted.date)}</cite>
                </blockquote>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className={s.overviewTail}>
        {TOTAL_NOTES} notes in all. Pick a place from the route on the left to
        stand in it for a year.
      </p>
    </div>
  );
}
