"use client";

/**
 * Bring someone. The secondary call, and the primary one if you cannot give.
 * Writes a message you can copy. Nothing is sent. The name also feeds the
 * booking form so two chairs is one action, not a speech.
 */
import { useMemo, useState } from "react";

import { CENTRES, formatDay } from "./data";
import type { Elig } from "./Check";
import s from "./hour.module.css";

type Props = {
  elig: Elig;
  onNamed: (name: string) => void;
  onBook: () => void;
};

export default function Bring({ elig, onNamed, onBook }: Props) {
  const [who, setWho] = useState("");
  const [when, setWhen] = useState("Thursday after teaching");
  const [centre, setCentre] = useState(CENTRES[0].id);
  const [copied, setCopied] = useState(false);

  const place = CENTRES.find((row) => row.id === centre) ?? CENTRES[0];
  const sampleDay = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + ((4 - date.getDay() + 7) % 7 || 7));
    return formatDay(date.toISOString().slice(0, 10));
  }, []);

  const cleaned =
    elig === "not-today"
      ? `${who.trim() ? `${who.trim()} — ` : ""}It's an hour. I can't give this week. Come anyway: ${place.name}, ${sampleDay}. I will sit there. If you can't donate you can still sit in the waiting room. Nothing heroic.`
      : `${who.trim() ? `${who.trim()} — ` : ""}It's an hour. I am going to ${place.name} ${when}. Come with me. If you can't give you can still sit there. Nothing heroic.`;

  const copy = async () => {
    const text = cleaned;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const box = document.getElementById("bring-msg") as HTMLTextAreaElement | null;
      if (box) {
        box.focus();
        box.select();
        setCopied(true);
      }
    }
    if (who.trim()) onNamed(who.trim());
  };

  return (
    <div>
      <p className={s.measure}>
        {elig === "not-today"
          ? "You cannot give this week. You can still be the reason someone else does. That is not a consolation prize. First-time donors last longer when they did not go alone, and you already know the hour."
          : "The first time is easier if it is not a solitary moral act. Write the message. Book two chairs."}
      </p>
      <form
        className={s.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (who.trim()) onNamed(who.trim());
          onBook();
        }}
      >
        <label className={s.label}>
          Their first name
          <input
            className={s.field}
            value={who}
            onChange={(e) => {
              setWho(e.target.value);
              setCopied(false);
            }}
          />
        </label>
        {elig !== "not-today" ? (
          <label className={s.label}>
            When you would actually go
            <input
              className={s.field}
              value={when}
              onChange={(e) => {
                setWhen(e.target.value);
                setCopied(false);
              }}
            />
          </label>
        ) : null}
        <label className={s.label}>
          Which room
          <select
            className={s.select}
            value={centre}
            onChange={(e) => {
              setCentre(e.target.value);
              setCopied(false);
            }}
          >
            {CENTRES.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} — {row.where}
              </option>
            ))}
          </select>
        </label>
        <label className={s.label}>
          The message <span>nothing is sent</span>
          <textarea
            id="bring-msg"
            className={s.msg}
            readOnly
            value={cleaned}
          />
        </label>
        <div className={s.heroActs}>
          <button type="button" className={s.primary} onClick={copy}>
            Copy the message
          </button>
          <button type="submit" className={s.secondary}>
            {who.trim()
              ? `Book an hour with ${who.trim()}`
              : "Book two chairs"}
          </button>
        </div>
        {copied ? (
          <p className={s.copied} role="status">
            Copied. Send it yourself — this page cannot.
          </p>
        ) : null}
      </form>
    </div>
  );
}
