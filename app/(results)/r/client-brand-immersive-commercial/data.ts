/**
 * NATT NT 14 — Bruxelles-Midi 19:22 → Berlin Hbf 06:22.
 *
 * Fares, times and carbon are modelled on published European night-train
 * practice in 2025 (Nightjet Comfort, European Sleeper, SJ Euronight) and
 * typical short-haul air plus a mid city hotel. NATT is a fictional operator
 * written for the brief. Nothing here is a live tariff or a measured trip.
 */

export const SERVICE = {
  operator: "NATT",
  number: "NT 14",
  hours: 11,
  minutes: 660,
  from: {
    city: "Brussels",
    station: "Bruxelles-Midi",
    time: "19:22",
    country: "Belgium",
  },
  to: {
    city: "Berlin",
    station: "Berlin Hbf",
    time: "06:22",
    country: "Germany",
  },
  car: 12,
  compartment: 12,
} as const;

export const FARES = {
  lower: { id: "lower", name: "Lower berth, shared", eur: 134 },
  upper: { id: "upper", name: "Upper berth, shared", eur: 134 },
  solo: { id: "solo", name: "Compartment to yourself", eur: 248 },
} as const;

export type FareId = keyof typeof FARES;

export const COMPARE = {
  flightEur: 49,
  flightHours: "1 h 20",
  hotelEur: 128,
  hotelNote: "a mid three-star, walking distance of Berlin Hbf",
  combinedEur: 177,
  carbonFlightKg: 118,
  carbonTrainKg: 6,
} as const;

export const BERTH = {
  bunkW: 70,
  bunkL: 190,
  sitting: 96,
  corridor: 68,
  cases: 2,
} as const;

export type Hour = {
  t: number;
  clock: string;
  place: string;
  land: string;
  dining: string;
  note: string;
};

export const HOURS: Hour[] = [
  {
    t: 0,
    clock: "19:22",
    place: "Bruxelles-Midi",
    land: "Belgium",
    dining:
      "The dining car is two cars toward the locomotive, last sitting 21:10. A table for two if you are two; a counter if you are one.",
    note: "You still have the evening. Dinner, then the compartment.",
  },
  {
    t: 0.16,
    clock: "21:10",
    place: "After Leuven",
    land: "Belgium",
    dining:
      "Last sitting. If you are still in the dining car, finish. The kitchen closes on the minute.",
    note: "The seats by the window fold into the lower berth. This takes four minutes, not a ritual.",
  },
  {
    t: 0.28,
    clock: "22:28",
    place: "Liège-Guillemins",
    land: "Belgium",
    dining:
      "Kitchen closed. A cold plate is in the box under the basin if you boarded late: cheese, bread, an apple.",
    note: "The first hour in the bunk you will hear every joint. That is normal. It stops being interesting.",
  },
  {
    t: 0.52,
    clock: "01:06",
    place: "Aachen",
    land: "Germany",
    dining: "Nothing is being served. Water is in the carafe.",
    note: "You have changed country. Nobody knocks. The attendant has the list. If a check happens they take the document at the door and you stay in bed.",
  },
  {
    t: 0.76,
    clock: "04:50",
    place: "Before Hannover",
    land: "Germany",
    dining: "The corridor is still dark. Breakfast is not yet.",
    note: "This is the hour people actually sleep. The rhythm is dull on purpose.",
  },
  {
    t: 0.88,
    clock: "05:50",
    place: "Wolfsburg",
    land: "Germany",
    dining:
      "A bag at the door: a roll, cheese, jam, coffee in a paper cup. It is not a hotel breakfast. It is enough.",
    note: "The light is the pale one. Berlin is half an hour.",
  },
  {
    t: 0.96,
    clock: "06:22",
    place: "Berlin Hbf",
    land: "Germany",
    dining: "Coffee is finished. The cup goes in the bag.",
    note: "You have the morning. The flight would have given you a hotel lobby and a taxi.",
  },
];

export const MARKS = [
  { t: 0, clock: "19:22", name: "Brussels" },
  { t: 0.28, clock: "22:28", name: "Liège" },
  { t: 0.52, clock: "01:06", name: "Aachen" },
  { t: 0.88, clock: "05:50", name: "Wolfsburg" },
  { t: 1, clock: "06:22", name: "Berlin" },
] as const;

export function hourAt(night: number): Hour {
  const t = clamp01(night);
  let current = HOURS[0];
  for (const hour of HOURS) {
    if (t >= hour.t) current = hour;
  }
  return current;
}

export function clockAt(night: number): string {
  const minutes = Math.round(19 * 60 + 22 + clamp01(night) * SERVICE.minutes);
  const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function datesFrom(start: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export const COPY = {
  claim: "Go to sleep here. Wake up there.",
  strap: "Pull the night",
  strapDone: "The morning is at the bottom",
  flight:
    "The flight is ninety minutes and a third of the price. Everyone on this page already knows that.",
  compare:
    "The only comparison that is fair is the flight plus the hotel night you would have bought. That night is the journey.",
  sleep:
    "You can sleep. Not hotel sleep. The bunk is seventy centimetres wide and you will feel the first hour. Earplugs are in the kit. The lower berth is quieter; the upper is darker and you climb. Most people arrive having slept enough. A few do not, and they take the dining car coffee and walk into the morning anyway. Overselling this produces the reviews that kill a night train.",
  berth:
    "A two-berth compartment, not a cabin on a cruise. Two bunks, a washbasin whose cover is the shelf, two seats that become the lower bed, a ladder, a lock, a radiator you cannot fully kill, a vent in the window. Luggage: two large cases stand at the foot; a third goes on the rack. No weight theatre at a desk.",
  access:
    "One wheelchair compartment on this train, car 14, ensuite toilet, a berth that is already made. It is booked by telephone so the attendant meets the door. The corridor is sixty-eight centimetres. The dining car has a twelve-centimetre step. If that is your compartment, do not use the form on this page.",
  carbon:
    "About a twentieth of the flight, modelled from typical short-haul and electric-rail factors. That is not why people book. It is why they mention it later.",
  provenance:
    "Times, fares and carbon are modelled on published European night-train practice, 2025. NATT is a fictional operator written for this brief. Not a live tariff.",
} as const;
