"use client";

import { Instant, Zone } from "../lib/instant";
import { Doc, Example, Sig, Table, Throws } from "../Prose";

export function ApiZone() {
  return (
    <Doc slug="api/zone">
      <p>
        An IANA identifier. Instant never stores a Zone on an Instant. You pass
        a Zone into Clock and into the lookup functions below.
      </p>

      <h2 id="get">Zone.get</h2>
      <Sig>{"Zone.get(id: string): Zone"}</Sig>
      <Throws>
        <p>
          <code>UnknownZoneError</code> if this build does not ship the id.
          Production Instant ships IANA. This documentation ships the zones in
          the table on Zones and offsets.
        </p>
      </Throws>
      <Example
        code={`Zone.get("Europe/London")`}
        run={() => Zone.get("Europe/London")}
      />
      <Example
        code={`Zone.get("Europe/Berlin")`}
        run={() => Zone.get("Europe/Berlin")}
      />
      <Example
        code={`Zone.ids()`}
        run={() => Zone.ids().join(", ")}
      />

      <h2 id="utc">Zone.utc</h2>
      <Sig>{"Zone.utc(): Zone"}</Sig>
      <p>
        Equivalent to <code>Zone.get("UTC")</code>. Offset always zero.
        <code>nextTransition</code> always null.
      </p>

      <h2 id="offsetat">Zone.offsetAt / Zone.abbreviationAt</h2>
      <Sig>
        {`Zone.offsetAt(zone: Zone, instant: Instant): number
Zone.abbreviationAt(zone: Zone, instant: Instant): string`}
      </Sig>
      <p>
        Offset is milliseconds east of UTC. At the transition Instant the new
        offset is already in effect.
      </p>
      <Example
        code={`Zone.offsetAt(
  Zone.get("Europe/London"),
  Instant.parse("2026-03-29T00:59:00Z"),
) / 3_600_000`}
        run={() =>
          Zone.offsetAt(
            Zone.get("Europe/London"),
            Instant.parse("2026-03-29T00:59:00Z"),
          ) / 3_600_000
        }
      />
      <Example
        code={`Zone.offsetAt(
  Zone.get("Europe/London"),
  Instant.parse("2026-03-29T01:00:00Z"),
) / 3_600_000`}
        run={() =>
          Zone.offsetAt(
            Zone.get("Europe/London"),
            Instant.parse("2026-03-29T01:00:00Z"),
          ) / 3_600_000
        }
      />

      <h2 id="nexttransition">Zone.nextTransition</h2>
      <Sig>
        {`Zone.nextTransition(zone: Zone, instant: Instant): Transition | null`}
      </Sig>
      <p>
        The next Instant at which the offset changes, strictly after{" "}
        <code>instant</code>. Fixed-offset zones return <code>null</code>.
        Added in 2.1.
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
  Zone.get("America/Phoenix"),
  Instant.parse("2026-03-01T00:00:00Z"),
)`}
        run={() =>
          Zone.nextTransition(
            Zone.get("America/Phoenix"),
            Instant.parse("2026-03-01T00:00:00Z"),
          )
        }
      />

      <h2 id="previoustransition">Zone.previousTransition</h2>
      <Sig>
        {`Zone.previousTransition(zone: Zone, instant: Instant): Transition | null`}
      </Sig>
      <p>
        The last transition strictly before <code>instant</code>. Same null
        rule.
      </p>

      <h2 id="transition">Transition</h2>
      <Table
        cols={["Field", "Meaning"]}
        rows={[
          [<code key="a">at</code>, "The Instant the offset changes"],
          [<code key="b">offsetBeforeMs</code>, "Offset immediately before at"],
          [<code key="c">offsetAfterMs</code>, "Offset at and after at"],
          [<code key="d">abbreviationBefore / After</code>, "Display only. Do not parse."],
        ]}
      />
    </Doc>
  );
}
