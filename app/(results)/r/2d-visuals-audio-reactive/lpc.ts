/**
 * Linear predictive coding and formant picking.
 *
 * Pre-emphasis, Hamming window, autocorrelation, Levinson–Durbin, then peaks
 * of the all-pole envelope. The same sound has to produce the same poles —
 * that stability is the whole claim of the piece.
 */

export const LPC_ORDER = 14;
export const WORK_SR = 16000;
export const FRAME_SAMPLES = 400; // 25 ms at 16 kHz
export const ENV_BINS = 512;
export const ENV_NYQUIST = 4000;

const PRE_EMPH = 0.97;

export type Peak = { freq: number; mag: number };

export type LpcFrame = {
  ok: boolean;
  rms: number;
  gain: number;
  envelope: Float32Array;
  peaks: Peak[];
  f1: number;
  f2: number;
  f3: number;
};

const emptyEnv = () => new Float32Array(ENV_BINS);

export function emptyFrame(): LpcFrame {
  return {
    ok: false,
    rms: 0,
    gain: 0,
    envelope: emptyEnv(),
    peaks: [],
    f1: 0,
    f2: 0,
    f3: 0,
  };
}

export function downsample(
  input: Float32Array,
  inSr: number,
  outSr: number = WORK_SR,
): Float32Array {
  if (inSr <= 0 || input.length < 8) return input;
  if (Math.abs(inSr - outSr) < 1) return input;
  const ratio = inSr / outSr;
  const n = Math.floor(input.length / ratio);
  const out = new Float32Array(n);
  const half = Math.max(1, ratio * 0.5);
  for (let i = 0; i < n; i++) {
    const center = i * ratio;
    const lo = Math.max(0, Math.floor(center - half));
    const hi = Math.min(input.length - 1, Math.ceil(center + half));
    let s = 0;
    let w = 0;
    for (let j = lo; j <= hi; j++) {
      const wt = 1 - Math.abs(j - center) / (half + 1);
      if (wt <= 0) continue;
      s += input[j]! * wt;
      w += wt;
    }
    out[i] = w > 0 ? s / w : 0;
  }
  return out;
}

function hamming(n: number, i: number) {
  return 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
}

function levinsonDurbin(
  r: Float64Array,
  order: number,
): { a: Float64Array; err: number; stable: boolean } {
  const a = new Float64Array(order + 1);
  const next = new Float64Array(order + 1);
  a[0] = 1;
  let err = r[0]!;
  if (!(err > 1e-12)) return { a, err: 0, stable: false };

  for (let i = 1; i <= order; i++) {
    let k = r[i]!;
    for (let j = 1; j < i; j++) k -= a[j]! * r[i - j]!;
    k /= err;
    if (!Number.isFinite(k)) {
      return { a, err, stable: i > 2 };
    }
    if (Math.abs(k) >= 0.995) k = Math.sign(k) * 0.995;
    next[i] = k;
    for (let j = 1; j < i; j++) next[j] = a[j]! - k * a[i - j]!;
    for (let j = 1; j <= i; j++) a[j] = next[j]!;
    err *= 1 - k * k;
    if (!(err > 1e-16)) return { a, err, stable: true };
  }
  return { a, err, stable: true };
}

/** Prediction-error polynomial: A(z) = 1 − Σ a[k] z^{−k}. */
function evaluateEnvelope(
  a: Float64Array,
  gain: number,
  bins: number,
  sr: number,
  fMax: number,
): Float32Array {
  const env = new Float32Array(bins);
  const p = a.length - 1;
  for (let i = 0; i < bins; i++) {
    const freq = (i / (bins - 1)) * fMax;
    const w = (2 * Math.PI * freq) / sr;
    let re = 1;
    let im = 0;
    for (let k = 1; k <= p; k++) {
      re -= a[k]! * Math.cos(w * k);
      im += a[k]! * Math.sin(w * k);
    }
    const den = Math.hypot(re, im);
    env[i] = den > 1e-12 ? gain / den : 0;
  }
  return env;
}

function logMag(env: Float32Array): Float32Array {
  const out = new Float32Array(env.length);
  for (let i = 0; i < env.length; i++) {
    out[i] = Math.log10(env[i]! + 1e-8);
  }
  return out;
}

