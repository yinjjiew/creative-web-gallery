"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  BY_THREAD,
  REPRESENTATIVE,
  THREADS,
  THREAD_BY_ID,
  WORKS,
  WORK_BY_ID,
  claimLabel,
  cite,
  dimLine,
  kindLabel,
  pairOf,
  seriesMates,
  workX,
  yearX,
} from "./catalogue";
import type { ThreadId, ThreadMeta, Work } from "./types";
import s from "./threads.module.css";

type Sel = { thread: ThreadId; work: string };

function parseHash(): Sel | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "").trim();
  if (!raw) return null;
  const [tid, wid] = raw.split("/");
  const thread = THREADS.some((t) => t.id === tid) ? (tid as ThreadId) : null;
  const work = wid && WORK_BY_ID[wid] ? wid : null;
  if (thread && work && WORK_BY_ID[work]!.threads.includes(thread)) {
    return { thread, work };
  }
  if (work) {
    return { thread: WORK_BY_ID[work]!.threads[0]!, work };
  }
  if (thread) {
    return { thread, work: REPRESENTATIVE[thread] };
  }
  return null;
}

function writeHash(sel: Sel | null) {
  const next = sel ? `#${sel.thread}/${sel.work}` : "";
  if (window.location.hash !== next) {
    history.replaceState(null, "", next || window.location.pathname);
  }
}

function lineSegments(meta: ThreadMeta): { start: number; end: number; kind: "solid" | "dormant" }[] {
  const a = yearX(meta.start);
  const b = yearX(meta.end);
  if (!meta.quiet) return [{ start: a, end: b, kind: "solid" }];
  const q0 = yearX(meta.quiet[0]);
  const q1 = yearX(meta.quiet[1] + 1);
  if (meta.quietKind === "broken") {
    return [
      { start: a, end: q0, kind: "solid" },
      { start: q1, end: b, kind: "solid" },
    ];
  }
  return [
    { start: a, end: q0, kind: "solid" },
    { start: q0, end: q1, kind: "dormant" },
    { start: q1, end: b, kind: "solid" },
  ];
}

function nearestWork(works: Work[], clientX: number, el: HTMLElement): Work {
  const r = el.getBoundingClientRect();
  const t = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(r.width, 1)));
  let best = works[0]!;
  let bestD = Infinity;
  for (const w of works) {
    const d = Math.abs(workX(w, works) - t);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

function Rail({
  thread,
  currentId,
  active,
  onPick,
}: {
  thread: ThreadId;
  currentId: string | null;
  active: boolean;
  onPick: (work: Work) => void;
}) {
  const meta = THREAD_BY_ID[thread];
  const works = BY_THREAD[thread];
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pickAt = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      onPick(nearestWork(works, clientX, el));
    },
    [onPick, works],
  );

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    pickAt(e.clientX);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    pickAt(e.clientX);
  }

  function onPointerUp() {
    dragging.current = false;
  }

  function onKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    const i = Math.max(0, works.findIndex((w) => w.id === currentId));
    if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      onPick(works[Math.max(0, i - 1)]!);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      onPick(works[Math.min(works.length - 1, i + 1)]!);
    } else if (e.key === "Home") {
      e.preventDefault();
      onPick(works[0]!);
    } else if (e.key === "End") {
      e.preventDefault();
      onPick(works[works.length - 1]!);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      onPick(works[Math.max(0, i - 5)]!);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      onPick(works[Math.min(works.length - 1, i + 5)]!);
    }
  }

  const current = currentId ? WORK_BY_ID[currentId] : null;
  const stitches =
    active && current
      ? pairOf(current).filter((p) => p.work.threads.includes(thread))
      : [];

  const i = currentId ? works.findIndex((w) => w.id === currentId) : -1;

  return (
    <div
      ref={ref}
      className={s.rail}
      role="slider"
      tabIndex={0}
      aria-label={`Works on ${meta.name}`}
      aria-valuemin={0}
      aria-valuemax={Math.max(works.length - 1, 0)}
      aria-valuenow={i < 0 ? 0 : i}
      aria-valuetext={
        current && current.threads.includes(thread)
          ? `${current.title}, ${current.year}`
          : `${works.length} works`
      }
      style={{ ["--thread" as string]: meta.color }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKey}
    >
      {lineSegments(meta).map((seg) => (
        <span
          key={`${seg.kind}-${seg.start}`}
          className={seg.kind === "dormant" ? `${s.line} ${s.lineDormant}` : s.line}
          style={{
            left: `${seg.start * 100}%`,
            width: `${Math.max(0, seg.end - seg.start) * 100}%`,
          }}
        />
      ))}
      {stitches.map((p) => {
        const x1 = workX(current!, works);
        const x2 = workX(p.work, works);
        const left = Math.min(x1, x2);
        const width = Math.abs(x2 - x1);
        return (
          <span
            key={p.work.id}
            className={s.stitch}
            style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
            aria-hidden
          />
        );
      })}
      {works.map((w) => (
        <span
          key={w.id}
          className={`${s.tick} ${w.id === currentId ? s.tickNow : ""} ${w.pairs?.length ? s.tickPair : ""}`}
          style={{ left: `${workX(w, works) * 100}%` }}
        />
      ))}
    </div>
  );
}

