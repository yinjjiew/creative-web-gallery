/**
 * Late October at 61°28′ N. The hours are invented; the light is typical.
 *
 * Sunrise ~08:20, sunset ~17:25, a long night. The lamp is the reason the
 * place exists, so the night is written with more care than noon.
 */

export type BoatState = "hidden" | "south" | "offing" | "west" | "return";

export type Happenings = {
  night: number;
  beam: number;
  windowLit: number;
  boat: BoatState;
  boatT: number;
  dawnBirds: number;
  fulmars: number;
  raven: number;
  flag: number;
  wind: number;
  swell: number;
  caption: string;
  period: "night" | "dawn" | "day" | "dusk";
};

export type SkySample = {
  zenith: [number, number, number];
  horizon: [number, number, number];
  fog: [number, number, number];
  sun: [number, number, number];
  ground: [number, number, number];
  sunIntensity: number;
  hemi: number;
  exposure: number;
};

type Key = { h: number } & SkySample;

const KEYS: Key[] = [
  {
    h: 0,
    zenith: [0.035, 0.042, 0.07],
    horizon: [0.08, 0.09, 0.12],
    fog: [0.055, 0.062, 0.08],
    sun: [0.55, 0.6, 0.75],
    ground: [0.04, 0.045, 0.04],
    sunIntensity: 0.12,
    hemi: 0.22,
    exposure: 0.72,
  },
  {
    h: 5.4,
    zenith: [0.05, 0.055, 0.09],
    horizon: [0.14, 0.11, 0.13],
    fog: [0.08, 0.07, 0.09],
    sun: [0.7, 0.55, 0.5],
    ground: [0.05, 0.045, 0.04],
    sunIntensity: 0.16,
    hemi: 0.26,
    exposure: 0.76,
  },
  {
    h: 7.6,
    zenith: [0.18, 0.2, 0.28],
    horizon: [0.72, 0.42, 0.34],
    fog: [0.42, 0.3, 0.3],
    sun: [1, 0.62, 0.42],
    ground: [0.12, 0.09, 0.07],
    sunIntensity: 0.55,
    hemi: 0.45,
    exposure: 0.88,
  },
  {
    h: 8.6,
    zenith: [0.42, 0.5, 0.58],
    horizon: [0.78, 0.74, 0.68],
    fog: [0.62, 0.62, 0.6],
    sun: [1, 0.92, 0.78],
    ground: [0.22, 0.2, 0.16],
    sunIntensity: 1.05,
    hemi: 0.7,
    exposure: 0.96,
  },
  {
    h: 12,
    zenith: [0.38, 0.46, 0.54],
    horizon: [0.78, 0.76, 0.7],
    fog: [0.62, 0.64, 0.62],
    sun: [1, 0.96, 0.88],
    ground: [0.24, 0.23, 0.18],
    sunIntensity: 1.35,
    hemi: 0.82,
    exposure: 1,
  },
  {
    h: 15.8,
    zenith: [0.4, 0.46, 0.52],
    horizon: [0.74, 0.68, 0.58],
    fog: [0.58, 0.56, 0.5],
    sun: [1, 0.86, 0.62],
    ground: [0.22, 0.18, 0.14],
    sunIntensity: 1.05,
    hemi: 0.68,
    exposure: 0.95,
  },
  {
    h: 17.25,
    zenith: [0.22, 0.22, 0.3],
    horizon: [0.78, 0.42, 0.3],
    fog: [0.48, 0.32, 0.28],
    sun: [1, 0.5, 0.28],
    ground: [0.16, 0.1, 0.08],
    sunIntensity: 0.72,
    hemi: 0.55,
    exposure: 0.9,
  },
  {
    h: 18.05,
    zenith: [0.08, 0.09, 0.14],
    horizon: [0.28, 0.18, 0.2],
    fog: [0.14, 0.12, 0.14],
    sun: [0.85, 0.45, 0.35],
    ground: [0.06, 0.05, 0.05],
    sunIntensity: 0.2,
    hemi: 0.28,
    exposure: 0.76,
  },
  {
    h: 19.4,
    zenith: [0.04, 0.048, 0.08],
    horizon: [0.09, 0.1, 0.13],
    fog: [0.06, 0.068, 0.085],
    sun: [0.55, 0.6, 0.75],
    ground: [0.04, 0.045, 0.04],
    sunIntensity: 0.12,
    hemi: 0.22,
    exposure: 0.72,
  },
];

function wrapHour(hour: number) {
  return ((hour % 24) + 24) % 24;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function gate(hour: number, start: number, end: number, fade = 0.28) {
  const h = wrapHour(hour);
  if (start < end) {
    if (h < start || h > end) return 0;
    return Math.min(smooth(start, start + fade, h), 1 - smooth(end - fade, end, h));
  }
  // wraps midnight
  if (h >= start) return Math.min(1, smooth(start, start + fade, h));
  if (h <= end) return Math.min(1, 1 - smooth(end - fade, end, h));
  return 0;
}

function pair(hour: number): { a: Key; b: Key; t: number } {
  const h = wrapHour(hour);
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1].h <= h) i += 1;
  const a = KEYS[i];
  const b = KEYS[(i + 1) % KEYS.length];
  const bH = b.h < a.h ? b.h + 24 : b.h;
  const t = (h - a.h) / Math.max(0.001, bH - a.h);
  return { a, b, t };
}

