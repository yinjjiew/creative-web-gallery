"use client";

import { useCallback, useRef } from "react";

import { DAYS_KEPT, LANDSCAPES, MOUTH_M, RIVER_KM, SPRING_M } from "./journal";
import { clamp } from "./model";
import s from "./watershed.module.css";

function logT(widthM: number): number {
  return (
    Math.log(clamp(widthM, SPRING_M, MOUTH_M) / SPRING_M) /
    Math.log(MOUTH_M / SPRING_M)
  );
}

function widthAtKm(km: number): number {
  const pts: [number, number][] = [
    [0, 0.4],
    [12, 2.1],
    [31, 6.2],
    [55, 18],
    [73, 28],
    [92, 48],
    [114, 160],
    [129, 740],
    [138, 2000],
  ];
  let i = 0;
  while (i < pts.length - 1 && pts[i + 1][0] < km) i += 1;
  const a = pts[i];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  const t = a[0] === b[0] ? 0 : (km - a[0]) / (b[0] - a[0]);
  return Math.exp(Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * t);
}

function sectionPath(horizontal: boolean): string {
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n; i += 1) {
    const km = (i / n) * RIVER_KM;
    const w = 6 + logT(widthAtKm(km)) * 28;
    const along = (i / n) * 1000;
    if (horizontal) pts.push(`${along.toFixed(1)},${(40 - w).toFixed(1)}`);
    else pts.push(`${w.toFixed(1)},${along.toFixed(1)}`);
  }
  if (horizontal) {
    return `M 0 40 ${pts.map((p) => `L ${p}`).join(" ")} L 1000 40 Z`;
  }
  return `M 0 0 ${pts.map((p) => `L ${p}`).join(" ")} L 0 1000 Z`;
}

export default function Rail({
  km,
  horizontal,
  onSeek,
}: {
  km: number;
  horizontal: boolean;
  onSeek: (km: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  const read = useCallback(
    (clientX: number, clientY: number) => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const t = horizontal
        ? (clientX - r.left) / r.width
        : (clientY - r.top) / r.height;
      onSeek(clamp(t, 0, 1) * RIVER_KM);
    },
    [horizontal, onSeek]
  );

  const t = km / RIVER_KM;

  return (
    <div
      ref={box}
      className={s.rail}
      role="slider"
      tabIndex={0}
      aria-label="Distance downstream"
      aria-valuemin={0}
      aria-valuemax={RIVER_KM}
      aria-valuenow={Math.round(km)}
      aria-valuetext={`${km.toFixed(1)} kilometres downstream`}
      onPointerDown={(e) => {
        drag.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        read(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (drag.current) read(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        drag.current = false;
      }}
      onPointerCancel={() => {
        drag.current = false;
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 12 : 3;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          onSeek(clamp(km + step, 0, RIVER_KM));
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          onSeek(clamp(km - step, 0, RIVER_KM));
        } else if (e.key === "Home") {
          e.preventDefault();
          onSeek(0);
        } else if (e.key === "End") {
          e.preventDefault();
          onSeek(RIVER_KM);
        }
      }}
    >
      <svg
        className={s.railSection}
        viewBox={horizontal ? "0 0 1000 40" : "0 0 40 1000"}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={sectionPath(horizontal)} fill="currentColor" />
      </svg>
      {LANDSCAPES.map((band) => (
        <span
          key={band.id}
          className={s.railTick}
          style={
            horizontal
              ? { left: `${(band.fromKm / RIVER_KM) * 100}%` }
              : { top: `${(band.fromKm / RIVER_KM) * 100}%` }
          }
        />
      ))}
      {DAYS_KEPT.map((day) => (
        <span
          key={day.id}
          className={s.railDay}
          style={
            horizontal
              ? { left: `${(day.km / RIVER_KM) * 100}%` }
              : { top: `${(day.km / RIVER_KM) * 100}%` }
          }
        />
      ))}
      <span
        className={s.railNow}
        style={horizontal ? { left: `${t * 100}%` } : { top: `${t * 100}%` }}
      />
    </div>
  );
}
