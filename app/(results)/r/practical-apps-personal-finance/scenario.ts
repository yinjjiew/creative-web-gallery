/**
 * The scenario.
 *
 * WHERE THIS DATA COMES FROM — every figure below is written, not measured. It
 * is a worked case built to the numbers in the brief: a freelance illustrator
 * whose publisher pays sixty days after invoice and sometimes ninety, whose good
 * month is £8,000 and bad month £400, who has £2,300 of committed monthly
 * outgoings and £11,000 in savings, and who owes tax in two lumps a year. No
 * bank is connected, because there is nothing to connect to; the balances are
 * the sort of figure she would read off her banking app and type in.
 *
 * The tax rates applied to it are not invented. They are the published HMRC
 * figures for 2024/25 and 2025/26 (see `tax.ts`), and where 2026/27 is used the
 * interface says the rates are carried forward as an assumption.
 *
 * The payment-lag windows are not invented either, which is the point of
 * modelling it this way: they are computed from the days between issue and
 * payment on her own paid invoices, listed below and shown in the interface, so
 * every estimate can be traced to the observations that produced it.
 */
import { day, gbp, type Day, type Pence } from "./money";

/**
 * The scenario is frozen to a date rather than to `Date.now()`. A cash-flow
 * projection whose answers changed with the wall clock could not be checked
 * against a written figure, and the brief's question — can I pay the rent in
 * March — only means something from a fixed standpoint.
 */
export const TODAY: Day = day("2026-01-12");

export const HER_NAME = "Nell Farrar";
export const HER_TRADE = "illustrator";

export type Horizon = { id: string; label: string; short: string; end: Day };

/**
 * Three forward windows, all of which end on a date that means something: the
 * tax year end, the second payment on account, and the January that carries the
 * balancing payment plus the next year's first instalment.
 */
export const HORIZONS: Horizon[] = [
  { id: "apr", label: "to 5 April — end of the tax year", short: "5 Apr", end: day("2026-04-05") },
  { id: "jul", label: "to 31 July — second payment on account", short: "31 Jul", end: day("2026-07-31") },
  { id: "jan", label: "to 31 January 2027 — the next big bill", short: "31 Jan 27", end: day("2027-01-31") },
];

/**
 * Seven months by default: far enough to contain both known tax payments and the
 * point at which her pipeline runs out, near enough that a single week is still a
 * legible width on the chart.
 */
export const DEFAULT_HORIZON = "jul";

// ─── what is actually in the accounts ──────────────────────────────────────────

export type Account = { id: string; name: string; balance: Pence; note: string };

export const ACCOUNTS: Account[] = [
  {
    id: "current",
    name: "Current account",
    balance: gbp("1240.00"),
    note: "read off her banking app on 12 January and typed in",
  },
  {
    id: "savings",
    name: "Savings",
    balance: gbp("11000.00"),
    note: "the £11,000 she cannot tell is comfortable or precarious",
  },
];

export const OPENING_CASH: Pence = ACCOUNTS.reduce((sum, a) => sum + a.balance, 0);

// ─── who owes her money, and how they have actually behaved ───────────────────

export type Client = {
  id: string;
  name: string;
  kind: string;
  /** Days from invoice to payment that the contract asks for. */
  termsDays: number;
  note: string;
};

export const CLIENTS: Client[] = [
  {
    id: "fenwood",
    name: "Fenwood Press",
    kind: "picture-book publisher — her largest client",
    termsDays: 60,
    note: "sixty-day terms, has never once paid inside them",
  },
  {
    id: "havering",
    name: "Havering & Sloe",
    kind: "design studio, commercial work",
    termsDays: 30,
    note: "thirty-day terms, drifts a few days over",
  },
  {
    id: "reader",
    name: "The Common Reader",
    kind: "monthly magazine",
    termsDays: 30,
    note: "small amounts, and the only client who pays early",
  },
  {
    id: "hoxton",
    name: "Hoxton Art School",
    kind: "teaching — short courses and workshops",
    termsDays: 14,
    note: "pays on the fortnightly payroll run, almost to the day",
  },
  {
    id: "ashgrove",
    name: "Ashgrove Books",
    kind: "literary imprint, jacket commissions",
    termsDays: 90,
    note: "ninety-day terms and only one previous invoice to judge them by",
  },
  {
    id: "marrow",
    name: "Marrow & Pike",
    kind: "quarterly magazine",
    termsDays: 30,
    note: "was reliable, then changed hands",
  },
];

