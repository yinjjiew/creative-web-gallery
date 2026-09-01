/**
 * The library's ledger.
 *
 * PROVENANCE — read this before believing anything below.
 *
 * Kirkwall Seed Library is a fictional client, written for a brief. Every
 * variety here marked `illustrative` was written for this piece: the names, the
 * dates, the descriptions and the reasons for loss are invented. They are
 * invented in the shape of the records that really do survive for lost
 * vegetables — a line in a nurseryman's list, a show schedule, a note in a
 * letter — because that shape is the argument. But they are not evidence, and
 * the interface says so on every row rather than in a footnote.
 *
 * One entry is marked `documented`: bere, the six-row barley still grown in
 * Orkney and milled at Barony Mill in Birsay. It is real, and it is here as the
 * control case — the one line on the chart that reaches the present day, for
 * exactly the reason the whole page is about.
 *
 * The causes of loss are invented per variety but each is a real mechanism, and
 * each is tied by `lesson` to the practice in §5 that answers it. That linkage
 * is the spine of the piece: loss, cause, practice, act.
 */

export type PortraitForm =
  | "head"
  | "kale"
  | "root"
  | "pod"
  | "rosette"
  | "bulb"
  | "fruit"
  | "spike"
  | "gourd";

export type LessonId =
  | "isolate"
  | "population"
  | "biennial"
  | "dry"
  | "regrow"
  | "record"
  | "share";

export type Held = {
  /** In the collection and offered to members this season. */
  adoptable: boolean;
  ease: "straightforward" | "two seasons" | "needs a group";
  /** Households known to be growing it. Illustrative, like everything else. */
  growers: number;
  packet: string;
};

export type Variety = {
  id: string;
  name: string;
  crop: string;
  botanical: string;
  form: PortraitForm;
  /** Portrait parameters: 0–1 knobs the drawing reads. */
  shape: { size?: number; stretch?: number; count?: number; ruffle?: number };
  first: number;
  /** Year last recorded in cultivation. `null` means it is still grown. */
  last: number | null;
  provenance: "illustrative" | "documented";
  /** The kind of record the entry rests on. */
  record: string;
  /** What it was like. */
  was: string;
  /** How it went. */
  went: string;
  lesson: LessonId;
  held?: Held;
};

/**
 * The chart runs past the present on purpose. Everything left of `NOW` is
 * record; everything right of it is empty paper, and the only marks that ever
 * appear there are the ones a visitor puts there by taking a variety on.
 */
export const FIRST_YEAR = 1830;
export const NOW = 2026;
export const LAST_YEAR = 2036;

