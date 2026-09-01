/**
 * Naive versus Newtonian kinematics for four situations.
 *
 * Newton is the only physical model. The other branches are explicit
 * implementations of documented misconceptions, written so a rust-coloured
 * ghost can be integrated beside the real motion and fail in the specific
 * way the chosen answer predicted.
 *
 * Integrator: semi-implicit Euler at a fixed 1/120 s. For constant or
 * zero acceleration this is exact on the velocity, and position error is
 * far below a pixel at the scales we draw. Circular idle motion is
 * advanced in angle, not integrated, so the orbit does not spiral from
 * numerical energy drift.
 */

import type { ModelId, SituationId } from "./questions";

export const DT = 1 / 120;
export const G = 9.81;

export type Vec = { x: number; y: number };

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
  id: string;
};

export type World = {
  situation: SituationId;
  t: number;
  shoveT: number;
  cut: boolean;
  released: boolean;
  ink: Body[];
  rust: Body[];
  inkTrail: Vec[][];
  rustTrail: Vec[][];
};

export const SHOVE_T = 0.28;
export const PUCK_V = 2.7;
export const FALL_H = 11.2;
export const THROW_H = 6.8;
export const THROW_V = 5.4;
export const CIRCLE_R = 1.35;
export const CIRCLE_W = 2.4 / CIRCLE_R;

export function seed(situation: SituationId): World {
  switch (situation) {
    case "puck":
      return blank("puck", [
        body("puck", 1.55, 2.45, 0, 0, 0.16, 1),
      ]);
    case "fall":
      return blank("fall", [
        body("light", 2.15, FALL_H, 0, 0, 0.2, 1),
        body("heavy", 3.85, FALL_H, 0, 0, 0.2, 10),
      ]);
    case "throw":
      return blank("throw", [
        body("ball", 2.15, THROW_H + 0.14, 0, 0, 0.15, 1),
      ]);
    case "circle":
      return blank("circle", [
        body("ball", CIRCLE_R, 0, 0, CIRCLE_W * CIRCLE_R, 0.14, 1),
      ]);
  }
}

function body(
  id: string,
  x: number,
  y: number,
  vx: number,
  vy: number,
  r: number,
  m: number,
): Body {
  return { id, x, y, vx, vy, r, m };
}

function blank(situation: SituationId, ink: Body[]): World {
  return {
    situation,
    t: 0,
    shoveT: 0,
    cut: false,
    released: false,
    ink: ink.map(clone),
    rust: [],
    inkTrail: ink.map(() => []),
    rustTrail: [],
  };
}

export function clone(b: Body): Body {
  return { ...b };
}

export function cloneWorld(w: World): World {
  return {
    ...w,
    ink: w.ink.map(clone),
    rust: w.rust.map(clone),
    inkTrail: w.inkTrail.map((t) => t.map((p) => ({ ...p }))),
    rustTrail: w.rustTrail.map((t) => t.map((p) => ({ ...p }))),
  };
}

/** Arm the rust ghosts for a chosen model. Newton has no ghost. */
export function arm(w: World, model: ModelId, correct: boolean): World {
  const next = cloneWorld(w);
  next.t = 0;
  next.shoveT = 0;
  next.cut = false;
  next.released = true;
  next.ink = seed(w.situation).ink;
  next.inkTrail = next.ink.map(() => []);
  if (correct || model === "newton") {
    next.rust = [];
    next.rustTrail = [];
    return next;
  }
  next.rust = next.ink.map((b) => clone(b));
  next.rustTrail = next.rust.map(() => []);
  return next;
}

export function impulse(w: World, vx: number, vy: number): World {
  const next = cloneWorld(w);
  for (const b of next.ink) {
    b.vx += vx;
    b.vy += vy;
  }
  for (const b of next.rust) {
    b.vx += vx;
    b.vy += vy;
  }
  return next;
}

export function release(w: World): World {
  const next = cloneWorld(w);
  next.released = true;
  return next;
}

export function inMotion(w: World): boolean {
  if (w.situation === "circle") return true;
  if (w.released) return true;
  return w.ink.some((b) => Math.hypot(b.vx, b.vy) > 1e-4);
}

