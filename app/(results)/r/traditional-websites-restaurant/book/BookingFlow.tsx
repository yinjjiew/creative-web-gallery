"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { fontClass } from "../fonts";
import s from "../weighbridge.module.css";
import {
  CONFIRMATIONS,
  DIET_OPTIONS,
  NIGHTS,
  RELEASE_LABEL,
  RELEASE_OPENED,
  STEPS,
} from "./data";
import f from "./booking.module.css";

/**
 * The booking form.
 *
 * It collects what the kitchen actually needs — how many, which night, what
 * each person cannot eat, and a card against the seat — and it makes the guest
 * confirm the six things that go wrong when nobody says them out loud.
 *
 * There is no backend and there is not pretending to be one. State lives in
 * this component and in sessionStorage, so a reload does not lose twenty
 * minutes of typing, and the last step says plainly that nothing was booked.
 */

type Guest = { name: string; flags: string[]; note: string };

type State = {
  party: number;
  lead: { name: string; email: string; phone: string };
  night: string;
  diets: "" | "yes" | "no";
  guests: Guest[];
  confirmed: string[];
  card: { name: string; number: string; expiry: string; cvc: string };
};

const STORAGE_KEY = "weighbridge.booking.demo";

const emptyGuest = (): Guest => ({ name: "", flags: [], note: "" });

const initialState: State = {
  party: 0,
  lead: { name: "", email: "", phone: "" },
  night: "",
  diets: "",
  guests: [emptyGuest(), emptyGuest()],
  confirmed: [],
  card: { name: "", number: "", expiry: "", cvc: "" },
};

/**
 * `field` identifies the problem and is stable while it lasts, so a corrected
 * error can be retired and an uncorrected one re-worded. `anchor` is where the
 * summary link should send the keyboard, which is not always the same element.
 */
type Problem = { field: string; message: string; anchor?: string };

const COUNT = ["no", "one", "two", "three", "four", "five", "six"];

/** Numbers under ten are words, and a sentence does not open in lower case. */
const count = (n: number, capital = false) => {
  const word = COUNT[n] ?? String(n);
  return capital ? word[0].toUpperCase() + word.slice(1) : word;
};

const digits = (value: string) => value.replace(/\D/g, "");

const groupCard = (value: string) =>
  digits(value)
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const groupExpiry = (value: string) => {
  const found = digits(value).slice(0, 4);
  return found.length > 2 ? `${found.slice(0, 2)}/${found.slice(2)}` : found;
};

