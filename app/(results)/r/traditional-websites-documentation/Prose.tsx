"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { href, neighbours, pageBySlug } from "./catalog";
import s from "./docs.module.css";
import {
  Calendar,
  Civil,
  Clock,
  Instant,
  Span,
  Zone,
} from "./lib/instant";

export function Kicker({ children }: { children: ReactNode }) {
  return <p className={s.kicker}>{children}</p>;
}

export function Dek({ children }: { children: ReactNode }) {
  return <p className={s.dek}>{children}</p>;
}

export function Sig({ children }: { children: ReactNode }) {
  return <pre className={s.sig}>{children}</pre>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <aside className={s.note}>
      <span className={s.label}>Note</span>
      {children}
    </aside>
  );
}

export function Throws({ children }: { children: ReactNode }) {
  return (
    <aside className={s.throws}>
      <span className={s.label}>Throws</span>
      {children}
    </aside>
  );
}

export function Since({ children }: { children: ReactNode }) {
  return (
    <aside className={s.since}>
      <span className={s.label}>Since</span>
      {children}
    </aside>
  );
}

function show(value: unknown): string {
  if (value == null) return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value !== null && "kind" in value) {
    const v = value as { kind: string };
    if (v.kind === "instant") return Instant.toString(value as never);
    if (v.kind === "civil") return Civil.toString(value as never);
    if (v.kind === "clock") return Clock.toString(value as never);
    if (v.kind === "span") return Span.toString(value as never);
    if (v.kind === "calendar") return Calendar.toString(value as never);
    if (v.kind === "zone") return Zone.toString(value as never);
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function Example({
  code,
  run,
}: {
  code: string;
  run: () => unknown;
}) {
  let ok = true;
  let text = "";
  try {
    text = show(run());
  } catch (e) {
    ok = false;
    text = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }
  return (
    <figure className={s.ex}>
      <pre>{code}</pre>
      <figcaption className={ok ? s.out : s.fail}>
        {ok ? `→ ${text}` : `✗ ${text}`}
      </figcaption>
    </figure>
  );
}

export function Table({
  cols,
  rows,
}: {
  cols: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Table">
      <table className={s.table}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ slug }: { slug: string }) {
  const { prev, next } = neighbours(slug);
  if (!prev && !next) return null;
  return (
    <nav className={s.pager} aria-label="Adjacent pages">
      {prev ? (
        <Link href={href(prev.slug)}>
          <span>Previous</span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className={s.next} href={href(next.slug)}>
          <span>Next</span>
          {next.title}
        </Link>
      ) : null}
    </nav>
  );
}

export function PageHead({ slug }: { slug: string }) {
  const page = pageBySlug(slug);
  if (!page) return null;
  return (
    <header>
      {page.section ? <Kicker>{page.section}</Kicker> : null}
      <h1>{page.title}</h1>
      <Dek>{page.blurb}</Dek>
    </header>
  );
}

export function Doc({
  slug,
  wide,
  children,
}: {
  slug: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={`${s.prose} ${wide ? s.wide : s.measure}`}>
      <PageHead slug={slug} />
      {children}
      <Pager slug={slug} />
    </article>
  );
}

export { s };
