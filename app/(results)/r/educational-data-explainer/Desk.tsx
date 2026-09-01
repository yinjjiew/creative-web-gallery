"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Board from "./Board";
import Week from "./Week";
import {
  DEFAULT_MIX,
  KIND_GAS,
  KIND_OUT,
  PRESETS,
  mixesEqual,
  simulate,
  type Mix,
} from "./model";
import { formatStamp, hourIndex } from "./series";
import styles from "./grid.module.css";

const DURATIONS = [1, 2, 4, 8, 12, 24, 40, 48, 72, 120, 160, 168];

const SAME_ENERGY: { label: string; battGw: number; battHours: number }[] = [
  { label: "20 GW × 2 h", battGw: 20, battHours: 2 },
  { label: "5 GW × 8 h", battGw: 5, battHours: 8 },
  { label: "1 GW × 40 h", battGw: 1, battHours: 40 },
  { label: "0.25 GW × 160 h", battGw: 0.25, battHours: 160 },
];

function pct(x: number): string {
  return `${Math.round(x * 1000) / 10}%`;
}

function gw(x: number): string {
  const n = Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2);
  return `${n} GW`;
}

function twh(x: number): string {
  return `${x.toFixed(1)} TWh`;
}

function durationLabel(h: number): string {
  if (h < 24) return `${h} h`;
  if (h % 24 === 0) return `${h / 24} d`;
  return `${h} h`;
}

