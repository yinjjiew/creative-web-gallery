"use client";

/**
 * Book a fitting. The call to action, and the only one.
 *
 * Many visitors are a spouse or an adult child. The first question is who the
 * fitting is for, so that the appointment is not booked in the wrong name and
 * so that the person who will wear the device is not talked over. Studios,
 * whether an audiogram already exists, and a time of day — then a name and a
 * way to be reached.
 *
 * Nothing is sent anywhere. The booking is kept in this browser so a reload
 * does not erase it, which is the honest version of "we have your name" on a
 * demonstration page.
 */
import { useEffect, useId, useState } from "react";

import { STUDIOS } from "./data";
import s from "./kestrel.module.css";

const STORE = "kestrel.one.fitting";

type ForWhom = "self" | "partner" | "parent" | "other";

type Booking = {
  whom: ForWhom;
  wearer: string;
  booker: string;
  phone: string;
  email: string;
  studio: string;
  when: string;
  audiogram: "yes" | "no" | "unsure";
  note: string;
  made: string;
};

const WHOM: { id: ForWhom; label: string }[] = [
  { id: "self", label: "For me" },
  { id: "partner", label: "For my partner" },
  { id: "parent", label: "For my parent" },
  { id: "other", label: "For someone else" },
];

const WHEN = [
  { id: "weekday-am", label: "A weekday morning" },
  { id: "weekday-pm", label: "A weekday afternoon" },
  { id: "saturday", label: "Saturday morning" },
];

