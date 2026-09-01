import { UnknownZoneError, type Instant, type Transition, type Zone } from "./types";

type FixedZone = {
  kind: "fixed";
  id: string;
  offsetMs: number;
  abbr: string;
};

type SeasonalZone = {
  kind: "seasonal";
  id: string;
  stdOffsetMs: number;
  dstOffsetMs: number;
  stdAbbr: string;
  dstAbbr: string;
  /** UTC instant of the spring/autumn change, for each year. */
  startDst: (year: number) => number;
  endDst: (year: number) => number;
  /** True when DST starts in the year before it ends (southern hemisphere). */
  southern?: boolean;
};

type Spec = FixedZone | SeasonalZone;

const HOUR = 3_600_000;

function utcFromLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  offsetMs: number,
): number {
  return Date.UTC(year, month - 1, day, hour, 0, 0, 0) - offsetMs;
}

function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number,
): number {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstDow = first.getUTCDay();
  let day = 1 + ((weekday - firstDow + 7) % 7);
  day += (n - 1) * 7;
  return day;
}

function lastWeekday(year: number, month: number, weekday: number): number {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDow = new Date(Date.UTC(year, month - 1, last)).getUTCDay();
  return last - ((lastDow - weekday + 7) % 7);
}

const SPECS: Record<string, Spec> = {
  UTC: { kind: "fixed", id: "UTC", offsetMs: 0, abbr: "UTC" },
  "Etc/UTC": { kind: "fixed", id: "Etc/UTC", offsetMs: 0, abbr: "UTC" },
  "Asia/Tokyo": {
    kind: "fixed",
    id: "Asia/Tokyo",
    offsetMs: 9 * HOUR,
    abbr: "JST",
  },
  "America/Phoenix": {
    kind: "fixed",
    id: "America/Phoenix",
    offsetMs: -7 * HOUR,
    abbr: "MST",
  },
  "America/Sao_Paulo": {
    kind: "fixed",
    id: "America/Sao_Paulo",
    offsetMs: -3 * HOUR,
    abbr: "BRT",
  },
  "Europe/London": {
    kind: "seasonal",
    id: "Europe/London",
    stdOffsetMs: 0,
    dstOffsetMs: HOUR,
    stdAbbr: "GMT",
    dstAbbr: "BST",
    startDst: (y) => utcFromLocal(y, 3, lastWeekday(y, 3, 0), 1, 0),
    endDst: (y) => utcFromLocal(y, 10, lastWeekday(y, 10, 0), 1, 0),
  },
  "Europe/Paris": {
    kind: "seasonal",
    id: "Europe/Paris",
    stdOffsetMs: HOUR,
    dstOffsetMs: 2 * HOUR,
    stdAbbr: "CET",
    dstAbbr: "CEST",
    startDst: (y) => utcFromLocal(y, 3, lastWeekday(y, 3, 0), 2, HOUR),
    endDst: (y) => utcFromLocal(y, 10, lastWeekday(y, 10, 0), 2, HOUR),
  },
  "America/New_York": {
    kind: "seasonal",
    id: "America/New_York",
    stdOffsetMs: -5 * HOUR,
    dstOffsetMs: -4 * HOUR,
    stdAbbr: "EST",
    dstAbbr: "EDT",
    startDst: (y) => utcFromLocal(y, 3, nthWeekday(y, 3, 0, 2), 2, -5 * HOUR),
    endDst: (y) => utcFromLocal(y, 11, nthWeekday(y, 11, 0, 1), 2, -4 * HOUR),
  },
  "Pacific/Auckland": {
    kind: "seasonal",
    id: "Pacific/Auckland",
    stdOffsetMs: 12 * HOUR,
    dstOffsetMs: 13 * HOUR,
    stdAbbr: "NZST",
    dstAbbr: "NZDT",
    southern: true,
    startDst: (y) => utcFromLocal(y, 9, lastWeekday(y, 9, 0), 2, 12 * HOUR),
    endDst: (y) => utcFromLocal(y, 4, nthWeekday(y, 4, 0, 1), 3, 13 * HOUR),
  },
  "Australia/Lord_Howe": {
    kind: "seasonal",
    id: "Australia/Lord_Howe",
    stdOffsetMs: 10 * HOUR + 30 * 60_000,
    dstOffsetMs: 11 * HOUR,
    stdAbbr: "LHST",
    dstAbbr: "LHDT",
    southern: true,
    startDst: (y) =>
      utcFromLocal(y, 10, nthWeekday(y, 10, 0, 1), 2, 10 * HOUR + 30 * 60_000),
    endDst: (y) => utcFromLocal(y, 4, nthWeekday(y, 4, 0, 1), 2, 11 * HOUR),
  },
};

