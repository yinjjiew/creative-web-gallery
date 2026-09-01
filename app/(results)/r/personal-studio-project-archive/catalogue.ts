import type { MediumKind, RelKind, ThreadId, ThreadMeta, Work } from "./types";

export const YEAR0 = 1995;
export const YEAR1 = 2025;

export const THREADS: ThreadMeta[] = [
  {
    id: "tide",
    name: "Tide tables",
    fate: "kept",
    fateLabel: "kept",
    copy: "Never put down. The tables are still on the studio wall.",
    color: "#3d5a66",
    start: 1995,
    end: 2025,
  },
  {
    id: "hand",
    name: "Grandmother's hand",
    fate: "dormant",
    fateLabel: "returned",
    copy: "Ten years of the hand, twelve of silence, then the hand came back as type.",
    color: "#6b4423",
    start: 1995,
    end: 2025,
    quiet: [2005, 2016],
    quietKind: "dormant",
  },
  {
    id: "ledger",
    name: "Ledgers",
    fate: "kept",
    fateLabel: "kept",
    copy: "The ruling underneath everything else.",
    color: "#8c332c",
    start: 1996,
    end: 2025,
  },
  {
    id: "birds",
    name: "Birds from trains",
    fate: "broken",
    fateLabel: "abandoned, then two plates",
    copy: "Looked up from the window for twelve years. Put down. Two late plates.",
    color: "#3f4a38",
    start: 2001,
    end: 2024,
    quiet: [2014, 2022],
    quietKind: "broken",
  },
  {
    id: "salt",
    name: "Salt stain",
    fate: "abandoned",
    fateLabel: "left",
    copy: "Left in 2006. She said it had become a picture of weather.",
    color: "#6a5a48",
    start: 1998,
    end: 2006,
  },
  {
    id: "errata",
    name: "Errata / index",
    fate: "late",
    fateLabel: "late",
    copy: "The late habit. Corrections, indexes, the heading that was wrong.",
    color: "#2a2a28",
    start: 2008,
    end: 2025,
  },
  {
    id: "glass",
    name: "Window glass",
    fate: "abandoned",
    fateLabel: "left",
    copy: "Five years of looking through. Abandoned before the trains began.",
    color: "#4d5c66",
    start: 1995,
    end: 1999,
  },
];

export const THREAD_BY_ID = Object.fromEntries(
  THREADS.map((t) => [t.id, t]),
) as Record<ThreadId, ThreadMeta>;

type Draft = Omit<Work, "cat">;

function slug(title: string, year: number, used: Set<string>): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let id = base;
  if (used.has(id)) id = `${base}-${year}`;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${year}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function between(rng: () => number, a: number, b: number): number {
  return Math.round((a + (b - a) * rng()) * 2) / 2;
}

export function threadActive(id: ThreadId, year: number): boolean {
  const t = THREAD_BY_ID[id];
  if (year < t.start || year > t.end) return false;
  if (t.quiet && t.quietKind === "broken") {
    return year < t.quiet[0] || year > t.quiet[1];
  }
  if (t.quiet && t.quietKind === "dormant") {
    return year < t.quiet[0] || year > t.quiet[1];
  }
  return true;
}

const LOCS = [
  "Artist's collection, Whitstable",
  "Artist's collection, Whitstable",
  "Artist's collection, Whitstable",
  "Private collection, London",
  "Private collection, Canterbury",
  "Private collection, Berlin",
  "Whitstable Museum & Gallery",
  "On loan, Turner Contemporary, Margate",
] as const;

const RARE_LOCS = [
  "British Library",
  "Yale Center for British Art",
  "Kent County Council",
  "Not located",
] as const;

function locationFor(rng: () => number, kind: MediumKind, year: number): string {
  if (kind === "commission") {
    return pick(rng, [
      "Sited, Reculver",
      "Sited, Herne Bay promenade",
      "Sited, Faversham Guildhall",
      "Sited, Sittingbourne station",
      "Sited, Kent County Hall, Maidstone",
      "Sited, Grove Ferry crossing",
      "Destroyed, 2008 studio flood",
    ]);
  }
  if (kind === "book" && rng() < 0.22) return "British Library";
  if (year < 2000 && rng() < 0.04) return "Not located";
  if (rng() < 0.03) return pick(rng, RARE_LOCS);
  return pick(rng, LOCS);
}

function editionFor(rng: () => number, kind: MediumKind): string {
  if (kind === "sculpture" || kind === "commission") {
    return rng() < 0.15 ? "edition of 3" : "unique";
  }
  if (kind === "book") {
    return pick(rng, [
      "edition of 8",
      "edition of 12",
      "edition of 20",
      "edition of 26, lettered",
      "edition of 40",
    ]);
  }
  return pick(rng, [
    "edition of 12",
    "edition of 15",
    "edition of 20",
    "edition of 25",
    "edition of 30",
    "edition of 20 + 3 AP",
  ]);
}

