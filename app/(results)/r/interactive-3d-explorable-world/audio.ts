/**
 * Weather, not a score. Created only from inside a gesture.
 *
 * Swell is brown noise through a low shelf. Wind is white noise through a
 * bandpass that opens with the afternoon. The optic is a slow mechanical tick.
 * The foghorn is two stacked sines, night only.
 */

type WithLegacy = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function brown(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + w * 0.02) * 0.986;
    d[i] = last * 3.4;
  }
  return buf;
}

function white(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export class Weather {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private swellGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private opticGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private lastHorn = -999;
  private lastGull = -999;
  private lastTick = 0;

  get live() {
    return this.ctx !== null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    this.master = master;
    master.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 1.4);

    const swellBuf = brown(ctx, 4);
    const swell = ctx.createBufferSource();
    swell.buffer = swellBuf;
    swell.loop = true;
    const swellFilter = ctx.createBiquadFilter();
    swellFilter.type = "lowpass";
    swellFilter.frequency.value = 180;
    swellFilter.Q.value = 0.7;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.22;
    swell.connect(swellFilter);
    swellFilter.connect(swellGain);
    swellGain.connect(master);
    swell.start();
    this.swellGain = swellGain;

    const windBuf = white(ctx, 2.4);
    const wind = ctx.createBufferSource();
    wind.buffer = windBuf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 420;
    windFilter.Q.value = 0.85;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.04;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    wind.start();
    this.windGain = windGain;
    this.windFilter = windFilter;

    const optic = ctx.createOscillator();
    optic.type = "square";
    optic.frequency.value = 48;
    const opticFilter = ctx.createBiquadFilter();
    opticFilter.type = "lowpass";
    opticFilter.frequency.value = 140;
    const opticGain = ctx.createGain();
    opticGain.gain.value = 0.0001;
    optic.connect(opticFilter);
    opticFilter.connect(opticGain);
    opticGain.connect(master);
    optic.start();
    this.opticGain = opticGain;
  }

  set(state: { wind: number; swell: number; beam: number; muted: boolean }) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const mute = state.muted ? 0 : 1;
    this.master.gain.setTargetAtTime(0.38 * mute, t, 0.12);
    this.swellGain?.gain.setTargetAtTime(0.14 + state.swell * 0.2, t, 0.4);
    this.windGain?.gain.setTargetAtTime(0.03 + state.wind * 0.11, t, 0.5);
    this.windFilter?.frequency.setTargetAtTime(280 + state.wind * 520, t, 0.6);
    this.opticGain?.gain.setTargetAtTime(state.beam > 0.4 ? 0.012 : 0.0001, t, 0.3);
  }

  tick(now: number) {
    const ctx = this.ctx;
    const dest = this.master;
    if (!ctx || !dest) return;
    if (now - this.lastTick < 4.5) return;
    this.lastTick = now;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 890;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  horn(now: number) {
    const ctx = this.ctx;
    const dest = this.master;
    if (!ctx || !dest) return;
    if (now - this.lastHorn < 11) return;
    this.lastHorn = now;
    const t = ctx.currentTime;
    for (const [freq, delay, gain] of [
      [118, 0, 0.16],
      [98, 0.08, 0.12],
    ] as const) {
      const osc = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      f.type = "lowpass";
      f.frequency.value = 420;
      const start = t + delay;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(gain, start + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.8);
      osc.connect(f);
      f.connect(g);
      g.connect(dest);
      osc.start(start);
      osc.stop(start + 2);
    }
  }

  gull(now: number) {
    const ctx = this.ctx;
    const dest = this.master;
    if (!ctx || !dest) return;
    if (now - this.lastGull < 3.2) return;
    this.lastGull = now;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(720, t);
    osc.frequency.exponentialRampToValueAtTime(1180, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.38);
    f.type = "bandpass";
    f.frequency.value = 1400;
    f.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(f);
    f.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  dispose() {
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
  }
}
