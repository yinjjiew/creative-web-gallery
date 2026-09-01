/**
 * Synthesized only, and only after a gesture. A low sit, then a short
 * rustle of cloth. Nothing plays for the idle demonstration.
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export function unlock(): void {
  const audio = context();
  if (audio && audio.state === "suspended") {
    void audio.resume();
  }
}

export function sit(depth: number): void {
  const audio = context();
  if (!audio) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const tone = audio.createGain();
  const filter = audio.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(42 + depth * 18, t);
  osc.frequency.exponentialRampToValueAtTime(28, t + 0.22);
  filter.type = "lowpass";
  filter.frequency.value = 160;
  const amp = 0.05 + Math.min(0.05, depth * 0.04);
  tone.gain.setValueAtTime(0.0001, t);
  tone.gain.exponentialRampToValueAtTime(amp, t + 0.018);
  tone.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  osc.connect(filter);
  filter.connect(tone);
  tone.connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.34);

  const n = 2200;
  const buffer = audio.createBuffer(1, n, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  }
  const rustle = audio.createBufferSource();
  rustle.buffer = buffer;
  const band = audio.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 720;
  band.Q.value = 0.7;
  const air = audio.createGain();
  air.gain.setValueAtTime(0.012, t);
  air.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  rustle.connect(band);
  band.connect(air);
  air.connect(audio.destination);
  rustle.start(t);
  rustle.stop(t + 0.18);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
