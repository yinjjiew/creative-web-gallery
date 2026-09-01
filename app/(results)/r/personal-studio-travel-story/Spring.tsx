"use client";

import { useCallback, useRef, useState } from "react";

import { DAYS_KEPT, LANDSCAPES, WALKER } from "./journal";
import s from "./watershed.module.css";

const WIDTHS = [
  { w: "0.4 m", land: "moor" },
  { w: "6 m", land: "farms" },
  { w: "18 m", land: "mill town" },
  { w: "48 m", land: "city" },
  { w: "160 m", land: "docks" },
  { w: "2 km", land: "salt marsh" },
];

export default function Spring({ onCross }: { onCross: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pull, setPull] = useState(0);

  const fromY = useCallback((clientY: number) => {
    const el = track.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientY - r.top) / r.height));
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const t = fromY(e.clientY);
    if (t > 0.28) return;
    dragging.current = true;
    setPull(t);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setPull(fromY(e.clientY));
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (pull > 0.72) onCross();
    else setPull(0);
  };

  const open = 3 + pull * 56;

  return (
    <section className={s.bank} aria-labelledby="title">
      <div className={s.bankTop}>
        <span>{WALKER}</span>
        <span>June–July · 41 days</span>
      </div>

      <div className={s.bankBody}>
        <div className={s.lede}>
          <h1 id="title">Watershed</h1>
          <p>
            A spring comes out of the peat at Lum Head. It is forty centimetres
            across. She stepped over it on the eleventh of June, three months
            after the decree absolute — not to prove a thing, and not to get
            well. The river is one way. So is this.
          </p>
          <p>
            What follows is the descent: moor, then farms, then a mill town,
            then a city, then docks, then salt marsh. The water gets bigger,
            slower, dirtier. The days that held are few.
          </p>
        </div>

        <dl className={s.legend} aria-label="The river, by width">
          {WIDTHS.map((row, i) => (
            <div className={s.legendRow} key={row.land}>
              <dt className={s.legendW}>{row.w}</dt>
              <dd>
                {row.land}
                {i === 0 ? " — step across" : ""}
                {i === WIDTHS.length - 1 ? " — the mouth" : ""}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        ref={track}
        className={s.cross}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pull * 100)}
        aria-valuetext={
          pull > 0.72
            ? "Across. Release to go downstream."
            : "On the near bank. Pull down across the spring."
        }
        aria-label="Step across the spring, downstream"
        style={{ "--open": `${open}px` } as React.CSSProperties}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            onCross();
          }
        }}
      >
        <span className={s.nearBank}>Near bank · pull down</span>
        <span className={s.trickle} />
        <span className={s.farBank}>Downstream</span>
      </div>

      <button type="button" className={s.stepBtn} onClick={onCross}>
        Step across
      </button>

      <ol className={s.kept} aria-label="Days she kept">
        {DAYS_KEPT.map((d) => (
          <li key={d.id}>
            <b>Day {d.day}</b> {d.place}
          </li>
        ))}
      </ol>

      <p className={s.note}>
        Composed account. Distances modelled on a Pennine-to-estuary river of
        138 km. Widths are a long section, not a gauge. The six landscapes —{" "}
        {LANDSCAPES.map((l) => l.label).join(", ")} — are the only geography.
        No map.
      </p>
    </section>
  );
}