function validate(step: number, state: State): Problem[] {
  const problems: Problem[] = [];

  if (step === 0) {
    if (!state.party) {
      problems.push({
        field: "party",
        anchor: "party-2",
        message: "Say how many of you there are.",
      });
    }
    if (!state.lead.name.trim()) {
      problems.push({
        field: "lead-name",
        message: "We need a name to put the booking under.",
      });
    }
    const email = state.lead.email.trim();
    if (!email) {
      problems.push({
        field: "lead-email",
        message: "We need an email address; the confirmation goes there.",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      problems.push({
        field: "lead-email",
        message: "That does not look like an email address. Check it over.",
      });
    }
    if (digits(state.lead.phone).length < 9) {
      problems.push({
        field: "lead-phone",
        message:
          "We need a telephone number we can actually reach on the day.",
      });
    }
  }

  if (step === 1 && !state.night) {
    const open = NIGHTS.filter((night) => night.seats >= state.party);
    problems.push({
      field: "night",
      anchor: open[0] ? `night-${open[0].id}` : undefined,
      message: `Choose a date. ${
        open.length === 1 ? "One is" : `${count(open.length, true)} are`
      } open to a table of ${count(state.party)}.`,
    });
  }

  if (step === 2) {
    if (!state.diets) {
      problems.push({
        field: "diets",
        anchor: "diets-no",
        message:
          "Answer this one either way. A plain no is as useful to the kitchen as a list.",
      });
    } else if (state.diets === "yes") {
      const said = state.guests
        .slice(0, state.party)
        .some((guest) => guest.flags.length > 0 || guest.note.trim() !== "");
      if (!said) {
        problems.push({
          field: "guest-0-note",
          message:
            "You have said somebody has something. Tell us what it is, or change the answer to no.",
        });
      }
    }
  }

  if (step === 3) {
    const next = CONFIRMATIONS.find(
      (item) => !state.confirmed.includes(item.id)
    );
    const left = CONFIRMATIONS.length - state.confirmed.length;
    if (next) {
      problems.push({
        field: "confirmations",
        anchor: `confirm-${next.id}`,
        message: `${
          left === 1
            ? "One confirmation is"
            : `${count(left, true)} confirmations are`
        } still unticked. This is the one place we cannot take it on trust.`,
      });
    }
  }

  if (step === 4) {
    if (!state.card.name.trim()) {
      problems.push({ field: "card-name", message: "Whose card is it?" });
    }
    if (digits(state.card.number).length !== 16) {
      problems.push({
        field: "card-number",
        message: "Sixteen digits. Not a real card, please.",
      });
    }
    const expiry = state.card.expiry.trim();
    const match = /^(\d{2})\s*\/?\s*(\d{2})$/.exec(expiry);
    if (!match) {
      problems.push({
        field: "card-expiry",
        message: "Expiry as MM/YY — 04/29, for instance.",
      });
    } else {
      const month = Number(match[1]);
      const year = 2000 + Number(match[2]);
      const now = new Date();
      if (month < 1 || month > 12) {
        problems.push({
          field: "card-expiry",
          message: "There is no month thirteen. MM/YY.",
        });
      } else if (
        year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1)
      ) {
        problems.push({
          field: "card-expiry",
          message: "That card expired. Check the date on the front of it.",
        });
      }
    }
    const cvc = digits(state.card.cvc);
    if (cvc.length < 3 || cvc.length > 4) {
      problems.push({
        field: "card-cvc",
        message: "Three digits on the back, four on an Amex.",
      });
    }
  }

  return problems;
}

export function BookingFlow() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(initialState);
  const [done, setDone] = useState(false);
  /**
   * Which problems have been raised out loud. The messages themselves are
   * derived from the current answers on every render, so an error that has been
   * put right disappears on its own and one that is still wrong stays accurate.
   * Nothing new is raised until the guest presses Continue again: being
   * corrected while you type is worse than being told once.
   */
  const [raised, setRaised] = useState<string[]>([]);
  const problems: Problem[] = raised.length
    ? validate(step, state).filter((problem) => raised.includes(problem.field))
    : [];

  const [restored, setRestored] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  /** What to focus after the next deliberate move, and a tick to trigger it. */
  const focusWanted = useRef<"heading" | "errors" | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  // Twenty minutes of typing should survive a stray reload. It never leaves the
  // browser. Writing is gated on `restored` rather than on a ref, so that a
  // remount cannot save the empty form over the saved one before the restored
  // state has been committed.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { answers = {}, step: at = 0 } = JSON.parse(raw) as {
          answers?: Partial<State>;
          step?: number;
        };
        // Session storage cannot be read while rendering without breaking
        // hydration, so restoring it on mount is the only correct place.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({
          ...initialState,
          ...answers,
          lead: { ...initialState.lead, ...answers.lead },
          card: { ...initialState.card, ...answers.card },
          guests: answers.guests?.length ? answers.guests : initialState.guests,
          confirmed: answers.confirmed ?? [],
        });
        setStep(Math.min(Math.max(0, Math.floor(at)), STEPS.length - 1));
      }
    } catch {
      /* a blocked or corrupt store is not worth mentioning to the guest */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        // The confirmation is deliberately not restored: a reload should not
        // re-present a finished booking, only the answers and the place.
        JSON.stringify({ answers: state, step })
      );
    } catch {
      /* private browsing */
    }
  }, [restored, state, step]);

  useEffect(() => {
    if (focusWanted.current === "errors") errorRef.current?.focus();
    else if (focusWanted.current === "heading") headingRef.current?.focus();
    focusWanted.current = null;
  }, [focusTick]);

  const errorFor = (field: string) =>
    problems.find((problem) => problem.field === field)?.message;

  const update = useCallback((patch: Partial<State>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const setParty = (party: number) => {
    setState((current) => {
      const guests = [...current.guests];
      while (guests.length < party) guests.push(emptyGuest());
      // A shrinking party keeps its notes in case it grows again.
      const night = NIGHTS.find((item) => item.id === current.night);
      return {
        ...current,
        party,
        guests,
        night: night && night.seats < party ? "" : current.night,
      };
    });
  };

  const setGuest = (index: number, patch: Partial<Guest>) => {
    setState((current) => {
      const guests = current.guests.map((guest, i) =>
        i === index ? { ...guest, ...patch } : guest
      );
      return { ...current, guests };
    });
  };

  const go = (next: number) => {
    focusWanted.current = "heading";
    setFocusTick((tick) => tick + 1);
    setRaised([]);
    setStep(next);
  };

  const forward = () => {
    const found = validate(step, state);
    focusWanted.current = found.length ? "errors" : "heading";
    setFocusTick((tick) => tick + 1);
    setRaised(found.map((problem) => problem.field));
    if (found.length) return;
    if (step === STEPS.length - 1) setDone(true);
    else setStep(step + 1);
  };

  const restart = () => {
    focusWanted.current = "heading";
    setFocusTick((tick) => tick + 1);
    setRaised([]);
    setState(initialState);
    setStep(0);
    setDone(false);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
  };

  const chosen = NIGHTS.find((night) => night.id === state.night);
  const available = NIGHTS.filter((night) => night.seats > 0);
  const openToParty = available.filter((night) => night.seats >= state.party);

  if (done) {
    return (
      <Sheet>
        <h2 className={f.doneHeading} tabIndex={-1} ref={headingRef}>
          Nothing has been booked.
        </h2>
        <div className={f.doneBody}>
          <p>
            There is no Weighbridge and there is no table on{" "}
            {chosen?.label ?? "that night"}. This is a reference implementation
            of a restaurant booking form, not a restaurant. No card was taken,
            no email will arrive, and nothing you typed left this browser — it
            is in this tab’s memory and it goes when the tab does.
          </p>
          <p>
            What follows is everything the form collected, which is what a
            kitchen of this kind genuinely needs before the morning of your
            dinner.
          </p>
        </div>

        <dl className={f.summary}>
          <Row term="Date" value={chosen?.label ?? "—"} />
          <Row term="Sitting" value="19:30, doors 19:15" />
          <Row term="Party" value={`${state.party}`} />
          <Row term="Booked under" value={state.lead.name} />
          <Row term="Email" value={state.lead.email} />
          <Row term="Telephone" value={state.lead.phone} />
          <Row
            term="Total"
            value={`£${state.party * 95}.00 — £95 × ${state.party}`}
          />
          <Row
            term="Card held"
            value={`•••• ${digits(state.card.number).slice(-4)}, ${
              state.card.expiry
            }`}
          />
          <Row
            term="Confirmations"
            value={`${state.confirmed.length} of ${CONFIRMATIONS.length}`}
          />
        </dl>

        <h3 className={f.summaryHeading}>For the kitchen</h3>
        {state.diets === "no" ? (
          <p className={f.doneBody}>
            Nothing to cook around. Stated at booking, which is the answer the
            kitchen wants recorded rather than assumed.
          </p>
        ) : (
          <dl className={f.summary}>
            {state.guests.slice(0, state.party).map((guest, index) => {
              const detail = [
                ...guest.flags.map(
                  (flag) =>
                    DIET_OPTIONS.find((option) => option.id === flag)?.label ??
                    flag
                ),
                guest.note.trim(),
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Row
                  key={index}
                  term={guest.name.trim() || `Seat ${index + 1}`}
                  value={detail || "Nothing"}
                />
              );
            })}
          </dl>
        )}

        <div className={f.doneActions}>
          <button type="button" className={f.secondary} onClick={restart}>
            Start again
          </button>
          <button
            type="button"
            className={f.secondary}
            onClick={() => window.print()}
          >
            Print this
          </button>
          <Link className={f.backLink} href="/r/traditional-websites-restaurant">
            Back to the site
          </Link>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <nav className={f.stepper} aria-label="Booking steps">
        <ol>
          {STEPS.map((label, index) => {
            const current = index === step;
            const passed = index < step;
            return (
              <li
                key={label}
                className={
                  current ? f.stepCurrent : passed ? f.stepPassed : f.stepAhead
                }
              >
                {passed ? (
                  <button type="button" onClick={() => go(index)}>
                    <span className={f.stepNumber}>{index + 1}</span>
                    {label}
                  </button>
                ) : (
                  <span aria-current={current ? "step" : undefined}>
                    <span className={f.stepNumber}>{index + 1}</span>
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <form
        className={f.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          forward();
        }}
      >
        {problems.length > 0 && (
          <div
            className={f.errorSummary}
            role="alert"
            tabIndex={-1}
            ref={errorRef}
          >
            <h2>
              {problems.length === 1
                ? "One thing to put right"
                : `${problems.length} things to put right`}
            </h2>
            <ul>
              {problems.map((problem) => (
                <li key={problem.field}>
                  <a href={`#${problem.anchor ?? problem.field}`}>{problem.message}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <>
            <h2 className={f.stepHeading} tabIndex={-1} ref={headingRef}>
              How many of you?
            </h2>
            <p className={f.stepNote}>
              Eighteen seats in the room. Six is the largest table we can put
              together; if you are more than six, ring instead — occasionally two
              bookings can be joined and often they cannot.
            </p>

            <fieldset className={f.fieldset}>
              <legend>Party size</legend>
              <FieldError id="party" message={errorFor("party")} />
              <div className={f.chips}>
                {[1, 2, 3, 4, 5, 6].map((size) => (
                  <label
                    key={size}
                    className={
                      state.party === size ? f.chipOn : f.chip
                    }
                  >
                    <input
                      type="radio"
                      name="party"
                      id={`party-${size}`}
                      value={size}
                      checked={state.party === size}
                      onChange={() => setParty(size)}
                      aria-describedby={
                        errorFor("party") ? "party-error" : undefined
                      }
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={f.fieldset}>
              <legend>Who the booking is under</legend>
              <Text
                id="lead-name"
                label="Name"
                value={state.lead.name}
                autoComplete="name"
                error={errorFor("lead-name")}
                onChange={(value) =>
                  update({ lead: { ...state.lead, name: value } })
                }
              />
              <Text
                id="lead-email"
                label="Email"
                type="email"
                value={state.lead.email}
                autoComplete="email"
                hint="The confirmation and the reminder go here."
                error={errorFor("lead-email")}
                onChange={(value) =>
                  update({ lead: { ...state.lead, email: value } })
                }
              />
              <Text
                id="lead-phone"
                label="Telephone"
                type="tel"
                value={state.lead.phone}
                autoComplete="tel"
                hint="Used if the delivery fails, or if it is 19:44 and you are not here."
                error={errorFor("lead-phone")}
                onChange={(value) =>
                  update({ lead: { ...state.lead, phone: value } })
                }
              />
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className={f.stepHeading} tabIndex={-1} ref={headingRef}>
              Which night?
            </h2>
            <p className={f.stepNote}>
              {RELEASE_LABEL} went up at {RELEASE_OPENED}. The times in the
              right-hand column are when each date filled.{" "}
              {available.length === 0
                ? "Nothing is left."
                : `${available.length} dates still have seats, and ${
                    openToParty.length
                  } of those can take a table of ${state.party}.`}
            </p>

            <fieldset className={f.fieldset} id="night">
              <legend>Dates released for {RELEASE_LABEL}</legend>
              <FieldError id="night" message={errorFor("night")} />
              <ul className={f.nights}>
                {NIGHTS.map((night) => {
                  const short = night.seats > 0 && night.seats < state.party;
                  const gone = night.seats === 0;
                  const disabled = gone || short;
                  return (
                    <li
                      key={night.id}
                      className={disabled ? f.nightOff : f.night}
                    >
                      <label>
                        <input
                          type="radio"
                          name="night"
                          id={`night-${night.id}`}
                          value={night.id}
                          disabled={disabled}
                          checked={state.night === night.id}
                          onChange={() => update({ night: night.id })}
                        />
                        <span className={f.nightLabel}>{night.label}</span>
                        <span className={f.nightState}>
                          {gone
                            ? `gone ${night.went}`
                            : short
                              ? `${night.seats} seats — too few`
                              : `${night.seats} seats`}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <p className={f.stepNote}>
              Cancellations go back on this page during the month. There is no
              waiting list to join, which is not obstinacy — administering one
              would take longer than the cooking.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={f.stepHeading} tabIndex={-1} ref={headingRef}>
              Anything we have to cook around?
            </h2>
            <p className={f.stepNote}>
              This is the only chance. Everything is bought and portioned by
              eleven on the morning of your dinner, so an allergy mentioned at
              the table is an allergy we cannot do anything about. Told now, it
              is straightforward, and it means the whole dinner rather than a
              plate with something missing from it.
            </p>

            <fieldset className={f.fieldset}>
              <legend>
                Does anyone in the party have an allergy or a dietary
                requirement?
              </legend>
              <FieldError id="diets" message={errorFor("diets")} />
              <div className={f.chips}>
                {(["no", "yes"] as const).map((value) => (
                  <label
                    key={value}
                    className={state.diets === value ? f.chipOn : f.chip}
                  >
                    <input
                      type="radio"
                      name="diets"
                      id={`diets-${value}`}
                      checked={state.diets === value}
                      onChange={() => update({ diets: value })}
                    />
                    <span>{value === "no" ? "No, nobody" : "Yes"}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {state.diets === "yes" && (
              <>
                {state.guests.slice(0, state.party).map((guest, index) => (
                  <fieldset className={f.fieldset} key={index}>
                    <legend>
                      Seat {index + 1}
                      {index === 0 ? " — you" : ""}
                    </legend>
                    <Text
                      id={`guest-${index}-name`}
                      label="Name"
                      optional
                      value={guest.name}
                      onChange={(value) => setGuest(index, { name: value })}
                    />
                    <div className={f.checkGroup} role="group" aria-label={`Common requirements, seat ${index + 1}`}>
                      {DIET_OPTIONS.map((option) => {
                        const on = guest.flags.includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className={on ? f.chipOn : f.chip}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                setGuest(index, {
                                  flags: on
                                    ? guest.flags.filter(
                                        (flag) => flag !== option.id
                                      )
                                    : [...guest.flags, option.id],
                                })
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {guest.flags.includes("no-meat") && (
                      <p className={f.inlineNote}>
                        Noted. The whole nine or ten courses without meat, not
                        the same dinner with gaps in it. It has to be arranged
                        before eleven on the day, which this form does.
                      </p>
                    )}
                    <Text
                      id={`guest-${index}-note`}
                      label="Anything else the kitchen must know"
                      optional
                      textarea
                      value={guest.note}
                      hint="Allergies and requirements, not dislikes — we cannot cook around a dislike and would rather not be left guessing which is which."
                      error={
                        index === 0 ? errorFor("guest-0-note") : undefined
                      }
                      onChange={(value) => setGuest(index, { note: value })}
                    />
                  </fieldset>
                ))}
                <p className={f.stepNote}>
                  If there is something here we cannot work around, we will say
                  so within a day and refund the whole booking. It happens two
                  or three times a year and nobody minds.
                </p>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className={f.stepHeading} tabIndex={-1} ref={headingRef}>
              Six things, and then the card
            </h2>
            <p className={f.stepNote}>
              This is the only piece of friction on the form and it is
              deliberate. Almost every unhappy evening here began with one of
              these six not being known. Reading them costs a minute now.
            </p>
            <fieldset className={f.fieldset}>
              <legend>Please confirm each of these</legend>
              <FieldError
                id="confirmations"
                message={errorFor("confirmations")}
              />
              <ul className={f.confirmations}>
                {CONFIRMATIONS.map((item) => {
                  const on = state.confirmed.includes(item.id);
                  return (
                    <li key={item.id}>
                      <label>
                        <input
                          type="checkbox"
                          id={`confirm-${item.id}`}
                          checked={on}
                          onChange={() =>
                            update({
                              confirmed: on
                                ? state.confirmed.filter(
                                    (id) => id !== item.id
                                  )
                                : [...state.confirmed, item.id],
                            })
                          }
                        />
                        <span className={f.confirmFigure}>{item.figure}</span>
                        <span className={f.confirmText}>{item.text}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <details className={f.details}>
              <summary>If one of those is wrong for you</summary>
              <p>
                Then do not book, and there is no hard feeling in it. A term
                that is a problem in a web form at eleven in the morning is a
                worse problem at nine at night with the sixth course coming out.
                It costs you nothing to stop here and it saves you ninety-five
                pounds and an evening you did not want.
              </p>
            </details>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className={f.stepHeading} tabIndex={-1} ref={headingRef}>
              A card against the seat
            </h2>
            <div className={f.warning}>
              <p>
                <strong>This is a demonstration.</strong> Nothing is transmitted
                anywhere, nothing is stored beyond this browser tab, and no
                payment system exists behind this form. Please do not type a real
                card number — any sixteen digits will do.
              </p>
            </div>
            <p className={f.stepNote}>
              At the restaurant this would hold {state.party} seat
              {state.party === 1 ? "" : "s"} for {chosen?.label ?? "the night"}.
              Nothing would be charged now. Nothing would be charged at all
              unless the booking were cancelled inside seventy-two hours, when it
              would be £95 for each seat we could not fill — £
              {state.party * 95} in your case.
            </p>
            <fieldset className={f.fieldset}>
              <legend>Card</legend>
              <Text
                id="card-name"
                label="Name on the card"
                value={state.card.name}
                autoComplete="off"
                error={errorFor("card-name")}
                onChange={(value) =>
                  update({ card: { ...state.card, name: value } })
                }
              />
              <Text
                id="card-number"
                label="Card number"
                value={state.card.number}
                inputMode="numeric"
                autoComplete="off"
                tabular
                hint="Sixteen digits. Do not use a real one."
                error={errorFor("card-number")}
                onChange={(value) =>
                  update({ card: { ...state.card, number: groupCard(value) } })
                }
              />
              <div className={f.pair}>
                <Text
                  id="card-expiry"
                  label="Expiry"
                  value={state.card.expiry}
                  inputMode="numeric"
                  autoComplete="off"
                  tabular
                  hint="MM/YY"
                  error={errorFor("card-expiry")}
                  onChange={(value) =>
                    update({
                      card: { ...state.card, expiry: groupExpiry(value) },
                    })
                  }
                />
                <Text
                  id="card-cvc"
                  label="Security code"
                  value={state.card.cvc}
                  inputMode="numeric"
                  autoComplete="off"
                  tabular
                  hint="3 or 4 digits"
                  error={errorFor("card-cvc")}
                  onChange={(value) =>
                    update({ card: { ...state.card, cvc: value } })
                  }
                />
              </div>
            </fieldset>
          </>
        )}

        <div className={f.actions}>
          <button type="submit" className={f.primary}>
            {step === STEPS.length - 1 ? "Finish" : "Continue"}
          </button>
          {step > 0 ? (
            <button
              type="button"
              className={f.secondary}
              onClick={() => go(step - 1)}
            >
              Back
            </button>
          ) : (
            <Link
              className={f.backLink}
              href="/r/traditional-websites-restaurant"
            >
              Back to the site
            </Link>
          )}
        </div>
      </form>
    </Sheet>
  );
}

/* --------------------------------------------------------------- furniture */

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontClass} ${s.root}`}>
      <a className={s.skip} href="#main">
        Skip to the form
      </a>
      <div className={`${s.page} ${f.page}`}>
        <header className={f.head}>
          <p className={f.headWhere}>
            <Link href="/r/traditional-websites-restaurant">Weighbridge</Link>
            <span aria-hidden="true"> · </span>
            Fen Road, Marchbourne
          </p>
          <h1 className={f.headTitle}>Book a seat</h1>
          <p className={f.headDemo}>
            A demonstration booking form. No table can be reserved here.
          </p>
          <div className={s.scale} aria-hidden="true" />
        </header>
        <main id="main">{children}</main>
        <footer className={f.foot}>
          <p>
            Weighbridge is not a real restaurant. This form is part of a
            reference implementation.{" "}
            <Link href="/tasks/traditional-websites-restaurant" prefetch={false}>
              Read the brief it was built from
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className={s.ticketRow}>
      <dt>{term}</dt>
      <dd>
        <span>{value || "—"}</span>
      </dd>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className={f.fieldError} id={`${id}-error`}>
      {message}
    </p>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
  type = "text",
  hint,
  error,
  optional,
  textarea,
  tabular,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  textarea?: boolean;
  tabular?: boolean;
  inputMode?: "numeric" | "text" | "tel" | "email";
  autoComplete?: string;
}) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const shared = {
    id,
    value,
    "aria-describedby": describedBy,
    "aria-invalid": error ? (true as const) : undefined,
    className: `${f.input} ${tabular ? f.inputTabular : ""} ${
      error ? f.inputBad : ""
    }`,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value),
  };

  return (
    <div className={f.field}>
      <label htmlFor={id}>
        {label}
        {optional && <span className={f.optional}> (optional)</span>}
      </label>
      {hint && (
        <p className={f.hint} id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className={f.fieldError} id={`${id}-error`}>
          {error}
        </p>
      )}
      {textarea ? (
        <textarea {...shared} rows={3} />
      ) : (
        <input
          {...shared}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
        />
      )}
    </div>
  );
}
