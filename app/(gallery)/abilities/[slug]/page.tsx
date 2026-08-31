import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TaskIndex } from "@/components/TaskIndex";
import { ABILITY_SLUGS, abilityFromSlug } from "@/lib/abilities";
import { allGroups, toRow } from "@/lib/rows";
import { abilityCounts, tasksForAbility } from "@/lib/tasks";

import styles from "../abilities.module.css";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return ABILITY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ability = abilityFromSlug(slug);
  if (!ability) return {};
  return {
    title: ability,
    description: `Tasks requiring ${ability}.`,
  };
}

export default async function AbilityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const ability = abilityFromSlug(slug);
  if (!ability) notFound();

  const tasks = tasksForAbility(ability);

  return (
    <div className="shell">
      <div style={{ padding: "1.5rem 0 0" }}>
        <Link href="/abilities" className="mono" style={{ color: "var(--muted)" }}>
          ← Abilities
        </Link>
      </div>

      <header className={styles.head}>
        <h1 className={styles.title}>{ability}</h1>
        <p className={styles.lede}>
          {tasks.length} tasks require this ability, spread across{" "}
          {new Set(tasks.map((task) => task.applicationSetting)).size} settings.
        </p>
      </header>

      <TaskIndex
        rows={tasks.map(toRow)}
        groups={allGroups()}
        abilities={abilityCounts()}
        initialAbility={ability}
      />
    </div>
  );
}