export function beginAction(w: World, model: ModelId, correct: boolean): World {
  const next = arm(w, model, correct);
  if (next.situation === "puck") {
    for (const b of next.ink) {
      b.vx = 0;
      b.vy = 0;
    }
    for (const b of next.rust) {
      b.vx = 0;
      b.vy = 0;
    }
  }
  if (next.situation === "throw") {
    for (const b of next.ink) {
      b.vx = THROW_V;
      b.vy = 0;
    }
    for (const b of next.rust) {
      b.vx = THROW_V;
      b.vy = 0;
    }
  }
  if (next.situation === "circle") {
    next.cut = true;
    const b = next.ink[0];
    b.x = CIRCLE_R;
    b.y = 0;
    b.vx = 0;
    b.vy = CIRCLE_W * CIRCLE_R;
    if (next.rust[0]) {
      const r = next.rust[0];
      r.x = CIRCLE_R;
      r.y = 0;
      if (model === "outward") {
        r.vx = CIRCLE_W * CIRCLE_R;
        r.vy = 0;
      } else if (model === "inward") {
        r.vx = -CIRCLE_W * CIRCLE_R;
        r.vy = 0;
      } else {
        r.vx = 0;
        r.vy = CIRCLE_W * CIRCLE_R;
      }
    }
  }
  return next;
}

export function step(
  w: World,
  dt: number,
  model: ModelId,
  live: boolean,
): World {
  const next = cloneWorld(w);
  next.t += dt;

  if (next.situation === "circle" && !next.cut && live) {
    spin(next.ink[0], dt);
    record(next);
    return next;
  }

  if (next.situation === "puck") {
    stepPuck(next, dt, model, live);
  } else if (next.situation === "fall") {
    stepFall(next, dt, model, live);
  } else if (next.situation === "throw") {
    stepThrow(next, dt, model, live);
  } else {
    stepCircle(next, dt, model, live);
  }
  record(next);
  return next;
}

function stepPuck(w: World, dt: number, model: ModelId, live: boolean): void {
  const shoving = !live && w.t < SHOVE_T;
  const a = PUCK_V / SHOVE_T;

  for (const b of w.ink) {
    if (shoving) {
      b.vx = a * Math.min(w.t, SHOVE_T);
      b.vy = 0;
    }
    coast(b, dt);
  }

  for (const b of w.rust) {
    if (shoving) {
      b.vx = a * Math.min(w.t, SHOVE_T);
      b.vy = 0;
      coast(b, dt);
      continue;
    }
    if (model === "aristotle") {
      b.vx = 0;
      b.vy = 0;
    } else if (model === "impetus") {
      const k = Math.exp(-dt / 0.95);
      b.vx *= k;
      b.vy *= k;
      coast(b, dt);
    } else if (model === "curvilinear") {
      const omega = 1.15;
      const c = Math.cos(omega * dt);
      const s = Math.sin(omega * dt);
      const vx = b.vx * c - b.vy * s;
      const vy = b.vx * s + b.vy * c;
      b.vx = vx;
      b.vy = vy;
      coast(b, dt);
    } else {
      coast(b, dt);
    }
  }
}

function stepFall(w: World, dt: number, model: ModelId, _live: boolean): void {
  if (!w.released) return;
  for (const b of w.ink) {
    fall(b, dt, G);
  }
  for (const b of w.rust) {
    if (model === "mass-speed") {
      const a = b.m > 2 ? 1.72 * G : G;
      fall(b, dt, a);
    } else if (model === "mass-inertia") {
      const a = b.m > 2 ? 0.52 * G : G;
      fall(b, dt, a);
    } else if (model === "force-builds") {
      const a = b.m > 2 && w.t < 0.42 ? 2.05 * G : G;
      fall(b, dt, a);
    } else {
      fall(b, dt, G);
    }
  }
}

