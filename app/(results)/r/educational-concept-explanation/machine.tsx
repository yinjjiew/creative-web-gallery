"use client";

/**
 * The interactive: chart, live table, sliders, presets.
 *
 * The table and the chart are two views of one set of integer counts, so the
 * reader can check the picture against the arithmetic at any moment. The sliders
 * duplicate the chart's drag handles on purpose: dragging a small marker is the
 * wrong instrument for a keyboard, and the wrong instrument on a phone held in
 * one hand.
 */

import { useId, useRef } from "react";

import styles from "./reversal.module.css";
import MixtureChart from "./mixture-chart";
import { ARM_A, ARM_B, KIDNEY_STONES, PRESETS, STRATA } from "./data";
import {
  MIN_CELL,
  Y_MIN,
  frac,
  mix,
  overall,
  pct,
  pooled,
  rate,
  ratesOf,
  sameSetup,
  setMix,
  type Arm,
  type Rates,
  type Setup,
  verdict,
} from "./model";

type Props = {
  setup: Setup;
  onChange: (next: Setup) => void;
};

const LABELS = {
  a: ARM_A.name,
  b: ARM_B.name,
  aShort: ARM_A.short,
  bShort: ARM_B.short,
};

const STRATA_LABELS = { small: STRATA.small.name, large: STRATA.large.name };

function Slider({
  label,
  value,
  min,
  max,
  readout,
  valueText,
  onInput,
  onGestureStart,
  onGestureEnd,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  readout: string;
  valueText: string;
  onInput: (next: number) => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
}) {
  const id = useId();
  return (
    <div className={styles.control}>
      <div className={styles.controlTop}>
        <label htmlFor={id}>{label}</label>
        <span className={styles.controlValue}>{readout}</span>
      </div>
      <input
        id={id}
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        onPointerDown={onGestureStart}
        onFocus={onGestureStart}
        onBlur={onGestureEnd}
        onChange={(event) => onInput(Number(event.target.value))}
      />
    </div>
  );
}

