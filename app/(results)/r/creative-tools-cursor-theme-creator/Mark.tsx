"use client";

import { useLayoutEffect, useRef, type MutableRefObject } from "react";

import { markInner, type Recipe, type Target } from "./system";
import s from "./pointer.module.css";

export type MarkHandle = {
  paint: (
    recipe: Recipe,
    target: Target,
    pressed: boolean,
    visible: boolean,
    x: number,
    y: number,
    angle: number
  ) => void;
};

type Props = {
  handleRef: MutableRefObject<MarkHandle | null>;
};

export default function Mark({ handleRef }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const last = useRef("");

  useLayoutEffect(() => {
    handleRef.current = {
      paint(recipe, target, pressed, visible, x, y, angle) {
        const svg = svgRef.current;
        if (!svg) return;
        const rule = recipe.rules[target];
        const hide = !visible || rule.shape === "native" || target === "text";
        svg.style.display = hide ? "none" : "block";
        if (hide) return;
        const filled = pressed && target !== "disabled";
        const key = `${rule.shape}:${rule.size}:${filled}:${recipe.ink}`;
        if (last.current !== key) {
          last.current = key;
          svg.innerHTML = markInner(rule.shape, rule.size, filled);
          svg.style.color = recipe.ink;
          svg.classList.toggle(s.markHaze, rule.shape === "haze");
        }
        const scale = filled ? 0.62 : 1;
        svg.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scale})`;
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  return (
    <svg
      ref={svgRef}
      className={s.mark}
      viewBox="-36 -36 72 72"
      aria-hidden="true"
      data-index-mark="true"
      style={{ display: "none" }}
    />
  );
}
