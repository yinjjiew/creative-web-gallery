import type { Setting } from "./types";

export const SETTINGS: Setting[] = [
  {
    slug: "creative-tools",
    index: 1,
    name: "Creative Tools & Artifact Generators",
    premise: "user → tool → artifact → artifact is used elsewhere",
    description:
      "Small factories. The person arrives without the thing they want and leaves with it. What matters is the size of the creative space the tool opens and whether the output is good enough to actually use, not the number of sliders on the panel.",
    boundary:
      "A creative tool produces an artifact that leaves the page. A 2D toy produces an experience that stays on it.",
  },
  {
    slug: "interactive-3d",
    index: 2,
    name: "Interactive 3D Experiences",
    premise: "human ↕ digital environment",
    description:
      "Space used because the subject is spatial. Interaction is not restricted to scroll: cursor position and velocity, dragging, touch, microphone, webcam, physics and device orientation are all legitimate inputs, and the environment should answer them meaningfully.",
    boundary:
      "The dimension has to earn its place. A flat idea rendered in perspective is worse than the same idea in 2D.",
  },
  {
    slug: "2d-visuals",
    index: 3,
    name: "2D Visuals & Toys",
    premise: "user → interaction → the experience is itself the result",
    description:
      "Nothing is exported and nothing is completed. The reward is the feel of the thing under the hand, which puts the whole weight on responsiveness, coherence and the quality of the feedback loop.",
    boundary:
      "Creative visual does not mean particles everywhere. A single well-behaved material can carry a whole piece.",
  },
  {
    slug: "games",
    index: 4,
    name: "Games",
    premise: "rule → attempt → consequence → mastery",
    description:
      "The highest-variance setting. Movement, collision and a score are the floor, not the work. Game feel, feedback, pacing, difficulty, sound, visual identity and a reason to play again are what separate a game from a demo of a game.",
    boundary:
      "A mechanically functional game that feels like a browser demo from 2004 is not a strong result.",
  },
  {
    slug: "personal-studio",
    index: 5,
    name: "Personal & Studio Sites",
    premise: "identity + memory + expression",
    description:
      "Sites whose subject is a person or a practice. The social dimension is the point: what someone values, how they think, what they have lived through and how their work connects. Interaction can be a way of expressing that rather than a way of decorating it.",
    boundary:
      "Hero, About, Projects, Contact is a default, not a decision. The structure should follow from what is being said.",
  },
  {
    slug: "client-brand",
    index: 6,
    name: "Client & Brand Work",
    premise: "commercial brief → creative interpretation → coherent experience",
    description:
      "Work made to a brief, with an audience, a message and a call to action that someone is paying for. The ability under test is not decoration; it is reading a commercial idea correctly and finding the digital form that carries it.",
    boundary:
      "If the problem is presenting information clearly it is a traditional website. If the problem is interpreting an idea, it belongs here.",
  },
  {
    slug: "educational",
    index: 7,
    name: "Educational Apps",
    premise: "manipulate X → observe Y → build intuition",
    description:
      "Explanations where the interaction does the teaching. The test is whether someone leaves understanding something they could not have understood from the same text held still, and whether what they now believe is true.",
    boundary:
      "Correct text inside a pleasant interface is a document. The relationship has to be discoverable by moving something.",
  },
  {
    slug: "practical-apps",
    index: 8,
    name: "Practical Web Apps",
    premise: "user → workflow → state that persists",
    description:
      "Software for getting work done: creating, editing, organising, processing, completing. Included deliberately, because workflow design, functional reasoning and information architecture are real abilities — but written from the user's messy problem rather than from a list of UI parts.",
    boundary:
      "The prompts here describe a person with a problem, not a sidebar with a table and three buttons.",
  },
  {
    slug: "traditional-websites",
    index: 9,
    name: "Traditional Websites",
    premise: "user → reads, browses, navigates, discovers",
    description:
      "Sites where the visitor consumes rather than operates. Kept as its own setting because doing it well is a distinct discipline: typography, hierarchy, navigation, content order, restraint and art direction.",
    boundary:
      "Traditional does not mean mediocre. It means the interaction budget is spent on legibility instead of spectacle.",
  },
];

export const SETTING_BY_SLUG = new Map(SETTINGS.map((s) => [s.slug, s]));

export function settingName(slug: string) {
  return SETTING_BY_SLUG.get(slug)?.name ?? slug;
}
