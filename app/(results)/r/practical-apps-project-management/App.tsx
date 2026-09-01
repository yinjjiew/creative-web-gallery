"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { airWord, compactDate, dayIso, dayNum, daysWord, longDate, shortDate } from "./dates";
import s from "./getin.module.css";
import { clear, load, save } from "./persist";
import { DEPT_LABEL, DEPT_OWNER, PRODUCTION } from "./production";
import {
  explain,
  schedule,
  taskById,
  tonight,
  weekOf,
} from "./schedule";
import type { Dept, Task, View } from "./types";

const DEPTS: Dept[] = ["costume", "set", "lx", "sound", "props", "cast", "foh"];

export default function App() {
  const [userDone, setUserDone] = useState<Record<string, string>>({});
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<View>("tonight");
  const [dept, setDept] = useState<Dept>("costume");
  const [openId, setOpenId] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = load();
    if (saved) {
      setUserDone(saved.done);
      setOffset(Math.min(10, Math.max(0, saved.offset)));
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    save({ done: userDone, offset });
  }, [booted, userDone, offset]);

  const done = useMemo(
    () => ({ ...PRODUCTION.already, ...userDone }),
    [userDone],
  );
  const asOf = dayNum(PRODUCTION.today) + offset;
  const plan = useMemo(
    () => schedule(PRODUCTION, done, asOf),
    [done, asOf],
  );
  const tasks = useMemo(() => taskById(PRODUCTION), []);
  const urgent = useMemo(
    () => tonight(PRODUCTION, plan, done),
    [plan, done],
  );
  const openTask = openId ? tasks[openId] : null;
  const openRow = openId ? plan.byId[openId] : null;

  useEffect(() => {
    if (!openId) return;
    const node = sheetRef.current?.querySelector<HTMLElement>("button, [href]");
    node?.focus();
  }, [openId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "1") setView("tonight");
      if (event.key === "2") setView("chain");
      if (event.key === "3") setView("dept");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function markDone(id: string) {
    setUserDone((prev) => ({ ...prev, [id]: dayIso(asOf) }));
    setOpenId(null);
  }

  function unmark(id: string) {
    if (PRODUCTION.already[id] && !userDone[id]) return;
    setUserDone((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function reset() {
    clear();
    setUserDone({});
    setOffset(0);
    setOpenId(null);
  }

  const late = urgent.filter((task) => plan.byId[task.id].late);
  const lastDay = urgent.filter(
    (task) => plan.byId[task.id].untilStart === 0 && !plan.byId[task.id].late,
  );
  const headline = headLine(late, lastDay, offset);

  return (
    <div className={s.shell}>
      <a className={s.escape} href="/tasks/practical-apps-project-management">
        Task
      </a>

      <header className={s.mast}>
        <p className={s.house}>{PRODUCTION.venue}</p>
        <h1 className={s.title}>{PRODUCTION.title}</h1>
        <p className={s.byline}>
          {PRODUCTION.writer}
          <span aria-hidden="true"> · </span>
          press night {compactDate(plan.opening)}
        </p>
        <p className={s.countdown}>
          <span className={s.days}>{String(plan.horizon)}</span>
          <span className={s.daysWord}>
            {plan.horizon === 1 ? "day" : "days"} to an opening that cannot move
          </span>
        </p>
      </header>

      <div className={s.ask}>
        <h2 className={s.question}>What is about to become unrecoverable?</h2>
        <p className={s.headline} aria-live="polite">
          {headline}
        </p>
        <p className={s.asof}>
          As of {longDate(asOf)}
          {offset > 0 ? " — if nothing is marked done" : ""}
        </p>
        <div className={s.offset} role="group" aria-label="Look ahead if nothing is marked done">
          <button
            type="button"
            className={s.offsetBtn}
            disabled={offset === 0}
            onClick={() => setOffset((n) => Math.max(0, n - 1))}
          >
            −
          </button>
          <span className={s.offsetNow}>
            {offset === 0 ? "Tonight" : `If nothing moves, +${String(offset)}d`}
          </span>
          <button
            type="button"
            className={s.offsetBtn}
            disabled={offset === 10}
            onClick={() => setOffset((n) => Math.min(10, n + 1))}
          >
            +
          </button>
        </div>
      </div>

      <main className={s.main} id="getin-main">
        {view === "tonight" && (
          <UrgentList
            items={urgent}
            plan={plan}
            asOf={asOf}
            opening={plan.opening}
            selected={openId}
            onOpen={setOpenId}
          />
        )}
        {view === "chain" && (
          <Chain
            plan={plan}
            asOf={asOf}
            selected={openId}
            onOpen={setOpenId}
            done={done}
          />
        )}
        {view === "dept" && (
          <DeptView
            dept={dept}
            onDept={setDept}
            plan={plan}
            done={done}
            asOf={asOf}
            opening={plan.opening}
            selected={openId}
            onOpen={setOpenId}
          />
        )}
      </main>

      <nav className={s.dock} aria-label="Views">
        <button
          type="button"
          className={view === "tonight" ? s.dockOn : s.dockBtn}
          aria-current={view === "tonight" ? "page" : undefined}
          onClick={() => setView("tonight")}
        >
          Tonight
        </button>
        <button
          type="button"
          className={view === "chain" ? s.dockOn : s.dockBtn}
          aria-current={view === "chain" ? "page" : undefined}
          onClick={() => setView("chain")}
        >
          The chain
        </button>
        <button
          type="button"
          className={view === "dept" ? s.dockOn : s.dockBtn}
          aria-current={view === "dept" ? "page" : undefined}
          onClick={() => setView("dept")}
        >
          A department
        </button>
      </nav>

      {openTask && openRow && (
        <div
          className={s.sheetBack}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenId(null);
          }}
        >
          <div
            className={s.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gi-sheet-title"
            ref={sheetRef}
          >
            <p className={s.sheetDept}>
              {DEPT_LABEL[openTask.dept]}
              <span aria-hidden="true"> · </span>
              {openTask.owner}
            </p>
            <h3 id="gi-sheet-title" className={s.sheetTitle}>
              {openTask.name}
            </h3>
            <StatusLine task={openTask} row={openRow} asOf={asOf} />
            <Window
              es={openRow.es}
              ef={openRow.ef}
              ls={openRow.ls}
              lf={openRow.lf}
              wait={openTask.wait}
              asOf={asOf}
              opening={plan.opening}
            />
            <p className={s.reason}>{explain(openTask, plan, PRODUCTION)}</p>
            <Depends
              task={openTask}
              plan={plan}
              tasks={tasks}
              done={done}
              onOpen={setOpenId}
            />
            <div className={s.sheetActs}>
              {done[openTask.id] && !PRODUCTION.already[openTask.id] ? (
                <button type="button" className={s.ghost} onClick={() => unmark(openTask.id)}>
                  Still open
                </button>
              ) : !done[openTask.id] ? (
                <button type="button" className={s.done} onClick={() => markDone(openTask.id)}>
                  Mark done
                </button>
              ) : (
                <p className={s.seeded}>Already done in this model, on {done[openTask.id]}.</p>
              )}
              <button type="button" className={s.ghost} onClick={() => setOpenId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={s.foot}>
        <p>
          Modelled get-in: a mid-scale new play, frozen on Monday 31 August 2026.
          Names, the house and every date are invented. The dependencies and lead
          times are the point — sixty-eight items with a predecessor or a wait, not
          the four hundred standing jobs on the call.
        </p>
        <button type="button" className={s.reset} onClick={reset}>
          Restore the modelled night
        </button>
      </footer>
    </div>
  );
}

function headLine(late: Task[], lastDay: Task[], offset: number): string {
  const when = offset === 0 ? "today" : `in ${daysWord(offset)}`;
  if (late.length && lastDay.length) {
    return `${String(late.length)} already past the last start that still makes the booked night. ${String(lastDay.length)} become unrecoverable ${when}.`;
  }
  if (lastDay.length === 1) {
    return `${lastDay[0].name} becomes unrecoverable ${when}.`;
  }
  if (lastDay.length === 2) {
    return `Two last starts ${when}: ${lastDay[0].name.toLowerCase()}, and ${lastDay[1].name.toLowerCase()}.`;
  }
  if (lastDay.length > 2) {
    return `${String(lastDay.length)} things become unrecoverable ${when}.`;
  }
  if (late.length) {
    return `${String(late.length)} already past recovery for the date they feed.`;
  }
  return "Nothing tips in the next day. The chain still has air — spend it on the ones with the longest wait.";
}

function StatusLine({
  task,
  row,
  asOf,
}: {
  task: Task;
  row: { untilStart: number; slack: number; late: boolean; ls: number; es: number };
  asOf: number;
}) {
  let stamp = airWord(row.slack);
  if (row.late) stamp = "Unrecoverable for the date it feeds";
  else if (row.untilStart === 0) stamp = "Last start today";
  else if (row.untilStart === 1) stamp = "Last start tomorrow";
  else if (row.untilStart < 20) stamp = `Last start ${shortDate(row.ls)}`;

  return (
    <p className={row.late || row.untilStart === 0 ? s.stampBad : s.stamp}>
      {stamp}
      {task.wait > 0 ? ` · ${String(task.wait)}-day lead` : ""}
      {task.external ? " · she cannot rush this" : ""}
      {row.es > asOf && !row.late ? ` · earliest ${shortDate(row.es)}` : ""}
    </p>
  );
}

function Window({
  es,
  ef,
  ls,
  wait,
  asOf,
  opening,
}: {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  wait: number;
  asOf: number;
  opening: number;
}) {
  const span = Math.max(1, opening - asOf);
  const pct = (day: number) =>
    `${String(Math.min(100, Math.max(0, ((day - asOf) / span) * 100)))}%`;
  const workW = Math.max(1.2, ((Math.max(ef, es + 0.4) - es) / span) * 100);
  const waitW = wait > 0 ? (wait / span) * 100 : 0;

  return (
    <div className={s.window} aria-hidden="true">
      <div className={s.windowTrack}>
        <span className={s.windowWork} style={{ left: pct(es), width: `${String(workW)}%` }} />
        {waitW > 0 && (
          <span
            className={s.windowWait}
            style={{ left: pct(ef), width: `${String(waitW)}%` }}
          />
        )}
        <span className={s.windowMust} style={{ left: pct(ls) }} />
      </div>
      <div className={s.windowCap}>
        <span>{compactDate(asOf)}</span>
        <span>must {compactDate(ls)}</span>
        <span>press {compactDate(opening)}</span>
      </div>
    </div>
  );
}

function UrgentList({
  items,
  plan,
  asOf,
  opening,
  selected,
  onOpen,
}: {
  items: Task[];
  plan: ReturnType<typeof schedule>;
  asOf: number;
  opening: number;
  selected: string | null;
  onOpen: (id: string) => void;
}) {
  if (!items.length) {
    return <p className={s.empty}>Nothing in the next week is out of air.</p>;
  }
  return (
    <ul className={s.list}>
      {items.map((task) => {
        const row = plan.byId[task.id];
        return (
          <li key={task.id}>
            <button
              type="button"
              className={`${s.row} ${row.late || row.untilStart === 0 ? s.rowHot : ""} ${selected === task.id ? s.rowOn : ""}`}
              onClick={() => onOpen(task.id)}
            >
              <span className={s.rowTop}>
                <span className={s.rowDept}>{DEPT_LABEL[task.dept]}</span>
                <span className={s.rowWhen}>
                  {row.late
                    ? "too late"
                    : row.untilStart === 0
                      ? "today"
                      : row.untilStart === 1
                        ? "tomorrow"
                        : shortDate(row.ls)}
                </span>
              </span>
              <span className={s.rowName}>{task.name}</span>
              <span className={s.rowMeta}>
                {task.owner}
                {task.wait > 0 ? ` · ${String(task.wait)}-day lead` : ""}
                {` · ${airWord(row.slack)}`}
              </span>
              <Window
                es={row.es}
                ef={row.ef}
                ls={row.ls}
                lf={row.lf}
                wait={task.wait}
                asOf={asOf}
                opening={opening}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Chain({
  plan,
  asOf,
  selected,
  onOpen,
  done,
}: {
  plan: ReturnType<typeof schedule>;
  asOf: number;
  selected: string | null;
  onOpen: (id: string) => void;
  done: Record<string, string>;
}) {
  const spine = PRODUCTION.tasks
    .filter((task) => {
      const row = plan.byId[task.id];
      if (task.kind === "event" || task.kind === "gate") return true;
      if (done[task.id]) return false;
      return row.critical || row.slack <= 2 || row.untilStart <= 3;
    })
    .sort((a, b) => {
      const ra = plan.byId[a.id];
      const rb = plan.byId[b.id];
      const da = a.on ? dayNum(a.on) : ra.ls;
      const db = b.on ? dayNum(b.on) : rb.ls;
      return da - db || ra.slack - rb.slack;
    });

  const weeks: { label: string; start: number; end: number; items: Task[] }[] = [];
  let cursor = asOf;
  while (cursor <= plan.opening) {
    const dow = new Date(cursor * 86_400_000).getUTCDay();
    const monday = cursor - ((dow + 6) % 7);
    const end = Math.min(monday + 6, plan.opening);
    const start = Math.max(monday, asOf);
    const slice = spine.filter((task) => {
      const row = plan.byId[task.id];
      const day = task.on ? dayNum(task.on) : row.ls;
      return day >= start && day <= end;
    });
    weeks.push({
      label:
        start === asOf && cursor === asOf
          ? "This week"
          : `Week of ${compactDate(start)}`,
      start,
      end,
      items: slice,
    });
    cursor = end + 1;
  }

  return (
    <ol className={s.chain}>
      {weeks.map((week) => (
        <li key={week.start} className={s.week}>
          <h3 className={s.weekLabel}>
            {week.label}
            <span className={s.weekSpan}>
              {compactDate(week.start)}–{compactDate(week.end)}
            </span>
          </h3>
          {week.items.length === 0 ? (
            <p className={s.weekAir}>No last-starts in this week. Air, if the earlier knots hold.</p>
          ) : (
            <ul className={s.weekItems}>
              {week.items.map((task) => {
                const row = plan.byId[task.id];
                const hot = row.late || row.untilStart === 0 || task.kind === "event";
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      className={`${s.knot} ${hot ? s.knotHot : ""} ${selected === task.id ? s.rowOn : ""}`}
                      onClick={() => onOpen(task.id)}
                    >
                      <span className={s.knotDate}>
                        {task.on ? compactDate(dayNum(task.on)) : compactDate(row.ls)}
                      </span>
                      <span className={s.knotBody}>
                        <span className={s.knotName}>{task.name}</span>
                        <span className={s.knotMeta}>
                          {DEPT_LABEL[task.dept]}
                          {task.kind === "event"
                            ? " · immovable"
                            : ` · ${airWord(row.slack)}`}
                          {task.wait > 0 ? ` · ${String(task.wait)}d wait` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

function DeptView({
  dept,
  onDept,
  plan,
  done,
  asOf,
  opening,
  selected,
  onOpen,
}: {
  dept: Dept;
  onDept: (dept: Dept) => void;
  plan: ReturnType<typeof schedule>;
  done: Record<string, string>;
  asOf: number;
  opening: number;
  selected: string | null;
  onOpen: (id: string) => void;
}) {
  const items = weekOf(PRODUCTION, plan, done, dept);
  return (
    <div>
      <div className={s.chips} role="tablist" aria-label="Department">
        {DEPTS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={dept === id}
            className={dept === id ? s.chipOn : s.chip}
            onClick={() => onDept(id)}
          >
            {DEPT_LABEL[id]}
          </button>
        ))}
      </div>
      <h3 className={s.deptHead}>
        What {DEPT_OWNER[dept]} needs this week
        <span className={s.deptSub}> — not the whole plan</span>
      </h3>
      {items.length === 0 ? (
        <p className={s.empty}>Nothing for this department in the next ten days.</p>
      ) : (
        <ul className={s.list}>
          {items.map((task) => {
            const row = plan.byId[task.id];
            return (
              <li key={task.id}>
                <button
                  type="button"
                  className={`${s.row} ${row.late || row.untilStart === 0 ? s.rowHot : ""} ${selected === task.id ? s.rowOn : ""}`}
                  onClick={() => onOpen(task.id)}
                >
                  <span className={s.rowTop}>
                    <span className={s.rowDept}>{task.kind === "event" ? "Booked" : task.owner}</span>
                    <span className={s.rowWhen}>
                      {task.kind === "event" && task.on
                        ? compactDate(dayNum(task.on))
                        : row.untilStart <= 0
                          ? "today"
                          : shortDate(row.ls)}
                    </span>
                  </span>
                  <span className={s.rowName}>{task.name}</span>
                  <span className={s.rowMeta}>
                    {task.wait > 0
                      ? `${String(task.wait)}-day lead · ${airWord(row.slack)}`
                      : airWord(row.slack)}
                  </span>
                  <Window
                    es={row.es}
                    ef={row.ef}
                    ls={row.ls}
                    lf={row.lf}
                    wait={task.wait}
                    asOf={asOf}
                    opening={opening}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Depends({
  task,
  plan,
  tasks,
  done,
  onOpen,
}: {
  task: Task;
  plan: ReturnType<typeof schedule>;
  tasks: Record<string, Task>;
  done: Record<string, string>;
  onOpen: (id: string) => void;
}) {
  const waiting = task.depends.filter((id) => !done[id]);
  const holding = (plan.successors[task.id] ?? []).filter((id) => !done[id]);
  if (!waiting.length && !holding.length) return null;
  return (
    <div className={s.deps}>
      {waiting.length > 0 && (
        <div>
          <p className={s.depsLabel}>Waiting on</p>
          <ul>
            {waiting.map((id) => (
              <li key={id}>
                <button type="button" className={s.dep} onClick={() => onOpen(id)}>
                  {tasks[id]?.name ?? id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {holding.length > 0 && (
        <div>
          <p className={s.depsLabel}>Holds</p>
          <ul>
            {holding.map((id) => (
              <li key={id}>
                <button type="button" className={s.dep} onClick={() => onOpen(id)}>
                  {tasks[id]?.name ?? id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