export function clientById(id: string): Client {
  const found = CLIENTS.find((c) => c.id === id);
  if (!found) throw new Error(`no client ${id}`);
  return found;
}

/** An invoice that has been raised and settled. These are the evidence base. */
export type PaidInvoice = {
  id: string;
  clientId: string;
  ref: string;
  work: string;
  amount: Pence;
  issued: Day;
  paid: Day;
};

/**
 * Everything she has been paid this tax year, in the order it arrived. The book
 * she finished in the autumn is why there is money in the account in January,
 * and the reason the months ahead look the way they do is that it is finished.
 */
export const PAID_INVOICES: PaidInvoice[] = [
  {
    id: "p-f014",
    clientId: "fenwood",
    ref: "2025-014",
    work: "Marigold & the Whale — twelve interior spreads",
    amount: gbp("6400.00"),
    issued: day("2025-04-18"),
    paid: day("2025-06-29"),
  },
  {
    id: "p-f019",
    clientId: "fenwood",
    ref: "2025-019",
    work: "Marigold & the Whale — cover and jacket",
    amount: gbp("2200.00"),
    issued: day("2025-05-30"),
    paid: day("2025-08-26"),
  },
  {
    id: "p-m021",
    clientId: "marrow",
    ref: "2025-021",
    work: "Two-page opener, summer issue",
    amount: gbp("620.00"),
    issued: day("2025-06-05"),
    paid: day("2025-07-16"),
  },
  {
    id: "p-h022",
    clientId: "havering",
    ref: "2025-022",
    work: "Spot illustrations, summer campaign",
    amount: gbp("1450.00"),
    issued: day("2025-06-12"),
    paid: day("2025-07-16"),
  },
  {
    id: "p-x025",
    clientId: "hoxton",
    ref: "2025-025",
    work: "Two-day summer workshop",
    amount: gbp("680.00"),
    issued: day("2025-06-27"),
    paid: day("2025-07-09"),
  },
  {
    id: "p-c027",
    clientId: "reader",
    ref: "2025-027",
    work: "Cover, July issue",
    amount: gbp("520.00"),
    issued: day("2025-07-04"),
    paid: day("2025-08-01"),
  },
  {
    id: "p-a030",
    clientId: "ashgrove",
    ref: "2025-030",
    work: "Jacket illustration — The Salt Path reissue",
    amount: gbp("1850.00"),
    issued: day("2025-08-01"),
    paid: day("2025-11-12"),
  },
  {
    id: "p-f031",
    clientId: "fenwood",
    ref: "2025-031",
    work: "Marigold reprint — four new spreads",
    amount: gbp("1600.00"),
    issued: day("2025-08-08"),
    paid: day("2025-10-15"),
  },
  {
    id: "p-m033",
    clientId: "marrow",
    ref: "2025-033",
    work: "Cover, autumn issue",
    amount: gbp("480.00"),
    issued: day("2025-08-22"),
    paid: day("2025-09-24"),
  },
  {
    id: "p-h034",
    clientId: "havering",
    ref: "2025-034",
    work: "Editorial series, three pieces",
    amount: gbp("2100.00"),
    issued: day("2025-08-29"),
    paid: day("2025-09-30"),
  },
  {
    id: "p-c036",
    clientId: "reader",
    ref: "2025-036",
    work: "Two spot illustrations, October issue",
    amount: gbp("360.00"),
    issued: day("2025-09-12"),
    paid: day("2025-10-08"),
  },
  {
    id: "p-f038",
    clientId: "fenwood",
    ref: "2025-038",
    work: "The Lantern Fox — roughs and character studies",
    amount: gbp("3200.00"),
    issued: day("2025-09-26"),
    paid: day("2025-12-08"),
  },
  {
    id: "p-x040",
    clientId: "hoxton",
    ref: "2025-040",
    work: "Autumn short course, six sessions",
    amount: gbp("1320.00"),
    issued: day("2025-10-03"),
    paid: day("2025-10-16"),
  },
  {
    id: "p-f046",
    clientId: "fenwood",
    ref: "2025-046",
    work: "The Lantern Fox — fourteen finished spreads",
    amount: gbp("7200.00"),
    issued: day("2025-10-12"),
    paid: day("2025-12-22"),
  },
  {
    id: "p-h042",
    clientId: "havering",
    ref: "2025-042",
    work: "Packaging pattern, two colourways",
    amount: gbp("980.00"),
    issued: day("2025-10-24"),
    paid: day("2025-12-01"),
  },
  {
    id: "p-c044",
    clientId: "reader",
    ref: "2025-044",
    work: "Cover, December issue",
    amount: gbp("520.00"),
    issued: day("2025-11-07"),
    paid: day("2025-12-04"),
  },
  {
    id: "p-x048",
    clientId: "hoxton",
    ref: "2025-048",
    work: "Winter masterclass",
    amount: gbp("640.00"),
    issued: day("2025-12-05"),
    paid: day("2025-12-18"),
  },
];

