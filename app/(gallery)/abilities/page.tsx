import type { Metadata } from "next";
import Link from "next/link";

import { abilitySlug } from "@/lib/abilities";
import { SETTINGS } from "@/lib/settings";
import { abilityCounts, tasksForAbility } from "@/lib/tasks";

import styles from "./abilities.module.css";

export const metadata: Metadata = {
  title: "Abilities",
  description:
    "The closed vocabulary of abilities used to tag tasks, and how they are distributed across the nine application settings.",
};

export default function AbilitiesPage() {
  const entries = abilityCounts();
  // abilityCounts() is sorted most-used first, so the head is the maximum.
  const busiest = entries[0]?.count ?? 1;

  return (
    <div className="shell">
      <header className={styles.head}>
        <h1 className={styles.title}>Abilities</h1>
        <p className={styles.lede}>
          A closed vocabulary. Every task is tagged from this list and nothing
          else, because a synonym for an ability that already exists would split
          one ability across two names. The bars show which settings demand each
          ability — the same ability is often required by settings that look
          nothing alike.
        </p>
      </header>

      <ul className={styles.list}>
        {entries.map(({ ability, count }) => {
          const tasks = tasksForAbility(ability);
          const perSetting = SETTINGS.map((setting) => ({
            setting,
            n: tasks.filter((task) => task.applicationSetting === setting.slug)
              .length,
          })).filter((entry) => entry.n > 0);

          return (
            <li key={ability}>
              <Link href={`/abilities/${abilitySlug(ability)}`} className={styles.item}>
                <span className={`${styles.count} mono`}>{count}</span>
                <span className={styles.name}>{ability}</span>
                <span className={styles.spreadTrack} aria-hidden="true">
                  <span
                    className={styles.spread}
                    style={{ width: `${(count / busiest) * 100}%` }}
                  >
                    {perSetting.map(({ setting, n }) => (
                      <span
                        key={setting.slug}
                        className={styles.segment}
                        style={{ flexGrow: n }}
                      />
                    ))}
                  </span>
                </span>
                <span className={`${styles.settingsList} mono`}>
                  {perSetting.map(({ setting, n }) => (
                    <span key={setting.slug}>
                      {setting.name} {n}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div style={{ height: "3rem" }} />
    </div>
  );
}
