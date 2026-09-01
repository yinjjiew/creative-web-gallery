import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Sheet } from "../Chrome";
import { BASE, FIRM } from "../data";
import s from "../leckie.module.css";

export const metadata: Metadata = {
  title: "People",
  description:
    "Ninety people at Cardington. The problems on the floor, and how to write if you want to work on them.",
};

const ROSTER: [string, string][] = [
  ["12", "Aerodynamicists"],
  ["18", "Mechanical and structural"],
  ["8", "Controls and instrumentation"],
  ["6", "Acoustic"],
  ["14", "Shop, fabrication"],
  ["8", "Site and commissioning"],
  ["10", "Drawing office and project"],
  ["8", "Commercial and the works"],
  ["6", "Apprentices"],
];

const PROBLEMS = [
  "Acoustic treatment of a ¾-open jet that does not kill the flow at 250 km/h — L-147, on the floor.",
  "Slot-wall interference at Mach 0.95, and a correction a national programme will stake a configuration on — L-148.",
  "Empty-section turbulence of 0.08 percent in a 0.6 metre research circuit, held with a nine-to-one contraction and a settling chamber that has to fit a laboratory six metres long — L-149.",
  "A bicycle-rig sting that does not become the largest thing in the wake. L-141 was handed; the next rider-scale job will need it again.",
  "Two data paths in one works, so a classified job and a university job do not share a switch. Unfashionable. Necessary.",
];

export default function People() {
  return (
    <Sheet drawing="L-E" title="Establishment" current="people">
      <p className={s.kicker}>People · {FIRM.people} at Cardington</p>
      <h1 className={s.lede}>The shop, and the problems.</h1>
      <p className={s.standfirst}>
        We hire slowly. One or two aerodynamicists a year, two or three
        apprentices from Bedford College, a fitter when one leaves. There is
        no graduate scheme. There is the floor.
      </p>

      <h2 className={s.h2}>On the books</h2>
      <ul className={s.roster}>
        {ROSTER.map(([n, role]) => (
          <li key={role}>
            <span className={s.n}>{n}</span>
            <span>{role}</span>
          </li>
        ))}
      </ul>
      <p className={s.note}>Ninety. The count is the firm as modelled.</p>

      <h2 className={s.h2}>What is actually hard</h2>
      <div className={s.prose}>
        <p>
          A graduate aerodynamicist deciding where to work should read the
          jobs, not a paragraph about culture. The interesting problems on
          this site, this year, are these.
        </p>
      </div>
      <ul className={s.problems}>
        {PROBLEMS.map((p) => (
          <li key={p.slice(0, 20)}>{p}</li>
        ))}
      </ul>

      <h2 className={s.h2}>Who writes</h2>
      <div className={s.prose}>
        <p>
          A letter, on paper or by mail, to the works. Say what you have
          actually built or computed — a contraction, a correction, a
          balance, a paper. Say why a tunnel and not a simulation. We read
          letters. We do not read portals, and we do not ask for a video of
          yourself.
        </p>
        <p>
          Apprentices: apply through Bedford College; we take two or three
          a year into the shop and the drawing office. Site work is
          Britain and, less often, the continent. Classified jobs need
          clearance; we will tell you before you apply if the vacancy is
          one of those.
        </p>
        <p>
          The works are in Building 17, Shortstown Road, in the lee of the
          Cardington sheds. The 09:14 from St Pancras, change at Bedford.
          There is a bicycle shed. There is not a canteen you would write
          home about.
        </p>
      </div>
      <Link className={s.more} href={`${BASE}/write`}>
        The address
      </Link>
      <Colophon />
    </Sheet>
  );
}
