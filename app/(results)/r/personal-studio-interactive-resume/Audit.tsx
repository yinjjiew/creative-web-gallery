"use client";

import s from "./fit.module.css";
import {
  EDUCATION,
  LENSES,
  ROLES,
  SKILLS,
  WRITING,
  type Claim,
} from "./record";
import { checksum, lensById, type Reading } from "./reading";

/**
 * The audit is what makes the integrity checkable rather than claimed.
 *
 * Two things are in it. First, every claim with its weight in all three
 * readings at once, so a reader can confirm by eye that no claim is missing
 * from any of them — the failed company included, at full weight in all three.
 * Second, and more to the point: every framing note she writes for the other
 * two audiences, quoted in full. A résumé that tells each employer what it
 * wants to hear cannot survive being read this way, which is the reason to
 * publish it.
 */

const ROWS: { label: string; claims: Claim[] }[] = [
  ...ROLES.map((role) => ({ label: role.org, claims: role.claims })),
  { label: "Education", claims: EDUCATION },
  { label: "Talks and writing", claims: WRITING },
];

const MARK: Record<number, string> = { 3: "lead", 2: "body", 1: "back" };

export default function Audit({ reading }: { reading: Reading }) {
  const active = lensById(reading);
  const total =
    ROWS.reduce((sum, group) => sum + group.claims.length, 0) + SKILLS.length;

  return (
    <details className={s.audit}>
      <summary className={s.auditSummary}>
        <span className={s.auditWord}>Audit</span>
        <span>
          all {total} claims and skill groups with their weight in every
          reading, and every framing note — including the two you are not
          reading
        </span>
      </summary>

      <div className={s.auditBody}>
        <p className={s.auditIntro}>
          A résumé that quietly told each employer what it wanted to hear could
          not be published like this. So it is published like this. Nothing
          below is generated for the reading you happen to have open; it is the
          whole record and all three orderings, at once. Checksum{" "}
          <b>{checksum()}</b>.
        </p>

        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col" className={s.thId}>
                id
              </th>
              <th scope="col" className={s.thClaim}>
                claim
              </th>
              {LENSES.map((lens) => (
                <th
                  key={lens.id}
                  scope="col"
                  className={
                    active?.id === lens.id ? `${s.thLens} ${s.thOn}` : s.thLens
                  }
                >
                  {lens.label}
                </th>
              ))}
            </tr>
          </thead>
          {ROWS.map((group) => (
            <tbody key={group.label}>
              <tr>
                <th scope="rowgroup" colSpan={5} className={s.groupHead}>
                  {group.label}
                </th>
              </tr>
              {group.claims.map((claim) => (
                <tr key={claim.id} className={claim.pinned ? s.pinnedRow : ""}>
                  <td className={s.tdId}>{claim.id}</td>
                  <td className={s.tdClaim}>
                    {claim.pinned ? (
                      <span className={s.tdPin}>pinned </span>
                    ) : null}
                    {claim.text}
                  </td>
                  {LENSES.map((lens) => (
                    <td
                      key={lens.id}
                      data-lens={lens.label}
                      className={
                        active?.id === lens.id ? `${s.tdW} ${s.tdOn}` : s.tdW
                      }
                    >
                      {MARK[claim.w[lens.id]]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
          <tbody>
            <tr>
              <th scope="rowgroup" colSpan={5} className={s.groupHead}>
                Tools and methods
              </th>
            </tr>
            {SKILLS.map((group) => (
              <tr key={group.id}>
                <td className={s.tdId}>{group.id}</td>
                <td className={s.tdClaim}>
                  {group.label}: {group.items.join(", ")}.
                </td>
                {LENSES.map((lens) => (
                  <td
                    key={lens.id}
                    data-lens={lens.label}
                    className={
                      active?.id === lens.id ? `${s.tdW} ${s.tdOn}` : s.tdW
                    }
                  >
                    {MARK[group.w[lens.id]]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className={s.auditHead}>Every framing note, all three readings</h3>
        <p className={s.auditIntro}>
          Her commentary about relevance, which is the only text on this site
          that changes between readings. It is set in italic wherever it
          appears, it is labelled, and it is all here.
        </p>
        <div className={s.notes}>
          {LENSES.map((lens) => (
            <section
              key={lens.id}
              className={
                active?.id === lens.id ? `${s.noteCard} ${s.noteOn}` : s.noteCard
              }
            >
              <h4 className={s.noteCardHead}>
                {lens.label}
                <span className={s.noteTarget}>for {lens.target}</span>
              </h4>
              <p className={s.noteBody}>{lens.note}</p>
              <dl className={s.noteRoles}>
                {ROLES.map((role) => (
                  <div key={role.id}>
                    <dt>{role.org}</dt>
                    <dd>{lens.roleNotes[role.id]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}
