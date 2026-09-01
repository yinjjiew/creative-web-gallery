"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Commissioner, Young_Serif } from "next/font/google";
import { useCallback, useRef, useState } from "react";

import styles from "./timid.module.css";
import type { CameraStatus, Reading } from "./Stage";

const serif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const sans = Commissioner({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-webcam-responsive";

type Path = "ask" | "camera" | "hand";

function sourceLine(path: Path, reading: Reading) {
  if (path === "camera" && reading.source === "camera") return "Camera · on this machine";
  if (path === "hand") return "Hand · a shadow on the water";
  return "Waiting · nothing leaves this room";
}

function timeLine(seconds: number) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${String(r).padStart(2, "0")}s` : `${s}s in the hide`;
}

export default function Timid() {
  const [path, setPath] = useState<Path>("ask");
  const [reading, setReading] = useState<Reading>({
    mood: "peeking",
    note: "A length of pale skin at the lip of the rock.",
    energy: 0,
    source: "none",
    trust: 0,
    acquaintance: 0,
  });
  const [handWhy, setHandWhy] = useState<string | null>(null);
  const traceRef = useRef<SVGPolylineElement>(null);

  const onReading = useCallback((next: Reading) => {
    setReading(next);
  }, []);

  const onCameraStatus = useCallback((status: CameraStatus) => {
    if (status === "live") {
      setPath("camera");
      setHandWhy(null);
      return;
    }
    setPath("hand");
    setHandWhy(
      status === "denied"
        ? "The camera stays off. Your hand is a shadow on the pool — the same grammar, a dimmer sense."
        : "There is no camera on this machine. Your hand is a shadow on the pool."
    );
  }, []);

  const askCamera = useCallback(() => {
    setPath("camera");
  }, []);

  const sitWithHand = useCallback(() => {
    setPath("hand");
    setHandWhy("Your hand is a shadow on the water. The animal cannot be dragged. Stillness is how anything here is earned.");
  }, []);

  return (
    <div className={`${serif.variable} ${sans.variable} ${styles.page}`}>
      <Stage
        watching={path === "camera"}
        onCameraStatus={onCameraStatus}
        onReading={onReading}
        traceRef={traceRef}
      />

      <div className={styles.hud}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <h1 className={styles.word}>Timid</h1>
            <p className={styles.where}>Karst hide · a modelled olm · invented basin</p>
          </div>
          <Link className={styles.task} href={TASK}>
            Task
          </Link>
        </div>

        <div className={styles.spacer} aria-hidden="true" />

        {path === "ask" ? (
          <section className={styles.ask} aria-labelledby="ask-title">
            <h2 id="ask-title" className={styles.askTitle}>
              The hide would like a window
            </h2>
            <p className={styles.askBody}>
              This animal cannot see your face. It feels shadow and suddenness,
              the way a cave feels a footfall. Frames are compared on this
              machine and thrown away — nothing stored, sent, or shown back to
              you. No model. No service.
            </p>
            <p className={styles.askBody}>
              A refused camera is not a failure. Your hand on the water is the
              same grammar: a presence, not a leash.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.btn} onClick={askCamera}>
                Let the hide use the camera
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnQuiet}`} onClick={sitWithHand}>
                I will be a shadow
              </button>
            </div>
          </section>
        ) : (
          <p className={styles.note}>
            {handWhy ??
              (path === "camera" && reading.source !== "camera"
                ? "Asking this machine for a window. Frames will be compared here and thrown away — nothing stored, nothing sent."
                : "On this machine only — nothing is recorded. Lean in slowly. A jab sends it under the stone. The best of it takes a few quiet minutes.")}
          </p>
        )}

        {path !== "ask" ? (
          <div className={styles.bottom}>
            <p className={styles.log} aria-live="polite">
              {reading.note}
            </p>
            <div className={styles.instrument}>
              <div className={styles.traceWrap}>
                <p className={styles.traceLabel}>Disturbance</p>
                <svg
                  className={styles.trace}
                  viewBox="0 0 280 36"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line x1="0" y1="26" x2="280" y2="26" className={styles.traceBase} />
                  <polyline ref={traceRef} fill="none" className={styles.traceLine} />
                </svg>
              </div>
              <p className={styles.meta}>
                {sourceLine(path, reading)}
                <br />
                {timeLine(reading.acquaintance)}
              </p>
            </div>
            <p className={styles.keys}>
              Arrows move a shadow. Space is stillness. Shift with an arrow is a
              startle. The animal is not a puppet.
            </p>
          </div>
        ) : (
          <svg className={styles.sr} aria-hidden="true">
            <polyline ref={traceRef} />
          </svg>
        )}
      </div>

      <p className={styles.sr}>
        A shy cave salamander lives in a limestone pool. It notices presence,
        startles at sudden movement, freezes when stared at, and grows bolder
        only with patience. All video is processed locally.
      </p>
    </div>
  );
}
