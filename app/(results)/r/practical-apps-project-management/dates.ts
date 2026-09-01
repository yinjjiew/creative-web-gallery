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

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Whole UTC days. Avoids local-TZ drift between server render and client. */
export function dayNum(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function dayIso(n: number): string {
  const dt = new Date(n * 86_400_000);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parts(n: number) {
  const dt = new Date(n * 86_400_000);
  return {
    weekday: WEEKDAYS[dt.getUTCDay()],
    weekdayShort: WEEKDAYS_SHORT[dt.getUTCDay()],
    month: MONTHS[dt.getUTCMonth()],
    monthShort: MONTHS_SHORT[dt.getUTCMonth()],
    date: dt.getUTCDate(),
    year: dt.getUTCFullYear(),
    dow: dt.getUTCDay(),
  };
}

export function longDate(n: number): string {
  const p = parts(n);
  return `${p.weekday} ${p.date} ${p.month}`;
}

export function shortDate(n: number): string {
  const p = parts(n);
  return `${p.weekdayShort} ${p.date} ${p.monthShort}`;
}

export function compactDate(n: number): string {
  const p = parts(n);
  return `${p.date} ${p.monthShort}`;
}

export function daysWord(n: number): string {
  const abs = Math.abs(n);
  if (abs === 0) return "today";
  if (abs === 1) return n < 0 ? "yesterday" : "tomorrow";
  return `${String(abs)} days`;
}

export function airWord(slack: number): string {
  if (slack < 0) return `${String(Math.abs(slack))}d late`;
  if (slack === 0) return "no air";
  if (slack === 1) return "1 day of air";
  return `${String(slack)} days of air`;
}
