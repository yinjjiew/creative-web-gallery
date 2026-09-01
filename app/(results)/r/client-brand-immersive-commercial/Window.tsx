"use client";

import { useEffect, useRef } from "react";

import styles from "./natt.module.css";

type Props = {
  night: number;
  lamp: boolean;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgb(c: [number, number, number], a = 1) {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const KEYS: {
  t: number;
  top: [number, number, number];
  bot: [number, number, number];
}[] = [
  { t: 0, top: [32, 42, 68], bot: [210, 124, 70] },
  { t: 0.14, top: [16, 22, 38], bot: [88, 70, 78] },
  { t: 0.3, top: [6, 8, 14], bot: [14, 16, 22] },
  { t: 0.55, top: [4, 5, 8], bot: [7, 8, 12] },
  { t: 0.74, top: [58, 72, 90], bot: [150, 118, 96] },
  { t: 0.88, top: [176, 190, 204], bot: [236, 220, 200] },
  { t: 1, top: [214, 222, 228], bot: [244, 236, 224] },
];

function skyAt(t: number) {
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) {
      a = KEYS[i];
      b = KEYS[i + 1];
    }
  }
  const u = (t - a.t) / (b.t - a.t || 1);
  return { top: mix(a.top, b.top, u), bot: mix(a.bot, b.bot, u) };
}

