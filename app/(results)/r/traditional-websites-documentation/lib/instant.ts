import {
  addCalendar,
  assertCivil,
  calendarOf,
  civilOf,
  civilToUtcMs,
  dayOfWeek,
  daysInMonth,
  utcMsToCivil,
} from "./calendar";
import { parseIso } from "./parse";
import {
  AmbiguousTimeError,
  ParseError,
  SkippedTimeError,
  fmtCivil,
  fmtOffset,
  pad,
  type Calendar,
  type Civil,
  type Clock,
  type Instant,
  type ResolveOptions,
  type Span,
  type Transition,
  type Zone,
} from "./types";
import {
  abbreviationAt,
  nearbyOffsets,
  nextTransition,
  offsetAt,
  previousTransition,
  zoneGet,
  zoneIds,
  zoneUtc,
} from "./zones";

export {
  AmbiguousTimeError,
  InstantError,
  InvalidCivilError,
  ParseError,
  SkippedTimeError,
  UnknownZoneError,
} from "./types";
export type {
  Calendar,
  Civil,
  Clock,
  Instant,
  ResolveOptions,
  Span,
  Transition,
  Zone,
} from "./types";

function instantOf(epochMs: number): Instant {
  if (!Number.isFinite(epochMs)) {
    throw new ParseError("Instant requires a finite epoch millisecond.");
  }
  return { kind: "instant", epochMs };
}

function spanOf(ms: number): Span {
  return { kind: "span", ms };
}

function clockOf(civil: Civil, zone: Zone, offsetMs: number): Clock {
  return { kind: "clock", civil, zone, offsetMs };
}

function civilEquals(a: Civil, b: Civil): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute &&
    a.second === b.second &&
    a.milli === b.milli
  );
}

function addMillisToCivil(c: Civil, ms: number): Civil {
  return utcMsToCivil(civilToUtcMs(c) + ms);
}

function resolveClock(civil: Civil, zone: Zone, options: ResolveOptions = {}): Clock {
  assertCivil(civil);
  const ifSkipped = options.ifSkipped ?? "reject";
  const ifAmbiguous = options.ifAmbiguous ?? "reject";
  const asUtc = civilToUtcMs(civil);
  const candidates: Clock[] = [];
  for (const offsetMs of nearbyOffsets(zone, asUtc)) {
    const epochMs = asUtc - offsetMs;
    const instant = instantOf(epochMs);
    if (offsetAt(zone, instant) === offsetMs) {
      candidates.push(clockOf(civil, zone, offsetMs));
    }
  }
  candidates.sort((a, b) => a.offsetMs - b.offsetMs);
  const unique = new Map<number, Clock>();
  for (const c of candidates) unique.set(c.offsetMs, c);
  const found = [...unique.values()].sort(
    (a, b) => a.civil.hour - b.civil.hour || clockToEpoch(a) - clockToEpoch(b),
  );
  found.sort((a, b) => clockToEpoch(a) - clockToEpoch(b));

  if (found.length === 1) return found[0];

  if (found.length >= 2) {
    const earlier = found[0];
    const later = found[found.length - 1];
    if (ifAmbiguous === "earlier") return earlier;
    if (ifAmbiguous === "later") return later;
    throw new AmbiguousTimeError(
      civil,
      zone.id,
      instantOf(clockToEpoch(earlier)),
      instantOf(clockToEpoch(later)),
    );
  }

  const prev = previousTransition(zone, instantOf(asUtc + 48 * 3_600_000));
  const gap = prev
    ? prev.offsetAfterMs - prev.offsetBeforeMs
    : 3_600_000;
  if (ifSkipped === "later") {
    return resolveClock(addMillisToCivil(civil, Math.abs(gap)), zone, {
      ifSkipped: "reject",
      ifAmbiguous: "later",
    });
  }
  if (ifSkipped === "earlier") {
    return resolveClock(addMillisToCivil(civil, -Math.abs(gap)), zone, {
      ifSkipped: "reject",
      ifAmbiguous: "earlier",
    });
  }
  throw new SkippedTimeError(civil, zone.id);
}

function clockToEpoch(c: Clock): number {
  return civilToUtcMs(c.civil) - c.offsetMs;
}

