/**
 * Gilbert model of a bar magnet: two magnetic charges at the ends.
 *
 * Isolated monopoles do not exist. Treating the ends as +q and −q is the
 * standard pedagogical model of a bar, and it is exact about the two facts
 * this plate is for: linear superposition, and the topology of like versus
 * unlike. The observation plane sits a height h above the charges — filings
 * on paper over magnets, not a 2-D cartoon.
 *
 * Soft iron in a field B becomes an induced dipole m ∝ B. In free space
 * ∇ × B = 0, so the force is F ∝ (B · ∇)B = ∇(B²/2). Needles turn with B
 * and creep toward |B|.
 */

export type Magnet = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  strength: number;
  flipped: boolean;
};

export type Preset = "unlike" | "like" | "single";

export const HEIGHT = 2.85;
export const MAX_POLES = 8;

export function writePoles(
  magnets: Magnet[],
  px: Float32Array,
  py: Float32Array,
  pq: Float32Array,
): number {
  let n = 0;
  for (const m of magnets) {
    const hx = Math.cos(m.angle) * m.length * 0.5;
    const hy = Math.sin(m.angle) * m.length * 0.5;
    const q = m.flipped ? -m.strength : m.strength;
    px[n] = m.x + hx;
    py[n] = m.y + hy;
    pq[n] = q;
    n += 1;
    px[n] = m.x - hx;
    py[n] = m.y - hy;
    pq[n] = -q;
    n += 1;
  }
  return n;
}

/**
 * Field and induced-dipole force at (x, y, HEIGHT).
 * out: bx, by, bz, fx, fy
 */
export function sampleField(
  x: number,
  y: number,
  px: Float32Array,
  py: Float32Array,
  pq: Float32Array,
  n: number,
  out: Float32Array,
): void {
  let bx = 0;
  let by = 0;
  let bz = 0;
  let jxx = 0;
  let jxy = 0;
  let jxz = 0;
  let jyy = 0;
  let jyz = 0;
  const h = HEIGHT;
  const h2 = h * h;

  for (let i = 0; i < n; i++) {
    const rx = x - px[i];
    const ry = y - py[i];
    const r2 = rx * rx + ry * ry + h2;
    const invR = 1 / Math.sqrt(r2);
    const invR3 = invR / r2;
    const q = pq[i];
    const q3 = q * invR3;
    const q5 = q * invR3 * (3 / r2);
    bx += q3 * rx;
    by += q3 * ry;
    bz += q3 * h;
    jxx += q3 - q5 * rx * rx;
    jxy += -q5 * rx * ry;
    jxz += -q5 * rx * h;
    jyy += q3 - q5 * ry * ry;
    jyz += -q5 * ry * h;
  }

  out[0] = bx;
  out[1] = by;
  out[2] = bz;
  out[3] = bx * jxx + by * jxy + bz * jxz;
  out[4] = bx * jxy + by * jyy + bz * jyz;
}

/** Smallest turn for an undirected needle (φ ≡ φ+π). */
export function needleDelta(from: number, to: number): number {
  let d = to - from;
  d -= Math.PI * 2 * Math.round(d / (Math.PI * 2));
  if (d > Math.PI / 2) d -= Math.PI;
  if (d < -Math.PI / 2) d += Math.PI;
  return d;
}

export type MagnetHit = "body" | "endN" | "endS";

export function hitMagnet(
  x: number,
  y: number,
  m: Magnet,
  pad = 0.55,
): MagnetHit | null {
  const c = Math.cos(-m.angle);
  const s = Math.sin(-m.angle);
  const dx = x - m.x;
  const dy = y - m.y;
  const lx = c * dx - s * dy;
  const ly = s * dx + c * dy;
  const hw = m.length * 0.5 + pad;
  const hh = m.width * 0.5 + pad;
  if (Math.abs(lx) > hw || Math.abs(ly) > hh) return null;
  if (lx > m.length * 0.34) return "endN";
  if (lx < -m.length * 0.34) return "endS";
  return "body";
}

export function insideMagnet(x: number, y: number, m: Magnet, pad = 0.15): boolean {
  const c = Math.cos(-m.angle);
  const s = Math.sin(-m.angle);
  const dx = x - m.x;
  const dy = y - m.y;
  const lx = c * dx - s * dy;
  const ly = s * dx + c * dy;
  return Math.abs(lx) <= m.length * 0.5 + pad && Math.abs(ly) <= m.width * 0.5 + pad;
}

export function ejectFromMagnet(x: number, y: number, m: Magnet): { x: number; y: number } {
  const c = Math.cos(-m.angle);
  const s = Math.sin(-m.angle);
  const dx = x - m.x;
  const dy = y - m.y;
  const lx = c * dx - s * dy;
  const ly = s * dx + c * dy;
  const hw = m.length * 0.5 + 0.35;
  const hh = m.width * 0.5 + 0.35;
  const ox = Math.abs(lx) - hw;
  const oy = Math.abs(ly) - hh;
  let nlx = lx;
  let nly = ly;
  if (ox > oy) {
    nlx = Math.sign(lx || 1) * hw;
  } else {
    nly = Math.sign(ly || 1) * hh;
  }
  const ca = Math.cos(m.angle);
  const sa = Math.sin(m.angle);
  return {
    x: m.x + ca * nlx - sa * nly,
    y: m.y + sa * nlx + ca * nly,
  };
}

export function magnetN(m: Magnet): { x: number; y: number } {
  const sign = m.flipped ? -1 : 1;
  return {
    x: m.x + Math.cos(m.angle) * m.length * 0.5 * sign,
    y: m.y + Math.sin(m.angle) * m.length * 0.5 * sign,
  };
}

export function magnetS(m: Magnet): { x: number; y: number } {
  const sign = m.flipped ? -1 : 1;
  return {
    x: m.x - Math.cos(m.angle) * m.length * 0.5 * sign,
    y: m.y - Math.sin(m.angle) * m.length * 0.5 * sign,
  };
}

export const CAPTIONS: Record<Preset, string> = {
  unlike:
    "Unlike ends face each other. The gap is a road: lines leave north and are received by south.",
  like: "Like ends face each other. The gap is a refusal. A null sits where the two fields cancel.",
  single: "One bar. Density is |B|. The needles are only direction.",
};

export const ANNOUNCE: Record<Preset, string> = {
  unlike:
    "Two magnets, unlike poles facing. Field lines join in the gap.",
  like: "Two magnets, like poles facing. A null sits between them.",
  single: "One magnet. Filings gather at the poles.",
};
