"use client";

import { useEffect } from "react";

/**
 * The catalogue is a surface. The pointer is a lamp. Without this the paper
 * is dead; with it, moving across the index is the same kind of act as
 * reading Deboss — light, not decoration.
 */
export function Lamp() {
  useEffect(() => {
    const root = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const place = (x: number, y: number) => {
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      const nx = x / Math.max(window.innerWidth, 1);
      const ny = y / Math.max(window.innerHeight, 1);
      root.style.setProperty("--nx", nx.toFixed(4));
      root.style.setProperty("--ny", ny.toFixed(4));
    };

    place(window.innerWidth * 0.62, window.innerHeight * 0.18);

    const onMove = (event: PointerEvent) => {
      if (motion.matches) return;
      place(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
