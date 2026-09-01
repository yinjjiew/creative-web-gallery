/**
 * The four lots of the 2026 clip, and the arithmetic that turns a flock into a
 * number of coats.
 *
 * PROVENANCE. Ardnamurchan Woollens does not exist. Every farm, farmer, flock,
 * date, weight and micron figure below was written for this reference
 * implementation. They are internally consistent — the tonnages and the coat
 * counts are computed from the flock sizes by `reconcile()` rather than typed in
 * — and the process, the yields and the orders of magnitude follow how a small
 * British woollen mill actually works, but they are not measurements of
 * anything. The interface says so where a visitor can see it, not only here.
 *
 * Where a real-world figure informed an invented one it is named in a comment,
 * so that a reader can tell a plausible invention from a fact.
 */

/** Finished cloth, grams per square metre. A coating weight. */
export const CLOTH_GSM = 640;

/** Finished cloth width off the Selkirk finisher, metres. */
export const CLOTH_WIDTH_M = 1.5;

/** Cloth consumed by one coat, including cutting waste, metres. */
export const COAT_CLOTH_M = 2.8;

/** Share of each lot's cloth held back, unsold, against future repairs. */
export const REPAIR_RESERVE = 0.08;

/** Retail price, pounds, VAT included. */
export const PRICE = 1100;

/** UK VAT on clothing for adults. */
export const VAT_RATE = 0.2;

export type YearShade = {
  year: number;
  /** Mean fibre diameter of that year's clip, micrometres. */
  micron: number;
  /** The finished cloth's colour that year. */
  hex: string;
};

export type Lot = {
  /** Lot code as it appears on the label sewn inside the coat. */
  code: string;
  short: string;
  farm: string;
  township: string;
  farmer: string;
  /** Six-figure grid reference of the steading. */
  grid: string;
  breed: string;
  ewes: number;
  ground: string;
  /** Metres above sea level over which the flock grazes. */
  altitude: string;
  /** The specific, checkable thing about this flock. */
  note: string;
  /** What the cloth's colour is and how it got there. */
  colour: string;
  dye: string | null;
  hex: string;
  /** A second hex for lots whose cloth is visibly two-toned in the piece. */
  hexAlt: string;
  /** Mean greasy fleece weight per ewe, kg. */
  fleeceKg: number;
  /** Mean fibre diameter of the 2026 clip, micrometres. */
  micron: number;
  /** Coefficient of variation of fibre diameter within the lot, per cent. */
  cv: number;
  /** Mean staple length, mm. */
  staple: number;
  /** Yarn: woollen-spun count, and turns per metre. */
  yarn: string;
  /** Fraction of greasy weight surviving the scour. */
  scourYield: number;
  /** Fraction of scoured weight surviving carding and spinning. */
  spinYield: number;
  /** Fraction of yarn weight surviving weaving and finishing. */
  finishYield: number;
  /** Dated stages, keyed to ROUTE below. */
  dates: Record<RouteKey, string>;
  /** Faults recorded against this lot's cloth, per 100 m woven. */
  faultsPer100m: number;
  history: YearShade[];
  /** How the cloth behaves that a buyer would want warning about. */
  warning: string;
};

export type RouteKey =
  | "clip"
  | "sort"
  | "bale"
  | "scour"
  | "spin"
  | "warp"
  | "weave"
  | "finish"
  | "mend"
  | "cut"
  | "make";

