import { PRODUCTS } from "./catalog";
import type { Product } from "./types";

/**
 * What the counter actually does: hear the job, name the line.
 * These answers are the shop's stock of advice, written as the counter
 * would say them — not a filter UI dressed as expertise.
 */

export type JobId =
  | "timber"
  | "pulled"
  | "door"
  | "lock"
  | "hang"
  | "hit"
  | "in-hand";

export const JOBS: { id: JobId; title: string; ask: string }[] = [
  { id: "timber", title: "I am fastening timber", ask: "What is the timber, and where does it live?" },
  { id: "pulled", title: "Something pulled out of a wall", ask: "What was it in, and what came out?" },
  { id: "door", title: "A door or a gate is failing", ask: "What is it doing that it should not?" },
  { id: "lock", title: "A lock or a latch", ask: "Which door, and what do you need it to do?" },
  { id: "hang", title: "I need chain, or to hang a thing", ask: "What is hanging, and is anyone under it?" },
  { id: "hit", title: "I need to hit something", ask: "What are you hitting, and with what already in your hand?" },
  { id: "in-hand", title: "I have a piece in my hand", ask: "Describe it. Head, metal, what it came out of." },
];

export type Answer = {
  id: string;
  label: string;
  familyId: string;
  /** Prefer this length / gauge when offering a first line. */
  prefer?: { gauge?: string; length?: string; diameter?: string };
  said: string;
  warn: string;
};

