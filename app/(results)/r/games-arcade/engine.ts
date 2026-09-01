/**
 * Semaphore — Millford Junction, East Box.
 *
 * A mechanical lever frame: eight levers, interlocking, trains that will not
 * wait. The simulation is ignorant of pixels and speakers. It runs on a fixed
 * timestep so lever travel and approach times are the same at 30fps or 144fps,
 * which is the only way a death can be fairly the player's.
 *
 * The junction is a four-road diamond. Each road has a points lever (black)
 * and a home signal (red). Normal points send a train straight through;
 * reverse sends it clockwise. Two routes lock if they share a road, share the
 * diamond on crossing axes, or share a throat. Opposite-corner diverges do
 * not lock — that is the thing the later traffic asks you to notice.
 *
 * Modelled on Midland practice around 1890, then simplified until it is an
 * arcade game rather than a working diagram. The honest label lives on the
 * sign-on plate.
 */

export const DT = 1 / 120;

export type Road = "A" | "B" | "C" | "D";
export type Cls = "goods" | "pass" | "express";
export type Phase = "board" | "run" | "dead";

export const ROADS: Road[] = ["A", "B", "C", "D"];

export const OPP: Record<Road, Road> = { A: "C", B: "D", C: "A", D: "B" };
export const CW: Record<Road, Road> = { A: "B", B: "C", C: "D", D: "A" };
export const ROAD_NAME: Record<Road, string> = {
  A: "North",
  B: "East",
  C: "South",
  D: "West",
};

export const CLS_NAME: Record<Cls, string> = {
  goods: "Goods",
  pass: "Pass",
  express: "Exp",
};

export const HOME_T = 0.62;
export const POINTS_T = 0.8;

export function destOf(from: Road, reverse: boolean): Road {
  return reverse ? CW[from] : OPP[from];
}

export function isReverse(from: Road, to: Road): boolean {
  return to === CW[from];
}

export function isThrough(from: Road, to: Road): boolean {
  return to === OPP[from];
}

/** Cells a booked route occupies. Shared cells mean the routes lock. */
export function cells(from: Road, to: Road): string[] {
  const out: string[] = [from, to];
  if (isThrough(from, to)) {
    out.push(from === "A" || from === "C" ? "NS" : "EW", "X");
  } else {
    out.push("Q" + [from, to].sort().join(""));
  }
  return out;
}

export function conflict(
  aFrom: Road,
  aTo: Road,
  bFrom: Road,
  bTo: Road
): boolean {
  const a = new Set(cells(aFrom, aTo));
  const b = cells(bFrom, bTo);
  if (a.has("NS") && b.includes("EW")) return true;
  if (a.has("EW") && b.includes("NS")) return true;
  return b.some((c) => a.has(c));
}

export type Ev =
  | { type: "pull"; i: number; locked: boolean; force: number }
  | { type: "seat"; i: number; force: number; kind: "points" | "signal" }
  | { type: "lock"; reason: string }
  | { type: "bell"; road: Road; cls: Cls }
  | { type: "enter"; diverge: boolean; cls: Cls }
  | { type: "clear"; cls: Cls; added: number }
  | { type: "crash" }
  | { type: "signon" }
  | { type: "retry" }
  | { type: "idea"; text: string };

export interface Lever {
  i: number;
  road: Road;
  kind: "points" | "signal";
  /** 0 = normal / danger (back). 1 = reverse / clear (pulled). */
  pos: number;
  vel: number;
  target: number;
  seated: boolean;
}

export interface Train {
  id: number;
  from: Road;
  to: Road;
  cls: Cls;
  t: number;
  entered: boolean;
  announced: boolean;
}

export interface Best {
  score: number;
  cleared: number;
}

export interface Game {
  phase: Phase;
  time: number;
  acc: number;
  levers: Lever[];
  trains: Train[];
  nextId: number;
  score: number;
  cleared: number;
  streak: number;
  lastSpawn: number;
  events: Ev[];
  crash: string;
  crashDetail: string;
  deny: string | null;
  denyUntil: number;
  idea: string | null;
  ideaUntil: number;
  shown: Set<number>;
  best: Best;
  newBest: boolean;
  reduced: boolean;
  fog: boolean;
}

export function band(cleared: number): number {
  if (cleared < 3) return 0;
  if (cleared < 6) return 1;
  if (cleared < 10) return 2;
  if (cleared < 15) return 3;
  if (cleared < 21) return 4;
  return 5;
}

export function leverRoad(i: number): Road {
  return ROADS[Math.floor(i / 2)]!;
}

export function isSignal(i: number): boolean {
  return i % 2 === 1;
}

export function pointsOf(g: Game, road: Road): Lever {
  return g.levers[ROADS.indexOf(road) * 2]!;
}

