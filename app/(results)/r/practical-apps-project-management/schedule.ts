import { dayNum, longDate } from "./dates";
import type { Plan, Production, Scheduled, Task } from "./types";

export function taskById(production: Production): Record<string, Task> {
  const map: Record<string, Task> = {};
  for (const task of production.tasks) map[task.id] = task;
  return map;
}

export function buildSuccessors(tasks: Task[]): Record<string, string[]> {
  const successors: Record<string, string[]> = {};
  for (const task of tasks) successors[task.id] = [];
  for (const task of tasks) {
    for (const pred of task.depends) {
      if (!successors[pred]) successors[pred] = [];
      successors[pred].push(task.id);
    }
  }
  return successors;
}

function topo(tasks: Task[]): Task[] {
  const by = new Map(tasks.map((task) => [task.id, task]));
  const incoming = new Map<string, number>();
  for (const task of tasks) incoming.set(task.id, 0);
  for (const task of tasks) {
    for (const pred of task.depends) {
      if (!by.has(pred)) continue;
      incoming.set(task.id, (incoming.get(task.id) ?? 0) + 1);
    }
  }
  const queue = tasks.filter((task) => (incoming.get(task.id) ?? 0) === 0);
  const out: Task[] = [];
  while (queue.length) {
    const next = queue.shift()!;
    out.push(next);
    for (const succ of tasks) {
      if (!succ.depends.includes(next.id)) continue;
      const left = (incoming.get(succ.id) ?? 0) - 1;
      incoming.set(succ.id, left);
      if (left === 0) queue.push(succ);
    }
  }
  if (out.length !== tasks.length) {
    // Cycle: append leftovers so the UI still renders.
    for (const task of tasks) if (!out.includes(task)) out.push(task);
  }
  return out;
}

export function schedule(
  production: Production,
  done: Record<string, string>,
  asOf: number,
): Plan {
  const successors = buildSuccessors(production.tasks);
  const order = topo(production.tasks);
  const opening = dayNum(production.opening);
  const byId: Record<string, Scheduled> = {};

  for (const task of order) {
    const finished = done[task.id];
    let es: number;
    let ef: number;

    if (finished) {
      ef = dayNum(finished);
      es = ef - task.days;
    } else {
      let start = asOf;
      if (task.gate) start = Math.max(start, dayNum(task.gate));
      for (const pred of task.depends) {
        const prior = byId[pred];
        if (!prior) continue;
        const predTask = order.find((item) => item.id === pred);
        const wait = predTask?.wait ?? 0;
        start = Math.max(start, prior.ef + wait);
      }
      if (task.kind === "event" && task.on) {
        const booked = dayNum(task.on);
        es = Math.max(start, booked);
      } else if (task.kind === "gate" && task.on) {
        es = Math.max(start, dayNum(task.on));
      } else {
        es = start;
      }
      ef = es + task.days;
    }

    byId[task.id] = {
      es,
      ef,
      ls: es,
      lf: ef,
      slack: 0,
      untilStart: es - asOf,
      late: false,
      critical: false,
      feeds: null,
      misses: false,
    };
  }

  const reverse = [...order].reverse();
  for (const task of reverse) {
    const row = byId[task.id];
    const succs = successors[task.id] ?? [];
    let lf = opening;
    if (succs.length) {
      lf = Math.min(
        ...succs.map((id) => {
          const succ = byId[id];
          return succ.ls - task.wait;
        }),
      );
    }
    if (task.kind === "event" && task.on) {
      lf = Math.min(lf, dayNum(task.on) + task.days);
    }
    const ls = lf - task.days;
    const slack = ls - row.es;
    const booked = task.on && task.kind === "event" ? dayNum(task.on) : null;
    row.ls = ls;
    row.lf = lf;
    row.slack = slack;
    row.untilStart = done[task.id] ? Number.POSITIVE_INFINITY : ls - asOf;
    row.late = slack < 0 || (booked !== null && row.es > booked);
    row.critical = slack <= 0;
    row.misses = booked !== null && row.es > booked;
  }

  for (const task of order) {
    const row = byId[task.id];
    row.feeds = nearestEvent(task.id, production, successors, byId);
  }

  return {
    asOf,
    opening,
    horizon: opening - asOf,
    byId,
    successors,
  };
}

function nearestEvent(
  id: string,
  production: Production,
  successors: Record<string, string[]>,
  byId: Record<string, Scheduled>,
): string | null {
  const tasks = taskById(production);
  const seen = new Set<string>();
  const queue = [...(successors[id] ?? [])];
  let best: { id: string; on: number } | null = null;
  while (queue.length) {
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    const task = tasks[next];
    if (task?.kind === "event" && task.on) {
      const on = dayNum(task.on);
      if (!best || on < best.on) best = { id: next, on };
    }
    for (const succ of successors[next] ?? []) queue.push(succ);
  }
  return best?.id ?? null;
}