/** A signed difference in percentage points, coloured by who is ahead. */
function Delta({ value }: { value: number }) {
  const sign = value > 0 ? "+" : value < 0 ? "\u2212" : "";
  const cls = value > 0 ? styles.armA : value < 0 ? styles.armB : styles.sub;
  return (
    <span className={cls}>
      {sign}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

export default function Machine({ setup, onChange }: Props) {
  const v = verdict(setup);
  const isPublished = sameSetup(setup, KIDNEY_STONES);
  const activePreset = PRESETS.find((preset) => sameSetup(setup, preset.setup));

  const name = (winner: "a" | "b") =>
    winner === "a" ? ARM_A.name : ARM_B.short;

  const setArm = (key: "a" | "b", arm: Arm) => onChange({ ...setup, [key]: arm });

  /* The rates as they stood when the current mix gesture began; see `setMix`. */
  const holdRef = useRef<{ arm: "a" | "b"; hold: Rates } | null>(null);

  const armRows = (
    [
      ["a", ARM_A.name, setup.a],
      ["b", ARM_B.short, setup.b],
    ] as const
  ).map(([key, label, arm]) => ({ key, label, arm }));

  const diff = (which: "small" | "large" | "all") => {
    const pick = (arm: Arm) =>
      which === "all" ? overall(arm) : rate(arm[which]);
    return (pick(setup.a) - pick(setup.b)) * 100;
  };

  const statement = () => {
    if (v.strata === "tie") {
      if (v.small === "tie" && v.large === "tie")
        return (
          <>
            The two treatments are exactly level in both kinds of case, so the
            overall rates are level too. Nothing to reverse.
          </>
        );
      return (
        <>
          The two kinds of case now disagree: {name(v.small === "a" ? "a" : "b")}{" "}
          is ahead on {STRATA.small.name} and{" "}
          {name(v.large === "a" ? "a" : "b")} on {STRATA.large.name}. There is no
          reversal to explain — the overall figure, which favours{" "}
          {v.overall === "tie" ? "neither" : name(v.overall)}, is not
          contradicting a pattern that holds throughout.
        </>
      );
    }
    const better = v.strata;
    const worse = better === "a" ? "b" : "a";
    if (v.overall === "tie")
      return (
        <>
          <em>{name(better)}</em> is better on {STRATA.small.name} and better on{" "}
          {STRATA.large.name} — and exactly level overall. One more case moved
          either way tips it.
        </>
      );
    if (v.reversed)
      return (
        <>
          <em>{name(better)}</em> is better on {STRATA.small.name} and better on{" "}
          {STRATA.large.name}, and {Math.abs(v.gapPoints).toFixed(1)} percentage
          points <em>worse</em> overall. {name(worse)} treated the easier cases:{" "}
          {pct(mix(setup[worse]))} of its patients had {STRATA.small.name}{" "}
          against {pct(mix(setup[better]))} of {name(better).toLowerCase()}
          &rsquo;s.
        </>
      );
    /* Why no reversal: either the weighting has little to work with, or the two
       bands of rates no longer overlap, so no weighting could manage one. See
       § 3 — these are the only two ways out. */
    const mixGap = Math.abs(mix(setup.a) - mix(setup.b)) * 100;
    const floor = Math.min(rate(setup[better].small), rate(setup[better].large));
    const ceiling = Math.max(rate(setup[worse].small), rate(setup[worse].large));
    return (
      <>
        <em>{name(better)}</em> is better on {STRATA.small.name}, better on{" "}
        {STRATA.large.name}, and {Math.abs(v.gapPoints).toFixed(1)} percentage
        points better overall.{" "}
        {floor > ceiling ? (
          <>
            No case mix could reverse this one: {name(better).toLowerCase()}
            &rsquo;s worse group ({pct(floor)}) beats {name(worse)}&rsquo;s
            better one ({pct(ceiling)}), and an average cannot leave the interval
            it averages over.
          </>
        ) : mixGap < 8 ? (
          <>
            The mixes are close — {pct(mix(setup.a))} against{" "}
            {pct(mix(setup.b))} — so the weighting has almost nothing to do.
          </>
        ) : (
          <>
            The mixes are still far apart — {pct(mix(setup.a))} against{" "}
            {pct(mix(setup.b))} — but the within-group gaps are now wide enough
            to survive the weighting. Pull the mixes further apart and it can
            still go.
          </>
        )}
      </>
    );
  };

  return (
    <div className={styles.machine}>
      <div className={styles.machineTop}>
        <p className={styles.machineLabel}>
          Success rate against case mix — drag the markers
        </p>
        <p
          className={`${styles.badge} ${isPublished ? styles.badgeReal : ""}`}
        >
          {isPublished
            ? "Published figures · Charig et al. 1986"
            : "Your numbers · illustrative"}
        </p>
      </div>

      <MixtureChart
        setup={setup}
        onChange={onChange}
        labels={LABELS}
        strata={STRATA_LABELS}
      />

      <p className={styles.hint}>
        Drag a filled marker sideways to change that treatment&rsquo;s case mix.
        Drag a ring handle up or down to change its success rate on one kind of
        case. Every handle takes keyboard focus: arrow keys move one case, shift
        ten, page up and page down twenty-five. Or use the sliders below.
      </p>

      <div className={styles.verdict}>
        <p className={styles.verdictText}>{statement()}</p>
        <p
          className={`${styles.stamp} ${v.reversed ? styles.stampOn : styles.stampOff}`}
          aria-live="polite"
        >
          {v.reversed ? "Reversed" : "Not reversed"}
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption>
            Live from the chart. The counts are exact; percentages are the
            fractions beside them, rounded to one decimal. The differences are
            taken from the fractions rather than from the rounded percentages, so
            they will occasionally look a tenth out against the row above.
          </caption>
          <thead>
            <tr>
              <th scope="col">Success rate</th>
              <th scope="col">{STRATA.small.name}</th>
              <th scope="col">{STRATA.large.name}</th>
              <th scope="col">all cases</th>
              <th scope="col" className={styles.mixCol}>
                case mix
              </th>
            </tr>
          </thead>
          <tbody>
            {armRows.map(({ key, label, arm }) => (
              <tr key={key}>
                <th scope="row" className={key === "a" ? styles.armA : styles.armB}>
                  <span
                    className={styles.swatch}
                    style={{
                      background: key === "a" ? "var(--a)" : "var(--b)",
                    }}
                    aria-hidden="true"
                  />
                  {label}
                </th>
                <td>
                  {pct(rate(arm.small))}{" "}
                  <span className={styles.sub}>{frac(arm.small)}</span>
                </td>
                <td>
                  {pct(rate(arm.large))}{" "}
                  <span className={styles.sub}>{frac(arm.large)}</span>
                </td>
                <td>
                  {pct(overall(arm))}{" "}
                  <span className={styles.sub}>{frac(pooled(arm))}</span>
                </td>
                <td className={`${styles.sub} ${styles.mixCol}`}>
                  {pct(mix(arm))} {STRATA.small.name}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">
                Difference{" "}
                <span className={styles.sub}>
                  ({ARM_A.short} &minus; {ARM_B.short}, points)
                </span>
              </th>
              <td>
                <Delta value={diff("small")} />
              </td>
              <td>
                <Delta value={diff("large")} />
              </td>
              <td>
                <Delta value={diff("all")} />
              </td>
              <td className={`${styles.sub} ${styles.mixCol}`}>
                <Delta value={(mix(setup.a) - mix(setup.b)) * 100} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className={styles.hint}>
        Check it: ({setup.a.small.successes} + {setup.a.large.successes}) / (
        {setup.a.small.total} + {setup.a.large.total}) ={" "}
        {frac(pooled(setup.a))} = {pct(overall(setup.a), 2)} for{" "}
        {ARM_A.name.toLowerCase()}; ({setup.b.small.successes} +{" "}
        {setup.b.large.successes}) / ({setup.b.small.total} +{" "}
        {setup.b.large.total}) = {frac(pooled(setup.b))} ={" "}
        {pct(overall(setup.b), 2)} for {ARM_B.short}.
      </p>

      <fieldset className={styles.controls}>
        <legend className={styles.controlsLegend}>
          The same six quantities, as sliders
        </legend>
        {armRows.map(({ key, label, arm }) => {
          const n = arm.small.total + arm.large.total;
          const armColour = key === "a" ? "var(--a)" : "var(--b)";
          return (
            <div
              className={styles.controlGroup}
              key={key}
              style={{ ["--arm" as string]: armColour }}
            >
              <p
                className={`${styles.controlGroupName} ${key === "a" ? styles.armA : styles.armB}`}
              >
                {label}
              </p>
              <Slider
                label={`Case mix — ${STRATA.small.name}`}
                value={arm.small.total}
                min={MIN_CELL}
                max={n - MIN_CELL}
                readout={`${arm.small.total} of ${n} · ${pct(mix(arm))}`}
                valueText={`${arm.small.total} of ${n} cases were ${STRATA.small.name}, ${pct(mix(arm))}. Overall success ${pct(overall(arm))}.`}
                onGestureStart={() => {
                  holdRef.current = { arm: key, hold: ratesOf(arm) };
                }}
                onGestureEnd={() => {
                  holdRef.current = null;
                }}
                onInput={(next) => {
                  const held = holdRef.current;
                  const hold =
                    held && held.arm === key ? held.hold : ratesOf(arm);
                  setArm(key, setMix(arm, next, hold));
                }}
              />
              {(["small", "large"] as const).map((stratum) => {
                const cell = arm[stratum];
                return (
                  <Slider
                    key={stratum}
                    label={`Successes — ${STRATA[stratum].name}`}
                    value={cell.successes}
                    min={Math.ceil(Y_MIN * cell.total)}
                    max={cell.total}
                    readout={`${frac(cell)} · ${pct(rate(cell))}`}
                    valueText={`${cell.successes} successes in ${cell.total} ${STRATA[stratum].name} cases, ${pct(rate(cell))}. Overall success ${pct(overall(arm))}.`}
                    onInput={(next) =>
                      setArm(key, {
                        ...arm,
                        [stratum]: { total: cell.total, successes: next },
                      })
                    }
                  />
                );
              })}
            </div>
          );
        })}
      </fieldset>

      <div className={styles.presets}>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`${styles.preset} ${activePreset?.id === preset.id ? styles.presetActive : ""}`}
            aria-pressed={activePreset?.id === preset.id}
            onClick={() => onChange(preset.setup)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className={styles.presetNote}>
        {activePreset
          ? `${activePreset.note}${activePreset.real ? "" : " — illustrative"}`
          : "Your own numbers — illustrative. The stone-size split is real; these counts are not."}
      </p>
    </div>
  );
}
