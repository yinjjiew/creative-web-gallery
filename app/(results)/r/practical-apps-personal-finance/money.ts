/**
 * Integer money and integer dates.
 *
 * Every amount in Runway is an integer number of pence and every date is an
 * integer number of days since 1970-01-01 UTC. Nothing is ever a float, so
 * nothing can drift: sweeping a control out and back returns the identical
 * integers, and a projection recomputed from the same inputs is bit-identical.
 *
 * Formatting is hand-rolled rather than delegated to Intl, because Intl output
 * can differ between the Node that renders the HTML and the browser that
 * hydrates it, which would show up as a hydration mismatch on a money column.
 */

/** An amount in pence. Always an integer. Negative means money leaving. */
export type Pence = number;

/** Days since 1970-01-01, UTC. Always an integer. */
export type Day = number;

const MS_PER_DAY = 86_400_000;

/**
 * Parses a money literal written the way it appears on an invoice.
 *
 * Authoring the scenario as `gbp("412.60")` rather than `412.6 * 100` keeps the
 * source readable and removes the one place a float could sneak in: the
 * multiplication happens on integers extracted from the string.
 */
export function gbp(text: string): Pence {
  const cleaned = text.replace(/,/g, "").trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) throw new Error(`not a money literal: ${text}`);
  const minor = (match[3] ?? "").padEnd(2, "0");
  const value = Number(match[2]) * 100 + Number(minor);
  return match[1] === "-" ? -value : value;
}

/**
 * Applies a rate expressed in basis points. Integer in, integer out.
 *
 * Kept as the single multiplication site in the whole program so that the
 * rounding rule — half away from zero, to the penny, once, never on an
 * intermediate — is stated exactly once.
 */
export function applyBps(amount: Pence, bps: number): Pence {
  const product = amount * bps;
  return product < 0 ? -Math.round(-product / 10_000) : Math.round(product / 10_000);
}

function group(digits: string): string {
  let out = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ",";
    out += digits[i];
  }
  return out;
}

/** `12,240.00`. No currency symbol: the symbol is set separately so columns align. */
export function money(value: Pence): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const major = group(String(Math.trunc(abs / 100)));
  const minor = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${major}.${minor}`;
}

/** `£12,240.00`, for prose where alignment is not at stake. */
export function poundsAndPence(value: Pence): string {
  return value < 0 ? `-£${money(-value)}` : `£${money(value)}`;
}

/** `£12,240` — whole pounds, for axis labels and headlines that do not need pence. */
export function whole(value: Pence): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  return `${negative ? "-" : ""}£${group(String(Math.round(abs / 100)))}`;
}

/** `26.0%` from basis points. */
export function percent(bps: number, decimals = 1): string {
  const scale = 10 ** decimals;
  const scaled = Math.round((bps / 100) * scale);
  const major = Math.trunc(scaled / scale);
  const minor = String(Math.abs(scaled % scale)).padStart(decimals, "0");
  return decimals === 0 ? `${major}%` : `${major}.${minor}%`;
}

/** Effective rate of `part` on `whole`, in basis points, rounded to the nearest point. */
export function rateBps(part: Pence, base: Pence): number {
  if (base === 0) return 0;
  return Math.round((part * 10_000) / base);
}

export function day(iso: string): Day {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`not an ISO date: ${iso}`);
  const stamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return stamp / MS_PER_DAY;
}

export function addDays(from: Day, count: number): Day {
  return from + count;
}

type DateParts = { year: number; month: number; date: number; weekday: number };

export function partsOf(value: Day): DateParts {
  const dt = new Date(value * MS_PER_DAY);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    date: dt.getUTCDate(),
    weekday: dt.getUTCDay(),
  };
}

export function isoOf(value: Day): string {
  const { year, month, date } = partsOf(value);
  return `${String(year)}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `1 Mar 2026` */
export function fullDate(value: Day): string {
  const { year, month, date } = partsOf(value);
  return `${String(date)} ${MONTH_SHORT[month - 1]} ${String(year)}`;
}

/** `1 Mar` */
export function shortDate(value: Day): string {
  const { month, date } = partsOf(value);
  return `${String(date)} ${MONTH_SHORT[month - 1]}`;
}

/** `Sunday 1 March 2026` */
export function longDate(value: Day): string {
  const { year, month, date, weekday } = partsOf(value);
  return `${WEEKDAY_SHORT[weekday]} ${String(date)} ${MONTH_LONG[month - 1]} ${String(year)}`;
}

/** `March 2026` */
export function monthName(value: Day): string {
  const { year, month } = partsOf(value);
  return `${MONTH_LONG[month - 1]} ${String(year)}`;
}

export function monthShort(value: Day): string {
  return MONTH_SHORT[partsOf(value).month - 1];
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Every occurrence of a day-of-month between two days inclusive, clamped to the
 * length of each month so a 31st does not vanish in February.
 */
export function monthlyOccurrences(from: Day, to: Day, dayOfMonth: number): Day[] {
  const out: Day[] = [];
  const start = partsOf(from);
  let year = start.year;
  let month = start.month;
  for (let guard = 0; guard < 600; guard += 1) {
    const clamped = Math.min(dayOfMonth, daysInMonth(year, month));
    const candidate = day(
      `${String(year)}-${String(month).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`
    );
    if (candidate > to) break;
    if (candidate >= from) out.push(candidate);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

/** The 1st of every month in range, for gridlines. */
export function monthStarts(from: Day, to: Day): Day[] {
  const start = partsOf(from);
  let year = start.year;
  let month = start.month;
  const out: Day[] = [];
  for (let guard = 0; guard < 600; guard += 1) {
    const candidate = day(
      `${String(year)}-${String(month).padStart(2, "0")}-01`
    );
    if (candidate > to) break;
    if (candidate >= from) out.push(candidate);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

/** `7 days`, `1 day`, `today`. */
export function gapWords(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  if (days < 0) return `${String(-days)} days ago`;
  return `${String(days)} days`;
}

/** Median of a list of integers. Even counts take the lower of the two middles
 * so the answer stays an integer and stays an amount that actually occurred
 * nearby, rather than a half-day that never happened. */
export function medianInt(values: number[]): number {
  if (!values.length) throw new Error("median of nothing");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
}