const YEAR_FROM = 2010;
const YEAR_TO = 2036;

function transitionsFor(spec: SeasonalZone): Transition[] {
  const out: Transition[] = [];
  for (let y = YEAR_FROM; y <= YEAR_TO; y++) {
    const start = spec.startDst(y);
    const end = spec.endDst(y);
    const startT: Transition = {
      at: { kind: "instant", epochMs: start },
      offsetBeforeMs: spec.stdOffsetMs,
      offsetAfterMs: spec.dstOffsetMs,
      abbreviationBefore: spec.stdAbbr,
      abbreviationAfter: spec.dstAbbr,
    };
    const endT: Transition = {
      at: { kind: "instant", epochMs: end },
      offsetBeforeMs: spec.dstOffsetMs,
      offsetAfterMs: spec.stdOffsetMs,
      abbreviationBefore: spec.dstAbbr,
      abbreviationAfter: spec.stdAbbr,
    };
    if (spec.southern) {
      out.push(endT, startT);
    } else {
      out.push(startT, endT);
    }
  }
  return out.sort((a, b) => a.at.epochMs - b.at.epochMs);
}

const CACHE = new Map<string, Transition[]>();

function specOf(id: string): Spec {
  const spec = SPECS[id];
  if (!spec) {
    throw new UnknownZoneError(
      `Unknown zone "${id}". This documentation build ships ${Object.keys(SPECS).filter((k) => k !== "Etc/UTC").join(", ")}.`,
    );
  }
  return spec;
}

export function zoneGet(id: string): Zone {
  specOf(id);
  return { kind: "zone", id: id === "Etc/UTC" ? "UTC" : id };
}

export function zoneUtc(): Zone {
  return { kind: "zone", id: "UTC" };
}

export function zoneIds(): string[] {
  return Object.keys(SPECS).filter((id) => id !== "Etc/UTC");
}

export function offsetAt(zone: Zone, instant: Instant): number {
  const spec = specOf(zone.id === "UTC" ? "UTC" : zone.id);
  if (spec.kind === "fixed") return spec.offsetMs;
  const list = CACHE.get(spec.id) ?? (CACHE.set(spec.id, transitionsFor(spec)), CACHE.get(spec.id)!);
  let offset = spec.southern ? spec.dstOffsetMs : spec.stdOffsetMs;
  for (const t of list) {
    if (instant.epochMs < t.at.epochMs) break;
    offset = t.offsetAfterMs;
  }
  return offset;
}

export function abbreviationAt(zone: Zone, instant: Instant): string {
  const spec = specOf(zone.id === "UTC" ? "UTC" : zone.id);
  if (spec.kind === "fixed") return spec.abbr;
  const list = CACHE.get(spec.id) ?? (CACHE.set(spec.id, transitionsFor(spec)), CACHE.get(spec.id)!);
  let abbr = spec.southern ? spec.dstAbbr : spec.stdAbbr;
  for (const t of list) {
    if (instant.epochMs < t.at.epochMs) break;
    abbr = t.abbreviationAfter;
  }
  return abbr;
}

export function nextTransition(zone: Zone, instant: Instant): Transition | null {
  const spec = specOf(zone.id === "UTC" ? "UTC" : zone.id);
  if (spec.kind === "fixed") return null;
  const list = CACHE.get(spec.id) ?? (CACHE.set(spec.id, transitionsFor(spec)), CACHE.get(spec.id)!);
  return list.find((t) => t.at.epochMs > instant.epochMs) ?? null;
}

export function previousTransition(zone: Zone, instant: Instant): Transition | null {
  const spec = specOf(zone.id === "UTC" ? "UTC" : zone.id);
  if (spec.kind === "fixed") return null;
  const list = CACHE.get(spec.id) ?? (CACHE.set(spec.id, transitionsFor(spec)), CACHE.get(spec.id)!);
  let found: Transition | null = null;
  for (const t of list) {
    if (t.at.epochMs >= instant.epochMs) break;
    found = t;
  }
  return found;
}

export function nearbyOffsets(zone: Zone, civilAsUtcMs: number): number[] {
  const probe: Instant = { kind: "instant", epochMs: civilAsUtcMs };
  const a = offsetAt(zone, { kind: "instant", epochMs: probe.epochMs - 36 * HOUR });
  const b = offsetAt(zone, probe);
  const c = offsetAt(zone, { kind: "instant", epochMs: probe.epochMs + 36 * HOUR });
  return [...new Set([a, b, c])];
}

export function transitionAround(zone: Zone, civilAsUtcMs: number): Transition | null {
  const prev = previousTransition(zone, { kind: "instant", epochMs: civilAsUtcMs + 48 * HOUR });
  return prev;
}
