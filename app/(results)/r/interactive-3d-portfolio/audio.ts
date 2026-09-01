/**
 * Drawer scrape and paper rustle. Nothing plays until a gesture has opened
 * the context — the first pull is also the first sound.
 */

export type ChestSound = {
  scrape: (openness: number, speed: number) => void;
  rustle: (mass: number) => void;
  land: (mass: number) => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
};

export function createChestSound(): ChestSound {
  let ctx: AudioContext | null = null;
  let muted = false;
  let lastScrape = 0;

  function ensure() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
    return ctx;
  }

  function scrape(openness: number, speed: number) {
    if (muted) return;
    const now = performance.now();
    if (now - lastScrape < 70) return;
    lastScrape = now;
    const ac = ensure();
    if (ac.state === "suspended") void ac.resume();
    const t = ac.currentTime;
    const mag = Math.min(1, Math.abs(speed) * 4 + 0.08);

    const noise = ac.createBufferSource();
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.12), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    noise.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 280 + openness * 220;
    filter.Q.value = 1.1;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.045 * mag, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    noise.start(t);
    noise.stop(t + 0.12);
  }

  function rustle(mass: number) {
    if (muted) return;
    const ac = ensure();
    if (ac.state === "suspended") void ac.resume();
    const t = ac.currentTime;
    const heavy = Math.min(1, mass);

    const noise = ac.createBufferSource();
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.18), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.6);
    }
    noise.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 900 - heavy * 400;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.055 + heavy * 0.03, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    noise.start(t);
    noise.stop(t + 0.18);
  }

  function land(mass: number) {
    if (muted) return;
    const ac = ensure();
    if (ac.state === "suspended") void ac.resume();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140 - Math.min(80, mass * 40), t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.04 + Math.min(0.04, mass * 0.02), t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  return {
    scrape,
    rustle,
    land,
    setMuted: (next) => {
      muted = next;
    },
    dispose: () => {
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
