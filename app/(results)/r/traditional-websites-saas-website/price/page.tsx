import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import Quote from "../Quote";
import { BASE, PRICE, STAVES, gbp, quote } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "Price",
  description:
    "£45 a site and £3.80 for each person you paid. Worked examples, what is not included, how to cancel.",
};

const staves = quote(1, STAVES.paid);
const bar = quote(1, 12);
const two = quote(2, 50);

const ROWS: [string, string][] = [
  ["A site", `${gbp(PRICE.site)} a month, each`],
  ["A person paid", `${gbp(PRICE.person)} that month`],
  ["A person not paid", "Free after 30 days"],
  ["First month", "Site fee only, run in parallel"],
  ["Spreadsheet setup", "£0"],
  ["Half-day on a call", gbp(PRICE.setupRemote)],
  ["We come to you", `${gbp(PRICE.setupVisit)}, mainland UK`],
  ["Year paid up front", `${PRICE.annualMonths} months, twelve run`],
  ["SMS after 80", `${PRICE.smsPence}p a message`],
  ["Cancel", "At the end of any calendar month"],
];

export default function Price() {
  return (
    <Page current="price">
      <p className={s.kicker}>Price</p>
      <h1 className={s.lede}>
        {gbp(PRICE.site)} a site. {gbp(PRICE.person)} a person you paid.
      </h1>
      <p className={s.standfirst}>
        That is the price. Opacity is the usual objection in this market, and
        for good reason. There is no percentage of the wage bill, no
        onboarding package, and no “payroll add-on”. If a number is not on
        this page, we do not charge it.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>The list</h2>
      <ul className={s.held}>
        {ROWS.map(([lab, val]) => (
          <li key={lab}>
            <span className={s.lab}>{lab}</span>
            <span className={s.val}>{val}</span>
          </li>
        ))}
      </ul>

      <h2 className={s.h2}>Worked</h2>
      <ul className={s.held}>
        <li>
          <span className={s.lab}>{STAVES.name}, 28 paid</span>
          <span className={s.val}>
            {gbp(PRICE.site)} + {gbp(PRICE.person)} × 28 = {gbp(staves.total)}{" "}
            this month
          </span>
        </li>
        <li>
          <span className={s.lab}>Wine bar, 12 paid</span>
          <span className={s.val}>
            {gbp(PRICE.site)} + {gbp(PRICE.person)} × 12 = {gbp(bar.total)}
          </span>
        </li>
        <li>
          <span className={s.lab}>Two sites, 50 paid</span>
          <span className={s.val}>
            {gbp(PRICE.site * 2)} + {gbp(PRICE.person)} × 50 = {gbp(two.total)}
          </span>
        </li>
      </ul>
      <p className={s.note}>
        {STAVES.name} is modelled. The arithmetic is the product’s. Figures
        are a commercial model for this gallery, not a live offer.
      </p>

      <h2 className={s.h2}>Your numbers</h2>
      <Quote />

      <h2 className={s.h2}>What you still pay elsewhere</h2>
      <div className={s.prose}>
        <p>
          HMRC — we file, you pay. The pension provider — we make the file,
          Nest or otherwise. Your accountant, if you have one, including any
          argument about whether the tronc is a tronc. The till. The
          bookkeeper, if you keep them for the rest of the books. We do not
          take a cut of tips and we do not hold wages.
        </p>
        <p>
          SMS to staff is included for the first {PRICE.smsIncluded} messages
          in a month. After that, {PRICE.smsPence}p. Most rooms do not pass
          eighty. WhatsApp is free and is not us; we will not pretend we
          replaced it.
        </p>
      </div>

      <h2 className={s.h2}>Starting, and stopping</h2>
      <div className={s.prose}>
        <p>
          The first month is the site fee only. We run your week and you run
          yours. If they do not match, you do not start and you do not owe
          the per-person fee. Go-live is a Monday. Never a Friday. Never, if
          we can help it, the week of a bank holiday.
        </p>
        <p>
          You can stop at the end of any calendar month. We give you a CSV of
          the books, a PDF pack of the year, and the last P45s. There is no
          exit fee. There is no “data export in seven days”. You already have
          to keep the paper for three years; we give you the pack so you can.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/move`}>
          How a move works
        </Link>
        <Link className={s.more} href={`${BASE}/write`}>
          Write
        </Link>
      </div>
      <Colophon />
    </Page>
  );
}
