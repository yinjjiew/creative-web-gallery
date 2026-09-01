/** The desk is held on this Monday so the clocks are the same for everyone. */
export const TODAY = "2026-08-31";

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

const MONTHS_SHORT = [
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

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function utc(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const date = utc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekday(iso: string): string {
  return WEEKDAYS[utc(iso).getUTCDay()];
}

export function longDate(iso: string): string {
  const date = utc(iso);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function shortDate(iso: string): string {
  const date = utc(iso);
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function monthYear(iso: string): string {
  const date = utc(iso);
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function weeksOut(from: string, to: string = TODAY): string {
  const days = daysBetween(from, to);
  if (days < 0) return "not yet";
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  if (days < 14) return `${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 week" : `${weeks} weeks`;
}

export function untilPhrase(iso: string, today: string = TODAY): string {
  const days = daysBetween(today, iso);
  if (days < 0) {
    const ago = -days;
    if (ago === 0) return "today";
    if (ago === 1) return "yesterday";
    return `${ago} days ago`;
  }
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `${weekday(iso)} — in ${days} days`;
}
