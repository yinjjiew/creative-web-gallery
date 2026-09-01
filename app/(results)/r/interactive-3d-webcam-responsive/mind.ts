/**
 * Inner life. The visitor cannot drag this animal. They can only behave, and
 * the animal has opinions about that behaviour.
 *
 * Alarm is a startle reflex and a long cooling. Curiosity is a slow arrival
 * noticed. Familiarity is the session memory — it survives a fright.
 * Trust is what familiarity becomes if the frights stop. Depth in the pool
 * is trust made spatial: the impatient only ever see the ledge.
 */

import type { Sense } from "./sense";

export type Mood =
  | "absent"
  | "startled"
  | "hidden"
  | "peeking"
  | "foraging"
  | "frozen"
  | "curious"
  | "coming"
  | "at-glass"
  | "offering";

export type Mind = {
  alarm: number;
  curiosity: number;
  familiarity: number;
  trust: number;
  acquaintance: number;
  mood: Mood;
  x: number;
  y: number;
  z: number;
  heading: number;
  wantX: number;
  wantZ: number;
  speed: number;
  bloom: number;
  freeze: number;
  undulation: number;
  wanderT: number;
};

const HIDE = { x: 0.28, z: -1.18 };
const PEEK = { x: 0.12, z: -0.42 };
const OPEN = { x: 0.04, z: 0.08 };
const NEAR = { x: 0.02, z: 0.48 };
const GLASS = { x: 0.02, z: 0.88 };

export const NOTES: Record<Mood, string> = {
  absent: "The pool is keeping its own time.",
  startled: "A dart. Back under the stone.",
  hidden: "It is under the ledge. Waiting to see if you are weather.",
  peeking: "A length of pale skin at the lip of the rock.",
  foraging: "It has decided you are furniture, and is hunting.",
  frozen: "It feels the weight of being looked at.",
  curious: "It has noticed a slow arrival.",
  coming: "It is giving you a little of the open water.",
  "at-glass": "It has come as far as the sill.",
  offering: "The gills are working in the lamp. It would not do this for a stranger.",
};

export function noteFor(mood: Mood) {
  return NOTES[mood];
}

export function createMind(): Mind {
  return {
    alarm: 0.12,
    curiosity: 0.28,
    familiarity: 0,
    trust: 0,
    acquaintance: 0,
    mood: "peeking",
    x: PEEK.x,
    y: 0.1,
    z: PEEK.z,
    heading: 0.4,
    wantX: PEEK.x,
    wantZ: PEEK.z,
    speed: 0,
    bloom: 0.16,
    freeze: 0,
    undulation: 0.55,
    wanderT: 0,
  };
}

function approach(a: number, b: number, rate: number, dt: number) {
  return a + (b - a) * (1 - Math.exp(-rate * dt));
}

