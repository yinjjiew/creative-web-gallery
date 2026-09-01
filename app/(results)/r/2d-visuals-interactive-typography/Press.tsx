"use client";

import { useEffect, useRef, useState } from "react";

import { createPlate, type PlateHandle } from "./plate";
import styles from "./press.module.css";

export default function Press({
  fontFamily,
  lifted,
  onAnnounce,
  onFailed,
  onToggleLift,
}: {
  fontFamily: string;
  lifted: boolean;
  onAnnounce: (text: string) => void;
  onFailed: () => void;
  onToggleLift: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const announceRef = useRef(onAnnounce);
  const toggleRef = useRef(onToggleLift);
  const liftedRef = useRef(lifted);
  const handleRef = useRef<PlateHandle | null>(null);
  const [failed, setFailed] = useState(false);

  liftedRef.current = lifted;

  useEffect(() => {
    announceRef.current = onAnnounce;
    toggleRef.current = onToggleLift;
  }, [onAnnounce, onToggleLift]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;

    void createPlate(canvas, {
      fontFamily,
      reducedMotion: motion.matches,
      lifted: liftedRef.current,
      onAnnounce: (text) => announceRef.current(text),
      onToggleLift: () => toggleRef.current(),
    }).then((handle) => {
      if (cancelled) {
        handle?.dispose();
        return;
      }
      if (!handle) {
        setFailed(true);
        onFailed();
        return;
      }
      handle.setLifted(liftedRef.current);
      handleRef.current = handle;
    });

    const onMotion = () => handleRef.current?.setReducedMotion(motion.matches);
    motion.addEventListener("change", onMotion);

    return () => {
      cancelled = true;
      motion.removeEventListener("change", onMotion);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
    // Plate is built once; lift is written through the handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamily]);

  useEffect(() => {
    handleRef.current?.setLifted(lifted);
  }, [lifted]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        aria-label="Letterpress sheet. Move the lamp to rake light across the impression, or hold the sheet to the window to read the type as print."
        aria-describedby="deboss-keys"
        hidden={failed}
      />
      <p id="deboss-keys" className={styles.offscreen}>
        Move the pointer or drag to carry the lamp. With the sheet focused,
        arrow keys move the lamp, shift takes a longer step, and space holds
        the sheet to the window or puts it back on the bench.
      </p>
    </>
  );
}
