import type { Cell, Level, Pos } from "./engine";

/**
 * Hand-drawn plates. Each teaches one question. New mechanics stop at Shove;
 * the last three only recombine rules the player already has.
 *
 *   # rock    . high (2)    , shelf (1)    _ flats (0)
 *   ~ channel    r reef@1    R reef@0
 *   @ *  player / mark on high
 *   o    mark on shelf
 *   B b  dinghy on channel / flats
 *   t s  baulk on channel / flats
 *
 * Boat plates sit in a rock frame so a channel cannot be sailed around.
 */

type Spec = {
  title: string;
  plate: string;
  harbour: string;
  teach: string;
  phase: number;
  rows: string[];
};

const TERRAIN: Record<string, Cell> = {
  "#": { kind: "rock", elev: 99 },
  ".": { kind: "land", elev: 2 },
  ",": { kind: "land", elev: 1 },
  _: { kind: "land", elev: 0 },
  "~": { kind: "channel", elev: -1 },
  r: { kind: "reef", elev: 1 },
  R: { kind: "reef", elev: 0 },
};

const ENTITY: Record<
  string,
  { who: "player" | "goal" | "boat" | "timber"; under: string }
> = {
  "@": { who: "player", under: "." },
  "*": { who: "goal", under: "." },
  o: { who: "goal", under: "," },
  B: { who: "boat", under: "~" },
  b: { who: "boat", under: "_" },
  t: { who: "timber", under: "~" },
  s: { who: "timber", under: "_" },
};

function parse(spec: Spec): Level {
  const h = spec.rows.length;
  const w = spec.rows[0]?.length ?? 0;
  const grid: Cell[][] = [];
  let player: Pos | null = null;
  let goal: Pos | null = null;
  let boat: Pos | null = null;
  const timbers: Pos[] = [];

  for (let y = 0; y < h; y++) {
    const row = spec.rows[y] ?? "";
    if (row.length !== w) {
      throw new Error(`level ${spec.plate}: jagged row ${y}`);
    }
    const cells: Cell[] = [];
    for (let x = 0; x < w; x++) {
      const ch = row[x] ?? "#";
      const ent = ENTITY[ch];
      if (ent) {
        const under = TERRAIN[ent.under];
        if (!under) throw new Error(`bad under ${ent.under}`);
        cells.push({ ...under });
        if (ent.who === "player") player = { x, y };
        if (ent.who === "goal") goal = { x, y };
        if (ent.who === "boat") boat = { x, y };
        if (ent.who === "timber") timbers.push({ x, y });
      } else {
        const t = TERRAIN[ch];
        if (!t) throw new Error(`level ${spec.plate}: bad char ${ch}`);
        cells.push({ ...t });
      }
    }
    grid.push(cells);
  }

  if (!player || !goal) throw new Error(`level ${spec.plate}: missing @ or *`);

  return {
    title: spec.title,
    plate: spec.plate,
    harbour: spec.harbour,
    teach: spec.teach,
    phase: spec.phase,
    grid,
    w,
    h,
    player,
    goal,
    boat,
    timbers,
  };
}

