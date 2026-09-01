/**
 * Recommendations are Monday jobs, not insights. Taking one must change the
 * next one — freed slots make a face-out test cheap; leaving a return makes
 * the same test expensive. The engine is honest about what the till cannot see.
 */

import {
  LONG_TAIL_UNSEEN,
  SECTIONS,
  TITLES,
  isDead,
  monthsQuiet,
  perMetre,
  pounds,
  poundsWhole,
  sectionById,
  shopPerMetre,
  slotWaster,
  stockTied,
  titleById,
  unseen,
  wasSeen,
  type SectionId,
  type Title,
} from "./shop";

export type OfferKind = "return" | "slots" | "poetry" | "table" | "test" | "order";

export type Offer = {
  id: string;
  kind: OfferKind;
  rank: number;
  kicker: string;
  headline: string;
  monday: string;
  why: string;
  blind: string | null;
  costOfWrong: string;
  titleIds: string[];
  metresFreed: number;
  slotsFreed: number;
  slotsUsed: number;
  cashReleased: number;
  orderQty?: number;
  destSection?: SectionId;
};

export type Session = {
  taken: string[];
  left: string[];
  testId: string;
  orderLocal: number;
  orderNovel: number;
};

export const DEFAULT_SESSION: Session = {
  taken: [],
  left: [],
  testId: "l-unseen",
  orderLocal: 4,
  orderNovel: 3,
};

const OFFER_IDS = [
  "return-window",
  "free-slots",
  "poetry-metre",
  "keep-table",
  "test-face",
  "order-local",
  "order-novel",
] as const;

export type OfferId = (typeof OFFER_IDS)[number];

export function isOfferId(id: string): id is OfferId {
  return (OFFER_IDS as readonly string[]).includes(id);
}

function deadSeenReturnable(title: Title): boolean {
  return isDead(title) && wasSeen(title) && title.returnable && !title.forthcoming;
}

export function windowReturns(gone: Set<string>): Title[] {
  return TITLES.filter(
    (t) =>
      !gone.has(t.id) &&
      deadSeenReturnable(t) &&
      Boolean(t.windowCloses)
  );
}

export function poetryCut(gone: Set<string>): Title[] {
  return TITLES.filter(
    (t) =>
      !gone.has(t.id) &&
      t.section === "poetry" &&
      deadSeenReturnable(t)
  );
}

export function wasters(gone: Set<string>): Title[] {
  return TITLES.filter((t) => !gone.has(t.id) && slotWaster(t));
}

function goneFrom(session: Session): Set<string> {
  const gone = new Set<string>();
  const taken = new Set(session.taken);
  if (taken.has("poetry-metre")) {
    for (const t of poetryCut(new Set())) gone.add(t.id);
  }
  if (taken.has("return-window")) {
    for (const t of windowReturns(new Set(gone))) gone.add(t.id);
  }
  return gone;
}

function goneBefore(session: Session, id: string): Set<string> {
  return goneFrom({
    ...session,
    taken: session.taken.filter((item) => item !== id),
  });
}

function cashOf(titles: Title[]): number {
  return titles.reduce((n, t) => n + stockTied(t), 0);
}

function faceFreed(titles: Title[]): number {
  return titles.filter((t) => t.facing === "face").length;
}

function shortList(titles: Title[]): string {
  if (titles.length === 0) return "nothing";
  if (titles.length === 1) return titles[0].title;
  if (titles.length === 2) return `${titles[0].title} and ${titles[1].title}`;
  return `${titles
    .slice(0, -1)
    .map((t) => t.title)
    .join(", ")}, and ${titles[titles.length - 1].title}`;
}

function publishers(titles: Title[]): string {
  return [...new Set(titles.map((t) => t.publisher))].join(", ");
}

function latestWindow(titles: Title[]): string {
  const dates = titles.map((t) => t.windowCloses).filter((x): x is string => Boolean(x));
  return dates[0] ?? "the end of the month";
}

