"use client";

import { Calendar, Civil } from "../lib/instant";
import { Doc, Example, Sig, Throws } from "../Prose";

export function ApiCivil() {
  return (
    <Doc slug="api/civil">
      <p>
        The numbers a wall clock and a calendar show. Civil has no timezone and
        will not acquire one. Date-only strings are midnight, not “the whole
        day” — Instant has no date-without-time type.
      </p>

      <h2 id="of">Civil.of</h2>
      <Sig>
        {`Civil.of({
  year, month, day,
  hour?: 0, minute?: 0, second?: 0, milli?: 0
}): Civil`}
      </Sig>
      <p>
        Month is 1–12. Day is 1–last-real-day. Hour 0–23. There is no 24:00
        and no 23:59:60.
      </p>
      <Throws>
        <p>
          <code>InvalidCivilError</code> for 31 April, 29 February in a common
          year, hour 24, or a non-integer field.
        </p>
      </Throws>
      <Example
        code={`Civil.of({ year: 2026, month: 3, day: 29, hour: 1, minute: 30 })`}
        run={() => Civil.of({ year: 2026, month: 3, day: 29, hour: 1, minute: 30 })}
      />
      <Example
        code={`Civil.of({ year: 2026, month: 2, day: 29 })`}
        run={() => Civil.of({ year: 2026, month: 2, day: 29 })}
      />

      <h2 id="parse">Civil.parse</h2>
      <Sig>{"Civil.parse(input: string): Civil"}</Sig>
      <p>
        ISO without offset and without a zone in brackets.{" "}
        <code>2026-03-29</code> is <code>2026-03-29T00:00:00</code>.
      </p>
      <Throws>
        <p>
          <code>ParseError</code> if the string includes <code>Z</code>, a
          numeric offset, or <code>[Europe/London]</code>. Those belong to
          Instant.parse and Clock.parse.
        </p>
      </Throws>
      <Example
        code={`Civil.parse("2026-03-29T01:30")`}
        run={() => Civil.parse("2026-03-29T01:30")}
      />
      <Example
        code={`Civil.parse("2026-03-29")`}
        run={() => Civil.parse("2026-03-29")}
      />
      <Example
        code={`Civil.parse("2026-03-29T01:30:00Z")`}
        run={() => Civil.parse("2026-03-29T01:30:00Z")}
      />

      <h2 id="add">Civil.add</h2>
      <Sig>
        {`Civil.add(
  civil: Civil,
  calendar: Calendar,
  overflow?: "clamp" | "reject" = "clamp"
): Civil`}
      </Sig>
      <p>
        Years and months first, then clamp or reject the day, then add weeks
        and days as 24-hour civil steps. See Adding a month for the January 31
        cases.
      </p>
      <Example
        code={`Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }))`}
        run={() => Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }))}
      />
      <Example
        code={`Civil.add(Civil.parse("2024-02-29"), Calendar.of({ years: 1 }))`}
        run={() => Civil.add(Civil.parse("2024-02-29"), Calendar.of({ years: 1 }))}
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

      <h2 id="with">Civil.with</h2>
      <Sig>
        {`Civil.with(
  civil: Civil,
  parts: Partial<CivilFields>,
  overflow?: "clamp" | "reject" = "clamp"
): Civil`}
      </Sig>
      <Example
        code={`Civil.with(Civil.parse("2026-01-31"), { month: 2 })`}
        run={() => Civil.with(Civil.parse("2026-01-31"), { month: 2 })}
      />

      <h2 id="untildays">Civil.untilDays</h2>
      <Sig>{"Civil.untilDays(from: Civil, to: Civil): number"}</Sig>
      <p>
        Whole midnights between the two dates, using the civil calendar, not
        elapsed time. Time-of-day fields are ignored.
      </p>
      <Example
        code={`Civil.untilDays(Civil.parse("2026-03-29"), Civil.parse("2026-04-01"))`}
        run={() => Civil.untilDays(Civil.parse("2026-03-29"), Civil.parse("2026-04-01"))}
      />

      <h2 id="dayofweek">Civil.dayOfWeek</h2>
      <Sig>{"Civil.dayOfWeek(civil: Civil): 1 | 2 | 3 | 4 | 5 | 6 | 7"}</Sig>
      <p>ISO-8601. Monday is 1, Sunday is 7.</p>
      <Example
        code={`Civil.dayOfWeek(Civil.parse("2026-03-29"))`}
        run={() => Civil.dayOfWeek(Civil.parse("2026-03-29"))}
      />

      <h2 id="tostring">Civil.toString</h2>
      <Sig>{"Civil.toString(civil: Civil): string"}</Sig>
      <p>
        Always includes the time. Date-only values print as midnight. No
        offset, no zone.
      </p>
    </Doc>
  );
}
