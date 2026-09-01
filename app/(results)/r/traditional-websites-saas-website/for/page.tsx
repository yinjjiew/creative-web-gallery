import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Page } from "../Frame";
import { BASE } from "../data";
import s from "../rota.module.css";

export const metadata: Metadata = {
  title: "For whom",
  description:
    "Rota is for an owner-operator with one restaurant or four, eight to eighty people on the books. Not a group. Not a till. Not the US.",
};

const ROOMS = [
  {
    title: "A neighbourhood dining room",
    body: "Thirty to fifty covers, a floor and a kitchen, a Saturday that can hit ninety, a owner who is also the person who does Sunday. Tips are real money. Someone is always sixteen. This is the room the rest of the site is written from.",
  },
  {
    title: "A wine bar that added a kitchen",
    body: "Twelve to twenty on the books. The bartender is also the floor. The tip pool is an argument every Saturday. You do not need a hospitality platform. You need the pool to match the policy and the PAYE to go on Friday.",
  },
  {
    title: "A bakery-café with table service",
    body: "Early shifts, split days, school-age staff, and a lot of people who want cash on Friday because they have always been paid cash on Friday. The app is not a benefit to them. Paper is.",
  },
  {
    title: "A small hotel with one restaurant",
    body: "Breakfast, lunch, dinner, and a night porter who is on a different set of rules. One to three sites under the same PAYE scheme. If the hotel has a spa and a second kitchen and a events team, you are past us.",
  },
];

export default function ForWhom() {
  return (
    <Page current="for">
      <p className={s.kicker}>For whom</p>
      <h1 className={s.lede}>The person who did it last Sunday.</h1>
      <p className={s.standfirst}>
        An owner-operator. Eight to eighty people on the books. One site, or
        four under the same pair of hands. You have been sold restaurant
        software before. It did not work, or it worked for a different job
        than the one you have. We are selling the Sunday night, not a
        platform.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>Rooms we recognise</h2>
      <ul className={s.compare}>
        {ROOMS.map((room) => (
          <li key={room.title}>
            <h3>{room.title}</h3>
            <p>{room.body}</p>
          </li>
        ))}
      </ul>

      <h2 className={s.h2}>The buyer, in practice</h2>
      <div className={s.prose}>
        <p>
          You are the person who was still at the desk at one in the morning.
          You may have a bookkeeper who files what you send. You may have a
          partner who “does the money”. You do not have an HR department, and
          you do not have a Friday afternoon for a demo that needs six
          stakeholders.
        </p>
        <p>
          You already know the words: tronc, split, P45, RTI, the 48-hour
          opt-out, the sixteen-year-old, the leaver who will not come back
          for their holiday. If a page on this site uses a word you have not
          said out loud this year, it is the wrong page.
        </p>
      </div>

      <h2 className={s.h2}>Who we will not sell to</h2>
      <div className={s.prose}>
        <p>
          A group with a people team and a preferred vendor list — use Fourth,
          or Harri, or whatever your operations director already chose. A
          ghost kitchen with agency-only staff and no floor pool. A room that
          wants the rota to look like a product shot and will keep paying in
          a spreadsheet. Anyone in a tip-credit jurisdiction. Anyone who
          needs Australian awards, Californian split-shift premiums, or a
          US Form 941.
        </p>
        <p>
          We will also say no to a fifth site. Four is the end of the product.
          After that the work is a different shape — approvals, roles, a
          hierarchy — and pretending otherwise is how the last lot of
          software failed you.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/compare`}>
          Compared
        </Link>
        <Link className={s.more} href={`${BASE}/price`}>
          Price
        </Link>
      </div>
      <Colophon />
    </Page>
  );
}
