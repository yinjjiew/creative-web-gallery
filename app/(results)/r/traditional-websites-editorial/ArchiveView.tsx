"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  BASE,
  FORMAT_LABEL,
  type Format,
  articles,
  issues,
  sections,
} from "./catalog";
import s from "./works.module.css";

const FORMATS: Format[] = [
  "feature",
  "dispatch",
  "essay",
  "diagram",
  "interview",
];

export function ArchiveView() {
  const [issue, setIssue] = useState<number | "all">("all");
  const [section, setSection] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");

  const list = useMemo(() => {
    return articles.filter((a) => {
      if (issue !== "all" && a.issue !== issue) return false;
      if (section !== "all" && a.section !== section) return false;
      if (format !== "all" && a.format !== format) return false;
      return true;
    });
  }, [issue, section, format]);

  return (
    <>
      <div className={s.filters} role="group" aria-label="Filter the archive">
        <button
          type="button"
          aria-pressed={issue === "all" && section === "all" && format === "all"}
          onClick={() => {
            setIssue("all");
            setSection("all");
            setFormat("all");
          }}
        >
          All
        </button>
        {issues.map((i) => (
          <button
            key={i.n}
            type="button"
            aria-pressed={issue === i.n}
            onClick={() => setIssue(issue === i.n ? "all" : i.n)}
          >
            No. {i.n}
          </button>
        ))}
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            aria-pressed={section === sec.id}
            onClick={() => setSection(section === sec.id ? "all" : sec.id)}
          >
            {sec.title}
          </button>
        ))}
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={format === f}
            onClick={() => setFormat(format === f ? "all" : f)}
          >
            {FORMAT_LABEL[f]}
          </button>
        ))}
      </div>
      <p className={s.by}>
        {list.length} {list.length === 1 ? "piece" : "pieces"}
      </p>
      <ol className={s.index}>
        {list.map((a) => (
          <li key={a.slug}>
            <p className={s.fmt}>
              No. {a.issue} · {FORMAT_LABEL[a.format]} · {a.section}
            </p>
            <h2>
              <Link href={`${BASE}/a/${a.slug}`}>{a.title}</Link>
            </h2>
            <p className={s.dek}>{a.dek}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
