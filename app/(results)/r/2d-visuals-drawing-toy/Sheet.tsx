"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./bleed.module.css";
import type { SimHandle } from "./sim";

const Ink = dynamic(() => import("./Ink"), {
  ssr: false,
  loading: () => <span className={styles.pending} aria-hidden="true" />,
});

export default function Sheet() {
  const handleRef = useRef<SimHandle | null>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hint, setHint] = useState("A flick is dry. Stay and it blooms.");
  const [live, setLive] = useState("");

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => {
      setReduced(motion.matches);
      setHint(
        coarse.matches
          ? "A flick is dry. Stay and it blooms."
          : "A flick is dry. Stay and it blooms. Cross a wet mark and it runs.",
      );
    };
    apply();
    motion.addEventListener("change", apply);
    coarse.addEventListener("change", apply);
    return () => {
      motion.removeEventListener("change", apply);
      coarse.removeEventListener("change", apply);
    };
  }, []);

  const onAnnounce = useCallback((text: string) => {
    setLive(text);
  }, []);

  const onReady = useCallback((handle: SimHandle) => {
    handleRef.current = handle;
  }, []);

  return (
    <>
      {!failed ? (
        <Ink
          reducedMotion={reduced}
          onAnnounce={onAnnounce}
          onReady={onReady}
          onFailed={() => setFailed(true)}
        />
      ) : (
        <p className={styles.failed}>
          WebGL 2 was not granted, so the sheet cannot take ink. The paper is
          still here; the process is not.
        </p>
      )}

      <header className={styles.head}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Bleed</h1>
          <span className={styles.seal} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12">
              <path
                d="M12 3.6c3.1 3.9 5.5 7.1 5.5 10.2a5.5 5.5 0 0 1-11 0c0-3.1 2.4-6.3 5.5-10.2z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>
        <p className={styles.note}>Sumi on a damp sheet.</p>
      </header>

      <footer className={styles.foot}>
        <p className={styles.colophon}>
          The sheet is already damp. Ink is water and soot: water finds the
          fibre, soot is carried, and as the water leaves the edge goes dark.
          <span className={styles.rest}>
            {" "}
            A fast stroke kisses the tooth and stays. A slow one floods the
            valleys and keeps moving after the brush lifts. Crossing a wet mark
            lifts soot back into solution.
          </span>
        </p>
        <div className={styles.tools}>
          <p className={styles.hint}>{hint}</p>
          <button
            type="button"
            className={styles.act}
            onClick={() => handleRef.current?.drop(true)}
          >
            A drop
          </button>
          <button
            type="button"
            className={styles.act}
            onClick={() => handleRef.current?.newSheet()}
          >
            New sheet
          </button>
          <Link href="/tasks/2d-visuals-drawing-toy" className={styles.link}>
            Task
          </Link>
        </div>
      </footer>

      <p className={styles.live} aria-live="polite" aria-atomic="true">
        {live}
      </p>
    </>
  );
}
