import { fact, none } from "./facts";
import type {
  Fact,
  Hazard,
  HazardGrade,
  Legal,
  Nation,
  Place,
  QualityRating,
  SourceKind,
  WaterKind,
} from "./types";

type Seed = {
  slug: string;
  name: string;
  water: WaterKind;
  waterName: string;
  county: string;
  nation: Nation;
  sheet: string;
  chainageKm: number;
  grade: HazardGrade;
  richness: "medium" | "thin";
};

/**
 * Deterministic extra records so the register can be browsed and searched
 * without inventing a cheerful identical card for each one. Thin records
 * stay thin on purpose.
 */
const SEEDS: Seed[] = [
  { slug: "taw-bend", name: "Taw Bend", water: "river", waterName: "River Taw", county: "Devon", nation: "England", sheet: "RCH 14 / 19", chainageKm: 19.2, grade: "caution", richness: "medium" },
  { slug: "teign-steps", name: "Teign Steps", water: "river", waterName: "River Teign", county: "Devon", nation: "England", sheet: "RCH 14 / 22", chainageKm: 7.4, grade: "serious", richness: "medium" },
  { slug: "exe-meadow", name: "Exe Meadow", water: "river", waterName: "River Exe", county: "Devon", nation: "England", sheet: "RCH 14 / 25", chainageKm: 28.0, grade: "caution", richness: "medium" },
  { slug: "dart-pool-upper", name: "Upper Dart Pool", water: "river", waterName: "River Dart", county: "Devon", nation: "England", sheet: "RCH 14 / 28", chainageKm: 5.1, grade: "serious", richness: "medium" },
  { slug: "noss-tidal", name: "Noss Tidal", water: "tidal-pool", waterName: "Noss Basin", county: "Devon", nation: "England", sheet: "RCH 14 / 33", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "camel-ford-east", name: "East Camel Ford", water: "river", waterName: "River Camel", county: "Cornwall", nation: "England", sheet: "RCH 31 / 34", chainageKm: 14.0, grade: "unknown", richness: "thin" },
  { slug: "fowey-town-steps", name: "Fowey Town Steps", water: "coast", waterName: "Fowey harbour", county: "Cornwall", nation: "England", sheet: "RCH 31 / 36", chainageKm: 0.2, grade: "serious", richness: "medium" },
  { slug: "helwyn-upper", name: "Upper Helwyn", water: "river", waterName: "Helwyn River", county: "Cornwall", nation: "England", sheet: "RCH 31 / 38", chainageKm: 6.6, grade: "caution", richness: "medium" },
  { slug: "st-agnes-cove", name: "St Agnes Cove", water: "coast", waterName: "Atlantic", county: "Cornwall", nation: "England", sheet: "RCH 31 / 03", chainageKm: 0, grade: "serious", richness: "medium" },
  { slug: "lynher-meadow", name: "Lynher Meadow", water: "river", waterName: "River Lynher", county: "Devon", nation: "England", sheet: "RCH 14 / 09", chainageKm: 14.8, grade: "caution", richness: "medium" },
  { slug: "lynher-source-pool", name: "Lynher Source Pool", water: "river", waterName: "River Lynher", county: "Devon", nation: "England", sheet: "RCH 14 / 07", chainageKm: 2.0, grade: "unknown", richness: "thin" },
  { slug: "rigg-head", name: "Rigg Head", water: "lake", waterName: "Rigg Water", county: "Cumbria", nation: "England", sheet: "RCH 22 / 06", chainageKm: 5.9, grade: "caution", richness: "medium" },
  { slug: "rigg-west-inflow", name: "Rigg West Inflow", water: "lake", waterName: "Rigg Water", county: "Cumbria", nation: "England", sheet: "RCH 22 / 03", chainageKm: 0.4, grade: "serious", richness: "medium" },
  { slug: "derwent-haugh", name: "Derwent Haugh", water: "river", waterName: "River Derwent", county: "Cumbria", nation: "England", sheet: "RCH 22 / 11", chainageKm: 11.0, grade: "caution", richness: "medium" },
  { slug: "wast-shore", name: "Wast Shore", water: "lake", waterName: "Wast Water (modelled shore)", county: "Cumbria", nation: "England", sheet: "RCH 22 / 18", chainageKm: 1.2, grade: "caution", richness: "medium" },
  { slug: "eden-bend", name: "Eden Bend", water: "river", waterName: "River Eden", county: "Cumbria", nation: "England", sheet: "RCH 22 / 21", chainageKm: 40.2, grade: "serious", richness: "medium" },
  { slug: "greta-upper", name: "Upper Greta", water: "river", waterName: "River Greta", county: "County Durham", nation: "England", sheet: "RCH 09 / 11", chainageKm: 4.4, grade: "unknown", richness: "thin" },
  { slug: "greta-bridge-town", name: "Greta Bridge Town", water: "river", waterName: "River Greta", county: "County Durham", nation: "England", sheet: "RCH 09 / 15", chainageKm: 17.1, grade: "caution", richness: "medium" },
  { slug: "teese-barrage", name: "Teese Barrage Pool", water: "river", waterName: "River Teese", county: "County Durham", nation: "England", sheet: "RCH 09 / 24", chainageKm: 52.0, grade: "lethal", richness: "medium" },
  { slug: "usk-bridge-pool", name: "Usk Bridge Pool", water: "river", waterName: "River Usk", county: "Powys", nation: "Wales", sheet: "RCH 27 / 15", chainageKm: 33.5, grade: "caution", richness: "medium" },
  { slug: "usk-weir-lower", name: "Lower Usk Weir", water: "river", waterName: "River Usk", county: "Powys", nation: "Wales", sheet: "RCH 27 / 16", chainageKm: 36.8, grade: "lethal", richness: "medium" },
  { slug: "teifi-gorge", name: "Teifi Gorge", water: "river", waterName: "River Teifi", county: "Ceredigion", nation: "Wales", sheet: "RCH 28 / 12", chainageKm: 22.0, grade: "serious", richness: "medium" },
  { slug: "teifi-meadow", name: "Teifi Meadow", water: "river", waterName: "River Teifi", county: "Ceredigion", nation: "Wales", sheet: "RCH 28 / 14", chainageKm: 29.4, grade: "caution", richness: "medium" },
  { slug: "borth-beach-flag", name: "Borth Beach (flagged)", water: "coast", waterName: "Cardigan Bay", county: "Ceredigion", nation: "Wales", sheet: "RCH 28 / 07", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "cerrig-dam", name: "Cerrig Dam Wall", water: "lake", waterName: "Llyn Cerrig", county: "Gwynedd", nation: "Wales", sheet: "RCH 26 / 16", chainageKm: 1.9, grade: "serious", richness: "medium" },
  { slug: "cob-outer", name: "Cob Outer", water: "coast", waterName: "The Cob", county: "Gwynedd", nation: "Wales", sheet: "RCH 26 / 09", chainageKm: 0.3, grade: "serious", richness: "medium" },
  { slug: "pembroke-mill", name: "Pembroke Mill", water: "river", waterName: "Pembroke River", county: "Pembrokeshire", nation: "Wales", sheet: "RCH 40 / 04", chainageKm: 3.2, grade: "lethal", richness: "medium" },
  { slug: "blackrock-bay", name: "Blackrock Bay", water: "coast", waterName: "Irish Sea", county: "Pembrokeshire", nation: "Wales", sheet: "RCH 40 / 12", chainageKm: 0.4, grade: "caution", richness: "medium" },
  { slug: "nith-haugh", name: "Nith Haugh", water: "river", waterName: "River Nith", county: "Dumfries and Galloway", nation: "Scotland", sheet: "RCH 48 / 06", chainageKm: 18.0, grade: "caution", richness: "medium" },
  { slug: "nith-weir", name: "Nith Town Weir", water: "river", waterName: "River Nith", county: "Dumfries and Galloway", nation: "Scotland", sheet: "RCH 48 / 08", chainageKm: 24.5, grade: "lethal", richness: "medium" },
  { slug: "kelvin-upper", name: "Upper Kelvin", water: "river", waterName: "River Kelvin", county: "Glasgow", nation: "Scotland", sheet: "RCH 02 / 02", chainageKm: 2.1, grade: "unknown", richness: "thin" },
  { slug: "clyde-steps", name: "Clyde Steps", water: "river", waterName: "River Clyde", county: "Glasgow", nation: "Scotland", sheet: "RCH 02 / 08", chainageKm: 12.0, grade: "serious", richness: "medium" },
  { slug: "fife-tidal", name: "Pitten Tidal", water: "tidal-pool", waterName: "Pitten Tidal", county: "Fife", nation: "Scotland", sheet: "RCH 05 / 09", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "tay-sand", name: "Tay Sand", water: "coast", waterName: "Firth of Tay", county: "Fife", nation: "Scotland", sheet: "RCH 05 / 14", chainageKm: 0, grade: "serious", richness: "medium" },
  { slug: "whiteadder-upper", name: "Upper Whiteadder", water: "river", waterName: "Whiteadder Water", county: "Scottish Borders", nation: "Scotland", sheet: "RCH 06 / 08", chainageKm: 6.0, grade: "unknown", richness: "thin" },
  { slug: "tweed-loop", name: "Tweed Loop", water: "river", waterName: "River Tweed", county: "Scottish Borders", nation: "Scotland", sheet: "RCH 06 / 18", chainageKm: 48.0, grade: "caution", richness: "medium" },
  { slug: "argyll-lido", name: "Portnahaven Village Tank", water: "lido", waterName: "Portnahaven Village Tank", county: "Argyll", nation: "Scotland", sheet: "RCH 44 / 03", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "donegal-strand", name: "Easter Strand", water: "coast", waterName: "Atlantic", county: "Donegal", nation: "Ireland", sheet: "RCH 51 / 04", chainageKm: 0, grade: "unknown", richness: "thin" },
  { slug: "shannon-cut", name: "Shannon Cut", water: "river", waterName: "Shannon navigation", county: "Offaly", nation: "Ireland", sheet: "RCH 52 / 11", chainageKm: 9.0, grade: "caution", richness: "medium" },
  { slug: "corrib-steps", name: "Corrib Steps", water: "river", waterName: "River Corrib", county: "Galway", nation: "Ireland", sheet: "RCH 53 / 02", chainageKm: 1.1, grade: "serious", richness: "medium" },
  { slug: "connemara-lough", name: "Lough Letter", water: "lake", waterName: "Lough Letter", county: "Galway", nation: "Ireland", sheet: "RCH 53 / 08", chainageKm: 0, grade: "unknown", richness: "thin" },
  { slug: "mourne-lough", name: "Silent Lough", water: "lake", waterName: "Silent Lough", county: "County Down", nation: "Northern Ireland", sheet: "RCH 55 / 06", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "bann-weir", name: "Bann Weir", water: "river", waterName: "River Bann", county: "County Antrim", nation: "Northern Ireland", sheet: "RCH 55 / 14", chainageKm: 20.0, grade: "lethal", richness: "medium" },
  { slug: "norfolk-lido", name: "Fen Lido", water: "lido", waterName: "Fen Lido", county: "Norfolk", nation: "England", sheet: "RCH 03 / 04", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "old-fen-pump", name: "Old Fen Pump", water: "river", waterName: "Old Fen Drain", county: "Norfolk", nation: "England", sheet: "RCH 03 / 22", chainageKm: 8.8, grade: "unknown", richness: "thin" },
  { slug: "ouse-cut", name: "Great Ouse Cut", water: "river", waterName: "Great Ouse", county: "Norfolk", nation: "England", sheet: "RCH 03 / 30", chainageKm: 12.0, grade: "caution", richness: "medium" },
  { slug: "suffolk-lido", name: "Alde Tank", water: "lido", waterName: "Alde Tank", county: "Suffolk", nation: "England", sheet: "RCH 04 / 08", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "ore-saltings", name: "Ore Saltings", water: "coast", waterName: "River Ore", county: "Suffolk", nation: "England", sheet: "RCH 04 / 12", chainageKm: 3.0, grade: "serious", richness: "medium" },
  { slug: "stour-meadow", name: "Stour Meadow", water: "river", waterName: "River Stour", county: "Suffolk", nation: "England", sheet: "RCH 04 / 20", chainageKm: 16.5, grade: "caution", richness: "medium" },
  { slug: "frome-upper", name: "Upper Frome", water: "river", waterName: "River Frome", county: "Dorset", nation: "England", sheet: "RCH 16 / 02", chainageKm: 3.3, grade: "unknown", richness: "thin" },
  { slug: "frome-town", name: "Frome Town Bend", water: "river", waterName: "River Frome", county: "Dorset", nation: "England", sheet: "RCH 16 / 06", chainageKm: 10.1, grade: "caution", richness: "medium" },
  { slug: "purbeck-trough", name: "Purbeck Trough", water: "tidal-pool", waterName: "Purbeck Trough", county: "Dorset", nation: "England", sheet: "RCH 16 / 18", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "kepp-lock", name: "Kepp Lock Pound", water: "river", waterName: "Kepp Canal", county: "Oxfordshire", nation: "England", sheet: "RCH 12 / 03", chainageKm: 6.2, grade: "caution", richness: "medium" },
  { slug: "kepp-wharf", name: "Kepp Wharf", water: "river", waterName: "Kepp Canal", county: "Oxfordshire", nation: "England", sheet: "RCH 12 / 01", chainageKm: 1.1, grade: "caution", richness: "medium" },
  { slug: "thames-backwater", name: "Thames Backwater", water: "river", waterName: "Thames (backwater)", county: "Oxfordshire", nation: "England", sheet: "RCH 12 / 10", chainageKm: 0.8, grade: "serious", richness: "medium" },
  { slug: "dove-upper", name: "Upper Dove", water: "river", waterName: "River Dove", county: "Derbyshire", nation: "England", sheet: "RCH 18 / 03", chainageKm: 8.0, grade: "unknown", richness: "thin" },
  { slug: "dove-holme-bridge", name: "Holme Bridge", water: "river", waterName: "River Dove", county: "Derbyshire", nation: "England", sheet: "RCH 18 / 08", chainageKm: 22.8, grade: "caution", richness: "medium" },
  { slug: "wye-dale", name: "Wye Dale Pool", water: "river", waterName: "River Wye", county: "Derbyshire", nation: "England", sheet: "RCH 18 / 20", chainageKm: 9.4, grade: "serious", richness: "medium" },
  { slug: "mortham-village", name: "Mortham Village Pond", water: "lake", waterName: "Mortham Pond", county: "North Yorkshire", nation: "England", sheet: "RCH 08 / 18", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "swale-loop", name: "Swale Loop", water: "river", waterName: "River Swale", county: "North Yorkshire", nation: "England", sheet: "RCH 08 / 24", chainageKm: 27.0, grade: "serious", richness: "medium" },
  { slug: "humber-south", name: "Humber South Foreshore", water: "coast", waterName: "Humber", county: "East Riding of Yorkshire", nation: "England", sheet: "RCH 07 / 29", chainageKm: 0, grade: "unknown", richness: "thin" },
  { slug: "humber-lido", name: "Hedon Tank", water: "lido", waterName: "Hedon Tank", county: "East Riding of Yorkshire", nation: "England", sheet: "RCH 07 / 10", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "new-forest-pond", name: "Oakley Pond", water: "lake", waterName: "Oakley Pond", county: "Hampshire", nation: "England", sheet: "RCH 15 / 08", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "ittest-river", name: "Ittest Meadow", water: "river", waterName: "River Ittest", county: "Hampshire", nation: "England", sheet: "RCH 15 / 12", chainageKm: 7.7, grade: "caution", richness: "medium" },
  { slug: "sussex-tidal", name: "Haven Tidal", water: "tidal-pool", waterName: "Haven Tidal", county: "East Sussex", nation: "England", sheet: "RCH 17 / 06", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "ouse-sussex", name: "Sussex Ouse Bend", water: "river", waterName: "River Ouse", county: "East Sussex", nation: "England", sheet: "RCH 17 / 11", chainageKm: 14.0, grade: "serious", richness: "medium" },
  { slug: "kent-lido", name: "Reculver Tank", water: "lido", waterName: "Reculver Tank", county: "Kent", nation: "England", sheet: "RCH 19 / 04", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "medway-steps", name: "Medway Steps", water: "river", waterName: "River Medway", county: "Kent", nation: "England", sheet: "RCH 19 / 12", chainageKm: 18.0, grade: "serious", richness: "medium" },
  { slug: "northumberland-lough", name: "Hare Lough", water: "lake", waterName: "Hare Lough", county: "Northumberland", nation: "England", sheet: "RCH 01 / 09", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "coquet-bend", name: "Coquet Bend", water: "river", waterName: "River Coquet", county: "Northumberland", nation: "England", sheet: "RCH 01 / 14", chainageKm: 21.0, grade: "caution", richness: "medium" },
  { slug: "coquet-weir", name: "Coquet Mill Weir", water: "river", waterName: "River Coquet", county: "Northumberland", nation: "England", sheet: "RCH 01 / 16", chainageKm: 24.4, grade: "lethal", richness: "medium" },
  { slug: "lancashire-lido", name: "More Tank", water: "lido", waterName: "More Tank", county: "Lancashire", nation: "England", sheet: "RCH 21 / 03", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "ribble-meadow", name: "Ribble Meadow", water: "river", waterName: "River Ribble", county: "Lancashire", nation: "England", sheet: "RCH 21 / 11", chainageKm: 30.0, grade: "caution", richness: "medium" },
  { slug: "wyre-estuary", name: "Wyre Estuary", water: "coast", waterName: "River Wyre", county: "Lancashire", nation: "England", sheet: "RCH 21 / 18", chainageKm: 0, grade: "serious", richness: "medium" },
  { slug: "somerset-drain", name: "King’s Drain", water: "river", waterName: "King’s Drain", county: "Somerset", nation: "England", sheet: "RCH 13 / 07", chainageKm: 5.5, grade: "unknown", richness: "thin" },
  { slug: "parrett-bend", name: "Parrett Bend", water: "river", waterName: "River Parrett", county: "Somerset", nation: "England", sheet: "RCH 13 / 12", chainageKm: 16.0, grade: "serious", richness: "medium" },
  { slug: "wiltshire-avon", name: "Avon Meadow", water: "river", waterName: "Hampshire Avon", county: "Wiltshire", nation: "England", sheet: "RCH 15 / 20", chainageKm: 12.2, grade: "caution", richness: "medium" },
  { slug: "pewsy-lido", name: "Pewsy Tank", water: "lido", waterName: "Pewsy Tank", county: "Wiltshire", nation: "England", sheet: "RCH 15 / 22", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "wye-hay", name: "Hay Loop", water: "river", waterName: "River Wye", county: "Powys", nation: "Wales", sheet: "RCH 27 / 30", chainageKm: 55.0, grade: "caution", richness: "medium" },
  { slug: "nant-ybai-upper", name: "Upper Nant-y-Bai", water: "river", waterName: "Nant-y-Bai", county: "Powys", nation: "Wales", sheet: "RCH 27 / 23", chainageKm: 1.8, grade: "unknown", richness: "thin" },
  { slug: "anglesey-trough", name: "Cemaes Trough", water: "tidal-pool", waterName: "Cemaes Trough", county: "Anglesey", nation: "Wales", sheet: "RCH 26 / 28", chainageKm: 0, grade: "caution", richness: "medium" },
  { slug: "menai-steps", name: "Menai Steps", water: "coast", waterName: "Menai Strait", county: "Anglesey", nation: "Wales", sheet: "RCH 26 / 30", chainageKm: 0, grade: "serious", richness: "medium" },
  { slug: "staffs-canal", name: "Trent Cut", water: "river", waterName: "Trent and Mersey", county: "Staffordshire", nation: "England", sheet: "RCH 18 / 28", chainageKm: 4.4, grade: "caution", richness: "medium" },
  { slug: "chard-lido", name: "Chard Tank", water: "lido", waterName: "Chard Tank", county: "Somerset", nation: "England", sheet: "RCH 13 / 18", chainageKm: 0, grade: "caution", richness: "medium" },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(xs: readonly T[], n: number): T {
  return xs[n % xs.length]!;
}

function dateFrom(n: number, stale: boolean): string {
  if (stale) {
    const y = pick([2018, 2019, 2020, 2021], n);
    const m = String((n % 12) + 1).padStart(2, "0");
    const d = String((n % 27) + 1).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const y = pick([2024, 2025, 2026], n);
  const m = String((n % 8) + 1).padStart(2, "0");
  const d = String((n % 27) + 1).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hazardsFor(seed: Seed): Hazard[] {
  if (seed.grade === "lethal") {
    return [
      {
        grade: "lethal",
        title: "Weir or barrage hold",
        body: `A circulating current is recorded at ${seed.name}. From the bank it can look like slack water. It is not. This is a modelled hazard note, not a visit.`,
        seasonal: "The hold is present whenever there is water over the sill. Drought does not retire a weir.",
        afterRain: "Higher water deepens the hold. After rain, stay out.",
      },
    ];
  }
  if (seed.grade === "serious") {
    const title =
      seed.water === "coast" || seed.water === "tidal-pool"
        ? "Current, tide or working water"
        : seed.water === "lake"
          ? "Sudden depth or cold"
          : "Current or water quality";
    return [
      {
        grade: "serious",
        title,
        body: `A serious, named risk is recorded at ${seed.name}. It is not an ordinary outdoor-water caution. Read the rest of the record before you decide anything — and decide nothing from a photograph.`,
        afterRain:
          seed.water === "river"
            ? "After rain the current and the overflows both worsen. Treat yesterday’s dry as gone."
            : undefined,
      },
    ];
  }
  if (seed.grade === "unknown") {
    return [
      {
        grade: "unknown",
        title: "This reach has not been assessed",
        body: `There is no sounding, no reliable current note, and no recent sample for ${seed.name}. Absence on this page is not an absence of hazard.`,
      },
    ];
  }
  return [
    {
      grade: "caution",
      title: "Ordinary outdoor water",
      body: `${seed.name} is assessed as ordinary caution: cold water, an uneven bed, weather, and the usual need to know how you will get out. That is not the same as safe.`,
    },
  ];
}

function tempSet(
  n: number,
  kind: WaterKind,
  thin: boolean,
): Place["temperature"] {
  if (thin) {
    return {
      spring: none(),
      summer: n % 3 === 0 ? fact("swimmer", "‘warm on top’ — not a reading", dateFrom(n, true)) : none(),
      autumn: none(),
      winter: none(),
    };
  }
  const heated = kind === "lido";
  const src: SourceKind = heated ? "sample" : pick(["sample", "warden"], n);
  const d = dateFrom(n + 3, false);
  if (heated) {
    return {
      spring: fact(src, "16 °C heated", d),
      summer: fact(src, "19 °C heated", d),
      autumn: fact(src, "16 °C heated", d),
      winter: fact("warden", "Closed or unheated", d),
    };
  }
  return {
    spring: fact(src, `${7 + (n % 4)} °C`, d),
    summer: fact(src, `${14 + (n % 5)} °C`, d),
    autumn: n % 4 === 0 ? none() : fact(src, `${10 + (n % 4)} °C`, d),
    winter: n % 3 === 0 ? none() : fact(src, `${4 + (n % 3)} °C`, d),
  };
}

function qualityFor(seed: Seed, n: number): Fact<QualityRating> {
  if (seed.richness === "thin" || seed.grade === "unknown") return none();
  const rating = pick<QualityRating>(
    ["excellent", "good", "sufficient", "poor"],
    n,
  );
  return fact("sample", rating, dateFrom(n + 5, n % 7 === 0));
}

function legalFor(seed: Seed, n: number): Fact<Legal> {
  if (seed.richness === "thin") {
    return n % 2 === 0
      ? none()
      : fact("swimmer", "unclear", dateFrom(n, true), "From a swimmer note. Not a legal opinion.");
  }
  const value = pick<Legal>(
    ["designated", "legal", "tolerated", "tolerated", "unclear"],
    n,
  );
  return fact(seed.water === "lido" ? "sample" : "warden", value, dateFrom(n + 1, false));
}

export function expand(): Place[] {
  return SEEDS.map((seed) => {
    const n = hash(seed.slug);
    const thin = seed.richness === "thin";
    const heated = seed.water === "lido";
    const autumnKnown = !thin && seed.water === "lido";
    const child =
      seed.grade === "caution" &&
      (seed.water === "lido" || seed.water === "tidal-pool") &&
      !thin
        ? true
        : seed.grade === "lethal" || seed.grade === "serious"
          ? false
          : thin
            ? null
            : false;
    const mile =
      !thin &&
      seed.water !== "lido" &&
      seed.water !== "tidal-pool" &&
      seed.grade !== "lethal" &&
      n % 5 === 0
        ? true
        : thin
          ? null
          : false;
    const noCar =
      !thin && (seed.water === "lido" || n % 4 === 1) ? true : thin ? null : false;

    const depth: Fact<string> = thin
      ? none()
      : fact(
          "warden",
          seed.water === "lido"
            ? "Marked tank depths."
            : seed.water === "lake"
              ? "Deepens within a few strokes of the usual entry."
              : "Uneven. Do not guess from the bank.",
          dateFrom(n + 2, false),
        );

    const current: Fact<string> = thin
      ? none()
      : fact(
          "warden",
          seed.grade === "lethal"
            ? "Recirculating hold at the structure. The boil is not slack."
            : seed.water === "lido"
              ? "None. Enclosed tank."
              : seed.water === "coast" || seed.water === "tidal-pool"
                ? "Tide and local set. Slack is not the whole story."
                : "Present. Stronger after rain.",
          dateFrom(n + 4, false),
        );

    const notes =
      thin || n % 3 === 0
        ? [
            {
              by: pick(["A.P.", "R.", "Jo", "M. Hale", "Anon"], n),
              date: dateFrom(n + 9, thin || n % 5 === 0),
              text: thin
                ? `Went to ${seed.name}. Cannot now say the depth or the current. Writing it down so the name is not empty.`
                : `Swam at ${seed.name}. This is a recollection, not a measurement.`,
            },
          ]
        : [];

    return {
      slug: seed.slug,
      name: seed.name,
      water: seed.water,
      waterName: seed.waterName,
      county: seed.county,
      nation: seed.nation,
      sheet: seed.sheet,
      chainageKm: seed.chainageKm,
      summary: thin
        ? `A thin record. Almost nothing measured at ${seed.name}. Do not treat the gaps as calm water.`
        : `A modelled register entry for ${seed.name} on ${seed.waterName}.`,
      access: thin
        ? none()
        : fact(
            "warden",
            `Access is recorded in outline only: local path or lane to ${seed.name}. Confirm on the ground.`,
            dateFrom(n + 6, false),
          ),
      parking: thin
        ? none()
        : fact(
            "warden",
            noCar
              ? "Reachable without a car if the public transport of the day is running. Parking is not the point."
              : "Limited local parking. Do not block gates.",
            dateFrom(n + 6, false),
          ),
      depth,
      current,
      temperature: tempSet(n, seed.water, thin),
      quality: qualityFor(seed, n),
      qualityAfterRain:
        !thin && (seed.grade === "serious" || n % 4 === 2)
          ? "After significant rain, treat quality as worse than the last sample — overflows are common on this kind of water."
          : undefined,
      hazards: hazardsFor(seed),
      legal: legalFor(seed, n),
      childOk: child,
      mileOk: mile,
      noCar,
      octoberOk: heated ? true : thin ? null : false,
      lengthM: thin
        ? none()
        : fact(
            "warden",
            mile ? 1600 + (n % 8) * 50 : 20 + (n % 40) * 3,
            dateFrom(n + 2, false),
          ),
      notes,
    };
  });
}
