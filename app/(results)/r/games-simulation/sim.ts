/**
 * Two populations in a jar: yeasts and lactic acid bacteria.
 *
 * What is modelled, and why it is not arbitrary:
 *
 *   Yeasts (Kazachstania humilis, Saccharomyces) make most of the carbon
 *   dioxide that raises dough, plus ethanol. Their growth optimum sits near
 *   26–28 °C. They slow hard above ~34 °C and almost stop in the fridge.
 *   Undissociated acetic acid and a pH below ~3.6 inhibit them.
 *
 *   Lactic acid bacteria — Fructilactobacillus sanfranciscensis
 *   (heterofermentative) and companions such as Lactiplantibacillus plantarum
 *   (homofermentative) — acidify the jar. Their optimum is warmer, about
 *   30–34 °C. They tolerate a lower pH than the yeasts. Heterofermentative
 *   species yield lactic acid, acetic acid, some CO₂ and ethanol; the share
 *   of acetic acid rises in the cool and in a stiff paste, which is why a
 *   windowsill starter tastes sharper than a warm, loose one, and why
 *   warmth is not merely "faster."
 *
 *   Flour is food. Rye and whole wheat carry more ash and amylase than
 *   white, so both populations, and especially the bacteria, move sooner.
 *   A wet jar favours yeast; a stiff one favours acetic character.
 *
 *   Feeding dilutes acids and cells and adds sugar in proportion to the
 *   flour. A 1:5:5 feed therefore peaks later and milder than 1:1:1 — more
 *   yeast generations on a cleaner, hungrier paste — which is what bakers
 *   report, not a scoring rule.
 *
 *   pH of a just-fed mix sits near 6; a ripe starter near 3.8–4.2; a
 *   neglected one can sink toward 3.5. Those ranges are typical published
 *   values for home cultures, not a reading from this jar.
 *
 * Numbers inside the integration are scaled so a 1:2:2 white feed on the
 * counter doubles in about four to six hours. They are a model, not a
 * measurement.
 */

export type Flour = "white" | "wheat" | "rye";
export type Place = "fridge" | "sill" | "counter" | "warm";

export type Culture = {
  yeast: number;
  lab: number;
  sugar: number;
  lactic: number;
  acetic: number;
  ethanol: number;
  hydration: number;
  temp: number;
  place: Place;
  flour: Flour;
  gas: number;
  hoursSinceFeed: number;
  ageHours: number;
  feedCount: number;
  lastRatio: number;
};

export const STEP_HOURS = 1 / 12;
/** Watching at the table: eight minutes of culture per real second. */
export const WATCH_HOURS_PER_SEC = 8 / 60;

export const FLOUR_NAME: Record<Flour, string> = {
  white: "white",
  wheat: "whole wheat",
  rye: "rye",
};

export const PLACE_NAME: Record<Place, string> = {
  fridge: "the fridge",
  sill: "the windowsill",
  counter: "the counter",
  warm: "the warm spot",
};

const PLACE_TEMP: Record<Place, number> = {
  fridge: 4,
  sill: 17,
  counter: 21.5,
  warm: 29.5,
};

export function clamp(n: number, lo: number, hi: number) {
  return n < lo ? lo : n > hi ? hi : n;
}