function stepThrow(w: World, dt: number, model: ModelId, _live: boolean): void {
  for (const b of w.ink) {
    fall(b, dt, G);
    if (b.y < b.r) {
      b.y = b.r;
      b.vy = 0;
      b.vx = 0;
    }
  }
  for (const b of w.rust) {
    if (model === "straight-drop") {
      const tCorner = 0.72;
      if (w.t < tCorner) {
        b.vy = 0;
        coast(b, dt);
        b.y = THROW_H + 0.14;
      } else {
        b.vx = 0;
        fall(b, dt, G);
      }
    } else if (model === "gravity-waits") {
      const fade = Math.exp(-dt / 1.15);
      b.vx *= fade;
      const g = G * Math.min(1, Math.max(0, (w.t - 0.35) / 0.55));
      fall(b, dt, g);
    } else if (model === "arm-arc") {
      const R = 2.4;
      const cx = 2.15;
      const cy = THROW_H + 0.14 - R;
      const omega = THROW_V / R;
      const ang = -Math.PI / 2 + omega * w.t;
      if (ang < 0.15) {
        b.x = cx + R * Math.cos(ang);
        b.y = cy + R * Math.sin(ang);
        b.vx = -R * omega * Math.sin(ang);
        b.vy = R * omega * Math.cos(ang);
      } else {
        fall(b, dt, G);
      }
    } else {
      fall(b, dt, G);
    }
    if (b.y < b.r) {
      b.y = b.r;
      b.vy = 0;
      b.vx = 0;
    }
  }
}

function stepCircle(w: World, dt: number, model: ModelId, _live: boolean): void {
  for (const b of w.ink) {
    if (!w.cut) spin(b, dt);
    else coast(b, dt);
  }
  for (const b of w.rust) {
    if (!w.cut) {
      spin(b, dt);
      continue;
    }
    if (model === "curve-on") {
      const fade = Math.exp(-w.t / 1.8);
      const omega = CIRCLE_W * fade;
      const ang = Math.atan2(b.y, b.x) + omega * dt;
      const rad = CIRCLE_R + 0.22 * w.t;
      b.x = rad * Math.cos(ang);
      b.y = rad * Math.sin(ang);
      b.vx = -rad * omega * Math.sin(ang);
      b.vy = rad * omega * Math.cos(ang);
    } else {
      coast(b, dt);
    }
  }
}

function spin(b: Body, dt: number): void {
  const ang = Math.atan2(b.y, b.x) + CIRCLE_W * dt;
  b.x = CIRCLE_R * Math.cos(ang);
  b.y = CIRCLE_R * Math.sin(ang);
  b.vx = -CIRCLE_R * CIRCLE_W * Math.sin(ang);
  b.vy = CIRCLE_R * CIRCLE_W * Math.cos(ang);
}

function coast(b: Body, dt: number): void {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

function fall(b: Body, dt: number, g: number): void {
  b.vy -= g * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.y < b.r) {
    b.y = b.r;
    b.vy = 0;
    b.vx = 0;
  }
}

function record(w: World): void {
  const every = 3;
  const n = Math.round(w.t / DT);
  if (n % every !== 0) return;
  w.ink.forEach((b, i) => {
    const trail = w.inkTrail[i] ?? (w.inkTrail[i] = []);
    trail.push({ x: b.x, y: b.y });
    if (trail.length > 240) trail.shift();
  });
  w.rust.forEach((b, i) => {
    const trail = w.rustTrail[i] ?? (w.rustTrail[i] = []);
    trail.push({ x: b.x, y: b.y });
    if (trail.length > 240) trail.shift();
  });
}

export function settled(w: World, live: boolean): boolean {
  if (live) return false;
  switch (w.situation) {
    case "puck":
      return w.t > 3.1;
    case "fall":
      return w.ink.every((b) => b.y <= b.r + 1e-4) && w.t > 0.4;
    case "throw":
      return w.ink.every((b) => b.y <= b.r + 1e-4) && w.t > 0.5;
    case "circle":
      return w.cut && w.t > 1.65;
  }
}

export function bounds(s: SituationId): { x0: number; y0: number; x1: number; y1: number } {
  switch (s) {
    case "puck":
      return { x0: 0.2, y0: 0.7, x1: 7.6, y1: 4.2 };
    case "fall":
      return { x0: 0.4, y0: -0.15, x1: 5.6, y1: 12.4 };
    case "throw":
      return { x0: 0.1, y0: -0.2, x1: 10.2, y1: 8.2 };
    case "circle":
      return { x0: -2.7, y0: -2.5, x1: 3.4, y1: 2.7 };
  }
}

/** Advance a world to a finished state without animation. */
export function runToEnd(w: World, model: ModelId): World {
  let cur = w;
  for (let i = 0; i < 120 * 6; i++) {
    cur = step(cur, DT, model, false);
    if (settled(cur, false)) break;
  }
  return cur;
}