function WorkPanel({
  sel,
  onFollow,
  onWalk,
}: {
  sel: Sel;
  onFollow: (thread: ThreadId, workId: string) => void;
  onWalk: (dir: -1 | 1) => void;
}) {
  const work = WORK_BY_ID[sel.work];
  const thread = THREAD_BY_ID[sel.thread];
  const list = BY_THREAD[sel.thread];
  const i = list.findIndex((w) => w.id === sel.work);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const crossings = (work?.threads ?? []).filter((t) => t !== sel.thread);
  const pairs = work ? pairOf(work) : [];
  const series = work ? seriesMates(work) : [];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [sel.work]);

  if (!work) return null;

  async function copy() {
    const text = cite(work!);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={s.panel} aria-labelledby="work-title">
      <div className={s.walk}>
        <button
          type="button"
          className={s.walkBtn}
          disabled={!prev}
          onClick={() => onWalk(-1)}
        >
          <span className={s.walkDir}>Previous on {thread.name}</span>
          <span className={s.walkTitle}>{prev ? prev.title : "Beginning of thread"}</span>
        </button>
        <p className={s.walkPos}>
          {i + 1} of {list.length}
        </p>
        <button
          type="button"
          className={s.walkBtn}
          disabled={!next}
          onClick={() => onWalk(1)}
        >
          <span className={s.walkDir}>Next on {thread.name}</span>
          <span className={s.walkTitle}>{next ? next.title : "End of thread"}</span>
        </button>
      </div>

      <header className={s.entryHead}>
        <p className={s.cat}>
          {work.cat}
          <span className={s.kind}> · {kindLabel(work.kind)}</span>
        </p>
        <h2 id="work-title" className={s.workTitle}>
          {work.title}
        </h2>
        <p className={s.yearline}>{work.year}</p>
      </header>

      <dl className={s.meta}>
        <div>
          <dt>Medium</dt>
          <dd>{work.medium}</dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>{dimLine(work)}</dd>
        </div>
        <div>
          <dt>Edition</dt>
          <dd>{work.edition}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{work.location}</dd>
        </div>
      </dl>

      <div className={s.citeBlock}>
        <div className={s.citeHead}>
          <h3>Cite</h3>
          <button type="button" className={s.copy} onClick={copy}>
            {copied ? "Copied" : "Copy citation"}
          </button>
        </div>
        <p className={s.cite}>{cite(work)}</p>
      </div>

      {work.note ? (
        <blockquote className={s.note}>
          <p>{work.note}</p>
          <footer>Artist&apos;s note — her claim, not a catalogue fact</footer>
        </blockquote>
      ) : null}

      <div className={s.rels}>
        <div>
          <h3>On this work</h3>
          <ul>
            <li>
              <button
                type="button"
                className={s.relBtn}
                aria-current="true"
                onClick={() => onFollow(sel.thread, work.id)}
              >
                <span className={s.relName} style={{ color: thread.color }}>
                  {thread.name}
                </span>
                <span className={s.relKind}>the thread you are on</span>
              </button>
            </li>
            {crossings.map((tid) => {
              const t = THREAD_BY_ID[tid];
              const kind = work.claims[tid] ?? "artist";
              return (
                <li key={tid}>
                  <button
                    type="button"
                    className={s.relBtn}
                    onClick={() => onFollow(tid, work.id)}
                  >
                    <span className={s.relName} style={{ color: t.color }}>
                      {t.name}
                    </span>
                    <span className={`${s.relKind} ${kind === "artist" ? s.claim : ""}`}>
                      {claimLabel(kind)} — step onto this thread here
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {pairs.length ? (
          <div>
            <h3>Same problem</h3>
            <ul>
              {pairs.map((p) => (
                <li key={p.work.id}>
                  <button
                    type="button"
                    className={s.relBtn}
                    onClick={() => {
                      const tid = p.work.threads.includes(sel.thread)
                        ? sel.thread
                        : p.work.threads[0]!;
                      onFollow(tid, p.work.id);
                    }}
                  >
                    <span className={s.relName}>
                      {p.work.title}, {p.work.year}
                    </span>
                    <span className={`${s.relKind} ${p.kind === "artist" ? s.claim : ""}`}>
                      {p.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {series.length ? (
          <div>
            <h3>Same series</h3>
            <ul>
              {series.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={s.relBtn}
                    onClick={() => {
                      const tid = m.threads.includes(sel.thread)
                        ? sel.thread
                        : m.threads[0]!;
                      onFollow(tid, m.id);
                    }}
                  >
                    <span className={s.relName}>
                      {m.title}, {m.year}
                    </span>
                    <span className={s.relKind}>established — titled as a series</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function Threads() {
  const [sel, setSel] = useState<Sel | null>(null);
  const [ready, setReady] = useState(false);
  const hadSel = useRef(false);

  useEffect(() => {
    setSel(parseHash());
    setReady(true);
    const onHash = () => setSel(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const follow = useCallback((thread: ThreadId, work: string) => {
    const next = { thread, work };
    setSel(next);
    writeHash(next);
  }, []);

  const pickOn = useCallback(
    (thread: ThreadId) => (work: Work) => follow(thread, work.id),
    [follow],
  );

  const walk = useCallback(
    (dir: -1 | 1) => {
      if (!sel) return;
      const list = BY_THREAD[sel.thread];
      const i = list.findIndex((w) => w.id === sel.work);
      const n = list[i + dir];
      if (n) follow(sel.thread, n.id);
    },
    [follow, sel],
  );

  useEffect(() => {
    if (!ready) return;
    if (sel && !hadSel.current && window.matchMedia("(max-width: 959px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("entry")?.scrollIntoView({
        block: "start",
        behavior: reduce ? "auto" : "smooth",
      });
    }
    hadSel.current = !!sel;
  }, [ready, sel]);

  const leave = useCallback(() => {
    setSel(null);
    writeHash(null);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (e.key === "Escape") {
        leave();
        return;
      }
      if (!sel) return;
      if (t?.getAttribute("role") === "slider") return;
      if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        walk(-1);
      } else if (e.key === "ArrowRight" || e.key === "k") {
        e.preventDefault();
        walk(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leave, sel, walk]);

  const live = sel ? WORK_BY_ID[sel.work] : null;

  return (
    <div className={s.shell}>
      <header className={s.mast}>
        <div>
          <p className={s.who}>Esther Wain</p>
          <h1 className={s.title}>Threads</h1>
        </div>
        <p className={s.standfirst}>
          {WORKS.length} works, 1995–2025. Print, sculpture, artist&apos;s books,
          occasional commissions. Indexed by the problems she returned to, not
          by the year she made them.
        </p>
      </header>

      <div className={s.body}>
        <div className={s.index}>
          <p className={s.invite}>
            {sel ? (
              <>
                You are on a thread. Draw along it, or step onto a crossing.{" "}
                <button type="button" className={s.leave} onClick={leave}>
                  Leave this thread
                </button>
              </>
            ) : (
              "Draw along a thread. A 1998 print and a 2019 sculpture may be the same problem."
            )}
          </p>

          <div className={s.ruler} aria-hidden>
            <span className={s.rulerGutter} />
            <div className={s.rulerTrack}>
              {[1995, 2005, 2015, 2025].map((y) => (
                <span
                  key={y}
                  className={s.rulerYear}
                  style={{ left: `${yearX(y) * 100}%` }}
                >
                  {y}
                </span>
              ))}
            </div>
          </div>

          <ol className={s.threads} aria-label="Preoccupations">
            {THREADS.map((t) => {
              const on = sel?.thread === t.id;
              return (
                <li key={t.id} className={`${s.row} ${on ? s.rowOn : ""}`}>
                  <button
                    type="button"
                    className={s.threadName}
                    style={{ ["--thread" as string]: t.color }}
                    aria-pressed={on}
                    onClick={() => follow(t.id, REPRESENTATIVE[t.id])}
                  >
                    <span className={s.threadTitle}>{t.name}</span>
                    <span className={s.fate}>{t.fateLabel}</span>
                  </button>
                  <Rail
                    thread={t.id}
                    currentId={sel?.work ?? null}
                    active={on}
                    onPick={pickOn(t.id)}
                  />
                  <p className={s.count}>{BY_THREAD[t.id].length}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={s.aside} id="entry">
          {sel ? (
            <div className={s.stickyRail}>
              <div className={s.stickyHead}>
                <p className={s.stickyName} style={{ color: THREAD_BY_ID[sel.thread].color }}>
                  {THREAD_BY_ID[sel.thread].name}
                </p>
                <button type="button" className={s.leave} onClick={leave}>
                  Leave
                </button>
              </div>
              <Rail
                thread={sel.thread}
                currentId={sel.work}
                active
                onPick={pickOn(sel.thread)}
              />
            </div>
          ) : null}
          <p className={s.live} aria-live="polite">
            {ready && live
              ? `${live.title}, ${live.year}, on ${THREAD_BY_ID[sel!.thread].name}.`
              : ""}
          </p>
          {sel ? (
            <WorkPanel sel={sel} onFollow={follow} onWalk={walk} />
          ) : (
            <div className={s.empty}>
              <p>
                The silences are part of the record: a faint line is a
                preoccupation she put down and later picked up; a break is one
                she thought she had finished.
              </p>
              <ul className={s.legend}>
                {THREADS.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={s.legendBtn}
                      onClick={() => follow(t.id, REPRESENTATIVE[t.id])}
                    >
                      <i style={{ background: t.color }} aria-hidden />
                      <strong>{t.name}</strong>
                      <span>{t.copy}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className={s.colophon}>
        <p>
          A modelled catalogue, written for this site, of a fictional
          thirty-year practice. Titles, dates, dimensions and locations are
          internally consistent. They are not a museum record.
        </p>
        <p className={s.keys}>
          Draw or use the arrow keys on a thread. Escape leaves it.
        </p>
      </footer>

      <a className={s.brief} href="/tasks/personal-studio-project-archive">
        brief
      </a>
    </div>
  );
}
