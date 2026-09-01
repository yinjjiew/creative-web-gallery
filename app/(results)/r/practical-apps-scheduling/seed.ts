import type {
  Day,
  Half,
  Kind,
  Period,
  Placement,
  Pupil,
  School,
  Visit,
  World,
} from "./model";

/**
 * Modelled spring 2026 term for a travelling violin teacher. The six
 * timetables, sixty-one pupils and the January restructure at St Hilda's
 * are composed for this page — they are not a live school.
 */

function periods(rows: [string, string][]): Period[] {
  return rows.map(([start, end], i) => ({ i, start, end }));
}

const SAME = (rows: [string, string][]) => {
  const list = periods(rows);
  return { autumn: list, spring: list };
};

const SCHOOLS: School[] = [
  {
    id: "oak",
    name: "Oakridge Primary",
    short: "Oakridge",
    stage: "primary",
    days: ["Mon", "Wed"],
    ...SAME([
      ["09:00", "09:50"],
      ["09:55", "10:45"],
      ["11:00", "11:50"],
      ["11:55", "12:45"],
      ["13:20", "14:10"],
      ["14:15", "15:05"],
    ]),
  },
  {
    id: "hilda",
    name: "St Hilda's Grammar",
    short: "St Hilda's",
    stage: "secondary",
    days: ["Tue", "Thu"],
    autumn: periods([
      ["08:50", "09:40"],
      ["09:45", "10:35"],
      ["10:50", "11:40"],
      ["11:45", "12:35"],
      ["13:25", "14:15"],
      ["14:20", "15:10"],
      ["15:15", "16:05"],
    ]),
    spring: periods([
      ["08:40", "09:25"],
      ["09:30", "10:15"],
      ["10:20", "11:05"],
      ["12:15", "13:00"],
      ["13:10", "13:55"],
      ["14:05", "14:50"],
      ["14:55", "15:40"],
    ]),
  },
  {
    id: "calder",
    name: "Calder Vale High",
    short: "Calder Vale",
    stage: "secondary",
    days: ["Wed"],
    ...SAME([
      ["09:00", "10:00"],
      ["10:10", "11:10"],
      ["11:20", "12:20"],
      ["13:10", "14:10"],
      ["14:20", "15:20"],
    ]),
  },
  {
    id: "brigid",
    name: "St Brigid's",
    short: "St Brigid's",
    stage: "secondary",
    days: ["Thu", "Fri"],
    ...SAME([
      ["08:45", "09:35"],
      ["09:40", "10:30"],
      ["10:45", "11:35"],
      ["11:40", "12:30"],
      ["13:20", "14:10"],
      ["14:15", "15:05"],
    ]),
  },
  {
    id: "moor",
    name: "Moorland Junior",
    short: "Moorland",
    stage: "junior",
    days: ["Mon", "Fri"],
    ...SAME([
      ["09:00", "09:50"],
      ["09:55", "10:45"],
      ["11:00", "11:50"],
      ["13:10", "14:00"],
      ["14:05", "14:55"],
      ["15:00", "15:50"],
    ]),
  },
  {
    id: "king",
    name: "King's Meadow Academy",
    short: "King's Meadow",
    stage: "secondary",
    days: ["Tue"],
    ...SAME([
      ["08:45", "09:35"],
      ["09:40", "10:30"],
      ["10:45", "11:35"],
      ["11:40", "12:30"],
      ["13:15", "14:05"],
      ["14:10", "15:00"],
    ]),
  },
];

const AUTUMN_VISITS: Visit[] = [
  { schoolId: "oak", day: "Mon", periods: [0, 1, 2, 3] },
  { schoolId: "moor", day: "Mon", periods: [3, 4, 5] },
  { schoolId: "king", day: "Tue", periods: [0, 1, 2] },
  { schoolId: "hilda", day: "Tue", periods: [3, 4, 5, 6] },
  { schoolId: "calder", day: "Wed", periods: [0, 1, 2, 3, 4] },
  { schoolId: "hilda", day: "Thu", periods: [0, 1, 2, 3] },
  { schoolId: "brigid", day: "Thu", periods: [4, 5] },
  { schoolId: "moor", day: "Fri", periods: [0, 1, 2] },
  { schoolId: "brigid", day: "Fri", periods: [3, 4, 5] },
];

