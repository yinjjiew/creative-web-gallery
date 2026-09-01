/**
 * Slalom — simulation.
 *
 * No DOM, no drawing, no audio. A skier is a point with a heading and an edge.
 * Gravity pulls down the fall line; carving turns you across it; a skidded
 * edge dumps speed. That is the whole relationship between risk and line.
 *
 * Units are metres, seconds, radians. +y is downhill. A heading of 0 is
 * straight down the fall line; positive heading is a turn to the right.
 *
 * The stepper is a closed function of (state, steer). The same steer stream
 * always produces the same positions, which is what makes a ghost a rival
 * rather than a sketch.
 */

export const DT = 1 / 60;
export const MAX_TICKS = 90 * 60;
export const PISTE_HALF = 6.6;
export const FINISH_Y = 312;
export const START_Y = 0;
/** Two seconds a pole. Official time is the tape plus this. */
export const MISS_PENALTY = 120;

export type Steer = -1 | 0 | 1;

export interface Gate {
  y: number;
  poleX: number;
  /** +1: must pass to the right of the pole. −1: to the left. */
  pass: 1 | -1;
  hue: "red" | "blue";
}

export interface Tree {
  x: number;
  y: number;
  h: number;
}

export interface Skier {
  x: number;
  y: number;
  heading: number;
  speed: number;
  lean: number;
  px: number;
  py: number;
  pHeading: number;
  pLean: number;
}

export interface Run {
  skier: Skier;
  tick: number;
  nextGate: number;
  misses: number;
  clips: number;
  finished: boolean;
  dnf: boolean;
  gateTicks: number[];
  /** Set when a gate is crossed this tick: gate index, or -1 − index on a miss. */
  justGate: number | null;
  justClip: boolean;
}

export const GATES: Gate[] = [
  // Open first turns — teach the weave. Pole sits inside; you go around it.
  { y: 24, poleX: 1.7, pass: 1, hue: "red" },
  { y: 42, poleX: -1.6, pass: -1, hue: "blue" },
  { y: 60, poleX: 1.9, pass: 1, hue: "red" },
  { y: 78, poleX: -2.0, pass: -1, hue: "blue" },
  // Flush — short, vertical, little time to stand up.
  { y: 94, poleX: 1.35, pass: 1, hue: "red" },
  { y: 105, poleX: -1.3, pass: -1, hue: "blue" },
  { y: 116, poleX: 1.35, pass: 1, hue: "red" },
  // Recover, then a delay that pulls you to the rope.
  { y: 136, poleX: -2.4, pass: -1, hue: "blue" },
  { y: 156, poleX: 2.6, pass: 1, hue: "red" },
  { y: 178, poleX: -3.2, pass: -1, hue: "blue" },
  { y: 200, poleX: 3.1, pass: 1, hue: "red" },
  { y: 218, poleX: -1.8, pass: -1, hue: "blue" },
  // Hairpin pair.
  { y: 234, poleX: 2.8, pass: 1, hue: "red" },
  { y: 248, poleX: -2.8, pass: -1, hue: "blue" },
  // Tight finish.
  { y: 262, poleX: 1.6, pass: 1, hue: "red" },
  { y: 274, poleX: -1.5, pass: -1, hue: "blue" },
  { y: 286, poleX: 1.7, pass: 1, hue: "red" },
  { y: 298, poleX: -1.6, pass: -1, hue: "blue" },
];

/** mulberry32 — enough to plant the same pines every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TREES: Tree[] = (() => {
  const r = rng(1968);
  const out: Tree[] = [];
  for (let y = -18; y < FINISH_Y + 40; y += 3.4 + r() * 5.2) {
    const left = -(PISTE_HALF + 1.4 + r() * 9);
    const right = PISTE_HALF + 1.4 + r() * 9;
    out.push({ x: left, y, h: 3.2 + r() * 5.4 });
    out.push({ x: right, y: y + 1.6 + r() * 2, h: 3.0 + r() * 5.8 });
  }
  return out;
})();

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function freshSkier(): Skier {
  return {
    x: 0,
    y: START_Y,
    heading: 0,
    speed: 2.9,
    lean: 0,
    px: 0,
    py: START_Y,
    pHeading: 0,
    pLean: 0,
  };
}

export function freshRun(): Run {
  const skier = freshSkier();
  return {
    skier,
    tick: 0,
    nextGate: 0,
    misses: 0,
    clips: 0,
    finished: false,
    dnf: false,
    gateTicks: [],
    justGate: null,
    justClip: false,
  };
}

export function copyRun(src: Run): Run {
  return {
    skier: { ...src.skier },
    tick: src.tick,
    nextGate: src.nextGate,
    misses: src.misses,
    clips: src.clips,
    finished: src.finished,
    dnf: src.dnf,
    gateTicks: src.gateTicks.slice(),
    justGate: src.justGate,
    justClip: src.justClip,
  };
}

/**
 * One sixtieth of a second. Semi-implicit: lean, then heading, then speed,
 * then integrate. The constants were tuned against a clean 18-gate line —
 * a patient open carve should beat a panicked edge, and a tight flush
 * should cost speed you can feel.
 */