/** An invoice raised and not yet paid: a dated promise, not income. */
export type OpenInvoice = {
  id: string;
  clientId: string;
  ref: string;
  work: string;
  amount: Pence;
  issued: Day;
  /** Contract terms in days. The floor of any optimistic estimate. */
  termsDays: number;
  /** Anything she has done about it, shown so the list is a working list. */
  chased?: string;
};

export const OPEN_INVOICES: OpenInvoice[] = [
  {
    id: "o-m039",
    clientId: "marrow",
    ref: "2025-039",
    work: "Four-page feature, autumn issue",
    amount: gbp("1480.00"),
    issued: day("2025-09-15"),
    termsDays: 30,
    chased: "chased 20 Oct, 14 Nov and 8 Dec — new accounts department, no date given",
  },
  {
    id: "o-a047",
    clientId: "ashgrove",
    ref: "2025-047",
    work: "Two jacket illustrations — Wolf Hall reissue",
    amount: gbp("2900.00"),
    issued: day("2025-11-28"),
    termsDays: 90,
  },
  {
    id: "o-f049",
    clientId: "fenwood",
    ref: "2025-049",
    work: "The Lantern Fox — cover, case and endpapers",
    amount: gbp("2400.00"),
    issued: day("2025-12-19"),
    termsDays: 60,
  },
  {
    id: "o-h051",
    clientId: "havering",
    ref: "2025-051",
    work: "Christmas card series, six designs",
    amount: gbp("1150.00"),
    issued: day("2025-12-30"),
    termsDays: 30,
  },
  {
    id: "o-x001",
    clientId: "hoxton",
    ref: "2026-001",
    work: "Spring short course, six sessions",
    amount: gbp("1320.00"),
    issued: day("2026-01-06"),
    termsDays: 14,
  },
  {
    id: "o-c002",
    clientId: "reader",
    ref: "2026-002",
    work: "Two spot illustrations, February issue",
    amount: gbp("360.00"),
    issued: day("2026-01-09"),
    termsDays: 30,
  },
];

/**
 * Work agreed but not yet invoiced. Deliberately outside the projection unless
 * she asks for it, because it is not a promise with a date: nobody owes her
 * anything until she has delivered and raised the invoice.
 */
export type AgreedWork = {
  id: string;
  clientId: string;
  work: string;
  amount: Pence;
  /** When she expects to be able to raise the invoice. */
  invoiceOn: Day;
  termsDays: number;
  standing: string;
};

export const AGREED_WORK: AgreedWork[] = [
  {
    id: "u-fen",
    clientId: "fenwood",
    work: "Marigold & the Whale — paperback cover refresh",
    amount: gbp("1900.00"),
    invoiceOn: day("2026-02-20"),
    termsDays: 60,
    standing: "commissioned, contract signed, artwork due 18 February",
  },
  {
    id: "u-bright",
    clientId: "brightfield",
    work: "Five covers — the Grimsdyke series",
    amount: gbp("6000.00"),
    invoiceOn: day("2026-04-24"),
    termsDays: 60,
    standing: "verbal agreement over lunch in November, contract unsigned, no brief yet",
  },
];

/** A new client Bright Field has no payment history at all, which matters. */
export const BRIGHT_FIELD: Client = {
  id: "brightfield",
  name: "Bright Field Publishing",
  kind: "new client — no invoice has ever been raised",
  termsDays: 60,
  note: "no history, so any arrival date for them is a guess and is drawn as one",
};

export function anyClientById(id: string): Client {
  if (id === BRIGHT_FIELD.id) return BRIGHT_FIELD;
  return clientById(id);
}

// ─── income that is not an invoice ────────────────────────────────────────────

/**
 * Royalties. Twice a year, and the amount is known once the statement arrives —
 * which makes the March one a known future receipt rather than an estimate. It
 * is the only forward receipt in the whole model with a firm date.
 */
export type FixedReceipt = {
  id: string;
  label: string;
  detail: string;
  amount: Pence;
  on: Day;
  taxable: boolean;
};

