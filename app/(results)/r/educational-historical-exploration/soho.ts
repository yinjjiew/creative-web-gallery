/**
 * A Soho that can be reasoned over.
 *
 * Streets and pumps sit on real longitudes and latitudes of the parish.
 * Death marks follow the pattern of Snow’s 1855 lithograph — stacked bars
 * on house frontages, empty at the workhouse and the brewery, densest on
 * Broad Street — but they are not a digitization of every bar. That is
 * labelled in the interface.
 *
 * Day-of-death on each mark is assigned from Snow’s daily table so the
 * cluster can grow in time. Which house receives which day is reconstructed.
 */

import { DAYS, FIGURES } from "./data";

export type Pt = { x: number; y: number };
export type LonLat = { lon: number; lat: number };

const LAT0 = 51.51334;
const M_LAT = 111_320;
const M_LON = 111_320 * Math.cos((LAT0 * Math.PI) / 180);

export const WEST = -0.1417;
export const NORTH = 51.51645;
export const EAST = -0.1314;
export const SOUTH = 51.51055;

export function project(lon: number, lat: number): Pt {
  return {
    x: (lon - WEST) * M_LON,
    y: (NORTH - lat) * M_LAT,
  };
}

export function unproject(x: number, y: number): LonLat {
  return {
    lon: WEST + x / M_LON,
    lat: NORTH - y / M_LAT,
  };
}

export const SIZE = project(EAST, SOUTH);
export const YARDS_250 = 228.6;

export type Street = {
  name: string;
  pts: LonLat[];
};

