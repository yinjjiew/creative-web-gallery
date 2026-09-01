/**
 * One sensing grammar, two bodies.
 *
 * Camera: frame differencing plus a slow background model. No faces, no
 * landmarks, no network. A spike in motion energy is a footfall. A growing
 * persistent difference from the empty room is someone leaning in.
 *
 * Hand: the pointer (or a keyboard-steered shadow) is a weight on the water,
 * not a leash. Velocity is the footfall; stillness in the middle of the pool
 * is a stare; leaving the glass is stepping back from the hide.
 */

export type SenseSource = "none" | "camera" | "hand";

export type Sense = {
  energy: number;
  slowEnergy: number;
  spike: number;
  sudden: boolean;
  cx: number;
  cy: number;
  occupancy: number;
  approach: number;
  stare: number;
  ignored: number;
  presence: boolean;
  stillness: number;
  source: SenseSource;
};

export function emptySense(): Sense {
  return {
    energy: 0,
    slowEnergy: 0,
    spike: 0,
    sudden: false,
    cx: 0,
    cy: 0,
    occupancy: 0,
    approach: 0,
    stare: 0,
    ignored: 1,
    presence: false,
    stillness: 0,
    source: "none",
  };
}

function clamp(v: number, a = 0, b = 1) {
  return v < a ? a : v > b ? b : v;
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const W = 80;
const H = 60;
const CELLS = W * H;

export class CameraSense {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private prev: Float32Array | null = null;
  private back: Float32Array | null = null;
  private primed = false;

  async start(): Promise<"live" | "denied" | "missing"> {
    if (!navigator.mediaDevices?.getUserMedia) return "missing";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 160 },
          height: { ideal: 120 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
      const video = document.createElement("video");
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return "missing";
      }

      this.stream = stream;
      this.video = video;
      this.canvas = canvas;
      this.ctx = ctx;
      this.prev = new Float32Array(CELLS);
      this.back = new Float32Array(CELLS);
      this.primed = false;
      return "live";
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") return "denied";
      return "missing";
    }
  }

  sample(out: Sense) {
    const video = this.video;
    const ctx = this.ctx;
    const prev = this.prev;
    const back = this.back;
    if (!video || !ctx || !prev || !back || video.readyState < 2) return;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -W, 0, W, H);
    ctx.restore();
    const pix = ctx.getImageData(0, 0, W, H).data;

    let motion = 0;
    let mx = 0;
    let my = 0;
    let persist = 0;
    let lumaSum = 0;

    for (let i = 0; i < CELLS; i++) {
      const p = i * 4;
      const y = (pix[p]! * 0.3 + pix[p + 1]! * 0.59 + pix[p + 2]! * 0.11) / 255;
      lumaSum += y;
      const d = Math.abs(y - prev[i]!);
      const cell = d * d;
      motion += cell;
      if (cell > 0.002) {
        const x = i % W;
        const row = (i / W) | 0;
        mx += cell * (x / (W - 1) - 0.5);
        my += cell * (0.5 - row / (H - 1));
      }
      persist += Math.abs(y - back[i]!);
      prev[i] = y;
    }

    if (!this.primed) {
      back.set(prev);
      this.primed = true;
      return;
    }

    const energy = clamp(motion * 7.5);
    out.energy = mix(out.energy, energy, 0.45);
    out.slowEnergy = mix(out.slowEnergy, out.energy, 0.045);
    out.spike = clamp(out.energy - out.slowEnergy * 1.15, 0, 1);
    out.sudden = out.spike > 0.3 && out.energy > 0.26;

    if (motion > 1e-5) {
      out.cx = mix(out.cx, clamp(mx / motion, -1, 1), 0.28);
      out.cy = mix(out.cy, clamp(my / motion, -1, 1), 0.28);
    }

    const occupancy = clamp((persist / CELLS - 0.04) * 3.4);
    const prevOcc = out.occupancy;
    out.occupancy = mix(prevOcc, occupancy, 0.12);
    out.approach = mix(out.approach, clamp((out.occupancy - prevOcc) * 18, -1, 1), 0.2);

    const mean = lumaSum / CELLS;
    const busy = out.energy > 0.035 || out.occupancy > 0.08;
    out.presence = busy || mean < 0.97;

    if (out.energy < 0.05) {
      for (let i = 0; i < CELLS; i++) {
        back[i] = back[i]! * 0.997 + prev[i]! * 0.003;
      }
    }

    out.source = "camera";
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.video) this.video.srcObject = null;
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.prev = null;
    this.back = null;
    this.primed = false;
  }
}

export class HandSense {
  x = 0;
  y = 0;
  over = false;
  held = false;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private vx = 0;
  private lastOver = 0;

  feed(x: number, y: number, over: boolean, held: boolean, t: number) {
    const dt = Math.max(0.008, t - (this.lastT || t));
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const inst = Math.hypot(dx, dy) / dt;
    this.vx = mix(this.vx, inst, 0.55);
    if (over) this.lastOver = t;
    this.lastX = x;
    this.lastY = y;
    this.lastT = t;
    this.x = x;
    this.y = y;
    this.over = over;
    this.held = held;
  }

  sample(out: Sense, t: number) {
    const sinceOver = t - (this.lastOver || 0);
    const speed = this.vx;
    const energy = clamp(speed / 7.2);
    out.energy = mix(out.energy, energy, 0.4);
    out.slowEnergy = mix(out.slowEnergy, out.energy, 0.06);
    out.spike = clamp(out.energy - out.slowEnergy * 1.2, 0, 1);
    out.sudden = out.spike > 0.28 && speed > 2.6;

    out.cx = mix(out.cx, clamp(this.x, -1, 1), 0.35);
    out.cy = mix(out.cy, clamp(this.y, -1, 1), 0.35);

    const present = this.over || this.held || sinceOver < 1.8;
    const occ = present ? 0.28 + (this.held ? 0.22 : 0) + (1 - Math.hypot(this.x, this.y) * 0.35) * 0.25 : 0;
    const prevOcc = out.occupancy;
    out.occupancy = mix(prevOcc, occ, 0.18);
    const toward = present ? clamp((-this.y - 0.05) * 0.8 + (this.held ? 0.15 : 0), -1, 1) : 0;
    out.approach = mix(out.approach, toward, 0.16);

    out.presence = present;
    out.source = present ? "hand" : "none";
  }
}

export function finishSense(s: Sense, dt: number) {
  if (s.presence && s.energy < 0.07) s.stillness += dt;
  else s.stillness = Math.max(0, s.stillness - dt * 1.8);

  const staring = s.presence && s.occupancy > 0.34 && s.energy < 0.08 && s.stillness > 1.1;
  s.stare = staring ? Math.min(1, s.stare + dt * 0.35) : Math.max(0, s.stare - dt * 0.5);

  const away = !s.presence || (s.occupancy < 0.1 && s.energy < 0.04);
  s.ignored = away ? Math.min(1, s.ignored + dt * 0.28) : Math.max(0, s.ignored - dt * 0.7);
}
