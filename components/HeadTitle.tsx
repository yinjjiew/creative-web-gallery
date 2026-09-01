"use client";

import { useRef } from "react";

import styles from "../app/(gallery)/page.module.css";

/**
 * Newsreader's optical size follows the lamp. The title is a surface, not a
 * poster — closer to the pointer it opens, farther it tightens.
 */
export function HeadTitle({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  function onMove(event: React.PointerEvent<HTMLHeadingElement>) {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / Math.max(box.width, 1);
    const y = (event.clientY - box.top) / Math.max(box.height, 1);
    const opsz = 22 + x * 50 + (1 - y) * 12;
    node.style.fontVariationSettings = `"opsz" ${opsz.toFixed(1)}`;
    node.style.setProperty("--hx", `${(x * 100).toFixed(1)}%`);
  }

  function onLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.fontVariationSettings = '"opsz" 48';
  }

  return (
    <h1
      ref={ref}
      className={styles.title}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </h1>
  );
}
