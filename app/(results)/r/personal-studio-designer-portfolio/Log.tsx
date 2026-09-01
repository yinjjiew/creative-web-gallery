"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ENTRIES,
  LENSES,
  YEARS,
  byId,
  entriesIn,
  heaviestFor,
  mass,
  markWidth,
  monthLabel,
  monthsLabel,
  relevance,
  type Entry,
  type Lens,
} from "./entries";
import s from "./log.module.css";

function layerFor(entry: Entry, lens: Lens): string | undefined {
  if (lens === "delivered") return entry.delivered;
  if (lens === "thought") return entry.thought;
  return entry.made;
}

function shortYear(year: number): string {
  return String(year).slice(2);
}

export default function Log() {
  const [lens, setLens] = useState<Lens>("delivered");
  const [year, setYear] = useState<number | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [focusYear, setFocusYear] = useState<number>(2016);
  const [keyed, setKeyed] = useState(false);
  const readingRef = useRef<HTMLElement | null>(null);
  const shapeRef = useRef<HTMLDivElement | null>(null);

  const entry = entryId ? (byId.get(entryId) ?? null) : null;
  const openYear = entry ? entry.year : year;
  const descended = openYear !== null;
  const yearEntries = openYear ? entriesIn(openYear) : [];
  const lensMeta = LENSES.find((l) => l.id === lens) ?? LENSES[0];

  const totals = useMemo(() => {
    const months = ENTRIES.reduce((n, e) => n + e.months, 0);
    return { entries: ENTRIES.length, months };
  }, []);

  const openYearOnly = useCallback((next: number) => {
    setYear(next);
    setEntryId(null);
    setFocusYear(next);
  }, []);

  const openEntry = useCallback((next: Entry) => {
    setYear(next.year);
    setEntryId(next.id);
    setFocusYear(next.year);
  }, []);

  const ascend = useCallback(() => {
    if (entryId) {
      setEntryId(null);
      return;
    }
    if (year !== null) {
      setYear(null);
    }
  }, [entryId, year]);

  useEffect(() => {
    if (!descended) return;
    readingRef.current?.focus({ preventScroll: true });
    readingRef.current?.scrollTo(0, 0);
  }, [descended, openYear, entryId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "1") {
        setLens("delivered");
        return;
      }
      if (event.key === "2") {
        setLens("thought");
        return;
      }
      if (event.key === "3") {
        setLens("made");
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        ascend();
        return;
      }

      if (entry) {
        const list = entriesIn(entry.year);
        const index = list.findIndex((e) => e.id === entry.id);
        if (event.key === "j" || event.key === "ArrowDown") {
          event.preventDefault();
          const next = list[Math.min(list.length - 1, index + 1)];
          if (next) openEntry(next);
        }
        if (event.key === "k" || event.key === "ArrowUp") {
          event.preventDefault();
          const next = list[Math.max(0, index - 1)];
          if (next) openEntry(next);
        }
        return;
      }

      if (openYear !== null) {
        const list = entriesIn(openYear);
        if (event.key === "j" || event.key === "ArrowDown") {
          event.preventDefault();
          if (list[0]) openEntry(list[0]);
        }
        if (event.key === "k" || event.key === "ArrowUp") {
          event.preventDefault();
          const at = YEARS.indexOf(openYear as (typeof YEARS)[number]);
          const prev = YEARS[Math.max(0, at - 1)];
          if (prev !== openYear) openYearOnly(prev);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const at = YEARS.indexOf(openYear as (typeof YEARS)[number]);
          const next =
            event.key === "ArrowRight"
              ? YEARS[Math.min(YEARS.length - 1, at + 1)]
              : YEARS[Math.max(0, at - 1)];
          openYearOnly(next);
        }
        if (event.key === "Enter" && list[0]) {
          event.preventDefault();
          openEntry(list[0]);
        }
        return;
      }

      const at = YEARS.indexOf(focusYear as (typeof YEARS)[number]);
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setKeyed(true);
        setFocusYear(YEARS[Math.min(YEARS.length - 1, at + 1)]);
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setKeyed(true);
        setFocusYear(YEARS[Math.max(0, at - 1)]);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        openYearOnly(focusYear);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ascend, entry, focusYear, openEntry, openYear, openYearOnly]);

  useEffect(() => {
    if (descended) return;
    const row = shapeRef.current?.querySelector<HTMLElement>(
      `[data-year="${focusYear}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [descended, focusYear]);

  return (
    <div className={s.page} data-descended={descended ? "true" : "false"}>
      <header className={s.mast}>
        <div className={s.mastLeft}>
          <p className={s.wordmark}>Log</p>
          <p className={s.who}>
            Ivo Ren
            <span className={s.whoRule} aria-hidden="true">
              ·
            </span>
            <span className={s.span}>2012–2026</span>
          </p>
        </div>
        <p className={s.claim}>
          A modelled career, kept as a log. Width is the months a thing took.
          Ink follows who you are reading as. A two-line note stays two lines.
        </p>
        <div className={s.lenses} role="group" aria-label="Read as">
          <p className={s.lensLabel}>
            Read as <span className={s.reader}>{lensMeta.reader}</span>
          </p>
          <div className={s.lensRow}>
            {LENSES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={s.lens}
                aria-pressed={lens === item.id}
                onClick={() => {
                  setLens(item.id);
                }}
              >
                <span className={s.lensKey} aria-hidden="true">
                  {index + 1}
                </span>
                {item.label}
              </button>
            ))}
          </div>
          <p className={s.lensHint}>{lensMeta.hint}</p>
        </div>
      </header>

      <div className={s.frame}>
        <nav
          ref={shapeRef}
          className={s.shape}
          aria-label="Fourteen years, as a shape"
        >
          <p className={s.shapeLead}>
            {totals.entries} entries
            <span aria-hidden="true"> · </span>
            {Math.round(totals.months)} months of attention
          </p>
          <ol className={s.years}>
            {YEARS.map((y) => (
              <YearRow
                key={y}
                year={y}
                lens={lens}
                active={openYear === y}
                focused={!descended && keyed && focusYear === y}
                compact={descended}
                onOpenYear={openYearOnly}
                onOpenEntry={openEntry}
                onFocusYear={setFocusYear}
              />
            ))}
          </ol>
        </nav>

        <section
          ref={readingRef}
          className={s.reading}
          tabIndex={descended ? -1 : undefined}
          aria-live="polite"
          aria-label={
            entry
              ? `${entry.title}, ${monthLabel(entry.date)}`
              : openYear
                ? `Entries from ${openYear}`
                : "How to read the log"
          }
        >
          {entry ? (
            <EntryRead
              entry={entry}
              lens={lens}
              onBack={() => {
                setEntryId(null);
              }}
              onYear={() => {
                openYearOnly(entry.year);
              }}
              onOpen={openEntry}
            />
          ) : openYear ? (
            <YearRead
              year={openYear}
              lens={lens}
              entries={yearEntries}
              onOpen={openEntry}
              onBack={() => {
                setYear(null);
              }}
            />
          ) : (
            <Overview lens={lens} onOpenYear={openYearOnly} />
          )}
        </section>
      </div>

      <footer className={s.foot}>
        <p>
          Invented for this gallery — the years, the clients, the
          embarrassment. The structure is the argument: a career is
          cumulative and uneven, and a selection would have lied.
        </p>
        <Link
          className={s.back}
          href="/tasks/personal-studio-designer-portfolio"
          prefetch={false}
        >
          Task
        </Link>
      </footer>
    </div>
  );
}

function YearRow({
  year,
  lens,
  active,
  focused,
  compact,
  onOpenYear,
  onOpenEntry,
  onFocusYear,
}: {
  year: number;
  lens: Lens;
  active: boolean;
  focused: boolean;
  compact: boolean;
  onOpenYear: (year: number) => void;
  onOpenEntry: (entry: Entry) => void;
  onFocusYear: (year: number) => void;
}) {
  const list = entriesIn(year);
  const caption = heaviestFor(year, lens);
  const months = list.reduce((n, e) => n + e.months, 0);

  return (
    <li
      className={s.year}
      data-year={year}
      data-active={active ? "true" : "false"}
      data-focused={focused ? "true" : "false"}
    >
      <button
        type="button"
        className={s.yearBtn}
        aria-current={active ? "true" : undefined}
        aria-label={`${year}, ${list.length} entries, ${monthsLabel(months)}. Open the year.`}
        onClick={() => {
          onOpenYear(year);
        }}
        onFocus={() => {
          onFocusYear(year);
        }}
      >
        <span className={s.yearFull}>{year}</span>
        <span className={s.yearShort} aria-hidden="true">
          {shortYear(year)}
        </span>
      </button>
      <div className={s.marks} role="group" aria-label={`Work in ${year}`}>
        {list.map((entry) => {
          const rel = relevance(entry, lens);
          return (
            <button
              key={entry.id}
              type="button"
              className={s.mark}
              data-rel={rel}
              data-mass={mass(entry)}
              style={{ ["--w" as string]: `${markWidth(entry)}px` }}
              title={`${entry.title} — ${monthsLabel(entry.months)}`}
              aria-label={`${entry.title}, ${monthLabel(entry.date)}, ${monthsLabel(entry.months)}. Open this entry.`}
              onClick={() => {
                onOpenEntry(entry);
              }}
              onFocus={() => {
                onFocusYear(year);
              }}
            />
          );
        })}
      </div>
      {!compact && caption ? (
        <p className={s.caption} data-rel={relevance(caption, lens)}>
          {caption.title}
        </p>
      ) : null}
    </li>
  );
}

function Overview({
  lens,
  onOpenYear,
}: {
  lens: Lens;
  onOpenYear: (year: number) => void;
}) {
  const lensMeta = LENSES.find((l) => l.id === lens) ?? LENSES[0];

  return (
    <div className={s.overview}>
      <p className={s.kicker}>The shape</p>
      <h1 className={s.overviewTitle}>
        Fourteen years, mostly small, with a few things that mattered.
      </h1>
      <p className={s.lede}>
        I have been keeping this since 2012. It is not a portfolio. A
        portfolio is a selection. This is the rest: technique I worked out,
        work nobody can see, a map I am known for and would rather not be,
        and a two-year engine that has never had a page of its own.
      </p>
      <p className={s.lede}>
        The column beside this is the career at a glance. A mark is as wide
        as the months it took — a two-line note is a tick; a long project is
        a bar. Ink is for {lensMeta.reader}: what you care about is dark,
        the rest recedes. Open a year, or a single mark, or change who you
        are. The log does not reorder.
      </p>
      <p className={s.lensNow}>{lensMeta.hint}</p>
      <p className={s.hintLine}>
        <kbd>j</kbd>
        <kbd>k</kbd> move years
        <span aria-hidden="true"> · </span>
        <kbd>enter</kbd> descends
        <span aria-hidden="true"> · </span>
        <kbd>esc</kbd> comes back
        <span aria-hidden="true"> · </span>
        <kbd>1</kbd>
        <kbd>2</kbd>
        <kbd>3</kbd> change reader
      </p>
      <div className={s.jump}>
        <button
          type="button"
          className={s.jumpBtn}
          onClick={() => {
            onOpenYear(2016);
          }}
        >
          2016 — the map
        </button>
        <button
          type="button"
          className={s.jumpBtn}
          onClick={() => {
            onOpenYear(2020);
          }}
        >
          2020 — the engine
        </button>
      </div>
    </div>
  );
}

function YearRead({
  year,
  lens,
  entries,
  onOpen,
  onBack,
}: {
  year: number;
  lens: Lens;
  entries: Entry[];
  onOpen: (entry: Entry) => void;
  onBack: () => void;
}) {
  const months = entries.reduce((n, e) => n + e.months, 0);
  const peak = heaviestFor(year, lens);

  return (
    <div className={s.yearRead}>
      <p className={s.crumb}>
        <button type="button" className={s.textBtn} onClick={onBack}>
          The shape
        </button>
        <span aria-hidden="true"> / </span>
        {year}
      </p>
      <header className={s.yearHead}>
        <h1 className={s.yearTitle}>{year}</h1>
        <p className={s.yearMeta}>
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
          <span aria-hidden="true"> · </span>
          {monthsLabel(months)}
          {peak ? (
            <>
              <span aria-hidden="true"> · </span>
              this reading leans on {peak.title}
            </>
          ) : null}
        </p>
      </header>
      <ol className={s.yearList}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className={s.yearItem}
              data-mass={mass(entry)}
              data-rel={relevance(entry, lens)}
              onClick={() => {
                onOpen(entry);
              }}
            >
              <span className={s.itemDate}>{monthLabel(entry.date)}</span>
              <span className={s.itemTitle}>{entry.title}</span>
              <span className={s.itemLine}>{entry.line}</span>
              <span className={s.itemWeight}>{monthsLabel(entry.months)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EntryRead({
  entry,
  lens,
  onBack,
  onYear,
  onOpen,
}: {
  entry: Entry;
  lens: Lens;
  onBack: () => void;
  onYear: () => void;
  onOpen: (entry: Entry) => void;
}) {
  const layer = layerFor(entry, lens);
  const lensMeta = LENSES.find((l) => l.id === lens) ?? LENSES[0];
  const siblings = entriesIn(entry.year);
  const index = siblings.findIndex((e) => e.id === entry.id);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;
  const small = mass(entry) === 1;

  return (
    <article className={s.entryRead} data-mass={mass(entry)} data-rel={relevance(entry, lens)}>
      <p className={s.crumb}>
        <button type="button" className={s.textBtn} onClick={onBack}>
          The shape
        </button>
        <span aria-hidden="true"> / </span>
        <button type="button" className={s.textBtn} onClick={onYear}>
          {entry.year}
        </button>
        <span aria-hidden="true"> / </span>
        {entry.title}
      </p>
      <header className={s.entryHead}>
        <p className={s.entryDate}>
          {monthLabel(entry.date)}
          <span aria-hidden="true"> · </span>
          {monthsLabel(entry.months)}
        </p>
        <h1 className={s.entryTitle}>{entry.title}</h1>
      </header>
      <p className={s.entryBody}>{entry.body}</p>
      {layer ? (
        <div className={s.layer}>
          <p className={s.layerLabel}>For {lensMeta.reader}</p>
          <p className={s.layerBody}>{layer}</p>
        </div>
      ) : (
        small && (
          <p className={s.stays}>
            A note this short has no further layer. That is the weight.
          </p>
        )
      )}
      <nav className={s.sibs} aria-label="In this year">
        {prev ? (
          <button type="button" className={s.sibBtn} onClick={() => onOpen(prev)}>
            <span className={s.sibLabel}>Earlier</span>
            {prev.title}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className={s.sibBtn} onClick={() => onOpen(next)}>
            <span className={s.sibLabel}>Later</span>
            {next.title}
          </button>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