export function chainTo(
  id: string,
  eventId: string,
  production: Production,
  successors: Record<string, string[]>,
): string[] | null {
  const tasks = taskById(production);
  const path: string[] = [];

  function walk(from: string): boolean {
    path.push(from);
    if (from === eventId) return true;
    const opts = (successors[from] ?? [])
      .slice()
      .sort((a, b) => {
        const ta = tasks[a];
        const tb = tasks[b];
        const ea = ta?.on && ta.kind === "event" ? dayNum(ta.on) : 1e9;
        const eb = tb?.on && tb.kind === "event" ? dayNum(tb.on) : 1e9;
        return ea - eb;
      });
    for (const succ of opts) {
      if (walk(succ)) return true;
    }
    path.pop();
    return false;
  }

  if (id === eventId) return [id];
  return walk(id) ? path : null;
}

export function explain(
  task: Task,
  plan: Plan,
  production: Production,
): string {
  const row = plan.byId[task.id];
  const tasks = taskById(production);
  const feed = row.feeds ? tasks[row.feeds] : null;
  const feedRow = row.feeds ? plan.byId[row.feeds] : null;
  const path = row.feeds
    ? chainTo(task.id, row.feeds, production, plan.successors)
    : null;

  const bits: string[] = [];

  if (task.wait > 0) {
    bits.push(
      `Once this leaves, ${String(task.wait)} days pass before anyone can use what comes back.`,
    );
  }
  if (task.external) {
    bits.push("She cannot make the other end move faster.");
  }
  if (task.gate) {
    bits.push(`Nothing starts before ${longDate(dayNum(task.gate))}.`);
  }

  if (feed && feedRow && path) {
    const work = path
      .slice(1)
      .map((id) => tasks[id])
      .filter((item) => item && item.days > 0 && item.kind === "work")
      .map((item) => `${item.name.toLowerCase()} (${String(item.days)}d)`);
    const when = feed.on ? longDate(dayNum(feed.on)) : longDate(feedRow.es);
    if (row.late || row.misses) {
      bits.push(
        `Already past the last start that still makes ${feed.name.toLowerCase()} on ${when}.`,
      );
    } else if (row.untilStart === 0) {
      bits.push(
        `If this does not happen today, ${feed.name.toLowerCase()} on ${when} goes.`,
      );
    } else if (row.untilStart === 1) {
      bits.push(
        `Tomorrow is the last day this can start and still make ${feed.name.toLowerCase()} on ${when}.`,
      );
    } else if (row.untilStart < 8) {
      bits.push(
        `Last start ${longDate(row.ls)} if ${feed.name.toLowerCase()} is to hold on ${when}.`,
      );
    } else {
      bits.push(`Feeds ${feed.name.toLowerCase()} on ${when}.`);
    }
    if (work.length) {
      bits.push(`Then: ${work.join(", ")}.`);
    }
  } else if (row.untilStart === 0) {
    bits.push("Last start is today.");
  }

  if (task.note) bits.push(task.note);
  return bits.join(" ");
}

/** Open items, worst first: already late, then last-start soonest, then least air. */
export function pressure(
  production: Production,
  plan: Plan,
  done: Record<string, string>,
): Task[] {
  return production.tasks
    .filter((task) => !done[task.id] && task.kind !== "event" && task.kind !== "gate")
    .slice()
    .sort((a, b) => {
      const ra = plan.byId[a.id];
      const rb = plan.byId[b.id];
      const aGone = ra.late || ra.misses ? 0 : 1;
      const bGone = rb.late || rb.misses ? 0 : 1;
      if (aGone !== bGone) return aGone - bGone;
      if (ra.untilStart !== rb.untilStart) return ra.untilStart - rb.untilStart;
      if (b.wait !== a.wait) return b.wait - a.wait;
      if (ra.slack !== rb.slack) return ra.slack - rb.slack;
      return a.name.localeCompare(b.name);
    });
}

export function tonight(
  production: Production,
  plan: Plan,
  done: Record<string, string>,
): Task[] {
  return pressure(production, plan, done).filter((task) => {
    const row = plan.byId[task.id];
    return (
      row.late ||
      row.untilStart <= 7 ||
      (task.kind === "lead" && row.untilStart <= 10)
    );
  });
}

export function weekOf(
  production: Production,
  plan: Plan,
  done: Record<string, string>,
  dept: Task["dept"],
): Task[] {
  return production.tasks
    .filter((task) => {
      if (task.dept !== dept) return false;
      if (done[task.id] && task.kind !== "event") return false;
      const row = plan.byId[task.id];
      if (task.kind === "event") {
        return row.es <= plan.asOf + 10;
      }
      return row.untilStart <= 10 || (row.es <= plan.asOf + 10 && !done[task.id]);
    })
    .sort((a, b) => {
      const ra = plan.byId[a.id];
      const rb = plan.byId[b.id];
      return ra.untilStart - rb.untilStart || ra.es - rb.es;
    });
}
