export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type Term = "autumn" | "spring";
export type Half = "a" | "b";
export type Kind = "solo" | "pair" | "ensemble" | "extra";
export type Severity = "hard" | "soft";

export type Period = {
  i: number;
  start: string;
  end: string;
};

export type School = {
  id: string;
  name: string;
  short: string;
  stage: "primary" | "junior" | "secondary";
  days: Day[];
  autumn: Period[];
  spring: Period[];
};

export type Exam = {
  grade: number;
  when: string;
};

export type Pupil = {
  id: string;
  given: string;
  family: string;
  schoolId: string;
  year: number;
  level: number;
  young: boolean;
  tuesdayOnly: boolean;
  exam: Exam | null;
  ensemble: boolean;
  windows: { autumn: number[]; spring: number[] };
};

export type Slot = {
  schoolId: string;
  day: Day;
  period: number;
  half: Half;
};

export type Placement = Slot & {
  id: string;
  pupilIds: string[];
  kind: Kind;
};

export type Visit = {
  schoolId: string;
  day: Day;
  periods: number[];
};

export type Travel = {
  a: string;
  b: string;
  minutes: number;
};

export type World = {
  schools: School[];
  pupils: Pupil[];
  visits: Record<Term, Visit[]>;
  /** Rooms a school has given him this term, even before anyone is seated. */
  required: Record<Term, Visit[]>;
  travel: Travel[];
  autumn: Placement[];
};

export type Violation = {
  code: string;
  severity: Severity;
  message: string;
};

export type Finding = {
  placement: Placement;
  hard: Violation[];
  soft: Violation[];
};

const EXAM_WINDOW_START = "2026-01-12";
const EXAM_WINDOW_END = "2026-03-21";

export function schoolById(world: World, id: string): School {
  const found = world.schools.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown school ${id}`);
  return found;
}

export function pupilById(world: World, id: string): Pupil {
  const found = world.pupils.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown pupil ${id}`);
  return found;
}

export function nameOf(pupil: Pupil): string {
  return `${pupil.given} ${pupil.family}`;
}

export function minutes(stamp: string): number {
  const [hours, mins] = stamp.split(":").map(Number);
  return hours * 60 + mins;
}

export function fmtMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function periodsOf(school: School, term: Term): Period[] {
  return term === "spring" ? school.spring : school.autumn;
}

export function durationOf(period: Period): number {
  return minutes(period.end) - minutes(period.start);
}

export function halvesOf(period: Period): Half[] {
  return durationOf(period) >= 50 ? ["a", "b"] : ["a"];
}

export function lastPeriodIndex(school: School, term: Term): number {
  return periodsOf(school, term).length - 1;
}

export function slotClock(
  school: School,
  term: Term,
  period: number,
  half: Half,
): { start: string; end: string } {
  const row = periodsOf(school, term)[period];
  if (!row) return { start: "—", end: "—" };
  const halves = halvesOf(row);
  if (halves.length === 1) return { start: row.start, end: row.end };
  const start = minutes(row.start);
  const end = minutes(row.end);
  const mid = start + Math.floor((end - start) / 2);
  if (half === "a") return { start: row.start, end: fmtMinutes(mid) };
  return { start: fmtMinutes(mid), end: row.end };
}

export function slotKey(slot: Slot): string {
  return `${slot.schoolId}:${slot.day}:${String(slot.period)}:${slot.half}`;
}

export function travelMinutes(world: World, a: string, b: string): number {
  if (a === b) return 0;
  const edge = world.travel.find(
    (item) => (item.a === a && item.b === b) || (item.a === b && item.b === a),
  );
  return edge?.minutes ?? 20;
}

export function visitsOf(world: World, term: Term): Visit[] {
  return world.visits[term];
}

export function allowedVisit(
  world: World,
  term: Term,
  schoolId: string,
  day: Day,
  period: number,
): boolean {
  return visitsOf(world, term).some(
    (visit) =>
      visit.schoolId === schoolId &&
      visit.day === day &&
      visit.periods.includes(period),
  );
}

export function slotsFor(world: World, term: Term): Slot[] {
  const slots: Slot[] = [];
  for (const visit of visitsOf(world, term)) {
    const school = schoolById(world, visit.schoolId);
    const periods = periodsOf(school, term);
    for (const index of visit.periods) {
      const period = periods[index];
      if (!period) continue;
      for (const half of halvesOf(period)) {
        slots.push({
          schoolId: visit.schoolId,
          day: visit.day,
          period: index,
          half,
        });
      }
    }
  }
  return slots;
}

