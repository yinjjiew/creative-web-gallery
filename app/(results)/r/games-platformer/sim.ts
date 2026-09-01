/**
 * Cairn — the ridge, the walker, the stones.
 *
 * A 120 Hz fixed step. Movement numbers are the whole craft of the piece:
 * coyote time, jump buffer, variable height, faster fall than rise, a little
 * hang at the apex, corner correction, two frames of hitstop on a hard land.
 * Deaths write a solid stone at the body and return the walker to the last
 * waymark on the same tick. There is no clock that fails you.
 */

export const STEP = 1 / 120;
export const WORLD_W = 3180;
export const WORLD_H = 720;
export const VOID_Y = 688;

export const PW = 11;
export const PH = 20;

const MOVE = {
  maxRun: 172,
  accelG: 980,
  accelA: 640,
  decelG: 2480,
  decelA: 260,
  jump: 368,
  gravRise: 1280,
  gravPeak: 500,
  gravFall: 1860,
  peakWindow: 40,
  maxFall: 540,
  jumpCut: 0.46,
  coyote: 0.094,
  buffer: 0.112,
  hitstop: 0.026,
  hitstopMin: 210,
  corner: 5,
  invuln: 0.28,
};

export const STONE_MAX = 56;

export type Box = { x: number; y: number; w: number; h: number };

export type Stone = Box & {
  vx: number;
  vy: number;
  seed: number;
  settled: boolean;
};

export type Event =
  | { type: "foot"; x: number; y: number; v: number }
  | { type: "jump"; x: number; y: number }
  | { type: "land"; x: number; y: number; hard: number }
  | { type: "bonk" }
  | { type: "die"; x: number; y: number }
  | { type: "stone"; x: number; y: number; stack: number }
  | { type: "summit" };

export type Input = {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpDown: boolean;
};

export type Game = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyote: number;
  buffer: number;
  jumpHeld: boolean;
  hitstop: number;
  invuln: number;
  walk: number;
  air: number;
  stones: Stone[];
  deaths: number;
  ascents: number;
  atSummit: boolean;
  spawnX: number;
  spawnY: number;
  check: number;
  moved: boolean;
  reduced: boolean;
  events: Event[];
  shake: number;
  time: number;
  acc: number;
};

/**
 * Solid rock. y is the walkable top. Pits sit 40–70px below the intended
 * jump so a short cairn becomes a step, and a taller one a walkway.
 */
export const ROCK: Box[] = [
  { x: -48, y: 0, w: 56, h: 720 },
  { x: 0, y: 440, w: 260, h: 280 },
  { x: 260, y: 488, w: 58, h: 232 },
  { x: 318, y: 428, w: 190, h: 292 },
  { x: 508, y: 476, w: 82, h: 244 },
  { x: 590, y: 408, w: 180, h: 312 },
  { x: 770, y: 400, w: 40, h: 48 },
  { x: 810, y: 458, w: 200, h: 262 },
  { x: 1010, y: 388, w: 200, h: 332 },
  { x: 1210, y: 428, w: 120, h: 292 },
  { x: 1330, y: 368, w: 140, h: 70 },
  { x: 1470, y: 416, w: 60, h: 304 },
  { x: 1530, y: 348, w: 88, h: 52 },
  { x: 1618, y: 404, w: 52, h: 316 },
  { x: 1670, y: 328, w: 88, h: 52 },
  { x: 1758, y: 400, w: 52, h: 320 },
  { x: 1810, y: 348, w: 340, h: 372 },
  { x: 1920, y: 274, w: 150, h: 32 },
  { x: 2150, y: 392, w: 50, h: 328 },
  { x: 2200, y: 300, w: 80, h: 44 },
  { x: 2280, y: 380, w: 60, h: 340 },
  { x: 2340, y: 274, w: 130, h: 44 },
  { x: 2470, y: 360, w: 80, h: 360 },
  { x: 2550, y: 248, w: 630, h: 472 },
  { x: 3160, y: 0, w: 80, h: 248 },
];

