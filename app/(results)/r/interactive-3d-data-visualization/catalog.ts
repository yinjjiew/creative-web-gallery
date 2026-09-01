import {
  DEPTH_MAX_KM,
  inWindow,
  LAT_MAX,
  LAT_MIN,
  KM_PER_DEG_LON,
  LON_MAX,
  LON_MIN,
  slabDepthKm,
  trenchLon,
} from "./geo";

export type Kind = "observed" | "modelled";
export type DepthBand = "all" | "shallow" | "mid" | "deep";

export type Quake = {
  id: string;
  lat: number;
  lon: number;
  depthKm: number;
  mw: number;
  year: number;
  iso: string;
  kind: Kind;
  name?: string;
  source: string;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number) {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleMw(rng: () => number, min = 4.5, max = 7.6) {
  const b = 1;
  const u = rng();
  const lo = 10 ** (-b * min);
  const hi = 10 ** (-b * max);
  return -Math.log10(lo - u * (lo - hi)) / b;
}

function yearToIso(year: number) {
  const y = Math.floor(year);
  const frac = year - y;
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return new Date(start + frac * (end - start)).toISOString();
}

function sampleYear(rng: () => number) {
  if (rng() < 0.3) return 2011.19 + rng() * 1.7;
  return 1975 + rng() * 49.6;
}

/**
 * Observed hypocentres. Coordinates and magnitudes from USGS ComCat,
 * except 1933 Sanriku (ISC-GEM relocation — the instrumental location
 * is a later reconstruction, not a contemporary teleseismic solution).
 */
const OBSERVED: Quake[] = [
  {
    id: "obs-1933",
    lat: 39.22,
    lon: 144.62,
    depthKm: 15,
    mw: 8.4,
    year: 1933.167,
    iso: "1933-03-02T17:30:58.000Z",
    kind: "observed",
    name: "Sanriku (outer rise)",
    source: "ISC-GEM relocation",
  },
  {
    id: "obs-1968",
    lat: 40.86,
    lon: 143.437,
    depthKm: 26,
    mw: 8.2,
    year: 1968.373,
    iso: "1968-05-16T00:49:02.000Z",
    kind: "observed",
    name: "Tokachi-oki",
    source: "USGS ComCat",
  },
  {
    id: "obs-1978",
    lat: 38.221,
    lon: 142.09,
    depthKm: 44,
    mw: 7.6,
    year: 1978.445,
    iso: "1978-06-12T08:14:26.000Z",
    kind: "observed",
    name: "Miyagi-oki",
    source: "USGS ComCat",
  },
  {
    id: "obs-1994",
    lat: 40.511,
    lon: 143.42,
    depthKm: 22.4,
    mw: 7.7,
    year: 1994.99,
    iso: "1994-12-28T12:19:23.000Z",
    kind: "observed",
    name: "Sanriku-oki",
    source: "USGS ComCat",
  },
  {
    id: "obs-2005",
    lat: 38.276,
    lon: 142.039,
    depthKm: 36,
    mw: 7.2,
    year: 2005.622,
    iso: "2005-08-16T02:46:28.000Z",
    kind: "observed",
    name: "Miyagi-oki",
    source: "USGS ComCat",
  },
  {
    id: "obs-2011a",
    lat: 38.51,
    lon: 142.782,
    depthKm: 32,
    mw: 7.3,
    year: 2011.185,
    iso: "2011-03-09T02:45:20.000Z",
    kind: "observed",
    name: "Tohoku foreshock",
    source: "USGS ComCat",
  },
  {
    id: "obs-2011",
    lat: 38.297,
    lon: 142.373,
    depthKm: 29,
    mw: 9.1,
    year: 2011.19,
    iso: "2011-03-11T05:46:24.000Z",
    kind: "observed",
    name: "Tohoku-oki",
    source: "USGS ComCat",
  },
  {
    id: "obs-2011b",
    lat: 38.276,
    lon: 141.588,
    depthKm: 42,
    mw: 7.1,
    year: 2011.264,
    iso: "2011-04-07T14:32:43.000Z",
    kind: "observed",
    name: "Miyagi aftershock",
    source: "USGS ComCat",
  },
  {
    id: "obs-2021",
    lat: 37.746,
    lon: 141.748,
    depthKm: 54.6,
    mw: 7.1,
    year: 2021.12,
    iso: "2021-02-13T14:07:50.000Z",
    kind: "observed",
    name: "Fukushima-oki",
    source: "USGS ComCat",
  },
];

function makeModelled(): Quake[] {
  const rng = mulberry32(20110311);
  const out: Quake[] = [];

  const push = (
    lat: number,
    lon: number,
    depthKm: number,
    mw: number,
    year: number,
    tag: string,
  ) => {
    if (!inWindow(lat, lon)) return;
    if (depthKm < 2 || depthKm > DEPTH_MAX_KM) return;
    out.push({
      id: `m-${tag}-${out.length}`,
      lat,
      lon,
      depthKm: Math.round(depthKm * 10) / 10,
      mw: Math.round(mw * 10) / 10,
      year,
      iso: yearToIso(year),
      kind: "modelled",
      source: "Modelled on Slab2",
    });
  };

  // Interface and intraslab. Deep end is sampled more densely than a
  // raw duration-limited catalog so the descending plate remains visible.
  for (let i = 0; i < 300; i++) {
    const lat = LAT_MIN + 0.15 + rng() * (LAT_MAX - LAT_MIN - 0.3);
    const u = rng();
    const kmWest =
      u < 0.42
        ? 12 + rng() * 160
        : u < 0.74
          ? 170 + rng() * 140
          : 310 + rng() * 160;
    const lon = trenchLon(lat) - kmWest / KM_PER_DEG_LON;
    const base = slabDepthKm(lon, lat);
    if (base === null) continue;
    const depth = base + gaussian(rng) * 11;
    push(lat, lon, depth, sampleMw(rng), sampleYear(rng), "slab");
  }

  for (let i = 0; i < 28; i++) {
    const lat = LAT_MIN + 0.2 + rng() * (LAT_MAX - LAT_MIN - 0.4);
    const lon = trenchLon(lat) + 0.15 + rng() * 0.55;
    const depth = 6 + rng() * 22;
    push(lat, lon, depth, sampleMw(rng, 4.5, 6.8), sampleYear(rng), "rise");
  }

  for (let i = 0; i < 18; i++) {
    const lat = LAT_MIN + 0.25 + rng() * (LAT_MAX - LAT_MIN - 0.5);
    const lon = LON_MIN + 0.15 + rng() * Math.max(0.4, trenchLon(lat) - 2.6 - LON_MIN);
    if (lon > trenchLon(lat) - 1.4) continue;
    const depth = 4 + rng() * 16;
    push(lat, lon, depth, sampleMw(rng, 4.5, 6.4), 1978 + rng() * 46, "crust");
  }

  return out;
}

const MODELLED = makeModelled();

export const CATALOG: Quake[] = [...OBSERVED.filter((q) => inWindow(q.lat, q.lon)), ...MODELLED];

export const YEAR_MIN = 1933;
export const YEAR_MAX = 2024;
export const MW_FLOOR = 4.5;

export const STATS = {
  total: CATALOG.length,
  observed: CATALOG.filter((q) => q.kind === "observed").length,
  modelled: CATALOG.filter((q) => q.kind === "modelled").length,
  lon: [LON_MIN, LON_MAX] as const,
  lat: [LAT_MIN, LAT_MAX] as const,
};

export const PROVENANCE =
  `${STATS.modelled} hypocentres are modelled: placed on the USGS Slab2 Japan interface (Hayes et al., 2018) with 11 km of normal scatter, magnitudes from a Gutenberg–Richter law (b = 1, Mw ≥ 4.5), times from a Poisson process with a rate step in 2011. Deep events are sampled more densely than a raw catalog so the intermediate plate stays visible. ${STATS.observed} named events are observed (USGS ComCat; 1933 Sanriku is an ISC-GEM relocation). Coastline and trench are generalised.`;
