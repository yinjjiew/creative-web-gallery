"use client";

import { MOTIFS, MOTIF_HITS, seasonInk, shortDate, typeset } from "./model";
import { STATION_BY_ID, type StationId } from "./route-data";
import YearStrip from "./YearStrip";
import s from "./walk.module.css";

/**
 * The third axis: not a place and not a date but a thing that kept happening.
 *
 * An index, not a search box. Every count here is matched out of the text at
 * load, so the arithmetic is a fact about the prose rather than a claim about
 * it — and the arithmetic is where the patterns are. The heron and the mattress
 * are separate nuisances for eleven months and then they are not.
 */
export default function Recurring({
  motif,
  onMotif,
  onDate,
  onStation,
}: {
  motif: string;
  onMotif: (id: string) => void;
  onDate: (date: string) => void;
  onStation: (id: StationId) => void;
}) {
  const chosen = MOTIFS.find((m) => m.id === motif) ?? MOTIFS[0];
  const hits = MOTIF_HITS[chosen.id] ?? [];
  const first = hits[0];
  const last = hits[hits.length - 1];

  return (
    <div className={s.pane}>
      <p className={s.frontNote}>
        Things that happened more than once. Counted by looking for them in what
        she wrote, so these are the numbers the diary actually contains.
      </p>

      <ul className={s.motifList}>
        {MOTIFS.map((m) => {
          const n = MOTIF_HITS[m.id]?.length ?? 0;
          return (
            <li key={m.id}>
              <button
                type="button"
                className={`${s.motifChip} ${m.id === chosen.id ? s.motifChipOn : ""}`}
                onClick={() => onMotif(m.id)}
                aria-pressed={m.id === chosen.id}
              >
                <span>{typeset(m.label)}</span>
                <span className={s.motifCount}>{n}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <header className={s.motifHead}>
        <h2 className={s.motifName}>{typeset(chosen.label)}</h2>
        <p className={s.standing}>{typeset(chosen.gloss)}</p>
        <p className={s.placeStats}>
          <span>
            {hits.length} {hits.length === 1 ? "note" : "notes"}
          </span>
          {first && last ? (
            <span>
              {shortDate(first.date)} to {shortDate(last.date)}
            </span>
          ) : null}
        </p>
      </header>

      <div className={s.placeStrip}>
        <YearStrip dates={hits.map((h) => h.date)} months />
      </div>

      <ol className={s.entries}>
        {hits.map((hit, i) => (
          <li key={`${hit.date}-${String(i)}`} className={s.entry}>
            <div className={s.entryMargin}>
              <span
                className={s.seasonMark}
                style={{ background: seasonInk(hit.date) }}
                aria-hidden
              />
              <button
                type="button"
                className={s.dateLink}
                onClick={() => onDate(hit.date)}
              >
                {shortDate(hit.date)}
              </button>
              <button
                type="button"
                className={s.placeLink}
                onClick={() => onStation(hit.note.at)}
              >
                {typeset(STATION_BY_ID[hit.note.at].name)}
              </button>
            </div>
            <p className={s.entryText}>{typeset(hit.note.text)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
