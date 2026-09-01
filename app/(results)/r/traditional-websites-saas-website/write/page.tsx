import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import { BASE, FIRM } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "Write",
  description:
    "How to write to Rota. What to send, the telephone, and when we answer.",
};

export default function Write() {
  return (
    <Page current="write">
      <p className={s.kicker}>Write</p>
      <h1 className={s.lede}>Last month’s spreadsheet, and when you next pay.</h1>
      <p className={s.standfirst}>
        There is no form and no chatbot. Mail is read in the morning. The
        telephone is answered Tuesday to Sunday. If we cannot start before
        your next payday we will say so, and when we could.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>What to include</h2>
      <div className={s.prose}>
        <p>
          How many you paid last month, how many sites, and when you next
          pay. Whether anyone is sixteen. Whether you run a tip pool, and
          whether you already have the written policy. What you use now —
          a spreadsheet, a bureau, a till module. A name we can write back
          to, and a number that is answered during service.
        </p>
        <p>
          Attach last month if you have it. A photograph of the wage book
          is enough to start. Do not send NI numbers in an open copy if you
          are uneasy; say how many rows you have and we will give you a
          way to send them that is not a thread.
        </p>
        <p>
          If you are leaving a till, say which one and whether they will
          give you a CSV. If the answer is no, say that. We have started
          from a month of printed slips.
        </p>
      </div>

      <h2 className={s.h2}>The office</h2>
      <address className={s.address}>
        {FIRM.legal}
        <br />
        Written as {FIRM.place}
        <br />
        <a href={FIRM.phoneHref}>{FIRM.phone}</a>
        <br />
        <a href={`mailto:${FIRM.mail}`}>{FIRM.mail}</a>
        <br />
        {FIRM.hours}
      </address>
      <p className={s.note}>
        The address, the number and the mailbox are modelled. There is no
        live inbox behind {FIRM.mail}. Use the telephone line as the shape
        of the thing, not as a real desk.
      </p>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/price`}>
          Price
        </Link>
        <Link className={s.more} href={`${BASE}/move`}>
          Moving
        </Link>
      </div>
      <Colophon />
    </Page>
  );
}
