"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import { Stage } from "./render";
import {
  advance,
  newGame,
  press as pressGame,
  type Best,
  type Game,
} from "./sim";
import s from "./trapeze.module.css";

const BEST_KEY = "trapeze.best.v1";
const MUTE_KEY = "trapeze.muted.v1";

function readBest(): Best {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return { score: 0, passes: 0 };
    const v = JSON.parse(raw) as Partial<Best>;
    return {
      score: Math.max(0, Math.floor(Number(v.score) || 0)),
      passes: Math.max(0, Math.floor(Number(v.passes) || 0)),
    };
  } catch {
    return { score: 0, passes: 0 };
  }
}

interface Ui {
  phase: Game["phase"];
  started: boolean;
  idea: string | null;
  ideaKey: number;
  rating: string | null;
  ratingKey: number;
  endScore: number;
  endPasses: number;
  best: Best;
  newBest: boolean;
  turns: number;
  tucked: boolean;
}

const INITIAL_UI: Ui = {
  phase: "board",
  started: false,
  idea: null,
  ideaKey: 0,
  rating: null,
  ratingKey: 0,
  endScore: 0,
  endPasses: 0,
  best: { score: 0, passes: 0 },
  newBest: false,
  turns: 0,
  tucked: false,
};

export default function Trapeze() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const passRef = useRef<HTMLSpanElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const gripRef = useRef<HTMLSpanElement | null>(null);
  const streakRef = useRef<HTMLSpanElement | null>(null);

  const gameRef = useRef<Game | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const lastPressRef = useRef(0);
  const mutedRef = useRef(false);

  const [ui, setUi] = useState<Ui>(INITIAL_UI);
  const [muted, setMuted] = useState(false);

  /* ── one button ─────────────────────────────────────────────────────────── */

  const press = useCallback(() => {
    const now = performance.now();
    // Guard against a pointer event and a synthesised click arriving together.
    if (now - lastPressRef.current < 45) return;
    lastPressRef.current = now;
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    pressGame(g);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter" && e.key !== " ") return;
      if (e.repeat) return;
      const el = document.activeElement as HTMLElement | null;
      // Let a focused control do its own job rather than swallowing the key.
      if (el && el.dataset.passthrough === "true") return;
      e.preventDefault();
      press();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  /* ── boot ───────────────────────────────────────────────────────────────── */

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
    const stage = new Stage(reduced);
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
      // A silhouette against soft light has almost no high-frequency detail to
      // resolve, so full retina buys nothing and costs half the frame budget.
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
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

    // Put the camera on the board before the first frame so the opening shot is
    // composed rather than sliding into place.
    stage.camX = game.flyer.pos.x + 2.2;
    stage.spotX = game.flyer.pos.x;
    stage.spotAimX = game.flyer.pos.x;
    stage.spotAimY = game.flyer.pos.y;

    let raf = 0;
    let last = performance.now();
    let uiPhase: Game["phase"] = game.phase;
    let uiStarted = game.started;
    let ideaKey = 0;
    let ratingKey = 0;
    let lastIdea: string | null = null;
    let lastRating: unknown = null;
    let lastRatingText: string | null = null;
    let lastTucked = false;
    let shownPass = -1;
    let shownScore = -1;
    let shownStreak = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      advance(game, dt);

      /* Events drive sound and chalk; the simulation itself stays ignorant. */
      if (game.events.length) {
        sound.handle(game.events, game, stage.camX);
        for (const e of game.events) {
          if (e.type === "release") {
            stage.puff(e.x, e.y, e.vx, e.vy, 16, 0.8);
          } else if (e.type === "catch") {
            stage.puff(e.x, e.y, 0, 0, 14 + Math.round(20 * e.quality), 1.5);
            stage.flash = 0.55 + 0.45 * e.quality;
          } else if (e.type === "slip") {
            stage.puff(game.flyer.pos.x, game.flyer.pos.y, 0, 0, 10, 0.6);
          } else if (e.type === "miss") {
            stage.redFlash = 0.55;
          } else if (e.type === "land") {
            stage.puff(e.x, game.flyer.pos.y, 0, -1.2, 26, 2.2);
          } else if (e.type === "restart") {
            stage.clearTrail();
          }
        }
        game.events.length = 0;
      }

      sound.update(game, stage.camX);
      stage.update(game, dt);
      stage.draw(ctx, game);

      /* Fast numbers go straight to the DOM; React only sees state changes. */
      if (game.passes !== shownPass && passRef.current) {
        shownPass = game.passes;
        passRef.current.textContent = String(game.passes).padStart(2, "0");
      }
      if (game.score !== shownScore && scoreRef.current) {
        shownScore = game.score;
        scoreRef.current.textContent = String(game.score);
      }
      if (gripRef.current) {
        const show = game.phase === "hold";
        gripRef.current.style.transform = `scaleX(${show ? game.grip : 0})`;
        gripRef.current.style.opacity = show && game.grip < 0.999 ? "1" : "0";
      }
      const streak = game.streak;
      if (streak !== shownStreak && streakRef.current) {
        shownStreak = streak;
        streakRef.current.textContent = streak > 1 ? `\u00d7${1 + 0.15 * Math.min(6, streak)}`.slice(0, 5) : "";
      }

      const ideaText = game.banner && game.banner.t < 3.4 ? game.banner.text : null;
      const ratingObj = game.rating && game.rating.t < 1.1 ? game.rating : null;
      const ratingText = ratingObj ? ratingObj.label : null;
      if (ideaText !== lastIdea && ideaText) ideaKey++;
      if (ratingObj !== lastRating && ratingObj) ratingKey++;

      const tuckedNow = game.flyer.tucked;
      if (
        game.phase !== uiPhase ||
        game.started !== uiStarted ||
        ideaText !== lastIdea ||
        ratingText !== lastRatingText ||
        tuckedNow !== lastTucked
      ) {
        uiPhase = game.phase;
        uiStarted = game.started;
        lastIdea = ideaText;
        lastRating = ratingObj;
        lastRatingText = ratingText;
        lastTucked = tuckedNow;
        setUi({
          phase: game.phase,
          started: game.started,
          idea: ideaText,
          ideaKey,
          rating: ratingText,
          ratingKey,
          endScore: game.score,
          endPasses: game.passes,
          best: game.best,
          newBest: game.newBest,
          turns: game.cfg.turns,
          tucked: tuckedNow,
        });
        if (game.phase === "over") {
          try {
            localStorage.setItem(BEST_KEY, JSON.stringify(game.best));
          } catch {
            /* storage may be unavailable; the run still counts in this session */
          }
        }
      }
    };
    raf = requestAnimationFrame(frame);

    const onMotion = () => {
      game.reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);
    const onHide = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onHide);
      sound.close();
    };
    // The loop owns its own state for its whole lifetime, by design.
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    soundRef.current?.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* storage may be unavailable; the toggle still works for this session */
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-passthrough='true']")) return;
      e.preventDefault();
      press();
    },
    [press]
  );

  const titleUp = ui.phase === "board" && !ui.started;
  const over = ui.phase === "over";
  const airborne = ui.phase === "flight";

  return (
    <div
      ref={wrapRef}
      className={s.wrap}
      onPointerDown={onPointerDown}
      data-phase={ui.phase}
    >
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />

      <div className={s.hud} aria-hidden={titleUp || over}>
        <div className={s.left}>
          <span className={s.tick}>pass</span>
          <span className={s.pass} ref={passRef}>
            00
          </span>
          <span className={s.gripTrack}>
            <span className={s.gripFill} ref={gripRef} />
          </span>
        </div>
        <div className={s.right}>
          <span className={s.tick}>score</span>
          <span className={s.score} ref={scoreRef}>
            0
          </span>
          <span className={s.streak} ref={streakRef} />
        </div>
      </div>

      {ui.idea ? (
        <p key={ui.ideaKey} className={s.idea}>
          {ui.idea}
        </p>
      ) : null}

      {ui.rating && !titleUp ? (
        <p key={`r${ui.ratingKey}`} className={s.rating} data-q={ui.rating}>
          {ui.rating}
        </p>
      ) : null}

      {airborne && ui.turns > 0 ? (
        <p className={s.turnHint}>
          {ui.tucked ? "press to open out" : "hands out"}
        </p>
      ) : null}

      {titleUp ? (
        <div className={s.card}>
          <p className={s.kicker}>an experiment for one button</p>
          <h1 className={s.title}>Trapeze</h1>
          <p className={s.lede}>
            One decision, made over and over: <em>when to let go</em>. The swing
            is a real pendulum and your arc is whatever momentum you leave with,
            so this is not a reflex test — it is a reading test.
          </p>
          <button
            type="button"
            className={s.begin}
            data-passthrough="true"
            onClick={press}
          >
            take the bar
          </button>
          <p className={s.control}>
            <kbd>space</kbd> &nbsp;or tap anywhere. There is no second control.
          </p>
          {ui.best.score > 0 ? (
            <p className={s.prev}>
              your best: {ui.best.score} over {ui.best.passes}{" "}
              {ui.best.passes === 1 ? "pass" : "passes"}
            </p>
          ) : null}
        </div>
      ) : null}

      {over ? (
        <div className={s.card} data-over="true">
          <p className={s.kicker}>{ui.endPasses === 0 ? "into the net" : "the net"}</p>
          <p className={s.bigNum}>{ui.endScore}</p>
          <p className={s.lede}>
            {ui.endPasses} {ui.endPasses === 1 ? "pass" : "passes"} caught.
            {ui.newBest ? " A personal best." : ` Best ${ui.best.score}.`}
          </p>
          <button
            type="button"
            className={s.begin}
            data-passthrough="true"
            onClick={press}
          >
            again
          </button>
          <p className={s.control}>
            <kbd>space</kbd> &nbsp;to go straight back up
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
        <Link
          className={s.quiet}
          href="/tasks/games-one-button"
          data-passthrough="true"
        >
          the brief
        </Link>
      </div>
    </div>
  );
}
