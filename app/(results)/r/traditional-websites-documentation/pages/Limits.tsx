"use client";

import Link from "next/link";

import { href } from "../catalog";
import { Doc, Table } from "../Prose";

export function Limits() {
  return (
    <Doc slug="limits">
      <p>
        Instant is small on purpose. Several things people expect from a “date
        library” are missing, and they are missing so that the types stay
        honest. If you need one of them, use the thing that already does it
        well — do not wait for Instant to grow a worse version.
      </p>

      <h2 id="relative-time">Relative time</h2>
      <p>
        Instant will not emit “2 hours ago” or “in 3 days.” Those strings are a
        locale problem and a rounding problem. Compute a Span with{" "}
        <code>Instant.until</code>, then pass it to{" "}
        <code>Intl.RelativeTimeFormat</code>.
      </p>

      <h2 id="natural-language">Natural language</h2>
      <p>
        No parser for “next Tuesday,” “in two weeks,” or “end of the month.”
        Those phrases are ambiguous in exactly the way Instant refuses to be
        (whose Tuesday, which month-end rule, which zone). Write the Civil you
        mean.
      </p>

      <h2 id="locale">Locale-aware formatting</h2>
      <p>
        <code>toString</code> is ISO. For “29 March 2026, 01:30 BST” use{" "}
        <code>Intl.DateTimeFormat</code> on <code>Clock.toInstant</code> with
        the zone id in <code>timeZone</code>. Instant will not wrap Intl. It
        also will not guess a locale from the zone.
      </p>

      <h2 id="calendars">Other calendars</h2>
      <p>
        Instant is the proleptic Gregorian calendar, ISO week days, ISO month
        numbers. No Hijri, Hebrew, Chinese, Julian, or Discordian calendar. Civil
        fields are Gregorian fields. If you need another calendar, keep Instant
        for the Instant and convert at the edge.
      </p>

      <h2 id="recurrence">Recurrence</h2>
      <p>
        No RRULE, no “every second Thursday,” no business-day calendars, no
        holidays. A recurring meeting is a Clock plus a rule you own. Adding
        <code>Calendar.of({"{"} weeks: 2 {"}"})</code> in a loop is fine; a
        holiday table is not Instant&apos;s to ship.
      </p>

      <h2 id="leap-seconds">Leap seconds</h2>
      <p>
        Instant is Unix time. Leap seconds are not represented.{" "}
        <code>23:59:60</code> is a <code>ParseError</code>. Two Instants one
        second apart on either side of a leap second are still 1000 ms apart in
        <code>Instant.until</code>. If you need TAI, you are not Instant&apos;s
        audience.
      </p>

      <h2 id="guessing">Guessing</h2>
      <p>Instant will not:</p>
      <ul>
        <li>Treat an offset-less ISO string as UTC or as local.</li>
        <li>Infer a zone from an offset (<code>+01:00</code> is many places).</li>
        <li>Use the host timezone when you omitted one.</li>
        <li>Pick earlier or later on a DST fold unless you pass the option.</li>
        <li>Parse a <code>Date</code>&apos;s locale string.</li>
        <li>Mutate a value you already hold.</li>
      </ul>

      <h2 id="instead">If you need</h2>
      <Table
        cols={["Need", "Use"]}
        rows={[
          ["Pretty local formatting", <code key="a">Intl.DateTimeFormat</code>],
          ["“2 hours ago”", <code key="b">Intl.RelativeTimeFormat</code>],
          ["Calendar other than Gregorian", "A calendar library; keep Instant for the Instant"],
          ["Recurring events", "A recurrence library, feeding it Clocks"],
          ["Natural-language parse", "Do not. Collect a Civil from a form."],
          [
            "Full IANA in this docs build",
            <Link key="c" href={href("concepts/zones")}>
              Only the zones the examples use
            </Link>,
          ],
        ]}
      />
    </Doc>
  );
}
