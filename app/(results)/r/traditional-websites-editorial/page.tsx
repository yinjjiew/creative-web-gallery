import Link from "next/link";

import { Colophon, Masthead, Skip } from "./Chrome";
import {
  BASE,
  FORMAT_LABEL,
  articleBySlug,
  articles,
  articlesInIssue,
  issues,
} from "./catalog";
import s from "./works.module.css";

const LEAD = "what-the-river-becomes";
const SECOND = "still-live";
const THIRD = "the-outfall";
const ALSO = ["sixty-seconds", "the-box-is-the-job"];

export default function Front() {
  const issue = issues[0];
  const lead = articleBySlug(LEAD)!;
  const second = articleBySlug(SECOND)!;
  const third = articleBySlug(THIRD)!;
  const also = ALSO.map((slug) => articleBySlug(slug)!);
  const rest = articles.filter(
    (a) => a.issue !== issue.n && ![LEAD, SECOND, THIRD, ...ALSO].includes(a.slug),
  );
  const inIssue = articlesInIssue(issue.n);

  return (
    <>
      <Skip />
      <Masthead issue={issue.n} />
      <main id="main" className={s.front}>
        <section className={s.argument} aria-labelledby="issue-title">
          <p className={s.argKicker}>
            Issue {issue.n} · {issue.season}
          </p>
          <h1 id="issue-title">{issue.title}</h1>
          <p className={s.argNote}>{issue.note}</p>
          <p className={s.argMeta}>
            {inIssue.length} pieces ·{" "}
            <Link href={`${BASE}/issue/${issue.n}`}>The issue in full</Link>
          </p>
        </section>

        <section className={s.broadsheet} aria-label="This issue">
          <article className={s.lead}>
            <p className={s.fmt}>
              {FORMAT_LABEL[lead.format]} · {lead.section}
            </p>
            <h2>
              <Link href={`${BASE}/a/${lead.slug}`}>{lead.title}</Link>
            </h2>
            <p className={s.dek}>{lead.dek}</p>
            <p className={s.by}>
              {lead.byline} · {lead.words.toLocaleString("en-GB")} words
            </p>
          </article>

          <div className={s.stack}>
            <article>
              <p className={s.fmt}>
                {FORMAT_LABEL[second.format]} · {second.section}
              </p>
              <h2>
                <Link href={`${BASE}/a/${second.slug}`}>{second.title}</Link>
              </h2>
              <p className={s.dek}>{second.dek}</p>
            </article>
            <article>
              <p className={s.fmt}>
                {FORMAT_LABEL[third.format]} · {third.section}
              </p>
              <h2>
                <Link href={`${BASE}/a/${third.slug}`}>{third.title}</Link>
              </h2>
              <p className={s.dek}>{third.dek}</p>
            </article>
          </div>
        </section>

        <section className={s.also} aria-label="Also in this issue">
          <h2>Also in this issue</h2>
          <ul>
            {also.map((a) => (
              <li key={a.slug}>
                <span>{FORMAT_LABEL[a.format]}</span>
                <Link href={`${BASE}/a/${a.slug}`}>{a.title}</Link>
                <em>{a.dek}</em>
              </li>
            ))}
          </ul>
        </section>

        <section className={s.fromArchive} aria-label="From the archive">
          <h2>
            From the <Link href={`${BASE}/archive`}>archive</Link>
          </h2>
          <ol>
            {rest.map((a) => (
              <li key={a.slug}>
                <span>
                  No. {a.issue} · {FORMAT_LABEL[a.format]}
                </span>
                <Link href={`${BASE}/a/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Colophon />
    </>
  );
}
