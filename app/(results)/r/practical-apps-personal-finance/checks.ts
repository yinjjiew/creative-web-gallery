/**
 * Runway checks its own arithmetic, and shows the result.
 *
 * A cash-flow projection is only worth looking at if it adds up, and a plausible
 * chart that does not add up is worse than no chart: it is confidently wrong
 * about rent. So every claim the interface makes is re-derived here by a second
 * route and compared, and the outcome is rendered on the page rather than left
 * in a test file nobody runs.
 *
 * The interaction checks matter most. Money arithmetic that drifts when a
 * control is dragged is the classic failure of this kind of interface: a slider
 * accumulates deltas, rounding walks the underlying figures away from their real
 * values, and nothing in the display admits it. These sweep the controls out to
 * both ends and back and assert the projection is identical, day by day, to the
 * one that was there before.
 */
import { day, gbp, medianInt } from "./money";
import {
  COMMITTED,
  EVERYTHING_ELSE_MAX,
  EVERYTHING_ELSE_MONTHS,
  EVERYTHING_ELSE_STEP,
  FILED,
  OPEN_INVOICES,
  OPENING_CASH,
  PAID_INVOICES,
  TODAY,
  anyClientById,
} from "./scenario";
import { liabilityOn, paymentsOnAccount, taxYearStarting } from "./tax";
import {
  DEFAULT_CONTROLS,
  LAG_PROFILES,
  MODEL_END,
  PATHS,
  SPAN,
  dailySpreadOf,
  decompose,
  ledger,
  outgoingsBetween,
  project,
  type Controls,
  type Projection,
} from "./project";

export type Check = {
  id: string;
  group: "money" | "tax" | "projection" | "interaction";
  claim: string;
  detail: string;
  passed: boolean;
};

function fingerprint(projection: Projection): string {
  const parts: string[] = [String(projection.dailySpread)];
  for (const path of PATHS) {
    const result = projection.paths[path];
    parts.push(path, result.cash.join(","), result.floor.join(","), result.profit.join(","));
  }
  return parts.join("|");
}

function allIntegers(projection: Projection): boolean {
  for (const path of PATHS) {
    const result = projection.paths[path];
    for (const series of [result.cash, result.floor, result.profit]) {
      for (const value of series) if (!Number.isSafeInteger(value)) return false;
    }
  }
  return true;
}

function sweep(base: Controls, mutate: (step: number) => Controls, steps: number[]): boolean {
  const before = fingerprint(project(base));
  for (const step of steps) project(mutate(step));
  const after = fingerprint(project(base));
  return before === after;
}