export const VARIETIES: Variety[] = [
  {
    id: "bere",
    name: "Bere",
    crop: "Barley",
    botanical: "Hordeum vulgare",
    form: "spike",
    shape: { size: 0.9, stretch: 0.8, count: 9 },
    first: 1830,
    last: null,
    provenance: "documented",
    record: "Continuous cultivation in Orkney; milled at Barony Mill, Birsay",
    was: "A six-row barley that ripens fast enough for a northern summer and holds in wind that flattens modern malting sorts. Ground into beremeal it makes bannocks with a dark, faintly bitter finish that nothing else tastes like.",
    went: "It did not go. Bere is here as the control case: a landrace with no commercial future that exists in 2026 because a small number of Orkney growers never stopped sowing it, and a mill kept turning.",
    lesson: "share",
  },
  {
    id: "kirkwall-longkeeper",
    name: "Kirkwall Longkeeper",
    crop: "Cabbage",
    botanical: "Brassica oleracea var. capitata",
    form: "head",
    shape: { size: 0.86, ruffle: 0.3 },
    first: 1867,
    last: 1938,
    provenance: "illustrative",
    record: "Listed in a Kirkwall nurseryman’s spring catalogue, 1867–1931",
    was: "A flat drumhead that stood in the ground all winter and cut solid in March, when nothing else in the garden was worth eating. Coarse-leaved, slow, and by any modern standard far too long in the ground for the space it took.",
    went: "The nursery that listed it was bought out in 1931 and the new owners carried three cabbages instead of eleven. The last recorded sowing is a note in a Kirkwall show schedule for 1938.",
    lesson: "record",
  },
  {
    id: "stromness-purple-top",
    name: "Stromness Purple-Top",
    crop: "Swede",
    botanical: "Brassica napus var. napobrassica",
    form: "root",
    shape: { size: 0.8, stretch: 0.5 },
    first: 1855,
    last: 1951,
    provenance: "illustrative",
    record: "Named in two agricultural society premium lists",
    was: "Sweeter than the field swedes around it and small enough to be a kitchen root rather than cattle feed. It shouldered well out of the ground, which made it easy to lift and easy for frost to find.",
    went: "Wartime cropping favoured a handful of dependable maincrop sorts, and by 1951 it survived in one garden at Stromness. When that ground was sold nobody had asked for seed.",
    lesson: "share",
  },
  {
    id: "harray-grey",
    name: "Harray Grey",
    crop: "Pea",
    botanical: "Pisum sativum",
    form: "pod",
    shape: { size: 0.7, count: 6, stretch: 0.6 },
    first: 1841,
    last: 1929,
    provenance: "illustrative",
    record: "A grocer’s ledger at Harray, and one seedsman’s list of 1889",
    was: "A grey field pea grown to dry rather than to eat green — floury, savoury, made for winter soup and for feeding a household through a bad spring. The pods were dull and the plant was untidy and it was never sold as a garden pea.",
    went: "Dried peas stopped being what people ate. Nobody decided to lose it; the demand simply left, and dry seed of a pea keeps three to five years in an ordinary store, so the margin for forgetting was one decade at most.",
    lesson: "regrow",
  },
  {
    id: "rousay-curled",
    name: "Rousay Curled",
    crop: "Kale",
    botanical: "Brassica oleracea var. acephala",
    form: "kale",
    shape: { size: 0.85, ruffle: 0.85, count: 7 },
    first: 1849,
    last: 1962,
    provenance: "illustrative",
    record: "Household seed exchanged on Rousay; one 1904 newspaper mention",
    was: "Tightly curled, blue-green, and sweeter after the first hard frost than before it. It was cut leaf by leaf from October to April and grew in salt wind that killed everything planted beside it.",
    went: "By 1958 two households had it. A brassica needs a good number of plants flowering together to stay itself, and between two gardens the population was too small: the last seed came up thin, tall and bitter, and nobody sowed it again.",
    lesson: "population",
  },
  {
    id: "egilsay-nonpareil",
    name: "Egilsay Nonpareil",
    crop: "Lettuce",
    botanical: "Lactuca sativa",
    form: "rosette",
    shape: { size: 0.8, ruffle: 0.5 },
    first: 1880,
    last: 1913,
    provenance: "illustrative",
    record: "One catalogue line, 1880. Never listed again.",
    was: "A small blanched butterhead for cutting early under a cloche, described in its single catalogue appearance as “tender to a fault”. Tender to a fault is also a description of a lettuce that will not survive being carried anywhere.",
    went: "It was listed once and sold badly. The whole of what is known about it is thirty-one words of catalogue copy, which is why the drawing beside it is a drawing and not a photograph.",
    lesson: "record",
  },
  {
    id: "orphir-red",
    name: "Orphir Red",
    crop: "Beetroot",
    botanical: "Beta vulgaris",
    form: "root",
    shape: { size: 0.72, stretch: 0.2 },
    first: 1893,
    last: 1957,
    provenance: "illustrative",
    record: "Show records at Orphir, 1893–1949",
    was: "A flat, almost disc-shaped beet with rings so dark they read as black on the cut face, and no earthiness at all. It bolted if sown early and was useless as a maincrop.",
    went: "Beet is wind-pollinated and travels further than anyone expects. A neighbouring half-acre of sugar beet went to seed in 1953 and after that the Orphir plants came up coarse, pale and forked. The name outlived the thing by four years.",
    lesson: "isolate",
  },
  {
    id: "westray-long-season",
    name: "Westray Long Season",
    crop: "Carrot",
    botanical: "Daucus carota subsp. sativus",
    form: "root",
    shape: { size: 0.6, stretch: 0.95 },
    first: 1871,
    last: 1944,
    provenance: "illustrative",
    record: "Two seed lists and a hand-written index card",
    was: "Long, pale, and sweeter than it looked, holding in sandy ground until Christmas without going woody. It also forked in anything heavier than sand, which is most gardens.",
    went: "A carrot is a biennial: the root goes in the ground the first year, flowers the second, and needs frost-free storage in between. The 1944 winter took the stored roots of every household still keeping it, all in the same week.",
    lesson: "biennial",
  },
  {
    id: "sanday-flat-pod",
    name: "Sanday Flat Pod",
    crop: "Broad bean",
    botanical: "Vicia faba",
    form: "pod",
    shape: { size: 0.9, count: 4, stretch: 0.85 },
    first: 1872,
    last: 1948,
    provenance: "illustrative",
    record: "Named on a Sanday farm inventory, 1872 and 1901",
    was: "Four large flat beans to a pod, pale green going to grey, grown as much for drying as for eating fresh. It stood up to wind on a stem thick enough to be mistaken for a shrub.",
    went: "The seed was kept in a stone outbuilding that was dry in the year it was tested and damp in the two after. When the 1948 packet was sown, eleven seeds of two hundred came up, and none of those set pods worth keeping.",
    lesson: "dry",
  },
  {
    id: "deerness-winter-white",
    name: "Deerness Winter White",
    crop: "Leek",
    botanical: "Allium ampeloprasum",
    form: "bulb",
    shape: { size: 0.55, stretch: 0.95 },
    first: 1858,
    last: 1971,
    provenance: "illustrative",
    record: "Continuous local mention to 1966; last seed test 1971",
    was: "Short, very thick in the shank, and mild enough to be eaten raw in February. It sat out an Orkney winter without splitting, which is the only quality a leek in Orkney is asked for.",
    went: "Leek seed is short-lived — one to three years in an ordinary store — and the household that held it grew it out every other year until 1966, when illness broke the rhythm. Tested in 1971 the seed germinated at four per cent.",
    lesson: "regrow",
  },
  {
    id: "evie-keeping-onion",
    name: "Evie Keeping Onion",
    crop: "Onion",
    botanical: "Allium cepa",
    form: "bulb",
    shape: { size: 0.8, stretch: 0.35 },
    first: 1884,
    last: 1959,
    provenance: "illustrative",
    record: "A single named entry in a horticultural society roll",
    was: "Flat, straw-skinned, hard as a stone, and still sound in a shed the following June. Small — a good one weighed what a supermarket onion weighs at its worst — and the small size is what finished it.",
    went: "The market wanted a bigger onion and paid for one. No conspiracy is required to explain it: growers grew what sold, and by 1959 the only place it survived was a note in a roll of members.",
    lesson: "share",
  },
  {
    id: "holm-bullnose",
    name: "Holm Bullnose",
    crop: "Turnip",
    botanical: "Brassica rapa var. rapa",
    form: "root",
    shape: { size: 0.85, stretch: 0.15 },
    first: 1846,
    last: 1922,
    provenance: "illustrative",
    record: "Two parish agricultural returns",
    was: "A blunt, heavy white turnip pulled young and eaten as a vegetable rather than fed to stock, sweet for about three weeks and woody thereafter. Its whole case rested on that three weeks.",
    went: "Nobody wrote down how it differed from the four other white turnips in the same parish, so when the returns stopped in 1922 there was nothing left to identify it by. It may not have been distinct at all. That, too, is how varieties are lost.",
    lesson: "record",
  },
  {
    id: "quoyloo-frame-cucumber",
    name: "Quoyloo Frame",
    crop: "Cucumber",
    botanical: "Cucumis sativus",
    form: "gourd",
    shape: { size: 0.6, stretch: 0.95 },
    first: 1889,
    last: 1934,
    provenance: "illustrative",
    record: "A head gardener’s notebook, one walled garden",
    was: "A short, thin-skinned frame cucumber bred by one gardener for one cold glasshouse, cropping six weeks earlier there than anything bought in. Elsewhere it was reportedly ordinary.",
    went: "It was adapted to a single glasshouse and the man who kept it. The house lost its roof in 1934 and the variety had nowhere else to be, having never been grown by anyone who might have missed it.",
    lesson: "share",
  },
  {
    id: "graemsay-grey-marrow",
    name: "Graemsay Grey",
    crop: "Squash",
    botanical: "Cucurbita maxima",
    form: "gourd",
    shape: { size: 0.95, stretch: 0.35 },
    first: 1901,
    last: 1968,
    provenance: "illustrative",
    record: "Show entries 1901–1962; seed exchanged privately to 1968",
    was: "A grey-skinned winter squash of no great size and unusually dry, sweet flesh, keeping in a cool room until February. It needed a warm corner and a good year, and in Orkney it got one summer in three.",
    went: "Squashes cross readily with any other squash of the same species within a few hundred metres, and the gardens still growing it were neighbours. By 1968 the seed produced something that was clearly not it.",
    lesson: "isolate",
  },
  {
    id: "berstane-early",
    name: "Berstane Early",
    crop: "Pea",
    botanical: "Pisum sativum",
    form: "pod",
    shape: { size: 0.6, count: 8, stretch: 0.45 },
    first: 1877,
    last: 1976,
    provenance: "illustrative",
    record: "Local catalogues to 1972; one member’s garden to 1976",
    was: "A very early round-seeded pea, ready three weeks before anything else and finished as quickly, with eight small sweet peas to a short pod. It cropped once and stopped, which is why nobody grew it commercially.",
    went: "It was never entered on a national list, and after the marketing rules came in through the 1970s the two nurseries that carried it could not lawfully sell it. Both dropped it. It was not banned; it was simply not worth the fee to register.",
    lesson: "share",
  },
  {
    id: "north-ronaldsay-tall-kail",
    name: "North Ronaldsay Tall Kail",
    crop: "Kale",
    botanical: "Brassica oleracea var. acephala",
    form: "kale",
    shape: { size: 0.95, ruffle: 0.35, count: 6 },
    first: 1836,
    last: 1907,
    provenance: "illustrative",
    record: "Estate planting records; drawn once in a naturalist’s journal, 1861",
    was: "Grown for its stem as much as its leaf — a metre and a half of woody trunk that dried hard and was cut into walking sticks, with a loose head of grey-green leaf on top. The leaf was strong-flavoured and coarse and improved by being boiled twice.",
    went: "It took eighteen months of ground for a crop of leaves that a modern kale gives in ten weeks. The last planting recorded is 1907, and everything else known about it comes from one page of a journal and a stick in a museum.",
    lesson: "record",
  },
  {
    id: "tankerness-blood",
    name: "Tankerness Blood",
    crop: "Beetroot",
    botanical: "Beta vulgaris",
    form: "root",
    shape: { size: 0.65, stretch: 0.7 },
    first: 1902,
    last: 1966,
    provenance: "illustrative",
    record: "One seed house’s list, 1902–1958",
    was: "A long tapered beet for winter storage rather than a summer globe, dense and very dark, and sweeter after two months in sand than out of the ground.",
    went: "Long beets were displaced by round ones, which lift faster and fit a crate. The seed house closed in 1958 and the remaining stock, held unrefrigerated, tested below a fifth germination in 1966.",
    lesson: "dry",
  },
  {
    id: "finstown-scarlet",
    name: "Finstown Scarlet",
    crop: "Tomato",
    botanical: "Solanum lycopersicum",
    form: "fruit",
    shape: { size: 0.7, count: 4 },
    first: 1911,
    last: 1979,
    provenance: "illustrative",
    record: "Amateur seed circles, 1911–1979",
    was: "A small ribbed tomato for an unheated glasshouse, setting fruit at temperatures where most varieties sulk, thin-skinned and slightly sharp. It would not travel a mile without splitting.",
    went: "This one is the near miss. It survived to 1979 in amateur hands and then the circle that swapped it stopped publishing its list. A tomato is self-pollinating and its seed keeps four to ten years, which is to say it was the easiest variety on this page to have kept, and it went anyway.",
    lesson: "share",
  },
  {
    id: "hoy-purple-podded",
    name: "Hoy Purple-Podded",
    crop: "Pea",
    botanical: "Pisum sativum",
    form: "pod",
    shape: { size: 0.8, count: 7, stretch: 0.7 },
    first: 1863,
    last: 1941,
    provenance: "illustrative",
    record: "Two catalogue lines and a watercolour, 1863–1908",
    was: "Deep violet pods on a plant nearly two metres tall, the peas inside ordinary green and ordinary tasting. It was grown because it looked remarkable on a show bench.",
    went: "A variety kept only for how it looks is kept only while shows are held. Judging classes for podded peas were dropped locally in the 1930s and the last recorded sowing is 1941.",
    lesson: "share",
  },
  {
    id: "brodgar-white-sprouting",
    name: "Brodgar White Sprouting",
    crop: "Broccoli",
    botanical: "Brassica oleracea var. italica",
    form: "kale",
    shape: { size: 0.7, ruffle: 0.55, count: 5 },
    first: 1894,
    last: 1955,
    provenance: "illustrative",
    record: "Parish show schedules, 1894–1951",
    was: "White sprouting shoots from March, on a plant that had to survive from a June sowing through the whole winter to give them — nine months of ground for six weeks of picking.",
    went: "It needed twenty or more plants flowering together to hold its character, and by 1951 the four households still growing it were setting seed from three or four plants each. What came up in 1955 sprouted green and loose and was not it.",
    lesson: "population",
  },
  {
    id: "walls-shallot",
    name: "Walls Long-Keeping Shallot",
    crop: "Shallot",
    botanical: "Allium cepa var. aggregatum",
    form: "bulb",
    shape: { size: 0.6, stretch: 0.5 },
    first: 1852,
    last: 1983,
    provenance: "illustrative",
    record: "Passed hand to hand; last known planting 1983",
    was: "Coppery, elongated, splitting into six or eight bulbs from one, and still firm eleven months on. Shallots of this kind are increased by replanting bulbs rather than by seed, so every one grown was a piece of the same plant.",
    went: "Because it was never seed, it could not be put in a store at all. It existed only as living bulbs in the ground, and when the last grower stopped in 1983 there was nothing anywhere to fall back on. Potatoes and fruit trees have the same problem.",
    lesson: "share",
  },

  /* ------------------------------- in the collection, and offered to members */

  {
    id: "scapa-frill",
    name: "Scapa Frill",
    crop: "Lettuce",
    botanical: "Lactuca sativa",
    form: "rosette",
    shape: { size: 0.85, ruffle: 0.8 },
    first: 1908,
    last: null,
    provenance: "illustrative",
    record: "In the collection; regrown 2024",
    was: "A loose green batavian with a heavily frilled edge that stands three weeks longer than it ought to before bolting, and takes wind without shredding.",
    went: "Still here. Lettuce is self-pollinating, so a single plant gives seed that comes true, and the whole business is a paper bag and a dry fortnight.",
    lesson: "share",
    held: { adoptable: true, ease: "straightforward", growers: 34, packet: "£2.40" },
  },
  {
    id: "marwick-early",
    name: "Marwick Early",
    crop: "Pea",
    botanical: "Pisum sativum",
    form: "pod",
    shape: { size: 0.72, count: 7, stretch: 0.55 },
    first: 1893,
    last: null,
    provenance: "illustrative",
    record: "In the collection; regrown 2023",
    was: "A short early pea, wrinkle-seeded, sweet, over in three weeks. Close enough to Berstane Early in description that the library has wondered aloud whether they were once the same thing.",
    went: "Still here, and the easiest possible place to start: peas self-pollinate, the seed is large and forgiving to dry, and it keeps three to five years.",
    lesson: "share",
    held: { adoptable: true, ease: "straightforward", growers: 51, packet: "£2.40" },
  },
  {
    id: "yesnaby-yellow",
    name: "Yesnaby Yellow",
    crop: "Tomato",
    botanical: "Solanum lycopersicum",
    form: "fruit",
    shape: { size: 0.62, count: 5 },
    first: 1927,
    last: null,
    provenance: "illustrative",
    record: "In the collection; regrown 2025",
    was: "A small yellow tomato that sets fruit in a cold glasshouse, low in acid, and cracks if you look at it. Fifteen households grow it and none of them can sell it.",
    went: "Still here. Self-pollinating, seed keeps four to ten years, and the only fiddly part is fermenting the seed out of the pulp for three days.",
    lesson: "share",
    held: { adoptable: true, ease: "straightforward", growers: 15, packet: "£2.80" },
  },
  {
    id: "grimness-dwarf",
    name: "Grimness Dwarf",
    crop: "French bean",
    botanical: "Phaseolus vulgaris",
    form: "pod",
    shape: { size: 0.85, count: 5, stretch: 0.9 },
    first: 1919,
    last: null,
    provenance: "illustrative",
    record: "In the collection; regrown 2024",
    was: "A dwarf bean that crops on a plant low enough to be sheltered by its own row, flecked purple on cream when dried. Eaten as a green bean young or dried for winter.",
    went: "Still here. Beans self-pollinate, dry hard, and are the crop most likely to make a first-time seed saver do it again.",
    lesson: "share",
    held: { adoptable: true, ease: "straightforward", growers: 28, packet: "£2.60" },
  },
  {
    id: "costa-head-kale",
    name: "Costa Head Kale",
    crop: "Kale",
    botanical: "Brassica oleracea var. acephala",
    form: "kale",
    shape: { size: 0.9, ruffle: 0.7, count: 8 },
    first: 1866,
    last: null,
    provenance: "illustrative",
    record: "In the collection; last regrown 2019 — overdue",
    was: "Purple-stemmed, standing a metre, sweet after frost, and the closest thing the collection has to Rousay Curled, which it may be related to.",
    went: "Still here, and the one on this list that is genuinely at risk. It is a brassica: it needs twenty or more plants flowering together and half a mile from any other flowering brassica, which is more than one garden can usually manage. It has not been regrown since 2019.",
    lesson: "population",
    held: { adoptable: true, ease: "needs a group", growers: 3, packet: "not offered — grow-out only" },
  },
  {
    id: "sandwick-winter-carrot",
    name: "Sandwick Winter",
    crop: "Carrot",
    botanical: "Daucus carota subsp. sativus",
    form: "root",
    shape: { size: 0.65, stretch: 0.85 },
    first: 1901,
    last: null,
    provenance: "illustrative",
    record: "In the collection; last regrown 2022",
    was: "A stump-rooted winter carrot for shallow, stony ground, blunt and rather ugly and very sweet in January.",
    went: "Still here. A carrot is a biennial, so saving its seed takes two seasons and somewhere frost-free for the roots between them — the reason so few members take one on.",
    lesson: "biennial",
    held: { adoptable: true, ease: "two seasons", growers: 9, packet: "£2.40" },
  },
];

export const LOST = VARIETIES.filter((v) => v.last !== null);
export const HELD = VARIETIES.filter((v) => v.last === null);
export const ADOPTABLE = VARIETIES.filter((v) => v.held?.adoptable);

export function byId(id: string): Variety | undefined {
  return VARIETIES.find((v) => v.id === id);
}

/** Sort for the ledger: by the year the line stops, earliest first, survivors last. */
export const LEDGER = [...VARIETIES].sort(
  (a, b) => (a.last ?? 9999) - (b.last ?? 9999)
);
