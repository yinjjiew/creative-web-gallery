"use client";

import { useEffect, useRef } from "react";

import { sit, unlock } from "./audio";
import styles from "./still.module.css";
import {
  DT,
  MM,
  hold,
  makeField,
  peak,
  quilt,
  step,
  type Field,
} from "./wave";

const MAX_STEPS = 4;
const TRACE = 96;
const COLS = 42;
const ROWS = 46;
const RW = 168;
const RH = 184;

type Side = "L" | "R";

type Weight = {
  side: Side;
  x: number;
  y: number;
  radius: number;
  depth: number;
  held: boolean;
};

type Props = {
  reduced: boolean;
  onReadings: (theirs: number, yours: number) => void;
  onAnnounce: (text: string) => void;
};

export default function Bed({ reduced, onReadings, onAnnounce }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedRef = useRef(reduced);
  const readRef = useRef(onReadings);
  const talkRef = useRef(onAnnounce);
  reducedRef.current = reduced;
  readRef.current = onReadings;
  talkRef.current = onAnnounce;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const maybeCtx = canvas.getContext("2d", { alpha: false });
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const left = makeField(COLS, ROWS, true);
    const right = makeField(COLS, ROWS, false);
    const plate = document.createElement("canvas");
    plate.width = RW;
    plate.height = RH;
    const maybePlate = plate.getContext("2d", { alpha: true });
    if (!maybePlate) return;
    const pctx: CanvasRenderingContext2D = maybePlate;
    const plateImg = pctx.createImageData(RW, RH);

    const traceL = new Float32Array(TRACE);
    const traceR = new Float32Array(TRACE);
    let traceAt = 0;
    const sitting: Weight = {
      side: "L",
      x: COLS * 0.48,
      y: ROWS * 0.4,
      radius: 8.2,
      depth: 1.05,
      held: true,
    };
    let weight: Weight | null = null;
    let idle: Weight | null = sitting;
    let touched = false;
    let elapsed = 0;
    let lastRead = -1;
    let lastPaint = 0;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let running = true;

    type Box = { x: number; y: number; w: number; h: number; seam: number; mid: number };
    let box: Box = { x: 0, y: 0, w: 1, h: 1, seam: 8, mid: 0.5 };

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, parent.clientWidth);
      const cssH = Math.max(1, parent.clientHeight);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const padX = canvas.width * 0.04;
      const padY = canvas.height * 0.07;
      const w = canvas.width - padX * 2;
      const h = canvas.height - padY * 2;
      const seam = Math.max(8, w * 0.03);
      box = { x: padX, y: padY, w, h, seam, mid: padX + w * 0.5 };
    }

    function fieldAt(px: number, py: number): { side: Side; fx: number; fy: number } | null {
      const { x, y, w, h, seam, mid } = box;
      if (px < x || py < y || px > x + w || py > y + h) return null;
      const fy = ((py - y) / h) * (ROWS - 1);
      if (px < mid - seam * 0.5) {
        const fx = ((px - x) / (mid - seam * 0.5 - x)) * (COLS - 1);
        return { side: "L", fx, fy };
      }
      if (px > mid + seam * 0.5) {
        const fx = ((px - (mid + seam * 0.5)) / (x + w - mid - seam * 0.5)) * (COLS - 1);
        return { side: "R", fx, fy };
      }
      return null;
    }

    function applyWeight(w: Weight) {
      hold(w.side === "L" ? left : right, w.x, w.y, w.radius, w.depth);
    }

    function pulse(side: Side) {
      weight = {
        side,
        x: COLS * (side === "L" ? 0.46 : 0.54),
        y: ROWS * 0.42,
        radius: 7.2,
        depth: 0.92,
        held: true,
      };
    }

    function announce(side: Side) {
      const theirs = peak(left) * MM;
      const yours = peak(right) * MM;
      talkRef.current(
        side === "L"
          ? `Their side moved ${theirs.toFixed(1)} millimetres. Yours stayed at ${yours.toFixed(1)}.`
          : `Your side moved ${yours.toFixed(1)} millimetres. Theirs is at ${theirs.toFixed(1)}.`,
      );
    }

    function gesture() {
      if (!touched) {
        touched = true;
        idle = null;
        unlock();
      }
    }

    function dialogOpen() {
      return Boolean(document.querySelector('[role="dialog"]'));
    }

    function onPointerDown(event: PointerEvent) {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      const rect = canvas.getBoundingClientRect();
      const hit = fieldAt(
        (event.clientX - rect.left) * (canvas.width / rect.width),
        (event.clientY - rect.top) * (canvas.height / rect.height),
      );
      if (!hit) return;
      gesture();
      try {
        sit(0.85);
      } catch {
        /* audio is optional */
      }
      weight = {
        side: hit.side,
        x: hit.fx,
        y: hit.fy,
        radius: 6.6,
        depth: 0.95,
        held: true,
      };
      announce(hit.side);
    }

    function onPointerMove(event: PointerEvent) {
      if (!weight?.held) return;
      const rect = canvas.getBoundingClientRect();
      const hit = fieldAt(
        (event.clientX - rect.left) * (canvas.width / rect.width),
        (event.clientY - rect.top) * (canvas.height / rect.height),
      );
      if (!hit || hit.side !== weight.side) return;
      weight.x = hit.fx;
      weight.y = hit.fy;
    }

    function onPointerUp() {
      if (weight) {
        weight.held = false;
        weight = null;
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (dialogOpen()) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = event.key.toLowerCase();
      if (key === "1" || key === "arrowleft") {
        event.preventDefault();
        gesture();
        pulse("L");
        try {
          sit(0.8);
        } catch {
          /* audio is optional */
        }
        announce("L");
        window.setTimeout(() => {
          if (weight?.side === "L") weight = null;
        }, 720);
      } else if (key === "2" || key === "arrowright") {
        event.preventDefault();
        gesture();
        pulse("R");
        try {
          sit(0.8);
        } catch {
          /* audio is optional */
        }
        announce("R");
        window.setTimeout(() => {
          if (weight?.side === "R") weight = null;
        }, 720);
      }
    }

    function paintPlate() {
      const data = plateImg.data;
      data.fill(0);
      const mid = RW * 0.5;
      const seam = Math.max(5, RW * 0.03);
      const leftW = mid - seam * 0.5;
      const rightX = mid + seam * 0.5;
      const rightW = RW - rightX;
      const absorb = Math.max(peakNearSeam(left, true), peakNearSeam(right, false));
      const cellW = leftW / COLS;
      const cellH = RH / ROWS;

      stampField(data, left, 0, cellW, cellH);
      stampField(data, right, rightX, rightW / COLS, cellH);

      const seamX0 = Math.floor(leftW);
      const seamX1 = Math.ceil(rightX);
      for (let y = 0; y < RH; y++) {
        for (let x = seamX0; x < seamX1; x++) {
          const i = (y * RW + x) * 4;
          const shade = 0.28 + absorb * 0.35;
          data[i] = 22 + shade * 20;
          data[i + 1] = 19 + shade * 14;
          data[i + 2] = 16 + shade * 10;
          data[i + 3] = 255;
        }
      }

      const pipe = 3;
      for (let y = 0; y < RH; y++) {
        for (let x = 0; x < RW; x++) {
          const i = (y * RW + x) * 4;
          if (data[i + 3] === 0) continue;
          if (outsideRound(x, y, RW, RH, 8)) {
            data[i + 3] = 0;
            continue;
          }
          const edge = Math.min(x, y, RW - 1 - x, RH - 1 - y);
          if (edge < pipe) {
            data[i] = clamp(data[i] + 34, 0, 255);
            data[i + 1] = clamp(data[i + 1] + 26, 0, 255);
            data[i + 2] = clamp(data[i + 2] + 18, 0, 255);
          }
        }
      }
      pctx.putImageData(plateImg, 0, 0);
    }

    function stampField(
      data: Uint8ClampedArray,
      field: Field,
      originX: number,
      cellW: number,
      cellH: number,
    ) {
      const { w, h, u } = field;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const height = u[j * w + i] + quilt(i, j, w, h);
          const il = u[j * w + Math.max(0, i - 1)];
          const ir = u[j * w + Math.min(w - 1, i + 1)];
          const ju = u[Math.max(0, j - 1) * w + i];
          const jd = u[Math.min(h - 1, j + 1) * w + i];
          const hx = ir - il;
          const hy = jd - ju;
          const shade = clamp(0.44 - hx * 1.6 + hy * 0.9 + height * 0.85, 0.12, 1.32);
          const r = 86 * shade;
          const g = 72 * shade;
          const b = 56 * shade * 0.94;
          const x0 = Math.floor(originX + i * cellW);
          const x1 = Math.floor(originX + (i + 1) * cellW);
          const y0 = Math.floor(j * cellH);
          const y1 = Math.floor((j + 1) * cellH);
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              if (x < 0 || x >= RW || y < 0 || y >= RH) continue;
              const p = (y * RW + x) * 4;
              data[p] = r;
              data[p + 1] = g;
              data[p + 2] = b;
              data[p + 3] = 255;
            }
          }
        }
      }
    }

    function paint() {
      const { width, height } = canvas;
      ctx.fillStyle = "#100e0c";
      ctx.fillRect(0, 0, width, height);
      paintPlate();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(plate, box.x, box.y, box.w, box.h);
      drawTrace(ctx, box, traceL, traceR, traceAt);
    }

    function idleTick(dt: number) {
      if (touched || reducedRef.current) return;
      elapsed += dt;
      const t = elapsed % 5.8;
      // Sit from the first frame so a visitor who never touches still sees
      // the claim. They get up; the wave dies at the seam; they sit again.
      idle = t < 2.15 || t >= 4.1 ? sitting : null;
    }

    function loop(now: number) {
      if (!running) return;
      const raw = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += raw;
      idleTick(raw);

      let steps = 0;
      while (acc >= DT && steps < MAX_STEPS) {
        if (weight?.held) applyWeight(weight);
        else if (idle?.held) applyWeight(idle);
        step(left);
        step(right);
        acc -= DT;
        steps++;
      }

      const theirs = peak(left) * MM;
      const yours = peak(right) * MM;
      traceL[traceAt] = theirs;
      traceR[traceAt] = yours;
      traceAt = (traceAt + 1) % TRACE;

      if (now - lastRead > 80) {
        lastRead = now;
        readRef.current(theirs, yours);
      }

      if (now - lastPaint >= 32) {
        lastPaint = now;
        paint();
      }
      raf = window.requestAnimationFrame(loop);
    }

    applyWeight(sitting);
    if (reducedRef.current) {
      idle = sitting;
    }

    resize();
    paint();
    readRef.current(peak(left) * MM, peak(right) * MM);
    last = performance.now();
    raf = window.requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKey);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.bed}
      tabIndex={0}
      role="img"
      aria-label="A bed split down the middle. Press their side or yours. Motion on one side does not cross the seam. Keys 1 and 2 sit on each side."
    />
  );
}

