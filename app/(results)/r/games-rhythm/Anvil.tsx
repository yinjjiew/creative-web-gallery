"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import { paint, resize } from "./draw";
import {
  blowCount,
  createGame,
  enterFire,
  heatName,
  nextWork,
  retry,
  skipCalibrate,
  startCalibrate,
  step,
  tap,
  trueCount,
  workOf,
  type Finished,
  type Game,
  type Grade,
  type Segment,
  type Work,
} from "./engine";
import s from "./anvil.module.css";

const Piece = dynamic(() => import("./Piece"), { ssr: false });

const LATENCY_KEY = "anvil.latency.v1";
const MUTE_KEY = "anvil.muted.v1";
const RACK_KEY = "anvil.rack.v1";
const FIXED = 1 / 60;

function readLatency() {
  try {
    const n = Number(localStorage.getItem(LATENCY_KEY));
    if (Number.isFinite(n) && n > 0.008 && n < 0.2) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

function readMute() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function readRack(): Finished[] {
  try {
    const raw = localStorage.getItem(RACK_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as Finished[];
    if (!Array.isArray(v)) return [];
    return v.slice(0, 8);
  } catch {
    return [];
  }
}

type Ui = {
  phase: Game["phase"];
  workName: string;
  workNote: string;
  heat: string;
  heatReady: boolean;
  lastWord: string | null;
  lastGrade: Grade | null;
  wordKey: number;
  latencyMs: number;
  trueHits: number;
  blows: number;
  muted: boolean;
  rack: number;
  calibrated: boolean;
};

const INITIAL: Ui = {
  phase: "title",
  workName: "Spike",
  workNote: "",
  heat: "cold",
  heatReady: false,
  lastWord: null,
  lastGrade: null,
  wordKey: 0,
  latencyMs: 0,
  trueHits: 0,
  blows: 8,
  muted: false,
  rack: 0,
  calibrated: false,
};

export default function Anvil() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const heatRef = useRef<HTMLSpanElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const lastTap = useRef(0);
  const wordKey = useRef(0);
  const ignoreUntil = useRef(0);

  const [ui, setUi] = useState<Ui>(INITIAL);
  const [muted, setMuted] = useState(false);
  const [inspect, setInspect] = useState<{
    segments: Segment[];
    work: Work;
    reduced: boolean;
    key: number;
  } | null>(null);
  const inspectKey = useRef(0);

  const syncUi = useCallback((g: Game, extra: Partial<Ui> = {}) => {
    const work = workOf(g);
    setUi((prev) => ({
      ...prev,
      phase: g.phase,
      workName: work.name,
      workNote: work.note,
      heat: heatName(g.heat),
      heatReady: g.phase === "fire" && g.heat >= 0.72 && g.heat <= 0.88,
      lastWord: extra.lastWord !== undefined ? extra.lastWord : g.lastWord,
      lastGrade: extra.lastGrade !== undefined ? extra.lastGrade : g.lastGrade,
      wordKey: extra.wordKey ?? prev.wordKey,
      latencyMs: Math.round(g.latency * 1000),
      trueHits: trueCount(g.hits),
      blows: blowCount(work),
      rack: g.rack.length,
      calibrated: g.latency > 0,
    }));
  }, []);

  const strike = useCallback(() => {
    const now = performance.now();
    if (now < ignoreUntil.current) return;
    if (now - lastTap.current < 40) return;
    lastTap.current = now;
    const g = gameRef.current;
    if (!g) return;
    const sound = soundRef.current;
    sound?.ensure();
    if (g.phase === "title") return;
    const t = sound?.now() ?? now / 1000;
    const evs = tap(g, t);
    sound?.handle(evs);
    if (g.lastWord) {
      wordKey.current += 1;
      syncUi(g, { wordKey: wordKey.current, lastWord: g.lastWord, lastGrade: g.lastGrade });
    }
  }, [syncUi]);

  const begin = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    soundRef.current?.setMuted(muted);
    const t = soundRef.current?.now() ?? performance.now() / 1000;
    ignoreUntil.current = performance.now() + 280;
    if (g.latency <= 0) startCalibrate(g, t);
    else enterFire(g);
    syncUi(g);
  }, [muted, syncUi]);

  const doRetry = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    const t = soundRef.current?.now() ?? performance.now() / 1000;
    retry(g, t);
    setInspect(null);
    syncUi(g);
  }, [syncUi]);

  const doNext = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    const t = soundRef.current?.now() ?? performance.now() / 1000;
    nextWork(g, t);
    setInspect(null);
    syncUi(g);
  }, [syncUi]);

  const doCalibrate = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    const t = soundRef.current?.now() ?? performance.now() / 1000;
    startCalibrate(g, t);
    syncUi(g);
  }, [syncUi]);

  const doSkipCal = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    ignoreUntil.current = performance.now() + 280;
    skipCalibrate(g);
    try {
      localStorage.setItem(LATENCY_KEY, String(g.latency));
    } catch {
      /* ignore */
    }
    syncUi(g);
  }, [syncUi]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && el.dataset.passthrough === "true") return;
      if (e.code === "KeyR") {
        e.preventDefault();
        doRetry();
        return;
      }
      if (e.code === "KeyC" && gameRef.current?.phase === "title") {
        e.preventDefault();
        doCalibrate();
        return;
      }
      if (e.code === "KeyM") {
        e.preventDefault();
        setMuted((m) => !m);
        return;
      }
      if (e.code === "Space" || e.code === "Enter" || e.key === " ") {
        e.preventDefault();
        const g = gameRef.current;
        if (!g) return;
        if (g.phase === "title") begin();
        else if (g.phase === "inspect") doRetry();
        else strike();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [begin, doCalibrate, doRetry, strike]);

  useEffect(() => {
    soundRef.current?.setMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = motion.matches;
    const storedMute = readMute();
    setMuted(storedMute);

    const game = createGame({
      reduced,
      latency: readLatency(),
      rack: readRack(),
    });
    gameRef.current = game;
    const sound = new Sound();
    soundRef.current = sound;
    sound.setMuted(storedMute);
    syncUi(game);

    let acc = 0;
    let last = performance.now() / 1000;
    let raf = 0;
    let live = true;
    let lastPhase = game.phase;
    let lastHeatLabel = heatName(game.heat);
    let lastReady = false;
    let usedAudio = false;

    const onMotion = () => {
      game.reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    const loop = () => {
      if (!live) return;
      const g = gameRef.current;
      if (!g) return;
      const audioNow = sound.ready ? sound.now() : performance.now() / 1000;
      if (sound.ready && !usedAudio) {
        usedAudio = true;
        last = audioNow;
        acc = 0;
      }
      let dt = audioNow - last;
      last = audioNow;
      if (dt < 0) dt = 0;
      if (dt > 0.12) dt = 0.12;
      acc += dt;
      const evs = [];
      while (acc >= FIXED) {
        evs.push(...step(g, FIXED, audioNow));
        acc -= FIXED;
      }
      if (evs.length) sound.handle(evs);
      if (g.phase === "fire") sound.setFire(0.7 + g.heat * 0.4);
      else if (g.phase === "title") sound.setFire(0.35);
      else sound.setFire(0.15);

      const { w, h } = resize(canvas, ctx);
      paint(ctx, w, h, g, audioNow);

      const label = heatName(g.heat);
      if (heatRef.current && label !== lastHeatLabel) {
        lastHeatLabel = label;
        heatRef.current.textContent = label;
      }
      const ready = g.phase === "fire" && g.heat >= 0.72 && g.heat <= 0.88;
      if (ready !== lastReady) {
        lastReady = ready;
        setUi((prev) => ({ ...prev, heatReady: ready, heat: label }));
      }

      if (g.phase !== lastPhase) {
        lastPhase = g.phase;
        if (g.phase === "inspect") {
          try {
            localStorage.setItem(RACK_KEY, JSON.stringify(g.rack));
            localStorage.setItem(LATENCY_KEY, String(g.latency));
          } catch {
            /* ignore */
          }
          inspectKey.current += 1;
          setInspect({
            segments: g.segments.map((seg) => ({ ...seg })),
            work: workOf(g),
            reduced: g.reduced,
            key: inspectKey.current,
          });
        }
        if (g.phase === "fire" && g.latency > 0) {
          try {
            localStorage.setItem(LATENCY_KEY, String(g.latency));
          } catch {
            /* ignore */
          }
        }
        syncUi(g);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      motion.removeEventListener("change", onMotion);
      sound.close();
      gameRef.current = null;
    };
  }, [syncUi]);

  const onPointer = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, [data-passthrough]")) return;
    if (ui.phase === "inspect") return;
    if (ui.phase === "title") return;
    strike();
  };

  const hush = (e: React.PointerEvent) => e.stopPropagation();

  const playing =
    ui.phase === "fire" || ui.phase === "count" || ui.phase === "work";

  return (
    <div
      ref={wrapRef}
      className={s.wrap}
      data-phase={ui.phase}
      data-true={String(ui.trueHits)}
      data-blows={String(ui.blows)}
      onPointerDown={onPointer}
    >
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />

      {ui.phase === "inspect" && inspect && (
        <div className={s.piece}>
          <Piece
            key={inspect.key}
            segments={inspect.segments}
            work={inspect.work}
            reduced={inspect.reduced}
          />
        </div>
      )}

      <div className={s.hud} aria-hidden={ui.phase === "title"}>
        {playing && (
          <>
            <div className={s.left}>
              <span className={s.tick}>work</span>
              <span className={s.name}>{ui.workName}</span>
              <span
                ref={heatRef}
                className={s.heat}
                data-ready={ui.heatReady ? "true" : "false"}
                aria-live="polite"
              >
                {ui.heat}
              </span>
            </div>
            <div className={s.right}>
              <span className={s.tick}>true</span>
              <span className={s.count}>
                {ui.trueHits}
                <span style={{ opacity: 0.45 }}>/{ui.blows}</span>
              </span>
            </div>
          </>
        )}
        {ui.lastWord && ui.phase !== "title" && ui.phase !== "inspect" && (
          <p className={s.word} data-g={ui.lastGrade ?? ""} key={ui.wordKey}>
            {ui.lastWord}
          </p>
        )}
        {ui.phase === "fire" && (
          <p className={s.hint}>
            {ui.heatReady
              ? "draw it — working heat"
              : "wait for orange. the colour is the clock."}
          </p>
        )}
        {ui.phase === "count" && (
          <p className={s.hint}>four rings. then the work.</p>
        )}
        {ui.phase === "work" && (
          <p className={s.hint}>space · tap · click</p>
        )}
        {ui.phase === "calibrate" && (
          <p className={s.hint}>tap with the ring. eight times.</p>
        )}
      </div>

      {ui.phase === "title" && (
        <div className={s.card} onPointerDown={hush}>
          <p className={s.kicker}>the shop</p>
          <h1 className={s.title}>Anvil</h1>
          <p className={s.lede}>
            Keep time on hot iron. The piece takes its shape from your
            timing — <em>a good run and a bad run leave different objects</em>,
            not a letter grade. Heat is the phrase: carbon steel, read by
            colour, workable for a short while, then back in the fire.
          </p>
          <div className={s.row}>
            <button type="button" className={s.begin} onClick={begin}>
              step to the anvil
            </button>
            <button
              type="button"
              className={s.ghost}
              data-passthrough="true"
              onClick={doCalibrate}
            >
              calibrate
            </button>
          </div>
          <p className={s.control}>
            <kbd>space</kbd> strike · <kbd>r</kbd> again
            {ui.calibrated ? ` · shop hears you ${ui.latencyMs}ms late` : ""}
          </p>
          {ui.rack > 0 && (
            <p className={s.rack}>
              {ui.rack} piece{ui.rack === 1 ? "" : "s"} on the rack
            </p>
          )}
        </div>
      )}

      {ui.phase === "calibrate" && (
        <div
          className={s.card}
          style={{ justifyContent: "flex-start", paddingTop: "22vh", background: "none" }}
          onPointerDown={hush}
        >
          <p className={s.kicker}>the shop is late</p>
          <p className={s.lede}>
            Tap with the ring so the anvil can hear when your hand actually
            falls. Fifty milliseconds of drift makes any of this worthless.
          </p>
          <button
            type="button"
            className={s.ghost}
            data-passthrough="true"
            onClick={doSkipCal}
          >
            skip — use {ui.latencyMs || 45}ms
          </button>
        </div>
      )}

      {ui.phase === "inspect" && (
        <div className={s.card} onPointerDown={hush}>
          <p className={s.kicker}>what the iron remembers</p>
          <h2 className={s.title} style={{ fontSize: "clamp(40px, 7vw, 84px)" }}>
            {ui.workName}
          </h2>
          <p className={s.lede}>{ui.workNote}</p>
          <p className={s.stat}>
            {ui.trueHits} true of {ui.blows} blows
            {ui.latencyMs ? ` · heard ${ui.latencyMs}ms late` : ""}
          </p>
          <div className={s.row}>
            <button type="button" className={s.begin} onClick={doRetry}>
              again
            </button>
            <button type="button" className={s.ghost} onClick={doNext}>
              next work
            </button>
          </div>
          <p className={s.control}>drag the piece · <kbd>r</kbd> again</p>
        </div>
      )}

      <div className={s.corner} onPointerDown={hush}>
        <button
          type="button"
          className={s.quiet}
          data-passthrough="true"
          aria-pressed={muted}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? "sound off" : "sound"}
        </button>
        <Link href="/tasks/games-rhythm" className={s.quiet}>
          the brief
        </Link>
      </div>
    </div>
  );
}
