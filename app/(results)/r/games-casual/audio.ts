/**
 * Skip — every sound is synthesized.
 *
 * Water contact is most of the quality of this game, so the skip voice is
 * parametric: speed brightens it, attack chooses slap versus kiss, and later
 * hops ring longer than the first. The context is created only from inside
 * a gesture.
 */
import type { Ev, Game } from "./sim";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.08 * w) / 1.08;
    d[i] = last * 3.4 + w * 0.22;
  }
  return buf;
}

function lakeImpulse(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.pow(1 - t, 2.2);
      const w = Math.random() * 2 - 1;
      lp += (w - lp) * (0.28 - 0.18 * t);
      d[i] = lp * env;
    }
  }
  return buf;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private lapGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
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
    const Ctor =
      window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.noise = noiseBuffer(ctx, 4);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.86;
    master.connect(ctx.destination);
    this.master = master;

    const conv = ctx.createConvolver();
    conv.buffer = lakeImpulse(ctx, 1.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.42;
    wet.connect(conv);
    conv.connect(master);
    this.wet = wet;

    const lap = ctx.createBufferSource();
    lap.buffer = this.noise;
    lap.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 280;
    const lg = ctx.createGain();
    lg.gain.value = 0.028;
    lap.connect(lp);
    lp.connect(lg);
    lg.connect(master);
    lap.start();
    this.lapGain = lg;

    const breath = ctx.createOscillator();
    breath.frequency.value = 0.09;
    const ba = ctx.createGain();
    ba.gain.value = 0.01;
    breath.connect(ba);
    ba.connect(lg.gain);
    breath.start();

    const whoosh = ctx.createBufferSource();
    whoosh.buffer = this.noise;
    whoosh.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.value = 520;
    wf.Q.value = 0.8;
    const wg = ctx.createGain();
    wg.gain.value = 0;
    whoosh.connect(wf);
    wf.connect(wg);
    wg.connect(master);
    whoosh.start();
    this.windGain = wg;
    this.windFilter = wf;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.86, this.ctx.currentTime, 0.05);
    }
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
    if (!ctx || !this.noise || !this.master || !this.wet) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.35;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + Math.min(0.01, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    src.connect(f);
    f.connect(g);
    g.connect(p);
    p.connect(this.master);
    p.connect(this.wet);
    src.start(when, Math.random() * 3);
    src.stop(when + dur + 0.04);
  }

  private tone(
    when: number,
    dur: number,
    gain: number,
    from: number,
    to: number,
    type: OscillatorType = "sine",
    pan = 0
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.wet) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    o.connect(g);
    g.connect(p);
    p.connect(this.master);
    p.connect(this.wet);
    o.start(when);
    o.stop(when + dur + 0.04);
  }

  update(g: Game) {
    const ctx = this.ctx;
    if (!ctx || !this.windGain || !this.windFilter || !this.lapGain) return;
    const now = ctx.currentTime;
    if (g.phase === "wind") {
      const p = g.power;
      this.windGain.gain.setTargetAtTime(0.02 + p * 0.055, now, 0.08);
      this.windFilter.frequency.setTargetAtTime(360 + p * 900, now, 0.1);
    } else if (g.phase === "flight") {
      const v = Math.hypot(g.body.vx, g.body.vy, g.body.vz);
      const n = clamp(v / 12, 0, 1);
      this.windGain.gain.setTargetAtTime(0.012 + n * 0.04, now, 0.12);
      this.windFilter.frequency.setTargetAtTime(480 + n * 1400, now, 0.12);
    } else {
      this.windGain.gain.setTargetAtTime(0.004, now, 0.2);
    }
    const chop = g.water.chop;
    this.lapGain.gain.setTargetAtTime(0.022 + chop * 0.12, now, 0.4);
  }

  handle(events: Ev[], g: Game) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.004;
    const panOf = (x: number) => clamp((x - 8) / 18, -0.7, 0.75);

    for (const e of events) {
      switch (e.type) {
        case "pickup": {
          this.burst(now, 0.08, 0.12, "bandpass", 1400, 1.1, 700, -0.25);
          this.tone(now, 0.18, 0.04, 220, 140, "triangle", -0.25);
          break;
        }
        case "release": {
          const k = clamp(e.speed / 12, 0.2, 1);
          this.burst(now, 0.16, 0.1 + 0.12 * k, "highpass", 1800, 0.7, undefined, -0.2);
          this.burst(now, 0.28, 0.06 + 0.08 * k, "bandpass", 700, 0.9, 320, -0.15);
          break;
        }
        case "skip": {
          const pan = panOf(e.x);
          const k = clamp(e.speed / 11, 0.25, 1.15);
          const a = clamp(e.attack / (20 * Math.PI / 180), 0.4, 1.6);
          const n = e.index;
          // Later hops are the point: brighter tick, longer ring.
          const shine = 0.55 + Math.min(0.55, n * 0.045);
          const kiss = a < 0.85 ? 0.7 : a > 1.35 ? 1.2 : 1;
          this.burst(
            now,
            0.045 + 0.02 * k,
            (0.22 + 0.2 * k) * shine,
            "bandpass",
            1400 + 900 * k * (2.1 - kiss),
            1.3,
            700 + 200 * k,
            pan
          );
          this.burst(
            now,
            0.014,
            0.16 + 0.14 * k,
            "highpass",
            3600 + 800 * k,
            0.7,
            undefined,
            pan
          );
          this.burst(
            now,
            0.22 + 0.08 * k,
            0.1 + 0.08 * k,
            "lowpass",
            420,
            0.7,
            160,
            pan
          );
          const plink = 420 + n * 36 + k * 80;
          this.tone(
            now,
            0.16 + Math.min(0.22, n * 0.018),
            (0.07 + 0.045 * k) * shine,
            plink,
            plink * 0.62,
            "sine",
            pan
          );
          this.tone(
            now + 0.012,
            0.34 + Math.min(0.4, n * 0.025),
            0.03 + 0.02 * shine,
            plink * 1.5,
            plink * 0.7,
            "triangle",
            pan
          );
          if (n >= 8) {
            this.burst(now + 0.02, 0.7, 0.06 + 0.01 * n, "lowpass", 640, 0.5, 220, pan * 0.5);
          }
          break;
        }
        case "plough": {
          const pan = panOf(e.x);
          this.burst(now, 0.28, 0.38, "lowpass", 380, 0.7, 90, pan);
          this.burst(now, 0.12, 0.22, "bandpass", 700, 1.1, 240, pan);
          this.tone(now, 0.4, 0.16, 72, 36, "sine", pan);
          break;
        }
        case "flat": {
          const pan = panOf(e.x);
          this.burst(now, 0.18, 0.2, "lowpass", 520, 0.8, 180, pan);
          this.burst(now, 0.08, 0.12, "bandpass", 1100, 1.4, 500, pan);
          this.tone(now, 0.22, 0.06, 180, 70, "triangle", pan);
          break;
        }
        case "tumble": {
          const pan = panOf(e.x);
          this.burst(now, 0.1, 0.18, "bandpass", 1600, 2.2, 600, pan);
          this.burst(now + 0.04, 0.12, 0.14, "bandpass", 1100, 1.8, 400, pan);
          this.burst(now + 0.08, 0.28, 0.2, "lowpass", 340, 0.7, 100, pan);
          this.tone(now, 0.3, 0.1, 90, 40, "sine", pan);
          break;
        }
        case "sink": {
          const pan = panOf(e.x);
          this.burst(now, 0.45, 0.16, "lowpass", 240, 0.6, 70, pan);
          this.tone(now, 0.55, 0.09, 64, 28, "sine", pan);
          if (e.skips >= 8) {
            this.tone(now + 0.05, 0.9, 0.04, 196, 190, "triangle", 0);
          }
          break;
        }
        case "splash": {
          const pan = panOf(e.x);
          this.burst(
            now,
            0.12 + e.energy * 0.08,
            0.06 + e.energy * 0.08,
            "highpass",
            2200,
            0.6,
            undefined,
            pan
          );
          break;
        }
      }
    }
    void g;
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
