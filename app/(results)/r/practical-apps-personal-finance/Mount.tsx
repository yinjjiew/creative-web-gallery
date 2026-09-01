"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Chart from "./Chart";
import { checksSummary, runChecks, type Check } from "./checks";
import {
  day,
  fullDate,
  gapWords,
  gbp,
  longDate,
  money,
  percent,
  poundsAndPence,
  shortDate,
  type Day,
  type Pence,
} from "./money";
import {
  DEFAULT_CONTROLS,
  DEFAULT_OBLIGATION_DAY,
  EVERYTHING_ELSE_DEFAULT,
  NEW_CLIENT_ID,
  PATH_NAMES,
  PATHS,
  cashOn,
  dailySpreadOf,
  decompose,
  ledger,
  obligations,
  project,
  verdictFor,
  type Controls,
  type PathKey,
  type ProjectedReceipt,
} from "./project";
import {
  ACCOUNTS,
  AGREED_WORK,
  CLIENTS,
  COMMITTED,
  DEFAULT_HORIZON,
  EVERYTHING_ELSE_MAX,
  EVERYTHING_ELSE_MONTHS,
  EVERYTHING_ELSE_STEP,
  HORIZONS,
  OPENING_CASH,
  PAID_INVOICES,
  PROVENANCE_LINES,
  TODAY,
  anyClientById,
} from "./scenario";
import { Fig, Mark, Segmented, Switch, Working, type Confidence } from "./ui";
import s from "./runway.module.css";

const FEE_STEP = gbp("50");
const FEE_MAX = gbp("6000");

const PATH_SHORT: Record<PathKey, string> = {
  fast: "their best",
  expected: "as usual",
  slow: "their worst",
};

function obligationKey(id: string, on: Day): string {
  return `${id}::${String(on)}`;
}

function windowRange(receipt: ProjectedReceipt): { start: Day; end: Day } {
  const days = PATHS.map((p) => receipt.dayByPath[p]);
  return { start: Math.min(...days), end: Math.max(...days) };
}

