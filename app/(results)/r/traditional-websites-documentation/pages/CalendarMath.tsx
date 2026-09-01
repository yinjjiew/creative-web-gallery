"use client";

import { Calendar, Civil, Clock, Instant, Span, Zone } from "../lib/instant";
import { Doc, Example, Note, Table, Throws } from "../Prose";

export function CalendarMath() {
  return (
    <Doc slug="concepts/calendar">
      <p>
        Adding a month is not adding thirty days, and adding a day is not adding
        twenty-four hours. Instant keeps those operations on different types so
        a call site cannot mix them by accident.
      </p>

      <h2 id="two-adds">The two additions</h2>
      <Table
        cols={["Operation", "Lives on", "Unit"]}
        rows={[
          [
            <code key="a">Instant.add / Clock.addSpan</code>,
            "the timeline",
            "hours, minutes, seconds, milliseconds",
          ],
          [
            <code key="b">Civil.add / Clock.addCalendar</code>,
            "the calendar",
            "years, months, weeks, days",
          ],
        ]}
      />
      <p>
        <code>Span.of({"{"} days: 1 {"}"})</code> is a TypeScript error and a
        runtime refusal if you smuggle the field in. Days moved to Calendar in
        v2 because a “day” on a Span was the most common source of silent DST
        bugs in v1.
      </p>

      <h2 id="month-end">January 31 plus one month</h2>
      <p>
        There is no 31 February. Instant&apos;s default is to clamp to the last
        real day of the target month. That is a choice, and it is documented
        because the other common choice — overflowing into March — surprises
        people who asked for “the end of next month.”
      </p>
      <Example
        code={`Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }))`}
        run={() => Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }))}
      />
      <Example
        code={`Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 2 }))`}
        run={() => Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 2 }))}
      />
      <Example
        code={`Civil.add(
  Civil.parse("2026-01-31"),
  Calendar.of({ months: 1 }),
  "reject",
)`}
        run={() =>
          Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }), "reject")
        }
      />
      <Throws>
        <p>
          <code>overflow: "reject"</code> throws <code>InvalidCivilError</code>{" "}
          when the day does not exist. Use it when clamp would hide a mistake
          in a date the user typed.
        </p>
      </Throws>

      <h2 id="leap">29 February</h2>
      <p>
        2024 is a leap year. 2025 is not. Adding one year to 29 February 2024
        clamps to 28 February 2025. Adding four years lands on 29 February 2028.
      </p>
      <Example
        code={`Civil.add(Civil.of({ year: 2024, month: 2, day: 29 }), Calendar.of({ years: 1 }))`}
        run={() =>
          Civil.add(Civil.of({ year: 2024, month: 2, day: 29 }), Calendar.of({ years: 1 }))
        }
      />
      <Example
        code={`Civil.add(Civil.of({ year: 2024, month: 2, day: 29 }), Calendar.of({ years: 4 }))`}
        run={() =>
          Civil.add(Civil.of({ year: 2024, month: 2, day: 29 }), Calendar.of({ years: 4 }))
        }
      />
      <Example
        code={`Civil.of({ year: 2026, month: 2, day: 29 })`}
        run={() => Civil.of({ year: 2026, month: 2, day: 29 })}
      />

      <h2 id="order">Order of fields</h2>
      <p>
        Years and months are applied first, then the day is clamped, then weeks
        and days are applied as exact 24-hour steps on the civil timeline (they
        do not know about DST; they are Civil operations).{" "}
        <code>Calendar.of({"{"} months: 1, days: 1 {"}"})</code> on 31 January
        2026 is 1 March, not 29 February: clamp to 28 February, then add a day.
      </p>
      <Example
        code={`Civil.add(
  Civil.parse("2026-01-31"),
  Calendar.of({ months: 1, days: 1 }),
)`}
        run={() =>
          Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1, days: 1 }))
        }
      />

      <h2 id="clock">On a Clock</h2>
      <p>
        <code>Clock.addCalendar</code> adds on the civil fields and re-resolves
        in the same zone. That is “the same clock time on the target date.” If
        that civil time is skipped or repeated, the same{" "}
        <code>ifSkipped</code> / <code>ifAmbiguous</code> options apply, and
        they still default to reject.
      </p>
      <Example
        code={`Clock.addCalendar(
  Clock.of(Civil.parse("2026-03-28T01:30"), Zone.get("Europe/London")),
  Calendar.of({ days: 1 }),
)`}
        run={() =>
          Clock.addCalendar(
            Clock.of(Civil.parse("2026-03-28T01:30"), Zone.get("Europe/London")),
            Calendar.of({ days: 1 }),
          )
        }
      />
      <Example
        code={`Clock.addSpan(
  Clock.of(Civil.parse("2026-03-28T01:30"), Zone.get("Europe/London")),
  Span.of({ hours: 24 }),
)`}
        run={() =>
          Clock.addSpan(
            Clock.of(Civil.parse("2026-03-28T01:30"), Zone.get("Europe/London")),
            Span.of({ hours: 24 }),
          )
        }
      />
      <Note>
        <p>
          The first call asks for 01:30 on 29 March, which does not exist, and
          throws. The second call asks for 24 hours later, which does exist
          (02:30 BST). If your product means “this time tomorrow,” use
          Calendar and decide a skip policy. If it means “24 hours later,” use
          Span.
        </p>
      </Note>

      <h2 id="instant">You cannot add a month to an Instant</h2>
      <Example
        code={`Instant.add(
  Instant.parse("2026-01-31T12:00:00Z"),
  Span.of({ hours: 24 * 30 }),
)`}
        run={() =>
          Instant.add(
            Instant.parse("2026-01-31T12:00:00Z"),
            Span.of({ hours: 24 * 30 }),
          )
        }
      />
      <p>
        That is 720 hours later, which is a real Instant and the wrong answer
        to “a month later.” Convert to a Civil or a Clock in the zone the month
        is about, add a Calendar, convert back if you need an Instant.
      </p>
    </Doc>
  );
}
