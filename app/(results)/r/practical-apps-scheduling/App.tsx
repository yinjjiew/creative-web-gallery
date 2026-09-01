"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import {
  DAYS,
  LEDGER,
  findings,
  householdSlip,
  nameOf,
  pupilById,
  proposals,
  schoolById,
  slotClock,
  slotKey,
  tally,
  type Finding,
  type Placement,
  type Pupil,
  type Slot,
  type Term,
} from "./model";
import { clear, load, save } from "./persist";
import { JANUARY_COPY, PROVENANCE, buildWorld } from "./seed";
import s from "./peri.module.css";

type View = "board" | "walk" | "slips";

const WORLD = buildWorld();

function toneOf(row: Finding): "held" | "soft" | "hard" {
  if (row.hard.length) return "hard";
  if (row.soft.length) return "soft";
  return "held";
}

function kindLabel(kind: Placement["kind"]): string {
  if (kind === "pair") return "pair";
  if (kind === "ensemble") return "ensemble";
  if (kind === "extra") return "exam extra";
  return "solo";
}

export default function App() {
  const [term, setTerm] = useState<Term>("autumn");
  const [placements, setPlacements] = useState<Placement[]>(WORLD.autumn);
  const [drafted, setDrafted] = useState<string[]>([]);
  const [view, setView] = useState<View>("board");
  const [filter, setFilter] = useState<string | null>(null);
  const [walk, setWalk] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState<"saved" | "failed">("saved");
  const [booted, setBooted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = load();
    if (stored) {
      setTerm(stored.term);
      setPlacements(stored.placements);
      setDrafted(stored.drafted);
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    setSaved(save({ term, placements, drafted }) ? "saved" : "failed");
  }, [booted, term, placements, drafted]);

  const rows = useMemo(() => findings(placements, WORLD, term), [placements, term]);
  const counts = useMemo(() => tally(rows), [rows]);
  const byId = useMemo(() => {
    const map = new Map<string, Finding>();
    for (const row of rows) map.set(row.placement.id, row);
    return map;
  }, [rows]);

  const broken = useMemo(() => {
    const rank = (row: Finding) => {
      const codes = new Set(row.hard.map((item) => item.code));
      if (codes.has("travel")) return 0;
      if (codes.has("overlap")) return 1;
      if (codes.has("visit")) return 2;
      if (codes.has("half")) return 3;
      if (codes.has("pullout")) return 4;
      return 5;
    };
    const items: { row: Finding; pupil: Pupil }[] = [];
    for (const row of rows) {
      if (!row.hard.length) continue;
      for (const id of row.placement.pupilIds) {
        items.push({ row, pupil: pupilById(WORLD, id) });
      }
    }
    items.sort((a, b) => {
      const diff = rank(a.row) - rank(b.row);
      if (diff) return diff;
      return nameOf(a.pupil).localeCompare(nameOf(b.pupil));
    });
    return items;
  }, [rows]);

  const shown = useMemo(() => {
    const list = filter
      ? rows.filter((row) =>
          [...row.hard, ...row.soft].some((item) => item.code === filter),
        )
      : rows;
    return [...list].sort((a, b) => {
      const ta = toneOf(a);
      const tb = toneOf(b);
      const rank = { hard: 0, soft: 1, held: 2 };
      if (rank[ta] !== rank[tb]) return rank[ta] - rank[tb];
      const na = nameOf(pupilById(WORLD, a.placement.pupilIds[0]));
      const nb = nameOf(pupilById(WORLD, b.placement.pupilIds[0]));
      return na.localeCompare(nb);
    });
  }, [rows, filter]);

  const current = broken[Math.min(walk, Math.max(0, broken.length - 1))];
  const offer = useMemo(() => {
    if (!current) return null;
    return proposals(WORLD, term, placements, current.row.placement);
  }, [current, placements, term]);

  useEffect(() => {
    if (walk >= broken.length) setWalk(0);
  }, [broken.length, walk]);

  useEffect(() => {
      setPicked(null);
  }, [current?.row.placement.id, current?.pupil.id, term]);

  const applyJanuary = useCallback(() => {
    setTerm("spring");
    setView("board");
    setWalk(0);
    setFilter(null);
  }, []);

  const holdAutumn = useCallback(() => {
    setTerm("autumn");
    setWalk(0);
  }, []);

  const seat = useCallback(
    (slot: Slot) => {
      if (!current) return;
      setPlacements((prev) =>
        prev.map((item) =>
          item.id === current.row.placement.id ? { ...item, ...slot } : item,
        ),
      );
      setPicked(null);
      setWalk((n) => Math.min(n + 1, Math.max(0, broken.length - 1)));
    },
    [current, broken.length],
  );

  const reset = useCallback(() => {
    clear();
    setTerm("autumn");
    setPlacements(WORLD.autumn.map((item) => ({ ...item })));
    setDrafted([]);
    setView("board");
    setFilter(null);
    setWalk(0);
    setOpenId(null);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "Escape") {
        setOpenId(null);
        return;
      }
      if (event.key === "1") setView("board");
      if (event.key === "2") setView("walk");
      if (event.key === "3") setView("slips");
      if (view === "walk" && broken.length) {
        if (event.key === "ArrowRight" || event.key === "j") {
          setWalk((n) => (n + 1) % broken.length);
        }
        if (event.key === "ArrowLeft" || event.key === "k") {
          setWalk((n) => (n - 1 + broken.length) % broken.length);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, broken.length]);

  useEffect(() => {
    if (!openId) return;
    const node = sheetRef.current?.querySelector<HTMLElement>("button, [href]");
    node?.focus();
  }, [openId]);

  const slips = useMemo(() => {
    return WORLD.pupils
      .map((pupil) => {
        const currentSeat = placements.find(
          (item) => item.kind !== "extra" && item.pupilIds.includes(pupil.id),
        );
        const original = WORLD.autumn.find(
          (item) => item.kind !== "extra" && item.pupilIds.includes(pupil.id),
        );
        const slip = householdSlip(WORLD, term, pupil, currentSeat, original);
        const row = currentSeat ? byId.get(currentSeat.id) : undefined;
        return {
          pupil,
          slip: {
            ...slip,
            broken: Boolean(slip.broken || row?.hard.length),
          },
        };
      })
      .filter((item) => item.slip.changed || item.slip.broken);
  }, [placements, term, byId]);

  const openPupil = openId ? pupilById(WORLD, openId) : null;
  const compact = view !== "board";

  if (!booted) {
    return <div className={s.booting} aria-busy="true" />;
  }

  return (
    <div className={s.shell} data-view={view}>
      <a className={s.escape} href="/tasks/practical-apps-scheduling">
        Task
      </a>
      <header className={s.mast}>
        <p className={s.kicker}>Violin · six schools · corridor</p>
        <h1 className={s.title}>Peripatetic</h1>
        {compact ? null : (
          <>
            <p className={s.lede}>
              Not a calendar. The object is the constraint: pull-out windows he
              does not control, a twenty-five minute run he cannot teach either
              side of, pairs that only hold if the levels match. He has judgement
              a solver does not. The software proposes, and shows what a change
              broke.
            </p>
            <p className={s.provenance}>{PROVENANCE}</p>
          </>
        )}
      </header>

      <div className={s.termRow}>
        <button
          type="button"
          className={s.termBtn}
          aria-pressed={term === "autumn"}
          onClick={holdAutumn}
        >
          <span className={s.termName}>Autumn hold</span>
          <span className={s.termCopy}>The paper grid, before the tear</span>
        </button>
        <button
          type="button"
          className={s.termBtn}
          data-danger="true"
          aria-pressed={term === "spring"}
          onClick={applyJanuary}
        >
          <span className={s.termName}>January tear</span>
          <span className={s.termCopy}>Apply St Hilda&apos;s new timetable</span>
        </button>
      </div>

      <div className={s.counts} aria-live="polite">
        <div className={s.count} data-tone="hard">
          <b>{broken.length}</b>
          <span>broken</span>
        </div>
        <div className={s.count} data-tone="soft">
          <b>{counts.soft}</b>
          <span>soft</span>
        </div>
        <div className={s.count} data-tone="held">
          <b>{counts.held}</b>
          <span>held</span>
        </div>
        <div className={s.count}>
          <b>{WORLD.pupils.length}</b>
          <span>pupils</span>
        </div>
      </div>

      {view === "board" && term === "spring" ? (
        <aside className={s.janNote}>
          <h2>{JANUARY_COPY.title}</h2>
          <p>{JANUARY_COPY.body}</p>
          {broken.length > 0 ? (
            <button type="button" className={s.primary} onClick={() => setView("walk")}>
              Walk the {broken.length} breaks
            </button>
          ) : (
            <p>Every hard break has been reseated. The slips still need wording.</p>
          )}
        </aside>
      ) : null}
      {view === "board" && term === "autumn" ? (
        <aside className={s.janNote} style={{ background: "var(--paper)", borderLeftColor: "var(--navy)" }}>
          <h2>He uses this between lessons</h2>
          <p>
            One last-period waste already (Finlay, Year 4), exam extras not
            yet seated for everyone, and a Tuesday-only pupil correctly on
            Tuesday. The designed moment is the tear on the right.
          </p>
        </aside>
      ) : null}

      {view === "board" ? (
        <Board
          term={term}
          rows={rows}
          shown={shown}
          filter={filter}
          onFilter={setFilter}
          onOpen={setOpenId}
        />
      ) : null}

      {view === "walk" ? (
        <Walk
          term={term}
          broken={broken}
          index={walk}
          onIndex={setWalk}
          offer={offer}
          picked={picked}
          onPick={setPicked}
          onSeat={() => {
            const slot = offer?.legal.find((item) => slotKey(item.slot) === picked);
            if (slot) seat(slot.slot);
          }}
          onSkip={() => setWalk((n) => (n + 1) % Math.max(1, broken.length))}
        />
      ) : null}

      {view === "slips" ? (
        <Slips
          items={slips}
          drafted={drafted}
          copied={copied}
          onDraft={(id) =>
            setDrafted((prev) => (prev.includes(id) ? prev : [...prev, id]))
          }
          onCopy={async (id, body) => {
            try {
              await navigator.clipboard.writeText(body);
              setCopied(id);
            } catch {
              setCopied(null);
            }
          }}
        />
      ) : null}

      {openPupil ? (
        <PupilSheet
          pupil={openPupil}
          term={term}
          placements={placements}
          sheetRef={sheetRef}
          onClose={() => setOpenId(null)}
          onSeat={(placementId, slot) => {
            setPlacements((prev) =>
              prev.map((item) =>
                item.id === placementId ? { ...item, ...slot } : item,
              ),
            );
          }}
        />
      ) : null}

      <nav className={s.nav} aria-label="Desk">
        <button
          type="button"
          aria-current={view === "board" ? "page" : undefined}
          onClick={() => setView("board")}
        >
          Constraints
        </button>
        <button
          type="button"
          aria-current={view === "walk" ? "page" : undefined}
          onClick={() => setView("walk")}
        >
          Breaks {broken.length ? `(${String(broken.length)})` : ""}
        </button>
        <button
          type="button"
          aria-current={view === "slips" ? "page" : undefined}
          onClick={() => setView("slips")}
        >
          Slips {slips.length ? `(${String(slips.length)})` : ""}
        </button>
      </nav>

      <p className={s.save}>
        {saved === "failed" ? "Could not keep this device" : "Stays on this device"}
        {" · "}
        <button type="button" className={s.quiet} onClick={reset} style={{ minHeight: 0, padding: 0 }}>
          Reset
        </button>
      </p>
    </div>
  );
}

function Board({
  term,
  rows,
  shown,
  filter,
  onFilter,
  onOpen,
}: {
  term: Term;
  rows: Finding[];
  shown: Finding[];
  filter: string | null;
  onFilter: (code: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const visits = WORLD.visits[term];
  const autumnVisits = WORLD.visits.autumn;

  return (
    <div className={s.desk}>
      <section className={s.card}>
        <h2>Where the body is</h2>
        <div className={s.days}>
          {DAYS.map((day) => {
            const here = visits.filter((visit) => visit.day === day);
            const lost = autumnVisits.filter(
              (visit) =>
                visit.day === day &&
                !here.some((item) => item.schoolId === visit.schoolId),
            );
            return (
              <div key={day} className={s.day}>
                <div className={s.dayName}>{day}</div>
                {lost.map((visit) => {
                  const school = schoolById(WORLD, visit.schoolId);
                  return (
                    <div key={`lost-${visit.schoolId}`} className={s.block} data-lost="true">
                      <span className={s.blockSchool}>{school.short}</span>
                      <span className={s.blockMeta}>visiting hours withdrawn</span>
                    </div>
                  );
                })}
                {here.map((visit, index) => {
                  const school = schoolById(WORLD, visit.schoolId);
                  const seated = rows.filter(
                    (row) =>
                      row.placement.schoolId === visit.schoolId &&
                      row.placement.day === day,
                  );
                  const was = autumnVisits.some(
                    (item) =>
                      item.day === day &&
                      item.schoolId === visit.schoolId &&
                      item.periods.join() === visit.periods.join(),
                  );
                  const next = here[index + 1];
                  const travel = next
                    ? WORLD.travel.find(
                        (edge) =>
                          (edge.a === visit.schoolId && edge.b === next.schoolId) ||
                          (edge.a === next.schoolId && edge.b === visit.schoolId),
                      )
                    : undefined;
                  const given = WORLD.required[term].some(
                    (item) => item.schoolId === visit.schoolId && item.day === day,
                  );
                  const nextSeated = next
                    ? rows.filter(
                        (row) =>
                          row.placement.schoolId === next.schoolId &&
                          row.placement.day === day,
                      )
                    : [];
                  const travelBroke = [...seated, ...nextSeated].some((row) =>
                    row.hard.some((item) => item.code === "travel" || item.code === "overlap"),
                  );
                  return (
                    <div key={visit.schoolId}>
                      <div className={s.block} data-new={term === "spring" && !was ? "true" : undefined}>
                        <span className={s.blockSchool}>{school.short}</span>
                        <span className={s.blockMeta}>
                          P{visit.periods[0] + 1}–{visit.periods[visit.periods.length - 1] + 1}
                          {given ? " · room given" : ""}
                          {" · "}
                          {seated.length} seated
                          {seated.some((row) => row.hard.length)
                            ? ` · ${seated.filter((row) => row.hard.length).length} broken`
                            : ""}
                        </span>
                      </div>
                      {travel ? (
                        <div className={s.travel} data-broke={travelBroke ? "true" : undefined}>
                          {travelBroke
                            ? `${String(travel.minutes)} min — gap too short`
                            : `${String(travel.minutes)} min run`}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.card}>
        <h2>Constraint ledger</h2>
        <div className={s.ledger}>
          {LEDGER.map((item) => {
            const n = rows.reduce(
              (sum, row) =>
                sum + [...row.hard, ...row.soft].filter((v) => v.code === item.code).length,
              0,
            );
            const hard = rows.some((row) => row.hard.some((v) => v.code === item.code));
            return (
              <button
                key={item.code}
                type="button"
                className={s.row}
                aria-pressed={filter === item.code}
                onClick={() => onFilter(filter === item.code ? null : item.code)}
              >
                <span className={s.rowLabel}>
                  <b>{item.label}</b>
                  <span>{item.hint}</span>
                </span>
                <span className={s.pips} data-tone={n === 0 ? undefined : hard ? "hard" : "soft"}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={s.card} style={{ gridColumn: "1 / -1" }}>
        <div className={s.registerHead}>
          <h2>
            Register · {shown.length}
            {filter ? ` · ${LEDGER.find((item) => item.code === filter)?.label ?? filter}` : ""}
          </h2>
          {filter ? (
            <button type="button" className={s.clear} onClick={() => onFilter(null)}>
              Clear filter
            </button>
          ) : null}
        </div>
        <div className={s.list}>
          {shown.map((row) => {
            const pupil = pupilById(WORLD, row.placement.pupilIds[0]);
            const school = schoolById(WORLD, row.placement.schoolId);
            const clock = slotClock(
              school,
              term,
              row.placement.period,
              row.placement.half,
            );
            const names = row.placement.pupilIds.map((id) => nameOf(pupilById(WORLD, id))).join(" · ");
            return (
              <button
                key={row.placement.id}
                type="button"
                className={s.pupil}
                onClick={() => onOpen(pupil.id)}
              >
                <i className={s.pip} data-tone={toneOf(row)} aria-hidden />
                <span className={s.who}>
                  <b>{names}</b>
                  <span>
                    {school.short} · Y{pupil.year} · G{pupil.level} · {kindLabel(row.placement.kind)}
                  </span>
                </span>
                <span className={s.when}>
                  {row.hard.length
                    ? row.hard[0].code
                    : `${row.placement.day} ${clock.start}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Walk({
  term,
  broken,
  index,
  onIndex,
  offer,
  picked,
  onPick,
  onSeat,
  onSkip,
}: {
  term: Term;
  broken: { row: Finding; pupil: Pupil }[];
  index: number;
  onIndex: (n: number) => void;
  offer: ReturnType<typeof proposals> | null;
  picked: string | null;
  onPick: (key: string | null) => void;
  onSeat: () => void;
  onSkip: () => void;
}) {
  if (!broken.length) {
    return (
      <div className={s.panel}>
        <div className={s.empty}>
          <h2>Nothing torn</h2>
          <p>
            {term === "autumn"
              ? "Autumn still holds. Apply the January timetable to see the tear."
              : "Every hard break has been reseated. Judgement did the work; a solver did not."}
          </p>
        </div>
      </div>
    );
  }

  const { row, pupil } = broken[index];
  const names = nameOf(pupil);
  const mates = row.placement.pupilIds
    .filter((id) => id !== pupil.id)
    .map((id) => nameOf(pupilById(WORLD, id)));
  const school = schoolById(WORLD, row.placement.schoolId);
  const clock = slotClock(school, term, row.placement.period, row.placement.half);

  return (
    <div className={s.panel}>
      <div className={s.walkHead}>
        <p>
          {index + 1} of {broken.length}
        </p>
        <div>
          <button
            type="button"
            className={s.ghost}
            aria-label="Previous break"
            onClick={() => onIndex((index - 1 + broken.length) % broken.length)}
          >
            Previous
          </button>
          <button type="button" className={s.ghost} aria-label="Next break" onClick={onSkip}>
            Next
          </button>
        </div>
      </div>
      <article className={s.walkCard}>
        <h2>{names}</h2>
        <p className={s.meta}>
          {school.short} · {kindLabel(row.placement.kind)}
          {mates.length ? ` with ${mates.join(" · ")}` : ""}
          {" · "}
          was {row.placement.day} {clock.start}–{clock.end}
        </p>
        <ul className={s.broke}>
          {row.hard.map((item) => (
            <li key={item.code + item.message}>{item.message}</li>
          ))}
          {row.soft.map((item) => (
            <li key={item.code + item.message}>{item.message}</li>
          ))}
        </ul>

        <p className={s.sectionLabel}>Legal windows · he chooses</p>
        {offer?.legal.length ? (
          offer.legal.slice(0, 6).map((item) => {
            const key = slotKey(item.slot);
            return (
              <button
                key={key}
                type="button"
                className={s.choice}
                aria-pressed={picked === key}
                onClick={() => onPick(picked === key ? null : key)}
              >
                <b>
                  {item.slot.day} {item.clock.start}–{item.clock.end}
                </b>
                <span>
                  Period {item.slot.period + 1}
                  {item.slot.half === "b" ? " late" : " early"}
                  {item.soft.length ? ` · ${item.soft[0].message}` : " · no soft debt"}
                </span>
              </button>
            );
          })
        ) : (
          <p>No legal window remains at {school.short} under this timetable. Hold it and come back.</p>
        )}

        <p className={s.sectionLabel}>Why the tempting ones fail</p>
        {offer?.blocked.map((item) => (
          <div key={slotKey(item.slot)} className={`${s.choice} ${s.blocked}`}>
            <b>
              {item.slot.day} {item.clock.start}–{item.clock.end}
            </b>
            <span>{item.whyNot?.[0]?.message}</span>
          </div>
        ))}

        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={onSeat} disabled={!picked}>
            Seat here
          </button>
          <button type="button" className={s.ghost} onClick={onSkip}>
            Hold for now
          </button>
        </div>
      </article>
    </div>
  );
}

function Slips({
  items,
  drafted,
  copied,
  onDraft,
  onCopy,
}: {
  items: { pupil: Pupil; slip: ReturnType<typeof householdSlip> }[];
  drafted: string[];
  copied: string | null;
  onDraft: (id: string) => void;
  onCopy: (id: string, body: string) => void;
}) {
  if (!items.length) {
    return (
      <div className={s.panel}>
        <div className={s.empty}>
          <h2>No slips yet</h2>
          <p>
            Each household is told only their own child&apos;s time, and only
            when that time moved or broke. Nothing is sent from this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.panel}>
      <p className={s.provenance} style={{ marginBottom: 12 }}>
        {items.length} households need wording. Each slip names only that child.
        Nothing is sent.
      </p>
      {items.map(({ pupil, slip }) => (
        <article key={pupil.id} className={s.slip}>
          <pre>{slip.body}</pre>
          <div className={s.actions}>
            <button type="button" className={s.ghost} onClick={() => onCopy(pupil.id, slip.body)}>
              {copied === pupil.id ? "Copied" : "Copy wording"}
            </button>
            <button
              type="button"
              className={s.primary}
              onClick={() => onDraft(pupil.id)}
              disabled={drafted.includes(pupil.id)}
            >
              {drafted.includes(pupil.id) ? "Drafted" : "Mark drafted"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function PupilSheet({
  pupil,
  term,
  placements,
  sheetRef,
  onClose,
  onSeat,
}: {
  pupil: Pupil;
  term: Term;
  placements: Placement[];
  sheetRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSeat: (placementId: string, slot: Slot) => void;
}) {
  const school = schoolById(WORLD, pupil.schoolId);
  const mine = placements.filter((item) => item.pupilIds.includes(pupil.id));
  const weekly = mine.find((item) => item.kind !== "extra");
  const row = weekly ? findings(placements, WORLD, term).find((item) => item.placement.id === weekly.id) : undefined;
  const offer = weekly ? proposals(WORLD, term, placements, weekly) : null;

  return (
    <div
      className={s.sheet}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pupil-sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={s.sheetInner} ref={sheetRef}>
        <h2 id="pupil-sheet">{nameOf(pupil)}</h2>
        <p className={s.meta}>
          {school.name} · Year {pupil.year} · Grade {pupil.level}
          {pupil.young ? " · too young for last period" : ""}
          {pupil.tuesdayOnly ? " · Tuesdays only" : ""}
          {pupil.exam ? ` · Grade ${String(pupil.exam.grade)} practical 12–19 Mar` : ""}
          {pupil.ensemble ? " · ensemble" : ""}
        </p>
        <ul className={s.checks}>
          {(row ? [...row.hard, ...row.soft] : []).map((item) => (
            <li key={item.code + item.message}>
              <i className={s.mark} data-tone={item.severity} />
              <span>{item.message}</span>
            </li>
          ))}
          {row && !row.hard.length && !row.soft.length ? (
            <li>
              <i className={s.mark} />
              <span>Every hard constraint holds.</span>
            </li>
          ) : null}
        </ul>
        <p className={s.sectionLabel}>Reseat — legal windows only</p>
        {offer?.legal.slice(0, 8).map((item) => (
          <button
            key={slotKey(item.slot)}
            type="button"
            className={s.choice}
            onClick={() => weekly && onSeat(weekly.id, item.slot)}
          >
            <b>
              {item.slot.day} {item.clock.start}–{item.clock.end}
            </b>
            <span>
              Period {item.slot.period + 1}
              {item.soft.length ? ` · ${item.soft[0].message}` : ""}
            </span>
          </button>
        ))}
        <div className={s.actions}>
          <button type="button" className={s.ghost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