function peakNearSeam(f: Field, innerHighX: boolean): number {
  let m = 0;
  const { w, h, u } = f;
  const x0 = innerHighX ? w - 4 : 0;
  const x1 = innerHighX ? w : 4;
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      const a = Math.abs(u[y * w + x]);
      if (a > m) m = a;
    }
  }
  return m;
}

function outsideRound(x: number, y: number, w: number, h: number, r: number): boolean {
  const cx = clamp(x, r, w - 1 - r);
  const cy = clamp(y, r, h - 1 - r);
  if (x === cx || y === cy) return false;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy > r * r;
}

function drawTrace(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number; mid: number; seam: number },
  left: Float32Array,
  right: Float32Array,
  at: number,
) {
  const { x, y, w, h, mid, seam } = box;
  const ty = y + h - Math.max(12, h * 0.08);
  const th = Math.max(9, h * 0.06);
  strokeTrace(ctx, left, at, x + w * 0.05, ty, mid - seam - x - w * 0.1, th, "#c4a06a");
  strokeTrace(
    ctx,
    right,
    at,
    mid + seam + w * 0.05,
    ty,
    x + w - (mid + seam) - w * 0.1,
    th,
    "#e6dcc8",
  );
}

function strokeTrace(
  ctx: CanvasRenderingContext2D,
  buf: Float32Array,
  at: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  if (w < 8) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1.1, h * 0.09);
  const n = buf.length;
  for (let i = 0; i < n; i++) {
    const v = buf[(at + i) % n] / 30;
    const px = x + (i / (n - 1)) * w;
    const py = y - Math.min(1, v) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function clamp(n: number, a: number, b: number): number {
  return n < a ? a : n > b ? b : n;
}
