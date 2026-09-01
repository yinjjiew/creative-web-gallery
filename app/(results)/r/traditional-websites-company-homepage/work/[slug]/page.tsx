import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Colophon, Sheet } from "../../Chrome";
import { JOBS, jobBySlug } from "../../data";
import {
  CircuitPlan,
  OpenJet,
  RiderJet,
  SkierJet,
  SlottedWall,
} from "../../figures";
import s from "../../leckie.module.css";

export function generateStaticParams() {
  return JOBS.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = jobBySlug(slug);
  if (!job) return { title: "Job" };
  return {
    title: `${job.code} ${job.title}`,
    description: job.standfirst,
  };
}

const KEYS: Record<string, { letter: string; label: string }[]> = {
  aeroacoustic: [
    { letter: "A", label: "Nozzle" },
    { letter: "B", label: "Open jet" },
    { letter: "C", label: "Model" },
    { letter: "D", label: "Collector" },
  ],
  transonic: [
    { letter: "A", label: "Slotted walls" },
    { letter: "B", label: "Model volume" },
    { letter: "C", label: "Flow" },
  ],
  research: [
    { letter: "A", label: "Settling chamber" },
    { letter: "B", label: "Contraction" },
    { letter: "C", label: "Test section" },
    { letter: "D", label: "Diffuser" },
    { letter: "E", label: "Corner vanes" },
    { letter: "F", label: "Fan" },
  ],
  sport: [
    { letter: "A", label: "Nozzle" },
    { letter: "B", label: "Jet" },
    { letter: "C", label: "Rider or plate" },
  ],
};

function Drawing({ klass, slug }: { klass: string; slug: string }) {
  if (slug === "l-136") return <SkierJet className={s.drawing} />;
  if (klass === "aeroacoustic") return <OpenJet className={s.drawing} />;
  if (klass === "transonic") return <SlottedWall className={s.drawing} />;
  if (klass === "sport") return <RiderJet className={s.drawing} />;
  return <CircuitPlan className={s.drawing} />;
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = jobBySlug(slug);
  if (!job) notFound();

  const key = KEYS[job.klass] ?? KEYS.research;

  return (
    <Sheet drawing={job.code} title={job.title} current="work">
      <p className={s.kicker}>
        {job.code} · {job.klassLabel} · {job.status === "floor" ? "On the floor" : "Handed"} ·{" "}
        {job.years}
      </p>
      <h1 className={s.lede}>{job.title}</h1>
      <p className={s.standfirst}>{job.standfirst}</p>

      <figure className={s.figure}>
        <Drawing klass={job.klass} slug={job.slug} />
        <figcaption>
          <ol className={s.key}>
            {key.map((item) => (
              <li key={item.letter}>
                <b>{item.letter}</b>
                {item.label}
              </li>
            ))}
          </ol>
        </figcaption>
      </figure>

      <h2 className={s.h2}>The job</h2>
      <div className={s.prose}>
        {job.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>

      <h2 className={s.h2}>Specification</h2>
      <ul className={s.specs}>
        {job.specs.map((row) => (
          <li key={row.label}>
            <span className={s.lab}>{row.label}</span>
            <span className={s.val}>{row.value}</span>
            {row.note ? <span className={s.hint}>{row.note}</span> : null}
          </li>
        ))}
      </ul>

      {job.schedule ? (
        <>
          <h2 className={s.h2}>Programme</h2>
          <ol className={s.sched}>
            {job.schedule.map((row) => (
              <li key={row.when}>
                <span className={s.when}>{row.when}</span>
                <span className={s.what}>{row.what}</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {job.after ? <p className={s.note}>{job.after}</p> : null}
      <Colophon />
    </Sheet>
  );
}
