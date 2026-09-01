/** Calendar dates as YYYY-MM-DD, always UTC, so a sitting does not slip a day. */

export type DateStr = string;

export const EPOCH: DateStr = "2026-09-01";

export function parseUTC(date: DateStr): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function formatUTC(date: Date): DateStr {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: DateStr, days: number): DateStr {
  const next = parseUTC(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatUTC(next);
}

export function daysBetween(from: DateStr, to: DateStr): number {
  return Math.round((parseUTC(to).getTime() - parseUTC(from).getTime()) / 86_400_000);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
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

export function weekday(date: DateStr): string {
  return WEEKDAYS[parseUTC(date).getUTCDay()] ?? "";
}

export function longDate(date: DateStr): string {
  const d = parseUTC(date);
  return `${weekday(date)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function shortDate(date: DateStr): string {
  const d = parseUTC(date);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]?.slice(0, 3)}`;
}

export function overduePhrase(days: number): string {
  if (days <= 0) return "due today";
  if (days === 1) return "1 day overdue";
  return `${days} days overdue`;
}

export function untilPhrase(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
