/**
 * The projection.
 *
 * Three ideas do all the work here.
 *
 * 1. An invoice is a dated probable promise. Its arrival day is not the day the
 *    contract says; it is derived from how that client has actually paid her
 *    before. Three days come out of that — the fastest they have managed, the
 *    middle of what they do, and the slowest — which is why the forecast is a
 *    band and not a line.
 *
 * 2. Tax accrues continuously and is paid in lumps. At any moment there is a
 *    figure that is in her account and is not hers, and the projection draws it
 *    as a floor underneath the cash rather than as a bill in the diary. Running
 *    out of money is one failure; quietly spending January's tax in October is
 *    the failure she actually keeps having.
 *
 * 3. Everything is integer pence and integer days, recomputed from the controls
 *    on every pass. No running total is carried between renders, so a control
 *    swept out and back produces identical arithmetic rather than nearly
 *    identical arithmetic.
 */
import {
  addDays,
  day,
  gbp,
  medianInt,
  monthlyOccurrences,
  type Day,
  type Pence,
} from "./money";
import {
  liabilityOn,
  marginalBps,
  scheduleFor,
  taxYearOf,
  taxYearStarting,
  type Bands,
  type Liability,
  type TaxPayment,
} from "./tax";
import {
  ACCOUNTS,
  AGREED_WORK,
  anyClientById,
  BRIGHT_FIELD,
  CLIENTS,
  COMMITTED,
  EVERYTHING_ELSE_MONTHS,
  FILED,
  FIXED_RECEIPTS,
  ONE_OFF_EXPENSES,
  OPEN_INVOICES,
  OPENING_CASH,
  PAID_INVOICES,
  SHOP_HISTORY,
  SHOP_PAYOUT_DAY,
  TODAY,
  type Client,
} from "./scenario";

export type PathKey = "fast" | "expected" | "slow";
export const PATHS: readonly PathKey[] = ["fast", "expected", "slow"] as const;

export const PATH_NAMES: Record<PathKey, string> = {
  fast: "if everyone pays at their best",
  expected: "if everyone pays the way they usually do",
  slow: "if everyone pays at their worst",
};

/**
 * The model always spans two whole tax years regardless of how far forward she
 * is looking, because the tax figures must not move when she changes the chart's
 * horizon. A liability that shifted when you zoomed out would be a bug that
 * looked like a feature.
 */
export const MODEL_START: Day = day("2025-04-06");
export const MODEL_END: Day = day("2027-04-05");
export const SPAN = MODEL_END - TODAY + 1;

/** Tax years the projection reasons about. 2023/24 is settled and left alone. */
const YEARS_IN_PLAY = [2024, 2025, 2026] as const;

// ─── how a client actually pays ───────────────────────────────────────────────

export type LagBasis = "observed" | "thin" | "none";

export type Observation = { ref: string; work: string; amount: Pence; lag: number; paid: Day };

export type LagProfile = {
  client: Client;
  observations: Observation[];
  basis: LagBasis;
  /** Days from invoice to cash on each path. */
  lag: Record<PathKey, number>;
  rule: string;
};

/**
 * The estimation rule, stated in one place because it is the one piece of
 * inference in the whole program and it should be possible to argue with it.
 *
 * Three or more paid invoices: the window is the fastest, the median and the
 * slowest she has actually seen. Nothing is smoothed or extrapolated.
 *
 * One or two: too thin to describe a range, so the window is deliberately
 * pessimistic — best case is the contract terms, likely case is the worst she
 * has seen, worst case a further month on top — and it is labelled as thin.
 *
 * None at all: contract terms, terms plus a month, terms plus two. This is a
 * guess and the interface says so rather than drawing it like the others.
 */