export default function Fitting() {
  const id = useId();
  const [whom, setWhom] = useState<ForWhom>("self");
  const [wearer, setWearer] = useState("");
  const [booker, setBooker] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [studio, setStudio] = useState(STUDIOS[0].id);
  const [when, setWhen] = useState(WHEN[0].id);
  const [audiogram, setAudiogram] = useState<Booking["audiogram"]>("unsure");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE);
      if (raw) setBooking(JSON.parse(raw) as Booking);
    } catch {
      /* Storage refused is not a reason to break the form. */
    }
    setReady(true);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const wearerName = whom === "self" ? booker.trim() : wearer.trim();
    if (whom !== "self" && !wearerName) {
      setError("We need the name of the person who will be fitted.");
      return;
    }
    if (!booker.trim()) {
      setError("We need a name to put on the appointment.");
      return;
    }
    if (!phone.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("A telephone number or an email address — one way to reach you.");
      return;
    }
    const next: Booking = {
      whom,
      wearer: wearerName || booker.trim(),
      booker: booker.trim(),
      phone: phone.trim(),
      email: email.trim(),
      studio,
      when,
      audiogram,
      note: note.trim(),
      made: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
    setError(null);
    setBooking(next);
    try {
      window.localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* Confirmation is already on screen. */
    }
  };

  if (!ready) return <div className={s.form} />;

  if (booking) {
    const place = STUDIOS.find((row) => row.id === booking.studio) ?? STUDIOS[0];
    const slot = WHEN.find((row) => row.id === booking.when)?.label ?? booking.when;
    const whomLabel = WHOM.find((row) => row.id === booking.whom)?.label ?? "";
    return (
      <div className={s.form}>
        <div className={s.receipt}>
          <p className={s.kicker}>Fitting held · {booking.made}</p>
          <h3 className={s.receiptTitle}>
            {booking.wearer}
            {booking.whom !== "self" ? `, with ${booking.booker}` : ""}
          </h3>
          <dl className={s.dl}>
            <div className={s.dlRow}>
              <dt>Who</dt>
              <dd>{whomLabel}</dd>
            </div>
            <div className={s.dlRow}>
              <dt>Studio</dt>
              <dd>
                {place.city} — {place.street}. {place.hours}.
              </dd>
            </div>
            <div className={s.dlRow}>
              <dt>Preferred time</dt>
              <dd>{slot}</dd>
            </div>
            <div className={s.dlRow}>
              <dt>Audiogram</dt>
              <dd>
                {booking.audiogram === "yes"
                  ? "You already have one, dated within a year. Bring it."
                  : booking.audiogram === "no"
                    ? "None yet. We will do the test at the start of the fitting, forty minutes."
                    : "Not sure. We will check when we write, and book the test if it is needed."}
              </dd>
            </div>
            {booking.phone ? (
              <div className={s.dlRow}>
                <dt>Telephone</dt>
                <dd>{booking.phone}</dd>
              </div>
            ) : null}
            {booking.email ? (
              <div className={s.dlRow}>
                <dt>Email</dt>
                <dd>{booking.email}</dd>
              </div>
            ) : null}
            {booking.note ? (
              <div className={s.dlRow}>
                <dt>Note</dt>
                <dd>{booking.note}</dd>
              </div>
            ) : null}
          </dl>
          <p className={s.caption}>
            In a real studio we would write to confirm a time within two working
            days. On this page nothing was sent anywhere. The appointment lives
            in this browser until you clear it.
          </p>
          <button
            type="button"
            className={s.ghost}
            onClick={() => {
              setBooking(null);
              try {
                window.localStorage.removeItem(STORE);
              } catch {
                /* nothing to undo */
              }
            }}
          >
            Cancel this fitting
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <fieldset className={s.choiceSet}>
        <legend>Who is the fitting for</legend>
        <div className={s.choiceRow}>
          {WHOM.map((item) => (
            <label key={item.id} className={s.choice}>
              <input
                type="radio"
                name={`${id}-whom`}
                checked={whom === item.id}
                suppressHydrationWarning
                onChange={() => {
                  setWhom(item.id);
                }}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <p className={s.choiceNote}>
          The fitting is for the person who will wear the device. If that is
          not you, you are welcome in the room. We will not talk over them.
        </p>
      </fieldset>

      {whom !== "self" ? (
        <div className={s.field}>
          <label htmlFor={`${id}-wearer`}>Their name</label>
          <input
            id={`${id}-wearer`}
            value={wearer}
            autoComplete="name"
            onChange={(event) => {
              setWearer(event.target.value);
            }}
          />
        </div>
      ) : null}

      <div className={s.fieldRow}>
        <div className={s.field}>
          <label htmlFor={`${id}-booker`}>
            {whom === "self" ? "Your name" : "Your name, if different"}
          </label>
          <input
            id={`${id}-booker`}
            value={booker}
            autoComplete="name"
            onChange={(event) => {
              setBooker(event.target.value);
            }}
          />
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-phone`}>Telephone</label>
          <input
            id={`${id}-phone`}
            type="tel"
            value={phone}
            autoComplete="tel"
            onChange={(event) => {
              setPhone(event.target.value);
            }}
          />
        </div>
      </div>

      <div className={s.field}>
        <label htmlFor={`${id}-email`}>Email</label>
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          autoComplete="email"
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>

      <div className={s.fieldRow}>
        <div className={s.field}>
          <label htmlFor={`${id}-studio`}>Studio</label>
          <select
            id={`${id}-studio`}
            value={studio}
            onChange={(event) => {
              setStudio(event.target.value);
            }}
          >
            {STUDIOS.map((row) => (
              <option key={row.id} value={row.id}>
                {row.city} — {row.street.split(",")[1]?.trim() ?? row.street}
              </option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-when`}>Preferred time</label>
          <select
            id={`${id}-when`}
            value={when}
            onChange={(event) => {
              setWhen(event.target.value);
            }}
          >
            {WHEN.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className={s.choiceSet}>
        <legend>A hearing test from the last twelve months</legend>
        <div className={s.choiceRow}>
          {(
            [
              ["yes", "Yes, I can bring it"],
              ["no", "No — do the test at the fitting"],
              ["unsure", "I am not sure"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={s.choice}>
              <input
                type="radio"
                name={`${id}-audio`}
                checked={audiogram === value}
                suppressHydrationWarning
                onChange={() => {
                  setAudiogram(value);
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={s.field}>
        <label htmlFor={`${id}-note`}>Anything we should know</label>
        <textarea
          id={`${id}-note`}
          value={note}
          rows={3}
          onChange={(event) => {
            setNote(event.target.value);
          }}
        />
      </div>

      {error ? <p className={s.error}>{error}</p> : null}

      <button className={s.submit} type="submit">
        Book a fitting
      </button>
      <p className={s.caption}>
        No money now. We will not sell a device without a current audiogram —
        ours, or one from an NHS or HCPC-registered audiologist, dated within
        a year. A demonstration: nothing you type leaves this browser.
      </p>
    </form>
  );
}
