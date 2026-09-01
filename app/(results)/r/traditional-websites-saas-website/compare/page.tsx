import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import { BASE, PRICE, gbp } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "Compared",
  description:
    "Rota against the spreadsheet, the high-street bureau, the till that added payroll, and the hospitality platform. Each has a real strength.",
};

const OPTIONS = [
  {
    title: "The spreadsheet, and Sunday night",
    good: "You understand every number.",
    body: "This is the honest default. It fails on a Friday swap you did not write down, on a tip pool you eyeballed, on a sixteen-year-old you left on the close, and on an RTI deadline that does not care you cashed up at midnight. It also fails when you get flu. The cost is not the licence. The cost is the night, and the week you get wrong.",
  },
  {
    title: "A high-street bureau",
    good: "PAYE is their whole job.",
    body: "They will file what you send, usually well. They will not write the rota, they will not catch Kai at 22:30, and they will not recalculate Saturday’s pool at twenty to midnight. You still do Sunday; they do Tuesday. Typical bureau fees sit around £8–15 a person a month, plus the night you already work. If you only run pay monthly, have no floor pool, and never change a shift after print, a bureau is cheaper than us and better at the filing.",
  },
  {
    title: "The till that added payroll",
    good: "One login, if you already bought the till.",
    body: "Toast, Square, and the others will sell you pay because they already have the clock-ins. Split shifts and a genuine tronc are afterthoughts; leaving the till later is the expensive part. If you live in that till and your room is simple, stay. If you bought the till for the cards and are now being walked toward a ‘workforce suite’, that is a different product wearing the till’s name. We will take a CSV from a till. We will not become one.",
  },
  {
    title: "The hospitality platform",
    good: "Multi-site, hiring, inventory, the lot.",
    body: "Fourth, Harri, and their cousins are built for groups. You will pay for rooms you do not enter — onboarding journeys, applicant tracking, a manager app nobody opens. Before payroll they often sit at two to four hundred pounds a site. They are the right tool if you have an operations director. They are the wrong tool if you are the operations director, the floor, and the person who does Sunday.",
  },
  {
    title: "Rota",
    good: "The rota and the wage are the same week.",
    body: `£${PRICE.site} a site and £${PRICE.person.toFixed(2)} a person paid. We do England, Wales, Scotland, Northern Ireland, and Ireland. We do paper. We answer on Saturday at four. We do not do the till, stock, bookings, hiring, or a fifth site. If you need those, one of the rows above is the honest choice.`,
  },
];

export default function Compare() {
  return (
    <Page current="compare">
      <p className={s.kicker}>Compared</p>
      <h1 className={s.lede}>Each of these is good at something.</h1>
      <p className={s.standfirst}>
        A table with empty competitor rows is a sales artefact. The usual
        options exist because they fit a real job. The question is whether
        your job is Sunday night in one dining room, or something else.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>The usual options</h2>
      <ul className={s.compare}>
        {OPTIONS.map((row) => (
          <li key={row.title}>
            <h3>{row.title}</h3>
            <p className={s.good}>{row.good}</p>
            <p>{row.body}</p>
          </li>
        ))}
      </ul>

      <h2 className={s.h2}>A number you can hold</h2>
      <div className={s.prose}>
        <p>
          A 28-person room: {gbp(PRICE.site)} + {gbp(PRICE.person)} × 28 ={" "}
          {gbp(PRICE.site + PRICE.person * 28)} a month. A bureau at £10 a
          head is {gbp(280)}, and you still write the rota. A platform at
          £250 a site, before payroll, is already more, and you will be in a
          demo for a module you will not open. Excel is £0 and last Sunday.
        </p>
        <p>
          We are not cheaper than Excel. We are cheaper than doing it wrong,
          and cheaper than a suite built for a group. If the bureau is
          already filing cleanly and Sunday is genuinely only an hour, stay
          with the bureau.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/price`}>
          The sum
        </Link>
        <Link className={s.more} href={`${BASE}/product`}>
          What we do
        </Link>
      </div>
      <Colophon />
    </Page>
  );
}
