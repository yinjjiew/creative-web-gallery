import Link from "next/link";

import {
  WATER_LABEL,
  completeness,
  formatDate,
  isStale,
  latestDate,
  worstGrade,
} from "./facts";
import { GradeStamp, SourceStamp } from "./Stamp";
import type { Place } from "./types";
import { BASE } from "./types";
import s from "./reaches.module.css";

function rowSource(place: Place): { source: Place["quality"]["source"]; date: string | null } {
  if (place.quality.value !== null) {
    return { source: place.quality.source, date: place.quality.date };
  }
  const last = latestDate(place);
  if (place.notes.length && last === place.notes[place.notes.length - 1]?.date) {
    return { source: "swimmer", date: last };
  }
  if (last) return { source: "warden", date: last };
  return { source: "none", date: null };
}

export function RegisterList({
  places,
  caption,
}: {
  places: Place[];
  caption?: string;
}) {
  return (
    <div className={s.regWrap}>
      {caption ? <p className={s.regCap}>{caption}</p> : null}
      <ol className={s.reg}>
        {places.map((place) => {
          const grade = worstGrade(place.hazards);
          const src = rowSource(place);
          const fill = completeness(place);
          return (
            <li key={place.slug} className={s.row}>
              <GradeStamp grade={grade} />
              <div className={s.rowBody}>
                <p className={s.rowName}>
                  <Link href={`${BASE}/p/${place.slug}`}>{place.name}</Link>
                </p>
                <p className={s.rowMeta}>
                  {WATER_LABEL[place.water]}
                  <span aria-hidden="true"> · </span>
                  {place.waterName}
                  <span aria-hidden="true"> · </span>
                  {place.county}
                </p>
                <p className={s.rowProv}>
                  <SourceStamp
                    source={src.source}
                    date={formatDate(src.date)}
                    stale={isStale(src.date)}
                  />
                  <span className={s.fill}>
                    {fill.known} of {fill.of} fields known
                  </span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function EmptyRegister({ children }: { children: React.ReactNode }) {
  return <p className={s.empty}>{children}</p>;
}
