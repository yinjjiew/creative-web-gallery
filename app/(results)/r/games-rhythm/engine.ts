/**
 * Anvil — timing, heat, and the piece.
 *
 * The audio clock is the only clock that matters for judging. Animation frames
 * draw; they do not decide whether a blow was true. Latency is a measured
 * offset, not a guess: fifty milliseconds of drift makes a rhythm game a lie.
 *
 * Heat is the phrase. Iron is workable for a short window, then it goes back
 * in the fire. Cooling is not a timer laid over the music — it is the music's
 * shape. The profile of the bar is the scoreboard. Each blow moves one
 * section toward the intended form, or away from it.
 */

export type Phase =
  | "title"
  | "calibrate"
  | "fire"
  | "count"
  | "work"
  | "inspect";

export type Grade = "true" | "fair" | "early" | "late" | "cold" | "miss";

export type WorkKind = "draw" | "bend" | "thin" | "true";

export type Segment = {
  r: number;
  target: number;
  bend: number;
  wantBend: number;
  nick: number;
  flat: number;
  wantFlat: number;
};

export type Hit = {
  errorMs: number;
  grade: Grade;
  heat: number;
  heatIndex: number;
  beat: number;
};

export type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  warm: number;
};

export type Finished = {
  workId: string;
  name: string;
  segments: Segment[];
  hits: Hit[];
  pull: Grade[];
  at: number;
};

export type Work = {
  id: string;
  name: string;
  note: string;
  bpm: number;
  countIn: number;
  heats: { pattern: number[]; kind: WorkKind }[];
  targets: number[];
  bends: number[];
  flats: number[];
};

export type Ev =
  | { type: "tick"; when: number; soft?: boolean }
  | { type: "strike"; when: number; grade: Grade; heat: number; thin: number }
  | { type: "miss"; when: number }
  | { type: "pull"; when: number; grade: Grade; heat: number }
  | { type: "fire" }
  | { type: "quench"; when: number }
  | { type: "extra"; when: number };

type Beat = {
  audioT: number;
  heat: number;
  index: number;
  kind: "count" | "work" | "cal";
  consumed: boolean;
};

export type Game = {
  phase: Phase;
  reduced: boolean;
  workIndex: number;
  heatIndex: number;
  heat: number;
  segments: Segment[];
  hits: Hit[];
  pulls: Grade[];
  beats: Beat[];
  schedUntil: number;
  phraseStart: number;
  latency: number;
  calOffsets: number[];
  lastGrade: Grade | null;
  lastGradeAt: number;
  lastWord: string | null;
  hammer: number;
  ghost: number;
  flash: number;
  shake: number;
  sparks: Spark[];
  fireAge: number;
  rack: Finished[];
  autoPull: number;
  endedAt: number;
};

export const WORKS: Work[] = [
  {
    id: "spike",
    name: "Spike",
    note: "Eight even blows. Draw a point from square stock.",
    bpm: 88,
    countIn: 4,
    heats: [{ pattern: [0, 1, 2, 3, 4, 5, 6, 7], kind: "draw" }],
    targets: [0.92, 0.78, 0.62, 0.48, 0.36, 0.26, 0.17, 0.11, 0.07, 0.04],
    bends: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    flats: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "hook",
    name: "Hook",
    note: "Draw the shank. Then bend the bite while it still takes a curve.",
    bpm: 92,
    countIn: 4,
    heats: [
      { pattern: [0, 1, 2, 3, 4, 5], kind: "draw" },
      { pattern: [0, 1, 2, 3, 3.5, 4, 5], kind: "bend" },
    ],
    targets: [0.88, 0.72, 0.56, 0.44, 0.34, 0.28, 0.26, 0.3, 0.38, 0.34],
    bends: [0, 0, 0.02, 0.08, 0.22, 0.48, 0.78, 1, 0.72, 0.28],
    flats: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "leaf",
    name: "Leaf",
    note: "Thin the belly. Keep the spine true. Three heats, then quench.",
    bpm: 96,
    countIn: 4,
    heats: [
      { pattern: [0, 1, 2, 3, 4], kind: "draw" },
      { pattern: [0, 0.5, 1.5, 2, 3, 3.5, 4.5], kind: "thin" },
      { pattern: [0, 1, 2, 2.5, 3, 4], kind: "true" },
    ],
    targets: [0.58, 0.42, 0.26, 0.16, 0.12, 0.14, 0.22, 0.36, 0.5, 0.42],
    bends: [0, 0.02, 0.06, 0.1, 0.12, 0.1, 0.06, 0.02, 0, 0],
    flats: [0.15, 0.35, 0.62, 0.85, 0.95, 0.88, 0.64, 0.38, 0.18, 0.1],
  },
];

