import Link from "next/link";
import { notFound } from "next/navigation";

import { Colophon, Masthead, Skip } from "../../Chrome";
import {
  BASE,
  FORMAT_LABEL,
  articlesInSection,
  sectionById,
  sections,
} from "../../catalog";
import s from "../../works.module.css";

export function generateStaticParams() {
  return sections.map((sec) => ({ id: sec.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sec = sectionById(id);
  if (!sec) return { title: "Works" };
  return { title: `${sec.title} — Works`, description: sec.stand };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sec = sectionById(id);
  if (!sec) notFound();
  const list = articlesInSection(sec.id);

  return (
    <>
      <Skip />
      <Masthead compact />
      <main id="main" className={s.page}>
        <header className={s.pageHead}>
          <p className={s.fmt}>Section</p>
          <h1>{sec.title}</h1>
          <p>{sec.stand}</p>
        </header>
        <ol className={s.index}>
          {list.map((a) => (
            <li key={a.slug}>
              <p className={s.fmt}>
                No. {a.issue} · {FORMAT_LABEL[a.format]}
              </p>
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
