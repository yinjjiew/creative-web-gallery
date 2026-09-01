/**
 * Tide — rules.
 *
 * Height is a three-mark cycle the player can read and cannot alter:
 *   phase  0   1   2   3   4   5
 *   name   LW  +   HW  HW  −   LW
 *   mark   0   1   2   2   1   0
 *
 * A cell covers when the mark is strictly above its elevation. Channel is
 * always covered. Reef is never walkable; it is sailable only when covered.
 * The dinghy moves only on covered water. A baulk is an obstacle on the dry
 * and a raft on the wet — the same object, opposite job. Landing on the mark
 * only counts when the cell itself is dry.
 *
 * Every action turns the tide one phase. Failure is information: undo is free.
 */

export const CYCLE = [0, 1, 2, 2, 1, 0] as const;
export const PHASE = ["LW", "+", "HW", "HW", "-", "LW"] as const;
export const PHASE_LONG = [
  "Low water",
  "Flood",
  "High water",
  "High water",
  "Ebb",
  "Low water",
] as const;

export type CellKind = "rock" | "land" | "channel" | "reef";

export type Cell = {
  kind: CellKind;
  /** Land 0–2, reef 0–1, channel −1, rock unused. */
  elev: number;
};

export type Pos = { x: number; y: number };

export type Level = {
  title: string;
  plate: string;
  harbour: string;
  teach: string;
  phase: number;
  grid: Cell[][];
  w: number;
  h: number;
  player: Pos;
  goal: Pos;
  boat: Pos | null;
  timbers: Pos[];
};

export type State = {
  phase: number;
  player: Pos;
  aboard: boolean;
  boat: Pos | null;
  timbers: Pos[];
  failed: boolean;
  won: boolean;
};

export type Dir = { x: number; y: number };

export type Event =
  | "walk"
  | "embark"
  | "sail"
  | "disembark"
  | "ride"
  | "push"
  | "wait"
  | "bump"
  | "splash"
  | "overboard"
  | "land"
  | "undo"
  | "reset"
  | "hw"
  | "lw";

export const DIRS: Record<string, Dir> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

export function markOf(phase: number): number {
  const i = ((phase % 6) + 6) % 6;
  return CYCLE[i]!;
}

export function flooded(cell: Cell, mark: number): boolean {
  if (cell.kind === "rock") return false;
  if (cell.kind === "channel") return true;
  return mark > cell.elev;
}

export function inBounds(level: Level, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.w && y < level.h;
}

export function cellAt(level: Level, x: number, y: number): Cell | null {
  if (!inBounds(level, x, y)) return null;
  return level.grid[y]![x]!;
}

export function same(a: Pos | null, x: number, y: number): boolean {
  return !!a && a.x === x && a.y === y;
}

export function timberAt(state: State, x: number, y: number): number {
  return state.timbers.findIndex((t) => t.x === x && t.y === y);
}

export function onTimber(state: State): boolean {
  return !state.aboard && timberAt(state, state.player.x, state.player.y) >= 0;
}

export function onBoat(state: State): boolean {
  return (
    state.aboard &&
    !!state.boat &&
    state.boat.x === state.player.x &&
    state.boat.y === state.player.y
  );
}

function occupiedCraft(state: State, x: number, y: number, skipTimber = -1): boolean {
  if (same(state.boat, x, y)) return true;
  return state.timbers.some((t, i) => i !== skipTimber && t.x === x && t.y === y);
}

/** A baulk may rest on anything but rock and high ground. */
export function timberSits(cell: Cell): boolean {
  if (cell.kind === "rock") return false;
  if (cell.kind === "land" && cell.elev >= 2) return false;
  return true;
}

export function walkable(
  level: Level,
  state: State,
  x: number,
  y: number
): boolean {
  const cell = cellAt(level, x, y);
  if (!cell || cell.kind === "rock") return false;
  if (cell.kind === "reef") return false;
  const mark = markOf(state.phase);
  if (flooded(cell, mark)) return false;
  return true;
}

export function sailable(
  level: Level,
  state: State,
  x: number,
  y: number
): boolean {
  const cell = cellAt(level, x, y);
  if (!cell || cell.kind === "rock") return false;
  return flooded(cell, markOf(state.phase));
}

export function initial(level: Level): State {
  return {
    phase: level.phase,
    player: { ...level.player },
    aboard: !!(
      level.boat &&
      level.boat.x === level.player.x &&
      level.boat.y === level.player.y
    ),
    boat: level.boat ? { ...level.boat } : null,
    timbers: level.timbers.map((t) => ({ ...t })),
    failed: false,
    won: false,
  };
}

export function clone(s: State): State {
  return {
    phase: s.phase,
    player: { ...s.player },
    aboard: s.aboard,
    boat: s.boat ? { ...s.boat } : null,
    timbers: s.timbers.map((t) => ({ ...t })),
    failed: s.failed,
    won: s.won,
  };
}

