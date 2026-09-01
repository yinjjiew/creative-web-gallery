/**
 * Formatting, kept in one place so a number is written the same way wherever it
 * appears. Everything is en-GB and 24-hour, because the tool is a British
 * secondary school department's and because "21:20 on Thursday" is the unit the
 * drift analysis is actually about.
 */

const DAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

export function fmtDay(ts: number): string {
  return DAY.format(new Date(ts));
}

export function fmtTime(ts: number): string {
  return TIME.format(new Date(ts));
}

export function fmtWeekday(ts: number): string {
  return WEEKDAY.format(new Date(ts));
}

export function fmtWhen(ts: number): string {
  return `${fmtDay(ts)}, ${fmtTime(ts)}`;
}

/** "3m 12s" — the unit she thinks in when the budget is four minutes. */
export function fmtDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

/** Longer horizons read better in hours: "4h 06m". */
export function fmtSpan(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function fmtSigned(value: number, digits = 1): string {
  const rounded = value.toFixed(digits);
  return value > 0 ? `+${rounded}` : rounded;
}

export function scriptNo(id: number): string {
  return String(id).padStart(3, "0");
}

export function daysBetween(from: number, to: number): number {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
