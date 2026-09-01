"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { longDate, overduePhrase, shortDate, untilPhrase } from "./dates";
import {
  claim,
  complete,
  derive,
  release,
  setYou,
  wake,
  type Card,
} from "./engine";
import s from "./intake.module.css";
import { loadSitting, saveSitting } from "./persist";
import { AWAY, ANIMALS, ON_SHIFT, emptySitting } from "./seed";
import { STEP_LABEL, type Sitting } from "./types";

const PHONE = "phone";

const TICK: Record<Card["band"], string> = {
  orphan: s.orphan,
  yours: s.yours,
  held: s.held,
  waiting: s.waiting,
};

function adoptPhone(sitting: Sitting, youId: string): Sitting {
  return {
    ...sitting,
    youId,
    steps: sitting.steps.map((step) =>
      step.ownerId === PHONE && !step.doneOn ? { ...step, ownerId: youId } : step,
    ),
  };
}

function withYou(sitting: Sitting): Sitting {
  return sitting.youId ? sitting : setYou(sitting, PHONE);
}

let audio: AudioContext | null = null;

function tapSound(kind: "take" | "done") {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  audio ??= new Ctor();
  if (audio.state === "suspended") void audio.resume();
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(kind === "take" ? 196 : 294, t);
  osc.frequency.exponentialRampToValueAtTime(kind === "take" ? 98 : 196, t + 0.08);
  gain.gain.setValueAtTime(0.045, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.13);
}

function ownerLine(card: Card, youId: string | null): string {
  if (!card.owner) return "No one is holding this.";
  if (card.owner.id === youId) return "You are holding this.";
  if (card.owner.id === PHONE) return "This phone took it, unnamed.";
  if (card.owner.present) return `${card.owner.name} is holding this — they are here.`;
  return `${card.owner.name} had this. They are not in the building.`;
}

function whenLine(card: Card): string {
  if (card.lockReason) return card.lockReason;
  if (card.band === "waiting") return `Not due until ${shortDate(card.step.dueOn)} (${untilPhrase(card.daysUntilDue)}).`;
  if (card.daysOverdue === 0) return "Due this morning.";
  return overduePhrase(card.daysOverdue);
}