export function spaceOf(session: Session): {
  metres: Record<SectionId, number>;
  slots: Record<SectionId, { filled: number; open: number; trial: number; total: number }>;
  freeSlots: number;
  metresFreed: number;
  cashReleased: number;
} {
  const gone = goneFrom(session);
  const metres = Object.fromEntries(
    SECTIONS.map((s) => [s.id, s.metres])
  ) as Record<SectionId, number>;
  const slots = Object.fromEntries(
    SECTIONS.map((s) => [
      s.id,
      { filled: s.faceSlots, open: 0, trial: 0, total: s.faceSlots },
    ])
  ) as Record<SectionId, { filled: number; open: number; trial: number; total: number }>;

  let metresFreed = 0;
  let cashReleased = 0;

  function freeIn(section: SectionId, n: number) {
    const row = slots[section];
    const take = Math.min(n, row.filled);
    row.filled -= take;
    row.open += take;
  }

  if (session.taken.includes("poetry-metre")) {
    const cut = poetryCut(goneBefore(session, "poetry-metre"));
    if (cut.length) {
      metres.poetry = Math.round((metres.poetry - 1.4) * 10) / 10;
      metresFreed += 1.4;
      cashReleased += cashOf(cut);
      slots.poetry.total = Math.max(8, slots.poetry.total - 3);
      for (const t of cut) {
        if (t.facing === "face") freeIn("poetry", 1);
      }
    }
  }

  if (session.taken.includes("return-window")) {
    const pack = windowReturns(goneBefore(session, "return-window"));
    cashReleased += cashOf(pack);
    metresFreed += pack.some((t) => t.section === "poetry") ? 0.4 : 0.9;
    for (const t of pack) {
      if (t.facing === "face") freeIn(t.section, 1);
    }
  }

  if (session.taken.includes("free-slots")) {
    for (const t of wasters(gone)) {
      if (t.facing === "face") freeIn(t.section, 1);
    }
  }

  if (session.taken.includes("keep-table")) {
    const handbook = titleById("l-nat");
    if (handbook && handbook.facing === "face") freeIn("table", 1);
  }

  if (session.taken.includes("test-face")) {
    const test = titleById(session.testId);
    const dest: SectionId = test?.section ?? "new";
    const row = slots[dest];
    if (row.open > 0) {
      row.open -= 1;
      row.trial += 1;
    } else if (row.filled > 0) {
      row.filled -= 1;
      row.trial += 1;
    } else {
      slots.new.open = Math.max(0, slots.new.open - 1);
      slots.new.trial += 1;
    }
  }

  const freeSlots = SECTIONS.reduce((n, s) => n + slots[s.id].open, 0);
  return { metres, slots, freeSlots, metresFreed, cashReleased };
}

function displacement(session: Session): Title | null {
  if (spaceOf(session).freeSlots > 0) return null;
  const handbook = titleById("l-nat");
  if (handbook && !session.taken.includes("keep-table") && !session.left.includes("keep-table")) {
    return handbook;
  }
  const w = wasters(goneFrom(session));
  if (w[0]) return w[0];
  return titleById("f-orbits") ?? null;
}

function buildReturn(session: Session, gone: Set<string>): Offer | null {
  if (session.taken.includes("return-window") || session.left.includes("return-window")) {
    return null;
  }
  const pack = windowReturns(gone);
  if (pack.length < 3) return null;
  const windows = latestWindow(pack);
  return {
    id: "return-window",
    kind: "return",
    rank: 10,
    kicker: `Returns window · ${windows}`,
    headline: `Pack ${pack.length} titles that were seen and still did not sell.`,
    monday: `Pull ${shortList(pack)} and pack for ${publishers(pack)}. Box in the stockroom. Their window closes ${windows}.`,
    why: `Each of these stood face-out for at least six weeks in the last three years and has not sold in fourteen months. That is the rare case where the till can say unwanted rather than unseen. They tie up ${pounds(cashOf(pack))} of cash.`,
    blind: `${LONG_TAIL_UNSEEN} other slow titles have never been face-out. Do not put those in this box. Unseen is not unwanted.`,
    costOfWrong: `A return costs about ${pounds(Math.round(pack.reduce((n, t) => n + t.returnCostPence * t.copies, 0)))} in carriage and penalties. Leaving them costs the cash and the spine they occupy until you eat them.`,
    titleIds: pack.map((t) => t.id),
    metresFreed: 0.9,
    slotsFreed: faceFreed(pack),
    slotsUsed: 0,
    cashReleased: cashOf(pack),
  };
}

