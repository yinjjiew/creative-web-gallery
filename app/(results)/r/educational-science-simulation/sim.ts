/**
 * Planar two-body motion about Earth.
 *
 * Force: inverse-square from a point mass, a = −μ r / |r|³.
 * Coast is the exact Keplerian conic (Battin / Vallado). Burns are velocity
 * Verlet at a fixed 0.1 s, then the state is a conic again. Energy and specific
 * angular momentum are conserved to machine precision while coasting; they
 * change only when the thruster does work.
 *
 * μ — Earth's GM, EGM96 / IERS conventional value.
 * Radius — volumetric mean, NASA Earth fact sheet, not the equatorial 6378 km.
 * 400 km — a round number near typical ISS altitude (the station has flown
 * roughly 330–420 km). Not a measured instantaneous height.
 */

export const MU = 3.986004418e14;
export const R_EARTH = 6_371_000;
export const ISS_ALT = 400_000;
export const THRUST = 0.5;
export const IMPULSE = 5;
export const VERLET_DT = 0.1;
export const ATMOSPHERE = 80_000;

export type Vec = { readonly x: number; readonly y: number };

export const vadd = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const vsub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const vscale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
export const vdot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
export const vcross = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x;
export const vmag = (a: Vec): number => Math.hypot(a.x, a.y);

export function vhat(a: Vec): Vec {
  const m = vmag(a);
  if (m < 1e-15) return { x: 0, y: 0 };
  return { x: a.x / m, y: a.y / m };
}

export type Craft = { r: Vec; v: Vec };

export type SceneLive = {
  chaser: Craft;
  target: Craft | null;
  trail: Vec[];
  burn: boolean;
  crashed: boolean;
};

export type Burn = "prograde" | "retro" | "radialOut" | "radialIn";

export function circularState(alt: number, theta: number): Craft {
  const rm = R_EARTH + alt;
  const vm = Math.sqrt(MU / rm);
  return {
    r: { x: rm * Math.cos(theta), y: rm * Math.sin(theta) },
    v: { x: -vm * Math.sin(theta), y: vm * Math.cos(theta) },
  };
}

export function specificEnergy(c: Craft): number {
  return 0.5 * vdot(c.v, c.v) - MU / vmag(c.r);
}

export function specificH(c: Craft): number {
  return vcross(c.r, c.v);
}

export type Elements = {
  bound: boolean;
  a: number;
  e: number;
  n: number;
  period: number;
  energy: number;
  h: number;
  rp: number;
  ra: number;
  nu: number;
  M: number;
  E: number;
  periArg: number;
  r: number;
  speed: number;
};

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function classify(c: Craft): Elements {
  const r = vmag(c.r);
  const speed = vmag(c.v);
  const energy = specificEnergy(c);
  const h = specificH(c);
  const vr = vdot(c.r, c.v) / Math.max(r, 1e-15);

  const evec = {
    x: ((speed * speed - MU / r) * c.r.x - vdot(c.r, c.v) * c.v.x) / MU,
    y: ((speed * speed - MU / r) * c.r.y - vdot(c.r, c.v) * c.v.y) / MU,
  };
  const e = vmag(evec);
  const bound = energy < -1 && e < 0.999999;
  const a = energy < 0 ? -MU / (2 * energy) : Infinity;

  let periArg = Math.atan2(evec.y, evec.x);
  let nu: number;
  if (e < 1e-10) {
    periArg = 0;
    nu = Math.atan2(c.r.y, c.r.x);
  } else {
    nu = Math.acos(clamp(vdot(evec, c.r) / (e * r), -1, 1));
    if (vr < 0) nu = 2 * Math.PI - nu;
  }

  let E = 0;
  let M = 0;
  let n = 0;
  let period = Infinity;
  let rp = (h * h) / MU / Math.max(1 + e, 1e-15);
  let ra = Infinity;

  if (bound && a > 0 && Number.isFinite(a)) {
    if (e < 1e-10) {
      E = nu;
      M = nu;
    } else {
      const cosE = clamp((e + Math.cos(nu)) / (1 + e * Math.cos(nu)), -1, 1);
      E = Math.acos(cosE);
      if (nu > Math.PI) E = 2 * Math.PI - E;
      M = E - e * Math.sin(E);
    }
    n = Math.sqrt(MU / (a * a * a));
    period = (2 * Math.PI) / n;
    rp = a * (1 - e);
    ra = a * (1 + e);
  }

  return {
    bound,
    a,
    e,
    n,
    period,
    energy,
    h,
    rp,
    ra,
    nu,
    M,
    E,
    periArg,
    r,
    speed,
  };
}

