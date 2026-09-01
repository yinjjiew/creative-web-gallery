/**
 * The route is a day with physics. Opening hours, travel, and queues are
 * constraints. A pair that cannot share a day is refused or the order is
 * rewritten. Nothing is a pin on a map.
 *
 * Named schedule.ts — Next.js treats a file called route.ts as an API handler.
 */

import {
  BUILDING_BY_ID,
  DAY_END,
  TALK_BY_ID,
  type DayId,
  type District,
  hoursOn,
  travelMin,
} from "./data";

export type ClashKind = "closed" | "late" | "travel" | "queue" | "talk" | "booking";

export type Clash = {
  kind: ClashKind;
  stopId: string;
  message: string;
};

export type Timed = {
  id: string;
  kind: "building" | "talk" | "travel";
  start: number;
  end: number;
  travelMin?: number;
  queueMin?: number;
  waitMin?: number;
  doomed?: boolean;
};

export type Fit = {
  ok: boolean;
  items: Timed[];
  ghost: Timed | null;
  clash: Clash | null;
  leaveAt: number;
  atDistrict: District | null;
};

export type Proposal =
  | { type: "ok"; buildings: string[]; fit: Fit }
  | { type: "rewrite"; buildings: string[]; fit: Fit; reason: string }
  | { type: "refuse"; reason: string; fit: Fit; suggestDay?: DayId };

export function evaluate(
  buildingIds: string[],
  talkIds: string[],
  day: DayId,
  clock: number,
  hereId: string | null,
  inQueue: boolean,
): Fit {
  const items: Timed[] = [];
  let t = clock;
  let loc: District | null = null;
  const here = hereId ? BUILDING_BY_ID[hereId] : null;
  if (here) loc = here.district;

  let startIndex = 0;
  if (hereId) {
    const idx = buildingIds.indexOf(hereId);
    if (idx >= 0) startIndex = idx;
  }

  const talks = talkIds
    .map((id) => TALK_BY_ID[id])
    .filter((talk) => talk && talk.day === day)
    .sort((a, b) => a.start - b.start);
  let talkIdx = 0;

  const consumeTalk = (talk: (typeof talks)[number]): Clash | null => {
    if (loc) {
      const walk = travelMin(loc, talk.district);
      const arrive = t + walk;
      if (walk > 0) {
        items.push({
          id: `walk-${talk.id}`,
          kind: "travel",
          start: t,
          end: arrive,
          travelMin: walk,
        });
      }
      if (arrive > talk.start) {
        return {
          kind: "talk",
          stopId: talk.id,
          message: `The talk “${talk.title}” starts at ${stamp(talk.start)}. From here it is ${walk} minutes. You would arrive at ${stamp(arrive)}.`,
        };
      }
      t = talk.start;
    } else if (t > talk.start) {
      return {
        kind: "talk",
        stopId: talk.id,
        message: `The talk “${talk.title}” started at ${stamp(talk.start)}. It is ${stamp(t)}.`,
      };
    } else {
      t = talk.start;
    }
    items.push({
      id: talk.id,
      kind: "talk",
      start: talk.start,
      end: talk.start + talk.duration,
    });
    t = talk.start + talk.duration;
    loc = talk.district;
    return null;
  };

  for (let i = startIndex; i < buildingIds.length; i++) {
    const id = buildingIds[i];
    const b = BUILDING_BY_ID[id];
    if (!b) continue;

    while (talkIdx < talks.length) {
      const talk = talks[talkIdx];
      const walkToTalk = loc ? travelMin(loc, talk.district) : 0;
      const hours = hoursOn(b, day);
      const walkToB = loc ? travelMin(loc, b.district) : 0;
      const earliestEnter = Math.max(t + walkToB, hours ? hours.open : t) + queueFor(b, id === hereId && inQueue);
      if (t + walkToTalk <= talk.start && earliestEnter + b.visit > talk.start) {
        const clash = consumeTalk(talk);
        talkIdx += 1;
        if (clash) return fail(items, clash, loc, t);
      } else {
        break;
      }
    }

    const hours = hoursOn(b, day);
    if (!hours) {
      const other = day === "sat" ? "Sunday" : "Saturday";
      const clash: Clash = {
        kind: "closed",
        stopId: id,
        message: `${b.name} is closed ${day === "sat" ? "Saturday" : "Sunday"}. It opens ${other} only.`,
      };
      return fail(items, clash, loc, t, ghostAt(id, t, b.visit));
    }

    const atThis = hereId === id && i === startIndex;
    let walk = 0;
    if (loc && !atThis) {
      walk = travelMin(loc, b.district);
    }

    if (walk > 0) {
      items.push({
        id: `walk-${id}`,
        kind: "travel",
        start: t,
        end: t + walk,
        travelMin: walk,
      });
      t += walk;
    }

    const arrive = t;
    if (arrive > hours.close) {
      const clash: Clash = {
        kind: "travel",
        stopId: id,
        message: `${b.name} closes at ${stamp(hours.close)}. From the last door it is ${walk} minutes. You would arrive at ${stamp(arrive)}.`,
      };
      return fail(items, clash, loc, t, ghostAt(id, arrive, b.visit));
    }

    const wait = arrive < hours.open ? hours.open - arrive : 0;
    t = arrive + wait;

    const q = atThis && inQueue ? Math.max(5, Math.round(b.queue * 0.45)) : queueFor(b, false);
    if (t + q >= hours.close) {
      const clash: Clash = {
        kind: "queue",
        stopId: id,
        message: `${b.name} closes at ${stamp(hours.close)}. Typical queue is ${b.queue} minutes. You would still be in the street at close.`,
      };
      return fail(items, clash, loc, t, ghostAt(id, t, b.visit + q));
    }

    const enter = t + q;
    if (enter + b.visit > hours.close) {
      const clash: Clash = {
        kind: "late",
        stopId: id,
        message: `${b.name} closes at ${stamp(hours.close)}. After the ${q}-minute queue you would get in at ${stamp(enter)} — not enough time for a ${b.visit}-minute visit.`,
      };
      return fail(items, clash, loc, t, ghostAt(id, enter, hours.close - enter));
    }

    if (enter > DAY_END) {
      const clash: Clash = {
        kind: "late",
        stopId: id,
        message: `The day is over before you reach ${b.name}.`,
      };
      return fail(items, clash, loc, t, ghostAt(id, enter, b.visit));
    }

    const leave = enter + b.visit;
    items.push({
      id,
      kind: "building",
      start: arrive,
      end: leave,
      queueMin: q,
      waitMin: wait,
    });
    t = leave;
    loc = b.district;
  }

  while (talkIdx < talks.length) {
    const clash = consumeTalk(talks[talkIdx]);
    talkIdx += 1;
    if (clash) return fail(items, clash, loc, t);
  }

  return { ok: true, items, ghost: null, clash: null, leaveAt: t, atDistrict: loc };
}