const WIN_TRUE = 0.052;
const WIN_FAIR = 0.1;
const WIN_CATCH = 0.168;
const LOOKAHEAD = 0.16;
const FIRE_RISE = 0.145;
const COOL = 0.034;
const STRIKE_COOL = 0.011;
const STOCK = 1;

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export function steelRgb(heat: number): [number, number, number] {
  /**
   * Forging colours of carbon steel, as a smith reads them at the fire.
   * Not decoration — the sequence is how heat is judged without a pyrometer.
   * Approximate °C: black ~540, blood ~650, cherry ~750, bright cherry ~850,
   * orange ~950, yellow ~1050, white ~1200.
   */
  const stops: [number, number, number, number][] = [
    [0.0, 48, 44, 40],
    [0.16, 72, 30, 20],
    [0.3, 128, 24, 14],
    [0.46, 198, 44, 22],
    [0.6, 228, 82, 30],
    [0.74, 236, 138, 40],
    [0.86, 242, 200, 78],
    [1.0, 250, 242, 214],
  ];
  const h = clamp(heat, 0, 1);
  let i = 0;
  while (i < stops.length - 1 && h > stops[i + 1][0]) i += 1;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const t = (h - a[0]) / Math.max(0.0001, b[0] - a[0]);
  return [
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ];
}

export function heatName(heat: number): string {
  if (heat < 0.16) return "cold";
  if (heat < 0.3) return "black";
  if (heat < 0.42) return "blood";
  if (heat < 0.55) return "cherry";
  if (heat < 0.68) return "bright cherry";
  if (heat < 0.8) return "orange";
  if (heat < 0.92) return "yellow";
  return "white";
}

export function workOf(g: Game): Work {
  return WORKS[g.workIndex] ?? WORKS[0];
}

export function meanQuality(segments: Segment[]): number {
  if (!segments.length) return 0;
  let s = 0;
  for (const seg of segments) {
    const thick = 1 - clamp(Math.abs(seg.r - seg.target) / 0.55, 0, 1);
    const bent = 1 - clamp(Math.abs(seg.bend - seg.wantBend) / 0.7, 0, 1);
    const flat = 1 - clamp(Math.abs(seg.flat - seg.wantFlat) / 0.7, 0, 1);
    const clean = 1 - clamp(seg.nick / 0.55, 0, 1);
    s += thick * 0.42 + bent * 0.22 + flat * 0.18 + clean * 0.18;
  }
  return s / segments.length;
}

function freshSegments(work: Work): Segment[] {
  return work.targets.map((target, i) => ({
    r: STOCK,
    target,
    bend: 0,
    wantBend: work.bends[i] ?? 0,
    nick: 0,
    flat: 0,
    wantFlat: work.flats[i] ?? 0,
  }));
}

export function createGame(opts: {
  reduced: boolean;
  latency: number;
  rack: Finished[];
}): Game {
  const work = WORKS[0];
  return {
    phase: "title",
    reduced: opts.reduced,
    workIndex: 0,
    heatIndex: 0,
    heat: 0.22,
    segments: freshSegments(work),
    hits: [],
    pulls: [],
    beats: [],
    schedUntil: -1,
    phraseStart: 0,
    latency: opts.latency,
    calOffsets: [],
    lastGrade: null,
    lastGradeAt: -10,
    lastWord: null,
    hammer: 0.15,
    ghost: 0,
    flash: 0,
    shake: 0,
    sparks: [],
    fireAge: 0,
    rack: opts.rack,
    autoPull: 0,
    endedAt: 0,
  };
}

