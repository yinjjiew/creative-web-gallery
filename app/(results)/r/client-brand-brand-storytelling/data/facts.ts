/**
 * Every real figure this page states, with its source, plus the caveats a
 * reader who knows the subject would want stated.
 *
 * The client — Kirkwall Seed Library — is fictional. Its collection size,
 * membership prices, staff and named varieties are invented for the brief and
 * are marked `illustrative` wherever they appear in the interface. The material
 * in this file is different: it is published, attributable, and quoted as
 * accurately as a web page can quote it. Nothing here is estimated, rounded
 * upward, or inferred from a secondary source that did not name its own.
 *
 * The rule the page follows: a real number always arrives with a note number
 * attached, and anything without one is either arithmetic on numbers shown or
 * is labelled illustrative.
 */

export type Source = {
  n: number;
  /** Short form used in the note list. */
  cite: string;
  /** What the source actually measured — often narrower than the quotation. */
  scope?: string;
};

export const SOURCES: Source[] = [
  {
    n: 1,
    cite:
      "Cary Fowler & Pat Mooney, Shattering: Food, Politics, and the Loss of Genetic Diversity (University of Arizona Press, 1990), from a comparison compiled by the Rural Advancement Foundation International. Widely reproduced since, including in National Geographic, “Food Ark”, July 2011.",
    scope:
      "Varieties of each vegetable listed in the USDA’s 1903 inventory of commercial seed-catalogue offerings, set against the varieties of that vegetable held by the US National Seed Storage Laboratory in 1983.",
  },
  {
    n: 2,
    cite:
      "FAO, Report on the State of the World’s Plant Genetic Resources for Food and Agriculture (Rome, 1996) — the usual source given for the often-quoted claim that about three quarters of crop genetic diversity was lost during the twentieth century.",
    scope:
      "Quoted far more often than it is sourced. The Second Report (FAO, 2010) is markedly more cautious: it holds that genetic erosion continues but that measuring it reliably is difficult, and it does not restate the three-quarters figure as a measurement.",
  },
  {
    n: 3,
    cite:
      "M. van de Wouw, C. Kik, T. van Hintum, R. van Treuren & B. Visser, “Genetic erosion in crops: concept, research results and challenges”, Plant Genetic Resources 8(1), 2010, 1–15.",
    scope:
      "A review of published diversity studies. Its broad finding is that the clearest reductions in crop diversity belong to the earlier twentieth century, when landraces were displaced by bred cultivars, and that the diversity found within newly released cultivars has not obviously continued to fall in recent decades. It is the main reason this page does not claim the loss is accelerating.",
  },
  {
    n: 4,
    cite:
      "FAO, Genebank Standards for Plant Genetic Resources for Food and Agriculture, revised edition (Rome, 2014).",
    scope:
      "For long-term conservation of orthodox seed the standards specify drying to a low, species-appropriate moisture content — broadly 3–7% — and storage at −18 ± 3 °C, with germination monitored and the accession regenerated once viability falls below 85% of the value first recorded for it.",
  },
  {
    n: 5,
    cite:
      "Suzanne Ashworth, Seed to Seed: Seed Saving and Growing Techniques for Vegetable Gardeners, 2nd ed. (Seed Savers Exchange, 2002); Seed Savers Exchange, The Seed Garden (2015).",
    scope:
      "Source for the pollination behaviour, isolation practice and population-size guidance in §5. These are working recommendations from seed-saving practice, not measured constants, and different handbooks give slightly different numbers.",
  },
  {
    n: 6,
    cite:
      "Council Directive 2009/145/EC, which created lighter registration routes for “conservation varieties” and for varieties developed for growing under particular conditions. It sits under the European regime — beginning with the EEC’s 1970 directive on the marketing of vegetable seed — under which seed of a vegetable variety may generally only be marketed if the variety appears on a national list or the common catalogue.",
    scope:
      "Described here in outline. Seed marketing law is more detailed than any paragraph of it, and Britain’s rules have their own domestic form. The point that survives simplification: listing costs money, so a variety nobody sells much of tends to leave the catalogues, and that is why some heritage collections in Britain distribute seed to members rather than selling it.",
  },
  {
    n: 7,
    cite:
      "Garden Organic’s Heritage Seed Library (Coventry) and Seed Savers Exchange (Decorah, Iowa) are real organisations working this way. Kirkwall Seed Library is not: it is a fictional client written for this brief.",
  },
  {
    n: 8,
    cite:
      "Bere is a six-row barley long grown in Orkney and still grown there, milled into beremeal at Barony Mill in Birsay. It is on this page because it is the clearest local case of the argument: it exists because a small number of growers never stopped sowing it.",
  },
  {
    n: 9,
    cite:
      "Heterosis in maize was described by George Shull and Edward East around 1908–09; hybrid maize spread through American agriculture from the 1930s. Yields rose several-fold over the century, though hybridity is only one cause among fertiliser, planting density, herbicides and mechanisation.",
  },
];

