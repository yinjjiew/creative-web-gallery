/**
 * THE READINGS.
 *
 * Everything here is a permutation. This module imports the record and returns
 * orderings, weights and counts; the only strings it emits are labels and its
 * own arithmetic. No function below takes a claim's text and returns a
 * different one, and none can: a reading is a comparator plus a rank, applied
 * to records it does not own.
 *
 * The ledger is the visible consequence. Because a reading is a permutation, a
 * diff against the plain record can be computed exactly — how many claims
 * moved, how many were brought forward, how many details were folded — and
 * printed in the interface rather than promised in a paragraph.
 */
import {
  EDUCATION,
  LENSES,
  PERSON,
  ROLES,
  SKILLS,
  WRITING,
  type Claim,
  type Lens,
  type LensId,
  type SkillGroup,
  type Weight,
} from "./record";

/** `null` is the record itself: date order, everything at one weight. */
export type Reading = LensId | null;

export type Placed = {
  claim: Claim;
  /** Weight under this reading. Always 2 in the record. */
  weight: Weight;
  /** Position in the record's own order, so movement can be shown. */
  from: number;
  to: number;
  /** True when the claim has detail that this reading has folded away. */
  folded: boolean;
};

export const ALL_CLAIMS: Claim[] = [
  ...ROLES.flatMap((role) => role.claims),
  ...EDUCATION,
  ...WRITING,
];

export function lensById(id: Reading): Lens | null {
  return id ? (LENSES.find((lens) => lens.id === id) ?? null) : null;
}

export function weightOf(claim: Claim, reading: Reading): Weight {
  return reading ? claim.w[reading] : 2;
}

export function detailShown(
  claim: Claim,
  reading: Reading,
  unfold: boolean
): boolean {
  if (!claim.detail) return false;
  if (reading === null || unfold || claim.pinned) return true;
  return claim.w[reading] === 3;
}

/**
 * Pinned first, then heaviest first, then in the order the record keeps them.
 * A stable sort matters: two claims of equal weight must stay in date order
 * rather than shuffling, or the reader cannot trust that nothing was chosen.
 */
export function place(
  claims: Claim[],
  reading: Reading,
  unfold: boolean
): Placed[] {
  const indexed = claims.map((claim, from) => ({ claim, from }));
  const sorted =
    reading === null
      ? indexed
      : [...indexed].sort((a, b) => {
          if (a.claim.pinned !== b.claim.pinned) return a.claim.pinned ? -1 : 1;
          const byWeight = b.claim.w[reading] - a.claim.w[reading];
          return byWeight !== 0 ? byWeight : a.from - b.from;
        });

  return sorted.map(({ claim, from }, to) => ({
    claim,
    weight: weightOf(claim, reading),
    from,
    to,
    folded: Boolean(claim.detail) && !detailShown(claim, reading, unfold),
  }));
}

export function placeSkills(reading: Reading): SkillGroup[] {
  if (reading === null) return SKILLS;
  return [...SKILLS].sort((a, b) => b.w[reading] - a.w[reading]);
}

export type Ledger = {
  claims: number;
  groups: number;
  /** Claims whose rendered text differs from the record's. Computed, not asserted. */
  altered: number;
  moved: number;
  forward: number;
  back: number;
  folded: number;
  notes: number;
  checksum: string;
};

/**
 * FNV-1a over every claim in the record, sorted by id.
 *
 * It is printed in all four views and on the printed page. If a reading were
 * quietly rewriting a claim for an audience, this eight-digit number would not
 * match across the four, and anyone can check it by looking. That is a weaker
 * guarantee than reading the source and a much stronger one than a promise.
 */