export function lagProfileFor(client: Client, observations: Observation[]): LagProfile {
  const lags = observations.map((o) => o.lag);
  if (lags.length >= 3) {
    return {
      client,
      observations,
      basis: "observed",
      lag: {
        fast: Math.min(...lags),
        expected: medianInt(lags),
        slow: Math.max(...lags),
      },
      rule: `${String(lags.length)} paid invoices: fastest ${String(Math.min(...lags))} days, median ${String(medianInt(lags))}, slowest ${String(Math.max(...lags))}.`,
    };
  }
  if (lags.length >= 1) {
    const worst = Math.max(...lags);
    return {
      client,
      observations,
      basis: "thin",
      lag: { fast: client.termsDays, expected: worst, slow: worst + 30 },
      rule: `Only ${String(lags.length)} paid invoice${lags.length === 1 ? "" : "s"} — too thin for a range. Best case is the ${String(client.termsDays)}-day terms, likely case the ${String(worst)} days they took, worst case a further month.`,
    };
  }
  return {
    client,
    observations,
    basis: "none",
    lag: {
      fast: client.termsDays,
      expected: client.termsDays + 30,
      slow: client.termsDays + 60,
    },
    rule: `No paid invoice to judge by. The window is the ${String(client.termsDays)}-day terms, a month over, and two months over — a guess, not an estimate.`,
  };
}

export function buildLagProfiles(): Record<string, LagProfile> {
  const out: Record<string, LagProfile> = {};
  for (const client of [...CLIENTS, BRIGHT_FIELD]) {
    const observations: Observation[] = PAID_INVOICES.filter(
      (inv) => inv.clientId === client.id
    )
      .map((inv) => ({
        ref: inv.ref,
        work: inv.work,
        amount: inv.amount,
        lag: inv.paid - inv.issued,
        paid: inv.paid,
      }))
      .sort((a, b) => a.lag - b.lag);
    out[client.id] = lagProfileFor(client, observations);
  }
  return out;
}

export const LAG_PROFILES = buildLagProfiles();

// ─── receipts ────────────────────────────────────────────────────────────────

export type Certainty = "known" | "observed" | "thin" | "none";

export type ProjectedReceipt = {
  id: string;
  clientName: string;
  ref: string;
  work: string;
  amount: Pence;
  amountByPath: Record<PathKey, Pence>;
  dayByPath: Record<PathKey, Day>;
  issued: Day | null;
  termsDays: number | null;
  kind: "invoice" | "royalty" | "shop" | "agreed" | "whatif";
  certainty: Certainty;
  taxable: boolean;
  /** True where the fast window has already passed and the date had to be pushed. */
  windowPassed: boolean;
  note?: string;
};

/**
 * An invoice older than every payment this client has ever taken. The model
 * refuses to place it: there is no observation to place it with, and putting it
 * on the chart at a guessed date would be exactly the fake prediction this is
 * supposed to avoid. It is kept out of the projection and kept in front of her.
 */
export type StrandedInvoice = {
  id: string;
  clientName: string;
  ref: string;
  work: string;
  amount: Pence;
  issued: Day;
  ageDays: number;
  worstObservedLag: number | null;
  basis: LagBasis;
  chased?: string;
};

function certaintyOf(basis: LagBasis): Certainty {
  return basis === "observed" ? "observed" : basis === "thin" ? "thin" : "none";
}

export type WhatIf = {
  on: boolean;
  fee: Pence;
  /** Days from today until she could raise the invoice. */
  invoiceInDays: number;
  clientId: string;
  termsDays: number;
};

export type Controls = {
  everythingElseMonthly: Pence;
  includeAgreed: boolean;
  whatIf: WhatIf;
};

export const EVERYTHING_ELSE_DEFAULT: Pence = medianInt(
  EVERYTHING_ELSE_MONTHS.map((m) => m.amount)
);

export const DEFAULT_CONTROLS: Controls = {
  everythingElseMonthly: EVERYTHING_ELSE_DEFAULT,
  includeAgreed: false,
  whatIf: { on: false, fee: gbp("1400.00"), invoiceInDays: 30, clientId: "new", termsDays: 60 },
};

/** Monthly figure to a whole number of pence per day. Stated, not hidden. */
export function dailySpreadOf(monthly: Pence): Pence {
  return Math.round((monthly * 12) / 365);
}

export const SHOP_BY_PATH: Record<PathKey, Pence> = (() => {
  const amounts = SHOP_HISTORY.map((s) => s.amount);
  return {
    fast: Math.max(...amounts),
    expected: medianInt(amounts),
    slow: Math.min(...amounts),
  };
})();

