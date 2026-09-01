/**
 * Wind, boot, stone. All parametric. The context is created only from inside
 * a gesture; after that the mix is a readout of height, pace and how many
 * stones have already settled on the ridge.
 */
import type { Event, Game } from "./sim";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.045 * w) / 1.045;
    d[i] = last * 2.8 + w * 0.4;
  }
  return buf;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
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
    this.noise = noiseBuffer(ctx, 3.2);

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.86;
    master.connect(ctx.destination);
    this.master = master;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.028;
    src.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    src.start();
    this.windGain = gain;
    this.windFilter = bp;
  }

  setMuted(on: boolean) {
    this.muted = on;
    if (this.master) {
      this.master.gain.setTargetAtTime(on ? 0 : 0.86, this.ctx!.currentTime, 0.04);
    }
  }

  update(g: Game) {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const height = clamp(1 - g.y / 520, 0.15, 1);
    const run = clamp(Math.abs(g.vx) / 172, 0, 1);
    const aim = 0.02 + height * 0.04 + run * 0.012;
    const now = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(aim, now, 0.18);
    this.windFilter.frequency.setTargetAtTime(280 + height * 420, now, 0.22);
  }

  handle(events: Event[], g: Game) {
    if (!this.ctx || !this.master || !this.noise) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    for (const e of events) {
      if (e.type === "foot") this.foot(now, e.v);
      else if (e.type === "jump") this.jump(now);
      else if (e.type === "land") this.land(now, e.hard);
      else if (e.type === "bonk") this.bonk(now);
      else if (e.type === "die") this.die(now);
      else if (e.type === "stone") this.stone(now, e.stack);
      else if (e.type === "summit") this.summit(now);
    }
    void g;
  }

  private burst(
    now: number,
    freq: number,
    dur: number,
    gain: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private grit(now: number, dur: number, gain: number, cutoff: number) {
    if (!this.ctx || !this.master || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = cutoff;
    f.Q.value = 1.1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  private foot(now: number, v: number) {
    const p = clamp(v / 172, 0.3, 1);
    this.grit(now, 0.07, 0.07 * p, 220 + p * 80);
    this.burst(now, 90 + p * 30, 0.05, 0.04 * p, "triangle");
  }

  private jump(now: number) {
    this.grit(now, 0.11, 0.06, 680);
    this.burst(now, 220, 0.09, 0.035, "sine");
  }

  private land(now: number, hard: number) {
    this.grit(now, 0.1 + hard * 0.06, 0.08 + hard * 0.1, 180);
    this.burst(now, 70 + hard * 20, 0.08, 0.06 + hard * 0.05, "sine");
  }

  private bonk(now: number) {
    this.burst(now, 140, 0.04, 0.03, "square");
  }

  private die(now: number) {
    this.grit(now, 0.16, 0.11, 340);
    this.burst(now, 160, 0.12, 0.05, "triangle");
  }

  private stone(now: number, stack: number) {
    const pitch = 210 - clamp(stack, 0, 8) * 14;
    this.burst(now, pitch, 0.14, 0.08, "triangle");
    this.burst(now + 0.02, pitch * 0.5, 0.18, 0.05, "sine");
    this.grit(now, 0.09, 0.07, 400);
  }

  private summit(now: number) {
    this.burst(now, 262, 0.6, 0.045, "sine");
    this.burst(now + 0.04, 330, 0.7, 0.035, "sine");
    this.burst(now + 0.1, 196, 0.9, 0.03, "sine");
  }

  close() {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
