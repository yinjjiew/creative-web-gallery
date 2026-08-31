"use client";

import { useEffect, useRef, useState } from "react";

import { createPlate, type PlateHandle, type Readout } from "./engine";
import styles from "./moire.module.css";

export default function Field({
  onReadout,
  onFirstInput,
}: {
  onReadout: (r: Readout) => void;
  onFirstInput: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const readoutRef = useRef(onReadout);
  const firstInputRef = useRef(onFirstInput);
  const [failed, setFailed] = useState(false);

  // The plate is built once and reads its callbacks through these refs, so a
  // parent re-render never tears down the WebGL context.
  useEffect(() => {
    readoutRef.current = onReadout;
    firstInputRef.current = onFirstInput;
  }, [onReadout, onFirstInput]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let handle: PlateHandle | null = null;

    handle = createPlate(canvas, {
      reducedMotion: motion.matches,
      onReadout: (r) => readoutRef.current(r),
      onFirstInput: () => firstInputRef.current(),
      onAnnounce: (text) => {
        if (statusRef.current) statusRef.current.textContent = text;
      },
    });

    if (!handle) {
      setFailed(true);
      return;
    }

    const onMotionChange = () => handle?.setReducedMotion(motion.matches);
    motion.addEventListener("change", onMotionChange);

    return () => {
      motion.removeEventListener("change", onMotionChange);
      handle?.dispose();
      handle = null;
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        aria-label="Interference plate: two ruled line fields overlaid."
        aria-describedby="moire-keys"
        hidden={failed}
      />
      {failed ? (
        <p className={styles.unavailable}>
          This plate is computed per pixel and needs WebGL 2, which this browser
          did not grant.
        </p>
      ) : null}
      <p id="moire-keys" className={styles.offscreen}>
        Move the pointer, or drag on a touch screen, to set the relation between
        the two rulings: horizontal for their difference in period, vertical for
        the angle between them. With the plate focused, the arrow keys step the
        same two values, shift steps ten times further, zero returns to exact
        alignment, and space holds or resumes the slow autonomous drift.
      </p>
      <p
        ref={statusRef}
        className={styles.offscreen}
        aria-live="polite"
        aria-atomic="true"
      />
    </>
  );
}