function queueFor(b: { queue: number; booking: string }, alreadyIn: boolean): number {
  if (alreadyIn) return 0;
  if (b.booking === "required") return Math.min(b.queue, 20);
  return b.queue;
}

function stamp(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ghostAt(id: string, start: number, dur: number): Timed {
  return {
    id,
    kind: "building",
    start,
    end: Math.max(start + 15, start + dur),
    doomed: true,
  };
}

function fail(
  items: Timed[],
  clash: Clash,
  loc: District | null,
  t: number,
  ghost: Timed | null = null,
): Fit {
  return { ok: false, items, ghost, clash, leaveAt: t, atDistrict: loc };
}

export function proposeAdd(
  current: string[],
  addId: string,
  talkIds: string[],
  day: DayId,
  clock: number,
  hereId: string | null,
  inQueue: boolean,
): Proposal {
  if (current.includes(addId)) {
    const fit = evaluate(current, talkIds, day, clock, hereId, inQueue);
    return { type: "ok", buildings: current, fit };
  }

  const appended = [...current, addId];
  const appendFit = evaluate(appended, talkIds, day, clock, hereId, inQueue);
  if (appendFit.ok) return { type: "ok", buildings: appended, fit: appendFit };

  const lockAt = hereId && current.includes(hereId) ? current.indexOf(hereId) + 1 : 0;
  const locked = current.slice(0, lockAt);
  const free = [...current.slice(lockAt), addId];

  if (free.length <= 6) {
    const perms = permutations(free);
    for (const perm of perms) {
      const next = [...locked, ...perm];
      if (next.join() === appended.join()) continue;
      const fit = evaluate(next, talkIds, day, clock, hereId, inQueue);
      if (fit.ok) {
        return {
          type: "rewrite",
          buildings: next,
          fit,
          reason: rewriteReason(current, next, addId, appendFit.clash),
        };
      }
    }
  } else {
    for (let i = lockAt; i <= current.length; i++) {
      const next = [...current.slice(0, i), addId, ...current.slice(i)];
      const fit = evaluate(next, talkIds, day, clock, hereId, inQueue);
      if (fit.ok) {
        return {
          type: "rewrite",
          buildings: next,
          fit,
          reason: rewriteReason(current, next, addId, appendFit.clash),
        };
      }
    }
  }

  const other: DayId = day === "sat" ? "sun" : "sat";
  const otherFit = evaluate(appended, talkIds, other, clock, hereId, inQueue);
  if (otherFit.ok) {
    return {
      type: "refuse",
      reason: appendFit.clash?.message ?? "That pair will not share this day.",
      fit: appendFit,
      suggestDay: other,
    };
  }

  return {
    type: "refuse",
    reason: appendFit.clash?.message ?? "That pair will not share a day.",
    fit: appendFit,
  };
}

export function proposeTalk(
  buildingIds: string[],
  talkIds: string[],
  addId: string,
  day: DayId,
  clock: number,
  hereId: string | null,
  inQueue: boolean,
): Proposal {
  if (talkIds.includes(addId)) {
    return { type: "ok", buildings: buildingIds, fit: evaluate(buildingIds, talkIds, day, clock, hereId, inQueue) };
  }
  const nextTalks = [...talkIds, addId];
  const fit = evaluate(buildingIds, nextTalks, day, clock, hereId, inQueue);
  if (fit.ok) return { type: "ok", buildings: buildingIds, fit };
  return {
    type: "refuse",
    reason: fit.clash?.message ?? "That talk collides with the doors already on the tape.",
    fit,
  };
}

function rewriteReason(
  before: string[],
  after: string[],
  added: string,
  clash: Clash | null,
): string {
  const name = BUILDING_BY_ID[added]?.name ?? "That door";
  if (after[0] === added && before[0] !== added) {
    return `${name} has to come first — ${clash?.message ?? "the later slot does not exist."}`;
  }
  return `The tape was rewritten so ${name} still fits. ${clash?.message ?? ""}`.trim();
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}
