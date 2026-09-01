"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Sound } from "./audio";
import Chart from "./Chart";
import {
  DIRS,
  PHASE,
  PHASE_LONG,
  clone,
  initial,
  markOf,
  move,
  wait,
  type Dir,
  type Event,
  type State,
} from "./engine";
import { LEVELS, loadSave, writeSave } from "./levels";
import s from "./tide.module.css";

const KEY: Record<string, Dir | "wait" | "undo" | "reset" | "next"> = {
  ArrowUp: DIRS.n!,
  ArrowDown: DIRS.s!,
  ArrowLeft: DIRS.w!,
  ArrowRight: DIRS.e!,
  w: DIRS.n!,
  a: DIRS.w!,
  s: DIRS.s!,
  d: DIRS.e!,
  W: DIRS.n!,
  A: DIRS.w!,
  S: DIRS.s!,
  D: DIRS.e!,
  " ": "wait",
  ".": "wait",
  Spacebar: "wait",
  z: "undo",
  Z: "undo",
  Backspace: "undo",
  r: "reset",
  R: "reset",
  Enter: "next",
};

function voice(events: Event[], sound: Sound) {
  for (const e of events) {
    if (e === "walk") sound.play("step");
    if (e === "sail" || e === "ride") sound.play("water");
    if (e === "embark" || e === "disembark") sound.play("hull");
    if (e === "push") sound.play("push");
    if (e === "hw" || e === "lw") sound.play("bell");
    if (e === "overboard") sound.play("over");
    if (e === "land") sound.play("land");
    if (e === "undo" || e === "reset") sound.play("undo");
  }
}

