"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Ability, TaskStatus } from "@/lib/types";

import styles from "./TaskIndex.module.css";

/**
 * A compact projection of Task, built on the server. The prompt bodies are
 * deliberately excluded: shipping all 74 of them to the client to support
 * full-text search would roughly quintuple this payload, and the fields kept
 * here are the ones people actually search by.
 */
export type IndexRow = {
  id: string;
  number: number;
  setting: string;
  settingName: string;
  typicalTask: string;
  title: string;
  blurb: string;
  abilities: Ability[];
  status: TaskStatus;
  haystack: string;
};

export type IndexGroup = {
  slug: string;
  name: string;
  premise: string;
  total: number;
};

type Props = {
  rows: IndexRow[];
  groups: IndexGroup[];
  abilities: { ability: Ability; count: number }[];
  /** Preselected ability, used by the /abilities/[slug] pages. */
  initialAbility?: Ability;
  /** Hidden when the page is already scoped to a single setting. */
  showGroupHeadings?: boolean;
};

export function TaskIndex({
  rows,
  groups,
  abilities,
  initialAbility,
  showGroupHeadings = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Ability[]>(
    initialAbility ? [initialAbility] : []
  );

  const terms = useMemo(
    () =>
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 0),
    [query]
  );

  const matches = useMemo(
    () =>
      rows.filter((row) => {
        // Abilities intersect as AND: selecting two narrows to tasks needing
        // both, which is the useful reading when looking for a task that
        // exercises a specific combination.
        for (const ability of selected) {
          if (!row.abilities.includes(ability)) return false;
        }
        for (const term of terms) {
          if (!row.haystack.includes(term)) return false;
        }
        return true;
      }),
    [rows, selected, terms]
  );

  const matchedIds = useMemo(() => new Set(matches.map((row) => row.id)), [matches]);
  const filtering = terms.length > 0 || selected.length > 0;

  function toggle(ability: Ability) {
    setSelected((current) =>
      current.includes(ability)
        ? current.filter((entry) => entry !== ability)
        : [...current, ability]
    );
  }

  function clear() {
    setQuery("");
    setSelected([]);
  }

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.searchField}>
          <label className={`${styles.label} mono`} htmlFor="task-search">
            Search
          </label>
          <input
            id="task-search"
            className={styles.search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, task, setting, ability, description"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.abilities}>
          <span className={`${styles.label} mono`} style={{ flex: "1 1 100%" }}>
            Filter by ability
          </span>
          {abilities.map(({ ability, count }) => {
            const on = selected.includes(ability);
            return (
              <button
                key={ability}
                type="button"
                className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                aria-pressed={on}
                onClick={() => toggle(ability)}
              >
                {ability}
                <span className={styles.chipCount}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${styles.status} mono`}>
        <span aria-live="polite">
          {filtering
            ? `${matches.length} of ${rows.length} tasks`
            : `${rows.length} tasks`}
        </span>
        {filtering ? (
          <button type="button" className={styles.clear} onClick={clear}>
            Clear
          </button>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <p className={styles.empty}>
          Nothing matches that combination. Abilities narrow together, so asking
          for several at once can exclude everything.
        </p>
      ) : null}

      {groups.map((group) => {
        const groupRows = rows.filter(
          (row) => row.setting === group.slug && matchedIds.has(row.id)
        );
        if (!groupRows.length) return null;

        return (
          <section key={group.slug} className={styles.group}>
            {showGroupHeadings ? (
              <>
                <div className={styles.groupHead}>
                  <h2 className={styles.groupTitle}>
                    <Link href={`/settings/${group.slug}`}>{group.name}</Link>
                  </h2>
                  <span className={`${styles.groupCount} mono`}>
                    {filtering
                      ? `${groupRows.length} / ${group.total}`
                      : `${group.total} tasks`}
                  </span>
                </div>
                <p className={styles.groupPremise}>{group.premise}</p>
              </>
            ) : null}

            <ul className={styles.rows} style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {groupRows.map((row) => (
                <li key={row.id}>
                  <Link href={`/tasks/${row.id}`} className={styles.row}>
                    <span className={`${styles.num} mono`}>
                      {String(row.number).padStart(3, "0")}
                    </span>
                    <span className={styles.headline}>
                      <span className={styles.rowTitle}>{row.title}</span>
                      <span className={styles.rowTypical}>{row.typicalTask}</span>
                    </span>
                    <span className={`${styles.rowStatus} mono`}>{row.status}</span>
                    <span className={styles.blurb}>{row.blurb}</span>
                    <span className={`${styles.rowTags} mono`}>
                      {row.abilities.map((ability) => (
                        <span
                          key={ability}
                          className={
                            selected.includes(ability) ? styles.tagHit : undefined
                          }
                        >
                          {ability}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