function dims(
  rng: () => number,
  kind: MediumKind,
): Pick<Draft, "w" | "h" | "d"> {
  if (kind === "commission") {
    if (rng() < 0.45) return { w: 0, h: 0 };
    return { w: between(rng, 180, 620), h: between(rng, 8, 90), d: between(rng, 2, 18) };
  }
  if (kind === "sculpture") {
    return {
      w: between(rng, 28, 180),
      h: between(rng, 6, 86),
      d: between(rng, 6, 42),
    };
  }
  if (kind === "book") {
    return { w: between(rng, 11, 22), h: between(rng, 16, 32) };
  }
  return { w: between(rng, 18, 76), h: between(rng, 16, 64) };
}

function mediumFor(rng: () => number, kind: MediumKind, thread: ThreadId): string {
  if (kind === "commission") {
    return pick(rng, [
      "Sited work, cast iron",
      "Sited work, inlaid stone",
      "Sited work, etched glass",
      "Sited work, painted steel",
      "Sited work, letterpress in terrazzo",
    ]);
  }
  if (kind === "sculpture") {
    return pick(rng, [
      "Cast iron",
      "Cast concrete",
      "Lead and oak",
      "Bronze",
      "Painted steel",
      "Lead on found ledger",
    ]);
  }
  if (kind === "book") {
    return pick(rng, [
      "Bound volume, letterpress",
      "Bound volume, letterpress and offset",
      "Coptic-bound book, stamp and inkjet",
      "Stab-bound book, letterpress on Zerkall",
      "Accordion book, etching and type",
    ]);
  }
  if (thread === "hand") {
    return pick(rng, [
      "Iron-gall ink on found invoice",
      "Graphite on ledger paper",
      "Etching on Somerset",
      "Letterpress on Zerkall",
      "Lithograph",
    ]);
  }
  if (thread === "salt") {
    return pick(rng, [
      "Salt and iron-gall on laid paper",
      "Cloth, salt, and tide-line",
      "Etching on Somerset",
      "Evaporated brine on found paper",
    ]);
  }
  return pick(rng, [
    "Etching on Somerset",
    "Etching and aquatint",
    "Etching and letterpress on Somerset",
    "Lithograph",
    "Photogravure",
    "Linocut",
    "Collagraph",
    "Screenprint",
  ]);
}

function kindFor(rng: () => number, thread: ThreadId, year: number): MediumKind {
  const r = rng();
  if (thread === "errata") {
    if (r < 0.55) return "book";
    if (r < 0.88) return "print";
    return "sculpture";
  }
  if (thread === "glass") return "print";
  if (thread === "salt") return r < 0.2 ? "book" : "print";
  if (thread === "birds" && year === 2009 && r < 0.5) return "commission";
  if (r < 0.08 && year > 2001 && thread !== "hand") return "commission";
  if (r < 0.2 && year > 2004) return "sculpture";
  if (r < 0.38) return "book";
  return "print";
}

const TIDE_STATIONS = [
  "Sheerness",
  "Whitstable",
  "Reculver",
  "Herne Bay",
  "Margate",
  "Ramsgate",
  "Deal",
  "Dover",
  "Folkestone",
  "Faversham Creek",
  "Queenborough",
  "Isle of Grain",
  "Southend",
  "Canvey",
  "Tilbury",
  "Gravesend",
  "London Bridge",
  "Burnham-on-Crouch",
  "Brightlingsea",
  "The Swale",
  "Seasalter",
  "Oare",
  "Conyer",
  "Harty Ferry",
  "Grove Ferry",
] as const;

const TIDE_EVENTS = [
  "predicted high",
  "predicted low",
  "neap range",
  "spring range",
  "the stand",
  "slack water",
  "the residual",
  "highest astronomical",
  "mean high water springs",
  "mean low water springs",
  "chart datum",
  "the hour the mud appears",
  "the hour it covers the steps",
  "not observed",
  "the 4 cm error",
  "December springs",
  "the wall wet to the brick",
  "a low that failed",
  "first high after the clocks change",
  "the table torn at March",
  "predicted 15:42",
  "the line she pencilled in",
] as const;

