"use client";

import { Civil, Clock, Instant } from "../lib/instant";
import { Doc, Example, Table } from "../Prose";

export function ApiParse() {
  return (
    <Doc slug="api/parse">
      <p>
        Three parsers, one grammar, three different refusals. The string{" "}
        <code>2026-03-29T01:30:00</code> is a Civil. Adding <code>Z</code> makes
        it an Instant. Adding <code>[Europe/London]</code> makes it a Clock.
        Instant will not infer the other two.
      </p>

      <h2 id="which">Which parser</h2>
      <Table
        cols={["String", "Instant.parse", "Civil.parse", "Clock.parse"]}
        rows={[
          [
            <code key="a">2026-03-29T01:30:00Z</code>,
            "Instant",
            "ParseError",
            "ParseError (no zone)",
          ],
          [
            <code key="b">2026-03-29T02:30:00+01:00</code>,
            "Instant (same point as the row above)",
            "ParseError",
            "ParseError (no zone)",
          ],
          [
            <code key="c">2026-03-29T01:30:00</code>,
            "ParseError",
            "Civil",
            "ParseError (no zone)",
          ],
          [
            <code key="d">2026-03-29</code>,
            "ParseError",
            "Civil at midnight",
            "ParseError",
          ],
          [
            <code key="e">2026-03-29T00:30[Europe/London]</code>,
            "ParseError",
            "ParseError",
            "Clock",
          ],
          [
            <code key="f">2026-03-29T00:30:00Z[Europe/London]</code>,
            "ParseError (zone without using Clock)",
            "ParseError",
            "Clock, offset checked",
          ],
          [
            <code key="g">2026-03-29T01:30[Europe/London]</code>,
            "ParseError",
            "ParseError",
            "SkippedTimeError",
          ],
        ]}
      />

      <h2 id="examples">The refusals, run</h2>
      <Example
        code={`Instant.parse("2026-03-29T01:30:00")`}
        run={() => Instant.parse("2026-03-29T01:30:00")}
      />
      <Example
        code={`Civil.parse("2026-03-29T01:30:00Z")`}
        run={() => Civil.parse("2026-03-29T01:30:00Z")}
      />
      <Example
        code={`Clock.parse("2026-03-29T01:30:00Z")`}
        run={() => Clock.parse("2026-03-29T01:30:00Z")}
      />
      <Example
        code={`Clock.parse("2026-03-29T00:30:00Z[Europe/London]")`}
        run={() => Clock.parse("2026-03-29T00:30:00Z[Europe/London]")}
      />
      <Example
        code={`Clock.parse("2026-03-29T01:30:00Z[Europe/London]")`}
        run={() => Clock.parse("2026-03-29T01:30:00Z[Europe/London]")}
      />

      <h2 id="format">What each toString emits</h2>
      <Table
        cols={["Type", "Always", "Never"]}
        rows={[
          ["Instant", "…Z", "A numeric offset, a zone, a date-only form"],
          ["Civil", "Date and time, no offset", "Z, ±HH:mm, [Zone]"],
          ["Clock", "Civil + offset + [Zone]", "A string Instant.parse would accept"],
          ["Span", "PT…", "P1D"],
          ["Calendar", "P…Y/M/W/D", "A time part"],
        ]}
      />

      <h2 id="not">Not a parser</h2>
      <p>
        Instant will not parse <code>29/03/2026</code>,{" "}
        <code>March 29, 2026</code>, <code>next Tuesday</code>, RFC 2822, or a
        <code>Date</code> via <code>toString()</code>. Convert a Date with{" "}
        <code>Instant.fromEpochMs(date.valueOf())</code> if you mean the Instant
        it stores, and say so at the call site.
      </p>
    </Doc>
  );
}