/** Thin death on top of a floor, so a stone can cover it and become the floor. */
export const SCREE: Box[] = [
  { x: 260, y: 480, w: 58, h: 6 },
  { x: 508, y: 468, w: 82, h: 6 },
  { x: 810, y: 450, w: 200, h: 6 },
  { x: 1210, y: 420, w: 120, h: 6 },
  { x: 1470, y: 408, w: 60, h: 6 },
  { x: 1618, y: 396, w: 52, h: 6 },
  { x: 1758, y: 392, w: 52, h: 6 },
  { x: 1910, y: 340, w: 42, h: 6 },
  { x: 2150, y: 384, w: 50, h: 6 },
  { x: 2280, y: 372, w: 60, h: 6 },
  { x: 2470, y: 352, w: 80, h: 6 },
];

type Way = { x: number; y: number; need: number };

const WAYS: Way[] = [
  { x: 96, y: 440, need: 0 },
  { x: 680, y: 408, need: 590 },
  { x: 1110, y: 388, need: 1010 },
  { x: 1860, y: 348, need: 1810 },
  { x: 2400, y: 274, need: 2340 },
];

export const SUMMIT = { x: 2720, y: 168, w: 56, h: 80 };

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function overlaps(a: Box, b: Box) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function solids(g: Game): Box[] {
  return ROCK.concat(g.stones);
}

function resolveX(box: Box, solidsList: Box[]) {
  for (const s of solidsList) {
    if (!overlaps(box, s)) continue;
    const fromL = box.x + box.w - s.x;
    const fromR = s.x + s.w - box.x;
    if (fromL < fromR) box.x = s.x - box.w;
    else box.x = s.x + s.w;
  }
}

function resolveY(box: Box, solidsList: Box[], vy: number) {
  let floor = false;
  let ceil = false;
  for (const s of solidsList) {
    if (!overlaps(box, s)) continue;
    if (vy >= 0) {
      box.y = s.y - box.h;
      floor = true;
    } else {
      box.y = s.y + s.h;
      ceil = true;
    }
  }
  return { floor, ceil };
}

/** A few pixels of lip-forgiveness so a jump that almost cleared still does. */
function cornerFix(box: Box, solidsList: Box[], vy: number) {
  if (vy >= 0) return;
  for (const s of solidsList) {
    if (!overlaps(box, s)) continue;
    const left = box.x + box.w - s.x;
    const right = s.x + s.w - box.x;
    if (left > 0 && left <= MOVE.corner) box.x = s.x - box.w;
    else if (right > 0 && right <= MOVE.corner) box.x = s.x + s.w;
  }
}

function stackAt(g: Game, x: number, y: number) {
  let n = 0;
  for (const s of g.stones) {
    if (Math.abs(s.x + s.w / 2 - x) < 22 && Math.abs(s.y + s.h - y) < 36) n++;
  }
  return n;
}

function leaveStone(g: Game, cx: number, feet: number) {
  if (g.stones.length >= STONE_MAX) {
    const px = g.spawnX;
    let worst = 0;
    let dist = -1;
    for (let i = 0; i < g.stones.length; i++) {
      const s = g.stones[i];
      const d = Math.abs(s.x - px);
      if (d > dist) {
        dist = d;
        worst = i;
      }
    }
    g.stones.splice(worst, 1);
  }

  const seed = (g.deaths * 9973 + Math.floor(cx * 13) + Math.floor(feet * 7)) >>> 0;
  const w = 10 + (seed % 4);
  const h = 9 + ((seed >> 3) % 4);
  const nudge = ((seed >> 7) % 11) - 5;
  const stone: Stone = {
    x: cx - w / 2 + nudge,
    y: feet - h - 1,
    w,
    h,
    vx: 0,
    vy: 80,
    seed,
    settled: false,
  };

  const rock = ROCK;
  for (let i = 0; i < 8; i++) {
    let stuck = false;
    for (const s of rock) {
      if (!overlaps(stone, s)) continue;
      stone.y = s.y - stone.h;
      stuck = true;
    }
    for (const s of g.stones) {
      if (!overlaps(stone, s)) continue;
      stone.y = s.y - stone.h;
      stuck = true;
    }
    if (!stuck) break;
  }

  g.stones.push(stone);
  g.events.push({
    type: "stone",
    x: stone.x + stone.w / 2,
    y: stone.y + stone.h,
    stack: stackAt(g, stone.x + stone.w / 2, stone.y + stone.h),
  });
}