function buildSlots(session: Session, gone: Set<string>): Offer | null {
  if (session.taken.includes("free-slots") || session.left.includes("free-slots")) {
    return null;
  }
  const pack = wasters(gone);
  if (!pack.length) return null;
  return {
    id: "free-slots",
    kind: "slots",
    rank: 20,
    kicker: "Face-out · wasted slots",
    headline: `Take down ${pack.length} titles that already sell from the spine.`,
    monday: `Move ${shortList(pack)} to spine-out. Leave them in section. You are not returning them.`,
    why: pack
      .map(
        (t) =>
          `${t.title}: ${t.unitsSpine} from the spine last year, ${t.unitsFace} from the face. The slot is not doing the selling.`
      )
      .join(" "),
    blind: null,
    costOfWrong: `If a title is more display-dependent than the year suggests, you will feel it within a fortnight. Put it back. A slot is cheaper to reverse than a return.`,
    titleIds: pack.map((t) => t.id),
    metresFreed: 0,
    slotsFreed: pack.length,
    slotsUsed: 0,
    cashReleased: 0,
  };
}

function buildPoetry(session: Session, gone: Set<string>): Offer | null {
  if (session.taken.includes("poetry-metre") || session.left.includes("poetry-metre")) {
    return null;
  }
  const cut = poetryCut(gone);
  const poetry = sectionById("poetry");
  const shop = shopPerMetre();
  if (!cut.length) {
    if (!session.taken.includes("return-window")) return null;
    return {
      id: "poetry-metre",
      kind: "poetry",
      rank: 30,
      kicker: "Poetry · the expensive metre",
      headline: "The dead poetry went in the returns box. What remains is a choice, not a calculation.",
      monday: "Leave the poetry bay as it stands. Night Watch and River Sonnets stay face-out. Do not send the two unseen pamphlets back just to tidy the metre.",
      why: `Poetry earned ${poundsWhole(perMetre(poetry))} per metre last year against the shop’s ${poundsWhole(shop)}. After the returns, that gap is mostly the living core plus two titles nobody has been shown.`,
      blind: "The till cannot price the person who comes for a pamphlet and leaves with a novel. If you keep poetry, you are keeping that bet. That can be a decision. It is not a rounding error.",
      costOfWrong: "Killing the bay to chase the shop average would free about two metres and lose the only section some of your regulars come in for.",
      titleIds: [],
      metresFreed: 0,
      slotsFreed: 0,
      slotsUsed: 0,
      cashReleased: 0,
    };
  }
  return {
    id: "poetry-metre",
    kind: "poetry",
    rank: 30,
    kicker: "Poetry · the expensive metre",
    headline: `Cut 1.4m of poetry that was shown and still did not move.`,
    monday: `Pull ${shortList(cut)} from the poetry bay. Pack them with the window returns if you have not already. Close the bay up by a shelf.`,
    why: `Poetry occupies 4.2m and earned ${poundsWhole(perMetre(poetry))} per metre last year. The shop average is ${poundsWhole(shop)}. The gap is not the whole bay — Night Watch and River Sonnets do sell. It is this dead metre.`,
    blind: "Two further pamphlets on that bay have never been face-out. They are not in this pull. Unseen is not unwanted, even in a section that loses money.",
    costOfWrong: "If the dead metre is also the browsing metre — the one that makes the bay look like a poetry section — shrinking it may cost you the customers the till never attributes to poetry. That halo is real and unmeasured.",
    titleIds: cut.map((t) => t.id),
    metresFreed: 1.4,
    slotsFreed: faceFreed(cut),
    slotsUsed: 0,
    cashReleased: cashOf(cut),
  };
}

function buildTable(session: Session): Offer | null {
  if (session.taken.includes("keep-table") || session.left.includes("keep-table")) {
    return null;
  }
  const table = sectionById("table");
  const handbook = titleById("l-nat");
  if (!handbook) return null;
  return {
    id: "keep-table",
    kind: "table",
    rank: 40,
    kicker: "Door table · September",
    headline: "Keep the table. It earns its position. Pull the handbook off the face.",
    monday: `Leave the door table where it is. Take ${handbook.title} down to the local wall — it already sells from the spine there. Keep Silver Street in the Flood and Twelve Walks looking at the door.`,
    why: `The table earned ${poundsWhole(perMetre(table))} per metre last year, the best metre in the shop, almost all of it June to August. Early September still has a tail. The handbook’s year was ${handbook.unitsFace} face and ${handbook.unitsSpine} spine: the slot is wasted.`,
    blind: "January will not look like this. The table’s year is seasonal. Revisit in November; do not take the year-average as a winter instruction.",
    costOfWrong: "Killing the table in September to ‘tidy the door’ would move the two titles that only sell there onto a wall they have never sold from.",
    titleIds: [handbook.id],
    metresFreed: 0,
    slotsFreed: 1,
    slotsUsed: 0,
    cashReleased: 0,
  };
}

