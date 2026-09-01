import Link from "next/link";

import { CATALOGUE_SIZE, PLACES } from "./catalog";
import { BASE } from "./types";
import s from "./reaches.module.css";

export function Skip() {
  return (
    <a className={s.skip} href="#main">
      Skip to the register
    </a>
  );
}

export function Masthead({ sheet }: { sheet?: string }) {
  return (
    <header className={s.mast}>
      <p className={s.mastMeta}>
        <Link href={BASE} className={s.wordmark}>
          Reaches
        </Link>
        <span aria-hidden="true"> · </span>
        <span>Sheet {sheet ?? "00 / 00"}</span>
        <span aria-hidden="true"> · </span>
        <span>Edition September 2026</span>
      </p>
      <p className={s.mastSub}>A register of outdoor swimming</p>
      <nav className={s.mastNav} aria-label="Register">
        <Link href={`${BASE}/register`}>The register</Link>
        <Link href={`${BASE}/ask/child`}>With a child</Link>
        <Link href={`${BASE}/ask/mile`}>A mile</Link>
        <Link href={`${BASE}/ask/nocar`}>No car</Link>
        <Link href={`${BASE}/ask/october`}>October</Link>
      </nav>
    </header>
  );
}

export function Honesty() {
  return (
    <p className={s.honesty} role="note">
      Modelled register. {PLACES.length} records standing in for a catalogue of
      about {CATALOGUE_SIZE.toLocaleString("en-GB")}. Not official guidance. Not
      a measurement. Look at the water.
    </p>
  );
}

export function Colophon() {
  return (
    <footer className={s.colophon}>
      <p>
        Reaches is a modelled edition: names, temperatures, quality ratings and
        sheet references are invented to show how a directory should treat
        uneven, safety-critical information. They are not measurements of real
        places. Do not use this site to decide whether to get in.
      </p>
      <p>
        A swimmer’s note is a note. A sample is a sample. A blank is not
        safety. People drown in weirs that look still.
      </p>
      <p className={s.task}>
        <Link href="/tasks/traditional-websites-directory">Task</Link>
      </p>
    </footer>
  );
}
