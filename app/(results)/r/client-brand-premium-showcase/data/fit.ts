/**
 * Sizing: the garment's own measurements, and the arithmetic behind the size
 * recommendation.
 *
 * PROVENANCE. Invented for this reference implementation, but graded as a real
 * coat is: 5 cm of chest between sizes, 1.3 cm of shoulder, 1.5 cm of sleeve,
 * 2 cm of length, and a fixed 17 cm of ease over the body chest, which is a
 * jacket's worth. The recommendation is a weighted nearest-neighbour over
 * garment measurements, computed in the browser; nothing is sent anywhere.
 *
 * The reason the primary route asks about a coat the visitor already owns is
 * that it is the only comparison that removes the guesswork. Body measurements
 * taken at home over a jumper are worth less than a tape laid on a coat that
 * already fits, and this audience has bought coats before.
 */

export type SizeRow = {
  size: string;
  /** Body chest the size is cut for, cm. */
  fitsChest: number;
  /** Garment chest, measured flat and doubled, cm. */
  chest: number;
  /** Shoulder seam to shoulder seam across the back, cm. */
  shoulder: number;
  /** Centre back neck to cuff, sleeve laid straight, cm. */
  sleeve: number;
  /** High point of shoulder to hem, cm. */
  length: number;
  /** Hem circumference, cm. */
  sweep: number;
  /** Coats of this size in the 2026 clip's cut, all four lots together. */
  cutThisClip: number;
};

/** 17 cm over the body chest: room for a jacket, not room to spare. */
export const EASE_CM = 17;

export const SIZES: SizeRow[] = [
  { size: "36", fitsChest: 91, chest: 108, shoulder: 45.5, sleeve: 84.0, length: 108, sweep: 132, cutThisClip: 14 },
  { size: "38", fitsChest: 96, chest: 113, shoulder: 46.8, sleeve: 85.5, length: 110, sweep: 137, cutThisClip: 41 },
  { size: "40", fitsChest: 101, chest: 118, shoulder: 48.1, sleeve: 87.0, length: 112, sweep: 142, cutThisClip: 74 },
  { size: "42", fitsChest: 106, chest: 123, shoulder: 49.4, sleeve: 88.5, length: 114, sweep: 147, cutThisClip: 96 },
  { size: "44", fitsChest: 111, chest: 128, shoulder: 50.7, sleeve: 90.0, length: 116, sweep: 152, cutThisClip: 82 },
  { size: "46", fitsChest: 116, chest: 133, shoulder: 52.0, sleeve: 91.5, length: 118, sweep: 157, cutThisClip: 51 },
  { size: "48", fitsChest: 121, chest: 138, shoulder: 53.3, sleeve: 93.0, length: 120, sweep: 162, cutThisClip: 26 },
];

export type OwnCoat = {
  /** Garment chest of a coat the visitor already owns, cm. */
  chest: number | null;
  shoulder: number | null;
  sleeve: number | null;
  length: number | null;
};

export type Verdict = {
  size: SizeRow;
  /** Signed difference per measurement, our coat minus theirs, cm. */
  deltas: { label: string; ours: number; theirs: number; delta: number }[];
  /** Distance score; lower is closer. */
  score: number;
  /** The runner-up, when it is close enough to be worth naming. */
  alternative: SizeRow | null;
  /** Sleeve alteration we would make free before dispatch, cm. */
  sleeveAdjust: number;
  /** Things the numbers cannot settle. */
  cautions: string[];
};

/**
 * Weights reflect what is actually not alterable. Shoulder is the measurement
 * that cannot be changed on a made coat, so it dominates; sleeve length is
 * trivially adjustable and therefore counts for very little.
 */
const WEIGHTS = { chest: 1, shoulder: 2.4, sleeve: 0.35, length: 0.6 };