export function signalOf(g: Game, road: Road): Lever {
  return g.levers[ROADS.indexOf(road) * 2 + 1]!;
}

function makeLevers(): Lever[] {
  return Array.from({ length: 8 }, (_, i) => ({
    i,
    road: leverRoad(i),
    kind: isSignal(i) ? "signal" : "points",
    pos: 0,
    vel: 0,
    target: 0,
    seated: true,
  }));
}

export function newGame(best: Best, reduced: boolean): Game {
  return {
    phase: "board",
    time: 0,
    acc: 0,
    levers: makeLevers(),
    trains: [],
    nextId: 1,
    score: 0,
    cleared: 0,
    streak: 0,
    lastSpawn: -10,
    events: [],
    crash: "",
    crashDetail: "",
    deny: null,
    denyUntil: 0,
    idea: null,
    ideaUntil: 0,
    shown: new Set(),
    best,
    newBest: false,
    reduced,
    fog: false,
  };
}

export function reset(g: Game) {
  const best = g.best;
  const reduced = g.reduced;
  const fresh = newGame(best, reduced);
  Object.assign(g, fresh);
  g.events.push({ type: "retry" });
}

export function signOn(g: Game) {
  if (g.phase !== "board") return;
  g.phase = "run";
  g.time = 0;
    g.lastSpawn = -3.2;
  g.events.push({ type: "signon" });
  tell(g, 0, "Set the points. Pull the home. A road not locked is a road that kills.");
}

const IDEAS: { at: number; text: string }[] = [
  { at: 3, text: "Two on the diagram. Take them in order — or find a pair that does not lock." },
  { at: 6, text: "Levers stay where you leave them. Put a home back or the next road locks." },
  { at: 10, text: "Express runs short of the board. Goods sits in the diamond." },
  { at: 15, text: "Opposite corners do not lock. North-to-east will sit with south-to-west." },
  { at: 21, text: "Fog on the running lines. Trust the describer and the bells." },
];

function tell(g: Game, at: number, text: string) {
  if (g.shown.has(at)) return;
  g.shown.add(at);
  g.idea = text;
  g.ideaUntil = g.time + 5.2;
  g.events.push({ type: "idea", text });
}

function maybeIdeas(g: Game) {
  for (const idea of IDEAS) {
    if (g.cleared >= idea.at) tell(g, idea.at, idea.text);
  }
}

/* ── interlocking ────────────────────────────────────────────────────────── */

function offish(l: Lever): boolean {
  return l.target > 0.5 || l.pos > 0.2;
}

function routeOf(g: Game, road: Road): { from: Road; to: Road } {
  const pts = pointsOf(g, road);
  return { from: road, to: destOf(road, pts.pos > 0.5 || pts.target > 0.5) };
}

export function signalLock(g: Game, road: Road): string | null {
  const pts = pointsOf(g, road);
  if (!pts.seated) return `Points ${road} are still travelling.`;
  const mine = routeOf(g, road);
  for (const r of ROADS) {
    if (r === road) continue;
    const sig = signalOf(g, r);
    if (!offish(sig)) continue;
    const other = routeOf(g, r);
    if (conflict(mine.from, mine.to, other.from, other.to)) {
      return `Locked against ${r}. ${road}→${mine.to} fights ${r}→${other.to}.`;
    }
  }
  return null;
}

export function pointsLock(g: Game, road: Road): string | null {
  const sig = signalOf(g, road);
  if (sig.pos > 0.12 || sig.target > 0.5) {
    return `Facing-point lock. Home ${road} is off.`;
  }
  for (const tr of g.trains) {
    if (tr.from !== road) continue;
    if (tr.t >= HOME_T - 0.03 && tr.t < POINTS_T) {
      return `Road ${road} is occupied.`;
    }
  }
  return null;
}

export function pull(g: Game, i: number) {
  if (g.phase === "dead") {
    reset(g);
    return;
  }
  if (g.phase === "board") {
    signOn(g);
  }
  const l = g.levers[i];
  if (!l) return;

  const reason = l.kind === "signal" ? signalLock(g, l.road) : pointsLock(g, l.road);
  if (reason) {
    l.vel += l.pos > 0.5 ? 1.8 : -1.8;
    g.deny = reason;
    g.denyUntil = g.time + 2.4;
    g.events.push({ type: "pull", i, locked: true, force: 0.35 });
    g.events.push({ type: "lock", reason });
    return;
  }

  l.target = l.target > 0.5 ? 0 : 1;
  l.seated = false;
  const toward = l.target > 0.5 ? 1 : -1;
  l.vel += toward * (g.reduced ? 4.2 : 2.6);
  g.events.push({ type: "pull", i, locked: false, force: 0.7 + Math.random() * 0.3 });
}