function buildTest(session: Session, gone: Set<string>): Offer | null {
  if (session.taken.includes("test-face") || session.left.includes("test-face")) {
    return null;
  }
  const test = titleById(session.testId);
  if (!test || gone.has(test.id)) return null;
  const space = spaceOf(session);
  const free = space.freeSlots;
  const displace = displacement(session);
  const faceNote =
    test.faceOutWeeks === 0
      ? "It has never stood face-out."
      : `It has had ${test.faceOutWeeks} week face-out in three years — not enough to mean anything.`;

  let monday: string;
  let cost: string;
  let slotsUsed = 1;
  let slotsFreed = 0;

  if (free > 0) {
    monday = `Stand ${test.title} face-out for one week in ${sectionById(test.section).name.toLowerCase()}. You already have an open slot. Pencil the date on the ticket. If it has not moved by next Sunday, it can go back to the spine without a story.`;
    cost = "One week of a slot you have already freed. If it dies, you have lost a week, not a return.";
  } else if (displace) {
    monday = `Take down ${displace.title} and stand ${test.title} in that slot for one week. Pencil the date on the ticket.`;
    cost = `${displace.title} sold ${displace.unitsFace + displace.unitsSpine} last year. A week off the face is the price of the only honest test. If you will not pay it, do not return ${test.title} either — you still do not know.`;
    slotsFreed = 1;
  } else {
    monday = `Find a slot. Stand ${test.title} face-out for one week. Pencil the date.`;
    cost = "A slot you would rather give to something you already know sells.";
  }

  return {
    id: "test-face",
    kind: "test",
    rank: free > 0 ? 15 : 50,
    kicker: "Blind spot · one-week test",
    headline: `Show ${test.title}. The till cannot tell you it is unwanted.`,
    monday,
    why: `${test.title} — ${monthsQuiet(test)}. ${faceNote} A quiet spine is not evidence. The only honest test is a week where someone can see it.`,
    blind: "This is the face-out blind spot, named: the data cannot distinguish a book nobody wants from a book nobody saw. A recommendation to return it would be a guess dressed as a figure.",
    costOfWrong: cost,
    titleIds: [test.id],
    metresFreed: 0,
    slotsFreed,
    slotsUsed,
    cashReleased: 0,
    destSection: test.section,
  };
}

function comparableLine(id: string): { title: Title; sold: number } | null {
  const c = titleById(id);
  if (!c) return null;
  return { title: c, sold: c.unitsFace + c.unitsSpine };
}

function buildOrderLocal(session: Session): Offer | null {
  if (session.taken.includes("order-local") || session.left.includes("order-local")) {
    return null;
  }
  const title = titleById("ord-flood");
  if (!title?.forthcoming) return null;
  const qty = session.orderLocal;
  const comp = comparableLine(title.forthcoming.comparableId);
  const cash = qty * title.costPence;
  return {
    id: "order-local",
    kind: "order",
    rank: 60,
    kicker: `Forthcoming · ${title.forthcoming.pub}`,
    headline: `Order ${qty} of ${title.title}, not a hopeful eight.`,
    monday: `Email the Parish Society for ${qty} copies, pub ${title.forthcoming.pub}. Put them on the door table, not the wall.`,
    why: comp
      ? `${comp.title.title} did ${comp.sold} in a year, almost all from the door. ${qty} is that rate through Christmas, plus one for the window. Eight would tie up ${pounds(8 * title.costPence)} until January.`
      : `Order ${qty}.`,
    blind: "If you order two and needed five, the three you did not sell are invisible. The till cannot count a missed sale. Underordering is a cost you will never see; overordering is a cost you will.",
    costOfWrong: `Each unsold copy is ${pounds(title.costPence)} sitting in the table, and a return later costs ${pounds(title.returnCostPence)} on top. ${qty} commits ${pounds(cash)}.`,
    titleIds: [title.id],
    metresFreed: 0,
    slotsFreed: 0,
    slotsUsed: 0,
    cashReleased: -cash,
    orderQty: qty,
  };
}