function clockOf(world: World, term: Term, placement: Placement): {
  start: number;
  end: number;
} {
  const school = schoolById(world, placement.schoolId);
  const clock = slotClock(school, term, placement.period, placement.half);
  return { start: minutes(clock.start), end: minutes(clock.end) };
}

function inExamWindow(exam: Exam): boolean {
  // Modelled March practicals sit inside the eight-week run-up once January lands.
  const stamp = `2026-${exam.when}`;
  return stamp >= EXAM_WINDOW_START && stamp <= EXAM_WINDOW_END;
}

export function evaluate(
  placement: Placement,
  others: Placement[],
  world: World,
  term: Term,
): Violation[] {
  const found: Violation[] = [];
  const school = schoolById(world, placement.schoolId);
  const period = periodsOf(school, term)[placement.period];
  const pupils = placement.pupilIds.map((id) => pupilById(world, id));

  if (!period) {
    found.push({
      code: "period",
      severity: "hard",
      message: `${school.short} has no period ${String(placement.period + 1)} in this timetable.`,
    });
    return found;
  }

  if (!allowedVisit(world, term, placement.schoolId, placement.day, placement.period)) {
    found.push({
      code: "visit",
      severity: "hard",
      message: `${school.short} does not give him ${placement.day} period ${String(placement.period + 1)} this term.`,
    });
  }

  if (placement.half === "b" && halvesOf(period).length === 1) {
    found.push({
      code: "half",
      severity: "hard",
      message: `${school.short} period ${String(placement.period + 1)} is ${String(durationOf(period))} minutes — a second lesson no longer fits.`,
    });
  }

  if (!school.days.includes(placement.day)) {
    found.push({
      code: "school-day",
      severity: "hard",
      message: `${school.short} does not sit on ${placement.day}.`,
    });
  }

  const occupant = others.find((item) => slotKey(item) === slotKey(placement));
  if (occupant) {
    const names = occupant.pupilIds.map((id) => nameOf(pupilById(world, id))).join(" / ");
    found.push({
      code: "clash",
      severity: "hard",
      message: `That window is already held by ${names}.`,
    });
  }

  for (const pupil of pupils) {
    if (pupil.schoolId !== placement.schoolId) {
      found.push({
        code: "wrong-school",
        severity: "hard",
        message: `${nameOf(pupil)} is on the ${schoolById(world, pupil.schoolId).short} roll, not ${school.short}.`,
      });
    }
    if (!pupil.windows[term].includes(placement.period)) {
      found.push({
        code: "pullout",
        severity: "hard",
        message: `${nameOf(pupil)} is in a lesson he cannot interrupt in period ${String(placement.period + 1)}.`,
      });
    }
    if (pupil.tuesdayOnly && placement.day !== "Tue") {
      found.push({
        code: "tuesday",
        severity: "hard",
        message: `${nameOf(pupil)} can only be seen on Tuesdays.`,
      });
    }
    if (pupil.young && placement.period === lastPeriodIndex(school, term)) {
      found.push({
        code: "young-last",
        severity: "hard",
        message: `${nameOf(pupil)} is too young for last period — it is wasted.`,
      });
    }
    if (pupil.exam && term === "spring" && inExamWindow(pupil.exam)) {
      const extras = [...others, placement].filter(
        (item) => item.kind === "extra" && item.pupilIds.includes(pupil.id),
      );
      const weekly = [...others, placement].filter(
        (item) => item.kind !== "extra" && item.pupilIds.includes(pupil.id),
      );
      if (weekly.length > 0 && extras.length === 0) {
        found.push({
          code: "exam-short",
          severity: "soft",
          message: `${nameOf(pupil)} is inside eight weeks of a Grade ${String(pupil.exam.grade)} — thirty minutes is not enough.`,
        });
      }
    }
    if (pupil.exam && term === "autumn") {
      const extras = [...others, placement].filter(
        (item) => item.kind === "extra" && item.pupilIds.includes(pupil.id),
      );
      if (placement.kind !== "extra" && extras.length === 0) {
        found.push({
          code: "exam-soon",
          severity: "soft",
          message: `${nameOf(pupil)} has a Grade ${String(pupil.exam.grade)} in March. The extra time is not seated yet.`,
        });
      }
    }
  }

  if (placement.kind === "pair") {
    if (pupils.length !== 2) {
      found.push({
        code: "pair-count",
        severity: "hard",
        message: "A pair needs two pupils in the same window.",
      });
    } else if (Math.abs(pupils[0].level - pupils[1].level) > 1) {
      found.push({
        code: "pair-level",
        severity: "hard",
        message: `${nameOf(pupils[0])} is Grade ${String(pupils[0].level)}, ${nameOf(pupils[1])} is Grade ${String(pupils[1].level)} — a pair only holds if the levels match.`,
      });
    }
  }

  if (placement.kind === "ensemble" && pupils.length < 3) {
    found.push({
      code: "ensemble",
      severity: "hard",
      message: "An ensemble needs several pupils free in the same window.",
    });
  }

  const dayLoad = [placement, ...others].filter((item) => {
    if (item.day !== placement.day) return false;
    if (
      item.id !== placement.id &&
      !allowedVisit(world, term, item.schoolId, item.day, item.period)
    ) {
      return false;
    }
    return true;
  });
  const bySchool = new Map<string, { start: number; end: number }>();
  for (const visit of world.required[term]) {
    if (visit.day !== placement.day) continue;
    const reqSchool = schoolById(world, visit.schoolId);
    for (const index of visit.periods) {
      const period = periodsOf(reqSchool, term)[index];
      if (!period) continue;
      const span = bySchool.get(visit.schoolId);
      const start = minutes(period.start);
      const end = minutes(period.end);
      if (!span) bySchool.set(visit.schoolId, { start, end });
      else {
        span.start = Math.min(span.start, start);
        span.end = Math.max(span.end, end);
      }
    }
  }
  for (const item of dayLoad) {
    const clock = clockOf(world, term, item);
    if (!Number.isFinite(clock.start) || !Number.isFinite(clock.end)) continue;
    const span = bySchool.get(item.schoolId);
    if (!span) bySchool.set(item.schoolId, { start: clock.start, end: clock.end });
    else {
      span.start = Math.min(span.start, clock.start);
      span.end = Math.max(span.end, clock.end);
    }
  }
  const here = bySchool.get(placement.schoolId);
  if (here) {
    for (const [otherId, span] of bySchool) {
      if (otherId === placement.schoolId) continue;
      const need = travelMinutes(world, placement.schoolId, otherId);
      const otherSchool = schoolById(world, otherId);
      const gap =
        here.start >= span.end
          ? here.start - span.end
          : span.start >= here.end
            ? span.start - here.end
            : -1;
      if (gap < 0) {
        found.push({
          code: "overlap",
          severity: "hard",
          message: `${placement.day}: ${school.short} overlaps ${otherSchool.short}.`,
        });
      } else if (gap < need) {
        found.push({
          code: "travel",
          severity: "hard",
          message: `${placement.day}: ${String(gap)} minutes between ${school.short} and ${otherSchool.short}. The run needs ${String(need)}.`,
        });
      }
    }
  }

  return dedupe(found);
}

