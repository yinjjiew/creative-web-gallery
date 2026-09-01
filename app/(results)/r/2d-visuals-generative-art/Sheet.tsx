"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import type { LineStatus } from "./grow";
import styles from "./growth.module.css";

const Plot = dynamic(() => import("./Plot"), {
  ssr: false,
  loading: () => <span className={styles.pending} aria-hidden="true" />,
});

export default function Sheet() {
  const plateRef = useRef<HTMLSpanElement>(null);
  const nodesRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const pausedRef = useRef(false);
  const restartRef = useRef<(() => void) | null>(null);
  const toggleRef = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [settled, setSettled] = useState(false);
  const [hint, setHint] = useState("Hold to pull the line.");

  const onStatus = useCallback((status: LineStatus & { paused: boolean }) => {
    if (plateRef.current) {
      plateRef.current.textContent = `no. ${String(status.plate % 100000)}`;
    }
    if (nodesRef.current) {
      nodesRef.current.textContent = String(status.nodes);
    }
    const nextHint = status.settled
      ? "Settled."
      : status.paused
        ? "Paused."
        : "Hold to pull the line.";
    setPaused((was) => (was === status.paused ? was : status.paused));
    setSettled((was) => {
      if (!was && status.settled && liveRef.current) {
        liveRef.current.textContent = "The line has settled.";
      }
      return was === status.settled ? was : status.settled;
    });
    setHint((was) => (was === nextHint ? was : nextHint));
  }, []);

  return (
    <>
      <Plot
        onStatus={onStatus}
        pausedRef={pausedRef}
        restartRef={restartRef}
        toggleRef={toggleRef}
      />

      <header className={styles.head}>
        <h1 className={styles.title}>Growth</h1>
        <p className={styles.plate}>
          <span ref={plateRef}>no. —</span>
          <span aria-hidden="true"> · </span>
          <span ref={nodesRef}>—</span>
          <span className={styles.live}> vertices</span>
        </p>
      </header>

      <div className={styles.marks} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <footer className={styles.foot}>
        <p className={styles.colophon}>
          <strong>One closed line.</strong>
          <span className={styles.rest}>
            {" "}
            It lengthens, refuses to occupy itself, and stops when there is no
            room left to grow. The pen is constant; tone is only density.
          </span>
        </p>
        <div className={styles.tools}>
          <p className={styles.hint}>{hint}</p>
          {!settled ? (
            <button
              type="button"
              className={styles.act}
              onClick={() => toggleRef.current?.()}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.act}
            onClick={() => restartRef.current?.()}
          >
            Again
          </button>
          <Link href="/tasks/2d-visuals-generative-art" className={styles.link}>
            the task
          </Link>
        </div>
      </footer>

      <span ref={liveRef} className={styles.live} aria-live="polite" />
    </>
  );
}
