"use client";

import { useEffect, useId, useRef, useState } from "react";

import { COMPARE, FARES, SERVICE, datesFrom, type FareId } from "./data";
import styles from "./natt.module.css";

const KEY = "natt-berth";

type Recorded = {
  name: string;
  fare: FareId;
  date: string;
  code: string;
  eur: number;
};

function load(): Recorded | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Recorded) : null;
  } catch {
    return null;
  }
}

function codeFor(date: string, fare: FareId) {
  const n = date.replaceAll("-", "") + fare.length;
  return `NT14-${n.slice(-6)}-${SERVICE.compartment}`;
}

export default function Book({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const formId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [fare, setFare] = useState<FareId>("lower");
  const [name, setName] = useState("");
  const [days] = useState(() => datesFrom(new Date(), 12));
  const [date, setDate] = useState(() => datesFrom(new Date(), 12)[2] ?? "");
  const [done, setDone] = useState<Recorded | null>(() =>
    typeof window === "undefined" ? null : load(),
  );

  const chosen = FARES[fare];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = sheetRef.current?.querySelector<HTMLElement>(
      "button, input, select",
    );
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className={styles.veil}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
    >
      <div className={styles.sheet} ref={sheetRef}>
        {done ? (
          <>
            <p className={styles.sheetKicker}>{done.code}</p>
            <h2 id={`${formId}-title`} className={styles.sheetTitle}>
              Berth {SERVICE.compartment}, {FARES[done.fare].name.toLowerCase()}.
            </h2>
            <p className={styles.sheetBody}>
              {SERVICE.number} · {done.date} · {SERVICE.from.time}{" "}
              {SERVICE.from.station} → {SERVICE.to.time} {SERVICE.to.station}.{" "}
              {done.eur} €, recorded on this device only. NATT does not issue a
              real ticket. Car {SERVICE.car}, the door with the enamel twelve.
            </p>
            <div className={styles.sheetActions}>
              <button type="button" className={styles.ghost} onClick={onClose}>
                Back to the compartment
              </button>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  window.localStorage.removeItem(KEY);
                  setDone(null);
                }}
              >
                Release it
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.sheetKicker}>{SERVICE.number}</p>
            <h2 id={`${formId}-title`} className={styles.sheetTitle}>
              Book a berth
            </h2>
            <p className={styles.sheetBody}>
              Shared means one other person, same gender, the other bunk. That
              is how a two-berth is sold when it is not taken as a compartment.
              The wheelchair space is not on this form — telephone +32 2 000
              0014, because the attendant meets the door.
            </p>
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (!trimmed || !date) return;
                const record: Recorded = {
                  name: trimmed,
                  fare,
                  date,
                  code: codeFor(date, fare),
                  eur: chosen.eur,
                };
                window.localStorage.setItem(KEY, JSON.stringify(record));
                setDone(record);
                onDone(
                  `Berth ${SERVICE.compartment} held on this device for ${trimmed}.`,
                );
              }}
            >
              <label className={styles.field}>
                <span>Night of</span>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className={styles.fares}>
                <legend>The bunk</legend>
                {(Object.keys(FARES) as FareId[]).map((id) => (
                  <label key={id} className={styles.fare}>
                    <input
                      type="radio"
                      name="fare"
                      checked={fare === id}
                      onChange={() => setFare(id)}
                    />
                    <span>
                      {FARES[id].name}
                      <em>{FARES[id].eur} €</em>
                    </span>
                  </label>
                ))}
              </fieldset>
              <p className={styles.billLine}>
                Flight {COMPARE.flightEur} € + hotel {COMPARE.hotelEur} € ={" "}
                {COMPARE.combinedEur} €. This berth is {chosen.eur} €.
              </p>
              <label className={styles.field}>
                <span>Name on the list</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <div className={styles.sheetActions}>
                <button type="button" className={styles.ghost} onClick={onClose}>
                  Close
                </button>
                <button type="submit" className={styles.cta}>
                  Take berth {SERVICE.compartment}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