/* ── traffic ─────────────────────────────────────────────────────────────── */

const APPROACH: Record<Cls, number> = {
  goods: 10.4,
  pass: 7.6,
  express: 5.1,
};

function speedOf(g: Game, tr: Train): number {
  const b = band(g.cleared);
  const hurry = 1 + b * 0.055;
  let v = (HOME_T / APPROACH[tr.cls]) * hurry;
  if (tr.t >= HOME_T) {
    v *= tr.cls === "goods" ? 0.42 : tr.cls === "pass" ? 0.62 : 0.78;
  }
  return v;
}

function pickCls(g: Game): Cls {
  if (band(g.cleared) < 3) return "pass";
  const r = Math.random();
  if (r < 0.32) return "goods";
  if (r < 0.58) return "express";
  return "pass";
}

function spawnGap(g: Game): number {
  const b = band(g.cleared);
  if (b === 0) return 3.6;
  if (b === 1) return 2.4;
  if (b === 2) return 2.1;
  if (b === 3) return 1.85;
  if (b === 4) return 1.55;
  return 1.25;
}

function capOf(g: Game): number {
  const b = band(g.cleared);
  if (b === 0) return 1;
  if (b < 4) return 2;
  return 3;
}

function occupiedFrom(g: Game): Set<Road> {
  const s = new Set<Road>();
  for (const tr of g.trains) s.add(tr.from);
  return s;
}

function spawnOne(g: Game, from: Road, reverse: boolean, cls: Cls, t = 0) {
  const tr: Train = {
    id: g.nextId++,
    from,
    to: destOf(from, reverse),
    cls,
    t,
    entered: false,
    announced: false,
  };
  g.trains.push(tr);
  g.lastSpawn = g.time;
}

function maybeSpawn(g: Game) {
  if (g.phase !== "run") return;
  const live = g.trains;
  const cap = capOf(g);
  if (live.length >= cap) return;
  if (g.time - g.lastSpawn < spawnGap(g)) return;

  const used = occupiedFrom(g);
  const free = ROADS.filter((r) => !used.has(r));
  if (!free.length) return;

  const b = band(g.cleared);

  // Opposite-corner pair: the new question at band 4.
  if (b >= 4 && live.length === 0 && Math.random() < 0.42) {
    const pair: [Road, Road] =
      Math.random() < 0.5 ? ["A", "C"] : ["B", "D"];
    spawnOne(g, pair[0], true, pickCls(g), 0);
    spawnOne(g, pair[1], true, pickCls(g), 0.04);
    return;
  }

  const from = free[Math.floor(Math.random() * free.length)]!;
  const reverse = Math.random() < (b >= 4 ? 0.55 : 0.45);
  spawnOne(g, from, reverse, pickCls(g));
}

function autoRestore(g: Game, road: Road) {
  // First two bands put the frame back so the player is learning routes,
  // not fighting leftover levers. After six clears they keep what they leave.
  if (g.cleared >= 6) return;
  signalOf(g, road).target = 0;
  signalOf(g, road).seated = false;
  if (g.cleared < 3) {
    pointsOf(g, road).target = 0;
    pointsOf(g, road).seated = false;
  }
}

function die(g: Game, crash: string, detail: string) {
  if (g.phase === "dead") return;
  g.phase = "dead";
  g.crash = crash;
  g.crashDetail = detail;
  g.streak = 0;
  if (g.score > g.best.score) {
    g.best = { score: g.score, cleared: g.cleared };
    g.newBest = true;
  }
  g.events.push({ type: "crash" });
}

function scoreTrain(g: Game, tr: Train) {
  const base = tr.cls === "express" ? 18 : tr.cls === "pass" ? 12 : 8;
  const overlap = g.trains.some(
    (o) => o.id !== tr.id && o.entered && o.t < POINTS_T
  )
    ? 10
    : 0;
  const tight = Math.max(0, 6 - (tr.t - HOME_T) * 14);
  const mult = 1 + Math.min(8, g.streak) * 0.15;
  const added = Math.round((base + overlap + tight) * mult);
  g.score += added;
  g.cleared += 1;
  g.streak += 1;
  g.events.push({ type: "clear", cls: tr.cls, added });
  maybeIdeas(g);
  g.fog = band(g.cleared) >= 5;
  return added;
}

/* ── stepper ─────────────────────────────────────────────────────────────── */

const OMEGA = 9.2;
const ZETA = 0.76;

