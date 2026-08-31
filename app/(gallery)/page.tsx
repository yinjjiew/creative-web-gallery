import { TaskIndex } from "@/components/TaskIndex";
import { allGroups, allRows } from "@/lib/rows";
import { SETTINGS } from "@/lib/settings";
import { abilityCounts, overallProgress } from "@/lib/tasks";

import styles from "./page.module.css";

export default function IndexPage() {
  const rows = allRows();
  const groups = allGroups();
  const abilities = abilityCounts();
  const { total, complete } = overallProgress();

  return (
    <div className="shell">
      <section className={styles.intro}>
        <div>
          <h1 className={styles.title}>
            A catalogue of task prompts and <em>reference implementations</em> for
            the creative web.
          </h1>
          <p className={styles.lede}>
            Nine application settings, each broken into its typical tasks. Every
            typical task has one prompt written for it, a set of ability tags,
            and one result built in answer to that prompt.
          </p>
        </div>

        <dl className={`${styles.tally} mono`} style={{ margin: 0 }}>
          <div className={styles.tallyRow}>
            <dt>Settings</dt>
            <dd style={{ margin: 0 }}>
              <strong>{SETTINGS.length}</strong>
            </dd>
          </div>
          <div className={styles.tallyRow}>
            <dt>Typical tasks</dt>
            <dd style={{ margin: 0 }}>
              <strong>{total}</strong>
            </dd>
          </div>
          <div className={styles.tallyRow}>
            <dt>Abilities</dt>
            <dd style={{ margin: 0 }}>
              <strong>{abilities.length}</strong>
            </dd>
          </div>
          <div className={styles.tallyRow}>
            <dt>Results complete</dt>
            <dd style={{ margin: 0 }}>
              <strong>
                {complete} / {total}
              </strong>
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.hierarchy} aria-label="Structure">
        <div className={`${styles.hierarchyInner} mono`}>
          <span>Application setting</span>
          <span className={styles.arrow}>→</span>
          <span>Typical task</span>
          <span className={styles.arrow}>→</span>
          <span>Prompt + ability tags</span>
          <span className={styles.arrow}>→</span>
          <span>Result</span>
        </div>
      </section>

      <TaskIndex rows={rows} groups={groups} abilities={abilities} />
    </div>
  );
}