export const ROUTE: {
  key: RouteKey;
  stage: string;
  place: string;
  who: string;
  what: string;
}[] = [
  {
    key: "clip",
    stage: "Clip",
    place: "At the farm",
    who: "A shearing gang of three, paid by the sheep",
    what: "The whole flock is shorn over two or three days. One flock, one clip, into one heap. Nothing from a neighbour goes in, which is the only reason anything further down this page can be said with a straight face.",
  },
  {
    key: "sort",
    stage: "Sort and skirt",
    place: "The wool shed, Kilchoan",
    who: "Two sorters, by hand and by eye",
    what: "Belly wool, britch, dagged edges and anything with vegetable matter in it are pulled out and sold on for carpet yarn. About a seventh of the weight leaves here, and this is the difference between a coat and a doormat.",
  },
  {
    key: "bale",
    stage: "Bale and weigh",
    place: "The wool shed, Kilchoan",
    who: "Weighed on the mill's platform scale",
    what: "The sorted fleece is pressed into bales, each stencilled with the lot code. From here the lot has a number and every weight is recorded against it.",
  },
  {
    key: "scour",
    stage: "Scour",
    place: "Calder Scouring, Bradford",
    who: "Contracted out; the mill has no scour",
    what: "Grease, suint and Ardnamurchan peat are washed out in five bowls of warm water and soda. Bales are run as a single lot with the line stopped and swept before and after, which the scour charges extra for and which is the only way the lot stays a lot.",
  },
  {
    key: "spin",
    stage: "Card and spin",
    place: "The mill, Kilchoan",
    who: "Three spinners; the mule dates from 1912",
    what: "Woollen-spun, not worsted: the fibres are carded rather than combed, so short and long lie together and the yarn keeps air in it. This is what makes the cloth warm at 640 g/m² instead of merely heavy.",
  },
  {
    key: "warp",
    stage: "Warp",
    place: "The mill, Kilchoan",
    who: "One warper",
    what: "The warp is wound to length and sett at twelve ends to the centimetre. A warp is one lot's yarn only; there is no joining a short lot to the next one.",
  },
  {
    key: "weave",
    stage: "Weave",
    place: "The mill, Kilchoan",
    who: "Two Dobcross looms, two weavers",
    what: "Two-and-two twill, twelve picks to the centimetre. The looms run at about a hundred and ninety picks a minute, which is slow, and stop themselves on a broken end.",
  },
  {
    key: "finish",
    stage: "Full and finish",
    place: "Tweedside Finishers, Selkirk",
    who: "Contracted out",
    what: "Milled in soap and water until the cloth shrinks about a seventh in each direction and the weave closes up, then tentered, cropped and pressed. Fulling is what makes wool cloth weatherproof; no coating is added.",
  },
  {
    key: "mend",
    stage: "Inspect and mend",
    place: "The mill, Kilchoan",
    who: "One mender, at a perch",
    what: "Every metre is drawn over a lit glass and faults are darned by hand. Faults are counted and the count is published below, because a cloth with no recorded faults has not been inspected.",
  },
  {
    key: "cut",
    stage: "Cut",
    place: "Bowmont Workshop, Hawick",
    who: "One cutter",
    what: "Laid single-ply and cut to one of seven sizes, or to your measurements. Cloth is matched across the back seam and the pockets, which costs about 200 mm a coat and is the reason for the cutting allowance.",
  },
  {
    key: "make",
    stage: "Make",
    place: "Bowmont Workshop, Hawick",
    who: "Fourteen machinists and one presser",
    what: "About nine hours a coat. Canvas front, bound edges, felled lining, horn buttons stitched through a stay. Each coat gets a number, and that number is how it comes back for repair thirty years later.",
  },
];