export const FIXED_RECEIPTS: FixedReceipt[] = [
  {
    id: "r-sep",
    label: "Fenwood royalties",
    detail: "statement for January–June 2025",
    amount: gbp("412.60"),
    on: day("2025-09-30"),
    taxable: true,
  },
  {
    id: "r-mar",
    label: "Fenwood royalties",
    detail: "statement for July–December 2025, received 6 January — amount and date both confirmed",
    amount: gbp("340.00"),
    on: day("2026-03-31"),
    taxable: true,
  },
];

/**
 * Her own print shop pays out on the 8th of each month. Small, and genuinely
 * variable, so future payouts are the low, median and high of what has actually
 * landed rather than an average pretending to be a fact.
 */
export const SHOP_PAYOUT_DAY = 8;

export const SHOP_HISTORY: { on: Day; amount: Pence }[] = [
  { on: day("2025-04-08"), amount: gbp("58.00") },
  { on: day("2025-05-08"), amount: gbp("77.00") },
  { on: day("2025-06-08"), amount: gbp("112.00") },
  { on: day("2025-07-08"), amount: gbp("96.00") },
  { on: day("2025-08-08"), amount: gbp("84.00") },
  { on: day("2025-09-08"), amount: gbp("62.00") },
  { on: day("2025-10-08"), amount: gbp("118.00") },
  { on: day("2025-11-08"), amount: gbp("74.00") },
  { on: day("2025-12-08"), amount: gbp("158.00") },
  { on: day("2026-01-08"), amount: gbp("131.00") },
];

// ─── what leaves, and when ───────────────────────────────────────────────────

/**
 * The committed outgoings: £2,300.00 a month exactly, on the days they actually
 * leave. Modelled as dated items rather than a monthly total because the whole
 * question is whether money is present on the first of the month, and a monthly
 * average cannot answer that.
 *
 * `deductible` is the part that reduces her trading profit. The pension is not
 * deductible from trade profit — relief comes at source — and only half the
 * phone is business use, which is the sort of detail that changes the tax number
 * by enough to matter.
 */
export type CommittedItem = {
  id: string;
  label: string;
  detail: string;
  dayOfMonth: number;
  amount: Pence;
  deductible: Pence;
};

export const COMMITTED: CommittedItem[] = [
  {
    id: "rent",
    label: "Rent",
    detail: "one-bedroom flat, standing order on the 1st",
    dayOfMonth: 1,
    amount: gbp("1150.00"),
    deductible: gbp("0"),
  },
  {
    id: "council",
    label: "Council tax",
    detail: "direct debit, twelve instalments",
    dayOfMonth: 1,
    amount: gbp("132.00"),
    deductible: gbp("0"),
  },
  {
    id: "studio",
    label: "Studio desk share",
    detail: "one desk in a shared studio — allowable in full",
    dayOfMonth: 1,
    amount: gbp("180.00"),
    deductible: gbp("180.00"),
  },
  {
    id: "software",
    label: "Software",
    detail: "Adobe, Procreate, cloud backup — allowable in full",
    dayOfMonth: 3,
    amount: gbp("32.00"),
    deductible: gbp("32.00"),
  },
  {
    id: "utilities",
    label: "Gas, electricity, broadband",
    detail: "direct debit on the 5th",
    dayOfMonth: 5,
    amount: gbp("145.00"),
    deductible: gbp("0"),
  },
  {
    id: "food",
    label: "Food and household",
    detail: "the weekly shop, averaged and charged on the 6th",
    dayOfMonth: 6,
    amount: gbp("380.00"),
    deductible: gbp("0"),
  },
  {
    id: "phone",
    label: "Phone",
    detail: "half claimed as business use",
    dayOfMonth: 12,
    amount: gbp("26.00"),
    deductible: gbp("13.00"),
  },
  {
    id: "protection",
    label: "Income protection",
    detail: "the policy she took out after the 2024 lull",
    dayOfMonth: 15,
    amount: gbp("41.00"),
    deductible: gbp("0"),
  },
  {
    id: "travel",
    label: "Travelcard",
    detail: "monthly, on the 20th",
    dayOfMonth: 20,
    amount: gbp("64.00"),
    deductible: gbp("0"),
  },
  {
    id: "pension",
    label: "Pension",
    detail: "SIPP contribution — relief at source, so not a trade expense",
    dayOfMonth: 25,
    amount: gbp("150.00"),
    deductible: gbp("0"),
  },
];

