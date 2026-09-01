"use client";

import Link from "next/link";

import { href } from "../catalog";
import { Instant, Zone } from "../lib/instant";
import { Doc, Example, Note, Table } from "../Prose";

export function Zones() {
  return (
    <Doc slug="concepts/zones">
      <p>
        An offset is a number of milliseconds to add to UTC to get a wall time.
        <code>+01:00</code> is an offset. <code>Europe/Paris</code> is not. Paris
        has been +01:00 and +02:00 in the same year, and the date of the change
        is a political decision that can move with weeks of notice.
      </p>

      <h2 id="offset">Offset</h2>
      <p>
        Offsets appear in Instant strings because they are a way of writing a
        point. <code>2026-03-29T02:30:00+01:00</code> is the Instant{" "}
        <code>2026-03-29T01:30:00Z</code>. The Instant does not remember that
        someone once wrote +01:00.
      </p>
      <Example
        code={`Instant.parse("2026-03-29T02:30:00+01:00")`}
        run={() => Instant.parse("2026-03-29T02:30:00+01:00")}
      />

      <h2 id="zone">Zone</h2>
      <p>
        A Zone is an IANA identifier and the history of offsets that identifier
        has used. <code>Zone.offsetAt(zone, instant)</code> answers “what was
        the offset in this place at this point?” That is a lookup, not a guess.
      </p>
      <Example
        code={`const z = Zone.get("Europe/London")
const i = Instant.parse("2026-03-29T00:30:00Z")
Zone.offsetAt(z, i) / 3_600_000 + "h " + Zone.abbreviationAt(z, i)`}
        run={() => {
          const z = Zone.get("Europe/London");
          const i = Instant.parse("2026-03-29T00:30:00Z");
          return `${Zone.offsetAt(z, i) / 3_600_000}h ${Zone.abbreviationAt(z, i)}`;
        }}
      />
      <Example
        code={`const z = Zone.get("Europe/London")
const i = Instant.parse("2026-03-29T01:30:00Z")
offset and abbreviation after the spring-forward`}
        run={() => {
          const z = Zone.get("Europe/London");
          const i = Instant.parse("2026-03-29T01:30:00Z");
          return `${Zone.offsetAt(z, i) / 3_600_000}h ${Zone.abbreviationAt(z, i)}`;
        }}
      />

      <h2 id="not-paris">+01:00 is not Europe/Paris</h2>
      <p>
        Storing <code>+01:00</code> when the user said Paris loses the next
        transition. The following March, Paris moves to +02:00 and your stored
        offset does not. If you later convert “09:00 in the stored offset” you
        open the shop an hour early. Store the zone id. Derive the offset at
        the Instant you care about.
      </p>
      <Table
        cols={["Store this", "Not this", "Because"]}
        rows={[
          [
            <code key="a">Europe/Paris</code>,
            <code key="b">+01:00</code>,
            "The offset will change. The name will not (or when it does, IANA publishes an alias).",
          ],
          [
            <code key="c">Instant + Zone</code>,
            <code key="d">Civil + offset</code>,
            "A civil plus an offset is an Instant in disguise, and it goes stale.",
          ],
          [
            <code key="e">UTC</code>,
            <code key="f">local Date</code>,
            "The host timezone is not a substitute for the zone the data is about.",
          ],
        ]}
      />

      <h2 id="transitions">Transitions</h2>
      <p>
        <code>Zone.nextTransition</code> returns the next instant at which the
        offset changes, or <code>null</code> in a zone that does not observe
        daylight saving. Tokyo, Phoenix and (since 2019) São Paulo return null.
      </p>
      <Example
        code={`const t = Zone.nextTransition(
  Zone.get("Europe/London"),
  Instant.parse("2026-03-01T00:00:00Z"),
)
t && Instant.toString(t.at)`}
        run={() => {
          const t = Zone.nextTransition(
            Zone.get("Europe/London"),
            Instant.parse("2026-03-01T00:00:00Z"),
          );
          return t ? Instant.toString(t.at) : null;
        }}
      />
      <Example
        code={`Zone.nextTransition(
  Zone.get("Asia/Tokyo"),
  Instant.parse("2026-03-01T00:00:00Z"),
)`}
        run={() =>
          Zone.nextTransition(
            Zone.get("Asia/Tokyo"),
            Instant.parse("2026-03-01T00:00:00Z"),
          )
        }
      />
      <Note>
        <p>
          Transitions are not always sixty minutes and not always in March.
          Australia/Lord_Howe springs forward thirty minutes. Pacific/Auckland
          starts daylight saving in September. The API does not assume a
          one-hour gap;{" "}
          <Link href={href("concepts/ambiguous")}>skipped times</Link> are
          computed from the actual offsets.
        </p>
      </Note>

      <h2 id="this-build">What this documentation ships</h2>
      <p>
        A production Instant loads the IANA Time Zone Database. This
        documentation build implements the zones the examples use, with rules
        current as of 2026:
      </p>
      <Table
        cols={["Zone", "Standard", "DST", "Notes"]}
        rows={[
          ["UTC", "Z", "—", "No transitions"],
          ["Europe/London", "GMT / +00", "BST / +01", "Last Sunday March / October, 01:00 UTC"],
          ["Europe/Paris", "CET / +01", "CEST / +02", "Same instants as London, different offsets"],
          ["America/New_York", "EST / −05", "EDT / −04", "Second Sunday March, first Sunday November"],
          ["America/Phoenix", "MST / −07", "—", "No DST"],
          ["America/Sao_Paulo", "BRT / −03", "—", "DST ended after February 2019"],
          ["Asia/Tokyo", "JST / +09", "—", "No DST"],
          ["Pacific/Auckland", "NZST / +12", "NZDT / +13", "Southern: September / April"],
          ["Australia/Lord_Howe", "LHST / +10:30", "LHDT / +11", "Thirty-minute spring-forward"],
        ]}
      />
      <p>
        <code>Zone.get("Europe/Berlin")</code> throws{" "}
        <code>UnknownZoneError</code> here. In production Instant it would
        resolve. The examples never depend on a zone that is not in the table.
      </p>
    </Doc>
  );
}
