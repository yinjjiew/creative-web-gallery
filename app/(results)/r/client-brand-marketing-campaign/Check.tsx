"use client";

/**
 * Eligibility, as a conversation rather than a gate.
 *
 * The two beliefs that cause the most drop-off — a tattoo bars you for life,
 * antidepressants bar you — are answered in copy above the questions. The
 * questions themselves are only the things that actually change what happens
 * this week. Ineligible visitors are told when to come back and sent to
 * bring-someone, not shown a closed door.
 */
import { useMemo, useState } from "react";

import s from "./hour.module.css";

export type Elig = "unknown" | "likely" | "ask" | "not-today";

type Ans = "yes" | "no" | "";

type Props = {
  onChange: (elig: Elig, reason: string) => void;
  onBring: () => void;
  onBook: () => void;
};

export default function Check({ onChange, onBring, onBook }: Props) {
  const [age, setAge] = useState<Ans>("");
  const [weight, setWeight] = useState<Ans>("");
  const [well, setWell] = useState<Ans>("");
  const [tattoo, setTattoo] = useState<Ans>("");
  const [pills, setPills] = useState<Ans>("");

  const result = useMemo(() => {
    if (!age || !weight || !well || !tattoo || !pills) {
      return { elig: "unknown" as const, title: "", body: "", reason: "" };
    }
    if (age === "no") {
      return {
        elig: "not-today" as const,
        title: "Not this year.",
        body: "First donation is typically from 17, and 18 in some places. You can still bring someone who can go. When you are old enough, the hour is the same.",
        reason: "under the usual first-donation age",
      };
    }
    if (weight === "no") {
      return {
        elig: "not-today" as const,
        title: "Not at this weight.",
        body: "Most services ask for at least 50 kilograms — 7 stone 12 pounds — because the unit taken is a fixed volume. That is about safety for you, not a judgement of your body. You can still bring someone. If your weight changes, come back.",
        reason: "under the usual weight threshold",
      };
    }
    if (well === "no") {
      return {
        elig: "not-today" as const,
        title: "Not this week.",
        body: "A cold, a fever, antibiotics for an infection, or just feeling rough: wait until you are well. This is the most ordinary deferral there is. Book the hour for when you are, or take someone who is well now.",
        reason: "not well enough today",
      };
    }
    if (tattoo === "yes") {
      return {
        elig: "ask" as const,
        title: "Ask when you book. Often still yes.",
        body: "A recent tattoo is a timing question, not a lifetime bar. Many services accept a tattoo from a licensed studio with sterile single-use equipment with no extra wait; others ask you to wait a few months if they cannot verify that. Say it when you book. Do not stay home on a guess.",
        reason: "recent tattoo — local rule",
      };
    }
    if (pills === "yes") {
      return {
        elig: "likely" as const,
        title: "You can almost certainly go.",
        body: "Taking a common antidepressant does not itself stop you donating. Being in a crisis or currently very unwell might — that is about how you are, not the packet. They will still check iron and blood pressure on the day, as they do for everyone.",
        reason: "on antidepressants — usually fine",
      };
    }
    return {
      elig: "likely" as const,
      title: "You can almost certainly go.",
      body: "They still check you on the day: iron, pulse, blood pressure, the questionnaire. That check is why some first visits end in tea and a later appointment. It is not a trick. Book an hour.",
      reason: "no obvious barrier this week",
    };
  }, [age, pills, tattoo, weight, well]);

  const answered = Boolean(age && weight && well && tattoo && pills);

  const pick = (write: (value: Ans) => void, value: Ans) => {
    write(value);
    // Compute from the upcoming set; parent only needs a coarse signal.
    const next = {
      age: write === setAge ? value : age,
      weight: write === setWeight ? value : weight,
      well: write === setWell ? value : well,
      tattoo: write === setTattoo ? value : tattoo,
      pills: write === setPills ? value : pills,
    };
    const complete = Object.values(next).every(Boolean);
    if (!complete) {
      onChange("unknown", "");
      return;
    }
    if (next.age === "no") onChange("not-today", "under the usual first-donation age");
    else if (next.weight === "no") onChange("not-today", "under the usual weight threshold");
    else if (next.well === "no") onChange("not-today", "not well enough today");
    else if (next.tattoo === "yes") onChange("ask", "recent tattoo — local rule");
    else onChange("likely", next.pills === "yes" ? "on antidepressants — usually fine" : "no obvious barrier this week");
  };

  return (
    <div className={s.check}>
      <p className={s.kicker}>Five questions. Not a diagnosis.</p>
      <form
        className={s.form}
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="elig-note"
      >
        <Q
          legend="Are you 17 or older?"
          name="age"
          value={age}
          onPick={(v) => pick(setAge, v)}
          yes="Yes"
          no="Not yet"
        />
        <Q
          legend="Do you weigh at least 50 kg — 7 st 12 lb?"
          name="weight"
          value={weight}
          onPick={(v) => pick(setWeight, v)}
        />
        <Q
          legend="Are you well today — no cold, fever, or infection?"
          name="well"
          value={well}
          onPick={(v) => pick(setWell, v)}
        />
        <Q
          legend="Have you had a tattoo or piercing in the last four months?"
          name="tattoo"
          value={tattoo}
          onPick={(v) => pick(setTattoo, v)}
          yes="Yes"
          no="No"
        />
        <Q
          legend="Do you take an antidepressant?"
          name="pills"
          value={pills}
          onPick={(v) => pick(setPills, v)}
          yes="Yes"
          no="No"
        />
      </form>
      <p id="elig-note" className={s.note}>
        This is not a medical clearance. Pregnancy, recent travel to a
        malaria-risk area, some infections, and a few medications can defer
        you — say them when you book. Rules differ by country.
      </p>
      {answered && result.title ? (
        <div className={s.verdict} role="status">
          <h3>{result.title}</h3>
          <p>{result.body}</p>
          {result.elig === "not-today" ? (
            <div className={s.heroActs}>
              <button type="button" className={s.primary} onClick={onBring}>
                Bring someone who can
              </button>
              <button type="button" className={s.secondary} onClick={onBook}>
                Book for later anyway
              </button>
            </div>
          ) : (
            <div className={s.heroActs}>
              <button type="button" className={s.primary} onClick={onBook}>
                Book an hour
              </button>
              <button type="button" className={s.secondary} onClick={onBring}>
                Bring someone
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Q({
  legend,
  name,
  value,
  onPick,
  yes = "Yes",
  no = "No",
}: {
  legend: string;
  name: string;
  value: Ans;
  onPick: (value: Ans) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <fieldset className={s.q}>
      <legend>{legend}</legend>
      <div className={s.choices}>
        <label className={s.choice}>
          <input
            type="radio"
            name={name}
            checked={value === "yes"}
            onChange={() => onPick("yes")}
          />
          {yes}
        </label>
        <label className={s.choice}>
          <input
            type="radio"
            name={name}
            checked={value === "no"}
            onChange={() => onPick("no")}
          />
          {no}
        </label>
      </div>
    </fieldset>
  );
}
