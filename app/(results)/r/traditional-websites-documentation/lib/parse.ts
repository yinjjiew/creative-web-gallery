import { civilOf } from "./calendar";
import { ParseError, type Civil } from "./types";

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(Z|[+-]\d{2}:?\d{2})?(?:\[([A-Za-z_/+]+)\])?$/;

export type Parsed = {
  civil: Civil;
  offsetMs: number | null;
  zoneId: string | null;
  hasTime: boolean;
};

export function parseIso(input: string): Parsed {
  const m = ISO.exec(input.trim());
  if (!m) {
    throw new ParseError(
      `Cannot parse "${input}". Expected ISO-8601, e.g. 2026-03-29T01:30:00Z or 2026-03-29T01:30[Europe/London].`,
    );
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hasTime = m[4] != null;
  const hour = m[4] != null ? Number(m[4]) : 0;
  const minute = m[5] != null ? Number(m[5]) : 0;
  const second = m[6] != null ? Number(m[6]) : 0;
  const milli = m[7] != null ? Number(m[7].padEnd(3, "0")) : 0;
  const civil = civilOf({ year, month, day, hour, minute, second, milli });
  const offsetMs = m[8] != null ? readOffset(m[8]) : null;
  const zoneId = m[9] ?? null;
  return { civil, offsetMs, zoneId, hasTime };
}

function readOffset(raw: string): number {
  if (raw === "Z") return 0;
  const sign = raw[0] === "-" ? -1 : 1;
  const digits = raw.slice(1).replace(":", "");
  const h = Number(digits.slice(0, 2));
  const min = Number(digits.slice(2, 4) || "0");
  return sign * (h * 3_600_000 + min * 60_000);
}

export function parseOffset(raw: string): number {
  if (raw === "Z" || raw === "+00:00" || raw === "-00:00") return 0;
  if (!/^[+-]\d{2}:?\d{2}$/.test(raw)) {
    throw new ParseError(`Not an offset: "${raw}".`);
  }
  return readOffset(raw);
}
