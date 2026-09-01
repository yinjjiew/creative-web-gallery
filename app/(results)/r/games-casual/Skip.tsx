"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import { Stage } from "./draw";
import {
  STONES,
  WATERS,
  advance,
  aimDegrees,
  beginWind,
  emptyJournal,
  newGame,
  nudgeAttack,
  record,
  release,
  resetThrow,
  setAim,
  setStone,
  setWater,
  verdict,
  words,
  type Journal,
  type Phase,
  type StoneId,
  type WaterId,
} from "./sim";
import s from "./skip.module.css";

const JOURNAL_KEY = "skip.journal.v1";
const MUTE_KEY = "skip.muted.v1";

const STONE_IDS = Object.keys(STONES) as StoneId[];
const WATER_IDS = Object.keys(WATERS) as WaterId[];

function readJournal(): Journal {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return emptyJournal();
    const v = JSON.parse(raw) as Partial<Journal>;
    const base = emptyJournal();
    return {
      best: Math.max(0, Math.floor(Number(v.best) || 0)),
      throws: Math.max(0, Math.floor(Number(v.throws) || 0)),
      byStone: { ...base.byStone, ...(v.byStone ?? {}) },
      byWater: { ...base.byWater, ...(v.byWater ?? {}) },
      lastStone: STONE_IDS.includes(v.lastStone as StoneId)
        ? (v.lastStone as StoneId)
        : "shale",
      lastWater: WATER_IDS.includes(v.lastWater as WaterId)
        ? (v.lastWater as WaterId)
        : "still",
    };
  } catch {
    return emptyJournal();
  }
}

interface Ui {
  phase: Phase;
  skips: number;
  line: string;
  power: number;
  attack: number;
  spin: number;
  place: WaterId;
  stone: StoneId;
  journal: Journal;
}

const INITIAL: Ui = {
  phase: "idle",
  skips: 0,
  line: "pull back to throw",
  power: 0,
  attack: 20,
  spin: 0,
  place: "still",
  stone: "shale",
  journal: emptyJournal(),
};

