"use client";

import { useEffect, useRef } from "react";

import {
  hoochOf,
  volumeOf,
  yeastTemp,
  type Culture,
} from "./sim";
import s from "./starter.module.css";

type Bubble = { x: number; y: number; r: number; v: number; a: number };

function paste(c: Culture) {
  if (c.flour === "rye") return { r: 166, g: 124, b: 68 };
  if (c.flour === "wheat") return { r: 201, g: 166, b: 107 };
  return { r: 232, g: 215, b: 168 };
}

/**
 * The jar is the instrument. Rise, bubbles, colour and hooch are the
 * reading — not a graph.
 */
export default function Jar({
  culture,
  lidOff,
  reduce,
  onJar,
}: {
  culture: Culture;
  lidOff: boolean;
  reduce: boolean;
  onJar: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cultureRef = useRef(culture);
  const bubbles = useRef<Bubble[]>([]);
  cultureRef.current = culture;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = cultureRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, c, dt, bubbles.current, lidOff, reduce);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [lidOff, reduce]);

  const vol = volumeOf(culture);
  const band = 0.16 + ((1 - 0.68) / (2.55 - 0.68)) * 0.62;

  return (
    <button
      type="button"
      className={s.jar}
      onClick={onJar}
      aria-label={lidOff ? "Stir the starter" : "Lift the lid"}
    >
      <span className={s.jarGlass} aria-hidden="true">
        <canvas ref={canvasRef} className={s.jarCanvas} />
        <span className={s.band} style={{ bottom: `${band * 100}%` }} />
        <span className={s.glint} />
      </span>
      <span className={`${s.lid} ${lidOff ? s.lidOff : ""}`} aria-hidden="true">
        <span className={s.lidKnob} />
      </span>
      <span className={s.jarName}>starter</span>
      <span className={s.srOnly}>
        Culture is {vol >= 1.9 ? "doubled" : vol >= 1.4 ? "domed" : "near the mark"}.
      </span>
    </button>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: Culture,
  dt: number,
  bubbles: Bubble[],
  lidOff: boolean,
  reduce: boolean,
) {
  ctx.clearRect(0, 0, w, h);
  const vol = volumeOf(c);
  const hooch = hoochOf(c);
  const fill = 0.16 + ((vol - 0.68) / (2.55 - 0.68)) * 0.62;
  const top = h * (1 - fill);
  const col = paste(c);
  const acid = Math.min(1, (c.lactic + c.acetic) / 2.2);
  const r = col.r * (1 - 0.18 * acid);
  const g = col.g * (1 - 0.14 * acid);
  const b = col.b * (1 - 0.02 * acid);

  ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h);
  ctx.lineTo(w * 0.88, h);
  ctx.lineTo(w * 0.86, top + 8);
  ctx.quadraticCurveTo(w * 0.5, top - (vol > 1.5 ? 10 : 4), w * 0.14, top + 8);
  ctx.closePath();
  ctx.fill();

  if (hooch > 0.04) {
    const hh = Math.min(22, 8 + hooch * 28);
    ctx.fillStyle = "rgba(168, 156, 122, 0.55)";
    ctx.fillRect(w * 0.14, top + 4, w * 0.72, hh);
  }

  const activity = c.yeast * Math.min(1, c.sugar * 1.6) * yeastTemp(c.temp);
  const want = lidOff ? Math.round(4 + activity * 22) : 3;
  if (bubbles.length > want) bubbles.length = want;
  while (bubbles.length < want) {
    bubbles.push({
      x: 0.2 + Math.random() * 0.6,
      y: 0.55 + Math.random() * 0.4,
      r: 0.8 + Math.random() * 2.4,
      v: 0.04 + Math.random() * 0.1,
      a: 0.25 + Math.random() * 0.5,
    });
  }

  const speed = reduce ? 0 : (0.12 + activity * 0.7) * (lidOff ? 1 : 0.15);
  for (const bub of bubbles) {
    if (!reduce) {
      bub.y -= bub.v * speed * dt * 18;
      if (bub.y < fill * 0.08) {
        bub.y = 0.92;
        bub.x = 0.2 + Math.random() * 0.6;
      }
    }
    const y = h * (1 - bub.y * fill);
    if (y < top + 4) continue;
    ctx.beginPath();
    ctx.arc(bub.x * w, y, bub.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 248, 230, ${bub.a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(120, 90, 40, ${bub.a * 0.35})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
}
