"use client";

import Link from "next/link";

import { href } from "../catalog";
import s from "../docs.module.css";

const DOORS = [
  {
    who: "Integrating",
    what: "Install, the one idea, a working Clock, and the first daylight-saving error.",
    slug: "start",
  },
  {
    who: "Looking one up",
    what: "Signatures, what throws, tables for the awkward cases. Organised to leave in ten seconds.",
    slug: "api",
  },
  {
    who: "Deciding",
    what: "What Instant will not do, and will not grow to do.",
    slug: "limits",
  },
  {
    who: "Upgrading",
    what: "v1 → v2 broke Instant.parse. v2.0 → v2.1 did not.",
    slug: "migrate",
  },
] as const;

export function Home() {
  return (
    <div className={`${s.home} ${s.wide}`}>
      <h1>Instant</h1>
      <p className={s.lede}>
        A library for dates, times, and timezones. This is the documentation —
        not a product page. Type <kbd>/</kbd> or use the field above. Search is
        how these pages are meant to be used.
      </p>
      <ol className={s.doors}>
        {DOORS.map((d) => (
          <li key={d.slug}>
            <Link href={href(d.slug)}>
              <span className={s.doorWho}>{d.who}</span>
              <span className={s.doorWhat}>{d.what}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className={s.thesis}>
        An <i>Instant</i> is a point on the UTC timeline. A <i>Civil</i> is a
        calendar label — year, month, day, hour — with no idea where on Earth
        it is. A <i>Clock</i> is a Civil nailed to a timezone. JavaScript&apos;s{" "}
        <code>Date</code> is all three at once. That is why the bugs happen.
      </p>
      <table className={s.split}>
        <thead>
          <tr>
            <th>You have</th>
            <th>You want</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A log timestamp, a database <code>timestamptz</code></td>
            <td>
              <Link href={href("api/instant")}>Instant</Link>
            </td>
          </tr>
          <tr>
            <td>A birthday, a due date, “meet at 09:30”</td>
            <td>
              <Link href={href("api/civil")}>Civil</Link>
            </td>
          </tr>
          <tr>
            <td>A flight, a meeting, a store opening in a real place</td>
            <td>
              <Link href={href("api/clock")}>Clock</Link>
            </td>
          </tr>
          <tr>
            <td>Elapsed time: two hours, 90 seconds</td>
            <td>
              <Link href={href("api/span")}>Span</Link>
            </td>
          </tr>
          <tr>
            <td>Calendar time: a month, a week, tomorrow</td>
            <td>
              <Link href={href("api/span")}>Calendar</Link>
            </td>
          </tr>
        </tbody>
      </table>
      <p className={s.fine}>
        Instant 2.1. The API on these pages is implemented in this documentation
        and the examples run against it. Zones used in examples are the ones
        this build ships; a production Instant ships the IANA database.
      </p>
    </div>
  );
}
