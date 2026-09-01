import { notFound } from "next/navigation";

import { Colophon, Masthead, Skip, Stay } from "../../Chrome";
import {
  Diagram,
  Dispatch,
  Essay,
  Feature,
  Interview,
} from "../../Formats";
import { Progress } from "../../Progress";
import {
  FORMAT_LABEL,
  articleBySlug,
  articles,
  related,
  sections,
} from "../../catalog";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return { title: "Works" };
  return {
    title: `${article.title} — Works`,
    description: article.dek,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const { issueMates, sectionMates } = related(article);
  const sectionTitle =
    sections.find((sec) => sec.id === article.section)?.title ?? article.section;

  let body;
  if (article.format === "feature") body = <Feature article={article} />;
  else if (article.format === "dispatch") body = <Dispatch article={article} />;
  else if (article.format === "essay") body = <Essay article={article} />;
  else if (article.format === "diagram") body = <Diagram article={article} />;
  else body = <Interview article={article} />;

  return (
    <>
      <Skip />
      {article.format === "feature" ? <Progress /> : null}
      <Masthead issue={article.issue} compact />
      <main id="main">{body}</main>
      <Stay
        issueN={article.issue}
        sectionTitle={sectionTitle}
        issueMates={issueMates.map((a) => ({
          slug: a.slug,
          title: a.title,
          format: FORMAT_LABEL[a.format],
        }))}
        sectionMates={sectionMates.map((a) => ({
          slug: a.slug,
          title: a.title,
          format: FORMAT_LABEL[a.format],
        }))}
      />
      <Colophon />
    </>
  );
}
