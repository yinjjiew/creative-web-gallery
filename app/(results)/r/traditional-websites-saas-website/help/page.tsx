import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import { BASE, FIRM } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Telephone Tuesday to Sunday, 08:00–22:00. Saturday at four is when the evening bartender calls in sick. A named person for the first ninety days.",
};

export default function Help() {
  return (
    <Page current="help">
      <p className={s.kicker}>Help</p>
      <h1 className={s.lede}>Saturday at four is the point of the telephone.</h1>
      <p className={s.standfirst}>
        The evening bartender calls in sick. You need the rota changed, the
        overtime recomputed, and the sixteen-year-old not put on the close
        because you are short. A ticket that “escalates” on Monday is not
        support. There are eleven of us. You get a named person for the
        first ninety days.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>When we answer</h2>
      <ul className={s.held}>
        <li>
          <span className={s.lab}>Days</span>
          <span className={s.val}>{FIRM.hours}. Monday we are off.</span>
        </li>
        <li>
          <span className={s.lab}>Telephone</span>
          <span className={s.val}>
            <a className={s.inline} href={FIRM.phoneHref}>
              {FIRM.phone}
            </a>
            <span aria-hidden="true"> · </span>
            answered by a person
          </span>
        </li>
        <li>
          <span className={s.lab}>Mail</span>
          <span className={s.val}>
            <a className={s.inline} href={`mailto:${FIRM.mail}`}>
              {FIRM.mail}
            </a>
            <span aria-hidden="true"> · </span>
            read in the morning
          </span>
        </li>
        <li>
          <span className={s.lab}>First 90 days</span>
          <span className={s.val}>A named person, theirs and yours.</span>
        </li>
      </ul>
      <p className={s.note}>
        The number and the mailbox are modelled, as is the firm. The hours
        are the product’s: we do not sell a weekday-only desk to a Saturday
        trade.
      </p>

      <h2 className={s.h2}>What we will do at 16:05</h2>
      <div className={s.prose}>
        <p>
          Change the rota. Recalculate the night. Refuse the illegal shift.
          Tell you who is already on a double. If you confirm, the walk-in
          copy and the pay copy update together. We will not ask you to
          “raise a request in the portal” while the room is walking in.
        </p>
        <p>
          After 22:00 we are not here. The late swap at eleven is yours, or
          it waits until eight. We would rather say that than staff a night
          desk with someone who has never run a week.
        </p>
      </div>

      <h2 className={s.h2}>What we will not do</h2>
      <div className={s.prose}>
        <p>
          We will not represent you at a tribunal. We will not tell you
          whether your tronc is a tronc for National Insurance. We will not
          write your tip policy — we will typeset the one you already owe
          the Tips Act, and we will tell you if it has a hole (a role with
          no share, a cash tin that never enters the pool). We will not
          register you as an employer; we send the forms. We will not pay
          HMRC for you.
        </p>
        <p>
          We will not “escalate your ticket”. If the named person is on the
          floor of their own Saturday — two of us still have rooms — you get
          the next person, by name, and a note of what was already tried.
        </p>
      </div>

      <h2 className={s.h2}>Who we are</h2>
      <div className={s.prose}>
        <p>
          Eleven people, written as Sheffield. The person who answers has
          closed a week. That is the hiring rule. We are not a support
          tier sitting in front of an engineering team in another country.
          If we cannot staff a Saturday we will say so before you start, and
          we will not take the room.
        </p>
      </div>
      <Link className={s.more} href={`${BASE}/write`}>
        Write
      </Link>
      <Colophon />
    </Page>
  );
}
