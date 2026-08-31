/**
 * The three concepts this project keeps deliberately separate:
 *
 *   Application Setting  — the broad family of web experience
 *   Typical Task         — a kind of thing someone could build inside that setting
 *   Ability              — an underlying capability a task demands
 *
 * A Task is one (setting, typical task) pair, plus the prompt written for it and
 * the result built in answer to that prompt. Every typical task gets its own
 * record; a setting is never represented by a single example.
 */

/**
 * Closed vocabulary. Adding a synonym for an ability that already exists would
 * quietly split one ability's tasks across two names and make any later
 * per-ability analysis wrong, so this list is the only source of tags.
 */
export const ABILITIES = [
  "Visual Design / Taste",
  "Layout & Typography",
  "Creative Concept",
  "Interaction Design",
  "Motion Design",
  "2D Graphics",
  "3D / Spatial",
  "Physics / Simulation",
  "Functional Logic",
  "State & Data",
  "Information Architecture",
  "Narrative / Communication",
  "Multimodal Interaction",
  "Robustness / Product Polish",
  "Game Design",
  "Educational Correctness",
  "Export / Reusability",
  "Brand Interpretation",
  "Audio Design",
  "Data Visualization",
] as const;

export type Ability = (typeof ABILITIES)[number];

/**
 * Ordered worst-to-best so the progress page can sort by it and so
 * `STATUS_ORDER.indexOf` doubles as a completeness score.
 *
 * "complete" means the result was reviewed against its own prompt and polished,
 * not merely that the route renders.
 */
export const STATUS_ORDER = [
  "planned",
  "prompt-written",
  "building",
  "polishing",
  "complete",
] as const;

export type TaskStatus = (typeof STATUS_ORDER)[number];

export type Task = {
  id: string;

  /** Slug of the owning Setting. */
  applicationSetting: string;

  /** The typical-task category this answers, e.g. "Wallpaper Generator". */
  typicalTask: string;

  /** The name of the specific thing built, e.g. "Terrazzo". */
  title: string;

  /** The exact prompt. Shown verbatim on the task page; never paraphrased. */
  prompt: string;

  abilityTags: Ability[];

  /** Route of the built result, under the isolated `(results)` root layout. */
  resultRoute: string;

  status: TaskStatus;

  /** One line for index rows. Describes the result, not the prompt. */
  blurb: string;

  /**
   * The central idea decided before coding: what makes the task interesting and
   * which cliché was deliberately refused. Recorded because a reference
   * distribution is only useful if the reasoning behind it is legible.
   */
  direction: string;
};

export type Setting = {
  slug: string;
  /** Sequence used for display; matches the order in the specification. */
  index: number;
  name: string;
  /** The shape of the user's relationship to the artifact in this setting. */
  premise: string;
  description: string;
  /** What separates this setting from the ones it is most confused with. */
  boundary: string;
};