export function resetPiece(g: Game, workIndex = g.workIndex) {
  const work = WORKS[clamp(workIndex, 0, WORKS.length - 1)];
  g.workIndex = clamp(workIndex, 0, WORKS.length - 1);
  g.heatIndex = 0;
  g.heat = 0.22;
  g.segments = freshSegments(work);
  g.hits = [];
  g.pulls = [];
  g.beats = [];
  g.schedUntil = -1;
  g.lastGrade = null;
  g.lastWord = null;
  g.hammer = 0.15;
  g.ghost = 0;
  g.flash = 0;
  g.shake = 0;
  g.sparks = [];
  g.fireAge = 0;
  g.autoPull = 0;
  g.endedAt = 0;
}

export function startCalibrate(g: Game, now: number) {
  g.phase = "calibrate";
  g.heat = 0.08;
  g.calOffsets = [];
  g.beats = [];
  g.schedUntil = -1;
  g.phraseStart = now + 0.55;
  g.lastWord = null;
}

export function skipCalibrate(g: Game) {
  if (g.latency <= 0) g.latency = 0.045;
  enterFire(g);
}

export function enterFire(g: Game) {
  g.phase = "fire";
  g.heat = 0.24;
  g.fireAge = 0;
  g.autoPull = 0;
  g.beats = [];
  g.schedUntil = -1;
  g.lastWord = "in the fire";
}

function beginCount(g: Game, now: number) {
  g.phase = "count";
  g.beats = [];
  g.schedUntil = -1;
  g.phraseStart = now + 0.28;
  g.lastWord = null;
}

function beginWork(g: Game) {
  g.phase = "work";
}

function finish(g: Game, now: number) {
  g.phase = "inspect";
  g.endedAt = now;
  g.heat = 0.04;
  g.lastWord = null;
  const work = workOf(g);
  const piece: Finished = {
    workId: work.id,
    name: work.name,
    segments: g.segments.map((s) => ({ ...s })),
    hits: g.hits.slice(),
    pull: g.pulls.slice(),
    at: Date.now(),
  };
  g.rack = [piece, ...g.rack].slice(0, 8);
}

export function retry(g: Game, now: number) {
  resetPiece(g, g.workIndex);
  if (now > 0) enterFire(g);
  else g.phase = "title";
}

export function nextWork(g: Game, now: number) {
  const i = (g.workIndex + 1) % WORKS.length;
  resetPiece(g, i);
  enterFire(g);
  void now;
}

function period(g: Game) {
  return 60 / workOf(g).bpm;
}

function phraseEvents(g: Game) {
  const work = workOf(g);
  const p = period(g);
  const heat = work.heats[g.heatIndex];
  const out: { t: number; kind: Beat["kind"]; index: number }[] = [];
  for (let i = 0; i < work.countIn; i++) {
    out.push({ t: i * p, kind: "count", index: i });
  }
  if (!heat) return out;
  const start = work.countIn * p;
  heat.pattern.forEach((b, i) => {
    out.push({ t: start + b * p, kind: "work", index: i });
  });
  return out;
}

function already(g: Game, kind: Beat["kind"], heat: number, index: number) {
  return g.beats.some(
    (b) => b.kind === kind && b.heat === heat && b.index === index
  );
}

function schedule(g: Game, now: number, evs: Ev[]) {
  if (g.phase === "calibrate") {
    const gap = 0.55;
    for (let i = 0; i < 8; i++) {
      const t = g.phraseStart + i * gap;
      if (t > now + LOOKAHEAD) break;
      if (t < now - 0.02) continue;
      if (already(g, "cal", 0, i)) continue;
      g.beats.push({
        audioT: t,
        heat: 0,
        index: i,
        kind: "cal",
        consumed: false,
      });
      evs.push({ type: "tick", when: t });
    }
    return;
  }
  if (g.phase !== "count" && g.phase !== "work") return;
  for (const e of phraseEvents(g)) {
    const t = g.phraseStart + e.t;
    if (t > now + LOOKAHEAD) break;
    if (already(g, e.kind, g.heatIndex, e.index)) continue;
    const late = t < now - WIN_CATCH;
    g.beats.push({
      audioT: t,
      heat: g.heatIndex,
      index: e.index,
      kind: e.kind,
      consumed: late && e.kind === "work",
    });
    if ((e.kind === "count" || e.kind === "work") && !late) {
      evs.push({ type: "tick", when: t, soft: e.kind === "work" });
    }
    if (late && e.kind === "work") {
      g.hits.push({
        errorMs: 180,
        grade: "miss",
        heat: g.heat,
        heatIndex: g.heatIndex,
        beat: e.index,
      });
      applyBlow(g, "miss", e.index);
    }
  }
}