export const ANSWERS: Record<string, Answer> = {
  "oak-out-coast": {
    id: "oak-out-coast",
    label: "Oak, outdoors, near the sea",
    familyId: "ws-a4-csk-pz",
    prefer: { gauge: "10g", length: "50 mm" },
    said: "A4 stainless, countersunk, Pozidriv. Oak is acidic and the weather here tastes of salt. A2 will pit. Zinc will be brown dust in a season. Silicon bronze if it is a boat or a church door and you want it still there in fifty years — we have that too, and it costs what it costs.",
    warn: "Do not let anyone sell you a green-coated decking screw for oak. The coat is a sales finish.",
  },
  "oak-out-inland": {
    id: "oak-out-inland",
    label: "Oak, outdoors, inland",
    familyId: "ws-a4-csk-pz",
    prefer: { gauge: "8g", length: "50 mm" },
    said: "Still A4, not A2. Oak eats ordinary stainless; the molybdenum is the point. If it is a conservation job and they will look at the head, the silicon bronze slotted is the older correct answer.",
    warn: "Pilot oak. It splits, and a sheared brass or a spun zinc is how this conversation starts next year.",
  },
  "oak-in": {
    id: "oak-in",
    label: "Oak, indoors",
    familyId: "ws-a2-csk-pz",
    prefer: { gauge: "8g", length: "38 mm" },
    said: "A2 stainless, countersunk, Pozidriv. Indoor oak still stains around zinc. Brass if you want the head to match brass ironmongery — and then pilot it, because brass shears.",
    warn: "Not a drywall screw. Not a chipboard screw. Both will chew a hole and hold nothing.",
  },
  "pine-out-coast": {
    id: "pine-out-coast",
    label: "Softwood, outdoors, coastal",
    familyId: "ws-a4-csk-tx",
    prefer: { gauge: "10g", length: "63 mm" },
    said: "A4, Torx, a decking length. Coastal pine still wants A4. The green box will be returned before the year is out.",
    warn: "If it is a structural post, a coach screw in A2 is the inland answer and we should talk about the section, not just the screw.",
  },
  "pine-out": {
    id: "pine-out",
    label: "Softwood, outdoors, inland",
    familyId: "ws-a2-csk-pz",
    prefer: { gauge: "8g", length: "50 mm" },
    said: "A2 stainless, countersunk, Pozidriv. Inland weather. Zinc is cheaper and it will rust at the head in two winters. If you are laying a deck, the A2 Torx decking screw is the same metal with a better bit.",
    warn: "Treated pine is still pine. The treatment is not a licence to use interior zinc.",
  },
  "pine-in": {
    id: "pine-in",
    label: "Softwood, indoors, dry",
    familyId: "ws-zn-csk-pz",
    prefer: { gauge: "8g", length: "38 mm" },
    said: "Bright zinc, countersunk, Pozidriv. The default indoor screw. A box of two hundred if you are doing a job; a card of ten if you are hanging one thing.",
    warn: "Pozidriv, not Phillips. A Phillips bit will cam out and ruin the head, and then you will be back for a screw extractor we do not enjoy selling.",
  },
  "wet-room": {
    id: "wet-room",
    label: "Timber in a bathroom or kitchen wet",
    familyId: "ws-a2-csk-pz",
    prefer: { gauge: "8g", length: "38 mm" },
    said: "A2. A bathroom is weather that happens indoors. Zinc in a wet room is a brown stain around the head by spring.",
    warn: "If it is board, not timber — chipboard or plasterboard — that is a different screw. Say so.",
  },
  "chipboard": {
    id: "chipboard",
    label: "Chipboard or MDF",
    familyId: "ws-tf-csk-pz",
    prefer: { gauge: "8g", length: "30 mm" },
    said: "Twinfast, yellow zinc, Pozidriv. Double-start thread for man-made board. Kitchen units. A box of two hundred.",
    warn: "It will chew oak and it will rust outside. Board only.",
  },
  "decking": {
    id: "decking",
    label: "Decking boards",
    familyId: "ws-dk-a2-tx",
    prefer: { gauge: "10g", length: "63 mm" },
    said: "A2 Torx decking screw inland. A4 if you can taste salt on the wind. Length should go through the board and most of the joist — 63 mm is the usual for 25 mm board.",
    warn: "The green-coated steel is what the sheds sell. We stock it so I can talk you out of it.",
  },
  "old-work": {
    id: "old-work",
    label: "Old joinery, matching what is there",
    familyId: "ws-cut-csk-sl",
    prefer: { gauge: "8g", length: "50 mm" },
    said: "Cut-thread, slotted, bright. The old pattern. It holds in seasoned timber. If the existing heads are slotted stainless, we have that too.",
    warn: "Unplated steel rusts. Oil it or paint it. Do not start a new kitchen on slotted.",
  },
  "sheet": {
    id: "sheet",
    label: "Sheet metal or flashing",
    familyId: "ws-st-pan-pz",
    prefer: { gauge: "8g", length: "19 mm" },
    said: "Self-tapper, pan, Pozidriv. It cuts a thread in thin metal. A wood screw in sheet just spins.",
    warn: "Not for timber, not for a wall.",
  },
  "brick-screw": {
    id: "brick-screw",
    label: "Solid brick or block — a screw came out",
    familyId: "pl-brown",
    prefer: { length: "40 mm" },
    said: "Brown nylon plug, 7 mm hole, blow the dust out, then an 8g wood screw long enough to go through the fitting and most of the plug. The plug is what failed, or the hole was wrong, or both.",
    warn: "A longer screw in the same tired hole will spin. Drill out, new plug. If it is a heavy cupboard, we should be talking about a shield anchor, not a brown plug.",
  },
  "board-screw": {
    id: "board-screw",
    label: "Plasterboard — a screw came out",
    familyId: "pl-plasterboard",
    said: "Find the stud if you can. If you cannot, a metal self-drive plasterboard plug for a light thing, a cavity anchor for a heavier one. A brown plug in plasterboard spins. That is why it came out.",
    warn: "A television, a cupboard of plates, a grab rail: not a self-drive plug. Say what you are hanging.",
  },
  "concrete": {
    id: "concrete",
    label: "Concrete or dense masonry",
    familyId: "pl-rawlbolt",
    prefer: { diameter: "M10" },
    said: "Shield anchor — a rawlbolt. Drill the hole the shield asks for, blow it out, torque it. Soft brick will crumble around it; that is a brown plug job, not this.",
    warn: "Not plasterboard. Not aerated block.",
  },
  "hinge-out": {
    id: "hinge-out",
    label: "Hinge screws pulled out of the timber",
    familyId: "ws-zn-csk-pz",
    prefer: { gauge: "10g", length: "50 mm" },
    said: "The hinge is usually fine. The rebate is tired. Longer screws — 50 or 63 mm — through the hinge into the carcass or the stud, not a bigger hinge. If the timber is split, a glued slip and then the screws.",
    warn: "Do not fill the holes with matches and hope. It works once, in a cupboard, and then you are back.",
  },
  "gate-sag": {
    id: "gate-sag",
    label: "A gate has dropped",
    familyId: "hg-strap",
    prefer: { length: "600 mm" },
    said: "Look at the post first. A dropped gate is often a rotting post. If the post is sound, hook and band, long enough — 600 mm on a field gate, tee hinges on a shed. A third cheap tee on a tired post is not a repair.",
    warn: "A door closer or a cabin hook will not lift a sagging gate.",
  },
  "door-sag": {
    id: "door-sag",
    label: "A room door has dropped",
    familyId: "hg-butt-steel",
    prefer: { length: "100 mm" },
    said: "A 100 mm steel butt, in a pair, if the old hinge is bent. If the screws pulled out, that is the tired-rebate job, not a new hinge. If the door must fold flat to the wall, that is a parliament hinge and you should say so.",
    warn: "Brass butts on a heavy pine door look right and then bend.",
  },
  "shed-door": {
    id: "shed-door",
    label: "A shed or boarded door",
    familyId: "hg-tee",
    prefer: { length: "300 mm" },
    said: "Tee hinges, galvanised, 300 mm for most sheds. The strap on the door, the plate on the post. A Suffolk latch if it only has to keep the wind out.",
    warn: "Interior butts on a shed door will rust into a single object by November.",
  },
  "front-lock": {
    id: "front-lock",
    label: "A front door that must lock",
    familyId: "lk-mortice-dead",
    said: "A 5-lever BS 3621 deadlock, 76 mm case unless you have measured something else. A nightlatch on its own is a convenience lock. Many insurers still want the kitemarked mortice. Measure the old case before you leave the house.",
    warn: "A 3-lever sashlock is not this. I will not sell you one for a front door.",
  },
  "yale": {
    id: "yale",
    label: "The rim lock people call a Yale",
    familyId: "lk-nightlatch",
    said: "Nightlatch, 60 mm backset — measure from the edge to the keyhole of the old one. We stock the common. It is not a substitute for a deadlock if the insurer asked for one.",
    warn: "Backset is the whole of the fitting. 40 mm and 60 mm are not interchangeable.",
  },
  "room-lock": {
    id: "room-lock",
    label: "An internal door, latch and lock",
    familyId: "lk-mortice-sash",
    said: "Sashlock, 3-lever, 64 mm unless the old case is 76. Measure. The spindle height moves with the case, and a new lock in an old hole that does not line up is a carpenter, not a screw.",
    warn: "Do not buy a deadlock for a bedroom that needs a latch.",
  },
  "padlock": {
    id: "padlock",
    label: "A shed or a hasp",
    familyId: "lk-pad-laminated",
    said: "Laminated padlock, 40 mm, and look at the hasp. The cheap open hasp is what gets levered. Coach screws into something solid, not drywall screws into the cladding.",
    warn: "A brass 30 mm is a cupboard lock.",
  },
  "gate-latch": {
    id: "gate-latch",
    label: "A garden gate that should stay shut",
    familyId: "lk-thumb",
    said: "Suffolk latch if it is a boarded gate. A tower bolt on the other stile if the wind opens it. A gate spring if it should close itself — not a fire-door closer.",
    warn: "A nightlatch on a garden gate is a waste of a cylinder.",
  },
  "chain-light": {
    id: "chain-light",
    label: "Hanging a sign or a light",
    familyId: "ch-jack",
    said: "Jack chain, brass, sold by the metre, cut here. For a lamp or a sign. If it is a dog or a swing or anyone standing under a load, we stop.",
    warn: "Welded zinc chain is not rated for lifting. I will not cut you a sling.",
  },
  "chain-barrier": {
    id: "chain-barrier",
    label: "A barrier or a stay",
    familyId: "ch-welded-gv-6",
    said: "Galvanised welded, 6 mm, by the metre. A warning, not a restraint. Say if it has to hold a person or a vehicle — that is a different shop.",
    warn: "Not for lifting. Not for a child's swing.",
  },
  "hit-nail": {
    id: "hit-nail",
    label: "Driving and pulling nails",
    familyId: "hm-claw-steel",
    said: "Claw hammer, 16 oz, steel shaft if it lives in a van, hickory if you like the feel and you will not leave it in the wet. That is the whole of that argument.",
    warn: "Not for a cold chisel. The face will chip. That is the ball pein or the club.",
  },
  "hit-pin": {
    id: "hit-pin",
    label: "Panel pins and fine nails",
    familyId: "hm-warrington",
    said: "Warrington, 10 oz, cross pein. The pein starts the pin while your fingers are still on it. That is why a joiner owns one. A 4 oz pin hammer if you only ever hang beads.",
    warn: "A 16 oz claw on a panel pin bends the pin and dents the bead.",
  },
  "hit-chisel": {
    id: "hit-chisel",
    label: "A wood chisel",
    familyId: "hm-mallet",
    said: "A beech mallet. End grain on the handle. A steel hammer on a chisel handle is how handles split.",
    warn: "If it is a cold chisel or a bolster, that is a club hammer — different tool, different job.",
  },
  "hit-bolster": {
    id: "hit-bolster",
    label: "A bolster or a cold chisel",
    familyId: "hm-club",
    said: "Club hammer, 2.5 lb. Short, two faces. For masonry tools. A claw hammer used as a club is how people arrive with a chip in their eye.",
    warn: "Goggles. Hardened masonry nails snap and fly; so do cheap chisels.",
  },
  "hit-metal": {
    id: "hit-metal",
    label: "Metal, rivets, punches",
    familyId: "hm-ball",
    said: "Ball pein, 16 oz. Harder face, ball for rivets. An engineer's hammer. The claw is the wrong shop-drawer.",
    warn: "If you must not spark or bruise the work, copper-faced. We have that.",
  },
};

