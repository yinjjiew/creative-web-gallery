"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import { Stage } from "./draw";
import {
  CLS_NAME,
  ROAD_NAME,
  advance,
  chainsLeft,
  clockLabel,
  newGame,
  pull,
  reset,
  signOn,
  type Best,
  type Game,
  type Train,
} from "./engine";
import s from "./semaphore.module.css";

const BEST_KEY = "semaphore.best.v1";
const MUTE_KEY = "semaphore.muted.v1";

function readBest(): Best {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return { score: 0, cleared: 0 };
    const v = JSON.parse(raw) as Partial<Best>;
    return {
      score: Math.max(0, Math.floor(Number(v.score) || 0)),
      cleared: Math.max(0, Math.floor(Number(v.cleared) || 0)),
    };
  } catch {
    return { score: 0, cleared: 0 };
  }
}

interface Ui {
  phase: Game["phase"];
  score: number;
  cleared: number;
  clock: string;
  idea: string | null;
  deny: string | null;
  crash: string;
  crashDetail: string;
  best: Best;
  newBest: boolean;
  trains: Train[];
}

const INITIAL: Ui = {
  phase: "board",
  score: 0,
  cleared: 0,
  clock: "18:40",
  idea: null,
  deny: null,
  crash: "",
  crashDetail: "",
  best: { score: 0, cleared: 0 },
  newBest: false,
  trains: [],
};

