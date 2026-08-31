/**
 * Reads a pressure curve and says something true about the shot it would make.
 *
 * The numbers quoted back are measured off the visitor's own curve. The taste
 * language is the accepted account of what those pressures do in a basket —
 * under-pressure extraction favouring acids, channelling passing the bed without
 * wetting it, a declining profile taking sugars before the drying compounds come
 * out last. It is stated as a prediction from a model, which is what it is, and
 * the interface says so next to it. Nothing here is a measurement, and no figure
 * is quoted more precisely than the model can support: bar to one decimal,
 * seconds and millilitres whole.
 */
import type { Shot } from "./physics";

/** Dose in the basket, grams. Fixed for the demonstration. */
export const DOSE_G = 16;

export interface Features {
  peak: number;
  tPeak: number;
  duration: number;
  yield: number;
  integrity: number;
  /** Seconds at the start below 3.5 bar before the load came on. */
  preinfusion: number;
  /** Mean pressure and length of the longest steady stretch above 5.5 bar. */
  plateauLevel: number;
  plateauSeconds: number;
  /** Pressure at the end of the pull. */
  endPressure: number;
  peakFlow: number;
  /** Brew ratio denominator: 1 : ratio. */
  ratio: number;
}

export interface Reading {
  title: string;
  lines: string[];
  readings: { label: string; value: string }[];
}

const bar = (v: number) => `${v.toFixed(1)} bar`;
const sec = (v: number) => `${Math.round(v)} s`;
const ml = (v: number) => `${Math.round(v)} ml`;

export function features(shot: Shot): Features {
  const s = shot.samples;
  if (!s.length) {
    return {
      peak: 0,
      tPeak: 0,
      duration: 0,
      yield: 0,
      integrity: 1,
      preinfusion: 0,
      plateauLevel: 0,
      plateauSeconds: 0,
      endPressure: 0,
      peakFlow: 0,
      ratio: 0,
    };
  }

  let peak = 0;
  let tPeak = 0;
  let peakFlow = 0;
  for (const p of s) {
    if (p.p > peak) {
      peak = p.p;
      tPeak = p.t;
    }
    if (p.q > peakFlow) peakFlow = p.q;
  }

  // Pre-infusion: how long the bed was left to wet below 3.5 bar before the load
  // came on. Only counts if the load did eventually come on.
  let preinfusion = 0;
  for (const p of s) {
    if (p.p >= 3.5) break;
    preinfusion = p.t;
  }
  if (peak < 5) preinfusion = 0;

  // Longest stretch that holds steady above 5.5 bar. A plateau is a decision, so
  // it is worth naming when the visitor made one.
  let plateauLevel = 0;
  let plateauSeconds = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i].p < 5.5) continue;
    let sum = 0;
    let n = 0;
    let j = i;
    for (; j < s.length; j++) {
      const next = (sum + s[j].p) / (n + 1);
      if (s[j].p < 5.5) break;
      if (n > 0 && Math.abs(s[j].p - next) > 1.1) break;
      sum += s[j].p;
      n++;
    }
    const span = n > 1 ? s[i + n - 1].t - s[i].t : 0;
    if (span > plateauSeconds) {
      plateauSeconds = span;
      plateauLevel = sum / n;
    }
    i = i + Math.max(0, n - 1);
  }

  return {
    peak,
    tPeak,
    duration: s[s.length - 1].t,
    yield: shot.yield,
    integrity: shot.integrity,
    preinfusion,
    plateauLevel,
    plateauSeconds,
    endPressure: s[s.length - 1].p,
    peakFlow,
    ratio: shot.yield / DOSE_G,
  };
}

function readingsRow(f: Features): { label: string; value: string }[] {
  return [
    { label: "Peak", value: bar(f.peak) },
    { label: "Time", value: sec(f.duration) },
    { label: "In the cup", value: ml(f.yield) },
    { label: "Ratio", value: `1 : ${f.ratio.toFixed(1)}` },
  ];
}

