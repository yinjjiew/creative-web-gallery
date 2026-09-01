/**
 * Logarithmic depth. Equal scroll is equal decades of time, not equal rock.
 * A linear mapping through 4.54 Ga would put living memory in a film thinner
 * than varnish; the log axis is the cheat that makes the film readable, and
 * the steel rod in the shaft is the admission.
 */

export const YEAR_MIN = 0.25;
export const YEAR_MAX = 4.54e9;
export const CORE_METRES = 240;
export const CORE_WORLD = 48;

const LOG_MIN = Math.log10(YEAR_MIN);
const LOG_SPAN = Math.log10(YEAR_MAX) - LOG_MIN;

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function yearsAt(t: number): number {
  return 10 ** (LOG_MIN + LOG_SPAN * clamp01(t));
}

export function tAtYears(years: number): number {
  const y = Math.min(YEAR_MAX, Math.max(YEAR_MIN, years));
  return (Math.log10(y) - LOG_MIN) / LOG_SPAN;
}

/** Metres from the surface if this 240 m shaft were linear through 4.54 Ga. */
export function linearMetres(years: number): number {
  return (years / YEAR_MAX) * CORE_METRES;
}

export function logMetres(t: number): number {
  return clamp01(t) * CORE_METRES;
}

export function formatYears(years: number): string {
  if (years < 1.2) return "this year";
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 10_000) return `${(Math.round(years / 10) * 10).toLocaleString("en-US")} years`;
  if (years < 1_000_000) {
    const step = years < 100_000 ? 100 : 1_000;
    return `${(Math.round(years / step) * step).toLocaleString("en-US")} years`;
  }
  if (years < 1_000_000_000) {
    const ma = years / 1e6;
    const digits = ma < 10 ? 2 : ma < 100 ? 1 : 0;
    return `${ma.toFixed(digits)} million years`;
  }
  return `${(years / 1e9).toFixed(2)} billion years`;
}

export function formatLinear(metres: number): string {
  const um = metres * 1e6;
  const mm = metres * 1e3;
  if (um < 9.5) return `${um.toFixed(1)} µm`;
  if (mm < 1) return `${Math.round(um)} µm`;
  if (mm < 10) return `${mm.toFixed(2)} mm`;
  if (metres < 1) return `${mm.toFixed(1)} mm`;
  if (metres < 10) return `${metres.toFixed(2)} m`;
  return `${metres.toFixed(1)} m`;
}

export function formatLogMetres(metres: number): string {
  if (metres < 0.05) return "surface";
  if (metres < 10) return `${metres.toFixed(1)} m`;
  return `${Math.round(metres)} m`;
}