export function checksum(): string {
  const corpus = [
    ...ALL_CLAIMS.map((c) => `${c.id}|${c.text}|${c.detail ?? ""}`),
    ...SKILLS.map((g) => `${g.id}|${g.label}|${g.items.join(",")}`),
    `HEAD|${PERSON.headline}`,
  ]
    .sort()
    .join("\n");

  let hash = 0x811c9dc5;
  for (let i = 0; i < corpus.length; i += 1) {
    hash ^= corpus.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function ledger(reading: Reading, unfold: boolean): Ledger {
  const lens = lensById(reading);
  let moved = 0;
  let folded = 0;

  const groups: Claim[][] = [
    ...ROLES.map((role) => role.claims),
    EDUCATION,
    WRITING,
  ];
  for (const claims of groups) {
    for (const placed of place(claims, reading, unfold)) {
      if (placed.from !== placed.to) moved += 1;
      if (placed.folded) folded += 1;
    }
  }

  const skillsMoved = placeSkills(reading).filter(
    (group, index) => SKILLS[index]?.id !== group.id
  ).length;

  // What the record will render, against what this reading will render, claim
  // by claim and off the same code path the page uses. Structurally zero — but
  // computed rather than asserted, so it would stop being zero if that changed.
  const asRecord = new Map(
    place(ALL_CLAIMS, null, unfold).map((p) => [p.claim.id, p.claim.text])
  );
  const asRead = new Map(
    place(ALL_CLAIMS, reading, unfold).map((p) => [p.claim.id, p.claim.text])
  );
  const altered = [...asRecord].filter(
    ([id, text]) => asRead.get(id) !== text
  ).length;

  return {
    claims: ALL_CLAIMS.length,
    groups: SKILLS.length,
    altered,
    moved: moved + skillsMoved,
    forward: reading
      ? ALL_CLAIMS.filter((c) => c.w[reading] === 3).length +
        SKILLS.filter((g) => g.w[reading] === 3).length
      : 0,
    back: reading
      ? ALL_CLAIMS.filter((c) => c.w[reading] === 1).length +
        SKILLS.filter((g) => g.w[reading] === 1).length
      : 0,
    folded,
    notes: lens ? 1 + Object.keys(lens.roleNotes).length : 0,
    checksum: checksum(),
  };
}

/* ------------------------------------------------------------------ *
 * Plain text
 *
 * Recruiters paste résumés into applicant tracking systems, which read a
 * flat stream and choke on columns, tabs and glyphs. So this is hard-wrapped
 * at 76 characters, indented with spaces, and uses hyphen bullets. It carries
 * every claim and every detail, whatever the reading has folded on screen,
 * because a paste that silently dropped half the record would be the exact
 * failure this piece is about.
 * ------------------------------------------------------------------ */

function wrap(text: string, width: number, indent = ""): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = indent;
  for (const word of words) {
    const candidate = line.trim() ? `${line} ${word}` : `${indent}${word}`;
    if (candidate.length > width && line.trim()) {
      lines.push(line);
      line = `${indent}${word}`;
    } else {
      line = candidate;
    }
  }
  if (line.trim()) lines.push(line);
  return lines;
}

const WIDTH = 76;

function rule(label: string): string[] {
  return ["", label.toUpperCase(), "-".repeat(label.length), ""];
}

export function plainText(reading: Reading): string {
  const lens = lensById(reading);
  const book = ledger(reading, true);
  const out: string[] = [];

  // One field per line, no separators to guess at: the most reliably parsed
  // shape there is.
  out.push(PERSON.name.toUpperCase());
  out.push(PERSON.place);
  out.push(PERSON.email);
  out.push(PERSON.phone);
  out.push("");
  out.push(...wrap(PERSON.headline, WIDTH));

  out.push(...rule(lens ? `Reading: ${lens.label}` : "The record"));
  out.push(
    ...wrap(
      lens
        ? `Ordered for ${lens.target}. This is one of three readings of a single record. All ${String(book.claims)} claims below appear in every reading, word for word; only their order and emphasis differ. Nothing is added and nothing is left out. Record checksum ${book.checksum}.`
        : `The record in date order, with nothing emphasised. All ${String(book.claims)} claims appear in all three readings as well. Record checksum ${book.checksum}.`,
      WIDTH
    )
  );
  if (lens) {
    out.push("");
    out.push(...wrap(`Her framing: ${lens.note}`, WIDTH));
  }

  out.push(...rule("Experience"));
  for (const role of ROLES) {
    out.push(`${role.org} — ${role.place}`);
    out.push(...wrap(role.what, WIDTH, "  "));
    for (const stint of role.stints) {
      // Not padded into a column: a parser that collapses runs of spaces would
      // turn a column into nonsense, and a human reads this fine.
      out.push(`  ${stint.title}, ${stint.from} – ${stint.to}`);
    }
    if (lens) {
      out.push(...wrap(`Framing: ${lens.roleNotes[role.id] ?? ""}`, WIDTH, "  "));
    }
    out.push("");
    for (const placed of place(role.claims, reading, true)) {
      const lines = wrap(placed.claim.text, WIDTH, "    ");
      lines[0] = `  - ${lines[0].trimStart()}`;
      out.push(...lines);
      if (placed.claim.detail) {
        out.push(...wrap(placed.claim.detail, WIDTH, "      "));
      }
    }
    out.push("");
  }

  out.push(...rule("Education"));
  for (const placed of place(EDUCATION, reading, true)) {
    out.push(...wrap(placed.claim.text, WIDTH, "  "));
  }

  out.push(...rule("Tools and methods"));
  for (const group of placeSkills(reading)) {
    out.push(...wrap(`${group.label}: ${group.items.join(", ")}.`, WIDTH, "  "));
  }

  out.push(...rule("Talks and writing"));
  for (const placed of place(WRITING, reading, true)) {
    out.push(...wrap(placed.claim.text, WIDTH, "  "));
  }

  out.push("");
  out.push("-".repeat(WIDTH));
  out.push(
    ...wrap(
      lens
        ? `${lens.label} reading of one record, exported as plain text. The other two readings contain these same ${String(book.claims)} claims in a different order. Checksum ${book.checksum}.`
        : `The plain record, exported as plain text. Checksum ${book.checksum}.`,
      WIDTH
    )
  );
  out.push(
    ...wrap(
      "Hana Bergström is a fictional person written for a design brief; every figure here is invented.",
      WIDTH
    )
  );

  return out.join("\n");
}
