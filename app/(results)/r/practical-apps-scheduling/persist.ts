import type { Placement, Term } from "./model";

const KEY = "peripatetic.v1";

export type Saved = {
  term: Term;
  placements: Placement[];
  drafted: string[];
};

export function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (parsed.term !== "autumn" && parsed.term !== "spring") return null;
    if (!Array.isArray(parsed.placements) || !Array.isArray(parsed.drafted)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function save(state: Saved): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clear(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
