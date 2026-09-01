import type { IndexGroup, IndexRow } from "@/components/TaskIndex";

import { SETTINGS, settingName } from "./settings";
import { TASKS, TASK_NUMBER, tasksForSetting } from "./tasks";
import type { Task } from "./types";

/**
 * Projects tasks into the compact shape the client index needs.
 *
 * The haystack is assembled here, on the server, from everything except the
 * prompt body. Including the prompts would multiply the client payload several
 * times over for a case — searching the interior of a brief — that is better
 * served by opening the task.
 */
export function toRow(task: Task): IndexRow {
  const settingLabel = settingName(task.applicationSetting);

  return {
    id: task.id,
    number: TASK_NUMBER.get(task.id) ?? 0,
    setting: task.applicationSetting,
    settingName: settingLabel,
    typicalTask: task.typicalTask,
    title: task.title,
    blurb: task.blurb,
    abilities: task.abilityTags,
    status: task.status,
    resultRoute: task.resultRoute,
    haystack: [
      task.title,
      task.typicalTask,
      task.blurb,
      task.status,
      settingLabel,
      task.abilityTags.join(" "),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

export function allRows(): IndexRow[] {
  return TASKS.map(toRow);
}

export function allGroups(): IndexGroup[] {
  return SETTINGS.map((setting) => ({
    slug: setting.slug,
    name: setting.name,
    premise: setting.premise,
    total: tasksForSetting(setting.slug).length,
  }));
}
