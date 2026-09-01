/**
 * Skip — a calibrated model of a stone on water.
 *
 * Units are metres, seconds, radians. y is up, water rests at y = 0, the
 * throw runs toward +x. The integration is a fixed step so the same wind-up
 * produces the same flight on a 30 Hz laptop and a 144 Hz phone; feel is
 * otherwise unlearnable.
 *
 * This is not a CFD solve and not a recording of a particular lake. The
 * dependencies are the real ones — attack, spin, pace, flatness, the slope
 * of the surface — and the coefficients were tuned until the failure modes
 * a thrower already knows (plough, no bite, tumble) read as themselves.
 */

export const DT = 1 / 120;
export const G = 9.81;
export const DEG = Math.PI / 180;

export const SHORE_X = 0.85;

const AIR = 1.2;
const WATER = 1000;
const V_MIN = 2.2;
const SPIN_MIN = 18;
const ATTACK_FLAT = 8 * DEG;
const ATTACK_STEEP = 42 * DEG;
const ATTACK_PEAK = 20 * DEG;
/** Sliver of the disc that is actually wetted. Tuned so a good hop is a hop. */
const WETTED = 0.014;
const LIFT_CAL = 1.08;

export type StoneId = "shale" | "slate" | "granite" | "cobble";
export type WaterId = "still" | "fetch" | "rain";
export type Phase = "idle" | "wind" | "flight" | "sunk";
export type Fail = "plough" | "flat" | "tumble" | "pace" | null;

export interface StoneSpec {
  id: StoneId;
  name: string;
  note: string;
  mass: number;
  radius: number;
  thickness: number;
  flatness: number;
  color: [number, number, number];
  edge: [number, number, number];
}

export interface WaterSpec {
  id: WaterId;
  name: string;
  note: string;
  chop: number;
  wind: number;
  loss: number;
  dimple: number;
}

export const STONES: Record<StoneId, StoneSpec> = {
  shale: {
    id: "shale",
    name: "Shale",
    note: "Thin, light, the usual choice.",
    mass: 0.085,
    radius: 0.046,
    thickness: 0.007,
    flatness: 0.94,
    color: [132, 118, 98],
    edge: [72, 64, 54],
  },
  slate: {
    id: "slate",
    name: "Slate",
    note: "Thinner still. Wants spin, then goes.",
    mass: 0.062,
    radius: 0.05,
    thickness: 0.005,
    flatness: 0.98,
    color: [78, 86, 96],
    edge: [40, 46, 54],
  },
  granite: {
    id: "granite",
    name: "Granite",
    note: "Heavy. Forgiving pace, fewer hops.",
    mass: 0.17,
    radius: 0.04,
    thickness: 0.016,
    flatness: 0.72,
    color: [154, 140, 128],
    edge: [88, 78, 70],
  },
  cobble: {
    id: "cobble",
    name: "Cobble",
    note: "A river stone. Round. A lesson.",
    mass: 0.2,
    radius: 0.036,
    thickness: 0.026,
    flatness: 0.34,
    color: [118, 104, 88],
    edge: [62, 54, 46],
  },
};

export const WATERS: Record<WaterId, WaterSpec> = {
  still: {
    id: "still",
    name: "Stillwater",
    note: "Evening. A quarry pond that holds a path of light.",
    chop: 0.018,
    wind: 0,
    loss: 0.034,
    dimple: 0,
  },
  fetch: {
    id: "fetch",
    name: "Fetch",
    note: "A wider lake, a breeze across it.",
    chop: 0.048,
    wind: 1.6,
    loss: 0.05,
    dimple: 0,
  },
  rain: {
    id: "rain",
    name: "After rain",
    note: "Pewter. The surface will not sit still.",
    chop: 0.07,
    wind: 0.5,
    loss: 0.068,
    dimple: 0.7,
  },
};

