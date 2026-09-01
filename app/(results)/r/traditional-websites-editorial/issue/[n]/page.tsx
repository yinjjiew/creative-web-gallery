import Link from "next/link";
import { notFound } from "next/navigation";

import { Colophon, Masthead, Skip } from "../../Chrome";
import {
  BASE,
  FORMAT_LABEL,
  articlesInIssue,
  issueByN,
  issues,
} from "../../catalog";
import s from "../../works.module.css";

export function generateStaticParams() {
  return issues.map((i) => ({ n: String(i.n) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const issue = issueByN(Number(n));
  if (!issue) return { title: "Works" };
  return {
    title: `Issue ${issue.n} — Works`,
    description: issue.note,
  };
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const issue = issueByN(Number(n));
  if (!issue) notFound();
  const list = articlesInIssue(issue.n);

  return (
    <>
      <Skip />
      <Masthead issue={issue.n} compact />
      <main id="main" className={s.page}>
        <header className={s.pageHead}>
          <p className={s.fmt}>
            Issue {issue.n} · {issue.season}
          </p>
          <h1>{issue.title}</h1>
          <p>{issue.note}</p>
        </header>
        <ol className={s.index}>
          {list.map((a) => (
            <li key={a.slug}>
              <p className={s.fmt}>{FORMAT_LABEL[a.format]}</p>
              <h2>
                <Link href={`${BASE}/a/${a.slug}`}>{a.title}</Link>
              </h2>
              <p className={s.dek}>{a.dek}</p>
            </li>
          ))}
        </ol>
      </main>
      <Colophon />
    </>
  );
}
