import { InvalidCivilError, type Calendar, type Civil } from "./types";

export const MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeap(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeap(year)) return 29;
  return MONTH_DAYS[month] ?? 0;
}

export function civilOk(c: Civil): boolean {
  if (c.month < 1 || c.month > 12) return false;
  if (c.day < 1 || c.day > daysInMonth(c.year, c.month)) return false;
  if (c.hour < 0 || c.hour > 23) return false;
  if (c.minute < 0 || c.minute > 59) return false;
  if (c.second < 0 || c.second > 59) return false;
  if (c.milli < 0 || c.milli > 999) return false;
  return Number.isInteger(c.year) && Number.isInteger(c.month) && Number.isInteger(c.day);
}

export function assertCivil(c: Civil): void {
  if (!civilOk(c)) {
    throw new InvalidCivilError(
      `Not a real civil time: ${c.year}-${c.month}-${c.day} ${c.hour}:${c.minute}:${c.second}.${c.milli}`,
    );
  }
}

export function civilOf(parts: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  milli?: number;
}): Civil {
  const c: Civil = {
    kind: "civil",
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
    milli: parts.milli ?? 0,
  };
  assertCivil(c);
  return c;
}

export function civilToUtcMs(c: Civil): number {
  return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, c.milli);
}

export function utcMsToCivil(ms: number): Civil {
  const d = new Date(ms);
  return {
    kind: "civil",
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    milli: d.getUTCMilliseconds(),
  };
}

export function calendarOf(parts: {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
}): Calendar {
  return {
    kind: "calendar",
    years: parts.years ?? 0,
    months: parts.months ?? 0,
    weeks: parts.weeks ?? 0,
    days: parts.days ?? 0,
  };
}

export function addCalendar(
  c: Civil,
  cal: Calendar,
  overflow: "clamp" | "reject" = "clamp",
): Civil {
  let year = c.year + cal.years;
  let month = c.month + cal.months;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  const dim = daysInMonth(year, month);
  let day = c.day;
  if (day > dim) {
    if (overflow === "reject") {
      throw new InvalidCivilError(
        `${c.year}-${c.month}-${c.day} plus ${cal.months} month(s) has no day ${day} in ${year}-${month}.`,
      );
    }
    day = dim;
  }
  const base = civilToUtcMs({ ...c, year, month, day });
  const shifted = base + (cal.weeks * 7 + cal.days) * 86_400_000;
  return utcMsToCivil(shifted);
}

/** Monday = 1 … Sunday = 7, ISO-8601. */
export function dayOfWeek(c: Civil): number {
  const utc = Date.UTC(c.year, c.month - 1, c.day);
  const sun0 = new Date(utc).getUTCDay();
  return sun0 === 0 ? 7 : sun0;
}
