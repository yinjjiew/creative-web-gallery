/**
 * Trapeze — simulation.
 *
 * No DOM, no rendering, no audio. Everything here is a pure function of state
 * plus a fixed timestep, so the whole game is deterministic and frame-rate
 * independent: the renderer may run at 30fps or 144fps and the physics does not
 * change. That matters more than usual, because the entire skill of the game is
 * learning to predict where a release will put you, and a simulation that
 * varies with the display would make that prediction unlearnable.
 *
 * Units are metres, seconds, radians. y points DOWN, so the rig line is y = 0
 * and the net is at y = NET_Y. An angle theta is measured from straight-down and
 * a point at radius r sits at pivot + r * (sin theta, cos theta); a positive
 * theta is forward, towards +x, which is the direction of travel.
 */

export const G = 9.81;
/** 240 Hz. Small enough that semi-implicit Euler is accurate for a pendulum. */
export const DT = 1 / 240;

export const NET_Y = 8.7;
export const FLOOR_Y = 10.1;

/* ── rig geometry ─────────────────────────────────────────────────────────── */

/** Pivot to fly bar. */
export const BAR_CABLE = 2.9;
/** Pivot to the centre of mass of a flyer hanging off the fly bar. */
export const BAR_HANG_R = 3.9;
/** Pivot to the catch bar. */
export const CATCH_CABLE = 2.95;
/** Pivot to the catcher's hands (hanging by the knees, arms extended). */
export const CATCHER_HAND_R = 4.62;
/** Where an incoming flyer's centre of mass has to arrive to be caught. */
export const CATCHER_CATCH_R = 5.02;
/** Pivot to the flyer's centre of mass once the catcher has them. */
export const CATCHER_HANG_R = 5.62;
/** Effective pendulum length of the catcher alone, and carrying a flyer. */
const CATCHER_FREE_L = 3.7;
const CATCHER_CARRY_L = 4.55;

/** Cable stretch per unit of tension. Reads as weight at the bottom. */
const K_STRETCH = 0.0052;

const M_FLYER = 1;
const M_BAR = 0.16;
const M_CATCHER = 1.3;

const DAMP = 0.045;
const PUMP = 1.95;

/** Seconds a tucked somersault takes to come round once. */
export const TUCK_REV = 0.36;
/** Moment-of-inertia ratio between an open body and a tight tuck. */
const TUCK_RATIO = 3.4;

/** Where the flyer stands before the first swing. */
export const START_AMP = 1.06;

/* ── small maths ──────────────────────────────────────────────────────────── */

