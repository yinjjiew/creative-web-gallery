/**
 * A cave is mostly waiting. One drip, and a single displaced-water tick when
 * something startles. Nothing is sampled from a file.
 */

export class CaveAir {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nextDrip = 0;
  private lastStartle = -9;
  muted = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.nextDrip = ctx.currentTime + 1.2;
    return ctx;
  }

  resume() {
    const ctx = this.ensure();
    void ctx?.resume();
  }

  tick(now: number, out: boolean) {
    if (this.muted) return;
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || ctx.state !== "running") return;

    if (ctx.currentTime >= this.nextDrip) {
      this.drip(out ? 0.22 : 0.42);
      this.nextDrip = ctx.currentTime + 2.4 + Math.random() * (out ? 5.5 : 3.2);
    }
    void now;
  }

  startle() {
    const ctx = this.ensure();
    const master = this.master;
    if (!ctx || !master || this.muted) return;
    if (ctx.currentTime - this.lastStartle < 0.8) return;
    this.lastStartle = ctx.currentTime;
    void ctx.resume();

    const dur = 0.28;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 9) * (1 - t);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
    src.stop(ctx.currentTime + dur + 0.02);
  }

  private drip(amp: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(amp * 0.18, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
