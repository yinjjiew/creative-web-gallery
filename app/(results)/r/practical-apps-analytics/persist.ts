import { DEFAULT_SESSION, isOfferId, type Session } from "./decide";
import { titleById } from "./shop";

const KEY = "quire-shelf-sunday-2026-09-06";

export function load(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    const taken = Array.isArray(parsed.taken)
      ? parsed.taken.filter((id): id is string => typeof id === "string" && isOfferId(id))
      : [];
    const left = Array.isArray(parsed.left)
      ? parsed.left.filter((id): id is string => typeof id === "string" && isOfferId(id))
      : [];
    const testId =
      typeof parsed.testId === "string" && titleById(parsed.testId)
        ? parsed.testId
        : DEFAULT_SESSION.testId;
    const orderLocal =
      typeof parsed.orderLocal === "number"
        ? clamp(parsed.orderLocal, 1, 12)
        : DEFAULT_SESSION.orderLocal;
    const orderNovel =
      typeof parsed.orderNovel === "number"
        ? clamp(parsed.orderNovel, 1, 12)
        : DEFAULT_SESSION.orderNovel;
    return { taken, left, testId, orderLocal, orderNovel };
  } catch {
    return null;
  }
}

export function save(session: Session): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* private mode */
  }
}

export function clear(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}