/**
 * St Hilda's January restructure: they take him all day Tuesday (King's
 * Meadow has to give way) and keep him Thursday through a new fifth period
 * that ends at one. Periods shrink to 45 minutes.
 */
const SPRING_VISITS: Visit[] = [
  { schoolId: "oak", day: "Mon", periods: [0, 1, 2, 3] },
  { schoolId: "moor", day: "Mon", periods: [3, 4, 5] },
  { schoolId: "hilda", day: "Tue", periods: [0, 1, 2, 3, 4, 5, 6] },
  { schoolId: "hilda", day: "Wed", periods: [0, 1, 2, 3] },
  { schoolId: "calder", day: "Wed", periods: [0, 1, 2, 3, 4] },
  { schoolId: "hilda", day: "Thu", periods: [0, 1, 2, 3, 4] },
  { schoolId: "brigid", day: "Thu", periods: [4, 5] },
  { schoolId: "moor", day: "Fri", periods: [0, 1, 2] },
  { schoolId: "brigid", day: "Fri", periods: [3, 4, 5] },
];

type Draft = {
  id: string;
  given: string;
  family: string;
  schoolId: string;
  year: number;
  level: number;
  tuesdayOnly?: boolean;
  exam?: { grade: number; when: string };
  ensemble?: boolean;
};

