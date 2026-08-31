import { SETTINGS } from "../settings";
import { ABILITIES, STATUS_ORDER, type Ability, type Task, type TaskStatus } from "../types";

import { CREATIVE_TOOLS } from "./creative-tools";
import { INTERACTIVE_3D } from "./interactive-3d";
import { TWO_D_VISUALS } from "./2d-visuals";
import { GAMES } from "./games";
import { PERSONAL_STUDIO } from "./personal-studio";
import { CLIENT_BRAND } from "./client-brand";
import { EDUCATIONAL } from "./educational";
import { PRACTICAL_APPS } from "./practical-apps";
import { TRADITIONAL_WEBSITES } from "./traditional-websites";

/**
 * Concatenated in specification order so that index position is stable and can
 * be used as a catalogue number in the interface.
 */
export const TASKS: Task[] = [
  ...CREATIVE_TOOLS,
  ...INTERACTIVE_3D,
  ...TWO_D_VISUALS,
  ...GAMES,
  ...PERSONAL_STUDIO,
  ...CLIENT_BRAND,
  ...EDUCATIONAL,
  ...PRACTICAL_APPS,
  ...TRADITIONAL_WEBSITES,
];

export const TASK_BY_ID = new Map(TASKS.map((task) => [task.id, task]));

/** Catalogue number, 1-based, in specification order. Displayed as e.g. 042. */
export const TASK_NUMBER = new Map(TASKS.map((task, i) => [task.id, i + 1]));

export function tasksForSetting(slug: string) {
  return TASKS.filter((task) => task.applicationSetting === slug);
}

export function tasksForAbility(ability: Ability) {
  return TASKS.filter((task) => task.abilityTags.includes(ability));
}

export function isComplete(task: Task) {
  return task.status === "complete";
}

export type SettingProgress = {
  slug: string;
  name: string;
  total: number;
  complete: number;
  /** Count per status, for the progress page's stacked bar. */
  byStatus: Record<TaskStatus, number>;
};

export function settingProgress(): SettingProgress[] {
  return SETTINGS.map((setting) => {
    const tasks = tasksForSetting(setting.slug);
    const byStatus = Object.fromEntries(
      STATUS_ORDER.map((status) => [status, 0])
    ) as Record<TaskStatus, number>;
    for (const task of tasks) byStatus[task.status] += 1;

    return {
      slug: setting.slug,
      name: setting.name,
      total: tasks.length,
      complete: tasks.filter(isComplete).length,
      byStatus,
    };
  });
}

/** Only abilities actually in use, with their counts, most-used first. */
export function abilityCounts() {
  return ABILITIES.map((ability) => ({
    ability,
    count: tasksForAbility(ability).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.ability.localeCompare(b.ability));
}

export function overallProgress() {
  return {
    total: TASKS.length,
    complete: TASKS.filter(isComplete).length,
  };
}

/**
 * Fields flattened into one lowercase string per task so the gallery's search
 * can match against prompt text as well as titles. Built once at module load.
 */
export const SEARCH_INDEX = new Map(
  TASKS.map((task) => [
    task.id,
    [
      task.title,
      task.typicalTask,
      task.blurb,
      task.prompt,
      task.direction,
      task.abilityTags.join(" "),
      SETTINGS.find((s) => s.slug === task.applicationSetting)?.name ?? "",
    ]
      .join(" ")
      .toLowerCase(),
  ])
);
