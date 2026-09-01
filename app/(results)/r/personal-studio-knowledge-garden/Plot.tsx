"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  AGAINST,
  BY_ID,
  IN,
  KEY,
  LEFT,
  NOTES_IN_BED,
  OUT,
  SEEDLINGS,
  TENDED,
  bedOf,
  inView,
  longMonth,
  maturityLabel,
  neighbours,
  parse,
  span,
  tendedPhrase,
  type View,
} from "./model";
import { BEDS, NOTES, type Maturity, type Note } from "./notes";
import s from "./plot.module.css";

const VIEWS: { id: View; label: string }[] = [
  { id: "beds", label: "the beds" },
  { id: "undergrowth", label: "the undergrowth" },
  { id: "whole", label: "the whole plot" },
];

const FIRST = "the-plane";

export default function Plot() {
  const [slug, setSlug] = useState(FIRST);
  const [view, setView] = useState<View>("whole");
  const [lit, setLit] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const [plotOpen, setPlotOpen] = useState(true);
  const reading = useRef<HTMLElement>(null);
  const skip = useRef(true);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 52rem)");
    setPlotOpen(!narrow.matches);
    const onWide = () => {
      if (!narrow.matches) setPlotOpen(true);
    };
    narrow.addEventListener("change", onWide);
    return () => narrow.removeEventListener("change", onWide);
  }, []);

  useEffect(() => {
    const apply = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (id && BY_ID.has(id)) setSlug(id);
    };
    if (!window.location.hash) {
      history.replaceState(null, "", `#${FIRST}`);
    }
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    reading.current?.scrollTo({ top: 0, behavior: "auto" });
    if (window.matchMedia("(max-width: 52rem)").matches) {
      document.getElementById("note")?.scrollIntoView({ block: "start" });
    }
  }, [slug]);

  const note = BY_ID.get(slug) ?? NOTES[0];
  const near = lit ? neighbours(lit) : neighbours(note.id);

  function follow(id: string) {
    if (!BY_ID.has(id) || id === slug) return;
    setTrail((t) => [...t.filter((x) => x !== slug), slug].slice(-8));
  }

  function onViewKey(event: React.KeyboardEvent) {
    const order = VIEWS.map((v) => v.id);
    const i = order.indexOf(view);
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (i + 1) % order.length;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (i - 1 + order.length) % order.length;
    }
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = order.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setView(order[next]);
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    );
    buttons[next]?.focus();
  }

  return (
    <div className={s.shell}>
      <a className={s.skip} href="#note">
        Skip to the note
      </a>

      <header className={s.mast}>
        <div className={s.brand}>
          <h1 className={s.word}>Plot</h1>
          <p className={s.who}>Ada Voss, notes. Holme, 2015–2026.</p>
          <p className={s.stand}>
            I used to wait until I was sure. That produced documents I could
            not later disagree with, which is how a cubic metre of loam got
            into three years of contracts. These are the notes I have not
            finished, and the ones I finished and then left.
          </p>
        </div>

        <div className={s.tools}>
          <div
            className={s.views}
            role="radiogroup"
            aria-label="Which part of the plot to show"
            onKeyDown={onViewKey}
          >
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={view === v.id}
                tabIndex={view === v.id ? 0 : -1}
                className={`${s.view} ${view === v.id ? s.viewOn : ""}`}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <ol className={s.key} aria-label="How a note looks, according to how far it has been worked">
            {KEY.map((k) => {
              const n = BY_ID.get(k.id);
              if (!n) return null;
              return (
                <li key={k.id}>
                  <a
                    href={`#${k.id}`}
                    className={`${s.keyItem} ${s[`t_${k.maturity}`]}`}
                    onClick={() => follow(k.id)}
                  >
                    {n.title}
                  </a>
                  <span className={s.keyHint}>{maturityLabel(k.maturity)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <div className={s.frame}>
        <div className={s.bedsWrap}>
          <button
            type="button"
            className={s.plotToggle}
            aria-expanded={plotOpen}
            aria-controls="the-plot"
            onClick={() => setPlotOpen((o) => !o)}
          >
            {plotOpen ? "Hide the plot" : "Show the plot"}
          </button>
          <nav
            id="the-plot"
            className={`${s.beds} ${plotOpen ? s.bedsOpen : s.bedsShut}`}
            aria-label="The beds"
            hidden={!plotOpen ? true : undefined}
          >
            {BEDS.map((bed) => {
              const items = NOTES_IN_BED[bed.id].filter((n) => inView(n, view));
              if (items.length === 0) return null;
              return (
                <section key={bed.id} className={s.bed}>
                  <h2 className={s.bedName}>{bed.name}</h2>
                  <p className={s.bedAbout}>{bed.about}</p>
                  <ul className={s.list}>
                    {items.map((n) => {
                      const on = n.id === note.id;
                      const kin = !on && near.has(n.id);
                      return (
                        <li key={n.id}>
                          <a
                            href={`#${n.id}`}
                            className={`${s.item} ${s[`t_${n.maturity}`]} ${
                              on ? s.itemOn : ""
                            } ${kin ? s.itemKin : ""}`}
                            aria-current={on ? "page" : undefined}
                            onClick={() => follow(n.id)}
                            onFocus={() => setLit(n.id)}
                            onBlur={() => setLit(null)}
                            onMouseEnter={() => setLit(n.id)}
                            onMouseLeave={() => setLit(null)}
                          >
                            <span className={s.itemTitle}>{n.title}</span>
                            <span className={s.itemSpan}>{span(n)}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </nav>
        </div>

        <article
          ref={reading}
          id="note"
          className={`${s.reading} ${s[`r_${note.maturity}`]}`}
          aria-labelledby="note-title"
        >
          <p className={s.kicker}>
            <span>{bedOf(note.bed).name}</span>
            <span aria-hidden="true">·</span>
            <span>{span(note)}</span>
            <span aria-hidden="true">·</span>
            <span>{maturityLabel(note.maturity)}</span>
          </p>
          <h2 id="note-title" className={s.title}>
            {note.title}
          </h2>
          {note.maturity === "left" ? (
            <p className={s.leftMark}>
              Left in {longMonth(note.lastTended)}. Not withdrawn.
            </p>
          ) : null}
          {note.maturity === "seedling" ? (
            <p className={s.seedMark}>
              Put in {longMonth(note.planted)}. Not yet a bed.
            </p>
          ) : null}

          {trail.length > 0 ? (
            <p className={s.trail}>
              <span className={s.trailLabel}>Came via</span>
              {trail.map((id, i) => {
                const t = BY_ID.get(id);
                if (!t) return null;
                return (
                  <span key={`${id}-${String(i)}`}>
                    {i > 0 ? <span aria-hidden="true"> → </span> : null}
                    <a
                      href={`#${id}`}
                      className={`${s.wik} ${s[`wik_${t.maturity}`]}`}
                    >
                      {t.title}
                    </a>
                  </span>
                );
              })}
            </p>
          ) : null}

          <div className={s.prose}>
            {note.body.map((graf, i) => (
              <p key={`${graf.at ?? "x"}-${String(i)}`} className={s.graf}>
                {graf.at ? (
                  <time className={s.when} dateTime={graf.at}>
                    {graf.at}
                  </time>
                ) : (
                  <span className={s.whenBlank} aria-hidden="true" />
                )}
                <span className={s.grafText}>
                  <Inline text={graf.text} onFollow={follow} />
                </span>
              </p>
            ))}
          </div>

          <footer className={s.noteFoot}>
            <Stance note={note} onFollow={follow} />
            <Related note={note} onFollow={follow} />
            <p className={s.tended}>
              {note.maturity === "left" ? (
                <>
                  Last touched {longMonth(note.lastTended)}, tended{" "}
                  {tendedPhrase(note.revisions)}, then left.
                </>
              ) : note.maturity === "seedling" ? (
                <>Put down {longMonth(note.planted)}. Not tended since.</>
              ) : (
                <>
                  Last tended {longMonth(note.lastTended)}. Worked{" "}
                  {tendedPhrase(note.revisions)}.
                </>
              )}
            </p>
          </footer>
        </article>
      </div>

      <footer className={s.colo}>
        <p>
          <strong>Plot is fiction.</strong> Ada Voss, the Borough of Holme,
          Ledger Street, Mrs Dutta, the plane and all {NOTES.length} of these
          notes were written for this piece. Nobody kept this notebook and no
          tree in it stands.
        </p>
        <p>
          {TENDED} notes still being worked, {LEFT} left where they stopped,{" "}
          {SEEDLINGS} just put in. A link takes the type of the note it leads
          to, so you can see what you are walking into. A note that stands
          against an older one does not replace it.
        </p>
        <p className={s.brief}>
          <Link href="/tasks/personal-studio-knowledge-garden" prefetch={false}>
            the brief this was built from
          </Link>
        </p>
      </footer>
    </div>
  );
}

function Inline({
  text,
  onFollow,
}: {
  text: string;
  onFollow: (id: string) => void;
}) {
  return (
    <>
      {parse(text).map((part, i) => {
        if (part.t === "text") return <span key={i}>{part.v}</span>;
        const dest = BY_ID.get(part.id);
        const m: Maturity | "gone" = dest?.maturity ?? "gone";
        return (
          <a
            key={`${part.id}-${String(i)}`}
            href={`#${part.id}`}
            className={`${s.wik} ${s[`wik_${m}`]}`}
            onClick={() => onFollow(part.id)}
          >
            {part.v}
          </a>
        );
      })}
    </>
  );
}

function Stance({
  note,
  onFollow,
}: {
  note: Note;
  onFollow: (id: string) => void;
}) {
  const against = note.contradicts ?? [];
  const by = AGAINST.get(note.id) ?? [];
  if (against.length === 0 && by.length === 0) return null;
  return (
    <div className={s.stance}>
      {against.length > 0 ? (
        <p>
          <span className={s.stanceLabel}>Stands against</span>
          {against.map((id, i) => {
            const n = BY_ID.get(id);
            if (!n) return null;
            return (
              <span key={id}>
                {i > 0 ? ", " : " "}
                <a
                  href={`#${id}`}
                  className={`${s.wik} ${s[`wik_${n.maturity}`]}`}
                  onClick={() => onFollow(id)}
                >
                  {n.title}
                </a>
                <span className={s.stanceMeta}>
                  {" "}
                  ({maturityLabel(n.maturity)}, {n.lastTended.slice(0, 4)})
                </span>
              </span>
            );
          })}
          .
        </p>
      ) : null}
      {by.length > 0 ? (
        <p>
          <span className={s.stanceLabel}>Stood against by</span>
          {by.map((id, i) => {
            const n = BY_ID.get(id);
            if (!n) return null;
            return (
              <span key={id}>
                {i > 0 ? ", " : " "}
                <a
                  href={`#${id}`}
                  className={`${s.wik} ${s[`wik_${n.maturity}`]}`}
                  onClick={() => onFollow(id)}
                >
                  {n.title}
                </a>
                <span className={s.stanceMeta}>
                  {" "}
                  ({maturityLabel(n.maturity)}, {n.lastTended.slice(0, 4)})
                </span>
              </span>
            );
          })}
          . The older claim stays.
        </p>
      ) : null}
    </div>
  );
}

function Related({
  note,
  onFollow,
}: {
  note: Note;
  onFollow: (id: string) => void;
}) {
  const out = OUT.get(note.id) ?? [];
  const incoming = (IN.get(note.id) ?? []).filter((id) => !out.includes(id));
  const bedmates = NOTES_IN_BED[note.bed].filter((n) => n.id !== note.id);
  if (out.length === 0 && incoming.length === 0 && bedmates.length === 0) {
    return null;
  }
  return (
    <div className={s.related}>
      {out.length > 0 ? (
        <p>
          <span className={s.relLabel}>Leads to</span>
          <RelList ids={out} onFollow={onFollow} />
        </p>
      ) : null}
      {incoming.length > 0 ? (
        <p>
          <span className={s.relLabel}>Reached from</span>
          <RelList ids={incoming} onFollow={onFollow} />
        </p>
      ) : null}
      {bedmates.length > 0 ? (
        <p>
          <span className={s.relLabel}>Also in this bed</span>
          <RelList ids={bedmates.map((n) => n.id)} onFollow={onFollow} />
        </p>
      ) : null}
    </div>
  );
}

function RelList({
  ids,
  onFollow,
}: {
  ids: string[];
  onFollow: (id: string) => void;
}) {
  return (
    <>
      {ids.map((id, i) => {
        const n = BY_ID.get(id);
        if (!n) return null;
        return (
          <span key={id}>
            {i > 0 ? <span aria-hidden="true"> · </span> : " "}
            <a
              href={`#${id}`}
              className={`${s.wik} ${s[`wik_${n.maturity}`]}`}
              onClick={() => onFollow(id)}
            >
              {n.title}
            </a>
          </span>
        );
      })}
    </>
  );
}
