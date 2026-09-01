"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { createEngine, type Engine } from "./audio";
import { drawChart, vowelStyle, xyToHz } from "./chart";
import styles from "./formant.module.css";
import { emptyFrame } from "./lpc";
import {
  estimateF3,
  nearestVowel,
  PROVENANCE,
  vowelByKey,
  VOWELS,
  type Vowel,
} from "./vowels";

const DT = 1 / 90;

function hz(n: number) {
  return n > 0 ? `${Math.round(n)}` : "—";
}

export default function Plate() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const f1Ref = useRef<HTMLElement>(null);
  const f2Ref = useRef<HTMLElement>(null);
  const f3Ref = useRef<HTMLElement>(null);
  const nearRef = useRef<HTMLElement>(null);
  const srcRef = useRef<HTMLElement>(null);
  const f0Ref = useRef<HTMLElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const holdingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const trailRef = useRef<{ f1: number; f2: number; a: number }[]>([]);
  const activeRef = useRef<string | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);
  const [note, setNote] = useState(
    "Use my voice listens here and sends nothing. Or hold a letter — same LPC, synthesizer labelled.",
  );

  const syncActive = (ipa: string | null) => {
    activeRef.current = ipa;
    setActive(ipa);
  };

  const aim = useCallback((f1: number, f2: number, ipa: string | null) => {
    const f3 = estimateF3(f1, f2);
    engineRef.current?.setTarget(f1, f2, f3);
    syncActive(ipa);
  }, []);

  const beginHold = useCallback(
    async (f1: number, f2: number, ipa: string | null) => {
      const engine = engineRef.current;
      if (!engine) return;
      await engine.prepare();
      if (engine.getSource() === "mic") return;
      aim(f1, f2, ipa);
      holdingRef.current = true;
      engine.hold(true);
      setNote("On-device synthesizer, measured by the same LPC.");
    },
    [aim],
  );

  const endHold = useCallback(() => {
    holdingRef.current = false;
    pointerIdRef.current = null;
    engineRef.current?.hold(false);
    syncActive(null);
  }, []);

  const toggleListen = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (listeningRef.current) {
      engine.stopMic();
      listeningRef.current = false;
      setListening(false);
      setNote("Voice off. Letters and the plane still measure a synthesizer.");
      return;
    }
    await engine.ensure();
    endHold();
    const result = await engine.listen();
    if (result === "mic") {
      listeningRef.current = true;
      setListening(true);
      setNote("Listening on this device. Nothing is sent.");
    } else if (result === "denied") {
      listeningRef.current = false;
      setListening(false);
      setNote(
        "Microphone declined. The letters still play a synthesizer — LPC of that signal, labelled, not a decoration.",
      );
    } else {
      listeningRef.current = false;
      setListening(false);
      setNote(
        "No microphone. The plane still drives an on-device voice, measured the same way.",
      );
    }
  }, [endHold]);

  useEffect(() => {
    const engine = createEngine();
    engineRef.current = engine;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      reducedRef.current = motion.matches;
    };
    applyMotion();
    motion.addEventListener("change", applyMotion);

    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas) {
      return () => {
        motion.removeEventListener("change", applyMotion);
        engine.dispose();
      };
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return () => {
        motion.removeEventListener("change", applyMotion);
        engine.dispose();
      };
    }

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      setSize({ w, h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let acc = 0;
    let last = performance.now();

    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 8 || h < 8) return;
      const tw = Math.round(w * dpr);
      const th = Math.round(h * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = engine.reading;
      drawChart(ctx, w, h, {
        frame: r.ok ? r : emptyFrame(),
        f1: r.f1s,
        f2: r.f2s,
        voiced: r.voiced,
        source: r.source,
        targetF1: r.targetF1,
        targetF2: r.targetF2,
        holding: holdingRef.current && r.source === "synth",
        trail: trailRef.current,
        reduced: reducedRef.current,
      });
    };

    const step = (dt: number) => {
      const r = engine.analyse(dt);
      const trail = trailRef.current;
      const fade = reducedRef.current ? 0.35 : 1.6;
      for (const p of trail) p.a -= dt / fade;
      while (trail.length && trail[0]!.a <= 0) trail.shift();
      if (r.voiced && r.f1s > 0 && r.f2s > 0) {
        trail.push({ f1: r.f1s, f2: r.f2s, a: 1 });
        if (trail.length > 220) trail.shift();
      }
      if (f1Ref.current) f1Ref.current.textContent = hz(r.voiced ? r.f1s : 0);
      if (f2Ref.current) f2Ref.current.textContent = hz(r.voiced ? r.f2s : 0);
      if (f3Ref.current) f3Ref.current.textContent = hz(r.voiced ? r.f3s : 0);
      if (f0Ref.current) {
        f0Ref.current.textContent =
          r.source === "synth" && holdingRef.current ? hz(r.f0) : "—";
      }
      if (srcRef.current) {
        srcRef.current.textContent =
          r.source === "mic"
            ? "voice"
            : r.source === "synth" && holdingRef.current
              ? "synth"
              : "idle";
      }
      if (nearRef.current) {
        nearRef.current.textContent =
          r.voiced && r.f1s > 0
            ? `/${nearestVowel(r.f1s, r.f2s).ipa}/`
            : "—";
      }
      if (liveRef.current && r.voiced) {
        const v = nearestVowel(r.f1s, r.f2s);
        liveRef.current.textContent = `Nearest ${v.word}, F1 ${hz(r.f1s)}, F2 ${hz(r.f2s)}`;
      }
    };

    const loop = (now: number) => {
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      while (acc >= DT) {
        acc -= DT;
        step(DT);
      }
      paint();
      raf = requestAnimationFrame(loop);
    };

    paint();
    raf = requestAnimationFrame(loop);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (event.key === "Escape") {
        endHold();
        if (listeningRef.current) {
          engine.stopMic();
          listeningRef.current = false;
          setListening(false);
          setNote("Voice off. Letters and the plane still measure a synthesizer.");
        }
        return;
      }
      if (event.code === "Space") {
        if (target?.closest("button, a")) return;
        event.preventDefault();
        void toggleListen();
        return;
      }
      if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        const engineNow = engineRef.current;
        if (!engineNow) return;
        const delta = event.key === "]" ? 8 : -8;
        engineNow.setPitch(engineNow.reading.f0 + delta);
        return;
      }
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        const r = engine.reading;
        let f1 = holdingRef.current ? r.targetF1 : 500;
        let f2 = holdingRef.current ? r.targetF2 : 1500;
        const stepHz = event.shiftKey ? 40 : 16;
        if (event.key === "ArrowLeft") f2 += stepHz;
        if (event.key === "ArrowRight") f2 -= stepHz;
        if (event.key === "ArrowUp") f1 -= stepHz;
        if (event.key === "ArrowDown") f1 += stepHz;
        void beginHold(f1, f2, nearestVowel(f1, f2).ipa);
        return;
      }
      if (event.repeat) return;
      const vowel = vowelByKey(event.key);
      if (vowel) {
        event.preventDefault();
        void beginHold(vowel.f1, vowel.f2, vowel.ipa);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow")) {
        endHold();
        return;
      }
      const vowel = vowelByKey(event.key);
      if (vowel && activeRef.current === vowel.ipa) endHold();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      motion.removeEventListener("change", applyMotion);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      engine.dispose();
      engineRef.current = null;
    };
  }, [beginHold, endHold, toggleListen]);

  const hzFromEvent = (event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return xyToHz(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );
  };

  const onPlaneDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    const hzPt = hzFromEvent(event);
    if (!hzPt) return;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    const near = nearestVowel(hzPt.f1, hzPt.f2);
    void beginHold(hzPt.f1, hzPt.f2, near.ipa);
  };

  const onPlaneMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    if (engineRef.current?.getSource() === "mic") return;
    const hzPt = hzFromEvent(event);
    if (!hzPt) return;
    aim(hzPt.f1, hzPt.f2, nearestVowel(hzPt.f1, hzPt.f2).ipa);
  };

  const onVowelDown = (event: React.PointerEvent, vowel: Vowel) => {
    if (event.button !== 0) return;
    event.preventDefault();
    void beginHold(vowel.f1, vowel.f2, vowel.ipa);
  };

  return (
    <>
      <header className={styles.head}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Formant</h1>
          <p className={styles.lede}>
            A vowel is a place, not a pitch. LPC finds the two resonances that
            name it.
          </p>
        </div>
        <p className={styles.meta}>On this device · nothing is sent</p>
      </header>

      <div ref={planeRef} className={styles.plane}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={0}
          aria-label="F1 F2 vowel plane. Drag to synthesise a vowel. Space asks for the microphone."
          onPointerDown={onPlaneDown}
          onPointerMove={onPlaneMove}
          onPointerUp={endHold}
          onPointerCancel={endHold}
        />
        {size.w > 0 &&
          VOWELS.map((v) => (
            <button
              key={v.ipa}
              type="button"
              className={styles.vowel}
              style={vowelStyle(v, size.w, size.h)}
              aria-pressed={active === v.ipa}
              aria-label={`/${v.ipa}/ as in ${v.word}`}
              title={`/${v.ipa}/  ${v.word}`}
              onPointerDown={(e) => onVowelDown(e, v)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void beginHold(v.f1, v.f2, v.ipa);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter" || e.key === " ") endHold();
              }}
            >
              {v.ipa}
            </button>
          ))}
        <p ref={liveRef} className={styles.live} aria-live="polite" />
      </div>

      <footer className={styles.foot}>
        <dl className={styles.readout}>
          <div>
            <dt>F1</dt>
            <dd>
              <strong ref={f1Ref}>—</strong>
            </dd>
          </div>
          <div>
            <dt>F2</dt>
            <dd>
              <strong ref={f2Ref}>—</strong>
            </dd>
          </div>
          <div>
            <dt>F3</dt>
            <dd>
              <strong ref={f3Ref}>—</strong>
            </dd>
          </div>
          <div>
            <dt>near</dt>
            <dd>
              <strong ref={nearRef}>—</strong>
            </dd>
          </div>
          <div>
            <dt>src</dt>
            <dd>
              <strong ref={srcRef}>idle</strong>
            </dd>
          </div>
          <div>
            <dt>F0</dt>
            <dd>
              <strong ref={f0Ref}>—</strong>
            </dd>
          </div>
        </dl>

        <div className={styles.keys}>
          {VOWELS.map((v) => (
            <button
              key={`chip-${v.ipa}`}
              type="button"
              className={styles.chip}
              aria-pressed={active === v.ipa}
              aria-label={`/${v.ipa}/ as in ${v.word}`}
              onPointerDown={(e) => onVowelDown(e, v)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
            >
              {v.ipa}
            </button>
          ))}
          <button
            type="button"
            className={styles.listen}
            data-on={listening ? "true" : "false"}
            aria-pressed={listening}
            onClick={() => void toggleListen()}
          >
            {listening ? "Stop voice" : "Use my voice"}
          </button>
        </div>

        <p className={styles.note}>{note}</p>
        <p className={`${styles.meta} ${styles.cite}`} title={PROVENANCE}>
          Hillenbrand 1995 · 14th-order LPC
        </p>
        <Link href="/tasks/2d-visuals-audio-reactive" className={styles.link}>
          Task
        </Link>
      </footer>
    </>
  );
}