function solveKepler(M: number, e: number): number {
  let m = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  let E = m + e * Math.sin(m);
  for (let i = 0; i < 14; i++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-14) break;
  }
  return E;
}

export function stateFromOrbit(
  a: number,
  e: number,
  E: number,
  periArg: number,
): Craft {
  const cE = Math.cos(E);
  const sE = Math.sin(E);
  const s1e2 = Math.sqrt(Math.max(0, 1 - e * e));
  const x = a * (cE - e);
  const y = a * s1e2 * sE;
  const n = Math.sqrt(MU / (a * a * a));
  const den = 1 - e * cE;
  const vx = -((n * a) / den) * sE;
  const vy = ((n * a) / den) * s1e2 * cE;
  const c = Math.cos(periArg);
  const s = Math.sin(periArg);
  return {
    r: { x: x * c - y * s, y: x * s + y * c },
    v: { x: vx * c - vy * s, y: vx * s + vy * c },
  };
}

export function gravity(r: Vec): Vec {
  const m = vmag(r);
  const k = -MU / (m * m * m);
  return { x: k * r.x, y: k * r.y };
}

export function verlet(c: Craft, dt: number, thrust: Vec): Craft {
  const a0 = vadd(gravity(c.r), thrust);
  const vH = vadd(c.v, vscale(a0, dt / 2));
  const r1 = vadd(c.r, vscale(vH, dt));
  const a1 = vadd(gravity(r1), thrust);
  const v1 = vadd(vH, vscale(a1, dt / 2));
  return { r: r1, v: v1 };
}

export function coast(c: Craft, dt: number): Craft {
  const el = classify(c);
  if (!el.bound || el.a <= 0 || !Number.isFinite(el.period)) {
    return verlet(c, dt, { x: 0, y: 0 });
  }
  if (el.e < 1e-10) {
    const theta = Math.atan2(c.r.y, c.r.x) + el.n * dt;
    return circularState(el.r - R_EARTH, theta);
  }
  const E2 = solveKepler(el.M + el.n * dt, el.e);
  return stateFromOrbit(el.a, el.e, E2, el.periArg);
}

export function thrustVector(c: Craft, mode: Burn, accel: number): Vec {
  if (mode === "prograde") return vscale(vhat(c.v), accel);
  if (mode === "retro") return vscale(vhat(c.v), -accel);
  const out = vhat(c.r);
  if (mode === "radialOut") return vscale(out, accel);
  return vscale(out, -accel);
}

export function integrate(c: Craft, dt: number, burn: Burn | null): Craft {
  if (!burn) return coast(c, dt);
  let s = c;
  let left = dt;
  while (left > 1e-12) {
    const h = Math.min(VERLET_DT, left);
    // Recompute the unit direction each substep so a long hold stays
    // prograde as the velocity vector turns.
    s = verlet(s, h, thrustVector(s, burn, THRUST));
    left -= h;
  }
  return s;
}

export function applyImpulse(c: Craft, mode: Burn, dv: number): Craft {
  return { r: c.r, v: vadd(c.v, thrustVector(c, mode, dv)) };
}

