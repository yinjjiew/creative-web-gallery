import type { Metadata } from "next";

import { PLACES } from "../catalog";
import { Colophon, Honesty, Masthead, Skip } from "../Chrome";
import { Search } from "../Search";
import { Legend } from "../Stamp";
import s from "../reaches.module.css";

export const metadata: Metadata = {
  title: "The register",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet="01 / 00" />
      <Honesty />
      <main id="main">
        <header className={s.pageLead}>
          <h1>The register</h1>
          <p>
            {PLACES.length} reaches in this edition. Lethal and unassessed
            sit above ordinary caution, so a dangerous place cannot hide in
            alphabetical calm. Search is for a name you already have.
          </p>
        </header>
        <Search initialQ={typeof q === "string" ? q : ""} />
        <Legend />
      </main>
      <Colophon />
    </div>
  );
}
