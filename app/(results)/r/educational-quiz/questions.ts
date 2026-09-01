/**
 * Four situations. Every distractor is a documented misconception, not a
 * random wrong answer. The citations are the papers the distractors were
 * drawn from — not decoration.
 */

export type SituationId = "puck" | "fall" | "throw" | "circle";

export type ModelId =
  | "newton"
  | "aristotle"
  | "impetus"
  | "curvilinear"
  | "mass-speed"
  | "mass-inertia"
  | "force-builds"
  | "straight-drop"
  | "gravity-waits"
  | "arm-arc"
  | "outward"
  | "curve-on"
  | "inward";

export type Choice = {
  id: string;
  key: "A" | "B" | "C" | "D";
  label: string;
  model: ModelId;
  correct: boolean;
};

export type Item = {
  id: SituationId;
  no: string;
  title: string;
  caption: string;
  action: string;
  prompt: string;
  choices: Choice[];
};

export type Diagnosis = {
  theory: string;
  body: string;
  cite: string;
};

export const ITEMS: Item[] = [
  {
    id: "puck",
    no: "I · ice",
    title: "A shove, then nothing",
    caption: "Top view · frictionless ice · no air",
    action: "Flick the puck, or choose a theory",
    prompt:
      "You shove a puck on frictionless ice and let go. After your hand leaves it, what happens?",
    choices: [
      {
        id: "puck-aristotle",
        key: "A",
        label: "It stops at once. Nothing is pushing it any more.",
        model: "aristotle",
        correct: false,
      },
      {
        id: "puck-impetus",
        key: "B",
        label: "It slows and stops. The shove stored a force that runs out.",
        model: "impetus",
        correct: false,
      },
      {
        id: "puck-newton",
        key: "C",
        label: "It keeps the speed and direction it had when you let go.",
        model: "newton",
        correct: true,
      },
      {
        id: "puck-curve",
        key: "D",
        label: "It drifts into a curve — your hand was swinging as you pushed.",
        model: "curvilinear",
        correct: false,
      },
    ],
  },
  {
    id: "fall",
    no: "II · drop",
    title: "Two masses, one height",
    caption: "Side view · vacuum · g = 9.81 m/s²",
    action: "Drop them, or choose a theory",
    prompt:
      "A 1 kg ball and a 10 kg ball are released together from rest, in vacuum. Which hits first?",
    choices: [
      {
        id: "fall-heavy",
        key: "A",
        label: "The 10 kg ball. More weight means more acceleration.",
        model: "mass-speed",
        correct: false,
      },
      {
        id: "fall-together",
        key: "B",
        label: "They hit together. Weight and inertia scale together.",
        model: "newton",
        correct: true,
      },
      {
        id: "fall-light",
        key: "C",
        label: "The 1 kg ball. Less mass is easier for gravity to get moving.",
        model: "mass-inertia",
        correct: false,
      },
      {
        id: "fall-build",
        key: "D",
        label: "The heavy one pulls ahead at first, then they even out.",
        model: "force-builds",
        correct: false,
      },
    ],
  },
  {
    id: "throw",
    no: "III · throw",
    title: "Off the edge",
    caption: "Side view · vacuum · thrown horizontally",
    action: "Throw it, or choose a theory",
    prompt:
      "A ball is thrown horizontally off a cliff. Which path does it follow?",
    choices: [
      {
        id: "throw-drop",
        key: "A",
        label:
          "Straight out, then a sudden drop when the throw-force is used up.",
        model: "straight-drop",
        correct: false,
      },
      {
        id: "throw-wait",
        key: "B",
        label:
          "Mostly straight, then bending down as gravity gradually takes over.",
        model: "gravity-waits",
        correct: false,
      },
      {
        id: "throw-newton",
        key: "C",
        label:
          "A parabola: constant horizontal speed, steadily growing downward speed.",
        model: "newton",
        correct: true,
      },
      {
        id: "throw-arm",
        key: "D",
        label: "It keeps curving the way your arm swung as you threw.",
        model: "arm-arc",
        correct: false,
      },
    ],
  },
  {
    id: "circle",
    no: "IV · string",
    title: "The string is cut",
    caption: "Top view · horizontal circle · table, no friction",
    action: "Cut the string, or choose a theory",
    prompt:
      "A ball is whirled in a horizontal circle on a string. The string is cut. Which way does the ball go?",
    choices: [
      {
        id: "circle-out",
        key: "A",
        label: "Straight out from the centre — the way it was being forced.",
        model: "outward",
        correct: false,
      },
      {
        id: "circle-curve",
        key: "B",
        label: "It keeps curving, and only later forgets the circle.",
        model: "curve-on",
        correct: false,
      },
      {
        id: "circle-newton",
        key: "C",
        label: "Straight on, tangent to the circle at the instant of the cut.",
        model: "newton",
        correct: true,
      },
      {
        id: "circle-in",
        key: "D",
        label: "Inward. The pull of the string takes a moment to fade.",
        model: "inward",
        correct: false,
      },
    ],
  },
];

