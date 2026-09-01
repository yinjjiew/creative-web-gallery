import Link from "next/link";

import { Colophon, Sheet } from "./Chrome";
import { BASE, FIRM, FLOOR, HELD } from "./data";
import { CircuitPlan } from "./figures";
import s from "./leckie.module.css";

/**
 * Leckie, Cardington. The cover sheet.
 *
 * Five audiences have to decide in about twenty seconds whether this firm
 * is for them. The cover does not ask who they are. It shows the three
 * jobs on the floor, the figures the firm will hold, and the one constraint
 * that explains both the forty-million-pound automotive tunnel and the
 * four-hundred-thousand-pound university one: three slots, and the same
 * people stay until first air.
 */
export default function Cover() {
  return (
    <Sheet drawing="L-000" title="Cover" current="cover">
      <p className={s.kicker}>
        {FIRM.legal} · {FIRM.people} people · est. {FIRM.founded}
      </p>
      <h1 className={s.lede}>We design and build the tunnel.</h1>
      <p className={s.standfirst}>
        Two to four years. Three jobs on the floor at a time. The people who
        write the specification stay until the fan starts. A slot is a slot:
        four hundred thousand pounds for a university, forty million for a car
        manufacturer, or a rider in a jet for a team that does not speak
        engineering.
      </p>

      <h2 className={`${s.h2} ${s.h2First}`}>What we hold</h2>
      <ul className={s.held}>
        {HELD.map((row) => (
          <li key={row.label}>
            <span className={s.lab}>{row.label}</span>
            <span className={s.val}>{row.value}</span>
            {row.note ? <span className={s.hint}>{row.note}</span> : null}
          </li>
        ))}
      </ul>
      <p className={s.note}>
        Figures typical of the class, from completed Leckie circuits and from
        the three contracts below. Not measurements from a public facility.
        The firm is modelled.
      </p>

      <figure className={s.figure}>
        <CircuitPlan className={s.drawing} />
        <figcaption>
          <ol className={s.key}>
            <li>
              <b>A</b>Settling chamber
            </li>
            <li>
              <b>B</b>Contraction
            </li>
            <li>
              <b>C</b>Test section
            </li>
            <li>
              <b>D</b>Diffuser
            </li>
            <li>
              <b>E</b>Corner vanes
            </li>
            <li>
              <b>F</b>Fan
            </li>
          </ol>
        </figcaption>
      </figure>
      <p className={s.note}>
        Closed-return circuit, plan. Not to scale. The building around it is
        yours. The first run is ours.
      </p>

      <h2 className={s.h2}>On the floor</h2>
      <ul className={s.index}>
        {FLOOR.map((job) => (
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
      <Link className={s.more} href={`${BASE}/work`}>
        The book of jobs
      </Link>

      <h2 className={s.h2}>What we build</h2>
      <ul className={s.classes}>
        <li>
          <Link href={`${BASE}/work/l-147`}>
            <span className={s.cname}>Automotive aeroacoustic</span>
            <p className={s.cnote}>
              Full-scale ¾-open jets for car manufacturers. Twenty to
              forty million pounds. The evidence that we can deliver one on
              a thirty-six-month clock is L-147, which is on the floor, and
              L-128, which we handed in 2020.
            </p>
          </Link>
        </li>
        <li>
          <Link href={`${BASE}/work/l-148`}>
            <span className={s.cname}>Transonic, aerospace</span>
            <p className={s.cnote}>
              Slotted-wall sections for national programmes. List X on this
              site since 1987. What we can print is on the L-148 sheet.
              What we cannot is sent through the usual channel.
            </p>
          </Link>
        </li>
        <li>
          <Link href={`${BASE}/work/l-149`}>
            <span className={s.cname}>Research and teaching</span>
            <p className={s.cnote}>
              Closed circuits from about 0.45 to 0.8 metres, from four
              hundred thousand pounds. The first Leckie tunnel was one of
              these. L-149, on the floor now, is one of these.
            </p>
          </Link>
        </li>
        <li>
          <Link href={`${BASE}/work/l-141`}>
            <span className={s.cname}>Cycling and skiing</span>
            <p className={s.cnote}>
              A rider or a skier in the jet. You change a position or a
              suit. You leave with a number you can take to the track or
              the hill. You do not need to speak engineering to write to us.
            </p>
          </Link>
        </li>
      </ul>

      <h2 className={s.h2}>How a job starts</h2>
      <div className={s.prose}>
        <p>
          Write, and say what you are trying to measure, what you can spend,
          and the date you need first air. If we cannot staff the job through
          that date we will say so within a fortnight. We do not bid on a
          grant that has not been awarded, and we do not start a fourth job
          until one of the three has had its first run.
        </p>
      </div>
      <div className={s.mores}>
        <Link className={s.more} href={`${BASE}/practice`}>
          The method, in full
        </Link>
        <Link className={s.more} href={`${BASE}/write`}>
          Write to the works
        </Link>
      </div>

      <Colophon />
    </Sheet>
  );
}
