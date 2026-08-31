/**
 * A lumped model of a direct-lever espresso group.
 *
 * The whole page rests on this, so it is worth stating what it does and does not
 * claim. It is a simulation, not a measurement, and it is labelled as such in the
 * interface. But the constants are not invented to make a pretty graph — each one
 * is a published or easily-derived figure for a machine of this kind, and the
 * behaviour the visitor feels falls out of them rather than being scripted.
 *
 * The chain of reasoning:
 *
 *  - The hand acts through a 300 mm lever on a 27.5 mm crank — a ratio of about
 *    10.9 : 1 — onto a piston of Ø40 mm (12.57 cm²). One bar over that area is
 *    12.57 kgf at the piston and so 1.15 kgf at the handle; nine bar costs about
 *    ten kilos of hand force plus the two the return spring is taking. That is
 *    the real reason a lever machine is a physical skill, and it is why hand
 *    force can be treated as the input and pressure as its consequence:
 *    p = (F_hand − F_spring) · ratio / A.
 *
 *  - The coffee bed obeys Darcy's law closely enough at these pressures: flow is
 *    proportional to pressure. A normal 16 g double gives roughly 1.3 ml/s at nine
 *    bar, which fixes the bed resistance at ~7 bar·s/ml. So the hand sets the
 *    pressure and the bed sets the speed — the piston can only descend as fast as
 *    the puck will drain. A 31 ml stroke held at nine bar therefore takes about
 *    24 s, and a profile that wets first and declines at the end lands nearer 30.
 *    That agreement with real shot times is a check on the constants, not a
 *    target they were fitted to.
 *
 *  - Water, the puck and the headspace are slightly compressible, ~0.2 ml/bar.
 *    With the bed resistance that gives a pressure time-constant near 0.1 s: fast
 *    enough to feel immediate, slow enough that a stab at the lever reads as a
 *    spike rather than a step.
 *
 *  - A dry bed fractures. Above roughly 6–7 bar, before the grounds have been
 *    wetted and consolidated, water opens a channel and the bed's resistance
 *    drops for good. This is modelled with a single integrity term. It is the one
 *    piece of coffee physics that is genuinely qualitative rather than
 *    quantitative, and it is where a real barista's judgement lives, so it earns
 *    its place: it is what makes a violent pull fail.
 *
 * Not modelled: temperature, dose and grind as separate variables, pre-wetting
 * dynamics, the difference between the sound of a good shot and a bad one.
 */

/**
 * Water displaced by one full piston stroke, in ml. Ø40 mm piston over the 25 mm
 * of travel that the linkage in machine.ts actually produces.
 */
export const STROKE_ML = 31;
/**
 * Bed resistance of an intact 16 g puck, in bar·s/ml. Calibrated backwards from
 * the shot it should produce: about 1.3 ml/s at nine bar, so a full 31 ml stroke
 * held near nine takes the twenty-five seconds the whole page is about.
 */
const BED_RESISTANCE = 7;
/** Piston area, in cm². Ø40 mm. */
const PISTON_AREA = 12.57;
/**
 * Lever ratio, handle to piston: 300 mm of lever against a 27.5 mm crank. This is
 * not a free parameter — it is the ratio the modelled linkage has, and it is what
 * makes nine bar cost about twelve kilos rather than the two it would if the
 * geometry were kinder.
 */