const HAND_TITLES = [
  "Invoice hand, 1951",
  "Loop of the capital G",
  "The uncrossed t",
  "The figure 8 that is two circles",
  "Ampersand, grocer's",
  "The descending y",
  "Carbon, the second sheet",
  "Where the nib caught",
  "The pressure at the descender",
  "Envelope addressed to herself",
  "The letter that was not sent",
  "Grocery list, enlarged",
  "Shipping note, blot",
  "The long cross on the H",
  "Clerk's 7, continental",
  "A margin full of additions",
  "The hand after the funeral",
  "Pencil under the ink",
  "Her name, three ways",
  "The stop that is a dash",
  "Ruled paper she ignored",
  "A shopping list in two inks",
  "The G recut as type",
  "Invoice verso, a sum",
  "Left-handed correction",
  "The last page of the pad",
  "Stamp over her initial",
  "A postcard never posted",
  "Narrow loop, late years",
  "The same t in 1951 and 1968",
  "Carbon smudge, Whitstable",
  "Her 4, open",
  "A recipe, half in shorthand",
  "The envelope flap, unsealed",
  "Blue-black, then black",
  "A tick that became a word",
  "The sample book of her G",
  "Type foundry, after her G",
  "The uncrossed t, recut",
  "She signed for a parcel",
] as const;

const LEDGER_TITLES = [
  "Column rule, red",
  "Brought Forward",
  "Carried Down",
  "The folio that will not close",
  "Contra",
  "The column never used",
  "Petty cash, December",
  "The year the ink changes",
  "Double ruling",
  "An account not opened",
  "Journal folio",
  "The stub",
  "Debit, left",
  "The red line",
  "A/c, unfinished",
  "The moth-eaten page",
  "Posting, evening",
  "Balance, forced",
  "The unused debit column",
  "Cash book, green",
  "The opening that is a closing",
  "Folio 12, blank",
  "Sundries",
  "The line she refused to rule",
  "Index of accounts not opened",
  "Brought down, March",
  "A total in pencil",
  "The catch-line",
  "Imprest",
  "The page that was torn out",
  "Credit, right, empty",
  "The book the damp took",
  "Ruling, before entries",
  "A transfer she later reversed",
  "The year-end double line",
  "Narration, cramped",
  "The cash that would not tally",
  "Opening balance, inherited",
  "A folio skipped",
  "The red rule, recast",
] as const;

const BIRD_SPECIES = [
  "woodpigeon",
  "fieldfare",
  "kestrel",
  "swan",
  "magpie",
  "rook",
  "crow",
  "gull",
  "heron",
  "pheasant",
  "something white",
  "a hawk, perhaps",
  "the usual pigeon",
  "oystercatcher",
  "lapwing",
  "cormorant",
] as const;

const BIRD_PLACES = [
  "Ashford",
  "Faversham",
  "Sittingbourne",
  "the marsh before Rainham",
  "between Strood and Rochester",
  "Grove Ferry",
  "platform 4",
  "the cutting",
  "a post, gone",
  "the wire",
  "the flood, two minutes",
  "the usual field",
  "the crossing",
  "a roof in Rainham",
  "the Swale, from the window",
] as const;

const SALT_TITLES = [
  "Cloth left on the wall",
  "Evaporated dish",
  "Tide-line on laid paper",
  "Last stain",
  "Brine, overnight",
  "The white edge",
  "Salt on a spring tide",
  "A bowl, dry",
  "The wall after October",
  "Crystal, then dust",
  "Cloth, second day",
  "Sheerness, a stain not a table",
  "The dish she stopped using",
  "White on iron-gall",
  "A line the tide made",
  "Studio floor, after a flood",
  "The last cloth",
] as const;

const ERRATA_TITLES = [
  "See also",
  "The heading that was wrong",
  "Page 47, which does not exist",
  "Correction fluid, dried",
  "Concordance",
  "Index, unfinished",
  "A cross-reference to nothing",
  "Erratum slip, bound in",
  "The entry under the wrong year",
  "Sic",
  "A heading she recut",
  "Contents, later revised",
  "The number that moved",
  "Ibid., mistaken",
  "A cancelled leaf",
  "The list with one gap",
  "Afterword, then a correction",
  "See above, which is below",
  "An asterisk with no note",
  "The plate list, two versions",
  "Running head, error",
  "A verso left blank on purpose",
  "The last index card",
  "Q.v., circular",
  "Addenda",
] as const;

const GLASS_TITLES = [
  "Rain on the up line",
  "The smear of looking",
  "Condensation, studio",
  "A thumbprint on the pane",
  "Rain, the down line",
  "The glass she did not wipe",
  "Breath, January",
  "A scratched timetable",
  "Between stations, nothing held",
  "The pane, second-class",
  "Smear, then a field",
  "Night glass",
] as const;

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function uniqueTitle(base: string, used: Set<string>): string {
  base = cap(base);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const roman = ["ii", "iii", "iv", "v", "vi", "vii"];
  for (const r of roman) {
    const t = `${base} (${r})`;
    if (!used.has(t)) {
      used.add(t);
      return t;
    }
  }
  let i = 8;
  while (used.has(`${base} (${i})`)) i += 1;
  const t = `${base} (${i})`;
  used.add(t);
  return t;
}

