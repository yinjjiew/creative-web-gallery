/**
 * Trapeze — sound, entirely synthesized.
 *
 * No audio files. Noise buffers, oscillators, filters and one procedurally
 * generated impulse response for the hall. Nothing is triggered blindly: the
 * rush of the swing tracks speed and height, the creak of the rig tracks cable
 * tension, and the slap of a catch is layered by how good the catch was, so the
 * mix is a readout of the simulation rather than a soundtrack over it.
 *
 * The context is only ever constructed from inside a user gesture.
 */
import type { GameEvent, Game } from "./sim";
import { swingL, tensionOf } from "./sim";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Lightly integrated white noise: closer to pink, and much less hissy.
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.06 * w) / 1.06;
    d[i] = last * 3.2 + w * 0.35;
  }
  return buf;
}

/** A hall: exponentially decaying noise, darkening as it dies. */
function impulse(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.pow(1 - t, 2.6);
      const w = Math.random() * 2 - 1;
      lp += (w - lp) * (0.45 - 0.33 * t);
      d[i] = lp * env * (i < ctx.sampleRate * 0.012 ? i / (ctx.sampleRate * 0.012) : 1);
    }
  }
  return buf;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rushGain: GainNode | null = null;
  private rushFilter: BiquadFilterNode | null = null;
  private rushPan: StereoPannerNode | null = null;
  private hallGain: GainNode | null = null;
  private muted = false;
  private lastCreak = -1;

  get ready() {
    return !!this.ctx;
  }

  /** Must be called from inside a gesture handler. */
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
    master.gain.value = this.muted ? 0 : 0.9;
    master.connect(ctx.destination);
    this.master = master;

    const conv = ctx.createConvolver();
    conv.buffer = impulse(ctx, 2.1);
    const wet = ctx.createGain();
    wet.gain.value = 0.34;
    wet.connect(conv);
    conv.connect(master);
    this.wet = wet;

    /* The room. A big empty tent is not silent. */
    const hall = ctx.createBufferSource();
    hall.buffer = this.noise;
    hall.loop = true;
    const hallLp = ctx.createBiquadFilter();
    hallLp.type = "lowpass";
    hallLp.frequency.value = 260;
    const hallGain = ctx.createGain();
    hallGain.gain.value = 0.05;
    hall.connect(hallLp);
    hallLp.connect(hallGain);
    hallGain.connect(master);
    hall.start();
    this.hallGain = hallGain;

    const breath = ctx.createOscillator();
    breath.frequency.value = 0.07;
    const breathAmt = ctx.createGain();
    breathAmt.gain.value = 0.022;
    breath.connect(breathAmt);
    breathAmt.connect(hallGain.gain);
    breath.start();

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 47;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.026;
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();

    /* The rush of a body moving through air, driven by speed every frame. */
    const rush = ctx.createBufferSource();
    rush.buffer = this.noise;
    rush.loop = true;
    const rf = ctx.createBiquadFilter();
    rf.type = "bandpass";
    rf.frequency.value = 420;
    rf.Q.value = 0.85;
    const rg = ctx.createGain();
    rg.gain.value = 0;
    const rp = ctx.createStereoPanner();
    rush.connect(rf);
    rf.connect(rg);
    rg.connect(rp);
    rp.connect(master);
    rp.connect(wet);
    rush.start();
    this.rushGain = rg;
    this.rushFilter = rf;
    this.rushPan = rp;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  /* ── voices ───────────────────────────────────────────────────────────────── */

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
    src.playbackRate.value = 0.85 + Math.random() * 0.3;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + Math.min(0.012, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    src.connect(f);
    f.connect(g);
    g.connect(p);
    p.connect(this.master);
    p.connect(this.wet);
    src.start(when, Math.random() * 3);
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
    g.gain.linearRampToValueAtTime(gain, when + 0.006);
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

  /* ── per-frame ────────────────────────────────────────────────────────────── */

  update(g: Game, camX: number) {
    const ctx = this.ctx;
    if (!ctx || !this.rushGain || !this.rushFilter || !this.rushPan) return;
    const now = ctx.currentTime;
    const f = g.flyer;
    const speed = Math.hypot(
      (f.pos.x - f.prev.x) * 240,
      (f.pos.y - f.prev.y) * 240
    );
    const norm = clamp(speed / 8.5, 0, 1.4);
    const airborne = g.phase === "flight" || g.phase === "falling";
    // Weightlessness: the moment the hands leave the bar, the rush thins out
    // and the room opens up. It is the loudest thing about a quiet moment.
    const target = norm * norm * (airborne ? 0.05 : 0.11);
    this.rushGain.gain.setTargetAtTime(target, now, 0.06);
    this.rushFilter.frequency.setTargetAtTime(
      300 + norm * 900 + (airborne ? 500 : 0),
      now,
      0.08
    );
    this.rushPan.pan.setTargetAtTime(clamp((f.pos.x - camX) / 7, -1, 1), now, 0.1);
    if (this.hallGain) {
      this.hallGain.gain.setTargetAtTime(
        g.phase === "flight" ? 0.075 : 0.05,
        now,
        0.25
      );
    }
  }

  /* ── events ───────────────────────────────────────────────────────────────── */

  handle(events: GameEvent[], g: Game, camX: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.005;
    const panOf = (x: number) => clamp((x - camX) / 7, -1, 1);

    for (const e of events) {
      switch (e.type) {
        case "hup": {
          // Stepping off the board: a scuff and the cables taking the weight.
          this.burst(now, 0.16, 0.3, "bandpass", 900, 1.1, 300, -0.2);
          this.tone(now + 0.02, 0.5, 0.12, 130, 74, "triangle", -0.2);
          break;
        }
        case "release": {
          const pan = panOf(e.x);
          // Chalk and skin leaving a steel bar.
          this.burst(now, 0.09, 0.34, "highpass", 2400, 0.8, undefined, pan);
          this.burst(now, 0.3, 0.13, "bandpass", 1500, 0.9, 620, pan);
          // The bar springs back, unloaded.
          this.tone(now + 0.01, 0.42, 0.075, 420, 180, "triangle", pan);
          break;
        }
        case "open": {
          this.burst(now, 0.11, 0.26, "bandpass", 2100, 1.4, 900, 0);
          break;
        }
        case "catch": {
          const pan = panOf(e.x);
          const q = e.quality;
          // Wrists meeting: a slap, a body-weight thud, and the rig loading up.
          this.burst(now, 0.055, 0.5 + 0.4 * q, "bandpass", 1500 + 900 * q, 1.2, 700, pan);
          this.burst(now, 0.016, 0.34 + 0.3 * q, "highpass", 4200, 0.7, undefined, pan);
          this.tone(now, 0.26, 0.34 + 0.16 * q, 96, 54, "sine", pan);
          this.tone(now + 0.03, 0.7, 0.07 + 0.06 * q, 190, 118, "triangle", pan);
          if (e.kind === "bar") {
            this.burst(now + 0.005, 0.2, 0.2, "bandpass", 2600, 3.4, 1800, pan);
          }
          // A clean one gets a breath from the hall. Nothing more.
          if (q > 0.74) {
            this.burst(now + 0.05, 1.1, 0.14, "lowpass", 720, 0.6, 380, pan * 0.4);
          }
          break;
        }
        case "bottom": {
          // Rig creak, scaled by the tension actually in the cables.
          const s = g.swings.find((sw) => sw.px === e.x);
          const load = e.tension / 22;
          if (e.carrying) {
            if (now - this.lastCreak < 0.15) break;
            this.lastCreak = now;
            const pan = panOf(e.x);
            this.burst(now, 0.34, 0.055 + 0.12 * load, "bandpass", 240, 6, 165, pan);
            this.tone(now, 0.22, 0.03 + 0.05 * load, 78, 62, "triangle", pan);
            if (s && swingL(s) > 4) {
              this.tone(now + 0.02, 0.5, 0.05, 58, 45, "sine", pan);
            }
          } else {
            // The catcher's own metronome: a soft wooden tick each time he
            // passes the bottom, so his schedule can be heard as well as seen.
            this.burst(now, 0.05, 0.075, "bandpass", 1250, 5.5, undefined, panOf(e.x));
          }
          break;
        }
        case "slip": {
          this.burst(now, 0.42, 0.3, "bandpass", 1700, 2.2, 320, 0);
          break;
        }
        case "miss": {
          this.burst(now, 0.7, 0.14, "bandpass", 700, 0.8, 180, panOf(e.x));
          this.tone(now, 0.9, 0.09, 200, 60, "triangle", 0);
          break;
        }
        case "land": {
          const pan = panOf(e.x);
          const k = clamp(e.speed / 11, 0.2, 1);
          this.burst(now, 0.3, 0.34 * k, "lowpass", 900, 0.7, 200, pan);
          this.tone(now, 0.5, 0.4 * k, 74, 38, "sine", pan);
          this.burst(now + 0.01, 0.9, 0.1 * k, "bandpass", 420, 1.4, 160, pan);
          break;
        }
        case "idea": {
          this.tone(now, 1.5, 0.075, 294, 292, "triangle", 0);
          this.tone(now + 0.14, 1.7, 0.055, 392, 390, "triangle", 0);
          break;
        }
        case "restart": {
          this.burst(now, 0.1, 0.14, "bandpass", 700, 1.2, 400, 0);
          break;
        }
      }
    }
    void tensionOf;
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
