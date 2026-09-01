"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./occupants.module.css";
import { clampYear, nearestYear, YEAR_MAX, YEAR_MIN, YEAR_START } from "./years";

const ledger = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ledger",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-storytelling";
const DECADES = [1962, 1970, 1980, 1990, 2000, 2010, 2020, 2024];

export default function Occupants() {
  const yearRef = useRef(YEAR_START);
  const reduceRef = useRef(false);
  const [year, setYear] = useState(YEAR_START);

  const commit = useCallback((next: number) => {
    const y = clampYear(next);
    yearRef.current = y;
    setYear(y);
    const hash = `#${nearestYear(y)}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, []);

  useEffect(() => {
    const n = Number(window.location.hash.replace("#", ""));
    if (Number.isFinite(n) && n >= YEAR_MIN && n <= YEAR_MAX) commit(n);
  }, [commit]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduceRef.current = motion.matches;
    };
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === "text") return;
      const step = event.shiftKey ? 5 : 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        commit(nearestYear(yearRef.current) - step);
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        commit(nearestYear(yearRef.current) + step);
      } else if (event.key === "Home") {
        event.preventDefault();
        commit(YEAR_MIN);
      } else if (event.key === "End") {
        event.preventDefault();
        commit(YEAR_MAX);
      } else if (event.key === "PageDown") {
        event.preventDefault();
        commit(nearestYear(yearRef.current) - 10);
      } else if (event.key === "PageUp") {
        event.preventDefault();
        commit(nearestYear(yearRef.current) + 10);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit]);

  const shown = nearestYear(year);

  return (
    <div className={`${ledger.variable} ${styles.page}`}>
      <Stage yearRef={yearRef} reduceRef={reduceRef} onYear={commit} />

      <div className={styles.hud}>
        <header className={styles.top}>
          <h1 className={styles.word}>Occupants</h1>
          <Link className={styles.task} href={TASK}>
            Task
          </Link>
        </header>

        <div className={styles.dock}>
          <div className={styles.yearRow}>
            <p className={styles.year} aria-live="polite">
              {shown}
            </p>
            <div className={styles.meta}>
              <span>1962–2024</span>
              <span className={styles.note}>
                A modelled corner. Objects and dates are written, not recorded.
              </span>
            </div>
          </div>

          <div className={styles.railWrap}>
            <div className={styles.ticks}>
              {DECADES.map((mark) => (
                <button
                  key={mark}
                  type="button"
                  className={styles.tick}
                  data-now={shown === mark ? "1" : "0"}
                  onClick={() => commit(mark)}
                >
                  {mark}
                </button>
              ))}
            </div>
            <label className={styles.sr} htmlFor="year-rail">
              Year
            </label>
            <input
              id="year-rail"
              className={styles.rail}
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              step={1}
              value={shown}
              aria-valuemin={YEAR_MIN}
              aria-valuemax={YEAR_MAX}
              aria-valuenow={shown}
              aria-label="Year"
              onChange={(event) => commit(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
