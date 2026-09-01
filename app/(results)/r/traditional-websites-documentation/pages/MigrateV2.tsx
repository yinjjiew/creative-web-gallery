"use client";

import { Instant } from "../lib/instant";
import { Doc, Example, Table } from "../Prose";

export function MigrateV2() {
  return (
    <Doc slug="migrate/v2">
      <p>
        Released as 2.0.0. Three breaks, all in parse and construction. Clock
        and Zone are new in 2.0; they have no v1 equivalent to migrate.
      </p>

      <h2 id="parse">Instant.parse no longer accepts offset-less strings</h2>
      <p>
        v1 treated <code>2026-03-29T01:30:00</code> as UTC. That hid Civils in
        Instant-shaped variables and made every DST bug undiagnosable. v2
        throws.
      </p>
      <Table
        cols={["v1", "v2"]}
        rows={[
          [
            <code key="a">{`Instant.parse("2026-03-29T01:30:00")`}</code>,
            <code key="b">{`Instant.parse("2026-03-29T01:30:00Z")`}</code>,
          ],
          [
            "same call, meant a wall time",
            <code key="c">{`Civil.parse("2026-03-29T01:30:00")`}</code>,
          ],
          [
            "same call, meant local-in-a-zone",
            <code key="d">{`Clock.parse("2026-03-29T01:30:00[Europe/London]")`}</code>,
          ],
        ]}
      />
      <Example
        code={`Instant.parse("2026-03-29T01:30:00")`}
        run={() => Instant.parse("2026-03-29T01:30:00")}
      />
      <p>
        A mechanical fix when you really did mean UTC: append <code>Z</code>.
        Grep for <code>Instant.parse(</code> and look at every literal and every
        concatenated string. If the value came from{" "}
        <code>&lt;input type="datetime-local"&gt;</code>, it is a Civil.
      </p>

      <h2 id="span-days">Span no longer accepts days</h2>
      <Table
        cols={["v1", "v2"]}
        rows={[
          [
            <code key="a">{`Span.of({ days: 1 })`}</code>,
            <code key="b">{`Span.of({ hours: 24 })`}</code>,
          ],
          [
            "meant a calendar day",
            <code key="c">{`Calendar.of({ days: 1 })`}</code>,
          ],
          [
            <code key="d">{`Instant.add(i, Span.of({ days: 1 }))`}</code>,
            "24 hours, or convert to Clock and Clock.addCalendar",
          ],
        ]}
      />
      <p>
        <code>Span.parse("P1D")</code> also throws. Use{" "}
        <code>Calendar.of({"{"} days: 1 {"}"})</code>.
      </p>

      <h2 id="fromdate">fromDate is explicit</h2>
      <p>
        v1 <code>Instant.fromDate(date)</code> used the host timezone when the
        Date had been constructed from local fields, and UTC when it had not —
        which is to say, it inherited Date&apos;s confusion. v2 removed it.
      </p>
      <Table
        cols={["v1", "v2"]}
        rows={[
          [
            <code key="a">{`Instant.fromDate(date)`}</code>,
            <code key="b">{`Instant.fromEpochMs(date.valueOf())`}</code>,
          ],
          [
            "you wanted the local civil fields",
            "Read the fields yourself and Civil.of, then Clock.of in a zone you name",
          ],
        ]}
      />

      <h2 id="checklist">Checklist</h2>
      <ul>
        <li>
          Every <code>Instant.parse</code> argument ends in <code>Z</code> or
          <code>±HH:mm</code>.
        </li>
        <li>
          Every <code>Span.of</code> / <code>Span.parse</code> uses H, M, S only.
        </li>
        <li>
          No remaining <code>fromDate</code>.
        </li>
        <li>
          Calendar-day arithmetic goes through Civil or Clock, not Instant.
        </li>
        <li>
          Tests that expected Instant.parse to accept a naive ISO now expect
          ParseError — that is the point.
        </li>
      </ul>
    </Doc>
  );
}
