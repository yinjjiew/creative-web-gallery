/**
 * All the words on the page, kept in one place so the tone can be read as a
 * whole. Leva is a fictional product; the page says so in its footer. Every
 * figure quoted is either derived from the simulation's own constants (lever
 * ratio, piston diameter, stroke, the force nine bar costs) or is in the range
 * that real spring-lever machines and their spare parts actually occupy.
 */

export const PRICE = "€1,180";
export const DEPOSIT = "€100";

export const HERO = {
  eyebrow: "Leva 001 — Brescia",
  headline: "Nine bar is a decision, not a setting.",
  lede: "A pump holds nine bars because it cannot do anything else. On a direct lever there is nothing between your hand and the coffee but a spring and a piston, and the shape of the pressure across twenty-five seconds is yours to make.",
  instruction: "Take the walnut handle and pull it down.",
};

export const ARGUMENT: { heading: string; body: string }[] = [
  {
    heading: "Pressure is a curve, not a number",
    body: "Water in a bed of ground coffee takes things out of it in an order. Acids dissolve first and easily. Sugars follow. Last out are the drying, woody compounds nobody wants. How hard you push, and when you stop pushing, decides where in that order the shot ends.",
  },
  {
    heading: "Why you would want to do it yourself",
    body: "A pump machine makes the same shot from every coffee, which is a real virtue in a bar doing four hundred covers a day. At home, with one bag of one lot that changes as it ages, it is the wrong instrument: the thing you most want to vary is the one thing it holds constant.",
  },
  {
    heading: "Three movements",
    body: "Wet the bed at two or three bar. Build to eight or nine while the stream runs dark. Come off it steadily as the colour lightens. That is the entire technique, and it takes about a week to stop being difficult.",
  },
];

export interface ViewPreset {
  id: string;
  label: string;
  note: string;
  /** Camera azimuth, elevation, distance and target height. */
  theta: number;
  phi: number;
  radius: number;
  targetY: number;
}

export const VIEWS: ViewPreset[] = [
  {
    id: "whole",
    label: "The whole thing",
    note: "165 mm wide, 470 mm to the top of the raised lever, 7.2 kg. No part of it is hidden behind a moulding — chromed brass on a machined stainless base.",
    theta: 0.62,
    phi: 1.16,
    radius: 1.0,
    targetY: 0.225,
  },
  {
    id: "group",
    label: "Group and linkage",
    note: "Three hundred millimetres of lever onto a 27.5 mm crank, and one pin between them. That ratio of about 11 to 1 is why nine bar on a 40 mm piston costs roughly twelve kilos of your arm, held steady for twenty-five seconds.",
    theta: 0.95,
    phi: 1.32,
    radius: 0.46,
    targetY: 0.24,
  },
  {
    id: "boiler",
    label: "Boiler",
    note: "1.8 litres of brass and a 1000 W element, governed by a pressurestat and a thermal fuse. No board, no firmware, no display. A sight glass tells you where the water is.",
    theta: -0.55,
    phi: 1.1,
    radius: 0.52,
    targetY: 0.16,
  },
  {
    id: "portafilter",
    label: "Portafilter",
    note: "58 mm, 16 g basket, walnut handle turned from the same board as the lever. It weighs 640 g, which you notice for a fortnight and then never again.",
    theta: 0.5,
    phi: 1.42,
    radius: 0.4,
    targetY: 0.1,
  },
];

export const SPECS: [string, string][] = [
  ["Group", "Direct lever, 58 mm, Ø40 mm brass piston"],
  ["Lever ratio", "About 11 : 1 — 300 mm lever, 27.5 mm crank"],
  ["Stroke", "25 mm, 31 ml at the piston"],
  ["Working pressure", "0–15 bar, set entirely by hand"],
  ["Boiler", "1.8 L chromed brass, 1000 W element"],
  ["Temperature control", "Pressurestat, 0.8–1.1 bar steam"],
  ["Steam", "Single wand, same boiler"],
  ["Body", "Chromed brass, machined stainless base"],
  ["Handles", "Oiled American walnut"],
  ["Dimensions", "165 × 205 mm on the bench, 250 mm high. 470 mm with the lever up, and it wants 350 mm clear in front of it."],
  ["Weight", "7.2 kg"],
  ["Power", "220–240 V, 1000 W. A 110 V build is available."],
  ["Warranty", "Five years. Parts stocked for twenty."],
];

export const BOX: string[] = [
  "Leva 001",
  "58 mm portafilter, walnut handle",
  "16 g and 14 g baskets",
  "Blind basket",
  "58 mm tamper, walnut",
  "Spare piston seals, one pair",
  "Group service tool and hex keys",
  "Manual, with the exploded drawing and the full parts list",
];

export const PARTS: [string, string][] = [
  ["Piston seals, pair", "€9"],
  ["Group gasket", "€4"],
  ["Pressurestat", "€38"],
  ["Heating element", "€62"],
];

export const REPAIR = {
  heading: "Repair",
  body: "Chromed brass, stainless steel, silicone, walnut, and one pressurestat. There is no circuit board and no firmware, so there is nothing in it that can stop being supported. Every part carries a number and a price, printed in the manual and stocked for twenty years. These are the four you are likely to need, and the tool for all four is in the box.",
};

export const PURCHASE = {
  heading: "Reserve one",
  price: PRICE,
  priceNote: "including VAT, delivered in the EU",
  body: "Made in Brescia, in batches of forty. The current batch ships in March. Reserve with a deposit of €100 and pay the balance when yours is boxed; cancel at any point before it ships.",
  cta: `Reserve — ${DEPOSIT}`,
  aside: "Or come and pull one. The workshop is open on Thursdays.",
};

export const DISCLOSURE =
  "Leva is a fictional product, built as a reference implementation for a gallery of creative web work. The machine, the physics of the group and the prices of the spare parts are modelled on real direct-lever machines; nothing here is for sale.";

export const SIM_NOTE =
  "The trace is produced by a physical model of this group — hand force sets the pressure, the coffee bed sets the flow — not by a recording. What the shape does to the taste is the accepted account of it in a real basket.";