function settleStones(g: Game, dt: number) {
  const grav = 1860;
  for (const st of g.stones) {
    if (st.settled) continue;
    st.vy = Math.min(520, st.vy + grav * dt);
    st.x += st.vx * dt;
    const others = ROCK.concat(g.stones.filter((s) => s !== st));
    resolveX(st, others);
    st.y += st.vy * dt;
    const hit = resolveY(st, others, st.vy);
    if (hit.floor) {
      st.vy = 0;
      st.vx = 0;
      st.settled = true;
    } else if (hit.ceil) {
      st.vy = 0;
    }
    if (st.y > VOID_Y) {
      st.settled = true;
      st.y = VOID_Y + 40;
      st.x = -200;
    }
  }
}

function die(g: Game) {
  const cx = g.x + PW / 2;
  const feet = Math.min(g.y + PH, VOID_Y - 24);
  g.events.push({ type: "die", x: cx, y: feet });
  g.deaths += 1;
  leaveStone(g, cx, feet);
  g.x = g.spawnX;
  g.y = g.spawnY - PH;
  g.vx = 0;
  g.vy = 0;
  g.grounded = true;
  g.coyote = 0;
  g.buffer = 0;
  g.jumpHeld = false;
  g.invuln = MOVE.invuln;
  g.air = 0;
  g.shake = g.reduced ? 0 : 1;
}

function markWay(g: Game) {
  const feetX = g.x + PW / 2;
  for (let i = g.check + 1; i < WAYS.length; i++) {
    const w = WAYS[i];
    if (feetX < w.need) break;
    if (g.grounded && Math.abs(feetX - w.x) < 54 && Math.abs(g.y + PH - w.y) < 18) {
      g.check = i;
      g.spawnX = w.x - PW / 2;
      g.spawnY = w.y;
    }
  }
}

function stepPlayer(g: Game, input: Input, dt: number) {
  if (g.hitstop > 0) {
    g.hitstop -= dt;
    if (input.jumpDown) g.buffer = MOVE.buffer;
    return;
  }

  const want =
    (input.left ? -1 : 0) + (input.right ? 1 : 0);
  if (want) {
    g.facing = want < 0 ? -1 : 1;
    g.moved = true;
  }

  const accel = g.grounded ? MOVE.accelG : MOVE.accelA;
  const decel = g.grounded ? MOVE.decelG : MOVE.decelA;
  if (want !== 0) {
    g.vx += want * accel * dt;
    g.vx = clamp(g.vx, -MOVE.maxRun, MOVE.maxRun);
  } else if (g.vx !== 0) {
    const s = Math.sign(g.vx);
    g.vx -= s * decel * dt;
    if (Math.sign(g.vx) !== s) g.vx = 0;
  }

  if (input.jumpDown) g.buffer = MOVE.buffer;

  const canJump = g.grounded || g.coyote > 0;
  if (g.buffer > 0 && canJump) {
    g.vy = -MOVE.jump;
    g.grounded = false;
    g.coyote = 0;
    g.buffer = 0;
    g.jumpHeld = true;
    g.air = 0;
    g.events.push({ type: "jump", x: g.x + PW / 2, y: g.y + PH });
    g.moved = true;
  }

  if (g.jumpHeld && !input.jumpHeld && g.vy < 0) {
    g.vy *= MOVE.jumpCut;
    g.jumpHeld = false;
  }
  if (!input.jumpHeld) g.jumpHeld = false;

  let grav = MOVE.gravFall;
  if (g.vy < 0) grav = MOVE.gravRise;
  if (Math.abs(g.vy) < MOVE.peakWindow) grav = MOVE.gravPeak;
  if (!g.jumpHeld && g.vy < 0) grav = MOVE.gravFall;
  g.vy = Math.min(MOVE.maxFall, g.vy + grav * dt);

  const body: Box = { x: g.x, y: g.y, w: PW, h: PH };
  const rock = solids(g);

  g.x += g.vx * dt;
  body.x = g.x;
  resolveX(body, rock);
  g.x = body.x;

  const wasAir = !g.grounded;
  const fall = g.vy;
  g.y += g.vy * dt;
  body.x = g.x;
  body.y = g.y;
  if (g.vy < 0) cornerFix(body, rock, g.vy);
  const hit = resolveY(body, rock, g.vy);
  g.x = body.x;
  g.y = body.y;

  if (hit.floor) {
    if (wasAir) {
      const hard = clamp((fall - 80) / 420, 0, 1);
      g.events.push({ type: "land", x: g.x + PW / 2, y: g.y + PH, hard });
      if (!g.reduced && fall > MOVE.hitstopMin) g.hitstop = MOVE.hitstop;
    }
    g.vy = 0;
    g.grounded = true;
    g.coyote = MOVE.coyote;
    g.air = 0;
  } else if (hit.ceil) {
    if (g.vy < 0) g.events.push({ type: "bonk" });
    g.vy = 0;
    g.grounded = false;
    g.coyote = 0;
  } else {
    g.grounded = false;
    g.coyote = Math.max(0, g.coyote - dt);
    g.air += dt;
  }

  g.buffer = Math.max(0, g.buffer - dt);
  g.invuln = Math.max(0, g.invuln - dt);

  if (g.grounded) {
    g.walk += Math.abs(g.vx) * dt;
  }

  if (g.x < 8) {
    g.x = 8;
    if (g.vx < 0) g.vx = 0;
  }
  if (g.x > WORLD_W - PW - 8) {
    g.x = WORLD_W - PW - 8;
    if (g.vx > 0) g.vx = 0;
  }
}