const DRAFTS: Draft[] = [
  { id: "aisha", given: "Aisha", family: "Rahman", schoolId: "oak", year: 5, level: 2 },
  { id: "ben", given: "Ben", family: "Cartwright", schoolId: "oak", year: 4, level: 1 },
  { id: "chloe", given: "Chloe", family: "Nair", schoolId: "oak", year: 6, level: 3 },
  { id: "dylan", given: "Dylan", family: "Hughes", schoolId: "oak", year: 5, level: 2 },
  { id: "ellis", given: "Ellis", family: "Patel", schoolId: "oak", year: 4, level: 1 },
  { id: "freya", given: "Freya", family: "Quinn", schoolId: "oak", year: 6, level: 2 },
  { id: "george", given: "George", family: "Adeyemi", schoolId: "oak", year: 5, level: 3 },
  { id: "holly", given: "Holly", family: "Brice", schoolId: "oak", year: 4, level: 1 },
  { id: "isaac", given: "Isaac", family: "Cole", schoolId: "oak", year: 6, level: 2 },
  { id: "jasmine", given: "Jasmine", family: "Ward", schoolId: "oak", year: 5, level: 1 },

  { id: "maya", given: "Maya", family: "Chen", schoolId: "hilda", year: 8, level: 4 },
  { id: "noah", given: "Noah", family: "Barrett", schoolId: "hilda", year: 9, level: 5 },
  { id: "olivia", given: "Olivia", family: "Grant", schoolId: "hilda", year: 11, level: 7, exam: { grade: 7, when: "03-12" }, ensemble: true },
  { id: "priya", given: "Priya", family: "Shah", schoolId: "hilda", year: 8, level: 4 },
  { id: "quinn", given: "Quinn", family: "Gallagher", schoolId: "hilda", year: 10, level: 6, exam: { grade: 6, when: "03-12" }, ensemble: true },
  { id: "rosa", given: "Rosa", family: "Di Marco", schoolId: "hilda", year: 13, level: 8, exam: { grade: 8, when: "03-19" } },
  { id: "samuel", given: "Samuel", family: "Wright", schoolId: "hilda", year: 9, level: 5 },
  { id: "tamsin", given: "Tamsin", family: "Cole", schoolId: "hilda", year: 7, level: 3, tuesdayOnly: true },
  { id: "uma", given: "Uma", family: "Sharma", schoolId: "hilda", year: 10, level: 5, exam: { grade: 5, when: "03-12" } },
  { id: "victor", given: "Victor", family: "Lang", schoolId: "hilda", year: 12, level: 6, ensemble: true },
  { id: "willa", given: "Willa", family: "Frost", schoolId: "hilda", year: 8, level: 3 },
  { id: "xin", given: "Xin", family: "Wei", schoolId: "hilda", year: 9, level: 4 },
  { id: "yasmin", given: "Yasmin", family: "Ali", schoolId: "hilda", year: 7, level: 3 },
  { id: "zachary", given: "Zachary", family: "Penn", schoolId: "hilda", year: 11, level: 5 },
  { id: "amber", given: "Amber", family: "Lowe", schoolId: "hilda", year: 8, level: 2 },
  { id: "callum", given: "Callum", family: "Reid", schoolId: "hilda", year: 10, level: 4 },
  { id: "diana", given: "Diana", family: "Okonkwo", schoolId: "hilda", year: 12, level: 7 },
  { id: "ethan", given: "Ethan", family: "Brooks", schoolId: "hilda", year: 9, level: 3 },
  { id: "farah", given: "Farah", family: "Malik", schoolId: "hilda", year: 8, level: 3 },
  { id: "georgia", given: "Georgia", family: "Flint", schoolId: "hilda", year: 11, level: 6, exam: { grade: 6, when: "03-19" } },
  { id: "hugo", given: "Hugo", family: "Vane", schoolId: "hilda", year: 7, level: 2 },
  { id: "imogen", given: "Imogen", family: "Kerr", schoolId: "hilda", year: 12, level: 6, ensemble: true },

  { id: "jonah", given: "Jonah", family: "Price", schoolId: "calder", year: 10, level: 5, exam: { grade: 5, when: "03-12" } },
  { id: "keira", given: "Keira", family: "Walsh", schoolId: "calder", year: 9, level: 3 },
  { id: "leo", given: "Leo", family: "Nkrumah", schoolId: "calder", year: 13, level: 8, exam: { grade: 8, when: "03-19" } },
  { id: "maeve", given: "Maeve", family: "O'Brien", schoolId: "calder", year: 11, level: 4 },
  { id: "nathan", given: "Nathan", family: "Kim", schoolId: "calder", year: 8, level: 2 },
  { id: "orla", given: "Orla", family: "Flynn", schoolId: "calder", year: 10, level: 3 },
  { id: "patrick", given: "Patrick", family: "Seo", schoolId: "calder", year: 12, level: 5 },
  { id: "ruby", given: "Ruby", family: "Langton", schoolId: "calder", year: 9, level: 4 },
  { id: "soren", given: "Soren", family: "Blake", schoolId: "calder", year: 11, level: 6 },

  { id: "tara", given: "Tara", family: "Singh", schoolId: "brigid", year: 10, level: 6, exam: { grade: 6, when: "03-12" } },
  { id: "usman", given: "Usman", family: "Khan", schoolId: "brigid", year: 8, level: 2 },
  { id: "violet", given: "Violet", family: "Hart", schoolId: "brigid", year: 11, level: 4 },
  { id: "will", given: "Will", family: "Pemberton", schoolId: "brigid", year: 9, level: 3 },
  { id: "xanthe", given: "Xanthe", family: "Rowe", schoolId: "brigid", year: 12, level: 5 },
  { id: "yusuf", given: "Yusuf", family: "Demir", schoolId: "brigid", year: 7, level: 2 },
  { id: "zara", given: "Zara", family: "Connolly", schoolId: "brigid", year: 10, level: 3 },
  { id: "alice", given: "Alice", family: "Fenwick", schoolId: "brigid", year: 8, level: 4 },
  { id: "brodie", given: "Brodie", family: "Nash", schoolId: "brigid", year: 11, level: 5 },
  { id: "cora", given: "Cora", family: "Bell", schoolId: "brigid", year: 9, level: 2 },

  { id: "dai", given: "Dai", family: "Jones", schoolId: "moor", year: 5, level: 1 },
  { id: "esme", given: "Esme", family: "Clark", schoolId: "moor", year: 6, level: 2 },
  { id: "finlay", given: "Finlay", family: "Ross", schoolId: "moor", year: 4, level: 1 },
  { id: "greta", given: "Greta", family: "Holm", schoolId: "moor", year: 6, level: 2 },
  { id: "harun", given: "Harun", family: "Aziz", schoolId: "moor", year: 5, level: 1 },
  { id: "ivy", given: "Ivy", family: "Moon", schoolId: "moor", year: 4, level: 1 },

  { id: "jules", given: "Jules", family: "Hartmann", schoolId: "king", year: 8, level: 3 },
  { id: "kate", given: "Kate", family: "Obi", schoolId: "king", year: 9, level: 4 },
  { id: "lucan", given: "Lucan", family: "Grey", schoolId: "king", year: 10, level: 5 },
  { id: "martha", given: "Martha", family: "Peng", schoolId: "king", year: 7, level: 2 },
];