const LEVER_RATIO = 10.9;
/** kgf at the handle per bar at the puck. */
export const KGF_PER_BAR = PISTON_AREA / LEVER_RATIO;
/** Return spring, kgf measured at the handle: preload plus rate × travel. */
const SPRING_PRELOAD = 0.9;
const SPRING_RATE = 2.2;
/** Pressure rise time constant from hydraulic compliance, in seconds. */
const TAU_RISE = 0.1;
/** Pressure bleed-off time constant once the hand eases, in seconds. */
const TAU_BLEED = 0.3;
/** Above this, an unconsolidated bed starts to fracture. */
const CHANNEL_ONSET = 6.4;
/** Fracture rate, per bar of excess per second, on a completely dry bed. */
const CHANNEL_RATE = 0.11;
/** Even a settled bed gives way if hammered this hard. */
const CHANNEL_OVERPRESSURE = 12;
const OVERPRESSURE_RATE = 0.07;
/** Volume of water that consolidates the bed, in ml; wetting is exponential. */
const WETTING_ML = 2;
/** A fully channelled bed retains this fraction of its resistance. */
const CHANNEL_FLOOR = 0.5;
/** Below this much water left in the cylinder, the stroke is spent. */
const DRY_ML = 0.4;
/** Mechanical damping of the free lever, kgf per unit of travel per second. */
const LEVER_DAMPING = 3.6;
/** Effective lever mass in these units; sets the return's natural period. */
const LEVER_MASS = 0.034;
/**
 * How hard the hand can press, kgf. A 300 mm lever will take more than this from
 * a determined person, but at that point the machine is coming off the bench.
 * With this ratio it puts the ceiling near fifteen bar, which is about where a
 * real lever tops out before something gives.
 */
export const HAND_MAX = 18;
/** Handle stiffness: kgf per unit of travel that the hand leads the lever by. */
const HAND_STIFFNESS = 105;
/** Cylinder refill rate, ml/s. */
const REFILL_RATE = 45;

export type Phase = "charged" | "pulling" | "spent" | "refilling";

export interface Sample {
  /** Seconds since this pull began. */
  t: number;
  /** Pressure at the puck, bar. */
  p: number;
  /** Flow through the puck, ml/s. */
  q: number;
  /** Bed integrity at this instant, so the trace can mark where it gave way. */
  k: number;
}

export interface Shot {
  samples: Sample[];
  /** Total delivered, ml. */
  yield: number;
  /** Seconds from first pressure to last. */
  duration: number;
  /** Bed integrity at the end, 1 intact, 0 fully channelled. */
  integrity: number;
}

export interface LeverSim {
  /** Lever travel, 0 fully up and charged, 1 fully down and spent. */
  travel: number;
  /** Travel per second. */
  velocity: number;
  /** Where the hand is, in travel units. Leads the lever when pressing. */
  hand: number;
  /** True while a pointer or key is held. */
  gripped: boolean;
  pressure: number;
  /** Flow through the puck, ml/s. */
  flow: number;
  /** Load at the handle, kgf. */
  load: number;
  /** Water left in the cylinder, ml. */
  charge: number;
  yield: number;
  integrity: number;
  phase: Phase;
  /** Seconds since the current pull started delivering. */
  elapsed: number;
  samples: Sample[];
  /** Set for one frame when a pull finishes; the caller consumes it. */
  finished: Shot | null;
  /** Seconds at rest near the top, used to decide when to refill. */
  restingAtTop: number;
  /** Seconds the stream has been down to drips; how a barista knows to stop. */
  dribbling: number;
}

export function createSim(): LeverSim {
  return {
    travel: 0,
    velocity: 0,
    hand: 0,
    gripped: false,
    pressure: 0,
    flow: 0,
    load: SPRING_PRELOAD,
    charge: STROKE_ML,
    yield: 0,
    integrity: 1,
    phase: "charged",
    elapsed: 0,
    samples: [],
    finished: null,
    restingAtTop: 0,
    dribbling: 0,
  };
}

/** Spring force at the handle for a given travel, kgf. Always acts upward. */
export function springLoad(travel: number) {
  return SPRING_PRELOAD + SPRING_RATE * Math.max(0, travel);
}

/** Longest sensible extraction before we call it done, seconds. */
const MAX_PULL = 45;

const FIXED_STEP = 1 / 240;

/**
 * Advance the simulation. `dt` is wall-clock seconds; it is broken into fixed
 * substeps so that behaviour does not depend on frame rate.
 */
