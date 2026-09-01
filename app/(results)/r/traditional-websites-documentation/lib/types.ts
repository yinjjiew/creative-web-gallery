export type Instant = {
  readonly kind: "instant";
  readonly epochMs: number;
};

export type Civil = {
  readonly kind: "civil";
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly milli: number;
};

export type Span = {
  readonly kind: "span";
  readonly ms: number;
};

export type Calendar = {
  readonly kind: "calendar";
  readonly years: number;
  readonly months: number;
  readonly weeks: number;
  readonly days: number;
};

export type Zone = {
  readonly kind: "zone";
  readonly id: string;
};

export type Clock = {
  readonly kind: "clock";
  readonly civil: Civil;
  readonly zone: Zone;
  readonly offsetMs: number;
};

export type Transition = {
  readonly at: Instant;
  readonly offsetBeforeMs: number;
  readonly offsetAfterMs: number;
  readonly abbreviationBefore: string;
  readonly abbreviationAfter: string;
};

export type ResolveOptions = {
  ifSkipped?: "reject" | "earlier" | "later";
  ifAmbiguous?: "reject" | "earlier" | "later";
};

export class InstantError extends Error {
  override name = "InstantError";
}

export class ParseError extends InstantError {
  override name = "ParseError";
}

export class InvalidCivilError extends InstantError {
  override name = "InvalidCivilError";
}

export class UnknownZoneError extends InstantError {
  override name = "UnknownZoneError";
}

export class SkippedTimeError extends InstantError {
  override name = "SkippedTimeError";
  constructor(
    public readonly civil: Civil,
    public readonly zoneId: string,
    message?: string,
  ) {
    super(
      message ??
        `${fmtCivil(civil)} never occurs in ${zoneId}. The clocks skip this local time.`,
    );
  }
}

export class AmbiguousTimeError extends InstantError {
  override name = "AmbiguousTimeError";
  constructor(
    public readonly civil: Civil,
    public readonly zoneId: string,
    public readonly earlier: Instant,
    public readonly later: Instant,
    message?: string,
  ) {
    super(
      message ??
        `${fmtCivil(civil)} occurs twice in ${zoneId}. Pass ifAmbiguous: "earlier" or "later".`,
    );
  }
}

export function fmtCivil(c: Civil): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  const frac = c.milli ? `.${p(c.milli, 3)}` : "";
  return `${c.year}-${p(c.month)}-${p(c.day)}T${p(c.hour)}:${p(c.minute)}:${p(c.second)}${frac}`;
}

export function fmtOffset(ms: number): string {
  if (ms === 0) return "Z";
  const sign = ms < 0 ? "-" : "+";
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}