export const FOLLOW: Record<JobId, { id: string; label: string }[]> = {
  timber: [
    { id: "oak-out-coast", label: "Oak, outside, near the sea or salted roads" },
    { id: "oak-out-inland", label: "Oak, outside, inland" },
    { id: "oak-in", label: "Oak, indoors" },
    { id: "pine-out-coast", label: "Pine or treated softwood, coastal" },
    { id: "pine-out", label: "Pine or treated softwood, outdoors inland" },
    { id: "pine-in", label: "Pine, spruce, indoors, dry" },
    { id: "wet-room", label: "Timber in a bathroom or wet kitchen" },
    { id: "chipboard", label: "Chipboard, MDF, kitchen carcass" },
    { id: "decking", label: "Decking boards" },
    { id: "old-work", label: "Old joinery — I want to match what is there" },
    { id: "sheet", label: "Sheet metal or flashing, not timber" },
  ],
  pulled: [
    { id: "brick-screw", label: "Solid brick or block" },
    { id: "board-screw", label: "Plasterboard — no stud that I can find" },
    { id: "concrete", label: "Concrete" },
    { id: "hinge-out", label: "It was a hinge, and the timber crumbled" },
  ],
  door: [
    { id: "hinge-out", label: "The hinge screws pulled out" },
    { id: "door-sag", label: "A room door has dropped or binds" },
    { id: "gate-sag", label: "A garden or field gate has dropped" },
    { id: "shed-door", label: "A shed or boarded door" },
    { id: "gate-latch", label: "It will not stay shut" },
  ],
  lock: [
    { id: "front-lock", label: "Front or back door — it has to lock for insurance" },
    { id: "yale", label: "The rim lock people call a Yale" },
    { id: "room-lock", label: "An internal door that latches and locks" },
    { id: "padlock", label: "A padlock for a hasp or a shed" },
    { id: "gate-latch", label: "A garden gate latch" },
  ],
  hang: [
    { id: "chain-light", label: "A sign, a lamp, something light" },
    { id: "chain-barrier", label: "A barrier or a stay across a gap" },
  ],
  hit: [
    { id: "hit-nail", label: "Nails — driving and pulling" },
    { id: "hit-pin", label: "Panel pins, beads, fine work" },
    { id: "hit-chisel", label: "A wood chisel" },
    { id: "hit-bolster", label: "A bolster or cold chisel" },
    { id: "hit-metal", label: "Metal, rivets, a punch" },
  ],
  "in-hand": [
    { id: "pine-in", label: "A zinc wood screw, cross head — I want more of them" },
    { id: "oak-out-inland", label: "A dull silver screw that lived outside in oak" },
    { id: "old-work", label: "A slotted steel screw from old joinery" },
    { id: "yale", label: "A rim lock / nightlatch" },
    { id: "hit-nail", label: "A claw hammer, I want the same again" },
  ],
};