export function read(shot: Shot): Reading {
  const f = features(shot);
  const rows = readingsRow(f);

  if (f.yield < 6 || f.duration < 3.5) {
    return {
      title: "Not a shot yet",
      lines: [
        `${ml(f.yield)} in ${sec(f.duration)}. There is not enough here to judge — the bed has barely been wetted.`,
        "Take the handle further down and keep the load on it. The first thing you will notice is how much of your weight nine bar actually takes.",
      ],
      readings: rows,
    };
  }

  if (f.integrity < 0.45) {
    return {
      title: "The bed fractured",
      lines: [
        `You reached ${bar(f.peak)} at ${sec(f.tPeak)}, on grounds that had had almost nothing through them yet. Dry coffee does not hold that pressure: the water opened a channel and the bed's resistance fell away with it.`,
        `That is why the lever ran away from your hand and the pressure died even though you were still pushing — ${ml(f.yield)} out in ${sec(f.duration)}, at up to ${f.peakFlow.toFixed(1)} ml/s. Espresso should not pour that fast.`,
        "Water that leaves through a crack has passed most of the coffee without touching it. Thin body, sharp front-of-mouth sourness, and a pale crema that will be gone before you sit down.",
        "Let it wet for three or four seconds at two or three bar before you put any weight on it.",
      ],
      readings: rows,
    };
  }

  if (f.peak < 4.5) {
    return {
      title: "It never came up",
      lines: [
        `Your highest reading was ${bar(f.peak)}, and ${ml(f.yield)} came through in ${sec(f.duration)}.`,
        "Under about four bar the water walks through the bed instead of being forced through it. It takes the acids, which dissolve first and easily, and leaves the sugars behind them — sour, weak, and strangely thin for something that took so long.",
        "This is the part nobody tells you: nine bar on a 40 mm piston is about twelve kilos at the handle, held steady. You have to mean it.",
      ],
      readings: rows,
    };
  }

  const plateauShare = f.duration > 0 ? f.plateauSeconds / f.duration : 0;
  const declined = f.peak > 0 ? 1 - f.endPressure / f.peak : 0;

  if (plateauShare > 0.55 && f.plateauLevel > 6.5 && declined < 0.45) {
    const held =
      plateauShare > 0.85
        ? `${bar(f.plateauLevel)} held for essentially the whole ${sec(f.duration)} pull`
        : `${bar(f.plateauLevel)} held for ${sec(f.plateauSeconds)} of a ${sec(f.duration)} pull`;
    return {
      title: "You held it flat",
      lines: [
        `${held}, ${ml(f.yield)} in the cup.`,
        "That is a good shot, and it is also precisely what a pump would have done for you. Nine bar, flat, until the volume is there.",
        "The reason to own this machine is the part you did not use. Once the bed has given up its sugars, holding nine bar over it starts pulling the bitter, drying end of the coffee through as well. Ease back to four or five bar across the last third and you stop before that.",
      ],
      readings: rows,
    };
  }

  const preinfused = f.preinfusion >= 1.8;
  const wellShaped =
    f.integrity > 0.55 &&
    f.peak >= 6.5 &&
    f.peak <= 11.5 &&
    declined > 0.5 &&
    f.duration >= 15 &&
    f.yield >= 16;

  if (wellShaped && preinfused) {
    return {
      title: "That is the shape",
      lines: [
        `${sec(f.preinfusion)} below 3.5 bar to wet the bed, up to ${bar(f.peak)} by ${sec(f.tPeak)}, then eased back to ${bar(f.endPressure)} by the end. ${ml(f.yield)} from ${DOSE_G} g in ${sec(f.duration)}.`,
        "The low start lets the puck saturate and settle evenly, so when the load comes on there is nowhere for water to short-circuit. The long decline keeps taking sugars while the bed is still giving them, and backs off before the woody, drying compounds that come out last.",
        "Thick, sweet, and long in the finish. No pump can make this curve, because no pump knows when this particular coffee has given you enough.",
      ],
      readings: rows,
    };
  }

  if (wellShaped) {
    return {
      title: "Good shape, hard start",
      lines: [
        `Straight to ${bar(f.peak)} by ${sec(f.tPeak)} with no wetting first, then a clean decline to ${bar(f.endPressure)}. ${ml(f.yield)} in ${sec(f.duration)}.`,
        `The decline is right and it will taste like it — sweet, with body. But you got away with the start: the bed took some damage on the way up and lost a little of its grip (${Math.round((1 - f.integrity) * 100)}% by the end), which shows up as a slightly hollow middle.`,
        "Two or three seconds at low pressure first and this becomes repeatable rather than lucky.",
      ],
      readings: rows,
    };
  }

  if (f.duration < 14 && f.yield > 20) {
    return {
      title: "Too fast",
      lines: [
        `${ml(f.yield)} in ${sec(f.duration)} at a peak of ${bar(f.peak)}. The bed held together, but you emptied the cylinder through it before it had time to give anything up.`,
        "Fast and pale: sour, watery in the body, and short. On the real machine the fix is a finer grind; from here, ease off and make the same volume take twice as long.",
      ],
      readings: rows,
    };
  }

  if (f.duration > 34) {
    return {
      title: "Too long",
      lines: [
        `${sec(f.duration)} and ${ml(f.yield)}, peaking at ${bar(f.peak)}. Somewhere past thirty seconds the coffee has stopped giving you anything you want.`,
        "The late fractions are the drying, woody ones. It will taste heavy and slightly ashy, with a finish that hangs around too long.",
        "Same curve, less of the tail: come off it while the stream is still amber rather than pale.",
      ],
      readings: rows,
    };
  }

  return {
    title: "Somewhere in between",
    lines: [
      `Peak ${bar(f.peak)} at ${sec(f.tPeak)}, ending at ${bar(f.endPressure)}. ${ml(f.yield)} from ${DOSE_G} g in ${sec(f.duration)} — a ratio of 1 : ${f.ratio.toFixed(1)}.`,
      f.preinfusion >= 1.8
        ? "The start is right. What is missing is a decision in the middle: pick a pressure, hold it while the stream runs amber, then come off it steadily."
        : declined > 0.5
          ? "The release at the end is right; the start is not. Going straight to full pressure on dry grounds costs you evenness, and you can hear it in how quickly the stream thins."
          : "No wetting phase and no clear shape after it. Try it as three deliberate movements — a few seconds low, a build to eight or nine, then a long release.",
      "Drinkable, probably unremarkable. The interesting thing about a lever is that the same coffee will do something different next time you pull it.",
    ],
    readings: rows,
  };
}