function mast(ctx: CanvasRenderingContext2D, x: number, horizon: number, ink: string) {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x, horizon + 46);
  ctx.lineTo(x, horizon - 78);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, horizon - 78);
  ctx.lineTo(x + 24, horizon - 72);
  ctx.stroke();
}

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  night: number,
  lamp: boolean,
) {
  const t = night;
  const sky = skyAt(t);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgb(sky.top));
  g.addColorStop(0.52, rgb(mix(sky.top, sky.bot, 0.4)));
  g.addColorStop(1, rgb(sky.bot));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const horizon = h * (0.56 - t * 0.03);
  const eve = t < 0.18;
  const dark = t >= 0.18 && t < 0.76;
  const dawn = t >= 0.76;
  const berlin = t >= 0.94;
  const rand = rng(berlin ? 31 : 14);

  // Land
  ctx.fillStyle = rgb(
    berlin ? [148, 148, 146] : dawn ? [110, 108, 104] : dark ? [12, 13, 15] : [40, 36, 38],
  );
  ctx.beginPath();
  ctx.moveTo(0, horizon + 10);
  let x = 0;
  while (x < w + 40) {
    x += 36 + rand() * 48;
    ctx.lineTo(x, horizon + (rand() * 16 - 5));
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Ballast / tracks — still, in perspective
  const vanishX = w * 0.46;
  ctx.strokeStyle = rgb(dawn ? [60, 58, 56] : [18, 16, 16], dawn ? 0.55 : 0.7);
  ctx.lineWidth = 1;
  for (const side of [-38, 38]) {
    ctx.beginPath();
    ctx.moveTo(vanishX + side * 0.15, horizon + 8);
    ctx.lineTo(vanishX + side * 2.4, h);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const u = (i + 1) / 10;
    const y = horizon + 10 + u * u * (h - horizon);
    const spread = 16 + u * u * 120;
    ctx.beginPath();
    ctx.moveTo(vanishX - spread, y);
    ctx.lineTo(vanishX + spread, y);
    ctx.stroke();
  }

  // Built stuff
  const count = berlin ? 22 : eve ? 20 : dawn ? 12 : 6;
  for (let i = 0; i < count; i++) {
    const bw = 14 + rand() * (berlin ? 36 : 50);
    const bh = 16 + rand() * (eve ? 86 : berlin ? 70 : 36);
    const bx = rand() * w;
    const by = horizon - bh + 8;
    const fill = rgb(
      eve ? [44, 38, 42] : berlin ? [120, 122, 124] : dawn ? [88, 86, 84] : [14, 14, 16],
    );
    block(ctx, bx, by, bw, bh, fill);
    if (eve) {
      const cols = Math.max(2, Math.floor(bw / 7));
      const rows = Math.max(2, Math.floor(bh / 9));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < 0.5) {
            ctx.fillStyle = rgb(
              rand() < 0.25 ? [255, 214, 150] : [255, 176, 82],
              0.7 + rand() * 0.3,
            );
            ctx.fillRect(bx + 3 + c * 7, by + 4 + r * 9, 2.8, 3.6);
          }
        }
      }
    }
    if (berlin && rand() < 0.35) {
      ctx.fillStyle = rgb([230, 228, 220], 0.35);
      ctx.fillRect(bx + 3, by + 6, bw - 6, 3);
    }
  }

  // Catenary
  const ink = rgb(dawn ? [48, 48, 50] : [10, 10, 12], dawn ? 0.65 : 0.85);
  for (let i = -1; i < 7; i++) {
    mast(ctx, i * (w / 5.1) + w * 0.1, horizon, ink);
  }
  ctx.strokeStyle = ink;
  ctx.beginPath();
  ctx.moveTo(0, horizon - 70);
  for (let i = 0; i <= 10; i++) {
    ctx.lineTo((w / 10) * i, horizon - 70 + Math.sin((i / 10) * Math.PI) * 11);
  }
  ctx.stroke();

  if (dark) {
    ctx.fillStyle = rgb([22, 22, 24]);
    ctx.fillRect(w * 0.7, horizon - 92, 5, 92);
    ctx.fillStyle = rgb(t < 0.5 ? [170, 36, 30] : [46, 150, 72], 0.92);
    ctx.beginPath();
    ctx.arc(w * 0.7 + 2.5, horizon - 96, 4.2, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = rgb([255, 188, 96], 0.28 + rand() * 0.4);
      ctx.fillRect(rand() * w, horizon + 8 + rand() * 28, 2, 2);
    }
  }

  // Station roof at the two ends
  if (eve || berlin) {
    ctx.fillStyle = rgb(berlin ? [58, 60, 62] : [28, 26, 26], berlin ? 0.5 : 0.6);
    ctx.fillRect(0, horizon - 118, w, 18);
    for (let i = 0; i < 7; i++) {
      ctx.fillRect((w / 7) * i + 18, horizon - 100, 5, 100);
    }
    if (eve) {
      ctx.fillStyle = rgb([255, 196, 110], 0.42);
      ctx.fillRect(0, horizon - 102, w, 7);
    }
    if (berlin) {
      ctx.fillStyle = rgb([240, 236, 228], 0.28);
      ctx.fillRect(0, horizon - 102, w, 6);
    }
  }

  // Glass
  const glass = ctx.createLinearGradient(0, 0, 0, h);
  glass.addColorStop(0, "rgba(18,14,10,0.14)");
  glass.addColorStop(0.65, "rgba(18,14,10,0.04)");
  glass.addColorStop(1, "rgba(42,30,20,0.2)");
  ctx.fillStyle = glass;
  ctx.fillRect(0, 0, w, h);

  if (lamp) {
    const lg = ctx.createRadialGradient(
      w * 0.18,
      h * 0.88,
      8,
      w * 0.18,
      h * 0.92,
      h * 0.5,
    );
    lg.addColorStop(0, "rgba(255,196,120,0.2)");
    lg.addColorStop(1, "rgba(255,196,120,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.055)";
  ctx.beginPath();
  ctx.moveTo(w * 0.2, 0);
  ctx.lineTo(w * 0.24, h);
  ctx.stroke();
}

export default function Window({ night, lamp }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width < 8 || height < 8) return;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(ctx, width, height, night, lamp);
    };

    draw();
    const obs = new ResizeObserver(draw);
    if (canvas.parentElement) obs.observe(canvas.parentElement);
    return () => obs.disconnect();
  }, [night, lamp]);

  return <canvas className={styles.glass} ref={ref} aria-hidden="true" />;
}
