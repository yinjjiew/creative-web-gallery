/**
 * §5 — the practical half.
 *
 * The pollination behaviour, isolation practice and population guidance here
 * follow the standard seed-saving handbooks (note 5). They are working
 * recommendations rather than measured constants: different handbooks give
 * slightly different distances and numbers, and every one of them says the
 * same thing about it, which is that more plants is better and further apart is
 * better. Where a figure is a range it is given as a range on purpose.
 *
 * Each `Lesson` is the answer to a way a variety on the ledger was lost. The
 * ledger links to them by id, which is the whole architecture of the page: no
 * loss is presented without the practice that would have prevented it.
 */
import type { LessonId } from "./varieties";

export type Lesson = {
  id: LessonId;
  title: string;
  /** The failure it answers, phrased as the ledger phrases it. */
  failure: string;
  body: string[];
};

export const LESSONS: Lesson[] = [
  {
    id: "isolate",
    title: "Keep it apart from its relatives",
    failure: "crossed with the neighbours and was never itself again",
    body: [
      "A crop that is pollinated by insects or wind will cross with any other variety of the same species flowering nearby, and the seed you save will be a mixture rather than the variety. This is the commonest way a saved variety quietly stops being the variety.",
      "Self-pollinating crops — peas, beans, tomatoes, lettuce — do this hardly at all, and a few metres between varieties is enough. Crossing crops are the problem: beet and spinach are wind-pollinated and the handbooks talk in kilometres; brassicas, carrots, onions and squash are insect-pollinated and want several hundred metres at least.",
      "If you cannot get the distance, get time or a bag instead: flower two varieties a fortnight apart, or cover a squash flower the evening before it opens, pollinate it by hand in the morning and tie a label round the stem. Both are ordinary garden work and neither needs equipment.",
    ],
  },
  {
    id: "population",
    title: "Save from enough plants",
    failure: "the population got too small and lost what made it good",
    body: [
      "A variety is not one plant repeated. It is a population with variation inside it, and that variation is what lets it be sweet in a cold year and stand up in a wet one. Save seed from too few plants and you keep a narrower and narrower slice of it each generation.",
      "For self-pollinating crops this is forgiving: one tomato plant will give you seed that is recognisably the variety, though the handbooks suggest saving from five or more to keep some breadth. For crossing crops it is unforgiving, and worse than a bottleneck — most of them carry real inbreeding depression, so a brassica or a carrot grown from a handful of parents comes up visibly weaker.",
      "Guidance for the crossing crops runs in the twenties to the eighties of flowering plants, and for maize higher still. This is more than one garden usually has room for, which is the honest reason a small library cannot do brassicas alone and asks members to grow them as a group.",
    ],
  },
  {
    id: "biennial",
    title: "Two seasons for the biennials",
    failure: "the stored roots were lost between the first year and the second",
    body: [
      "Carrots, beet, onions, leeks, parsnips, cabbages and the rest of the brassicas do not flower in the year you sow them. You grow the root or the head in the first season, keep it alive through the winter, and it flowers and sets seed in the second.",
      "That means a frost-free store, or a mild enough garden to leave them in the ground, and the discipline to keep the best rather than eat it. Every failure mode in the ledger involving a root crop happens in that winter gap.",
      "It also means a biennial's seed is roughly four times as much work as a pea's, which is why they are the varieties that go first, and why the library asks a few members specifically to take one on.",
    ],
  },
  {
    id: "dry",
    title: "Dry it properly, then keep it cool",
    failure: "the seed was there and it would not germinate",
    body: [
      "Seed dies in storage. How fast depends mostly on how dry it was when it went in and how warm it is kept: the rough working rule in the handbooks is that every drop of about five degrees, or of one per cent in moisture content, buys you roughly double the life.",
      "For a household that means dry the seed spread thin, out of the sun, for a fortnight; then an airtight jar with a little silica gel; then the coolest place you have that does not go damp. A cold shed is worse than a warm cupboard if the shed is humid.",
      "A national genebank does the same thing with instruments: dried to a few per cent moisture, sealed, held at minus eighteen, germination tested at intervals, and the accession regrown once germination drops below eighty-five per cent of what it was first recorded at (note 4). It buys decades rather than years. It does not buy forever.",
    ],
  },
  {
    id: "regrow",
    title: "Grow it out before it dies in the jar",
    failure: "the rhythm of regrowing broke and the seed aged out",
    body: [
      "This is the fact that makes a seed bank different from a museum. A painting in a store is being preserved. Seed in a store is being spent, and the only way to top it up is to sow it, grow the plants, and save fresh seed — which for a biennial is a two-year job, and for a crossing crop needs a whole population.",
      "Leek and onion seed is worth sowing for one to three years; parsnip for one or two; a tomato might give you ten. So a collection is a rota, not a shelf, and the short-lived crops come round again and again.",
      "Every variety in the collection has a year against it and a year it is next due. When the rota slips, nothing dramatic happens for a while, and then a germination test comes back at four per cent.",
    ],
  },
  {
    id: "record",
    title: "Write down what it is",
    failure: "the seed may have survived; the identity did not",
    body: [
      "A variety without a description is not recoverable even if its seed turns up, because nobody can tell whether what grew is what was meant. Several of the entries on the ledger are lost in exactly this way: a name in a list, and nothing to check a plant against.",
      "So the boring part matters. Where you got it, the year, how many plants you saved from, when it was sown and when it cropped, what it tasted like, and what went wrong. Four lines on a card each year is enough, and it is the difference between a variety and a word.",
      "Photographs help, but a written description of flavour, habit and timing is worth more, because those are the things that identify a vegetable and the things a photograph cannot hold.",
    ],
  },
  {
    id: "share",
    title: "Make sure it is somewhere else too",
    failure: "it existed in one garden, and then that garden changed hands",
    body: [
      "Every other practice on this list protects a variety from time. This one protects it from you — from illness, a move, a bad year, a lost jar, a death. A variety held in one place is one accident from gone, and most of the losses in the ledger are that accident rather than anything agricultural.",
      "In practice: send seed back to the library, and send some to another grower as well. Two independent hands and one collection is enough to make a variety difficult to lose, and it costs a stamp.",
      "Bere is the whole argument in one word. It has no commercial future and never did, and it is still grown in Orkney in 2026 because enough separate people kept sowing it and a mill kept grinding it (note 8).",
    ],
  },
];