export interface Vec2 {
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** mulberry32 — tiny, fast, and good enough to make a run reproducible. */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;

/* ── swings ───────────────────────────────────────────────────────────────── */

export type Kind = "bar" | "catcher";

export interface Swing {
  id: number;
  kind: Kind;
  /** Pivot x. Every pivot hangs from the same rig line at y = 0. */
  px: number;
  theta: number;
  omega: number;
  /** Amplitude the occupant pumps towards. Unoccupied swings just coast. */
  amp: number;
  carrying: boolean;
  /** Set once the flyer has left, so an empty bar can be drawn differently. */
  used: boolean;
}

export function swingL(s: Swing) {
  if (s.kind === "bar") return s.carrying ? BAR_HANG_R : BAR_CABLE;
  return s.carrying ? CATCHER_CARRY_L : CATCHER_FREE_L;
}

/** Amplitude implied by the current state, from energy. */
export function amplitudeOf(theta: number, omega: number, L: number) {
  const e = 0.5 * (L * omega) ** 2 + G * L * (1 - Math.cos(theta));
  return Math.acos(clamp(1 - e / (G * L), -1, 1));
}

/** Specific tension in the cables, which is what a rig creaks about. */
export function tensionOf(s: Swing) {
  const L = swingL(s);
  return Math.max(0, L * s.omega * s.omega + G * Math.cos(s.theta));
}

export function stretchOf(s: Swing) {
  return tensionOf(s) * K_STRETCH;
}

export function stepSwing(s: Swing, dt: number) {
  const L = swingL(s);
  let alpha = -(G / L) * Math.sin(s.theta);
  if (s.carrying) {
    // A real flyer beats the swing to hold its height; an unoccupied bar cannot,
    // so only occupied swings are damped and pumped. Keeping free swings purely
    // conservative also makes them exactly reversible, which the planner needs.
    alpha -= DAMP * s.omega;
    const err = clamp(s.amp - amplitudeOf(s.theta, s.omega, L), -0.6, 0.6);
    alpha += PUMP * err * Math.tanh(s.omega * 2.5);
  }
  s.omega += alpha * dt;
  s.theta += s.omega * dt;
}

/** Reverse of stepSwing for a conservative (unoccupied) swing. */
function stepSwingBack(s: Swing, dt: number) {
  const L = swingL(s);
  s.theta -= s.omega * dt;
  s.omega -= -(G / L) * Math.sin(s.theta) * dt;
}

/** Radius at which an occupant's centre of mass rides. */
export function hangR(s: Swing) {
  return s.kind === "bar"
    ? BAR_HANG_R + stretchOf(s) * 1.3
    : CATCHER_HANG_R + stretchOf(s) * 1.5;
}

/** Radius an incoming flyer's centre of mass must reach to be captured. */
export function catchR(s: Swing) {
  return s.kind === "bar"
    ? BAR_HANG_R + stretchOf(s) * 1.3
    : CATCHER_CATCH_R + stretchOf(s);
}

export function pointAt(s: Swing, r: number): Vec2 {
  return { x: s.px + r * Math.sin(s.theta), y: r * Math.cos(s.theta) };
}

export function barPos(s: Swing): Vec2 {
  return pointAt(s, BAR_CABLE + stretchOf(s));
}

export function catcherHands(s: Swing): Vec2 {
  return pointAt(s, CATCHER_HAND_R + stretchOf(s));
}

export function catchPoint(s: Swing): Vec2 {
  return pointAt(s, catchR(s));
}

export function hangPos(s: Swing): Vec2 {
  return pointAt(s, hangR(s));
}

/** Velocity of a point rigidly attached at radius r. */
function pointVel(s: Swing, r: number): Vec2 {
  return {
    x: r * s.omega * Math.cos(s.theta),
    y: -r * s.omega * Math.sin(s.theta),
  };
}

export function moment(s: Swing) {
  return s.kind === "bar"
    ? M_BAR * BAR_CABLE * BAR_CABLE
    : M_CATCHER * CATCHER_FREE_L * CATCHER_FREE_L;
}

/* ── the flyer ────────────────────────────────────────────────────────────── */

export interface Flyer {
  pos: Vec2;
  prev: Vec2;
  vel: Vec2;
  /** Body rotation. 0 presents the hands to the catcher. */
  body: number;
  bodyOmega: number;
  tucked: boolean;
  /** Somersaults completed since release. */
  turns: number;
  /** Seconds since the hands left, for settling the body out of the release. */
  air: number;
  /** Body orientation at the instant of release, to straighten out of. */
  relAngle: number;
  /** Fraction of the pumping cycle, for the beat of the legs while swinging. */
  beat: number;
}

/* ── difficulty ───────────────────────────────────────────────────────────── */

export interface PassCfg {
  index: number;
  /** true: leaving a bar for a catcher. false: the return, catcher to bar. */
  toCatcher: boolean;
  catchRadius: number;
  maxRelVel: number;
  wantGap: number;
  gripTime: number;
  /** Somersaults that must be completed before the catch. */
  turns: number;
  relFracLo: number;
  relFracHi: number;
  postApexLo: number;
  postApexHi: number;
  /** Earliest nominal release, which is also the player's reading time. */
  minT: number;
}

const IDEAS: Record<number, string> = {
  0: "press to let go",
  1: "and to let go of the catcher",
  3: "the catcher keeps his own time",
  8: "the gap opens",
  10: "one somersault. press again to open out",
  16: "two somersaults",
};

export function ideaFor(index: number) {
  return IDEAS[index] ?? null;
}

export function passCfg(index: number, rng: Rng): PassCfg {
  const toCatcher = index % 2 === 0;
  const d = Math.min(1, index / 15);
  const ease = d * d * (3 - 2 * d);
  const jitter = index < 3 ? 0 : Math.min(1, (index - 2) / 8);
  // Past the scripted curve it keeps closing, slowly, forever.
  const beyond = Math.pow(0.982, Math.max(0, index - 15));

  const turns = index >= 10 && toCatcher ? (index >= 16 ? 2 : 1) : 0;

  return {
    index,
    toCatcher,
    catchRadius:
      (toCatcher ? lerp(1.22, 0.62, ease) : lerp(1.05, 0.58, ease)) * beyond,
    // A somersault arrives falling fast, and a catcher genuinely absorbs that,
    // so the velocity gate opens as the rotations are added.
    maxRelVel:
      (toCatcher ? lerp(13, 8.5, ease) * (1 + 0.3 * turns) : lerp(4.6, 2.8, ease)) *
      beyond,
    wantGap: (toCatcher ? 7.6 : 7.2) + lerp(0, 3.2, ease) + rng() * 0.7 * jitter,
    gripTime: toCatcher ? lerp(11, 8, ease) : lerp(13, 10, ease),
    turns,
    relFracLo: toCatcher ? lerp(0.72, 0.42, jitter) : lerp(0.78, 0.58, jitter),
    relFracHi: toCatcher ? lerp(0.9, 0.98, jitter) : lerp(0.94, 0.99, jitter),
    postApexLo: lerp(-0.02, -0.14, jitter),
    postApexHi: lerp(0.12, 0.56, jitter),
    // Somersaults need a bigger swing, so the flyer takes an extra beat to
    // build one — which is also exactly what happens on a real rig.
    minT: toCatcher ? (index === 0 ? 0.95 : turns > 0 ? 3.1 : 1.4) : 2.7,
  };
}

/* ── planner ──────────────────────────────────────────────────────────────── */

/**
 * Placing the next station is a physics problem, not a level-design one.
 *
 * The planner simulates the swing the player is actually on, picks a nominal
 * release moment, follows the resulting parabola, and then puts the next rig
 * exactly where it has to be for that parabola to arrive in the catcher's hands
 * — solving for the catcher's own amplitude and phase so their hands are there
 * at that instant. Every pass is therefore guaranteed to have a real solution
 * that follows from the swing the player built, and difficulty can be tuned
 * where it belongs: how wide the catch is, how far the gap is, and how much the
 * required moment moves around from pass to pass.
 */

const TRACK_S = 15;
const TRACK_N = Math.round(TRACK_S / DT);

export interface Track {
  /** theta, omega, x, y, vx, vy per step, for the swing being held. */
  hold: Float64Array;
  /** theta, omega per step, for the target. */
  target: Float64Array;
  n: number;
  releaseIdx: number;
  /**
   * Release steps that actually lead to a catch. Computed once per pass while
   * the hitstop is running, so it costs the player nothing, and it is what
   * guarantees a pass is never impossible — if the window came out too narrow
   * the planner would rather widen the catch than ship an unfair pass.
   */
  hits: number[];
  stride: number;
}

function recordHold(s0: Swing): Float64Array {
  const s = { ...s0 };
  const out = new Float64Array(TRACK_N * 6);
  let prev = hangPos(s);
  for (let i = 0; i < TRACK_N; i++) {
    const p = hangPos(s);
    out[i * 6] = s.theta;
    out[i * 6 + 1] = s.omega;
    out[i * 6 + 2] = p.x;
    out[i * 6 + 3] = p.y;
    out[i * 6 + 4] = (p.x - prev.x) / DT;
    out[i * 6 + 5] = (p.y - prev.y) / DT;
    prev = p;
    stepSwing(s, DT);
  }
  // The first sample has no previous position to difference against.
  out[4] = out[10];
  out[5] = out[11];
  return out;
}

function recordTarget(s0: Swing): Float64Array {
  const s = { ...s0 };
  const out = new Float64Array(TRACK_N * 2);
  for (let i = 0; i < TRACK_N; i++) {
    out[i * 2] = s.theta;
    out[i * 2 + 1] = s.omega;
    stepSwing(s, DT);
  }
  return out;
}

/** Index of the release nominated by relFrac, or -1. */
function nominalRelease(hold: Float64Array, minT: number, relFrac: number) {
  const from = Math.round(minT / DT);
  let peak = -1;
  for (let i = from + 1; i < TRACK_N; i++) {
    if (hold[i * 6 + 1] <= 0 && hold[(i - 1) * 6 + 1] > 0) {
      peak = i;
      break;
    }
  }
  if (peak < 0) return -1;
  const want = relFrac * hold[peak * 6];
  for (let i = peak; i > 0; i--) {
    if (hold[i * 6] <= want) return i;
  }
  return -1;
}

interface Candidate {
  releaseIdx: number;
  pivotX: number;
  phi: number;
  omega: number;
  amp: number;
  gap: number;
  relVel: number;
}

function solveCandidate(
  hold: Float64Array,
  holdPx: number,
  cfg: PassCfg,
  kind: Kind,
  relFrac: number,
  postApex: number
): Candidate | null {
  const ri = nominalRelease(hold, cfg.minT, relFrac);
  if (ri < 0) return null;

  let px = hold[ri * 6 + 2];
  let py = hold[ri * 6 + 3];
  const vx = hold[ri * 6 + 4];
  let vy = hold[ri * 6 + 5];
  if (vx < 0.4) return null;

  // Apex, then the designed moment relative to it.
  const tApex = vy < 0 ? -vy / G : 0;
  const tc = Math.max(tApex + postApex, cfg.turns * TUCK_REV + 0.22);
  if (tc <= 0.06 || tc > 2.4) return null;

  const steps = Math.round(tc / DT);
  for (let i = 0; i < steps; i++) {
    vy += G * DT;
    px += vx * DT;
    py += vy * DT;
  }
  if (py > NET_Y - 0.9) return null;

  // The catch happens at height py, so the target's angle is forced.
  const nominalR = kind === "bar" ? BAR_HANG_R : CATCHER_CATCH_R;
  const ratio = py / nominalR;
  if (ratio > 0.94 || ratio < 0.12) return null;
  const phi = -Math.acos(ratio);
  // Meeting a target at the very bottom of its arc looks like an accident and
  // reads as no swing at all, so insist the catch happens off the bottom.
  if (phi > -0.4) return null;

  const tang = { x: Math.cos(phi), y: -Math.sin(phi) };
  const vTang = vx * tang.x + vy * tang.y;

  let omega: number;
  if (kind === "bar") {
    // A bar has to be met at its own speed, so match the tangential component.
    omega = vTang / nominalR;
    if (omega < 0.15) return null;
  } else {
    // A catcher sweeps back to meet the flyer, arriving near his own extreme.
    omega = (-Math.abs(vTang) * 0.72) / nominalR;
    if (omega > -0.06) omega = -0.06;
  }

  const L = kind === "bar" ? BAR_CABLE : CATCHER_FREE_L;
  const cosAmp = Math.cos(phi) - (omega * omega * L) / (2 * G);
  if (cosAmp < 0.24) return null;
  const amp = Math.acos(clamp(cosAmp, -1, 1));
  if (amp > 1.32 || amp < Math.abs(phi) + 0.01) return null;
  if (kind === "catcher" && amp < 0.62) return null;

  const pivotX = px - nominalR * Math.sin(phi);
  const gap = pivotX - holdPx;
  if (gap < 3.6 || gap > 13) return null;
  const tv = {
    x: nominalR * omega * Math.cos(phi),
    y: -nominalR * omega * Math.sin(phi),
  };
  const relVel = Math.hypot(vx - tv.x, vy - tv.y);

  return { releaseIdx: ri, pivotX, phi, omega, amp, gap, relVel };
}

/** Wind a conservative swing backwards so it arrives at (phi, omega) at step n. */
function backSolve(target: Swing, phi: number, omega: number, steps: number) {
  target.theta = phi;
  target.omega = omega;
  for (let i = 0; i < steps; i++) stepSwingBack(target, DT);
}

function scanWindow(
  hold: Float64Array,
  targetTrack: Float64Array,
  target: Swing,
  cfg: PassCfg,
  gripSteps: number,
  stride: number
): number[] {
  const probe: Swing = { ...target };
  const hits: number[] = [];
  const limit = Math.min(gripSteps, TRACK_N - 600);

  for (let ri = 0; ri < limit; ri += stride) {
    let px = hold[ri * 6 + 2];
    let py = hold[ri * 6 + 3];
    const vx = hold[ri * 6 + 4];
    let vy = hold[ri * 6 + 5];
    if (vx < 0.2) continue;
    let hit = false;
    const airFloor = cfg.turns * TUCK_REV + 0.16;
    for (let k = 1; k < 560 && ri + k < TRACK_N; k++) {
      vy += G * DT;
      px += vx * DT;
      py += vy * DT;
      if (py > NET_Y - 0.4) break;
      const j = ri + k;
      probe.theta = targetTrack[j * 2];
      probe.omega = targetTrack[j * 2 + 1];
      const cp = catchPoint(probe);
      const d = Math.hypot(px - cp.x, py - cp.y);
      if (d > cfg.catchRadius) continue;
      // A pass that demands somersaults also has to give the air time to turn
      // them in, or the button would be asked something impossible.
      if (k * DT < airFloor) continue;
      const cv = pointVel(probe, catchR(probe));
      if (Math.hypot(vx - cv.x, vy - cv.y) > cfg.maxRelVel) continue;
      hit = true;
      break;
    }
    if (hit) hits.push(ri);
  }
  return hits;
}

/** Widest run of consecutive successful release steps, in seconds. */
export function widestWindow(track: Track) {
  let best = 0;
  let run = 0;
  for (let i = 0; i < track.hits.length; i++) {
    run =
      i > 0 && track.hits[i] - track.hits[i - 1] === track.stride ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best * track.stride * DT;
}

export interface PlanResult {
  target: Swing;
  track: Track;
}

export function planPass(
  holdSwing: Swing,
  cfg: PassCfg,
  nextId: number,
  rng: Rng
): PlanResult {
  const kind: Kind = cfg.toCatcher ? "catcher" : "bar";
  const hold = recordHold(holdSwing);

  let best: Candidate | null = null;
  let bestCost = Infinity;
  for (let i = 0; i < 30; i++) {
    const relFrac = lerp(cfg.relFracLo, cfg.relFracHi, rng());
    const postApex = lerp(cfg.postApexLo, cfg.postApexHi, rng());
    const c = solveCandidate(hold, holdSwing.px, cfg, kind, relFrac, postApex);
    if (!c) continue;
    const cost =
      Math.abs(c.gap - cfg.wantGap) +
      Math.max(0, c.relVel - cfg.maxRelVel * 0.62) * 1.4;
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }

  // Fall back to the textbook release if sampling found nothing, which can only
  // happen if the player arrived with a very strange swing.
  if (!best) {
    for (const rf of [0.85, 0.7, 0.95, 0.55, 0.4]) {
      const c = solveCandidate(hold, holdSwing.px, cfg, kind, rf, 0.06);
      if (c) {
        best = c;
        break;
      }
    }
  }
  if (!best) {
    best = {
      releaseIdx: Math.round(cfg.minT / DT),
      pivotX: holdSwing.px + cfg.wantGap,
      phi: -0.7,
      omega: kind === "bar" ? 0.8 : -0.3,
      amp: 0.95,
      gap: cfg.wantGap,
      relVel: 0,
    };
  }

  const target: Swing = {
    id: nextId,
    kind,
    px: best.pivotX,
    theta: 0,
    omega: 0,
    amp: best.amp,
    carrying: false,
    used: false,
  };
  backSolve(target, best.phi, best.omega, best.releaseIdx + 1);

  const targetTrack = recordTarget(target);
  const stride = 8;
  const gripSteps = Math.round(cfg.gripTime / DT);
  let hits = scanWindow(hold, targetTrack, target, cfg, gripSteps, stride);

  // A pass whose window is under ~80 ms is not a test of timing, it is a lottery.
  // Rather than reject the geometry, open the catch until the window is humane.
  let guard = 0;
  while (hits.length < 3 && guard < 6) {
    cfg.catchRadius *= 1.18;
    cfg.maxRelVel *= 1.12;
    hits = scanWindow(hold, targetTrack, target, cfg, gripSteps, stride);
    guard++;
  }

  return {
    target,
    track: {
      hold,
      target: targetTrack,
      n: TRACK_N,
      releaseIdx: best.releaseIdx,
      hits,
      stride,
    },
  };
}

/* ── game ─────────────────────────────────────────────────────────────────── */

export type Phase = "board" | "hold" | "flight" | "falling" | "over";

export type GameEvent =
  | { type: "hup" }
  | { type: "release"; speed: number; x: number; y: number; vx: number; vy: number }
  | {
      type: "catch";
      quality: number;
      kind: Kind;
      relVel: number;
      x: number;
      y: number;
    }
  | { type: "open"; turns: number }
  | { type: "miss"; x: number; y: number }
  | { type: "land"; speed: number; x: number }
  | { type: "bottom"; tension: number; kind: Kind; carrying: boolean; x: number }
  | { type: "slip" }
  | { type: "restart" }
  | { type: "idea"; text: string };

export interface Best {
  score: number;
  passes: number;
}

export interface Game {
  seed: number;
  rng: Rng;
  phase: Phase;
  t: number;
  /** Leftover time between fixed steps. */
  acc: number;
  started: boolean;
  swings: Swing[];
  holdId: number;
  targetId: number;
  nextId: number;
  flyer: Flyer;
  grip: number;
  gripMax: number;
  passIndex: number;
  passes: number;
  score: number;
  streak: number;
  hitstop: number;
  shake: number;
  fallT: number;
  overT: number;
  cfg: PassCfg;
  track: Track | null;
  /** Closest approach so far on this flight, pending a catch. */
  near: { live: boolean; dist: number; relVel: number };
  events: GameEvent[];
  banner: { text: string; t: number } | null;
  rating: { label: string; quality: number; t: number } | null;
  best: Best;
  newBest: boolean;
  reduced: boolean;
  /** Only the first two passes get a predicted arc. It teaches, then leaves. */
  showArc: boolean;
}

function swingById(g: Game, id: number) {
  return g.swings.find((s) => s.id === id);
}

export function holdSwing(g: Game) {
  return swingById(g, g.holdId);
}

export function targetSwing(g: Game) {
  return swingById(g, g.targetId);
}

function makeFlyer(): Flyer {
  return {
    pos: { x: 0, y: 0 },
    prev: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    body: 0,
    bodyOmega: 0,
    tucked: false,
    turns: 0,
    air: 0,
    relAngle: 0,
    beat: 0,
  };
}

export function newGame(best: Best, reduced: boolean, seed = Date.now()): Game {
  const rng = makeRng(seed);
  const bar: Swing = {
    id: 0,
    kind: "bar",
    px: 0,
    theta: -START_AMP,
    omega: 0,
    amp: START_AMP,
    carrying: true,
    used: false,
  };
  const g: Game = {
    seed,
    rng,
    phase: "board",
    t: 0,
    acc: 0,
    started: false,
    swings: [bar],
    holdId: 0,
    targetId: -1,
    nextId: 1,
    flyer: makeFlyer(),
    grip: 1,
    gripMax: 11,
    passIndex: 0,
    passes: 0,
    score: 0,
    streak: 0,
    hitstop: 0,
    shake: 0,
    fallT: 0,
    overT: 0,
    cfg: passCfg(0, rng),
    track: null,
    near: { live: false, dist: Infinity, relVel: 0 },
    events: [],
    banner: null,
    rating: null,
    best,
    newBest: false,
    reduced,
    showArc: true,
  };
  const p = hangPos(bar);
  g.flyer.pos = { ...p };
  g.flyer.prev = { ...p };
  return g;
}

/** Reset in place so a retry costs nothing. */
export function restart(g: Game) {
  const fresh = newGame(g.best, g.reduced, (g.seed * 1664525 + 1013904223) >>> 0);
  fresh.started = true;
  fresh.events = g.events;
  Object.assign(g, fresh);
  g.events.push({ type: "restart" });
  hup(g);
}

function beginPass(g: Game) {
  const hold = holdSwing(g);
  if (!hold) return;
  g.cfg = passCfg(g.passIndex, g.rng);
  g.gripMax = g.cfg.gripTime;
  g.grip = 1;
  const plan = planPass(hold, g.cfg, g.nextId, g.rng);
  g.nextId++;
  g.swings.push(plan.target);
  g.targetId = plan.target.id;
  g.track = plan.track;
  g.showArc = g.passIndex < 2;

  const idea = ideaFor(g.passIndex);
  if (idea) {
    g.banner = { text: idea, t: 0 };
    g.events.push({ type: "idea", text: idea });
  }

  // Keep the world small. Two stations behind the flyer is plenty of scenery.
  while (g.swings.length > 4) g.swings.shift();
}

function hup(g: Game) {
  const hold = holdSwing(g);
  if (!hold) return;
  g.phase = "hold";
  g.events.push({ type: "hup" });
  beginPass(g);
}

/* ── the one button ───────────────────────────────────────────────────────── */

export function press(g: Game) {
  switch (g.phase) {
    case "board": {
      g.started = true;
      hup(g);
      return;
    }
    case "hold":
      release(g);
      return;
    case "flight":
      if (g.flyer.tucked) openOut(g);
      return;
    case "falling":
      if (g.fallT > 0.4) restart(g);
      return;
    case "over":
      restart(g);
      return;
  }
}

function release(g: Game) {
  const hold = holdSwing(g);
  if (!hold) return;
  const f = g.flyer;
  f.vel = {
    x: (f.pos.x - f.prev.x) / DT,
    y: (f.pos.y - f.prev.y) / DT,
  };
  const speed = Math.hypot(f.vel.x, f.vel.y);

  hold.carrying = false;
  hold.used = true;
  g.phase = "flight";
  g.near = { live: false, dist: Infinity, relVel: 0 };
  f.turns = 0;
  f.body = 0;
  f.air = 0;
  // The body leaves aligned with the cable and straightens out of it.
  f.relAngle = -hold.theta;
  const dir = Math.sign(hold.omega || 1);
  if (g.cfg.turns > 0) {
    // The flyer throws the somersault and tucks: the swing supplies the
    // direction, the kick and the tuck supply the rate.
    f.tucked = true;
    f.bodyOmega = (dir * 2 * Math.PI) / TUCK_REV;
  } else {
    f.tucked = false;
    f.bodyOmega = dir * Math.abs(hold.omega) * 0.5;
  }
  g.events.push({
    type: "release",
    speed,
    x: f.pos.x,
    y: f.pos.y,
    vx: f.vel.x,
    vy: f.vel.y,
  });
}

function openOut(g: Game) {
  const f = g.flyer;
  if (!f.tucked) return;
  f.tucked = false;
  f.bodyOmega /= TUCK_RATIO;
  g.events.push({ type: "open", turns: f.turns });
}

/* ── stepping ─────────────────────────────────────────────────────────────── */

function ratingFor(q: number) {
  if (q > 0.74) return "clean";
  if (q > 0.42) return "safe";
  return "scraped";
}

function doCatch(g: Game, target: Swing, dist: number, relVel: number) {
  const cfg = g.cfg;
  const dq = 1 - dist / cfg.catchRadius;
  const vq = 1 - relVel / cfg.maxRelVel;
  const quality = clamp(Math.min(dq, vq) * 0.62 + dq * 0.38, 0, 1);
  const f = g.flyer;

  // Angular momentum about the target's pivot. A fast flyer speeds the swing up,
  // a weak one drags it down, so the quality of one pass is felt in the next.
  const r = catchR(target);
  const tang = { x: Math.cos(target.theta), y: -Math.sin(target.theta) };
  const vt = f.vel.x * tang.x + f.vel.y * tang.y;
  const I = moment(target);
  target.omega = (I * target.omega + M_FLYER * r * vt) / (I + M_FLYER * r * r);
  target.carrying = true;
  target.amp =
    target.kind === "bar"
      ? Math.max(1.08, amplitudeOf(target.theta, target.omega, BAR_HANG_R))
      : Math.max(1.06, amplitudeOf(target.theta, target.omega, CATCHER_CARRY_L));

  const mult = 1 + 0.15 * Math.min(6, g.streak);
  const points = Math.round(
    (40 + 170 * quality) * (1 + 0.12 * cfg.index) * mult
  );
  g.score += points;
  g.streak = quality > 0.74 ? g.streak + 1 : 0;
  g.passes++;
  g.rating = { label: ratingFor(quality), quality, t: 0 };

  g.holdId = target.id;
  g.targetId = -1;
  g.phase = "hold";
  g.hitstop = g.reduced ? 0.05 : 0.075 + 0.05 * quality;
  g.shake = g.reduced ? 0 : 0.35 + 0.75 * quality;
  f.tucked = false;
  f.bodyOmega = 0;
  f.body = 0;

  g.events.push({
    type: "catch",
    quality,
    kind: target.kind,
    relVel,
    x: f.pos.x,
    y: f.pos.y,
  });

  if (g.score > g.best.score) {
    g.best = { score: g.score, passes: g.passes };
    g.newBest = true;
  }

  g.passIndex++;
  beginPass(g);
}

function miss(g: Game) {
  const f = g.flyer;
  g.phase = "falling";
  g.fallT = 0;
  g.streak = 0;
  f.tucked = false;
  f.bodyOmega = clamp(f.bodyOmega * 0.5, -3, 3);
  g.events.push({ type: "miss", x: f.pos.x, y: f.pos.y });
}

function fixedStep(g: Game) {
  const dt = DT;
  g.t += dt;

  const prevThetas = new Map<number, number>();
  for (const s of g.swings) prevThetas.set(s.id, s.theta);

  for (const s of g.swings) {
    if (g.phase === "board" && s.id === g.holdId) continue;
    stepSwing(s, dt);
  }
  for (const s of g.swings) {
    const before = prevThetas.get(s.id) ?? 0;
    if (before < 0 && s.theta >= 0) {
      g.events.push({
        type: "bottom",
        tension: tensionOf(s),
        kind: s.kind,
        carrying: s.carrying,
        x: s.px,
      });
    }
  }

  const f = g.flyer;

  if (g.phase === "board") {
    const hold = holdSwing(g);
    if (hold) {
      const p = hangPos(hold);
      f.prev = { ...f.pos };
      f.pos = p;
    }
    return;
  }

  if (g.phase === "hold") {
    const hold = holdSwing(g);
    if (!hold) return;
    const p = hangPos(hold);
    f.prev = { ...f.pos };
    f.pos = p;
    f.beat = Math.sin(hold.theta * 1.6) * 0.5 + 0.5;
    g.grip -= dt / g.gripMax;
    if (g.grip <= 0) {
      g.grip = 0;
      g.events.push({ type: "slip" });
      f.vel = {
        x: (f.pos.x - f.prev.x) / dt,
        y: (f.pos.y - f.prev.y) / dt,
      };
      hold.carrying = false;
      hold.used = true;
      miss(g);
    }
    return;
  }

  if (g.phase === "flight") {
    f.prev = { ...f.pos };
    f.vel.y += G * dt;
    f.pos = { x: f.pos.x + f.vel.x * dt, y: f.pos.y + f.vel.y * dt };
    f.air += dt;
    f.body += f.bodyOmega * dt;
    f.turns += (Math.abs(f.bodyOmega) * dt) / (Math.PI * 2);

    const target = targetSwing(g);
    if (target) {
      const cp = catchPoint(target);
      const dist = Math.hypot(f.pos.x - cp.x, f.pos.y - cp.y);
      const cv = pointVel(target, catchR(target));
      const relVel = Math.hypot(f.vel.x - cv.x, f.vel.y - cv.y);
      const eligible =
        dist <= g.cfg.catchRadius &&
        relVel <= g.cfg.maxRelVel &&
        (g.cfg.turns === 0 ||
          (!f.tucked &&
            f.turns >= g.cfg.turns - 0.3 &&
            Math.abs(Math.atan2(Math.sin(f.body), Math.cos(f.body))) < 1.15));

      // Hands close at the closest approach, not at the moment the flyer first
      // enters reach — otherwise every catch would be scored as a fingertip
      // grab and there would be no such thing as a clean one.
      if (eligible && dist < g.near.dist) {
        g.near.dist = dist;
        g.near.relVel = relVel;
        g.near.live = true;
      } else if (g.near.live) {
        doCatch(g, target, g.near.dist, g.near.relVel);
        return;
      }

      // Once the flyer is past the catcher and below him there is no recovery.
      if (f.pos.x > target.px + 2.2 && f.pos.y > catchR(target) + 0.6) {
        miss(g);
        return;
      }
    }
    if (f.pos.y > NET_Y - 0.55) miss(g);
    return;
  }

  if (g.phase === "falling") {
    g.fallT += dt;
    f.prev = { ...f.pos };
    f.vel.y += G * dt;
    f.vel.x *= 1 - 0.7 * dt;
    f.pos = { x: f.pos.x + f.vel.x * dt, y: f.pos.y + f.vel.y * dt };
    f.body += f.bodyOmega * dt;
    f.bodyOmega *= 1 - 1.4 * dt;
    if (f.pos.y >= NET_Y) {
      const speed = Math.abs(f.vel.y);
      f.pos.y = NET_Y;
      // The net takes the fall: one soft rebound, then done.
      if (speed > 1.2) {
        f.vel.y = -speed * 0.34;
        f.vel.x *= 0.7;
        g.events.push({ type: "land", speed, x: f.pos.x });
        g.shake = g.reduced ? 0 : Math.min(1.4, speed * 0.14);
      } else {
        f.vel = { x: 0, y: 0 };
        g.phase = "over";
        g.overT = 0;
      }
    }
    if (g.fallT > 2.6) {
      g.phase = "over";
      g.overT = 0;
    }
    return;
  }

  if (g.phase === "over") {
    g.overT += dt;
    f.prev = { ...f.pos };
  }
}

/**
 * Advance the world. The accumulator is the whole reason the game is fair: the
 * simulation only ever moves in DT slices, whatever the display is doing.
 */
export function advance(g: Game, frameDt: number) {
  // The remainder is kept, not thrown away: discarding it would quietly run the
  // simulation slow, by an amount that depends on the refresh rate.
  g.acc = Math.min(g.acc + frameDt, 0.3);
  if (g.banner) g.banner.t += frameDt;
  if (g.rating) g.rating.t += frameDt;
  g.shake = Math.max(0, g.shake - frameDt * 4.2);

  while (g.acc >= DT) {
    g.acc -= DT;
    if (g.hitstop > 0) {
      g.hitstop -= DT;
      continue;
    }
    fixedStep(g);
  }
}

/** The arc a release right now would produce. Teaching aid for the first passes. */
export function predictArc(g: Game, out: Vec2[], seconds = 1.5) {
  out.length = 0;
  const f = g.flyer;
  const vx = (f.pos.x - f.prev.x) / DT;
  let vy = (f.pos.y - f.prev.y) / DT;
  let x = f.pos.x;
  let y = f.pos.y;
  const step = DT * 4;
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) {
    vy += G * step;
    x += vx * step;
    y += vy * step;
    if (y > NET_Y) break;
    out.push({ x, y });
  }
  return out;
}
