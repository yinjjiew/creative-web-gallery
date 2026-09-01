/** The camera is still. These are the only numbers that move. */

export const YEAR_MIN = 1962;
export const YEAR_MAX = 2024;
export const YEAR_START = 1962;

export type Span = readonly [number, number];

export function clampYear(year: number) {
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, year));
}

export function shown(year: number, spans: readonly Span[]) {
  return spans.some(([from, until]) => year >= from && year < until);
}

export function nearestYear(value: number) {
  return clampYear(Math.round(value));
}