export const STREETS: Street[] = [
  {
    name: "Oxford Street",
    pts: [
      { lon: -0.1416, lat: 51.51552 },
      { lon: -0.1388, lat: 51.51558 },
      { lon: -0.1364, lat: 51.51564 },
      { lon: -0.1340, lat: 51.5157 },
      { lon: -0.1315, lat: 51.51578 },
    ],
  },
  {
    name: "Regent Street",
    pts: [
      { lon: -0.14135, lat: 51.5162 },
      { lon: -0.1412, lat: 51.5144 },
      { lon: -0.1410, lat: 51.5130 },
      { lon: -0.1407, lat: 51.5114 },
      { lon: -0.1404, lat: 51.5106 },
    ],
  },
  {
    name: "Great Marlborough Street",
    pts: [
      { lon: -0.14055, lat: 51.51452 },
      { lon: -0.1386, lat: 51.51456 },
      { lon: -0.1365, lat: 51.5146 },
      { lon: -0.1344, lat: 51.51464 },
      { lon: -0.1332, lat: 51.51466 },
    ],
  },
  {
    name: "Broad Street",
    pts: [
      { lon: -0.14015, lat: 51.5134 },
      { lon: -0.1387, lat: 51.51338 },
      { lon: -0.1374, lat: 51.51336 },
      { lon: -0.13667, lat: 51.51334 },
      { lon: -0.1354, lat: 51.51332 },
      { lon: -0.1342, lat: 51.5133 },
      { lon: -0.13315, lat: 51.51328 },
    ],
  },
  {
    name: "Noel Street",
    pts: [
      { lon: -0.1377, lat: 51.51495 },
      { lon: -0.13535, lat: 51.515 },
    ],
  },
  {
    name: "Poland Street",
    pts: [
      { lon: -0.13758, lat: 51.51558 },
      { lon: -0.1375, lat: 51.5146 },
      { lon: -0.13742, lat: 51.51336 },
      { lon: -0.13732, lat: 51.5125 },
    ],
  },
  {
    name: "Cambridge Street",
    pts: [
      { lon: -0.13642, lat: 51.5152 },
      { lon: -0.13648, lat: 51.5146 },
      { lon: -0.13655, lat: 51.51334 },
      { lon: -0.13662, lat: 51.5122 },
      { lon: -0.13668, lat: 51.51155 },
    ],
  },
  {
    name: "Berwick Street",
    pts: [
      { lon: -0.13545, lat: 51.51568 },
      { lon: -0.13538, lat: 51.5146 },
      { lon: -0.13528, lat: 51.51332 },
      { lon: -0.13518, lat: 51.5121 },
      { lon: -0.13508, lat: 51.5115 },
    ],
  },
  {
    name: "Wardour Street",
    pts: [
      { lon: -0.13445, lat: 51.51572 },
      { lon: -0.13435, lat: 51.51464 },
      { lon: -0.13422, lat: 51.5133 },
      { lon: -0.13405, lat: 51.5119 },
      { lon: -0.1339, lat: 51.5109 },
    ],
  },
  {
    name: "Dean Street",
    pts: [
      { lon: -0.13255, lat: 51.51576 },
      { lon: -0.13245, lat: 51.5145 },
      { lon: -0.13232, lat: 51.5131 },
      { lon: -0.13218, lat: 51.5117 },
    ],
  },
  {
    name: "Carnaby Street",
    pts: [
      { lon: -0.13872, lat: 51.51456 },
      { lon: -0.13862, lat: 51.5137 },
      { lon: -0.13852, lat: 51.51295 },
    ],
  },
  {
    name: "Marshall Street",
    pts: [
      { lon: -0.13815, lat: 51.5144 },
      { lon: -0.13808, lat: 51.51338 },
      { lon: -0.138, lat: 51.51245 },
    ],
  },
  {
    name: "Kingly Street",
    pts: [
      { lon: -0.13975, lat: 51.51452 },
      { lon: -0.1397, lat: 51.5134 },
      { lon: -0.13965, lat: 51.5122 },
      { lon: -0.1396, lat: 51.51155 },
    ],
  },
  {
    name: "Warwick Street",
    pts: [
      { lon: -0.13945, lat: 51.5132 },
      { lon: -0.13935, lat: 51.5121 },
      { lon: -0.13925, lat: 51.51115 },
    ],
  },
  {
    name: "Bridle Lane",
    pts: [
      { lon: -0.13705, lat: 51.51255 },
      { lon: -0.13695, lat: 51.5117 },
      { lon: -0.13688, lat: 51.51115 },
    ],
  },
  {
    name: "Peter Street",
    pts: [
      { lon: -0.1392, lat: 51.51255 },
      { lon: -0.1374, lat: 51.5125 },
      { lon: -0.1355, lat: 51.51242 },
    ],
  },
  {
    name: "Beak Street",
    pts: [
      { lon: -0.1402, lat: 51.5122 },
      { lon: -0.1384, lat: 51.51214 },
      { lon: -0.1367, lat: 51.51208 },
    ],
  },
  {
    name: "Brewer Street",
    pts: [
      { lon: -0.14035, lat: 51.51175 },
      { lon: -0.1384, lat: 51.51165 },
      { lon: -0.1366, lat: 51.51155 },
      { lon: -0.1346, lat: 51.51145 },
      { lon: -0.1334, lat: 51.51138 },
    ],
  },
  {
    name: "Vigo Street",
    pts: [
      { lon: -0.14085, lat: 51.51155 },
      { lon: -0.13955, lat: 51.51095 },
    ],
  },
  {
    name: "Rupert Street",
    pts: [
      { lon: -0.13355, lat: 51.51305 },
      { lon: -0.1334, lat: 51.5119 },
      { lon: -0.13325, lat: 51.51085 },
    ],
  },
  {
    name: "Great Pulteney Street",
    pts: [
      { lon: -0.13615, lat: 51.51208 },
      { lon: -0.13605, lat: 51.5112 },
    ],
  },
  {
    name: "Great Windmill Street",
    pts: [
      { lon: -0.13455, lat: 51.51185 },
      { lon: -0.13445, lat: 51.5107 },
    ],
  },
  {
    name: "Golden Square N",
    pts: [
      { lon: -0.13815, lat: 51.51218 },
      { lon: -0.13655, lat: 51.51216 },
    ],
  },
  {
    name: "Golden Square S",
    pts: [
      { lon: -0.13815, lat: 51.51142 },
      { lon: -0.13655, lat: 51.5114 },
    ],
  },
  {
    name: "Golden Square W",
    pts: [
      { lon: -0.13815, lat: 51.51218 },
      { lon: -0.13815, lat: 51.51142 },
    ],
  },
  {
    name: "Golden Square E",
    pts: [
      { lon: -0.13655, lat: 51.51216 },
      { lon: -0.13655, lat: 51.5114 },
    ],
  },
  {
    name: "Soho Square W",
    pts: [
      { lon: -0.13295, lat: 51.51555 },
      { lon: -0.13295, lat: 51.51472 },
    ],
  },
  {
    name: "Soho Square S",
    pts: [
      { lon: -0.13295, lat: 51.51472 },
      { lon: -0.1317, lat: 51.51472 },
    ],
  },
];

