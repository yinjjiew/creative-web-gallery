"use client";

import Link from "next/link";

import { href } from "../catalog";
import { Doc, Table } from "../Prose";

export function ApiIndex() {
  return (
    <Doc slug="api">
      <p>
        Each type is a small namespace of functions. There are no methods on
        instances and no mutation. Errors are subclasses of{" "}
        <code>InstantError</code> and are listed on the page that throws them.
      </p>
      <Table
        cols={["Type", "Job", "Page"]}
        rows={[
          [
            <code key="i">Instant</code>,
            "A point on the UTC timeline",
            <Link key="l" href={href("api/instant")}>
              Instant
            </Link>,
          ],
          [
            <code key="c">Civil</code>,
            "Calendar fields, no zone",
            <Link key="l" href={href("api/civil")}>
              Civil
            </Link>,
          ],
          [
            <code key="k">Clock</code>,
            "Civil in a Zone",
            <Link key="l" href={href("api/clock")}>
              Clock
            </Link>,
          ],
          [
            <code key="s">Span</code>,
            "Exact duration",
            <Link key="l" href={href("api/span")}>
              Span and Calendar
            </Link>,
          ],
          [
            <code key="a">Calendar</code>,
            "Years, months, weeks, days",
            <Link key="l" href={href("api/span")}>
              Span and Calendar
            </Link>,
          ],
          [
            <code key="z">Zone</code>,
            "IANA id and its offsets",
            <Link key="l" href={href("api/zone")}>
              Zone
            </Link>,
          ],
        ]}
      />

      <h2 id="errors">Errors</h2>
      <Table
        cols={["Name", "When"]}
        rows={[
          [<code key="p">ParseError</code>, "The string is the wrong shape for that parser"],
          [<code key="i">InvalidCivilError</code>, "The fields are not a real date or time of day"],
          [<code key="u">UnknownZoneError</code>, "Zone.get was given an id this build does not have"],
          [<code key="s">SkippedTimeError</code>, "Clock.of hit a gap and ifSkipped is reject"],
          [
            <code key="a">AmbiguousTimeError</code>,
            "Clock.of hit an overlap and ifAmbiguous is reject. Carries both Instants.",
          ],
        ]}
      />

      <h2 id="read">How to read an API page</h2>
      <p>
        A signature, then what it will not do, then the cases that throw, then
        examples that include a daylight-saving boundary where one exists. The
        result line under each example is produced by running the same function
        in this page. If it says it throws, it threw.
      </p>

      <h2 id="at-eleven">If you are here at eleven</h2>
      <ul>
        <li>
          A local time that “should exist”:{" "}
          <Link href={href("api/clock")}>Clock.of</Link>
        </li>
        <li>
          Convert UTC to a city:{" "}
          <Link href={href("api/clock")}>Clock.at</Link>
        </li>
        <li>
          Parse failed: <Link href={href("api/parse")}>Parse and format</Link>
        </li>
        <li>
          Something broke after upgrading:{" "}
          <Link href={href("migrate/v2")}>v1 → v2</Link>
        </li>
      </ul>
    </Doc>
  );
}
