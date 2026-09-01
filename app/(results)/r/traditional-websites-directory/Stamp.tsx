import { GRADE_LABEL } from "./facts";
import type { HazardGrade, SourceKind } from "./types";
import s from "./reaches.module.css";

export function GradeStamp({
  grade,
  large = false,
}: {
  grade: HazardGrade;
  large?: boolean;
}) {
  return (
    <span
      className={`${s.stamp} ${s[`g_${grade}`]} ${large ? s.stampLarge : ""}`}
    >
      {GRADE_LABEL[grade]}
    </span>
  );
}

export function SourceStamp({
  source,
  date,
  stale,
}: {
  source: SourceKind;
  date: string | null;
  stale?: boolean;
}) {
  const label =
    source === "sample"
      ? "Sampled"
      : source === "warden"
        ? "Warden"
        : source === "swimmer"
          ? "Swimmer note"
          : "Not recorded";
  return (
    <span className={`${s.src} ${s[`src_${source}`]} ${stale ? s.srcStale : ""}`}>
      {label}
      {date ? <span className={s.srcDate}>{date}</span> : null}
      {stale ? <span className={s.stale}>Stale</span> : null}
    </span>
  );
}

export function Legend() {
  return (
    <aside className={s.legend} aria-label="How to read a row">
      <p className={s.legendK}>Hazard</p>
      <ul className={s.legendList}>
        <li>
          <GradeStamp grade="lethal" /> Known to hold or drown. Unmissable on
          purpose.
        </li>
        <li>
          <GradeStamp grade="serious" /> A named risk that is not ordinary.
        </li>
        <li>
          <GradeStamp grade="caution" /> Ordinary outdoor water, still not
          “safe”.
        </li>
        <li>
          <GradeStamp grade="unknown" /> Not assessed. This is not a blank, and
          it is not calm water.
        </li>
      </ul>
      <p className={s.legendK}>Provenance</p>
      <ul className={s.legendList}>
        <li>
          <SourceStamp source="sample" date={null} /> Official-style sample in
          this modelled edition.
        </li>
        <li>
          <SourceStamp source="warden" date={null} /> Field note, not a
          laboratory number.
        </li>
        <li>
          <SourceStamp source="swimmer" date={null} /> Recollection. Never a
          measurement.
        </li>
        <li>
          <SourceStamp source="none" date={null} /> Not recorded — do not treat
          as absent hazard.
        </li>
      </ul>
    </aside>
  );
}
