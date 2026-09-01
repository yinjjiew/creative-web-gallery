"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./still.module.css";

const SIZES = [
  { id: "queen", name: "Queen", dim: "60 × 80 in", price: 1195 },
  { id: "king", name: "King", dim: "76 × 80 in", price: 1495 },
  { id: "cal", name: "Cal King", dim: "72 × 84 in", price: 1495 },
] as const;

type SizeId = (typeof SIZES)[number]["id"];

const KEY = "still-trial";

export default function Trial({
  monoClass,
  onClose,
  onDone,
}: {
  monoClass: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const formId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<SizeId>("queen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [done, setDone] = useState<null | { size: string; price: number }>(
    () => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as { size: string; price: number }) : null;
      } catch {
        return null;
      }
    },
  );

  const chosen = SIZES.find((item) => item.id === size) ?? SIZES[0];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = sheetRef.current?.querySelector<HTMLElement>("button, input");
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
            <h2 id={`${formId}-title`}>Night one starts when it arrives.</h2>
            <p>
              {done.size}, ${done.price.toLocaleString("en-US")}. A hundred
              nights from delivery. If it is not the one, we collect it and
              refund the lot — you do not box it. The old mattress leaves the
              same morning.
            </p>
            <p>
              This record lives on this device only. Still is a fictional
              company written for the brief; the construction is real mattress
              engineering, the prices sit in the current American hybrid range,
              and nothing here can be bought.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.cta}
                type="button"
                onClick={onClose}
              >
                Back to the bed
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const record = { size: chosen.name, price: chosen.price };
              try {
                window.localStorage.setItem(KEY, JSON.stringify(record));
              } catch {
                /* private mode — the confirmation still stands for the visit */
              }
              setDone(record);
              onDone();
            }}
          >
            <h2 id={`${formId}-title`}>Start the hundred-night trial</h2>
            <p>
              It arrives in five to eight days. We take the old mattress the
              morning we bring the new one. The trial is a hundred nights from
              that morning, not from this click.
            </p>
            <fieldset className={styles.sizes}>
              <legend>Size</legend>
              {SIZES.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.size} ${monoClass}`}
                  type="button"
                  data-on={item.id === size ? "true" : "false"}
                  aria-pressed={item.id === size}
                  onClick={() => {
                    setSize(item.id);
                  }}
                >
                  <b>
                    {item.name}
                    <span> · {item.dim}</span>
                  </b>
                  <span>${item.price.toLocaleString("en-US")}</span>
                </button>
              ))}
            </fieldset>
            <div className={styles.fields}>
              <label>
                Name
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
              </label>
              <label>
                City
                <input
                  required
                  autoComplete="address-level2"
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                  }}
                />
              </label>
            </div>
            <div className={styles.actions}>
              <button className={styles.cta} type="submit">
                Begin the trial · ${chosen.price.toLocaleString("en-US")}
              </button>
              <button className={styles.close} type="button" onClick={onClose}>
                Not now
              </button>
            </div>
            <p className={styles.note}>
              Nothing you type is sent anywhere. Still is written for this
              brief; pocketed coils, a centre isolation strip, and a
              latex-and-wool comfort layer are real methods. The prices are
              not a quote.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
