/**
 * Deterministic randomness. Every sheet the press produces is a pure function
 * of its recipe, so an edition code reproduces the same print exactly — on a
 * phone preview and on a 3024px export alike.
 */

/** FNV-1a. Turns an edition code like "MARGIN" into a 32-bit seed. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough for composition. */
export class Rng {
  private s: number;

  constructor(seed: number | string) {
    const n = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
    this.s = n === 0 ? 0x9e3779b9 : n;
  }

  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }

  /** Inclusive on both ends. */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.min(items.length - 1, Math.floor(this.next() * items.length))];
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  sign(): number {
    return this.next() < 0.5 ? -1 : 1;
  }

  shuffled<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

/** Unambiguous alphabet — an edition code gets read aloud and retyped. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomEdition(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Steps an edition code to its neighbour, so ⟨ and ⟩ walk a seed space. */
export function stepEdition(code: string, delta: number): string {
  const base = CODE_ALPHABET.length;
  const digits = code
    .toUpperCase()
    .split("")
    .map((c) => Math.max(0, CODE_ALPHABET.indexOf(c)));
  let value = digits.reduce((acc, d) => acc * base + d, 0) + delta;
  const span = base ** 6;
  value = ((value % span) + span) % span;
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out = CODE_ALPHABET[value % base] + out;
    value = Math.floor(value / base);
  }
  return out;
}

/** Stable 2D hash in [0,1). Used for per-dot jitter and ink dropouts. */
export function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ (seed | 0);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Bilinear value noise. Drives uneven inking across a plate. */
export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}

export function fbm(x: number, y: number, seed: number, octaves = 3): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * valueNoise(fx, fy, seed + i * 1013);
    norm += amp;
    amp *= 0.5;
    fx *= 2.03;
    fy *= 2.03;
  }
  return sum / norm;
}
