import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PLACES, bySlug } from "../../catalog";
import { Colophon, Honesty, Masthead, Skip } from "../../Chrome";
import { Entry } from "../../Entry";
import s from "../../reaches.module.css";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = bySlug(slug);
  return { title: place?.name ?? "Reach" };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = bySlug(slug);
  if (!place) notFound();

  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet={place.sheet} />
      <Honesty />
      <main id="main">
        <Entry place={place} />
      </main>
      <Colophon />
    </div>
  );
}
