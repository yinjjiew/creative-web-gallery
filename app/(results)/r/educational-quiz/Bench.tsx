"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { ModelId, SituationId } from "./questions";
import {
  beginAction,
  bounds,
  CIRCLE_R,
  DT,
  FALL_H,
  impulse,
  inMotion,
  release,
  runToEnd,
  seed,
  settled,
  step,
  THROW_H,
  type World,
} from "./physics";

export type Phase = "live" | "run" | "done";

type Props = {
  situation: SituationId;
  model: ModelId;
  correct: boolean;
  phase: Phase;
  reduced: boolean;
  nudge: number;
  onSettled: () => void;
  onMotion: () => void;
};

type Cam = {
  sx: number;
  sy: number;
  ox: number;
  oy: number;
};

export default function Bench({
  situation,
  model,
  correct,
  phase,
  reduced,
  nudge,
  onSettled,
  onMotion,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(seed(situation));
  const phaseRef = useRef(phase);
  const modelRef = useRef(model);
  const correctRef = useRef(correct);
  const reducedRef = useRef(reduced);
  const settledOnce = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const acc = useRef(0);
  const last = useRef(0);
  const onSettledRef = useRef(onSettled);
  const onMotionRef = useRef(onMotion);

  phaseRef.current = phase;
  modelRef.current = model;
  correctRef.current = correct;
  reducedRef.current = reduced;
  onSettledRef.current = onSettled;
  onMotionRef.current = onMotion;

  useEffect(() => {
    world.current = seed(situation);
    settledOnce.current = false;
    acc.current = 0;
    last.current = 0;
  }, [situation]);

  useEffect(() => {
    if (phase !== "run") return;
    world.current = beginAction(seed(situation), model, correct);
    settledOnce.current = false;
    acc.current = 0;
    last.current = 0;
    if (reduced) {
      world.current = runToEnd(world.current, model);
      settledOnce.current = true;
      onSettledRef.current();
    }
  }, [phase, model, correct, reduced, situation]);

  useEffect(() => {
    if (nudge === 0 || phaseRef.current !== "live") return;
    const sit = world.current.situation;
    if (sit === "puck") {
      world.current = impulse(world.current, 2.6, 0);
    } else if (sit === "fall") {
      world.current = release(world.current);
    } else if (sit === "throw") {
      const b = world.current.ink[0];
      if (b && b.vx === 0) world.current = impulse(world.current, 5.4, 0);
    } else if (sit === "circle" && !world.current.cut) {
      world.current = { ...world.current, cut: true };
    }
    onMotionRef.current();
  }, [nudge]);

  useEffect(() => {
    const el = canvas.current;
    const parent = wrap.current;
    if (!el || !parent) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let live = true;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth || 640;
      const h = parent.clientHeight || 400;
      el.width = Math.floor(w * dpr);
      el.height = Math.floor(h * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(parent);

    const tick = (now: number) => {
      if (!live) return;
      const prev = last.current || now;
      last.current = now;
      let dt = (now - prev) / 1000;
      if (dt > 0.05) dt = 0.05;
      const running = phaseRef.current === "run" && !reducedRef.current;
      const roaming =
        phaseRef.current === "live" &&
        !reducedRef.current &&
        inMotion(world.current);

      if (running || roaming) {
        acc.current += dt;
        let guard = 0;
        while (acc.current >= DT && guard < 8) {
          world.current = step(
            world.current,
            DT,
            modelRef.current,
            phaseRef.current === "live",
          );
          acc.current -= DT;
          guard += 1;
        }
        if (
          running &&
          !settledOnce.current &&
          settled(world.current, false)
        ) {
          settledOnce.current = true;
          onSettledRef.current();
        }
      }
      const sans =
        getComputedStyle(parent).getPropertyValue("--font-sans").trim() ||
        "sans-serif";
      draw(ctx, parent.clientWidth, parent.clientHeight, world.current, {
        phase: phaseRef.current,
        model: modelRef.current,
        correct: correctRef.current,
        font: sans,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  function toWorld(cam: Cam, px: number, py: number): { x: number; y: number } {
    return {
      x: (px - cam.ox) / cam.sx,
      y: (py - cam.oy) / cam.sy,
    };
  }

  function pointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const el = canvas.current;
    if (!el || phaseRef.current !== "live") return;
    const rect = el.getBoundingClientRect();
    const cam = camera(el.clientWidth, el.clientHeight, situation);
    const p = toWorld(cam, e.clientX - rect.left, e.clientY - rect.top);
    drag.current = { id: e.pointerId, x: p.x, y: p.y };
    el.setPointerCapture(e.pointerId);
  }

  function pointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    drag.current = null;
    if (!start || phaseRef.current !== "live") return;
    const el = canvas.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cam = camera(el.clientWidth, el.clientHeight, situation);
    const p = toWorld(cam, e.clientX - rect.left, e.clientY - rect.top);

    if (situation === "puck") {
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      const mag = Math.hypot(dx, dy);
      if (mag < 0.08) {
        world.current = impulse(world.current, 2.6, 0);
      } else {
        const scale = 3.1 / Math.max(mag, 0.35);
        world.current = impulse(world.current, dx * scale, dy * scale);
      }
      onMotionRef.current();
    } else if (situation === "fall") {
      world.current = release(world.current);
      onMotionRef.current();
    } else if (situation === "throw") {
      const b = world.current.ink[0];
      if (b && b.vx === 0) {
        world.current = impulse(world.current, 5.4, 0);
        onMotionRef.current();
      }
    } else if (situation === "circle" && !world.current.cut) {
      world.current = { ...world.current, cut: true };
      onMotionRef.current();
    }
  }

  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={canvas}
        onPointerDown={(e) => {
          e.preventDefault();
          pointerDown(e);
        }}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
        style={{
          touchAction: "none",
          cursor:
            situation === "puck" && phase === "live" ? "grab" : "default",
        }}
        aria-label="The situation, drawn as a working model"
      />
    </div>
  );
}

function camera(w: number, h: number, s: SituationId): Cam {
  const b = bounds(s);
  const pad = 28;
  const sx = (w - pad * 2) / (b.x1 - b.x0);
  const sy = (h - pad * 2) / (b.y1 - b.y0);
  const scale = Math.min(sx, Math.abs(sy));
  // Physics y-up → canvas y-down.
  return {
    sx: scale,
    sy: -scale,
    ox: pad - b.x0 * scale + (w - pad * 2 - scale * (b.x1 - b.x0)) / 2,
    oy: h - pad + b.y0 * scale - (h - pad * 2 - scale * (b.y1 - b.y0)) / 2,
  };
}

function xy(cam: Cam, x: number, y: number): { x: number; y: number } {
  return { x: cam.ox + x * cam.sx, y: cam.oy + y * cam.sy };
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  world: World,
  meta: { phase: Phase; model: ModelId; correct: boolean; font: string },
): void {
  ctx.fillStyle = "#f3eee4";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#cfc6b4";
  const step = w < 480 ? 16 : 18;
  const dot = w < 480 ? 1.7 : 1.25;
  for (let x = 10; x < w; x += step) {
    for (let y = 10; y < h; y += step) {
      ctx.fillRect(x, y, dot, dot);
    }
  }
  const cam = camera(w, h, world.situation);

  drawScene(ctx, cam, world, meta.font);
  drawTrails(ctx, cam, world.inkTrail, "#1a1612", false);
  drawTrails(ctx, cam, world.rustTrail, "#9c2f16", true);

  for (const b of world.rust) {
    drawBall(ctx, cam, b, "#9c2f16", true);
  }
  for (const b of world.ink) {
    drawBall(ctx, cam, b, "#1a1612", false);
  }

  drawForces(ctx, cam, world, meta);
  drawLabels(ctx, cam, world, meta);
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  w: World,
  font: string,
): void {
  ctx.save();
  ctx.strokeStyle = "#c9c0ae";
  ctx.lineWidth = 1.1;

  if (w.situation === "puck") {
    const a = xy(cam, 0.45, 0.9);
    const b = xy(cam, 7.35, 4.0);
    ctx.fillStyle = "rgba(26, 22, 18, 0.04)";
    ctx.fillRect(a.x, b.y, b.x - a.x, a.y - b.y);
    ctx.strokeStyle = "#b7ae9c";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(a.x, b.y, b.x - a.x, a.y - b.y);
    ctx.fillStyle = "#6e6458";
    ctx.font = `500 11px ${font}, sans-serif`;
    ctx.fillText("frictionless", a.x + 8, a.y - 8);
  }

  if (w.situation === "fall" || w.situation === "throw") {
    const g0 = xy(cam, -1, 0);
    const g1 = xy(cam, 12, 0);
    ctx.beginPath();
    ctx.moveTo(g0.x, g0.y);
    ctx.lineTo(g1.x, g1.y);
    ctx.stroke();
    ctx.fillStyle = "#d8d0c0";
    ctx.fillRect(0, g0.y, 2000, 2000);
  }

  if (w.situation === "fall") {
    const L = xy(cam, 1.4, FALL_H);
    const R = xy(cam, 4.6, FALL_H);
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.lineTo(R.x, R.y);
    ctx.stroke();
  }

  if (w.situation === "throw") {
    const top = xy(cam, 0.15, THROW_H);
    const face = xy(cam, 2.15, THROW_H);
    const foot = xy(cam, 2.15, 0);
    ctx.fillStyle = "#e4dccb";
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(face.x, face.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.lineTo(top.x, foot.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (w.situation === "circle") {
    const c = xy(cam, 0, 0);
    const r = CIRCLE_R * Math.abs(cam.sx);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1612";
    ctx.fill();
    if (!w.cut) {
      const b = w.ink[0];
      if (b) {
        const p = xy(cam, b.x, b.y);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "#6b5a2e";
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawTrails(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  trails: { x: number; y: number }[][],
  color: string,
  dashed: boolean,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = dashed ? 1.4 : 1.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (dashed) ctx.setLineDash([5, 4]);
  for (const trail of trails) {
    if (trail.length < 2) continue;
    ctx.beginPath();
    const p0 = xy(cam, trail[0].x, trail[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < trail.length; i++) {
      const p = xy(cam, trail[i].x, trail[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  b: { x: number; y: number; r: number },
  color: string,
  ghost: boolean,
): void {
  const p = xy(cam, b.x, b.y);
  const r = Math.max(b.r * Math.abs(cam.sx), 14);
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  if (ghost) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x - r * 0.28, p.y - r * 0.28, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(243, 238, 228, 0.35)";
    ctx.fill();
  }
  ctx.restore();
}

function drawForces(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  w: World,
  meta: { phase: Phase; model: ModelId; correct: boolean; font: string },
): void {
  const f = meta.font;
  if (meta.phase === "live") {
    if (w.situation === "circle" && !w.cut && w.ink[0]) {
      const b = w.ink[0];
      arrow(ctx, cam, b.x, b.y, -b.x * 0.38, -b.y * 0.38, "#243d36", "T, in", f);
    }
    return;
  }

  if (w.situation === "fall") {
    for (const b of w.ink) {
      if (b.y > b.r + 0.02) {
        arrow(ctx, cam, b.x, b.y, 0, -0.95, "#1a1612", "mg", f);
      }
    }
  }
  if (w.situation === "throw" && w.ink[0] && w.ink[0].y > w.ink[0].r + 0.02) {
    const b = w.ink[0];
    arrow(ctx, cam, b.x, b.y, 0, -0.85, "#1a1612", "mg", f);
  }
  if (
    w.situation === "puck" &&
    !meta.correct &&
    meta.model === "impetus" &&
    w.rust[0] &&
    Math.hypot(w.rust[0].vx, w.rust[0].vy) > 0.15
  ) {
    const b = w.rust[0];
    const s = 0.35;
    arrow(ctx, cam, b.x, b.y, b.vx * s, b.vy * s, "#9c2f16", "impetus", f);
  }
  if (
    w.situation === "circle" &&
    w.cut &&
    !meta.correct &&
    meta.model === "outward"
  ) {
    arrow(ctx, cam, CIRCLE_R * 0.15, 0, 0.9, 0, "#9c2f16", "out?", f);
  }
}

function arrow(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  label: string,
  font: string,
): void {
  const a = xy(cam, x, y);
  const b = xy(cam, x + dx, y + dy);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(
    b.x - 8 * Math.cos(ang - 0.4),
    b.y - 8 * Math.sin(ang - 0.4),
  );
  ctx.lineTo(
    b.x - 8 * Math.cos(ang + 0.4),
    b.y - 8 * Math.sin(ang + 0.4),
  );
  ctx.closePath();
  ctx.fill();
  ctx.font = `500 10px ${font}, sans-serif`;
  ctx.fillText(label, b.x + 5, b.y - 4);
  ctx.restore();
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  w: World,
  meta: { phase: Phase; model: ModelId; correct: boolean; font: string },
): void {
  ctx.save();
  ctx.font = `500 11px ${meta.font}, sans-serif`;
  ctx.fillStyle = "#3d342c";

  if (w.situation === "fall") {
    for (const b of w.ink) {
      const p = xy(cam, b.x, b.y + b.r + 0.35);
      ctx.fillText(b.m > 2 ? "10 kg" : "1 kg", p.x - 12, p.y);
    }
  }

  if (meta.phase !== "live" && w.rust.length && !meta.correct) {
    ctx.fillStyle = "#9c2f16";
    ctx.fillText("your prediction", 16, 22);
    ctx.fillStyle = "#1a1612";
    ctx.fillText("what happens", 16, 38);
  }

  if (w.situation === "circle" && w.cut) {
    const t0 = xy(cam, CIRCLE_R, 0.22);
    ctx.fillStyle = "#6e6458";
    ctx.fillText("cut", t0.x + 8, t0.y);
  }

  if (meta.phase === "live" && w.situation === "puck" && w.ink[0]) {
    const b = w.ink[0];
    if (Math.hypot(b.vx, b.vy) < 0.05) {
      arrow(ctx, cam, b.x + 0.28, b.y, 0.85, 0, "#6b5a2e", "flick", meta.font);
    }
  }
  ctx.restore();
}
