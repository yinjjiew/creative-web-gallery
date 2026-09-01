"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { useCallback, useRef, useState } from "react";

import styles from "./faro.module.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-explorable-world";

export default function Faro() {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [period, setPeriod] = useState("dusk");
  const playingRef = useRef(true);
  const mutedRef = useRef(false);
  const hourRef = useRef(17.7);
  const clockRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const periodRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLInputElement>(null);
  const setPlay = useCallback((next: boolean) => {
    playingRef.current = next;
    setPlaying(next);
  }, []);

  const setMute = useCallback((next: boolean) => {
    mutedRef.current = next;
    setMuted(next);
  }, []);

  return (
    <div
      className={`${display.variable} ${mono.variable} ${styles.page}`}
      data-period={period}
    >
      <Stage
        playingRef={playingRef}
        mutedRef={mutedRef}
        hourRef={hourRef}
        clockRef={clockRef}
        captionRef={captionRef}
        periodLabelRef={periodRef}
        railRef={railRef}
        onPeriod={setPeriod}
        onPlayingChange={setPlay}
      />

      <div className={styles.hud}>
        <header className={styles.top}>
          <div className={styles.brand}>
            <h1 className={styles.word}>Faro</h1>
            <p className={styles.where}>61°28′ N · Norwegian Sea · late October</p>
            <p className={styles.note}>
              A modelled miniature — invented rock, typical weather. The lamp, the
              boat and the keeper&apos;s hours are written so that time has work to
              do. Drag the island. Scrub the clock.
            </p>
          </div>
          <Link className={styles.task} href={TASK}>
            Task
          </Link>
        </header>

        <div className={styles.bottom}>
          <p className={styles.caption} ref={captionRef}>
            The colour is leaving the rock first.
          </p>
          <div className={styles.clockRow}>
            <span className={styles.clock} ref={clockRef} aria-live="off">
              17:42
            </span>
            <span className={styles.period} ref={periodRef}>
              Dusk
            </span>
            <input
              ref={railRef}
              className={styles.rail}
              type="range"
              min={0}
              max={24}
              step={0.01}
              defaultValue={17.7}
              aria-label="Hour of the day"
              onPointerDown={() => setPlay(false)}
              onChange={(event) => {
                hourRef.current = Number(event.target.value);
              }}
            />
            <div className={styles.btns}>
              <button
                type="button"
                className={styles.btn}
                aria-pressed={playing}
                onClick={() => setPlay(!playing)}
              >
                {playing ? "Hold" : "Run"}
              </button>
              <button
                type="button"
                className={styles.btn}
                aria-pressed={muted}
                onClick={() => setMute(!muted)}
              >
                {muted ? "Sound" : "Mute"}
              </button>
            </div>
          </div>
          <p className={styles.keys}>
            turn ← → ↑ ↓ · nearer + − · hours [ ] · dawn 1 noon 2 dusk 3 night 4 ·
            run space
          </p>
        </div>
      </div>
    </div>
  );
}
