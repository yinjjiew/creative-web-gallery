/**
 * Levee — rules.
 *
 * The opponent is a heightfield. Water goes from high surface to low surface.
 * A bank is a crest on the land side of a channel edge. Water crosses that
 * edge only when the channel surface is above the crest. Volume is conserved
 * until it reaches the sea, so closing one spill sends the same pulse to the
 * next-lowest crest. That is the whole of the intelligence.
 *
 * A bank fails (breach) when the head against it is high and the freeboard is
 * almost gone. Brace multiplies strength for the day. Cut sets crest to zero
 * and opens a spillway. Raise adds permanent height and costs stone.
 *
 * Elevations are modelled survey feet. The hydrograph is invented. The habit
 * of the water is not.
 */

export const COLS = 9;
export const ROWS = 12;

export type Use =
  | "upland"
  | "channel"
  | "field"
  | "town"
  | "hamlet"
  | "port"
  | "marsh"
  | "sea";

export type Cell = {
  x: number;
  y: number;
  use: Use;
  elev: number;
  water: number;
  crest: number;
  strength: number;
  braced: boolean;
  cut: boolean;
  wetDays: number;
  lost: boolean;
  people: number;
  people0: number;
  name: string | null;
  sent: boolean;
};

export type Event =
  | "raise"
  | "brace"
  | "cut"
  | "send"
  | "refuse"
  | "overtop"
  | "breach"
  | "pulse"
  | "drown"
  | "end";

export type Ending = "held" | "seat" | "trade" | "lost" | null;

export type Game = {
  cells: Cell[][];
  day: number;
  stage: number;
  stone: number;
  crews: number;
  crewsMax: number;
  events: Event[];
  log: string;
  ending: Ending;
};

/** Incoming surface at the inlet, in modelled feet. Day 0 is the sheet as found. */
export const HYDRO = [1.35, 1.82, 2.22, 2.62, 3.02, 3.22, 2.98, 2.42, 1.82];
export const LAST = HYDRO.length - 1;
/** Fixed substeps in a day's pulse. Wall-clock pacing lives in Levee. */
export const PULSE_STEPS = 32;
export const PULSE_DT = 0.22;
export const STONE0 = 10;
export const CREWS0 = 2;
export const RAISE = 0.7;
export const RAISE_COST = 2;
export const CREST_MAX = 3.45;
export const SEA0 = 0.16;

export function seaOf(stage: number): number {
  return SEA0 + Math.max(0, stage - 1.2) * 0.62;
}

const USE_KEY: Record<string, Use> = {
  U: "upland",
  C: "channel",
  F: "field",
  A: "town",
  P: "hamlet",
  O: "port",
  M: "marsh",
  S: "sea",
};

/**
 * A split around a cane island, Avery on the right bank, Pecan in the left
 * polder, the parish seat on the reach above the gulf. The left bank is older
 * and lower. That is the designed weakness.
 */
const PLAT = [
  "UUUCCUUUU",
  "UUFCCAUUU",
  "UFFCCAAUU",
  "UFFCCCAUU",
  "FFCCFCCFU",
  "FPCFFFCFU",
  "FFCFFFCFU",
  "FFCCFCCFU",
  "MFFCCCFMU",
  "MMFCOOFMS",
  "SSMCOOMSS",
  "SSSSSSSSS",
];

const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function cellAt(g: Game, x: number, y: number): Cell | null {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
  return g.cells[y]?.[x] ?? null;
}

export function surface(c: Cell): number {
  return c.elev + c.water;
}

export function barrier(c: Cell): number {
  return c.elev + c.crest;
}

export function isWet(c: Cell): boolean {
  if (c.use === "channel" || c.use === "sea") return true;
  return c.water > 0.08;
}

export function inundated(c: Cell): boolean {
  return (c.use === "town" || c.use === "hamlet" || c.use === "port") && c.water > 0.28;
}

export function hasBank(c: Cell): boolean {
  return c.crest > 0 || c.cut;
}

export function settlement(c: Cell): boolean {
  return c.use === "town" || c.use === "hamlet" || c.use === "port";
}

export function neighbors(g: Game, c: Cell): Cell[] {
  const out: Cell[] = [];
  for (const [dx, dy] of N4) {
    const n = cellAt(g, c.x + dx, c.y + dy);
    if (n) out.push(n);
  }
  return out;
}

export function channelBeside(g: Game, c: Cell): Cell | null {
  let best: Cell | null = null;
  for (const n of neighbors(g, c)) {
    if (n.use !== "channel") continue;
    if (!best || surface(n) > surface(best)) best = n;
  }
  return best;
}