function buildOrderNovel(session: Session): Offer | null {
  if (session.taken.includes("order-novel") || session.left.includes("order-novel")) {
    return null;
  }
  const title = titleById("ord-novel");
  if (!title?.forthcoming) return null;
  const qty = session.orderNovel;
  const comp = comparableLine(title.forthcoming.comparableId);
  const cash = qty * title.costPence;
  return {
    id: "order-novel",
    kind: "order",
    rank: 70,
    kicker: `Forthcoming · ${title.forthcoming.pub}`,
    headline: `Order ${qty} of ${title.title}. Her last one sold here from the face.`,
    monday: `Raise a Cape order for ${qty}, pub ${title.forthcoming.pub}. One on the new table, the rest behind.`,
    why: comp
      ? `${comp.title.title} did ${comp.sold} last year, ${comp.title.unitsFace} of them from the face. ${qty} is a fortnight of that, not a stack. A missed sale will not appear on any report.`
      : `Order ${qty}.`,
    blind: "Underordering costs a sale the till never sees. That is a second blind spot, cousin to the face-out one. Do not read a clean sell-through as proof you ordered well.",
    costOfWrong: `${qty} ties ${pounds(cash)}. Six would look confident and would be a returns box in January.`,
    titleIds: [title.id],
    metresFreed: 0,
    slotsFreed: 0,
    slotsUsed: 0,
    cashReleased: -cash,
    orderQty: qty,
  };
}

export function offersOf(session: Session): Offer[] {
  const gone = goneFrom(session);
  const built = [
    buildReturn(session, gone),
    buildSlots(session, gone),
    buildPoetry(session, gone),
    buildTable(session),
    buildTest(session, gone),
    buildOrderLocal(session),
    buildOrderNovel(session),
  ].filter((o): o is Offer => o !== null);
  return built.sort((a, b) => a.rank - b.rank);
}

export function takenJobs(session: Session): Offer[] {
  const replay: Session = {
    ...session,
    taken: [],
    left: session.left,
  };
  const jobs: Offer[] = [];
  for (const id of session.taken) {
    const open = offersOf(replay);
    const hit = open.find((o) => o.id === id);
    if (hit) jobs.push(hit);
    replay.taken = [...replay.taken, id];
  }
  return jobs;
}

export function leftNotes(session: Session): { id: string; note: string }[] {
  const notes: { id: string; note: string }[] = [];
  for (const id of session.left) {
    if (id === "return-window") {
      notes.push({
        id,
        note: "You left the window returns. Those copies still tie cash, and the window still closes. Next Sunday they may no longer be returnable.",
      });
    } else if (id === "poetry-metre") {
      notes.push({
        id,
        note: "You kept the poetry metre as it stands — including the dead shelf. That can be a choice. It is not what the £/m figure would tell you to do.",
      });
    } else if (id === "free-slots") {
      notes.push({
        id,
        note: "You left titles on the face that already sell from the spine. Those slots stay scarce.",
      });
    } else if (id === "keep-table") {
      notes.push({
        id,
        note: "You did not commit the table. If you move it Monday without a reason, you are guessing in the other direction.",
      });
    } else if (id === "test-face") {
      notes.push({
        id,
        note: "You declined the face-out test. Do not return that title this week either. You still cannot tell unseen from unwanted.",
      });
    } else if (id === "order-local") {
      notes.push({
        id,
        note: "No local Christmas order this week. Lead time on the Parish Society is a fortnight — leaving it is a decision to risk a gap.",
      });
    } else if (id === "order-novel") {
      notes.push({
        id,
        note: "No Cape order this week. Publication is 24 September. Leaving it is how you discover a missed sale you will never see.",
      });
    }
  }
  return notes;
}

export function remainingDead(): { seen: number; unseen: number; listedUnseen: Title[] } {
  const seen = TITLES.filter((t) => isDead(t) && wasSeen(t) && !t.forthcoming).length;
  const listedUnseen = TITLES.filter((t) => unseen(t) && isDead(t) && !t.forthcoming);
  return { seen, unseen: LONG_TAIL_UNSEEN, listedUnseen };
}

export const SECTION_OFFER: Partial<Record<SectionId, string>> = {
  poetry: "poetry-metre",
  table: "keep-table",
  local: "keep-table",
  new: "order-novel",
  fiction: "return-window",
  crime: "return-window",
  nature: "test-face",
  cookery: "free-slots",
  children: "free-slots",
  biography: "return-window",
  politics: "return-window",
};
