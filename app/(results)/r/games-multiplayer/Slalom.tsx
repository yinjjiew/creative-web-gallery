"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import {
  cleanName,
  encodeRun,
  formatTime,
  readHash,
  signedSplit,
  type PackedRun,
} from "./codec";
import { Stage } from "./draw";
import {
  DT,
  GATES,
  MISS_PENALTY,
  copyRun,
  freshRun,
  lerpSkier,
  replay,
  step,
  type Run,
  type Steer,
} from "./sim";
import s from "./slalom.module.css";

const MUTE_KEY = "slalom.muted.v1";
const NAME_KEY = "slalom.name.v1";

type Phase = "ready" | "run" | "done";

interface Challenge {
  packed: PackedRun;
  result: Run;
  bytes: number;
}

interface Ui {
  phase: Phase;
  challenge: Challenge | null;
  hashBroken: boolean;
  name: string;
  minted: string | null;
  copied: boolean;
  result: Run | null;
  recorded: Steer[];
}

function loadName(): string {
  try {
    return cleanName(localStorage.getItem(NAME_KEY) ?? "");
  } catch {
    return "";
  }
}

function parseChallenge(): { challenge: Challenge | null; hashBroken: boolean } {
  const hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#s=") return { challenge: null, hashBroken: false };
  const packed = readHash(hash);
  if (!packed) return { challenge: null, hashBroken: true };
  const result = replay(packed.steers);
  return {
    challenge: { packed, result, bytes: Math.max(0, hash.length - 3) },
    hashBroken: false,
  };
}

function mintUrl(run: PackedRun): string {
  const token = encodeRun(run);
  const url = `${window.location.origin}${window.location.pathname}#${token}`;
  history.replaceState(null, "", `#${token}`);
  return url;
}