function stepLever(g: Game, l: Lever) {
  const omega = g.reduced ? 16 : OMEGA;
  const zeta = g.reduced ? 1 : ZETA;
  const acc = (l.target - l.pos) * omega * omega - 2 * zeta * omega * l.vel;
  l.vel += acc * DT;
  l.pos += l.vel * DT;
  if (l.pos < -0.1) {
    l.pos = -0.1;
    l.vel *= -0.2;
  }
  if (l.pos > 1.1) {
    l.pos = 1.1;
    l.vel *= -0.2;
  }
  const err = l.pos - l.target;
  if (!l.seated && Math.abs(err) < 0.028 && Math.abs(l.vel) < 1.15) {
    l.pos = l.target;
    l.vel = 0;
    l.seated = true;
    const force = Math.min(1, 0.45 + Math.abs(acc) * 0.01);
    g.events.push({ type: "seat", i: l.i, force, kind: l.kind });
  }
}

function stepTrain(g: Game, tr: Train) {
  if (!tr.announced && tr.t >= 0) {
    tr.announced = true;
    g.events.push({ type: "bell", road: tr.from, cls: tr.cls });
  }

  tr.t += speedOf(g, tr) * DT;

  const pts = pointsOf(g, tr.from);
  const sig = signalOf(g, tr.from);

  if (!tr.entered && tr.t >= HOME_T) {
    if (sig.pos < 0.88) {
      die(
        g,
        `Home ${tr.from} at danger.`,
        `The ${CLS_NAME[tr.cls].toLowerCase()} from ${ROAD_NAME[tr.from]} ran the board.`
      );
      return;
    }
    if (!pts.seated || (pts.pos > 0.14 && pts.pos < 0.86)) {
      die(
        g,
        `Points ${tr.from} were travelling.`,
        `You threw the road under the ${CLS_NAME[tr.cls].toLowerCase()}.`
      );
      return;
    }
    const want = isReverse(tr.from, tr.to);
    const got = pts.pos >= 0.5;
    if (want !== got) {
      const set = got ? CW[tr.from] : OPP[tr.from];
      die(
        g,
        `Misrouted at ${tr.from}.`,
        `Booked ${tr.from}→${tr.to}. Points were set for ${tr.from}→${set}.`
      );
      return;
    }
    tr.entered = true;
    g.events.push({ type: "enter", diverge: want, cls: tr.cls });
  }

  if (tr.entered && tr.t < POINTS_T) {
    if (!pts.seated || (pts.pos > 0.14 && pts.pos < 0.86)) {
      die(
        g,
        `Points ${tr.from} moved under the train.`,
        `The facing-point lock is there so this does not happen. You beat it by hand.`
      );
      return;
    }
  }

  if (tr.t >= 1) {
    scoreTrain(g, tr);
    autoRestore(g, tr.from);
    g.trains = g.trains.filter((x) => x.id !== tr.id);
  }
}

function collisions(g: Game) {
  const inside = g.trains.filter((tr) => tr.entered && tr.t < 0.92);
  for (let i = 0; i < inside.length; i++) {
    for (let j = i + 1; j < inside.length; j++) {
      const a = inside[i]!;
      const b = inside[j]!;
      if (conflict(a.from, a.to, b.from, b.to)) {
        die(
          g,
          "Two in the diamond.",
          `${a.from}→${a.to} and ${b.from}→${b.to} cannot occupy the junction together.`
        );
        return;
      }
    }
  }
}

function step(g: Game) {
  if (g.phase === "board") {
    for (const l of g.levers) stepLever(g, l);
    return;
  }
  g.time += DT;
  if (g.idea && g.time > g.ideaUntil) g.idea = null;
  if (g.deny && g.time > g.denyUntil) g.deny = null;

  for (const l of g.levers) stepLever(g, l);
  if (g.phase === "dead") return;

  maybeSpawn(g);
  const snapshot = g.trains.slice();
  for (const tr of snapshot) {
    if (g.phase !== "run") break;
    if (g.trains.includes(tr)) stepTrain(g, tr);
  }
  if (g.phase === "run") collisions(g);
}

/**
 * Advance the world. The accumulator is why a death is fair: the display
 * may skip frames and the levers still travel the same seconds.
 */
export function advance(g: Game, dt: number) {
  g.acc += Math.min(0.08, dt);
  let n = 0;
  while (g.acc >= DT && n < 10) {
    step(g);
    g.acc -= DT;
    n++;
  }
}

export function clockLabel(g: Game): string {
  // Sign-on is 18:40. Duty time runs twelve times faster than the box.
  const start = 18 * 60 + 40;
  const mins = start + Math.floor(g.time * 12);
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function chainsLeft(tr: Train): string {
  const left = Math.max(0, HOME_T - tr.t);
  const ch = Math.round((left / HOME_T) * 48);
  if (tr.entered) return "in section";
  if (ch <= 2) return "at home";
  return `${ch} ch`;
}
