"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

import { Growth, type Attract, type LineStatus } from "./grow";
import styles from "./growth.module.css";

const PAPER = "#e7dfd0";
const INK = "#1c1813";
const WEIGHT = 1;

type Props = {
  onStatus: (status: LineStatus & { paused: boolean }) => void;
  pausedRef: MutableRefObject<boolean>;
  restartRef: MutableRefObject<(() => void) | null>;
  toggleRef: MutableRefObject<(() => void) | null>;
};

export default function Plot({
  onStatus,
  pausedRef,
  restartRef,
  toggleRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let growth: Growth | null = null;
    let raf = 0;
    let gone = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pulling = false;
    let pointer: Attract | null = null;
    let keyAttractor: Attract | null = null;
    let keys = new Set<string>();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const seed = () =>
      (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = () => {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, width, height);
      if (!growth) return;
      growth.draw(ctx, INK, WEIGHT);
      const hand = pulling ? pointer : keys.size ? keyAttractor : null;
      if (hand && !growth.settled) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hand.x - 5, hand.y);
        ctx.lineTo(hand.x + 5, hand.y);
        ctx.moveTo(hand.x, hand.y - 5);
        ctx.lineTo(hand.x, hand.y + 5);
        ctx.stroke();
      }
    };

    const report = () => {
      if (!growth) return;
      onStatusRef.current({ ...growth.status(), paused: pausedRef.current });
    };

    const begin = () => {
      measure();
      growth = new Growth(width, height, seed());
      if (reduce) growth.finish();
      pausedRef.current = false;
      report();
      paint();
    };

    const toLocal = (event: PointerEvent): Attract => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const stepKeys = () => {
      if (!keyAttractor) {
        keyAttractor = { x: width * 0.5, y: height * 0.48 };
      }
      const step = 7;
      if (keys.has("ArrowLeft")) keyAttractor.x -= step;
      if (keys.has("ArrowRight")) keyAttractor.x += step;
      if (keys.has("ArrowUp")) keyAttractor.y -= step;
      if (keys.has("ArrowDown")) keyAttractor.y += step;
      keyAttractor.x = Math.max(8, Math.min(width - 8, keyAttractor.x));
      keyAttractor.y = Math.max(8, Math.min(height - 8, keyAttractor.y));
    };

    const tick = () => {
      if (gone) return;
      if (growth && !growth.settled && !pausedRef.current && !reduce) {
        if (keys.size) stepKeys();
        const attract = pulling
          ? pointer
          : keys.size
            ? keyAttractor
            : null;
        const steps = growth.nodes.length < 220 ? 2 : 1;
        for (let s = 0; s < steps; s++) growth.step(attract);
        report();
      }
      paint();
      raf = requestAnimationFrame(tick);
    };

    restartRef.current = begin;
    toggleRef.current = () => {
      if (growth?.settled) return;
      pausedRef.current = !pausedRef.current;
      report();
    };

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      pulling = true;
      pointer = toLocal(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      pointer = toLocal(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      pulling = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      const inControl = tag === "BUTTON" || tag === "A";
      if (event.key === " " || event.code === "Space") {
        if (inControl) return;
        event.preventDefault();
        toggleRef.current?.();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        if (inControl) return;
        event.preventDefault();
        begin();
        return;
      }
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        keys.add(event.key);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.key);
    };

    const ro = new ResizeObserver(() => {
      const prevW = width;
      const prevH = height;
      measure();
      if (!growth) return;
      if (prevW > 1 && prevH > 1) {
        // A genuine resize starts a new plate; the first observe is a no-op.
        if (
          Math.abs(prevW - width) > 1 ||
          Math.abs(prevH - height) > 1
        ) {
          begin();
        } else {
          paint();
        }
      }
    });

    begin();
    raf = requestAnimationFrame(tick);
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      restartRef.current = null;
      toggleRef.current = null;
    };
  }, [pausedRef, restartRef, toggleRef]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      tabIndex={0}
      role="img"
      aria-label="A closed line growing on paper. Hold to pull it. Press R to grow another, space to pause."
    />
  );
}
