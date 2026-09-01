"use client";

/**
 * The document. One finish is selected at a time and the object on the page
 * is that metal. Choosing a finish is how you would choose a watch case, not
 * how you would configure a gadget: the specification does not change, only
 * the alloy you are willing to wear on the side of your head.
 */
import Link from "next/link";
import { useState } from "react";

import { Bench, Case, Mark, Spectacles, Worn } from "./Device";
import EarFit from "./EarFit";
import Fitting from "./Fitting";
import Room from "./Room";
import {
  DEFAULT_FINISH,
  FINANCE_12,
  FINANCE_24,
  FINANCE_24_TOTAL,
  FINANCE_APR,
  FINISHES,
  PAIR_PRICE,
  SINGLE_PRICE,
  SPEC,
  STUDIOS,
  type Finish,
} from "./data";
import s from "./kestrel.module.css";

const NAV: [string, string][] = [
  ["#object", "The object"],
  ["#room", "A crowded room"],
  ["#fit", "Fit"],
  ["#facts", "Battery, price, a test"],
  ["#book", "Book a fitting"],
];

export default function Kestrel() {
  const [finish, setFinish] = useState<Finish>(DEFAULT_FINISH);

  return (
    <div className={s.root} style={{ ["--metal" as string]: finish.body.b }}>
      <a className={s.skip} href="#main">
        Skip to the page
      </a>

      <header className={s.mast}>
        <div className={s.mastInner}>
          <p className={s.wordmark}>
            <Mark className={s.mark} />
            <span>Kestrel</span>
          </p>
          <nav className={s.nav} aria-label="On this page">
            {NAV.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <a className={s.mastCta} href="#book">
            Book a fitting
          </a>
        </div>
      </header>

      <main id="main">
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>The Kestrel One</p>
            <h1 id="hero-title" className={s.headline}>
              Seven years is a long time to miss things.
            </h1>
            <p className={s.lede}>
              People who notice a change in their hearing wait, on average,
              seven years before they buy a device. They are not waiting because
              of the money. They are waiting because every hearing aid in the
              category is designed to vanish — beige, plastic, discreet — and
              the design itself tells them that what they have is something to
              hide.
            </p>
            <p className={s.lede}>
              The Kestrel One is made to be seen. Machined titanium or brass,
              finished the way a watch is finished, worn openly at the ear.
            </p>
            <p className={s.heroMeta}>
              £{PAIR_PRICE.toLocaleString("en-GB")} the pair · any finish · a
              hearing test is required
            </p>
            <a className={s.submit} href="#book">
              Book a fitting
            </a>
          </div>
          <figure className={s.heroFig}>
            <Worn finish={finish} />
            <figcaption>
              {finish.name}. 2.4 grams. Worn on the right ear.
            </figcaption>
          </figure>
        </section>

        <section className={s.band} aria-labelledby="with-you">
          <div className={s.wrap}>
            <h2 id="with-you" className={s.sectionTitle}>
              If you are here with someone, or for someone
            </h2>
            <p className={s.measure}>
              A spouse, a son, a daughter: if you are the one who found this
              page, thank you for looking. The fitting is for the person who
              will wear the device. You are welcome in the room. We will not
              talk over them, and we will not sell them something they have not
              asked to try.
            </p>
          </div>
        </section>

        <section className={s.essay} aria-labelledby="glasses">
          <div className={s.wrap}>
            <p className={s.kicker}>01 — The argument</p>
            <h2 id="glasses" className={s.display}>
              Spectacles were a medical appliance. Then they were not.
            </h2>
            <div className={s.essayGrid}>
              <div>
                <p>
                  Nobody today hides their glasses. They are chosen. They sit on
                  the face as an object of taste. The condition they correct is
                  common, and the object is allowed to be one.
                </p>
                <p>
                  Hearing has not been offered that move. The category’s instinct
                  is still to disappear, which is another way of saying the
                  category agrees that what you have is shameful. Seven years is
                  what that agreement costs: not because anyone is vain, and not
                  because anyone failed to notice. Because every product they
                  were shown was designed as an apology.
                </p>
                <p>
                  Hearing loss is not a costume and it is not a lifestyle. It is
                  a change in a sense. What is optional is whether the object
                  that helps you is required to pretend it is not there.
                </p>
                <p>Kestrel does not agree that it should pretend.</p>
              </div>
              <figure className={s.essayFig}>
                <Spectacles />
                <figcaption>
                  Drawn in the same line as the One. A medical appliance that
                  became a choice.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className={s.section} id="object" aria-labelledby="object-title">
          <div className={s.wrap}>
            <p className={s.kicker}>02 — The object</p>
            <h2 id="object-title" className={s.sectionTitle}>
              Five finishes, one price. You are choosing a case, not a specification.
            </h2>
            <p className={s.measure}>
              Grade 5 titanium or naval brass, cut in Birmingham, finished by
              hand. The body is 22 millimetres long and sits behind the ear
              where a watch would sit on a wrist: visible, on purpose. A thin
              tube runs to a receiver in the canal. Left and right are different
              pieces. The microphones face forward.
            </p>

            <div className={s.objectGrid}>
              <figure className={s.benchFig}>
                <Bench finish={finish} />
                <figcaption>
                  {finish.name} · {finish.metal}
                </figcaption>
              </figure>
              <div>
                <div className={s.finishList} role="group" aria-label="Finish">
                  {FINISHES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={s.finish}
                      aria-pressed={item.id === finish.id}
                      onClick={() => {
                        setFinish(item);
                      }}
                    >
                      <span
                        className={s.swatch}
                        style={{
                          background: `linear-gradient(135deg, ${item.body.c}, ${item.body.a} 45%, ${item.body.b})`,
                        }}
                        aria-hidden="true"
                      />
                      <span>
                        <strong>{item.name}</strong>
                        <em>{item.sentence}</em>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={s.section} id="room" aria-labelledby="room-title">
          <div className={s.wrap}>
            <p className={s.kicker}>03 — A crowded room</p>
            <h2 id="room-title" className={s.sectionTitle}>
              The person across from you, not the table behind you.
            </h2>
            <p className={s.measure}>
              This is the complaint, and it is a fair one. Most hearing aids
              make a busy room louder. Two microphones, eight millimetres apart,
              can tell the difference between the face you are looking at and
              the room you are not. That is not a miracle and it is not
              “smart.” It is a cardioid, which hearing aids have been able to
              form for thirty years, built into a body people will actually wear.
            </p>
            <Room />
          </div>
        </section>

        <section className={s.section} id="fit" aria-labelledby="fit-title">
          <div className={s.wrap}>
            <p className={s.kicker}>04 — Fit and sizing</p>
            <h2 id="fit-title" className={s.sectionTitle}>
              We will not sell you a size from a website.
            </h2>
            <p className={s.measure}>
              Three tube lengths, three tips. The fitting is seventy-five
              minutes. You leave with the pair, and you come back as often as
              you need in the first sixty days, which is when the real
              adjustments happen. If it does not sit, we change the tube. If the
              canal will not hold a dome, we take an impression and make a
              mould.
            </p>
            <EarFit />
          </div>
        </section>

        <section className={s.section} id="facts" aria-labelledby="facts-title">
          <div className={s.wrap}>
            <p className={s.kicker}>05 — The facts</p>
            <h2 id="facts-title" className={s.sectionTitle}>
              Battery, price, a test. Then the clinic.
            </h2>

            <h3 className={s.subhead}>Battery</h3>
            <div className={s.factsSplit}>
              <p className={s.measure}>
                A sealed lithium cell in the body. About seventeen hours if you
                use it as a hearing aid and also for a telephone; about
                twenty-two if you use it only as an aid. The case is a small
                tin, the size of a cigarette case, not a gadget. It charges the
                pair overnight, three hours to full, and holds three further
                charges if you are away. After about four years the cell is
                tired; we replace the body and keep your moulds.
              </p>
              <figure className={s.caseFig}>
                <Case />
              </figure>
            </div>

            <h3 className={s.subhead} id="price">
              Price, which is high
            </h3>
            <p className={s.measure}>
              £{PAIR_PRICE.toLocaleString("en-GB")} the pair, any finish. £
              {SINGLE_PRICE.toLocaleString("en-GB")} for one ear, if only one
              needs it. That is a private-clinic price, and it is meant to be
              read as one. It includes the fitting, sixty days of adjustments,
              three years of repair, and the fourth-year body at the cost of
              the cell and the machining.
            </p>
            <p className={s.measure}>
              Twelve months, no interest: £{FINANCE_12} a month the pair.
              Twenty-four months at {FINANCE_APR} APR: £{FINANCE_24} a month,
              £{FINANCE_24_TOTAL.toLocaleString("en-GB")} total. These figures
              were written for this page; a real lender would quote its own.
            </p>
            <p className={s.measure}>
              If you are entitled to NHS hearing aids, you should get them.
              This is a different object at a different price, not a substitute
              for that entitlement, and we will not tell you otherwise.
            </p>

            <h3 className={s.subhead} id="test">
              A hearing test is required
            </h3>
            <p className={s.measure}>
              We will not sell the One without an audiogram dated within twelve
              months. That is a medical device rule, and it is also a courtesy:
              a beautiful object fitted to the wrong loss is just an expensive
              mistake.
            </p>
            <ul className={s.list}>
              <li>
                A free test at any Kestrel studio, forty minutes, with an
                audiologist. No obligation to buy.
              </li>
              <li>
                Or an audiogram from an NHS clinic, or from an
                HCPC-registered private audiologist, brought with you.
              </li>
              <li>
                A test you took on a telephone or a website is not accepted. It
                is not an audiogram.
              </li>
            </ul>
            <p className={s.measure}>
              Studios:{" "}
              {STUDIOS.map((row, i) => (
                <span key={row.id}>
                  {row.city} ({row.street}; {row.hours})
                  {i < STUDIOS.length - 1 ? "; " : "."}
                </span>
              ))}
            </p>

            <h3 className={s.subhead} id="clinic">
              Clinical, because this is a medical device
            </h3>
            <p className={s.measure}>
              Class IIa, UKCA marked, MHRA registered. The fitting protocol was
              written with Dr Amrita Shah, consultant audiologist, formerly of
              Guy’s and St Thomas’. We will not claim you will hear as you did.
              We will claim the person across the table will be easier to follow
              than they are today.
            </p>
            <p className={s.measure}>
              A figure written for this page, not a trial: in a modelled group
              of 84 adults with mild-to-moderate sensorineural loss,
              speech-in-noise improved by 4.2 dB SNR against unaided listening.
              That is a real kind of difference in this category. It is not a
              miracle, and anyone who tells you otherwise is selling something
              else.
            </p>

            <dl className={s.spec}>
              {SPEC.map(([label, value]) => (
                <div className={s.specRow} key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={s.book} id="book" aria-labelledby="book-title">
          <div className={s.wrap}>
            <p className={s.kicker}>06 — The fitting</p>
            <h2 id="book-title" className={s.sectionTitle}>
              Book a fitting.
            </h2>
            <p className={s.measure}>
              Seventy-five minutes. You will be seen by an audiologist, not a
              salesperson. If you already have an audiogram, bring it. If you
              do not, the test is the first forty minutes. The pair can go home
              with you the same day when a dome will do; a custom mould takes
              ten days.
            </p>
            <Fitting />
          </div>
        </section>

        <footer className={s.colophon}>
          <div className={s.wrap}>
            <p>
              <strong>What this is.</strong> Kestrel does not exist. This is a
              reference implementation built to a written brief. The device,
              the finishes, the prices, the studios, the clinician and the
              study figure were invented for it. The orders of magnitude follow
              real receiver-in-canal aids and real private-clinic pricing in
              Britain; none of it is a measurement, and nothing here can be
              bought. Nothing you type is sent anywhere.
            </p>
            <p>
              <Link
                className={s.back}
                href="/tasks/client-brand-product-launch"
                prefetch={false}
              >
                The brief this was built from
              </Link>
            </p>
          </div>
        </footer>
      </main>

      <div className={s.dock}>
        <a className={s.submit} href="#book">
          Book a fitting
        </a>
      </div>
    </div>
  );
}
