/**
 * Almost nothing. Glass, flour, a jug, a distant oven.
 * The context is created only from inside a gesture.
 */

type WithLegacy = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function noise(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last += (w - last) * 0.12;
    d[i] = last * 2.2 + w * 0.15;
  }
  return buf;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dust: AudioBuffer | null = null;

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.dust = noise(ctx, 1.2);
    const master = ctx.createGain();
    master.gain.value = 0.42;
    master.connect(ctx.destination);
    this.master = master;
  }

  private out() {
    return this.master;
  }

  lid() {
    const ctx = this.ctx;
    const dest = this.out();
    if (!ctx || !dest) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.18);
    f.type = "bandpass";
    f.frequency.value = 900;
    f.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(f);
    f.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  feed() {
    const ctx = this.ctx;
    const dest = this.out();
    const dust = this.dust;
    if (!ctx || !dest || !dust) return;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = dust;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);

    const clink = ctx.createOscillator();
    const cg = ctx.createGain();
    clink.type = "triangle";
    clink.frequency.setValueAtTime(440, t + 0.16);
    clink.frequency.exponentialRampToValueAtTime(210, t + 0.4);
    cg.gain.setValueAtTime(0.0001, t + 0.16);
    cg.gain.exponentialRampToValueAtTime(0.12, t + 0.18);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    clink.connect(cg);
    cg.connect(dest);
    clink.start(t + 0.16);
    clink.stop(t + 0.48);
  }

  setDown() {
    const ctx = this.ctx;
    const dest = this.out();
    if (!ctx || !dest) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  oven() {
    const ctx = this.ctx;
    const dest = this.out();
    const dust = this.dust;
    if (!ctx || !dest || !dust) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = dust;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 280;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
  }
}