export type Pump = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  note: string;
  avoided?: boolean;
};

export const PUMPS: Pump[] = [
  {
    id: "broad",
    name: "Broad Street",
    lon: -0.136668,
    lat: 51.513341,
    note: "The pump at the centre of the outburst. Water thought good; preferred by people who lived nearer dirtier wells. Position is that of the memorial pump on Broadwick Street, on Snow’s site.",
  },
  {
    id: "marlborough",
    name: "Great Marlborough Street",
    lon: -0.13855,
    lat: 51.51456,
    avoided: true,
    note: "At the Carnaby Street end. Snow found it worse than the others; most neighbours sent to Broad Street. Deaths beside it are not a point against a Broad Street source.",
  },
  {
    id: "dean",
    name: "Dean Street",
    lon: -0.1324,
    lat: 51.51255,
    note: "East of the cluster. Snow’s walking-distance line falls off before this well for most of the dead.",
  },
  {
    id: "soho",
    name: "Soho Square",
    lon: -0.1324,
    lat: 51.51515,
    note: "North-east, on higher and more open ground.",
  },
  {
    id: "bridle",
    name: "Bridle Lane",
    lon: -0.13695,
    lat: 51.51155,
    note: "South of Golden Square. Whitish particles, as at Broad Street and Warwick Street.",
  },
  {
    id: "warwick",
    name: "Warwick Street",
    lon: -0.1393,
    lat: 51.51185,
    note: "South-west. Visible impurity; not the well people walked to.",
  },
  {
    id: "vigo",
    name: "Vigo Street",
    lon: -0.1404,
    lat: 51.51115,
    note: "The exception in Snow’s first-week inspection: no visible impurity. A few families nearer Broad Street still sent here sometimes.",
  },
  {
    id: "rupert",
    name: "Rupert Street",
    lon: -0.1334,
    lat: 51.51155,
    note: "South-east of Wardour Street.",
  },
  {
    id: "berners",
    name: "Berners Street",
    lon: -0.1357,
    lat: 51.51605,
    note: "North of Oxford Street. Off the worst ground.",
  },
  {
    id: "newman",
    name: "Newman Street",
    lon: -0.1336,
    lat: 51.5161,
    note: "Further north-east, beyond Soho Square.",
  },
  {
    id: "coventry",
    name: "Coventry Street",
    lon: -0.1339,
    lat: 51.51075,
    note: "South edge of the map, toward Piccadilly.",
  },
  {
    id: "crown",
    name: "Crown Street",
    lon: -0.13955,
    lat: 51.51385,
    note: "West of Poland Street, toward Regent Street.",
  },
  {
    id: "little-marl",
    name: "Little Marlborough Street",
    lon: -0.1399,
    lat: 51.5142,
    note: "A lesser well on the north-west fringe.",
  },
];

export type Building = {
  id: string;
  name: string;
  kind: "workhouse" | "brewery" | "works" | "house";
  ring: LonLat[];
  paper?: string;
};