function titleFor(thread: ThreadId, rng: () => number, used: Set<string>): string {
  if (thread === "tide") {
    const station = pick(rng, TIDE_STATIONS);
    const event = pick(rng, TIDE_EVENTS);
    return uniqueTitle(
      rng() < 0.5 ? `${station}, ${event}` : `${event}, ${station}`,
      used,
    );
  }
  if (thread === "hand") {
    if (rng() < 0.75) return uniqueTitle(pick(rng, HAND_TITLES), used);
    return uniqueTitle(
      `${pick(rng, ["The", "Her", "A"])} ${pick(rng, ["G", "t", "y", "7", "ampersand"])}, ${pick(rng, ["invoice", "list", "envelope", "pad"])}`,
      used,
    );
  }
  if (thread === "ledger") {
    if (rng() < 0.7) return uniqueTitle(pick(rng, LEDGER_TITLES), used);
    return uniqueTitle(
      `${pick(rng, ["Brought down", "Carried forward", "Posting", "Folio", "Sundries"])}, ${pick(rng, ["January", "March", "June", "October", "December"])}`,
      used,
    );
  }
  if (thread === "birds") {
    if (rng() < 0.35) {
      return uniqueTitle(
        pick(rng, [
          "A blur the colour of a fieldfare",
          "Too fast to be sure",
          "Platform 4, the usual pigeon",
          "Kestrel on a post, gone",
          "Something on the wire, Ashford",
          "One white bird, no time to name it",
          "Fieldfare, if it was",
        ]),
        used,
      );
    }
    return uniqueTitle(`${pick(rng, BIRD_SPECIES)}, ${pick(rng, BIRD_PLACES)}`, used);
  }
  if (thread === "salt") return uniqueTitle(pick(rng, SALT_TITLES), used);
  if (thread === "errata") return uniqueTitle(pick(rng, ERRATA_TITLES), used);
  return uniqueTitle(pick(rng, GLASS_TITLES), used);
}

type Keystone = Draft & { id: string };

