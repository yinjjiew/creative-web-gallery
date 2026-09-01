import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import { BASE, PRICE, gbp } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "Moving",
  description:
    "How you leave Sunday-night Excel. What we need, the parallel week, and why go-live is a Monday.",
};

const NEED = [
  ["People", "Names, NI numbers, start dates, student loan, tax code if you have it."],
  ["Pay", "Rates, tronc shares, any salary, any salary-sacrifice, how you pay them."],
  ["Time", "Holiday remaining, TOIL if you use it, any overtime already owed."],
  ["The scheme", "PAYE reference, Accounts Office reference, pension provider and sign-in."],
  ["The policy", "The written tip policy the Tips Act already requires. If you have not got one, that is the first hour."],
  ["Last month", "A spreadsheet, a bureau pack, or a photograph of the wage book."],
];

export default function Move() {
  return (
    <Page current="move">
      <p className={s.kicker}>Moving</p>
      <h1 className={s.lede}>We do not need to “integrate”. We need last month.</h1>
      <p className={s.standfirst}>
        Most rooms come from a spreadsheet, a bureau, or a till module they
        want to leave. We do not migrate a platform. We take what you already
        have, run a week in parallel, and go live on a Monday.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>What we need from you</h2>
      <ul className={s.held}>
        {NEED.map(([lab, val]) => (
          <li key={lab}>
            <span className={s.lab}>{lab}</span>
            <span className={s.val}>{val}</span>
          </li>
        ))}
      </ul>
      <p className={s.note}>
        If a field is missing we will say so. We will not invent a tax code
        or an NI number to make the file look complete.
      </p>

      <h2 className={s.h2}>The fortnight</h2>
      <ol className={s.steps}>
        <li>
          <h3>You send the pack</h3>
          <p>
            Spreadsheet, bureau PDF, or photographs. We will start from a
            wage book. Setup is £0 if the pack is usable, {gbp(PRICE.setupRemote)}{" "}
            for a half-day on a call, {gbp(PRICE.setupVisit)} if we come to
            you on the mainland. We do not fly for a setup.
          </p>
        </li>
        <li>
          <h3>We build the books</h3>
          <p>
            Usually three to five working days for one site under forty
            people. You get a list of what we could not read — a missing NI
            number, a rate that changed in March and was never written down.
            You fill the gaps. We do not guess.
          </p>
        </li>
        <li>
          <h3>A parallel week</h3>
          <p>
            You still do Sunday your way. We produce the same week. You sit
            with both. If they do not match, we find out why before anyone
            is paid from ours. The first month is the site fee only; the
            per-person fee starts when you go live.
          </p>
        </li>
        <li>
          <h3>Monday</h3>
          <p>
            Go-live is a Monday. Never a Friday — you cannot find out at
            four o’clock that the file is wrong. Never, if we can help it,
            the week of a bank holiday, when half the room is on a different
            rate and the other half is off. The old method stays available
            for two more weeks. Then you stop.
          </p>
        </li>
      </ol>

      <h2 className={s.h2}>What happens to last year</h2>
      <div className={s.prose}>
        <p>
          We do not rewrite history in the old system. You keep the paper
          wage book — HMRC already wants it for three years. We take a copy
          of the year-to-date figures so this year’s P60 is complete, and we
          give you a PDF pack each month from the first live week. Leavers
          from before we started stay in your old pack; we will produce a
          P45 only for people who leave after go-live, unless you ask and
          the numbers are there.
        </p>
        <p>
          If you are leaving a till’s payroll, we need a CSV or a printout.
          We do not need their permission, and we do not need an API key.
          If they will not export, a month of payslips and the last FPS
          submission is enough to start; the gaps go on the list.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/help`}>
          Who answers
        </Link>
        <Link className={s.more} href={`${BASE}/write`}>
          Write
        </Link>
      </div>
      <Colophon />
    </Page>
  );
}
