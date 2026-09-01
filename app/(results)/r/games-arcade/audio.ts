/**
 * Semaphore — every sound is synthesized.
 *
 * Levers, bells, a train on a diamond: these are mechanical voices and they
 * should change with force and state. The context is created only from inside
 * a gesture, then the mix is a readout of the frame rather than a soundtrack
 * laid over it.
 */
import type { Ev, Game } from "./engine";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.07 * w) / 1.07;
    d[i] = last * 3.1 + w * 0.28;
  }
  return buf;
}

function metalImpulse(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.pow(1 - t, 3.1);
      const w = Math.random() * 2 - 1;
      lp += (w - lp) * (0.55 - 0.4 * t);
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
  private room: GainNode | null = null;
  private rattleGain: GainNode | null = null;
  private rattleFilter: BiquadFilterNode | null = null;
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
    this.noise = noiseBuffer(ctx, 3.6);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.82;
    master.connect(ctx.destination);
    this.master = master;

    const conv = ctx.createConvolver();
    conv.buffer = metalImpulse(ctx, 1.15);
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    wet.connect(conv);
    conv.connect(master);
    this.wet = wet;

    /* The box is never silent: a stove, timber, a little wind in the eaves. */
    const room = ctx.createBufferSource();
    room.buffer = this.noise;
    room.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    const rg = ctx.createGain();
    rg.gain.value = 0.034;
    room.connect(lp);
    lp.connect(rg);
    rg.connect(master);
    room.start();
    this.room = rg;

    const rattle = ctx.createBufferSource();
    rattle.buffer = this.noise;
    rattle.loop = true;
    const rf = ctx.createBiquadFilter();
    rf.type = "bandpass";
    rf.frequency.value = 380;
    rf.Q.value = 1.6;
    const rgg = ctx.createGain();
    rgg.gain.value = 0;
    rattle.connect(rf);
    rf.connect(rgg);
    rgg.connect(master);
    rgg.connect(wet);
    rattle.start();
    this.rattleGain = rgg;
    this.rattleFilter = rf;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.82, this.ctx.currentTime, 0.05);
    }
  }

  private burst(
    when: number,
    dur: number,
    gain: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    sweep?: number,
    pan = 0
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.master || !this.wet) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.78 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + Math.min(0.012, dur * 0.22));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    src.connect(f);
    f.connect(g);
    g.connect(p);
    p.connect(this.master);
    p.connect(this.wet);
    src.start(when, Math.random() * 2.4);
    src.stop(when + dur + 0.05);
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
    g.gain.linearRampToValueAtTime(gain, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    o.connect(g);
    g.connect(p);
    p.connect(this.master);
    p.connect(this.wet);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /** Block bell: a real single-stroke, not a sample. */
  private bell(when: number, n: number, gap: number, bright: number) {
    for (let i = 0; i < n; i++) {
      const t = when + i * gap;
      this.tone(t, 0.85, 0.07 + 0.02 * bright, 880 + bright * 40, 868, "sine", 0.15);
      this.tone(t + 0.006, 0.55, 0.035, 1320, 1300, "sine", 0.2);
      this.burst(t, 0.08, 0.06, "highpass", 2400, 0.7, undefined, 0.15);
    }
  }

  update(g: Game) {
    const ctx = this.ctx;
    if (!ctx || !this.rattleGain || !this.rattleFilter) return;
    const now = ctx.currentTime;
    let rattle = 0;
    let bright = 380;
    let diverge = false;
    for (const tr of g.trains) {
      if (!tr.entered) continue;
      const k = tr.cls === "goods" ? 1.15 : tr.cls === "express" ? 0.85 : 1;
      rattle = Math.max(rattle, k);
      if (tr.to !== (tr.from === "A" ? "C" : tr.from === "C" ? "A" : tr.from === "B" ? "D" : "B")) {
        diverge = true;
      }
    }
    if (g.phase === "dead") rattle *= 0.2;
    this.rattleGain.gain.setTargetAtTime(rattle * 0.09, now, 0.08);
    this.rattleFilter.frequency.setTargetAtTime(
      bright + (diverge ? 220 : 0) + rattle * 80,
      now,
      0.1
    );
    if (this.room) {
      this.room.gain.setTargetAtTime(g.fog ? 0.05 : 0.034, now, 0.4);
    }
  }

  handle(events: Ev[]) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.004;

    for (const e of events) {
      switch (e.type) {
        case "pull": {
          const pan = (e.i - 3.5) / 5;
          if (e.locked) {
            // The catch dog: a dry refusal.
            this.burst(now, 0.07, 0.22, "bandpass", 1400, 4.2, 900, pan);
            this.tone(now, 0.09, 0.06, 190, 140, "triangle", pan);
          } else {
            // Iron sliding in a quadrant, weight in the hand.
            this.burst(now, 0.22, 0.16 * e.force, "lowpass", 280, 0.8, 140, pan);
            this.tone(now, 0.28, 0.05 * e.force, 92, 70, "triangle", pan);
            this.burst(now, 0.09, 0.1, "highpass", 1800, 0.8, undefined, pan);
          }
          break;
        }
        case "seat": {
          const pan = (e.i - 3.5) / 5;
          const k = 0.7 + e.force * 0.5;
          // The clunk the whole box is built around.
          this.burst(now, 0.07, 0.38 * k, "lowpass", 220, 1.1, 90, pan);
          this.tone(now, 0.16, 0.14 * k, 78, 48, "sine", pan);
          this.burst(now, 0.04, 0.18 * k, "bandpass", 900, 3.2, 500, pan);
          if (e.kind === "signal") {
            this.tone(now + 0.02, 0.12, 0.04, 240, 180, "triangle", pan);
          }
          break;
        }
        case "lock": {
          this.burst(now, 0.05, 0.1, "bandpass", 2100, 5, undefined, 0);
          break;
        }
        case "bell": {
          const n = e.road === "A" ? 2 : e.road === "B" ? 3 : e.road === "C" ? 2 : 1;
          const extra = e.cls === "goods" ? 1 : 0;
          const gap = e.cls === "express" ? 0.16 : 0.22;
          this.bell(now, n + extra, gap, e.cls === "express" ? 1 : 0.4);
          break;
        }
        case "enter": {
          this.burst(now, 0.4, 0.12, "lowpass", 360, 0.7, 140, 0);
          this.tone(now, 0.3, 0.05, 64, 50, "sine", 0);
          if (e.diverge) {
            this.burst(now + 0.05, 0.55, 0.1, "bandpass", 520, 2.4, 240, 0.2);
          }
          break;
        }
        case "clear": {
          this.tone(now, 0.35, 0.045, 330, 328, "sine", 0);
          break;
        }
        case "crash": {
          this.burst(now, 0.7, 0.4, "lowpass", 280, 0.6, 70, 0);
          this.burst(now, 0.18, 0.32, "bandpass", 700, 1.4, 200, 0);
          this.tone(now, 0.9, 0.16, 70, 32, "sine", 0);
          this.burst(now + 0.08, 1.1, 0.14, "highpass", 1800, 0.5, 400, 0);
          break;
        }
        case "signon": {
          this.bell(now, 1, 0.2, 0.2);
          this.tone(now + 0.12, 0.5, 0.05, 196, 194, "sine", 0);
          break;
        }
        case "retry": {
          this.burst(now, 0.1, 0.12, "bandpass", 600, 1.2, 300, 0);
          break;
        }
        case "idea": {
          this.tone(now, 0.9, 0.04, 392, 390, "sine", 0);
          break;
        }
      }
    }
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
