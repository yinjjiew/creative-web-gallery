import {
  LANDSCAPES,
  MOUTH_M,
  RIVER_KM,
  SPRING_M,
  STATIONS,
  type Station,
} from "./journal";

export type Tint = {
  paper: string;
  ink: string;
  mute: string;
  water: string;
  silt: string;
  rule: string;
};

const TINTS: { km: number; tint: Tint }[] = [
  {
    km: 0,
    tint: {
      paper: "#e6d8c2",
      ink: "#2a2218",
      mute: "#6a5c4a",
      water: "#5a4834",
      silt: "#7a6548",
      rule: "#c4b49a",
    },
  },
  {
    km: 24,
    tint: {
      paper: "#e3ddd0",
      ink: "#26241c",
      mute: "#5c584c",
      water: "#4a5340",
      silt: "#6a7458",
      rule: "#b8b4a4",
    },
  },
  {
    km: 54,
    tint: {
      paper: "#e6d6cc",
      ink: "#2a1c18",
      mute: "#6a5248",
      water: "#4a342c",
      silt: "#8a5848",
      rule: "#c4a898",
    },
  },
  {
    km: 92,
    tint: {
      paper: "#dcd8d4",
      ink: "#1c1c1c",
      mute: "#5a5854",
      water: "#3a4044",
      silt: "#5a6268",
      rule: "#b0aca8",
    },
  },
  {
    km: 114,
    tint: {
      paper: "#d4d0cc",
      ink: "#1a1a1a",
      mute: "#585450",
      water: "#2c3034",
      silt: "#6a5a40",
      rule: "#a8a49c",
    },
  },
  {
    km: 138,
    tint: {
      paper: "#d0d3d4",
      ink: "#181a1a",
      mute: "#545858",
      water: "#5c6468",
      silt: "#8a9090",
      rule: "#a8acac",
    },
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.slice(1);
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(
    A[0] + (B[0] - A[0]) * t,
    A[1] + (B[1] - A[1]) * t,
    A[2] + (B[2] - A[2]) * t
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function widthAt(km: number): number {
  const x = clamp(km, 0, RIVER_KM);
  let i = 0;
  while (i < STATIONS.length - 1 && STATIONS[i + 1].km < x) i += 1;
  const a = STATIONS[i];
  const b = STATIONS[Math.min(i + 1, STATIONS.length - 1)];
  if (a.km === b.km) return a.widthM;
  const t = (x - a.km) / (b.km - a.km);
  // Width grows faster than distance; interpolate in log metres.
  const la = Math.log(a.widthM);
  const lb = Math.log(b.widthM);
  return Math.exp(lerp(la, lb, t));
}

/**
 * Screen channel on a log section. Linear pixels would keep the first
 * thirty days a hairline; a river that begins as a step-across and ends
 * two kilometres wide has to be drawn the way a long section is drawn.
 */
export function channelPx(widthM: number, maxPx: number): number {
  const t =
    Math.log(clamp(widthM, SPRING_M, MOUTH_M) / SPRING_M) /
    Math.log(MOUTH_M / SPRING_M);
  return 3 + t * Math.max(8, maxPx - 3);
}

export function tintAt(km: number): Tint {
  const x = clamp(km, 0, RIVER_KM);
  let i = 0;
  while (i < TINTS.length - 1 && TINTS[i + 1].km < x) i += 1;
  const a = TINTS[i];
  const b = TINTS[Math.min(i + 1, TINTS.length - 1)];
  if (a.km === b.km) return a.tint;
  const t = (x - a.km) / (b.km - a.km);
  return {
    paper: mixHex(a.tint.paper, b.tint.paper, t),
    ink: mixHex(a.tint.ink, b.tint.ink, t),
    mute: mixHex(a.tint.mute, b.tint.mute, t),
    water: mixHex(a.tint.water, b.tint.water, t),
    silt: mixHex(a.tint.silt, b.tint.silt, t),
    rule: mixHex(a.tint.rule, b.tint.rule, t),
  };
}

export function landscapeAt(km: number): (typeof LANDSCAPES)[number] {
  let current = LANDSCAPES[0];
  for (const band of LANDSCAPES) {
    if (km >= band.fromKm) current = band;
  }
  return current;
}

export function stationAround(km: number): { a: Station; b: Station; t: number } {
  const x = clamp(km, 0, RIVER_KM);
  let i = 0;
  while (i < STATIONS.length - 1 && STATIONS[i + 1].km < x) i += 1;
  const a = STATIONS[i];
  const b = STATIONS[Math.min(i + 1, STATIONS.length - 1)];
  const t = a.km === b.km ? 0 : (x - a.km) / (b.km - a.km);
  return { a, b, t };
}

export function lastDay(km: number): Station {
  let last = STATIONS.find((s) => s.kind === "day") ?? STATIONS[0];
  for (const s of STATIONS) {
    if (s.kind === "day" && s.km <= km + 0.35) last = s;
  }
  return last;
}

export function formatWidth(m: number): string {
  if (m >= 950) {
    const km = m / 1000;
    const n = km >= 1.95 ? km.toFixed(1).replace(/\.0$/, "") : km.toFixed(2);
    return `${n} km across`;
  }
  if (m >= 10) return `${Math.round(m)} m across`;
  return `${m.toFixed(1)} m across`;
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km down`;
}

export { clamp, lerp };
