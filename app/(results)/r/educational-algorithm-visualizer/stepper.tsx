"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fmtChar,
  fmtSteps,
  highlight,
  run,
  type Event,
  type Run,
} from "./engine";
import s from "./essay.module.css";

export type Demo = {
  pattern: string;
  input: string;
  label?: string;
};

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function maxVisit(visits: number[]): number {
  let m = 1;
  for (const v of visits) if (v > m) m = v;
  return m;
}

export function HeatTape({
  input,
  visits,
  cursor,
  eatenTo,
}: {
  input: string;
  visits: number[];
  cursor?: number;
  eatenTo?: number;
}) {
  const peak = maxVisit(visits);
  if (input.length === 0) {
    return (
      <div className={s.tape} aria-hidden="true">
        <div className={s.cell}>
          <span className={s.cellCh}>ε</span>
          <span className={s.cellIx}>end</span>
        </div>
      </div>
    );
  }
  return (
    <div className={s.tape} role="img" aria-label="Input characters and how often the engine visited each">
      {Array.from(input).map((ch, i) => {
        const v = visits[i] ?? 0;
        const h = v === 0 ? 0 : Math.max(0.12, v / peak);
        return (
          <div
            key={i}
            className={`${s.cell} ${cursor === i ? s.cellOn : ""} ${
              eatenTo !== undefined && i < eatenTo ? s.cellEaten : ""
            }`}
            title={`${fmtChar(ch)} · index ${i} · visited ${v} time${v === 1 ? "" : "s"}`}
          >
            <span className={s.cellTrack} aria-hidden="true">
              {v > 0 ? (
                <span className={s.cellBar} style={{ height: `${Math.round(h * 100)}%` }} />
              ) : null}
            </span>
            <span className={s.cellCh}>{fmtChar(ch)}</span>
            <span className={s.cellIx}>{v || "·"}</span>
          </div>
        );
      })}
    </div>
  );
}

function PatternView({ pattern, ev }: { pattern: string; ev?: Event }) {
  if (!ev || ev.to <= ev.from) {
    return <div className={s.pat}>{pattern || "∅"}</div>;
  }
  const { before, mid, after } = highlight(pattern, ev.from, ev.to);
  return (
    <div className={s.pat} aria-label={`Pattern, current piece ${mid || "none"}`}>
      {before}
      {mid ? <span className={s.patMid}>{mid}</span> : null}
      {after}
    </div>
  );
}

export function Stepper({
  initial,
  editable = false,
  presets,
}: {
  initial: Demo;
  editable?: boolean;
  presets?: Demo[];
}) {
  const [pattern, setPattern] = useState(initial.pattern);
  const [input, setInput] = useState(initial.input);
  const [preset, setPreset] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const region = useRef<HTMLDivElement>(null);

  const result: Run = useMemo(
    () => run(pattern, input, { stepLimit: 40_000, eventLimit: 1_800 }),
    [pattern, input],
  );

  const events = result.events;
  const last = Math.max(0, events.length - 1);
  const ev = events[Math.min(i, last)];

  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [pattern, input]);

  useEffect(() => {
    if (!playing) return;
    if (reduceMotion()) {
      setI(last);
      setPlaying(false);
      return;
    }
    if (i >= last) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setI((x) => Math.min(x + 1, last)), 160);
    return () => window.clearTimeout(id);
  }, [playing, i, last]);

  const go = useCallback(
    (n: number) => {
      setPlaying(false);
      setI(Math.max(0, Math.min(n, last)));
    },
    [last],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(last);
    }
  };

  const load = (d: Demo, idx: number) => {
    setPattern(d.pattern);
    setInput(d.input);
    setPreset(idx);
  };

  return (
    <div
      className={s.figure}
      ref={region}
      tabIndex={0}
      onKeyDown={onKey}
      role="region"
      aria-label="Backtracking stepper"
    >
      <p className={s.figLabel}>The engine, one decision at a time</p>
      {presets && presets.length > 0 ? (
        <div className={s.presets} role="group" aria-label="Worked examples">
          {presets.map((d, idx) => (
            <button
              key={d.label ?? d.pattern}
              type="button"
              className={`${s.chip} ${preset === idx ? s.chipOn : ""}`}
              onClick={() => load(d, idx)}
            >
              {d.label ?? d.pattern}
            </button>
          ))}
        </div>
      ) : null}
      {editable ? (
        <div className={s.fields}>
          <div className={s.field}>
            <label htmlFor="rx-pat">Pattern</label>
            <input
              id="rx-pat"
              className={s.input}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value);
                setPreset(-1);
              }}
            />
          </div>
          <div className={s.field}>
            <label htmlFor="rx-in">Input</label>
            <input
              id="rx-in"
              className={s.input}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setPreset(-1);
              }}
            />
          </div>
        </div>
      ) : null}
      {result.error ? <p className={s.err}>{result.error}</p> : null}
      <PatternView pattern={pattern} ev={ev} />
      <HeatTape
        input={input}
        visits={visitsUpTo(result, i)}
        cursor={ev?.sp < input.length ? ev.sp : undefined}
        eatenTo={ev?.sp}
      />
      <div className={s.status}>
        <span>
          step {Math.min(i + 1, events.length)} / {events.length || 0}
        </span>
        <span className={result.matched ? s.statusOk : s.statusFail}>
          {result.capped
            ? "capped"
            : result.matched
              ? `matched ${result.span?.[0]}–${result.span?.[1]}`
              : "no match"}
        </span>
        <span>{fmtSteps(result.steps)} steps in full</span>
        <span>NFA {fmtSteps(result.nfaSteps)}</span>
      </div>
      <p className={s.caption} aria-live="polite">
        {ev?.detail ?? "Run a pattern to see the engine move."}
      </p>
      <div className={s.controls}>
        <button type="button" className={s.btn} onClick={() => go(0)} disabled={i === 0}>
          Start
        </button>
        <button type="button" className={s.btn} onClick={() => go(i - 1)} disabled={i === 0}>
          Back
        </button>
        <button type="button" className={s.btn} onClick={() => go(i + 1)} disabled={i >= last}>
          Next
        </button>
        <button
          type="button"
          className={`${s.btn} ${playing ? s.btnOn : ""}`}
          onClick={() => setPlaying((p) => !p)}
          disabled={last === 0}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <span className={s.hint}>← → when this figure is focused</span>
      </div>
    </div>
  );
}

/** Visits implied by events up to index `upto`, so the heat grows as you step. */
function visitsUpTo(result: Run, upto: number): number[] {
  const v = Array.from({ length: result.visits.length }, () => 0);
  for (let k = 0; k <= upto && k < result.events.length; k++) {
    const ev = result.events[k];
    if (ev.verb === "eat" && ev.sp > 0) {
      const ix = ev.sp - 1;
      if (ix < v.length) v[ix]++;
    }
  }
  return v;
}
