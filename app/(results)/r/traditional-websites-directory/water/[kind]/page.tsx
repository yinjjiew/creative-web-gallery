import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WATER_KINDS, placesOfWater, sortForRegister, watercourses } from "../../catalog";
import { WATER_LABEL } from "../../facts";
import { Colophon, Honesty, Masthead, Skip } from "../../Chrome";
import { LongSection } from "../../LongSection";
import { RegisterList } from "../../Register";
import type { WaterKind } from "../../types";
import s from "../../reaches.module.css";

export function generateStaticParams() {
  return WATER_KINDS.map((w) => ({ kind: w.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  const meta = WATER_KINDS.find((w) => w.id === kind);
  return { title: meta?.title ?? "Water" };
}

function isKind(k: string): k is WaterKind {
  return WATER_KINDS.some((w) => w.id === k);
}

export default async function WaterPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();
  const meta = WATER_KINDS.find((w) => w.id === kind)!;
  const places = sortForRegister(placesOfWater(kind));
  const courses =
    kind === "river" || kind === "lake"
      ? watercourses().filter((c) => c.places[0]?.water === kind).slice(0, 3)
      : [];

  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet="03 / 00" />
      <Honesty />
      <main id="main">
        <header className={s.pageLead}>
          <h1>{meta.title}</h1>
          <p>
            {meta.note} {places.length} in this edition. Lethal and unassessed
            first.
          </p>
        </header>
        {courses.map((c) => (
          <LongSection key={c.name} title={c.name} places={c.places} />
        ))}
        <RegisterList
          places={places}
          caption={`All ${WATER_LABEL[kind].toLowerCase()} reaches.`}
        />
      </main>
      <Colophon />
    </div>
  );
}
