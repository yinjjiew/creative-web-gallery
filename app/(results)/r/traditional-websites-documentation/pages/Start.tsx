"use client";

import Link from "next/link";

import { href } from "../catalog";
import {
  Calendar,
  Civil,
  Clock,
  Instant,
  Span,
  Zone,
} from "../lib/instant";
import { Doc, Example, Note, Sig, Table } from "../Prose";

export function Start() {
  return (
    <Doc slug="start">
      <p>
        Instant has five types and one opinion. The types are Instant, Civil,
        Clock, Span and Calendar. The opinion is that Instant will not guess. If
        a local time never happens, or happens twice, the call throws unless you
        say what to do.
      </p>

      <h2 id="install">Install</h2>
      <Sig>npm install @instant/time</Sig>
      <p>
        There is no default export. Import the types you need. Everything is
        immutable; every function returns a new value.
      </p>
      <Example
        code={`import { Instant, Civil, Clock, Span, Zone } from "@instant/time"

Instant.toString(Instant.parse("2026-03-29T01:30:00Z"))`}
        run={() => Instant.toString(Instant.parse("2026-03-29T01:30:00Z"))}
      />

      <h2 id="one-idea">The one idea</h2>
      <p>
        <code>2026-03-29T01:30:00</code> is not a moment. It is a label. In
        Tokyo it names a real instant. In London that night, the clocks jumped
        from 01:00 GMT to 02:00 BST, and 01:30 never occurred. Treating the
        label as a moment is how “add one day” lands on the wrong morning, and
        how a cron job double-fires on the last Sunday in October.
      </p>
      <p>
        Read <Link href={href("concepts/instant-civil")}>Instant and Civil</Link>{" "}
        if you want the argument. The rest of this page gets you to a working
        Clock.
      </p>

      <h2 id="first-instant">A point on the timeline</h2>
      <p>
        <code>Instant.parse</code> requires <code>Z</code> or a numeric offset.
        That is not pedantry. An offset-less string is a Civil, and Instant
        refused to pretend otherwise starting in v2.
      </p>
      <Example
        code={`Instant.parse("2026-03-29T01:30:00Z")`}
        run={() => Instant.parse("2026-03-29T01:30:00Z")}
      />
      <Example
        code={`Instant.parse("2026-03-29T01:30:00")`}
        run={() => Instant.parse("2026-03-29T01:30:00")}
      />
      <Example
        code={`Instant.add(
  Instant.parse("2026-03-29T01:30:00Z"),
  Span.of({ hours: 1 }),
)`}
        run={() =>
          Instant.add(Instant.parse("2026-03-29T01:30:00Z"), Span.of({ hours: 1 }))
        }
      />
      <Note>
        <p>
          You can add hours to an Instant. You cannot add a day, because a day
          is a calendar idea. See{" "}
          <Link href={href("concepts/calendar")}>Adding a month</Link>.
        </p>
      </Note>

      <h2 id="first-civil">A label on a wall clock</h2>
      <p>
        Civil is the numbers a person wrote down. It does not know about
        timezones and it will not acquire one unless you attach one.
      </p>
      <Example
        code={`Civil.parse("2026-03-29T01:30")`}
        run={() => Civil.parse("2026-03-29T01:30")}
      />
      <Example
        code={`Civil.parse("2026-03-29")`}
        run={() => Civil.parse("2026-03-29")}
      />
      <Example
        code={`Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }))`}
        run={() => Civil.add(Civil.parse("2026-01-31"), Calendar.of({ months: 1 }))}
      />

      <h2 id="first-clock">Nail it to a place</h2>
      <p>
        A Clock is a Civil plus a Zone. Building one is where the awkward cases
        live. The default is to refuse them.
      </p>
      <Example
        code={`Clock.of(
  Civil.parse("2026-03-29T00:30"),
  Zone.get("Europe/London"),
)`}
        run={() =>
          Clock.of(Civil.parse("2026-03-29T00:30"), Zone.get("Europe/London"))
        }
      />
      <Example
        code={`Clock.of(
  Civil.parse("2026-03-29T01:30"),
  Zone.get("Europe/London"),
)`}
        run={() =>
          Clock.of(Civil.parse("2026-03-29T01:30"), Zone.get("Europe/London"))
        }
      />
      <p>
        01:30 on 29 March 2026 never happens in London. That is not a bug in
        Instant. The correct behaviour for a library that has not been told what
        you meant is to throw. If you do mean “slide forward into the next real
        time”:
      </p>
      <Example
        code={`Clock.of(
  Civil.parse("2026-03-29T01:30"),
  Zone.get("Europe/London"),
  { ifSkipped: "later" },
)`}
        run={() =>
          Clock.of(Civil.parse("2026-03-29T01:30"), Zone.get("Europe/London"), {
            ifSkipped: "later",
          })
        }
      />

      <h2 id="two-adds">Two ways to add an hour</h2>
      <Table
        cols={["Call", "Meaning", "London, 29 March, 00:30"]}
        rows={[
          [
            <code key="s">{`Clock.addSpan(c, Span.of({ hours: 1 }))`}</code>,
            "One hour of elapsed time",
            "02:30 BST — the clocks jumped",
          ],
          [
            <code key="c">{`Clock.addCalendar(c, Calendar.of({ days: 0 }))`}</code>,
            "Same civil fields (here, a no-op)",
            "00:30 GMT still",
          ],
        ]}
      />
      <Example
        code={`const c = Clock.of(
  Civil.parse("2026-03-29T00:30"),
  Zone.get("Europe/London"),
)
Clock.addSpan(c, Span.of({ hours: 1 }))`}
        run={() =>
          Clock.addSpan(
            Clock.of(Civil.parse("2026-03-29T00:30"), Zone.get("Europe/London")),
            Span.of({ hours: 1 }),
          )
        }
      />

      <h2 id="next">Where next</h2>
      <ul>
        <li>
          <Link href={href("concepts/ambiguous")}>Skipped and repeated times</Link>{" "}
          — the page to keep open at 11pm.
        </li>
        <li>
          <Link href={href("api/clock")}>Clock</Link> —{" "}
          <code>Clock.of</code> and <code>Clock.at</code> are the two
          constructors you will actually use.
        </li>
        <li>
          <Link href={href("limits")}>What Instant does not do</Link> — read this
          before you adopt it.
        </li>
      </ul>
    </Doc>
  );
}
