/**
 * Two independent 2-D wave fields. Nothing in the left array is ever written
 * from the right, or the reverse — that is the isolation, not a visual trick.
 *
 * Each field still has to look like a mattress: waves must travel, then die
 * at the inner edge rather than bounce off a hard wall. The last few columns
 * toward the seam are a discrete absorbing layer (high damping, slightly
 * slower c). Energy that reaches the polymer strip is spent there.
 *
 * Displacement is in abstract units. The page maps peak |u| to millimetres
 * for the meters; that scale is a demonstration, not a lab reading.
 */

export const DT = 1 / 60;
export const C2 = 0.2;
export const DAMP = 0.032;
export const SEAM = 6;
export const MM = 36;

export type Field = {
  w: number;
  h: number;
  u: Float32Array;
  p: Float32Array;
  n: Float32Array;
  /** Inner edge is the high-x side (left half) or the low-x side (right). */
  innerHighX: boolean;
};

export function makeField(w: number, h: number, innerHighX: boolean): Field {
  const size = w * h;
  return {
    w,
    h,
    u: new Float32Array(size),
    p: new Float32Array(size),
    n: new Float32Array(size),
    innerHighX,
  };
}

function dampAt(f: Field, x: number): number {
  const dist = f.innerHighX ? f.w - 1 - x : x;
  if (dist >= SEAM) return DAMP;
  const t = 1 - dist / SEAM;
  return DAMP + t * t * 0.42;
}

export function step(f: Field): void {
  const { w, h, u, p, n } = f;
  for (let y = 0; y < h; y++) {
    const y0 = y * w;
    const yu = Math.max(0, y - 1) * w;
    const yd = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) {
      const i = y0 + x;
      const xl = u[y0 + Math.max(0, x - 1)];
      const xr = u[y0 + Math.min(w - 1, x + 1)];
      const lap = xl + xr + u[yu + x] + u[yd + x] - 4 * u[i];
      const dist = f.innerHighX ? w - 1 - x : x;
      const c2 = dist >= SEAM ? C2 : C2 * (0.35 + 0.65 * (dist / SEAM));
      const next = (2 * u[i] - p[i] + c2 * lap) * (1 - dampAt(f, x));
      n[i] = next < -1.6 ? -1.6 : next > 0.55 ? 0.55 : next;
    }
  }
  f.p = u;
  f.u = n;
  f.n = p;
}

/** Hold a body-shaped dent. Velocity is killed under the weight so it sits. */
export function hold(
  f: Field,
  cx: number,
  cy: number,
  radius: number,
  depth: number,
): void {
  const { w, h, u, p } = f;
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(w - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(h - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = (y - cy) * 1.15;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const fall = Math.exp(-d2 / (r2 * 0.38));
      const target = -depth * fall;
      const i = y * w + x;
      if (u[i] > target) {
        u[i] = target;
        p[i] = target;
      }
    }
  }
}

export function peak(f: Field): number {
  let m = 0;
  const { u } = f;
  for (let i = 0; i < u.length; i++) {
    const a = u[i] < 0 ? -u[i] : u[i];
    if (a > m) m = a;
  }
  return m;
}

export function sample(f: Field, x: number, y: number): number {
  const { w, h, u } = f;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x > w - 1.001) x = w - 1.001;
  if (y > h - 1.001) y = h - 1.001;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const i = y0 * w + x0;
  const a = u[i];
  const b = u[i + 1];
  const c = u[i + w];
  const d = u[i + w + 1];
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

/** Static quilt — visual rest shape, not simulated. */
export function quilt(x: number, y: number, w: number, h: number): number {
  const qx = Math.cos((x / w) * Math.PI * 8);
  const qy = Math.cos((y / h) * Math.PI * 6);
  return qx * qy * 0.09;
}