export function recommend(own: OwnCoat): Verdict | null {
  const given = (
    [
      ["chest", own.chest],
      ["shoulder", own.shoulder],
      ["sleeve", own.sleeve],
      ["length", own.length],
    ] as const
  ).filter(([, value]) => value !== null && Number.isFinite(value));

  if (!given.length) return null;

  const scored = SIZES.map((row) => {
    let sum = 0;
    let weight = 0;
    for (const [key, value] of given) {
      const delta = row[key] - (value as number);
      sum += WEIGHTS[key] * delta * delta;
      weight += WEIGHTS[key];
    }
    return { row, score: Math.sqrt(sum / weight) };
  }).sort((a, b) => a.score - b.score);

  const best = scored[0];
  const next = scored[1];

  const labels: Record<string, string> = {
    chest: "Chest, flat and doubled",
    shoulder: "Shoulder to shoulder",
    sleeve: "Centre back to cuff",
    length: "Shoulder to hem",
  };

  const deltas = given.map(([key, value]) => ({
    label: labels[key],
    ours: best.row[key],
    theirs: value as number,
    delta: Number((best.row[key] - (value as number)).toFixed(1)),
  }));

  const sleeveDelta = own.sleeve === null ? 0 : best.row.sleeve - own.sleeve;

  const cautions: string[] = [];
  if (own.shoulder === null) {
    cautions.push(
      "You have not given a shoulder measurement, and the shoulder is the one thing we cannot alter afterwards. It is worth going to find the tape."
    );
  }
  const chestDelta = own.chest === null ? 0 : best.row.chest - own.chest;
  if (own.chest !== null && chestDelta < -4) {
    cautions.push(
      `Our nearest size is ${Math.abs(chestDelta).toFixed(1)} cm tighter in the chest than the coat you measured. If that coat is what you wear over a jacket, take the next size up instead.`
    );
  }
  if (own.chest !== null && chestDelta > 6) {
    cautions.push(
      `Our nearest size is ${chestDelta.toFixed(1)} cm roomier than the coat you measured. Ours is cut with 17 cm of ease for a jacket; if you never wear one under a coat, the size below will suit you better.`
    );
  }
  if (Math.abs(sleeveDelta) > 1.5) {
    cautions.push(
      `The sleeve is ${Math.abs(sleeveDelta).toFixed(1)} cm ${sleeveDelta > 0 ? "longer" : "shorter"} than yours. We will ${sleeveDelta > 0 ? `shorten it ${sleeveDelta.toFixed(1)} cm` : `let it down ${Math.abs(sleeveDelta).toFixed(1)} cm, which the cuff allows up to 3 cm`} before it leaves Hawick, at no charge.`
    );
  }
  if (own.length !== null && Math.abs(best.row.length - own.length) > 5) {
    cautions.push(
      `This is a long coat: ${String(best.row.length)} cm from the shoulder, which is ${Math.abs(best.row.length - own.length).toFixed(0)} cm ${best.row.length > own.length ? "longer" : "shorter"} than the one you measured. Length is the thing people are most often surprised by. It comes to just below the knee on someone 178 cm tall.`
    );
  }
  cautions.push(
    "None of this tells us about your shoulder slope, whether you are long in the body, or how you like a coat to sit. That is what the paper pattern is for, and it is free."
  );

  return {
    size: best.row,
    deltas,
    score: Number(best.score.toFixed(2)),
    alternative: next && next.score - best.score < 1.6 ? next.row : null,
    sleeveAdjust: Number(sleeveDelta.toFixed(1)),
    cautions,
  };
}

/** The fallback route, for someone who has no coat to measure. */
export function fromBodyChest(chest: number, overJacket: boolean): SizeRow {
  const target = chest + (overJacket ? EASE_CM : EASE_CM - 5);
  let best = SIZES[0];
  for (const row of SIZES) {
    if (Math.abs(row.chest - target) < Math.abs(best.chest - target)) best = row;
  }
  return best;
}
