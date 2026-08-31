import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TaskIndex } from "@/components/TaskIndex";
import { toRow } from "@/lib/rows";
import { SETTINGS, SETTING_BY_SLUG } from "@/lib/settings";
import { abilityCounts, tasksForSetting } from "@/lib/tasks";
import { ABILITIES, type Ability } from "@/lib/types";

import styles from "./setting.module.css";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return SETTINGS.map((setting) => ({ slug: setting.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const setting = SETTING_BY_SLUG.get(slug);
  if (!setting) return {};
  return { title: setting.name, description: setting.description };
}

export default async function SettingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const setting = SETTING_BY_SLUG.get(slug);
  if (!setting) notFound();

  const tasks = tasksForSetting(slug);
  const rows = tasks.map(toRow);
  const complete = tasks.filter((task) => task.status === "complete").length;

  // Only the abilities this setting actually exercises, so the filter cannot
  // offer a chip that would empty the page.
  const present = new Set<Ability>(tasks.flatMap((task) => task.abilityTags));
  const abilities = abilityCounts()
    .filter((entry) => present.has(entry.ability))
    .map((entry) => ({
      ability: entry.ability,
      count: tasks.filter((task) => task.abilityTags.includes(entry.ability)).length,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        ABILITIES.indexOf(a.ability) - ABILITIES.indexOf(b.ability)
    );

  return (
    <div className="shell">
      <div className={`${styles.top} mono`}>
        <Link href="/" className={styles.back}>
          ← Index
        </Link>
        <span>
          Setting {setting.index} of {SETTINGS.length}
        </span>
      </div>

      <header className={styles.head}>
        <p className={`${styles.eyebrow} mono`}>Application setting</p>
        <h1 className={styles.title}>{setting.name}</h1>
        <p className={styles.premise}>{setting.premise}</p>

        <div className={styles.body}>
          <p className={styles.description}>{setting.description}</p>
          <div className={styles.boundary}>
            <span className={`${styles.boundaryLabel} mono`}>Boundary</span>
            <p className={styles.boundaryText}>{setting.boundary}</p>
          </div>
        </div>

        <div className={`${styles.progress} mono`}>
          <span>{tasks.length} typical tasks</span>
          <span>
            {complete} / {tasks.length} complete
          </span>
        </div>
      </header>

      <TaskIndex
        rows={rows}
        groups={[
          {
            slug: setting.slug,
            name: setting.name,
            premise: setting.premise,
            total: tasks.length,
          },
        ]}
        abilities={abilities}
        showGroupHeadings={false}
      />
    </div>
  );
}