export type Ev =
  | { type: "pickup" }
  | { type: "release"; speed: number; attack: number; spin: number }
  | {
      type: "skip";
      x: number;
      z: number;
      speed: number;
      attack: number;
      index: number;
    }
  | { type: "plough"; x: number; z: number; speed: number }
  | { type: "flat"; x: number; z: number; speed: number }
  | { type: "tumble"; x: number; z: number; speed: number }
  | { type: "sink"; x: number; z: number; skips: number; fail: Fail }
  | { type: "splash"; x: number; z: number; energy: number };

export interface Body {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  attack: number;
  spin: number;
  tumble: number;
  roll: number;
  sinking: boolean;
}

export interface Game {
  phase: Phase;
  t: number;
  stone: StoneSpec;
  water: WaterSpec;
  body: Body;
  skips: number;
  fail: Fail;
  power: number;
  aimAttack: number;
  aimSpin: number;
  hold: number;
  cool: number;
  reduced: boolean;
  events: Ev[];
}

export interface Journal {
  best: number;
  throws: number;
  byStone: Record<StoneId, number>;
  byWater: Record<WaterId, number>;
  lastStone: StoneId;
  lastWater: WaterId;
}

export function emptyJournal(): Journal {
  return {
    best: 0,
    throws: 0,
    byStone: { shale: 0, slate: 0, granite: 0, cobble: 0 },
    byWater: { still: 0, fetch: 0, rain: 0 },
    lastStone: "shale",
    lastWater: "still",
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

function hash2(x: number, z: number) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Surface height. Same field the renderer samples, so a hit is a hit. */
export function waterHeight(
  x: number,
  z: number,
  t: number,
  w: WaterSpec,
  reduced: boolean
) {
  const tau = reduced ? 8.2 : t;
  const a = w.chop;
  let h = 0;
  h += a * 1.0 * Math.sin(1.15 * x + 0.35 * z + 1.7 * tau);
  h += a * 0.55 * Math.sin(2.4 * x - 1.1 * z + 2.8 * tau + 0.7);
  h += a * 0.28 * Math.sin(3.6 * x + 2.2 * z + 3.4 * tau + 1.4);
  if (w.dimple > 0) {
    const ix = Math.floor(x * 3.2);
    const iz = Math.floor(z * 3.2);
    const ph = hash2(ix, iz) * Math.PI * 2;
    const pulse = reduced ? 0.55 : 0.5 + 0.5 * Math.sin(9.5 * tau + ph);
    h += w.dimple * 0.012 * pulse * Math.sin(ix * 1.7 + iz * 2.1);
  }
  return h;
}

export function waterSlopeX(
  x: number,
  z: number,
  t: number,
  w: WaterSpec,
  reduced: boolean
) {
  const e = 0.08;
  return (
    (waterHeight(x + e, z, t, w, reduced) -
      waterHeight(x - e, z, t, w, reduced)) /
    (2 * e)
  );
}

function restBody(stone: StoneSpec): Body {
  return {
    x: SHORE_X,
    y: 0.055 + stone.thickness,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    attack: ATTACK_PEAK,
    spin: 0,
    tumble: 0,
    roll: 0,
    sinking: false,
  };
}

export function newGame(
  stone: StoneId,
  water: WaterId,
  reduced: boolean
): Game {
  return {
    phase: "idle",
    t: 0,
    stone: STONES[stone],
    water: WATERS[water],
    body: restBody(STONES[stone]),
    skips: 0,
    fail: null,
    power: 0,
    aimAttack: ATTACK_PEAK,
    aimSpin: 0,
    hold: 0,
    cool: 0,
    reduced,
    events: [],
  };
}

export function setStone(g: Game, id: StoneId) {
  if (g.phase === "flight") return;
  g.stone = STONES[id];
  resetThrow(g);
}

export function setWater(g: Game, id: WaterId) {
  if (g.phase === "flight") return;
  g.water = WATERS[id];
  resetThrow(g);
}

export function resetThrow(g: Game) {
  g.phase = "idle";
  g.body = restBody(g.stone);
  g.body.attack = g.aimAttack;
  g.skips = 0;
  g.fail = null;
  g.power = 0;
  g.aimSpin = 0;
  g.hold = 0;
  g.cool = 0;
}

export function beginWind(g: Game) {
  if (g.phase === "flight") return;
  if (g.phase === "sunk" || g.phase === "idle") {
    g.body = restBody(g.stone);
    g.body.attack = g.aimAttack;
    g.skips = 0;
    g.fail = null;
  }
  g.phase = "wind";
  g.power = 0.12;
  g.aimSpin = 0;
  g.hold = 0;
  g.events.push({ type: "pickup" });
}

export function setAim(g: Game, power: number, attack: number, spinBoost = 0) {
  if (g.phase !== "wind" && g.phase !== "idle") return;
  g.power = clamp(power, 0.06, 1);
  g.aimAttack = clamp(attack, 2 * DEG, 52 * DEG);
  g.body.attack = g.aimAttack;
  if (g.phase === "wind") {
    g.aimSpin = clamp(g.aimSpin + spinBoost, 0, 95);
  }
}

export function nudgeAttack(g: Game, d: number) {
  if (g.phase === "flight") return;
  g.aimAttack = clamp(g.aimAttack + d, 2 * DEG, 52 * DEG);
  g.body.attack = g.aimAttack;
}

export function release(g: Game) {
  if (g.phase !== "wind") return;
  const stone = g.stone;
  const power = g.power;
  const attack = g.aimAttack;
  const spin = g.aimSpin;
  const speed = lerp(3.4, 13.2, power * power * 0.35 + power * 0.65);
  const elev = (14.5 + power * 3.2) * DEG;
  const b = g.body;
  b.x = SHORE_X;
  b.y = 0.07 + stone.thickness;
  b.z = 0;
  b.vx = speed * Math.cos(elev);
  b.vy = speed * Math.sin(elev);
  b.vz = g.water.wind * 0.08;
  b.attack = attack;
  b.spin = spin;
  b.tumble = spin < spinNeed(stone) * 0.45 ? 2.4 : 0;
  b.roll = 0;
  b.sinking = false;
  g.phase = "flight";
  g.skips = 0;
  g.fail = null;
  g.cool = 0.05;
  g.events.push({ type: "release", speed, attack, spin });
}

function spinNeed(stone: StoneSpec) {
  return SPIN_MIN / (0.42 + 0.58 * stone.flatness);
}

/** Lift coefficient: a peak around 20°, dead when it never bites or ploughs. */
function clOf(attack: number, flatness: number) {
  const d = attack / DEG;
  if (d < 5 || d > 52) return 0;
  const x = (d - 20) / 10.5;
  const gauss = Math.exp(-0.5 * x * x);
  let bite = 1;
  if (d < 10) bite = Math.max(0, (d - 5) / 5);
  if (d > 36) bite = Math.max(0, 1 - (d - 36) / 14);
  return gauss * bite * (0.5 + 0.5 * flatness);
}

function contact(g: Game) {
  const b = g.body;
  const stone = g.stone;
  const water = g.water;
  const slope = waterSlopeX(b.x, b.z, g.t, water, g.reduced);
  const attack = b.attack - Math.atan(slope) * 0.55;
  const speed = Math.hypot(b.vx, b.vy, b.vz);
  const need = spinNeed(stone);
  const stable = b.spin >= need * 0.72 && Math.abs(b.tumble) < 3.2;

  if (!stable) {
    g.fail = "tumble";
    b.sinking = true;
    b.vy = Math.min(b.vy, -0.4);
    b.vx *= 0.35;
    b.tumble += 8;
    g.events.push({ type: "tumble", x: b.x, z: b.z, speed });
    g.events.push({ type: "splash", x: b.x, z: b.z, energy: 0.55 + speed * 0.04 });
    return;
  }

  if (attack > ATTACK_STEEP) {
    g.fail = "plough";
    b.sinking = true;
    b.vy = Math.min(b.vy, -1.1);
    b.vx *= 0.22;
    b.attack = Math.min(b.attack + 0.35, 1.2);
    g.events.push({ type: "plough", x: b.x, z: b.z, speed });
    g.events.push({ type: "splash", x: b.x, z: b.z, energy: 0.9 + speed * 0.05 });
    return;
  }

  if (attack < ATTACK_FLAT) {
    g.fail = "flat";
    b.sinking = true;
    b.vy = Math.min(b.vy * 0.2, -0.15);
    b.vx *= 0.55;
    g.events.push({ type: "flat", x: b.x, z: b.z, speed });
    g.events.push({ type: "splash", x: b.x, z: b.z, energy: 0.28 + speed * 0.02 });
    return;
  }

  const cl = clOf(attack, stone.flatness);
  const area = Math.PI * stone.radius * stone.radius;
  const wetted = area * (WETTED + 0.006 * stone.flatness);
  const impact = Math.atan2(Math.max(0.05, -b.vy), Math.hypot(b.vx, b.vz));
  const tau = clamp(
    (2 * stone.radius) / (Math.max(1.2, speed) * Math.sin(impact)),
    0.006,
    0.028
  );
  const lift = 0.5 * WATER * speed * speed * wetted * cl * LIFT_CAL;
  const dvn = (lift * tau) / stone.mass;
  const drag =
    (0.5 * WATER * speed * wetted * (0.38 + 1.05 * Math.sin(attack) ** 2) * tau) /
    stone.mass;

  b.vy = -b.vy * 0.22 + dvn * (0.62 + 0.22 * stone.flatness);
  b.vx -= drag * (b.vx / Math.max(0.2, speed));
  b.vz -= drag * 0.35 * (b.vz / Math.max(0.2, speed));
  b.vx *= 1 - water.loss;
  b.spin *= 0.888 + 0.022 * stone.flatness;
  b.attack += (ATTACK_PEAK - b.attack) * 0.12;
  b.y = waterHeight(b.x, b.z, g.t, water, g.reduced) + stone.thickness * 0.6;
  g.cool = 0.055;

  const horiz = Math.hypot(b.vx, b.vz);
  // A stone that is still truly spinning keeps a late hop alive — that is
  // how the fifteenth skip is earned, not granted.
  if (b.spin > need * 1.05 && cl > 0.18 && horiz > 2.5) {
    b.vy = Math.max(b.vy, 0.4);
  }
  if (b.vy > 0.36 && horiz > V_MIN && cl > 0.14) {
    g.skips += 1;
    g.fail = null;
    g.events.push({
      type: "skip",
      x: b.x,
      z: b.z,
      speed,
      attack,
      index: g.skips,
    });
    g.events.push({
      type: "splash",
      x: b.x,
      z: b.z,
      energy: 0.35 + speed * 0.03 + g.skips * 0.02,
    });
    return;
  }

  g.fail = "pace";
  b.sinking = true;
  b.vy = Math.min(b.vy, -0.25);
  g.events.push({ type: "splash", x: b.x, z: b.z, energy: 0.4 });
}

function sinkNow(g: Game) {
  const b = g.body;
  g.phase = "sunk";
  g.events.push({
    type: "sink",
    x: b.x,
    z: b.z,
    skips: g.skips,
    fail: g.fail,
  });
}

function stepFlight(g: Game, dt: number) {
  const b = g.body;
  const stone = g.stone;
  const water = g.water;
  const h = waterHeight(b.x, b.z, g.t, water, g.reduced);

  if (!b.sinking) {
    b.vy -= G * dt;
    const v = Math.hypot(b.vx, b.vy, b.vz);
    const A = Math.PI * stone.radius * stone.radius;
    const drag = (0.5 * AIR * 0.55 * A * v) / stone.mass;
    if (v > 0.05) {
      b.vx -= drag * b.vx * dt;
      b.vy -= drag * b.vy * dt;
      b.vz -= drag * b.vz * dt;
    }
    b.vz += water.wind * 0.22 * dt;
    const need = spinNeed(stone);
    if (b.spin < need) {
      b.tumble += (1 - b.spin / need) * 7.5 * dt;
      b.attack += b.tumble * dt;
    } else {
      b.tumble *= 1 - 2.4 * dt;
      b.attack += (g.aimAttack - b.attack) * 0.4 * dt;
    }
    b.roll += b.spin * dt;
    b.spin *= 1 - 0.018 * dt;
  } else {
    b.vy -= G * 0.42 * dt;
    b.vx *= 1 - 2.8 * dt;
    b.vz *= 1 - 2.8 * dt;
    b.vy *= 1 - 1.6 * dt;
    b.roll += (b.spin * 0.4 + b.tumble) * dt;
    b.attack += b.tumble * 0.6 * dt;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.z += b.vz * dt;
  g.cool = Math.max(0, g.cool - dt);

  if (!b.sinking && g.cool <= 0 && b.y <= h + stone.thickness * 0.35 && b.vy < 0) {
    contact(g);
  }

  if (b.sinking && (b.y < h - 0.16 || Math.hypot(b.vx, b.vy) < 0.35)) {
    sinkNow(g);
  }
  if (b.x > 86 || b.x < -4 || Math.abs(b.z) > 18) {
    if (!b.sinking) g.fail = g.fail ?? "pace";
    b.sinking = true;
    sinkNow(g);
  }
}

export function advance(g: Game, dt: number) {
  let acc = dt;
  if (acc > 0.16) acc = 0.16;
  while (acc > 0) {
    const step = acc > DT ? DT : acc;
    g.t += step;
    if (g.phase === "wind") {
      g.hold += step;
      const spinUp = 68 * step * (0.7 + 0.3 * g.stone.flatness);
      g.aimSpin = clamp(g.aimSpin + spinUp, 0, 95);
      g.body.spin = g.aimSpin;
      g.body.roll += g.aimSpin * step;
      g.body.attack = g.aimAttack;
      g.body.y = 0.055 + g.stone.thickness + g.power * 0.04;
    } else if (g.phase === "idle") {
      g.body.attack = g.aimAttack;
      g.body.y = 0.055 + g.stone.thickness;
    } else if (g.phase === "flight") {
      stepFlight(g, step);
    } else if (g.phase === "sunk") {
      const b = g.body;
      const h = waterHeight(b.x, b.z, g.t, g.water, g.reduced);
      b.y += (-0.12 - b.y) * 0.8 * step;
      if (b.y < h - 0.4) b.y = h - 0.4;
      b.roll += 0.4 * step;
    }
    acc -= step;
  }
}

export function record(j: Journal, g: Game): Journal {
  const next: Journal = {
    ...j,
    byStone: { ...j.byStone },
    byWater: { ...j.byWater },
    throws: j.throws + 1,
    lastStone: g.stone.id,
    lastWater: g.water.id,
  };
  next.best = Math.max(j.best, g.skips);
  next.byStone[g.stone.id] = Math.max(j.byStone[g.stone.id], g.skips);
  next.byWater[g.water.id] = Math.max(j.byWater[g.water.id], g.skips);
  return next;
}

export function words(n: number) {
  const w = [
    "none",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];
  if (n < w.length) return w[n];
  return String(n);
}

export function verdict(g: Game) {
  if (g.phase === "flight" && g.skips === 0) return "in the air";
  if (g.phase === "flight") return words(g.skips);
  if (g.fail === "plough") return "too steep — it ploughed in";
  if (g.fail === "flat") return "too flat — it never bit";
  if (g.fail === "tumble") return "no spin — it tumbled";
  if (g.skips === 0 && g.fail === "pace") return "not enough pace";
  if (g.skips === 0) return "waiting";
  if (g.skips === 1) return "a single touch";
  return words(g.skips);
}

export function aimDegrees(g: Game) {
  return Math.round(g.aimAttack / DEG);
}