function elevFor(use: Use, x: number, y: number): number {
  if (use === "channel") return 0;
  if (use === "sea") return -0.85;
  if (use === "upland") return 3.55;
  if (use === "marsh") return 0.38;
  if (use === "town") return 1.1;
  if (use === "hamlet") return 0.62;
  if (use === "port") return 0.75;
  // Cane: the left polder is the bowl.
  if (x <= 2) return 0.52 + y * 0.012;
  if (x >= 6) return 0.88;
  return 0.96;
}

function bankFor(use: Use, x: number): { crest: number; strength: number } {
  if (use === "upland") return { crest: 3.4, strength: 0.95 };
  if (use === "town") return { crest: 2.0, strength: 0.72 };
  if (use === "port") return { crest: 1.38, strength: 0.58 };
  if (use === "hamlet") return { crest: 1.62, strength: 0.5 };
  if (use === "marsh") return { crest: 1.28, strength: 0.34 };
  if (use === "field" && x <= 2) return { crest: 1.58, strength: 0.62 };
  if (use === "field") return { crest: 1.82, strength: 0.56 };
  return { crest: 0, strength: 0 };
}

function peopleFor(use: Use): number {
  if (use === "town") return 140;
  if (use === "hamlet") return 70;
  if (use === "port") return 275;
  return 0;
}

function nameFor(use: Use, x: number, y: number): string | null {
  if (use === "town" && x === 5 && y === 1) return "Avery";
  if (use === "hamlet") return "Pecan";
  if (use === "port" && x === 4 && y === 9) return "Port Reach";
  return null;
}

export function createGame(): Game {
  const cells: Cell[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: Cell[] = [];
    const line = PLAT[y] ?? "";
    for (let x = 0; x < COLS; x++) {
      const use = USE_KEY[line[x] ?? "U"] ?? "upland";
      const people = peopleFor(use);
      row.push({
        x,
        y,
        use,
        elev: elevFor(use, x, y),
        water: 0,
        crest: 0,
        strength: 0,
        braced: false,
        cut: false,
        wetDays: 0,
        lost: false,
        people,
        people0: people,
        name: nameFor(use, x, y),
        sent: false,
      });
    }
    cells.push(row);
  }

  const g: Game = {
    cells,
    day: 0,
    stage: HYDRO[0] ?? 1.35,
    stone: STONE0,
    crews: CREWS0,
    crewsMax: CREWS0,
    events: [],
    log: "Two crews. Ten barge-loads of stone. The river does not care.",
    ending: null,
  };

  for (const row of cells) {
    for (const c of row) {
      if (c.use === "channel") {
        c.water = Math.max(0, g.stage - c.elev);
      } else if (c.use === "sea") {
        c.water = seaOf(g.stage) - c.elev;
      } else if (channelBeside(g, c) && c.use !== "upland") {
        const b = bankFor(c.use, c.x);
        c.crest = b.crest;
        c.strength = b.strength;
      }
    }
  }

  return g;
}

export function clone(g: Game): Game {
  return {
    ...g,
    cells: g.cells.map((row) => row.map((c) => ({ ...c }))),
    events: [...g.events],
  };
}

export function each(g: Game, fn: (c: Cell) => void) {
  for (const row of g.cells) for (const c of row) fn(c);
}

export function towns(g: Game): { name: string; people: number; people0: number; wet: boolean; sent: boolean }[] {
  const seen = new Map<string, { name: string; people: number; people0: number; wet: boolean; sent: boolean }>();
  const label: Record<Use, string> = {
    town: "Avery",
    hamlet: "Pecan",
    port: "Port Reach",
    upland: "",
    channel: "",
    field: "",
    marsh: "",
    sea: "",
  };
  each(g, (c) => {
    if (!settlement(c)) return;
    const name = c.name ?? label[c.use];
    const cur = seen.get(name) ?? {
      name,
      people: 0,
      people0: 0,
      wet: false,
      sent: true,
    };
    cur.people += c.people;
    cur.people0 += c.people0;
    cur.wet = cur.wet || inundated(c);
    cur.sent = cur.sent && c.sent;
    seen.set(name, cur);
  });
  return [...seen.values()];
}

export function caneLost(g: Game): { lost: number; total: number } {
  let lost = 0;
  let total = 0;
  each(g, (c) => {
    if (c.use !== "field") return;
    total += 1;
    if (c.lost || c.water > 0.28) lost += 1;
  });
  return { lost, total };
}

export function weakest(g: Game): Cell | null {
  let best: Cell | null = null;
  let bestFree = Infinity;
  each(g, (c) => {
    // The marsh is supposed to go under. The decision is the old left
    // bank, Avery, and the reach — not a bowl that was never defended.
    if (c.use === "marsh" || c.use === "upland") return;
    if (!hasBank(c) || c.cut) return;
    const ch = channelBeside(g, c);
    if (!ch) return;
    const free = barrier(c) - g.stage;
    if (free < bestFree) {
      bestFree = free;
      best = c;
    }
  });
  return best;
}

