"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./plate.module.css";
import type { FieldHandle, Preset } from "./Field";

const Field = dynamic(() => import("./Field"), {
  ssr: false,
  loading: () => <span className={styles.pending} aria-hidden="true" />,
});

const PRESETS: { id: Preset; label: string }[] = [
  { id: "unlike", label: "Unlike" },
  { id: "like", label: "Like" },
  { id: "single", label: "One" },
];

export default function Plate({ fontFamily }: { fontFamily: string }) {
  const handleRef = useRef<FieldHandle | null>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [preset, setPreset] = useState<Preset>("unlike");
  const [caption, setCaption] = useState(
    "Unlike ends face each other. The gap is a road: lines leave north and are received by south.",
  );
  const [live, setLive] = useState("");
  const [hint, setHint] = useState("Drag a bar. Take an end to turn it.");

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => {
      setReduced(motion.matches);
      setHint(
        coarse.matches
          ? "Drag a bar. Tap the paper to loosen the filings."
          : "Drag a bar. Take an end to turn it. Click the paper to tap.",
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

  const onReady = useCallback((handle: FieldHandle) => {
    handleRef.current = handle;
  }, []);

  const onFailed = useCallback(() => setFailed(true), []);

  const choose = useCallback((id: Preset) => {
    handleRef.current?.preset(id);
  }, []);

  return (
    <>
      {!failed ? (
        <Field
          fontFamily={fontFamily}
          reducedMotion={reduced}
          onReady={onReady}
          onFailed={onFailed}
          onPreset={setPreset}
          onCaption={setCaption}
          onAnnounce={setLive}
        />
      ) : (
        <p className={styles.failed}>
          The plate needs a canvas. Without one the field is still there; the
          filings cannot report it.
        </p>
      )}

      <header className={styles.head}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Filings</h1>
          <p className={styles.deck}>{hint}</p>
        </div>
        <p className={styles.plateNo}>Plate IV</p>
      </header>

      <footer className={styles.foot}>
        <p className={styles.caption}>
          {caption}
          <span className={styles.rest}>
            {" "}
            Each needle is an induced dipole in a linear sum of magnetic
            charges, taken in the plane of the paper.
          </span>
        </p>
        <div className={styles.tools}>
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.act}
              aria-pressed={preset === item.id}
              onClick={() => choose(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.act}
            onClick={() => handleRef.current?.flip()}
          >
            Flip
          </button>
          <button
            type="button"
            className={styles.act}
            onClick={() => handleRef.current?.tap()}
          >
            Tap
          </button>
          <Link href="/tasks/2d-visuals-particle-playground" className={styles.link}>
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
