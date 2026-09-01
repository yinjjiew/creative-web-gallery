"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Audit from "./Audit";
import s from "./fit.module.css";
import {
  EDUCATION,
  LENSES,
  PERSON,
  PROVENANCE,
  ROLES,
  WRITING,
  type Claim,
  type Role,
} from "./record";
import {
  detailShown,
  ledger,
  lensById,
  place,
  placeSkills,
  plainText,
  type Placed,
  type Reading,
} from "./reading";

/** FLIP needs positions before paint; the module scope keeps the hook stable. */
const useIsomorphic =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

const WEIGHT_WORD: Record<number, string> = {
  3: "led with",
  2: "in the body",
  1: "set back",
};

type ClaimHandlers = {
  onInspect: (id: string) => void;
  onExpand: (id: string) => void;
  register: (id: string, node: HTMLLIElement | null) => void;
  openId: string | null;
  expandedIds: Set<string>;
};

function Bars({ weight }: { weight: number }) {
  return (
    <span className={s.bars} aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <i key={step} className={weight >= step ? s.barOn : s.barOff} />
      ))}
    </span>
  );
}

function ClaimRow({
  placed,
  reading,
  unfold,
  open,
  onInspect,
  expanded,
  onExpand,
  register,
}: {
  placed: Placed;
  reading: Reading;
  unfold: boolean;
  open: boolean;
  onInspect: (id: string) => void;
  expanded: boolean;
  onExpand: (id: string) => void;
  register: (id: string, node: HTMLLIElement | null) => void;
}) {
  const { claim, weight } = placed;
  const showDetail =
    Boolean(claim.detail) && (detailShown(claim, reading, unfold) || expanded);
  const folded = Boolean(claim.detail) && !showDetail;
  const lens = lensById(reading);

  return (
    <li
      ref={(node) => {
        register(claim.id, node);
      }}
      className={[
        s.row,
        s.claim,
        s[`w${String(weight)}`],
        claim.pinned ? s.pinned : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={s.gutter}>
        <button
          type="button"
          className={s.markButton}
          aria-expanded={open}
          aria-label={
            lens
              ? `Claim ${claim.id}, ${WEIGHT_WORD[weight]} in the ${lens.label} reading. Show its weight in all three readings.`
              : `Claim ${claim.id}. Show its weight in all three readings.`
          }
          onClick={() => {
            onInspect(claim.id);
          }}
        >
          <span className={s.markId} aria-hidden="true">
            {claim.id}
          </span>
          {reading ? <Bars weight={weight} /> : <span className={s.flat} />}
        </button>
      </div>

      <div className={s.body}>
        {claim.pinned ? (
          <p className={s.pinNote}>
            pinned — first in every reading, never folded
          </p>
        ) : null}
        <p className={s.claimText}>{claim.text}</p>
        {/*
          Rendered whether or not this reading shows it, and hidden with CSS,
          so that the printed sheet carries every detail regardless of which
          buttons were pressed on screen. Folding is a screen convenience; it
          must not be able to leave something off the paper.
        */}
        {claim.detail ? (
          <p className={showDetail ? s.detail : `${s.detail} ${s.detailFolded}`}>
            {claim.detail}
          </p>
        ) : null}
        {folded ? (
          <button
            type="button"
            className={s.foldButton}
            onClick={() => {
              onExpand(claim.id);
            }}
          >
            <span aria-hidden="true">+</span> detail folded here — open it
          </button>
        ) : null}
        {open ? <Inspector claim={claim} /> : null}
      </div>
    </li>
  );
}

function Inspector({ claim }: { claim: Claim }) {
  return (
    <div className={s.inspect}>
      <p className={s.inspectHead}>
        {claim.id} · one string in the record, shown here in all four views
      </p>
      <ul className={s.inspectList}>
        {LENSES.map((lens) => (
          <li key={lens.id}>
            <span className={s.inspectLens}>{lens.label}</span>
            <Bars weight={claim.w[lens.id]} />
            <span className={s.inspectWord}>
              {claim.pinned ? "pinned" : WEIGHT_WORD[claim.w[lens.id]]}
            </span>
          </li>
        ))}
      </ul>
      <p className={s.inspectFoot}>
        Only the order and the size change. The words above are the same words
        in the engineering, program and operations readings.
      </p>
    </div>
  );
}

function RoleBlock({
  role,
  reading,
  unfold,
  claimProps,
  hint,
}: {
  role: Role;
  reading: Reading;
  unfold: boolean;
  claimProps: ClaimHandlers;
  /** Explains the empty right margin once, in the record. */
  hint?: boolean;
}) {
  const lens = lensById(reading);
  const note = lens ? lens.roleNotes[role.id] : undefined;
  const placedClaims = place(role.claims, reading, unfold);
  const { openId, expandedIds, ...rest } = claimProps;

  return (
    <section className={s.role}>
      <header className={s.row}>
        <div className={s.gutter}>
          <span className={s.span}>{role.span}</span>
        </div>
        <div className={s.body}>
          <h3 className={s.org}>
            {role.org}
            <span className={s.place}>{role.place}</span>
          </h3>
          <p className={s.what}>{role.what}</p>
          <ul className={s.stints}>
            {role.stints.map((stint) => (
              <li key={stint.title}>
                <span className={s.stintTitle}>{stint.title}</span>
                {role.stints.length > 1 ? (
                  <span className={s.stintDates}>
                    {stint.from} – {stint.to}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        {note ? (
          <aside className={s.note}>
            <span className={s.noteLabel}>framing</span>
            {note}
          </aside>
        ) : hint ? (
          <aside className={s.hint}>
            This margin is where her framing goes when a reading is chosen. The
            record has none, so it is empty.
          </aside>
        ) : null}
      </header>

      <ul className={s.claims}>
        {placedClaims.map((placed) => (
          <ClaimRow
            key={placed.claim.id}
            placed={placed}
            reading={reading}
            unfold={unfold}
            open={openId === placed.claim.id}
            expanded={expandedIds.has(placed.claim.id)}
            {...rest}
          />
        ))}
      </ul>
    </section>
  );
}

export default function Fit() {
  const [reading, setReading] = useState<Reading>(null);
  const [unfold, setUnfold] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [expandedIds, setExpanded] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"sheet" | "text">("sheet");
  const [copied, setCopied] = useState(false);

  const lens = lensById(reading);
  const book = useMemo(() => ledger(reading, unfold), [reading, unfold]);
  const text = useMemo(() => plainText(reading), [reading]);

  const nodes = useRef(new Map<string, HTMLLIElement>());
  const positions = useRef(new Map<string, number>());

  const register = useCallback((id: string, node: HTMLLIElement | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  /**
   * The same claims move to new places; they are not replaced by new ones. A
   * FLIP makes that literally true on screen — you watch a paragraph travel
   * rather than watch a document be swapped — which is the argument of the
   * whole piece expressed as motion. Skipped entirely under reduced motion,
   * where the reordering is still correct, just instant.
   */
  useIsomorphic(() => {
    const before = positions.current;
    const after = new Map<string, number>();
    nodes.current.forEach((node, id) => {
      after.set(id, node.getBoundingClientRect().top);
    });

    const still =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!still && before.size) {
      nodes.current.forEach((node, id) => {
        const from = before.get(id);
        const to = after.get(id);
        if (from === undefined || to === undefined) return;
        const delta = from - to;
        if (Math.abs(delta) < 2) return;
        node.animate(
          [{ transform: `translateY(${String(delta)}px)` }, { transform: "none" }],
          { duration: 460, easing: "cubic-bezier(.22,.61,.36,1)" }
        );
      });
    }
    positions.current = after;
  }, [reading, unfold, openId, expandedIds, view]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 2200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard permission can be refused, and a résumé tool that just fails
      // silently is useless. The text is on screen and selectable either way,
      // so say so instead of pretending it worked.
      setCopied(false);
      window.alert(
        "The clipboard was refused. The plain text is on screen — select it and copy."
      );
    }
  }, [text]);

  const download = useCallback(() => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hana-bergstrom-${lens ? lens.id : "record"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [text, lens]);

  const inspect = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  const expandOne = useCallback((id: string) => {
    setExpanded((current) => new Set(current).add(id));
  }, []);

  const claimProps = {
    onInspect: inspect,
    onExpand: expandOne,
    register,
    openId,
    expandedIds,
  };

  return (
    <main className={s.page}>
      <div className={s.bar}>
        <div className={s.barInner}>
          <div className={s.readings} role="group" aria-label="Reading">
            <span className={s.barLabel}>Read as</span>
            <button
              type="button"
              className={s.tab}
              aria-pressed={reading === null}
              onClick={() => {
                setReading(null);
              }}
            >
              The record
            </button>
            {LENSES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={s.tab}
                aria-pressed={reading === item.id}
                onClick={() => {
                  setReading(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={s.actions}>
            <button
              type="button"
              className={s.action}
              aria-pressed={unfold}
              onClick={() => {
                setUnfold((value) => !value);
              }}
            >
              {unfold ? "Fold details back" : "Unfold every detail"}
            </button>
            <button
              type="button"
              className={s.action}
              aria-pressed={view === "text"}
              onClick={() => {
                setView((value) => (value === "text" ? "sheet" : "text"));
              }}
            >
              Plain text
            </button>
            <button
              type="button"
              className={s.action}
              onClick={() => {
                window.print();
              }}
            >
              Print
            </button>
          </div>
        </div>

        <details className={s.ledger}>
          <summary className={s.ledgerLine}>
            {lens ? (
              <>
                <span className={s.ledgerSame}>
                  Same {book.claims} claims, {book.altered} altered.
                </span>{" "}
                <span className={s.ledgerCounts}>
                  {book.moved} moved · {book.forward} brought forward ·{" "}
                  {book.back} set back · {book.folded} details folded ·{" "}
                  {book.notes} framing notes added
                </span>
              </>
            ) : (
              <>
                <span className={s.ledgerSame}>
                  The record: {book.claims} claims in date order, nothing
                  emphasised.
                </span>{" "}
                <span className={s.ledgerCounts}>
                  Pick a reading and it reorders — nothing is added or taken
                  away
                </span>
              </>
            )}
          </summary>
          <div className={s.ledgerBody}>
            <p>
              A reading is a sort order. The claims live in one module and the
              orderings in another, and an ordering is handed claim ids, never
              claim text, so it has nothing to rewrite. What a reading may do is
              move a claim up or down, set it in larger or smaller type, and
              fold a claim’s further detail out of the way — and the counts
              above are that diff, computed against the record every time you
              switch.
            </p>
            <p>
              Folded is not hidden: the detail is one click away, the record
              view and the printed page always carry it, and{" "}
              <em>unfold every detail</em> brings it all back in any reading.
            </p>
            <p className={s.checksum}>
              record checksum <b>{book.checksum}</b> — a hash of all{" "}
              {book.claims} claims and {book.groups} skill groups. It is the
              same eight digits in all four views. If a reading were quietly
              rewriting a sentence to suit an audience, this number would not
              match, and you would not have to take anyone’s word for it.
            </p>
          </div>
        </details>

        <p aria-live="polite" className={s.sr}>
          {lens
            ? `${lens.label} reading. The same ${String(book.claims)} claims, ${String(book.altered)} altered, ${String(book.moved)} moved, ${String(book.folded)} details folded.`
            : `The record. ${String(book.claims)} claims in date order, nothing emphasised.`}
        </p>
      </div>

      <div className={s.sheet}>
        <header className={s.masthead}>
          <div className={s.row}>
            <div className={s.gutter}>
              <span className={s.kicker}>résumé</span>
            </div>
            <div className={s.body}>
              <h1 className={s.name}>{PERSON.name}</h1>
              <p className={s.line}>{PERSON.line}</p>
              <p className={s.headline}>{PERSON.headline}</p>
            </div>
            <aside className={s.contact}>
              <span>{PERSON.place}</span>
              <span>{PERSON.email}</span>
              <span>{PERSON.phone}</span>
            </aside>
          </div>
        </header>

        {view === "text" ? (
          <section className={s.plain}>
            <div className={s.row}>
              <div className={s.gutter}>
                <span className={s.sectionMark}>txt</span>
              </div>
              <div className={s.body}>
                <h2 className={s.sectionHead}>Plain text</h2>
                <p className={s.plainNote}>
                  The {lens ? `${lens.label.toLowerCase()} reading` : "record"},
                  hard-wrapped at 76 characters, no columns and no tabs, for
                  pasting into an application form that will strip everything
                  else. Every claim and every detail is in here, including the
                  ones folded on screen.
                </p>
                <div className={s.plainActions}>
                  <button
                    type="button"
                    className={s.action}
                    onClick={() => {
                      void copy();
                    }}
                  >
                    {copied ? "Copied" : "Copy to clipboard"}
                  </button>
                  <button type="button" className={s.action} onClick={download}>
                    Download .txt
                  </button>
                </div>
                <p className={s.plainCaption}>
                  76 columns wide, so it scrolls sideways on a narrow screen
                  rather than being re-wrapped into nonsense.
                </p>
              </div>
            </div>
            <pre className={s.pre}>{text}</pre>
          </section>
        ) : (
          <>
            {lens ? (
              <div className={`${s.row} ${s.readingNote}`}>
                <div className={s.gutter}>
                  <span className={s.sectionMark}>note</span>
                </div>
                <div className={s.body}>
                  <p className={s.noteLabel}>
                    framing
                    <span className={s.noteLabelSoft}>
                      her commentary for {lens.target}, not a claim — the only
                      text on the page that changes with the reading
                    </span>
                  </p>
                  <p className={s.noteText}>{lens.note}</p>
                </div>
              </div>
            ) : null}

            <section className={s.section}>
              <div className={`${s.row} ${s.sectionRow}`}>
                <div className={s.gutter}>
                  <span className={s.sectionMark}>01</span>
                </div>
                <div className={s.body}>
                  <h2 className={s.sectionHead}>Experience</h2>
                </div>
              </div>
              {ROLES.map((role, index) => (
                <RoleBlock
                  key={role.id}
                  role={role}
                  reading={reading}
                  unfold={unfold}
                  claimProps={claimProps}
                  hint={index === 0 && reading === null}
                />
              ))}
            </section>

            <section className={s.section}>
              <div className={`${s.row} ${s.sectionRow}`}>
                <div className={s.gutter}>
                  <span className={s.sectionMark}>02</span>
                </div>
                <div className={s.body}>
                  <h2 className={s.sectionHead}>Education</h2>
                </div>
              </div>
              <ul className={s.claims}>
                {place(EDUCATION, reading, unfold).map((placed) => (
                  <ClaimRow
                    key={placed.claim.id}
                    placed={placed}
                    reading={reading}
                    unfold={unfold}
                    open={openId === placed.claim.id}
                    expanded={expandedIds.has(placed.claim.id)}
                    onInspect={inspect}
                    onExpand={expandOne}
                    register={register}
                  />
                ))}
              </ul>
            </section>

            <section className={s.section}>
              <div className={`${s.row} ${s.sectionRow}`}>
                <div className={s.gutter}>
                  <span className={s.sectionMark}>03</span>
                </div>
                <div className={s.body}>
                  <h2 className={s.sectionHead}>Tools and methods</h2>
                </div>
              </div>
              {placeSkills(reading).map((group) => (
                <div className={s.row} key={group.id}>
                  <div className={s.gutter}>
                    <span className={s.markId}>{group.id}</span>
                    {reading ? <Bars weight={group.w[reading]} /> : null}
                  </div>
                  <div className={s.body}>
                    <p
                      className={`${s.skills} ${
                        s[`w${String(reading ? group.w[reading] : 2)}`]
                      }`}
                    >
                      <b className={s.skillLabel}>{group.label}</b>
                      {group.items.join(", ")}.
                    </p>
                  </div>
                </div>
              ))}
            </section>

            <section className={s.section}>
              <div className={`${s.row} ${s.sectionRow}`}>
                <div className={s.gutter}>
                  <span className={s.sectionMark}>04</span>
                </div>
                <div className={s.body}>
                  <h2 className={s.sectionHead}>Talks and writing</h2>
                </div>
              </div>
              <ul className={s.claims}>
                {place(WRITING, reading, unfold).map((placed) => (
                  <ClaimRow
                    key={placed.claim.id}
                    placed={placed}
                    reading={reading}
                    unfold={unfold}
                    open={openId === placed.claim.id}
                    expanded={expandedIds.has(placed.claim.id)}
                    onInspect={inspect}
                    onExpand={expandOne}
                    register={register}
                  />
                ))}
              </ul>
            </section>

            <p className={s.printFoot}>
              {lens
                ? `Printed as the ${lens.label.toLowerCase()} reading of one record: ${String(book.claims)} claims, ordered for ${lens.target}. The engineering, program and operations readings contain these same claims, word for word, in a different order. Record checksum ${book.checksum}.`
                : `Printed as the plain record: ${String(book.claims)} claims in date order, nothing emphasised. Record checksum ${book.checksum}.`}
            </p>

            <Audit reading={reading} />
          </>
        )}

        <footer className={s.colophon}>
          <div className={s.row}>
            <div className={s.gutter}>
              <span className={s.sectionMark}>fit</span>
            </div>
            <div className={s.body}>
              <p className={s.provenance}>{PROVENANCE}</p>
              <a className={s.back} href="/tasks/personal-studio-interactive-resume">
                ← the brief this answers
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
