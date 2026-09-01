/**
 * Kestrel One — invented for a brief, internally consistent.
 *
 * Prices, dimensions, the study figure and the studio addresses are written
 * rather than measured. They are labelled as such in the interface. The
 * orders of magnitude follow real RIC hearing aids and real private-clinic
 * pricing in Britain in the mid-2020s, so that the page can be honest about
 * cost and modest about performance without inventing a fantasy device.
 */

export type FinishId =
  | "ti-brushed"
  | "ti-polished"
  | "brass"
  | "dlc"
  | "two-tone";

export type Metal = {
  a: string;
  b: string;
  c: string;
};

export type Finish = {
  id: FinishId;
  name: string;
  metal: string;
  sentence: string;
  body: Metal;
  wire: Metal;
  hardware: Metal;
  hatch: boolean;
};

export const PAIR_PRICE = 6400;
export const SINGLE_PRICE = 3450;
export const FINANCE_12 = 533;
export const FINANCE_24 = 286;
export const FINANCE_24_TOTAL = 6864;
export const FINANCE_APR = "6.9%";

export const FINISHES: Finish[] = [
  {
    id: "ti-brushed",
    name: "Brushed titanium",
    metal: "Grade 5 titanium",
    sentence:
      "Cool, matte, the everyday metal. Bead-blasted and then drawn so it holds a grain rather than a mirror.",
    body: { a: "#9aa0a4", b: "#5f6468", c: "#c8ccd0" },
    wire: { a: "#8b9094", b: "#4e5357", c: "#b4b8bc" },
    hardware: { a: "#9aa0a4", b: "#5f6468", c: "#c8ccd0" },
    hatch: true,
  },
  {
    id: "ti-polished",
    name: "Polished titanium",
    metal: "Grade 5 titanium",
    sentence:
      "The same alloy, brought to a bright face. It catches light the way a watch case does, and shows a fingerprint if you let it.",
    body: { a: "#d5d8db", b: "#6a7076", c: "#f4f5f6" },
    wire: { a: "#c5c8cc", b: "#5a6066", c: "#eceeef" },
    hardware: { a: "#d5d8db", b: "#6a7076", c: "#f4f5f6" },
    hatch: false,
  },
  {
    id: "brass",
    name: "Brushed brass",
    metal: "Naval brass",
    sentence:
      "Warm, and it will darken at the edges from the skin. That is intended. A cloth and a little metal polish bring it back.",
    body: { a: "#d2a44a", b: "#7a5414", c: "#f0d27a" },
    wire: { a: "#c4963c", b: "#6a480e", c: "#e8c66a" },
    hardware: { a: "#d2a44a", b: "#7a5414", c: "#f0d27a" },
    hatch: true,
  },
  {
    id: "dlc",
    name: "Black DLC",
    metal: "Diamond-like carbon on titanium",
    sentence:
      "A hard carbon coating over the titanium body. The darkest finish we make. Still a metal. Still not beige.",
    body: { a: "#3c3f3e", b: "#121413", c: "#6e7270" },
    wire: { a: "#343736", b: "#0e100f", c: "#5a5e5c" },
    hardware: { a: "#3c3f3e", b: "#121413", c: "#6e7270" },
    hatch: false,
  },
  {
    id: "two-tone",
    name: "Titanium and brass",
    metal: "Grade 5 titanium, naval brass",
    sentence:
      "Titanium body, brass tube and screw. The one that looks most like a watch, because that is how watches have always been made.",
    body: { a: "#9aa0a4", b: "#5f6468", c: "#c8ccd0" },
    wire: { a: "#c4963c", b: "#6a480e", c: "#e8c66a" },
    hardware: { a: "#d2a44a", b: "#7a5414", c: "#f0d27a" },
    hatch: true,
  },
];

export const DEFAULT_FINISH = FINISHES[0];

export type WireLength = {
  id: "1" | "2" | "3";
  name: string;
  mm: string;
  who: string;
};