export function skyAt(hour: number): SkySample {
  const { a, b, t } = pair(hour);
  return {
    zenith: lerp3(a.zenith, b.zenith, t),
    horizon: lerp3(a.horizon, b.horizon, t),
    fog: lerp3(a.fog, b.fog, t),
    sun: lerp3(a.sun, b.sun, t),
    ground: lerp3(a.ground, b.ground, t),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, t),
    hemi: lerp(a.hemi, b.hemi, t),
    exposure: lerp(a.exposure, b.exposure, t),
  };
}

/** Sun / moon direction. The arc stays low — this latitude in late October. */
export function sunDirection(hour: number): [number, number, number] {
  const h = wrapHour(hour);
  const t = ((h - 8.3) / 9.1) * Math.PI;
  const night = h < 8.1 || h > 17.5;
  if (night) {
    const nt = ((h < 8.1 ? h + 24 - 17.5 : h - 17.5) / 14.6) * Math.PI;
    const x = Math.cos(nt) * 0.72;
    const y = Math.sin(nt) * 0.28 + 0.08;
    const z = -0.55;
    const len = Math.hypot(x, y, z) || 1;
    return [x / len, y / len, z / len];
  }
  const x = Math.cos(t) * 0.85;
  const y = Math.sin(t) * 0.42 + 0.12;
  const z = 0.15;
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

function boatAt(hour: number): { boat: BoatState; boatT: number } {
  const h = wrapHour(hour);
  if (h >= 9.0 && h < 10.25) {
    return { boat: "south", boatT: (h - 9.0) / 1.25 };
  }
  if (h >= 10.25 && h < 11.05) {
    return { boat: "offing", boatT: (h - 10.25) / 0.8 };
  }
  if (h >= 11.05 && h < 13.15) {
    return { boat: "west", boatT: (h - 11.05) / 2.1 };
  }
  if (h >= 15.15 && h < 16.05) {
    return { boat: "return", boatT: (h - 15.15) / 0.9 };
  }
  if (h >= 16.05 && h < 16.7) {
    return { boat: "offing", boatT: 0.4 + (h - 16.05) * 0.15 };
  }
  if (h >= 16.7 && h < 17.35) {
    return { boat: "south", boatT: 1 - (h - 16.7) / 0.65 };
  }
  return { boat: "hidden", boatT: 0 };
}

export function happeningsAt(hour: number): Happenings {
  const h = wrapHour(hour);
  const night = Math.max(gate(h, 17.85, 24, 0.45), gate(h, 0, 8.05, 0.4));
  const dusk = gate(h, 16.9, 18.4, 0.35);
  const dawn = gate(h, 7.15, 8.85, 0.35);
  const beam = Math.max(gate(h, 17.55, 24, 0.22), gate(h, 0, 8.15, 0.22));
  const windowLit = Math.max(gate(h, 5.35, 7.85, 0.12), gate(h, 20.75, 22.25, 0.12));
  const dawnBirds = gate(h, 7.55, 9.15, 0.2);
  const wind = 0.22 + 0.78 * gate(h, 12.4, 16.6, 0.8);
  const fulmars = wind > 0.55 ? smooth(0.55, 0.78, wind) : 0;
  const raven = gate(h, 17.12, 18.95, 0.12);
  const flag = fulmars;
  const swell = 0.35 + wind * 0.65 + night * 0.12;
  const { boat, boatT } = boatAt(h);

  let period: Happenings["period"] = "day";
  if (dawn > 0.35) period = "dawn";
  else if (dusk > 0.35) period = "dusk";
  else if (night > 0.55) period = "night";

  let caption = "Thin overcast. The west is a little brighter.";
  if (beam > 0.6 && windowLit < 0.2 && boat === "hidden") {
    caption = "The lamp is the only room still awake.";
  } else if (windowLit > 0.5 && h < 12) {
    caption = "Kitchen window. The keeper is up for the morning watch.";
  } else if (windowLit > 0.5) {
    caption = "A lamp in the kitchen, then the night watch.";
  } else if (raven > 0.4) {
    caption = "A raven on the gallery rail.";
  } else if (dawnBirds > 0.35) {
    caption = "Gulls leaving the west cliff.";
  } else if (fulmars > 0.45) {
    caption = "Fulmars. The wind has got up from the west.";
  } else if (boat === "south" && boatT < 0.55) {
    caption = "A boat on the south reach.";
  } else if (boat === "offing") {
    caption = "Lying off the landing.";
  } else if (boat === "west") {
    caption = "Heading west, toward the fishing.";
  } else if (boat === "return") {
    caption = "The same boat, coming back along the south.";
  } else if (beam > 0.25 && beam < 0.7) {
    caption = "The optic is turning. The sea is becoming the subject.";
  } else if (dusk > 0.4) {
    caption = "The colour is leaving the rock first.";
  } else if (dawn > 0.4) {
    caption = "A dirty gold on the horizon, then the lamp will go out.";
  } else if (h >= 11 && h < 13) {
    caption = "Short shadows. The rock is completely knowable.";
  }

  return {
    night,
    beam,
    windowLit,
    boat,
    boatT,
    dawnBirds,
    fulmars,
    raven,
    flag,
    wind,
    swell,
    caption,
    period,
  };
}

export function formatHour(hour: number) {
  const h = wrapHour(hour);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function periodLabel(period: Happenings["period"]) {
  if (period === "night") return "Night";
  if (period === "dawn") return "Dawn";
  if (period === "dusk") return "Dusk";
  return "Day";
}
