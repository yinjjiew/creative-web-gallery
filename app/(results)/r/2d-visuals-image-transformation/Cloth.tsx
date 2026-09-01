"use client";

import { useEffect, useRef } from "react";

import styles from "./loom.module.css";
import { paintStillLife } from "./still";
import {
  type Cloth,
  type Draft,
  type Palette,
  faceYarn,
  weave,
} from "./weave";

export type Crossing = {
  i: number;
  j: number;
  yarn: string;
  role: "warp" | "weft";
};

export type ViewMeta = {
  scale: number;
  source: string;
};

type Props = {
  draft: Draft;
  palette: Palette;
  sett: number;
  source: ImageData | null;
  sourceLabel: string;
  reducedMotion: boolean;
  onCrossing: (c: Crossing | null) => void;
  onView: (v: ViewMeta) => void;
  onReady: (api: { zoomBy: (f: number) => void; reset: () => void }) => void;
};

type View = { x: number; y: number; s: number };

let cachedStill: ImageData | null = null; // bust when still.ts changes: v2
function stillLife(): ImageData {
  if (!cachedStill) cachedStill = paintStillLife(512, 512);
  return cachedStill;
}

function shade(rgb: [number, number, number], k: number): string {
  const r = Math.max(0, Math.min(255, rgb[0] * k));
  const g = Math.max(0, Math.min(255, rgb[1] * k));
  const b = Math.max(0, Math.min(255, rgb[2] * k));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function slub(id: number, t: number): number {
  return 1 + 0.07 * Math.sin(t * 2.3 + id * 1.7) + 0.035 * Math.sin(t * 5.1 + id * 4.2);
}

function playBeater() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const t = ctx.currentTime;
  const noise = ctx.createBuffer(1, 2205, ctx.sampleRate);
  const ch = noise.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 420;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.045, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.13);
  window.setTimeout(() => void ctx.close(), 200);
}

