/**
 * Tide — water, a bell buoy, hull knocks. All synthesized.
 * The context is created only from inside a gesture.
 */

type Voice = "water" | "bell" | "hull" | "step" | "push" | "undo" | "land" | "over";

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.045 * w) / 1.045;
    d[i] = last * 2.8 + w * 0.22;
  }
  return buf;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sea: GainNode | null = null;
  private seaFilter: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;

  get ready() {
    return !!this.ctx;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    type WithLegacy = typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor =
      window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.noise = noiseBuffer(ctx, 3.5);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.72;
    master.connect(ctx.destination);
    this.master = master;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 380;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.028;
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start();
    this.sea = g;
    this.seaFilter = bp;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.72, this.ctx.currentTime, 0.06);
    }
  }

  setTide(mark: number) {
    if (!this.ctx || !this.sea || !this.seaFilter) return;
    const now = this.ctx.currentTime;
    this.sea.gain.setTargetAtTime(0.02 + mark * 0.018, now, 0.4);
    this.seaFilter.frequency.setTargetAtTime(300 + mark * 140, now, 0.45);
  }

  private burst(
    when: number,
    dur: number,
    gain: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    sweep?: number
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.35;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + Math.min(0.02, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(when, Math.random() * 2);
    src.stop(when + dur + 0.04);
  }

  private tone(
    when: number,
    dur: number,
    gain: number,
    from: number,
    to: number,
    type: OscillatorType = "sine"
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + dur + 0.04);
  }

  play(kind: Voice) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.004;
    switch (kind) {
      case "step":
        this.burst(t, 0.09, 0.16, "bandpass", 720, 1.1, 280);
        break;
      case "hull":
        this.burst(t, 0.12, 0.22, "bandpass", 420, 2.4, 180);
        this.tone(t, 0.18, 0.08, 140, 90, "triangle");
        break;
      case "water":
        this.burst(t, 0.28, 0.18, "lowpass", 640, 0.8, 220);
        break;
      case "push":
        this.burst(t, 0.16, 0.2, "bandpass", 240, 3, 140);
        this.tone(t, 0.22, 0.06, 90, 70, "triangle");
        break;
      case "bell":
        this.tone(t, 1.6, 0.09, 392, 388, "sine");
        this.tone(t + 0.02, 1.3, 0.05, 588, 580, "sine");
        this.burst(t, 0.4, 0.04, "highpass", 1800, 0.6);
        break;
      case "undo":
        this.burst(t, 0.08, 0.1, "highpass", 1600, 0.7);
        break;
      case "land":
        this.tone(t, 1.1, 0.08, 262, 260, "sine");
        this.tone(t + 0.12, 1.3, 0.06, 330, 328, "sine");
        this.burst(t, 0.5, 0.06, "lowpass", 500, 0.7);
        break;
      case "over":
        this.burst(t, 0.45, 0.24, "lowpass", 380, 0.6, 90);
        this.tone(t, 0.4, 0.07, 110, 55, "sine");
        break;
    }
  }
}
