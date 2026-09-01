"use client";

import { Calendar, Civil, Clock, Instant, Span, Zone } from "../lib/instant";
import { Doc, Example, Note, Sig, Table, Throws } from "../Prose";

export function ApiClock() {
  return (
    <Doc slug="api/clock">
      <p>
        A Civil nailed to a Zone, with the offset Instant computed from that
        pair. This is the type that throws on skipped and repeated times. If
        you are debugging one function at eleven, it is probably{" "}
        <code>Clock.of</code>.
      </p>

      <h2 id="of">Clock.of</h2>
      <Sig>
        {`Clock.of(
  civil: Civil,
  zone: Zone,
  options?: {
    ifSkipped?: "reject" | "earlier" | "later",
    ifAmbiguous?: "reject" | "earlier" | "later"
  }
): Clock`}
      </Sig>
      <p>
        Both options default to <code>reject</code>. <code>later</code> on a
        gap slides the civil fields forward by the gap. <code>earlier</code>{" "}
        slides them back. On an overlap, <code>earlier</code> is the first
        occurrence on the timeline.
      </p>
      <Throws>
        <p>
          <code>SkippedTimeError</code> or <code>AmbiguousTimeError</code> when
          the corresponding policy is reject.{" "}
          <code>AmbiguousTimeError</code> exposes <code>.earlier</code> and{" "}
          <code>.later</code> Instants.
        </p>
      </Throws>
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
      <Example
        code={`Clock.of(
  Civil.parse("2026-10-25T01:30"),
  Zone.get("Europe/London"),
  { ifAmbiguous: "earlier" },
)`}
        run={() =>
          Clock.of(Civil.parse("2026-10-25T01:30"), Zone.get("Europe/London"), {
            ifAmbiguous: "earlier",
          })
        }
      />
      <Table
        cols={["Civil", "Zone", "Default"]}
        rows={[
          ["2026-03-29T01:30", "Europe/London", "SkippedTimeError"],
          ["2026-10-25T01:30", "Europe/London", "AmbiguousTimeError"],
          ["2026-03-08T02:30", "America/New_York", "SkippedTimeError"],
          ["2026-10-04T02:15", "Australia/Lord_Howe", "SkippedTimeError (30 min gap)"],
          ["2026-03-29T01:30", "Asia/Tokyo", "01:30+09:00 — unique"],
        ]}
      />

      <h2 id="at">Clock.at</h2>
      <Sig>{"Clock.at(instant: Instant, zone: Zone): Clock"}</Sig>
      <p>
        What the wall clocks in <code>zone</code> read at <code>instant</code>.
        Always unique. Use this to convert a stored Instant into a place.
      </p>
      <Example
        code={`Clock.at(
  Instant.parse("2026-03-29T01:00:00Z"),
  Zone.get("Europe/London"),
)`}
        run={() =>
          Clock.at(Instant.parse("2026-03-29T01:00:00Z"), Zone.get("Europe/London"))
        }
      />
      <Example
        code={`Clock.at(
  Instant.parse("2026-03-29T01:00:00Z"),
  Zone.get("America/New_York"),
)`}
        run={() =>
          Clock.at(
            Instant.parse("2026-03-29T01:00:00Z"),
            Zone.get("America/New_York"),
          )
        }
      />

      <h2 id="parse">Clock.parse</h2>
      <Sig>{"Clock.parse(input: string, options?: ResolveOptions): Clock"}</Sig>
      <p>
        Requires a zone in brackets. An offset is optional; if present it must
        match the zone at that Instant.
      </p>
      <Throws>
        <p>
          <code>ParseError</code> if there is no zone, or if a supplied offset
          disagrees with the zone. The same skip/overlap errors as Clock.of
          when the offset is omitted.
        </p>
      </Throws>
      <Example
        code={`Clock.parse("2026-03-29T00:30[Europe/London]")`}
        run={() => Clock.parse("2026-03-29T00:30[Europe/London]")}
      />
      <Example
        code={`Clock.parse("2026-03-29T01:30[Europe/London]")`}
        run={() => Clock.parse("2026-03-29T01:30[Europe/London]")}
      />

      <h2 id="toinstant">Clock.toInstant / Clock.toCivil</h2>
      <Sig>
        {`Clock.toInstant(clock: Clock): Instant
Clock.toCivil(clock: Clock): Civil`}
      </Sig>
      <Example
        code={`Clock.toInstant(
  Clock.of(Civil.parse("2026-03-29T02:30"), Zone.get("Europe/London")),
)`}
        run={() =>
          Clock.toInstant(
            Clock.of(Civil.parse("2026-03-29T02:30"), Zone.get("Europe/London")),
          )
        }
      />

      <h2 id="addspan">Clock.addSpan</h2>
      <Sig>{"Clock.addSpan(clock: Clock, span: Span): Clock"}</Sig>
      <p>
        Add to the Instant, convert back. Crossing a spring-forward moves the
        wall clock by more than the Span; crossing a fall-back, by less.
      </p>
      <Example
        code={`Clock.addSpan(
  Clock.of(Civil.parse("2026-03-29T00:30"), Zone.get("Europe/London")),
  Span.of({ hours: 1 }),
)`}
        run={() =>
          Clock.addSpan(
            Clock.of(Civil.parse("2026-03-29T00:30"), Zone.get("Europe/London")),
            Span.of({ hours: 1 }),
          )
        }
      />

      <h2 id="addcalendar">Clock.addCalendar</h2>
      <Sig>
        {`Clock.addCalendar(
  clock: Clock,
  calendar: Calendar,
  options?: ResolveOptions
): Clock`}
      </Sig>
      <p>
        “The same clock time on the target date.” Re-resolves, so a day added
        onto a time that lands in a gap will throw unless you pass a policy.
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
        code={`Clock.addCalendar(
  Clock.of(Civil.parse("2026-03-28T01:30"), Zone.get("Europe/London")),
  Calendar.of({ days: 1 }),
  { ifSkipped: "later" },
)`}
        run={() =>
          Clock.addCalendar(
            Clock.of(Civil.parse("2026-03-28T01:30"), Zone.get("Europe/London")),
            Calendar.of({ days: 1 }),
            { ifSkipped: "later" },
          )
        }
      />

      <h2 id="withzone">Clock.withZone</h2>
      <Sig>{"Clock.withZone(clock: Clock, zone: Zone): Clock"}</Sig>
      <p>
        Same Instant, different city. The civil fields usually change. This is
        not “keep 09:30 and move the zone,” which would be Clock.of on the
        existing Civil.
      </p>
      <Example
        code={`Clock.withZone(
  Clock.parse("2026-03-29T08:00[Europe/London]"),
  Zone.get("America/New_York"),
)`}
        run={() =>
          Clock.withZone(
            Clock.parse("2026-03-29T08:00[Europe/London]"),
            Zone.get("America/New_York"),
          )
        }
      />

      <h2 id="offset">Clock.offset / Clock.abbreviation</h2>
      <Sig>
        {`Clock.offset(clock: Clock): Span
Clock.abbreviation(clock: Clock): string`}
      </Sig>
      <Example
        code={`const c = Clock.of(
  Civil.parse("2026-03-29T02:30"),
  Zone.get("Europe/London"),
)
Clock.abbreviation(c) + " " + Span.toString(Clock.offset(c))`}
        run={() => {
          const c = Clock.of(
            Civil.parse("2026-03-29T02:30"),
            Zone.get("Europe/London"),
          );
          return `${Clock.abbreviation(c)} ${Span.toString(Clock.offset(c))}`;
        }}
      />
      <Note>
        <p>
          Abbreviations are a display convenience and are not unique. CST is
          China, Cuba and Central North America. Do not parse them. Do not
          store them.
        </p>
      </Note>

      <h2 id="tostring">Clock.toString</h2>
      <Sig>{"Clock.toString(clock: Clock): string"}</Sig>
      <p>
        <code>YYYY-MM-DDTHH:mm:ss±HH:mm[Zone]</code>. Offset <code>Z</code> when
        it is zero. This string round-trips through Clock.parse.
      </p>
    </Doc>
  );
}