function invoiceReceipt(
  id: string,
  client: Client,
  profile: LagProfile,
  ref: string,
  work: string,
  amount: Pence,
  issued: Day,
  termsDays: number,
  kind: ProjectedReceipt["kind"],
  note?: string
): ProjectedReceipt {
  const raw: Record<PathKey, Day> = {
    fast: issued + profile.lag.fast,
    expected: issued + profile.lag.expected,
    slow: issued + profile.lag.slow,
  };
  // An invoice cannot arrive in the past. Where its fast window has already
  // gone by, the earliest honest date is tomorrow, and the interface says so.
  const floorDay = Math.max(TODAY + 1, issued + 1);
  const dayByPath: Record<PathKey, Day> = {
    fast: Math.max(raw.fast, floorDay),
    expected: Math.max(raw.expected, floorDay),
    slow: Math.max(raw.slow, floorDay),
  };
  return {
    id,
    clientName: client.name,
    ref,
    work,
    amount,
    amountByPath: { fast: amount, expected: amount, slow: amount },
    dayByPath,
    issued,
    termsDays,
    kind,
    certainty: certaintyOf(profile.basis),
    taxable: true,
    windowPassed: raw.fast < floorDay,
    note,
  };
}

export type ReceiptSet = { receipts: ProjectedReceipt[]; stranded: StrandedInvoice[] };

export function buildReceipts(controls: Controls): ReceiptSet {
  const receipts: ProjectedReceipt[] = [];
  const stranded: StrandedInvoice[] = [];

  for (const invoice of OPEN_INVOICES) {
    const client = anyClientById(invoice.clientId);
    const profile = LAG_PROFILES[client.id];
    const age = TODAY - invoice.issued;
    if (age > profile.lag.slow) {
      stranded.push({
        id: invoice.id,
        clientName: client.name,
        ref: invoice.ref,
        work: invoice.work,
        amount: invoice.amount,
        issued: invoice.issued,
        ageDays: age,
        worstObservedLag: profile.observations.length
          ? Math.max(...profile.observations.map((o) => o.lag))
          : null,
        basis: profile.basis,
        chased: invoice.chased,
      });
      continue;
    }
    receipts.push(
      invoiceReceipt(
        invoice.id,
        client,
        profile,
        invoice.ref,
        invoice.work,
        invoice.amount,
        invoice.issued,
        invoice.termsDays,
        "invoice"
      )
    );
  }

  for (const fixed of FIXED_RECEIPTS) {
    if (fixed.on <= TODAY) continue;
    receipts.push({
      id: fixed.id,
      clientName: fixed.label,
      ref: "royalties",
      work: fixed.detail,
      amount: fixed.amount,
      amountByPath: { fast: fixed.amount, expected: fixed.amount, slow: fixed.amount },
      dayByPath: { fast: fixed.on, expected: fixed.on, slow: fixed.on },
      issued: null,
      termsDays: null,
      kind: "royalty",
      certainty: "known",
      taxable: fixed.taxable,
      windowPassed: false,
    });
  }

  for (const on of monthlyOccurrences(TODAY + 1, MODEL_END, SHOP_PAYOUT_DAY)) {
    receipts.push({
      id: `shop-${String(on)}`,
      clientName: "Print shop",
      ref: "payout",
      work: "monthly payout, 8th",
      amount: SHOP_BY_PATH.expected,
      amountByPath: SHOP_BY_PATH,
      dayByPath: { fast: on, expected: on, slow: on },
      issued: null,
      termsDays: null,
      kind: "shop",
      certainty: "observed",
      taxable: true,
      windowPassed: false,
    });
  }

  if (controls.includeAgreed) {
    for (const agreed of AGREED_WORK) {
      const client = anyClientById(agreed.clientId);
      receipts.push(
        invoiceReceipt(
          agreed.id,
          client,
          LAG_PROFILES[client.id],
          "not yet invoiced",
          agreed.work,
          agreed.amount,
          agreed.invoiceOn,
          agreed.termsDays,
          "agreed",
          agreed.standing
        )
      );
    }
  }

  if (controls.whatIf.on && controls.whatIf.fee > 0) {
    const { client, profile } = whatIfClient(controls.whatIf);
    receipts.push(
      invoiceReceipt(
        "whatif",
        client,
        profile,
        "hypothetical",
        "The commission she is not sure she wants",
        controls.whatIf.fee,
        TODAY + controls.whatIf.invoiceInDays,
        controls.whatIf.termsDays,
        "whatif"
      )
    );
  }

  receipts.sort((a, b) => a.dayByPath.expected - b.dayByPath.expected);
  return { receipts, stranded };
}

