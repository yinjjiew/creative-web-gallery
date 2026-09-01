"use client";

/**
 * Sizing, which the brief names as the main barrier to buying an expensive coat
 * unseen — so it gets a working instrument rather than a size chart.
 *
 * The primary route asks the visitor to measure a coat they already own, because
 * that is the only comparison that removes guesswork: a tape laid on a coat that
 * fits is worth more than body measurements taken at home over a jumper. The
 * secondary route, for someone with nothing to measure, is body chest and a
 * question about what they wear underneath.
 *
 * The output is deliberately not a single confident answer. It shows the signed
 * difference for every measurement given, names the runner-up when it is close,
 * states what it cannot know, and ends by sending you to the free paper pattern.
 */
import { useId, useMemo, useState } from "react";

import { CoatFlat } from "./figures";
import { EASE_CM, fromBodyChest, recommend, SIZES, type OwnCoat } from "./data/fit";
import s from "./mill.module.css";

type Route = "own" | "chest";

const MEASURES: { key: keyof OwnCoat; label: string; hint: string }[] = [
  {
    key: "chest",
    label: "Chest, flat × 2",
    hint: "Across, one inch below the armhole, then doubled.",
  },
  {
    key: "shoulder",
    label: "Shoulder to shoulder",
    hint: "Seam to seam across the back. The one we cannot alter.",
  },
  {
    key: "sleeve",
    label: "Centre back to cuff",
    hint: "Middle of the collar seam, along the shoulder, to the cuff edge.",
  },
  {
    key: "length",
    label: "Shoulder to hem",
    hint: "Highest point of the shoulder seam straight down.",
  },
];

