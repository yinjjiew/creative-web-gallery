import { tAtYears } from "./time";

export type Kind = "observed" | "modelled" | "conventional";

export type Horizon = {
  id: string;
  years: number;
  t: number;
  kicker: string;
  title: string;
  body: string;
  kind: Kind;
  /** Short label for the contents list. */
  thumb: string;
};

function H(
  id: string,
  years: number,
  kicker: string,
  title: string,
  body: string,
  kind: Kind,
  thumb: string
): Horizon {
  return { id, years, t: tAtYears(years), kicker, title, body, kind, thumb };
}

/**
 * Notes sit at their log-depth. Ages in Ma follow the ICS Chronostratigraphic
 * Chart (2024) unless marked otherwise. Event ages (bomb spike, LGM, GOE,
 * Jack Hills) are not ICS boundaries.
 */
export const HORIZONS: Horizon[] = [
  H(
    "bomb",
    72,
    "1954 · not an ICS boundary",
    "A worldwide skin",
    "Plutonium and radiocarbon from the first thermonuclear tests settle into soil everywhere at once. It is the first horizon that is ours alone. On a linear core through the Earth this is 3.8 micrometres from the surface — a grease fingerprint. The brass bead on the steel rod has not moved.",
    "observed",
    "1954"
  ),
  H(
    "century",
    1000,
    "1,000 years · conventional soil",
    "The rock has not noticed",
    "A millennium of plough, plague, and brick. The bed is still soil. You have already scrolled farther than the thickness of anyone’s memory, and the bead is still the polish on the top of the rod.",
    "conventional",
    "1 ka"
  ),
  H(
    "holocene",
    11_700,
    "11,700 years · Holocene GSSP",
    "The ice leaves",
    "North Greenland, an official boundary: the Holocene begins. People begin to stay. Agriculture follows within a few thousand years and is the first persistent change to how sediment reaches the sea. On the log core this is already a descent. On the steel rod it is still varnish. The last glacial maximum, 21,000 years, is the pale till just above.",
    "observed",
    "11.7 ka"
  ),
  H(
    "ice",
    800_000,
    "800,000 years · EPICA Dome C",
    "The oldest ice we have",
    "Below this, ice does not remember. Rock has to. Eight hundred millennia is 42 millimetres of the linear rod — the first distance you could measure with a ruler. The bead has twitched.",
    "observed",
    "800 ka"
  ),
  H(
    "pleistocene",
    2.58e6,
    "2.58 million years · ICS",
    "Ice becomes a habit",
    "Base of the Pleistocene. The glacial cycles begin in earnest; stone tools are already old. The log core has spent more than half its length getting here. The linear rod has spent a centimetre.",
    "observed",
    "2.58 Ma"
  ),
  H(
    "kpg",
    66.0e6,
    "66.0 million years · K–Pg, ICS",
    "The thin dark line",
    "A few centimetres of clay in the real rock. Iridium. Here the joint is drawn thicker than it was, or you would miss it. Everything above this line is the world in our outline. Everything below it is not. The bead has travelled one and a half percent of the rod.",
    "observed",
    "66 Ma"
  ),
  H(
    "permian",
    251.9e6,
    "251.9 million years · end-Permian, ICS",
    "The Great Dying",
    "The worst night in the archive. Coal seams stop. The beds redden. Most of what had a shell does not come through. The Carboniferous forests that are now coal — a few million years of trees, three hundred years of burning — lie just above.",
    "observed",
    "252 Ma"
  ),
  H(
    "cambrian",
    538.8e6,
    "538.8 million years · ICS",
    "Animals become archivable",
    "Base of the Cambrian. Shells, carapaces, the first bodies a core can hold without an argument. Everything below this line is life without a skeleton we can easily pick up. The Precambrian is nine percent of this shaft and 88 percent of Earth history. The bead is finally falling.",
    "observed",
    "539 Ma"
  ),
  H(
    "goe",
    2.45e9,
    "2.45 billion years · Great Oxidation",
    "The world rusts",
    "Banded iron — the red and grey stripes — is the rust of an ocean learning to breathe. This is observed rock, not a colour convention. The bead is beside you for the first time since you left the surface.",
    "observed",
    "2.45 Ga"
  ),
  H(
    "hadean",
    4.54e9,
    "4.54 billion years · conventional Earth age",
    "No rock left",
    "The Hadean interval is modelled. The oldest crystals (Jack Hills, 4.40 Ga) are older than any surviving crust (Acasta, 4.03 Ga). The floor of the shaft is not a formation. It is the end of the archive.",
    "modelled",
    "4.54 Ga"
  ),
];

export const INTRO = {
  kicker: "Composite borehole · not a hole in the ground",
  title: "Down is time",
  body: [
    "The startling fact of a core is not that the Earth is old. It is that everything you can remember — and everything anyone you have heard of can remember — sits in a film at the top that would be thinner than varnish if this shaft were honest.",
    "It is not honest. The 240 metres below you are logarithmic: each equal scroll covers ten times as much time as the last. The steel rod beside the core is linear. One millimetre of it is 18,900 years. Watch the brass bead. It will refuse to move.",
  ],
};

export const CODA = {
  kicker: "The cheat, declared",
  title: "You have arrived at the floor",
  body: "You have scrolled through 240 metres of log-time and 4.54 billion years. The first half of the shaft was the last million years. That distortion is the argument: without it there would be nothing to read. With the steel rod beside you, it is not a lie.",
};

export const PROVENANCE =
  "Boundary ages follow the ICS Chronostratigraphic Chart (2024). Earth age is the conventional 4.54 Ga. The bomb spike, last glacial maximum, EPICA ice, and Great Oxidation are events, not ICS stages. Lithologies are conventional colours for a composite section — this is not a real borehole. The Hadean interval is modelled; no intact rock of that age is known.";

export const KIND_LABEL: Record<Kind, string> = {
  observed: "Observed interval",
  modelled: "Modelled interval",
  conventional: "Conventional lithology",
};
