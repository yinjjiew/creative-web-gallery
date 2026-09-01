/**
 * Levee — sound.
 *
 * A parish under a rise is not loud. Brown water, a little wind in the cane,
 * the dry knock of stone, the tear of a cut. Created only from inside a
 * gesture; after that the mix is a readout of stage, not a score.
 */

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private river: GainNode | null = null;
  private riverFilter: BiquadFilterNode | null = null;
  private muted = false;

  get ready() {
    return !!this.ctx;
  }

  /** Must be called from inside a gesture. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    type WithLegacy = typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.noise = brown(ctx, 4);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.7;
    master.connect(ctx.destination);
    this.master = master;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    const g = ctx.createGain();
    g.gain.value = 0.028;
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start();
    this.river = g;
    this.riverFilter = lp;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.06);
    }
  }

  setStage(stage: number) {
    if (!this.ctx || !this.river || !this.riverFilter) return;
    const t = this.ctx.currentTime;
    const k = Math.max(0, Math.min(1, (stage - 1.2) / 2.1));
    this.river.gain.setTargetAtTime(0.022 + k * 0.045, t, 0.4);
    this.riverFilter.frequency.setTargetAtTime(150 + k * 220, t, 0.5);
  }

  play(kind: "raise" | "brace" | "cut" | "send" | "pulse" | "breach" | "overtop" | "drown" | "end" | "refuse") {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const t = ctx.currentTime + 0.01;
    if (kind === "raise") {
      this.burst(t, 0.16, 0.14, "lowpass", 420, 0.8, 160);
      this.tone(t, 0.12, 0.04, 110, 80, "triangle");
    } else if (kind === "brace") {
      this.burst(t, 0.09, 0.1, "bandpass", 520, 1.6, 240);
      this.tone(t, 0.14, 0.035, 90, 70, "sine");
    } else if (kind === "cut") {
      this.burst(t, 0.28, 0.16, "bandpass", 380, 0.9, 90);
      this.burst(t + 0.04, 0.4, 0.1, "lowpass", 200, 0.6, 70);
    } else if (kind === "send") {
      this.tone(t, 0.55, 0.035, 392, 388, "sine");
    } else if (kind === "pulse") {
      this.burst(t, 0.55, 0.08, "lowpass", 140, 0.5, 70);
    } else if (kind === "breach") {
      this.burst(t, 0.7, 0.2, "lowpass", 180, 0.55, 50);
      this.tone(t, 0.8, 0.06, 64, 36, "sine");
    } else if (kind === "overtop") {
      this.burst(t, 0.22, 0.05, "highpass", 900, 0.5, 400);
    } else if (kind === "drown") {
      this.tone(t, 1.1, 0.05, 98, 72, "sine");
    } else if (kind === "end") {
      this.tone(t, 1.4, 0.04, 196, 194, "sine");
    } else if (kind === "refuse") {
      this.burst(t, 0.05, 0.06, "bandpass", 1400, 3.2);
    }
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
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
    src.playbackRate.value = 0.7 + Math.random() * 0.3;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweep), when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.012);
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
    type: OscillatorType
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + dur + 0.04);
  }
}

function brown(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.4;
  }
  return buf;
}