export default function ClothView({
  draft,
  palette,
  sett,
  source,
  sourceLabel,
  reducedMotion,
  onCrossing,
  onView,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clothRef = useRef<Cloth | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, s: 4 });
  const dragRef = useRef<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    pinches?: { d: number; s: number };
  } | null>(null);
  const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dirtyRef = useRef(true);
  const gestureRef = useRef(false);
  const lastDraftRef = useRef(draft.id);
  const lastCrossRef = useRef<string>("");
  const onCrossingRef = useRef(onCrossing);
  const onViewRef = useRef(onView);
  onCrossingRef.current = onCrossing;
  onViewRef.current = onView;

  const fit = (cloth: Cloth, w: number, h: number): View => {
    const ticket = w < 640 ? Math.min(h * 0.42, 320) : 0;
    const usableH = Math.max(160, h - ticket - 16);
    const padX = w * 0.06;
    const padY = 12;
    const s = Math.max(
      1.2,
      Math.min((w - padX * 2) / cloth.cols, (usableH - padY * 2) / cloth.rows),
    );
    return {
      s,
      x: (w - cloth.cols * s) / 2,
      y: padY + Math.max(0, (usableH - cloth.rows * s) / 2),
    };
  };

  const buildPreview = (cloth: Cloth) => {
    const mul = 8;
    const c = document.createElement("canvas");
    c.width = cloth.cols * mul;
    c.height = cloth.rows * mul;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { cols, rows, warp, weft, lift, palette: pal } = cloth;
    ctx.fillStyle = "#0c0a08";
    ctx.fillRect(0, 0, c.width, c.height);
    const gap = 1;
    const body = mul - gap * 2;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const warpUp = lift[j * cols + i] === 1;
        const under = pal.yarns[warpUp ? weft[j] : warp[i]].rgb;
        const over = pal.yarns[warpUp ? warp[i] : weft[j]].rgb;
        const x = i * mul;
        const y = j * mul;
        ctx.fillStyle = shade(under, 0.62);
        ctx.fillRect(x, y, mul, mul);
        ctx.fillStyle = shade(over, 1.06);
        if (warpUp) ctx.fillRect(x + gap, y, body, mul);
        else ctx.fillRect(x, y + gap, mul, body);
      }
    }
    previewRef.current = c;
  };

  const reweave = () => {
    const src = source ?? stillLife();
    const prev = clothRef.current;
    const cloth = weave(src, palette, draft, sett);
    const sizeChanged = !prev || prev.cols !== cloth.cols || prev.rows !== cloth.rows;
    clothRef.current = cloth;
    buildPreview(cloth);
    const canvas = canvasRef.current;
    if (canvas && sizeChanged) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w && h) viewRef.current = fit(cloth, w, h);
    }
    dirtyRef.current = true;
    lastCrossRef.current = "";
    onCrossingRef.current(null);
    onViewRef.current({ scale: viewRef.current.s, source: sourceLabel });
    if (gestureRef.current && lastDraftRef.current !== draft.id) playBeater();
    lastDraftRef.current = draft.id;
  };

  useEffect(() => {
    reweave();
    // source identity is the ImageData object; sett/draft/palette trigger too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, palette, sett, source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let last = performance.now();
    const STEP = 1000 / 60;
    let acc = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cloth = clothRef.current;
      if (cloth && viewRef.current.s < 2) viewRef.current = fit(cloth, w, h);
      dirtyRef.current = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const zoomAt = (cx: number, cy: number, factor: number) => {
      const v = viewRef.current;
      const ns = Math.max(1.2, Math.min(56, v.s * factor));
      const k = ns / v.s;
      v.x = cx - (cx - v.x) * k;
      v.y = cy - (cy - v.y) * k;
      v.s = ns;
      dirtyRef.current = true;
      onViewRef.current({ scale: v.s, source: sourceLabel });
    };

    const api = {
      zoomBy: (f: number) => {
        const r = canvas.getBoundingClientRect();
        zoomAt(r.width / 2, r.height / 2, f);
      },
      reset: () => {
        const cloth = clothRef.current;
        if (!cloth) return;
        viewRef.current = fit(cloth, canvas.clientWidth, canvas.clientHeight);
        dirtyRef.current = true;
        onViewRef.current({ scale: viewRef.current.s, source: sourceLabel });
      },
    };
    onReady(api);

    const drawThread = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      rgb: [number, number, number],
      width: number,
      over: boolean,
      id: number,
    ) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const ux = -dy / len;
      const uy = dx / len;
      const thick = width * slub(id, (x0 + y0) * 0.02);
      const half = thick / 2;
      const kEdge = over ? 0.62 : 0.48;
      const kMid = over ? 1.16 : 0.96;
      const grad = ctx.createLinearGradient(
        x0 + ux * half,
        y0 + uy * half,
        x0 - ux * half,
        y0 - uy * half,
      );
      grad.addColorStop(0, shade(rgb, kEdge));
      grad.addColorStop(0.45, shade(rgb, kMid));
      grad.addColorStop(1, shade(rgb, kEdge * 0.9));
      ctx.strokeStyle = grad;
      ctx.lineWidth = thick;
      ctx.lineCap = "round";
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      const cloth = clothRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "#2a221c";
      ctx.fillRect(0, 0, w, h);
      if (!cloth) return;

      const { x: ox, y: oy, s } = viewRef.current;
      const { cols, rows, warp, weft, lift, palette: pal } = cloth;

      ctx.fillStyle = "#3d3228";
      ctx.fillRect(ox - 5, oy - 5, cols * s + 10, rows * s + 10);

      if (s < 10 && previewRef.current) {
        ctx.imageSmoothingEnabled = s < 4;
        ctx.drawImage(previewRef.current, ox, oy, cols * s, rows * s);
        return;
      }

      const i0 = Math.max(0, Math.floor(-ox / s) - 1);
      const i1 = Math.min(cols, Math.ceil((w - ox) / s) + 1);
      const j0 = Math.max(0, Math.floor(-oy / s) - 1);
      const j1 = Math.min(rows, Math.ceil((h - oy) / s) + 1);
      if (i1 <= i0 || j1 <= j0) return;

      ctx.fillStyle = "#0c0a08";
      ctx.fillRect(ox + i0 * s, oy + j0 * s, (i1 - i0) * s, (j1 - j0) * s);

      const visible = (i1 - i0) * (j1 - j0);
      if (s < 11 || visible > 2200) {
        const gap = s * 0.1;
        const body = s - gap * 2;
        for (let j = j0; j < j1; j++) {
          for (let i = i0; i < i1; i++) {
            const warpUp = lift[j * cols + i] === 1;
            const under = pal.yarns[warpUp ? weft[j] : warp[i]].rgb;
            const over = pal.yarns[warpUp ? warp[i] : weft[j]].rgb;
            const x = ox + i * s;
            const y = oy + j * s;
            ctx.fillStyle = shade(under, 0.7);
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = shade(over, 1.05);
            if (warpUp) ctx.fillRect(x + gap, y, body, s);
            else ctx.fillRect(x, y + gap, s, body);
          }
        }
        return;
      }

      const yarnW = s * 0.78;

      const runWarp = (i: number, up: boolean) => {
        let j = j0;
        while (j < j1) {
          const v = lift[j * cols + i] === 1;
          if (v !== up) {
            j++;
            continue;
          }
          let jEnd = j + 1;
          while (jEnd < j1 && (lift[jEnd * cols + i] === 1) === up) jEnd++;
          const rgb = pal.yarns[warp[i]].rgb;
          const px = ox + (i + 0.5) * s;
          drawThread(px, oy + j * s, px, oy + jEnd * s, rgb, yarnW, up, i);
          j = jEnd;
        }
      };
      const runWeft = (j: number, up: boolean) => {
        let i = i0;
        while (i < i1) {
          const v = lift[j * cols + i] === 0;
          if (v !== up) {
            i++;
            continue;
          }
          let iEnd = i + 1;
          while (iEnd < i1 && (lift[j * cols + iEnd] === 0) === up) iEnd++;
          const rgb = pal.yarns[weft[j]].rgb;
          const py = oy + (j + 0.5) * s;
          drawThread(i * s + ox, py, iEnd * s + ox, py, rgb, yarnW, up, 1000 + j);
          i = iEnd;
        }
      };

      for (let i = i0; i < i1; i++) runWarp(i, false);
      for (let j = j0; j < j1; j++) runWeft(j, false);
      for (let i = i0; i < i1; i++) runWarp(i, true);
      for (let j = j0; j < j1; j++) runWeft(j, true);

      if (s > 18) {
        ctx.globalAlpha = Math.min(0.35, (s - 18) / 40);
        for (let i = i0; i < i1; i++) {
          const rgb = pal.yarns[warp[i]].rgb;
          const px = ox + (i + 0.5) * s;
          ctx.strokeStyle = shade(rgb, 1.25);
          ctx.lineWidth = Math.max(0.4, s * 0.04);
          ctx.beginPath();
          ctx.moveTo(px - s * 0.12, oy + j0 * s);
          ctx.lineTo(px - s * 0.12, oy + j1 * s);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(48, now - last);
      last = now;
      acc += dt;
      while (acc >= STEP) acc -= STEP;
      if (dirtyRef.current) {
        draw();
        dirtyRef.current = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const cellAt = (cx: number, cy: number) => {
      const cloth = clothRef.current;
      if (!cloth) return null;
      const v = viewRef.current;
      const i = Math.floor((cx - v.x) / v.s);
      const j = Math.floor((cy - v.y) / v.s);
      if (i < 0 || j < 0 || i >= cloth.cols || j >= cloth.rows) return null;
      return { i, j };
    };

    const reportCross = (cx: number, cy: number) => {
      const cloth = clothRef.current;
      const at = cellAt(cx, cy);
      if (!cloth || !at || viewRef.current.s < 8) {
        if (lastCrossRef.current) {
          lastCrossRef.current = "";
          onCrossingRef.current(null);
        }
        return;
      }
      const face = faceYarn(cloth, at.i, at.j);
      const key = `${at.i}:${at.j}:${face.yarn.name}:${face.warpUp}`;
      if (key === lastCrossRef.current) return;
      lastCrossRef.current = key;
      onCrossingRef.current({
        i: at.i,
        j: at.j,
        yarn: face.yarn.name,
        role: face.warpUp ? "warp" : "weft",
      });
    };

    const mark = () => {
      gestureRef.current = true;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      mark();
      const r = canvas.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(e.clientX - r.left, e.clientY - r.top, factor);
    };

    const onPointerDown = (e: PointerEvent) => {
      mark();
      canvas.setPointerCapture(e.pointerId);
      touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchesRef.current.size === 1) {
        dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
      } else if (touchesRef.current.size === 2) {
        const pts = [...touchesRef.current.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        dragRef.current = {
          id: -1,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          pinches: { d: d || 1, s: viewRef.current.s },
        };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      reportCross(e.clientX - r.left, e.clientY - r.top);
      if (!touchesRef.current.has(e.pointerId) && !dragRef.current) return;
      if (touchesRef.current.has(e.pointerId)) {
        touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (touchesRef.current.size >= 2 && dragRef.current?.pinches) {
        const pts = [...touchesRef.current.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        const midX = (pts[0].x + pts[1].x) / 2 - r.left;
        const midY = (pts[0].y + pts[1].y) / 2 - r.top;
        const factor = d / dragRef.current.pinches.d;
        const target = dragRef.current.pinches.s * factor;
        const nowS = viewRef.current.s;
        zoomAt(midX, midY, target / nowS);
        return;
      }
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId) return;
      viewRef.current.x = drag.vx + (e.clientX - drag.x);
      viewRef.current.y = drag.vy + (e.clientY - drag.y);
      dirtyRef.current = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      touchesRef.current.delete(e.pointerId);
      if (dragRef.current?.id === e.pointerId || touchesRef.current.size < 2) {
        dragRef.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const v = viewRef.current;
      const step = 48;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        mark();
        api.zoomBy(1.18);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        mark();
        api.zoomBy(1 / 1.18);
      } else if (e.key === "0") {
        e.preventDefault();
        mark();
        api.reset();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        mark();
        v.x += step;
        dirtyRef.current = true;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        mark();
        v.x -= step;
        dirtyRef.current = true;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        mark();
        v.y += step;
        dirtyRef.current = true;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        mark();
        v.y -= step;
        dirtyRef.current = true;
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("keydown", onKey);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("keydown", onKey);
    };
    // reducedMotion reserved: we never idle-animate; zoom is user-driven.
    void reducedMotion;
  }, [onReady, sourceLabel, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      tabIndex={0}
      role="img"
      aria-label="Woven cloth. Scroll or pinch to zoom to a thread. Arrow keys pan. Plus and minus zoom. Zero fits the cloth."
    />
  );
}