export default function Slalom() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const metaRef = useRef<HTMLSpanElement | null>(null);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const liveRef = useRef<HTMLParagraphElement | null>(null);

  const playerRef = useRef<Run>(freshRun());
  const ghostRef = useRef<Run | null>(null);
  const ghostSteersRef = useRef<Steer[] | null>(null);
  const recordedRef = useRef<Steer[]>([]);
  const phaseRef = useRef<Phase>("ready");
  const stageRef = useRef<Stage | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const steerRef = useRef<Steer>(0);
  const keysRef = useRef({ left: false, right: false });
  const padsRef = useRef({ left: false, right: false });
  const mutedRef = useRef(false);
  const pointersRef = useRef(new Map<number, "left" | "right">());
  const splitUntilRef = useRef(0);
  const accRef = useRef(0);
  const challengeRef = useRef<Challenge | null>(null);

  const [ui, setUi] = useState<Ui>({
    phase: "ready",
    challenge: null,
    hashBroken: false,
    name: "",
    minted: null,
    copied: false,
    result: null,
    recorded: [],
  });
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState({ left: false, right: false });

  const syncSteer = useCallback(() => {
    const left = keysRef.current.left || padsRef.current.left;
    const right = keysRef.current.right || padsRef.current.right;
    steerRef.current = left === right ? 0 : left ? -1 : 1;
    setHeld({ left, right });
  }, []);

  const wake = useCallback(() => {
    soundRef.current?.ensure();
  }, []);

  const drop = useCallback(() => {
    if (phaseRef.current !== "ready") return;
    wake();
    phaseRef.current = "run";
    playerRef.current = freshRun();
    recordedRef.current = [];
    accRef.current = 0;
    const ch = ghostSteersRef.current;
    ghostRef.current = ch ? freshRun() : null;
    stageRef.current?.resetFx();
    soundRef.current?.drop();
    setUi((u) => ({
      ...u,
      phase: "run",
      minted: null,
      copied: false,
      result: null,
    }));
  }, [wake]);

  const finish = useCallback((run: Run, recorded: Steer[]) => {
    phaseRef.current = "done";
    const ghost = challengeRef.current;
    let won: boolean | null = null;
    if (ghost && run.finished && !run.dnf) {
      if (!ghost.result.finished || ghost.result.dnf) won = true;
      else {
        const a = run.tick + run.misses * MISS_PENALTY;
        const b = ghost.result.tick + ghost.packed.misses * MISS_PENALTY;
        won = a < b ? true : a > b ? false : null;
      }
    }
    soundRef.current?.finish(won);
    setUi((u) => ({
      ...u,
      phase: "done",
      result: copyRun(run),
      recorded: recorded.slice(),
    }));
    if (liveRef.current) {
      liveRef.current.textContent = run.dnf
        ? "Did not finish."
        : `Finished in ${formatTime(run.tick, DT)}.`;
    }
  }, []);

  const retry = useCallback(() => {
    wake();
    phaseRef.current = "ready";
    playerRef.current = freshRun();
    ghostRef.current = ghostSteersRef.current ? freshRun() : null;
    recordedRef.current = [];
    accRef.current = 0;
    stageRef.current?.resetFx();
    setUi((u) => ({
      ...u,
      phase: "ready",
      minted: null,
      copied: false,
      result: null,
    }));
  }, [wake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stage = new Stage();
    stage.reduced = motion.matches;
    const sound = new Sound();
    stageRef.current = stage;
    soundRef.current = sound;

    const startMuted = (() => {
      try {
        return localStorage.getItem(MUTE_KEY) === "1";
      } catch {
        return false;
      }
    })();
    mutedRef.current = startMuted;
    setMuted(startMuted);
    sound.setMuted(startMuted);

    const opened = parseChallenge();
    challengeRef.current = opened.challenge;
    ghostSteersRef.current = opened.challenge?.packed.steers ?? null;
    ghostRef.current = opened.challenge ? freshRun() : null;
    playerRef.current = freshRun();
    phaseRef.current = "ready";
    setUi((u) => ({
      ...u,
      challenge: opened.challenge,
      hashBroken: opened.hashBroken,
      name: loadName(),
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
    let shownTick = -1;
    let shownGate = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const player = playerRef.current;
      const ghost = ghostRef.current;
      const phase = phaseRef.current;

      if (phase === "run") {
        accRef.current += dt;
        if (accRef.current > 0.2) accRef.current = 0.2;
        while (accRef.current >= DT) {
          const steer = steerRef.current;
          recordedRef.current.push(steer);
          step(player, steer);
          if (ghost && ghostSteersRef.current) {
            const gs = ghostSteersRef.current[ghost.tick] ?? 0;
            if (!ghost.finished && !ghost.dnf) step(ghost, gs);
          }
          if (player.justClip) {
            sound.clip(clampPan(player.skier.x));
          }
          if (player.justGate !== null) {
            const miss = player.justGate < 0;
            sound.gate(!miss, clampPan(player.skier.x));
            const idx = miss ? -1 - player.justGate : player.justGate;
            const gRun = challengeRef.current?.result;
            if (gRun && gRun.gateTicks[idx] !== undefined && splitRef.current) {
              const text = signedSplit(player.gateTicks[idx], gRun.gateTicks[idx], DT);
              const kind = text.startsWith("+") ? "behind" : text.startsWith("−") ? "ahead" : "even";
              splitRef.current.textContent = `gate ${idx + 1}  ${text}`;
              splitRef.current.dataset.kind = kind;
              splitRef.current.dataset.on = "true";
              splitUntilRef.current = now + 1400;
            }
          }
          accRef.current -= DT;
          if (player.finished || player.dnf) {
            finish(player, recordedRef.current);
            break;
          }
        }
      }

      const alpha = phase === "run" ? accRef.current / DT : 1;
      const pPose = lerpSkier(player.skier, alpha);
      const gPose = ghost ? lerpSkier(ghost.skier, ghost.finished ? 1 : alpha) : null;
      const idle = phase === "ready" && !motion.matches ? Math.sin(now / 700) * 0.1 : 0;

      stage.update(dt, pPose, gPose, phase === "run");
      sound.update(pPose.speed, pPose.lean, phase === "run");
      stage.draw(ctx, pPose, gPose, player, ghost, phase === "run", idle);

      if (player.tick !== shownTick && timeRef.current) {
        shownTick = player.tick;
        timeRef.current.textContent = formatTime(player.tick, DT);
      }
      if ((player.nextGate !== shownGate || phase === "ready") && metaRef.current) {
        shownGate = player.nextGate;
        const miss = player.misses ? ` · ${player.misses} miss` : "";
        metaRef.current.textContent =
          phase === "ready"
            ? challengeRef.current
              ? `${challengeRef.current.packed.name}  ·  ${formatTime(challengeRef.current.result.tick, DT)}`
              : "lean to drop"
            : `${Math.min(player.nextGate, GATES.length)} / ${GATES.length}${miss}`;
      }
      if (splitRef.current && now > splitUntilRef.current) {
        splitRef.current.dataset.on = "false";
      }
    };
    raf = requestAnimationFrame(frame);

    const onMotion = () => {
      stage.reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);
    const onHide = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onHide);
    const onHash = () => {
      const next = parseChallenge();
      challengeRef.current = next.challenge;
      ghostSteersRef.current = next.challenge?.packed.steers ?? null;
      ghostRef.current = next.challenge ? freshRun() : null;
      retry();
      setUi((u) => ({ ...u, challenge: next.challenge, hashBroken: next.hashBroken }));
    };
    window.addEventListener("hashchange", onHash);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("hashchange", onHash);
      sound.close();
    };
    // The loop owns its own state for its whole lifetime, by design.
    // finish/retry are stable enough; challenge is read once at boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && el.dataset.passthrough === "true") return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keysRef.current.left = e.type === "keydown";
        e.preventDefault();
        if (e.type === "keydown") {
          wake();
          if (phaseRef.current === "ready") drop();
        }
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        keysRef.current.right = e.type === "keydown";
        e.preventDefault();
        if (e.type === "keydown") {
          wake();
          if (phaseRef.current === "ready") drop();
        }
      } else if (e.type === "keydown" && (e.code === "KeyR" || e.code === "Space")) {
        if (el && (el.tagName === "INPUT" || el.tagName === "BUTTON")) return;
        e.preventDefault();
        if (phaseRef.current === "done") retry();
        else if (phaseRef.current === "ready") drop();
      } else if (e.type === "keydown" && e.code === "KeyM") {
        toggleMute();
        return;
      } else {
        return;
      }
      syncSteer();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [drop, retry, syncSteer, wake]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    soundRef.current?.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* session-only is fine */
    }
  }, []);

  const onPad = (side: "left" | "right", down: boolean, id?: number) => {
    if (down && id !== undefined) pointersRef.current.set(id, side);
    if (!down && id !== undefined) pointersRef.current.delete(id);
    padsRef.current[side] = down;
    if (down) {
      wake();
      if (phaseRef.current === "ready") drop();
    }
    syncSteer();
  };

  const onName = (value: string) => {
    const name = cleanName(value);
    setUi((u) => ({ ...u, name }));
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* session-only is fine */
    }
  };

  const onMint = async () => {
    const result = ui.result;
    if (!result) return;
    const packed: PackedRun = {
      name: cleanName(ui.name) || "a skier",
      steers: ui.recorded,
      misses: result.misses,
      finished: result.finished,
      dnf: result.dnf,
    };
    const url = mintUrl(packed);
    setUi((u) => ({ ...u, minted: url, copied: false }));
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({
          title: `${packed.name} · ${formatTime(result.tick, DT)}`,
          text: `${packed.name} ran ${formatTime(result.tick, DT)}. The link is the run.`,
          url,
        });
        setUi((u) => ({ ...u, copied: true }));
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setUi((u) => ({ ...u, copied: true }));
    } catch {
      /* the address bar already holds the run */
      setUi((u) => ({ ...u, copied: true }));
    }
  };

  const clearGhost = () => {
    history.replaceState(null, "", window.location.pathname);
    challengeRef.current = null;
    ghostSteersRef.current = null;
    ghostRef.current = null;
    retry();
    setUi((u) => ({ ...u, challenge: null, hashBroken: false }));
  };

  const ch = ui.challenge;
  const res = ui.result;
  const penalty = res ? res.misses * 2 : 0;
  const official = res && res.finished ? res.tick + res.misses * MISS_PENALTY : res?.tick ?? 0;
  const ghostOfficial = ch ? ch.result.tick + ch.packed.misses * MISS_PENALTY : 0;

  let verdict = "";
  let kicker = "the slip";
  if (res?.dnf) {
    kicker = "did not finish";
    verdict = "The mountain kept you. The inputs are still a line, if you want to send them.";
  } else if (res && ch) {
    const d = (official - ghostOfficial) * DT;
    if (d < -0.005) {
      kicker = "you took it";
      verdict = `You beat ${ch.packed.name} by ${Math.abs(d).toFixed(2)}. The rematch is this address — mint it and send it back.`;
    } else if (d > 0.005) {
      kicker = "they still hold it";
      verdict = `${ch.packed.name} keeps the line by ${d.toFixed(2)}. Send yours anyway. A rivalry is not only winning.`;
    } else {
      kicker = "dead heat";
      verdict = `The same time, to the hundredth. The ghost is still ${ch.packed.name}. Mint yours and make them go again.`;
    }
  } else if (res) {
    kicker = "your line";
    verdict =
      "Sign the slip. Minting writes the run into this address — inputs, a name, a time. Nothing is stored anywhere else.";
  }

  return (
    <div ref={wrapRef} className={s.wrap} data-phase={ui.phase}>
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />

      <div className={s.pads} aria-hidden="true">
        <button
          type="button"
          className={s.pad}
          data-held={held.left}
          tabIndex={-1}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            onPad("left", true, e.pointerId);
          }}
          onPointerUp={(e) => onPad("left", false, e.pointerId)}
          onPointerCancel={(e) => onPad("left", false, e.pointerId)}
        />
        <button
          type="button"
          className={s.pad}
          data-held={held.right}
          tabIndex={-1}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            onPad("right", true, e.pointerId);
          }}
          onPointerUp={(e) => onPad("right", false, e.pointerId)}
          onPointerCancel={(e) => onPad("right", false, e.pointerId)}
        />
      </div>

      <div className={s.hud}>
        <div className={s.clock}>
          <span className={s.time} ref={timeRef}>
            00.00
          </span>
          <span className={s.clockMeta} ref={metaRef}>
            lean to drop
          </span>
        </div>
        <div className={s.split} ref={splitRef} data-on="false" />
      </div>

      {ui.phase === "ready" && (
        <aside className={`${s.slip} ${s.readySlip}`} aria-label="Challenge">
          {ch ? (
            <>
              <p className={s.kicker}>a challenge in this address</p>
              <h1 className={s.who}>{ch.packed.name}</h1>
              <p className={s.mark}>
                {formatTime(ch.result.tick, DT)}
                {ch.packed.misses ? `  ·  ${ch.packed.misses} miss` : "  ·  clean"}
              </p>
              <p className={s.prose}>
                {ch.packed.name} carved this line. Their inputs are packed in the
                hash — {ch.packed.steers.length} ticks, {ch.bytes} characters.
                Lean, and you drop with their ghost.
              </p>
              <p className={s.honest}>
                Nothing is stored on a server. Close the tab without the link and
                the run is gone.
              </p>
              <div className={s.row}>
                <button type="button" className={s.act} onClick={drop}>
                  race them
                </button>
                <button type="button" className={s.ghost} onClick={clearGhost} data-passthrough="true">
                  ski alone
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={s.kicker}>{ui.hashBroken ? "this link did not decode" : "slalom"}</p>
              <h1 className={s.who}>A run that fits in a link.</h1>
              <p className={s.prose}>
                {ui.hashBroken
                  ? "The hash was not a run. The course is still here — lean to drop, then mint a clean challenge."
                  : "Carve a line. When you finish, the inputs become an address. A friend opens it and races your ghost. Beating it mints the rematch."}
              </p>
              <p className={s.honest}>
                No server. The link is the entire run — a name, a time, and the
                steer that made it, packed so a replay is exact.
              </p>
              <div className={s.row}>
                <button type="button" className={s.act} onClick={drop}>
                  drop in
                </button>
              </div>
            </>
          )}
        </aside>
      )}

      {ui.phase === "done" && res && (
        <aside className={`${s.slip} ${s.doneSlip}`} aria-label="Result">
          <p className={s.kicker}>{kicker}</p>
          <h1 className={s.who}>{cleanName(ui.name) || "your line"}</h1>
          <p className={s.mark}>
            {res.dnf ? "DNF" : formatTime(res.tick, DT)}
            {res.misses ? `  +${penalty.toFixed(0)}.00  ·  ${res.misses} miss` : res.finished ? "  ·  clean" : ""}
          </p>
          <p className={s.prose}>{verdict}</p>
          <p className={s.honest}>
            This address will hold the run after you mint. Nothing is written
            anywhere else — there is no account, no board, no copy but the one
            someone kept.
          </p>
          <div className={s.row}>
            <input
              className={s.name}
              data-passthrough="true"
              value={ui.name}
              onChange={(e) => onName(e.target.value)}
              placeholder="sign the slip"
              maxLength={20}
              aria-label="Your name on the challenge"
            />
          </div>
          <div className={s.row} style={{ marginTop: 10 }}>
            <button type="button" className={s.act} onClick={() => void onMint()} data-passthrough="true">
              {ui.copied ? "in the address bar" : "mint the rematch"}
            </button>
            <button type="button" className={s.ghost} onClick={retry} data-passthrough="true">
              ski it again
            </button>
          </div>
          {ui.minted && (
            <p className={s.bytes}>
              {ui.recorded.length} ticks · {ui.minted.length} characters in the hash ·
              xor-checked RLE
            </p>
          )}
        </aside>
      )}

      {ui.phase === "ready" && (
        <p className={s.hint}>arrows or a / d · hold the snow to lean</p>
      )}

      <button type="button" className={s.mute} onClick={toggleMute} data-passthrough="true">
        {muted ? "sound off" : "sound"}
      </button>
      {ui.phase !== "ready" && (
        <button type="button" className={s.retry} onClick={retry} data-passthrough="true">
          restart
        </button>
      )}
      <Link href="/tasks/games-multiplayer" className={s.brief}>
        the brief
      </Link>
      <p className={s.live} ref={liveRef} aria-live="polite" />
    </div>
  );
}

function clampPan(x: number) {
  return Math.max(-1, Math.min(1, x / 6));
}
