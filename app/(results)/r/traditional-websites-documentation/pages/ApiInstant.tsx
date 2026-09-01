"use client";

import { Instant, Span } from "../lib/instant";
import { Doc, Example, Sig, Throws } from "../Prose";

export function ApiInstant() {
  return (
    <Doc slug="api/instant">
      <p>
        A point on the UTC timeline. Instant does not store a zone and will not
        perform calendar arithmetic. <code>toString</code> always ends in{" "}
        <code>Z</code>.
      </p>

      <h2 id="parse">Instant.parse</h2>
      <Sig>{"Instant.parse(input: string): Instant"}</Sig>
      <p>
        Accepts ISO-8601 with <code>Z</code> or a numeric offset. Rejects
        offset-less strings, zone brackets without an offset, and{" "}
        <code>23:59:60</code>.
      </p>
      <Throws>
        <p>
          <code>ParseError</code> if the string has no offset, names a zone
          without an offset, or is not ISO-8601. This is the v2 break — v1
          treated offset-less strings as UTC.
        </p>
      </Throws>
      <Example
        code={`Instant.parse("2026-03-29T01:30:00Z")`}
        run={() => Instant.parse("2026-03-29T01:30:00Z")}
      />
      <Example
        code={`Instant.parse("2026-03-29T02:30:00+01:00")`}
        run={() => Instant.parse("2026-03-29T02:30:00+01:00")}
      />
      <Example
        code={`Instant.parse("2026-03-29T01:30:00")`}
        run={() => Instant.parse("2026-03-29T01:30:00")}
      />
      <Example
        code={`Instant.equals(
  Instant.parse("2026-03-29T01:30:00Z"),
  Instant.parse("2026-03-29T02:30:00+01:00"),
)`}
        run={() =>
          Instant.equals(
            Instant.parse("2026-03-29T01:30:00Z"),
            Instant.parse("2026-03-29T02:30:00+01:00"),
          )
        }
      />

      <h2 id="now">Instant.now</h2>
      <Sig>{"Instant.now(): Instant"}</Sig>
      <p>
        The current Instant from the host clock. Uses <code>Date.now()</code>.
        Not used in the rest of these examples because a moving value cannot
        document itself.
      </p>

      <h2 id="fromepochms">Instant.fromEpochMs</h2>
      <Sig>{"Instant.fromEpochMs(ms: number): Instant"}</Sig>
      <Example
        code={`Instant.fromEpochMs(0)`}
        run={() => Instant.fromEpochMs(0)}
      />
      <Example
        code={`Instant.toEpochMs(Instant.parse("2026-03-29T01:30:00Z"))`}
        run={() => Instant.toEpochMs(Instant.parse("2026-03-29T01:30:00Z"))}
      />

      <h2 id="add">Instant.add</h2>
      <Sig>{"Instant.add(instant: Instant, span: Span): Instant"}</Sig>
      <p>
        Adds an exact Span. There is no <code>days</code> overload. Twenty-four
        hours later is a different Instant from “tomorrow,” and this function
        only knows the first.
      </p>
      <Example
        code={`Instant.add(
  Instant.parse("2026-03-29T01:30:00Z"),
  Span.of({ hours: 1 }),
)`}
        run={() =>
          Instant.add(Instant.parse("2026-03-29T01:30:00Z"), Span.of({ hours: 1 }))
        }
      />

      <h2 id="until">Instant.until</h2>
      <Sig>{"Instant.until(from: Instant, to: Instant): Span"}</Sig>
      <p>
        <code>to − from</code>. Negative if <code>to</code> is earlier. The
        Span is exact; it will not say “one day.”
      </p>
      <Example
        code={`Span.total(
  Instant.until(
    Instant.parse("2026-03-29T01:00:00Z"),
    Instant.parse("2026-03-29T02:30:00Z"),
  ),
  "minutes",
)`}
        run={() =>
          Span.total(
            Instant.until(
              Instant.parse("2026-03-29T01:00:00Z"),
              Instant.parse("2026-03-29T02:30:00Z"),
            ),
            "minutes",
          )
        }
      />

      <h2 id="compare">Instant.compare / Instant.equals</h2>
      <Sig>{"Instant.compare(a: Instant, b: Instant): -1 | 0 | 1\nInstant.equals(a: Instant, b: Instant): boolean"}</Sig>
      <Example
        code={`Instant.compare(
  Instant.parse("2026-03-29T01:30:00Z"),
  Instant.parse("2026-03-29T02:30:00+01:00"),
)`}
        run={() =>
          Instant.compare(
            Instant.parse("2026-03-29T01:30:00Z"),
            Instant.parse("2026-03-29T02:30:00+01:00"),
          )
        }
      />

      <h2 id="tostring">Instant.toString</h2>
      <Sig>{"Instant.toString(instant: Instant): string"}</Sig>
      <p>
        Always <code>YYYY-MM-DDTHH:mm:ss.sssZ</code> with the fractional part
        omitted when it is zero. Never emits an offset other than Z. Never
        emits a zone.
      </p>
    </Doc>
  );
}