export function newGame(reduced: boolean): Game {
  const spawnX = WAYS[0].x - PW / 2;
  const spawnY = WAYS[0].y;
  return {
    x: spawnX,
    y: spawnY - PH,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyote: 0,
    buffer: 0,
    jumpHeld: false,
    hitstop: 0,
    invuln: 0,
    walk: 0,
    air: 0,
    stones: [],
    deaths: 0,
    ascents: 0,
    atSummit: false,
    spawnX,
    spawnY,
    check: 0,
    moved: false,
    reduced,
    events: [],
    shake: 0,
    time: 0,
    acc: 0,
  };
}

function hazards(g: Game) {
  if (g.invuln > 0) return;
  const body: Box = { x: g.x, y: g.y, w: PW, h: PH };
  if (g.y + PH > VOID_Y) {
    die(g);
    return;
  }
  for (const hz of SCREE) {
    if (overlaps(body, hz)) {
      die(g);
      return;
    }
  }
}

export function advance(g: Game, input: Input, dt: number) {
  g.acc += dt;
  if (g.acc > 0.05) g.acc = 0.05;
  g.time += Math.min(dt, 0.05);
  g.shake = Math.max(0, g.shake - dt * 4);

  let steps = 0;
  while (g.acc >= STEP && steps < 8) {
    stepPlayer(g, input, STEP);
    settleStones(g, STEP);
    hazards(g);
    input.jumpDown = false;
    g.acc -= STEP;
    steps += 1;
  }
  if (!Number.isFinite(g.x) || !Number.isFinite(g.y)) {
    g.x = g.spawnX;
    g.y = g.spawnY - PH;
    g.vx = 0;
    g.vy = 0;
  }

  markWay(g);

  const body: Box = { x: g.x, y: g.y, w: PW, h: PH };
  if (g.grounded && overlaps(body, SUMMIT) && !g.atSummit) {
    g.atSummit = true;
    g.ascents += 1;
    g.events.push({ type: "summit" });
  } else if (!overlaps(body, SUMMIT)) {
    g.atSummit = false;
  }
}

export function footDue(g: Game, last: number) {
  if (!g.grounded || Math.abs(g.vx) < 40) return false;
  const stride = 18;
  return Math.floor(g.walk / stride) !== Math.floor(last / stride);
}