function landed(level: Level, state: State): boolean {
  if (state.player.x !== level.goal.x || state.player.y !== level.goal.y) {
    return false;
  }
  const cell = cellAt(level, level.goal.x, level.goal.y);
  if (!cell) return false;
  return !flooded(cell, markOf(state.phase));
}

function settle(level: Level, state: State, events: Event[]): State {
  if (landed(level, state)) {
    state.won = true;
    events.push("land");
    return state;
  }
  const before = markOf(state.phase);
  state.phase = (state.phase + 1) % 6;
  const after = markOf(state.phase);
  if (before !== 0 && after === 0) events.push("lw");
  if (before !== 2 && after === 2) events.push("hw");

  const cell = cellAt(level, state.player.x, state.player.y);
  const wet = !!cell && flooded(cell, markOf(state.phase));
  const afloat = onBoat(state) || onTimber(state);
  if (wet && !afloat) {
    state.failed = true;
    events.push("overboard");
  }
  if (!state.failed && landed(level, state)) {
    state.won = true;
    events.push("land");
  }
  return state;
}

export type Act = { ok: boolean; state: State; events: Event[] };

function refuse(state: State, events: Event[]): Act {
  return { ok: false, state, events };
}

export function wait(level: Level, state: State): Act {
  if (state.failed || state.won) return refuse(state, []);
  const next = clone(state);
  const events: Event[] = ["wait"];
  settle(level, next, events);
  return { ok: true, state: next, events };
}

export function move(level: Level, state: State, dir: Dir): Act {
  if (state.failed || state.won) return refuse(state, []);
  const nx = state.player.x + dir.x;
  const ny = state.player.y + dir.y;
  const dest = cellAt(level, nx, ny);
  if (!dest || dest.kind === "rock") return refuse(state, ["bump"]);

  const next = clone(state);
  const events: Event[] = [];
  const mark = markOf(state.phase);
  const destWet = flooded(dest, mark);
  const destTimber = timberAt(next, nx, ny);
  const destBoat = same(next.boat, nx, ny);

  if (onBoat(next)) {
    if (destBoat) return refuse(state, ["bump"]);
    // Grounded baulk: the log is in the way. Floating baulk: step onto the raft.
    if (destTimber >= 0 && !destWet) return refuse(state, ["bump"]);
    if (destTimber >= 0 && destWet) {
      next.player = { x: nx, y: ny };
      next.aboard = false;
      events.push("disembark");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (walkable(level, next, nx, ny)) {
      next.player = { x: nx, y: ny };
      next.aboard = false;
      events.push("disembark");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (sailable(level, next, nx, ny)) {
      next.player = { x: nx, y: ny };
      next.boat = { x: nx, y: ny };
      events.push("sail");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (destWet) return refuse(state, ["splash"]);
    return refuse(state, ["bump"]);
  }

  if (onTimber(next)) {
    const ti = timberAt(next, next.player.x, next.player.y);
    if (destBoat) {
      next.player = { x: nx, y: ny };
      next.aboard = true;
      events.push("embark");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (destTimber >= 0) {
      next.player = { x: nx, y: ny };
      events.push("walk");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (walkable(level, next, nx, ny)) {
      next.player = { x: nx, y: ny };
      events.push("walk");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (sailable(level, next, nx, ny) && ti >= 0 && !occupiedCraft(next, nx, ny, ti)) {
      next.timbers[ti] = { x: nx, y: ny };
      next.player = { x: nx, y: ny };
      events.push("ride");
      settle(level, next, events);
      return { ok: true, state: next, events };
    }
    if (destWet) return refuse(state, ["splash"]);
    return refuse(state, ["bump"]);
  }

  // On foot.
  if (destBoat) {
    next.player = { x: nx, y: ny };
    next.aboard = true;
    events.push("embark");
    settle(level, next, events);
    return { ok: true, state: next, events };
  }

  if (destTimber >= 0) {
    if (!destWet) {
      const bx = nx + dir.x;
      const by = ny + dir.y;
      const beyond = cellAt(level, bx, by);
      if (
        beyond &&
        timberSits(beyond) &&
        !occupiedCraft(next, bx, by, destTimber) &&
        !same(next.player, bx, by)
      ) {
        next.timbers[destTimber] = { x: bx, y: by };
        next.player = { x: nx, y: ny };
        events.push("push");
        settle(level, next, events);
        return { ok: true, state: next, events };
      }
      return refuse(state, ["bump"]);
    }
    next.player = { x: nx, y: ny };
    events.push("walk");
    settle(level, next, events);
    return { ok: true, state: next, events };
  }

  if (walkable(level, next, nx, ny)) {
    next.player = { x: nx, y: ny };
    events.push("walk");
    settle(level, next, events);
    return { ok: true, state: next, events };
  }

  if (destWet) return refuse(state, ["splash"]);
  return refuse(state, ["bump"]);
}

export function sounding(x: number, y: number): string {
  const n = ((x * 17 + y * 31 + 4) % 19) + 1;
  if (n >= 10) return String(n);
  return `${n}`;
}
