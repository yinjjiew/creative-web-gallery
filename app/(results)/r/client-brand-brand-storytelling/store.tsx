"use client";

/**
 * §3 — the fact that makes a seed bank different from a museum.
 *
 * Two displays. The first is a keeping chart: how long the handbooks say seed of
 * each crop is worth sowing. It is drawn as a solid band and then a hatched band
 * rather than a decay curve on purpose — the sources give ranges, not a
 * function, and drawing a smooth curve through a range would be inventing a
 * measurement in order to look more scientific.
 *
 * The second is the rota arithmetic, which is where the brief's real problem
 * lives: a collection is a rota, the rota is bigger than the staff, and the only
 * thing that closes the gap is growers. Its inputs are the fictional client's
 * own numbers and are labelled illustrative; the arithmetic on them is shown in
 * full so it can be checked rather than believed.
 */

import { useId, useState } from "react";

import { KEEPING } from "./data/facts";
import s from "./kirkwall.module.css";

const MAX_YEARS = 12;

/**
 * The library's collection, split by how long its seed keeps, with the interval
 * each band comes round on. ILLUSTRATIVE: Kirkwall Seed Library is a fictional
 * client and these are its invented figures. The arithmetic is real arithmetic.
 */
const ROTA = [
  {
    band: "Short-lived — onion, leek, parsnip, sweet corn",
    accessions: 162,
    every: 2,
  },
  {
    band: "Middling — pea, bean, lettuce, carrot, brassica",
    accessions: 468,
    every: 4,
  },
  { band: "Long-lived — tomato, squash, beet", accessions: 270, every: 6 },
];

const COLLECTION = ROTA.reduce((n, r) => n + r.accessions, 0);
const DUE_PER_YEAR = ROTA.reduce(
  (n, r) => n + Math.round(r.accessions / r.every),
  0
);
/** What four people and the library's own ground can grow out in a season. */
const OWN_CAPACITY = 55;
/** Members who took a grow-out last season. */
const MEMBER_GROWERS = 106;

export default function Store({ adoptedCount }: { adoptedCount: number }) {
  const [years, setYears] = useState(4);
  const sliderId = useId();

  const past = KEEPING.filter((k) => years > k.high).length;
  const doubtful = KEEPING.filter((k) => years > k.low && years <= k.high).length;

  const growers = MEMBER_GROWERS + adoptedCount;
  const shortfall = DUE_PER_YEAR - OWN_CAPACITY - growers;

  return (
    <div className={s.storeGrid}>
      <div>
        <div className={s.chartFrame}>
          <div className={s.keepAxis} aria-hidden="true">
            {[0, 3, 6, 9, 12].map((y) => (
              <span
                className={s.keepTick}
                key={y}
                style={{ left: `${String((y / MAX_YEARS) * 100)}%` }}
              >
                {y}
              </span>
            ))}
          </div>
          <ul className={s.keepList}>
            {KEEPING.map((k) => {
              const good = (k.low / MAX_YEARS) * 100;
              const fade = ((k.high - k.low) / MAX_YEARS) * 100;
              const state =
                years > k.high ? "gone" : years > k.low ? "test" : "fine";
              return (
                <li className={s.keepRow} key={k.crop}>
                  <span className={s.keepName}>{k.crop}</span>
                  <span className={s.keepLane}>
                    <span className={s.keepGood} style={{ width: `${String(good)}%` }} />
                    <span
                      className={s.keepFade}
                      style={{ left: `${String(good)}%`, width: `${String(fade)}%` }}
                    />
                    <span
                      className={s.keepNow}
                      style={{ left: `${String((years / MAX_YEARS) * 100)}%` }}
                    />
                  </span>
                  <span
                    className={`${s.keepTag} ${
                      state === "gone"
                        ? s.keepTagGone
                        : state === "test"
                          ? s.keepTagTest
                          : ""
                    }`}
                  >
                    {state === "gone"
                      ? "assume gone"
                      : state === "test"
                        ? "test it"
                        : "sow it"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <label className={s.control} htmlFor={sliderId}>
          <span className={s.controlRow}>
            <span className={s.controlLabel}>Years the packet has sat there</span>
            <span className={s.controlVal}>
              {years} {years === 1 ? "year" : "years"}
            </span>
          </span>
          <input
            className={s.slider}
            id={sliderId}
            type="range"
            min={0}
            max={MAX_YEARS}
            step={1}
            value={years}
            onChange={(e) => {
              setYears(Number(e.currentTarget.value));
            }}
          />
        </label>
        <p className={s.mark} aria-live="polite">
          At {years} {years === 1 ? "year" : "years"}: {10 - past - doubtful} of
          these ten still worth sowing, {doubtful} worth a germination test,{" "}
          {past} to be assumed gone.
        </p>
        <p className={s.plateCap}>
          Ranges from the seed-saving handbooks (note&nbsp;5), for cool, dry,
          unfrozen storage — a library of this size, or your kitchen. A national
          genebank at &minus;18&nbsp;&deg;C buys decades instead of years
          (note&nbsp;4). It does not buy forever, which is why regeneration is
          written into the standards.
        </p>
      </div>

      <div>
        <h3 className={s.h3}>Why the library needs growers and not only donors</h3>
        <p>
          Regrowing is not maintenance around the edges of the work. It is the
          work. Every accession has a year against it and a year it is next due,
          and the sum of those due dates is a season&rsquo;s labour that money
          cannot straightforwardly buy, because what it needs is ground, hands
          and two years of somebody&rsquo;s attention for a carrot.
        </p>

        <div className={s.arith}>
          <p className={s.arithHead}>
            <span className={s.chip}>illustrative</span> Kirkwall&rsquo;s season,
            as the library works it out
          </p>
          <ul className={s.queue}>
            {ROTA.map((r) => (
              <li className={s.queueRow} key={r.band}>
                <span className={s.queueCrop}>{r.band}</span>
                <span className={s.queueNum}>{r.accessions}</span>
                <span className={s.queueDue}>
                  &divide; {r.every} yr = {Math.round(r.accessions / r.every)}
                </span>
              </li>
            ))}
          </ul>
          <p className={s.arithLine}>
            <span>{COLLECTION} accessions, due this season</span>
            <span>{DUE_PER_YEAR}</span>
          </p>
          <p className={s.arithLine}>
            <span>Grown out by the library itself</span>
            <span>&minus; {OWN_CAPACITY}</span>
          </p>
          <p className={s.arithLine}>
            <span>
              Grown out by members{adoptedCount > 0 ? ", including you" : ""}
            </span>
            <span>&minus; {growers}</span>
          </p>
          <p className={`${s.arithLine} ${s.arithTotal}`} aria-live="polite">
            <span>Not regrown this year</span>
            <span className={shortfall > 0 ? s.queueOver : ""}>{shortfall}</span>
          </p>
        </div>

        <p style={{ marginTop: "1rem" }}>
          Nothing visible happens to those {shortfall} this year. Nothing happens
          the year after either. That is precisely what makes them easy to lose:
          the failure is slow, and then it is a germination test at four per
          cent.
        </p>
        <p>
          It is also why the ask is a membership and a bed rather than a
          donation. Seed kept in a freezer is being spent. Seed grown in a garden
          is being made again, and it comes back adapted to the year it was grown
          in — the difference conservation work calls <em>ex situ</em> and{" "}
          <em>on-farm</em>, and the reason both are needed rather than one.
        </p>
      </div>
    </div>
  );
}
