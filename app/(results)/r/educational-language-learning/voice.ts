import { formantsFor, type Point, type Syllable, phraseContour } from "./linguistics";
import { MID_VOICE, chaoToHz, yinPitch, type Register } from "./pitch";

let ctx: AudioContext | null = null;

export function audio(): AudioContext {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
  }
  return ctx;
}

export async function resume(): Promise<AudioContext> {
  const c = audio();
  if (c.state === "suspended") await c.resume();
  return c;
}

export function playContour(
  points: Point[],
  opts: {
    duration: number;
    register?: Register;
    formants?: [number, number, number];
  },
): void {
  if (points.length < 2) return;
  const c = audio();
  if (c.state === "suspended") void c.resume();
  const register = opts.register ?? MID_VOICE;
  const formants = opts.formants ?? [750, 1180, 2400];
  const now = c.currentTime;
  const dur = opts.duration;

  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const f1 = c.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.value = formants[0];
  f1.Q.value = 7;
  const f2 = c.createBiquadFilter();
  f2.type = "bandpass";
  f2.frequency.value = formants[1];
  f2.Q.value = 6;
  const f3 = c.createBiquadFilter();
  f3.type = "lowpass";
  f3.frequency.value = formants[2];
  const mix = c.createGain();
  const out = c.createGain();
  osc.connect(f1);
  osc.connect(f2);
  f1.connect(mix);
  f2.connect(mix);
  mix.connect(f3);
  f3.connect(out);
  out.connect(c.destination);

  mix.gain.value = 0.55;
  const peak = 0.16;
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(peak, now + 0.035);
  out.gain.setValueAtTime(peak * 0.92, now + dur - 0.07);
  out.gain.linearRampToValueAtTime(0, now + dur);

  const t0 = points[0]?.t ?? 0;
  const t1 = points[points.length - 1]?.t ?? 1;
  const span = t1 - t0 || 1;
  osc.frequency.setValueAtTime(chaoToHz(points[0]?.y ?? 3, register), now);
  for (const p of points) {
    const t = now + ((p.t - t0) / span) * dur;
    osc.frequency.linearRampToValueAtTime(chaoToHz(p.y, register), t);
  }

  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function playItem(syllables: Syllable[], register: Register = MID_VOICE): void {
  const contour = phraseContour(syllables);
  const n = syllables.length;
  const hasNeutral = syllables.some((s) => s.underlying === 0);
  const duration = Math.min(2.4, 0.42 * n + (hasNeutral ? 0.05 : 0.12));
  const py = syllables.map((s) => s.py).join("");
  playContour(contour, { duration, register, formants: formantsFor(py) });
}

export type MicHandle = {
  stop: () => void;
};

export async function openMic(
  onFrame: (hz: number | null, rms: number) => void,
): Promise<MicHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  });
  const c = await resume();
  const src = c.createMediaStreamSource(stream);
  const analyser = c.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0;
  src.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let alive = true;
  const tick = () => {
    if (!alive) return;
    analyser.getFloatTimeDomainData(buf);
    let rms = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i] ?? 0;
      rms += v * v;
    }
    rms = Math.sqrt(rms / buf.length);
    onFrame(yinPitch(buf, c.sampleRate), rms);
    raf = requestAnimationFrame(tick);
  };
  let raf = requestAnimationFrame(tick);
  return {
    stop: () => {
      alive = false;
      cancelAnimationFrame(raf);
      src.disconnect();
      analyser.disconnect();
      for (const track of stream.getTracks()) track.stop();
    },
  };
}
