import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ASKS,
  PLACES,
  askById,
  askUnmeasured,
  matchesAsk,
  sortForRegister,
} from "../../catalog";
import { Colophon, Honesty, Masthead, Skip } from "../../Chrome";
import { RegisterList } from "../../Register";
import type { AskId } from "../../types";
import s from "../../reaches.module.css";

export function generateStaticParams() {
  return ASKS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ask = askById(id);
  return { title: ask?.title ?? "Ask" };
}

export default async function AskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ask = askById(id);
  if (!ask) notFound();

  const matched = sortForRegister(PLACES.filter((p) => matchesAsk(p, ask.id)));
  const unknown = sortForRegister(
    PLACES.filter((p) => askUnmeasured(p, ask.id as AskId)),
  );

  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet="02 / 00" />
      <Honesty />
      <main id="main">
        <header className={s.pageLead}>
          <h1>{ask.title}</h1>
          <p>{ask.lead}</p>
          <p className={s.rule}>{ask.rule}</p>
        </header>
        <RegisterList
          places={matched}
          caption={
            matched.length
              ? `${matched.length} reach${matched.length === 1 ? "" : "es"} that meet the rule.`
              : undefined
          }
        />
        {unknown.length ? (
          <section className={s.unmeasured} aria-labelledby="unknown">
            <h2 id="unknown" className={s.secH}>
              Not recorded for this question
            </h2>
            <p>
              These reaches do not have the facts this question needs. They are
              not hidden, and they are not offered as an answer. A missing
              length is not a mile. An unassessed hazard is not suitable for a
              child.
            </p>
            <RegisterList places={unknown} />
          </section>
        ) : null}
      </main>
      <Colophon />
    </div>
  );
}
