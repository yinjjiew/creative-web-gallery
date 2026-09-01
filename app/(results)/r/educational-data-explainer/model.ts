import {
  HOURS,
  STILL_WEEK,
  demandMw,
  nuclearAvail,
  solarCf,
  windCf,
} from "./series";

export type Mix = {
  solarGw: number;
  windGw: number;
  nuclearGw: number;
  gasGw: number;
  battGw: number;
  battHours: number;
};

export const DEFAULT_MIX: Mix = {
  solarGw: 80,
  windGw: 0,
  nuclearGw: 0,
  gasGw: 0,
  battGw: 0,
  battHours: 2,
};

export const PRESETS: { id: string; label: string; mix: Mix }[] = [
  { id: "solar", label: "Solar instinct", mix: { ...DEFAULT_MIX } },
  {
    id: "wind",
    label: "Add wind",
    mix: {
      solarGw: 80,
      windGw: 50,
      nuclearGw: 0,
      gasGw: 0,
      battGw: 0,
      battHours: 2,
    },
  },
  {
    id: "fleet",
    label: "2024 fleet",
    mix: {
      solarGw: 18,
      windGw: 29,
      nuclearGw: 5.9,
      gasGw: 0,
      battGw: 0,
      battHours: 2,
    },
  },
  {
    id: "evening",
    label: "Evening battery",
    mix: {
      solarGw: 40,
      windGw: 70,
      nuclearGw: 16,
      gasGw: 0,
      battGw: 20,
      battHours: 2,
    },
  },
  {
    id: "week",
    label: "A still week",
    mix: {
      solarGw: 40,
      windGw: 70,
      nuclearGw: 16,
      gasGw: 0,
      battGw: 20,
      battHours: 72,
    },
  },
  {
    id: "gas",
    label: "Gas as used",
    mix: {
      solarGw: 18,
      windGw: 29,
      nuclearGw: 5.9,
      gasGw: 28,
      battGw: 0,
      battHours: 2,
    },
  },
];

/** Round-trip 85%, split symmetrically. Stated on the page. */
const ETA = Math.sqrt(0.85);

export const KIND_OUT = 0;
export const KIND_GAS = 1;
export const KIND_LOW = 2;

export type Run = {
  kind: Uint8Array;
  demand: Float32Array;
  solar: Float32Array;
  wind: Float32Array;
  nuclear: Float32Array;
  gas: Float32Array;
  unserved: Float32Array;
  surplus: Float32Array;
  soc: Float32Array;
  hoursOut: number;
  hoursGas: number;
  hoursLow: number;
  longestDark: number;
  longestDarkAt: number;
  unservedTwh: number;
  gasTwh: number;
  solarTwh: number;
  windTwh: number;
  nuclearTwh: number;
  demandTwh: number;
  curtailedTwh: number;
  renewableShare: number;
  lowcarbonShare: number;
  worstWeekAt: number;
};

type Step = {
  d: number;
  s: number;
  w: number;
  n: number;
  gas: number;
  uns: number;
  sur: number;
  soc: number;
};

function stepHour(mix: Mix, i: number, soc: number, cap: number, power: number): Step {
  const d = demandMw[i] / 1000;
  const s = mix.solarGw * solarCf[i];
  const w = mix.windGw * windCf[i];
  const n = mix.nuclearGw * nuclearAvail[i];
  let residual = d - (s + w + n);
  let gas = 0;
  let uns = 0;
  let sur = 0;
  let next = soc;

  if (residual > 0) {
    if (cap > 0 && power > 0) {
      const delivered = Math.min(residual, power, next * ETA);
      residual -= delivered;
      next -= delivered / ETA;
    }
    gas = Math.min(residual, mix.gasGw);
    uns = residual - gas;
  } else {
    sur = -residual;
    if (cap > 0 && power > 0) {
      const room = (cap - next) / ETA;
      const take = Math.min(sur, power, Math.max(0, room));
      sur -= take;
      next += take * ETA;
    }
  }
  if (next < 0) next = 0;
  if (next > cap) next = cap;
  return { d, s, w, n, gas, uns, sur, soc: next };
}

