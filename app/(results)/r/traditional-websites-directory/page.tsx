import Link from "next/link";

import {
  ASKS,
  CATALOGUE_SIZE,
  PLACES,
  WATER_KINDS,
  counties,
  featuredDanger,
  sortForRegister,
  watercourses,
} from "./catalog";
import { Colophon, Honesty, Masthead, Skip } from "./Chrome";
import { Legend } from "./Stamp";
import { LongSection } from "./LongSection";
import { RegisterList } from "./Register";
import { BASE } from "./types";
import s from "./reaches.module.css";

export default function Home() {
  const lethal = sortForRegister(featuredDanger());
  const courses = watercourses().slice(0, 2);
  const countyRows = counties();

  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet="00 / 00" />
      <Honesty />
      <main id="main">
        <header className={s.lede}>
          <h1>Reaches</h1>
          <p className={s.standfirst}>
            A register of places to swim outdoors — rivers, lakes, lidos, tidal
            pools, stretches of coast. {PLACES.length} records in this modelled
            edition, standing in for a catalogue of about{" "}
            {CATALOGUE_SIZE.toLocaleString("en-GB")}. People drown in these
            places. A weir that looks still in August is the same weir in March.
            A blank is not an all-clear.
          </p>
        </header>

        <section className={s.asks} aria-labelledby="arrive">
          <h2 id="arrive" className={s.asksH}>
            How did you arrive
          </h2>
          <ul className={s.askGrid}>
            {ASKS.map((ask) => (
              <li key={ask.id}>
                <Link href={`${BASE}/ask/${ask.id}`}>
                  <p className={s.askTitle}>{ask.title}</p>
                  <p className={s.askLead}>{ask.lead}</p>
                </Link>
              </li>
            ))}
            <li>
              <Link href={`${BASE}/register`}>
                <p className={s.askTitle}>I know the name</p>
                <p className={s.askLead}>
                  Search the register. A single filterable list is the last
                  resort, not the front door.
                </p>
              </Link>
            </li>
          </ul>
        </section>

        <form className={s.searchForm} action={`${BASE}/register`} method="get" role="search">
          <label htmlFor="home-q" className={s.searchLabel}>
            Or type a name, a river, a county
          </label>
          <div className={s.searchRow}>
            <input
              id="home-q"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Hobb’s, Lynher, weir, Norfolk…"
              className={s.searchInput}
            />
            <button type="submit" className={s.searchGo}>
              Look up
            </button>
          </div>
        </form>

        <section className={s.waters} aria-labelledby="waters">
          <h2 id="waters" className={s.secH}>
            By the kind of water
          </h2>
          <ul className={s.waterRow}>
            {WATER_KINDS.map((w) => (
              <li key={w.id}>
                <Link href={`${BASE}/water/${w.id}`} title={w.note}>
                  {w.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {courses.map((c) => (
          <LongSection key={c.name} title={c.name} places={c.places} />
        ))}

        <section className={s.readFirst} aria-labelledby="first">
          <h2 id="first" className={s.secH}>
            Read these first
          </h2>
          <p>
            Reaches known to hold a body. They are not featured. They are the
            public part of the catalogue.
          </p>
          <RegisterList places={lethal} />
        </section>

        <section className={s.counties} aria-labelledby="counties">
          <h2 id="counties" className={s.secH}>
            By county
          </h2>
          <ul className={s.countyList}>
            {countyRows.map((c) => (
              <li key={c.slug}>
                <Link href={`${BASE}/county/${c.slug}`}>{c.name}</Link>
                <span className={s.countyN}>
                  {c.n}
                  <span className={s.vh}> reaches</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <Legend />
      </main>
      <Colophon />
    </div>
  );
}
