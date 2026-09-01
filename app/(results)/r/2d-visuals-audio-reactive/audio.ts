/**
 * One measurement pipeline, two sources.
 *
 * Microphone or a cascade-resonator voice both land in the same AnalyserNode.
 * LPC never sees a "target" — only time-domain samples. Audio starts only
 * after a gesture (AudioContext.resume).
 */

import { analyseLpc, emptyFrame, type LpcFrame } from "./lpc";

export type Source = "none" | "synth" | "mic";

export type Reading = LpcFrame & {
  source: Source;
  voiced: boolean;
  f1s: number;
  f2s: number;
  f3s: number;
  targetF1: number;
  targetF2: number;
  targetF3: number;
  f0: number;
};

const F0_MIN = 90;
const F0_MAX = 220;
const TAU = 0.028;

const WORKLET = `
class FormantVoice extends AudioWorkletProcessor {
  constructor() {
    super();
    this.f0 = 130;
    this.gain = 0;
    this.want = 0;
    this.phase = 0;
    this.peak = 0.4;
    this.f = [500, 1500, 2500];
    this.bw = [80, 110, 160];
    this.poles = [
      { y1: 0, y2: 0, a1: 0, a2: 0 },
      { y1: 0, y2: 0, a1: 0, a2: 0 },
      { y1: 0, y2: 0, a1: 0, a2: 0 },
    ];
    this.cap = new Float32Array(Math.round(sampleRate * 0.028));
    this.capPos = 0;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (typeof d.f0 === "number") this.f0 = d.f0;
      if (typeof d.on === "number") this.want = d.on;
      let dirty = false;
      if (typeof d.f1 === "number" && d.f1 !== this.f[0]) { this.f[0] = d.f1; dirty = true; }
      if (typeof d.f2 === "number" && d.f2 !== this.f[1]) { this.f[1] = d.f2; dirty = true; }
      if (typeof d.f3 === "number" && d.f3 !== this.f[2]) { this.f[2] = d.f3; dirty = true; }
      if (dirty) this.retune();
    };
    this.retune();
  }
  retune() {
    for (let i = 0; i < 3; i++) {
      const r = Math.exp(-Math.PI * this.bw[i] / sampleRate);
      const th = 2 * Math.PI * this.f[i] / sampleRate;
      this.poles[i].a1 = 2 * r * Math.cos(th);
      this.poles[i].a2 = -(r * r);
    }
  }
  process(_inputs, outputs) {
    const out = outputs[0][0];
    if (!out) return true;
    const period = sampleRate / Math.max(60, this.f0);
    for (let n = 0; n < out.length; n++) {
      this.gain += (this.want - this.gain) * 0.003;
      this.phase++;
      let y = 0;
      if (this.phase >= period) {
        this.phase -= period;
        y = 1;
      }
      for (const p of this.poles) {
        const z = y + p.a1 * p.y1 + p.a2 * p.y2;
        p.y2 = p.y1;
        p.y1 = z;
        y = z;
      }
      this.peak = Math.max(Math.abs(y), this.peak * 0.9998);
      const s = (y / (this.peak + 1e-5)) * 0.2 * this.gain;
      out[n] = s;
      if (this.gain > 0.15) {
        this.cap[this.capPos++] = s;
        if (this.capPos >= this.cap.length) {
          this.port.postMessage({ frame: this.cap.slice(), sr: sampleRate });
          this.capPos = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("formant-voice", FormantVoice);
`;

function onePole(prev: number, next: number, dt: number, tau = TAU) {
  if (!(prev > 0)) return next;
  const a = 1 - Math.exp(-dt / tau);
  return prev + (next - prev) * a;
}

export type Engine = {
  reading: Reading;
  getSource: () => Source;
  ensure: () => Promise<AudioContext>;
  prepare: () => Promise<void>;
  setTarget: (f1: number, f2: number, f3: number) => void;
  setPitch: (f0: number) => void;
  hold: (on: boolean) => void;
  listen: () => Promise<"mic" | "denied" | "unavailable">;
  stopMic: () => void;
  analyse: (dt: number) => Reading;
  dispose: () => void;
};