export function source(n: number): Source {
  const found = SOURCES.find((s) => s.n === n);
  if (!found) throw new Error(`no source ${String(n)}`);
  return found;
}

/* ------------------------------------------------------------------ 1903 */

export type CatalogueRow = {
  crop: string;
  listed1903: number;
  held1983: number;
};

/** Note 1. Ten vegetables, as tabulated by RAFI and published in Shattering. */
export const CATALOGUE_1903: CatalogueRow[] = [
  { crop: "Cabbage", listed1903: 544, held1983: 28 },
  { crop: "Lettuce", listed1903: 497, held1983: 36 },
  { crop: "Radish", listed1903: 463, held1983: 27 },
  { crop: "Pea", listed1903: 408, held1983: 25 },
  { crop: "Tomato", listed1903: 408, held1983: 79 },
  { crop: "Squash", listed1903: 341, held1983: 40 },
  { crop: "Muskmelon", listed1903: 338, held1983: 27 },
  { crop: "Sweet corn", listed1903: 307, held1983: 12 },
  { crop: "Beet", listed1903: 288, held1983: 17 },
  { crop: "Cucumber", listed1903: 285, held1983: 16 },
];

export const CATALOGUE_TOTALS = CATALOGUE_1903.reduce(
  (acc, row) => ({
    listed1903: acc.listed1903 + row.listed1903,
    held1983: acc.held1983 + row.held1983,
  }),
  { listed1903: 0, held1983: 0 }
);

/* ------------------------------------------------- seed in store, and death */

/**
 * How long seed of each crop stays worth sowing in the sort of cool, dry,
 * unfrozen store a small library or a household actually has. Ranges from the
 * seed-saving handbooks in note 5, which is why they are given as ranges: they
 * are working guidance, not constants, and they vary with how dry the seed was
 * when it went in.
 *
 * A national genebank buys decades instead of years by drying to 3–7% moisture
 * and holding at −18 °C (note 4). Even then the seed dies eventually, which is
 * why regeneration is written into the standards rather than left to judgement.
 */
export type Keeper = {
  crop: string;
  /** Years in cool, dry, unfrozen store before germination falls off badly. */
  low: number;
  high: number;
  note: string;
};

export const KEEPING: Keeper[] = [
  { crop: "Parsnip, parsley", low: 1, high: 2, note: "the shortest-lived seed in the garden" },
  { crop: "Onion, leek", low: 1, high: 3, note: "second only to parsnip for dying in the packet" },
  { crop: "Sweet corn", low: 1, high: 3, note: "the sweetest sorts keep worst" },
  { crop: "Carrot", low: 3, high: 4, note: "biennial, so a regrowing takes two seasons" },
  { crop: "Pea, bean", low: 3, high: 5, note: "large seed, easy to dry, easy to keep" },
  { crop: "Lettuce", low: 3, high: 5, note: "" },
  { crop: "Brassicas", low: 4, high: 5, note: "biennial except for the fast ones" },
  { crop: "Beet, chard", low: 4, high: 6, note: "" },
  { crop: "Cucumber, squash", low: 5, high: 6, note: "" },
  { crop: "Tomato", low: 4, high: 10, note: "the exception that flatters seed banks" },
];

/** FAO's regeneration trigger: 85% of the germination first recorded. Note 4. */
export const REGEN_THRESHOLD = 0.85;
