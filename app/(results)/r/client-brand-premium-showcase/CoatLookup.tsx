"use client";

/**
 * Look a coat up by the number sewn inside it.
 *
 * This is the positioning made operable. Every heritage brand can write the
 * sentence "traceable to a single farm"; only a mill that actually keeps the
 * register can let a stranger type in a number and get back the flock, the metre
 * mark on the piece, the weaver's initials, and every repair with its date and
 * its price. The examples are offered as buttons because a visitor has no coat
 * yet and the register is only convincing if you can open it.
 */
import { useId, useState } from "react";

import { COATS, type CoatRecord } from "./data/coats";
import s from "./mill.module.css";

function Ledger({ record }: { record: CoatRecord }) {
  const total = record.repairs.reduce((sum, entry) => sum + entry.charge, 0);

  return (
    <div className={s.ledger}>
      {record.repairs.map((entry) => (
        <div className={s.ledgerRow} key={`${entry.date}-${entry.what}`}>
          <span className={s.ledgerDate}>{entry.date}</span>
          <span className={s.ledgerWhat}>
            {entry.what}
            <span className={s.ledgerBasis}>{entry.basis}</span>
          </span>
          <span className={s.ledgerCharge}>
            {entry.charge > 0 ? (
              `£${entry.charge.toFixed(0)}`
            ) : (
              <span className={s.ledgerFree}>no charge</span>
            )}
          </span>
        </div>
      ))}
      <div className={s.ledgerRow}>
        <span className={s.ledgerDate} />
        <span className={s.ledgerWhat}>
          <strong>
            Paid by the owner in {String(record.repairs.length)} visits
          </strong>
          <span className={s.ledgerBasis}>
            Everything else was ours to put right, including carriage.
          </span>
        </span>
        <span className={s.ledgerCharge}>£{total.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function CoatLookup() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [record, setRecord] = useState<CoatRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const look = (value: string) => {
    const needle = value.trim().toUpperCase().replace(/\s+/g, "");
    if (!needle) {
      setRecord(null);
      setError("Type a number, or open one of the examples underneath.");
      return;
    }
    const found = COATS.find(
      (coat) =>
        coat.serial.toUpperCase() === needle ||
        coat.serial.toUpperCase().endsWith(`/${needle}`) ||
        coat.serial.toUpperCase().replace(/\//g, "-") === needle.replace(/-/g, "-")
    );
    if (found) {
      setRecord(found);
      setError(null);
    } else {
      setRecord(null);
      setError(
        "Not in the register. Coats made before 2010 are in the paper day book at Kilchoan and have to be looked up by hand — ring 01972 510 118. If the number is from 2010 or later and we cannot find it, tell us, because that is our problem and not yours."
      );
    }
  };

  return (
    <div className={s.form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          look(query);
        }}
      >
        <div className={s.fieldRow}>
          <div className={s.field}>
            <label htmlFor={`${id}-serial`}>
              Coat number
              <span className={s.hint}>
                Woven label inside the left front facing, below the pocket.
              </span>
            </label>
            <input
              id={`${id}-serial`}
              value={query}
              autoComplete="off"
              spellCheck={false}
              placeholder="AW/2016/0142"
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
          </div>
        </div>
        <div className={s.submitRow}>
          <button className={s.submit} type="submit">
            Open the record
          </button>
        </div>
      </form>

      <div className={s.controls} aria-label="Example coats in the register">
        {COATS.map((coat) => (
          <button
            key={coat.serial}
            type="button"
            className={s.ctrl}
            aria-pressed={record?.serial === coat.serial}
            onClick={() => {
              setQuery(coat.serial);
              look(coat.serial);
            }}
          >
            {coat.serial}
          </button>
        ))}
      </div>

      {error ? <p className={s.error}>{error}</p> : null}

      {record ? (
        <div className={s.verdict}>
          <div className={s.verdictHead}>
            <span className={s.verdictLabel}>
              {record.farm} · clip {String(record.clip)} · size {record.size}
            </span>
            <span className={s.verdictLabel}>{record.serial}</span>
          </div>
          <div className={s.verdictBody}>
            <dl className={s.dl}>
              <div className={s.dlRow}>
                <dt>Lot</dt>
                <dd>
                  {record.lotCode} — {record.farm}
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Cut from</dt>
                <dd>{record.piece}</dd>
              </div>
              <div className={s.dlRow}>
                <dt>Woven by</dt>
                <dd>{record.weaver}</dd>
              </div>
              <div className={s.dlRow}>
                <dt>Made at</dt>
                <dd>{record.maker}</dd>
              </div>
              <div className={s.dlRow}>
                <dt>Dispatched</dt>
                <dd>{record.dispatched}</dd>
              </div>
              <div className={s.dlRow}>
                <dt>Whereabouts</dt>
                <dd>{record.whereabouts}</dd>
              </div>
            </dl>

            {record.note ? <p className={s.caption}>{record.note}</p> : null}

            <p className={s.h4}>Everything done to this coat</p>
            <Ledger record={record} />
          </div>
        </div>
      ) : null}

      <p className={s.caption}>
        The register holds the lot, the piece, the metre mark, the hands and the
        repairs. It does not hold anything about the owner beyond a county, and
        nothing on this page is searchable by name. If you sell the coat, tell us
        and we will move the record, because the guarantee follows the coat rather
        than the buyer.
      </p>
    </div>
  );
}