export default function Tide() {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<State>(() => initial(LEVELS[0]!));
  const [done, setDone] = useState<number[]>([]);
  const [muted, setMuted] = useState(false);
  const [histLen, setHistLen] = useState(0);
  const history = useRef<State[]>([]);
  const sound = useRef(new Sound());
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const level = LEVELS[index]!;

  const boot = useCallback(() => {
    const save = loadSave();
    setDone(save.done);
    setIndex(save.plate);
    const lv = LEVELS[save.plate]!;
    setState(initial(lv));
    history.current = [];
    setHistLen(0);
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    writeSave({ done, plate: index });
  }, [done, index]);

  const apply = useCallback(
    (next: State, events: Event[], record: boolean) => {
      if (record) {
        history.current.push(clone(state));
        setHistLen(history.current.length);
      }
      setState(next);
      sound.current.setTide(markOf(next.phase));
      voice(events, sound.current);
      if (next.won) {
        setDone((d) => (d.includes(index) ? d : [...d, index]));
      }
    },
    [index, state]
  );

  const actMove = useCallback(
    (dir: Dir) => {
      sound.current.ensure();
      const r = move(level, state, dir);
      if (!r.ok) {
        voice(r.events, sound.current);
        return;
      }
      apply(r.state, r.events, true);
    },
    [apply, level, state]
  );

  const actWait = useCallback(() => {
    sound.current.ensure();
    const r = wait(level, state);
    if (!r.ok) return;
    apply(r.state, r.events, true);
  }, [apply, level, state]);

  const actUndo = useCallback(() => {
    sound.current.ensure();
    const prev = history.current.pop();
    if (!prev) return;
    setHistLen(history.current.length);
    setState(prev);
    sound.current.play("undo");
    sound.current.setTide(markOf(prev.phase));
  }, []);

  const actReset = useCallback(() => {
    sound.current.ensure();
    history.current = [];
    setHistLen(0);
    setState(initial(level));
    sound.current.play("undo");
    sound.current.setTide(markOf(level.phase));
  }, [level]);

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(LEVELS.length - 1, i));
      setIndex(n);
      history.current = [];
      setHistLen(0);
      setState(initial(LEVELS[n]!));
    },
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const hit = KEY[e.key];
      if (!hit) return;
      e.preventDefault();
      sound.current.ensure();
      if (hit === "wait") actWait();
      else if (hit === "undo") actUndo();
      else if (hit === "reset") actReset();
      else if (hit === "next") {
        if (state.won) go(index + 1);
      } else actMove(hit);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actMove, actReset, actUndo, actWait, go, index, state.won]);

  const onPointerDown = (e: React.PointerEvent) => {
    sound.current.ensure();
    swipe.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < 24 && ay < 24) {
      actWait();
      return;
    }
    if (ax > ay) actMove(dx > 0 ? DIRS.e! : DIRS.w!);
    else actMove(dy > 0 ? DIRS.s! : DIRS.n!);
  };

  const mark = markOf(state.phase);
  const nextPhase = (state.phase + 1) % 6;
  const live = state.failed
    ? "Overboard. Undo or reset."
    : state.won
      ? `Made good. ${level.harbour}.`
      : `${PHASE_LONG[state.phase]}. Mark ${mark}.`;

  return (
    <div className={s.sheet}>
      <header className={s.mast}>
        <div className={s.brand}>
          <div className={s.kicker}>Admiralty · modelled cycle</div>
          <h1 className={s.title}>Tide</h1>
          <div className={s.plateName}>
            {level.harbour} — {level.title}
          </div>
        </div>
        <div className={s.meta}>
          Plate {level.plate} of {LEVELS.length}
          <br />
          Mark {mark} · {PHASE_LONG[state.phase]}
          <br />
          Next {PHASE[nextPhase]} · mark {markOf(nextPhase)}
        </div>
      </header>

      <p className={s.teach}>{level.teach}</p>

      <div className={s.tableWrap}>
        <TideTable phase={state.phase} />
      </div>

      <div className={s.stage}>
        <div
          className={s.chartWrap}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          <Chart level={level} state={state} reduce={reduce} />
        </div>
      </div>

      {(state.won || state.failed) && (
        <div className={s.stamp} aria-hidden="true">
          <strong>{state.won ? "Made good." : "Overboard."}</strong>
          <span>
            {state.won
              ? index < LEVELS.length - 1
                ? "Enter — next plate"
                : "The harbour is finished"
              : "Z undo · R reset"}
          </span>
        </div>
      )}

      <footer className={s.rail}>
        <div className={s.dpad} aria-label="Move">
          <button type="button" className={`${s.btn} ${s.n}`} onClick={() => actMove(DIRS.n!)}>
            N
          </button>
          <button type="button" className={`${s.btn} ${s.w}`} onClick={() => actMove(DIRS.w!)}>
            W
          </button>
          <button
            type="button"
            className={`${s.btn} ${s.wait}`}
            data-hot="true"
            onClick={actWait}
          >
            Wait
          </button>
          <button type="button" className={`${s.btn} ${s.e}`} onClick={() => actMove(DIRS.e!)}>
            E
          </button>
          <button type="button" className={`${s.btn} ${s.s}`} onClick={() => actMove(DIRS.s!)}>
            S
          </button>
        </div>

        <div className={s.pads}>
          <button type="button" className={s.btn} onClick={actUndo} disabled={histLen === 0}>
            Undo
          </button>
          <button type="button" className={s.btn} onClick={actReset}>
            Reset
          </button>
          <button
            type="button"
            className={s.btn}
            onClick={() => go(index + 1)}
            disabled={!state.won || index >= LEVELS.length - 1}
          >
            Next
          </button>
        </div>

        <div className={s.plates} aria-label="Plates">
          {LEVELS.map((lv, i) => (
            <button
              key={lv.plate}
              type="button"
              className={s.cellBtn}
              data-on={i === index ? "true" : "false"}
              data-done={done.includes(i) ? "true" : "false"}
              onClick={() => go(i)}
              disabled={i > 0 && !done.includes(i) && !done.includes(i - 1) && i !== index}
            >
              {lv.plate}
            </button>
          ))}
        </div>

        <div className={s.corners}>
          <span className={s.note}>Z undo · space or tap to wait</span>
          <button
            type="button"
            className={s.quiet}
            onClick={() => {
              sound.current.ensure();
              const next = !muted;
              setMuted(next);
              sound.current.setMuted(next);
            }}
            aria-pressed={muted}
          >
            sound {muted ? "off" : "on"}
          </button>
          <Link className={s.quiet} href="/tasks/games-puzzle">
            the brief
          </Link>
        </div>
      </footer>

      <div className={s.live} aria-live="polite">
        {live}
      </div>
    </div>
  );
}

function TideTable({ phase }: { phase: number }) {
  const w = 220;
  const h = 86;
  const pts = CYCLE_POINTS(w, h);
  const bead = pts[phase]!;
  return (
    <div className={s.table}>
      <div>
        Schematic heights
        <br />
        <span className={s.now}>
          {PHASE[phase]} · mark {markOf(phase)}
        </span>
      </div>
      <div className={s.curve}>
        <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <path
            d={pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
              .join(" ")}
            fill="none"
            stroke="#1c1812"
            strokeWidth="1.1"
          />
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === phase ? 4.2 : 2}
              className={i === phase ? s.bead : undefined}
              fill={i === phase ? "#8b2a3e" : "#1c1812"}
            />
          ))}
          <text x={bead.x} y={8} textAnchor="middle" fontSize="9" fill="#8b2a3e">
            now
          </text>
        </svg>
      </div>
      <div>
        You cannot alter this
        <br />
        LW 0 · + 1 · HW 2
      </div>
    </div>
  );
}

function CYCLE_POINTS(w: number, h: number) {
  const marks = [0, 1, 2, 2, 1, 0];
  return marks.map((m, i) => ({
    x: 14 + (i * (w - 28)) / 5,
    y: h - 14 - (m / 2) * (h - 28),
  }));
}
