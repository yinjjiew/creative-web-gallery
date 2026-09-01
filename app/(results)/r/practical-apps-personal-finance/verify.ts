/**
 * The same checks the page renders, run from a terminal.
 *
 *   npx tsx "app/(results)/r/practical-apps-personal-finance/verify.ts"
 *
 * It exists because the checks are the load-bearing part of this result and a
 * reviewer should be able to run them without a browser. The page shows the same
 * list, from the same function.
 */
import { fullDate, money, whole } from "./money";
import { checksSummary, runChecks } from "./checks";
import { DEFAULT_CONTROLS, PATHS, project } from "./project";
import { HORIZONS, TODAY } from "./scenario";
import { DEFAULT_OBLIGATION_DAY, obligations, verdictFor } from "./project";

const checks = runChecks();
for (const check of checks) {
  console.log(`${check.passed ? "pass" : "FAIL"}  [${check.group}] ${check.claim}`);
  if (!check.passed) console.log(`      ${check.detail}`);
}
const summary = checksSummary(checks);
console.log(`\n${String(summary.passed)}/${String(summary.total)} checks pass\n`);

const projection = project(DEFAULT_CONTROLS);
console.log(`today            ${fullDate(TODAY)}`);
console.log(`cash             ${money(projection.today.cash)}`);
console.log(`tax owed         ${money(projection.today.floor)}`);
console.log(`  prior year     ${money(projection.today.priorYearOutstanding)}`);
console.log(`  accrued 25/26  ${money(projection.today.accrued.total)}`);
console.log(`profit to date   ${money(projection.today.profit)}`);
console.log(`not tax money    ${money(projection.today.notTax)}`);
console.log(`marginal rate    ${String(projection.today.marginalBps / 100)}%`);

for (const path of PATHS) {
  const result = projection.paths[path];
  console.log(
    `\n${path.padEnd(9)} breach ${result.breachDay ? fullDate(result.breachDay) : "never"}` +
      `   dry ${result.dryDay ? fullDate(result.dryDay) : "never"}` +
      `   lowest ${money(result.lowest.cash)} on ${fullDate(result.lowest.on)}`
  );
  for (const year of [2025, 2026]) {
    const position = result.years[year];
    console.log(
      `          ${position.bands.label} profit ${money(position.profit)} → tax ${money(position.liability.total)}`
    );
  }
  for (const payment of result.taxPayments.filter((p) => p.due > TODAY)) {
    console.log(
      `          ${fullDate(payment.due)}  ${money(payment.amount)}  ${payment.certainty}  ${payment.label}`
    );
  }
}

const target = obligations().find((o) => o.on === DEFAULT_OBLIGATION_DAY && o.label === "Rent");
if (target) {
  const verdict = verdictFor(projection, target);
  console.log(`\nrent ${whole(target.amount)} on ${fullDate(target.on)}`);
  for (const path of PATHS) {
    const cell = verdict.byPath[path];
    console.log(
      `  ${path.padEnd(9)} cash after ${money(cell.cashAfter).padStart(12)}   ` +
        `tax floor ${money(cell.floorAfter).padStart(10)}   ` +
        `${cell.clears ? "clears" : "DOES NOT CLEAR"}` +
        `${cell.intoTaxMoney > 0 ? ` — ${money(cell.intoTaxMoney)} into tax money` : ""}`
    );
  }
}

console.log(`\nhorizons: ${HORIZONS.map((h) => h.short).join(", ")}`);

// What the levers actually do, so the interaction is worth having.
console.log("\nlevers — day the slow path runs out of money");
const probes: { label: string; controls: typeof DEFAULT_CONTROLS }[] = [
  { label: "as it stands", controls: DEFAULT_CONTROLS },
  {
    label: "unsigned work included",
    controls: { ...DEFAULT_CONTROLS, includeAgreed: true },
  },
  {
    label: "everything else cut to £150",
    controls: { ...DEFAULT_CONTROLS, everythingElseMonthly: 15_000 },
  },
  {
    label: "£1,400 commission, new client, invoiced in 30 days",
    controls: { ...DEFAULT_CONTROLS, whatIf: { ...DEFAULT_CONTROLS.whatIf, on: true } },
  },
  {
    label: "£1,400 commission from Hoxton instead",
    controls: {
      ...DEFAULT_CONTROLS,
      whatIf: { ...DEFAULT_CONTROLS.whatIf, on: true, clientId: "hoxton", termsDays: 14 },
    },
  },
  {
    label: "£6,000 commission, new client",
    controls: {
      ...DEFAULT_CONTROLS,
      whatIf: { ...DEFAULT_CONTROLS.whatIf, on: true, fee: 600_000 },
    },
  },
];
for (const probe of probes) {
  const run = project(probe.controls);
  const slow = run.paths.slow;
  console.log(
    `  ${probe.label.padEnd(46)} breach ${(slow.breachDay ? fullDate(slow.breachDay) : "never").padEnd(13)} dry ${slow.dryDay ? fullDate(slow.dryDay) : "never"}`
  );
}
