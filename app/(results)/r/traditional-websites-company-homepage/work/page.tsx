import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Sheet } from "../Chrome";
import { BASE, FLOOR, HANDED } from "../data";
import s from "../leckie.module.css";

export const metadata: Metadata = {
  title: "Work",
  description:
    "The book of jobs. Three on the floor, five handed. Automotive, transonic, research, cycling and skiing.",
};

function Index({ jobs }: { jobs: typeof FLOOR }) {
  return (
    <ul className={s.index}>
      {jobs.map((job) => (
        <li key={job.code}>
          <div className={s.job}>
            <Link href={`${BASE}/work/${job.slug}`}>
              <span className={s.code}>{job.code}</span>
              {job.title}
            </Link>
            <span className={s.meta}>
              {job.klassLabel} · {job.size} · {job.years}
            </span>
          </div>
          <div className={s.who}>
            {job.client}
            <span className={s.meta}>{job.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Work() {
  return (
    <Sheet drawing="L-W" title="Book of jobs" current="work">
      <p className={s.kicker}>Work</p>
      <h1 className={s.lede}>The book of jobs.</h1>
      <p className={s.standfirst}>
        Three on the floor. Five handed and still in use. Clients are named
        by kind, not by name: a car manufacturer, a university, a national
        programme, a team. Where the contract forbids even that, the sheet
        says so.
      </p>

      <h2 className={s.h2}>On the floor</h2>
      <Index jobs={FLOOR} />

      <h2 className={s.h2}>Handed</h2>
      <Index jobs={HANDED} />

      <div className={s.prose}>
        <p>
          A slot is two to four years and the people who take it. We do not
          keep a waiting list in public; if you write and we cannot staff
          your date, we will say when we next could. The smallest job we
          take is four hundred thousand pounds. The largest we have signed
          is forty.
        </p>
      </div>
      <Colophon />
    </Sheet>
  );
}