export default function Skip() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<ReturnType<typeof newGame> | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const journalRef = useRef<Journal>(emptyJournal());
  const mutedRef = useRef(false);
  const keysRef = useRef({ space: false, up: false, down: false });
  const ptrRef = useRef<{
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const [ui, setUi] = useState<Ui>(INITIAL);
  const [muted, setMuted] = useState(false);

  const syncAimFromPointer = useCallback((clientX: number, clientY: number) => {
    const g = gameRef.current;
    const wrap = wrapRef.current;
    const ptr = ptrRef.current;
    if (!g || !wrap || !ptr) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const reach = Math.min(168, Math.min(w, h) * 0.3);
    const dx = ptr.x - clientX;
    const dy = clientY - ptr.y;
    const dist = Math.hypot(dx, dy);
    const power = Math.max(0.08, Math.min(1, (dist - 8) / reach));
    // Pull up (negative dy) cocks the stone steeper. Pull down lays it flat.
    const attack =
      (20 - Math.max(-1, Math.min(1, dy / reach)) * 22) * (Math.PI / 180);
    const flick = Math.hypot(clientX - ptr.lastX, clientY - ptr.lastY) * 0.08;
    setAim(g, power, attack, flick);
    ptr.lastX = clientX;
    ptr.lastY = clientY;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const g = gameRef.current;
      if (!g || g.phase === "flight") return;
      soundRef.current?.ensure();
      e.currentTarget.setPointerCapture(e.pointerId);
      ptrRef.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
      };
      beginWind(g);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!ptrRef.current || ptrRef.current.id !== e.pointerId) return;
      syncAimFromPointer(e.clientX, e.clientY);
    },
    [syncAimFromPointer]
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ptrRef.current || ptrRef.current.id !== e.pointerId) return;
    const g = gameRef.current;
    ptrRef.current = null;
    if (g && g.phase === "wind") release(g);
  }, []);

  const pickStone = useCallback((id: StoneId) => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    setStone(g, id);
  }, []);

  const pickWater = useCallback((id: WaterId) => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current?.ensure();
    setWater(g, id);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    soundRef.current?.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "BUTTON" || el.tagName === "A") && e.code === "Space") {
        return;
      }
      const g = gameRef.current;
      if (!g) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        soundRef.current?.ensure();
        keysRef.current.space = true;
        if (g.phase !== "flight" && g.phase !== "wind") beginWind(g);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        keysRef.current.up = true;
        nudgeAttack(g, 2 * (Math.PI / 180));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        keysRef.current.down = true;
        nudgeAttack(g, -2 * (Math.PI / 180));
      } else if (e.code === "Digit1") pickStone("shale");
      else if (e.code === "Digit2") pickStone("slate");
      else if (e.code === "Digit3") pickStone("granite");
      else if (e.code === "Digit4") pickStone("cobble");
      else if (e.code === "KeyQ") pickWater("still");
      else if (e.code === "KeyW") pickWater("fetch");
      else if (e.code === "KeyE") pickWater("rain");
      else if (e.code === "KeyM") toggleMute();
      else if (e.code === "KeyR") {
        if (g.phase !== "flight") resetThrow(g);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.code === "Space") {
        keysRef.current.space = false;
        if (g && g.phase === "wind" && !ptrRef.current) release(g);
      } else if (e.code === "ArrowUp") keysRef.current.up = false;
      else if (e.code === "ArrowDown") keysRef.current.down = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [pickStone, pickWater, toggleMute]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = motion.matches;
    const journal = readJournal();
    journalRef.current = journal;
    const game = newGame(journal.lastStone, journal.lastWater, reduced);
    const stage = new Stage(reduced);
    const sound = new Sound();
    gameRef.current = game;
    stageRef.current = stage;
    soundRef.current = sound;

    const startMuted = localStorage.getItem(MUTE_KEY) === "1";
    mutedRef.current = startMuted;
    setMuted(startMuted);
    sound.setMuted(startMuted);
    setUi((u) => ({
      ...u,
      journal,
      stone: journal.lastStone,
      place: journal.lastWater,
    }));

    const resize = () => {
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

    let raf = 0;
    let last = performance.now();
    let shownPhase: Phase = game.phase;
    let shownSkips = -1;
    let shownLine = "";
    let shownStone: StoneId = game.stone.id;
    let shownWater: WaterId = game.water.id;
    let shownWind = "";

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.12, (now - last) / 1000);
      last = now;

      if (game.phase === "wind") {
        if (keysRef.current.up) nudgeAttack(game, 1.1 * dt);
        if (keysRef.current.down) nudgeAttack(game, -1.1 * dt);
        if (keysRef.current.space && !ptrRef.current) {
          const p = Math.min(1, game.power + dt * 0.85);
          setAim(game, p, game.aimAttack);
        }
      }

      advance(game, dt);

      if (game.events.length) {
        sound.handle(game.events, game);
        for (const e of game.events) {
          if (e.type === "skip") {
            stage.ripple(e.x, e.z, 0.045 + e.index * 0.004, e.index);
            stage.kick(e.index);
          } else if (e.type === "plough" || e.type === "tumble") {
            stage.ripple(e.x, e.z, 0.08, 0);
          } else if (e.type === "flat") {
            stage.ripple(e.x, e.z, 0.03, 0);
          } else if (e.type === "splash") {
            stage.splash(e.x, 0.04, e.z, e.energy);
          } else if (e.type === "sink") {
            const next = record(journalRef.current, game);
            journalRef.current = next;
            try {
              localStorage.setItem(JOURNAL_KEY, JSON.stringify(next));
            } catch {
              /* ignore */
            }
          } else if (e.type === "pickup") {
            stage.clearTrail();
          }
        }
        game.events.length = 0;
      }

      sound.update(game);
      stage.update(game, dt);
      stage.draw(ctx, game);

      const line = (() => {
        if (game.phase === "idle") return "pull back to throw · space to wind";
        if (game.phase === "wind") return "release to throw";
        if (game.phase === "flight") {
          return game.skips === 0 ? "in the air" : words(game.skips);
        }
        return verdict(game);
      })();

      if (
        game.phase !== shownPhase ||
        game.skips !== shownSkips ||
        line !== shownLine ||
        game.stone.id !== shownStone ||
        game.water.id !== shownWater
      ) {
        shownPhase = game.phase;
        shownSkips = game.skips;
        shownLine = line;
        shownStone = game.stone.id;
        shownWater = game.water.id;
        setUi({
          phase: game.phase,
          skips: game.skips,
          line,
          power: game.power,
          attack: aimDegrees(game),
          spin: Math.round(game.aimSpin),
          place: game.water.id,
          stone: game.stone.id,
          journal: journalRef.current,
        });
      } else if (game.phase === "wind") {
        const key = `${Math.round(game.power * 20)}:${aimDegrees(game)}:${Math.round(game.aimSpin)}`;
        if (key !== shownWind) {
          shownWind = key;
          setUi((u) => ({
            ...u,
            power: game.power,
            attack: aimDegrees(game),
            spin: Math.round(game.aimSpin),
            line,
          }));
        }
      }
    };
    raf = requestAnimationFrame(frame);

    const onMotion = () => {
      game.reduced = motion.matches;
      stage.reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      motion.removeEventListener("change", onMotion);
      sound.close();
    };
  }, []);

  const water = WATERS[ui.place];
  const stone = STONES[ui.stone];
  const showCount =
    ui.phase === "flight" || ui.phase === "sunk" ? ui.skips : null;

  return (
    <div
      ref={wrapRef}
      className={s.wrap}
      data-place={ui.place}
      data-phase={ui.phase}
    >
      <canvas
        ref={canvasRef}
        className={s.canvas}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="A lake. Pull back on the stone to throw it, or hold space to wind up."
      />

      <div className={s.hud}>
        <div className={s.top}>
          <div className={s.place}>
            <h1 className={s.name}>{water.name}</h1>
            <p className={s.note}>{water.note}</p>
          </div>
          <dl className={s.best}>
            <dt>best</dt>
            <dd>{ui.journal.best}</dd>
          </dl>
        </div>

        {showCount !== null && (
          <div className={s.count} aria-hidden="true">
            <strong>{showCount}</strong>
            <p>{ui.line}</p>
          </div>
        )}

        {ui.phase === "wind" && (
          <div className={s.wind} aria-hidden="true">
            <span>
              attack <b>{ui.attack}°</b>
            </span>
            <span>
              spin <b>{ui.spin < 18 ? "still" : ui.spin < 40 ? "turning" : "true"}</b>
            </span>
            <span>
              pace <b>{Math.round(ui.power * 100)}</b>
            </span>
          </div>
        )}

        {ui.phase === "idle" && (
          <p className={s.hint}>
            pull back to throw · space to wind · ↑↓ sets the angle
          </p>
        )}

        <div className={s.dock}>
          <div className={s.group}>
            <span>stone</span>
            <div className={s.picks}>
              {STONE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={s.pick}
                  aria-pressed={ui.stone === id}
                  onClick={() => pickStone(id)}
                >
                  {STONES[id].name}
                </button>
              ))}
            </div>
          </div>
          <div className={s.group}>
            <span>water</span>
            <div className={s.picks}>
              {WATER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={s.pick}
                  aria-pressed={ui.place === id}
                  onClick={() => pickWater(id)}
                >
                  {WATERS[id].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className={s.model}>
          A model of attack, spin, pace and the surface — not a recording of a
          particular lake. {stone.note}
        </p>
      </div>

      <div className={s.corner}>
        <button type="button" className={s.quiet} onClick={toggleMute}>
          {muted ? "sound off" : "sound"}
        </button>
        <Link href="/tasks/games-casual" className={s.quiet}>
          about
        </Link>
      </div>

      <p className={s.live} aria-live="polite">
        {ui.phase === "sunk"
          ? `${ui.skips} skips. ${ui.line}`
          : ui.phase === "flight"
            ? `${ui.skips} ${ui.skips === 1 ? "skip" : "skips"}`
            : `${water.name}. ${stone.name}. ${ui.line}`}
      </p>
    </div>
  );
}