export const NEW_CLIENT_ID = "new";

/**
 * A hypothetical job from a client with no history is a different proposition
 * from the same fee from someone who has paid her nine times, and the interface
 * should not let her forget which she is looking at.
 */
export function whatIfClient(whatIf: WhatIf): { client: Client; profile: LagProfile } {
  if (whatIf.clientId === NEW_CLIENT_ID) {
    const stranger: Client = {
      id: NEW_CLIENT_ID,
      name: "Someone she has not worked for",
      kind: "no payment history at all",
      termsDays: whatIf.termsDays,
      note: "no history, so the arrival window is a guess and is drawn as one",
    };
    return { client: stranger, profile: lagProfileFor(stranger, []) };
  }
  const known = anyClientById(whatIf.clientId);
  const client = { ...known, termsDays: whatIf.termsDays };
  return { client, profile: lagProfileFor(client, LAG_PROFILES[known.id].observations) };
}

// ─── outflows ────────────────────────────────────────────────────────────────

export type OutflowKind = "committed" | "expense" | "tax";

export type ProjectedOutflow = {
  id: string;
  label: string;
  detail?: string;
  amount: Pence;
  deductible: Pence;
  on: Day;
  kind: OutflowKind;
  certainty: "known" | "projected";
};

function committedOutflows(from: Day, to: Day): ProjectedOutflow[] {
  const out: ProjectedOutflow[] = [];
  for (const item of COMMITTED) {
    for (const on of monthlyOccurrences(from, to, item.dayOfMonth)) {
      out.push({
        id: `${item.id}-${String(on)}`,
        label: item.label,
        detail: item.detail,
        amount: item.amount,
        deductible: item.deductible,
        on,
        kind: "committed",
        certainty: "known",
      });
    }
  }
  return out;
}

function expenseOutflows(from: Day, to: Day): ProjectedOutflow[] {
  return ONE_OFF_EXPENSES.filter((e) => e.on >= from && e.on <= to).map((e) => ({
    id: e.id,
    label: e.label,
    amount: e.amount,
    deductible: e.deductible,
    on: e.on,
    kind: "expense" as const,
    certainty: "known" as const,
  }));
}

// ─── the walk ────────────────────────────────────────────────────────────────

export type YearPosition = {
  startYear: number;
  bands: Bands;
  income: Pence;
  deductible: Pence;
  profit: Pence;
  liability: Liability;
  /** True where every day of the year is inside the model, so the figure is final. */
  closed: boolean;
};

export type PathResult = {
  path: PathKey;
  /** Cash at the close of each day from today to the end of the model. */
  cash: Pence[];
  /** Tax recognised and not yet paid, on the same index. */
  floor: Pence[];
  /** Profit so far in the tax year covering each day. */
  profit: Pence[];
  receiptDay: Record<string, Day>;
  outflows: ProjectedOutflow[];
  taxPayments: TaxPayment[];
  years: Record<number, YearPosition>;
  /** First day cash falls below the tax floor: the day she starts spending HMRC's money. */
  breachDay: Day | null;
  /** First day cash falls below zero. */
  dryDay: Day | null;
  lowest: { on: Day; cash: Pence };
};

export type Projection = {
  controls: Controls;
  dailySpread: Pence;
  receipts: ProjectedReceipt[];
  stranded: StrandedInvoice[];
  paths: Record<PathKey, PathResult>;
  /** Position today: identical on every path, because today has already happened. */
  today: {
    cash: Pence;
    profit: Pence;
    income: Pence;
    deductible: Pence;
    accrued: Liability;
    priorYearOutstanding: Pence;
    floor: Pence;
    notTax: Pence;
    marginalBps: number;
  };
  filed: { y2024: Liability; y2024Poa: [Pence, Pence]; y2023Liability: Pence };
};

function indexOf(value: Day): number {
  return value - TODAY;
}

const HISTORIC_RECEIPTS: { on: Day; amount: Pence }[] = [
  ...PAID_INVOICES.map((inv) => ({ on: inv.paid, amount: inv.amount })),
  ...FIXED_RECEIPTS.filter((r) => r.on <= TODAY).map((r) => ({ on: r.on, amount: r.amount })),
  ...SHOP_HISTORY.filter((s) => s.on <= TODAY).map((s) => ({ on: s.on, amount: s.amount })),
];

