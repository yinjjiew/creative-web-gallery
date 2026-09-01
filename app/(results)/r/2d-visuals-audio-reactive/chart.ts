import { ENV_BINS, ENV_NYQUIST, type LpcFrame } from "./lpc";
import { PLANE, VOWELS, type Vowel } from "./vowels";

export const INSET = {
  l: 56,
  r: 22,
  t: 28,
  b: 86,
};

export type Point = { x: number; y: number };

export function planeSize(w: number, h: number) {
  return {
    x: INSET.l,
    y: INSET.t,
    w: Math.max(40, w - INSET.l - INSET.r),
    h: Math.max(40, h - INSET.t - INSET.b),
  };
}

export function hzToXy(f1: number, f2: number, w: number, h: number): Point {
  const p = planeSize(w, h);
  const nx = (PLANE.f2Max - f2) / (PLANE.f2Max - PLANE.f2Min);
  const ny = (f1 - PLANE.f1Min) / (PLANE.f1Max - PLANE.f1Min);
  return {
    x: p.x + nx * p.w,
    y: p.y + ny * p.h,
  };
}

export function xyToHz(
  x: number,
  y: number,
  w: number,
  h: number,
): { f1: number; f2: number } {
  const p = planeSize(w, h);
  const nx = (x - p.x) / p.w;
  const ny = (y - p.y) / p.h;
  const f2 = PLANE.f2Max - nx * (PLANE.f2Max - PLANE.f2Min);
  const f1 = PLANE.f1Min + ny * (PLANE.f1Max - PLANE.f1Min);
  return {
    f1: clamp(f1, PLANE.f1Min, PLANE.f1Max),
    f2: clamp(f2, PLANE.f2Min, PLANE.f2Max),
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function vowelStyle(v: Vowel, w: number, h: number) {
  const { x, y } = hzToXy(v.f1, v.f2, w, h);
  return {
    left: `${(x / w) * 100}%`,
    top: `${(y / h) * 100}%`,
  };
}

type TrailPt = { f1: number; f2: number; a: number };

export type ChartState = {
  frame: LpcFrame;
  f1: number;
  f2: number;
  voiced: boolean;
  source: "none" | "synth" | "mic";
  targetF1: number;
  targetF2: number;
  holding: boolean;
  trail: TrailPt[];
  reduced: boolean;
};

function rule(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const p = planeSize(w, h);
  ctx.save();
  ctx.strokeStyle = "#c4bbaa";
  ctx.lineWidth = 1;
  ctx.font = "500 10px var(--mono), ui-monospace, monospace";
  ctx.fillStyle = "#6a6458";
  ctx.textBaseline = "middle";

  for (let f2 = 800; f2 <= 2600; f2 += 200) {
    const { x } = hzToXy(PLANE.f1Min, f2, w, h);
    ctx.beginPath();
    ctx.moveTo(x, p.y);
    ctx.lineTo(x, p.y + p.h);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(String(f2), x, p.y + p.h + 12);
  }

  for (let f1 = 300; f1 <= 900; f1 += 100) {
    const { y } = hzToXy(f1, PLANE.f2Min, w, h);
    ctx.beginPath();
    ctx.moveTo(p.x, y);
    ctx.lineTo(p.x + p.w, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(String(f1), p.x - 8, y);
  }

  ctx.fillStyle = "#1c1914";
  ctx.font = "italic 12px var(--serif), serif";
  ctx.textAlign = "center";
  ctx.fillText("F2 Hz  ·  front ←", p.x + p.w * 0.5, p.y + p.h + 28);
  ctx.save();
  ctx.translate(16, p.y + p.h * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("F1 Hz  ·  high tongue ↑", 0, 0);
  ctx.restore();
  ctx.restore();
}

function trapezoid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const i = hzToXy(342, 2322, w, h);
  const ae = hzToXy(588, 1952, w, h);
  const a = hzToXy(768, 1333, w, h);
  const u = hzToXy(378, 997, w, h);
  ctx.beginPath();
  ctx.moveTo(i.x, i.y);
  ctx.lineTo(ae.x, ae.y);
  ctx.lineTo(a.x, a.y);
  ctx.lineTo(u.x, u.y);
  ctx.closePath();
  ctx.strokeStyle = "#1c1914";
  ctx.lineWidth = 1.25;
  ctx.stroke();
}

function marks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#1c1914";
  for (const v of VOWELS) {
    const { x, y } = hzToXy(v.f1, v.f2, w, h);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function envelope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: LpcFrame,
) {
  const x0 = INSET.l;
  const x1 = w - INSET.r;
  const y0 = h - 18;
  const y1 = h - 54;
  const bw = x1 - x0;
  const bh = y0 - y1;

  ctx.strokeStyle = "#1c1914";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y1, bw, bh);

  ctx.font = "500 9px var(--mono), ui-monospace, monospace";
  ctx.fillStyle = "#6a6458";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("LPC envelope", x0, y1 - 3);
  ctx.textAlign = "right";
  ctx.fillText("0–4 kHz", x1, y1 - 3);

  const env = frame.envelope;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < env.length; i++) {
    const v = env[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!(max > min + 0.15)) {
    ctx.strokeStyle = "#c4bbaa";
    ctx.beginPath();
    ctx.moveTo(x0 + 8, y1 + bh * 0.62);
    ctx.lineTo(x1 - 8, y1 + bh * 0.62);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  for (let i = 0; i < ENV_BINS; i++) {
    const x = x0 + (i / (ENV_BINS - 1)) * bw;
    const t = (env[i]! - min) / (max - min);
    const y = y0 - t * (bh - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#1c1914";
  ctx.lineWidth = 1.15;
  ctx.stroke();

  ctx.strokeStyle = "#9a2e1c";
  ctx.lineWidth = 1;
  for (const f of [frame.f1, frame.f2, frame.f3]) {
    if (!(f > 0) || f > ENV_NYQUIST) continue;
    const x = x0 + (f / ENV_NYQUIST) * bw;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y0);
    ctx.stroke();
  }
}

export function drawChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: ChartState,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#e4ddd0";
  ctx.fillRect(0, 0, w, h);

  rule(ctx, w, h);
  trapezoid(ctx, w, h);
  marks(ctx, w, h);
  envelope(ctx, w, h, state.frame);

  if (state.holding && state.source === "synth") {
    const t = hzToXy(state.targetF1, state.targetF2, w, h);
    ctx.beginPath();
    ctx.arc(t.x, t.y, 11, 0, Math.PI * 2);
    ctx.strokeStyle = "#2c4a62";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (state.trail.length > 1) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i++) {
      const pt = state.trail[i]!;
      const { x, y } = hzToXy(pt.f1, pt.f2, w, h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = state.reduced
      ? "rgba(154, 46, 28, 0.55)"
      : "rgba(154, 46, 28, 0.42)";
    ctx.stroke();
  }

  if (state.voiced && state.f1 > 0 && state.f2 > 0) {
    const p = hzToXy(state.f1, state.f2, w, h);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#9a2e1c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.strokeStyle = "#9a2e1c";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
