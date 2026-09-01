/**
 * Synthesized ticks, only after a gesture has unlocked the context.
 */

type Kind = "shove" | "split" | "land";

let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
}

export function tap(kind: Kind): void {
  if (!ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + 0.01;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  if (kind === "shove") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.09);
    filter.frequency.value = 420;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  } else if (kind === "split") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, t0);
    osc.frequency.setValueAtTime(185, t0 + 0.07);
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.03, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.start(t0);
    osc.stop(t0 + 0.24);
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(98, t0);
    filter.frequency.value = 240;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.035, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    osc.start(t0);
    osc.stop(t0 + 0.18);
  }
}
