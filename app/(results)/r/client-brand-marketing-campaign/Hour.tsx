"use client";

/**
 * The document. The persuasive engine is the hour itself — scrubbed, named,
 * including the needle — not a feeling about donation. Booking and
 * bring-someone are real on-device actions. Ineligible visitors stay.
 */
import Link from "next/link";
import { useRef, useState } from "react";

import Book from "./Book";
import Bring from "./Bring";
import Check, { type Elig } from "./Check";
import { BEATS, VOICES, beatAt } from "./data";
import s from "./hour.module.css";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Hour() {
  const [minute, setMinute] = useState(28);
  const [elig, setElig] = useState<Elig>("unknown");
  const [reason, setReason] = useState("");
  const [plusName, setPlusName] = useState("");
  const bookRef = useRef<HTMLElement | null>(null);
  const bringRef = useRef<HTMLElement | null>(null);

  const beat = beatAt(minute);
  const scrollTo = (el: HTMLElement | null) => {
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  const goBook = () => scrollTo(bookRef.current);
  const goBring = () => scrollTo(bringRef.current);

  const idx = BEATS.findIndex((row) => row.id === beat.id);

  return (
    <div className={s.root}>
      <a className={s.skip} href="#main">
        Skip to the hour
      </a>

      <header className={s.mast}>
        <div className={s.mastInner}>
          <p className={s.wordmark}>
            One Hour
            <span>National Blood Service</span>
          </p>
          <nav className={s.nav} aria-label="On this page">
            <a href="#hour">The hour</a>
            <a href="#who">Who can</a>
            <a href="#after">Where it goes</a>
            <a href="#bring">Bring someone</a>
          </nav>
          <a className={s.mastCta} href="#book">
            Book
          </a>
        </div>
      </header>

      <main id="main">
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={s.wrap}>
            <p className={s.kicker}>First time · eighteen to twenty-five</p>
            <h1 id="hero-title" className={s.headline}>
              It takes an hour.
              <br />
              <em>You have an hour.</em>
            </h1>
            <p className={s.lede}>
              You are not being asked to be a hero. You are being asked to give
              one hour, once, and see whether it is as ordinary as it sounds.
            </p>
            <p className={s.lede}>
              Most people your age who have never donated are not against it
              and not especially afraid of needles. They have just never had a
              reason to go this week rather than eventually. This page is the
              reason: exactly what happens, including the needle, who can
              actually go, and a way to bring someone so the first time is not
              a solitary moral act.
            </p>
            <div className={s.heroActs}>
              <a className={s.primary} href="#hour">
                Walk the hour
              </a>
              <a className={s.secondary} href="#book">
                Book this week
              </a>
            </div>
          </div>
        </section>

        <section className={s.section} id="hour" aria-labelledby="hour-title">
          <div className={s.wide}>
            <div className={s.walkHead}>
              <div>
                <p className={s.kicker}>00:00 – 01:00</p>
                <h2 id="hour-title" className={s.sectionTitle}>
                  What actually happens
                </h2>
              </div>
              <p className={s.clock} aria-live="polite">
                Minute {minute} of 60
              </p>
            </div>
            <p className={s.measure} style={{ maxWidth: "40rem" }}>
              Drag the hour. Or tap a stretch. The donation itself is eight to
              twelve minutes. The rest is sitting, answering, and not standing
              up too fast.
            </p>
            <div className={s.walkLayout}>
              <div>
                <label className={s.label} htmlFor="scrub">
                  Minute of the hour
                </label>
                <div className={s.bar} aria-hidden="true">
                  {Array.from({ length: 60 }, (_, i) => (
                    <i
                      key={i}
                      className={
                        i === minute ? s.barNow : i < minute ? s.barOn : undefined
                      }
                    />
                  ))}
                </div>
                <input
                  id="scrub"
                  className={s.scrub}
                  type="range"
                  min={0}
                  max={59}
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                />
                <div className={s.ticks} role="tablist" aria-label="Stretches of the hour">
                  {BEATS.map((row) => {
                    const on = beat.id === row.id;
                    const needle = row.id === "needle";
                    return (
                      <button
                        key={row.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        className={`${s.tick} ${on ? s.tickOn : ""} ${needle ? s.tickNeedle : ""}`}
                        onClick={() => setMinute(row.start)}
                      >
                        <span>
                          {pad(row.start)}–{pad(row.end)}
                        </span>
                        {row.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              <article className={s.beat} aria-live="polite">
                <p className={s.kicker}>
                  Minute {pad(beat.start)} to {pad(beat.end)}
                </p>
                <h3 className={s.sectionTitle}>{beat.title}</h3>
                <p className={s.beatLead}>{beat.lead}</p>
                {beat.body.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
                <div className={s.stepper}>
                  <button
                    type="button"
                    disabled={idx <= 0}
                    onClick={() => setMinute(BEATS[Math.max(0, idx - 1)].start)}
                  >
                    Earlier
                  </button>
                  <button
                    type="button"
                    disabled={idx >= BEATS.length - 1}
                    onClick={() =>
                      setMinute(BEATS[Math.min(BEATS.length - 1, idx + 1)].start)
                    }
                  >
                    Later
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={s.section} id="who" aria-labelledby="who-title">
          <div className={s.wrap}>
            <p className={s.kicker}>The thing that stops people</p>
            <h2 id="who-title" className={s.sectionTitle}>
              A tattoo does not bar you for life. Neither do antidepressants.
            </h2>
            <p className={s.measure}>
              Eligibility is the main reason first-timers close the tab. It is
              complicated, and two of the common beliefs are simply leftover
              from older rules. The answers below are typical whole-blood
              practice, not a clearance, and they differ by country.
            </p>
            <div className={s.myths}>
              <div className={s.myth}>
                <h3>Tattoos and piercings</h3>
                <p>
                  Ink does not permanently disqualify you. Many services now
                  accept a tattoo from a licensed studio that used sterile
                  single-use equipment with no extra wait. Others ask for a few
                  months if they cannot verify that. The belief that a tattoo
                  bars you forever is leftover. Say when and where when you
                  book. Do not stay home on a guess.
                </p>
              </div>
              <div className={s.myth}>
                <h3>Antidepressants</h3>
                <p>
                  Taking a common antidepressant — sertraline, fluoxetine,
                  citalopram, escitalopram, venlafaxine, and most others —
                  does not itself stop you donating. Being in a crisis or
                  currently very unwell might. That is about how you are that
                  day, not the packet in your bag.
                </p>
              </div>
            </div>
            <Check
              onChange={(next, why) => {
                setElig(next);
                setReason(why);
              }}
              onBring={goBring}
              onBook={goBook}
            />
            {elig !== "unknown" && reason ? (
              <p className={s.note}>This page&apos;s reading: {reason}.</p>
            ) : null}
          </div>
        </section>

        <section className={s.section} id="before" aria-labelledby="before-title">
          <div className={s.wrap}>
            <p className={s.kicker}>The day itself</p>
            <h2 id="before-title" className={s.sectionTitle}>
              What to eat. When you can go to the gym.
            </h2>
            <div className={s.facts}>
              <div>
                <h3>Before you go</h3>
                <ul>
                  <li>
                    A proper meal in the hours before — not just a biscuit in
                    the car. Do not arrive hungry.
                  </li>
                  <li>
                    Extra water. About 500 millilitres in the two hours before
                    is a usual ask.
                  </li>
                  <li>
                    Iron-rich food in the days before helps: beans, lentils,
                    leafy greens, fortified cereal, red meat if you eat it.
                    Low iron is the most common on-the-day stop for first-timers,
                    especially if you menstruate.
                  </li>
                  <li>
                    Skip a greasy takeaway immediately before. Fat in the blood
                    can make the plasma unusable, so the unit may be wasted.
                  </li>
                </ul>
              </div>
              <div>
                <h3>The gym</h3>
                <ul>
                  <li>
                    Do not do a hard session the same day, before or after.
                  </li>
                  <li>
                    After: no heavy lifting and no strain on that arm for the
                    rest of the day. Most services say wait until the next day
                    for a normal gym session if you feel well.
                  </li>
                  <li>Walking is fine. A lecture is fine.</li>
                  <li>
                    A night out is unwise if you were at all lightheaded. Drink
                    more water than usual today either way.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={s.section} id="after" aria-labelledby="after-title">
          <div className={s.wrap}>
            <p className={s.kicker}>After you leave</p>
            <h2 id="after-title" className={s.sectionTitle}>
              Where the blood goes
            </h2>
            <p className={s.measure}>
              Knowing it went to a person — not a fridge — is why people come
              back. &ldquo;Three lives&rdquo; is a slogan. What is true: a
              whole-blood donation is usually split into products, which may
              go to different patients depending on what is needed that week.
            </p>
            <ol className={s.route}>
              <li>
                The bag is labelled and sealed. Your name is not on the bag
                that goes to a hospital. A number is.
              </li>
              <li>
                It is tested. If anything needs talking about, they contact
                you. Silence is not a diagnosis, and a contact is not usually
                an emergency.
              </li>
              <li>
                Whole blood is usually separated into red cells, plasma and
                platelets. That is three products, not a promise of three
                people.
              </li>
              <li>
                Red cells go to surgery, trauma, some anaemias including sickle
                cell. They last weeks, not months — typically up to 35–42 days.
              </li>
              <li>
                Platelets go mainly to people on cancer treatment. They last
                days — typically five to seven — which is why regular donors
                matter more than a single dramatic gesture.
              </li>
              <li>
                Plasma can be frozen and kept much longer. Burns, clotting
                problems, some immune conditions.
              </li>
            </ol>
            <p className={s.note}>
              The route above is typical processing, not a guarantee about any
              one bag. Services publish their own shelf lives and they differ
              slightly.
            </p>
          </div>
        </section>

        <section className={s.section} aria-labelledby="voices-title">
          <div className={s.wrap}>
            <p className={s.kicker}>People who already went</p>
            <h2 id="voices-title" className={s.sectionTitle}>
              Specific, not inspiring
            </h2>
            <p className={s.note}>
              The sentences below are composites — not real named donors. A
              live service would replace them with first-timers who actually
              went.
            </p>
            <div className={s.voices}>
              {VOICES.map((voice) => (
                <blockquote key={voice.name} className={s.voice}>
                  <p>&ldquo;{voice.line}&rdquo;</p>
                  <footer>
                    {voice.name}, {voice.age}. Composite.
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section
          className={s.section}
          id="bring"
          ref={bringRef}
          aria-labelledby="bring-title"
        >
          <div className={s.wrap}>
            <p className={s.kicker}>Secondary, unless you cannot give</p>
            <h2 id="bring-title" className={s.sectionTitle}>
              {elig === "not-today"
                ? "You can't give this week. Bring someone who can."
                : "Bring someone."}
            </h2>
            <Bring elig={elig} onNamed={setPlusName} onBook={goBook} />
          </div>
        </section>

        <section
          className={s.section}
          id="book"
          ref={bookRef}
          aria-labelledby="book-title"
        >
          <div className={s.wrap}>
            <p className={s.kicker}>The hour on a calendar</p>
            <h2 id="book-title" className={s.sectionTitle}>
              Book an appointment
            </h2>
            <p className={s.measure}>
              Pick a room, a day, an hour. If you wrote someone&apos;s name
              above it is already on the form. Nothing leaves this browser.
            </p>
            <Book elig={elig} plusName={plusName} />
          </div>
        </section>

        <footer className={s.foot}>
          <div className={s.wrap}>
            <p>
              One Hour is a campaign for a fictional national blood service.
              Clinical statements are written modestly from typical whole-blood
              practice at services such as NHS Blood and Transplant (England)
              and the American Red Cross. They are not personal medical advice
              and they are not a booking. Centres, times, and the three
              first-timer voices are invented fixtures, labelled where they
              appear.
            </p>
            <p>
              <Link className={s.task} href="/tasks/client-brand-marketing-campaign">
                Task
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
