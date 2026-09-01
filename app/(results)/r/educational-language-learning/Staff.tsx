"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { Point } from "./linguistics";
import s from "./studio.module.css";

type StaffProps = {
  target: Point[];
  produced: Point[] | null;
  liveRef: RefObject<Point[] | null>;
  marks: number[];
  drawing: boolean;
  onDraw: (point: Point, done: boolean) => void;
};

function xOf(t: number, left: number, width: number) {
  return left + t * width;
}

function yOf(level: number, top: number, height: number) {
  const u = (5 - level) / 4;
  return top + u * height;
}

function tOf(x: number, left: number, width: number) {
  return Math.min(1, Math.max(0, (x - left) / width));
}

function levelOf(y: number, top: number, height: number) {
  const u = (y - top) / height;
  return Math.min(5, Math.max(1, 5 - u * 4));
}

function pathOf(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  left: number,
  top: number,
  width: number,
  height: number,
) {
  if (pts.length < 2) return;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = xOf(p.t, left, width);
    const y = yOf(p.y, top, height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const image = ctx.createImageData(w, h);
  const data = image.data;
  let seed = 1103515245;
  for (let i = 0; i < w * h; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const n = seed & 255;
    const o = i * 4;
    const v = 210 + (n % 36);
    data[o] = v - 8;
    data[o + 1] = v - 14;
    data[o + 2] = v - 28;
    data[o + 3] = 28 + (n % 18);
  }
  ctx.putImageData(image, 0, 0);
}

export default function Staff({ target, produced, liveRef, marks, drawing, onDraw }: StaffProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLCanvasElement | null>(null);
  const geo = useRef({ left: 0, top: 0, width: 1, height: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const ink = getComputedStyle(wrap);
      const staff = ink.getPropertyValue("--staff").trim() || "#d2c4a6";
      const rule = ink.getPropertyValue("--rule").trim() || "#c4b492";
      const muted = ink.getPropertyValue("--muted").trim() || "#6b6256";
      const targetCol = ink.getPropertyValue("--target").trim() || "#3a4638";
      const you = ink.getPropertyValue("--you").trim() || "#b11b14";
      const paper = ink.getPropertyValue("--panel").trim() || "#f6efe0";

      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);
      if (!grainRef.current || grainRef.current.width !== w || grainRef.current.height !== h) {
        const g = document.createElement("canvas");
        g.width = w;
        g.height = h;
        const gctx = g.getContext("2d");
        if (gctx) grain(gctx, w, h);
        grainRef.current = g;
      }
      ctx.drawImage(grainRef.current, 0, 0);

      const padL = 28;
      const padR = 14;
      const padT = 18;
      const padB = 16;
      const left = padL;
      const top = padT;
      const width = w - padL - padR;
      const height = h - padT - padB;
      geo.current = { left, top, width, height };

      ctx.strokeStyle = staff;
      ctx.lineWidth = 1;
      const family = ink.fontFamily || "Georgia, serif";
      ctx.font = `500 10px ${family}`;
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let level = 1; level <= 5; level++) {
        const y = yOf(level, top, height);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + width, y);
        ctx.stroke();
        ctx.fillText(String(level), left - 8, y);
      }

      ctx.strokeStyle = rule;
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 1;
      for (const m of marks) {
        const x = xOf(m, left, width);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, top + height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(58, 70, 56, 0.16)";
      ctx.lineWidth = 12;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      pathOf(ctx, target, left, top, width, height);
      ctx.stroke();

      ctx.strokeStyle = targetCol;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.95;
      if (!reduced) ctx.setLineDash([6, 4]);
      pathOf(ctx, target, left, top, width, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const live = liveRef.current;
      const shown = live && live.length > 1 ? live : produced;
      if (shown && shown.length > 1) {
        ctx.strokeStyle = you;
        ctx.lineWidth = 2.6;
        pathOf(ctx, shown, left, top, width, height);
        ctx.stroke();
        const last = shown[shown.length - 1];
        if (last && live) {
          ctx.fillStyle = you;
          ctx.beginPath();
          ctx.arc(xOf(last.t, left, width), yOf(last.y, top, height), 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

    };

    paint();
    const loop = () => {
      if (liveRef.current && liveRef.current.length > 0) paint();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, produced, liveRef, marks]);

  const fromClient = (clientX: number, clientY: number, done: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { left, top, width, height } = geo.current;
    onDraw(
      { t: tOf(clientX - rect.left, left, width), y: levelOf(clientY - rect.top, top, height) },
      done,
    );
  };

  const pointer = (event: React.PointerEvent<HTMLCanvasElement>, done: boolean) => {
    if (!drawing) return;
    fromClient(event.clientX, event.clientY, done);
  };

  const touch = (event: React.TouchEvent<HTMLCanvasElement>, done: boolean) => {
    if (!drawing) return;
    const t = event.changedTouches[0];
    if (!t) return;
    event.preventDefault();
    fromClient(t.clientX, t.clientY, done);
  };

  return (
    <div ref={wrapRef} className={s.staffWrap}>
      <canvas
        ref={canvasRef}
        className={s.staff}
        role="img"
        aria-label="Tone staff, five levels. The dashed line is the target contour. The solid line is yours."
        onPointerDown={(e) => {
          if (!drawing) return;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          pointer(e, false);
        }}
        onPointerMove={(e) => {
          if (!drawing || e.buttons === 0) return;
          pointer(e, false);
        }}
        onPointerUp={(e) => pointer(e, true)}
        onPointerCancel={(e) => pointer(e, true)}
        onTouchStart={(e) => touch(e, false)}
        onTouchMove={(e) => touch(e, false)}
        onTouchEnd={(e) => touch(e, true)}
      />
    </div>
  );
}