export const BUILDINGS: Building[] = [
  {
    id: "workhouse",
    name: "St James’s Workhouse",
    kind: "workhouse",
    paper: "workhouse",
    ring: [
      { lon: -0.13858, lat: 51.51358 },
      { lon: -0.13748, lat: 51.51358 },
      { lon: -0.13748, lat: 51.51462 },
      { lon: -0.13858, lat: 51.51462 },
    ],
  },
  {
    id: "brewery",
    name: "Huggins’ brewery",
    kind: "brewery",
    paper: "brewery",
    ring: [
      { lon: -0.13748, lat: 51.51302 },
      { lon: -0.13682, lat: 51.51302 },
      { lon: -0.13682, lat: 51.51332 },
      { lon: -0.13748, lat: 51.51332 },
    ],
  },
  {
    id: "eley",
    name: "Eley Brothers, 38 Broad Street",
    kind: "works",
    paper: "eley",
    ring: [
      { lon: -0.13695, lat: 51.51322 },
      { lon: -0.13672, lat: 51.51322 },
      { lon: -0.13672, lat: 51.51334 },
      { lon: -0.13695, lat: 51.51334 },
    ],
  },
  {
    id: "forty",
    name: "40 Broad Street",
    kind: "house",
    paper: "whitehead",
    ring: [
      { lon: -0.13662, lat: 51.51322 },
      { lon: -0.13648, lat: 51.51322 },
      { lon: -0.13648, lat: 51.51334 },
      { lon: -0.13662, lat: 51.51334 },
    ],
  },
];

export const JUNCTION: LonLat = { lon: -0.13655, lat: 51.51334 };
export const BROAD = PUMPS[0];

export function distM(a: LonLat, b: LonLat): number {
  const dx = (a.lon - b.lon) * M_LON;
  const dy = (a.lat - b.lat) * M_LAT;
  return Math.hypot(dx, dy);
}

function insideRing(p: LonLat, ring: LonLat[]): boolean {
  let odd = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.lat > p.lat !== b.lat > p.lat) {
      const x = ((b.lon - a.lon) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lon;
      if (p.lon < x) odd = !odd;
    }
  }
  return odd;
}

function inQuietGround(p: LonLat): boolean {
  return (
    insideRing(p, BUILDINGS[0].ring) || insideRing(p, BUILDINGS[1].ring)
  );
}

function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type House = {
  id: string;
  street: string;
  lon: number;
  lat: number;
  x: number;
  y: number;
  nx: number;
  ny: number;
  deaths: number;
  days: number[];
  nearest: string;
  special?: "workhouse";
};

function intensity(p: LonLat, street: string, side: number): number {
  const d = distM(p, BROAD);
  let n = 0.95 * Math.exp(-(d * d) / (2 * 88 * 88));
  if (street === "Broad Street") n *= 2.6;
  if (street === "Broad Street" && side < 0) n *= 1.3;
  if (street === "Cambridge Street" || street === "Poland Street") n *= 1.2;
  if (street === "Berwick Street" || street === "Peter Street") n *= 1.05;
  if (street.startsWith("Golden")) n *= 0.85;
  if (street === "Oxford Street" || street === "Regent Street") n *= 0.12;
  if (street.startsWith("Soho")) n *= 0.2;
  if (street === "Dean Street" || street === "Rupert Street") n *= 0.45;
  if (d > 280) n *= 0.35;
  return n;
}

function walk(pts: LonLat[]): { p: LonLat; t: Pt; n: Pt; s: number }[] {
  const out: { p: LonLat; t: Pt; n: Pt; s: number }[] = [];
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const A = project(a.lon, a.lat);
    const B = project(b.lon, b.lat);
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    if (len < 1) continue;
    const tx = (B.x - A.x) / len;
    const ty = (B.y - A.y) / len;
    const nx = -ty;
    const ny = tx;
    const steps = Math.max(1, Math.round(len / 12));
    for (let k = 0; k < steps; k++) {
      const u = (k + 0.5) / steps;
      out.push({
        p: {
          lon: a.lon + (b.lon - a.lon) * u,
          lat: a.lat + (b.lat - a.lat) * u,
        },
        t: { x: tx, y: ty },
        n: { x: nx, y: ny },
        s: s + u * len,
      });
    }
    s += len;
  }
  return out;
}