export function stepSim(s: LeverSim, dt: number) {
  s.finished = null;
  let remaining = Math.min(dt, 0.1);
  while (remaining > 0) {
    const h = Math.min(FIXED_STEP, remaining);
    remaining -= h;
    substep(s, h);
  }
}

function substep(s: LeverSim, h: number) {
  // The hand cannot lead the lever by an unbounded amount; that cap is what
  // makes a runaway lever outrun the hand and the pressure collapse with it.
  const lead = s.hand - s.travel;
  const handForce = Math.max(-HAND_MAX * 0.4, Math.min(HAND_MAX, lead * HAND_STIFFNESS));
  const spring = springLoad(s.travel);
  const net = handForce - spring;

  const wet = s.charge > DRY_ML;
  const resistance = BED_RESISTANCE * (CHANNEL_FLOOR + (1 - CHANNEL_FLOOR) * s.integrity);

  if (wet && net > 0 && s.travel < 1) {
    // Pressurised. Surplus hand force appears as pressure at the puck, lagged by
    // the compliance of the water and the bed.
    const target = (net * LEVER_RATIO) / PISTON_AREA;
    s.pressure += (target - s.pressure) * (1 - Math.exp(-h / TAU_RISE));
    s.flow = s.pressure / resistance;
    // Flow-limited descent: the piston goes exactly as fast as the puck drains.
    s.velocity = s.flow / STROKE_ML;
    s.travel = Math.min(1, s.travel + s.velocity * h);
    s.charge = Math.max(0, s.charge - s.flow * h);
    s.yield += s.flow * h;
    s.elapsed += h;
    if (s.phase === "charged" || s.phase === "refilling") s.phase = "pulling";

    // A bed that has not been wetted and settled fractures under pressure, and
    // any bed gives way if hit hard enough.
    const dryness = Math.exp(-s.yield / WETTING_ML);
    let damage = 0;
    if (s.pressure > CHANNEL_ONSET) {
      damage += CHANNEL_RATE * (s.pressure - CHANNEL_ONSET) * dryness;
    }
    if (s.pressure > CHANNEL_OVERPRESSURE) {
      damage += OVERPRESSURE_RATE * (s.pressure - CHANNEL_OVERPRESSURE);
    }
    if (damage > 0) s.integrity = Math.max(0, s.integrity - damage * h);

    recordSample(s);
  } else {
    // Free: the hand is easing off or lifting, or the cylinder is empty. Residual
    // pressure bleeds through the puck; the lever moves under spring and hand.
    const bleed = 1 - Math.exp(-h / TAU_BLEED);
    const before = s.pressure;
    s.pressure -= before * bleed;
    if (wet) {
      s.flow = ((before + s.pressure) / 2) / resistance;
      const delivered = Math.min(s.charge, s.flow * h);
      s.charge -= delivered;
      s.yield += delivered;
    } else {
      s.flow = 0;
    }
    if (s.phase === "pulling") s.elapsed += h;

    // Exponential integrator on velocity: stable at any step size.
    const decay = Math.exp((-LEVER_DAMPING / LEVER_MASS) * h);
    const terminal = net / LEVER_DAMPING;
    s.velocity = terminal + (s.velocity - terminal) * decay;
    s.travel = Math.max(0, Math.min(1, s.travel + s.velocity * h));
    if (s.travel <= 0 || s.travel >= 1) s.velocity = 0;

    if (s.phase === "pulling") recordSample(s);
  }

  if (s.pressure < 0.02) s.pressure = 0;
  s.load = Math.max(0, s.pressure * KGF_PER_BAR + spring);

  // End of a pull: the cylinder is empty, the lever is back up, the stream has
  // died to drips, or it has gone on far too long.
  if (s.phase === "pulling") {
    if (s.flow < 0.12 && s.yield > 3) s.dribbling += h;
    else s.dribbling = 0;
    const emptied = s.charge <= DRY_ML;
    const returned = s.travel <= 0.02 && s.pressure <= 0.05 && !s.gripped;
    if (emptied || returned || s.dribbling > 2.5 || s.elapsed > MAX_PULL) {
      s.phase = "spent";
      s.finished = {
        samples: s.samples.slice(),
        yield: s.yield,
        duration: s.samples.length ? s.samples[s.samples.length - 1].t : 0,
        integrity: s.integrity,
      };
    }
  }

  // Refill once the lever has settled back at the top. On the real machine this
  // is the inlet port opening as the piston clears it.
  if (s.phase === "spent" && s.travel < 0.05 && !s.gripped) {
    s.restingAtTop += h;
    if (s.restingAtTop > 0.35) {
      s.phase = "refilling";
      s.yield = 0;
      s.integrity = 1;
      s.elapsed = 0;
      s.dribbling = 0;
      s.samples = [];
    }
  } else if (s.phase !== "refilling") {
    s.restingAtTop = 0;
  }

  if (s.phase === "refilling") {
    s.charge = Math.min(STROKE_ML, s.charge + REFILL_RATE * h);
    if (s.charge >= STROKE_ML - 0.01) {
      s.charge = STROKE_ML;
      s.phase = "charged";
    }
  }
}

