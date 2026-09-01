import Link from "next/link";

import { BASE, issues, sections } from "./catalog";
import s from "./works.module.css";

export function Skip() {
  return (
    <a className={s.skip} href="#main">
      Skip to reading
    </a>
  );
}

export function Masthead({
  issue,
  compact,
}: {
  issue?: number;
  compact?: boolean;
}) {
  const current = issue ?? issues[0].n;
  const rec = issues.find((i) => i.n === current) ?? issues[0];
  return (
    <header className={compact ? `${s.mast} ${s.mastCompact}` : s.mast}>
      <div className={s.mastTop}>
        <p className={s.kicker}>
          <Link href={BASE}>A quarterly on infrastructure</Link>
        </p>
        <p className={s.issueFlag}>
          <Link href={`${BASE}/issue/${rec.n}`}>
            Issue {rec.n} · {rec.season}
          </Link>
        </p>
      </div>
      <p className={s.wordmark}>
        <Link href={BASE}>Works</Link>
      </p>
      <nav className={s.nav} aria-label="Publication">
        {sections.map((sec) => (
          <Link key={sec.id} href={`${BASE}/s/${sec.id}`}>
            {sec.title}
          </Link>
        ))}
        <Link href={`${BASE}/archive`}>Archive</Link>
      </nav>
    </header>
  );
}

export function Colophon() {
  return (
    <footer className={s.colophon}>
      <p>
        <em>Works</em> is a sample publication written for this gallery.
        Reporting is drawn from public records, regulator documents and
        standard engineering practice. Named plants, ports and networks are
        real. Access, dialogue and some shift detail are reconstructed, and
        are marked where they are. Figures presented as measurements are
        taken from published sources or labelled as typical.
      </p>
      <p className={s.escape}>
        <Link href="/tasks/traditional-websites-editorial">Brief</Link>
      </p>
    </footer>
  );
}

export function Stay({
  issueMates,
  sectionMates,
  sectionTitle,
  issueN,
}: {
  issueMates: { slug: string; title: string; format: string }[];
  sectionMates: { slug: string; title: string; format: string }[];
  sectionTitle: string;
  issueN: number;
}) {
  return (
    <aside className={s.stay} aria-label="Continue reading">
      {issueMates.length > 0 && (
        <div>
          <h2>
            Also in{" "}
            <Link href={`${BASE}/issue/${issueN}`}>issue {issueN}</Link>
          </h2>
          <ul>
            {issueMates.map((a) => (
              <li key={a.slug}>
                <span>{a.format}</span>
                <Link href={`${BASE}/a/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sectionMates.length > 0 && (
        <div>
          <h2>More in {sectionTitle}</h2>
          <ul>
            {sectionMates.map((a) => (
              <li key={a.slug}>
                <span>{a.format}</span>
                <Link href={`${BASE}/a/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
