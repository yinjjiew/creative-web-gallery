"use client";

import { Calendar, Span } from "../lib/instant";
import { Doc, Example, Sig, Throws } from "../Prose";

export function ApiSpan() {
  return (
    <Doc slug="api/span">
      <p>
        A Span is an exact duration. A Calendar is years, months, weeks and
        days. Mixing them was the v1 footgun; they are separate types now.
      </p>

      <h2 id="of">Span.of</h2>
      <Sig>
        {`Span.of({
  hours?: number,
  minutes?: number,
  seconds?: number,
  millis?: number
}): Span`}
      </Sig>
      <p>
        There is no <code>days</code> field. 24 hours is{" "}
        <code>Span.of({"{"} hours: 24 {"}"})</code>, and it is 24 hours in every
        timezone.
      </p>
      <Example
        code={`Span.of({ hours: 2, minutes: 30 })`}
        run={() => Span.of({ hours: 2, minutes: 30 })}
      />
      <Example
        code={`Span.total(Span.of({ hours: 2, minutes: 30 }), "minutes")`}
        run={() => Span.total(Span.of({ hours: 2, minutes: 30 }), "minutes")}
      />

      <h2 id="parse">Span.parse</h2>
      <Sig>{"Span.parse(input: string): Span"}</Sig>
      <p>
        ISO-8601 exact form only: <code>PT2H30M</code>, <code>PT90S</code>.{" "}
        <code>P1D</code> is a Calendar, and this parser will not accept it.
      </p>
      <Throws>
        <p>
          <code>ParseError</code> for <code>P1D</code>, <code>P1M</code>, an
          empty <code>PT</code>, or any designator that is not H, M or S after
          T.
        </p>
      </Throws>
      <Example
        code={`Span.parse("PT2H30M")`}
        run={() => Span.parse("PT2H30M")}
      />
      <Example
        code={`Span.parse("P1D")`}
        run={() => Span.parse("P1D")}
      />

      <h2 id="arith">Span.add / negate / abs / total</h2>
      <Sig>
        {`Span.add(a: Span, b: Span): Span
Span.negate(span: Span): Span
Span.abs(span: Span): Span
Span.total(span: Span, unit: "hours" | "minutes" | "seconds" | "millis"): number`}
      </Sig>
      <Example
        code={`Span.add(Span.of({ hours: 1 }), Span.negate(Span.of({ minutes: 15 })))`}
        run={() => Span.add(Span.of({ hours: 1 }), Span.negate(Span.of({ minutes: 15 })))}
      />

      <h2 id="calendar">Calendar.of</h2>
      <Sig>
        {`Calendar.of({
  years?: number,
  months?: number,
  weeks?: number,
  days?: number
}): Calendar`}
      </Sig>
      <p>
        A Calendar is not a duration. It is a recipe for Civil.add. Two Calendars
        are not added to each other; apply them in sequence if you need to.
      </p>
      <Example
        code={`Calendar.toString(Calendar.of({ months: 1, days: 2 }))`}
        run={() => Calendar.toString(Calendar.of({ months: 1, days: 2 }))}
      />

      <h2 id="tostring">toString</h2>
      <p>
        Span emits <code>PT…</code>. Calendar emits <code>P…</code> without a
        time part. Zero is <code>PT0S</code> and <code>P0D</code>.
      </p>
    </Doc>
  );
}
