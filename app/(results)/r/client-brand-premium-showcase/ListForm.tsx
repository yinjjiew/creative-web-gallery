"use client";

/**
 * The call to action: join the waiting list for the coming clip.
 *
 * It is a list rather than a basket because there are 384 coats and 415 people
 * waiting, and pretending otherwise would be the first dishonest thing on the
 * page. So the form's job is to tell you, before you commit anything, exactly
 * which clip you would be served from and roughly which month the coat would
 * leave Hawick — including when the answer is 2029.
 *
 * Nothing is sent anywhere. The entry is kept in this browser's localStorage so
 * that the state survives a reload, which is the honest version of "we have your
 * name" for a demonstration.
 */
import { useEffect, useId, useState } from "react";

import { LOTS, type Lot } from "./data/lots";
import { listFor } from "./data/money";
import { SIZES } from "./data/fit";
import s from "./mill.module.css";

const STORE = "ardnamurchan.single-flock.list-entry";

type Entry = {
  name: string;
  email: string;
  size: string;
  lotCode: string;
  flexible: boolean;
  position: number;
  joined: string;
};

export default function ListForm({ lot }: { lot: Lot }) {
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [size, setSize] = useState("unsure");
  const [lotCode, setLotCode] = useState(lot.code);
  const [flexible, setFlexible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE);
      if (raw) setEntry(JSON.parse(raw) as Entry);
    } catch {
      /* A browser refusing storage is not a reason to break the form. */
    }
    setRestored(true);
  }, []);

  // Following the lot the visitor is reading, until they choose for themselves.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setLotCode(lot.code);
  }, [lot.code, touched]);

  const chosen = LOTS.find((candidate) => candidate.code === lotCode) ?? lot;
  const state = listFor(chosen.code);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("We need a name to put against the coat.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email address does not look like one. It is the only way we contact you.");
      return;
    }
    const next: Entry = {
      name: name.trim(),
      email: email.trim(),
      size,
      lotCode: chosen.code,
      flexible,
      position: state.waiting + 1,
      joined: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
    setError(null);
    setEntry(next);
    try {
      window.localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* Ignore: the confirmation is already on screen. */
    }
  };

  if (!restored) return <div className={s.form} />;

  if (entry) {
    const entryLot =
      LOTS.find((candidate) => candidate.code === entry.lotCode) ?? lot;
    const entryState = listFor(entry.lotCode);
    return (
      <div className={s.form}>
        <div className={s.verdict}>
          <div className={s.verdictHead}>
            <span className={s.verdictLabel}>On the list · {entry.joined}</span>
            <span className={s.verdictSize}>{entry.position}</span>
          </div>
          <div className={s.verdictBody}>
            <dl className={s.dl}>
              <div className={s.dlRow}>
                <dt>Name</dt>
                <dd>{entry.name}</dd>
              </div>
              <div className={s.dlRow}>
                <dt>Lot wanted</dt>
                <dd>
                  {entryLot.farm} — {entryLot.code}
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Size</dt>
                <dd>
                  {entry.size === "unsure"
                    ? "Not settled yet. We will send the paper pattern first."
                    : `Size ${entry.size}`}
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Served from</dt>
                <dd>
                  {entryState.servedFrom}, leaving Hawick {entryState.dispatch}
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Another lot</dt>
                <dd>
                  {entry.flexible
                    ? "Yes — we will offer you a cancellation from another flock if one comes up sooner."
                    : "No. We will not offer you anything else, and it may be a long wait."}
                </dd>
              </div>
            </dl>
            <p className={s.caption}>
              Nothing is owed now. We ask for £150 when your cloth is cut, which
              is the point at which we cannot re-sell it, and the balance of £950
              when the coat is finished and before it is posted. If you change your
              mind before the cut, there is nothing to pay and no ill feeling.
            </p>
            <div className={s.submitRow}>
              <button
                type="button"
                className={s.ctrl}
                onClick={() => {
                  setEntry(null);
                  try {
                    window.localStorage.removeItem(STORE);
                  } catch {
                    /* nothing to undo */
                  }
                }}
              >
                Take me off the list
              </button>
            </div>
            <p className={s.error}>
              A demonstration. Nothing was sent anywhere; this entry is kept in
              your own browser and will disappear when you clear it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label htmlFor={`${id}-name`}>Name</label>
          <input
            id={`${id}-name`}
            value={name}
            autoComplete="name"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
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
      </div>

      <div className={s.fieldRow}>
        <div className={s.field}>
          <label htmlFor={`${id}-lot`}>Which flock</label>
          <select
            id={`${id}-lot`}
            value={lotCode}
            onChange={(event) => {
              setTouched(true);
              setLotCode(event.target.value);
            }}
          >
            {LOTS.map((candidate) => (
              <option key={candidate.code} value={candidate.code}>
                {candidate.farm} — {listFor(candidate.code).waiting} waiting
              </option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-size`}>Size</label>
          <select
            id={`${id}-size`}
            value={size}
            onChange={(event) => {
              setSize(event.target.value);
            }}
          >
            <option value="unsure">Not sure — send the paper pattern</option>
            {SIZES.map((row) => (
              <option key={row.size} value={row.size}>
                Size {row.size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={s.stampBlock}>
        <b>What joining today means</b>
        Position {state.waiting + 1} for {chosen.farm}. You would be served from{" "}
        {state.servedFrom}, leaving Hawick {state.dispatch}.
      </div>

      <fieldset className={s.radioSet}>
        <legend>If a cancellation comes up in another flock</legend>
        <label className={s.radio}>
          <input
            type="radio"
            name={`${id}-flex`}
            checked={flexible}
            onChange={() => {
              setFlexible(true);
            }}
          />
          <span>Offer it to me. I would rather have a coat than the right brown.</span>
        </label>
        <label className={s.radio}>
          <input
            type="radio"
            name={`${id}-flex`}
            checked={!flexible}
            onChange={() => {
              setFlexible(false);
            }}
          />
          <span>
            No. I want {chosen.farm} and I will wait for it.
          </span>
        </label>
      </fieldset>

      {error ? <p className={s.error}>{error}</p> : null}

      <div className={s.submitRow}>
        <button className={s.submit} type="submit">
          Join the list for the coming clip
        </button>
      </div>

      <p className={s.caption}>
        No money now and no card taken. We write once when your clip is on the
        loom, once when it is cut, and at no other time. This is a demonstration
        of a real brief, so nothing is sent anywhere — the entry is kept in your
        own browser.
      </p>
    </form>
  );
}