export const DIAGNOSES: Record<string, Diagnosis> = {
  "puck-aristotle": {
    theory: "Motion requires a continuing force",
    body: "You treated rest as the natural state and motion as something that has to be paid for, moment by moment. That is Aristotle's account, and it is how almost everyone first reads the world: stop pushing, and things stop. On ice with no friction there is no payment to make. The shove changed the puck's velocity. After that, nothing is acting, so the velocity does not change.",
    cite: "Halloun & Hestenes, American Journal of Physics 53 (1985); the Aristotelian impetus family in the Force Concept Inventory.",
  },
  "puck-impetus": {
    theory: "A stored force that runs out",
    body: "You gave the puck an internal supply of motion — a shove that lives inside it and is spent like fuel. Medieval impetus theory said the same, and so do most first-year answers. A force is an interaction with something else, not a substance an object carries. Once your hand has left, that interaction is over. The puck keeps the velocity it already has; nothing is being used up.",
    cite: "McCloskey, “Intuitive physics,” Scientific American 248 (1983); Clement, American Journal of Physics 50 (1982).",
  },
  "puck-newton": {
    theory: "Newton’s first law",
    body: "Your prediction matches the world. With no force, velocity is constant. This item has nothing left to teach.",
    cite: "The ice is a model of a force-free interval, not a claim about real rinks.",
  },
  "puck-curve": {
    theory: "Curvilinear impetus",
    body: "You let the gesture of the throw leak into the later motion — as if a curved action leaves a curved tendency behind. McCloskey found this in students watching objects leave spiral tubes: they drew paths that kept bending after the constraint was gone. The shove is over. There is no memory of how the velocity was acquired. Straight, at the speed it had when you let go.",
    cite: "McCloskey, Caramazza & Green, Science 210 (1980); McCloskey, Scientific American 248 (1983).",
  },
  "fall-heavy": {
    theory: "Heavier things fall faster",
    body: "You let weight decide acceleration. Aristotle did too, and so does everyday air: a stone outruns a leaf. In vacuum the leaf and the stone keep each other company, because the force on each is proportional to the same mass that resists being accelerated. The 10 kg ball is pulled ten times as hard and is ten times as unwilling. The ratio is g, for both.",
    cite: "Galileo, Two New Sciences (1638), Third Day; Apollo 15 hammer and feather (NASA, 1971) as a demonstration, not a measurement used here.",
  },
  "fall-together": {
    theory: "Weight and inertia scale together",
    body: "Your prediction matches the world. Both balls fall at g. This item has nothing left to teach.",
    cite: "g = 9.81 m/s², standard gravity. Vacuum: no drag, no buoyancy.",
  },
  "fall-light": {
    theory: "Mass only resists; gravity does not scale",
    body: "You remembered inertia and forgot that weight is inertia times g. If gravity were a fixed shove, the same for every object, then yes — the heavy ball would be harder to get moving and would lose. Gravity is not a fixed shove. The pull grows with the mass. The two effects cancel, which is why a gravitational field is an acceleration field.",
    cite: "Halloun & Hestenes, American Journal of Physics 53 (1985), on gravity treated as a mass-independent force.",
  },
  "fall-build": {
    theory: "Force needs time to act on mass",
    body: "You gave the heavy ball a head start, as if a larger force needed a moment to “take hold” and then the accelerations would match. A force does not charge up. At every instant a = F/m = g, for both, from the first instant of free fall.",
    cite: "A cousin of Clement’s motion-implies-force pattern (AJP 50, 1982): force imagined as something that accumulates rather than a rate.",
  },
  "throw-drop": {
    theory: "The throw-force runs out, then gravity starts",
    body: "You drew the path most of McCloskey’s subjects drew: a straight horizontal, then a corner, then a drop. That is impetus spent to a deadline, after which gravity is allowed to work. Gravity does not wait. It acts the whole time, and the horizontal velocity is not a fuel. The two are independent. The path is a parabola from the first instant.",
    cite: "McCloskey, Scientific American 248 (1983), the “straight then down” projectile drawings.",
  },
  "throw-wait": {
    theory: "Gravity gradually takes over",
    body: "You kept the impetus idea but softened the corner — the throw-force fading, gravity rising. That drawing is common and still wrong in the same way. Horizontal speed does not decay (in vacuum). Downward speed grows linearly from the first moment, not after a delay. There is no handover.",
    cite: "McCloskey, Caramazza & Green, Science 210 (1980).",
  },
  "throw-newton": {
    theory: "Independence of horizontal and vertical motion",
    body: "Your prediction matches the world. This item has nothing left to teach.",
    cite: "Vacuum. Horizontal velocity is constant; vertical is free fall from rest.",
  },
  "throw-arm": {
    theory: "Curvilinear impetus, from the arm",
    body: "You stored the swing of the arm in the ball, so the path kept the circle of the throw. Once the ball has left the hand, the hand is no longer acting. The only force is downward. The path cannot remember a circle it is no longer being forced around.",
    cite: "McCloskey, Scientific American 248 (1983), on objects leaving curved constraints.",
  },
  "circle-out": {
    theory: "Circular motion needs an outward force",
    body: "You pointed along the radius, outward — the centrifugal story. The force that was acting was inward: the string’s tension, the centripetal requirement for a curved path. When the string is cut that force vanishes. The ball is not flung out. It already had a velocity, tangent to the circle, and with no force it keeps that velocity.",
    cite: "Force Concept Inventory, Hestenes, Wells & Swackhamer, The Physics Teacher 30 (1992), the string / hose items.",
  },
  "circle-curve": {
    theory: "Curvilinear impetus after the constraint is gone",
    body: "You let the circle persist after the thing that made the circle is gone. That is the same theory as the spiral-tube drawings: motion is a shape an object is in, and it fades slowly. Motion is a velocity. The string was what changed the direction of that velocity. Cut it, and the direction stops changing.",
    cite: "McCloskey, Caramazza & Green, Science 210 (1980).",
  },
  "circle-newton": {
    theory: "Velocity is tangent; the string was the only force",
    body: "Your prediction matches the world. This item has nothing left to teach.",
    cite: "Horizontal circle on a frictionless table, so gravity and the normal force cancel and do not enter the plane.",
  },
  "circle-in": {
    theory: "A force persists after it has stopped acting",
    body: "You kept the inward pull after the string was gone — the inverse of impetus: a force that lingers. Forces are interactions. There is no string, so there is no pull. The ball does not remember being pulled. It goes where its velocity already pointed, which is along the tangent.",
    cite: "Clement, American Journal of Physics 50 (1982), on forces imagined as lingering properties of objects.",
  },
};

export function choiceByKey(item: Item, key: string): Choice | undefined {
  const k = key.toUpperCase();
  return item.choices.find((c) => c.key === k);
}
