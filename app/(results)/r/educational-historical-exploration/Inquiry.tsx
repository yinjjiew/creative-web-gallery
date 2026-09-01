"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Map, { type Overlays, type Pick } from "./Map";
import styles from "./broad.module.css";
import {
  CAUSES,
  DAYS,
  DEFAULT_OFFSET,
  FIGURES,
  HANDLE_OFFSET,
  PAPERS,
  SOURCES,
  TOTAL_ATTACKS,
  TOTAL_DEATHS,
  UNKNOWN_ATTACKS,
  cumulativeDeaths,
  labelDay,
  shortDay,
  type CauseId,
  type EvidenceId,
  type PaperId,
} from "./data";
import { reading } from "./reading";
import {
  BUILDINGS,
  HOUSES,
  MAP_DEATHS,
  NAMED,
  PUMPS,
  deathsThrough,
  tallyNearest,
} from "./soho";

type Tab = "day" | "papers" | "account";

export default function Inquiry() {
  const [day, setDay] = useState(DEFAULT_OFFSET);
  const [overlays, setOverlays] = useState<Overlays>({
    hinterland: false,
    circle: false,
    elevation: false,
  });
  const [pick, setPick] = useState<Pick>(null);
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [used, setUsed] = useState<Set<EvidenceId>>(() => new Set());
  const [sheet, setSheet] = useState<PaperId | null>(null);
  const [cause, setCause] = useState<CauseId | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<Tab>("day");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(null);
      if (sheet) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setDay((d) => Math.max(0, d - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setDay((d) => Math.min(DAYS.length - 1, d + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const openPaper = (id: PaperId) => {
    setOpened((prev) => new Set(prev).add(id));
    setUsed((prev) => new Set(prev).add(id));
    setSheet(id);
    setTab("papers");
  };

  const toggleOverlay = (key: keyof Overlays) => {
    setOverlays((o) => ({ ...o, [key]: !o[key] }));
    const ev: EvidenceId =
      key === "hinterland" ? "hinterland" : key === "circle" ? "circle" : "elevation";
    setUsed((prev) => new Set(prev).add(ev));
  };

  const onPick = (next: Pick) => {
    setPick(next);
    if (next?.type === "building") {
      const b = BUILDINGS.find((x) => x.id === next.id);
      if (b?.paper) openPaper(b.paper as PaperId);
    }
    if (next?.type === "named") {
      const n = NAMED.find((x) => x.id === next.id);
      if (n?.paper) openPaper(n.paper as PaperId);
    }
  };

  const row = DAYS[day];
  const dead = cumulativeDeaths(day);
  const mapped = deathsThrough(HOUSES, day);
  const tallies = useMemo(
    () => (overlays.hinterland ? tallyNearest(HOUSES, day) : []),
    [overlays.hinterland, day],
  );
  const paper = sheet ? PAPERS.find((p) => p.id === sheet) : null;
  const verdict = submitted && cause ? reading({ cause, opened, used }) : null;

  const pickDetail = detailFor(pick);

  return (
    <div className={styles.root}>
      <header className={styles.top}>
        <p className={styles.kicker}>
          St James, Westminster · Golden Square · an inquiry you can lose
        </p>
        <div className={styles.topRow}>
          <h1 className={styles.title}>Broad Street</h1>
          <Link
            href="/tasks/educational-historical-exploration"
            className={styles.escape}
          >
            The task
          </Link>
        </div>
        <p className={styles.deck}>
          You have what Snow had in the first days of September: the deaths, the
          pumps, who lived in the large houses, and the right to send for
          papers. The Board of Health believes the air is poisoned. Work out
          what is happening. The tidy story is not in the materials, and you
          can be wrong.
        </p>
      </header>

      <div className={styles.stage}>
        <section className={styles.mapCol} aria-label="The parish">
          <Map
            day={day}
            overlays={overlays}
            pick={pick}
            onPick={onPick}
            opened={opened}
          />
          <div className={styles.overlayBar}>
            <p className={styles.legend}>
              A bar is a death. A ring is a pump. The shaded houses yield a return.
            </p>
            <span className={styles.overlayLbl}>Drawings you can add</span>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={overlays.hinterland}
                onChange={() => toggleOverlay("hinterland")}
              />
              Nearest pump
              <em>straight-line, not Snow’s walking measure</em>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={overlays.circle}
                onChange={() => toggleOverlay("circle")}
              />
              250 yards from the junction
              <em>Snow’s phrase, drawn as a circle</em>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={overlays.elevation}
                onChange={() => toggleOverlay("elevation")}
              />
              Elevation, schematic
              <em>Farr’s variable; not a surveyed contour</em>
            </label>
          </div>
          {pickDetail && (
            <aside className={styles.inspect} aria-live="polite">
              <p className={styles.inspectK}>{pickDetail.kicker}</p>
              <h2 className={styles.inspectH}>{pickDetail.title}</h2>
              <p className={styles.inspectB}>{pickDetail.body}</p>
              {pickDetail.kind && (
                <p className={styles.flag}>{pickDetail.kind}</p>
              )}
            </aside>
          )}
        </section>

        <aside className={styles.rail}>
          <div className={styles.tabs} role="tablist" aria-label="Inquiry desk">
            {(
              [
                ["day", "The days"],
                ["papers", "Papers"],
                ["account", "Your account"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={tab === id ? styles.tabOn : styles.tab}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "day" && (
            <div className={styles.panel} role="tabpanel">
              <p className={styles.date}>{labelDay(day)}</p>
              <p className={styles.counts}>
                <span>
                  <b>{row.deaths}</b> deaths this day
                </span>
                <span>
                  <b>{dead}</b> of {TOTAL_DEATHS} in the table
                </span>
                <span>
                  <b>{row.attacks}</b> fatal attacks begin
                </span>
              </p>
              <label className={styles.sliderLbl} htmlFor="day">
                Advance the register
              </label>
              <input
                id="day"
                className={styles.slider}
                type="range"
                min={0}
                max={DAYS.length - 1}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                aria-valuetext={labelDay(day)}
              />
              <div className={styles.sliderEnds}>
                <span>19 Aug</span>
                <span>30 Sep</span>
              </div>
              <Curve day={day} onPick={setDay} />
              <p className={styles.note}>
                Fatal attacks and deaths are Snow’s daily table
                ({TOTAL_ATTACKS} attacks including {UNKNOWN_ATTACKS} of unknown
                onset; {TOTAL_DEATHS} deaths). The handle comes off on{" "}
                {labelDay(HANDLE_OFFSET)}. Marks on the map are a reconstruction
                of Snow’s lithograph — {MAP_DEATHS} bars in the pattern of the
                cluster, not a house-by-house digitization. Which bar falls on
                which day is also reconstructed, in proportion to the table.
              </p>
              {overlays.hinterland && (
                <ol className={styles.tally}>
                  {tallies.map((t) => {
                    const pump = PUMPS.find((p) => p.id === t.id);
                    return (
                      <li key={t.id}>
                        <span>{pump?.name}</span>
                        <span className={styles.mono}>{t.n}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {mapped > 0 && (
                <p className={styles.tiny}>
                  {mapped} reconstructed marks visible through this day.
                </p>
              )}
            </div>
          )}

          {tab === "papers" && (
            <div className={styles.panel} role="tabpanel">
              <p className={styles.lead}>
                Nothing here is locked. Papers dated 1855 and after are later
                than the week you are walking. You may ignore them. Ignoring
                them is how most accounts go wrong.
              </p>
              <ul className={styles.stack}>
                {PAPERS.map((p) => {
                  const seen = opened.has(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={seen ? styles.leafOpen : styles.leaf}
                        onClick={() => openPaper(p.id)}
                      >
                        <span className={styles.leafWhen}>
                          {p.when}
                          {p.kind === "reconstructed"
                            ? " · reconstructed"
                            : p.kind === "interpretation"
                              ? " · interpretation"
                              : " · record"}
                        </span>
                        <span className={styles.leafTitle}>{p.title}</span>
                        <span className={styles.leafFrom}>{p.from}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {tab === "account" && (
            <div className={styles.panel} role="tabpanel">
              <p className={styles.lead}>
                State a cause. This is not marked right or wrong. The reading
                that follows will only use what you have opened or drawn.
              </p>
              <fieldset className={styles.causes}>
                <legend className={styles.sr}>Cause</legend>
                {CAUSES.map((c) => (
                  <label key={c.id} className={styles.cause}>
                    <input
                      type="radio"
                      name="cause"
                      checked={cause === c.id}
                      onChange={() => {
                        setCause(c.id);
                        setSubmitted(false);
                      }}
                    />
                    <span>
                      <strong>{c.label}</strong>
                      <em>{c.hint}</em>
                    </span>
                  </label>
                ))}
              </fieldset>
              <button
                type="button"
                className={styles.commit}
                disabled={!cause}
                onClick={() => {
                  setSubmitted(true);
                  requestAnimationFrame(() => {
                    document.getElementById("verdict")?.scrollIntoView({
                      block: "nearest",
                      behavior:
                        window.matchMedia("(prefers-reduced-motion: reduce)")
                          .matches
                          ? "auto"
                          : "smooth",
                    });
                  });
                }}
              >
                Read the account against the papers
              </button>
              {verdict && (
                <div className={styles.verdict} id="verdict">
                  <h3>{verdict.title}</h3>
                  {verdict.body.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                  <p className={styles.flag}>
                    A reading of your claim, not a score. The historical
                    settlement is in the later papers, if you want it.
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {paper && (
        <div
          className={styles.sheetScrim}
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <article
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.sheetMeta}>
              {paper.date} · {paper.when} ·{" "}
              {paper.kind === "record"
                ? "historical record"
                : paper.kind === "interpretation"
                  ? "scholarly interpretation, labelled"
                  : "reconstructed"}
            </p>
            <h2 id="sheet-title">{paper.title}</h2>
            <p className={styles.sheetFrom}>{paper.from}</p>
            {paper.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <p className={styles.cite}>
              {SOURCES.find((s) => s.id === paper.source)?.full}
            </p>
            <button
              type="button"
              className={styles.close}
              onClick={() => setSheet(null)}
            >
              Close
            </button>
          </article>
        </div>
      )}

      <footer className={styles.colophon}>
        <h2>What is sourced, and what is drawn</h2>
        <p>
          The daily table, the 83-house inquiry, the workhouse (535 inmates, 5
          cholera deaths among them), Huggins’ brewery (above 70 men, none
          dead), the Eley works (about 200 hands, 18 dead), Mrs E—— at West
          End, the Brighton visitor, the coffee-shop, the Marlborough well, the
          handle on 8 September, and Snow’s sentence that the attacks were
          already falling: all from Snow’s report in the Cholera Inquiry
          Committee volume, 1855, also printed in the second edition of{" "}
          <i>On the Mode of Communication of Cholera</i>. Broad Street’s 49
          houses, 869 residents and 86 deaths are from the 1854 Berwick Street
          account. Whitehead’s infant at no. 40 is 1855, and is labelled so.
        </p>
        <p>
          The street plan uses present longitudes and latitudes of Soho, with
          1854 names (Broad Street, Cambridge Street). Pump positions other
          than Broad Street are placed from Snow’s map relative to surviving
          streets; they are good enough to reason about hinterlands and are not
          a surveyed 1854 inventory. Death bars follow the pattern of the
          lithograph — stacked on frontages, empty at the workhouse and the
          brewery, densest on Broad Street — and are labelled reconstructed.
          The nearest-pump wash is straight-line distance. Snow measured
          walking distance by road. The elevation wash is schematic.
        </p>
        <p>
          {SOURCES.map((s) => (
            <span key={s.id} className={styles.src}>
              {s.full}
            </span>
          ))}
        </p>
        <p className={styles.tiny}>
          The sourced Broad Street resident total is{" "}
          {FIGURES.broadStreetDeaths.value}. This drawing places {MAP_DEATHS}{" "}
          reconstructed bars in the lithograph’s pattern,{" "}
          {HOUSES.filter((h) => h.street === "Broad Street").reduce(
            (s, h) => s + h.deaths,
            0,
          )}{" "}
          of them on Broad Street — near that figure, not a digitization of
          it. {FIGURES.twoFiftyYardsAttacks.value}+ fatal attacks within 250
          yards of the Cambridge Street junction, in ten days: Snow, MCC2.
        </p>
      </footer>
    </div>
  );
}

function Curve({ day, onPick }: { day: number; onPick: (n: number) => void }) {
  const max = Math.max(...DAYS.map((d) => Math.max(d.deaths, d.attacks)));
  return (
    <div className={styles.curve} role="img" aria-label="Fatal attacks and deaths by day">
      <div className={styles.curveKey}>
        <span className={styles.keyA}>Attacks</span>
        <span className={styles.keyD}>Deaths</span>
      </div>
      <div className={styles.bars}>
        {DAYS.map((d) => {
          const on = d.offset === day;
          const handle = d.offset === HANDLE_OFFSET;
          return (
            <button
              key={d.offset}
              type="button"
              className={on ? styles.colOn : styles.col}
              title={`${shortDay(d.offset)}: ${d.attacks} attacks, ${d.deaths} deaths`}
              aria-label={`${labelDay(d.offset)}, ${d.deaths} deaths, ${d.attacks} fatal attacks`}
              aria-current={on ? "date" : undefined}
              onClick={() => onPick(d.offset)}
            >
              <span
                className={styles.hitA}
                style={{ height: `${(d.attacks / max) * 100}%` }}
              />
              <span
                className={styles.hitD}
                style={{ height: `${(d.deaths / max) * 100}%` }}
              />
              {handle && <i className={styles.handleMark} />}
            </button>
          );
        })}
      </div>
      <p className={styles.handleCap}>
        The rule marks 8 September, when the handle was removed. The attacks
        are already falling.
      </p>
    </div>
  );
}

function detailFor(pick: Pick): {
  kicker: string;
  title: string;
  body: string;
  kind?: string;
} | null {
  if (!pick) return null;
  if (pick.type === "pump") {
    const pump = PUMPS.find((p) => p.id === pick.id);
    if (!pump) return null;
    return {
      kicker: pump.avoided ? "Street pump · avoided" : "Street pump",
      title: pump.name,
      body: pump.note,
      kind:
        pump.id === "broad"
          ? "Position: the memorial pump on Broadwick Street, on Snow’s site."
          : "Position reconstructed from Snow’s map against surviving streets.",
    };
  }
  if (pick.type === "building") {
    const b = BUILDINGS.find((x) => x.id === pick.id);
    if (!b) return null;
    const copy: Record<string, string> = {
      workhouse:
        "Poland Street. 535 inmates; 5 cholera deaths among them. Own well, and Grand Junction water. They never sent to Broad Street. Open the Master’s return for the figures.",
      brewery:
        "On Broad Street, beside the pump. Above 70 men; none dead of cholera. Deep well, New River water, malt liquor. Snow called because no brewer appeared in the register.",
      eley:
        "Percussion-cap works at no. 38. About 200 hands; tubs of Broad Street water; 18 dead at their own houses. The cart to Hampstead left from this street.",
      forty:
        "A few feet from the well. In September 1854 it is an address. What Whitehead found here is in a paper dated 1855.",
    };
    return {
      kicker: "A house on the plan",
      title: b.name,
      body: copy[b.id] ?? "",
      kind: "Footprint reconstructed on the surviving street.",
    };
  }
  if (pick.type === "named") {
    const n = NAMED.find((x) => x.id === pick.id);
    if (!n) return null;
    return {
      kicker: "A house Snow named",
      title: n.label,
      body: n.text,
      kind: "Testimony from Snow’s CIC report, 1855. Position reconstructed on the named street.",
    };
  }
  const house = HOUSES.find((h) => h.id === pick.id);
  if (!house) return null;
  const shown = house.days.filter((d) => d <= 99).length;
  return {
    kicker: house.special ? "Workhouse inmates" : house.street,
    title:
      shown === 1
        ? "One death at this frontage"
        : `${house.deaths} deaths stacked at this frontage`,
    body: house.special
      ? "Five inmate deaths, as Snow recorded. Other cholera deaths in the house were of people carried in already attacked. The day on each bar is reconstructed."
      : "A reconstructed bar, in the manner of Snow’s lithograph. The lithograph does not date individual marks. The day assigned here follows the shape of his table, not a named person.",
    kind: "Reconstructed position and date.",
  };
}
