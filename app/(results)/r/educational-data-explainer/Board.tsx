"use client";

import { useLayoutEffect, useRef } from "react";

import { KIND_GAS, KIND_LOW, KIND_OUT, type Run } from "./model";
import { DAYS, MONTH_DAYS, MONTH_SHORT, stamp } from "./series";
import styles from "./grid.module.css";

const OUT = [44, 39, 32] as const;
const GAS_LO = [122, 52, 38] as const;
const GAS_HI = [196, 98, 58] as const;
const LOW_LO = [176, 148, 78] as const;
const LOW_HI = [243, 221, 138] as const;

function lerp(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * u),
    Math.round(a[1] + (b[1] - a[1]) * u),
    Math.round(a[2] + (b[2] - a[2]) * u),
  ];
}

function rgb(c: readonly [number, number, number]): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function Board({
  run,
  selected,
  onSelect,
}: {
  run: Run;
  selected: number;
  onSelect: (hour: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW < 8 || cssH < 8) return;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#c4b089";
      ctx.fillRect(0, 0, cssW, cssH);

      const left = 28;
      const bottom = 22;
      const top = 4;
      const plotW = cssW - left - 4;
      const plotH = cssH - bottom - top;
      const cw = plotW / DAYS;
      const rh = plotH / 24;
      const off = document.createElement("canvas");
      off.width = DAYS;
      off.height = 24;
      const octx = off.getContext("2d");
      if (!octx) return;
      const { kind, unserved, gas, surplus, demand } = run;
      for (let day = 0; day < DAYS; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const i = day * 24 + hour;
          const k = kind[i];
          let c: [number, number, number];
          if (k === KIND_OUT) {
            const t = Math.min(1, unserved[i] / Math.max(0.5, demand[i]));
            c = lerp(OUT, [22, 19, 16], t);
          } else if (k === KIND_GAS) {
            const t = Math.min(1, gas[i] / Math.max(0.5, demand[i]));
            c = lerp(GAS_LO, GAS_HI, t);
          } else {
            const t = Math.min(1, surplus[i] / 8);
            c = lerp(LOW_LO, LOW_HI, 0.25 + 0.75 * t);
          }
          octx.fillStyle = rgb(c);
          octx.fillRect(day, hour, 1, 1);
        }
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, left, top, plotW, plotH);

      const sel = stamp(selected);
      const selDay = (() => {
        let d = 0;
        for (let m = 0; m < sel.month; m++) d += MONTH_DAYS[m];
        return d + sel.day;
      })();
      ctx.strokeStyle = "#1f1a14";
      ctx.lineWidth = 1.25;
      ctx.strokeRect(
        left + selDay * cw - 0.5,
        top + sel.hour * rh - 0.5,
        Math.max(cw, 1) + 1,
        Math.max(rh, 1) + 1,
      );

      ctx.fillStyle = "#1f1a14";
      ctx.font = "500 10px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (const h of [0, 6, 12, 18]) {
        ctx.fillText(String(h).padStart(2, "0"), left - 5, top + (h + 0.5) * rh);
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      let acc = 0;
      for (let m = 0; m < 12; m++) {
        const x = left + acc * cw;
        ctx.fillText(MONTH_SHORT[m], x + 1, top + plotH + 6);
        acc += MONTH_DAYS[m];
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [run, selected]);

  const pick = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const left = 28;
    const bottom = 22;
    const top = 4;
    const plotW = rect.width - left - 4;
    const plotH = rect.height - bottom - top;
    const day = Math.max(0, Math.min(DAYS - 1, Math.floor(((x - left) / plotW) * DAYS)));
    const hour = Math.max(0, Math.min(23, Math.floor(((y - top) / plotH) * 24)));
    onSelect(day * 24 + hour);
  };

  return (
    <div
      ref={wrapRef}
      className={styles.boardWrap}
      tabIndex={0}
      role="application"
      aria-label="Year of hours. Arrow keys move the selected hour. Each cell is one hour."
      onClick={(e) => pick(e.clientX, e.clientY)}
      onKeyDown={(e) => {
        const s = stamp(selected);
        let day = 0;
        for (let m = 0; m < s.month; m++) day += MONTH_DAYS[m];
        day += s.day;
        let hour = s.hour;
        if (e.key === "ArrowRight") day = Math.min(DAYS - 1, day + 1);
        else if (e.key === "ArrowLeft") day = Math.max(0, day - 1);
        else if (e.key === "ArrowDown") hour = Math.min(23, hour + 1);
        else if (e.key === "ArrowUp") hour = Math.max(0, hour - 1);
        else return;
        e.preventDefault();
        onSelect(day * 24 + hour);
      }}
    >
      <canvas ref={canvasRef} className={styles.boardCanvas} />
    </div>
  );
}
