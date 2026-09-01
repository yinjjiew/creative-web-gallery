import Link from "next/link";

import { worstGrade } from "./facts";
import type { Place } from "./types";
import { BASE } from "./types";
import s from "./reaches.module.css";

/**
 * A river as a long-section, not a map of pins. Chainage down the page,
 * each tick a reach, the stamp doing the work a pin cannot.
 */
export function LongSection({
  title,
  places,
}: {
  title: string;
  places: Place[];
}) {
  const ordered = places.slice().sort((a, b) => a.chainageKm - b.chainageKm);
  return (
    <figure className={s.long}>
      <figcaption className={s.longCap}>
        {title}
        <span className={s.longHint}> — long-section, not a map</span>
      </figcaption>
      <ol className={s.longList}>
        {ordered.map((p) => {
          const grade = worstGrade(p.hazards);
          return (
            <li key={p.slug} className={s.longItem}>
              <span className={s.chain} aria-hidden="true">
                {p.chainageKm.toFixed(1)}
              </span>
              <span className={`${s.tick} ${s[`tick_${grade}`]}`} aria-hidden="true" />
              <Link href={`${BASE}/p/${p.slug}`} className={s.longLink}>
                <span className={s.longName}>{p.name}</span>
                <span className={s.longGrade}>{grade === "unknown" ? "not assessed" : grade}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
