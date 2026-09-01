"use client";

import Link from "next/link";

import { href } from "../catalog";
import { Doc } from "../Prose";

export function Migrate() {
  return (
    <Doc slug="migrate">
      <p>
        Instant versions the API that can break a parse at two in the morning.
        If something started throwing after an upgrade, it is almost certainly
        v1 → v2. v2.1 added functions and did not change existing ones.
      </p>
      <ul>
        <li>
          <Link href={href("migrate/v2")}>v1 → v2</Link> — Instant.parse,
          Span days, fromDate. Breaking.
        </li>
        <li>
          <Link href={href("migrate/v21")}>v2.0 → v2.1</Link> —
          Zone.nextTransition. Not breaking.
        </li>
      </ul>
      <p>
        There is no compatibility flag. The v1 behaviours were the bugs. The
        migration is mechanical and listed as replacements, not as advice.
      </p>
    </Doc>
  );
}
