/**
 * Every published figure used on this page, with its source.
 *
 * PUBLISHED (real):
 *   KIDNEY_STONES  — success counts for open surgery and percutaneous
 *                    nephrolithotomy, split by stone size. Charig, Webb, Payne
 *                    & Wickham, BMJ 292(6524): 879–882 (1986), as tabulated by
 *                    stone size in Julious & Mullee, "Confounding and Simpson's
 *                    paradox", BMJ 309(6967): 1480–1481 (1994). Cases are
 *                    divided at a stone diameter of 2 cm.
 *   BERKELEY       — applicants and admissions for the six largest graduate
 *                    departments at the University of California, Berkeley,
 *                    autumn 1973. Bickel, Hammel & O'Connell, "Sex bias in
 *                    graduate admissions: data from Berkeley", Science
 *                    187(4175): 398–404 (1975). The same counts are distributed
 *                    with R as the `UCBAdmissions` dataset. Department names
 *                    were not published; the paper labels them A–F.
 *   BERKELEY_WIDE  — the university-wide 1973 figures quoted in the same paper.
 *                    Percentages are as published; admitted counts are not
 *                    reproduced here because the paper gives the university-wide
 *                    figures as rounded percentages, and inventing the integers
 *                    would be inventing data.
 *
 * ILLUSTRATIVE (invented, and labelled as such wherever it appears):
 *   the presets other than "published", and the three prediction exercises.
 */
import { setMix, type Setup } from "./model";

export const KIDNEY_STONES: Setup = {
  a: {
    small: { successes: 81, total: 87 },
    large: { successes: 192, total: 263 },
  },
  b: {
    small: { successes: 234, total: 270 },
    large: { successes: 55, total: 80 },
  },
};

export const ARM_A = {
  name: "Open surgery",
  short: "Surgery",
  note: "the stone removed through an incision",
} as const;

export const ARM_B = {
  name: "Percutaneous nephrolithotomy",
  short: "PCNL",
  note: "the stone removed through a narrow tract in the back",
} as const;

export const STRATA = {
  small: { name: "small stones", axis: "under 2 cm" },
  large: { name: "large stones", axis: "2 cm and over" },
} as const;

export type Preset = {
  id: string;
  label: string;
  note: string;
  real: boolean;
  setup: Setup;
};

/**
 * The three invented presets are built by re-mixing the published arms, so the
 * counts stay internally consistent and the stratum rates stay recognisable.
 */
export const PRESETS: Preset[] = [
  {
    id: "published",
    label: "Published figures",
    note: "Charig et al. 1986, split by stone size",
    real: true,
    setup: KIDNEY_STONES,
  },
  {
    id: "matched",
    label: "Same case mix",
    note: "both treatments given half small, half large",
    real: false,
    setup: {
      a: setMix(KIDNEY_STONES.a, 175),
      b: setMix(KIDNEY_STONES.b, 175),
    },
  },
  {
    id: "pulled",
    label: "Mixes pulled apart",
    note: "surgery given almost only large stones, PCNL almost only small",
    real: false,
    setup: {
      a: setMix(KIDNEY_STONES.a, 25),
      b: setMix(KIDNEY_STONES.b, 325),
    },
  },
  {
    id: "wide",
    label: "Gap too wide to reverse",
    note: "surgery's worse group beats PCNL's better one",
    real: false,
    setup: {
      a: {
        small: { successes: 190, total: 200 },
        large: { successes: 135, total: 150 },
      },
      b: {
        small: { successes: 120, total: 200 },
        large: { successes: 83, total: 150 },
      },
    },
  },
];