export function step(run: Run, steer: Steer): void {
  run.justGate = null;
  run.justClip = false;
  if (run.finished || run.dnf) return;

  const k = run.skier;
  k.px = k.x;
  k.py = k.y;
  k.pHeading = k.heading;
  k.pLean = k.lean;

  // Weight transfer. The ski is not a cursor: lean catches the input.
  const follow = 8.6;
  k.lean += (steer - k.lean) * (1 - Math.exp(-follow * DT));
  k.lean = clamp(k.lean, -1, 1);

  // Carve: more edge and more speed tighten the radius, until the tail lets go.
  const grip = 1 - 0.28 * Math.abs(k.lean) * clamp(k.speed / 16, 0, 1);
  const turn = k.lean * (2.55 + 0.055 * k.speed) * grip;
  k.heading = clamp(k.heading + turn * DT, -1.18, 1.18);

  const fall = Math.cos(k.heading);
  k.speed += 10.4 * fall * DT;
  k.speed -= 0.018 * k.speed * k.speed * DT;
  // Skid: the price of asking too much of an edge.
  k.speed -= 0.5 * k.lean * k.lean * k.speed * DT;
  // A clean moderate carve is the fast line — not a straight fall-line tuck.
  const clean = 1 - Math.abs(Math.abs(k.lean) - 0.55) / 0.55;
  if (clean > 0) k.speed += 0.42 * clean * DT;
  k.speed = clamp(k.speed, 1.35, 18.4);

  k.x += Math.sin(k.heading) * k.speed * DT;
  k.y += Math.cos(k.heading) * k.speed * DT;

  // Soft banks. Snow piles at the ropes; they push back and take speed.
  const bank = PISTE_HALF - 0.35;
  if (Math.abs(k.x) > bank) {
    const over = Math.abs(k.x) - bank;
    k.x -= Math.sign(k.x) * over * 2.8 * DT;
    k.heading -= Math.sign(k.x) * over * 1.6 * DT;
    k.speed *= 1 - Math.min(0.55, over * 1.8) * DT * 8;
  }

  while (run.nextGate < GATES.length && k.y >= GATES[run.nextGate].y) {
    const g = GATES[run.nextGate];
    const clear = (k.x - g.poleX) * g.pass > 0.18;
    const dist = Math.abs(k.x - g.poleX);
    if (dist < 0.38) {
      k.speed *= 0.72;
      k.heading *= 0.8;
      run.clips++;
      run.justClip = true;
    }
    if (clear) {
      run.justGate = run.nextGate;
    } else {
      run.misses++;
      run.justGate = -1 - run.nextGate;
    }
    run.gateTicks.push(run.tick);
    run.nextGate++;
  }

  if (k.y >= FINISH_Y) {
    run.finished = true;
    return;
  }

  run.tick++;
  if (run.tick >= MAX_TICKS) run.dnf = true;
}

/** Replay a recorded stream to the end. Used to print the ticket and splits. */
export function replay(steers: Steer[]): Run {
  const run = freshRun();
  for (let i = 0; i < steers.length; i++) {
    if (run.finished || run.dnf) break;
    step(run, steers[i]);
  }
  return run;
}

export function lerpSkier(k: Skier, a: number): {
  x: number;
  y: number;
  heading: number;
  lean: number;
  speed: number;
} {
  return {
    x: k.px + (k.x - k.px) * a,
    y: k.py + (k.y - k.py) * a,
    heading: k.pHeading + (k.heading - k.pHeading) * a,
    lean: k.pLean + (k.lean - k.pLean) * a,
    speed: k.speed,
  };
}