function nearestPump(p: LonLat): string {
  let best = PUMPS[0].id;
  let d = Infinity;
  for (const pump of PUMPS) {
    const n = distM(p, pump);
    if (n < d) {
      d = n;
      best = pump.id;
    }
  }
  return best;
}

function takeDays(count: number, weights: number[], rng: () => number): number[] {
  const days: number[] = [];
  const total = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < count; i++) {
    let r = rng() * total;
    let pick = 0;
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j];
      if (r <= 0) {
        pick = j;
        break;
      }
    }
    days.push(pick);
  }
  days.sort((a, b) => a - b);
  return days;
}

function buildHouses(): House[] {
  const rng = mulberry(1854);
  const weights = DAYS.map((d) => d.deaths);
  const houses: House[] = [];
  let n = 0;

  for (const street of STREETS) {
    if (street.name === "Regent Street") continue;
    const samples = walk(street.pts);
    for (const sample of samples) {
      for (const side of [-1, 1] as const) {
        const lon = sample.p.lon + (side * sample.n.x * 7) / M_LON;
        const lat = sample.p.lat - (side * sample.n.y * 7) / M_LAT;
        const p = { lon, lat };
        if (inQuietGround(p)) continue;
        if (street.name === "Oxford Street" && rng() > 0.15) continue;
        const lam = intensity(p, street.name, side);
        if (lam < 0.04) continue;
        let deaths = 0;
        let acc = lam;
        while (acc > 0) {
          if (rng() < Math.min(0.92, acc)) deaths += 1;
          acc -= 1;
        }
        if (deaths <= 0) continue;
        deaths = Math.min(deaths, 8);
        const xy = project(lon, lat);
        houses.push({
          id: `h${n++}`,
          street: street.name.startsWith("Golden")
            ? "Golden Square"
            : street.name.startsWith("Soho")
              ? "Soho Square"
              : street.name,
          lon,
          lat,
          x: xy.x,
          y: xy.y,
          nx: sample.n.x * side,
          ny: sample.n.y * side,
          deaths,
          days: takeDays(deaths, weights, rng),
          nearest: nearestPump(p),
        });
      }
    }
  }

  const gate: LonLat = { lon: -0.1375, lat: 51.51362 };
  const gxy = project(gate.lon, gate.lat);
  houses.push({
    id: "workhouse-deaths",
    street: "Poland Street (workhouse)",
    lon: gate.lon,
    lat: gate.lat,
    x: gxy.x,
    y: gxy.y,
    nx: 0,
    ny: -1,
    deaths: FIGURES.workhouseInmateDeaths.value,
    days: takeDays(FIGURES.workhouseInmateDeaths.value, weights, rng),
    nearest: nearestPump(gate),
    special: "workhouse",
  });

  return houses;
}

export const HOUSES: House[] = buildHouses();
export const MAP_DEATHS = HOUSES.reduce((s, h) => s + h.deaths, 0);

export function deathsThrough(houses: House[], offset: number): number {
  let n = 0;
  for (const h of houses) {
    for (const d of h.days) if (d <= offset) n += 1;
  }
  return n;
}

export function tallyNearest(houses: House[], offset: number): { id: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const pump of PUMPS) counts.set(pump.id, 0);
  for (const h of houses) {
    let c = 0;
    for (const d of h.days) if (d <= offset) c += 1;
    if (c) counts.set(h.nearest, (counts.get(h.nearest) ?? 0) + c);
  }
  return [...counts.entries()]
    .map(([id, n]) => ({ id, n }))
    .sort((a, b) => b.n - a.n);
}

export type NamedCase = {
  id: string;
  label: string;
  lon: number;
  lat: number;
  paper?: string;
  text: string;
  source: string;
};