function parse(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function FitTool() {
  const id = useId();
  const [route, setRoute] = useState<Route>("own");
  const [own, setOwn] = useState<Record<keyof OwnCoat, string>>({
    chest: "",
    shoulder: "",
    sleeve: "",
    length: "",
  });
  const [bodyChest, setBodyChest] = useState("");
  const [overJacket, setOverJacket] = useState(true);

  const parsed = useMemo<OwnCoat>(
    () => ({
      chest: parse(own.chest),
      shoulder: parse(own.shoulder),
      sleeve: parse(own.sleeve),
      length: parse(own.length),
    }),
    [own]
  );

  const verdict = useMemo(() => recommend(parsed), [parsed]);
  const chestValue = parse(bodyChest);
  const fromChest = chestValue === null ? null : fromBodyChest(chestValue, overJacket);

  const outOfRange =
    chestValue !== null && (chestValue < 78 || chestValue > 132) ? chestValue : null;

  return (
    <div className={s.form}>
      <div className={s.twoUp}>
        <div>
          <fieldset className={s.radioSet}>
            <legend>Which do you have</legend>
            <label className={s.radio}>
              <input
                type="radio"
                name={`${id}-route`}
                checked={route === "own"}
                onChange={() => {
                  setRoute("own");
                }}
              />
              <span>
                A coat that already fits me, and a tape measure. This is the one
                that works.
              </span>
            </label>
            <label className={s.radio}>
              <input
                type="radio"
                name={`${id}-route`}
                checked={route === "chest"}
                onChange={() => {
                  setRoute("chest");
                }}
              />
              <span>Only my chest measurement.</span>
            </label>
          </fieldset>

          {route === "own" ? (
            <>
              <div className={s.fieldRow}>
                {MEASURES.slice(0, 2).map((measure) => (
                  <div className={s.field} key={measure.key}>
                    <label htmlFor={`${id}-${measure.key}`}>
                      {measure.label}
                      <span className={s.hint}>{measure.hint}</span>
                    </label>
                    <input
                      id={`${id}-${measure.key}`}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="cm"
                      value={own[measure.key]}
                      onChange={(event) => {
                        setOwn((was) => ({ ...was, [measure.key]: event.target.value }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className={s.fieldRow}>
                {MEASURES.slice(2).map((measure) => (
                  <div className={s.field} key={measure.key}>
                    <label htmlFor={`${id}-${measure.key}`}>
                      {measure.label}
                      <span className={s.hint}>{measure.hint}</span>
                    </label>
                    <input
                      id={`${id}-${measure.key}`}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="cm"
                      value={own[measure.key]}
                      onChange={(event) => {
                        setOwn((was) => ({ ...was, [measure.key]: event.target.value }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className={s.scrollNote}>
                Give us whichever you have. Two is useful, four is better.
              </p>
            </>
          ) : (
            <>
              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label htmlFor={`${id}-body`}>
                    Chest, around the fullest part
                    <span className={s.hint}>
                      Over a shirt, tape level, breathing out.
                    </span>
                  </label>
                  <input
                    id={`${id}-body`}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="cm"
                    value={bodyChest}
                    onChange={(event) => {
                      setBodyChest(event.target.value);
                    }}
                  />
                </div>
              </div>
              <label className={s.radio} style={{ marginTop: "0.7rem" }}>
                <input
                  type="checkbox"
                  checked={overJacket}
                  onChange={(event) => {
                    setOverJacket(event.target.checked);
                  }}
                />
                <span>
                  I would wear a jacket under it. This coat is cut with{" "}
                  {String(EASE_CM)} cm of ease, which is a jacket&rsquo;s worth; if
                  you never wear one, say so and we will size down.
                </span>
              </label>
            </>
          )}
        </div>

        <div>
          <p className={s.h4}>Where to put the tape</p>
          <CoatFlat mode="measure" colour="#dbd7cc" />
        </div>
      </div>

      {route === "own" && verdict ? (
        <div className={s.verdict}>
          <div className={s.verdictHead}>
            <span className={s.verdictLabel}>Nearest size</span>
            <span className={s.verdictSize}>{verdict.size.size}</span>
          </div>
          <div className={s.verdictBody}>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption>Ours against yours, centimetres</caption>
                <thead>
                  <tr>
                    <th scope="col">Measurement</th>
                    <th scope="col" className={s.n}>
                      Size {verdict.size.size}
                    </th>
                    <th scope="col" className={s.n}>
                      Yours
                    </th>
                    <th scope="col" className={s.n}>
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {verdict.deltas.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td className={s.n}>{row.ours.toFixed(1)}</td>
                      <td className={s.n}>{row.theirs.toFixed(1)}</td>
                      <td className={s.n}>
                        {row.delta > 0 ? "+" : ""}
                        {row.delta.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {verdict.alternative ? (
              <p className={s.caption}>
                Size {verdict.alternative.size} is almost as close. If you are
                between the two, take {verdict.alternative.size} when you want
                room for a jacket and {verdict.size.size} when you do not — and
                say so when you join the list, because we cut to order.
              </p>
            ) : null}

            <ul className={s.cautions}>
              {verdict.cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {route === "chest" && fromChest ? (
        <div className={s.verdict}>
          <div className={s.verdictHead}>
            <span className={s.verdictLabel}>Nearest size</span>
            <span className={s.verdictSize}>{fromChest.size}</span>
          </div>
          <div className={s.verdictBody}>
            <p className={s.caption}>
              Size {fromChest.size} is cut for a {String(fromChest.fitsChest)} cm
              chest and measures {fromChest.chest.toFixed(0)} cm round the garment
              — {overJacket ? String(EASE_CM) : String(EASE_CM - 5)} cm more than
              your{overJacket ? " chest, which is the room a jacket needs" : " chest"}.
              Its sleeve is {fromChest.sleeve.toFixed(1)} cm from the centre back
              and it is {String(fromChest.length)} cm long, which is just below the
              knee on someone 178 cm tall.
            </p>
            <ul className={s.cautions}>
              <li>
                One body measurement is the weakest thing you can order from.
                Chest tells us nothing about your shoulder width, and the shoulder
                is the only part of a made coat that cannot be altered.
              </li>
              <li>
                Before you pay anything, ask for the paper pattern. It is free, it
                arrives in a tube, and it settles this properly.
              </li>
              {outOfRange !== null ? (
                <li>
                  {outOfRange} cm is outside the seven sizes we grade, which run
                  from 91 to 121 cm. That is what made-to-measure is for: £180 on
                  top, and it takes the same time.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      <p className={s.h4}>The seven sizes, as the coat measures</p>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption>
            Garment measurements in centimetres, taken flat. Not body
            measurements.
          </caption>
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col" className={s.n}>
                Fits chest
              </th>
              <th scope="col" className={s.n}>
                Chest
              </th>
              <th scope="col" className={s.n}>
                Shoulder
              </th>
              <th scope="col" className={s.n}>
                Back–cuff
              </th>
              <th scope="col" className={s.n}>
                Length
              </th>
              <th scope="col" className={s.n}>
                Sweep
              </th>
              <th scope="col" className={s.n}>
                Cut this clip
              </th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((row) => {
              const here =
                (route === "own" && verdict?.size.size === row.size) ||
                (route === "chest" && fromChest?.size === row.size);
              return (
                <tr key={row.size} className={here ? s.here : undefined}>
                  <th scope="row">{row.size}</th>
                  <td className={s.n}>{row.fitsChest}</td>
                  <td className={s.n}>{row.chest}</td>
                  <td className={s.n}>{row.shoulder.toFixed(1)}</td>
                  <td className={s.n}>{row.sleeve.toFixed(1)}</td>
                  <td className={s.n}>{row.length}</td>
                  <td className={s.n}>{row.sweep}</td>
                  <td className={s.n}>{row.cutThisClip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={s.scrollNote}>Table scrolls sideways.</p>
      <p className={s.caption}>
        Nothing you type here leaves your browser. The recommendation is a
        weighted comparison of your figures against the seven graded sizes, with
        the shoulder counted heaviest because it is the measurement we cannot
        change once the coat is made, and the sleeve counted lightest because we
        change it for nothing.
      </p>
    </div>
  );
}
