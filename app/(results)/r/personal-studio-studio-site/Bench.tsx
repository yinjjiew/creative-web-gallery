"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  CAPABILITIES,
  PEOPLE,
  PROJECTS,
  STUDIO,
  WILL_NOT,
  killsOn,
  personById,
  type Form,
  type Project,
} from "./data";
import { FormMark } from "./forms";
import s from "./bench.module.css";

export default function Bench() {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [formId, setFormId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const form = project.forms.find((f) => f.id === formId) ?? null;
  const seen = picked[project.id] ?? [];

  function openProject(id: string) {
    setProjectId(id);
    setFormId(null);
  }

  function pick(next: Form) {
    setFormId(next.id);
    setPicked((prev) => {
      const list = prev[project.id] ?? [];
      if (list.includes(next.id)) return prev;
      return { ...prev, [project.id]: [...list, next.id] };
    });
  }

  return (
    <div className={s.page}>
      <a className={s.skip} href="#forms">
        To the forms
      </a>
      <a className={s.skip} href="#write">
        To write
      </a>

      <header className={s.mast}>
        <div>
          <p className={s.word}>{STUDIO.name}</p>
          <p className={s.where}>
            {STUDIO.people} people · {STUDIO.place} · est. {STUDIO.founded}
          </p>
        </div>
        <nav className={s.jump} aria-label="On this page">
          <a href="#write">Write</a>
          <Link
            href="/tasks/personal-studio-studio-site"
            prefetch={false}
            className={s.task}
          >
            Task
          </Link>
        </nav>
      </header>

      <div className={s.shell}>
        <main className={s.main}>
          <ProjectTabs
            current={project.id}
            onChange={openProject}
          />
          <h1 className={s.tension}>
            <span className={s.tensionName}>{project.name}</span>
            <span className={s.tensionMeta}>
              {project.object} · {project.client}
            </span>
            They asked: {project.asked} Pick the form you would have kept.
          </h1>
          <FormRow
            project={project}
            selectedId={formId}
            seen={seen}
            onPick={pick}
          />
          <Verdict
            project={project}
            form={form}
            seenIds={seen}
          />
          <Brief project={project} />
        </main>

        <aside className={s.rail} aria-label="For procurement">
          <p className={s.railKicker}>For procurement</p>
          <p className={s.railLead}>
            You do not have to walk the bench. Capabilities, the four, and a
            letter are here. Outcomes on the bench stay face-down until you
            open them.
          </p>
          <ObjectSpec project={project} />
          <Capabilities />
          <Four project={project} seen={seen} />
        </aside>
      </div>

      <Write />

      <footer className={s.foot}>
        <p>{STUDIO.note}</p>
        <Link
          href="/tasks/personal-studio-studio-site"
          prefetch={false}
          className={s.task}
        >
          Task
        </Link>
      </footer>
    </div>
  );
}

function ProjectTabs({
  current,
  onChange,
}: {
  current: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className={s.tabs} role="tablist" aria-label="Projects on the bench">
      {PROJECTS.map((p) => {
        const selected = p.id === current;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={selected ? s.tabOn : s.tab}
            onClick={() => onChange(p.id)}
          >
            <span className={s.tabName}>{p.name}</span>
            <span className={s.tabMeta}>
              {p.object} · {p.years}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Brief({ project }: { project: Project }) {
  return (
    <section className={s.brief} aria-label="The brief, asked and needed">
      <div className={s.pair}>
        <div>
          <h2>They asked</h2>
          <p>{project.asked}</p>
        </div>
        <div>
          <h2>They needed</h2>
          <p>{project.needed}</p>
        </div>
      </div>
    </section>
  );
}

function FormRow({
  project,
  selectedId,
  seen,
  onPick,
}: {
  project: Project;
  selectedId: string | null;
  seen: string[];
  onPick: (form: Form) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const label = useId();

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = project.forms.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[next]?.focus();
  }

  return (
    <section className={s.bench} aria-labelledby={label}>
      <div className={s.benchTop}>
        <h2 id={label}>The forms</h2>
        <p>Pick the form you would have kept. Arrow keys move. Enter chooses.</p>
      </div>
      <div
        id="forms"
        className={s.forms}
        role="radiogroup"
        aria-labelledby={label}
      >
        {project.forms.map((form, i) => {
          const on = form.id === selectedId;
          const opened = seen.includes(form.id);
          const outcome = opened
            ? form.status === "left"
              ? "left the shop"
              : "killed"
            : "outcome hidden";
          const cls = on ? s.formOn : opened ? s.formSeen : s.form;
          return (
            <button
              key={form.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`Form ${String(form.n).padStart(2, "0")} ${form.name}, ${outcome}`}
              className={cls}
              onClick={() => onPick(form)}
              onKeyDown={(e) => onKey(e, i)}
              ref={(el) => {
                refs.current[i] = el;
              }}
            >
              <span className={s.formN}>
                {String(form.n).padStart(2, "0")}
              </span>
              <FormMark mark={form.mark} />
              <span className={s.formName}>{form.name}</span>
              {opened ? (
                <span className={s.formStamp}>
                  {form.status === "left" ? "left" : "killed"}
                </span>
              ) : (
                <span className={s.formStampHidden} aria-hidden="true">
                  ·
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function kindLabel(form: Form): string {
  if (form.status === "left") return "The one that left";
  if (form.kind === "test") return "Failed in testing";
  if (form.kind === "direction") return "A direction we rejected";
  return "A constraint killed it";
}

function Verdict({
  project,
  form,
  seenIds,
}: {
  project: Project;
  form: Form | null;
  seenIds: string[];
}) {
  const opened = seenIds
    .map((id) => project.forms.find((f) => f.id === id))
    .filter((f): f is Form => Boolean(f));
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!form || !box.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.current.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, [form]);

  if (!form) {
    return (
      <section className={s.verdict} aria-live="polite">
        <p className={s.wait}>
          Pick a form. We will tell you if we killed it, who killed it, and
          why — not with a photograph of what left.
        </p>
      </section>
    );
  }

  const killer = form.killer ? personById(form.killer) : null;

  return (
    <section ref={box} className={s.verdict} aria-live="polite">
      <p className={s.kind}>
        {String(form.n).padStart(2, "0")} · {form.name} · {kindLabel(form)}
        {killer ? ` · ${killer.name}` : ""}
      </p>
      <h2 className={s.verdictTitle}>{form.verdict}</h2>
      <p className={s.reason}>{form.reason}</p>
      <p className={s.thinking}>
        <span>How we think. </span>
        {form.thinking}
      </p>
      {form.status === "left" ? (
        <p className={s.cost}>{project.left.cost}</p>
      ) : (
        <p className={s.next}>
          The one that left is still face-down. {opened.length} of{" "}
          {project.forms.length} opened.
        </p>
      )}
      {opened.length > 1 ? (
        <ol className={s.record}>
          {opened.map((f) => (
            <li key={f.id}>
              {String(f.n).padStart(2, "0")} {f.name}
              <span>
                {f.status === "left"
                  ? "left"
                  : `${f.kind ?? "killed"}${
                      f.killer ? ` · ${personById(f.killer).name}` : ""
                    }`}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function ObjectSpec({ project }: { project: Project }) {
  return (
    <section className={s.block}>
      <h2>What left, this job</h2>
      <p className={s.specName}>{project.left.title}</p>
      <p>{project.left.spec}</p>
      <p className={s.cost}>{project.left.cost}</p>
    </section>
  );
}

function Capabilities() {
  return (
    <section className={s.block}>
      <h2>What we take</h2>
      <ul className={s.caps}>
        {CAPABILITIES.map((c) => (
          <li key={c.title}>
            <strong>{c.title}</strong>
            <span>{c.body}</span>
          </li>
        ))}
      </ul>
      <h2>What we will not</h2>
      <ul className={s.wont}>
        {WILL_NOT.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

function Four({ project, seen }: { project: Project; seen: string[] }) {
  return (
    <section className={s.block}>
      <h2>The four</h2>
      <ul className={s.people}>
        {PEOPLE.map((p) => {
          const kills = killsOn(project, p.id);
          const opened = kills.filter((f) => seen.includes(f.id));
          const hidden = kills.length - opened.length;
          let line: string;
          if (kills.length === 0) {
            line = seen.some(
              (id) => project.forms.find((f) => f.id === id)?.status === "left",
            )
              ? `On ${project.name}: signed the one that left.`
              : `On ${project.name}: has not spoken on a form you have opened.`;
          } else if (opened.length === 0) {
            line = `On ${project.name}: ${kills.length} kill${
              kills.length === 1 ? "" : "s"
            } still face-down.`;
          } else {
            line = `On ${project.name}: killed ${opened
              .map((f) => String(f.n).padStart(2, "0"))
              .join(", ")}.${
              hidden ? ` ${hidden} still face-down.` : ""
            }`;
          }
          return (
            <li key={p.id}>
              <p className={s.who}>
                {p.name}
                <span>{p.role}</span>
              </p>
              <p className={s.killsFor}>{p.killsFor}</p>
              <p className={s.kills}>{line}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Write() {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [object, setObject] = useState("");
  const [when, setWhen] = useState("");
  const [constraint, setConstraint] = useState("");
  const [copied, setCopied] = useState(false);
  const letterRef = useRef<HTMLPreElement>(null);

  const letter = useMemo(() => {
    const who = name.trim() || "[name]";
    const from = org.trim() || "[organisation]";
    const what = object.trim() || "[the object]";
    const date = when.trim() || "[date needed]";
    const limit = constraint.trim() || "[a constraint you already know]";
    return [
      `To ${STUDIO.name}, ${STUDIO.place}.`,
      ``,
      `I am ${who}, writing from ${from}.`,
      ``,
      `We need ${what}. We need it by ${date}.`,
      ``,
      `A constraint we already know: ${limit}.`,
      ``,
      `I have seen how you kill a form. If this is not a job you can staff through that date, say so.`,
      ``,
      who,
    ].join("\n");
  }, [constraint, name, object, org, when]);

  function markCopied() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(letter);
        markCopied();
        return;
      }
    } catch {
      /* fall through to a selection copy */
    }
    const node = letterRef.current;
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    try {
      document.execCommand("copy");
      markCopied();
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="write" className={s.write} aria-labelledby="write-title">
      <div className={s.writeHead}>
        <h2 id="write-title">Write</h2>
        <p>
          There is no inbox. This is a modelled studio. Compose the letter you
          would send, and copy it.
        </p>
      </div>
      <form
        className={s.formGrid}
        onSubmit={(e) => {
          e.preventDefault();
          void copy();
        }}
      >
        <label>
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            suppressHydrationWarning
          />
        </label>
        <label>
          Organisation
          <input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            autoComplete="off"
            suppressHydrationWarning
          />
        </label>
        <label>
          The object
          <input
            value={object}
            onChange={(e) => setObject(e.target.value)}
            autoComplete="off"
            suppressHydrationWarning
          />
        </label>
        <label>
          Date you need it
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            autoComplete="off"
            suppressHydrationWarning
          />
        </label>
        <label className={s.wide}>
          A constraint you already know
          <textarea
            value={constraint}
            onChange={(e) => setConstraint(e.target.value)}
            rows={3}
            autoComplete="off"
            suppressHydrationWarning
          />
        </label>
        <pre ref={letterRef} className={s.letter} tabIndex={0}>
          {letter}
        </pre>
        <div className={s.actions}>
          <button type="submit">{copied ? "Copied" : "Copy the letter"}</button>
        </div>
      </form>
    </section>
  );
}