function keystones(): Keystone[] {
  const K = (
    id: string,
    title: string,
    year: number,
    threads: ThreadId[],
    extra: Partial<Draft> & { kind: MediumKind; medium: string },
  ): Keystone => ({
    id,
    title,
    year,
    threads,
    claims: Object.fromEntries(
      threads.map((t) => [t, extra.claims?.[t] ?? "series"]),
    ) as Draft["claims"],
    w: extra.w ?? (extra.kind === "book" ? 14 : extra.kind === "sculpture" ? 86 : 38),
    h: extra.h ?? (extra.kind === "book" ? 21 : extra.kind === "sculpture" ? 8 : 28),
    d: extra.d,
    edition: extra.edition ?? (extra.kind === "print" || extra.kind === "book" ? "edition of 20" : "unique"),
    location: extra.location ?? "Artist's collection, Whitstable",
    kind: extra.kind,
    medium: extra.medium,
    series: extra.series,
    note: extra.note,
    pairs: extra.pairs,
  });

  return [
    K("predicted-high-sheerness", "Predicted High, Sheerness", 1998, ["tide", "ledger"], {
      kind: "print",
      medium: "Etching and letterpress on Somerset",
      w: 38,
      h: 28,
      edition: "edition of 20",
      series: "Predicted line",
      claims: { tide: "series", ledger: "artist" },
      note: "The predicted numbers are already a ledger. I did not understand that until the iron, twenty-one years later.",
      pairs: [{ id: "mean-high-water", kind: "artist", label: "artist's note, 21 years later" }],
    }),
    K("mean-high-water", "Mean High Water", 2019, ["tide"], {
      kind: "sculpture",
      medium: "Cast iron",
      w: 142,
      h: 8,
      d: 8,
      edition: "unique",
      location: "Whitstable Museum & Gallery",
      series: "Predicted line",
      note: "The same predicted line, at the height it would have reached on the studio wall.",
      pairs: [{ id: "predicted-high-sheerness", kind: "artist", label: "artist's note, 21 years earlier" }],
    }),
    K("tables-still-on-the-wall", "Tables still on the wall", 2024, ["tide", "errata"], {
      kind: "book",
      medium: "Bound volume, letterpress and offset",
      w: 13,
      h: 20,
      edition: "edition of 40",
      location: "British Library",
      series: "Predicted line",
      claims: { tide: "series", errata: "artist" },
      note: "Thirty years of tables, with the hours she was wrong printed in the margin.",
    }),
    K("hour-the-mud-appears", "The hour the mud appears", 1996, ["tide"], {
      kind: "print",
      medium: "Etching and aquatint",
      w: 42,
      h: 30,
      series: "Predicted line",
    }),
    K("admiralty-table-torn", "Admiralty Table, torn", 2004, ["tide", "ledger"], {
      kind: "book",
      medium: "Stab-bound book, letterpress on Zerkall",
      w: 16,
      h: 24,
      edition: "edition of 12",
      claims: { tide: "series", ledger: "artist" },
    }),
    K("reculver-range", "Reculver range", 2007, ["tide"], {
      kind: "commission",
      medium: "Sited work, cast iron",
      w: 0,
      h: 0,
      location: "Sited, Reculver",
    }),
    K("the-4cm-error", "The 4 cm error", 2011, ["tide", "errata"], {
      kind: "print",
      medium: "Etching and letterpress on Somerset",
      w: 36,
      h: 48,
      claims: { tide: "series", errata: "artist" },
      note: "The table said one height. The wall said another.",
    }),
    K("steps-covered", "Steps, covered", 2015, ["tide"], {
      kind: "sculpture",
      medium: "Cast concrete",
      w: 96,
      h: 18,
      d: 32,
      location: "On loan, Turner Contemporary, Margate",
    }),
    K("the-uncrossed-t", "The uncrossed t", 1997, ["hand"], {
      kind: "print",
      medium: "Iron-gall ink on found invoice",
      w: 21,
      h: 29.7,
      edition: "unique",
      series: "Uncrossed t",
      note: "Her t is a vertical. I thought I had finished with it.",
      pairs: [{ id: "the-uncrossed-t-recut", kind: "artist", label: "artist's note, 21 years later" }],
    }),
    K("the-uncrossed-t-recut", "The uncrossed t, recut", 2018, ["hand", "errata"], {
      kind: "book",
      medium: "Bound volume, letterpress",
      w: 12,
      h: 19,
      edition: "edition of 26, lettered",
      location: "British Library",
      series: "Uncrossed t",
      claims: { hand: "series", errata: "artist" },
      note: "The same letter, now a piece of type. I had not looked at her invoices in twelve years.",
      pairs: [{ id: "the-uncrossed-t", kind: "artist", label: "artist's note, 21 years earlier" }],
    }),
    K("invoice-hand-1951", "Invoice hand, 1951", 1995, ["hand", "ledger"], {
      kind: "print",
      medium: "Lithograph",
      w: 32,
      h: 40,
      series: "Invoice hand",
      claims: { hand: "series", ledger: "artist" },
    }),
    K("loop-of-the-capital-g", "Loop of the capital G", 1999, ["hand"], {
      kind: "print",
      medium: "Etching on Somerset",
      w: 28,
      h: 38,
      series: "Invoice hand",
    }),
    K("carbon-the-second-sheet", "Carbon, the second sheet", 2002, ["hand"], {
      kind: "book",
      medium: "Coptic-bound book, stamp and inkjet",
      w: 14,
      h: 21,
      edition: "edition of 8",
    }),
    K("pressure-at-the-descender", "The pressure at the descender", 2004, ["hand"], {
      kind: "print",
      medium: "Graphite on ledger paper",
      w: 22,
      h: 34,
      edition: "unique",
      note: "The last work before I put the invoices away.",
    }),
    K("grocery-list-enlarged", "Grocery list, enlarged", 2017, ["hand"], {
      kind: "print",
      medium: "Letterpress on Zerkall",
      w: 50,
      h: 70,
      edition: "edition of 15",
      series: "Invoice hand",
      note: "The first work after the silence. Tea, marge, stamps.",
    }),
    K("type-foundry-after-her-g", "Type foundry, after her G", 2021, ["hand", "errata"], {
      kind: "book",
      medium: "Bound volume, letterpress",
      w: 15,
      h: 23,
      edition: "edition of 20",
      claims: { hand: "series", errata: "artist" },
    }),
    K("column-rule-red", "Column rule, red", 1996, ["ledger"], {
      kind: "print",
      medium: "Etching on Somerset",
      w: 30,
      h: 42,
      series: "Red rule",
      pairs: [{ id: "the-red-line", kind: "artist", label: "artist's note, 16 years later" }],
    }),
    K("the-red-line", "The red line", 2012, ["ledger"], {
      kind: "commission",
      medium: "Sited work, letterpress in terrazzo",
      w: 0,
      h: 0,
      location: "Sited, Faversham Guildhall",
      series: "Red rule",
      claims: { ledger: "site" },
      note: "A column rule you can walk. The Guildhall asked for a civic artwork. This is a bookkeeping mark.",
      pairs: [{ id: "column-rule-red", kind: "artist", label: "artist's note, 16 years earlier" }],
    }),
    K("brought-forward", "Brought Forward", 1999, ["ledger"], {
      kind: "book",
      medium: "Bound volume, letterpress",
      w: 13,
      h: 20,
      edition: "edition of 12",
      series: "Folio",
      pairs: [{ id: "folio-will-not-close", kind: "artist", label: "artist's note, 17 years later" }],
    }),
    K("folio-will-not-close", "The folio that will not close", 2016, ["ledger"], {
      kind: "sculpture",
      medium: "Lead and oak",
      w: 64,
      h: 42,
      d: 8,
      location: "Private collection, London",
      series: "Folio",
      note: "The same unclosed account, now too heavy to shelve.",
      pairs: [{ id: "brought-forward", kind: "artist", label: "artist's note, 17 years earlier" }],
    }),
    K("contra", "Contra", 2003, ["ledger"], {
      kind: "print",
      medium: "Linocut",
      w: 24,
      h: 32,
    }),
    K("column-never-used", "The column never used", 2008, ["ledger", "errata"], {
      kind: "book",
      medium: "Bound volume, letterpress and offset",
      w: 16,
      h: 24,
      edition: "edition of 20",
      claims: { ledger: "series", errata: "artist" },
    }),
    K("petty-cash-december", "Petty cash, December", 2014, ["ledger"], {
      kind: "print",
      medium: "Etching and letterpress on Somerset",
      w: 28,
      h: 38,
    }),
    K("index-accounts-not-opened", "Index of accounts not opened", 2020, ["ledger", "errata"], {
      kind: "book",
      medium: "Stab-bound book, letterpress on Zerkall",
      w: 12,
      h: 18,
      edition: "edition of 26, lettered",
      location: "Yale Center for British Art",
      claims: { ledger: "series", errata: "series" },
    }),
    K("blur-fieldfare", "A blur the colour of a fieldfare", 2004, ["birds"], {
      kind: "print",
      medium: "Lithograph",
      w: 46,
      h: 32,
      series: "Fieldfare",
      note: "I could not be sure. That is the work.",
      pairs: [{ id: "fieldfare-if-it-was", kind: "artist", label: "artist's note, 19 years later" }],
    }),
    K("fieldfare-if-it-was", "Fieldfare, if it was", 2023, ["birds"], {
      kind: "print",
      medium: "Photogravure",
      w: 46,
      h: 32,
      series: "Fieldfare",
      note: "I thought I had stopped looking out of trains. Then one was there again, or was not.",
      pairs: [{ id: "blur-fieldfare", kind: "artist", label: "artist's note, 19 years earlier" }],
    }),
    K("kestrel-on-a-post", "Kestrel on a post, gone", 2002, ["birds"], {
      kind: "print",
      medium: "Etching on Somerset",
      w: 22,
      h: 28,
    }),
    K("platform-4-pigeon", "Platform 4, the usual pigeon", 2006, ["birds"], {
      kind: "print",
      medium: "Linocut",
      w: 20,
      h: 20,
      edition: "edition of 30",
    }),
    K("wire-ashford", "Something on the wire, Ashford", 2009, ["birds", "glass"], {
      kind: "commission",
      medium: "Sited work, etched glass",
      w: 0,
      h: 0,
      location: "Sited, Sittingbourne station",
      claims: { birds: "site", glass: "artist" },
      note: "A station asked for birds. I gave them a thing I could not name. I was not happy with it.",
    }),
    K("too-fast-to-be-sure", "Too fast to be sure", 2013, ["birds"], {
      kind: "print",
      medium: "Photogravure",
      w: 40,
      h: 26,
      note: "The last looking-up before I stopped.",
    }),
    K("cloth-on-the-wall", "Cloth left on the wall", 1999, ["salt", "tide"], {
      kind: "print",
      medium: "Cloth, salt, and tide-line",
      w: 54,
      h: 72,
      edition: "unique",
      claims: { salt: "series", tide: "artist" },
    }),
    K("evaporated-dish", "Evaporated dish", 2001, ["salt"], {
      kind: "print",
      medium: "Evaporated brine on found paper",
      w: 29,
      h: 29,
      edition: "unique",
    }),
    K("tideline-laid", "Tide-line on laid paper", 2003, ["salt", "tide"], {
      kind: "print",
      medium: "Salt and iron-gall on laid paper",
      w: 38,
      h: 56,
      edition: "unique",
      claims: { salt: "series", tide: "artist" },
    }),
    K("last-stain", "Last stain", 2006, ["salt"], {
      kind: "print",
      medium: "Salt and iron-gall on laid paper",
      w: 32,
      h: 40,
      edition: "unique",
      note: "I was making pictures of weather. That was enough.",
    }),
    K("see-also", "See also", 2008, ["errata", "ledger"], {
      kind: "book",
      medium: "Bound volume, letterpress",
      w: 11,
      h: 17,
      edition: "edition of 12",
      series: "Index",
      claims: { errata: "series", ledger: "artist" },
    }),
    K("heading-that-was-wrong", "The heading that was wrong", 2011, ["errata"], {
      kind: "print",
      medium: "Letterpress on Zerkall",
      w: 34,
      h: 48,
      series: "Index",
    }),
    K("page-47", "Page 47, which does not exist", 2015, ["errata"], {
      kind: "book",
      medium: "Bound volume, letterpress and offset",
      w: 14,
      h: 21,
      edition: "edition of 8",
    }),
    K("correction-fluid", "Correction fluid, dried", 2019, ["errata"], {
      kind: "sculpture",
      medium: "Painted steel",
      w: 22,
      h: 14,
      d: 6,
    }),
    K("concordance", "Concordance", 2022, ["errata", "ledger"], {
      kind: "book",
      medium: "Bound volume, letterpress",
      w: 16,
      h: 24,
      edition: "edition of 20",
      location: "British Library",
      series: "Index",
      claims: { errata: "series", ledger: "artist" },
    }),
    K("rain-on-the-up-line", "Rain on the up line", 1996, ["glass"], {
      kind: "print",
      medium: "Etching and aquatint",
      w: 36,
      h: 28,
    }),
    K("smear-of-looking", "The smear of looking", 1998, ["glass"], {
      kind: "print",
      medium: "Lithograph",
      w: 40,
      h: 30,
    }),
    K("condensation-studio", "Condensation, studio", 1999, ["glass"], {
      kind: "print",
      medium: "Etching on Somerset",
      w: 24,
      h: 32,
      note: "After this I wanted named things, not weather on a pane.",
    }),
    K("one-white-bird", "One white bird, no time to name it", 2024, ["birds"], {
      kind: "print",
      medium: "Photogravure",
      w: 46,
      h: 32,
      series: "Fieldfare",
    }),
  ];
}