export function simulate(mix: Mix): Run {
  const kind = new Uint8Array(HOURS);
  const demand = new Float32Array(HOURS);
  const solar = new Float32Array(HOURS);
  const wind = new Float32Array(HOURS);
  const nuclear = new Float32Array(HOURS);
  const gasA = new Float32Array(HOURS);
  const unsA = new Float32Array(HOURS);
  const surA = new Float32Array(HOURS);
  const socA = new Float32Array(HOURS);
  const power = Math.max(0, mix.battGw);
  const cap = Math.max(0, mix.battGw * mix.battHours);

  let soc = cap > 0 ? cap * 0.5 : 0;
  for (let pass = 0; pass < 2; pass++) {
    let hoursOut = 0;
    let hoursGas = 0;
    let hoursLow = 0;
    let longestDark = 0;
    let longestDarkAt = 0;
    let streak = 0;
    let streakAt = 0;
    let unservedTwh = 0;
    let gasTwh = 0;
    let solarTwh = 0;
    let windTwh = 0;
    let nuclearTwh = 0;
    let demandTwh = 0;
    let curtailedTwh = 0;

    for (let i = 0; i < HOURS; i++) {
      const h = stepHour(mix, i, soc, cap, power);
      soc = h.soc;
      if (pass === 0) continue;
      demand[i] = h.d;
      solar[i] = h.s;
      wind[i] = h.w;
      nuclear[i] = h.n;
      gasA[i] = h.gas;
      unsA[i] = h.uns;
      surA[i] = h.sur;
      socA[i] = h.soc;
      demandTwh += h.d;
      solarTwh += h.s;
      windTwh += h.w;
      nuclearTwh += h.n;
      gasTwh += h.gas;
      unservedTwh += h.uns;
      curtailedTwh += h.sur;
      if (h.uns > 0.05) {
        kind[i] = KIND_OUT;
        hoursOut++;
        if (streak === 0) streakAt = i;
        streak++;
        if (streak > longestDark) {
          longestDark = streak;
          longestDarkAt = streakAt;
        }
      } else if (h.gas > 0.05) {
        kind[i] = KIND_GAS;
        hoursGas++;
        streak = 0;
      } else {
        kind[i] = KIND_LOW;
        hoursLow++;
        streak = 0;
      }
    }

    if (pass === 0) continue;

    const toTwh = 1 / 1000;
    unservedTwh *= toTwh;
    gasTwh *= toTwh;
    solarTwh *= toTwh;
    windTwh *= toTwh;
    nuclearTwh *= toTwh;
    demandTwh *= toTwh;
    curtailedTwh *= toTwh;

    let worstWeekAt = STILL_WEEK;
    let worstScore = -1;
    for (let i = 0; i <= HOURS - 168; i += 6) {
      let u = 0;
      let g = 0;
      for (let j = 0; j < 168; j++) {
        u += unsA[i + j];
        g += gasA[i + j];
      }
      const score = u * 20 + g;
      if (score > worstScore) {
        worstScore = score;
        worstWeekAt = i;
      }
    }
    if (worstScore <= 0) worstWeekAt = STILL_WEEK;

    return {
      kind,
      demand,
      solar,
      wind,
      nuclear,
      gas: gasA,
      unserved: unsA,
      surplus: surA,
      soc: socA,
      hoursOut,
      hoursGas,
      hoursLow,
      longestDark,
      longestDarkAt,
      unservedTwh,
      gasTwh,
      solarTwh,
      windTwh,
      nuclearTwh,
      demandTwh,
      curtailedTwh,
      renewableShare: demandTwh > 0 ? (solarTwh + windTwh) / demandTwh : 0,
      lowcarbonShare: demandTwh > 0 ? (solarTwh + windTwh + nuclearTwh) / demandTwh : 0,
      worstWeekAt,
    };
  }

  throw new Error("simulate: unreachable");
}

export function mixesEqual(a: Mix, b: Mix): boolean {
  return (
    a.solarGw === b.solarGw &&
    a.windGw === b.windGw &&
    a.nuclearGw === b.nuclearGw &&
    a.gasGw === b.gasGw &&
    a.battGw === b.battGw &&
    a.battHours === b.battHours
  );
}
