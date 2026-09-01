"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import {
  DISCLAIMER,
  HONESTY,
  PHONE_DISPLAY,
  PHONE_TEL,
  REAL,
  TOPICS,
  topicById,
  type LetterId,
  type TopicId,
} from "./copy";
import { Desk } from "./Desk";
import { ROOMS, deskAt } from "./hours";
import s from "./duty.module.css";

type View = "front" | "desk";

export function Clinic() {
  const [view, setView] = useState<View>("front");
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [letter, setLetter] = useState<LetterId | null>(null);
  const [now, setNow] = useState(() => new Date());
  const answerRef = useRef<HTMLHeadingElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const live = useId();
  const clock = deskAt(now);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!topic) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    questionRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    answerRef.current?.focus({ preventScroll: true });
  }, [topic]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (view === "desk") {
          setView("front");
          return;
        }
        if (topic) {
          setTopic(null);
          setLetter(null);
          questionRef.current?.focus();
        }
        return;
      }
      if (view !== "front" || topic) return;
      const found = TOPICS.find((row) => row.key === event.key);
      if (found) {
        event.preventDefault();
        pick(found.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, topic]);

  function pick(id: TopicId) {
    setTopic(id);
    setLetter(null);
    setView("front");
  }

  function clearTopic() {
    setTopic(null);
    setLetter(null);
    questionRef.current?.focus();
  }

  const chosen = topic ? topicById(topic) : null;
  const deadline =
    chosen?.letters && letter
      ? chosen.letters.find((row) => row.id === letter)?.deadline ?? chosen.deadline
      : chosen?.deadline;

  return (
    <>
      <a className={s.skip} href="#call">
        Skip to the phone number
      </a>
      <a className={s.skip} href="#question">
        Skip to the question
      </a>

      <header className={s.bar} id="call">
        <a className={s.call} href={PHONE_TEL}>
          <span className={s.callKicker}>Call · free</span>
          <span className={s.callNum}>{PHONE_DISPLAY}</span>
        </a>
        <p className={s.barMeta} data-open={clock.phoneOpen || Boolean(clock.dropIn)}>
          {clock.line}
        </p>
      </header>

      {view === "desk" ? (
        <main id="main" className={s.main}>
          <p className={s.mark}>Duty</p>
          <Desk onBack={() => setView("front")} />
          <Colophon />
        </main>
      ) : (
        <main id="main" className={s.main}>
          <p className={s.mark}>Duty</p>
          {topic ? null : (
            <>
              <p className={s.lede}>
                Free help with housing, money, benefits and work. Short words.
                You can call and ask for an interpreter.
              </p>
              <p className={s.disclaimer}>{DISCLAIMER}</p>
            </>
          )}

          <section
            className={s.triage}
            aria-labelledby="question"
            data-settled={topic ? "yes" : "no"}
          >
            <h1 ref={questionRef} id="question" className={s.question} tabIndex={-1}>
              What is the letter about?
            </h1>

            <div className={s.choices}>
              {TOPICS.map((row) => {
                const on = topic === row.id;
                const hide = Boolean(topic) && !on;
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={s.choice}
                    data-on={on}
                    hidden={hide}
                    aria-pressed={on}
                    onClick={() => (on && topic ? clearTopic() : pick(row.id))}
                  >
                    <span className={s.choiceKey} aria-hidden="true">
                      {row.key}
                    </span>
                    <span className={s.choiceText}>
                      <span className={s.choiceLabel}>{row.label}</span>
                      <span className={s.choiceHint}>{row.hint}</span>
                    </span>
                    {on ? <span className={s.change}>Change</span> : null}
                  </button>
                );
              })}
            </div>
            {!topic ? (
              <p className={s.keysHint}>Keys 1 to 6 also work. Escape clears a choice.</p>
            ) : null}
          </section>

          <div id={live} className={s.live} aria-live="polite">
            {chosen ? `${chosen.yes} What to do today is below.` : ""}
          </div>

          {chosen && deadline ? (
            <article className={s.sheet} aria-labelledby="answer-title">
              <p className={s.stamp} data-help={chosen.weHelp}>
                {chosen.weHelp ? "We help with this" : "We do not take this"}
              </p>
              <h2 ref={answerRef} id="answer-title" className={s.yes} tabIndex={-1}>
                {chosen.yes}
              </h2>
              <p className={s.deadKicker}>{deadline.title}</p>

              <section className={s.block} aria-labelledby="today">
                <h3 id="today">Today</h3>
                <ol className={s.today}>
                  {chosen.today.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>

              <section className={s.deadline} aria-labelledby="dead">
                <h3 id="dead">{deadline.title}</h3>
                <p>{deadline.body}</p>
                <p className={s.miss}>
                  <strong>If you miss it. </strong>
                  {deadline.miss}
                </p>
              </section>

              {chosen.letters ? (
                <section className={s.letters} aria-labelledby="letter-kind">
                  <h3 id="letter-kind">What does the letter look like?</h3>
                  <p className={s.letterLead}>
                    Tap one. The date you must not miss will change.
                  </p>
                  <div className={s.letterRow}>
                    {chosen.letters.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className={s.letter}
                        data-on={letter === row.id}
                        aria-pressed={letter === row.id}
                        onClick={() =>
                          setLetter((current) => (current === row.id ? null : row.id))
                        }
                      >
                        {row.label}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {chosen.more.length ? (
                <section className={s.more}>
                  {chosen.more.map((para) => (
                    <p key={para}>{para}</p>
                  ))}
                </section>
              ) : null}

              <section className={s.reach} aria-labelledby="reach">
                <h3 id="reach">A person</h3>
                <p>
                  Call{" "}
                  <a className={s.inlineTel} href={PHONE_TEL}>
                    {PHONE_DISPLAY}
                  </a>
                  . Say the language if you need an interpreter.
                </p>
                <ul className={s.rooms}>
                  {ROOMS.map((room) => (
                    <li key={room.id}>
                      <span className={s.mono}>{room.when}</span>
                      {room.name}
                    </li>
                  ))}
                </ul>
                <p className={s.quiet}>
                  Night and weekend. Leave a voicemail — we call back when we
                  open. If the letter is about housing and you cannot wait:{" "}
                  <a href={REAL.shelter.tel}>{REAL.shelter.display}</a> is
                  Shelter, a real national housing line, not us. If you need to
                  talk to someone tonight:{" "}
                  <a href={REAL.samaritans.tel}>{REAL.samaritans.display}</a> is
                  Samaritans. If you are in danger:{" "}
                  <a href={REAL.emergency.tel}>{REAL.emergency.display}</a>.
                </p>
                {chosen.id === "work" ? (
                  <p className={s.quiet}>
                    Acas early conciliation, a real public service:{" "}
                    <a href={REAL.acas.tel}>{REAL.acas.display}</a>.
                  </p>
                ) : null}
                {chosen.id === "broken" ? (
                  <p className={s.quiet}>
                    Gas emergency, a real national line:{" "}
                    <a href={REAL.gas.tel}>{REAL.gas.display}</a>.
                  </p>
                ) : null}
              </section>

              <p className={s.disclaimer}>{DISCLAIMER}</p>
            </article>
          ) : (
            <section className={s.reach} aria-labelledby="reach-idle">
              <h2 id="reach-idle" className={s.reachIdle}>
                A person, without choosing
              </h2>
              <p>
                You can call first and tell us. You do not have to use the list
                above.
              </p>
              <ul className={s.rooms}>
                {ROOMS.map((room) => (
                  <li key={room.id}>
                    <span className={s.mono}>{room.when}</span>
                    {room.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            className={s.deskLink}
            onClick={() => setView("desk")}
          >
            Not in trouble — volunteer, refer, accounts
          </button>
          <p className={s.honesty}>{HONESTY}</p>
          <Colophon />
        </main>
      )}
    </>
  );
}

function Colophon() {
  return (
    <p className={s.colophon}>
      <Link href="/tasks/traditional-websites-nonprofit">The task</Link>
    </p>
  );
}