function judgeError(err: number): Grade {
  const a = Math.abs(err);
  if (a <= WIN_TRUE) return "true";
  if (a <= WIN_FAIR) return err < 0 ? "early" : "late";
  if (a <= WIN_CATCH) return err < 0 ? "early" : "late";
  return "miss";
}

function wordFor(grade: Grade, kind: "blow" | "pull"): string {
  if (kind === "pull") {
    if (grade === "true") return "working heat";
    if (grade === "early") return "too soon";
    if (grade === "late") return "held too long";
    if (grade === "cold") return "still dark";
    return "burning";
  }
  if (grade === "true") return "true";
  if (grade === "fair") return "fair";
  if (grade === "early") return "early";
  if (grade === "late") return "late";
  if (grade === "cold") return "cold";
  return "waste";
}

function spawnSparks(g: Game, n: number, warm: number) {
  if (g.reduced) return;
  for (let i = 0; i < n; i++) {
    g.sparks.push({
      x: 0.6 + (Math.random() - 0.5) * 0.08,
      y: 0.38 + (Math.random() - 0.5) * 0.04,
      vx: (Math.random() - 0.5) * 0.42,
      vy: -0.18 - Math.random() * 0.55,
      life: 0,
      max: 0.18 + Math.random() * 0.28,
      warm,
    });
  }
}

function applyBlow(g: Game, grade: Grade, beatIndex: number) {
  const work = workOf(g);
  const heat = work.heats[g.heatIndex];
  const n = g.segments.length;
  const pattern = heat?.pattern ?? [];
  const t =
    pattern.length > 1
      ? beatIndex / (pattern.length - 1)
      : 0.5;
  const center = t * (n - 1);
  const i0 = clamp(Math.round(center), 0, n - 1);
  const kind = heat?.kind ?? "draw";
  const cold = g.heat < 0.34;
  let use: Grade = grade;
  if (cold && grade !== "miss") use = "cold";

  const toward =
    use === "true" ? 1 : use === "fair" ? 0.62 : use === "cold" ? -0.28 : -0.42;
  const workAmt = cold ? 0.28 : g.heat < 0.5 ? 0.62 : 1;

  const smear = [i0 - 1, i0, i0 + 1];
  for (const i of smear) {
    if (i < 0 || i >= n) continue;
    const fall = i === i0 ? 1 : 0.45;
    const seg = g.segments[i];
    const k = toward * workAmt * fall;
    if (kind === "draw" || kind === "thin" || kind === "true") {
      seg.r = clamp(seg.r + (seg.target - seg.r) * 0.38 * Math.max(k, 0), 0.03, 1.15);
      if (k < 0) {
        seg.r = clamp(seg.r - k * 0.08, 0.03, 1.18);
        seg.nick = clamp(seg.nick - k * 0.18, 0, 1);
        seg.bend += (Math.random() - 0.5) * 0.12 * -k;
      }
    }
    if (kind === "bend") {
      seg.bend += (seg.wantBend - seg.bend) * 0.4 * Math.max(k, 0);
      if (k < 0) seg.bend += (Math.random() - 0.45) * 0.22 * -k;
    }
    if (kind === "thin") {
      seg.flat += (seg.wantFlat - seg.flat) * 0.42 * Math.max(k, 0);
      if (k < 0) seg.r = clamp(seg.r + 0.05 * -k, 0.03, 1.18);
    }
    if (kind === "true") {
      if (k > 0) {
        seg.bend += (seg.wantBend - seg.bend) * 0.35 * k;
        seg.nick = clamp(seg.nick - 0.22 * k, 0, 1);
      } else {
        seg.nick = clamp(seg.nick - k * 0.2, 0, 1);
      }
    }
  }

  if (use === "true") spawnSparks(g, 10, g.heat);
  else if (use === "fair" || use === "early" || use === "late")
    spawnSparks(g, 5, g.heat * 0.7);
  else spawnSparks(g, 2, 0.2);

  g.heat = clamp(g.heat - STRIKE_COOL, 0.02, 1);
  g.hammer = 1;
  g.flash = use === "true" ? 1 : 0.45;
  g.shake = g.reduced ? 0 : use === "true" ? 0.55 : 0.2;
  g.lastGrade = use;
  g.lastGradeAt = 0;
  g.lastWord = wordFor(use, "blow");
}