export default function Desk() {
  const [mix, setMix] = useState<Mix>(DEFAULT_MIX);
  const [selected, setSelected] = useState(() => hourIndex(5, 1, 12));
  const [weekAt, setWeekAt] = useState<number | null>(null);
  const run = useMemo(() => simulate(mix), [mix]);
  const weekStart = weekAt ?? run.worstWeekAt;

  const set = (patch: Partial<Mix>) => {
    setMix((m) => ({ ...m, ...patch }));
    setWeekAt(null);
  };

  const onSelect = (hour: number) => {
    setSelected(hour);
    setWeekAt(Math.max(0, hour - 36));
  };

  const kind = run.kind[selected];
  const hourWord =
    kind === KIND_OUT ? "dark" : kind === KIND_GAS ? "on, from gas" : "on, from low-carbon";

  const headline =
    run.hoursOut > 0
      ? "The lights went out."
      : run.hoursGas > 0
        ? "The lights stayed on. You burned gas."
        : "The lights stayed on without gas.";

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <p className={styles.kicker}>
          <span>Great Britain · 2024</span>
          <span>8,784 hours</span>
          <span>NESO outturn, not a model year</span>
        </p>
        <h1 className={styles.title}>Grid</h1>
        <p className={styles.deck}>
          Public debate keeps one number: the annual percentage of electricity
          from renewables. A grid has to match supply to demand in{" "}
          <em>every hour</em>. Build a mix. The lamps are the hours.
        </p>

        <p className={styles.legend}>
          <span>
            <i className={`${styles.swatch} ${styles.swatchLow}`} />
            Low-carbon kept the lights on
          </span>
          <span>
            <i className={`${styles.swatch} ${styles.swatchGas}`} />
            Gas filled the hour
          </span>
          <span>
            <i className={`${styles.swatch} ${styles.swatchOut}`} />
            Unserved — a blackout
          </span>
        </p>

        <div className={styles.boardFrame}>
          <Board run={run} selected={selected} onSelect={onSelect} />
          <p className={styles.boardHint}>
            <span>
              {run.hoursOut.toLocaleString("en-GB")} hours dark · wind and
              solar {pct(run.renewableShare)} of annual demand
            </span>
            <span>
              Tap a cell or use arrow keys · {formatStamp(selected)}
            </span>
          </p>
        </div>

        <section className={styles.mix} aria-labelledby="mix-title">
          <div className={styles.mixHead}>
            <h2 id="mix-title" className={styles.mixTitle}>
              Your mix
            </h2>
            <div className={styles.presets} role="group" aria-label="Presets">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.preset}
                  aria-pressed={mixesEqual(mix, p.mix)}
                  onClick={() => {
                    setMix(p.mix);
                    setWeekAt(null);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sliders}>
            <Slider
              label="Solar"
              value={mix.solarGw}
              max={80}
              step={1}
              onChange={(solarGw) => set({ solarGw })}
              output={`${mix.solarGw.toFixed(0)} GW`}
            />
            <Slider
              label="Wind"
              value={mix.windGw}
              max={80}
              step={1}
              onChange={(windGw) => set({ windGw })}
              output={`${mix.windGw.toFixed(0)} GW`}
            />
            <Slider
              label="Nuclear"
              value={mix.nuclearGw}
              max={24}
              step={0.1}
              onChange={(nuclearGw) => set({ nuclearGw })}
              output={`${mix.nuclearGw.toFixed(1)} GW`}
            />
            <Slider
              label="Gas"
              value={mix.gasGw}
              max={40}
              step={1}
              onChange={(gasGw) => set({ gasGw })}
              output={`${mix.gasGw.toFixed(0)} GW`}
            />
            <Slider
              label="Battery power"
              value={mix.battGw}
              max={30}
              step={0.25}
              onChange={(battGw) => set({ battGw })}
              output={`${mix.battGw.toFixed(2)} GW`}
            />
            <Slider
              label="Battery duration"
              value={Math.max(0, DURATIONS.indexOf(mix.battHours))}
              max={DURATIONS.length - 1}
              step={1}
              onChange={(i) => set({ battHours: DURATIONS[i] ?? 2 })}
              output={durationLabel(mix.battHours)}
            />
          </div>

          <p className={styles.inspect}>
            <strong>{formatStamp(selected)}</strong> is {hourWord}. Demand{" "}
            {gw(run.demand[selected])}. Solar {gw(run.solar[selected])}, wind{" "}
            {gw(run.wind[selected])}, nuclear {gw(run.nuclear[selected])}
            {run.gas[selected] > 0.05 ? `, gas ${gw(run.gas[selected])}` : ""}
            {run.unserved[selected] > 0.05
              ? `, unserved ${gw(run.unserved[selected])}`
              : ""}
            . Battery holds {mix.battGw > 0 ? `${(mix.battGw * mix.battHours).toFixed(1)} GWh` : "nothing"}{" "}
            ({mix.battHours} h at {mix.battGw} GW).
          </p>
        </section>

        <div className={styles.headline}>
          <div>
            <p className={styles.hoursOut} aria-live="polite">
              {run.hoursOut > 0 ? (
                <>
                  <strong>{run.hoursOut.toLocaleString("en-GB")}</strong> hours
                  dark
                </>
              ) : (
                <strong>{headline}</strong>
              )}
            </p>
            <p className={styles.hoursNote}>
              {run.hoursOut > 0
                ? `${headline} Longest stretch ${run.longestDark} h, from ${formatStamp(run.longestDarkAt)}. Wind and solar generated ${pct(run.renewableShare)} of annual demand.`
                : `Wind and solar generated ${pct(run.renewableShare)} of annual demand. ${run.hoursGas > 0 ? `Gas ran in ${run.hoursGas.toLocaleString("en-GB")} hours.` : "No hour needed gas."}`}
            </p>
          </div>
          <dl className={styles.stats}>
            <div>
              <dt>Demand in this year</dt>
              <dd>{twh(run.demandTwh)}</dd>
            </div>
            <div>
              <dt>Unserved</dt>
              <dd>{twh(run.unservedTwh)}</dd>
            </div>
            <div>
              <dt>Gas burned</dt>
              <dd>{twh(run.gasTwh)}</dd>
            </div>
            <div>
              <dt>Curtailed surplus</dt>
              <dd>{twh(run.curtailedTwh)}</dd>
            </div>
            <div>
              <dt>Low-carbon / demand</dt>
              <dd>{pct(run.lowcarbonShare)}</dd>
            </div>
            <div>
              <dt>Hours on gas</dt>
              <dd>{run.hoursGas.toLocaleString("en-GB")}</dd>
            </div>
          </dl>
        </div>

        <section className={styles.section} aria-labelledby="hard-title">
          <span className={styles.sectionNum}>The hard hours</span>
          <h2 id="hard-title" className={styles.h2}>
            The year can look fine. A week in November does not.
          </h2>
          <p className={styles.p}>
            In this record the stillest week begins on 3 November 2024: wind and
            solar together averaged 3.5&nbsp;GW against 31&nbsp;GW of demand.
            That is not a modelling assumption. It is what the meters did. A
            two-hour battery, sized for the evening peak, is empty by the second
            still night. The evening-battery and still-week presets use the
            same generation fleet — 40&nbsp;GW solar, 70&nbsp;GW wind, 16&nbsp;GW
            nuclear — and only the battery hours change.
          </p>
          <Week run={run} start={weekStart} />
        </section>

        <section className={styles.section} aria-labelledby="dur-title">
          <span className={styles.sectionNum}>Duration is not capacity</span>
          <h2 id="dur-title" className={styles.h2}>
            Four batteries, each 40 GWh
          </h2>
          <p className={styles.p}>
            Public reasoning treats storage as a pile of energy. Power and
            hours are different machines. These four hold the same 40&nbsp;GWh.
            Watch the lamps, especially November.
          </p>
          <div className={styles.durationRow} role="group" aria-label="40 GWh batteries">
            {SAME_ENERGY.map((b) => (
              <button
                key={b.label}
                type="button"
                className={styles.preset}
                aria-pressed={
                  mix.battGw === b.battGw && mix.battHours === b.battHours
                }
                onClick={() => set({ battGw: b.battGw, battHours: b.battHours })}
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="ok-title">
          <span className={styles.sectionNum}>Why this is tractable</span>
          <h2 id="ok-title" className={styles.h2}>
            The last hours are finite, and they have names
          </h2>
          <p className={styles.p}>
            Getting the annual percentage up is the first eighty. The last
            twenty is a short list of still, cold hours. In this year they
            cluster in late autumn and winter evenings. They close with firm
            low-carbon (nuclear, or gas with a carbon price and a plan), with
            storage whose duration matches the gap — days, not the tea-time
            peak — and with things this page leaves out on purpose:
            interconnectors, demand that can wait, the biomass and hydro
            already on the system.
          </p>
          <p className={styles.p}>
            Overbuilding wind helps the average more than it helps a still
            week: capacity factor is a weather fact, not a fleet-size fact.
            Imports helped in 2024 — the NESO mix shows a mean 5.0&nbsp;GW of
            interconnector import, a peak of 9.1&nbsp;GW — but a high-pressure
            cell over the North Sea is often regional. Do not count a neighbour
            as firm capacity. The honest version of optimism is: the hard hours
            are known, they are not most hours, and they are an engineering
            problem rather than a reason to stop building solar.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="data-title">
          <span className={styles.sectionNum}>What this is, and is not</span>
          <h2 id="data-title" className={styles.h2}>
            Provenance
          </h2>
          <div className={styles.notes}>
            <p>
              Demand, embedded wind and embedded solar are NESO Historic Demand
              Data 2024 (resource{" "}
              <code>f6d02c0f-957b-48cb-82ee-09003f2ba759</code>). Underlying
              demand is National Demand plus embedded wind plus embedded solar,
              so rooftop PV is not hidden as missing load. Solar output is
              NESO&rsquo;s estimate of embedded PV divided by the
              contemporaneous embedded solar capacity in that file (16.8–18.7
              GW through the year). NESO states that the true output of those
              generators is not metered.
            </p>
            <p>
              Transmission-connected wind and nuclear are NESO Historic GB
              Generation Mix (resource{" "}
              <code>f93d1835-75bc-43e5-84ad-12472b180a98</code>). Wind on the
              slider is that Balancing Mechanism wind plus NESO embedded wind.
              Half-hours from 1 January to 31 December 2024 are averaged to
              Europe/London civil hours (8,784 hours; the spring-forward gap is
              interpolated from its neighbours).
            </p>
            <p>
              Wind gigawatts use 29.0 GW as the 2024 GB nameplate for scaling.
              DESNZ Energy Trends, March 2025, Table 6.1: 4.2 GW of new UK
              renewable capacity in 2024, of which 2.2 GW was wind, and 60.7 GW
              of UK renewables at year end. UK wind nameplate at end-2024 is
              30.9 GW in that capacity series; Northern Ireland is outside this
              GB NESO record; mid-year GB is about 29 GW. The{" "}
              <em>shape</em> is measured. The gigawatt label is that conversion
              — if the true mid-year nameplate was a gigawatt different, every
              wind slider mark is off by about three percent. Nuclear
              availability is 2024 NESO nuclear output divided by 5.88 GW
              (DESNZ/DUKES UK nuclear capacity; all of it sits on the GB
              system).
            </p>
            <p>
              This reconstruction: 262 TWh demand, 83 TWh wind, 14 TWh solar,
              38 TWh nuclear. DESNZ Energy Trends March 2025, for the UK rather
              than GB, gives 84.1 TWh wind, 14.8 TWh solar, 40.6 TWh nuclear.
              Same year, different perimeter.
            </p>
            <p>
              Left out, on purpose: transmission constraints, inertia, reserve
              margins, interconnectors, hydro (mean 0.4 GW in the mix), biomass
              (mean 2.1 GW), and the existing pumped-storage fleet (~3 GW /
              ~25 GWh — a short battery you can add above). Demand does not
              respond. The battery is greedy, 85% round-trip, no foresight; the
              year is run twice so the starting charge is last year&rsquo;s
              ending charge. Gas has no ramp or minimum-run constraint. A
              reader should not leave thinking they have dispatched a real
              system. They should leave knowing why the annual percentage is
              the wrong object, and that the remaining hours are a duration
              problem.
            </p>
          </div>
        </section>
      </div>

      <p className={styles.live} aria-live="polite">
        {run.hoursOut} hours unserved. Annual wind and solar {pct(run.renewableShare)} of
        demand.
      </p>
      <Link className={styles.escape} href="/tasks/educational-data-explainer">
        Task
      </Link>
    </div>
  );
}

function Slider({
  label,
  value,
  max,
  step,
  onChange,
  output,
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  output: string;
}) {
  const id = `mix-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className={styles.slider}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        suppressHydrationWarning
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output htmlFor={id}>{output}</output>
    </div>
  );
}