export const Instant = {
  now(): Instant {
    return instantOf(Date.now());
  },
  fromEpochMs(ms: number): Instant {
    return instantOf(ms);
  },
  /**
   * Parse a point on the timeline. The string must include `Z` or a numeric
   * offset. Offset-less strings are Civil, not Instant — Instant.parse will
   * not guess.
   */
  parse(input: string): Instant {
    const p = parseIso(input);
    if (p.zoneId && p.offsetMs == null) {
      throw new ParseError(
        `"${input}" names a zone but not an offset. Use Clock.parse, or add Z / ±HH:mm.`,
      );
    }
    if (p.offsetMs == null) {
      throw new ParseError(
        `"${input}" has no offset. Instant.parse refuses to guess. Use Civil.parse for a wall time, or append Z.`,
      );
    }
    return instantOf(civilToUtcMs(p.civil) - p.offsetMs);
  },
  toEpochMs(i: Instant): number {
    return i.epochMs;
  },
  add(i: Instant, span: Span): Instant {
    return instantOf(i.epochMs + span.ms);
  },
  until(a: Instant, b: Instant): Span {
    return spanOf(b.epochMs - a.epochMs);
  },
  compare(a: Instant, b: Instant): -1 | 0 | 1 {
    return a.epochMs < b.epochMs ? -1 : a.epochMs > b.epochMs ? 1 : 0;
  },
  equals(a: Instant, b: Instant): boolean {
    return a.epochMs === b.epochMs;
  },
  toString(i: Instant): string {
    const c = utcMsToCivil(i.epochMs);
    return `${fmtCivil(c)}Z`;
  },
};

export const Civil = {
  of: civilOf,
  parse(input: string): Civil {
    const p = parseIso(input);
    if (p.offsetMs != null) {
      throw new ParseError(
        `"${input}" includes an offset. That is an Instant (or a Clock), not a Civil.`,
      );
    }
    if (p.zoneId) {
      throw new ParseError(
        `"${input}" includes a zone. Use Clock.parse.`,
      );
    }
    return p.civil;
  },
  add(c: Civil, cal: Calendar, overflow: "clamp" | "reject" = "clamp"): Civil {
    return addCalendar(c, cal, overflow);
  },
  with(
    c: Civil,
    parts: Partial<Omit<Civil, "kind">>,
    overflow: "clamp" | "reject" = "clamp",
  ): Civil {
    const next = { ...c, ...parts, kind: "civil" as const };
    if (overflow === "clamp" && next.month >= 1 && next.month <= 12) {
      const dim = daysInMonth(next.year, next.month);
      if (next.day > dim) next.day = dim;
    }
    assertCivil(next);
    return next;
  },
  untilDays(a: Civil, b: Civil): number {
    const aMid = Date.UTC(a.year, a.month - 1, a.day);
    const bMid = Date.UTC(b.year, b.month - 1, b.day);
    return Math.round((bMid - aMid) / 86_400_000);
  },
  dayOfWeek,
  equals: civilEquals,
  toString: fmtCivil,
};

export const Span = {
  of(parts: {
    hours?: number;
    minutes?: number;
    seconds?: number;
    millis?: number;
  }): Span {
    const ms =
      (parts.hours ?? 0) * 3_600_000 +
      (parts.minutes ?? 0) * 60_000 +
      (parts.seconds ?? 0) * 1000 +
      (parts.millis ?? 0);
    return spanOf(ms);
  },
  parse(input: string): Span {
    const m = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.(\d+))?S)?)?$/.exec(input);
    if (!m || input === "P" || input === "PT") {
      throw new ParseError(
        `Cannot parse span "${input}". Use ISO-8601 exact form, e.g. PT2H30M. Days belong on Calendar.`,
      );
    }
    return Span.of({
      hours: Number(m[1] ?? 0),
      minutes: Number(m[2] ?? 0),
      seconds: Number(m[3] ?? 0),
      millis: m[4] != null ? Number(m[4].padEnd(3, "0")) : 0,
    });
  },
  total(span: Span, unit: "hours" | "minutes" | "seconds" | "millis"): number {
    if (unit === "millis") return span.ms;
    if (unit === "seconds") return span.ms / 1000;
    if (unit === "minutes") return span.ms / 60_000;
    return span.ms / 3_600_000;
  },
  add(a: Span, b: Span): Span {
    return spanOf(a.ms + b.ms);
  },
  negate(span: Span): Span {
    return spanOf(-span.ms);
  },
  abs(span: Span): Span {
    return spanOf(Math.abs(span.ms));
  },
  toString(span: Span): string {
    if (span.ms === 0) return "PT0S";
    const sign = span.ms < 0 ? "-" : "";
    let rest = Math.abs(span.ms);
    const h = Math.floor(rest / 3_600_000);
    rest -= h * 3_600_000;
    const min = Math.floor(rest / 60_000);
    rest -= min * 60_000;
    const s = Math.floor(rest / 1000);
    const milli = rest - s * 1000;
    let out = `${sign}PT`;
    if (h) out += `${h}H`;
    if (min) out += `${min}M`;
    if (s || milli || out === `${sign}PT`) {
      out += milli ? `${s}.${pad(milli, 3)}S` : `${s}S`;
    }
    return out;
  },
};