export function createEngine(): Engine {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let timeBuf: Float32Array | null = null;
  let voice: AudioWorkletNode | null = null;
  let out: GainNode | null = null;
  let workletReady: Promise<void> | null = null;

  let mic: MediaStreamAudioSourceNode | null = null;
  let stream: MediaStream | null = null;

  let source: Source = "none";
  let holding = false;
  let f0 = 130;
  let tF1 = 500;
  let tF2 = 1500;
  let tF3 = 2500;
  let gen = 0;

  let f1s = 0;
  let f2s = 0;
  let f3s = 0;
  let holdMiss = 0;
  let synthFrame: Float32Array | null = null;
  let synthSr = 48000;

  const reading: Reading = {
    ...emptyFrame(),
    source: "none",
    voiced: false,
    f1s: 0,
    f2s: 0,
    f3s: 0,
    targetF1: tF1,
    targetF2: tF2,
    targetF3: tF3,
    f0,
  };

  const postVoice = () => {
    voice?.port.postMessage({
      f0,
      on: holding && source !== "mic" ? 1 : 0,
      f1: tF1,
      f2: tF2,
      f3: tF3,
    });
  };

  const setOut = (level: number) => {
    if (!out || !ctx) return;
    out.gain.setTargetAtTime(level, ctx.currentTime, 0.02);
  };

  const attachVoice = async (audio: AudioContext) => {
    if (voice) return;
    if (!workletReady) {
      const blob = new Blob([WORKLET], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      workletReady = audio.audioWorklet.addModule(url).finally(() => {
        URL.revokeObjectURL(url);
      });
    }
    await workletReady;
    if (voice) return;
    voice = new AudioWorkletNode(audio, "formant-voice", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    voice.port.onmessage = (event) => {
      const data = event.data as { frame?: Float32Array; sr?: number };
      if (data.frame) {
        synthFrame = data.frame;
        synthSr = data.sr || audio.sampleRate;
      }
    };
    out = audio.createGain();
    out.gain.value = 0;
    voice.connect(out);
    out.connect(audio.destination);
    if (analyser) out.connect(analyser);
    postVoice();
  };

  const detachMic = () => {
    if (mic) {
      try {
        mic.disconnect();
      } catch {
        /* already gone */
      }
      mic = null;
    }
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      stream = null;
    }
  };

  const ensure = async () => {
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: "interactive" });
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      timeBuf = new Float32Array(analyser.fftSize);
    }
    if (ctx.state === "suspended") await ctx.resume();
    return ctx;
  };

  const prepare = async () => {
    const audio = await ensure();
    await attachVoice(audio);
  };

  const setTarget = (f1: number, f2: number, f3: number) => {
    tF1 = f1;
    tF2 = f2;
    tF3 = f3;
    reading.targetF1 = f1;
    reading.targetF2 = f2;
    reading.targetF3 = f3;
    postVoice();
  };

  const setPitch = (hz: number) => {
    f0 = Math.max(F0_MIN, Math.min(F0_MAX, hz));
    reading.f0 = f0;
    postVoice();
  };

  const hold = (on: boolean) => {
    holding = on;
    const token = ++gen;
    if (!ctx || source === "mic") {
      postVoice();
      return;
    }
    if (on) {
      source = "synth";
      reading.source = "synth";
      void attachVoice(ctx).then(() => {
        if (token !== gen) return;
        if (analyser && out) {
          try {
            out.connect(analyser);
          } catch {
            /* already */
          }
        }
        postVoice();
        setOut(0.7);
      });
    } else {
      postVoice();
      setOut(0);
    }
  };

  const listen = async (): Promise<"mic" | "denied" | "unavailable"> => {
    if (!navigator.mediaDevices?.getUserMedia) return "unavailable";
    const audio = await ensure();
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      detachMic();
      stream = next;
      mic = audio.createMediaStreamSource(next);
      if (analyser) {
        if (out) {
          try {
            out.disconnect(analyser);
          } catch {
            /* not connected */
          }
        }
        mic.connect(analyser);
      }
      holding = false;
      postVoice();
      setOut(0);
      source = "mic";
      reading.source = "mic";
      return "mic";
    } catch {
      return "denied";
    }
  };

  const stopMic = () => {
    detachMic();
    if (source === "mic") {
      source = holding ? "synth" : "none";
      reading.source = source;
      if (source === "synth" && ctx) {
        void attachVoice(ctx).then(() => {
          if (out && analyser) {
            try {
              out.connect(analyser);
            } catch {
              /* already */
            }
          }
          postVoice();
          setOut(0.7);
        });
      }
    }
  };

  const analyse = (dt: number): Reading => {
    reading.source = source;
    reading.targetF1 = tF1;
    reading.targetF2 = tF2;
    reading.targetF3 = tF3;
    reading.f0 = f0;

    if (!analyser || !timeBuf || !ctx || source === "none") {
      reading.ok = false;
      reading.voiced = false;
      return reading;
    }
    if (source === "synth" && !holding) {
      reading.ok = false;
      reading.voiced = false;
      return reading;
    }

    let frame;
    if (source === "synth" && synthFrame) {
      frame = analyseLpc(synthFrame, synthSr);
    } else {
      analyser.getFloatTimeDomainData(timeBuf as Float32Array<ArrayBuffer>);
      frame = analyseLpc(timeBuf, ctx.sampleRate);
    }

    Object.assign(reading, frame);
    reading.source = source;
    reading.targetF1 = tF1;
    reading.targetF2 = tF2;
    reading.targetF3 = tF3;
    reading.f0 = f0;

    if (frame.ok) {
      f1s = onePole(f1s, frame.f1, dt);
      f2s = onePole(f2s, frame.f2, dt);
      f3s = onePole(f3s, frame.f3 || f3s, dt);
      holdMiss = 0;
      reading.voiced = true;
    } else {
      holdMiss += dt;
      if (holdMiss > 0.09) {
        reading.voiced = false;
      }
    }

    reading.f1s = f1s;
    reading.f2s = f2s;
    reading.f3s = f3s;
    return reading;
  };

  const dispose = () => {
    detachMic();
    try {
      voice?.disconnect();
      out?.disconnect();
      analyser?.disconnect();
    } catch {
      /* already */
    }
    void ctx?.close();
    ctx = null;
    voice = null;
    analyser = null;
  };

  return {
    reading,
    getSource: () => source,
    ensure,
    prepare,
    setTarget,
    setPitch,
    hold,
    listen,
    stopMic,
    analyse,
    dispose,
  };
}

export { F0_MAX, F0_MIN };
