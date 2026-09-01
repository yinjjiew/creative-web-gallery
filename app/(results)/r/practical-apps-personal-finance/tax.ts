/**
 * UK sole-trader income tax and Class 4 National Insurance, on the cash basis.
 *
 * Rates and thresholds are the published HMRC figures for the tax years named
 * below — see the provenance note rendered at the foot of the page. Everything
 * here is a pure function of an integer profit in pence, so the same profit
 * always produces the same liability to the penny.
 *
 * Scope, stated plainly because a tax calculation that hides its assumptions is
 * worse than none: one self-employed trade, no employment income, no savings or
 * dividend income, no student loan, not VAT registered, rest-of-UK rates rather
 * than Scottish, and the cash basis (money in and out on the day it moves),
 * which has been the default for sole traders since 2024/25. Class 2 NI is not
 * charged: since 2024/25 the self-employed with profits above the small profits
 * threshold get the contributory benefit without paying it.
 */
import { applyBps, gbp, type Day, type Pence, day } from "./money";

export type Bands = {
  /** `2025/26` */
  label: string;
  /** Calendar year the tax year opens in: 2025 for 2025/26. */
  startYear: number;
  starts: Day;
  ends: Day;
  personalAllowance: Pence;
  /** Allowance falls £1 for every £2 of profit above this. */
  taperFrom: Pence;
  /** Taxable income up to here is basic rate. */
  basicLimit: Pence;
  /** Taxable income up to here is higher rate; above it, additional rate. */
  higherLimit: Pence;
  basicBps: number;
  higherBps: number;
  additionalBps: number;
  class4Lower: Pence;
  class4Upper: Pence;
  class4MainBps: number;
  class4UpperBps: number;
  /** False where the year's rates are an assumption rather than a published figure. */
  published: boolean;
};

function bandsFor(startYear: number, published: boolean): Bands {
  return {
    label: `${String(startYear)}/${String((startYear + 1) % 100).padStart(2, "0")}`,
    startYear,
    starts: day(`${String(startYear)}-04-06`),
    ends: day(`${String(startYear + 1)}-04-05`),
    personalAllowance: gbp("12570"),
    taperFrom: gbp("100000"),
    basicLimit: gbp("37700"),
    higherLimit: gbp("125140"),
    basicBps: 2000,
    higherBps: 4000,
    additionalBps: 4500,
    class4Lower: gbp("12570"),
    class4Upper: gbp("50270"),
    class4MainBps: 600,
    class4UpperBps: 200,
    published,
  };
}

/**
 * 2024/25 and 2025/26 carry published rates. 2026/27 is the same numbers
 * carried forward, which is an assumption and is labelled as one wherever a
 * 2026/27 figure appears.
 */
export const TAX_YEARS: Bands[] = [
  bandsFor(2023, true),
  bandsFor(2024, true),
  bandsFor(2025, true),
  bandsFor(2026, false),
];

export function taxYearStarting(startYear: number): Bands {
  const found = TAX_YEARS.find((year) => year.startYear === startYear);
  if (!found) throw new Error(`no rates for ${String(startYear)}/…`);
  return found;
}

/** The tax year a given day falls in, identified by its opening calendar year. */
export function taxYearOf(value: Day): number {
  const found = TAX_YEARS.find((year) => value >= year.starts && value <= year.ends);
  if (found) return found.startYear;
  throw new Error(`no tax year covers day ${String(value)}`);
}

export function taxYearLabel(startYear: number): string {
  return taxYearStarting(startYear).label;
}

function allowanceFor(profit: Pence, bands: Bands): Pence {
  if (profit <= bands.taperFrom) return bands.personalAllowance;
  const lost = Math.floor((profit - bands.taperFrom) / 2);
  return Math.max(0, bands.personalAllowance - lost);
}

export type Liability = {
  profit: Pence;
  allowance: Pence;
  taxable: Pence;
  basic: Pence;
  higher: Pence;
  additional: Pence;
  incomeTax: Pence;
  class4Main: Pence;
  class4Upper: Pence;
  class4: Pence;
  total: Pence;
};

