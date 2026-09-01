import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Sheet } from "../Chrome";
import { BASE, FIRM } from "../data";
import s from "../leckie.module.css";

export const metadata: Metadata = {
  title: "Write",
  description:
    "How to write to Leckie. What to include, the address, and when we will answer.",
};

export default function Write() {
  return (
    <Sheet drawing="L-C" title="Correspondence" current="write">
      <p className={s.kicker}>Write</p>
      <h1 className={s.lede}>A letter. What you are trying to measure.</h1>
      <p className={s.standfirst}>
        We answer in a fortnight. If we cannot staff your date we will say
        so, and when we next could. We will not hold a slot against a bid.
      </p>

      <h2 className={s.h2}>What to include</h2>
      <div className={s.prose}>
        <p>
          What you are trying to measure — a car, a model, a rider, a
          student experiment. The size of the thing, the speeds you care
          about, and whether you already have a building. What you can
          spend, as a range. The date you need first air. A name we can
          write back to, and whether the letter may be left on an ordinary
          desk or must go to the classified office.
        </p>
        <p>
          A cycling team or a ski federation does not need a Reynolds
          number. Say what you want to leave with: a number for each
          position, each suit, each helmet. Say whether you want a tunnel
          of your own or whether you thought we ran a hire facility (we do
          not). We will write back in English.
        </p>
        <p>
          A professor with a grant: send the award letter, the laboratory
          drawing, and the turbulence or speed you need. We will not start
          a specification against an application. Two years is the floor.
        </p>
        <p>
          A procurement office: send the programme date, the building
          status, and the name of the engineer who will own the
          specification. The evidence that we deliver is{" "}
          <Link href={`${BASE}/work/l-147`}>L-147</Link> (on the floor) and{" "}
          <Link href={`${BASE}/work/l-128`}>L-128</Link> (handed 2020). The
          method is on the <Link href={`${BASE}/practice`}>practice</Link>{" "}
          sheet.
        </p>
      </div>

      <h2 className={s.h2}>The works</h2>
      <address className={s.address}>
        {FIRM.legal}
        <br />
        {FIRM.address.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
        <a href={`tel:+44${FIRM.phone.replace(/\s/g, "").slice(1)}`}>{FIRM.phone}</a>
        <br />
        <a href={`mailto:${FIRM.mail}`}>{FIRM.mail}</a>
      </address>
      <p className={s.note}>
        Mail is read in the morning. The telephone is answered. There is no
        form, and no chatbot. Letters about classified work should be
        marked for the north office and will not be opened in the works.
      </p>
      <Colophon />
    </Sheet>
  );
}