function smooth(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** North-facing sill: cooler at night, a little warmer after noon. */
export function sillTemp(hour: number): number {
  return 17 + 2.4 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
}

export function placeTemp(place: Place, hour: number): number {
  if (place === "sill") return sillTemp(hour);
  return PLACE_TEMP[place];
}

/**
 * Bell around an optimum, wider on the cold side. Yeast die faster in heat
 * than bacteria do; that asymmetry is the whole flavour argument.
 */
function tempBell(T: number, opt: number, cold: number, hot: number) {
  const w = T < opt ? cold : hot;
  const x = (T - opt) / w;
  return Math.exp(-0.5 * x * x);
}

export function yeastTemp(T: number) {
  return tempBell(T, 27, 10, 5.6);
}

export function labTemp(T: number) {
  return tempBell(T, 32, 9, 6);
}

/**
 * Heterofermentative acetate share. Cooler and stiffer → more vinegar.
 * Warm and wet → mostly lactic, the yogurt note.
 */
export function aceticShare(T: number, hydration: number) {
  const cool = clamp((28 - T) / 16, 0, 1);
  const stiff = clamp((95 - hydration) / 45, 0, 1);
  return clamp(0.16 + 0.38 * cool + 0.2 * stiff, 0.12, 0.68);
}

export function phOf(c: Culture) {
  const acid = c.lactic + 1.28 * c.acetic;
  return clamp(6.55 - 2.5 * Math.log10(1 + 11 * acid), 3.25, 6.5);
}

function flourBoost(flour: Flour) {
  if (flour === "rye") return { yeast: 1.1, lab: 1.32, sugar: 1.22 };
  if (flour === "wheat") return { yeast: 1.05, lab: 1.16, sugar: 1.08 };
  return { yeast: 1, lab: 0.9, sugar: 0.92 };
}

export function volumeOf(c: Culture) {
  return clamp(0.9 + c.gas, 0.68, 2.55);
}

export function hoochOf(c: Culture) {
  if (c.hydration < 82) return 0;
  if (c.sugar > 0.1) return 0;
  if (c.hoursSinceFeed < 16 && volumeOf(c) > 1.35) return 0;
  if (c.hoursSinceFeed < 12) return 0;
  return clamp((0.1 - c.sugar) * 2.2 + (c.hoursSinceFeed - 11) * 0.028, 0, 0.55);
}

export function seedCulture(): Culture {
  return {
    yeast: 0.38,
    lab: 0.82,
    sugar: 0.14,
    lactic: 0.52,
    acetic: 0.28,
    ethanol: 0.34,
    hydration: 100,
    temp: 21.5,
    place: "counter",
    flour: "white",
    gas: 0.08,
    hoursSinceFeed: 16,
    ageHours: 16,
    feedCount: 0,
    lastRatio: 2,
  };
}

export function step(c: Culture, dt: number): Culture {
  const T = c.temp;
  const pH = phOf(c);
  const flour = flourBoost(c.flour);
  const yT = yeastTemp(T);
  const lT = labTemp(T);
  const share = aceticShare(T, c.hydration);

  const pHYeast = smooth(3.28, 3.92, pH);
  const pHLab = 0.22 + 0.78 * smooth(3.18, 3.68, pH);
  const hydY = 0.7 + 0.3 * smooth(55, 112, c.hydration);
  const hydL = 0.8 + 0.2 * (1 - smooth(58, 115, c.hydration));

  const food = clamp(c.sugar, 0, 1.6);
  const crowd = 1 / (1 + (c.yeast + c.lab) * 0.09);
  const inoculum = 0.32 + 0.68 * smooth(0.05, 0.28, c.yeast + c.lab);
  const lag = (0.22 + 0.78 * smooth(0.25, 1.5, c.hoursSinceFeed)) * inoculum;

  const yGrow =
    0.74 * c.yeast * food * yT * pHYeast * hydY * flour.yeast * crowd * lag;
  const lGrow =
    0.8 * c.lab * food * lT * pHLab * hydL * flour.lab * crowd * lag;

  const starve = food < 0.1 ? (0.1 - food) * 1.45 : 0;
  const acidHurtY = (1 - pHYeast) * 0.16;
  const heatHurtY = T > 34 ? (T - 34) * 0.08 : 0;
  const yDie = c.yeast * (0.014 + starve * 1.05 + acidHurtY + heatHurtY);
  const lDie = c.lab * (0.007 + starve * 0.32 + (pH < 3.35 ? 0.04 : 0));

  const eat =
    0.2 * c.yeast * food * yT + 0.175 * c.lab * food * lT * flour.lab;

  const acidMade = 0.46 * c.lab * food * lT * flour.lab * pHLab;
  const lacticAdd = acidMade * (1 - share);
  const aceticAdd = acidMade * share + 0.01 * c.yeast * food;
  const ethanolAdd = 0.06 * c.yeast * food * yT + 0.014 * c.lab * food * share;

  const yCO2 = 1.85 * c.yeast * food * yT * pHYeast * lag;
  const lCO2 = 0.22 * c.lab * food * share * lT;
  const leak =
    0.03 +
    0.16 * clamp(c.gas - 1.05, 0, 1.2) +
    0.22 * clamp((3.95 - pH) / 0.7, 0, 1) +
    (food < 0.09 ? 0.2 : 0) +
    (c.hydration > 118 ? 0.04 : 0);
  const gas = Math.max(0, (c.gas + (yCO2 + lCO2) * dt) * (1 - leak * dt));

  return {
    ...c,
    yeast: clamp(c.yeast + (yGrow - yDie) * dt, 0.008, 10),
    lab: clamp(c.lab + (lGrow - lDie) * dt, 0.02, 12),
    sugar: clamp(c.sugar - eat * dt, 0.002, 1.8),
    lactic: clamp(c.lactic + lacticAdd * dt, 0.01, 4),
    acetic: clamp(c.acetic + aceticAdd * dt, 0.005, 3),
    ethanol: clamp(c.ethanol + ethanolAdd * dt - 0.01 * dt, 0, 2.4),
    gas,
    hoursSinceFeed: c.hoursSinceFeed + dt,
    ageHours: c.ageHours + dt,
    temp: T,
  };
}

export function advance(c: Culture, hours: number, hourOfDay: number): Culture {
  let next = { ...c, temp: placeTemp(c.place, hourOfDay) };
  const n = Math.max(1, Math.round(hours / STEP_HOURS));
  const dt = hours / n;
  let clock = hourOfDay;
  for (let i = 0; i < n; i++) {
    clock = (clock + dt) % 24;
    next = step({ ...next, temp: placeTemp(next.place, clock) }, dt);
  }
  return next;
}

export function feed(
  c: Culture,
  ratio: number,
  hydration: number,
  flour: Flour,
): Culture {
  const r = clamp(ratio, 0.5, 8);
  const hyd = clamp(hydration, 50, 130);
  const water = r * (hyd / 100);
  const total = 1 + r + water;
  const d = 1 / total;
  const boost = flourBoost(flour);
  const fresh = boost.sugar * (r / total) * 2.15;

  return {
    ...c,
    yeast: clamp(c.yeast * d, 0.008, 10),
    lab: clamp(c.lab * d, 0.02, 12),
    sugar: clamp(c.sugar * d + fresh, 0.2, 1.8),
    lactic: clamp(c.lactic * d, 0.01, 4),
    acetic: clamp(c.acetic * d, 0.005, 3),
    ethanol: clamp(c.ethanol * d * 0.4, 0, 2),
    hydration: hyd,
    flour,
    gas: c.gas * d * 0.35,
    hoursSinceFeed: 0,
    feedCount: c.feedCount + 1,
    lastRatio: r,
  };
}

export function moveTo(c: Culture, place: Place, hour: number): Culture {
  return { ...c, place, temp: placeTemp(place, hour) };
}

export function stir(c: Culture): Culture {
  return { ...c, gas: c.gas * 0.62 };
}

export type RiseWord = "slack" | "level" | "domed" | "doubled" | "fallen";

export function riseWord(c: Culture): RiseWord {
  const v = volumeOf(c);
  const hungry = c.sugar < 0.1 && c.hoursSinceFeed > 8;
  if (hungry && v < 1.35) return "fallen";
  if (v >= 1.95) return "doubled";
  if (v >= 1.45) return "domed";
  if (v >= 1.08) return "level";
  return "slack";
}

export function smellOf(c: Culture): string {
  const acid = c.lactic + c.acetic;
  const ace = c.acetic / Math.max(0.04, acid);
  const hooch = hoochOf(c);
  if (hooch > 0.18 && c.ethanol > 0.28) {
    return "alcohol, like beer left out";
  }
  if (c.sugar < 0.08 && c.hoursSinceFeed > 20 && acid > 0.9) {
    return "harsh, a little acetone";
  }
  if (ace > 0.42 && acid > 0.45) return "sharp, vinegar";
  if (c.lactic > 0.55 && ace < 0.28 && acid > 0.4) return "yogurt, clean sour";
  if (acid < 0.28 && c.sugar > 0.45) return "sweet flour, almost nothing";
  if (acid < 0.35) return "mild, like wet wheat";
  if (ace > 0.4 && acid > 0.45) return "ripe, with a vinegar edge";
  return "ripe, a little tangy";
}

export function ripeForOven(c: Culture) {
  const v = volumeOf(c);
  return v >= 1.7 && c.sugar > 0.08 && c.hoursSinceFeed >= 2.5 && phOf(c) > 3.7;
}

export type Loaf = {
  spring: number;
  openness: number;
  sour: number;
  aceticFrac: number;
  crust: number;
  under: boolean;
  over: boolean;
  notes: string[];
  line: string;
};

export function bakeLoaf(c: Culture): Loaf {
  const pH = phOf(c);
  const yT = yeastTemp(c.temp);
  const vigor =
    clamp(c.yeast / 0.5, 0, 2.1) * yT * clamp((pH - 3.32) / 0.7, 0.05, 1);
  const acid = c.lactic + c.acetic;
  const ace = c.acetic / Math.max(0.05, acid);
  const vol = volumeOf(c);
  const young =
    c.hoursSinceFeed < 2.4 ||
    (c.hoursSinceFeed < 6 && vol < 1.32 && c.sugar > 0.5);
  const under = young;
  const over =
    (c.sugar < 0.1 && c.hoursSinceFeed > 8) ||
    pH < 3.62 ||
    riseWord(c) === "fallen";

  let spring = clamp(vigor * (0.52 + 0.38 * clamp(c.sugar * 1.2, 0, 1)), 0, 1);
  if (under) spring *= 0.4;
  if (over) spring *= 0.48;
  if (c.feedCount < 1) spring *= 0.5;

  const openness = clamp(spring * (1 - 0.35 * clamp((acid - 0.5) / 1.2, 0, 1)), 0, 1);
  const sour = clamp(acid / 1.8, 0, 1);
  const crust = clamp(0.28 + c.sugar * 0.45 + (c.flour === "white" ? 0 : 0.12), 0, 1);

  const notes: string[] = [];
  if (c.feedCount < 1) {
    notes.push("Baked from the neglected jar. The yeasts were already tired.");
  } else if (under) {
    notes.push("The culture was young. Not enough yeast yet — a close crumb.");
  } else if (over) {
    notes.push("The culture had fallen. Acids ahead of the yeasts; less spring.");
  } else if (ripeForOven(c)) {
    notes.push("Caught it while it was still domed. The yeasts were working.");
  } else {
    notes.push("Somewhere between peak and hunger. The loaf records that.");
  }

  if (ace > 0.4 && sour > 0.35) {
    notes.push("Vinegar on the nose — the cool, or the stiff paste, favoured acetic acid.");
  } else if (c.lactic > 0.5 && ace < 0.28 && sour > 0.3) {
    notes.push("Yogurt sour. Warmth kept the lactic bacteria ahead of the yeasts.");
  } else if (sour < 0.22) {
    notes.push("Mild. The acids never had time to build, or they were diluted by a large feed.");
  } else {
    notes.push("A balanced tang — neither yogurt nor vinegar winning outright.");
  }

  if (c.flour === "rye") {
    notes.push("Rye fed the bacteria as well as the yeasts. More flavour, and more acid.");
  } else if (c.flour === "wheat") {
    notes.push("Whole wheat brought bran and ash. The jar moved faster than white would.");
  }

  if (c.place === "fridge" && c.hoursSinceFeed > 8) {
    notes.push("A cold jar keeps, but it does not raise well until it is warm and fed again.");
  }

  let line: string;
  if (spring > 0.62 && sour < 0.45 && !under && !over) {
    line = "An open loaf. The culture was kept, not merely stored.";
  } else if (spring > 0.5 && ace > 0.4) {
    line = "It rose, and it is sharp. Cooler keeping, or a stiff jar.";
  } else if (spring > 0.5 && ace < 0.28 && sour > 0.32) {
    line = "It rose, and it tastes of yogurt. The jar was warm.";
  } else if (under) {
    line = "Dense. The yeasts had not yet built their numbers.";
  } else if (over || spring < 0.28) {
    line = "A tight loaf, very sour. The culture had gone past useful.";
  } else {
    line = "A serviceable loaf. The jar is still teaching you its pace.";
  }

  return { spring, openness, sour, aceticFrac: ace, crust, under, over, notes, line };
}

export function clockLabel(hour: number) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  const hr = h % 12 === 0 ? 12 : h % 12;
  const pad = m < 10 ? `0${m}` : `${m}`;
  const ampm = h < 12 ? "in the morning" : h < 17 ? "in the afternoon" : h < 21 ? "in the evening" : "at night";
  if (m === 0) {
    if (h === 0) return "midnight";
    if (h === 12) return "noon";
    return `${hr} ${ampm}`;
  }
  return `${hr}:${pad} ${ampm}`;
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