export default function Box() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const hitsRef = useRef<HTMLDivElement | null>(null);

  const gameRef = useRef<Game | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const mutedRef = useRef(false);
  const lastTap = useRef(0);

  const [ui, setUi] = useState<Ui>(INITIAL);
  const [muted, setMuted] = useState(false);
  const [hits, setHits] = useState<{ i: number; x: number; y: number; r: number }[]>(
    []
  );

  const throwLever = useCallback((i: number) => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    pull(g, i);
  }, []);

  const begin = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    if (g.phase === "dead") reset(g);
    else if (g.phase === "board") signOn(g);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && el.dataset.passthrough === "true" && (e.code === "Space" || e.code === "Enter")) {
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        const g = gameRef.current;
        if (!g) return;
        soundRef.current?.ensure();
        if (g.phase === "dead") reset(g);
        else if (g.phase === "board") signOn(g);
        return;
      }
      const n = e.code.startsWith("Digit")
        ? Number(e.code.slice(5))
        : e.code.startsWith("Numpad")
          ? Number(e.code.slice(6))
          : 0;
      if (n >= 1 && n <= 8) {
        e.preventDefault();
        throwLever(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [throwLever]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = motion.matches;
    const best = readBest();
    const game = newGame(best, reduced);
    const stage = new Stage();
    const sound = new Sound();
    gameRef.current = game;
    stageRef.current = stage;
    soundRef.current = sound;

    const startMuted = localStorage.getItem(MUTE_KEY) === "1";
    mutedRef.current = startMuted;
    setMuted(startMuted);
    sound.setMuted(startMuted);
    setUi((u) => ({ ...u, best }));

    const resize = () => {
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      stage.resize(w, h, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let lastPhase = game.phase;
    let lastIdea: string | null = null;
    let lastDeny: string | null = null;
    let lastScore = -1;
    let lastClock = "";
    let lastTrainSig = "";
    let hitSig = "";

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      advance(game, dt);

      if (game.events.length) {
        sound.handle(game.events);
        if (game.phase === "dead") {
          try {
            localStorage.setItem(BEST_KEY, JSON.stringify(game.best));
          } catch {
            /* private mode */
          }
        }
        game.events.length = 0;
      }
      sound.update(game);
      stage.draw(ctx, game);

      const hs = stage.hits;
      const sig = hs.map((h) => `${h.i}:${Math.round(h.x)}:${Math.round(h.y)}`).join("|");
      if (sig !== hitSig) {
        hitSig = sig;
        setHits(hs.map((h) => ({ ...h })));
      }

      if (scoreRef.current && game.score !== lastScore) {
        lastScore = game.score;
        scoreRef.current.textContent = String(game.score);
      }
      const clock = clockLabel(game);
      if (clockRef.current && clock !== lastClock) {
        lastClock = clock;
        clockRef.current.textContent = clock;
      }

      const trainSig = game.trains
        .map((t) => `${t.id}:${t.from}${t.to}:${t.cls}:${chainsLeft(t)}`)
        .join(",");
      const idea = game.idea;
      const deny = game.deny;
      if (
        game.phase !== lastPhase ||
        idea !== lastIdea ||
        deny !== lastDeny ||
        trainSig !== lastTrainSig
      ) {
        lastPhase = game.phase;
        lastIdea = idea;
        lastDeny = deny;
        lastTrainSig = trainSig;
        setUi({
          phase: game.phase,
          score: game.score,
          cleared: game.cleared,
          clock,
          idea,
          deny,
          crash: game.crash,
          crashDetail: game.crashDetail,
          best: game.best,
          newBest: game.newBest,
          trains: game.trains.map((t) => ({ ...t })),
        });
      }
    };
    raf = requestAnimationFrame(frame);

    const onMotion = () => {
      game.reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      motion.removeEventListener("change", onMotion);
      sound.close();
      gameRef.current = null;
    };
  }, []);

  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const now = performance.now();
    if (now - lastTap.current < 40) return;
    lastTap.current = now;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let bestI = -1;
    let bestD = 1e9;
    for (const h of stage.hits) {
      const d = Math.hypot(x - h.x, y - h.y);
      if (d < h.r && d < bestD) {
        bestD = d;
        bestI = h.i;
      }
    }
    if (bestI >= 0) {
      e.preventDefault();
      throwLever(bestI);
      return;
    }
    const g = gameRef.current;
    if (g && (g.phase === "board" || g.phase === "dead")) begin();
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    soundRef.current?.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const running = ui.phase === "run";
  const board = ui.phase === "board";
  const dead = ui.phase === "dead";

  return (
    <div className={s.wrap} ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={s.canvas}
        onPointerDown={onCanvasPointer}
        aria-label="Millford Junction lever frame"
      />

      <div className={s.hits} ref={hitsRef} aria-hidden={board || dead}>
        {hits.map((h) => (
          <button
            key={h.i}
            type="button"
            className={s.hit}
            style={{
              left: h.x - h.r,
              top: h.y - h.r,
              width: h.r * 2,
              height: h.r * 2,
            }}
            aria-label={`Lever ${h.i + 1}`}
            onClick={() => throwLever(h.i)}
          />
        ))}
      </div>

      <div className={s.hud} data-quiet={board ? "true" : undefined}>
        <div className={s.scorePlate}>
          <div className={s.tick}>cleared</div>
          <div className={s.score}>
            <span ref={scoreRef}>{ui.score}</span>
          </div>
          <div className={s.sub}>
            {ui.cleared} {ui.cleared === 1 ? "road" : "roads"}
            {ui.best.score > 0 ? ` · best ${ui.best.score}` : ""}
          </div>
        </div>
        <div className={s.dutyPlate}>
          <div className={s.tick}>duty</div>
          <div className={s.duty}>
            <span ref={clockRef}>{ui.clock}</span>
          </div>
          <div className={s.sub}>East Box · Millford</div>
        </div>

        {running && ui.trains.length > 0 ? (
          <div className={s.describer} aria-live="polite">
            {ui.trains.map((t) => (
              <div className={s.slip} key={t.id}>
                <div className={s.slipHead}>
                  <span>
                    {t.from} → {t.to}
                  </span>
                  <span>{CLS_NAME[t.cls]}</span>
                </div>
                <div className={s.slipMeta}>
                  {ROAD_NAME[t.from]} · {chainsLeft(t)}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {running && ui.idea ? <p className={s.idea}>{ui.idea}</p> : null}
        {running && ui.deny ? <p className={s.lockNote}>{ui.deny}</p> : null}
      </div>

      {board ? (
        <div className={s.notice}>
          <p className={s.kicker}>Midland Railway</p>
          <h1 className={s.title}>SEMAPHORE</h1>
          <p className={s.where}>Millford Junction · East Box · 1890</p>
          <p className={s.lede}>
            You are the signalman. Trains approach on a book you can see and
            cannot change. Points and homes take time to travel. A route that
            is not <em>set and locked</em> is a route that kills.
          </p>
          <ul className={s.rules}>
            <li>Black levers throw the points. Red levers pull the home off.</li>
            <li>Interlocking refuses the combinations that would meet in the diamond.</li>
            <li>One mistake ends the turn. The death will tell you which.</li>
          </ul>
          <button
            type="button"
            className={s.again}
            data-passthrough="true"
            onClick={begin}
          >
            Sign on
          </button>
          <p className={s.hint}>
            <kbd>1</kbd>–<kbd>8</kbd> throw the frame · <kbd>space</kbd> signs
            on · tap a handle
          </p>
          <p className={s.modelled}>
            A modelled 1890 lever frame. Interlocking is a simplification of
            Midland practice, not a working diagram.
          </p>
        </div>
      ) : null}

      {dead ? (
        <div className={s.notice} data-dead="true">
          <p className={s.kicker}>{ui.newBest ? "A personal best" : "The road is blocked"}</p>
          <p className={s.bigNum}>{ui.score}</p>
          <p className={s.lede}>
            <strong>{ui.crash}</strong> {ui.crashDetail}
          </p>
          <p className={s.sub} style={{ color: "#e0b86a", marginTop: 8 }}>
            {ui.cleared} roads locked · best {ui.best.score}
          </p>
          <button
            type="button"
            className={s.again}
            data-passthrough="true"
            onClick={begin}
          >
            Again
          </button>
          <p className={s.hint}>
            <kbd>space</kbd> or any lever · immediately
          </p>
        </div>
      ) : null}

      <div className={s.corner}>
        <button
          type="button"
          className={s.quiet}
          onClick={toggleMute}
          data-passthrough="true"
          aria-pressed={muted}
        >
          sound {muted ? "off" : "on"}
        </button>
        <Link className={s.quiet} href="/tasks/games-arcade" data-passthrough="true">
          the brief
        </Link>
      </div>
    </div>
  );
}
