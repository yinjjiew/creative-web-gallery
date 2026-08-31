import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SETTING_BY_SLUG } from "@/lib/settings";
import { TASKS, TASK_BY_ID, TASK_NUMBER } from "@/lib/tasks";
import { abilitySlug } from "@/lib/abilities";

import styles from "./task.module.css";

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return TASKS.map((task) => ({ id: task.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = TASK_BY_ID.get(id);
  if (!task) return {};
  return {
    title: `${task.title} — ${task.typicalTask}`,
    description: task.blurb,
  };
}

/**
 * Statuses at which a result route exists on disk. Below this, the launch
 * affordance is replaced by an honest note rather than a link that would 404 —
 * the catalogue should never claim work that has not been done.
 */
const BUILT: ReadonlySet<string> = new Set(["building", "polishing", "complete"]);

const STATUS_NOTE: Record<string, string> = {
  planned: "The prompt is written. The result has not been started.",
  "prompt-written":
    "The prompt and ability tags are settled. Building has not started.",
  building: "Under construction. Rough in places, and not yet reviewed.",
  polishing:
    "Built and working. Being reviewed against its own prompt before completion.",
  complete: "Reviewed against its prompt and polished.",
};

export default async function TaskPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const task = TASK_BY_ID.get(id);
  if (!task) notFound();

  const setting = SETTING_BY_SLUG.get(task.applicationSetting);
  const number = TASK_NUMBER.get(task.id) ?? 0;
  const index = TASKS.findIndex((entry) => entry.id === task.id);
  const previous = index > 0 ? TASKS[index - 1] : null;
  const next = index < TASKS.length - 1 ? TASKS[index + 1] : null;
  const isBuilt = BUILT.has(task.status);

  return (
    <div className="shell">
      <div className={`${styles.top} mono`}>
        <Link href="/" className={styles.back}>
          ← Index
        </Link>
        <span>
          {String(number).padStart(3, "0")} / {String(TASKS.length).padStart(3, "0")}
        </span>
      </div>

      <header className={styles.head}>
        <div className={`${styles.breadcrumb} mono`}>
          <Link href={`/settings/${task.applicationSetting}`}>
            {setting?.name ?? task.applicationSetting}
          </Link>
          <span className={styles.sep}>/</span>
          <span>{task.typicalTask}</span>
        </div>
        <h1 className={styles.title}>{task.title}</h1>
        <p className={styles.blurb}>{task.blurb}</p>
      </header>

      <section className={styles.field}>
        <h2 className={`${styles.fieldLabel} mono`}>Abilities</h2>
        <div className={styles.tags}>
          {task.abilityTags.map((ability) => (
            <Link
              key={ability}
              href={`/abilities/${abilitySlug(ability)}`}
              className={`${styles.tag} mono`}
            >
              {ability}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.field}>
        <h2 className={`${styles.fieldLabel} mono`}>Prompt</h2>
        <div className={styles.prompt}>{task.prompt}</div>
      </section>

      <section className={styles.field}>
        <h2 className={`${styles.fieldLabel} mono`}>Result</h2>
        <div className={styles.result}>
          {isBuilt ? (
            <a className={`${styles.launch} mono`} href={task.resultRoute}>
              Open experience
              <span className={styles.launchArrow} aria-hidden="true">
                →
              </span>
            </a>
          ) : (
            <span className={`${styles.pending} mono`}>Not yet built</span>
          )}
          <p className={styles.statusNote}>
            <span className="mono">{task.status}</span>
            {" — "}
            {STATUS_NOTE[task.status]}
          </p>
        </div>
      </section>

      <section className={styles.field}>
        <h2 className={`${styles.fieldLabel} mono`}>Direction</h2>
        <p className={styles.direction}>{task.direction}</p>
      </section>

      <nav className={`${styles.adjacent} mono`} aria-label="Adjacent tasks">
        {previous ? (
          <Link href={`/tasks/${previous.id}`} className={styles.adjacentItem}>
            ← Previous
            <span className={styles.adjacentTitle}>{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/tasks/${next.id}`}
            className={`${styles.adjacentItem} ${styles.adjacentNext}`}
          >
            Next →
            <span className={styles.adjacentTitle}>{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