export function sampleOrbit(c: Craft, n = 96): Vec[] {
  const el = classify(c);
  if (!el.bound || !Number.isFinite(el.a)) {
    const pts: Vec[] = [];
    let s = c;
    for (let i = 0; i < n; i++) {
      pts.push(s.r);
      s = coast(s, 30);
    }
    return pts;
  }
  const pts: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const E = (i / n) * 2 * Math.PI;
    pts.push(stateFromOrbit(el.a, el.e, E, el.periArg).r);
  }
  return pts;
}

export function wrapAngle(a: number): number {
  return ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
}

/** Signed Earth-centred angle from chaser to target. Positive = target ahead. */
export function phaseAngle(chaser: Craft, target: Craft): number {
  return wrapAngle(Math.atan2(target.r.y, target.r.x) - Math.atan2(chaser.r.y, chaser.r.x));
}

export function circularPeriod(r: number): number {
  return 2 * Math.PI * Math.sqrt((r * r * r) / MU);
}

export function circularSpeed(r: number): number {
  return Math.sqrt(MU / r);
}

export function hitEarth(c: Craft): boolean {
  return vmag(c.r) <= R_EARTH;
}

export function inAtmosphere(c: Craft): boolean {
  return vmag(c.r) < R_EARTH + ATMOSPHERE;
}

export type Reading = {
  alt: number;
  altPeri: number;
  altApo: number;
  speed: number;
  period: number;
  periodCircular: number;
  speedCircular: number;
  energy: number;
  h: number;
  e: number;
  a: number;
  bound: boolean;
  r: number;
};

export function reading(c: Craft): Reading {
  const el = classify(c);
  return {
    alt: el.r - R_EARTH,
    altPeri: el.rp - R_EARTH,
    altApo: el.bound ? el.ra - R_EARTH : Infinity,
    speed: el.speed,
    period: el.period,
    periodCircular: circularPeriod(el.r),
    speedCircular: circularSpeed(el.r),
    energy: el.energy,
    h: el.h,
    e: el.e,
    a: el.a,
    bound: el.bound,
    r: el.r,
  };
}

export type Stage = "period" | "chase" | "meet" | "open";

export type SetupName = "same" | "higher" | "lower";

export function setup(stage: Stage, name: SetupName = "same"): { chaser: Craft; target: Craft | null } {
  const chaser = circularState(ISS_ALT, 0);
  if (stage === "period") return { chaser, target: null };
  if (stage === "chase" || stage === "meet") {
    return { chaser, target: circularState(ISS_ALT, (12 * Math.PI) / 180) };
  }
  if (name === "higher") {
    return { chaser, target: circularState(ISS_ALT + 50_000, (8 * Math.PI) / 180) };
  }
  if (name === "lower") {
    return {
      chaser: circularState(ISS_ALT + 50_000, 0),
      target: circularState(ISS_ALT, (8 * Math.PI) / 180),
    };
  }
  return { chaser, target: circularState(ISS_ALT, (20 * Math.PI) / 180) };
}

export function visVivaPoints(c: Craft, n = 48): { alt: number; speed: number }[] {
  return sampleOrbit(c, n).map((r) => {
    const el = classify(c);
    if (!el.bound) return { alt: vmag(r) - R_EARTH, speed: el.speed };
    const rm = vmag(r);
    const speed = Math.sqrt(Math.max(0, MU * (2 / rm - 1 / el.a)));
    return { alt: rm - R_EARTH, speed };
  });
}

export function relativeSpeed(a: Craft, b: Craft): number {
  return vmag(vsub(a.v, b.v));
}

export function formation(chaser: Craft, target: Craft): boolean {
  const pc = reading(chaser);
  const pt = reading(target);
  const ang = Math.abs(phaseAngle(chaser, target));
  const da = Math.abs(pc.a - pt.a);
  const dr = Math.abs(pc.r - pt.r);
  return ang < 2.5 * (Math.PI / 180) && da < 20_000 && dr < 25_000 && relativeSpeed(chaser, target) < 90;
}

export function clocksClose(chaser: Craft, target: Craft): boolean {
  return Math.abs(phaseAngle(chaser, target)) < 3 * (Math.PI / 180);
}
