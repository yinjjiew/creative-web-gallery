import type { Metadata } from "next";
import Link from "next/link";

import { overallProgress, settingProgress } from "@/lib/tasks";
import { STATUS_ORDER, type TaskStatus } from "@/lib/types";

import styles from "./progress.module.css";

export const metadata: Metadata = {
  title: "Progress",
  description:
    "Where every task stands, by setting and by pipeline stage.",
};

/**
 * A single ramp from paper to ink across the pipeline, so that a bar reads as
 * progress at a glance without needing the legend. Using distinct hues here
 * would imply the stages are categories rather than an ordering.
 */
const SHADE: Record<TaskStatus, string> = {
  planned: "#e6e2d8",
  "prompt-written": "#c9c3b4",
  building: "#9e9686",
  polishing: "#5f5b50",
  complete: "#1a1a17",
};

const MEANING: Record<TaskStatus, string> = {
  planned: "Prompt written, result not started",
  "prompt-written": "Prompt and abilities settled",
  building: "Under construction",
  polishing: "Working, under review against its prompt",
  complete: "Reviewed and polished",
};

export default function ProgressPage() {
  const settings = settingProgress();
  const { total, complete } = overallProgress();

  return (
    <div className="shell">
      <header className={styles.head}>
        <h1 className={styles.title}>Progress</h1>
        <p className={styles.lede}>
          A task is only marked complete once the result has been reviewed
          against its own prompt and polished — not when the route first renders.
          Everything short of that is shown as what it actually is.
        </p>
        <div className={`${styles.overall} mono`}>
          <span className={styles.overallFigure}>
            {complete} / {total}
          </span>
          <span>results complete</span>
        </div>
      </header>

      <ul className={`${styles.legend} mono`}>
        {STATUS_ORDER.map((status) => (
          <li key={status} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: SHADE[status] }}
              aria-hidden="true"
            />
            <span>
              {status} — {MEANING[status]}
            </span>
          </li>
        ))}
      </ul>

      <ul className={styles.list}>
        {settings.map((setting) => (
          <li key={setting.slug} className={styles.row}>
            <div className={styles.rowHead}>
              <h2 className={styles.name}>
                <Link href={`/settings/${setting.slug}`}>{setting.name}</Link>
              </h2>
              <span className={`${styles.tally} mono`}>
                {setting.complete} / {setting.total}
              </span>
            </div>

            <div
              className={styles.bar}
              role="img"
              aria-label={`${setting.name}: ${STATUS_ORDER.map(
                (status) => `${setting.byStatus[status]} ${status}`
              ).join(", ")}`}
            >
              {STATUS_ORDER.map((status) =>
                setting.byStatus[status] > 0 ? (
                  <span
                    key={status}
                    className={styles.segment}
                    style={{
                      background: SHADE[status],
                      flexGrow: setting.byStatus[status],
                    }}
                  />
                ) : null
              )}
            </div>

            <div className={`${styles.detail} mono`}>
              {STATUS_ORDER.filter((status) => setting.byStatus[status] > 0).map(
                (status) => (
                  <span key={status}>
                    {setting.byStatus[status]} {status}
                  </span>
                )
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
