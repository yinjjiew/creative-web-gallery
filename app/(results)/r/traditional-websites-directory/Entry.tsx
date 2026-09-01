import Link from "next/link";

import { countySlug } from "./catalog";
import {
  LEGAL_LABEL,
  QUALITY_LABEL,
  SOURCE_LABEL,
  WATER_LABEL,
  completeness,
  formatDate,
  isStale,
  worstGrade,
} from "./facts";
import type { Fact, Place } from "./types";
import { BASE } from "./types";
import { GradeStamp, SourceStamp } from "./Stamp";
import s from "./reaches.module.css";

function Field({
  label,
  fact: f,
  children,
}: {
  label: string;
  fact: Fact<unknown>;
  children?: React.ReactNode;
}) {
  const missing = f.value === null;
  return (
    <div className={`${s.field} ${missing ? s.fieldMissing : ""}`}>
      <div className={s.fieldLab}>
        <p className={s.fieldName}>{label}</p>
        <SourceStamp
          source={f.source}
          date={formatDate(f.date)}
          stale={isStale(f.date)}
        />
      </div>
      <div className={s.fieldVal}>
        {missing ? (
          <p className={s.missingCopy}>
            Not recorded. Do not treat this blank as an absence of hazard.
          </p>
        ) : (
          children
        )}
        {f.detail && !missing ? <p className={s.fieldDetail}>{f.detail}</p> : null}
      </div>
    </div>
  );
}

export function Entry({ place }: { place: Place }) {
  const grade = worstGrade(place.hazards);
  const fill = completeness(place);
  const legal = place.legal.value;

  return (
    <article className={s.entry}>
      <p className={s.entryKicker}>
        {WATER_LABEL[place.water]}
        <span aria-hidden="true"> · </span>
        {place.waterName}
        <span aria-hidden="true"> · </span>
        {place.county}, {place.nation}
        <span aria-hidden="true"> · </span>
        Sheet {place.sheet}
      </p>
      <h1 className={s.entryTitle}>{place.name}</h1>
      <p className={s.entrySum}>{place.summary}</p>
      <p className={s.entryFill}>
        {fill.known} of {fill.of} measured fields known in this edition.
        {fill.known <= 3
          ? " This is a thin record. Thin is not the same as quiet."
          : null}
      </p>

      <div className={`${s.banner} ${s[`banner_${grade}`]}`} role="status">
        <GradeStamp grade={grade} large />
        <div>
          {place.hazards.map((h) => (
            <div key={h.title} className={s.hazBlock}>
              <h2 className={s.hazTitle}>{h.title}</h2>
              <p>{h.body}</p>
              {h.seasonal ? (
                <p className={s.hazExtra}>
                  <span className={s.hazLab}>Season. </span>
                  {h.seasonal}
                </p>
              ) : null}
              {h.afterRain ? (
                <p className={s.hazExtra}>
                  <span className={s.hazLab}>After rain. </span>
                  {h.afterRain}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <section className={s.block} aria-labelledby="legal-h">
        <h2 id="legal-h" className={s.blockH}>
          Whether it is allowed
        </h2>
        <Field label="Legal status" fact={place.legal}>
          <p className={s.legalLine}>
            {legal ? LEGAL_LABEL[legal] : null}
          </p>
        </Field>
      </section>

      <section className={s.block} aria-labelledby="water-h">
        <h2 id="water-h" className={s.blockH}>
          The water
        </h2>
        <Field label="Depth" fact={place.depth}>
          <p>{place.depth.value}</p>
        </Field>
        <Field label="Current" fact={place.current}>
          <p>{place.current.value}</p>
        </Field>
        <Field label="Length of swim" fact={place.lengthM}>
          <p>
            {place.lengthM.value !== null
              ? `${place.lengthM.value.toLocaleString("en-GB")} m recorded`
              : null}
          </p>
        </Field>
      </section>

      <section className={s.block} aria-labelledby="temp-h">
        <h2 id="temp-h" className={s.blockH}>
          Temperature by season
        </h2>
        <p className={s.blockNote}>
          Spot readings in this modelled edition, or a blank. A blank season is
          not a mild season.
        </p>
        <div className={s.seasons}>
          {(
            [
              ["Spring", place.temperature.spring],
              ["Summer", place.temperature.summer],
              ["Autumn", place.temperature.autumn],
              ["Winter", place.temperature.winter],
            ] as const
          ).map(([label, f]) => (
            <div
              key={label}
              className={`${s.season} ${f.value === null ? s.seasonMissing : ""}`}
            >
              <p className={s.seasonLab}>{label}</p>
              <p className={s.seasonVal}>
                {f.value ?? "Not recorded"}
              </p>
              <SourceStamp
                source={f.source}
                date={formatDate(f.date)}
                stale={isStale(f.date)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={s.block} aria-labelledby="qual-h">
        <h2 id="qual-h" className={s.blockH}>
          Water quality
        </h2>
        <Field label="Last sample" fact={place.quality}>
          <p className={s.qualLine}>
            {place.quality.value ? QUALITY_LABEL[place.quality.value] : null}
          </p>
        </Field>
        {place.qualityAfterRain ? (
          <p className={s.rain}>
            <span className={s.hazLab}>After rain. </span>
            {place.qualityAfterRain}
          </p>
        ) : place.quality.value === null ? null : (
          <p className={s.rainUnknown}>
            After-rain behaviour is not recorded. A dry-weather sample is not a
            wet-weather sample.
          </p>
        )}
      </section>

      <section className={s.block} aria-labelledby="get-h">
        <h2 id="get-h" className={s.blockH}>
          Getting there
        </h2>
        <Field label="Access" fact={place.access}>
          <p>{place.access.value}</p>
        </Field>
        <Field label="Parking" fact={place.parking}>
          <p>{place.parking.value}</p>
        </Field>
      </section>

      <section className={s.notes} aria-labelledby="notes-h">
        <h2 id="notes-h" className={s.blockH}>
          Notes from swimmers
        </h2>
        <p className={s.notesWarn}>
          These are recollections. They are set apart from the register so they
          cannot be mistaken for measurements. A sentence from 2019 is still
          from 2019.
        </p>
        {place.notes.length === 0 ? (
          <p className={s.missingCopy}>
            No swimmer notes in this edition. That is not a condition report.
          </p>
        ) : (
          <ul className={s.noteList}>
            {place.notes.map((n) => (
              <li key={`${n.by}-${n.date}`} className={s.note}>
                <p className={s.noteText}>“{n.text}”</p>
                <p className={s.noteBy}>
                  {n.by}
                  <span aria-hidden="true"> · </span>
                  {formatDate(n.date)}
                  {isStale(n.date) ? (
                    <span className={s.stale}> Stale</span>
                  ) : null}
                  <span aria-hidden="true"> · </span>
                  {SOURCE_LABEL.swimmer}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={s.back}>
        <Link href={`${BASE}/register`}>Back to the register</Link>
        <span aria-hidden="true"> · </span>
        <Link href={`${BASE}/water/${place.water}`}>
          All {WATER_LABEL[place.water].toLowerCase()} reaches
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href={`${BASE}/county/${countySlug(place.county)}`}>
          {place.county}
        </Link>
      </p>
    </article>
  );
}
