import type { Saved } from "./types";

const KEY = "kerr-literary:desk:v1";

const EMPTY: Saved = { chases: {}, exclusives: {}, bids: {}, notes: [] };

export function load(): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Saved;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      chases: parsed.chases && typeof parsed.chases === "object" ? parsed.chases : {},
      exclusives:
        parsed.exclusives && typeof parsed.exclusives === "object" ? parsed.exclusives : {},
      bids: parsed.bids && typeof parsed.bids === "object" ? parsed.bids : {},
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch {
    return EMPTY;
  }
}

export function save(state: Saved): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode, quota — the desk still works for the session */
  }
}

export function clear(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
