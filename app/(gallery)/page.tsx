import { HeadTitle } from "@/components/HeadTitle";
import { Stage } from "@/components/Stage";
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
          <HeadTitle>
            A catalogue of task prompts and <em>reference implementations</em>{" "}
            for the creative web.
          </HeadTitle>
          <p className={styles.lede}>
            Move across the type — it opens under the lamp. Then enter a plate
            on the floor. Nine settings, seventy-four typical tasks, each with
            one prompt and one result you can use, not just read.
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

      <Stage rows={rows} />

      <TaskIndex rows={rows} groups={groups} abilities={abilities} />
    </div>
  );
}
