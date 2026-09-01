/**
 * The anamorphosis is constructed, not animated.
 *
 * Each shard sits on a ray from one camera (the mark) through a point on a
 * virtual picture plane. From that camera the shards stack into a cameo.
 * From anywhere else the depths refuse to agree, and you get a hanging cloud.
 * A face is used because a profile is one of the few silhouettes a handful of
 * slabs can still name; a word would have been a puzzle, a skull the homework.
 */

import * as THREE from "three";

export type Role = "figure" | "field" | "decoy";

export type Shard = {
  x: number;
  y: number;
  z: number;
  roll: number;
  wobble: number;
  phase: number;
  sx: number;
  sy: number;
  sz: number;
  role: Role;
  r: number;
  g: number;
  b: number;
};

export const LOOK = new THREE.Vector3(0.04, 0.12, 0.1);
export const SWEET_UV = { u: 0.74, v: 0.37 };
export const START_UV = { u: 0.28, v: 0.54 };

/** Walk the gallery wall: left–right and up–down, always facing the niche. */
export function cameraAt(u: number, v: number, out: THREE.Vector3) {
  out.set(-1.3 + 2.68 * u, 1.02 - 1.2 * v, 2.58);
}

const OVAL_RX = 0.86;
const OVAL_RY = 1.0;

function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function tri(
  x: number,
  y: number,
  a: [number, number],
  b: [number, number],
  c: [number, number]
) {
  const s = (p: [number, number], q: [number, number], r: [number, number]) =>
    (r[0] - p[0]) * (q[1] - p[1]) - (q[0] - p[0]) * (r[1] - p[1]);
  const b1 = s([x, y], a, b) < 0;
  const b2 = s([x, y], b, c) < 0;
  const b3 = s([x, y], c, a) < 0;
  return b1 === b2 && b2 === b3;
}

/**
 * A cameo profile facing right: bun, brow, a nose that actually sticks,
 * mouth, chin, cropped neck. Built from masses, not a wobbly outline, so
 * a hundred slabs can still name a person.
 */
function insideProfile(x: number, y: number) {
  if (ellipse(x, y, -0.14, 0.22, 0.5, 0.6)) return true;
  if (ellipse(x, y, 0.04, 0.1, 0.38, 0.44)) return true;
  if (ellipse(x, y, -0.46, 0.14, 0.24, 0.24)) return true;
  if (tri(x, y, [0.26, 0.18], [0.78, 0.01], [0.24, -0.08])) return true;
  if (ellipse(x, y, 0.34, -0.16, 0.13, 0.06)) return true;
  if (ellipse(x, y, 0.18, -0.36, 0.22, 0.16)) return true;
  if (ellipse(x, y, -0.06, -0.64, 0.17, 0.28)) return true;
  return false;
}

const NICHE = {
  x: 1.12,
  y0: -0.78,
  y1: 1.02,
  z0: -0.12,
  z1: 1.38,
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function insideOval(x: number, y: number) {
  return (x * x) / (OVAL_RX * OVAL_RX) + (y * y) / (OVAL_RY * OVAL_RY) < 1;
}

export function viewError(u: number, v: number) {
  return Math.hypot(u - SWEET_UV.u, v - SWEET_UV.v);
}

export function alignment(u: number, v: number) {
  const t = Math.min(1, viewError(u, v) / 0.7);
  return (1 - t) ** 1.35;
}

function inNiche(p: THREE.Vector3) {
  return (
    Math.abs(p.x) <= NICHE.x &&
    p.y >= NICHE.y0 &&
    p.y <= NICHE.y1 &&
    p.z >= NICHE.z0 &&
    p.z <= NICHE.z1
  );
}

type Sample = { ix: number; iy: number; role: Role };

function samples(rng: () => number): Sample[] {
  const out: Sample[] = [];
  const cols = 28;
  const rows = 36;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ix = ((col + 0.5) / cols) * 2 - 1 + (rng() - 0.5) * 0.026;
      const iy = ((row + 0.5) / rows) * 2 - 1 + (rng() - 0.5) * 0.022;
      if (insideProfile(ix, iy)) {
        out.push({ ix, iy, role: "figure" });
      } else if (insideOval(ix, iy)) {
        out.push({ ix, iy, role: "field" });
      }
    }
  }
  return out;
}

export function buildShards(): Shard[] {
  const rng = mulberry32(0xA3A);
  const sweet = new THREE.Vector3();
  cameraAt(SWEET_UV.u, SWEET_UV.v, sweet);

  const fwd = new THREE.Vector3().subVectors(LOOK, sweet).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();

  const hw = 0.74;
  const hh = 0.9;
  const dist = sweet.distanceTo(LOOK);
  const plane = LOOK.clone();
  const dir = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const hit = new THREE.Vector3();

  const shards: Shard[] = [];

  for (const sample of samples(rng)) {
    hit.copy(plane).addScaledVector(right, sample.ix * hw).addScaledVector(up, sample.iy * hh);
    dir.subVectors(hit, sweet).normalize();

    let placed = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const t = dist * (0.84 + rng() * 0.26);
      pos.copy(sweet).addScaledVector(dir, t);
      if (!inNiche(pos)) continue;
      placed = true;
      break;
    }
    if (!placed) continue;

    const figure = sample.role === "figure";
    const warm = rng();
    let r: number;
    let g: number;
    let b: number;
    if (figure) {
      r = 0.4 + warm * 0.1;
      g = 0.36 + warm * 0.08;
      b = 0.32 + warm * 0.06;
    } else {
      r = 0.76 + warm * 0.1;
      g = 0.73 + warm * 0.08;
      b = 0.68 + warm * 0.07;
    }

    shards.push({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      roll: (rng() - 0.5) * 0.7,
      wobble: 0.1 + rng() * 0.22,
      phase: rng() * Math.PI * 2,
      sx: figure ? 0.054 + rng() * 0.022 : 0.046 + rng() * 0.028,
      sy: figure ? 0.042 + rng() * 0.018 : 0.036 + rng() * 0.022,
      sz: figure ? 0.007 + rng() * 0.003 : 0.008 + rng() * 0.005,
      role: sample.role,
      r,
      g,
      b,
    });
  }

  for (let i = 0; i < 32; i++) {
    const side = rng() > 0.5 ? 1 : -1;
    const iron = rng() > 0.28;
    shards.push({
      x: side * (0.82 + rng() * 0.28),
      y: -0.55 + rng() * 1.35,
      z: -0.02 + rng() * 1.15,
      roll: rng() * Math.PI,
      wobble: 0.2 + rng() * 0.3,
      phase: rng() * Math.PI * 2,
      sx: iron ? 0.012 + rng() * 0.012 : 0.05 + rng() * 0.04,
      sy: iron ? 0.012 + rng() * 0.012 : 0.016 + rng() * 0.02,
      sz: iron ? 0.09 + rng() * 0.1 : 0.008 + rng() * 0.006,
      role: "decoy",
      r: iron ? 0.26 + rng() * 0.08 : 0.7 + rng() * 0.1,
      g: iron ? 0.24 + rng() * 0.06 : 0.42 + rng() * 0.08,
      b: iron ? 0.22 + rng() * 0.05 : 0.32 + rng() * 0.06,
    });
  }

  return shards;
}