export default function Mount() {
  const [elseMonthly, setElseMonthly] = useState<Pence>(EVERYTHING_ELSE_DEFAULT);
  const [includeAgreed, setIncludeAgreed] = useState(false);
  const [whatIfOn, setWhatIfOn] = useState(false);
  const [fee, setFee] = useState<Pence>(DEFAULT_CONTROLS.whatIf.fee);
  const [invoiceInDays, setInvoiceInDays] = useState(DEFAULT_CONTROLS.whatIf.invoiceInDays);
  const [clientId, setClientId] = useState(DEFAULT_CONTROLS.whatIf.clientId);
  const [termsDays, setTermsDays] = useState(DEFAULT_CONTROLS.whatIf.termsDays);
  const [horizonId, setHorizonId] = useState(DEFAULT_HORIZON);
  const [obligationKeyState, setObligationKeyState] = useState(
    obligationKey("rent", DEFAULT_OBLIGATION_DAY)
  );
  const [receiptId, setReceiptId] = useState("o-f049");
  const [ledgerPath, setLedgerPath] = useState<PathKey>("expected");
  const [checks, setChecks] = useState<Check[] | null>(null);

  const controls: Controls = useMemo(
    () => ({
      everythingElseMonthly: elseMonthly,
      includeAgreed,
      whatIf: { on: whatIfOn, fee, invoiceInDays, clientId, termsDays },
    }),
    [elseMonthly, includeAgreed, whatIfOn, fee, invoiceInDays, clientId, termsDays]
  );

  const projection = useMemo(() => project(controls), [controls]);
  const horizon = HORIZONS.find((h) => h.id === horizonId) ?? HORIZONS[1];
  const due = useMemo(() => obligations(), []);
  const chosen =
    due.find((o) => obligationKey(o.id, o.on) === obligationKeyState) ??
    due.find((o) => o.on === DEFAULT_OBLIGATION_DAY && o.label === "Rent") ??
    due[0];
  const verdict = verdictFor(projection, chosen);
  const receipt =
    projection.receipts.find((r) => r.id === receiptId) ?? projection.receipts[0] ?? null;
  const breakdown = receipt ? decompose(projection, receipt, "expected") : null;
  const expected = projection.paths.expected;
  const ledgerRows = useMemo(
    () => ledger(projection, ledgerPath, TODAY + 1, horizon.end),
    [projection, ledgerPath, horizon.end]
  );
  const ledgerClose = ledgerRows.length
    ? ledgerRows[ledgerRows.length - 1].balance
    : OPENING_CASH;
  const marchCash = cashOn(expected, DEFAULT_OBLIGATION_DAY);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setChecks(runChecks());
    }, 0);
    return () => {
      window.clearTimeout(id);
    };
  }, []);

  const janDue = day("2026-01-31");
  const janBill = expected.taxPayments
    .filter((p) => p.due === janDue && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <main className={s.page}>
      <div className={s.sheet}>
        <header className={s.masthead}>
          <div className={s.brand}>
            <h1 className={s.title}>Runway</h1>
            <p className={s.who}>Nell Farrar · illustrator · a cash book, not a budget</p>
          </div>
          <p className={s.asOf}>
            <strong>{longDate(TODAY)}</strong>
            frozen here — the numbers do not move with the wall clock
          </p>
          <Link className={s.escape} href="/tasks/practical-apps-personal-finance">
            the brief
          </Link>
        </header>

        <dl className={s.position}>
          <div className={s.positionItem}>
            <dt>In the two accounts</dt>
            <dd>
              <Fig value={projection.today.cash} size="huge" />
            </dd>
            <p className={s.positionSplit}>
              {ACCOUNTS.map((a) => `${a.name} ${poundsAndPence(a.balance)}`).join(" · ")}
              . Typed in, not connected.
            </p>
          </div>
          <div className={s.positionItem}>
            <dt>Already HMRC’s</dt>
            <dd>
              <Fig value={projection.today.floor} size="huge" tone="tax" />
            </dd>
            <p className={s.positionSplit}>
              {poundsAndPence(projection.today.accrued.total)} accrued on this year’s profit
              {" · "}
              {poundsAndPence(projection.today.priorYearOutstanding)} still owing on 2024/25
            </p>
          </div>
          <div className={s.positionItem}>
            <dt>Hers, if she stopped today</dt>
            <dd>
              <Fig value={projection.today.notTax} size="huge" tone="pine" />
            </dd>
            <p className={s.positionSplit}>
              Next pound of profit costs {percent(projection.today.marginalBps, 0)} — income tax
              and Class 4 together, not the 20% headline.
            </p>
          </div>
        </dl>

        <p className={s.prose}>
          The 31 January bill is in {gapWords(janDue - TODAY)} and is not an estimate:{" "}
          <Fig value={janBill} size="small" />
          , filed, due {fullDate(janDue)}. After that the question is March.
        </p>

        <hr className={s.ruleDouble} />

        <section aria-labelledby="q1">
          <p className={s.kicker}>The first question</p>
          <h2 className={s.sectionTitle} id="q1">
            Given what has been promised, can she pay it?
          </h2>

          <div className={s.pickers}>
            <label className={s.field}>
              <span className={s.fieldLabel}>The payment</span>
              <select
                className={s.select}
                style={{ caretColor: "transparent" }}
                value={obligationKey(chosen.id, chosen.on)}
                onChange={(event) => {
                  setObligationKeyState(event.target.value);
                }}
              >
                {due.map((item) => (
                  <option key={obligationKey(item.id, item.on)} value={obligationKey(item.id, item.on)}>
                    {item.label} · {fullDate(item.on)} · {poundsAndPence(item.amount)}
                  </option>
                ))}
              </select>
            </label>
            <Segmented
              legend="Look as far as"
              value={horizonId}
              onChange={setHorizonId}
              choices={HORIZONS.map((h) => ({ value: h.id, label: h.short, hint: h.label }))}
            />
          </div>

          <p className={s.verdictLine} aria-live="polite">
            {verdict.clearsEverywhere ? (
              <>
                <strong className={s.ok}>Yes.</strong> {chosen.label} of{" "}
                <Fig value={chosen.amount} size="small" /> on {fullDate(chosen.on)} clears on
                every path
                {verdict.usesTaxMoneyOnSomePath
                  ? ", but on at least one path she is spending money that is already HMRC’s."
                  : ", and she is not spending the tax money to do it."}
              </>
            ) : (
              <>
                <strong className={s.warn}>No.</strong> On at least one path there is not enough
                in the account to pay {chosen.label.toLowerCase()} on {fullDate(chosen.on)}.
              </>
            )}
          </p>

          <div className={s.tableWrap}>
            <table className={`${s.register} ${s.verdictTable}`}>
              <caption className={s.srOnly}>
                Cash after {chosen.label} on each payment-timing path
              </caption>
              <thead>
                <tr>
                  <th className={s.pathName} scope="col">
                    If clients pay…
                  </th>
                  <th className={s.amt} scope="col">
                    Cash after
                  </th>
                  <th className={s.amt} scope="col">
                    Tax floor
                  </th>
                  <th scope="col">What that means</th>
                </tr>
              </thead>
              <tbody>
                {PATHS.map((path) => {
                  const cell = verdict.byPath[path];
                  return (
                    <tr key={path}>
                      <td>{PATH_NAMES[path]}</td>
                      <td className={s.amt} data-label="Cash after">
                        <Fig value={cell.cashAfter} tone={cell.cashAfter < 0 ? "claret" : "ink"} />
                      </td>
                      <td className={s.amt} data-label="Tax floor">
                        <Fig value={cell.floorAfter} tone="tax" />
                      </td>
                      <td
                        className={
                          !cell.clears ? s.statusBad : cell.intoTaxMoney > 0 ? s.statusBad : s.statusOk
                        }
                      >
                        {!cell.clears
                          ? "does not clear"
                          : cell.intoTaxMoney > 0
                            ? `${poundsAndPence(cell.intoTaxMoney)} into tax money`
                            : "clears, from her own money"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className={s.note}>
            March rent is the question she asked. On the usual path she has{" "}
            <Fig value={marchCash} size="small" /> after it. The trouble the book is for is
            later: on the usual path she starts spending HMRC’s money on{" "}
            {expected.breachDay ? fullDate(expected.breachDay) : "a day beyond this horizon"},
            and the account is empty on{" "}
            {expected.dryDay ? fullDate(expected.dryDay) : "a day beyond this horizon"}. The
            pipeline in front of her does not cover the summer.
          </p>
        </section>

        <hr className={s.rule} />

        <section className={s.chartBlock} aria-labelledby="chart-title">
          <p className={s.kicker}>The band, not a line</p>
          <h2 className={s.sectionTitle} id="chart-title">
            Cash, and the floor underneath it
          </h2>
          <p className={s.prose}>
            The fill is the range between everyone paying at their best and everyone paying at
            their worst. The heavy line is the way they usually pay. The hatching is tax
            recognised and not yet handed over — money in the account that is not hers. A
            crossing of the two is the failure she actually keeps having.
          </p>
          <Chart
            projection={projection}
            from={TODAY}
            to={horizon.end}
            markDay={chosen.on}
            markLabel={`${chosen.label} ${shortDate(chosen.on)}`}
          />
          <div className={s.chartLegend}>
            <span>
              <i className={`${s.swatch} ${s.swatchBand}`} />
              best to worst
            </span>
            <span>
              <i className={`${s.swatch} ${s.swatchExpected}`} />
              the usual path
            </span>
            <span>
              <i className={`${s.swatch} ${s.swatchFloor}`} />
              tax floor
            </span>
            <span>
              <i className={`${s.swatch} ${s.swatchRent}`} />
              {chosen.label} {shortDate(chosen.on)}
            </span>
          </div>
          <p className={s.chartCaption}>
            Green ticks on the baseline are expected arrivals. Ochre dashed uprights are tax
            due dates. Nothing on this chart is a bank feed.
          </p>
        </section>

        <hr className={s.rule} />

        <section aria-labelledby="levers">
          <p className={s.kicker}>What she can still change</p>
          <h2 className={s.sectionTitle} id="levers">
            The levers
          </h2>
          <p className={s.prose}>
            Arrival dates are not hers to set. These three things are: how much she spends on
            everything that is not a standing order, whether to count work that has not been
            invoiced, and whether to take a job she does not want. Every control is an integer
            of pence. Sweep one out and back and the book returns the same figures, to the
            penny — the checks at the foot of the page assert that.
          </p>

          <div className={s.controls}>
            <div className={s.controlBlock}>
              <label className={s.field}>
                <span className={s.fieldLabel}>Everything else, a month</span>
                <div className={s.sliderRow}>
                  <input
                    className={s.slider}
                    type="range"
                    min={0}
                    max={EVERYTHING_ELSE_MAX}
                    step={EVERYTHING_ELSE_STEP}
                    value={elseMonthly}
                    style={{ caretColor: "transparent" }}
                    aria-valuetext={poundsAndPence(elseMonthly)}
                    onChange={(event) => {
                      setElseMonthly(Number(event.target.value));
                    }}
                  />
                  <Fig value={elseMonthly} />
                </div>
              </label>
              <p className={s.note}>
                {poundsAndPence(elseMonthly)} × 12 ÷ 365 ={" "}
                {poundsAndPence(dailySpreadOf(elseMonthly))} a day, rounded once. Default is the
                median of the six months she wrote down.
              </p>
              <p className={s.months}>
                {EVERYTHING_ELSE_MONTHS.map((m) => (
                  <span key={m.label}>
                    {m.label}{" "}
                    <b>{m.amount === EVERYTHING_ELSE_DEFAULT ? `${money(m.amount)} ←` : money(m.amount)}</b>
                  </span>
                ))}
              </p>
              <p className={s.live}>
                usual-path cash after March rent {money(marchCash)} · daily rate{" "}
                {String(projection.dailySpread)}p
              </p>
            </div>

            <div className={s.controlBlock}>
              <Switch
                label="Count work agreed but not invoiced"
                detail="Two jobs. One is signed. The other is a lunch in November. Neither is a promise until she raises an invoice, so they stay off the band unless she asks."
                checked={includeAgreed}
                onChange={setIncludeAgreed}
              />
              <ul className={s.months}>
                {AGREED_WORK.map((job) => (
                  <li key={job.id}>
                    {anyClientById(job.clientId).name} · {poundsAndPence(job.amount)} · invoice{" "}
                    {shortDate(job.invoiceOn)} · {job.standing}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={s.controlBlock} style={{ marginTop: "1.1rem" }}>
            <Switch
              label="Take the commission she is not sure she wants"
              detail="A hypothetical invoice, raised in a number of days she sets, from a client she picks. The arrival window follows that client’s own history — or is marked as a guess if they have none."
              checked={whatIfOn}
              onChange={setWhatIfOn}
            />
            {whatIfOn ? (
              <div className={s.whatIfGrid}>
                <label className={s.field}>
                  <span className={s.fieldLabel}>Fee</span>
                  <div className={s.sliderRow}>
                    <input
                      className={s.slider}
                      type="range"
                      min={0}
                      max={FEE_MAX}
                      step={FEE_STEP}
                      value={fee}
                      style={{ caretColor: "transparent" }}
                      aria-valuetext={poundsAndPence(fee)}
                      onChange={(event) => {
                        setFee(Number(event.target.value));
                      }}
                    />
                    <Fig value={fee} />
                  </div>
                </label>
                <label className={s.field}>
                  <span className={s.fieldLabel}>Days until she can invoice</span>
                  <div className={s.sliderRow}>
                    <input
                      className={s.slider}
                      type="range"
                      min={0}
                      max={90}
                      step={1}
                      value={invoiceInDays}
                      style={{ caretColor: "transparent" }}
                      aria-valuetext={`${String(invoiceInDays)} days`}
                      onChange={(event) => {
                        setInvoiceInDays(Number(event.target.value));
                      }}
                    />
                    <span className={s.live}>{gapWords(invoiceInDays)}</span>
                  </div>
                </label>
                <label className={s.field}>
                  <span className={s.fieldLabel}>Who would pay</span>
                  <select
                    className={s.select}
                    style={{ caretColor: "transparent" }}
                    value={clientId}
                    onChange={(event) => {
                      const next = event.target.value;
                      setClientId(next);
                      if (next !== NEW_CLIENT_ID) {
                        setTermsDays(anyClientById(next).termsDays);
                      }
                    }}
                  >
                    <option value={NEW_CLIENT_ID}>Someone she has not worked for</option>
                    {CLIENTS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={s.field}>
                  <span className={s.fieldLabel}>Contract terms</span>
                  <select
                    className={s.select}
                    style={{ caretColor: "transparent" }}
                    value={String(termsDays)}
                    onChange={(event) => {
                      setTermsDays(Number(event.target.value));
                    }}
                  >
                    {[14, 30, 60, 90].map((n) => (
                      <option key={n} value={String(n)}>
                        {String(n)} days
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <p className={s.note}>
              On the worst path she runs dry on{" "}
              {projection.paths.slow.dryDay
                ? fullDate(projection.paths.slow.dryDay)
                : "no day in this model"}
              . A £1,400 job from a stranger, invoiced in a month, barely moves that date —
              they have no history, so the window is a guess two months wide. The same fee from
              Hoxton arrives sooner because Hoxton actually pays.
            </p>
          </div>
        </section>

        <hr className={s.ruleDouble} />

        <section aria-labelledby="q2">
          <p className={s.kicker}>The second question</p>
          <h2 className={s.sectionTitle} id="q2">
            When a job lands, how much of it is hers?
          </h2>
          <p className={s.prose}>
            Not a percentage of the invoice. Three subtractions she can check: the tax this
            receipt actually adds to the year’s liability, then what has to survive the gap to
            the next money, then what is left. The holdback is nil when her existing cash
            already covers that gap — which is why it is small in January, while the savings
            are still there.
          </p>

          {receipt && breakdown ? (
            <>
              <label className={s.field} style={{ maxWidth: "32rem", marginBottom: "0.6rem" }}>
                <span className={s.fieldLabel}>The receipt</span>
                <select
                  className={s.select}
                  style={{ caretColor: "transparent" }}
                  value={receipt.id}
                  onChange={(event) => {
                    setReceiptId(event.target.value);
                  }}
                >
                  {projection.receipts
                    .filter((r) => r.kind !== "shop")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.clientName} · {r.ref} · {poundsAndPence(r.amount)}
                      </option>
                    ))}
                </select>
              </label>

              <p className={s.note}>
                {receipt.work}. Arrives {fullDate(breakdown.arrives)} if they pay the way they
                usually do
                <Mark level={receipt.certainty as Confidence} />
                {receipt.windowPassed
                  ? " The fast window has already passed, so the earliest honest day is tomorrow."
                  : ""}
              </p>

              <dl className={s.mineGrid}>
                <div className={s.mineRow}>
                  <dt>Gross</dt>
                  <dd>
                    <Fig value={breakdown.gross} />
                  </dd>
                </div>
                <div className={s.mineRow}>
                  <dt>
                    Tax on this receipt
                    <span className={s.note} style={{ margin: 0 }}>
                      {percent(breakdown.taxRateBps)} of it, at the {breakdown.bandsLabel}{" "}
                      position she is in when it arrives
                      {!breakdown.receipt.taxable ? " — not taxable" : ""}
                    </span>
                  </dt>
                  <dd>
                    <Fig value={-breakdown.tax} sign="minus" tone="tax" />
                  </dd>
                </div>
                <div className={s.mineRow}>
                  <dt>
                    Held for the gap
                    <span className={s.note} style={{ margin: 0 }}>
                      {breakdown.gapTo && breakdown.gapReceipt
                        ? `${poundsAndPence(breakdown.gapOutgoings)} leaves before ${breakdown.gapReceipt.clientName} on ${fullDate(breakdown.gapTo)}; ${poundsAndPence(breakdown.cushion)} is already free`
                        : "no later receipt in the model"}
                    </span>
                  </dt>
                  <dd>
                    <Fig value={-breakdown.heldForGap} sign="minus" tone="claret" />
                  </dd>
                </div>
                <div className={`${s.mineRow} ${s.mineRowTotal}`}>
                  <dt>Genuinely hers</dt>
                  <dd>
                    <Fig value={breakdown.yours} tone="pine" />
                  </dd>
                </div>
              </dl>
              <p className={s.live}>
                {money(breakdown.yours)} + {money(breakdown.tax)} + {money(breakdown.heldForGap)}{" "}
                = {money(breakdown.gross)}
              </p>
            </>
          ) : (
            <p className={s.note}>No forward receipt on this setting of the levers.</p>
          )}
        </section>

        <hr className={s.rule} />

        <section aria-labelledby="promises">
          <p className={s.kicker}>Dated probable promises</p>
          <h2 className={s.sectionTitle} id="promises">
            Who owes her, and when it has actually arrived before
          </h2>
          <p className={s.prose}>
            An invoice is not income. The window is the fastest, the middle and the slowest
            that client has paid her — or a labelled guess, if they never have.
          </p>

          <div className={s.promiseList}>
            {projection.receipts
              .filter((r) => r.kind === "invoice" || r.kind === "agreed" || r.kind === "whatif")
              .map((r) => {
                const { start, end } = windowRange(r);
                const usual = r.dayByPath.expected;
                const span = Math.max(1, end - start);
                return (
                  <article key={r.id} className={s.promise}>
                    <div className={s.promiseRef}>
                      {r.ref}
                      <div className={s.promiseMeta}>
                        {r.issued ? `issued ${shortDate(r.issued)}` : "not yet issued"}
                      </div>
                    </div>
                    <div>
                      <div>{r.clientName}</div>
                      <p className={s.promiseWork}>{r.work}</p>
                      <div className={s.window}>
                        <span>{shortDate(start)}</span>
                        <span className={s.windowBar} aria-hidden="true">
                          <span
                            className={s.windowFill}
                            style={{ width: `${((usual - start) / span) * 100}%` }}
                          />
                          <span
                            className={s.windowTick}
                            style={{ left: `${((usual - start) / span) * 100}%` }}
                          />
                        </span>
                        <span>{shortDate(end)}</span>
                      </div>
                    </div>
                    <div className={s.promiseAmt}>
                      <Fig value={r.amount} />
                      <Mark level={r.certainty as Confidence} />
                    </div>
                  </article>
                );
              })}
          </div>

          {projection.stranded.map((item) => (
            <aside key={item.id} className={s.stranded}>
              <p className={s.kicker}>Left off the band</p>
              <p>
                <strong>
                  {item.clientName} {item.ref}
                </strong>{" "}
                — {item.work}. {poundsAndPence(item.amount)}, issued {fullDate(item.issued)}, now{" "}
                {String(item.ageDays)} days old
                {item.worstObservedLag
                  ? ` against a worst payment from them of ${String(item.worstObservedLag)} days`
                  : ""}
                . There is no observation left to place it with, so it is not guessed onto the
                chart.
                {item.chased ? ` ${item.chased}.` : ""}
              </p>
            </aside>
          ))}

          <Working
            title="The evidence: every paid invoice this tax year"
            summary={`${String(PAID_INVOICES.length)} settlements · the windows are computed from these, not from an industry average`}
          >
            <div className={s.tableWrap}>
              <table className={s.register}>
                <thead>
                  <tr>
                    <th>Issued</th>
                    <th>Paid</th>
                    <th>Days</th>
                    <th>Client</th>
                    <th>Work</th>
                    <th className={s.amt}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {PAID_INVOICES.map((inv) => (
                    <tr key={inv.id}>
                      <td>{shortDate(inv.issued)}</td>
                      <td>{shortDate(inv.paid)}</td>
                      <td>{String(inv.paid - inv.issued)}</td>
                      <td>{anyClientById(inv.clientId).name}</td>
                      <td>
                        {inv.ref} · {inv.work}
                      </td>
                      <td className={s.amt}>
                        <Fig value={inv.amount} size="small" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Working>
        </section>

        <hr className={s.rule} />

        <section aria-labelledby="ledger">
          <div className={s.ledgerHead}>
            <div>
              <p className={s.kicker}>Add it with a pencil</p>
              <h2 className={s.sectionTitle} id="ledger">
                The register
              </h2>
            </div>
            <Segmented
              legend="Path"
              value={ledgerPath}
              onChange={setLedgerPath}
              choices={PATHS.map((p) => ({ value: p, label: PATH_SHORT[p] }))}
            />
          </div>
          <p className={s.prose}>
            Every movement from tomorrow to {horizon.short}, including the daily spread rolled
            up at the end of each month so the column can be added by hand. Opening{" "}
            {poundsAndPence(OPENING_CASH)} plus receipts less payments should equal the closing
            figure the chart draws.
          </p>
          <div className={s.tableWrap}>
            <table className={s.register}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>What</th>
                  <th className={s.amt}>In</th>
                  <th className={s.amt}>Out</th>
                  <th className={s.amt}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, i) => (
                  <tr key={`${row.on}-${row.label}-${String(i)}`} className={s[`kind_${row.kind}`]}>
                    <td>{shortDate(row.on)}</td>
                    <td>
                      {row.label}
                      {row.certainty && row.kind === "receipt" ? (
                        <Mark level={row.certainty as Confidence} />
                      ) : null}
                    </td>
                    <td className={`${s.amt} ${s.in}`}>
                      {row.inAmount ? <Fig value={row.inAmount} size="small" tone="pine" /> : "—"}
                    </td>
                    <td className={`${s.amt} ${s.out}`}>
                      {row.outAmount ? (
                        <Fig value={row.outAmount} size="small" tone="claret" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={s.amt}>
                      <Fig
                        value={row.balance}
                        size="small"
                        tone={row.balance < 0 ? "claret" : "ink"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={s.ledgerNote}>
            closes at {money(ledgerClose)} · chart on this path{" "}
            {money(cashOn(projection.paths[ledgerPath], horizon.end))}
          </p>
        </section>

        <hr className={s.rule} />

        <section aria-labelledby="tax">
          <p className={s.kicker}>Accruing, then paid in lumps</p>
          <h2 className={s.sectionTitle} id="tax">
            The tax working
          </h2>
          <p className={s.prose}>
            Cash basis, rest-of-UK rates, one trade, no other income. 2024/25 and 2025/26 are
            published HMRC figures. 2026/27 carries the same bands forward, which is an
            assumption and is marked wherever it appears.
          </p>
          <div className={s.taxCols}>
            <div>
              <p className={s.kicker}>Banked this year, to today</p>
              <div className={s.steps}>
                <div className={s.step}>
                  <span>Receipts since 6 April 2025</span>
                  <Fig value={projection.today.income} size="small" />
                </div>
                <div className={s.step}>
                  <span>Allowable costs</span>
                  <Fig value={-projection.today.deductible} sign="minus" size="small" />
                </div>
                <div className={s.step}>
                  <span>Profit</span>
                  <Fig value={projection.today.profit} size="small" />
                </div>
                <div className={s.step}>
                  <span>Income tax + Class 4</span>
                  <Fig value={projection.today.accrued.total} size="small" tone="tax" />
                </div>
              </div>
              <p className={s.note}>
                Personal allowance {poundsAndPence(projection.today.accrued.allowance)}. She is
                inside the basic band. The standing commitments that reduce profit are the
                studio, the software, half the phone — not the rent, not the pension.
              </p>
            </div>
            <div>
              <p className={s.kicker}>What still leaves, on the usual path</p>
              <div className={s.steps}>
                {expected.taxPayments
                  .filter((p) => p.due > TODAY && p.amount > 0)
                  .map((p) => (
                    <div className={s.step} key={p.id}>
                      <span>
                        {fullDate(p.due)} · {p.label}
                        <Mark level={p.certainty === "filed" ? "known" : "projected"} />
                      </span>
                      <Fig value={p.amount} size="small" tone="tax" />
                    </div>
                  ))}
              </div>
              <p className={s.note}>
                The two instalments she is paying now were sized on 2024/25. The year she is in
                is larger, which is why next January is two bills stacked: the balancing
                payment for this year and the first instalment for the next.
              </p>
            </div>
          </div>
          <p className={s.note}>
            Committed outgoings are {poundsAndPence(COMMITTED.reduce((sum, i) => sum + i.amount, 0))} a
            month, on the days they leave — rent on the 1st, not a monthly average.
          </p>
        </section>

        <hr className={s.rule} />

        <section aria-labelledby="checks">
          <p className={s.kicker}>The book checks itself</p>
          <h2 className={s.sectionTitle} id="checks">
            Arithmetic
          </h2>
          <p className={s.prose}>
            Every claim above is re-derived by a second route and compared. The interaction
            checks sweep the spending control and the hypothetical fee across their whole
            range and back, and assert the projection is identical, day by day.
          </p>
          {checks ? (
            <>
              <p className={s.note}>
                {checksSummary(checks).ok
                  ? `${String(checksSummary(checks).passed)} / ${String(checksSummary(checks).total)} passed.`
                  : `${String(checksSummary(checks).passed)} / ${String(checksSummary(checks).total)} passed — something does not add up.`}
              </p>
              <ul className={s.checkList}>
                {checks.map((check) => (
                  <li
                    key={check.id}
                    className={`${s.check} ${check.passed ? s.checkPass : s.checkFail}`}
                  >
                    <span className={s.checkMark}>{check.passed ? "pass" : "fail"}</span>
                    <div>
                      <p className={s.checkClaim}>{check.claim}</p>
                      <p className={s.checkDetail}>{check.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={s.checkPending}>Running the same checks the terminal runs…</p>
          )}
        </section>

        <hr className={s.ruleDouble} />

        <section aria-labelledby="prov">
          <p className={s.kicker}>Where the figures come from</p>
          <h2 className={s.sectionTitle} id="prov">
            Provenance
          </h2>
          <ul className={s.provenance}>
            {PROVENANCE_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className={s.colophon}>
            Nell Farrar · {longDate(TODAY)} · a written case, not a measurement
          </p>
        </section>
      </div>
    </main>
  );
}
