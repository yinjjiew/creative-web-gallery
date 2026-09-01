"use client";

import dynamic from "next/dynamic";
import { Manrope, Oranienbaum } from "next/font/google";
import { useCallback, useRef, useState } from "react";

import styles from "./neap.module.css";

const display = Oranienbaum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const text = Manrope({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-text",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-physics";

export type NudgeControl = {
  queued: number;
  apply: (() => void) | null;
};

export default function Neap() {
  const nudgeRef = useRef<NudgeControl>({ queued: 0, apply: null });
  const [status, setStatus] = useState("at rest");
  const [held, setHeld] = useState(false);

  const nudge = useCallback(() => {
    nudgeRef.current.queued += 1;
    nudgeRef.current.apply?.();
  }, []);

  return (
    <div className={`${display.variable} ${text.variable} ${styles.page}`}>
      <div className={styles.stage} data-held={held ? "true" : "false"}>
        <Stage
          nudgeRef={nudgeRef}
          onStatus={setStatus}
          onHeld={setHeld}
        />
      </div>

      <aside className={styles.didactic} aria-label="Work label">
        <h1 className={styles.title}>Neap</h1>
        <p className={styles.meta}>Painted aluminium · steel wire</p>
        <p className={styles.note}>
          Shore things, hung until they agree. You may touch a leaf. A light
          hand and a shove are different events; the armature carries both, and
          the piece finds level again. <em>Modelled pendulums, not a recording.</em>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.nudge} onClick={nudge}>
            Disturb a leaf
          </button>
          <span className={styles.status} aria-live="polite">
            {status}
          </span>
        </div>
      </aside>

      <a className={styles.task} href={TASK}>
        Task
      </a>
    </div>
  );
}