/** Business costs that are not monthly. Cash basis: deducted on the day paid. */
export type OneOffExpense = {
  id: string;
  label: string;
  on: Day;
  amount: Pence;
  deductible: Pence;
  committed: boolean;
};

export const ONE_OFF_EXPENSES: OneOffExpense[] = [
  {
    id: "e-ins",
    label: "Public liability and equipment insurance",
    on: day("2025-05-09"),
    amount: gbp("148.00"),
    deductible: gbp("148.00"),
    committed: false,
  },
  {
    id: "e-acct",
    label: "Accountant — 2024/25 return",
    on: day("2025-06-20"),
    amount: gbp("540.00"),
    deductible: gbp("540.00"),
    committed: false,
  },
  {
    id: "e-kit",
    label: "iPad Pro and A3 scanner",
    on: day("2025-07-22"),
    amount: gbp("1340.00"),
    deductible: gbp("1340.00"),
    committed: false,
  },
  {
    id: "e-mat1",
    label: "Paper, inks and framing — Marigold originals",
    on: day("2025-09-04"),
    amount: gbp("386.00"),
    deductible: gbp("386.00"),
    committed: false,
  },
  {
    id: "e-travel",
    label: "Train fares — three publisher meetings",
    on: day("2025-10-30"),
    amount: gbp("216.00"),
    deductible: gbp("216.00"),
    committed: false,
  },
  {
    id: "e-print",
    label: "Print run for the shop",
    on: day("2025-11-18"),
    amount: gbp("478.00"),
    deductible: gbp("478.00"),
    committed: false,
  },
  {
    id: "e-mat2",
    label: "Paper and inks",
    on: day("2025-12-11"),
    amount: gbp("320.00"),
    deductible: gbp("320.00"),
    committed: false,
  },
  {
    id: "e-mat3",
    label: "Paper and inks — ordered, invoiced on delivery",
    on: day("2026-02-14"),
    amount: gbp("240.00"),
    deductible: gbp("240.00"),
    committed: true,
  },
];

/**
 * Everything that is not committed and not a business cost: the meal out, the
 * train to see a friend, the replacement kettle. Six recorded months, from which
 * the default is the median.
 *
 * This is the only figure in the model she sets herself, and it is deliberately
 * separate from the payment-timing bands: the band shows what she cannot control
 * — when clients pay — and this shows what she can.
 */
export const EVERYTHING_ELSE_MONTHS: { label: string; amount: Pence }[] = [
  { label: "July", amount: gbp("248.00") },
  { label: "August", amount: gbp("402.00") },
  { label: "September", amount: gbp("186.00") },
  { label: "October", amount: gbp("297.00") },
  { label: "November", amount: gbp("323.00") },
  { label: "December", amount: gbp("498.00") },
];

/** £10 steps, so the control can only ever produce whole integers of pence. */
export const EVERYTHING_ELSE_STEP: Pence = gbp("10");
export const EVERYTHING_ELSE_MAX: Pence = gbp("900");

// ─── tax already settled and tax already scheduled ───────────────────────────

/**
 * Two closed tax years. 2024/25 is filed: the profit and therefore the liability
 * are facts, and so are the two payments on account she made during 2025 against
 * it. 2023/24 only matters because it sized those instalments.
 *
 * The step up from £26,800 to something over £32,000 is why next January is
 * worse than this one, and it is the mechanism she keeps getting caught by: the
 * instalments she is paying now were sized on a smaller year.
 */
export const FILED = {
  y2023Liability: gbp("2940.00"),
  y2024Profit: gbp("26800.00"),
};

export const PROVENANCE_LINES = [
  "Every amount on this page is a written scenario, not a measurement. It is built to the figures in the brief: sixty-day publisher terms that sometimes run to ninety, £8,000 in a good month and £400 in a bad one, £2,300 a month of committed outgoings, £11,000 in savings, and tax in two lumps a year.",
  "Nothing connects to a bank. The two balances are the kind of number she would read off a banking app and type in, dated 12 January 2026.",
  "The income tax and Class 4 National Insurance rates are the published HMRC thresholds for 2024/25 and 2025/26: a £12,570 personal allowance, 20% on the next £37,700 of taxable profit, 40% above that, and Class 4 at 6% between £12,570 and £50,270 and 2% above. 2026/27 carries the same figures forward, which is an assumption and is marked as one wherever a 2026/27 number appears.",
  "The arrival windows are computed from her own paid invoices — the days between issue and payment, listed in full under each client — and not from a model of publisher behaviour in general.",
];
