"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Instruments, { type Snap } from "./instruments";
import s from "./orbit.module.css";
import type { Burn, Craft, SceneLive, SetupName, Stage } from "./sim";
import {
  applyImpulse,
  clocksClose,
  formation,
  IMPULSE,
  integrate,
  inAtmosphere,
  hitEarth,
  phaseAngle,
  reading,
  relativeSpeed,
  setup,
  THRUST,
  visVivaPoints,
} from "./sim";

function BoardSketch() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;
    const paint = () => {
      const w = parent.clientWidth || 400;
      const h = parent.clientHeight || 400;
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = "#211f1a";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.28;
      ctx.strokeStyle = "#3d3931";
      ctx.lineWidth = 1;
      for (const k of [1.03, 1.063, 1.125, 1.235]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#2a2822";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5c574c";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r, cy - Math.sin(a) * r);
        ctx.lineTo(cx - Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.strokeStyle = "#d4784a";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.063, 0, Math.PI * 2);
      ctx.stroke();
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={s.placeholder} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <BoardSketch />,
});

const STAGES: Stage[] = ["period", "chase", "meet", "open"];
const WARPS = [1, 10, 50, 200];

function nextStage(stage: Stage): Stage | null {
  const i = STAGES.indexOf(stage);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

function readReduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function snapshot(
  chaser: Craft,
  target: Craft | null,
  stage: Stage,
  simTime: number,
  burn: Burn | null,
): Snap {
  const you = reading(chaser);
  const them = target ? reading(target) : null;
  return {
    you,
    them,
    phase: target ? phaseAngle(chaser, target) : 0,
    relSpeed: target ? relativeSpeed(chaser, target) : 0,
    simTime,
    coasting: burn === null,
    crashed: hitEarth(chaser),
    unbound: !you.bound,
    inAtmo: inAtmosphere(chaser),
    stage,
    youCurve: visVivaPoints(chaser),
    themCurve: target ? visVivaPoints(target) : [],
  };
}

export default function Desk() {
  const [stage, setStage] = useState<Stage>("period");
  const [preset, setPreset] = useState<SetupName>("same");
  const initial = useMemo(() => setup("period"), []);
  const chaser = useRef<Craft>(initial.chaser);
  const target = useRef<Craft | null>(initial.target);
  const trail = useRef<{ x: number; y: number }[]>([initial.chaser.r]);
  const trailAcc = useRef(0);
  const simTime = useRef(0);
  const burn = useRef<Burn | null>(null);
  const paused = useRef(true);

  const [warp, setWarp] = useState(10);
  const [running, setRunning] = useState(false);
  const [reduced] = useState(readReduced);
  const [held, setHeld] = useState<Burn | null>(null);
  const [snap, setSnap] = useState<Snap>(() =>
    snapshot(initial.chaser, initial.target, "period", 0, null),
  );
  const [gapOpened, setGapOpened] = useState(false);
  const [caught, setCaught] = useState(false);
  const [met, setMet] = useState(false);
  const startPhase = useRef<number | null>(null);
  const triedProRef = useRef(false);
  const gapOpenedRef = useRef(false);
  const caughtRef = useRef(false);
  const metRef = useRef(false);

  const live = useRef<SceneLive>({
    chaser: initial.chaser,
    target: initial.target,
    trail: [initial.chaser.r],
    burn: false,
    crashed: false,
  });

  const publish = useCallback(
    (st: Stage) => {
      live.current = {
        chaser: chaser.current,
        target: target.current,
        trail: trail.current,
        burn: burn.current !== null,
        crashed: hitEarth(chaser.current),
      };
      setSnap(snapshot(chaser.current, target.current, st, simTime.current, burn.current));
    },
    [],
  );

  const reset = useCallback(
    (st: Stage, name: SetupName = "same", keep = false) => {
      if (!keep) {
        const pair = setup(st, name);
        chaser.current = pair.chaser;
        target.current = pair.target;
        trail.current = [pair.chaser.r];
        trailAcc.current = 0;
        simTime.current = 0;
        startPhase.current = pair.target ? phaseAngle(pair.chaser, pair.target) : null;
        triedProRef.current = false;
        gapOpenedRef.current = false;
        caughtRef.current = false;
        metRef.current = false;
        setGapOpened(false);
        setCaught(false);
        setMet(false);
      } else if (target.current) {
        startPhase.current = phaseAngle(chaser.current, target.current);
      }
      burn.current = null;
      setHeld(null);
      publish(st);
    },
    [publish],
  );

  const go = useCallback(
    (st: Stage, keep = false) => {
      setStage(st);
      setPreset("same");
      reset(st, "same", keep);
    },
    [reset],
  );

  useEffect(() => {
    if (reduced) {
      paused.current = true;
      setRunning(false);
      setWarp(1);
    }
  }, [reduced]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused.current && !hitEarth(chaser.current)) {
        const dt = real * warp;
        chaser.current = integrate(chaser.current, dt, burn.current);
        if (target.current) {
          target.current = integrate(target.current, dt, null);
        }
        simTime.current += dt;
        trailAcc.current += dt;
        if (trailAcc.current > 8) {
          trailAcc.current = 0;
          trail.current = [...trail.current.slice(-180), chaser.current.r];
        }
        const t = target.current;
        if (t && startPhase.current !== null) {
          const ph = phaseAngle(chaser.current, t);
          if (
            triedProRef.current &&
            !gapOpenedRef.current &&
            Math.abs(ph) > Math.abs(startPhase.current) + 0.015
          ) {
            gapOpenedRef.current = true;
            setGapOpened(true);
          }
          if (!caughtRef.current && clocksClose(chaser.current, t)) {
            caughtRef.current = true;
            setCaught(true);
          }
          if (!metRef.current && formation(chaser.current, t)) {
            metRef.current = true;
            setMet(true);
          }
        }
        live.current = {
          chaser: chaser.current,
          target: target.current,
          trail: trail.current,
          burn: burn.current !== null,
          crashed: hitEarth(chaser.current),
        };
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const id = window.setInterval(() => publish(stage), 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [warp, stage, publish]);

  const setBurn = useCallback(
    (mode: Burn | null) => {
      burn.current = mode;
      setHeld(mode);
      if (mode) {
        paused.current = false;
        setRunning(true);
        if (mode === "prograde") triedProRef.current = true;
      }
    },
    [],
  );

  const tick = useCallback(
    (mode: Burn) => {
      if (hitEarth(chaser.current)) return;
      chaser.current = applyImpulse(chaser.current, mode, IMPULSE);
      if (mode === "prograde") triedProRef.current = true;
      paused.current = false;
      setRunning(true);
      publish(stage);
    },
    [publish, stage],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        paused.current = !paused.current;
        setRunning(!paused.current);
        return;
      }
      if (e.key === "r" || e.key === "R") {
        reset(stage, preset);
        return;
      }
      const map: Record<string, Burn> = {
        KeyW: "prograde",
        ArrowUp: "prograde",
        KeyS: "retro",
        ArrowDown: "retro",
      };
      if (stage === "open") {
        map.KeyD = "radialOut";
        map.ArrowRight = "radialOut";
        map.KeyA = "radialIn";
        map.ArrowLeft = "radialIn";
      }
      const mode = map[e.code];
      if (mode) {
        e.preventDefault();
        setBurn(mode);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (
        e.code === "KeyW" ||
        e.code === "KeyS" ||
        e.code === "KeyA" ||
        e.code === "KeyD" ||
        e.code === "ArrowUp" ||
        e.code === "ArrowDown" ||
        e.code === "ArrowLeft" ||
        e.code === "ArrowRight"
      ) {
        setBurn(null);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [reset, setBurn, stage, preset]);

  const radial = stage === "open";
  const nxt = nextStage(stage);

  return (
    <div className={s.root}>
      <a className={s.brief} href="/tasks/educational-science-simulation">
        brief
      </a>
      <div className={s.shell}>
        <section className={s.figure} aria-label="Polar view of the orbital plane">
          <div className={s.stage}>
            <Scene live={live} reduced={reduced} />
          </div>
          <p className={s.scaleNote}>
            Polar view · craft marks enlarged · rings at 200, 400, 800, 1 500 km
          </p>
        </section>

        <aside className={s.rail}>
          <header className={s.mast}>
            <h1 className={s.wordmark}>Orbit</h1>
            <p className={s.step}>
              {STAGES.indexOf(stage) + 1} of {STAGES.length}
            </p>
          </header>
          <p className={s.claim}>
            To catch a craft ahead of you, you have to <em>slow down</em>.
            The sentence is true. Everyday intuition will not believe it.
          </p>

          <div className={s.prompt}>
            {stage === "period" && (
              <>
                <h2>One burn</h2>
                <p>
                  You are on a 400 km circular orbit — a round number near the
                  height of the International Space Station.
                </p>
                <p>
                  Fire along your motion, then against it. Watch altitude, speed
                  and period together. Which burn makes the next lap take longer?
                </p>
              </>
            )}
            {stage === "chase" && (
              <>
                <h2>The gap</h2>
                <p>
                  A second craft is ahead of you, on the same orbit. Close the
                  gap. You have the same two thrusters. The instruments are
                  still telling the truth.
                </p>
                {gapOpened && !caught && (
                  <p className={s.note} role="status">
                    The gap is larger than when you started.
                  </p>
                )}
                {caught && (
                  <p className={s.note} role="status">
                    The clocks lined up. The orbits may not have.
                  </p>
                )}
              </>
            )}
            {stage === "meet" && (
              <>
                <h2>With them</h2>
                <p>
                  Being under them is not the same as being with them. Match
                  their orbit, not only their clock. The 5 m/s ticks are there
                  for the last bit.
                </p>
                {met && (
                  <p className={s.note} role="status">
                    You are flying formation. Same orbit, same place on it.
                  </p>
                )}
              </>
            )}
            {stage === "open" && (
              <>
                <h2>Open</h2>
                <p>
                  Same physics. Radial burns are on the board, and you can start
                  from a different pair of orbits. Nothing is scored.
                </p>
              </>
            )}
          </div>

          <div className={s.board}>
            <Instruments snap={snap} />
          </div>

          <div className={s.controls}>
            <p className={s.lbl}>Hold to burn · {THRUST.toFixed(1)} m/s²</p>
            <div className={s.row}>
              <button
                type="button"
                className={`${s.btn} ${s.btnYou}`}
                data-on={held === "retro"}
                disabled={snap.crashed}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setBurn("retro");
                }}
                onPointerUp={() => setBurn(null)}
                onPointerCancel={() => setBurn(null)}
              >
                Retrograde
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnYou}`}
                data-on={held === "prograde"}
                disabled={snap.crashed}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setBurn("prograde");
                }}
                onPointerUp={() => setBurn(null)}
                onPointerCancel={() => setBurn(null)}
              >
                Prograde
              </button>
            </div>
            {radial && (
              <div className={s.row}>
                <button
                  type="button"
                  className={s.btn}
                  data-on={held === "radialIn"}
                  disabled={snap.crashed}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setBurn("radialIn");
                  }}
                  onPointerUp={() => setBurn(null)}
                  onPointerCancel={() => setBurn(null)}
                >
                  Radial in
                </button>
                <button
                  type="button"
                  className={s.btn}
                  data-on={held === "radialOut"}
                  disabled={snap.crashed}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setBurn("radialOut");
                  }}
                  onPointerUp={() => setBurn(null)}
                  onPointerCancel={() => setBurn(null)}
                >
                  Radial out
                </button>
              </div>
            )}
            <div className={s.row}>
              <button
                type="button"
                className={s.tick}
                disabled={snap.crashed}
                onClick={() => tick("retro")}
              >
                −5 m/s
              </button>
              <button
                type="button"
                className={s.tick}
                disabled={snap.crashed}
                onClick={() => tick("prograde")}
              >
                +5 m/s
              </button>
              {radial && (
                <>
                  <button
                    type="button"
                    className={s.tick}
                    disabled={snap.crashed}
                    onClick={() => tick("radialIn")}
                  >
                    in 5
                  </button>
                  <button
                    type="button"
                    className={s.tick}
                    disabled={snap.crashed}
                    onClick={() => tick("radialOut")}
                  >
                    out 5
                  </button>
                </>
              )}
            </div>

            <p className={s.lbl}>Time</p>
            <div className={s.row}>
              <button
                type="button"
                className={s.chip}
                aria-pressed={running}
                onClick={() => {
                  paused.current = !paused.current;
                  setRunning(!paused.current);
                }}
              >
                {running ? "Pause" : "Run"}
              </button>
              {WARPS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={s.chip}
                  aria-pressed={warp === w}
                  onClick={() => setWarp(w)}
                >
                  {w}×
                </button>
              ))}
            </div>
            <p className={s.keys}>
              W / S prograde and retrograde
              {radial ? " · A / D radial" : ""} · space pause · R reset
            </p>

            {stage === "open" && (
              <>
                <p className={s.lbl}>Start</p>
                <div className={s.row}>
                  {(
                    [
                      ["same", "Same orbit, 20°"],
                      ["higher", "They are 50 km higher"],
                      ["lower", "You are 50 km higher"],
                    ] as const
                  ).map(([name, label]) => (
                    <button
                      key={name}
                      type="button"
                      className={s.chip}
                      aria-pressed={preset === name}
                      onClick={() => {
                        setPreset(name);
                        reset("open", name);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className={s.nav}>
              <button type="button" className={s.linkish} onClick={() => reset(stage, preset)}>
                Reset this
              </button>
              {nxt && (
                <button
                  type="button"
                  className={s.linkish}
                  onClick={() => go(nxt, stage === "chase" || stage === "meet")}
                >
                  Next
                </button>
              )}
              {stage !== "period" && (
                <button
                  type="button"
                  className={s.linkish}
                  onClick={() => go("period")}
                >
                  Back to one burn
                </button>
              )}
            </div>
          </div>

          {(caught || met) && (
            <p className={s.history}>
              Gemini 4 pointed at its spent stage and thrusted toward it. The
              gap opened. The first American rendezvous was Gemini 6A, seven
              months later, after the crews were trained to brake. (Gemini 4
              Mission Report, NASA MSC-G-R-65-4, 1965.)
            </p>
          )}

          <div className={s.methods}>
            <p>
              Two-body vacuum. Inverse-square gravity from a point mass at the
              centre, μ = 3.986004418×10¹⁴ m³/s² (EGM96 / IERS). Earth radius
              6371 km, volumetric mean (NASA fact sheet). 400 km is a round
              number near typical ISS altitude, not a measured height.
            </p>
            <p>
              Coast is the exact Keplerian conic. A hold is velocity Verlet at
              0.1 s with {THRUST.toFixed(1)} m/s² — in family with Gemini OAMS,
              not a modern RCS. The ±5 m/s ticks are instant Δv, the usual
              mission-design idealisation. No atmosphere, J2, or third body.
            </p>
            <p>
              The ~km-of-arc figure multiplies the Earth-centred angle by a
              6771 km radius. That is a constructed length for the ribbon, not
              a measured along-track range.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
