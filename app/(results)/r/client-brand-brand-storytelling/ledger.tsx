"use client";

/**
 * The ledger — one line of custody per variety.
 *
 * The graphic is deliberately not a bar chart of a statistic. A line runs from
 * the first year the variety is recorded to the last, and then stops. What is
 * to the right of the stop is nothing: dashed empty paper, the years it did not
 * survive. A statistic about nine tenths of something is easy to nod at; a line
 * that ends in 1938 with a name on it is not.
 *
 * Built from buttons rather than SVG so that it is a list a keyboard and a
 * screen reader can walk, and so a phone gets real touch targets. The drawing
 * is CSS on top of that list, not a replacement for it.
 */

import { FIRST_YEAR, LAST_YEAR, LEDGER, NOW, type Variety } from "./data/varieties";
import { lesson } from "./data/saving";
import type { LessonId } from "./data/varieties";
import Portrait from "./portrait";
import s from "./kirkwall.module.css";

const SPAN = LAST_YEAR - FIRST_YEAR;
const pct = (year: number) => ((year - FIRST_YEAR) / SPAN) * 100;
const pc = (n: number) => `${n.toFixed(2)}%`;

const AXIS = [1850, 1900, 1950, 2000, NOW];

export function Ledger({
  selected,
  onSelect,
  adopted,
}: {
  selected: string;
  onSelect: (id: string) => void;
  adopted: Set<string>;
}) {
  return (
    <div className={s.ledger}>
      <div className={s.axis} aria-hidden="true">
        {AXIS.map((year) => (
          <span
            className={s.axisTick}
            key={year}
            style={{ left: pc(pct(year)) }}
          >
            {year === NOW ? "now" : year}
          </span>
        ))}
      </div>

      <ul className={s.rows}>
        {LEDGER.map((v) => {
          const end = v.last ?? NOW;
          const mine = adopted.has(v.id);
          return (
            <li key={v.id}>
              <button
                type="button"
                className={`${s.row} ${selected === v.id ? s.rowOn : ""}`}
                aria-pressed={selected === v.id}
                onClick={() => {
                  onSelect(v.id);
                }}
              >
                <span className={s.rowName}>
                  {v.name}
                  <br />
                  <span className={s.rowCrop}>{v.crop}</span>
                </span>

                <span className={s.track}>
                  <span
                    className={s.life}
                    style={{
                      left: pc(pct(v.first)),
                      width: pc(pct(end) - pct(v.first)),
                    }}
                  />
                  {v.last === null ? (
                    <span
                      className={`${s.openEnd} ${mine ? s.openEndLiving : ""}`}
                      style={{ left: pc(pct(NOW)) }}
                    />
                  ) : (
                    <>
                      <span className={s.stop} style={{ left: pc(pct(v.last)) }} />
                      <span
                        className={s.ghost}
                        style={{
                          left: pc(pct(v.last)),
                          width: pc(pct(NOW) - pct(v.last)),
                        }}
                      />
                    </>
                  )}
                  {mine ? (
                    <span
                      className={s.added}
                      style={{
                        left: pc(pct(NOW)),
                        width: pc(100 - pct(NOW)),
                      }}
                    />
                  ) : null}
                  <span className={s.now} style={{ left: pc(pct(NOW)) }} />
                </span>

                <span
                  className={`${s.rowYear} ${v.last === null ? "" : s.rowYearStop}`}
                >
                  {v.last === null ? "still" : v.last}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul className={s.legend}>
        <li>
          <span className={s.swatchLife} aria-hidden="true" /> recorded in
          cultivation
        </li>
        <li>
          <span className={s.swatchStop} aria-hidden="true" /> last record
        </li>
        <li>
          <span className={s.swatchGhost} aria-hidden="true" /> years after it
          was gone
        </li>
        <li>
          <span className={s.swatchAdded} aria-hidden="true" /> a grower has
          taken it on
        </li>
      </ul>
    </div>
  );
}

export function Detail({
  v,
  adopted,
  onAdopt,
  onLesson,
}: {
  v: Variety;
  adopted: boolean;
  onAdopt: (id: string) => void;
  onLesson: (id: LessonId) => void;
}) {
  const alive = v.last === null;
  const l = lesson(v.lesson);

  return (
    <div className={s.detail}>
      <figure className={s.plate}>
        <Portrait
          id={v.id}
          form={v.form}
          shape={v.shape}
          complete={alive}
          className={`${s.plateArt} ${alive ? "" : s.plateArtLost}`}
        />
        <figcaption className={s.plateCap}>
          {alive
            ? "Drawn from the growing notes. Hatched: a plant of this exists to be looked at."
            : "Drawn from the written description. Outline only: there is no photograph, and nothing left to photograph."}
        </figcaption>
      </figure>

      <div>
        <div className={s.detailHead}>
          <h3 className={s.detailName}>{v.name}</h3>
          <span
            className={`${s.chip} ${
              v.provenance === "documented" ? s.chipReal : ""
            }`}
          >
            {v.provenance === "documented"
              ? "real — see note 8"
              : "illustrative"}
          </span>
          {adopted ? (
            <span className={`${s.chip} ${s.chipLiving}`}>you have this one</span>
          ) : null}
        </div>
        <p className={s.detailBotanical}>
          {v.crop} &middot; <span lang="la">{v.botanical}</span>
        </p>

        <dl className={s.detailMeta}>
          <div>
            <dt className={s.metaKey}>First recorded</dt>
            <dd className={s.metaVal}>{v.first}</dd>
          </div>
          <div>
            <dt className={s.metaKey}>Last recorded</dt>
            <dd className={s.metaVal}>
              {alive ? "still grown" : v.last}
            </dd>
          </div>
          <div>
            <dt className={s.metaKey}>In the collection</dt>
            <dd className={s.metaVal}>
              {v.held
                ? `yes · ${String(v.held.growers)} growers`
                : alive
                  ? "grown locally, not held"
                  : "no"}
            </dd>
          </div>
          <div>
            <dt className={s.metaKey}>Seed packet</dt>
            <dd className={s.metaVal}>{v.held?.packet ?? "—"}</dd>
          </div>
        </dl>

        <div className={s.detailBody}>
          <p className={s.dim} style={{ fontSize: "0.94em" }}>
            <span className={s.metaKey}>The record</span> {v.record}
          </p>
          <p>{v.was}</p>
          <p>
            <span className={s.wentLabel}>
              {alive ? "Why it is still here" : "How it went"}
            </span>{" "}
            {v.went}
          </p>

          <button
            type="button"
            className={s.lessonJump}
            onClick={() => {
              onLesson(v.lesson);
            }}
          >
            <span className={s.lessonJumpKey}>
              {alive ? "what keeping it needs" : "what would have kept it"}
            </span>
            <span>{l.title} &rarr;</span>
          </button>

          {v.held?.adoptable ? (
            <div className={s.segActions}>
              <button
                type="button"
                className={`${s.button} ${adopted ? s.buttonGhost : ""}`}
                aria-pressed={adopted}
                onClick={() => {
                  onAdopt(v.id);
                }}
              >
                {adopted ? "you have taken this on" : `take on ${v.name}`}
              </button>
              <span className={s.mark}>{v.held.ease}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