export function stepMind(m: Mind, s: Sense, dt: number, reduce: boolean) {
  if (s.sudden) {
    m.alarm = 1;
    m.curiosity *= 0.35;
    m.trust = Math.max(0, m.trust - 0.14);
    m.freeze = 0;
  } else {
    m.alarm = Math.max(0, m.alarm - dt * (s.energy < 0.06 ? 0.22 : 0.08));
  }

  const slowIn = s.presence && s.approach > 0.08 && s.energy < 0.16 && !s.sudden;
  const calm = s.presence && m.alarm < 0.22 && s.energy < 0.09;
  const stared = s.stare > 0.45 && m.trust < 0.62;

  if (slowIn) m.curiosity = Math.min(1, m.curiosity + dt * 0.22);
  else m.curiosity = Math.max(0, m.curiosity - dt * 0.06);

  if (s.presence && m.alarm < 0.5) {
    m.familiarity = Math.min(1, m.familiarity + dt * 0.012);
  }

  if (calm && s.stillness > 1.15 && !stared) {
    m.trust = Math.min(1, m.trust + dt * 0.0074);
    m.acquaintance += dt;
  } else if (!s.presence) {
    m.acquaintance = Math.max(0, m.acquaintance - dt * 0.04);
  }

  if (s.ignored > 0.7 && m.alarm < 0.2) {
    m.curiosity = Math.max(0, m.curiosity - dt * 0.12);
  }

  const offering =
    m.trust > 0.84 && m.acquaintance > 110 && m.alarm < 0.1 && s.energy < 0.07;

  let mood: Mood;
  if (m.alarm > 0.72) mood = "startled";
  else if (offering) mood = "offering";
  else if (stared && m.alarm < 0.55) mood = "frozen";
  else if (m.trust > 0.64 && m.alarm < 0.2) mood = "at-glass";
  else if (m.trust > 0.34 && m.alarm < 0.25 && s.presence) mood = "coming";
  else if (slowIn && m.alarm < 0.35) mood = "curious";
  else if (s.ignored > 0.55 && m.alarm < 0.18 && m.familiarity > 0.12) mood = "foraging";
  else if (!s.presence && m.alarm < 0.18) mood = "absent";
  else if (m.alarm > 0.28 || (m.trust < 0.12 && m.curiosity < 0.2)) mood = "hidden";
  else mood = "peeking";

  m.mood = mood;

  m.wanderT += dt * (mood === "foraging" || mood === "absent" ? 0.55 : 0.18);
  const wanderX = Math.sin(m.wanderT * 0.7) * 0.28;
  const wanderZ = Math.cos(m.wanderT * 0.46) * 0.22;

  if (mood === "startled" || mood === "hidden") {
    m.wantX = HIDE.x;
    m.wantZ = HIDE.z;
  } else if (mood === "peeking") {
    m.wantX = PEEK.x + wanderX * 0.12;
    m.wantZ = PEEK.z;
  } else if (mood === "frozen") {
    m.wantX = m.x;
    m.wantZ = m.z;
  } else if (mood === "curious") {
    m.wantX = mixToward(OPEN.x, PEEK.x, 0.45) + wanderX * 0.1;
    m.wantZ = mixToward(OPEN.z, PEEK.z, 0.4);
  } else if (mood === "foraging" || mood === "absent") {
    m.wantX = OPEN.x + wanderX;
    m.wantZ = OPEN.z + wanderZ * 0.7;
  } else if (mood === "coming") {
    m.wantX = NEAR.x + s.cx * 0.12;
    m.wantZ = NEAR.z;
  } else if (mood === "at-glass" || mood === "offering") {
    m.wantX = GLASS.x + s.cx * 0.08;
    m.wantZ = GLASS.z;
  }

  const dart = mood === "startled";
  const max = dart ? 2.6 : mood === "frozen" ? 0 : 0.16 + m.trust * 0.12;
  const dx = m.wantX - m.x;
  const dz = m.wantZ - m.z;
  const dist = Math.hypot(dx, dz);
  const step = Math.min(dist, max * dt * (reduce ? 4 : 1));
  if (dist > 1e-4) {
    m.x += (dx / dist) * step;
    m.z += (dz / dist) * step;
    if (step > 1e-4) {
      const head = Math.atan2(dx, dz);
      m.heading = reduce ? head : approach(m.heading, head, dart ? 14 : 3.2, dt);
    }
  }
  m.speed = step / Math.max(dt, 1e-4);

  const surface = mood === "offering" ? 0.16 : mood === "at-glass" ? 0.13 : 0.1;
  m.y = approach(m.y, surface, 2.2, dt);

  m.freeze = approach(m.freeze, mood === "frozen" ? 1 : 0, 6, dt);
  const wantBloom =
    mood === "offering" ? 1 : mood === "at-glass" ? 0.62 : mood === "coming" ? 0.4 : 0.18;
  m.bloom = approach(m.bloom, m.alarm > 0.5 ? 0.05 : wantBloom, 1.6, dt);
  m.undulation = approach(
    m.undulation,
    m.freeze > 0.6 ? 0.04 : dart ? 1 : 0.45 + m.trust * 0.25,
    4,
    dt
  );
}

function mixToward(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
