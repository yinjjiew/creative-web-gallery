import type { Metadata } from "next";
import Link from "next/link";

import { Colophon, Sheet } from "../Chrome";
import { BASE } from "../data";
import s from "../leckie.module.css";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "How a Leckie job proceeds: three slots, two to four years, the same people from specification to first air. Classified work, and what we will not do.",
};

const STEPS: { when: string; what: string; body: string }[] = [
  {
    when: "Fortnight",
    what: "Whether we can staff it",
    body: "You write. We answer, within a fortnight, whether a slot exists for your date and whether the job is the kind we take. If the answer is no, it will say why, and when we next could. We do not hold a slot against a bid.",
  },
  {
    when: "6–12 months",
    what: "Specification",
    body: "The aerodynamicist who will still be on the job at first air writes the specification with you. Circuit, treatment, balance, instrumentation, the figures we will hold, and the figures that belong to the building — which is yours. The specification is the contract. We do not start manufacture against a draft.",
  },
  {
    when: "Year 1–2",
    what: "Design and the shop",
    body: "Drawings at Cardington. Model tests where the circuit needs them. Manufacture of the contraction, collector, vanes and shell in the shop on this site. Bought-in plant — fan, motor, cooler — is specified here and made elsewhere; we take delivery and stand it.",
  },
  {
    when: "Year 2–3",
    what: "Site",
    body: "We install into a building that is weathertight and whose grid is frozen. If the building is late, the circuit waits. That is the only slip we will accept on our side of the sheet, and it is the client’s. We do not redesign the contraction to fit a grid that moved.",
  },
  {
    when: "Last months",
    what: "First air",
    body: "Empty-section survey, the figures on the sheet, the book of as-builts. The people who signed the specification sign the handover. Then we leave. A research tunnel includes two weeks of running with your technician. An automotive tunnel includes the first-run sheet and a named engineer for ninety days of questions. After that the tunnel is yours.",
  },
];

export default function Practice() {
  return (
    <Sheet drawing="L-P" title="Practice" current="practice">
      <p className={s.kicker}>Practice</p>
      <h1 className={s.lede}>Three slots. First air. Then we leave.</h1>
      <p className={s.standfirst}>
        Ninety people, three jobs. A slot is not a place in a queue. It is
        the eight or twelve people who will still be on the job when the fan
        starts. We will not take a fourth until one of the three has been
        handed.
      </p>

      <h2 className={s.h2}>The programme</h2>
      <ol className={s.sched}>
        {STEPS.map((step) => (
          <li key={step.when}>
            <span className={s.when}>{step.when}</span>
            <span className={s.what}>
              <strong>{step.what}.</strong> {step.body}
            </span>
          </li>
        ))}
      </ol>

      <h2 className={s.h2}>What we will not do</h2>
      <div className={s.prose}>
        <p>
          We do not sell computational studies, and we do not wrap a fan in a
          box and call it a tunnel. We do not take the building. We do not
          run a hire facility. We do not start in fourteen months. We do not
          bid on a grant that has not been awarded. We do not put a
          university job in the gaps of an automotive one: if it is on the
          floor, it has a slot.
        </p>
        <p>
          Two to four years is not a slogan. The floor is two, for a 0.45
          metre teaching circuit into a laboratory that is already empty.
          Four is a full-scale aeroacoustic tunnel into a building that does
          not yet exist. Anything you need sooner is a different firm.
        </p>
      </div>

      <h2 className={s.h2}>Classified work</h2>
      <div className={s.prose}>
        <p>
          List X on this site since 1987. Security Check as a minimum for
          anyone on a classified job; Developed Vetting for the lead and the
          aerodynamicists who see the model. A classified job has its own
          room, its own store, and a data path that does not share a switch
          with the other two slots. Visitors from the programme come in
          through the north yard and do not walk the works.
        </p>
        <p>
          A contracting officer who wants the history rather than the
          certificate should ask for the unclassified first-run sheet from{" "}
          <Link href={`${BASE}/work/l-112`}>L-112</Link> (handed 2014) and
          the present state of <Link href={`${BASE}/work/l-148`}>L-148</Link>
          , through the usual channel. We will not discuss either job on the
          telephone.
        </p>
      </div>

      <h2 className={s.h2}>Money</h2>
      <div className={s.prose}>
        <p>
          Four hundred thousand pounds is the floor: a small closed circuit,
          a balance, a survey, a book. A rider-scale open jet is usually one
          to three million. A full-scale automotive aeroacoustic tunnel is
          twenty to forty. Transonic programmes are priced in the
          specification and are not published here. We invoice against
          milestones in the specification, not against time. The last
          invoice is due when the first-run sheet is signed.
        </p>
      </div>
      <Link className={s.more} href={`${BASE}/write`}>
        Write to the works
      </Link>
      <Colophon />
    </Sheet>
  );
}