export const LOTS: Lot[] = [
  {
    code: "AW/2026/TBG",
    short: "TBG",
    farm: "Torr Beag",
    township: "Above Kilchoan",
    farmer: "Morag Cameron",
    grid: "NM 487 638",
    breed: "Shetland",
    ewes: 186,
    ground: "Heather, deer grass and bog myrtle on the shoulder behind the village",
    altitude: "120–310 m",
    note: "The smallest and oldest of the four flocks: Shetlands that Morag Cameron's mother brought over from Yell in 1978, kept unimproved since. They are moorit — a brown that the sheep is born with — and the fleeces are sorted by hand into three shades before spinning. Nothing in a Torr Beag coat is dyed. Its colour is the colour of the animal, which is also why it is the lot that varies most from year to year.",
    colour: "Undyed moorit, sorted into three shades and spun as a mix",
    dye: null,
    hex: "#7c5e48",
    hexAlt: "#96795f",
    fleeceKg: 1.9,
    micron: 26.1,
    cv: 24.8,
    staple: 82,
    yarn: "Woollen-spun, 2/11 Nm, 380 t/m Z",
    // Shetland scours well; the loss here is mostly the hill's own dirt.
    scourYield: 0.68,
    spinYield: 0.88,
    finishYield: 0.94,
    dates: {
      clip: "2–4 June 2026",
      sort: "8–12 June 2026",
      bale: "13 June 2026",
      scour: "24 June 2026",
      spin: "1–18 July 2026",
      warp: "3 August 2026",
      weave: "10 August – 2 September 2026",
      finish: "28 September – 6 October 2026",
      mend: "9–16 October 2026",
      cut: "from 20 October 2026",
      make: "November 2026 – March 2027",
    },
    faultsPer100m: 7.4,
    history: [
      { year: 2019, micron: 25.4, hex: "#6f5340" },
      { year: 2020, micron: 26.8, hex: "#7f624c" },
      { year: 2021, micron: 25.9, hex: "#73573f" },
      { year: 2022, micron: 27.2, hex: "#8a6c55" },
      { year: 2023, micron: 26.0, hex: "#785b45" },
      { year: 2024, micron: 25.1, hex: "#6b503d" },
      { year: 2025, micron: 26.6, hex: "#856650" },
      { year: 2026, micron: 26.1, hex: "#7c5e48" },
    ],
    warning:
      "Two Torr Beag coats bought five years apart will not be the same brown. The 2022 cloth was noticeably lighter than the 2024 and both were sold as moorit. If you want a matching pair, buy them from one clip.",
  },
  {
    code: "AW/2026/CNF",
    short: "CNF",
    farm: "Cnoc Fhiar",
    township: "Sanna",
    farmer: "Iain MacLachlan",
    grid: "NM 447 691",
    breed: "North Country Cheviot",
    ewes: 240,
    ground: "Shell-sand machair and dune grass behind Sanna Bay",
    altitude: "0–40 m",
    note: "This flock grazes machair, not hill, so the fleece carries almost no peat stain and scours to the palest white of the four lots — which is why it is the only one we dye. It also carries a great deal of shell sand, and sand is weight that washes away: Cnoc Fhiar has the worst scouring yield we buy, and Iain MacLachlan is paid on the greasy weight regardless, which he will tell you is the only sensible arrangement.",
    colour: "Piece-dyed at Selkirk to a dull olive, dye lot recorded on the label",
    dye: "Tweedside Finishers, dye lot 26/114",
    hex: "#6b6b52",
    hexAlt: "#7d7d61",
    fleeceKg: 2.6,
    micron: 29.4,
    cv: 22.6,
    staple: 108,
    yarn: "Woollen-spun, 2/9 Nm, 340 t/m Z",
    // Machair sand is the reason this is the poorest yield of the four.
    scourYield: 0.62,
    spinYield: 0.9,
    finishYield: 0.94,
    dates: {
      clip: "6–8 June 2026",
      sort: "15–19 June 2026",
      bale: "20 June 2026",
      scour: "1 July 2026",
      spin: "20 July – 14 August 2026",
      warp: "24 August 2026",
      weave: "31 August – 9 October 2026",
      finish: "19–28 October 2026",
      mend: "2–13 November 2026",
      cut: "from 17 November 2026",
      make: "December 2026 – May 2027",
    },
    faultsPer100m: 5.1,
    history: [
      { year: 2019, micron: 29.8, hex: "#66664e" },
      { year: 2020, micron: 30.4, hex: "#6e6e55" },
      { year: 2021, micron: 28.9, hex: "#727258" },
      { year: 2022, micron: 30.1, hex: "#63634c" },
      { year: 2023, micron: 29.2, hex: "#6a6a51" },
      { year: 2024, micron: 29.9, hex: "#707056" },
      { year: 2025, micron: 28.7, hex: "#67674f" },
      { year: 2026, micron: 29.4, hex: "#6b6b52" },
    ],
    warning:
      "Dyed cloth is not exempt from this. Piece dyeing a lot with a slightly different micron gives a slightly different olive, and the 2021 and 2024 pieces are a shade apart on the same recipe. It is a smaller difference than the undyed lots and it is still a difference.",
  },
  {
    code: "AW/2026/CMD",
    short: "CMD",
    farm: "Camas Dubh",
    township: "Ardslignish",
    farmer: "The Skinner family, since 1961",
    grid: "NM 561 618",
    breed: "Scottish Blackface crossed to Cheviot",
    ewes: 392,
    ground: "Open hill above the shore road, wintered on the in-bye",
    altitude: "40–420 m",
    note: "The biggest flock at 392 ewes, the coarsest wool and the best cloth for a coat that is actually going to be worn in bad weather. Blackface fibre is long, strong and hollow, and it takes far longer than the others to go shiny at the cuff and the seat. The Skinners have been on this ground since 1961 and sold every clip into the carpet trade until 2009, at about a fifth of what we pay.",
    colour: "Undyed, natural grey-fawn with darker kemp visible in the piece",
    dye: null,
    hex: "#8b8578",
    hexAlt: "#5f5a51",
    fleeceKg: 2.9,
    micron: 31.8,
    cv: 26.4,
    staple: 132,
    yarn: "Woollen-spun, 2/8 Nm, 320 t/m Z",
    scourYield: 0.66,
    spinYield: 0.9,
    finishYield: 0.94,
    dates: {
      clip: "10–13 June 2026",
      sort: "22–30 June 2026",
      bale: "1 July 2026",
      scour: "13 July 2026",
      spin: "20 July – 28 August 2026",
      warp: "7 September 2026",
      weave: "14 September – 20 November 2026",
      finish: "30 November – 11 December 2026",
      mend: "14 December 2026 – 15 January 2027",
      cut: "from 19 January 2027",
      make: "February – August 2027",
    },
    faultsPer100m: 9.8,
    history: [
      { year: 2019, micron: 31.2, hex: "#847e71" },
      { year: 2020, micron: 32.6, hex: "#8e8779" },
      { year: 2021, micron: 31.9, hex: "#89826f" },
      { year: 2022, micron: 32.1, hex: "#918a7c" },
      { year: 2023, micron: 30.8, hex: "#807a6d" },
      { year: 2024, micron: 31.4, hex: "#8a8477" },
      { year: 2025, micron: 32.9, hex: "#948d80" },
      { year: 2026, micron: 31.8, hex: "#8b8578" },
    ],
    warning:
      "Coarse and hard when new. A Camas Dubh coat is uncomfortable against a bare neck for the first month and there is nothing to be done about it except wear it. It softens with wear and washing, not before. Do not buy this lot if you want it to feel pleasant in the shop.",
  },
  {
    code: "AW/2026/ARH",
    short: "ARH",
    farm: "Ariundle Head",
    township: "Strontian",
    farmer: "Neil Ferguson",
    grid: "NM 838 638",
    breed: "Hebridean",
    ewes: 154,
    ground: "Oakwood edge and rough grazing above the Strontian river",
    altitude: "30–260 m",
    note: "A conservation flock kept mainly to graze the oakwood margin at Ariundle, so the sheep are there for the trees and the wool is a by-product. Hebrideans are black, and the fleece has a proportion of coarse kemp in it that shows in the cloth as a fleck. Neil Ferguson keeps 154 ewes and will not keep more, so this is the smallest lot every year.",
    colour: "Undyed black with grey kemp fleck; no dye can be added to black",
    dye: null,
    hex: "#302c29",
    hexAlt: "#4a4540",
    fleeceKg: 1.7,
    micron: 33.2,
    cv: 28.1,
    staple: 96,
    yarn: "Woollen-spun, 2/8 Nm, 320 t/m Z",
    scourYield: 0.7,
    spinYield: 0.87,
    finishYield: 0.94,
    dates: {
      clip: "29–31 May 2026",
      sort: "4–8 June 2026",
      bale: "9 June 2026",
      scour: "24 June 2026",
      spin: "1–14 July 2026",
      warp: "20 July 2026",
      weave: "27 July – 7 August 2026",
      finish: "17–24 August 2026",
      mend: "27 August – 2 September 2026",
      cut: "from 7 September 2026",
      make: "October 2026 – January 2027",
    },
    faultsPer100m: 11.2,
    history: [
      { year: 2019, micron: 32.4, hex: "#2b2825" },
      { year: 2020, micron: 33.8, hex: "#332f2b" },
      { year: 2021, micron: 33.1, hex: "#2e2a27" },
      { year: 2022, micron: 34.2, hex: "#36322d" },
      { year: 2023, micron: 32.9, hex: "#2c2926" },
      { year: 2024, micron: 33.5, hex: "#332e2a" },
      { year: 2025, micron: 34.0, hex: "#37322c" },
      { year: 2026, micron: 33.2, hex: "#302c29" },
    ],
    warning:
      "Undyed black wool fades. On a coat worn most days the shoulders and the top of the sleeves go a rust-brown within five or six winters, unevenly, and it cannot be dyed back because dyeing a made coat would ruin it. Several owners like what it becomes. If you would not, buy Camas Dubh.",
  },
];

