import type { Fact, SourceKind } from "./types";

export function none<T>(): Fact<T> {
  return { value: null, source: "none", date: null };
}

export function fact<T>(
  source: Exclude<SourceKind, "none">,
  value: T,
  date: string,
  detail?: string,
): Fact<T> {
  return { value, source, date, detail };
}

export const SOURCE_LABEL: Record<SourceKind, string> = {
  sample: "Sampled",
  warden: "Warden note",
  swimmer: "Swimmer note",
  none: "Not recorded",
};

export const LEGAL_LABEL: Record<
  "designated" | "legal" | "tolerated" | "unclear" | "forbidden",
  string
> = {
  designated: "Designated bathing water",
  legal: "Access lawful; not designated",
  tolerated: "Merely tolerated",
  unclear: "Legal status unclear",
  forbidden: "Swimming is not allowed",
};

export const WATER_LABEL: Record<
  "river" | "lake" | "lido" | "tidal-pool" | "coast",
  string
> = {
  river: "River",
  lake: "Lake",
  lido: "Lido",
  "tidal-pool": "Tidal pool",
  coast: "Coast",
};

export const GRADE_LABEL: Record<
  "lethal" | "serious" | "caution" | "unknown",
  string
> = {
  lethal: "Lethal",
  serious: "Serious",
  caution: "Caution",
  unknown: "Not assessed",
};

export const QUALITY_LABEL: Record<
  "excellent" | "good" | "sufficient" | "poor",
  string
> = {
  excellent: "Excellent",
  good: "Good",
  sufficient: "Sufficient",
  poor: "Poor",
};

/** A record older than this is stamped stale. Modelled edition date: 2026-09. */
export const EDITION = "2026-09-01";

export function monthsOld(iso: string | null, asOf = EDITION): number | null {
  if (!iso) return null;
  const a = new Date(iso);
  const b = new Date(asOf);
  if (Number.isNaN(a.getTime())) return null;
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

export function isStale(iso: string | null): boolean {
  const m = monthsOld(iso);
  return m !== null && m >= 24;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "no date";
  const [y, m, d] = iso.split("-");
  const months = [
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
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return iso;
  return d ? `${Number(d)} ${months[mi]} ${y}` : `${months[mi]} ${y}`;
}

export function latestDate(place: {
  access: Fact<unknown>;
  parking: Fact<unknown>;
  depth: Fact<unknown>;
  current: Fact<unknown>;
  quality: Fact<unknown>;
  legal: Fact<unknown>;
  temperature: {
    spring: Fact<unknown>;
    summer: Fact<unknown>;
    autumn: Fact<unknown>;
    winter: Fact<unknown>;
  };
  notes: { date: string }[];
}): string | null {
  const dates = [
    place.access.date,
    place.parking.date,
    place.depth.date,
    place.current.date,
    place.quality.date,
    place.legal.date,
    place.temperature.spring.date,
    place.temperature.summer.date,
    place.temperature.autumn.date,
    place.temperature.winter.date,
    ...place.notes.map((n) => n.date),
  ].filter((d): d is string => Boolean(d));
  if (!dates.length) return null;
  return dates.sort().at(-1) ?? null;
}

export function worstGrade(
  hazards: { grade: "lethal" | "serious" | "caution" | "unknown" }[],
): "lethal" | "serious" | "caution" | "unknown" {
  if (!hazards.length) return "unknown";
  if (hazards.some((h) => h.grade === "lethal")) return "lethal";
  if (hazards.some((h) => h.grade === "serious")) return "serious";
  if (hazards.some((h) => h.grade === "unknown")) return "unknown";
  if (hazards.every((h) => h.grade === "caution")) return "caution";
  return "unknown";
}

export function completeness(place: {
  access: Fact<unknown>;
  parking: Fact<unknown>;
  depth: Fact<unknown>;
  current: Fact<unknown>;
  quality: Fact<unknown>;
  legal: Fact<unknown>;
  lengthM: Fact<unknown>;
  temperature: {
    spring: Fact<unknown>;
    summer: Fact<unknown>;
    autumn: Fact<unknown>;
    winter: Fact<unknown>;
  };
}): { known: number; of: number } {
  const facts = [
    place.access,
    place.parking,
    place.depth,
    place.current,
    place.quality,
    place.legal,
    place.lengthM,
    place.temperature.spring,
    place.temperature.summer,
    place.temperature.autumn,
    place.temperature.winter,
  ];
  const known = facts.filter((f) => f.value !== null).length;
  return { known, of: facts.length };
}
