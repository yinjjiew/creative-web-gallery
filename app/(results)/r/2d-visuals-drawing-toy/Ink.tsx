"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./bleed.module.css";
import { createSim, type SimHandle } from "./sim";

export default function Ink({
  reducedMotion,
  onAnnounce,
  onReady,
  onFailed,
}: {
  reducedMotion: boolean;
  onAnnounce: (text: string) => void;
  onReady: (handle: SimHandle) => void;
  onFailed: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SimHandle | null>(null);
  const announceRef = useRef(onAnnounce);
  const readyRef = useRef(onReady);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    announceRef.current = onAnnounce;
    readyRef.current = onReady;
  }, [onAnnounce, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handle = createSim(canvas, {
      reducedMotion,
      onAnnounce: (text) => announceRef.current(text),
    });
    if (!handle) {
      setFailed(true);
      onFailed();
      return;
    }
    handleRef.current = handle;
    readyRef.current(handle);

    return () => {
      handle.dispose();
      handleRef.current = null;
    };
    // The plate is built once; reduced motion is written through the handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        hidden={failed}
        aria-label="Damp xuan paper. Draw with a finger or the pointer. A fast stroke sits on the tooth; a slow one blooms. The ink keeps moving after you lift."
        aria-describedby="bleed-keys"
      />
      <p id="bleed-keys" className={styles.offscreen}>
        Draw on the sheet. Speed, how long you stay, and whether you cross a
        wet mark all change what the ink does. Arrow keys move a point of
        contact. Space lets a loaded drop fall there; shift-space is a dry
        flick. N lays out a new sheet.
      </p>
    </>
  );
}
