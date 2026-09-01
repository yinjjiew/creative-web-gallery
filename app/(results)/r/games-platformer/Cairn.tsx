"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import { Stage } from "./draw";
import { advance, footDue, newGame, type Game, type Input } from "./sim";
import s from "./cairn.module.css";

const MUTE_KEY = "cairn.muted.v1";

type Pad = "left" | "right" | "jump";

interface Ui {
  deaths: number;
  stones: number;
  ascents: number;
  moved: boolean;
  summit: boolean;
}

const INITIAL: Ui = {
  deaths: 0,
  stones: 0,
  ascents: 0,
  moved: false,
  summit: false,
};

export default function Cairn() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const liveRef = useRef<HTMLParagraphElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const inputRef = useRef<Input>({
    left: false,
    right: false,
    jumpHeld: false,
    jumpDown: false,
  });
  const keysRef = useRef({ left: false, right: false, jump: false });
  const padsRef = useRef({ left: false, right: false, jump: false });
  const mutedRef = useRef(false);
  const pointersRef = useRef(new Map<number, Pad>());

  const [ui, setUi] = useState<Ui>(INITIAL);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState({ left: false, right: false, jump: false });

  const syncInput = useCallback(() => {
    const k = keysRef.current;
    const p = padsRef.current;
    const left = k.left || p.left;
    const right = k.right || p.right;
    const jump = k.jump || p.jump;
    const inp = inputRef.current;
    if (jump && !inp.jumpHeld) inp.jumpDown = true;
    inp.left = left;
    inp.right = right;
    inp.jumpHeld = jump;
    setHeld({ left, right, jump });
  }, []);

  const wake = useCallback(() => {
    soundRef.current?.ensure();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && el.dataset.passthrough === "true" && e.code === "Space") return;
      let used = true;
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = e.type === "keydown";
      else if (e.code === "ArrowRight" || e.code === "KeyD")
        keysRef.current.right = e.type === "keydown";
      else if (
        e.code === "Space" ||
        e.code === "ArrowUp" ||
        e.code === "KeyW" ||
        e.code === "KeyK" ||
        e.code === "KeyZ"
      ) {
        if (e.type === "keydown" && e.repeat) return;
        keysRef.current.jump = e.type === "keydown";
      } else used = false;
      if (!used) return;
      e.preventDefault();
      if (e.type === "keydown") wake();
      syncInput();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [syncInput, wake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = motion.matches;
    const game = newGame(reduced);
    const stage = new Stage(reduced);
    const sound = new Sound();
    gameRef.current = game;
    stageRef.current = stage;
    soundRef.current = sound;
    stage.camX = game.x + 40;
    stage.camY = game.y;

    const startMuted = localStorage.getItem(MUTE_KEY) === "1";
    mutedRef.current = startMuted;
    setMuted(startMuted);
    sound.setMuted(startMuted);

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 16 || h < 16) return;
      /* Keep the backing store modest. Ink-wash does not need a 1440 buffer,
         and a large live canvas is what makes screenshot readback hang here. */
      const maxW = 960;
      const bufW = Math.min(w, maxW);
      const bufH = Math.round(bufW * (h / w));
      canvas.width = bufW;
      canvas.height = bufH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      stage.resize(bufW, bufH, 1);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let lastWalk = 0;
    let shownDeaths = -1;
    let shownStones = -1;
    let shownAscents = -1;
    let shownMoved = false;
    let shownSummit = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const inp = inputRef.current;
      advance(game, inp, dt);
      inp.jumpDown = false;

      if (footDue(game, lastWalk)) {
        game.events.push({
          type: "foot",
          x: game.x,
          y: game.y + 20,
          v: Math.abs(game.vx),
        });
      }
      lastWalk = game.walk;

      if (game.events.length) {
        sound.handle(game.events, game);
        for (const e of game.events) {
          if (e.type === "land") stage.puff(e.x, e.y, 4 + Math.round(e.hard * 8), e.hard);
          if (e.type === "die") {
            stage.puff(e.x, e.y, 10, 1);
            stage.flash = 0.55;
          }
          if (e.type === "stone") stage.puff(e.x, e.y, 6, 0.4);
          if (e.type === "summit") stage.flash = 0.8;
        }
        game.events.length = 0;
      }

      sound.update(game);
      stage.update(game, dt);
      if (game.shake > 0 && !stage.reduced) {
        const j = game.shake * 3.5;
        stage.camX += Math.sin(now * 0.08) * j;
        stage.camY += Math.cos(now * 0.11) * j;
      }
      stage.draw(ctx, game);
      canvas.dataset.tick = String(Math.floor(game.time * 10));

      if (
        game.deaths !== shownDeaths ||
        game.stones.length !== shownStones ||
        game.ascents !== shownAscents ||
        game.moved !== shownMoved ||
        game.atSummit !== shownSummit
      ) {
        shownDeaths = game.deaths;
        shownStones = game.stones.length;
        shownAscents = game.ascents;
        shownMoved = game.moved;
        shownSummit = game.atSummit;
        setUi({
          deaths: game.deaths,
          stones: game.stones.length,
          ascents: game.ascents,
          moved: game.moved,
          summit: game.atSummit,
        });
        if (liveRef.current) {
          liveRef.current.textContent = game.atSummit
            ? `The summit cairn. ${game.stones.length} stones on the ridge.`
            : `${game.deaths} deaths, ${game.stones.length} stones.`;
        }
      }
    };
    raf = requestAnimationFrame(frame);

    const onMotion = () => {
      game.reduced = motion.matches;
      stage.reduced = motion.matches;
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
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    soundRef.current?.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* session-only if storage is blocked */
    }
  }, []);

  const padDown = useCallback(
    (pad: Pad, id: number) => {
      wake();
      pointersRef.current.set(id, pad);
      padsRef.current[pad] = true;
      syncInput();
    },
    [syncInput, wake],
  );

  const padUp = useCallback(
    (id: number) => {
      const pad = pointersRef.current.get(id);
      if (!pad) return;
      pointersRef.current.delete(id);
      let still = false;
      pointersRef.current.forEach((p) => {
        if (p === pad) still = true;
      });
      padsRef.current[pad] = still;
      syncInput();
    },
    [syncInput],
  );

  const bindPad = (pad: Pad) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture needs a real pointer; hold state still tracks */
      }
      padDown(pad, e.pointerId);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      padUp(e.pointerId);
    },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
      padUp(e.pointerId);
    },
  });

  return (
    <div ref={wrapRef} className={s.wrap}>
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />

      <div className={s.hud}>
        <div className={s.top}>
          <div className={s.place}>
            <p className={s.ridge}>Beinn a&apos; Chròin · last light</p>
            <h1 className={s.name}>Cairn</h1>
          </div>
          <div className={s.counts}>
            <dl>
              <dt>stones</dt>
              <dd>{ui.stones}</dd>
            </dl>
            <dl>
              <dt>falls</dt>
              <dd>{ui.deaths}</dd>
            </dl>
          </div>
        </div>

        <p className={s.lede} data-gone={ui.moved ? "true" : "false"}>
          A designed ridge, after rain. Miss a jump and you leave a stone —
          solid, stacked, part of the problem. Grind a hard section and you
          build a way through it. The same cairn can wall the route you still
          need.
        </p>

        {ui.summit ? (
          <p className={s.note}>
            The ridge remembers. {ui.stones}{" "}
            {ui.stones === 1 ? "stone" : "stones"} from {ui.deaths}{" "}
            {ui.deaths === 1 ? "fall" : "falls"}
            {ui.ascents > 1 ? ` · ${ui.ascents} ascents` : ""}. Walk back down,
            or keep the cairn.
          </p>
        ) : null}

        <p className={s.model}>
          Course invented for this piece, not a surveyed Munro. Stones are the
          only record — nothing is stored off the page.
        </p>

        <p className={s.keys}>arrows or wasd · space to jump</p>
      </div>

      <div className={s.pads} aria-hidden="false">
        <div className={s.steer}>
          <button
            type="button"
            className={s.pad}
            aria-label="Left"
            data-held={held.left ? "true" : "false"}
            {...bindPad("left")}
          >
            ‹
          </button>
          <button
            type="button"
            className={s.pad}
            aria-label="Right"
            data-held={held.right ? "true" : "false"}
            {...bindPad("right")}
          >
            ›
          </button>
        </div>
        <div className={s.jump}>
          <button
            type="button"
            className={s.pad}
            aria-label="Jump"
            data-held={held.jump ? "true" : "false"}
            {...bindPad("jump")}
          >
            jump
          </button>
        </div>
      </div>

      <p className={s.live} ref={liveRef} aria-live="polite" />

      <div className={s.corner}>
        <button
          type="button"
          className={s.quiet}
          onClick={toggleMute}
          data-passthrough="true"
          aria-pressed={muted}
        >
          wind {muted ? "off" : "on"}
        </button>
        <Link className={s.quiet} href="/tasks/games-platformer" data-passthrough="true">
          the brief
        </Link>
      </div>
    </div>
  );
}
