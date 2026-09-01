"use client";

import { useId, useState } from "react";

import {
  AmbiguousTimeError,
  Civil,
  Clock,
  SkippedTimeError,
  Zone,
} from "../lib/instant";
import { Doc, Example, Note, Table, s } from "../Prose";

const PRESETS = [
  {
    id: "lon-gap",
    label: "London · 29 Mar 2026 · 01:30",
    civil: "2026-03-29T01:30",
    zone: "Europe/London",
  },
  {
    id: "lon-overlap",
    label: "London · 25 Oct 2026 · 01:30",
    civil: "2026-10-25T01:30",
    zone: "Europe/London",
  },
  {
    id: "ny-gap",
    label: "New York · 8 Mar 2026 · 02:30",
    civil: "2026-03-08T02:30",
    zone: "America/New_York",
  },
  {
    id: "howe",
    label: "Lord Howe · 4 Oct 2026 · 02:15",
    civil: "2026-10-04T02:15",
    zone: "Australia/Lord_Howe",
  },
  {
    id: "tokyo",
    label: "Tokyo · 29 Mar 2026 · 01:30",
    civil: "2026-03-29T01:30",
    zone: "Asia/Tokyo",
  },
] as const;

type Policy = "reject" | "earlier" | "later";

function GapLab() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>(PRESETS[0]);
  const [policy, setPolicy] = useState<Policy>("reject");
  const name = useId();

  let text = "";
  let failed = false;
  try {
    const clock = Clock.of(Civil.parse(preset.civil), Zone.get(preset.zone), {
      ifSkipped: policy,
      ifAmbiguous: policy,
    });
    text = `${Clock.toString(clock)}\n${Clock.abbreviation(clock)} · offset ${Clock.offset(clock).ms / 60_000} minutes`;
  } catch (e) {
    failed = true;
    text = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    if (e instanceof AmbiguousTimeError) {
      text += `\nearlier Instant ${e.earlier.epochMs} · later Instant ${e.later.epochMs}`;
    }
    if (e instanceof SkippedTimeError) {
      text += `\n${e.zoneId} has no civil time ${preset.civil}`;
    }
  }

  return (
    <div className={s.lab}>
      <fieldset>
        <legend>Civil time in a zone</legend>
        <div className={s.chips}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={preset.id === p.id}
              onClick={() => setPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>If skipped or ambiguous</legend>
        <div className={s.chips} role="radiogroup" aria-label="Resolution policy">
          {(["reject", "earlier", "later"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={policy === p}
              aria-pressed={policy === p}
              name={name}
              onClick={() => setPolicy(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </fieldset>
      <pre className={`${s.labOut} ${failed ? s.fail : s.out}`}>{text}</pre>
    </div>
  );
}

function Hours({
  label,
  cells,
}: {
  label: string;
  cells: { t: string; kind?: string }[];
}) {
  return (
    <div className={s.row}>
      <span>{label}</span>
      <div className={s.hours}>
        {cells.map((c, i) => (
          <span key={`${label}-${i}`} className={s.cell} data-kind={c.kind}>
            {c.t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Ambiguous() {
  return (
    <Doc slug="concepts/ambiguous" wide>
      <p>
        On the last Sunday in March, London&apos;s clocks jump from 01:00 GMT to
        02:00 BST. The civil times 01:00 through 01:59 never occur. On the last
        Sunday in October they fall back, and 01:00 through 01:59 occur twice —
        once in BST, once in GMT. Instant&apos;s default is to refuse both
        situations. That is the whole policy.
      </p>

      <h2 id="gaps">Gaps</h2>
      <div className={s.diagram} aria-hidden>
        <Hours
          label="UTC"
          cells={[
            { t: "00:30" },
            { t: "01:00" },
            { t: "01:30" },
            { t: "02:00" },
            { t: "02:30" },
            { t: "03:00" },
          ]}
        />
        <Hours
          label="London"
          cells={[
            { t: "00:30 GMT" },
            { t: "skip", kind: "gap" },
            { t: "skip", kind: "gap" },
            { t: "02:00 BST", kind: "dst" },
            { t: "02:30 BST", kind: "dst" },
            { t: "03:00 BST", kind: "dst" },
          ]}
        />
        <p className={s.caption}>
          Europe/London, 29 March 2026. 01:00–01:59 GMT is not a London wall
          time.
        </p>
      </div>
      <Example
        code={`Clock.of(
  Civil.parse("2026-03-29T01:30"),
  Zone.get("Europe/London"),
)`}
        run={() =>
          Clock.of(Civil.parse("2026-03-29T01:30"), Zone.get("Europe/London"))
        }
      />
      <Table
        cols={["ifSkipped", "01:30 London, 29 March 2026"]}
        rows={[
          [
            <code key="r">reject</code>,
            "SkippedTimeError (default)",
          ],
          [
            <code key="l">later</code>,
            "02:30+01:00 — slide forward by the gap",
          ],
          [
            <code key="e">earlier</code>,
            "00:30Z — slide back by the gap",
          ],
        ]}
      />
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
      <Example
        code={`Clock.of(
  Civil.parse("2026-03-29T01:30"),
  Zone.get("Europe/London"),
  { ifSkipped: "earlier" },
)`}
        run={() =>
          Clock.of(Civil.parse("2026-03-29T01:30"), Zone.get("Europe/London"), {
            ifSkipped: "earlier",
          })
        }
      />
      <Note>
        <p>
          <code>later</code> does not invent 01:30 BST. It adds the gap (here,
          one hour) to the civil fields and resolves the result, which is
          uniquely 02:30 BST. Lord Howe&apos;s gap is thirty minutes; the same
          rule yields 02:45.
        </p>
      </Note>

      <h2 id="overlaps">Overlaps</h2>
      <div className={s.diagram} aria-hidden>
        <Hours
          label="UTC"
          cells={[
            { t: "00:00" },
            { t: "00:30" },
            { t: "01:00" },
            { t: "01:30" },
            { t: "02:00" },
            { t: "02:30" },
          ]}
        />
        <Hours
          label="London"
          cells={[
            { t: "01:00 BST", kind: "first" },
            { t: "01:30 BST", kind: "first" },
            { t: "01:00 GMT", kind: "second" },
            { t: "01:30 GMT", kind: "second" },
            { t: "02:00 GMT" },
            { t: "02:30 GMT" },
          ]}
        />
        <p className={s.caption}>
          Europe/London, 25 October 2026. 01:00–01:59 happens first as BST, then
          as GMT.
        </p>
      </div>
      <Example
        code={`Clock.of(
  Civil.parse("2026-10-25T01:30"),
  Zone.get("Europe/London"),
)`}
        run={() =>
          Clock.of(Civil.parse("2026-10-25T01:30"), Zone.get("Europe/London"))
        }
      />
      <Table
        cols={["ifAmbiguous", "01:30 London, 25 October 2026"]}
        rows={[
          [<code key="r">reject</code>, "AmbiguousTimeError, both Instants attached"],
          [<code key="e">earlier</code>, "01:30+01:00 BST — the first occurrence"],
          [<code key="l">later</code>, "01:30Z GMT — the second occurrence"],
        ]}
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
      <Example
        code={`Clock.of(
  Civil.parse("2026-10-25T01:30"),
  Zone.get("Europe/London"),
  { ifAmbiguous: "later" },
)`}
        run={() =>
          Clock.of(Civil.parse("2026-10-25T01:30"), Zone.get("Europe/London"), {
            ifAmbiguous: "later",
          })
        }
      />

      <h2 id="why-reject">Why reject is the default</h2>
      <p>
        Temporal, moment-timezone and most SQL engines pick a default
        (often “compatible” / later). Instant does not, because the right
        answer depends on the question. A booking system that slides a 01:30
        departure to 02:30 has invented a train. A logger that picks the later
        01:30 on the fold has reordered events. The caller knows which; the
        library does not.
      </p>
      <p>
        <code>AmbiguousTimeError</code> carries both Instants. If you are
        converting a timestamp that already happened, compare them to something
        you already know rather than picking earlier by habit.
      </p>

      <h2 id="try">Try a transition</h2>
      <p>
        These five civil times are the ones the rest of the docs use. The
        results are the same functions as the examples — this is not a
        simulation.
      </p>
      <GapLab />

      <h2 id="new-york">America/New_York</h2>
      <p>
        The United States jumps at 02:00 local, not 01:00 UTC. On 8 March 2026
        that is 02:00 EST → 03:00 EDT. 02:30 does not exist; 01:30 does.
      </p>
      <Example
        code={`Clock.of(
  Civil.parse("2026-03-08T02:30"),
  Zone.get("America/New_York"),
  { ifSkipped: "later" },
)`}
        run={() =>
          Clock.of(Civil.parse("2026-03-08T02:30"), Zone.get("America/New_York"), {
            ifSkipped: "later",
          })
        }
      />

      <h2 id="clock-at">Clock.at is never ambiguous</h2>
      <p>
        Going from Instant to Clock is always unique. An Instant has already
        happened; the zone can only report one wall time for it. Ambiguity is a
        civil-to-instant problem.
      </p>
    </Doc>
  );
}