export function willOvertop(g: Game, c: Cell, stage = g.stage): boolean {
  if (c.cut) return true;
  if (!hasBank(c)) return false;
  return stage > barrier(c) + 0.02;
}

export function forecast(g: Game, c: Cell): "holds" | "overtop" | "cut" | "dry" {
  if (c.cut) return "cut";
  if (!hasBank(c)) return "dry";
  const next = HYDRO[Math.min(g.day + 1, LAST)] ?? g.stage;
  if (willOvertop(g, c, next)) return "overtop";
  return "holds";
}

/**
 * One fixed substep.
 *
 * The mouth cannot pass the flood — that is why there is a flood. Channel
 * cells share a surface quickly; the gulf takes water slowly; a bank only
 * when the surface is over the crest. A cut is a second mouth. Closing one
 * spill therefore raises every other crest relative to the same pulse.
 */
export function step(g: Game, dt: number) {
  const next = g.cells.map((row) => row.map((c) => c.water));

  const add = (c: Cell, amt: number) => {
    const row = next[c.y];
    if (!row) return;
    row[c.x] = (row[c.x] ?? 0) + amt;
  };

  each(g, (c) => {
    if (c.use === "sea") {
      add(c, (seaOf(g.stage) - c.elev - c.water) * 0.9 * dt);
    }
  });

  each(g, (c) => {
    for (const n of neighbors(g, c)) {
      if (n.x < c.x || (n.x === c.x && n.y < c.y)) continue;
      const high = surface(c) >= surface(n) ? c : n;
      const low = high === c ? n : c;
      if (surface(high) - surface(low) < 0.004) continue;

      let k = 0.16;
      let floor = surface(low);
      const seaish = c.use === "sea" || n.use === "sea";
      const chPair = c.use === "channel" && n.use === "channel";
      const land = high.use === "channel" || high.use === "sea" ? low : high;
      const wet = land === high ? low : high;
      const banked = hasBank(land) && (wet.use === "channel" || wet.use === "sea");

      if (chPair) {
        k = 1.05;
      } else if (seaish && (c.use === "channel" || n.use === "channel")) {
        k = 0.008;
      } else if (seaish) {
        k = 0.2;
      } else if (banked) {
        const brim = barrier(land);
        if (surface(high) <= brim + 0.001) continue;
        floor = Math.max(surface(low), brim);
        k = land.cut ? 1.7 : 0.1;
        g.events.push("overtop");
      } else if (high.use !== "channel" && low.use !== "channel") {
        k = 0.55;
        // Towns sit on a slight berm. Overland water prefers the polder.
        if (settlement(low)) {
          const berm = low.elev + 0.92;
          if (surface(high) <= berm) continue;
          floor = Math.max(floor, berm);
        }
      }

      const head = surface(high) - floor;
      if (head <= 0) continue;
      const flow = Math.min(high.water * 0.2, k * head * dt);
      add(high, -flow);
      add(low, flow);
    }
  });

  each(g, (c) => {
    const row = next[c.y];
    c.water = Math.max(0, row?.[c.x] ?? 0);
    if (c.use === "upland") c.water = 0;
  });

  // The reach shares a head. The gauge is that number.
  let sum = 0;
  let n = 0;
  each(g, (c) => {
    if (c.use !== "channel") return;
    sum += c.water;
    n += 1;
  });
  if (n > 0) {
    const mean = sum / n;
    each(g, (c) => {
      if (c.use !== "channel") return;
      c.water += (mean - c.water) * 0.72;
    });
  }

  each(g, (c) => {
    if (!hasBank(c) || c.cut) return;
    const ch = channelBeside(g, c);
    if (!ch) return;
    const h = surface(ch);
    const head = h - c.elev;
    const near = h > barrier(c) - 0.05;
    const limit = c.strength * (c.braced ? 4.3 : 3.4);
    if (near && head > limit) {
      c.crest = 0;
      c.cut = true;
      c.strength = 0.12;
      g.events.push("breach");
    }
  });
}

function settleDay(g: Game) {
  const drowned: string[] = [];
  each(g, (c) => {
    c.braced = false;
    if (c.use === "field") {
      if (c.water > 0.12) c.wetDays += 1;
      if (c.wetDays >= 1 || c.water > 0.28) c.lost = true;
    }
    if (settlement(c) && c.water > 0.36 && !c.sent && c.people > 0) {
      c.people = 0;
      if (c.name) drowned.push(c.name);
      else if (c.use === "town") drowned.push("Avery");
      else if (c.use === "port") drowned.push("Port Reach");
      g.events.push("drown");
    }
  });
  if (drowned.length) {
    g.log = `${unique(drowned).join(", ")} is in the water.`;
  }
}

function unique(xs: string[]): string[] {
  return [...new Set(xs)];
}

