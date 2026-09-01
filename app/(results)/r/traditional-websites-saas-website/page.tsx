import Link from "next/link";

import { Colophon, Page } from "./Frame";
import { BASE, FIRM, INCIDENTS, PRICE, STAVES, WAGES, gbp, quote } from "./data";
import s from "./rota.module.css";

/**
 * Sunday. The owner was up until one doing this by hand. The page opens on
 * that week — not on a promise — because the buyer has already been sold
 * restaurant software, and will not believe a claim. They will believe a
 * Friday swap, a Saturday tip pool, and a sixteen-year-old left on the close.
 */
const example = quote(1, STAVES.paid);

export default function Sunday() {
  return (
    <Page current="sunday">
      <p className={s.kicker}>
        {FIRM.legal} · {FIRM.place} · a modelled company
      </p>
      <h1 className={s.lede}>Sunday, 00:40. The week is still open.</h1>
      <p className={s.standfirst}>
        The till is cashed. Friday’s swap broke the overtime. Saturday’s tip
        pool does not add up. Kai was left on until half-past ten on a school
        night. Denise still wants last month’s holiday as a cheque. This is
        the work. We do the rota and the wage in the same week, for one
        independent restaurant or four. We do not do the till, and we do not
        do a group.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>
        {STAVES.name}, week ending {STAVES.weekEnding}
      </h2>
      <ul className={s.held}>
        <li>
          <span className={s.lab}>The room</span>
          <span className={s.val}>
            {STAVES.covers} covers · {STAVES.city} · one site
          </span>
        </li>
        <li>
          <span className={s.lab}>On the books</span>
          <span className={s.val}>
            {STAVES.onBooks} people · {STAVES.paid} paid this month
          </span>
        </li>
        <li>
          <span className={s.lab}>Saturday</span>
          <span className={s.val}>
            {STAVES.saturdayCovers} covers · card tips {gbp(STAVES.cardTips)} ·
            cash {gbp(STAVES.cashTips)}
          </span>
        </li>
      </ul>
      <p className={s.note}>
        {STAVES.name} is a modelled restaurant. The week is written to be
        typical of a neighbourhood dining room, not taken from a client.
      </p>

      <ol className={s.wages}>
        {WAGES.map((row) => (
          <li key={row.name}>
            <div className={s.wageHead}>
              <span className={s.who}>{row.name}</span>
              <span className={s.role}>{row.role}</span>
            </div>
            <div className={s.cols}>
              <span>
                <b>Hours</b>
                {row.hours}
              </span>
              <span>
                <b>Rate</b>
                {row.rate}
              </span>
              <span>
                <b>Tips</b>
                {row.tips}
              </span>
              <span>
                <b>Pay</b>
                {row.pay}
              </span>
            </div>
            <p className={s.how}>{row.how}</p>
            {row.note ? <p className={s.fault}>{row.note}</p> : null}
          </li>
        ))}
      </ol>

      <h2 className={s.h2}>Three things from last week</h2>
      <ul className={s.incidents}>
        {INCIDENTS.map((item) => (
          <li key={item.title}>
            <p className={s.when}>{item.when}</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
      <Link className={s.more} href={`${BASE}/product`}>
        The rest of the work
      </Link>

      <h2 className={s.h2}>What it costs, on this week</h2>
      <div className={s.prose}>
        <p>
          {gbp(PRICE.site)} a site, and {gbp(PRICE.person)} for each person you
          actually paid. {STAVES.name} paid {STAVES.paid} people:{" "}
          {gbp(example.total)} this month. That is the whole price. There is
          no “plus payroll”, no onboarding package, and no percentage of the
          wage bill. People on the books who were not paid do not count.
        </p>
        <p>
          The first month is the site fee only. We run alongside whatever you
          do now. If the two weeks do not match, you do not start. Setup is
          free if you send a usable spreadsheet; {gbp(PRICE.setupRemote)} if we
          sit with you for a half-day on a call; {gbp(PRICE.setupVisit)} if we
          come to you on the mainland.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/price`}>
          The sum, in full
        </Link>
        <Link className={s.more} href={`${BASE}/compare`}>
          Against the alternatives
        </Link>
      </div>

      <h2 className={s.h2}>Who this is not for</h2>
      <div className={s.prose}>
        <p>
          Not a twenty-site group. Not a ghost kitchen with no floor. Not a
          room that only wants a pretty rota and will still do pay in Excel
          on Sunday. Not the United States — we do not do tip-credit states,
          split-shift premiums, or anyone’s Form 941. England, Wales,
          Scotland, Northern Ireland, and the Republic of Ireland. That is
          the list.
        </p>
      </div>
      <Link className={s.more} href={`${BASE}/for`}>
        Who it is for
      </Link>

      <h2 className={s.h2}>If you want to start</h2>
      <div className={s.prose}>
        <p>
          Write, and send last month’s spreadsheet — or a photograph of the
          wage book, we have started from worse. Say how many you paid, when
          you next pay, and whether anyone is sixteen. We answer on a
          Tuesday-to-Sunday, including Saturday at four, because that is when
          the evening bartender calls in sick.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/write`}>
          Write
        </Link>
        <Link className={s.more} href={`${BASE}/move`}>
          How a move works
        </Link>
        <Link className={s.more} href={`${BASE}/help`}>
          Who answers
        </Link>
      </div>

      <Colophon />
    </Page>
  );
}
