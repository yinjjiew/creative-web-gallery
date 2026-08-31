/**
 * A recipe is the whole print, written down. It lives in the URL fragment, so
 * a sheet you like is a link, and re-opening it prints the same file.
 */
import { DEVICE_BY_ID } from "./devices";
import { PALETTE_BY_ID } from "./inks";
import type { Recipe } from "./press";
import { SCORES, type ScoreId } from "./scores";

export const RULING_MIN = 90;
export const RULING_MAX = 400;

/**
 * The sheet the press opens on.
 *
 * Chosen to pass its own press check rather than to be loud. A white lock clock
 * on a light stock cannot reach 4.5:1 — that is physics, not a bug — so the
 * opening print is on dark card, where the clock, the icon labels and the dock
 * all read, and where two opaque inks show what the press does that a gradient
 * cannot.
 */
export const DEFAULT_RECIPE: Recipe = {
  edition: "MARGIN",
  score: "terrace",
  palette: "late-edition",
  weight: 54,
  ruling: 210,
  slip: 6,
  grain: 62,
  quiet: true,
  hidden: [],
  device: "iphone-15-pro",
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function encodeRecipe(r: Recipe): string {
  const q = new URLSearchParams();
  q.set("e", r.edition);
  q.set("s", r.score);
  q.set("i", r.palette);
  q.set("d", r.device);
  q.set("w", String(Math.round(r.weight)));
  q.set("r", String(Math.round(r.ruling)));
  q.set("m", String(Math.round(r.slip)));
  q.set("g", String(Math.round(r.grain)));
  q.set("q", r.quiet ? "1" : "0");
  if (r.hidden.length) q.set("x", r.hidden.join("."));
  return q.toString();
}

export function decodeRecipe(fragment: string): Recipe {
  const q = new URLSearchParams(fragment.replace(/^#/, ""));
  const out = { ...DEFAULT_RECIPE };
  const edition = q.get("e");
  if (edition && /^[A-Z0-9]{1,10}$/i.test(edition)) out.edition = edition.toUpperCase();

  const score = q.get("s");
  if (score && SCORES.some((x) => x.id === score)) out.score = score as ScoreId;

  const palette = q.get("i");
  if (palette && PALETTE_BY_ID.has(palette)) out.palette = palette;

  const device = q.get("d");
  if (device && DEVICE_BY_ID.has(device)) out.device = device;

  const num = (key: string, lo: number, hi: number, fallback: number) => {
    const raw = q.get(key);
    if (raw === null) return fallback;
    const v = Number(raw);
    return Number.isFinite(v) ? clamp(Math.round(v), lo, hi) : fallback;
  };
  out.weight = num("w", 0, 100, out.weight);
  out.ruling = num("r", RULING_MIN, RULING_MAX, out.ruling);
  out.slip = num("m", 0, 24, out.slip);
  out.grain = num("g", 0, 100, out.grain);
  if (q.get("q") !== null) out.quiet = q.get("q") === "1";

  const hidden = q.get("x");
  if (hidden) {
    out.hidden = hidden
      .split(".")
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v >= 0 && v < 4);
  }
  return out;
}

export function fileName(r: Recipe, w: number, h: number): string {
  return `press-${r.score}-${r.palette}-${r.edition.toLowerCase()}-${w}x${h}.png`;
}
