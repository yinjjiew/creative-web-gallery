import type { Point } from "./linguistics";

/** YIN (de Cheveigné & Kawahara 2002), implemented for a single analysis frame. */
export function yinPitch(buf: Float32Array, sampleRate: number, threshold = 0.13): number | null {
  const n = buf.length;
  if (n < 64) return null;
  let rms = 0;
  for (let i = 0; i < n; i++) {
    const v = buf[i] ?? 0;
    rms += v * v;
  }
  rms = Math.sqrt(rms / n);
  if (rms < 0.012) return null;

  const tauMin = Math.max(2, Math.floor(sampleRate / 420));
  const tauMax = Math.min(Math.floor(sampleRate / 70), Math.floor(n / 2));
  if (tauMax <= tauMin + 2) return null;

  const d = new Float32Array(tauMax + 1);
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let sum = 0;
    const lim = n - tau;
    for (let i = 0; i < lim; i++) {
      const diff = (buf[i] ?? 0) - (buf[i + tau] ?? 0);
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau] ?? 0;
    cmnd[tau] = ((d[tau] ?? 0) * tau) / (run || 1);
  }

  let tau = tauMin;
  let found = false;
  for (; tau <= tauMax; tau++) {
    if ((cmnd[tau] ?? 1) < threshold) {
      while (tau + 1 <= tauMax && (cmnd[tau + 1] ?? 1) < (cmnd[tau] ?? 1)) tau++;
      found = true;
      break;
    }
  }
  if (!found || (cmnd[tau] ?? 1) >= threshold) return null;

  const s0 = cmnd[tau - 1] ?? cmnd[tau] ?? 1;
  const s1 = cmnd[tau] ?? 1;
  const s2 = cmnd[tau + 1] ?? cmnd[tau] ?? 1;
  const denom = 2 * (2 * s1 - s0 - s2);
  const better = denom === 0 ? tau : tau + (s2 - s0) / denom;
  if (better <= 0) return null;
  return sampleRate / better;
}

export type Register = { lo: number; hi: number };

export function hzToChao(hz: number, register: Register): number {
  const lo = Math.log2(register.lo);
  const hi = Math.log2(register.hi);
  if (hi <= lo) return 3;
  const u = (Math.log2(hz) - lo) / (hi - lo);
  return 1 + 4 * Math.min(1, Math.max(0, u));
}

export function chaoToHz(y: number, register: Register): number {
  const u = (y - 1) / 4;
  return register.lo * Math.pow(register.hi / register.lo, u);
}

/** Default pedagogical voice — mid, used only for playback, never as a target pitch. */
export const MID_VOICE: Register = { lo: 145, hi: 290 };
export const LOW_VOICE: Register = { lo: 95, hi: 190 };
export const HIGH_VOICE: Register = { lo: 190, hi: 380 };

export function estimateRegister(hz: number[]): Register | null {
  const clean = hz.filter((h) => h > 70 && h < 420).sort((a, b) => a - b);
  if (clean.length < 12) return null;
  const lo = clean[Math.floor(clean.length * 0.08)] ?? clean[0] ?? 120;
  const hi = clean[Math.min(clean.length - 1, Math.floor(clean.length * 0.92))] ?? clean[clean.length - 1] ?? 240;
  if (hi / lo < 1.25) {
    const mid = Math.sqrt(lo * hi);
    return { lo: mid / 1.35, hi: mid * 1.35 };
  }
  return { lo: lo * 0.96, hi: hi * 1.04 };
}

export function medianFilter(points: Point[], span = 3): Point[] {
  if (points.length < 3) return points;
  const half = Math.floor(span / 2);
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - half), i + half + 1).map((q) => q.y).sort((a, b) => a - b);
    const mid = slice[Math.floor(slice.length / 2)] ?? p.y;
    return { t: p.t, y: mid };
  });
}

export function normalizeTimes(points: Point[]): Point[] {
  if (points.length === 0) return [];
  const t0 = points[0]?.t ?? 0;
  const t1 = points[points.length - 1]?.t ?? 1;
  const span = t1 - t0 || 1;
  return points.map((p) => ({ t: (p.t - t0) / span, y: p.y }));
}
