export const BASE = "/r/traditional-websites-directory";

export type WaterKind = "river" | "lake" | "lido" | "tidal-pool" | "coast";

export type Nation =
  | "England"
  | "Wales"
  | "Scotland"
  | "Ireland"
  | "Northern Ireland";

export type HazardGrade = "lethal" | "serious" | "caution" | "unknown";

export type Legal = "designated" | "legal" | "tolerated" | "unclear" | "forbidden";

export type SourceKind = "sample" | "warden" | "swimmer" | "none";

export type QualityRating = "excellent" | "good" | "sufficient" | "poor";

/** A fact that may be missing. Missing is a state, never a blank. */
export type Fact<T> = {
  value: T | null;
  source: SourceKind;
  /** ISO date, or null when the fact itself is absent. */
  date: string | null;
  detail?: string;
};

export type Hazard = {
  grade: HazardGrade;
  title: string;
  body: string;
  seasonal?: string;
  afterRain?: string;
};

export type SwimmerNote = {
  by: string;
  date: string;
  text: string;
};

export type Place = {
  slug: string;
  name: string;
  water: WaterKind;
  waterName: string;
  county: string;
  nation: Nation;
  /** Modelled sheet-style reference, not an OS grid. */
  sheet: string;
  /** Kilometres downstream of a named source, for the long-section. */
  chainageKm: number;
  access: Fact<string>;
  parking: Fact<string>;
  depth: Fact<string>;
  current: Fact<string>;
  temperature: {
    spring: Fact<string>;
    summer: Fact<string>;
    autumn: Fact<string>;
    winter: Fact<string>;
  };
  quality: Fact<QualityRating>;
  qualityAfterRain?: string;
  hazards: Hazard[];
  legal: Fact<Legal>;
  /** null means we will not claim it. */
  childOk: boolean | null;
  mileOk: boolean | null;
  noCar: boolean | null;
  /** Autumn temperature recorded and warm enough, or heated. */
  octoberOk: boolean | null;
  lengthM: Fact<number>;
  notes: SwimmerNote[];
  summary: string;
};

export type AskId = "child" | "mile" | "nocar" | "october";

export type Ask = {
  id: AskId;
  title: string;
  lead: string;
  rule: string;
};