function judgePull(heat: number): Grade {
  if (heat >= 0.72 && heat <= 0.88) return "true";
  if (heat >= 0.62 && heat < 0.72) return "early";
  if (heat > 0.88 && heat <= 0.96) return "late";
  if (heat < 0.62) return "cold";
  return "late";
}

function pullIron(g: Game, now: number, forced: boolean, evs: Ev[]) {
  const grade = forced && g.heat > 0.96 ? "late" : judgePull(g.heat);
  g.pulls.push(grade);
  g.lastGrade = grade;
  g.lastGradeAt = 0;
  g.lastWord = wordFor(grade, "pull");
  if (grade === "late" && g.heat > 0.92) {
    for (const seg of g.segments) seg.nick = clamp(seg.nick + 0.08, 0, 1);
  }
  if (grade === "cold") {
    g.heat = Math.max(g.heat, 0.48);
  }
  evs.push({ type: "pull", when: now, grade, heat: g.heat });
  beginCount(g, now);
}

function expire(g: Game, judgedNow: number, evs: Ev[]) {
  for (const b of g.beats) {
    if (b.consumed || b.kind !== "work") continue;
    if (judgedNow > b.audioT + WIN_CATCH) {
      b.consumed = true;
      const hit: Hit = {
        errorMs: 180,
        grade: "miss",
        heat: g.heat,
        heatIndex: b.heat,
        beat: b.index,
      };
      g.hits.push(hit);
      applyBlow(g, "miss", b.index);
      evs.push({ type: "miss", when: judgedNow });
    }
  }
}

function phraseOver(g: Game, now: number) {
  const work = workOf(g);
  const heat = work.heats[g.heatIndex];
  if (!heat) return true;
  const last =
    g.phraseStart + (work.countIn + Math.max(...heat.pattern)) * period(g);
  const workBeats = g.beats.filter(
    (b) => b.kind === "work" && b.heat === g.heatIndex
  );
  const allIn = workBeats.length >= heat.pattern.length;
  const allDone = allIn && workBeats.every((b) => b.consumed);
  return (allDone && now > last + 0.35) || now > last + 1.15;
}

function advancePhrase(g: Game, now: number, evs: Ev[]) {
  const work = workOf(g);
  if (g.heatIndex + 1 < work.heats.length) {
    g.heatIndex += 1;
    evs.push({ type: "fire" });
    enterFire(g);
  } else {
    evs.push({ type: "quench", when: now });
    finish(g, now);
  }
}

export function tap(g: Game, now: number): Ev[] {
  const evs: Ev[] = [];
  const judged = now - g.latency;

  if (g.phase === "title") return evs;

  if (g.phase === "inspect") return evs;

  if (g.phase === "calibrate") {
    let best: Beat | null = null;
    let bestD = 0.32;
    for (const b of g.beats) {
      if (b.kind !== "cal" || b.consumed) continue;
      const d = Math.abs(judged - b.audioT);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best) {
      best.consumed = true;
      g.calOffsets.push(now - best.audioT);
      g.hammer = 1;
      g.flash = 0.7;
      evs.push({
        type: "strike",
        when: now,
        grade: "true",
        heat: 0.7,
        thin: 0.4,
      });
    }
    return evs;
  }

  if (g.phase === "fire") {
    pullIron(g, now, false, evs);
    g.hammer = 0.4;
    return evs;
  }

  if (g.phase === "count" || g.phase === "work") {
    let best: Beat | null = null;
    let bestD = WIN_CATCH + 0.02;
    for (const b of g.beats) {
      if (b.kind !== "work" || b.consumed) continue;
      const d = Math.abs(judged - b.audioT);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best) {
      best.consumed = true;
      const err = judged - best.audioT;
      let grade = judgeError(err);
      if (grade === "early" || grade === "late") {
        if (Math.abs(err) <= WIN_FAIR) {
          /* keep early/late — they are fair-window but sided */
        }
      }
      if (Math.abs(err) <= WIN_TRUE) grade = "true";
      else if (Math.abs(err) <= WIN_FAIR) grade = "fair";
      const hit: Hit = {
        errorMs: err * 1000,
        grade,
        heat: g.heat,
        heatIndex: best.heat,
        beat: best.index,
      };
      g.hits.push(hit);
      applyBlow(g, grade, best.index);
      const thin = 1 - meanRadius(g.segments);
      evs.push({
        type: "strike",
        when: now,
        grade: g.lastGrade ?? grade,
        heat: g.heat,
        thin,
      });
    } else {
      /* Extra blow — no beat waiting. The iron remembers that too. */
      const i = clamp(
        Math.floor(Math.random() * g.segments.length),
        0,
        g.segments.length - 1
      );
      g.segments[i].nick = clamp(g.segments[i].nick + 0.16, 0, 1);
      g.segments[i].bend += (Math.random() - 0.5) * 0.14;
      g.hammer = 1;
      g.flash = 0.25;
      g.lastGrade = "miss";
      g.lastGradeAt = 0;
      g.lastWord = "waste";
      evs.push({ type: "extra", when: now });
    }
    return evs;
  }

  return evs;
}