/** Profit already banked this tax year, before anything is projected. */
export function positionToday(): {
  income: Pence;
  deductible: Pence;
  profit: Pence;
  incomeRows: { on: Day; amount: Pence }[];
} {
  const year = taxYearStarting(taxYearOf(TODAY));
  const incomeRows = HISTORIC_RECEIPTS.filter((r) => r.on >= year.starts && r.on <= TODAY).sort(
    (a, b) => a.on - b.on
  );
  const income = incomeRows.reduce((sum, r) => sum + r.amount, 0);
  const deductible =
    committedOutflows(year.starts, TODAY).reduce((sum, o) => sum + o.deductible, 0) +
    expenseOutflows(year.starts, TODAY).reduce((sum, o) => sum + o.deductible, 0);
  return { income, deductible, profit: income - deductible, incomeRows };
}

export const FILED_2024: Liability = liabilityOn(FILED.y2024Profit, taxYearStarting(2024));

export function project(controls: Controls): Projection {
  const dailySpread = dailySpreadOf(controls.everythingElseMonthly);
  const { receipts, stranded } = buildReceipts(controls);

  const baseOutflows = [
    ...committedOutflows(TODAY + 1, MODEL_END),
    ...expenseOutflows(TODAY + 1, MODEL_END),
  ];

  const opening = positionToday();
  const paths = {} as Record<PathKey, PathResult>;

  for (const path of PATHS) {
    // Pass one: how much profit each tax year ends up holding on this path.
    // The whole-year figures must be settled before the payment dates can be,
    // because a balancing payment is a function of a year that has closed.
    const income: Record<number, Pence> = { 2024: 0, 2025: 0, 2026: 0 };
    const deductible: Record<number, Pence> = { 2024: 0, 2025: 0, 2026: 0 };

    income[2025] += opening.income;
    deductible[2025] += opening.deductible;

    for (const receipt of receipts) {
      if (!receipt.taxable) continue;
      const on = receipt.dayByPath[path];
      if (on > MODEL_END) continue;
      const year = taxYearOf(on);
      income[year] += receipt.amountByPath[path];
    }
    for (const outflow of baseOutflows) {
      if (outflow.deductible === 0) continue;
      const year = taxYearOf(outflow.on);
      deductible[year] += outflow.deductible;
    }

    const years: Record<number, YearPosition> = {};
    for (const startYear of YEARS_IN_PLAY) {
      const bands = taxYearStarting(startYear);
      const profit =
        startYear === 2024 ? FILED.y2024Profit : income[startYear] - deductible[startYear];
      years[startYear] = {
        startYear,
        bands,
        income: startYear === 2024 ? FILED.y2024Profit : income[startYear],
        deductible: startYear === 2024 ? 0 : deductible[startYear],
        profit,
        liability: startYear === 2024 ? FILED_2024 : liabilityOn(profit, bands),
        closed: bands.ends <= MODEL_END,
      };
    }

    const taxPayments: TaxPayment[] = [
      ...scheduleFor(2024, FILED_2024.total, FILED.y2023Liability, "filed", "filed"),
      ...scheduleFor(2025, years[2025].liability.total, FILED_2024.total, "projected", "filed"),
      ...scheduleFor(2026, years[2026].liability.total, years[2025].liability.total, "projected", "projected"),
    ].filter((payment) => payment.due <= MODEL_END);

    const outflows = [
      ...baseOutflows,
      ...taxPayments
        .filter((payment) => payment.due > TODAY && payment.amount > 0)
        .map<ProjectedOutflow>((payment) => ({
          id: payment.id,
          label: payment.label,
          amount: payment.amount,
          deductible: 0,
          on: payment.due,
          kind: "tax",
          certainty: payment.certainty === "filed" ? "known" : "projected",
        })),
    ].sort((a, b) => a.on - b.on || a.label.localeCompare(b.label));

    // Pass two: walk the days.
    const receiptsByDay = new Map<Day, ProjectedReceipt[]>();
    const receiptDay: Record<string, Day> = {};
    for (const receipt of receipts) {
      const on = receipt.dayByPath[path];
      receiptDay[receipt.id] = on;
      const list = receiptsByDay.get(on);
      if (list) list.push(receipt);
      else receiptsByDay.set(on, [receipt]);
    }
    const outflowsByDay = new Map<Day, ProjectedOutflow[]>();
    for (const outflow of outflows) {
      const list = outflowsByDay.get(outflow.on);
      if (list) list.push(outflow);
      else outflowsByDay.set(outflow.on, [outflow]);
    }
    const paidByYear: Record<number, Pence> = { 2024: 0, 2025: 0, 2026: 0 };
    for (const payment of taxPayments) {
      if (payment.due <= TODAY) paidByYear[payment.forYear] += payment.amount;
    }

    const runningIncome: Record<number, Pence> = { 2024: 0, 2025: opening.income, 2026: 0 };
    const runningDeduct: Record<number, Pence> = { 2024: 0, 2025: opening.deductible, 2026: 0 };

    const cash = new Array<Pence>(SPAN);
    const floor = new Array<Pence>(SPAN);
    const profitSeries = new Array<Pence>(SPAN);
    let balance = OPENING_CASH;
    let breachDay: Day | null = null;
    let dryDay: Day | null = null;
    let lowest = { on: TODAY, cash: OPENING_CASH };

    for (let i = 0; i < SPAN; i += 1) {
      const d = TODAY + i;
      if (i > 0) {
        balance -= dailySpread;
        for (const receipt of receiptsByDay.get(d) ?? []) {
          balance += receipt.amountByPath[path];
          if (receipt.taxable) runningIncome[taxYearOf(d)] += receipt.amountByPath[path];
        }
        for (const outflow of outflowsByDay.get(d) ?? []) {
          balance -= outflow.amount;
          runningDeduct[taxYearOf(d)] += outflow.deductible;
          if (outflow.kind === "tax") {
            const payment = taxPayments.find((p) => p.id === outflow.id);
            if (payment) paidByYear[payment.forYear] += payment.amount;
          }
        }
      }

      let owed = 0;
      for (const startYear of YEARS_IN_PLAY) {
        const recognised =
          startYear === 2024
            ? FILED_2024.total
            : liabilityOn(
                runningIncome[startYear] - runningDeduct[startYear],
                years[startYear].bands
              ).total;
        owed += recognised - paidByYear[startYear];
      }
      const floorHere = Math.max(0, owed);

      cash[i] = balance;
      floor[i] = floorHere;
      profitSeries[i] = runningIncome[taxYearOf(d)] - runningDeduct[taxYearOf(d)];

      if (breachDay === null && balance < floorHere) breachDay = d;
      if (dryDay === null && balance < 0) dryDay = d;
      if (balance < lowest.cash) lowest = { on: d, cash: balance };
    }

    paths[path] = {
      path,
      cash,
      floor,
      profit: profitSeries,
      receiptDay,
      outflows,
      taxPayments,
      years,
      breachDay,
      dryDay,
      lowest,
    };
  }

  const accrued = liabilityOn(opening.profit, taxYearStarting(2025));
  const priorYearOutstanding =
    FILED_2024.total -
    scheduleFor(2024, FILED_2024.total, FILED.y2023Liability, "filed", "filed")
      .filter((p) => p.due <= TODAY)
      .reduce((sum, p) => sum + p.amount, 0);
  const floorToday = Math.max(0, accrued.total + priorYearOutstanding);

  return {
    controls,
    dailySpread,
    receipts,
    stranded,
    paths,
    today: {
      cash: OPENING_CASH,
      profit: opening.profit,
      income: opening.income,
      deductible: opening.deductible,
      accrued,
      priorYearOutstanding,
      floor: floorToday,
      notTax: OPENING_CASH - floorToday,
      marginalBps: marginalBps(opening.profit, taxYearStarting(2025)),
    },
    filed: {
      y2024: FILED_2024,
      y2024Poa: [
        scheduleFor(2024, FILED_2024.total, FILED.y2023Liability, "filed", "filed").find(
          (p) => p.kind === "poa1"
        )?.amount ?? 0,
        scheduleFor(2024, FILED_2024.total, FILED.y2023Liability, "filed", "filed").find(
          (p) => p.kind === "poa2"
        )?.amount ?? 0,
      ],
      y2023Liability: FILED.y2023Liability,
    },
  };
}