export default function App() {
  const [sitting, setSitting] = useState<Sitting>(emptySitting);
  const [ready, setReady] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setSitting(loadSitting());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSitting(sitting);
  }, [ready, sitting]);

  const cards = useMemo(() => derive(sitting), [sitting]);
  const orphans = cards.filter((c) => c.band === "orphan");
  const yours = cards.filter((c) => c.band === "yours");
  const held = cards.filter((c) => c.band === "held");
  const waiting = cards.filter((c) => c.band === "waiting");

  const you = ON_SHIFT.find((v) => v.id === sitting.youId);
  const youLabel =
    sitting.youId === PHONE ? "This phone" : you?.name ?? null;

  const announce = useCallback((text: string) => {
    if (liveRef.current) liveRef.current.textContent = text;
  }, []);

  const take = useCallback(
    (stepId: string) => {
      setSitting((prev) => {
        const next = claim(withYou(prev), stepId);
        const card = derive(next).find((c) => c.step.id === stepId);
        announce(
          card
            ? `${card.animal.name} is in your hand. ${card.step.brief}`
            : "Taken.",
        );
        return next;
      });
      setFocusId(stepId);
      tapSound("take");
    },
    [announce],
  );

  const finish = useCallback(
    (stepId: string) => {
      setSitting((prev) => {
        const card = derive(prev).find((c) => c.step.id === stepId);
        const next = complete(prev, stepId);
        const spawned = next.steps.find(
          (st) => !prev.steps.some((old) => old.id === st.id),
        );
        announce(
          spawned
            ? `${card?.animal.name ?? "Done"}. Next step is ${STEP_LABEL[spawned.kind]}, ${spawned.lockedUntil ? "locked until it is due" : "and it has no owner yet"}.`
            : `${card?.animal.name ?? "Step"} is finished.`,
        );
        return next;
      });
      tapSound("done");
    },
    [announce],
  );

  const drop = useCallback(
    (stepId: string) => {
      setSitting((prev) => release(prev, stepId));
      announce("Released. The step has no owner.");
    },
    [announce],
  );

  const pick = useCallback(
    (id: string) => {
      setSitting((prev) => {
        const next = adoptPhone({ ...prev, youId: id }, id);
        const view = derive(next);
        const mine = view.filter((c) => c.band === "yours");
        const holes = view.filter((c) => c.band === "orphan");
        const who = ON_SHIFT.find((v) => v.id === id)?.name ?? "You";
        announce(
          mine[0]
            ? `${who}. Your next is ${mine[0].animal.name}: ${mine[0].step.brief}`
            : `${who}. Nothing in your hand. ${holes.length} ${holes.length === 1 ? "step has" : "steps have"} no one.`,
        );
        return next;
      });
    },
    [announce],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setSitting((prev) => wake(prev));
        announce("Next morning.");
        return;
      }
      if (e.key === "r" && e.shiftKey) {
        e.preventDefault();
        setSitting(emptySitting());
        setFocusId(null);
        announce("Sitting reset.");
        return;
      }
      const idx = "123".indexOf(e.key);
      if (idx >= 0 && ON_SHIFT[idx]) {
        e.preventDefault();
        pick(ON_SHIFT[idx].id);
        return;
      }
      if (e.key === "Enter" && focusId) {
        const card = cards.find((c) => c.step.id === focusId);
        if (!card) return;
        e.preventDefault();
        if (card.canComplete) finish(card.step.id);
        else if (card.band === "orphan") take(card.step.id);
      }
      if ((e.key === "Backspace" || e.key === "x" || e.key === "X") && focusId) {
        const card = cards.find((c) => c.step.id === focusId);
        if (card?.canRelease) {
          e.preventDefault();
          drop(card.step.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [announce, cards, drop, finish, focusId, pick, take]);

  const lead = yours[0] ?? orphans[0] ?? null;

  const rail = ANIMALS.map((animal) => {
    const open = cards.filter((c) => c.animal.id === animal.id);
    const top =
      open.find((c) => c.band === "orphan") ??
      open.find((c) => c.band === "yours") ??
      open.find((c) => c.band === "held") ??
      open.find((c) => c.band === "waiting") ??
      null;
    return { animal, top };
  });

  return (
    <div className={s.root}>
      <p ref={liveRef} className={s.live} aria-live="polite" />

      <header className={s.mast}>
        <div className={s.brand}>
          <p className={s.mark}>Intake</p>
          <p className={s.date}>{longDate(sitting.today)}</p>
        </div>
        <div className={s.clock}>
          <button
            type="button"
            className={s.morning}
            onClick={() => {
              setSitting((prev) => wake(prev));
              announce("Next morning.");
            }}
          >
            Next morning
          </button>
          <button
            type="button"
            className={s.reset}
            onClick={() => {
              setSitting(emptySitting());
              setFocusId(null);
              announce("Sitting reset.");
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <section className={s.now} aria-label="The next action">
        {lead ? (
          <>
            <p className={s.nowKicker}>
              {lead.band === "orphan"
                ? `No one is holding this · ${orphans.length} unheld`
                : "In your hand — this is the next action"}
            </p>
            <StepCard
              card={lead}
              youId={sitting.youId}
              lead
              focused={focusId === lead.step.id}
              onFocus={() => setFocusId(lead.step.id)}
              onTake={() => take(lead.step.id)}
              onFinish={() => finish(lead.step.id)}
              onDrop={() => drop(lead.step.id)}
            />
          </>
        ) : (
          <p className={s.empty}>
            Every due step has a person. That is the whole job. Advance a
            morning and an interval will come due without an owner — that is
            the failure this board exists to show.
          </p>
        )}
      </section>

      <section className={s.shift} aria-label="Who is on this phone">
        <p className={s.shiftLead}>
          {sitting.youId === PHONE ? (
            yours[0] ? (
              <>
                <strong>This phone</strong> is holding a card, unnamed. Put a
                name on the board if you have one. Next: {yours[0].animal.name}{" "}
                — {yours[0].step.brief}
              </>
            ) : (
              <>
                <strong>This phone</strong>, unnamed. Take a card or put a name
                on the board.
              </>
            )
          ) : youLabel ? (
            <>
              <strong>{youLabel}</strong> is on this phone.
              {yours[0] ? (
                <> Next: {yours[0].animal.name} — {yours[0].step.brief}</>
              ) : orphans[0] ? (
                <> Nothing in your hand. Take {orphans[0].animal.name}.</>
              ) : (
                <> Every due step has a person.</>
              )}
            </>
          ) : (
            <>Who is on this phone? Your name, or just take the top card.</>
          )}
        </p>
        <div className={s.names} role="group" aria-label="People on shift">
          {ON_SHIFT.map((v, i) => (
            <button
              key={v.id}
              type="button"
              className={s.name}
              aria-pressed={sitting.youId === v.id}
              onClick={() => pick(v.id)}
            >
              <span className={s.nameKey}>{i + 1}</span>
              {v.name}
              {v.staff ? <span className={s.staff}>staff</span> : null}
            </button>
          ))}
        </div>
        <p className={s.away}>
          Not in the building: {AWAY.map((v) => v.name).join(", ")}
          {AWAY.some((v) => v.id === "june") ? " — June is on holiday." : "."} Rowan is fostering at home.
        </p>
      </section>

      <main className={s.board}>
        <section className={s.well} aria-labelledby="orphans-h">
          <div className={s.wellHead}>
            <h1 id="orphans-h" className={s.h}>
              No one is holding these
            </h1>
          </div>
          {orphans.filter((c) => c.step.id !== lead?.step.id).length === 0 && orphans.length > 0 ? (
            <p className={s.emptySmall}>The rest have people, or they are the card above.</p>
          ) : orphans.length === 0 ? (
            <p className={s.emptySmall}>Empty. The well is the failure. Keep it empty.</p>
          ) : (
            <ul className={s.cards}>
              {orphans
                .filter((c) => c.step.id !== lead?.step.id)
                .map((card) => (
                  <li key={card.step.id}>
                    <StepCard
                      card={card}
                      youId={sitting.youId}
                      lead={false}
                      focused={focusId === card.step.id}
                      onFocus={() => setFocusId(card.step.id)}
                      onTake={() => take(card.step.id)}
                      onFinish={() => finish(card.step.id)}
                      onDrop={() => drop(card.step.id)}
                    />
                  </li>
                ))}
            </ul>
          )}
        </section>

        <div className={s.side}>
          <section className={s.hand} aria-labelledby="hand-h">
            <h2 id="hand-h" className={s.h2}>
              In your hand
            </h2>
            {yours.filter((c) => c.step.id !== lead?.step.id).length === 0 ? (
              <p className={s.emptySmall}>
                {yours.length > 0
                  ? "Only the card above."
                  : "Empty. Take the card at the top — that is the next action."}
              </p>
            ) : (
              <ul className={s.cards}>
                {yours
                  .filter((c) => c.step.id !== lead?.step.id)
                  .map((card) => (
                    <li key={card.step.id}>
                      <StepCard
                        card={card}
                        youId={sitting.youId}
                        lead={false}
                        focused={focusId === card.step.id}
                        onFocus={() => setFocusId(card.step.id)}
                        onTake={() => take(card.step.id)}
                        onFinish={() => finish(card.step.id)}
                        onDrop={() => drop(card.step.id)}
                      />
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {held.length > 0 ? (
            <section className={s.held} aria-labelledby="held-h">
              <h2 id="held-h" className={s.h2}>
                Held by someone here
              </h2>
              <ul className={s.quiet}>
                {held.map((card) => (
                  <li key={card.step.id}>
                    <button
                      type="button"
                      id={`card-${card.step.id}`}
                      className={s.quietRow}
                      onClick={() => setFocusId(card.step.id)}
                    >
                      <em>{card.animal.name}</em>
                      <span>{STEP_LABEL[card.step.kind]}</span>
                      <span>{card.owner?.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {waiting.length > 0 ? (
            <section className={s.held} aria-labelledby="wait-h">
              <h2 id="wait-h" className={s.h2}>
                Locked by an interval
              </h2>
              <ul className={s.quiet}>
                {waiting.map((card) => (
                  <li key={card.step.id}>
                    <p id={`card-${card.step.id}`} className={s.quietRow}>
                      <em>{card.animal.name}</em>
                      <span>{STEP_LABEL[card.step.kind]}</span>
                      <span>
                        {card.owner && card.owner.id !== PHONE
                          ? `${card.owner.name} · ${untilPhrase(card.daysUntilDue)}`
                          : untilPhrase(card.daysUntilDue)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>

      <nav className={s.rail} aria-label="Every animal">
        {rail.map(({ animal, top }) => (
          <button
            key={animal.id}
            type="button"
            className={`${s.tick} ${top ? TICK[top.band] : s.clear}`}
            onClick={() => {
              if (top) {
                setFocusId(top.step.id);
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                document.getElementById(`card-${top.step.id}`)?.scrollIntoView({
                  block: "nearest",
                  behavior: reduce ? "auto" : "smooth",
                });
              }
            }}
          >
            <span className={s.tickName}>{animal.name}</span>
            <span className={s.tickStep}>
              {top ? STEP_LABEL[top.step.kind] : "Clear"}
            </span>
          </button>
        ))}
      </nav>

      <footer className={s.colophon}>
        <p>
          Cats and shifts are modelled for this sitting — not a live rescue.
          FVRCP spacing and the six-week floor are{" "}
          <i>AAFP / AAHA Feline Vaccination Guidelines (2020)</i>. Ten-day
          arrival isolation, seven days between a vaccine and surgery, ten-day
          post-op listing hold, and the fourteen-day follow-up are this
          rescue&apos;s stated rules, not statute. A lock will not lift early.
        </p>
        <p className={s.keys}>
          1–3 name · Enter takes or finishes the focused card · X releases · N
          next morning · Shift-R resets
        </p>
        <Link href="/tasks/practical-apps-workflow-automation" className={s.back}>
          Task
        </Link>
      </footer>
    </div>
  );
}

function StepCard({
  card,
  youId,
  lead,
  focused,
  onFocus,
  onTake,
  onFinish,
  onDrop,
}: {
  card: Card;
  youId: string | null;
  lead: boolean;
  focused: boolean;
  onFocus: () => void;
  onTake: () => void;
  onFinish: () => void;
  onDrop: () => void;
}) {
  const orphan = card.band === "orphan";
  const yours = card.band === "yours";

  return (
    <article
      id={`card-${card.step.id}`}
      className={`${s.card} ${orphan ? s.orphan : ""} ${yours ? s.yours : ""} ${lead ? s.lead : ""} ${focused ? s.focused : ""}`}
      onClick={onFocus}
    >
      <header className={s.cardTop}>
        <h3 className={s.cat}>{card.animal.name}</h3>
        <p className={s.meta}>
          {card.animal.sex === "F" ? "Queen" : "Tom"} · {card.animal.age}
        </p>
        <p className={s.where}>{card.animal.where}</p>
      </header>
      <p className={s.kind}>{STEP_LABEL[card.step.kind]}</p>
      <p className={s.when}>{whenLine(card)}</p>
      <p className={s.brief}>{card.step.brief}</p>
      {(yours || lead) && <p className={s.context}>{card.step.context}</p>}
      {card.animal.meds && (yours || lead) ? (
        <p className={s.meds}>Meds: {card.animal.meds}</p>
      ) : null}
      <p className={s.owner}>{ownerLine(card, youId)}</p>
      <div className={s.actions}>
        {orphan ? (
          <button type="button" className={s.take} onClick={onTake}>
            I&apos;ll take this
          </button>
        ) : null}
        {yours && card.canComplete ? (
          <button type="button" className={s.done} onClick={onFinish}>
            Done — {card.step.brief.replace(/\.$/, "")}
          </button>
        ) : null}
        {yours && card.lockReason ? (
          <p className={s.lock}>{card.lockReason}</p>
        ) : null}
        {yours && card.canRelease ? (
          <button type="button" className={s.drop} onClick={onDrop}>
            I cannot do this
          </button>
        ) : null}
      </div>
    </article>
  );
}