/** New unique works to generate per thread, on top of the keystones. */
const PRIMARY_FILL: Record<ThreadId, number> = {
  tide: 68,
  hand: 36,
  ledger: 44,
  birds: 26,
  salt: 12,
  errata: 22,
  glass: 8,
};

/** Membership targets after second-thread assignment. */
const MEMBER_TARGET: Record<ThreadId, number> = {
  tide: 82,
  hand: 50,
  ledger: 68,
  birds: 36,
  salt: 16,
  errata: 32,
  glass: 13,
};

function allocateYears(thread: ThreadId, n: number, rng: () => number): number[] {
  const active: number[] = [];
  for (let y = YEAR0; y <= YEAR1; y += 1) {
    if (threadActive(thread, y)) active.push(y);
  }
  const weights = active.map((y) => ((y + thread.charCodeAt(0)) % 4 === 0 ? 3.2 : 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  const years: number[] = [];
  for (let i = 0; i < n; i += 1) {
    let r = rng() * sum;
    let chosen = active[0]!;
    for (let j = 0; j < active.length; j += 1) {
      r -= weights[j]!;
      if (r <= 0) {
        chosen = active[j]!;
        break;
      }
    }
    years.push(chosen);
  }
  return years.sort((a, b) => a - b);
}

function finish(drafts: Draft[]): Work[] {
  const byYear = new Map<number, Draft[]>();
  for (const d of drafts) {
    const list = byYear.get(d.year) ?? [];
    list.push(d);
    byYear.set(d.year, list);
  }
  const works: Work[] = [];
  for (let y = YEAR0; y <= YEAR1; y += 1) {
    const list = (byYear.get(y) ?? []).slice().sort((a, b) => a.title.localeCompare(b.title));
    list.forEach((d, i) => {
      works.push({
        ...d,
        cat: `EW ${y}.${String(i + 1).padStart(2, "0")}`,
      });
    });
  }
  return works;
}

function build(): Work[] {
  const rng = mulberry32(0x5741494e); // WAIN
  const usedIds = new Set<string>();
  const usedTitles = new Set<string>();
  const drafts: Draft[] = [];

  for (const k of keystones()) {
    usedIds.add(k.id);
    usedTitles.add(k.title);
    drafts.push(k);
  }

  const members = () => {
    const c = {} as Record<ThreadId, number>;
    for (const t of THREADS) c[t.id] = 0;
    for (const d of drafts) for (const t of d.threads) c[t] += 1;
    return c;
  };

  for (const thread of THREADS) {
    const need = PRIMARY_FILL[thread.id];
    const years = allocateYears(thread.id, need, rng);
    for (const year of years) {
      const kind = kindFor(rng, thread.id, year);
      const title = titleFor(thread.id, rng, usedTitles);
      const id = slug(title, year, usedIds);
      const d = dims(rng, kind);
      drafts.push({
        id,
        title,
        year,
        kind,
        medium: mediumFor(rng, kind, thread.id),
        ...d,
        edition: editionFor(rng, kind),
        location: locationFor(rng, kind, year),
        threads: [thread.id],
        claims: { [thread.id]: "series" },
      });
    }
  }

  // Second threads: a work can sit on two preoccupations if both were active.
  const count = members();
  const extras: ThreadId[] = THREADS.flatMap((t) => {
    const lack = MEMBER_TARGET[t.id] - count[t.id];
    return lack > 0 ? Array<ThreadId>(lack).fill(t.id) : [];
  });

  for (const extra of extras) {
    const candidates = drafts.filter(
      (d) =>
        !d.threads.includes(extra) &&
        d.threads.length < 3 &&
        threadActive(extra, d.year),
    );
    if (candidates.length === 0) continue;
    const d = pick(rng, candidates);
    d.threads.push(extra);
    d.claims = { ...d.claims, [extra]: rng() < 0.35 ? "series" : "artist" };
  }

  // A few more crossings so following a thread keeps meeting others.
  for (const d of drafts) {
    if (d.threads.length !== 1 || rng() > 0.28) continue;
    const others = THREADS.map((t) => t.id).filter(
      (id) => id !== d.threads[0] && threadActive(id, d.year),
    );
    if (others.length === 0) continue;
    const add = pick(rng, others);
    d.threads.push(add);
    d.claims = { ...d.claims, [add]: "artist" };
  }

  return finish(drafts);
}

export const WORKS: Work[] = build();

export const WORK_BY_ID: Record<string, Work> = Object.fromEntries(
  WORKS.map((w) => [w.id, w]),
);

export function worksOn(thread: ThreadId): Work[] {
  return WORKS.filter((w) => w.threads.includes(thread)).sort(
    (a, b) => a.year - b.year || a.cat.localeCompare(b.cat),
  );
}

export const BY_THREAD: Record<ThreadId, Work[]> = {
  tide: worksOn("tide"),
  hand: worksOn("hand"),
  ledger: worksOn("ledger"),
  birds: worksOn("birds"),
  salt: worksOn("salt"),
  errata: worksOn("errata"),
  glass: worksOn("glass"),
};

export const REPRESENTATIVE: Record<ThreadId, string> = {
  tide: "predicted-high-sheerness",
  hand: "the-uncrossed-t",
  ledger: "brought-forward",
  birds: "blur-fieldfare",
  salt: "cloth-on-the-wall",
  errata: "see-also",
  glass: "rain-on-the-up-line",
};

export function yearX(year: number): number {
  return (year - YEAR0 + 0.5) / (YEAR1 - YEAR0 + 1);
}

export function workX(work: Work, siblings: Work[]): number {
  const same = siblings.filter((w) => w.year === work.year);
  const i = same.findIndex((w) => w.id === work.id);
  const n = same.length;
  const base = yearX(work.year);
  const slot = 1 / (YEAR1 - YEAR0 + 1);
  const spread = n <= 1 ? 0 : ((i - (n - 1) / 2) / n) * slot * 0.72;
  return base + spread;
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

export function cite(w: Work): string {
  const dim =
    w.w === 0 && w.h === 0
      ? "dimensions variable"
      : w.d != null
        ? `${trimNum(w.h)} × ${trimNum(w.w)} × ${trimNum(w.d)} cm`
        : `${trimNum(w.h)} × ${trimNum(w.w)} cm`;
  const rawEd = w.edition.replace(/[.]$/, "");
  const ed =
    rawEd === "unique"
      ? "Unique."
      : rawEd.startsWith("edition of")
        ? `Edition of${rawEd.slice("edition of".length)}.`
        : `${rawEd}.`;
  return `Wain, Esther. ${w.title}. ${w.year}. ${w.medium}, ${dim}. ${ed} ${w.location}. Catalogue ${w.cat}.`;
}

export function seriesMates(work: Work): Work[] {
  if (!work.series) return [];
  return WORKS.filter((w) => w.series === work.series && w.id !== work.id).sort(
    (a, b) => a.year - b.year,
  );
}

export function pairOf(work: Work): { work: Work; kind: RelKind; label: string }[] {
  if (!work.pairs) return [];
  return work.pairs
    .map((p) => {
      const other = WORK_BY_ID[p.id];
      return other ? { work: other, kind: p.kind, label: p.label } : null;
    })
    .filter((x): x is { work: Work; kind: RelKind; label: string } => x != null);
}

export function claimLabel(kind: RelKind): string {
  if (kind === "artist") return "artist's claim";
  if (kind === "series") return "same series";
  if (kind === "plate") return "shared plate";
  return "sited together";
}

export function kindLabel(kind: MediumKind): string {
  if (kind === "print") return "print";
  if (kind === "sculpture") return "sculpture";
  if (kind === "book") return "artist's book";
  return "commission";
}

export function dimLine(w: Work): string {
  if (w.w === 0 && w.h === 0) return "dimensions variable";
  if (w.d != null) return `${trimNum(w.h)} × ${trimNum(w.w)} × ${trimNum(w.d)} cm`;
  return `${trimNum(w.h)} × ${trimNum(w.w)} cm`;
}