// ─── reading answers off the projection ──────────────────────────────────────

export function cashOn(result: PathResult, on: Day): Pence {
  const i = indexOf(on);
  if (i < 0) return OPENING_CASH;
  return result.cash[Math.min(i, SPAN - 1)];
}

export function floorOn(result: PathResult, on: Day): Pence {
  const i = indexOf(on);
  if (i < 0) return 0;
  return result.floor[Math.min(i, SPAN - 1)];
}

/** Total leaving the account across a closed range of days, spread included. */
export function outgoingsBetween(
  result: PathResult,
  from: Day,
  to: Day,
  dailySpread: Pence
): Pence {
  if (to < from) return 0;
  const dated = result.outflows
    .filter((o) => o.on >= from && o.on <= to)
    .reduce((sum, o) => sum + o.amount, 0);
  return dated + dailySpread * (to - from + 1);
}

export function nextReceiptAfter(
  projection: Projection,
  path: PathKey,
  after: Day
): ProjectedReceipt | null {
  let best: ProjectedReceipt | null = null;
  for (const receipt of projection.receipts) {
    const on = receipt.dayByPath[path];
    if (on <= after) continue;
    if (!best || on < best.dayByPath[path]) best = receipt;
  }
  return best;
}

export type Decomposition = {
  receipt: ProjectedReceipt;
  path: PathKey;
  arrives: Day;
  gross: Pence;
  tax: Pence;
  taxRateBps: number;
  profitBefore: Pence;
  bandsLabel: string;
  gapTo: Day | null;
  gapReceipt: ProjectedReceipt | null;
  gapOutgoings: Pence;
  cushion: Pence;
  heldForGap: Pence;
  yours: Pence;
};

