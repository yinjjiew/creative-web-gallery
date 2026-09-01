/**
 * Slalom — sound, entirely synthesized.
 *
 * Wind tracks speed. The edge hiss tracks lean. A gate is bamboo on a cable,
 * a clip is the same knock with more body, the finish is two quiet tones.
 * The context is only ever constructed from inside a user gesture.
 */

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.05 * w) / 1.05;
    d[i] = last * 3.4 + w * 0.28;
  }
  return buf;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private edgeGain: GainNode | null = null;
  private edgeFilter: BiquadFilterNode | null = null;
  private muted = false;

  get ready() {
    return !!this.ctx;
  }

  /** Must be called from inside a gesture handler. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    type WithLegacy = typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.noise = noiseBuffer(ctx, 3.2);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.82;
    master.connect(ctx.destination);
    this.master = master;

    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.value = 380;
    wf.Q.value = 0.7;
    const wg = ctx.createGain();
    wg.gain.value = 0;
    wind.connect(wf);
    wf.connect(wg);
    wg.connect(master);
    wind.start();
    this.windGain = wg;
    this.windFilter = wf;

    const edge = ctx.createBufferSource();
    edge.buffer = this.noise;
    edge.loop = true;
    const ef = ctx.createBiquadFilter();
    ef.type = "highpass";
    ef.frequency.value = 1400;
    ef.Q.value = 0.8;
    const eg = ctx.createGain();
    eg.gain.value = 0;
    edge.connect(ef);
    ef.connect(eg);
    eg.connect(master);
    edge.start();
    this.edgeGain = eg;
    this.edgeFilter = ef;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.82, this.ctx.currentTime, 0.05);
    }
  }

  update(speed: number, lean: number, racing: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.windGain || !this.windFilter || !this.edgeGain || !this.edgeFilter) return;
    const now = ctx.currentTime;
    const n = clamp(speed / 16, 0, 1.3);
    const live = racing ? 1 : 0.22;
    this.windGain.gain.setTargetAtTime(0.015 + n * n * 0.09 * live, now, 0.08);
    this.windFilter.frequency.setTargetAtTime(280 + n * 720, now, 0.1);
    const edge = Math.abs(lean) * n;
    this.edgeGain.gain.setTargetAtTime(edge * edge * 0.055 * live, now, 0.06);
    this.edgeFilter.frequency.setTargetAtTime(1100 + edge * 1800, now, 0.08);
  }

  private burst(
    when: number,
    dur: number,
    gain: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    sweepTo?: number,
    pan = 0
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.9 + Math.random() * 0.25;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + Math.min(0.012, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    src.connect(f);
    f.connect(g);
    g.connect(p);
    p.connect(this.master);
    src.start(when, Math.random() * 2);
    src.stop(when + dur + 0.04);
  }

  private tone(when: number, dur: number, gain: number, from: number, to: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(from, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + dur + 0.04);
  }

  drop() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.005;
    this.burst(now, 0.12, 0.22, "bandpass", 700, 1.1, 240);
    this.tone(now + 0.02, 0.28, 0.07, 140, 78);
  }

  gate(ok: boolean, pan: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.004;
    if (ok) {
      this.burst(now, 0.07, 0.2, "bandpass", 2100, 3.2, 1400, pan);
      this.burst(now, 0.04, 0.1, "highpass", 3800, 0.8, undefined, pan);
    } else {
      this.burst(now, 0.22, 0.16, "lowpass", 420, 0.8, 140, pan);
      this.tone(now, 0.35, 0.05, 110, 64);
    }
  }

  clip(pan: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.003;
    this.burst(now, 0.09, 0.28, "bandpass", 900, 1.6, 300, pan);
    this.tone(now, 0.16, 0.1, 90, 48);
  }

  finish(won: boolean | null) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    this.tone(now, 0.7, 0.09, 392, 390);
    this.tone(now + 0.12, 0.9, won === false ? 0.05 : 0.08, won === false ? 330 : 494, won === false ? 196 : 492);
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