const SPECS: Spec[] = [
  {
    title: "The quay",
    plate: "1",
    harbour: "St. Mawes",
    teach: "A dry quay. Arrows, WASD, or a swipe. The tide is already turning.",
    phase: 2,
    rows: [
      "#######",
      "#~~.~~#",
      "#~.@.*#",
      "#~~.~~#",
      "#######",
    ],
  },
  {
    title: "Wait the ebb",
    plate: "2",
    harbour: "Helford",
    teach: "The shelf covers at high water. Wait it out, then walk.",
    phase: 2,
    rows: [
      "#######",
      "#.....#",
      "#@,,,*#",
      "#.....#",
      "#######",
    ],
  },
  {
    title: "A fair start",
    plate: "3",
    harbour: "Coverack",
    teach: "The water does not wait. Leave now, or the shelf takes you.",
    phase: 0,
    rows: [
      "#######",
      "#.....#",
      "#@,..*#",
      "#.....#",
      "#######",
    ],
  },
  {
    title: "The dinghy",
    plate: "4",
    harbour: "St. Anthony",
    teach: "Step into the dinghy from the quay. She only moves on water.",
    phase: 0,
    rows: [
      "######",
      "#@~~*#",
      "#.B~.#",
      "######",
    ],
  },
  {
    title: "Until she floats",
    plate: "5",
    harbour: "Gillan",
    teach: "A dinghy on the flats will not move until the water comes back.",
    phase: 0,
    rows: [
      "######",
      "#@b_*#",
      "######",
    ],
  },
  {
    title: "Overfall",
    plate: "6",
    harbour: "The Manacles",
    teach: "The reef is a wall on the dry and a path at high water.",
    phase: 5,
    rows: [
      "########",
      "#@~~R.*#",
      "#.B~~#.#",
      "########",
    ],
  },
  {
    title: "The other pool",
    plate: "7",
    harbour: "Porthallow",
    teach: "Two lagoons, one divide. Take her over when it covers.",
    phase: 5,
    rows: [
      "########",
      "#@~##.*#",
      "#..Br~.#",
      "#~~~#~~#",
      "########",
    ],
  },
  {
    title: "Leave her",
    plate: "8",
    harbour: "Durgan",
    teach: "Park on the reef at high water. Step off when the shelf dries.",
    phase: 0,
    rows: [
      "#######",
      "#@.#o##",
      "#~B~r~#",
      "#~~~~~#",
      "#######",
    ],
  },
  {
    title: "A short tide",
    plate: "9",
    harbour: "Porthoustock",
    teach: "The window is four turns. A wasted wait closes it.",
    phase: 5,
    rows: [
      "########",
      "#@~RR.*#",
      "#.B~~#.#",
      "########",
    ],
  },
  {
    title: "Baulk",
    plate: "10",
    harbour: "Flushing",
    teach: "A baulk in a covered sound is a bridge. Walk it.",
    phase: 2,
    rows: [
      "#####",
      "#@s*#",
      "#####",
    ],
  },
  {
    title: "The same baulk",
    plate: "11",
    harbour: "Flushing",
    teach: "The same log, low water: it blocks the flats. Wait, then walk over.",
    phase: 0,
    rows: [
      "#####",
      "#@s*#",
      "#####",
    ],
  },
  {
    title: "Shove",
    plate: "12",
    harbour: "Mylor",
    teach: "Push the baulk into the channel. Then ride it.",
    phase: 0,
    rows: [
      "#######",
      "#@.s~*#",
      "#~~~~##",
      "#######",
    ],
  },
  {
    title: "Reef then shelf",
    plate: "13",
    harbour: "Restronguet",
    teach: "High water for the reef. Low water to land on the mark.",
    phase: 5,
    rows: [
      "#########",
      "##.###.##",
      "#@.Br~~o#",
      "#..~#~~~#",
      "#########",
    ],
  },
  {
    title: "Dinghy and baulk",
    plate: "14",
    harbour: "Loe Beach",
    teach: "The dinghy over the reef; the baulk over the last sound.",
    phase: 5,
    rows: [
      "########",
      "#@~r~s*#",
      "#.B~~###",
      "########",
    ],
  },
  {
    title: "The harbour",
    plate: "15",
    harbour: "Falmouth",
    teach: "One harbour. You already know the water.",
    phase: 5,
    rows: [
      "##########",
      "###.######",
      "#@B~~r~~o#",
      "#....#~~.#",
      "#~~~~~#~~#",
      "##########",
    ],
  },
];

export const LEVELS: Level[] = SPECS.map(parse);

export const SAVE_KEY = "tide-chart-progress";

export type Save = {
  done: number[];
  plate: number;
};

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { done: [], plate: 0 };
    const v = JSON.parse(raw) as Save;
    if (!Array.isArray(v.done) || typeof v.plate !== "number") {
      return { done: [], plate: 0 };
    }
    return {
      done: v.done.filter((n) => n >= 0 && n < LEVELS.length),
      plate: Math.max(0, Math.min(LEVELS.length - 1, v.plate)),
    };
  } catch {
    return { done: [], plate: 0 };
  }
}

export function writeSave(save: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode */
  }
}