export function runChecks(): Check[] {
  const checks: Check[] = [];
  const add = (
    id: string,
    group: Check["group"],
    claim: string,
    passed: boolean,
    detail: string
  ) => {
    checks.push({ id, group, claim, detail, passed });
  };

  // ── money is only ever integer pence ──
  const base = project(DEFAULT_CONTROLS);
  add(
    "integers",
    "money",
    "Every figure in the projection is a whole number of pence",
    allIntegers(base),
    `${String(SPAN * 3 * 3)} values across three paths, all safe integers — no float has been near them.`
  );

  const committedTotal = COMMITTED.reduce((sum, item) => sum + item.amount, 0);
  add(
    "committed",
    "money",
    "Committed outgoings come to £2,300.00 a month",
    committedTotal === gbp("2300.00"),
    `${String(COMMITTED.length)} dated standing commitments summing to ${String(committedTotal)}p, the figure in the brief.`
  );

  const spreadDefault = dailySpreadOf(medianInt(EVERYTHING_ELSE_MONTHS.map((m) => m.amount)));
  add(
    "spread",
    "money",
    "The daily rate for everything else is derived, not typed",
    spreadDefault === Math.round((gbp("310.00") * 12) / 365) && spreadDefault === 1019,
    `Median of six recorded months is £310.00; £310.00 × 12 ÷ 365 = ${String(spreadDefault)}p a day, rounded once.`
  );

  // ── the lag windows really are her own history ──
  let lagsAgree = true;
  const lagNotes: string[] = [];
  for (const invoice of PAID_INVOICES) {
    const profile = LAG_PROFILES[invoice.clientId];
    const observed = profile.observations.find((o) => o.ref === invoice.ref);
    if (!observed || observed.lag !== invoice.paid - invoice.issued) lagsAgree = false;
  }
  for (const profile of Object.values(LAG_PROFILES)) {
    if (profile.basis !== "observed") continue;
    const lags = profile.observations.map((o) => o.lag);
    if (
      profile.lag.fast !== Math.min(...lags) ||
      profile.lag.slow !== Math.max(...lags) ||
      profile.lag.expected !== medianInt(lags)
    ) {
      lagsAgree = false;
    }
    lagNotes.push(`${profile.client.name} ${String(profile.lag.fast)}–${String(profile.lag.slow)}`);
  }
  add(
    "lags",
    "projection",
    "Every arrival window is the minimum, median and maximum of that client's own paid invoices",
    lagsAgree,
    `${lagNotes.join(", ")} days. Recomputed from paid date minus issue date and compared.`
  );

  const stranded = base.stranded;
  const strandedOk =
    stranded.every((item) => {
      const source = OPEN_INVOICES.find((invoice) => invoice.id === item.id);
      if (!source) return false;
      const profile = LAG_PROFILES[anyClientById(source.clientId).id];
      return item.ageDays > profile.lag.slow;
    }) &&
    // and nothing that is excluded may appear in the projection
    stranded.every((item) => !base.receipts.some((receipt) => receipt.id === item.id));
  add(
    "stranded",
    "projection",
    "An invoice older than every payment that client has ever taken is excluded rather than guessed at",
    stranded.length === 1 && strandedOk,
    stranded.length
      ? `${stranded[0].clientName} ${stranded[0].ref} is ${String(stranded[0].ageDays)} days old against a worst observation of ${String(stranded[0].worstObservedLag ?? 0)} days, so it contributes nothing to the projection.`
      : "No invoice is currently beyond its evidence."
  );

  // ── the tax working ──
  const y2024 = liabilityOn(FILED.y2024Profit, taxYearStarting(2024));
  const handIncomeTax = Math.round((FILED.y2024Profit - gbp("12570")) * 0.2);
  const handClass4 = Math.round((FILED.y2024Profit - gbp("12570")) * 0.06);
  add(
    "filed",
    "tax",
    "The filed 2024/25 liability re-derives from the bands by hand",
    y2024.incomeTax === handIncomeTax && y2024.class4 === handClass4,
    `Profit £26,800.00, allowance £12,570.00, so £14,230.00 taxable: 20% = ${String(y2024.incomeTax)}p income tax, 6% = ${String(y2024.class4)}p Class 4, total ${String(y2024.total)}p.`
  );

  const [poa1, poa2] = paymentsOnAccount(y2024.total);
  add(
    "poa",
    "tax",
    "The two payments on account add back to the year they were sized on",
    poa1 + poa2 === y2024.total && Math.abs(poa1 - poa2) <= 1,
    `${String(poa1)}p + ${String(poa2)}p = ${String(y2024.total)}p, so no penny is created or lost when the liability is halved.`
  );

  const accrued = base.today.accrued;
  const independent =
    Math.round(Math.max(0, base.today.profit - gbp("12570")) * 0.2) +
    Math.round(Math.max(0, base.today.profit - gbp("12570")) * 0.06);
  add(
    "accrual",
    "tax",
    "Tax accrued to today equals the liability on profit banked to today",
    accrued.total === independent,
    `Receipts ${String(base.today.income)}p less allowable costs ${String(base.today.deductible)}p is ${String(base.today.profit)}p of profit; the liability on it is ${String(accrued.total)}p, matched by a separate calculation.`
  );

  // Additivity: splitting an amount into slices and taxing each slice against
  // the running total must equal taxing the whole thing at once. If this fails,
  // the "how much is mine" figure is wrong in exactly the invisible way.
  let additive = true;
  const bands = taxYearStarting(2025);
  for (const start of [gbp("0"), gbp("11000"), gbp("28053.60"), gbp("49000")]) {
    const whole = liabilityOn(start + gbp("6000"), bands).total - liabilityOn(start, bands).total;
    let sliced = 0;
    let cursor = start;
    for (let i = 0; i < 6; i += 1) {
      const next = cursor + gbp("1000");
      sliced += liabilityOn(next, bands).total - liabilityOn(cursor, bands).total;
      cursor = next;
    }
    if (whole !== sliced) additive = false;
  }
  add(
    "additive",
    "tax",
    "Marginal tax is additive: six slices of £1,000 cost the same as £6,000 at once",
    additive,
    "Tested from four starting profits including one that straddles the personal allowance and one near the higher-rate threshold.",
  );

  const marginal = base.today.marginalBps;
  add(
    "marginal",
    "tax",
    "The marginal rate quoted is the rate the next £100 actually attracts",
    marginal === 2600,
    `At £${String(Math.round(base.today.profit / 100))} of profit she is inside the basic band, so the next £100 costs £20 income tax and £6 Class 4: ${String(marginal / 100)}%, not the 20% headline.`
  );

  // ── the ledger reconciles with the chart ──
  let ledgerOk = true;
  const ledgerNotes: string[] = [];
  for (const path of PATHS) {
    const rows = ledger(base, path, TODAY + 1, MODEL_END);
    const closing = rows.length ? rows[rows.length - 1].balance : OPENING_CASH;
    const walked = base.paths[path].cash[SPAN - 1];
    if (closing !== walked) ledgerOk = false;
    const totalIn = rows.reduce((sum, r) => sum + r.inAmount, 0);
    const totalOut = rows.reduce((sum, r) => sum + r.outAmount, 0);
    if (OPENING_CASH + totalIn - totalOut !== walked) ledgerOk = false;
    ledgerNotes.push(`${path} ${String(walked)}p`);
  }
  add(
    "ledger",
    "projection",
    "Opening balance plus every receipt less every payment equals the closing balance the chart draws",
    ledgerOk,
    `Checked line by line on all three paths to 5 April 2027: ${ledgerNotes.join(", ")}. Added twice — once as a running balance and once as two column totals.`
  );

  let gapsOk = true;
  for (const path of PATHS) {
    const result = base.paths[path];
    for (let i = 1; i < SPAN; i += 1) {
      const on = TODAY + i;
      const dated = result.outflows
        .filter((o) => o.on === on)
        .reduce((sum, o) => sum + o.amount, 0);
      const received = base.receipts
        .filter((r) => r.dayByPath[path] === on)
        .reduce((sum, r) => sum + r.amountByPath[path], 0);
      if (result.cash[i] !== result.cash[i - 1] - base.dailySpread + received - dated) {
        gapsOk = false;
        break;
      }
    }
  }
  add(
    "stepwise",
    "projection",
    "Each day's balance is the day before plus what came in less what went out",
    gapsOk,
    `Every one of the ${String(SPAN - 1)} steps on each path verified against its own inputs, so the curve cannot contain a movement the ledger does not list.`
  );

  // The band may not cross itself while the two paths face identical outgoings.
  // They stop facing identical outgoings on 31 January 2027, and the check below
  // this one is about why.
  const crossoverIndex = day("2027-01-31") - TODAY;
  let rangeOk = true;
  for (let i = 0; i < crossoverIndex; i += 1) {
    if (base.paths.fast.cash[i] < base.paths.slow.cash[i]) rangeOk = false;
    if (base.paths.expected.cash[i] > base.paths.fast.cash[i]) rangeOk = false;
    if (base.paths.expected.cash[i] < base.paths.slow.cash[i]) rangeOk = false;
  }
  add(
    "ordering",
    "projection",
    "Until the tax bills diverge, the band never crosses itself",
    rangeOk,
    `Best case sits on or above the usual case, which sits on or above the worst case, on every one of the ${String(crossoverIndex)} days to 30 January 2027.`
  );

  // A real consequence of the cash basis, and one that surprises people: money
  // arriving late is not simply worse. £2,900 of Ashgrove crosses 5 April on the
  // slow path, which moves it into the following tax year and makes the 2025/26
  // liability — and therefore next January's bill — smaller.
  const straddle =
    base.paths.fast.years[2025].liability.total > base.paths.slow.years[2025].liability.total &&
    base.paths.fast.years[2025].profit - base.paths.slow.years[2025].profit >= gbp("2900");
  add(
    "straddle",
    "tax",
    "An invoice that slips past 5 April moves into the next tax year, and the projection follows it",
    straddle,
    `On the worst path the Ashgrove invoice arrives on 10 April, so 2025/26 profit is ${String(base.paths.slow.years[2025].profit)}p rather than ${String(base.paths.fast.years[2025].profit)}p and the liability falls by ${String(base.paths.fast.years[2025].liability.total - base.paths.slow.years[2025].liability.total)}p. Being paid late is not uniformly worse, and the model does not pretend it is.`
  );

  const spanCheck = outgoingsBetween(base.paths.expected, TODAY + 1, MODEL_END, base.dailySpread);
  const spanRebuild =
    base.paths.expected.outflows.reduce((sum, o) => sum + o.amount, 0) +
    base.dailySpread * (MODEL_END - TODAY);
  add(
    "outgoings",
    "projection",
    "Outgoings summed over a range match the outgoings summed item by item",
    spanCheck === spanRebuild,
    `${String(spanCheck)}p over ${String(MODEL_END - TODAY)} days, reached two ways.`
  );

  // ── interaction: nothing drifts ──
  const spreadSteps: number[] = [];
  for (let value = 0; value <= EVERYTHING_ELSE_MAX; value += EVERYTHING_ELSE_STEP) {
    spreadSteps.push(value);
  }
  add(
    "sweep-spread",
    "interaction",
    "Sweeping the spending control across its whole range and back restores the projection exactly",
    sweep(
      DEFAULT_CONTROLS,
      (value) => ({ ...DEFAULT_CONTROLS, everythingElseMonthly: value }),
      [...spreadSteps, ...spreadSteps.slice().reverse()]
    ),
    `${String(spreadSteps.length * 2)} moves from £0 to £${String(EVERYTHING_ELSE_MAX / 100)} and back. Every day of all three paths compared, not just the headline.`
  );

  const feeSteps: number[] = [];
  for (let value = 0; value <= gbp("6000"); value += gbp("50")) feeSteps.push(value);
  const whatIfBase: Controls = {
    ...DEFAULT_CONTROLS,
    whatIf: { ...DEFAULT_CONTROLS.whatIf, on: true },
  };
  add(
    "sweep-fee",
    "interaction",
    "Sweeping the hypothetical fee out to £6,000 and back restores the projection exactly",
    sweep(
      whatIfBase,
      (value) => ({ ...whatIfBase, whatIf: { ...whatIfBase.whatIf, fee: value } }),
      [...feeSteps, ...feeSteps.slice().reverse()]
    ),
    `${String(feeSteps.length * 2)} moves in £50 steps. The fee is an integer of pence, so the return trip is arithmetic rather than luck.`
  );

  const toggled = project({ ...DEFAULT_CONTROLS, includeAgreed: true });
  const untoggled = project(DEFAULT_CONTROLS);
  add(
    "toggle",
    "interaction",
    "Turning unsigned work on and off leaves no residue",
    fingerprint(untoggled) === fingerprint(base) &&
      fingerprint(toggled) !== fingerprint(base),
    "Including the two agreed-but-uninvoiced jobs changes the projection, and removing them returns it to the byte-identical original.",
  );

  let monotone = true;
  let previousDry: number | null = null;
  for (const fee of [gbp("0"), gbp("500"), gbp("1500"), gbp("3000"), gbp("6000")]) {
    const run = project({ ...whatIfBase, whatIf: { ...whatIfBase.whatIf, fee } });
    const dry = run.paths.slow.dryDay ?? MODEL_END + 1;
    if (previousDry !== null && dry < previousDry) monotone = false;
    previousDry = dry;
  }
  add(
    "monotone",
    "interaction",
    "More money never brings the day she runs out forward",
    monotone,
    "The date is checked at five fee levels from nil to £6,000; it moves later or stays put, never earlier.",
  );

  let decomposeOk = true;
  for (const path of PATHS) {
    for (const receipt of base.receipts) {
      const parts = decompose(base, receipt, path);
      if (parts.yours + parts.tax + parts.heldForGap !== parts.gross) decomposeOk = false;
      if (parts.tax < 0 || parts.heldForGap < 0 || parts.yours < 0) decomposeOk = false;
    }
  }
  add(
    "decompose",
    "money",
    "Tax, holdback and what is hers always add back to the invoice",
    decomposeOk,
    `Checked for every receipt on every path: the three parts sum to the gross and none of them is negative, so the breakdown cannot quietly lose or invent money.`
  );

  return checks;
}

export function checksSummary(checks: Check[]): { passed: number; total: number; ok: boolean } {
  const passed = checks.filter((c) => c.passed).length;
  return { passed, total: checks.length, ok: passed === checks.length };
}
