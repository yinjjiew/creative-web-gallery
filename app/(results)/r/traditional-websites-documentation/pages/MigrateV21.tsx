"use client";

import { Instant, Zone } from "../lib/instant";
import { Doc, Example } from "../Prose";

export function MigrateV21() {
  return (
    <Doc slug="migrate/v21">
      <p>
        Released as 2.1.0. No breaking changes. If you are here because a parse
        started throwing, you want v1 → v2.
      </p>

      <h2 id="nexttransition">Zone.nextTransition / previousTransition</h2>
      <p>
        New functions. They return <code>null</code> in a zone without DST
        rather than throwing. Existing <code>offsetAt</code> behaviour is
        unchanged, including at the transition Instant itself (the new offset
        applies at <code>at</code>, not after).
      </p>
      <Example
        code={`const t = Zone.nextTransition(
  Zone.get("Europe/London"),
  Instant.parse("2026-10-01T00:00:00Z"),
)
t && Instant.toString(t.at)`}
        run={() => {
          const t = Zone.nextTransition(
            Zone.get("Europe/London"),
            Instant.parse("2026-10-01T00:00:00Z"),
          );
          return t ? Instant.toString(t.at) : null;
        }}
      />

      <h2 id="docs">Documentation-only</h2>
      <p>
        Clock.parse gained a clearer error when an offset disagrees with a zone.
        The behaviour — throw ParseError — is the same as 2.0.
      </p>
    </Doc>
  );
}
