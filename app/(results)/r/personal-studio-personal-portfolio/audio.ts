/**
 * Impressions, not masters. Each take is a filtered-noise room with a few
 * events, seeded from the catalogue number so the same session always sounds
 * like itself. Audio starts only after a gesture.
 */

import type { Kind, Recording } from "./data";

type Legacy = Window & { webkitAudioContext?: typeof AudioContext };

type Voice = {
  nodes: AudioNode[];
  stops: (() => void)[];
};

export type AmbitAudio = {
  unlock: () => Promise<void>;
  play: (rec: Recording) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  get currentTime(): number;
};

function noiseBuffer(ctx: AudioContext, seconds: number, color: "white" | "pink" | "brown") {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (color === "white") d[i] = w * 0.6;
    else if (color === "pink") {
      b = 0.98 * b + 0.02 * w;
      d[i] = (w * 0.25 + b * 0.75) * 0.7;
    } else {
      b = 0.997 * b + 0.003 * w;
      d[i] = b * 3.2;
    }
  }
  return buf;
}

function seed(rec: Recording) {
  let h = 2166136261;
  const s = rec.cat + rec.kind + rec.placeId;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(start: number) {
  let a = start;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function source(ctx: AudioContext, buf: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function filter(ctx: AudioContext, type: BiquadFilterType, freq: number, q = 1) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function gain(ctx: AudioContext, v: number) {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

type Spec = {
  color: "white" | "pink" | "brown";
  low: number;
  high: number;
  q: number;
  level: number;
  lfo: number;
  lfoDepth: number;
  hum?: number;
  drip?: number;
};

const SPEC: Record<Kind, Spec> = {
  water: { color: "pink", low: 180, high: 2400, q: 0.7, level: 0.22, lfo: 0.07, lfoDepth: 0.12, drip: 0.35 },
  wind: { color: "brown", low: 90, high: 1800, q: 0.5, level: 0.2, lfo: 0.05, lfoDepth: 0.22 },
  ice: { color: "white", low: 420, high: 5200, q: 1.4, level: 0.12, lfo: 0.03, lfoDepth: 0.08, drip: 0.55 },
  foliage: { color: "pink", low: 320, high: 3800, q: 0.8, level: 0.18, lfo: 0.14, lfoDepth: 0.2 },
  birds: { color: "pink", low: 250, high: 1600, q: 0.6, level: 0.1, lfo: 0.04, lfoDepth: 0.06 },
  insects: { color: "white", low: 1800, high: 6200, q: 2.2, level: 0.11, lfo: 18, lfoDepth: 0.18 },
  urban: { color: "brown", low: 70, high: 900, q: 0.6, level: 0.2, lfo: 0.08, lfoDepth: 0.1, hum: 52 },
  interior: { color: "pink", low: 140, high: 1100, q: 0.9, level: 0.14, lfo: 0.02, lfoDepth: 0.04 },
  mechanical: { color: "brown", low: 60, high: 700, q: 1.1, level: 0.18, lfo: 0.4, lfoDepth: 0.08, hum: 48 },
  rain: { color: "white", low: 400, high: 4500, q: 0.7, level: 0.2, lfo: 0.11, lfoDepth: 0.1, drip: 0.7 },
  voices: { color: "pink", low: 220, high: 2200, q: 1.2, level: 0.13, lfo: 0.15, lfoDepth: 0.09, hum: 180 },
  rural: { color: "pink", low: 120, high: 2000, q: 0.55, level: 0.16, lfo: 0.06, lfoDepth: 0.1 },
};

function buildVoice(ctx: AudioContext, rec: Recording, dest: AudioNode): Voice {
  const rand = rng(seed(rec));
  const spec = SPEC[rec.kind];
  const nodes: AudioNode[] = [];
  const stops: (() => void)[] = [];

  const white = noiseBuffer(ctx, 3.2, "white");
  const pink = noiseBuffer(ctx, 3.6, "pink");
  const brown = noiseBuffer(ctx, 4.0, "brown");
  const buf = spec.color === "white" ? white : spec.color === "pink" ? pink : brown;

  const src = source(ctx, buf);
  const hp = filter(ctx, "highpass", spec.low * (0.85 + rand() * 0.3));
  const lp = filter(ctx, "lowpass", spec.high * (0.8 + rand() * 0.35), spec.q);
  const bed = gain(ctx, 0);
  const now = ctx.currentTime;
  bed.gain.setValueAtTime(0, now);
  bed.gain.linearRampToValueAtTime(spec.level * (0.85 + rand() * 0.25), now + 1.1);

  src.connect(hp);
  hp.connect(lp);
  lp.connect(bed);
  bed.connect(dest);
  src.start();
  nodes.push(src, hp, lp, bed);
  stops.push(() => {
    try {
      src.stop();
    } catch {
      /* already */
    }
  });

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = spec.lfo * (0.7 + rand() * 0.6);
  const lfoG = gain(ctx, spec.level * spec.lfoDepth);
  lfo.connect(lfoG);
  lfoG.connect(bed.gain);
  lfo.start();
  nodes.push(lfo, lfoG);
  stops.push(() => {
    try {
      lfo.stop();
    } catch {
      /* already */
    }
  });

  if (spec.hum) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = spec.hum * (0.96 + rand() * 0.08);
    const og = gain(ctx, 0.035 + rand() * 0.03);
    const humLp = filter(ctx, "lowpass", spec.hum * 4);
    osc.connect(humLp);
    humLp.connect(og);
    og.connect(dest);
    osc.start();
    nodes.push(osc, og, humLp);
    stops.push(() => {
      try {
        osc.stop();
      } catch {
        /* already */
      }
    });
  }

  if (spec.drip) {
    const dripBuf = noiseBuffer(ctx, 0.18, "white");
    const schedule = () => {
      const t = ctx.currentTime + 0.8 + rand() * 4.5;
      const drop = ctx.createBufferSource();
      drop.buffer = dripBuf;
      const bp = filter(ctx, "bandpass", 1200 + rand() * 3200, 4 + rand() * 6);
      const dg = gain(ctx, 0);
      dg.gain.setValueAtTime(0, t);
      dg.gain.linearRampToValueAtTime(0.08 + rand() * 0.07, t + 0.01);
      dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09 + rand() * 0.08);
      drop.connect(bp);
      bp.connect(dg);
      dg.connect(dest);
      drop.start(t);
      drop.stop(t + 0.2);
      nodes.push(drop, bp, dg);
    };
    const id = window.setInterval(schedule, 900 + rand() * 1600);
    schedule();
    stops.push(() => window.clearInterval(id));
  }

  if (rec.kind === "birds") {
    const chirp = () => {
      const t = ctx.currentTime + 1.2 + rand() * 5;
      const o = ctx.createOscillator();
      o.type = "sine";
      const f0 = 1800 + rand() * 1400;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * (0.7 + rand() * 0.8), t + 0.08);
      const g = gain(ctx, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + 0.16);
    };
    const id = window.setInterval(chirp, 1400 + rand() * 2200);
    chirp();
    stops.push(() => window.clearInterval(id));
  }

  if (rec.kind === "mechanical" || rec.kind === "urban") {
    const pulse = ctx.createOscillator();
    pulse.type = "square";
    pulse.frequency.value = 0.35 + rand() * 1.1;
    const pg = gain(ctx, 0.025);
    const plp = filter(ctx, "lowpass", 180);
    pulse.connect(plp);
    plp.connect(pg);
    pg.connect(dest);
    pulse.start();
    nodes.push(pulse, pg, plp);
    stops.push(() => {
      try {
        pulse.stop();
      } catch {
        /* already */
      }
    });
  }

  return { nodes, stops };
}

export function createAudio(): AmbitAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let voice: Voice | null = null;
  let startedAt = 0;
  let pausedAt = 0;
  let paused = false;

  const ensure = async () => {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as Legacy).webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio is not available");
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") await ctx.resume();
    return ctx;
  };

  const fadeOut = (c: AudioContext, v: Voice, g: GainNode) => {
    const t = c.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.7);
    window.setTimeout(() => {
      for (const stop of v.stops) stop();
      for (const n of v.nodes) {
        try {
          n.disconnect();
        } catch {
          /* already */
        }
      }
    }, 760);
  };

  return {
    unlock: async () => {
      await ensure();
    },
    play: async (rec) => {
      const c = await ensure();
      if (!master) return;
      if (voice) {
        const oldBus = voice.nodes[voice.nodes.length - 1];
        fadeOut(c, voice, oldBus instanceof GainNode ? oldBus : master);
      }
      const bus = gain(c, 1);
      bus.connect(master);
      voice = buildVoice(c, rec, bus);
      voice.nodes.push(bus);
      startedAt = c.currentTime;
      pausedAt = 0;
      paused = false;
    },
    pause: () => {
      if (!ctx || !master || paused) return;
      const t = ctx.currentTime;
      pausedAt = t - startedAt;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.15);
      paused = true;
      void ctx.suspend();
    },
    resume: () => {
      if (!ctx || !master || !paused) return;
      void ctx.resume().then(() => {
        if (!ctx || !master) return;
        startedAt = ctx.currentTime - pausedAt;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.2);
        paused = false;
      });
    },
    stop: () => {
      if (!ctx || !master || !voice) return;
      fadeOut(ctx, voice, master);
      voice = null;
      paused = false;
    },
    get currentTime() {
      if (!ctx) return 0;
      if (paused) return pausedAt;
      return Math.max(0, ctx.currentTime - startedAt);
    },
  };
}