/**
 * "How much of this is genuinely mine?" — as three subtractions she can check.
 *
 * The tax figure is not a percentage of the invoice. It is the difference the
 * invoice makes to the year's liability, so an invoice that straddles the
 * personal allowance is correctly part untaxed, and one that crosses into higher
 * rate is correctly part taxed at 40%.
 *
 * The holdback is what has to survive the gap to the next money. It is nil when
 * her existing cash already covers that gap, which is the true answer and not a
 * flattering one: it is nil in January precisely because she has savings, and it
 * grows as they go.
 */
export function decompose(
  projection: Projection,
  receipt: ProjectedReceipt,
  path: PathKey
): Decomposition {
  const result = projection.paths[path];
  const arrives = receipt.dayByPath[path];
  const gross = receipt.amountByPath[path];
  const bands = taxYearStarting(taxYearOf(arrives));

  const profitAt = result.profit[Math.max(0, Math.min(indexOf(arrives), SPAN - 1))];
  const profitBefore = receipt.taxable ? profitAt - gross : profitAt;
  const tax = receipt.taxable
    ? liabilityOn(profitBefore + gross, bands).total - liabilityOn(profitBefore, bands).total
    : 0;

  const next = nextReceiptAfter(projection, path, arrives);
  const gapTo = next ? next.dayByPath[path] : null;
  const gapOutgoings = gapTo
    ? outgoingsBetween(result, arrives + 1, gapTo, projection.dailySpread)
    : 0;

  const cashHere = cashOn(result, arrives);
  const floorHere = floorOn(result, arrives);
  // What she would have had free on that day if this invoice had never existed.
  const cushion = cashHere - gross - Math.max(0, floorHere - tax);
  const heldForGap = Math.max(0, Math.min(gapOutgoings - cushion, gross - tax));

  return {
    receipt,
    path,
    arrives,
    gross,
    tax,
    taxRateBps: gross === 0 ? 0 : Math.round((tax * 10_000) / gross),
    profitBefore,
    bandsLabel: bands.label,
    gapTo,
    gapReceipt: next,
    gapOutgoings,
    cushion,
    heldForGap,
    yours: gross - tax - heldForGap,
  };
}

// ─── the question about March ────────────────────────────────────────────────

export type Obligation = { id: string; label: string; amount: Pence; on: Day };

/** Committed payments she might reasonably ask about, next six months. */
export function obligations(): Obligation[] {
  const out: Obligation[] = [];
  const to = addDays(TODAY, 190);
  for (const item of COMMITTED) {
    if (item.amount < gbp("100")) continue;
    for (const on of monthlyOccurrences(TODAY + 1, to, item.dayOfMonth)) {
      out.push({ id: `${item.id}-${String(on)}`, label: item.label, amount: item.amount, on });
    }
  }
  out.sort((a, b) => a.on - b.on || b.amount - a.amount);
  return out;
}

