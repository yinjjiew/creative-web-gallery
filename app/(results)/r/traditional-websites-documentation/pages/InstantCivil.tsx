"use client";

import Link from "next/link";

import { href } from "../catalog";
import { Calendar, Civil, Clock, Instant, Span, Zone } from "../lib/instant";
import { Doc, Example, Note, Table } from "../Prose";

export function InstantCivil() {
  return (
    <Doc slug="concepts/instant-civil">
      <p>
        People say “date” and mean at least three things: a day on a calendar, a
        time of day on a wall, and a point in the history of the universe.
        JavaScript&apos;s <code>Date</code> stores the third and pretends it is
        the first two. Instant splits them on purpose.
      </p>

      <h2 id="instant">Instant</h2>
      <p>
        An Instant is a millisecond offset from the Unix epoch, in UTC. It does
        not have a timezone because a point does not need one. “When did the
        server write this row?” is an Instant. “When does the store open?” is
        not.
      </p>
      <Example
        code={`Instant.parse("2026-03-29T01:30:00Z")`}
        run={() => Instant.parse("2026-03-29T01:30:00Z")}
      />
      <Example
        code={`Instant.parse("2026-03-29T02:30:00+01:00")`}
        run={() => Instant.parse("2026-03-29T02:30:00+01:00")}
      />
      <p>
        Those two strings name the same Instant. The offset on the second one is
        a way of writing the point, not a zone the Instant remembers.
      </p>
      <Note>
        <p>
          Instant arithmetic is only exact. Hours, minutes, seconds, milliseconds.
          A “day” is not exact: some are 23 hours long, some 25.{" "}
          <code>Instant.add</code> will not take one.
        </p>
      </Note>

      <h2 id="civil">Civil</h2>
      <p>
        A Civil is the fields a wall clock and a calendar would show, with no
        claim about where. Birthdays are Civil. So is “the meeting is at 09:30”
        when you have not yet said in which city. So is a date that a legislature
        printed on a statute.
      </p>
      <Example
        code={`Civil.parse("2026-03-29T01:30")`}
        run={() => Civil.parse("2026-03-29T01:30")}
      />
      <p>
        That value exists even on the morning London skips 01:30. It is a label.
        It becomes a problem only when you ask Instant to treat it as a point.
      </p>

      <h2 id="clock">Clock</h2>
      <p>
        A Clock is the combination: this Civil, in this Zone, at this offset.
        The offset is derived, not chosen. If the Civil cannot occur in that
        Zone, <code>Clock.of</code> throws. If it occurs twice, it throws. You
        can opt into a policy; you cannot opt into a guess.
      </p>
      <Example
        code={`Clock.at(
  Instant.parse("2026-03-29T01:30:00Z"),
  Zone.get("Europe/London"),
)`}
        run={() =>
          Clock.at(
            Instant.parse("2026-03-29T01:30:00Z"),
            Zone.get("Europe/London"),
          )
        }
      />
      <Example
        code={`Clock.at(
  Instant.parse("2026-03-29T01:30:00Z"),
  Zone.get("America/New_York"),
)`}
        run={() =>
          Clock.at(
            Instant.parse("2026-03-29T01:30:00Z"),
            Zone.get("America/New_York"),
          )
        }
      />

      <h2 id="which">Which type</h2>
      <Table
        cols={["Question", "Type", "Why"]}
        rows={[
          [
            "When was this event, really?",
            "Instant",
            "A point. Store it. Compare it. Do not format it as a local time unless you pick a zone.",
          ],
          [
            "What date is printed on the ticket?",
            "Civil",
            "The ticket does not change if Parliament moves the clocks.",
          ],
          [
            "What time does the shop unlock in Leeds?",
            "Clock",
            "A civil time plus Europe/London. On a DST boundary you must say what you mean.",
          ],
          [
            "How long did the request take?",
            "Span",
            "Elapsed time. Not a day, not a month.",
          ],
          [
            "The invoice is due in a month.",
            "Calendar + Civil",
            "Months have uneven length. See Adding a month.",
          ],
        ]}
      />

      <h2 id="twenty-four">Twenty-four hours is not a day</h2>
      <p>
        On 29 March 2026 in London the civil day is 23 hours long. Adding
        twenty-four hours to 00:30 GMT lands at 01:30 GMT, which on the wall is
        02:30 BST. Adding one calendar day lands at 00:30 the next morning,
        still “the same time” on the clock.
      </p>
      <Example
        code={`const start = Clock.of(
  Civil.parse("2026-03-29T00:30"),
  Zone.get("Europe/London"),
)
Clock.addSpan(start, Span.of({ hours: 24 }))`}
        run={() =>
          Clock.addSpan(
            Clock.of(Civil.parse("2026-03-29T00:30"), Zone.get("Europe/London")),
            Span.of({ hours: 24 }),
          )
        }
      />
      <Example
        code={`const start = Clock.of(
  Civil.parse("2026-03-29T00:30"),
  Zone.get("Europe/London"),
)
Clock.addCalendar(start, Calendar.of({ days: 1 }))`}
        run={() =>
          Clock.addCalendar(
            Clock.of(Civil.parse("2026-03-29T00:30"), Zone.get("Europe/London")),
            Calendar.of({ days: 1 }),
          )
        }
      />
      <p>
        Both answers are correct. They are answers to different questions. The
        library&apos;s job is to make you pick the question. Date&apos;s job, as
        historically specified, was to hide that there were two.
      </p>

      <h2 id="date">What Date did</h2>
      <p>
        <code>new Date("2026-03-29T01:30:00")</code> is specified to be treated
        as local time in ES2015, and as UTC in some older engines, and as an
        invalid date if you write a space instead of <code>T</code>.{" "}
        <code>getHours()</code> then projects that Instant back into the host
        timezone, which is often not the timezone the number came from.
        Instant will not do any of that silently.{" "}
        <Link href={href("api/parse")}>Parse and format</Link> lists exactly
        which parser accepts which string.
      </p>
    </Doc>
  );
}