/** Sample interval for the trace, seconds. 20 Hz is plenty for a 25 s curve. */
const SAMPLE_STEP = 0.05;

function recordSample(s: LeverSim) {
  const last = s.samples[s.samples.length - 1];
  if (last && s.elapsed - last.t < SAMPLE_STEP) return;
  if (!last && s.pressure < 0.15) return;
  s.samples.push({ t: s.elapsed, p: s.pressure, q: s.flow, k: s.integrity });
}

/** Move the hand to an absolute travel position (pointer drag). */
export function setHand(s: LeverSim, travel: number) {
  s.hand = Math.max(-0.08, Math.min(1.3, travel));
}

/** Release: the hand retreats to the lever so the load falls to nothing. */
export function releaseHand(s: LeverSim) {
  s.gripped = false;
}

/**
 * Keyboard and press-and-hold input. Identical physics to the drag, different
 * actuator: a key cannot express a position, so holding it presses with steadily
 * increasing firmness instead. What it maintains is the *lead* — how far ahead of
 * the lever the hand is — because that is what sets the force, and holding the
 * key therefore behaves like leaning harder rather than like winding a crank. It
 * ramps from a pre-infusion press to the point of fracturing the bed over about
 * three seconds, which is slow enough to feel and fast enough to get wrong.
 */
export function stepHeldHand(s: LeverSim, input: PressInput, firmness: number, dt: number) {
  if (input === "release") {
    // Retreat toward the lever, which is a hand coming off it: the load falls to
    // nothing and the spring takes the lever back up.
    s.hand += (s.travel - s.hand) * Math.min(1, dt * 4);
    return;
  }
  const lead = Math.min(MAX_LEAD, BASE_LEAD + firmness * 0.018);
  const target = Math.min(1.3, s.travel + lead);
  s.hand += (target - s.hand) * Math.min(1, dt * 9);
}

/**
 * How hard the hand is pressing, for the keyboard and press-and-hold paths.
 * "ease" is the important one and the reason this is not a boolean: a key that
 * can only be down or up gives you a hand that is either flat out or off the
 * lever altogether, and letting go mid-shot lets the lever rise, so the long
 * decline the whole page argues for is unplayable. Easing keeps the hand on the
 * lever and reduces the force.
 */
export type PressInput = "press" | "ease" | "release";

/** Lead at the gentlest press: about two bar, which is a pre-infusion. */
const BASE_LEAD = 0.03;
/** Lead at which the hand is at its limit, around fifteen bar. */
const MAX_LEAD = 0.17;
