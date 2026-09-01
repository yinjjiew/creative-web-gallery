/**
 * A night train heard from inside a closed compartment: low, far, never a
 * rhythm you could count. Starts only after a gesture.
 */

type Handle = {
  mute: () => void;
  unmute: () => void;
  stop: () => void;
  muted: () => boolean;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let started = false;

function Ctx(): typeof AudioContext | null {
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function brown(audio: AudioContext) {
  const frames = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let acc = 0;
  for (let i = 0; i < frames; i++) {
    acc += (Math.random() * 2 - 1) * 0.02;
    acc *= 0.985;
    data[i] = acc * 3.2;
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

export async function startNight(): Promise<Handle | null> {
  if (started && master && ctx) {
    return api();
  }
  const Ctor = Ctx();
  if (!Ctor) return null;
  const audio = ctx ?? new Ctor();
  ctx = audio;
  if (audio.state === "suspended") {
    try {
      await audio.resume();
    } catch {
      return null;
    }
  }

  const gain = audio.createGain();
  gain.gain.value = 0;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 140;
  filter.Q.value = 0.7;
  const rumble = brown(audio);
  rumble.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  rumble.start();

  const now = audio.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.045, now + 2.4);

  // A rare distant clink — coupling, not a beat.
  const clink = () => {
    if (!ctx || !master || muted) return;
    const click = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 420;
    f.Q.value = 8;
    click.type = "triangle";
    click.frequency.value = 180 + Math.random() * 40;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    click.connect(f);
    f.connect(g);
    g.connect(master);
    click.start(t);
    click.stop(t + 0.2);
  };
  const timer = window.setInterval(() => {
    if (Math.random() < 0.35) clink();
  }, 14000);

  master = gain;
  started = true;
  muted = false;

  const handle = api();
  const prevStop = handle.stop;
  handle.stop = () => {
    window.clearInterval(timer);
    prevStop();
  };
  return handle;
}

function api(): Handle {
  return {
    mute: () => {
      muted = true;
      if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      }
    },
    unmute: () => {
      muted = false;
      if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.4);
      }
    },
    stop: () => {
      if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      }
    },
    muted: () => muted,
  };
}