export const NAMED: NamedCase[] = [
  {
    id: "marl-32",
    label: "32 Great Marlborough Street",
    lon: -0.1372,
    lat: 51.51462,
    text: "A woman aged 42 died here on 4 September. The household said she drank pump water, not from the pump opposite — principally Broad Street, occasionally Vigo Street.",
    source: "cic-snow",
  },
  {
    id: "marl-7",
    label: "7 Great Marlborough Street",
    lon: -0.1394,
    lat: 51.51454,
    text: "Three deaths, 2–5 September. Nearer two other pumps than Broad Street, but water had been fetched from Broad Street and drunk at dinner for a fortnight.",
    source: "cic-snow",
  },
  {
    id: "carn-29",
    label: "29 Carnaby Street",
    lon: -0.13865,
    lat: 51.51415,
    text: "A girl aged 8, died 1 September. The family had Broad Street water; she drank it on the days before her illness.",
    source: "cic-snow",
  },
  {
    id: "carn-31",
    label: "31 Carnaby Street",
    lon: -0.13864,
    lat: 51.51395,
    text: "A woman aged 34, died 1 September. She sent to Broad Street two or three times a day for water to drink.",
    source: "cic-snow",
  },
  {
    id: "carn-40",
    label: "40 Carnaby Street",
    lon: -0.1386,
    lat: 51.51355,
    text: "A woman aged 35, died 1 September. She sent nearly always to Broad Street for drinking water.",
    source: "cic-snow",
  },
  {
    id: "poland-6",
    label: "6 Poland Street",
    lon: -0.1375,
    lat: 51.51385,
    paper: "pentonville",
    text: "A man died here in twelve hours on 1 September. His brother came from Brighton after the death, drank brandy and water from the Broad Street pump, went to Pentonville, and died the next evening.",
    source: "cic-snow",
  },
];

function clip(poly: Pt[], keep: (p: Pt) => boolean, intersect: (a: Pt, b: Pt) => Pt): Pt[] {
  if (poly.length < 2) return [];
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const cin = keep(cur);
    const pin = keep(prev);
    if (cin) {
      if (!pin) out.push(intersect(prev, cur));
      out.push(cur);
    } else if (pin) {
      out.push(intersect(prev, cur));
    }
  }
  return out;
}

export function hinterland(id: string): Pt[] {
  const site = PUMPS.find((p) => p.id === id);
  if (!site) return [];
  const s = project(site.lon, site.lat);
  let poly: Pt[] = [
    { x: -40, y: -40 },
    { x: SIZE.x + 40, y: -40 },
    { x: SIZE.x + 40, y: SIZE.y + 40 },
    { x: -40, y: SIZE.y + 40 },
  ];
  for (const other of PUMPS) {
    if (other.id === id) continue;
    const o = project(other.lon, other.lat);
    const mx = (s.x + o.x) / 2;
    const my = (s.y + o.y) / 2;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    poly = clip(
      poly,
      (p) => (p.x - mx) * dx + (p.y - my) * dy <= 0,
      (a, b) => {
        const da = (a.x - mx) * dx + (a.y - my) * dy;
        const db = (b.x - mx) * dx + (b.y - my) * dy;
        const t = da / (da - db || 1);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      },
    );
  }
  return poly;
}

export const CELLS: { id: string; poly: Pt[] }[] = PUMPS.map((p) => ({
  id: p.id,
  poly: hinterland(p.id),
}));

export function ringPath(ring: LonLat[]): string {
  return (
    ring
      .map((p, i) => {
        const q = project(p.lon, p.lat);
        return `${i === 0 ? "M" : "L"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

export function streetPath(street: Street): string {
  return street.pts
    .map((p, i) => {
      const q = project(p.lon, p.lat);
      return `${i === 0 ? "M" : "L"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    })
    .join(" ");
}

export function polyPath(poly: Pt[]): string {
  if (!poly.length) return "";
  return (
    poly.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    " Z"
  );
}