export function lesson(id: LessonId): Lesson {
  const found = LESSONS.find((l) => l.id === id);
  if (!found) throw new Error(`no lesson ${id}`);
  return found;
}

/* ------------------------------------------------------- crop-by-crop table */

export type Pollination = "self" | "insect" | "wind";

export type CropPractice = {
  crop: string;
  pollination: Pollination;
  /** Annual or biennial in the sense that matters for seed saving. */
  cycle: "annual" | "biennial";
  /** Working isolation guidance from note 5, stated as the handbooks state it. */
  isolation: string;
  /** Plants to save from, as a range. Note 5. */
  plants: string;
  /** Difficulty for a first-time saver, 1 easiest to 4 hardest. */
  difficulty: 1 | 2 | 3 | 4;
  /** The thing that actually goes wrong. */
  catch: string;
};

export const PRACTICE: CropPractice[] = [
  {
    crop: "Pea",
    pollination: "self",
    cycle: "annual",
    isolation: "a couple of metres between varieties",
    plants: "1 will work, 5–10 is better",
    difficulty: 1,
    catch: "Leave the pods until they rattle. Picking green is the only common mistake.",
  },
  {
    crop: "French bean",
    pollination: "self",
    cycle: "annual",
    isolation: "a couple of metres; more if bumblebees are busy",
    plants: "1 will work, 5–10 is better",
    difficulty: 1,
    catch: "They must dry on the plant. A wet autumn means finishing them indoors on a tray.",
  },
  {
    crop: "Tomato",
    pollination: "self",
    cycle: "annual",
    isolation: "two or three metres",
    plants: "1 will work, 5 is better",
    difficulty: 1,
    catch: "Ferment the pulp in water for three days to shed the gel coat, then rinse and dry flat.",
  },
  {
    crop: "Lettuce",
    pollination: "self",
    cycle: "annual",
    isolation: "three metres or so",
    plants: "5–10",
    difficulty: 2,
    catch: "It must bolt, flower and ripen — about a month longer in the ground than feels reasonable.",
  },
  {
    crop: "Squash, pumpkin",
    pollination: "insect",
    cycle: "annual",
    isolation: "several hundred metres, or hand-pollinate and tie the flower",
    plants: "5–10",
    difficulty: 2,
    catch: "Crosses with any squash of the same species nearby. Hand-pollination is easy and takes five minutes a fruit.",
  },
  {
    crop: "Beet, chard",
    pollination: "wind",
    cycle: "biennial",
    isolation: "the handbooks talk in kilometres",
    plants: "20–30",
    difficulty: 4,
    catch: "Wind-pollinated and biennial at once. The hardest ordinary garden crop to keep true.",
  },
  {
    crop: "Carrot",
    pollination: "insect",
    cycle: "biennial",
    isolation: "several hundred metres — and wild carrot counts",
    plants: "20–80",
    difficulty: 4,
    catch: "Two seasons, a frost-free store, and Queen Anne's lace in the hedge will cross with it.",
  },
  {
    crop: "Brassicas",
    pollination: "insect",
    cycle: "biennial",
    isolation: "half a kilometre or more from any flowering brassica",
    plants: "20–80",
    difficulty: 4,
    catch: "Cabbage, kale, broccoli, sprouts and cauliflower are one species and cross freely with each other.",
  },
  {
    crop: "Onion, leek",
    pollination: "insect",
    cycle: "biennial",
    isolation: "several hundred metres",
    plants: "20–40",
    difficulty: 3,
    catch: "Seed is short-lived, so this one comes round on the rota again and again.",
  },
];

export const DIFFICULTY_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "start here",
  2: "one season, a little patience",
  3: "two seasons",
  4: "needs a group",
};