function pickPeaks(logEnv: Float32Array, fMax: number): Peak[] {
  const peaks: Peak[] = [];
  const n = logEnv.length;
  if (n < 8) return peaks;

  for (let i = 2; i < n - 2; i++) {
    const y = logEnv[i]!;
    if (y < logEnv[i - 1]! || y <= logEnv[i + 1]!) continue;
    if (y < logEnv[i - 2]! && y < logEnv[i + 2]!) continue;

    let left = y;
    for (let j = i - 1; j >= 1 && logEnv[j]! <= logEnv[j + 1]!; j--) {
      left = Math.min(left, logEnv[j]!);
    }
    let right = y;
    for (let j = i + 1; j < n - 1 && logEnv[j]! <= logEnv[j - 1]!; j++) {
      right = Math.min(right, logEnv[j]!);
    }
    const prominence = y - Math.max(left, right);
    if (prominence < 0.07) continue;

    const y1 = logEnv[i - 1]!;
    const y3 = logEnv[i + 1]!;
    const denom = y1 - 2 * y + y3;
    const delta = denom !== 0 ? (0.5 * (y1 - y3)) / denom : 0;
    const bin = i + Math.max(-0.49, Math.min(0.49, delta));
    const freq = (bin / (n - 1)) * fMax;
    if (freq < 150 || freq > 4300) continue;
    peaks.push({ freq, mag: y });
  }

  const thinned: Peak[] = [];
  for (const p of peaks) {
    const last = thinned[thinned.length - 1];
    if (last && p.freq - last.freq < 140) {
      if (p.mag > last.mag) thinned[thinned.length - 1] = p;
    } else {
      thinned.push(p);
    }
  }
  return thinned;
}

function assignFormants(peaks: Peak[]): { f1: number; f2: number; f3: number } {
  const usable = peaks.filter((p) => p.freq >= 180 && p.freq <= 4300);
  let f1 = 0;
  let f2 = 0;
  let f3 = 0;
  for (const p of usable) {
    if (!f1 && p.freq >= 200 && p.freq <= 1150) {
      f1 = p.freq;
      continue;
    }
    if (f1 && !f2 && p.freq >= 600 && p.freq <= 3300 && p.freq > f1 + 160) {
      f2 = p.freq;
      continue;
    }
    if (f2 && !f3 && p.freq >= 1600 && p.freq <= 4300 && p.freq > f2 + 180) {
      f3 = p.freq;
    }
  }
  return { f1, f2, f3 };
}

export function analyseLpc(
  time: Float32Array,
  sampleRate: number,
): LpcFrame {
  const blank = emptyFrame();
  const work = downsample(time, sampleRate, WORK_SR);
  if (work.length < FRAME_SAMPLES) return blank;

  const start = work.length - FRAME_SAMPLES;
  let dc = 0;
  for (let i = 0; i < FRAME_SAMPLES; i++) dc += work[start + i]!;
  dc /= FRAME_SAMPLES;

  const frame = new Float64Array(FRAME_SAMPLES);
  let prev = (start > 0 ? work[start - 1]! : work[start]!) - dc;
  let sumSq = 0;
  for (let i = 0; i < FRAME_SAMPLES; i++) {
    const x = work[start + i]! - dc;
    const pre = x - PRE_EMPH * prev;
    prev = x;
    const y = pre * hamming(FRAME_SAMPLES, i);
    frame[i] = y;
    sumSq += y * y;
  }
  const rms = Math.sqrt(Math.max(0, sumSq / FRAME_SAMPLES));
  blank.rms = rms;
  if (rms < 0.0024) return blank;

  const r = new Float64Array(LPC_ORDER + 1);
  for (let k = 0; k <= LPC_ORDER; k++) {
    let acc = 0;
    for (let n = 0; n < FRAME_SAMPLES - k; n++) {
      acc += frame[n]! * frame[n + k]!;
    }
    r[k] = acc;
  }
  r[0]! *= 1.001;

  const { a, err, stable } = levinsonDurbin(r, LPC_ORDER);
  if (!stable) return blank;

  const gain = Math.sqrt(Math.max(err, 0));
  const linear = evaluateEnvelope(a, gain, ENV_BINS, WORK_SR, ENV_NYQUIST);
  const envelope = logMag(linear);
  const peaks = pickPeaks(envelope, ENV_NYQUIST);
  const { f1, f2, f3 } = assignFormants(peaks);

  const ok = f1 >= 200 && f1 <= 1100 && f2 >= 650 && f2 <= 3300 && f2 > f1 + 150;

  return { ok, rms, gain, envelope, peaks, f1, f2, f3 };
}