export function endingOf(g: Game): Ending {
  const list = towns(g);
  const port = list.find((t) => t.name === "Port Reach");
  const avery = list.find((t) => t.name === "Avery");
  const cane = caneLost(g);
  const portDown = !port || port.people === 0 || port.wet;
  const averyDown = !avery || avery.people === 0 || avery.wet;
  if (portDown) return "lost";
  if (!averyDown && cane.lost >= cane.total * 0.45) return "trade";
  if (averyDown) return "seat";
  return "held";
}

export function finishPulse(g: Game) {
  settleDay(g);
  if (g.day >= LAST) {
    g.ending = endingOf(g);
    g.events.push("end");
    g.crews = 0;
    if (g.ending === "lost") {
      g.log = "The parish seat is under. The river found the weak point, as it always would.";
    } else if (g.ending === "trade") {
      g.log = "You held the towns. The cane is a lake. That was the trade.";
    } else if (g.ending === "seat") {
      g.log = "The seat stands. Avery is a sounding.";
    } else {
      g.log = "The banks held. The parish will call it luck.";
    }
    return;
  }
  g.crews = g.crewsMax;
}

export function beginPulse(g: Game) {
  g.events = [];
  if (g.ending || g.day >= LAST) return;
  const prev = g.stage;
  g.day += 1;
  g.stage = HYDRO[g.day] ?? g.stage;
  g.crews = 0;
  const rise = g.stage - prev;
  each(g, (c) => {
    if (c.use !== "channel") return;
    c.water = Math.max(0, c.water + rise);
  });
  g.events.push("pulse");
  g.log = g.day === 5 ? "Crest of the rise." : `Day ${g.day}. Stage ${g.stage.toFixed(2)}.`;
}

export function raise(g: Game, c: Cell): boolean {
  if (g.ending || g.crews < 1 || g.stone < RAISE_COST) return false;
  if (!hasBank(c) || c.cut) return false;
  if (c.crest >= CREST_MAX - 0.01) return false;
  c.crest = Math.min(CREST_MAX, c.crest + RAISE);
  c.strength = Math.min(0.92, c.strength + 0.08);
  g.stone -= RAISE_COST;
  g.crews -= 1;
  g.events = ["raise"];
  g.log = `Raised the bank at ${where(c)}. Crest ${c.crest.toFixed(2)}.`;
  return true;
}

export function brace(g: Game, c: Cell): boolean {
  if (g.ending || g.crews < 1) return false;
  if (!hasBank(c) || c.cut || c.braced) return false;
  c.braced = true;
  g.crews -= 1;
  g.events = ["brace"];
  g.log = `A crew is on the bank at ${where(c)} for the day.`;
  return true;
}

export function cut(g: Game, c: Cell): boolean {
  if (g.ending || g.crews < 1) return false;
  if (!hasBank(c) || c.cut) return false;
  c.crest = 0;
  c.cut = true;
  c.strength = 0;
  g.crews -= 1;
  g.events = ["cut"];
  g.log = `Cut at ${where(c)}. The polder will take the river.`;
  return true;
}

export function send(g: Game, c: Cell): boolean {
  if (g.ending || g.crews < 1) return false;
  if (!settlement(c) || c.sent || c.people <= 0) return false;
  const label = c.name ?? (c.use === "town" ? "Avery" : c.use === "port" ? "Port Reach" : "Pecan");
  each(g, (n) => {
    if (n.use !== c.use) return;
    if (c.use === "town" && n.use !== "town") return;
    n.sent = true;
    n.people = n.people0;
  });
  // Sending off one named place, not every settlement of that kind if split —
  // Avery is all town, Pecan is the one hamlet, Port is all port.
  g.crews -= 1;
  g.events = ["send"];
  g.log = `People sent off from ${label}. The place stays.`;
  return true;
}

function where(c: Cell): string {
  if (c.name) return c.name;
  if (c.use === "field" && c.x <= 2) return "the old left bank";
  if (c.use === "field") return "the island bank";
  if (c.use === "town") return "Avery bank";
  if (c.use === "port") return "the reach";
  if (c.use === "hamlet") return "Pecan";
  if (c.use === "marsh") return "the marsh bank";
  return `sheet ${c.x + 1}.${c.y + 1}`;
}

export function placeName(c: Cell): string {
  return where(c);
}

export function bankCells(g: Game): Cell[] {
  const list: Cell[] = [];
  each(g, (c) => {
    if (hasBank(c) || (settlement(c) && !c.sent)) list.push(c);
  });
  list.sort((a, b) => a.y - b.y || a.x - b.x);
  return list;
}

export function peopleLeft(g: Game): { now: number; start: number } {
  let now = 0;
  let start = 0;
  each(g, (c) => {
    if (!settlement(c)) return;
    now += c.people;
    start += c.people0;
  });
  return { now, start };
}

export function reset(): Game {
  return createGame();
}