export type Question = {
  id: string;
  prompt: string;
  setup: Setup;
  options: { id: string; label: string }[];
  answer: string;
  /** Shown after answering. Arithmetic only; the numbers come from `setup`. */
  because: string[];
  lesson: string;
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt:
      "Surgery treats 400 cases, only 40 of them small stones. PCNL treats 400 cases, 360 of them small stones. Surgery does better than PCNL within small stones and within large stones. Which treatment has the higher success rate overall?",
    setup: {
      a: {
        small: { successes: 37, total: 40 },
        large: { successes: 263, total: 360 },
      },
      b: {
        small: { successes: 312, total: 360 },
        large: { successes: 28, total: 40 },
      },
    },
    options: [
      { id: "a", label: "Open surgery" },
      { id: "b", label: "PCNL" },
      { id: "tie", label: "Exactly equal" },
    ],
    answer: "b",
    because: [
      "Surgery: 37/40 = 92.5% on small stones, 263/360 = 73.1% on large. Both better than PCNL's 312/360 = 86.7% and 28/40 = 70.0%.",
      "Surgery overall: (37 + 263)/(40 + 360) = 300/400 = 75.0%.",
      "PCNL overall: (312 + 28)/(360 + 40) = 340/400 = 85.0%.",
    ],
    lesson:
      "Surgery's patients sit almost entirely in the harder group, so its overall rate is dragged down towards its large-stone rate. PCNL's is pulled up towards its small-stone rate. The 10-point gap runs the wrong way.",
  },
  {
    id: "q2",
    prompt:
      "Now both treatments have the same case mix — one case in ten is a small stone — but surgery treated 1,000 patients and PCNL only 250. Surgery again does better within small stones and within large stones. Which has the higher rate overall?",
    setup: {
      a: {
        small: { successes: 90, total: 100 },
        large: { successes: 630, total: 900 },
      },
      b: {
        small: { successes: 20, total: 25 },
        large: { successes: 150, total: 225 },
      },
    },
    options: [
      { id: "a", label: "Open surgery" },
      { id: "b", label: "PCNL" },
      { id: "tie", label: "Exactly equal" },
    ],
    answer: "a",
    because: [
      "Surgery: 90/100 = 90.0% and 630/900 = 70.0%; overall 720/1,000 = 72.0%.",
      "PCNL: 20/25 = 80.0% and 150/225 = 66.7%; overall 170/250 = 68.0%.",
      "Both mixes are 0.1 small stones, so both overall rates are 0.1 × (small rate) + 0.9 × (large rate) — the same average of each treatment's own two rates.",
    ],
    lesson:
      "Unequal totals cannot cause a reversal on their own. When the two mixes are identical the overall difference is a weighted average of the two within-group differences, and an average of two positive numbers is positive. It is the difference in mix that does the damage, never the difference in size.",
  },
  {
    id: "q3",
    prompt:
      "Surgery succeeds in 190/200 small-stone cases (95.0%) and 135/150 large-stone cases (90.0%). PCNL succeeds in 120/200 (60.0%) and 83/150 (55.3%). Is there any case mix — any split of each treatment's patients between small and large stones — that would make PCNL look better overall?",
    setup: PRESETS[3].setup,
    options: [
      { id: "yes", label: "Yes, with a lopsided enough mix" },
      { id: "no", label: "No, it is impossible" },
    ],
    answer: "no",
    because: [
      "An overall rate is an average of the two group rates, so it always lies between them.",
      "Surgery's overall rate is therefore never below 90.0%, its worse group.",
      "PCNL's is never above 60.0%, its better group. 90.0 > 60.0 at every mix.",
    ],
    lesson:
      "A reversal needs the two treatments' group rates to overlap. When one treatment's worst group beats the other's best group, no reweighting can close the distance, because reweighting can only move an average inside its own range.",
  },
];

/* --------------------------------------------------------------- Berkeley */

export type Department = {
  code: string;
  men: { admitted: number; applied: number };
  women: { admitted: number; applied: number };
};

export const BERKELEY: Department[] = [
  { code: "A", men: { admitted: 512, applied: 825 }, women: { admitted: 89, applied: 108 } },
  { code: "B", men: { admitted: 353, applied: 560 }, women: { admitted: 17, applied: 25 } },
  { code: "C", men: { admitted: 120, applied: 325 }, women: { admitted: 202, applied: 593 } },
  { code: "D", men: { admitted: 138, applied: 417 }, women: { admitted: 131, applied: 375 } },
  { code: "E", men: { admitted: 53, applied: 191 }, women: { admitted: 94, applied: 393 } },
  { code: "F", men: { admitted: 22, applied: 373 }, women: { admitted: 24, applied: 341 } },
];

export const BERKELEY_WIDE = {
  menApplied: 8442,
  menPercent: 44,
  womenApplied: 4321,
  womenPercent: 35,
} as const;

export function berkeleyTotals() {
  const sum = (pick: (d: Department) => { admitted: number; applied: number }) =>
    BERKELEY.reduce(
      (acc, d) => ({
        admitted: acc.admitted + pick(d).admitted,
        applied: acc.applied + pick(d).applied,
      }),
      { admitted: 0, applied: 0 }
    );
  return { men: sum((d) => d.men), women: sum((d) => d.women) };
}

/** Departments ordered by their combined admission rate, highest first. */
export function berkeleyByRate(): (Department & { rate: number; applied: number })[] {
  return BERKELEY.map((d) => {
    const applied = d.men.applied + d.women.applied;
    const admitted = d.men.admitted + d.women.admitted;
    return { ...d, applied, rate: admitted / applied };
  }).sort((x, y) => y.rate - x.rate);
}
