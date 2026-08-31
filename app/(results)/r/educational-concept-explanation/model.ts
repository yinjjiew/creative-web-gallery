/**
 * Exact arithmetic for the two-stratum comparison at the centre of this page.
 *
 * Everything the page draws or prints is derived from integer counts, so any
 * figure on screen can be checked by hand. Comparisons between rates are done
 * by cross-multiplying integers rather than by comparing floats, so "equal"
 * means equal.
 */

export type Cell = { successes: number; total: number };
/** One treatment arm, split into the two kinds of case. */
export type Arm = { small: Cell; large: Cell };
export type Setup = { a: Arm; b: Arm };

/** Smallest number of cases allowed in a stratum while dragging. */
export const MIN_CELL = 25;
/** Vertical extent of the chart, and therefore the range a rate can be dragged to. */
export const Y_MIN = 0.4;
export const Y_MAX = 1;

export function rate(cell: Cell): number {
  return cell.total === 0 ? 0 : cell.successes / cell.total;
}

export function pooled(arm: Arm): Cell {
  return {
    successes: arm.small.successes + arm.large.successes,
    total: arm.small.total + arm.large.total,
  };
}

export function overall(arm: Arm): number {
  return rate(pooled(arm));
}

/** Share of an arm's cases that were small stones — its case mix. */
export function mix(arm: Arm): number {
  const n = arm.small.total + arm.large.total;
  return n === 0 ? 0 : arm.small.total / n;
}

export type Winner = "a" | "b" | "tie";

/** Exact comparison of two rates: no floating point, so ties are real ties. */
export function compareCells(x: Cell, y: Cell): Winner {
  const left = x.successes * y.total;
  const right = y.successes * x.total;
  return left > right ? "a" : left < right ? "b" : "tie";
}

export type Verdict = {
  small: Winner;
  large: Winner;
  overall: Winner;
  /** Same arm wins both strata, and the other arm wins the pooled comparison. */
  reversed: boolean;
  /** Winner of both strata, if there is one. */
  strata: Winner;
  /** Pooled gap in percentage points, signed a − b. */
  gapPoints: number;
};

export function verdict(setup: Setup): Verdict {
  const small = compareCells(setup.a.small, setup.b.small);
  const large = compareCells(setup.a.large, setup.b.large);
  const total = compareCells(pooled(setup.a), pooled(setup.b));
  const strata = small === large ? small : "tie";
  const reversed =
    small === large &&
    small !== "tie" &&
    total !== "tie" &&
    total !== small;
  return {
    small,
    large,
    overall: total,
    reversed,
    strata,
    gapPoints: (overall(setup.a) - overall(setup.b)) * 100,
  };
}

function clampInt(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, Math.round(value)));
}

export function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

export type Rates = { small: number; large: number };

export function ratesOf(arm: Arm): Rates {
  return { small: rate(arm.small), large: rate(arm.large) };
}

/**
 * Move an arm's case mix while holding its total number of cases and — as
 * closely as integers allow — its rate within each stratum. Successes have to be
 * re-rounded to the new denominators, so a line's ends twitch by up to half a
 * case as the mix moves. That twitch is honest: the chart is drawn from counts,
 * not from a remembered rate.
 *
 * `hold` is what keeps the twitch from becoming a drift. A drag is hundreds of
 * calls, and re-reading the rate from the cell each time feeds the previous
 * rounding error into the next one, which ratchets the rate several points
 * across a long drag — the lines would visibly move while the reader was told
 * that only the weights were changing. Callers driving a gesture therefore pass
 * the rates as they stood when the gesture began, and every intermediate value
 * is rounded from those instead of from each other.
 */
export function setMix(arm: Arm, smallTotal: number, hold?: Rates): Arm {
  const n = arm.small.total + arm.large.total;
  const st = clampInt(smallTotal, MIN_CELL, n - MIN_CELL);
  const lt = n - st;
  const sr = hold ? hold.small : rate(arm.small);
  const lr = hold ? hold.large : rate(arm.large);
  return {
    small: { total: st, successes: clampInt(sr * st, Math.ceil(Y_MIN * st), st) },
    large: { total: lt, successes: clampInt(lr * lt, Math.ceil(Y_MIN * lt), lt) },
  };
}

/** Move one stratum's rate by changing its successes, in whole cases. */
export function setRate(cell: Cell, target: number): Cell {
  return {
    total: cell.total,
    successes: clampInt(
      target * cell.total,
      Math.ceil(Y_MIN * cell.total),
      cell.total
    ),
  };
}

export function shiftSuccesses(cell: Cell, delta: number): Cell {
  return {
    total: cell.total,
    successes: clampInt(
      cell.successes + delta,
      Math.ceil(Y_MIN * cell.total),
      cell.total
    ),
  };
}

export function sameSetup(x: Setup, y: Setup): boolean {
  const cells = (s: Setup) =>
    [s.a.small, s.a.large, s.b.small, s.b.large]
      .map((c) => `${c.successes}/${c.total}`)
      .join(" ");
  return cells(x) === cells(y);
}

/* ---------------------------------------------------------------- formatting */

export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function frac(cell: Cell): string {
  return `${cell.successes.toLocaleString("en-US")}/${cell.total.toLocaleString("en-US")}`;
}

export function points(value: number, digits = 1): string {
  const size = Math.abs(value).toFixed(digits);
  return `${size} point${size === "1.0" ? "" : "s"}`;
}