export function pickLine(answer: Answer): Product | undefined {
  const family = PRODUCTS.filter((p) => p.familyId === answer.familyId);
  if (family.length === 0) return undefined;
  const prefer = answer.prefer;
  const scored = family.map((p) => {
    let score = 0;
    const spec = (label: string) => p.specs.find((s) => s.label === label)?.value ?? "";
    if (prefer?.gauge && spec("Gauge").startsWith(prefer.gauge)) score += 4;
    if (prefer?.length && spec("Length").includes(prefer.length)) score += 4;
    if (prefer?.diameter && (spec("Thread").startsWith(prefer.diameter) || p.name.includes(prefer.diameter)))
      score += 4;
    if (p.unit === "each" || p.unit === "metre") score += 2;
    if (p.packQty === 10 || p.packQty === 4) score += 1;
    if (p.packQty >= 200) score -= 1;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.p;
}

export function jobFromQuery(q: string): Answer | undefined {
  const s = q.toLowerCase();
  if (/oak/.test(s) && /(sea|coast|salt|marine)/.test(s)) return ANSWERS["oak-out-coast"];
  if (/oak/.test(s) && /(out|fence|gate|garden)/.test(s)) return ANSWERS["oak-out-inland"];
  if (/oak/.test(s)) return ANSWERS["oak-in"];
  if (/deck/.test(s)) return ANSWERS["decking"];
  if (/(chipboard|mdf|carcass|kitchen unit)/.test(s)) return ANSWERS["chipboard"];
  if (/(bath|wet room|shower)/.test(s)) return ANSWERS["wet-room"];
  if (/(coast|marine|salt)/.test(s)) return ANSWERS["pine-out-coast"];
  if (/(fence|outdoor|garden|treated)/.test(s)) return ANSWERS["pine-out"];
  if (/(plasterboard|drywall)/.test(s)) return ANSWERS["board-screw"];
  if (/(brick|plug|rawl)/.test(s)) return ANSWERS["brick-screw"];
  if (/concrete/.test(s)) return ANSWERS["concrete"];
  if (/(gate.*sag|sag.*gate|dropped gate)/.test(s)) return ANSWERS["gate-sag"];
  if (/(hinge|door.*drop|dropped door)/.test(s)) return ANSWERS["door-sag"];
  if (/(yale|nightlatch|rim lock)/.test(s)) return ANSWERS["yale"];
  if (/(bs\s*3621|deadlock|insurance|front door)/.test(s)) return ANSWERS["front-lock"];
  if (/(warrington|pin hammer|panel pin)/.test(s)) return ANSWERS["hit-pin"];
  if (/(ball pein|ball peen|rivet)/.test(s)) return ANSWERS["hit-metal"];
  if (/(mallet|wood chisel)/.test(s)) return ANSWERS["hit-chisel"];
  if (/(club|bolster|lump)/.test(s)) return ANSWERS["hit-bolster"];
  if (/sledge/.test(s)) return ANSWERS["hit-nail"];
  return undefined;
}
