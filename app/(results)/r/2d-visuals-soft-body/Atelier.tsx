"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./drape.module.css";
import type { ClothHandle, Mode } from "./Cloth";

const ClothView = dynamic(() => import("./Cloth"), {
  ssr: false,
  loading: () => <span className={styles.pending} aria-hidden="true" />,
});

const MODES: { id: Mode; label: string }[] = [
  { id: "grab", label: "Grab" },
  { id: "pin", label: "Pin" },
  { id: "cut", label: "Cut" },
];

const HINTS: Record<Mode, { pointer: string; touch: string }> = {
  grab: {
    pointer: "Take a fold and pull. Let go and it finds the hang again.",
    touch: "Take a fold and pull. Lift your finger and it finds the hang again.",
  },
  pin: {
    pointer: "Pin a point to the air. Pin again to pull it free.",
    touch: "Tap a point to pin it. Tap again to pull the pin.",
  },
  cut: {
    pointer: "Draw across the length. The cut stays; the rest keeps its hang.",
    touch: "Draw across the length. The cut stays; the rest keeps its hang.",
  },
};

export default function Atelier({ fontFamily }: { fontFamily: string }) {
  const handleRef = useRef<ClothHandle | null>(null);
  const [mode, setMode] = useState<Mode>("grab");
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [touch, setTouch] = useState(false);
  const [caption, setCaption] = useState(HINTS.grab.pointer);
  const [live, setLive] = useState("");

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => {
      setReduced(motion.matches);
      setTouch(coarse.matches);
    };
    apply();
    motion.addEventListener("change", apply);
    coarse.addEventListener("change", apply);
    return () => {
      motion.removeEventListener("change", apply);
      coarse.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    setCaption(touch ? HINTS[mode].touch : HINTS[mode].pointer);
  }, [mode, touch]);

  const onReady = useCallback((handle: ClothHandle) => {
    handleRef.current = handle;
  }, []);

  const choose = useCallback((id: Mode) => {
    setMode(id);
    handleRef.current?.setMode(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "g" || key === "1") choose("grab");
      else if (key === "p" || key === "2") choose("pin");
      else if (key === "x" || key === "c" || key === "3") choose("cut");
      else if (key === "d") {
        handleRef.current?.drop();
        setLive("The rail let go.");
      } else if (key === "r") {
        handleRef.current?.reset();
        setLive("Hung again.");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);

  return (
    <>
      {!failed ? (
        <ClothView
          fontFamily={fontFamily}
          reducedMotion={reduced}
          mode={mode}
          onReady={onReady}
          onFailed={() => setFailed(true)}
          onAnnounce={setLive}
        />
      ) : (
        <p className={styles.failed}>
          The length needs a canvas that can take light. Without one there is
          still silk; it just cannot hang here.
        </p>
      )}

      <header className={styles.head}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Charmeuse</h1>
          <p className={styles.deck}>
            19 momme ivory, gathered on a brass rail. A model of the hang.
          </p>
        </div>
        <p className={styles.spec}>Silk satin · 19 momme</p>
      </header>

      <footer className={styles.foot}>
        <p className={styles.caption}>
          {caption}{" "}
          <span className={styles.rest}>
            {touch
              ? ""
              : "G grab, P pin, X cut. Arrows tug a fold. Space holds the hem."}
          </span>
        </p>
        <div className={styles.tools}>
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.act}
              aria-pressed={mode === item.id}
              onClick={() => choose(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.act}
            data-kind="do"
            onClick={() => {
              handleRef.current?.drop();
              setLive("The rail let go.");
            }}
          >
            Drop
          </button>
          <button
            type="button"
            className={styles.act}
            onClick={() => {
              handleRef.current?.reset();
              setLive("Hung again.");
            }}
          >
            Hang
          </button>
          <Link href="/tasks/2d-visuals-soft-body" className={styles.link}>
            Drape
          </Link>
        </div>
      </footer>

      <p className={styles.live} aria-live="polite">
        {live}
      </p>
    </>
  );
}
