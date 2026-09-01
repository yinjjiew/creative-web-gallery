import { emptySitting } from "./seed";
import type { Sitting } from "./types";

export const STORAGE_KEY = "intake:sitting:v1";

export function loadSitting(): Sitting {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySitting();
    const parsed = JSON.parse(raw) as Sitting;
    if (!parsed?.today || !Array.isArray(parsed.steps)) return emptySitting();
    return {
      today: parsed.today,
      youId: parsed.youId ?? null,
      steps: parsed.steps,
    };
  } catch {
    return emptySitting();
  }
}

export function saveSitting(sitting: Sitting): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sitting));
  } catch {
    /* private mode — the sitting lives for this tab only */
  }
}
