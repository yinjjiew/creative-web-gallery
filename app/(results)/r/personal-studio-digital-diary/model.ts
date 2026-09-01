/**
 * Everything derived from the diary, computed once at module load.
 *
 * The diary is stored one way — a list of mornings — and read three ways: by
 * place, by date, and by the things that keep happening. All three indexes are
 * built here so no view has to know how the others work.
 *
 * Counts shown in the interface are all computed from the text, never asserted
 * by hand. If a motif says it appears nineteen times, that is nineteen matches
 * in the notes.
 */
import { DIARY, type DiaryDay, type Note } from "./diary";
import { STATIONS, type StationId } from "./route-data";

export const YEAR_START = "2023-10-02";
export const YEAR_END = "2024-09-30";

const MS_PER_DAY = 86_400_000;

/** ISO date → UTC timestamp. UTC throughout, so a weekday never drifts. */
export function stamp(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

const START = stamp(YEAR_START);
const END = stamp(YEAR_END);

/** Days from the first morning of the year to this one. */
export function offset(iso: string): number {
  return Math.round((stamp(iso) - START) / MS_PER_DAY);
}

export const YEAR_LENGTH = offset(YEAR_END) + 1;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function parts(iso: string) {
  const d = new Date(stamp(iso));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    dayOfMonth: d.getUTCDate(),
    weekday: d.getUTCDay(),
  };
}

/** "Tuesday 14 November" — no year, because the year is the whole subject. */
export function longDate(iso: string): string {
  const p = parts(iso);
  return `${WEEKDAYS[p.weekday]} ${String(p.dayOfMonth)} ${MONTHS[p.month]}`;
}

/** "14 Nov" for margins and strips. */
export function shortDate(iso: string): string {
  const p = parts(iso);
  return `${String(p.dayOfMonth)} ${MONTHS[p.month].slice(0, 3)}`;
}

export function monthName(month: number): string {
  return MONTHS[month];
}

/* ── the colour of the time of year ───────────────────────────────────────── */

/**
 * Twelve dyed-paper colours, one per month, interpolated by day. Used for the
 * small marks in date margins and on the year strips: scroll one place down
 * through its year and the marks walk round the calendar.
 *
 * Deliberately desaturated and close in lightness — it is a wayfinding aid on
 * a page of text, and it is never the only way to read a date, which is always
 * printed alongside.
 */
const MONTH_INK: [number, number, number][] = [
  [111, 125, 136], // January — cold slate
  [107, 123, 131], // February
  [116, 128, 111], // March — grey green
  [125, 138, 94], // April
  [134, 144, 79], // May
  [139, 141, 71], // June — olive
  [154, 139, 70], // July — dry gold
  [160, 131, 67], // August
  [156, 119, 66], // September
  [143, 106, 68], // October — rust
  [124, 98, 73], // November — dead leaf
  [109, 112, 118], // December — cold grey
];

export function seasonInk(iso: string): string {
  const p = parts(iso);
  const daysInMonth = new Date(Date.UTC(p.year, p.month + 1, 0)).getUTCDate();
  const through = (p.dayOfMonth - 1) / daysInMonth;
  const a = MONTH_INK[p.month];
  const b = MONTH_INK[(p.month + 1) % 12];
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * through));
  return `rgb(${mix.map(String).join(" ")})`;
}

/* ── the diary, indexed ───────────────────────────────────────────────────── */

export const DAYS: DiaryDay[] = [...DIARY].sort((a, b) =>
  a.date < b.date ? -1 : 1,
);

export const DAY_BY_DATE = new Map(DAYS.map((d) => [d.date, d]));
export const DATES: string[] = DAYS.map((d) => d.date);

export function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The notes are stored with typewriter apostrophes, which keeps the motif
 * patterns simple, and are typeset on the way to the page. Every apostrophe in
 * the diary is a contraction or a possessive — there is no quoted speech in it —
 * so a blanket substitution is safe.
 */