export const WIRES: WireLength[] = [
  {
    id: "1",
    name: "Length 1",
    mm: "25 mm",
    who: "A smaller ear, or a high canal. Common on the left and right of the same person, independently.",
  },
  {
    id: "2",
    name: "Length 2",
    mm: "32 mm",
    who: "The length most people are fitted with. From the top of the ear to the canal entrance, following the skin.",
  },
  {
    id: "3",
    name: "Length 3",
    mm: "40 mm",
    who: "A longer ear or a lower canal. We would rather the tube sit quietly than pull.",
  },
];

export type Tip = {
  id: "open" | "tulip" | "mould";
  name: string;
  for: string;
  note: string;
};

export const TIPS: Tip[] = [
  {
    id: "open",
    name: "Open dome",
    for: "Mild loss, still some low-frequency hearing.",
    note: "Lets your own voice through. The most comfortable, and the one that occludes least. Not enough of a seal if the loss is deeper.",
  },
  {
    id: "tulip",
    name: "Tulip dome",
    for: "Mild to moderate loss.",
    note: "A partial seal. The usual fitting. It will sound a little more closed than the open dome; that is the trade for more help.",
  },
  {
    id: "mould",
    name: "Custom mould",
    for: "When the canal needs a seal, or a dome will not stay.",
    note: "Taken from an impression at the fitting. Acrylic, made for that ear. Kept when the body is eventually replaced.",
  },
];

export type Studio = {
  id: string;
  city: string;
  street: string;
  hours: string;
};

export const STUDIOS: Studio[] = [
  {
    id: "marylebone",
    city: "London",
    street: "17 Paddington Street, Marylebone",
    hours: "Tue–Sat, 10–18",
  },
  {
    id: "manchester",
    city: "Manchester",
    street: "4 St John Street, Castlefield",
    hours: "Wed–Sat, 10–17",
  },
  {
    id: "edinburgh",
    city: "Edinburgh",
    street: "11 St Stephen Street, Stockbridge",
    hours: "Thu–Sat, 10–17",
  },
  {
    id: "bristol",
    city: "Bristol",
    street: "22 The Mall, Clifton",
    hours: "Wed–Sat, 10–17",
  },
];

export type Seat = {
  id: string;
  label: string;
  line: string;
  x: number;
  y: number;
};

/** A dinner of six. The visitor sits at F. Lines are the sort of thing that disappears in a room. */
export const SEATS: Seat[] = [
  { id: "a", label: "A", line: "the 14.15 was cancelled again", x: 28, y: 18 },
  { id: "b", label: "B", line: "she said she would ring on Tuesday", x: 72, y: 18 },
  { id: "c", label: "C", line: "no — the other side, by the kitchen", x: 84, y: 52 },
  { id: "d", label: "D", line: "I still think we should have walked", x: 72, y: 84 },
  { id: "e", label: "E", line: "two bottles, and then the bill", x: 28, y: 84 },
  { id: "f", label: "You", line: "I missed that — say it once more", x: 16, y: 52 },
];

export type RoomMode = "face" | "table" | "quiet";

export const MODES: { id: RoomMode; name: string; blurb: string }[] = [
  {
    id: "face",
    name: "The person in front",
    blurb:
      "The two microphones form a cardioid toward the face you are looking at. That is the default, and the one most people leave it on.",
  },
  {
    id: "table",
    name: "The table",
    blurb:
      "The pattern widens to about 120°. The people beside you stay with you. The room behind you does not.",
  },
  {
    id: "quiet",
    name: "A quiet room",
    blurb:
      "Almost omnidirectional. For a living room, a car, a walk. There is nothing to suppress, and the device does not pretend there is.",
  },
];

export const SPEC: [string, string][] = [
  ["Body", "22.0 × 11.4 × 7.2 mm"],
  ["Mass", "2.4 grams"],
  ["Shell", "CNC-machined, Birmingham"],
  ["Receiver", "In the canal, interchangeable"],
  ["Microphones", "Two, 8 mm apart, facing forward"],
  ["Battery, mixed use", "About 17 hours"],
  ["Battery, aid only", "About 22 hours"],
  ["Charge", "3 hours in the case, overnight"],
  ["Case reserve", "Three full charges"],
  ["Battery life", "About four years, then the body is replaced"],
  ["Ingress", "IP68. Sweat, rain, a shower. Not a swim."],
  ["The pair", `£${PAIR_PRICE.toLocaleString("en-GB")}`],
];
