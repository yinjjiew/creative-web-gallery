/**
 * The press check.
 *
 * These are measurements of the rendered preview, not estimates: the pixels in
 * each furniture zone are sampled and reduced to a mean relative luminance and
 * a standard deviation. Contrast ratios use the WCAG formula against white and
 * against black type.
 *
 * Why it earns its place: iOS draws the lock clock in white whatever the
 * wallpaper does, so a pale composition behind it is unreadable no matter how
 * nice the print is. And icon labels fail on a busy field even at good average
 * contrast, which is what the deviation figure is for.
 */
import { zonesFor, type Device } from "./devices";

export type Reading = {
  id: string;
  label: string;
  /** Mean relative luminance, 0–1. */
  luma: number;
  /** Standard deviation of luminance across the zone, 0–1. */
  spread: number;
  white: number;
  black: number;
  verdict: "reads" | "tight" | "fails";
  calm: "calm" | "lively" | "busy";
};

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

export const LOCK_DIM = 0.22;

export function readZones(
  canvas: HTMLCanvasElement,
  device: Device,
  dimmed: boolean
): Reading[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width === 0) return [];
  const keep = dimmed ? 1 - LOCK_DIM : 1;

  return zonesFor(device).map(({ id, label, rect }) => {
    const x = Math.max(0, Math.round(rect.x * canvas.width));
    const y = Math.max(0, Math.round(rect.y * canvas.height));
    const w = Math.max(1, Math.min(canvas.width - x, Math.round(rect.w * canvas.width)));
    const h = Math.max(1, Math.min(canvas.height - y, Math.round(rect.h * canvas.height)));
    const data = ctx.getImageData(x, y, w, h).data;

    const stride = Math.max(1, Math.floor(Math.sqrt((w * h) / 4000)));
    let n = 0;
    let sum = 0;
    let sumSq = 0;
    for (let py = 0; py < h; py += stride) {
      for (let px = 0; px < w; px += stride) {
        const i = (py * w + px) * 4;
        const l =
          0.2126 * channel(data[i] * keep) +
          0.7152 * channel(data[i + 1] * keep) +
          0.0722 * channel(data[i + 2] * keep);
        sum += l;
        sumSq += l * l;
        n += 1;
      }
    }
    const luma = n ? sum / n : 0;
    const spread = n ? Math.sqrt(Math.max(0, sumSq / n - luma * luma)) : 0;
    const white = ratio(1, luma);
    const black = ratio(0, luma);
    // The clock is white type, so it is judged on white contrast alone. Icon
    // labels and dock glyphs are white with a shadow, so they get the same test
    // but tolerate less.
    const best = id === "clock" ? white : Math.max(white, black);
    return {
      id,
      label,
      luma,
      spread,
      white,
      black,
      verdict: best >= 4.5 ? "reads" : best >= 2.8 ? "tight" : "fails",
      calm: spread < 0.055 ? "calm" : spread < 0.12 ? "lively" : "busy",
    };
  });
}