type Seat = {
  id: string;
  pupilIds: string[];
  schoolId: string;
  day: Day;
  period: number;
  half: Half;
  kind: Kind;
};

const SEATS: Seat[] = [
  { id: "oak-pair-a", pupilIds: ["aisha", "dylan"], schoolId: "oak", day: "Mon", period: 0, half: "a", kind: "pair" },
  { id: "oak-ben", pupilIds: ["ben"], schoolId: "oak", day: "Mon", period: 0, half: "b", kind: "solo" },
  { id: "oak-pair-b", pupilIds: ["chloe", "george"], schoolId: "oak", day: "Mon", period: 1, half: "a", kind: "pair" },
  { id: "oak-ellis", pupilIds: ["ellis"], schoolId: "oak", day: "Mon", period: 1, half: "b", kind: "solo" },
  { id: "oak-freya", pupilIds: ["freya"], schoolId: "oak", day: "Mon", period: 2, half: "a", kind: "solo" },
  { id: "oak-holly", pupilIds: ["holly"], schoolId: "oak", day: "Mon", period: 2, half: "b", kind: "solo" },
  { id: "oak-isaac", pupilIds: ["isaac"], schoolId: "oak", day: "Mon", period: 3, half: "a", kind: "solo" },
  { id: "oak-jasmine", pupilIds: ["jasmine"], schoolId: "oak", day: "Mon", period: 3, half: "b", kind: "solo" },

  { id: "moor-dai", pupilIds: ["dai"], schoolId: "moor", day: "Mon", period: 3, half: "a", kind: "solo" },
  { id: "moor-esme", pupilIds: ["esme"], schoolId: "moor", day: "Mon", period: 3, half: "b", kind: "solo" },
  { id: "moor-greta", pupilIds: ["greta"], schoolId: "moor", day: "Mon", period: 4, half: "a", kind: "solo" },
  { id: "moor-harun", pupilIds: ["harun"], schoolId: "moor", day: "Mon", period: 4, half: "b", kind: "solo" },
  { id: "moor-ivy", pupilIds: ["ivy"], schoolId: "moor", day: "Fri", period: 0, half: "a", kind: "solo" },
  { id: "moor-finlay", pupilIds: ["finlay"], schoolId: "moor", day: "Mon", period: 5, half: "b", kind: "solo" },

  { id: "king-jules", pupilIds: ["jules"], schoolId: "king", day: "Tue", period: 0, half: "a", kind: "solo" },
  { id: "king-kate", pupilIds: ["kate"], schoolId: "king", day: "Tue", period: 0, half: "b", kind: "solo" },
  { id: "king-lucan", pupilIds: ["lucan"], schoolId: "king", day: "Tue", period: 1, half: "a", kind: "solo" },
  { id: "king-martha", pupilIds: ["martha"], schoolId: "king", day: "Tue", period: 1, half: "b", kind: "solo" },

  { id: "hil-pair-maya", pupilIds: ["maya", "priya"], schoolId: "hilda", day: "Tue", period: 3, half: "a", kind: "pair" },
  { id: "hil-pair-noah", pupilIds: ["noah", "samuel"], schoolId: "hilda", day: "Tue", period: 3, half: "b", kind: "pair" },
  { id: "hil-pair-xin", pupilIds: ["xin", "callum"], schoolId: "hilda", day: "Tue", period: 4, half: "a", kind: "pair" },
  { id: "hil-rosa", pupilIds: ["rosa"], schoolId: "hilda", day: "Tue", period: 4, half: "b", kind: "solo" },
  { id: "hil-ens", pupilIds: ["olivia", "quinn", "victor", "imogen"], schoolId: "hilda", day: "Tue", period: 5, half: "a", kind: "ensemble" },
  { id: "hil-tamsin", pupilIds: ["tamsin"], schoolId: "hilda", day: "Tue", period: 5, half: "b", kind: "solo" },
  { id: "hil-extra-rosa", pupilIds: ["rosa"], schoolId: "hilda", day: "Tue", period: 6, half: "a", kind: "extra" },
  { id: "hil-extra-georgia", pupilIds: ["georgia"], schoolId: "hilda", day: "Tue", period: 6, half: "b", kind: "extra" },

  { id: "hil-pair-farah", pupilIds: ["farah", "yasmin"], schoolId: "hilda", day: "Thu", period: 0, half: "a", kind: "pair" },
  { id: "hil-pair-willa", pupilIds: ["willa", "ethan"], schoolId: "hilda", day: "Thu", period: 0, half: "b", kind: "pair" },
  { id: "hil-uma", pupilIds: ["uma"], schoolId: "hilda", day: "Thu", period: 1, half: "a", kind: "solo" },
  { id: "hil-zachary", pupilIds: ["zachary"], schoolId: "hilda", day: "Thu", period: 1, half: "b", kind: "solo" },
  { id: "hil-amber", pupilIds: ["amber"], schoolId: "hilda", day: "Thu", period: 2, half: "a", kind: "solo" },
  { id: "hil-diana", pupilIds: ["diana"], schoolId: "hilda", day: "Thu", period: 2, half: "b", kind: "solo" },
  { id: "hil-hugo", pupilIds: ["hugo"], schoolId: "hilda", day: "Thu", period: 3, half: "a", kind: "solo" },
  { id: "hil-georgia", pupilIds: ["georgia"], schoolId: "hilda", day: "Thu", period: 3, half: "b", kind: "solo" },

  { id: "cal-pair", pupilIds: ["maeve", "ruby"], schoolId: "calder", day: "Wed", period: 0, half: "a", kind: "pair" },
  { id: "cal-jonah", pupilIds: ["jonah"], schoolId: "calder", day: "Wed", period: 0, half: "b", kind: "solo" },
  { id: "cal-leo", pupilIds: ["leo"], schoolId: "calder", day: "Wed", period: 1, half: "a", kind: "solo" },
  { id: "cal-keira", pupilIds: ["keira"], schoolId: "calder", day: "Wed", period: 1, half: "b", kind: "solo" },
  { id: "cal-nathan", pupilIds: ["nathan"], schoolId: "calder", day: "Wed", period: 2, half: "a", kind: "solo" },
  { id: "cal-orla", pupilIds: ["orla"], schoolId: "calder", day: "Wed", period: 2, half: "b", kind: "solo" },
  { id: "cal-patrick", pupilIds: ["patrick"], schoolId: "calder", day: "Wed", period: 3, half: "a", kind: "solo" },
  { id: "cal-soren", pupilIds: ["soren"], schoolId: "calder", day: "Wed", period: 3, half: "b", kind: "solo" },
  { id: "cal-extra-jonah", pupilIds: ["jonah"], schoolId: "calder", day: "Wed", period: 4, half: "a", kind: "extra" },
  { id: "cal-extra-leo", pupilIds: ["leo"], schoolId: "calder", day: "Wed", period: 4, half: "b", kind: "extra" },

  { id: "bri-tara", pupilIds: ["tara"], schoolId: "brigid", day: "Thu", period: 4, half: "a", kind: "solo" },
  { id: "bri-usman", pupilIds: ["usman"], schoolId: "brigid", day: "Thu", period: 4, half: "b", kind: "solo" },
  { id: "bri-violet", pupilIds: ["violet"], schoolId: "brigid", day: "Thu", period: 5, half: "a", kind: "solo" },
  { id: "bri-will", pupilIds: ["will"], schoolId: "brigid", day: "Thu", period: 5, half: "b", kind: "solo" },
  { id: "bri-pair", pupilIds: ["xanthe", "brodie"], schoolId: "brigid", day: "Fri", period: 3, half: "a", kind: "pair" },
  { id: "bri-yusuf", pupilIds: ["yusuf"], schoolId: "brigid", day: "Fri", period: 3, half: "b", kind: "solo" },
  { id: "bri-zara", pupilIds: ["zara"], schoolId: "brigid", day: "Fri", period: 4, half: "a", kind: "solo" },
  { id: "bri-alice", pupilIds: ["alice"], schoolId: "brigid", day: "Fri", period: 4, half: "b", kind: "solo" },
  { id: "bri-cora", pupilIds: ["cora"], schoolId: "brigid", day: "Fri", period: 5, half: "a", kind: "solo" },
  { id: "bri-extra-tara", pupilIds: ["tara"], schoolId: "brigid", day: "Fri", period: 5, half: "b", kind: "extra" },

  { id: "moor-fri-spare-a", pupilIds: ["dai"], schoolId: "moor", day: "Fri", period: 0, half: "a", kind: "extra" },
];

