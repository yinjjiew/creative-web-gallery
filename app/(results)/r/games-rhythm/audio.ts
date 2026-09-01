/**
 * Anvil — every sound is synthesized.
 *
 * No files. The ring of struck iron is modal: inharmonic partials whose
 * frequencies climb as the piece thins and whose decay shortens as it cools.
 * That is not colour on top of the game. It is how the player hears thickness
 * and heat without looking.
 *
 * The context is created only from inside a gesture.
 */

import type { Ev, Grade } from "./engine";

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
    d[i] = last * 3.0 + w * 0.32;
  }
  return buf;
}

/** A small hard room: stone, brick, a short metallic tail. */
function shopImpulse(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.pow(1 - t, 2.8);
      const w = Math.random() * 2 - 1;
      lp += (w - lp) * (0.62 - 0.4 * t);
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
  private fireGain: GainNode | null = null;
  private fireFilter: BiquadFilterNode | null = null;
  private muted = false;
  private lastCoal = 0;

  get ready() {
    return !!this.ctx;
  }

  now() {
    return this.ctx?.currentTime ?? performance.now() / 1000;
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
    this.noise = noiseBuffer(ctx, 3.8);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.86;
    master.connect(ctx.destination);
    this.master = master;

    const conv = ctx.createConvolver();
    conv.buffer = shopImpulse(ctx, 0.85);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    wet.connect(conv);
    conv.connect(master);
    this.wet = wet;

    /* The fire: a bed of filtered noise, never silent in a working shop. */
    const fire = ctx.createBufferSource();
    fire.buffer = this.noise;
    fire.loop = true;
    const ff = ctx.createBiquadFilter();
    ff.type = "bandpass";
    ff.frequency.value = 380;
    ff.Q.value = 0.7;
    const fg = ctx.createGain();
    fg.gain.value = 0.028;
    fire.connect(ff);
    ff.connect(fg);
    fg.connect(master);
    fire.start();
    this.fireGain = fg;
    this.fireFilter = ff;

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 52;
    const dg = ctx.createGain();
    dg.gain.value = 0.02;
    drone.connect(dg);
    dg.connect(master);
    drone.start();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.86, this.ctx.currentTime, 0.05);
    }
  }

  setFire(amount: number) {
    if (!this.ctx || !this.fireGain || !this.fireFilter) return;
    const now = this.ctx.currentTime;
    this.fireGain.gain.setTargetAtTime(0.018 + amount * 0.055, now, 0.2);
    this.fireFilter.frequency.setTargetAtTime(280 + amount * 420, now, 0.25);
  }

  private burst(
    when: number,
    dur: number,
    gain: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    sweepTo?: number
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
    g.gain.linearRampToValueAtTime(gain, when + Math.min(0.008, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    g.connect(this.wet);
    src.start(when, Math.random() * 2.5);
    src.stop(when + dur + 0.04);
  }

  private partial(
    when: number,
    freq: number,
    gain: number,
    dur: number,
    type: OscillatorType = "sine"
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.wet) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(1, freq * 0.94),
      when + dur
    );
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.wet);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /**
   * The shop's count-in: a clear anvil, slightly distant, so the player's
   * own blow sits in front of it.
   */
  tick(when: number, soft = false) {
    const k = soft ? 0.38 : 1;
    this.burst(when, 0.045, 0.22 * k, "highpass", 2400, 0.7);
    this.partial(when, 812, 0.11 * k, 0.55);
    this.partial(when, 1218, 0.07 * k, 0.38);
    this.partial(when, 1840, 0.04 * k, 0.22, "triangle");
  }

  /**
   * Hammer on iron. `thin` raises the ring. `heat` lengthens it.
   * Grade dirties the partials when the blow is wrong.
   */
  strike(when: number, grade: Grade, heat: number, thin: number) {
    const trueHit = grade === "true" || grade === "fair";
    const dull = grade === "cold" || grade === "miss";
    const ringHz = 640 + thin * 720 + heat * 80;
    const decay = (0.22 + heat * 0.7) * (dull ? 0.35 : 1);
    const body = dull ? 0.22 : 0.16 + heat * 0.08;

    this.burst(when, 0.018, 0.42, "highpass", 3200, 0.6);
    this.burst(
      when,
      0.09,
      0.2,
      "bandpass",
      1400 + thin * 800,
      1.1,
      500 + thin * 200
    );
    this.partial(when, 78, body, 0.16 + heat * 0.08);
    this.partial(when, ringHz, trueHit ? 0.16 : 0.07, decay);
    this.partial(when, ringHz * 1.48, trueHit ? 0.09 : 0.03, decay * 0.7);
    this.partial(
      when,
      ringHz * 2.15,
      trueHit ? 0.045 : 0.012,
      decay * 0.45,
      "triangle"
    );
    if (dull) {
      this.burst(when, 0.14, 0.16, "lowpass", 420, 0.8, 140);
    }
    if (grade === "true") {
      this.partial(when + 0.01, ringHz * 0.5, 0.035, decay * 1.1);
    }
  }

  pull(when: number, heat: number) {
    /* Tongs, a scrape, the iron leaving the coals. */
    this.burst(when, 0.16, 0.14, "bandpass", 900, 1.4, 320);
    this.burst(when, 0.28, 0.08 + heat * 0.05, "lowpass", 260, 0.6, 80);
    this.partial(when, 110, 0.05, 0.2);
  }

  miss(when: number) {
    this.burst(when, 0.12, 0.18, "bandpass", 380, 1.2, 120);
    this.partial(when, 62, 0.1, 0.18);
  }

  extra(when: number) {
    this.burst(when, 0.08, 0.2, "highpass", 1800, 0.8);
    this.partial(when, 90, 0.08, 0.12);
  }

  quench(when: number) {
    this.burst(when, 0.9, 0.22, "highpass", 4200, 0.55, 900);
    this.burst(when, 1.3, 0.16, "bandpass", 1800, 0.7, 400);
    this.partial(when + 0.04, 420, 0.05, 0.35, "triangle");
    this.partial(when + 0.12, 280, 0.04, 0.5);
  }

  fireWhoosh(when: number) {
    this.burst(when, 0.55, 0.1, "lowpass", 340, 0.6, 90);
  }

  coal(when: number) {
    if (when - this.lastCoal < 0.8) return;
    this.lastCoal = when;
    this.burst(when, 0.07, 0.045, "bandpass", 1100 + Math.random() * 800, 2.2);
  }

  handle(evs: Ev[]) {
    if (!this.ctx) return;
    for (const e of evs) {
      switch (e.type) {
        case "tick":
          this.tick(e.when, e.soft);
          break;
        case "strike":
          this.strike(e.when, e.grade, e.heat, e.thin);
          break;
        case "miss":
          this.miss(e.when);
          break;
        case "extra":
          this.extra(e.when);
          break;
        case "pull":
          this.pull(e.when, e.heat);
          break;
        case "fire":
          this.fireWhoosh(this.ctx.currentTime);
          break;
        case "quench":
          this.quench(e.when);
          break;
      }
    }
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