export type Reconciliation = {
  greasy: number;
  sorted: number;
  scoured: number;
  yarn: number;
  cloth: number;
  squareM: number;
  linearM: number;
  reserveM: number;
  saleM: number;
  coats: number;
  /** Greasy wool behind one finished coat, kg. */
  greasyPerCoat: number;
};

/** Fraction of the greasy clip surviving sorting: belly, britch and dags go. */
const SORT_YIELD = 0.86;

/**
 * The chain from flock to coat count, computed rather than asserted, so the
 * figures on the page cannot drift apart from each other. Rounded only at the
 * point of display, except the coat count, which is a whole number of coats.
 */
export function reconcile(lot: Lot): Reconciliation {
  const greasy = lot.ewes * lot.fleeceKg;
  const sorted = greasy * SORT_YIELD;
  const scoured = sorted * lot.scourYield;
  const yarn = scoured * lot.spinYield;
  const cloth = yarn * lot.finishYield;
  const squareM = cloth / (CLOTH_GSM / 1000);
  const linearM = squareM / CLOTH_WIDTH_M;
  const reserveM = linearM * REPAIR_RESERVE;
  const saleM = linearM - reserveM;
  const coats = Math.floor(saleM / COAT_CLOTH_M);
  return {
    greasy,
    sorted,
    scoured,
    yarn,
    cloth,
    squareM,
    linearM,
    reserveM,
    saleM,
    coats,
    greasyPerCoat: coats > 0 ? greasy / coats : 0,
  };
}

export const TOTAL_COATS = LOTS.reduce(
  (total, lot) => total + reconcile(lot).coats,
  0
);

export const TOTAL_EWES = LOTS.reduce((total, lot) => total + lot.ewes, 0);
