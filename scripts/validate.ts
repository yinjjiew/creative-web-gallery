/**
 * Structural checks over the task registry. Run by `npm run validate`.
 *
 * These are not stylistic preferences. Each one catches a mistake that would
 * silently corrupt the catalogue: a duplicate id makes a task unreachable, an
 * ability tag outside the closed vocabulary splits one ability across two names
 * and would make any later per-ability analysis wrong, and a result route that
 * disagrees with its id means the gallery links somewhere that 404s.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SETTINGS } from "../lib/settings";
import { TASKS } from "../lib/tasks";
import { ABILITIES, STATUS_ORDER } from "../lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const problems: string[] = [];
const fail = (message: string) => problems.push(message);

/**
 * Expected task counts per setting, transcribed from the specification. This
 * guards the failure mode the spec calls out explicitly: letting one example
 * stand in for an entire setting.
 */
const EXPECTED: Record<string, number> = {
  "creative-tools": 8,
  "interactive-3d": 9,
  "2d-visuals": 8,
  games: 9,
  "personal-studio": 8,
  "client-brand": 7,
  educational: 8,
  "practical-apps": 9,
  "traditional-websites": 8,
};

const expectedTotal = Object.values(EXPECTED).reduce((a, b) => a + b, 0);
if (TASKS.length !== expectedTotal) {
  fail(`Expected ${expectedTotal} tasks, found ${TASKS.length}.`);
}

for (const [slug, expected] of Object.entries(EXPECTED)) {
  const found = TASKS.filter((t) => t.applicationSetting === slug).length;
  if (found !== expected) {
    fail(`Setting "${slug}": expected ${expected} tasks, found ${found}.`);
  }
  if (!SETTINGS.some((s) => s.slug === slug)) {
    fail(`Setting "${slug}" is referenced by tasks but not defined.`);
  }
}

for (const setting of SETTINGS) {
  if (!(setting.slug in EXPECTED)) {
    fail(`Setting "${setting.slug}" is defined but has no expected task count.`);
  }
}

const seenIds = new Set<string>();
const seenTypicalTasks = new Set<string>();
const seenTitles = new Set<string>();

for (const task of TASKS) {
  const where = `Task "${task.id}"`;

  if (seenIds.has(task.id)) fail(`${where}: duplicate id.`);
  seenIds.add(task.id);

  // A typical task must appear exactly once within its setting. The spec
  // requires one prompt and one result per typical task.
  const key = `${task.applicationSetting}::${task.typicalTask}`;
  if (seenTypicalTasks.has(key)) {
    fail(`${where}: typical task "${task.typicalTask}" is duplicated in its setting.`);
  }
  seenTypicalTasks.add(key);

  if (seenTitles.has(task.title)) fail(`${where}: title "${task.title}" is not unique.`);
  seenTitles.add(task.title);

  if (task.resultRoute !== `/r/${task.id}`) {
    fail(`${where}: resultRoute is "${task.resultRoute}", expected "/r/${task.id}".`);
  }

  if (!STATUS_ORDER.includes(task.status)) {
    fail(`${where}: status "${task.status}" is not a known status.`);
  }

  if (!task.abilityTags.length) fail(`${where}: has no ability tags.`);
  if (new Set(task.abilityTags).size !== task.abilityTags.length) {
    fail(`${where}: repeats an ability tag.`);
  }
  for (const ability of task.abilityTags) {
    if (!ABILITIES.includes(ability)) {
      fail(`${where}: ability "${ability}" is outside the closed vocabulary.`);
    }
  }

  // A length floor rather than a style rule. A prompt this short cannot carry
  // the product, audience, constraints and things-to-avoid the spec asks for,
  // so it reliably indicates a task that was stubbed and never written.
  const promptLength = task.prompt.trim().length;
  if (promptLength < 700) {
    fail(`${where}: prompt is ${promptLength} chars, likely a stub.`);
  }
  if (!task.blurb.trim()) fail(`${where}: blurb is empty.`);
  if (!task.direction.trim()) fail(`${where}: direction is empty.`);

  // Any task claiming to be built must actually have a route on disk.
  if (task.status === "complete" || task.status === "polishing") {
    const dir = join(root, "app/(results)/r", task.id);
    if (!existsSync(dir)) {
      fail(`${where}: status is "${task.status}" but its result route is missing.`);
    }
  }
}

// Every result directory must belong to a registered task, so that a renamed id
// cannot leave an orphaned route quietly serving stale work.
const resultsDir = join(root, "app/(results)/r");
if (existsSync(resultsDir)) {
  for (const entry of readdirSync(resultsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !seenIds.has(entry.name)) {
      fail(`Orphaned result route: app/(results)/r/${entry.name} has no task.`);
    }
  }
}

if (problems.length) {
  console.error(`\nvalidate: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

const complete = TASKS.filter((t) => t.status === "complete").length;
console.log(
  `validate: ok — ${TASKS.length} tasks, ${SETTINGS.length} settings, ${complete} complete.`
);