export const Calendar = {
  of: calendarOf,
  toString(c: Calendar): string {
    if (!c.years && !c.months && !c.weeks && !c.days) return "P0D";
    let out = "P";
    if (c.years) out += `${c.years}Y`;
    if (c.months) out += `${c.months}M`;
    if (c.weeks) out += `${c.weeks}W`;
    if (c.days) out += `${c.days}D`;
    return out;
  },
};

export const Zone = {
  get: zoneGet,
  utc: zoneUtc,
  ids: zoneIds,
  offsetAt,
  abbreviationAt,
  nextTransition,
  previousTransition,
  toString(z: Zone): string {
    return z.id;
  },
};

export const Clock = {
  of(civil: Civil, zone: Zone, options?: ResolveOptions): Clock {
    return resolveClock(civil, zone, options);
  },
  at(instant: Instant, zone: Zone): Clock {
    const offsetMs = offsetAt(zone, instant);
    const civil = utcMsToCivil(instant.epochMs + offsetMs);
    return clockOf(civil, zone, offsetMs);
  },
  parse(input: string, options?: ResolveOptions): Clock {
    const p = parseIso(input);
    if (!p.zoneId) {
      throw new ParseError(
        `"${input}" has no zone in brackets. Clock.parse wants 2026-03-29T01:30[Europe/London].`,
      );
    }
    const zone = zoneGet(p.zoneId);
    if (p.offsetMs != null) {
      const instant = instantOf(civilToUtcMs(p.civil) - p.offsetMs);
      const clock = Clock.at(instant, zone);
      if (!civilEquals(clock.civil, p.civil)) {
        throw new ParseError(
          `"${input}" offset does not match ${zone.id} at that instant (wall time would be ${fmtCivil(clock.civil)}${fmtOffset(clock.offsetMs)}).`,
        );
      }
      return clock;
    }
    return resolveClock(p.civil, zone, options);
  },
  toInstant(clock: Clock): Instant {
    return instantOf(clockToEpoch(clock));
  },
  toCivil(clock: Clock): Civil {
    return clock.civil;
  },
  addSpan(clock: Clock, span: Span): Clock {
    return Clock.at(Instant.add(Clock.toInstant(clock), span), clock.zone);
  },
  addCalendar(clock: Clock, cal: Calendar, options?: ResolveOptions): Clock {
    const civil = Civil.add(clock.civil, cal);
    return resolveClock(civil, clock.zone, options);
  },
  withZone(clock: Clock, zone: Zone): Clock {
    return Clock.at(Clock.toInstant(clock), zone);
  },
  offset(clock: Clock): Span {
    return spanOf(clock.offsetMs);
  },
  abbreviation(clock: Clock): string {
    return abbreviationAt(clock.zone, Clock.toInstant(clock));
  },
  toString(clock: Clock): string {
    return `${fmtCivil(clock.civil)}${fmtOffset(clock.offsetMs)}[${clock.zone.id}]`;
  },
};

export function formatClockLong(clock: Clock): string {
  const abbr = Clock.abbreviation(clock);
  return `${Clock.toString(clock)} ${abbr}`;
}