function shiftWindows(autumn: number[], schoolId: string): number[] {
  if (schoolId !== "hilda") return autumn;
  // January protected-lesson reshuffle: almost no overlap with the old frees.
  return autumn.map((period) => (period + 3) % 7).filter((period, i, all) => all.indexOf(period) === i);
}

function buildPupils(seats: Seat[]): Pupil[] {
  const seated: Record<string, number[]> = {};
  for (const seat of seats) {
    for (const id of seat.pupilIds) {
      seated[id] = seated[id] ?? [];
      if (!seated[id].includes(seat.period)) seated[id].push(seat.period);
    }
  }
  return DRAFTS.map((draft) => {
    const autumn = (seated[draft.id] ?? [1]).slice();
    // One or two other frees, so autumn seating is not the only legal window.
    const extra = (autumn[0] + 2) % (draft.schoolId === "hilda" ? 7 : 6);
    if (!autumn.includes(extra)) autumn.push(extra);
    if (draft.schoolId === "moor" && draft.id !== "finlay") {
      // Finlay is deliberately on last period. Others must not be free then
      // if we ever move them there — they are free of last period.
    }
    return {
      id: draft.id,
      given: draft.given,
      family: draft.family,
      schoolId: draft.schoolId,
      year: draft.year,
      level: draft.level,
      young: draft.year <= 6,
      tuesdayOnly: Boolean(draft.tuesdayOnly),
      exam: draft.exam ?? null,
      ensemble: Boolean(draft.ensemble),
      windows: {
        autumn,
        spring: shiftWindows(autumn, draft.schoolId),
      },
    };
  });
}

