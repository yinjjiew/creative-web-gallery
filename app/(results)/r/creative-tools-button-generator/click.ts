/**
 * A click is three voices: a filtered noise tick, a damped triangle at
 * pitch, and a short sine partial. Nothing is recorded.
 */

import type { Recipe } from "./feel";

export type Click = {
  ctx: AudioContext;
  noise: AudioBuffer;
};

export function makeClick(): Click | null {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.014), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
  }
  return { ctx, noise };
}

export async function unlock(click: Click | null): Promise<void> {
  if (!click) return;
  if (click.ctx.state === "suspended") {
    try {
      await click.ctx.resume();
    } catch {
      /* gesture required again */
    }
  }
}

export function playClick(
  click: Click | null,
  recipe: Recipe,
  velocity: number,
  muted: boolean
): void {
  if (!click || muted) return;
  if (click.ctx.state !== "running") return;

  const t = click.ctx.currentTime;
  const v = Math.min(1, 0.22 + velocity * 0.55);
  const gain = 0.2 * v;
  const dest = click.ctx.destination;

  const tick = click.ctx.createBufferSource();
  tick.buffer = click.noise;
  const hp = click.ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700 + recipe.hardness * 2600;
  const tg = click.ctx.createGain();
  tg.gain.setValueAtTime(Math.max(0.0001, gain * recipe.hardness), t);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);
  tick.connect(hp).connect(tg).connect(dest);
  tick.start(t);

  const body = click.ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(recipe.pitch, t);
  body.frequency.exponentialRampToValueAtTime(
    Math.max(40, recipe.pitch * 0.7),
    t + recipe.body
  );
  const bg = click.ctx.createGain();
  bg.gain.setValueAtTime(
    Math.max(0.0001, gain * (0.32 + (1 - recipe.hardness) * 0.45)),
    t
  );
  bg.gain.exponentialRampToValueAtTime(0.0001, t + recipe.body);
  body.connect(bg).connect(dest);
  body.start(t);
  body.stop(t + recipe.body + 0.03);

  const partial = click.ctx.createOscillator();
  partial.type = "sine";
  partial.frequency.value = recipe.pitch * 2.35;
  const pg = click.ctx.createGain();
  pg.gain.setValueAtTime(Math.max(0.0001, gain * 0.16 * recipe.hardness), t);
  pg.gain.exponentialRampToValueAtTime(0.0001, t + recipe.body * 0.48);
  partial.connect(pg).connect(dest);
  partial.start(t);
  partial.stop(t + recipe.body * 0.55 + 0.01);
}
