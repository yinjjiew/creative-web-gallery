"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import Morning from "./Morning";
import Overview from "./Overview";
import Place from "./Place";
import Recurring from "./Recurring";
import {
  BY_STATION,
  DATES,
  DAY_BY_DATE,
  TOTAL_NOTES,
  TOTAL_WORDS,
  longDate,
  typeset,
} from "./model";
import { STATIONS, type StationId } from "./route-data";
import s from "./walk.module.css";

type Mode = "walk" | "place" | "morning" | "motif";

const TABS: { id: Mode; label: string }[] = [
  { id: "walk", label: "the walk" },
  { id: "place", label: "a place" },
  { id: "morning", label: "a morning" },
  { id: "motif", label: "what recurs" },
];

const MOST_AT_ONE_PLACE = Math.max(
  ...STATIONS.map((station) => BY_STATION[station.id].length),
);

export default function Walk() {
  const [mode, setMode] = useState<Mode>("walk");
  const [station, setStation] = useState<StationId>("pool");
  const [date, setDate] = useState<string>(DATES[Math.floor(DATES.length / 2)]);
  const [motif, setMotif] = useState<string>("heron");
  const tabs = useRef(new Map<Mode, HTMLButtonElement>());

  const openStation = useCallback((id: StationId) => {
    setStation(id);
    setMode("place");
  }, []);

  const openDate = useCallback((iso: string) => {
    setDate(iso);
    setMode("morning");
  }, []);

  function onTabKey(event: React.KeyboardEvent) {
    const order = TABS.map((t) => t.id);
    const i = order.indexOf(mode);
    let next = -1;
    if (event.key === "ArrowRight") next = (i + 1) % order.length;
    if (event.key === "ArrowLeft") next = (i - 1 + order.length) % order.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = order.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setMode(order[next]);
    tabs.current.get(order[next])?.focus();
  }

  const today = DAY_BY_DATE.get(date);
  const activeToday = new Set(today?.notes.map((n) => n.at) ?? []);

  return (
    <div className={s.shell}>
      <header className={s.masthead}>
        <div className={s.title}>
          <h1>Same Walk</h1>
          <p>
            Alma Street to Ladyshaw footbridge and back, every morning from{" "}
            <span className={s.nowrap}>2 October</span> to{" "}
            <span className={s.nowrap}>30 September</span>.
          </p>
        </div>
        <div
          className={s.tabs}
          role="tablist"
          aria-label="ways to read the diary"
          onKeyDown={onTabKey}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={mode === tab.id}
              aria-controls="reading"
              tabIndex={mode === tab.id ? 0 : -1}
              className={`${s.tab} ${mode === tab.id ? s.tabOn : ""}`}
              onClick={() => setMode(tab.id)}
              ref={(el) => {
                if (el) tabs.current.set(tab.id, el);
                else tabs.current.delete(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className={s.body}>
        <nav className={s.rail} aria-label="the route">
          <button
            type="button"
            className={`${s.railHead} ${mode === "walk" ? s.railHeadOn : ""}`}
            onClick={() => setMode("walk")}
          >
            the route
          </button>
          <ol className={s.railList}>
            {STATIONS.map((st) => {
              const n = BY_STATION[st.id].length;
              const on = mode === "place" && station === st.id;
              return (
                <li key={st.id}>
                  <button
                    type="button"
                    className={`${s.railItem} ${on ? s.railItemOn : ""} ${
                      mode === "morning" && activeToday.has(st.id)
                        ? s.railItemToday
                        : ""
                    }`}
                    onClick={() => openStation(st.id)}
                    aria-current={on ? "true" : undefined}
                  >
                    <span className={s.railMinute}>{st.at}′</span>
                    <span className={s.railName}>{typeset(st.name)}</span>
                    <span className={s.railBar} aria-hidden>
                      <span
                        style={{
                          width: `${String((n / MOST_AT_ONE_PLACE) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className={s.hidden}>{n} mornings</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className={s.railFoot}>
            The route never changed. Twenty minutes, nine places, one direction
            out and the other bank home.
          </p>
        </nav>

        <section
          className={s.reading}
          id="reading"
          role="tabpanel"
          aria-labelledby={`tab-${mode}`}
          tabIndex={-1}
        >
          {mode === "walk" ? <Overview onStation={openStation} /> : null}
          {mode === "place" ? (
            <Place station={station} onMorning={openDate} />
          ) : null}
          {mode === "morning" ? (
            <Morning date={date} onDate={setDate} onStation={openStation} />
          ) : null}
          {mode === "motif" ? (
            <Recurring
              motif={motif}
              onMotif={setMotif}
              onDate={openDate}
              onStation={openStation}
            />
          ) : null}
        </section>
      </div>

      <footer className={s.colophon}>
        <p>
          <strong>Same Walk is fiction.</strong> Alma Street, the cut,
          Verity&rsquo;s yard, the heron and all {TOTAL_NOTES} of these notes
          were written for this piece. Nobody kept this diary and no morning in
          it happened.
        </p>
        <p>
          {DATES.length} mornings, {longDate(DATES[0])} to{" "}
          {longDate(DATES[DATES.length - 1])},{" "}
          {TOTAL_WORDS.toLocaleString("en-GB")} words. Every count, silence and
          bar length on this page is measured from the notes themselves rather
          than asserted, so the arithmetic is a fact about the writing.
        </p>
        <p className={s.brief}>
          <Link href="/tasks/personal-studio-digital-diary" prefetch={false}>
            the brief this was built from
          </Link>
        </p>
      </footer>
    </div>
  );
}