export function typeset(text: string): string {
  return text.replace(/'/g, "\u2019");
}

/** Words written on each morning, all its notes together. */
export const WORDS_BY_DATE = new Map(
  DAYS.map((d) => [d.date, d.notes.reduce((n, note) => n + words(note.text), 0)]),
);

export const MOST_WORDS = Math.max(...WORDS_BY_DATE.values());

export type Standing = {
  date: string;
  note: Note;
};

/** Every morning that produced a note at a given place, in date order. */
export const BY_STATION: Record<StationId, Standing[]> = Object.fromEntries(
  STATIONS.map((s) => [s.id, [] as Standing[]]),
) as Record<StationId, Standing[]>;

for (const d of DAYS) {
  for (const note of d.notes) BY_STATION[note.at].push({ date: d.date, note });
}

export type StationStats = {
  /** Mornings with a note here. */
  mornings: number;
  /** The longest run of consecutive written mornings with nothing said here. */
  silence: { mornings: number; from: string; to: string } | null;
};

function statsFor(id: StationId): StationStats {
  const noted = new Set(BY_STATION[id].map((s) => s.date));
  let best: StationStats["silence"] = null;
  let run = 0;
  let runStart = "";
  for (let i = 0; i <= DATES.length; i++) {
    const date = DATES[i];
    const quiet = i < DATES.length && !noted.has(date);
    if (quiet) {
      if (run === 0) runStart = date;
      run++;
      continue;
    }
    if (run > 0 && (!best || run > best.mornings)) {
      best = { mornings: run, from: runStart, to: DATES[i - 1] };
    }
    run = 0;
  }
  return { mornings: noted.size, silence: best };
}

export const STATION_STATS: Record<StationId, StationStats> = Object.fromEntries(
  STATIONS.map((s) => [s.id, statsFor(s.id)]),
) as Record<StationId, StationStats>;

/* ── the things that keep happening ──────────────────────────────────────── */

/**
 * Motifs are matched against the text rather than tagged by hand, so a count in
 * the interface is a fact about the prose. The gloss is fixed; the arithmetic
 * is not.
 */
export type Motif = {
  id: string;
  label: string;
  gloss: string;
  test: RegExp;
};

export const MOTIFS: Motif[] = [
  {
    id: "heron",
    label: "the heron",
    gloss:
      "Sometimes there. She counts him without ever admitting she is counting.",
    test: /heron/i,
  },
  {
    id: "mattress",
    label: "the mattress",
    gloss:
      "In the cut from November. Nobody comes for it. It ends up measuring the year.",
    test: /mattress/i,
  },
  {
    id: "radio",
    label: "the man with the radio",
    gloss:
      "Walks the other way, at the iron bridge, most mornings. For four months they only nod.",
    test: /radio/i,
  },
  {
    id: "dog",
    label: "the dog at Verity's",
    gloss:
      "A lurcher on four feet of chain. She calls him Grey because nobody has told her otherwise.",
    test: /lurcher|Bruno|\bGrey\b|\bthe dog\b|\bnew dog\b|\bdog['’]s\b/,
  },
  {
    id: "train",
    label: "the 06:52",
    gloss:
      "Over the iron bridge. She times the walk by it, and notices most when it isn't there.",
    test: /06:52|\btrains?\b/i,
  },
  {
    id: "ice",
    label: "ice, frost and snow",
    gloss: "The cold arriving at the water, the ginnel, the bins and the rail.",
    test: /\b(?:ice|iced|icicles?|frost|frosty|frozen|snow)\b/i,
  },
  {
    id: "minutes",
    label: "the clock",
    gloss:
      "The walk is supposed to take twenty minutes. She writes a number down when something is off — her, or the train.",
    test: /\b(?:\w+|\d+)[- ]minutes\b|\btwenty minutes\b/i,
  },
  {
    id: "swans",
    label: "the swans",
    gloss: "A nest on the far bank in April, and the arithmetic afterwards.",
    test: /\b(?:swan|swans|cygnet|cygnets|cygnet['’]s)\b/i,
  },
  {
    id: "redcoat",
    label: "the woman in the red coat",
    gloss: "Twice in the year. Both times on the footbridge.",
    test: /red coat/i,
  },
  {
    id: "hesper",
    label: "Hesper",
    gloss: "A narrowboat that moored below the iron bridge in June, and then didn't.",
    test: /Hesper/,
  },
  {
    id: "notgraffiti",
    label: "IT'S NOT",
    gloss:
      "Two words in white paint on a railway girder, then a green oblong where they were.",
    test: /IT['’]S NOT/,
  },
  {
    id: "dad",
    label: "Dad",
    gloss: "He got as far as bridge 41 once, on the afternoon of Boxing Day.",
    test: /\bDad\b|\bDad['’]s\b/,
  },
];

export type MotifHit = Standing;

export const MOTIF_HITS: Record<string, MotifHit[]> = Object.fromEntries(
  MOTIFS.map((m) => [
    m.id,
    DAYS.flatMap((d) =>
      d.notes.filter((n) => m.test.test(n.text)).map((note) => ({ date: d.date, note })),
    ),
  ]),
);

export const TOTAL_NOTES = DAYS.reduce((n, d) => n + d.notes.length, 0);
export const TOTAL_WORDS = [...WORDS_BY_DATE.values()].reduce((a, b) => a + b, 0);

/** Month buckets across the diary year, for the calendar. */
export type MonthBlock = {
  key: string;
  year: number;
  month: number;
  /** ISO dates for every calendar day of the month inside the diary year. */
  days: string[];
};

export const MONTH_BLOCKS: MonthBlock[] = (() => {
  const blocks: MonthBlock[] = [];
  for (let t = START; t <= END; t += MS_PER_DAY) {
    const d = new Date(t);
    const iso = d.toISOString().slice(0, 10);
    const key = iso.slice(0, 7);
    let block = blocks[blocks.length - 1];
    if (!block || block.key !== key) {
      block = {
        key,
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        days: [],
      };
      blocks.push(block);
    }
    block.days.push(iso);
  }
  return blocks;
})();

/** Position of a date along the year, 0 at the first morning, 1 at the last. */
export function alongYear(iso: string): number {
  return offset(iso) / (YEAR_LENGTH - 1);
}

export function neighbourDate(iso: string, step: number): string | null {
  const i = DATES.indexOf(iso);
  if (i < 0) return null;
  return DATES[i + step] ?? null;
}
