import { expand } from "./expand";
import { latestDate, worstGrade } from "./facts";
import { WRITTEN } from "./places";
import type { Ask, AskId, Place, WaterKind } from "./types";

export const PLACES: Place[] = [...WRITTEN, ...expand()].sort((a, b) =>
  a.name.localeCompare(b.name, "en-GB"),
);

export const CATALOGUE_SIZE = 1900;

export const ASKS: Ask[] = [
  {
    id: "child",
    title: "With a child",
    lead: "A child in moving water is a different problem from an adult in moving water.",
    rule: "Shown only where hazard is assessed as caution — never unknown — water quality has been sampled, and the record itself says a child could be in their depth. An unassessed reach is not listed here. That is not the same as it being safe.",
  },
  {
    id: "mile",
    title: "To swim a mile",
    lead: "A mile needs room, a known current, and a way out that is not a guess.",
    rule: "Shown only where a length of about 1,600 m or more is recorded and the reach is not graded lethal. Reaches with no recorded length are listed separately as unmeasured — not as long swims.",
  },
  {
    id: "nocar",
    title: "Without a car",
    lead: "Most of this catalogue assumes a lane and a verge. Some of it does not.",
    rule: "Shown where the record says the place can be reached by train, bus, or a short walk from either. If access is not recorded, the place is not treated as car-free.",
  },
  {
    id: "october",
    title: "In October",
    lead: "October water in this climate is usually 8–13 °C in rivers and lakes.",
    rule: "Shown only where autumn temperature is recorded and is 14 °C or above, or the water is heated. Reaches with no autumn temperature sit below as unrecorded — not as warm.",
  },
];

export const WATER_KINDS: { id: WaterKind; title: string; note: string }[] = [
  { id: "river", title: "Rivers", note: "Current, weirs, rain." },
  { id: "lake", title: "Lakes", note: "Cold below, weather, shelves." },
  { id: "lido", title: "Lidos", note: "Enclosed. Still outdoor water." },
  { id: "tidal-pool", title: "Tidal pools", note: "Only a swim on some tides." },
  { id: "coast", title: "Coast", note: "Tide, rip, working harbours." },
];

export function bySlug(slug: string): Place | undefined {
  return PLACES.find((p) => p.slug === slug);
}

export function askById(id: string): Ask | undefined {
  return ASKS.find((a) => a.id === id);
}

export function counties(): { slug: string; name: string; nation: Place["nation"]; n: number }[] {
  const map = new Map<string, { name: string; nation: Place["nation"]; n: number }>();
  for (const p of PLACES) {
    const slug = countySlug(p.county);
    const cur = map.get(slug);
    if (cur) cur.n += 1;
    else map.set(slug, { name: p.county, nation: p.nation, n: 1 });
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
}

export function countySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function countyBySlug(slug: string) {
  return counties().find((c) => c.slug === slug);
}

export function placesInCounty(slug: string): Place[] {
  return PLACES.filter((p) => countySlug(p.county) === slug);
}

export function placesOfWater(kind: WaterKind): Place[] {
  return PLACES.filter((p) => p.water === kind);
}

export function watercourses(): { name: string; places: Place[] }[] {
  const map = new Map<string, Place[]>();
  for (const p of PLACES) {
    if (p.water !== "river" && p.water !== "lake") continue;
    const list = map.get(p.waterName) ?? [];
    list.push(p);
    map.set(p.waterName, list);
  }
  return [...map.entries()]
    .map(([name, places]) => ({
      name,
      places: places.slice().sort((a, b) => a.chainageKm - b.chainageKm),
    }))
    .filter((w) => w.places.length >= 2)
    .sort((a, b) => b.places.length - a.places.length);
}

export function matchesAsk(place: Place, id: AskId): boolean {
  if (id === "child") {
    return (
      place.childOk === true &&
      worstGrade(place.hazards) === "caution" &&
      place.quality.value !== null &&
      place.quality.source === "sample"
    );
  }
  if (id === "mile") {
    return (
      place.mileOk === true &&
      place.lengthM.value !== null &&
      place.lengthM.value >= 1600 &&
      worstGrade(place.hazards) !== "lethal"
    );
  }
  if (id === "nocar") return place.noCar === true;
  if (id === "october") {
    if (place.octoberOk !== true) return false;
    const autumn = place.temperature.autumn;
    if (autumn.value === null) return false;
    if (/heated/i.test(autumn.value)) return true;
    const n = Number.parseInt(autumn.value, 10);
    return !Number.isNaN(n) && n >= 14;
  }
  return false;
}

export function askUnmeasured(place: Place, id: AskId): boolean {
  if (id === "child") return place.childOk === null || worstGrade(place.hazards) === "unknown";
  if (id === "mile") return place.lengthM.value === null || place.mileOk === null;
  if (id === "nocar") return place.noCar === null;
  if (id === "october") return place.temperature.autumn.value === null;
  return false;
}

export function searchPlaces(q: string): Place[] {
  const t = q.trim().toLowerCase();
  if (!t) return PLACES;
  return PLACES.filter((p) => {
    const grade = worstGrade(p.hazards);
    const hay = [
      p.name,
      p.waterName,
      p.county,
      p.nation,
      p.water,
      p.summary,
      grade,
      p.legal.value ?? "",
      ...p.hazards.map((h) => h.title),
    ]
      .join(" ")
      .toLowerCase();
    return t.split(/\s+/).every((word) => hay.includes(word));
  });
}

export function sortForRegister(places: Place[]): Place[] {
  const order = { lethal: 0, serious: 1, unknown: 2, caution: 3 };
  return places.slice().sort((a, b) => {
    const ga = order[worstGrade(a.hazards)];
    const gb = order[worstGrade(b.hazards)];
    if (ga !== gb) return ga - gb;
    return a.name.localeCompare(b.name, "en-GB");
  });
}

export function featuredDanger(): Place[] {
  return PLACES.filter((p) => worstGrade(p.hazards) === "lethal");
}

export function lastSeen(place: Place): string | null {
  return latestDate(place);
}