/** Full working, not just the answer, so the interface can show every step. */
export function liabilityOn(profit: Pence, bands: Bands): Liability {
  const allowance = allowanceFor(profit, bands);
  const taxable = Math.max(0, profit - allowance);

  const inBasic = Math.min(taxable, bands.basicLimit);
  const inHigher = Math.min(
    Math.max(0, taxable - bands.basicLimit),
    bands.higherLimit - bands.basicLimit
  );
  const inAdditional = Math.max(0, taxable - bands.higherLimit);

  const basic = applyBps(inBasic, bands.basicBps);
  const higher = applyBps(inHigher, bands.higherBps);
  const additional = applyBps(inAdditional, bands.additionalBps);
  const incomeTax = basic + higher + additional;

  const overLower = Math.max(0, Math.min(profit, bands.class4Upper) - bands.class4Lower);
  const overUpper = Math.max(0, profit - bands.class4Upper);
  const class4Main = applyBps(overLower, bands.class4MainBps);
  const class4UpperPart = applyBps(overUpper, bands.class4UpperBps);

  return {
    profit,
    allowance,
    taxable,
    basic: inBasic,
    higher: inHigher,
    additional: inAdditional,
    incomeTax,
    class4Main,
    class4Upper: class4UpperPart,
    class4: class4Main + class4UpperPart,
    total: incomeTax + class4Main + class4UpperPart,
  };
}

/**
 * The tax that one more pound of profit creates, given where the year already
 * stands. This — not the headline rate — is the honest answer to "how much of
 * this invoice is the taxman's", and it is why the answer changes through the
 * year: an invoice that straddles the personal allowance is partly untaxed.
 */
export function taxOnExtra(profitSoFar: Pence, extra: Pence, bands: Bands): Pence {
  return liabilityOn(profitSoFar + extra, bands).total - liabilityOn(profitSoFar, bands).total;
}

/** Marginal rate in basis points at the current position, measured on the next £100. */
export function marginalBps(profitSoFar: Pence, bands: Bands): number {
  const probe = gbp("100");
  return Math.round((taxOnExtra(profitSoFar, probe, bands) * 10_000) / probe);
}

/**
 * Payments on account. Each instalment is half the previous year's liability;
 * the pair is forced to sum to that liability exactly so an odd penny cannot go
 * missing. HMRC does not ask for payments on account at all if the previous
 * liability was under £1,000.
 */
export const POA_FLOOR: Pence = gbp("1000");

export function paymentsOnAccount(previousLiability: Pence): [Pence, Pence] {
  if (previousLiability < POA_FLOOR) return [0, 0];
  const first = Math.round(previousLiability / 2);
  return [first, previousLiability - first];
}

export type TaxPaymentKind = "poa1" | "poa2" | "balancing";

export type TaxPayment = {
  id: string;
  /** Tax year the payment relates to, by opening calendar year. */
  forYear: number;
  kind: TaxPaymentKind;
  due: Day;
  amount: Pence;
  /**
   * `filed` — the amount is on a submitted return and cannot move.
   * `projected` — it depends on a tax year that has not closed yet.
   */
  certainty: "filed" | "projected";
  label: string;
};

/** 31 January after the tax year ends: the balancing payment and first instalment. */
export function januaryAfter(startYear: number): Day {
  return day(`${String(startYear + 2)}-01-31`);
}

/** 31 July after the tax year ends: the second instalment. */
export function julyAfter(startYear: number): Day {
  return day(`${String(startYear + 2)}-07-31`);
}

/**
 * Builds the dated payment schedule for one tax year from its own liability and
 * the previous year's.
 *
 * The shape of this is the thing that catches her out, so it is worth stating:
 * the two instalments for year Y are due on 31 January and 31 July *during*
 * year Y+1, and are sized on year Y−1, which she may have earned much less in.
 * The balancing payment for Y then lands on the same 31 January as the first
 * instalment for Y+1, which is why one January bill can be one and a half
 * years' worth of tax.
 */
export function scheduleFor(
  startYear: number,
  liability: Pence,
  previousLiability: Pence,
  certainty: "filed" | "projected",
  /** Instalments are sized on the previous year, so they inherit its certainty. */
  previousCertainty: "filed" | "projected"
): TaxPayment[] {
  const [first, second] = paymentsOnAccount(previousLiability);
  const label = taxYearLabel(startYear);
  const out: TaxPayment[] = [];
  if (first > 0) {
    out.push({
      id: `${label}-poa1`,
      forYear: startYear,
      kind: "poa1",
      due: januaryAfter(startYear - 1),
      amount: first,
      certainty: previousCertainty,
      label: `${label} — first payment on account`,
    });
  }
  if (second > 0) {
    out.push({
      id: `${label}-poa2`,
      forYear: startYear,
      kind: "poa2",
      due: julyAfter(startYear - 1),
      amount: second,
      certainty: previousCertainty,
      label: `${label} — second payment on account`,
    });
  }
  const balancing = liability - first - second;
  if (balancing !== 0) {
    out.push({
      id: `${label}-balancing`,
      forYear: startYear,
      kind: "balancing",
      due: januaryAfter(startYear),
      amount: balancing,
      certainty,
      label:
        balancing > 0
          ? `${label} — balancing payment`
          : `${label} — overpaid, refund due`,
    });
  }
  return out;
}
