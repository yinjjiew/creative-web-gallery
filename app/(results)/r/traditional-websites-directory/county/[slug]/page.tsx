import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  counties,
  countyBySlug,
  placesInCounty,
  sortForRegister,
} from "../../catalog";
import { Colophon, Honesty, Masthead, Skip } from "../../Chrome";
import { RegisterList } from "../../Register";
import s from "../../reaches.module.css";

export function generateStaticParams() {
  return counties().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = countyBySlug(slug);
  return { title: c?.name ?? "County" };
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const county = countyBySlug(slug);
  if (!county) notFound();
  const places = sortForRegister(placesInCounty(slug));

  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet="04 / 00" />
      <Honesty />
      <main id="main">
        <header className={s.pageLead}>
          <h1>{county.name}</h1>
          <p>
            {county.nation}. {places.length} reach
            {places.length === 1 ? "" : "es"} in this edition. “Near me” is a
            county list, not a map of identical pins.
          </p>
        </header>
        <RegisterList places={places} />
      </main>
      <Colophon />
    </div>
  );
}
