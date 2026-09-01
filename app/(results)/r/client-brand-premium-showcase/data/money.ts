/**
 * Where eleven hundred pounds goes, and the state of the waiting list.
 *
 * PROVENANCE. Invented for this reference implementation. The cost sheet is
 * published because this audience's objection to a £1,100 coat is not the price
 * but the suspicion that the price is a positioning decision. The wool line is
 * computed from the flock arithmetic in ./lots rather than typed in, and the
 * residual — what the mill keeps — is the balance, so the column always adds up
 * to the price on the label whichever lot is selected.
 *
 * The wool line being small is the point. It is the honest answer to "£1,100 for
 * some wool", and it is not the answer a brand would invent.
 */
import { PRICE, VAT_RATE, reconcile, type Lot } from "./lots";

/** Pounds per kg of greasy wool, paid to the farm on the sorted weight. */
export const WOOL_PRICE_PER_KG = 4.2;

/**
 * British Wool's 2025 average return to producers was in the region of 60p a kg
 * greasy, and Blackface fleece has traded below that. The comparison is the
 * reason the farms sell to the mill.
 */
export const AUCTION_PRICE_PER_KG = 0.62;

/** Everything that does not vary with the lot, in pounds per coat, ex-VAT. */
export const FIXED_COSTS: { label: string; amount: number; note?: string }[] = [
  {
    label: "Haulage, Kilchoan to Bradford and back",
    amount: 8.6,
    note: "Two hundred and forty miles each way. There is no scour in Scotland.",
  },
  { label: "Scouring and drying", amount: 13.9, note: "Run as a single lot, which the scour charges a stopped-line fee for." },
  { label: "Carding and spinning, in the mill", amount: 94.0 },
  { label: "Warping and weaving, in the mill", amount: 171.0, note: "Two looms, two weavers, about six metres an hour." },
  { label: "Fulling and finishing, Selkirk", amount: 61.5 },
  { label: "Cutting and making, Hawick", amount: 268.0, note: "About nine hours of one person's work, plus the presser." },
  { label: "Lining, canvas, interlining, thread", amount: 38.2 },
  { label: "Horn buttons, six and a spare", amount: 17.4 },
  { label: "Label, box, carriage to you", amount: 24.0 },
  {
    label: "Repair reserve",
    amount: 32.0,
    note: "Eight per cent of every lot's cloth is never sold. This is what holding it costs.",
  },
  {
    label: "Rates, power, insurance, the office",
    amount: 108.0,
    note: "The mill building, the two people who are not making anything, and the electricity for a 1912 mule.",
  },
];

export type CostLine = { label: string; amount: number; note?: string };

export function costSheet(lot: Lot): {
  lines: CostLine[];
  wool: number;
  auctionEquivalent: number;
  net: number;
  vat: number;
  total: number;
  residual: number;
  greasyPerCoat: number;
} {
  const { greasyPerCoat } = reconcile(lot);
  const wool = greasyPerCoat * WOOL_PRICE_PER_KG;
  const auctionEquivalent = greasyPerCoat * AUCTION_PRICE_PER_KG;
  const net = PRICE / (1 + VAT_RATE);
  const vat = PRICE - net;
  const fixed = FIXED_COSTS.reduce((sum, line) => sum + line.amount, 0);
  const residual = net - fixed - wool;

  return {
    lines: [
      {
        label: `Wool, paid to ${lot.farm}`,
        amount: wool,
        note: `${greasyPerCoat.toFixed(2)} kg of greasy fleece stands behind one coat, at £${WOOL_PRICE_PER_KG.toFixed(2)} a kg. At auction the same wool would fetch £${auctionEquivalent.toFixed(2)}.`,
      },
      ...FIXED_COSTS,
      {
        label: "What the mill keeps",
        amount: residual,
        note: "Before tax on profits, and before anything is put back into the building. This is the balancing figure, which is why it moves a pound or two between lots.",
      },
    ],
    wool,
    auctionEquivalent,
    net,
    vat,
    total: PRICE,
    residual,
    greasyPerCoat,
  };
}

export type ListState = {
  lotCode: string;
  /** People waiting for this lot, as at 1 September 2026. */
  waiting: number;
  /** Which clip a name joining today would be served from. */
  servedFrom: string;
  /** When that clip's coats leave Hawick. */
  dispatch: string;
  comment: string;
};

/** As at 1 September 2026. Updated by hand on the first of the month. */
export const WAITING_LIST: ListState[] = [
  {
    lotCode: "AW/2026/TBG",
    waiting: 214,
    servedFrom: "the 2028 clip",
    dispatch: "November 2028 – March 2029",
    comment:
      "The undyed moorit is the one everyone wants and the flock is 186 ewes, so it is three clips deep. We will not buy Shetland fleece from anywhere else to shorten it.",
  },
  {
    lotCode: "AW/2026/CNF",
    waiting: 88,
    servedFrom: "the 2027 clip",
    dispatch: "December 2027 – May 2028",
    comment: "About a clip and a half. The olive is the least asked-for of the four, which is nothing to do with the cloth.",
  },
  {
    lotCode: "AW/2026/CMD",
    waiting: 62,
    servedFrom: "the coming clip, being woven now",
    dispatch: "February – August 2027",
    comment:
      "The biggest lot and the shortest list. If you want a coat this winter rather than in three years, this is the honest answer, and it is also the best cloth of the four for weather.",
  },
  {
    lotCode: "AW/2026/ARH",
    waiting: 51,
    servedFrom: "the 2027 clip",
    dispatch: "October 2027 – January 2028",
    comment: "Forty-four coats a year and no prospect of more; Neil Ferguson is not increasing the flock.",
  },
];

export function listFor(lotCode: string): ListState {
  return WAITING_LIST.find((entry) => entry.lotCode === lotCode) ?? WAITING_LIST[0];
}

export const LIST_TOTAL = WAITING_LIST.reduce((sum, entry) => sum + entry.waiting, 0);