function meanRadius(segments: Segment[]) {
  if (!segments.length) return 1;
  return segments.reduce((s, x) => s + x.r, 0) / segments.length;
}

export function step(g: Game, dt: number, now: number): Ev[] {
  const evs: Ev[] = [];
  g.fireAge += dt;
  g.lastGradeAt += dt;

  g.hammer = Math.max(0.12, g.hammer - dt * 3.4);
  g.flash = Math.max(0, g.flash - dt * 4.2);
  g.shake = Math.max(0, g.shake - dt * 6);
  g.ghost = 0;

  if (!g.reduced) {
    for (const sp of g.sparks) {
      sp.life += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 1.4 * dt;
    }
    g.sparks = g.sparks.filter((sp) => sp.life < sp.max);
  } else {
    g.sparks = [];
  }

  if (g.phase === "title") {
    g.heat = 0.55 + Math.sin(g.fireAge * 0.7) * 0.08;
    return evs;
  }

  schedule(g, now, evs);

  if (g.phase === "calibrate") {
    const last = g.phraseStart + 7 * 0.55;
    if (now > last + 0.55) {
      if (g.calOffsets.length >= 4) {
        const sorted = g.calOffsets.slice().sort((a, b) => a - b);
        const mid = sorted[Math.floor(sorted.length / 2)] ?? 0.045;
        g.latency = clamp(mid, 0.01, 0.18);
      } else if (g.latency <= 0) {
        g.latency = 0.045;
      }
      enterFire(g);
      evs.push({ type: "fire" });
    }
    return evs;
  }

  if (g.phase === "fire") {
    g.heat = clamp(g.heat + FIRE_RISE * dt, 0.08, 1);
    g.autoPull += dt;
    if (g.autoPull > 7.2) {
      pullIron(g, now, true, evs);
    }
    return evs;
  }

  if (g.phase === "count" || g.phase === "work") {
    g.heat = clamp(g.heat - COOL * dt, 0.02, 1);
    const work = workOf(g);
    const p = period(g);
    const workStart = g.phraseStart + work.countIn * p;
    if (g.phase === "count" && now >= workStart - 0.02) beginWork(g);

    const judged = now - g.latency;
    expire(g, judged, evs);

    /* Ghost hammer: falls so that it meets the iron on the next work beat. */
    let next: Beat | null = null;
    for (const b of g.beats) {
      if (b.kind !== "work" || b.consumed) continue;
      if (!next || b.audioT < next.audioT) next = b;
    }
    if (next && !g.reduced) {
      const until = next.audioT - now;
      const window = p * 0.85;
      g.ghost = clamp(1 - until / window, 0, 1);
    }

    if (phraseOver(g, now)) advancePhrase(g, now, evs);
    return evs;
  }

  if (g.phase === "inspect") {
    g.heat = clamp(g.heat - dt * 0.08, 0.02, 0.08);
  }

  return evs;
}

export function upcoming(g: Game, now: number) {
  return g.beats
    .filter((b) => !b.consumed && (b.kind === "work" || b.kind === "count"))
    .map((b) => ({
      kind: b.kind,
      t: b.audioT - now,
      index: b.index,
    }))
    .filter((b) => b.t > -0.05 && b.t < 1.6);
}

export function trueCount(hits: Hit[]) {
  return hits.filter((h) => h.grade === "true").length;
}

export function blowCount(work: Work) {
  return work.heats.reduce((s, h) => s + h.pattern.length, 0);
}