function dedupe(list: Violation[]): Violation[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = `${item.code}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findings(
  placements: Placement[],
  world: World,
  term: Term,
): Finding[] {
  return placements.map((placement) => {
    const others = placements.filter((item) => item.id !== placement.id);
    const all = evaluate(placement, others, world, term);
    return {
      placement,
      hard: all.filter((item) => item.severity === "hard"),
      soft: all.filter((item) => item.severity === "soft"),
    };
  });
}

export function tally(list: Finding[]): {
  held: number;
  soft: number;
  hard: number;
  byCode: Record<string, number>;
} {
  const byCode: Record<string, number> = {};
  let held = 0;
  let soft = 0;
  let hard = 0;
  for (const row of list) {
    if (row.hard.length) hard += 1;
    else if (row.soft.length) soft += 1;
    else held += 1;
    for (const item of [...row.hard, ...row.soft]) {
      byCode[item.code] = (byCode[item.code] ?? 0) + 1;
    }
  }
  return { held, soft, hard, byCode };
}

export type Proposal = {
  slot: Slot;
  clock: { start: string; end: string };
  soft: Violation[];
  whyNot: Violation[] | null;
};

export function proposals(
  world: World,
  term: Term,
  placements: Placement[],
  moving: Placement,
): { legal: Proposal[]; blocked: Proposal[] } {
  const others = placements.filter((item) => item.id !== moving.id);
  const legal: Proposal[] = [];
  const blocked: Proposal[] = [];
  const schoolWanted = moving.schoolId;

  for (const slot of slotsFor(world, term)) {
    if (slot.schoolId !== schoolWanted) continue;
    const trial: Placement = { ...moving, ...slot };
    const all = evaluate(trial, others, world, term);
    const hard = all.filter((item) => item.severity === "hard");
    const soft = all.filter((item) => item.severity === "soft");
    const school = schoolById(world, slot.schoolId);
    const clock = slotClock(school, term, slot.period, slot.half);
    const row: Proposal = { slot, clock, soft, whyNot: hard.length ? hard : null };
    if (hard.length) blocked.push(row);
    else legal.push(row);
  }

  legal.sort((a, b) => {
    if (a.soft.length !== b.soft.length) return a.soft.length - b.soft.length;
    const sameDay = Number(b.slot.day === moving.day) - Number(a.slot.day === moving.day);
    if (sameDay) return sameDay;
    return slotKey(a.slot).localeCompare(slotKey(b.slot));
  });

  blocked.sort((a, b) => {
    const rank = (row: Proposal) => {
      const codes = new Set((row.whyNot ?? []).map((item) => item.code));
      if (codes.has("clash")) return 0;
      if (codes.has("travel")) return 1;
      if (codes.has("pullout")) return 2;
      if (codes.has("half")) return 3;
      return 4;
    };
    return rank(a) - rank(b);
  });

  return { legal, blocked: blocked.slice(0, 5) };
}

export function householdSlip(
  world: World,
  term: Term,
  pupil: Pupil,
  current: Placement | undefined,
  original: Placement | undefined,
): { title: string; body: string; changed: boolean; broken: boolean } {
  const school = schoolById(world, pupil.schoolId);
  const now = current
    ? slotClock(school, term, current.period, current.half)
    : null;
  const before = original
    ? slotClock(school, "autumn", original.period, original.half)
    : null;
  const broken = Boolean(current && findings([current], world, term)[0]?.hard.length);
  const changed =
    !current ||
    !original ||
    slotKey(current) !== slotKey(original) ||
    (now && before && (now.start !== before.start || now.end !== before.end));

  const timeLine = current && now
    ? `${current.day} ${now.start}–${now.end}, ${school.name}`
    : "not yet reseated";

  const body = [
    `${pupil.family} household`,
    "",
    `${pupil.given}'s violin is ${timeLine}.`,
    before && changed
      ? `It had been ${original?.day ?? ""} ${before.start}–${before.end}.`
      : "",
    broken
      ? "That time no longer holds. A new window has not been chosen yet."
      : "",
    "",
    "Nothing is sent from this page. The wording stays on this device.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    title: `${pupil.family} — ${pupil.given}`,
    body,
    changed: Boolean(changed),
    broken,
  };
}

export const LEDGER: { code: string; label: string; hint: string }[] = [
  { code: "pullout", label: "Pull-out", hint: "Pupil free of a lesson he cannot interrupt" },
  { code: "visit", label: "Visiting hours", hint: "Days and periods the school actually gives him" },
  { code: "half", label: "Period length", hint: "A 30-minute lesson needs a period long enough to hold it" },
  { code: "travel", label: "Travel gap", hint: "Twenty-five minutes between St Hilda's and St Brigid's" },
  { code: "clash", label: "One body", hint: "He cannot teach two windows at once" },
  { code: "tuesday", label: "Tuesday only", hint: "One pupil cannot be seen any other day" },
  { code: "young-last", label: "Last period", hint: "Younger pupils are tired; the lesson is wasted" },
  { code: "pair-level", label: "Pair match", hint: "A shared thirty minutes only works if the levels match" },
  { code: "exam-short", label: "Exam load", hint: "Eight weeks before a practical, they need more than thirty minutes" },
  { code: "exam-soon", label: "Exam ahead", hint: "March practicals, extra time not yet seated" },
  { code: "overlap", label: "Same hour", hint: "A room they have given him collides with another school" },
];