export function buildWorld(): World {
  const autumn: Placement[] = SEATS.filter((seat) => seat.id !== "moor-fri-spare-a").map(
    (seat) => ({ ...seat }),
  );
  return {
    schools: SCHOOLS,
    pupils: buildPupils(autumn),
    visits: { autumn: AUTUMN_VISITS, spring: SPRING_VISITS },
    required: {
      autumn: [],
      spring: [{ schoolId: "hilda", day: "Wed", periods: [0, 1, 2, 3] }],
    },
    travel: [
      { a: "hilda", b: "brigid", minutes: 25 },
      { a: "hilda", b: "calder", minutes: 20 },
      { a: "oak", b: "moor", minutes: 15 },
      { a: "king", b: "hilda", minutes: 12 },
      { a: "moor", b: "brigid", minutes: 18 },
    ],
    autumn,
  };
}

export const PROVENANCE =
  "Modelled spring 2026 term. Sixty-one pupils and six period structures, composed for this page. Not a live school.";

export const JANUARY_COPY = {
  title: "St Hilda's, January",
  body: "They shortened every period to forty-five minutes — a second lesson no longer fits. They want him all day Tuesday, so King's Meadow has to give way. They have given him the music room Wednesday first and second period, which sits on top of Calder Vale. They keep him Thursday through a new fifth period that ends at one o'clock. The run to St Brigid's is then twenty minutes. It needs twenty-five. Protected lessons moved, so the old pull-out windows close.",
};
