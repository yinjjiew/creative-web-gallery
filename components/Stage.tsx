"use client";

import { useRef, type PointerEvent } from "react";

import type { IndexRow } from "./TaskIndex";
import styles from "./Stage.module.css";

/**
 * Complete work is not a status chip. It is something you can step into.
 * The rail is the live collection — tilt a plate, open the experience.
 */
export function Stage({ rows }: { rows: IndexRow[] }) {
  const live = rows.filter((row) => row.status === "complete");
  const rail = useRef<HTMLUListElement>(null);

  if (!live.length) return null;

  function tilt(event: PointerEvent<HTMLAnchorElement>) {
    const plate = event.currentTarget;
    const box = plate.getBoundingClientRect();
    const x = (event.clientX - box.left) / Math.max(box.width, 1);
    const y = (event.clientY - box.top) / Math.max(box.height, 1);
    plate.style.setProperty("--tx", ((x - 0.5) * 8).toFixed(2));
    plate.style.setProperty("--ty", ((0.5 - y) * 8).toFixed(2));
    plate.style.setProperty("--lx", `${(x * 100).toFixed(1)}%`);
    plate.style.setProperty("--ly", `${(y * 100).toFixed(1)}%`);
  }

  function flatten(event: PointerEvent<HTMLAnchorElement>) {
    const plate = event.currentTarget;
    plate.style.setProperty("--tx", "0");
    plate.style.setProperty("--ty", "0");
  }

  return (
    <section className={styles.stage} aria-label="Open a finished result">
      <div className={styles.head}>
        <h2 className={styles.title}>On the floor</h2>
        <p className={`${styles.note} mono`}>
          {live.length} live — drag the rail, tilt a plate, step inside
        </p>
      </div>
      <ul ref={rail} className={styles.rail}>
        {live.map((row) => (
          <li key={row.id}>
            <a
              href={row.resultRoute}
              className={styles.plate}
              data-n={String(row.number).padStart(3, "0")}
              onPointerMove={tilt}
              onPointerLeave={flatten}
            >
              <span className={`${styles.num} mono`}>
                {String(row.number).padStart(3, "0")}
              </span>
              <span className={styles.name}>{row.title}</span>
              <span className={styles.kind}>{row.typicalTask}</span>
              <span className={`${styles.go} mono`}>Enter →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