export const DEFAULT_OBLIGATION_DAY = day("2026-03-01");

export type Verdict = {
  obligation: Obligation;
  byPath: Record<
    PathKey,
    {
      cashAfter: Pence;
      floorAfter: Pence;
      clears: boolean;
      /** How much of what is left over is HMRC's rather than hers. */
      intoTaxMoney: Pence;
    }
  >;
  clearsEverywhere: boolean;
  usesTaxMoneyOnSomePath: boolean;
};

export function verdictFor(projection: Projection, obligation: Obligation): Verdict {
  const byPath = {} as Verdict["byPath"];
  for (const path of PATHS) {
    const result = projection.paths[path];
    const cashAfter = cashOn(result, obligation.on);
    const floorAfter = floorOn(result, obligation.on);
    byPath[path] = {
      cashAfter,
      floorAfter,
      clears: cashAfter >= 0,
      intoTaxMoney: Math.max(0, floorAfter - cashAfter),
    };
  }
  return {
    obligation,
    byPath,
    clearsEverywhere: PATHS.every((p) => byPath[p].clears),
    usesTaxMoneyOnSomePath: PATHS.some((p) => byPath[p].intoTaxMoney > 0),
  };
}

// ─── the ledger, so the projection can be checked by hand ────────────────────

export type LedgerRow = {
  on: Day;
  label: string;
  detail?: string;
  inAmount: Pence;
  outAmount: Pence;
  balance: Pence;
  kind: "receipt" | OutflowKind | "spread";
  certainty?: Certainty | "known" | "projected";
};

/**
 * Every movement between two dates with a running balance, including the daily
 * spread rolled up per month so the column can be added with a pencil and still
 * reach the same closing figure the chart draws.
 */
export function ledger(
  projection: Projection,
  path: PathKey,
  from: Day,
  to: Day
): LedgerRow[] {
  const result = projection.paths[path];
  type Movement = { on: Day; label: string; detail?: string; in: Pence; out: Pence; kind: LedgerRow["kind"]; certainty?: LedgerRow["certainty"] };
  const movements: Movement[] = [];

  for (const receipt of projection.receipts) {
    const on = receipt.dayByPath[path];
    if (on < from || on > to) continue;
    movements.push({
      on,
      label: `${receipt.clientName} — ${receipt.ref}`,
      detail: receipt.work,
      in: receipt.amountByPath[path],
      out: 0,
      kind: "receipt",
      certainty: receipt.certainty,
    });
  }
  for (const outflow of result.outflows) {
    if (outflow.on < from || outflow.on > to) continue;
    movements.push({
      on: outflow.on,
      label: outflow.label,
      detail: outflow.detail,
      in: 0,
      out: outflow.amount,
      kind: outflow.kind,
      certainty: outflow.certainty,
    });
  }
  if (projection.dailySpread > 0) {
    // One row per calendar month, dated at the last day of the run so it lands
    // after that month's dated items and the running balance stays honest.
    let cursor = from;
    while (cursor <= to) {
      const { year, month } = splitDay(cursor);
      const monthEnd = Math.min(to, lastDayOfMonth(year, month));
      const days = monthEnd - cursor + 1;
      movements.push({
        on: monthEnd,
        label: "Everything else",
        detail: `${String(days)} days at ${String(projection.dailySpread)}p`,
        in: 0,
        out: projection.dailySpread * days,
        kind: "spread",
      });
      cursor = monthEnd + 1;
    }
  }

  movements.sort((a, b) => a.on - b.on || (a.kind === "spread" ? 1 : 0) - (b.kind === "spread" ? 1 : 0));

  let balance = cashOn(result, from - 1);
  return movements.map((m) => {
    balance += m.in - m.out;
    return {
      on: m.on,
      label: m.label,
      detail: m.detail,
      inAmount: m.in,
      outAmount: m.out,
      balance,
      kind: m.kind,
      certainty: m.certainty,
    };
  });
}

function splitDay(value: Day): { year: number; month: number } {
  const dt = new Date(value * 86_400_000);
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1 };
}

function lastDayOfMonth(year: number, month: number): Day {
  return Math.trunc(Date.UTC(year, month, 0) / 86_400_000);
}
