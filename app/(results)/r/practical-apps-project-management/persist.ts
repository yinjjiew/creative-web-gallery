const KEY = "getin:salt-line:v1";

export type Saved = {
  done: Record<string, string>;
  offset: number;
};

export function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (!parsed || typeof parsed.done !== "object" || parsed.done === null) {
      return null;
    }
    return {
      done: parsed.done,
      offset: typeof parsed.offset === "number" ? parsed.offset : 0,
    };
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
