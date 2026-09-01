import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import { BASE } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "The work",
  description:
    "What Rota actually does: the late swap, the tip pool, young workers, people who want a cheque, split shifts, leavers, holiday, and RTI.",
};

const JOBS = [
  {
    title: "A swap three hours before service",
    body: "Someone texts at four. You change the rota. We recompute hours, breaks, overtime, and the young-worker check before you print. The copy taped to the walk-in and the copy that pays people are the same document. If they diverge, the pay copy wins, and the printed one is marked superseded. We will not leave you paying the paper.",
  },
  {
    title: "The tip pool, from the policy you wrote",
    body: "The Employment (Allocation of Tips) Act 2023 requires a written policy and a record you can produce. We do not invent a policy, and we do not advise on whether your tronc is a tronc for National Insurance — your accountant does that. We take the card total, the cash in the tin, and the weights you wrote down (70 / 20 / 10, or whatever you actually agreed), including the bartender who ran food from seven, and we produce a line for each person and a file for the accountant. Last month’s eyeballing is not a record.",
  },
  {
    title: "Kai is sixteen",
    body: "A 16- or 17-year-old in England cannot do night work, cannot do more than eight hours in a day or forty in a week, and needs twelve hours between shifts. The rota has to refuse the close, not remind you on Sunday that you already did it. We use the conservative reading. If a local authority has a tighter rule for under-16s, you write that in and we refuse earlier. We will not silently allow a shift because the room is short.",
  },
  {
    title: "Denise wants a cheque",
    body: "A significant fraction of a restaurant’s books would rather be paid promptly than paid via an app. Payslips can be paper. Pay can be BACS, cash in the envelope, or a cheque. If she will not install anything, we print the slip and you put it in her hand. That is a feature. We will not hold her last holiday hostage to a download.",
  },
  {
    title: "The split shift",
    body: "Lunch 11–3, dinner 5–10. The gap is unpaid. Whether it breaks the rest period is a Working Time question, not a feeling. We flag the gap; we do not invent a split-shift premium — Britain does not have a general one, and we do not operate in the American cities that do. If two services make a day longer than the young-worker limit, the second service is refused for that person.",
  },
  {
    title: "The leaver who is still in the book",
    body: "Turnover is the business. Someone walks on a Tuesday. They are owed hours, holiday, and perhaps a share of Saturday’s pool. They need a P45. They may not collect it. We keep them on the books without charging for them after thirty days, we produce the P45, and we will print the last payslip. We do not need them to open a portal to finish the job.",
  },
  {
    title: "Holiday on irregular hours",
    body: "Most restaurants use 12.07 percent because it is easy. HMRC will argue with it when the week is irregular. We keep the 52-week reference period as well, and we tell you when the two methods diverge by more than a day. We do not pick the cheaper one for you. You decide, and the decision is on the record.",
  },
  {
    title: "RTI on or before payday",
    body: "Payday is Friday. You cash up Sunday. The Full Payment Submission has to go on or before the day you pay, not the day you finished the arithmetic. We file when you confirm the week — which can be Monday — and we will not let you confirm a Friday pay if the file has not gone. Auto-enrolment: we produce the Nest, Smart Pension or People’s Pension file. We do not choose a provider.",
  },
];

export default function Product() {
  return (
    <Page current="product">
      <p className={s.kicker}>The work</p>
      <h1 className={s.lede}>The boring parts are the product.</h1>
      <p className={s.standfirst}>
        Scheduling software that gets exciting about “engagement” is selling
        a different job. The value here is a rota change at four o’clock, a
        tip pool that matches the policy you already signed, and a sixteen-year-old
        who cannot be put on the close. None of that is made to sound like a
        breakthrough.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>What we actually do</h2>
      <ol className={s.steps}>
        {JOBS.map((job) => (
          <li key={job.title}>
            <h3>{job.title}</h3>
            <p>{job.body}</p>
          </li>
        ))}
      </ol>

      <h2 className={s.h2}>What we do not do</h2>
      <div className={s.prose}>
        <p>
          We do not run the till. We do not take bookings. We do not count
          the walk-in. We do not recruit. We do not store a handbook and call
          it HR. We do not sell a camera over the pass. We do not operate
          payroll in the United States, Australia, or anywhere with awards,
          tip credits, or a Form 941. If a salesperson has told you we
          “integrate with everything”, they were not us.
        </p>
        <p>
          We will talk to a till or a time-clock if it will give us a CSV of
          clock-ins. We will not become the till’s payroll module. Leaving us
          later means you take a CSV and a PDF pack; it does not mean
          unwinding a five-year POS contract.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/for`}>
          Who this is for
        </Link>
        <Link className={s.more} href={`${BASE}/compare`}>
          Compared with the usual options
        </Link>
      </div>
      <Colophon />
    </Page>
  );
}
