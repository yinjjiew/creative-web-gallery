"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BUDGET_LEFT,
  CABINETS,
  CHEM,
  CHEMICALS,
  PRACTICALS,
  TECHNICIAN,
  TODAY,
} from "./data";
import {
  auditLine,
  bottleOf,
  clear,
  demand,
  fearOf,
  incomingVolume,
  issueBottle,
  load,
  placeBottle,
  raiseOrder,
  save,
  seed,
  spentOnOrders,
} from "./model";
import {
  amountLabel,
  cabinetFill,
  formatDay,
  formatShort,
  matrixCell,
  peroxideOverdue,
} from "./rules";
import { GROUP_LABEL, GROUP_SHORT, GROUPS, SOURCES } from "./sources";
import s from "./stockroom.module.css";
import type {
  AuditEvent,
  Bottle,
  CompatGroup,
  Persist,
  Refusal,
  SourceId,
} from "./types";

type Panel = "store" | "time" | "law";

function capLabel(liquid: boolean, n: number): string {
  if (liquid) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)} L` : `${Math.round(n)} mL`;
  }
  return n >= 1000 ? `${(n / 1000).toFixed(2)} kg` : `${Math.round(n)} g`;
}

function sound(kind: "ok" | "no") {
  const ctx = new AudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  if (kind === "ok") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, t);
    osc.frequency.exponentialRampToValueAtTime(98, t + 0.14);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.2);
  } else {
    osc.type = "square";
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.setValueAtTime(98, t + 0.05);
    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.14);
  }
  osc.onended = () => void ctx.close();
}

function prefersQuiet(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function App() {
  const [state, setState] = useState<Persist>(seed);
  const [booted, setBooted] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("store");
  const [focusCab, setFocusCab] = useState("O1");
  const [openPrac, setOpenPrac] = useState<string | null>("ch2002-p4");
  const [pair, setPair] = useState<[CompatGroup, CompatGroup] | null>([
    "flammable",
    "oxidizer",
  ]);
  const [sourceOpen, setSourceOpen] = useState<SourceId | null>(null);
  const [live, setLive] = useState(
    "Diethyl ether is on the bench. Put it in a cabinet — oxidizers will refuse it.",
  );
  const [note, setNote] = useState<string | null>(null);
  const armed = useRef(false);

  useEffect(() => {
    const stored = load();
    if (stored) setState(stored);
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    save(state);
  }, [booted, state]);

  const held = bottleOf(state.bottles, state.heldId);
  const heldChem = held ? CHEM[held.chemicalId] : null;
  const rows = useMemo(
    () => demand(state.bottles, state.tested),
    [state.bottles, state.tested],
  );
  const fear = useMemo(() => fearOf(rows), [rows]);
  const receiving = state.bottles.filter(
    (b) => b.state === "receiving" && b.id !== state.heldId,
  );
  const overdue = state.bottles.filter(
    (b) =>
      (b.state === "stored" || b.state === "quarantine") &&
      peroxideOverdue(b, TODAY, state.tested),
  );

  const bang = useCallback((kind: "ok" | "no") => {
    if (!armed.current || prefersQuiet()) return;
    try {
      sound(kind);
    } catch {
      /* ignore */
    }
  }, []);

  const arm = useCallback(() => {
    armed.current = true;
  }, []);

  const pick = useCallback(
    (bottle: Bottle) => {
      arm();
      setRefusal(null);
      setNote(null);
      setState((prev) => {
        let bottles = prev.bottles;
        if (prev.heldId && prev.origin) {
          const origin = prev.origin;
          bottles = bottles.map((b) =>
            b.id === prev.heldId
              ? { ...b, cabinetId: origin.cabinetId, state: origin.state }
              : b,
          );
        }
        const current = bottles.find((b) => b.id === bottle.id);
        if (!current || current.state === "issued") return prev;
        return {
          ...prev,
          bottles: bottles.map((b) =>
            b.id === bottle.id ? { ...b, cabinetId: null } : b,
          ),
          heldId: bottle.id,
          origin: {
            bottleId: bottle.id,
            cabinetId: current.cabinetId,
            state: current.state,
          },
        };
      });
      setLive(`${CHEM[bottle.chemicalId].name} lot ${bottle.lot} in hand.`);
    },
    [arm],
  );

  const putBack = useCallback(() => {
    arm();
    setState((prev) => {
      if (!prev.heldId || !prev.origin) return prev;
      const origin = prev.origin;
      return {
        ...prev,
        bottles: prev.bottles.map((b) =>
          b.id === prev.heldId
            ? { ...b, cabinetId: origin.cabinetId, state: origin.state }
            : b,
        ),
        heldId: null,
        origin: null,
      };
    });
    setRefusal(null);
    setLive("Bottle returned.");
  }, [arm]);

  const place = useCallback(
    (cabinetId: string) => {
      arm();
      setFocusCab(cabinetId);
      if (!state.heldId || !held) return;
      const { bottles, refusal: why } = placeBottle(
        state.bottles,
        state.heldId,
        cabinetId,
      );
      if (why) {
        setRefusal(why);
        setShake(cabinetId);
        bang("no");
        setLive(`Refused: ${why.title}`);
        window.setTimeout(() => {
          setShake((id) => (id === cabinetId ? null : id));
        }, 420);
        return;
      }
      const chem = CHEM[held.chemicalId];
      const events: AuditEvent[] = [];
      if (chem.controlled) {
        events.push(
          auditLine(
            state.origin?.state === "receiving" ? "receive" : "move",
            { ...held, cabinetId },
            state.origin?.cabinetId ?? "bench",
            cabinetId,
            chem.controlled.regime === "273/2004"
              ? `Drug precursor ${chem.controlled.category}`
              : `EPP ${chem.controlled.category}`,
          ),
        );
      }
      setState((prev) => ({
        ...prev,
        bottles,
        heldId: null,
        origin: null,
        audit: [...prev.audit, ...events],
      }));
      setRefusal(null);
      bang("ok");
      setLive(`${chem.name} stored in ${cabinetId}.`);
    },
    [arm, bang, held, state.bottles, state.heldId, state.origin],
  );

  function quarantine(bottle: Bottle) {
    arm();
    setState((prev) => ({
      ...prev,
      bottles: prev.bottles.map((b) =>
        b.id === bottle.id ? { ...b, state: "quarantine" as const } : b,
      ),
      audit: [
        ...prev.audit,
        auditLine(
          "quarantine",
          bottle,
          bottle.cabinetId ?? "bench",
          "quarantine",
          "Peroxide former overdue",
        ),
      ],
      heldId: prev.heldId === bottle.id ? null : prev.heldId,
      origin: prev.heldId === bottle.id ? null : prev.origin,
    }));
    setLive(
      `${CHEM[bottle.chemicalId].name} quarantined. It still occupies the cabinet.`,
    );
  }

  function logTest(bottle: Bottle) {
    arm();
    setState((prev) => ({
      ...prev,
      tested: { ...prev.tested, [bottle.id]: TODAY },
      audit: [
        ...prev.audit,
        auditLine(
          "test",
          bottle,
          bottle.cabinetId ?? "bench",
          bottle.cabinetId ?? "bench",
          "Peroxide strip test logged",
        ),
      ],
    }));
    setLive(`Peroxide test logged for lot ${bottle.lot}.`);
  }

  function sendOut(bottle: Bottle) {
    arm();
    const fromState = state.origin?.state ?? bottle.state;
    const toIssue: Bottle = { ...bottle, state: fromState };
    const result = issueBottle(
      state.bottles.map((b) => (b.id === bottle.id ? toIssue : b)),
      bottle.id,
      openPrac,
      TODAY,
      state.tested,
    );
    if (result.error) {
      setNote(result.error);
      bang("no");
      setLive(result.error);
      return;
    }
    const chem = CHEM[bottle.chemicalId];
    const dest = result.dest ?? "class store";
    setState((prev) => ({
      ...prev,
      bottles: result.bottles,
      heldId: prev.heldId === bottle.id ? null : prev.heldId,
      origin: prev.heldId === bottle.id ? null : prev.origin,
      audit: [
        ...prev.audit,
        auditLine("issue", bottle, bottle.cabinetId ?? "bench", dest, dest),
      ],
    }));
    bang("ok");
    setLive(`${chem.name} issued to ${dest}. Cabinet space freed.`);
  }

  function order(chemicalId: string) {
    arm();
    const already = state.orders.find(
      (o) => o.chemicalId === chemicalId && o.status === "raised",
    );
    if (already) {
      setNote("That order is already on the book.");
      return;
    }
    const { order: next, note: why } = raiseOrder(
      chemicalId,
      state.bottles,
      state.orders,
    );
    setState((prev) => ({
      ...prev,
      orders: [
        ...prev.orders.filter(
          (o) => !(o.chemicalId === chemicalId && o.status !== "raised"),
        ),
        next,
      ],
      audit:
        next.status === "raised"
          ? [
              ...prev.audit,
              {
                id: `ord-${next.id}`,
                at: `${TODAY}T09:10:00Z`,
                chemicalId,
                bottleId: null,
                amount: incomingVolume(chemicalId, next.packs),
                unit: CHEM[chemicalId].liquid ? "mL" : "g",
                kind: "order" as const,
                from: "purchase",
                to: "on order",
                by: TECHNICIAN,
                purpose: why,
              },
            ]
          : prev.audit,
    }));
    setNote(why);
    if (next.status !== "raised") bang("no");
    else bang("ok");
    setLive(why);
  }

  function reset() {
    arm();
    clear();
    setState(seed());
    setRefusal(null);
    setNote(null);
    setLive("Store reset. Ether is on the bench.");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        putBack();
        return;
      }
      if (event.key === "1") setPanel("store");
      if (event.key === "2") setPanel("time");
      if (event.key === "3") setPanel("law");
      if (!state.heldId) return;
      const i = CABINETS.findIndex((c) => c.id === focusCab);
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocusCab(CABINETS[(i + 1) % CABINETS.length].id);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocusCab(CABINETS[(i - 1 + CABINETS.length) % CABINETS.length].id);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        place(focusCab);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusCab, place, putBack, state.heldId]);

  const budgetLeft = BUDGET_LEFT - spentOnOrders(state.orders);
  const heldGroup = heldChem?.group ?? null;
  const glass = {
    amber: s.gAmber,
    clear: s.gClear,
    white: s.gWhite,
    dark: s.gDark,
  };

  return (
    <div className={s.shell}>
      <Link className={s.escape} href="/tasks/practical-apps-inventory">
        Task
      </Link>

      <p className={s.live} aria-live="polite">
        {live}
      </p>

      <header className={s.mast}>
        <p className={s.dept}>Department of Chemistry · Teaching Stores</p>
        <h1 className={s.title}>Stockroom</h1>
        <p className={s.when}>
          <time dateTime={TODAY} className={s.date}>
            {formatDay(TODAY)}
          </time>
          <span className={s.who}>{TECHNICIAN}</span>
        </p>
        <p className={s.ask}>Which afternoon will run dry?</p>
        <p className={s.fear}>
          {fear
            ? fear.line
            : "Every upcoming practical is covered, if nothing is issued twice."}
        </p>
      </header>

      <div className={s.tabs} role="tablist" aria-label="Store views">
        <button
          type="button"
          role="tab"
          aria-selected={panel === "store"}
          className={s.tab}
          onClick={() => setPanel("store")}
        >
          Store
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={panel === "time"}
          className={s.tab}
          onClick={() => setPanel("time")}
        >
          Timetable
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={panel === "law"}
          className={s.tab}
          onClick={() => setPanel("law")}
        >
          Matrix
        </button>
      </div>

      <div className={s.layout}>
        <section
          className={panel === "store" ? s.show : s.hide}
          aria-label="Cabinets"
        >
          <Bench
            held={held}
            receiving={receiving}
            onPick={pick}
            onCancel={putBack}
            refusal={refusal}
            onSource={setSourceOpen}
          />

          {held && (
            <div className={s.quick} role="group" aria-label="Place the bottle">
              {CABINETS.map((cab) => {
                const would = placeBottle(state.bottles, held.id, cab.id).refusal;
                return (
                  <button
                    key={cab.id}
                    type="button"
                    className={`${s.quickBtn} ${would ? s.quickNo : s.quickYes}`}
                    onClick={() => place(cab.id)}
                  >
                    <span className={s.quickPlate}>{cab.plate}</span>
                    <span className={s.quickWord}>{would ? "refuse" : "take"}</span>
                  </button>
                );
              })}
            </div>
          )}

          {overdue.length > 0 && (
            <div className={s.warn}>
              <p className={s.warnTitle}>
                Peroxide formers past the opened interval
              </p>
              {overdue.map((b) => {
                const c = CHEM[b.chemicalId];
                return (
                  <div key={b.id} className={s.warnRow}>
                    <p>
                      <strong>{c.name}</strong> lot {b.lot}
                      {b.state === "quarantine"
                        ? " — quarantined"
                        : " — not counted as stock"}
                      . Kelly (1996) Group {c.peroxide?.kellyGroup}. The{" "}
                      {c.peroxide?.testDays}-day interval is{" "}
                      <button
                        type="button"
                        className={s.inline}
                        onClick={() => setSourceOpen("departmental")}
                      >
                        departmental
                      </button>
                      , not a statutory limit.
                    </p>
                    {b.state !== "quarantine" && (
                      <div className={s.warnActs}>
                        <button
                          type="button"
                          className={s.act}
                          onClick={() => logTest(b)}
                        >
                          Log test
                        </button>
                        <button
                          type="button"
                          className={s.actDanger}
                          onClick={() => quarantine(b)}
                        >
                          Quarantine
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <ol className={s.bays}>
            {CABINETS.map((cab) => {
              const fill = cabinetFill(cab.id, state.bottles);
              const items = state.bottles.filter(
                (b) =>
                  b.cabinetId === cab.id &&
                  (b.state === "stored" || b.state === "quarantine"),
              );
              const would = held
                ? placeBottle(state.bottles, held.id, cab.id).refusal
                : null;
              return (
                <li key={cab.id}>
                  <article
                    className={[
                      s.cab,
                      shake === cab.id ? s.cabShake : "",
                      focusCab === cab.id ? s.cabFocus : "",
                      held && would ? s.cabNo : "",
                      held && !would ? s.cabYes : "",
                    ].join(" ")}
                    style={{ ["--stripe" as string]: cab.stripe }}
                  >
                    <button
                      type="button"
                      className={s.cabHit}
                      onClick={() => place(cab.id)}
                      onFocus={() => setFocusCab(cab.id)}
                      aria-label={`${cab.plate} ${cab.name}. ${
                        held
                          ? would
                            ? `Refuse: ${would.title}`
                            : "Place here"
                          : "Select"
                      }`}
                    >
                      <span className={s.cabPlate}>{cab.plate}</span>
                      <span className={s.cabName}>{cab.name}</span>
                      <span className={s.cabFill} aria-hidden="true">
                        <span
                          className={s.cabBar}
                          style={{
                            width: `${Math.min(100, (fill / cab.capacity) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className={s.cabCap}>
                        {capLabel(cab.liquid, fill)} /{" "}
                        {capLabel(cab.liquid, cab.capacity)}
                      </span>
                      {held && (
                        <span className={s.cabHint}>
                          {would ? "Refuse" : "Will take"}
                        </span>
                      )}
                    </button>
                    <ul className={s.slots}>
                      {items.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            className={[
                              s.vial,
                              glass[CHEM[b.chemicalId].glass],
                              b.state === "quarantine" ? s.vialQ : "",
                              peroxideOverdue(b, TODAY, state.tested)
                                ? s.vialOld
                                : "",
                            ].join(" ")}
                            onClick={() => pick(b)}
                          >
                            <span className={s.vialName}>
                              {CHEM[b.chemicalId].name}
                            </span>
                            <span className={s.vialLot}>{b.lot}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ol>
          <p className={s.hint}>
            Ether is already in hand. Tap a cabinet to store it — incompatibles
            and over-capacity are refused, not advised. Arrow keys then Enter;
            Escape puts it back.
          </p>
        </section>

        <aside className={s.side}>
          <section
            className={panel === "time" ? s.show : s.sideBlock}
            aria-label="Teaching timetable"
          >
            <h2 className={s.h2}>Demand from the timetable</h2>
            <p className={s.lede}>
              Eleven courses, always in this order. Consumption is constructed
              for this store — not a real department&apos;s published schedule
              — but it is not a statistical forecast.{" "}
              <button
                type="button"
                className={s.inline}
                onClick={() => setSourceOpen("departmental")}
              >
                Unverified
              </button>
              .
            </p>
            <ol className={s.times}>
              {PRACTICALS.filter((p) => p.date >= TODAY).map((p) => {
                const mine = rows.filter((r) => r.practical.id === p.id);
                const worst =
                  mine.find((r) => r.status === "late") ??
                  mine.find((r) => r.status === "order");
                const open = openPrac === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`${s.prac} ${worst ? s.pracHot : ""}`}
                      onClick={() => setOpenPrac(open ? null : p.id)}
                      aria-expanded={open}
                    >
                      <span className={s.pracDate}>{formatShort(p.date)}</span>
                      <span className={s.pracCode}>{p.course}</span>
                      <span className={s.pracTitle}>{p.title}</span>
                      <span className={s.pracN}>{p.students}</span>
                    </button>
                    {open && (
                      <div className={s.pracBody}>
                        {mine.map((r) => {
                          const c = CHEM[r.chemicalId];
                          return (
                            <div key={r.chemicalId} className={s.need}>
                              <p>
                                <strong>{c.name}</strong>{" "}
                                {amountLabel(c.id, r.need)}
                                {" · "}stock {amountLabel(c.id, r.stock)}
                                {r.reserved > 0
                                  ? ` · reserved ${amountLabel(c.id, r.reserved)}`
                                  : ""}
                                {r.short > 0
                                  ? ` · short ${amountLabel(c.id, r.short)}`
                                  : " · covered"}
                              </p>
                              <p className={s.needMeta}>
                                Lead {r.leadDays} d · order by{" "}
                                {formatShort(r.orderBy)}
                                {c.controlled
                                  ? ` · ${c.controlled.regime} ${c.controlled.category}`
                                  : ""}
                              </p>
                              {r.short > 0 && (
                                <button
                                  type="button"
                                  className={s.act}
                                  onClick={() => order(c.id)}
                                >
                                  Order {c.moqPacks} ×{" "}
                                  {amountLabel(c.id, c.packSize)}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className={s.budget}>
              <p>
                Teaching-chemicals line: £{budgetLeft} of £{BUDGET_LEFT} still
                uncommitted. Financial year ends 31 March 2027; the academic
                year has not begun.{" "}
                <button
                  type="button"
                  className={s.inline}
                  onClick={() => setSourceOpen("departmental")}
                >
                  Unverified budget
                </button>
                .
              </p>
              {state.orders.length > 0 && (
                <ul className={s.orders}>
                  {state.orders.map((o) => (
                    <li key={o.id}>
                      {CHEM[o.chemicalId].name} · {o.packs} packs · {o.status}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {note && <p className={s.note}>{note}</p>}
          </section>

          <section
            className={panel === "law" ? s.show : s.sideBlock}
            aria-label="Compatibility matrix"
          >
            <h2 className={s.h2}>Compatibility is a matrix</h2>
            <p className={s.lede}>
              Oxide-red cells are refused.{" "}
              <button
                type="button"
                className={s.inline}
                onClick={() => setSourceOpen("epa-600")}
              >
                EPA-600/2-80-076
              </button>{" "}
              and{" "}
              <button
                type="button"
                className={s.inline}
                onClick={() => setSourceOpen("prudent-2011")}
              >
                Prudent Practices, 2011
              </button>
              . No invented hazard rules.
            </p>
            <Matrix held={heldGroup} pair={pair} onPair={setPair} />
            {pair && <PairCite pair={pair} onSource={setSourceOpen} />}

            <h2 className={s.h2}>Controlled grams</h2>
            <p className={s.lede}>
              Precursors under{" "}
              <button
                type="button"
                className={s.inline}
                onClick={() => setSourceOpen("reg-273")}
              >
                273/2004
              </button>{" "}
              and{" "}
              <button
                type="button"
                className={s.inline}
                onClick={() => setSourceOpen("epp-2023")}
              >
                EPP 2023
              </button>
              . Every movement of those bottles is a line a regulator can
              reconstruct.
            </p>
            <ol className={s.ledger}>
              {[...state.audit]
                .filter((a) => CHEM[a.chemicalId]?.controlled)
                .reverse()
                .slice(0, 12)
                .map((a) => (
                  <li key={a.id}>
                    <span className={s.ledDate}>{a.at.slice(0, 10)}</span>
                    <span className={s.ledKind}>{a.kind}</span>
                    <span>
                      {CHEM[a.chemicalId].name} {a.amount} {a.unit} · {a.from} →{" "}
                      {a.to}
                    </span>
                  </li>
                ))}
            </ol>

            {held &&
              (held.state === "stored" ||
                state.origin?.state === "stored") && (
                <button
                  type="button"
                  className={s.act}
                  onClick={() => sendOut(held)}
                >
                  Issue {CHEM[held.chemicalId].name} to class store
                </button>
              )}
          </section>
        </aside>
      </div>

      {sourceOpen && (
        <div className={s.cite} role="dialog" aria-labelledby="cite-title">
          <p id="cite-title" className={s.citeMark}>
            {SOURCES[sourceOpen].verified
              ? "Published source"
              : "Unverified — departmental"}
          </p>
          <p className={s.citeBody}>{SOURCES[sourceOpen].full}</p>
          <button
            type="button"
            className={s.act}
            onClick={() => setSourceOpen(null)}
          >
            Close
          </button>
        </div>
      )}

      <footer className={s.foot}>
        <p>
          Teaching-critical subset — {CHEMICALS.length} reagents,{" "}
          {state.bottles.filter((b) => b.state !== "issued").length} containers
          on the floor of a store that holds about 1,400. Hazard classes from
          CLP Annex VI. Cabinet litre ratings, course dates and consumption are
          modelled.
        </p>
        <button type="button" className={s.reset} onClick={reset}>
          Reset store
        </button>
      </footer>
    </div>
  );
}

function PairCite({
  pair,
  onSource,
}: {
  pair: [CompatGroup, CompatGroup];
  onSource: (id: SourceId) => void;
}) {
  const cell = matrixCell(pair[0], pair[1]);
  return (
    <p className={s.pairWhy}>
      {GROUP_LABEL[pair[0]]} × {GROUP_LABEL[pair[1]]}: {cell.why}{" "}
      <button
        type="button"
        className={s.inline}
        onClick={() => onSource(cell.source)}
      >
        {SOURCES[cell.source].short}
      </button>
      {SOURCES[cell.source].verified ? "" : " — unverified"}
    </p>
  );
}

function Bench({
  held,
  receiving,
  onPick,
  onCancel,
  refusal,
  onSource,
}: {
  held: Bottle | undefined;
  receiving: Bottle[];
  onPick: (b: Bottle) => void;
  onCancel: () => void;
  refusal: Refusal | null;
  onSource: (id: SourceId) => void;
}) {
  return (
    <div className={s.bench}>
      <p className={s.benchLabel}>Receiving bench</p>
      {held ? (
        <div className={s.inHand}>
          <p className={s.inHandK}>In hand</p>
          <p className={s.inHandN}>{CHEM[held.chemicalId].name}</p>
          <p className={s.inHandM}>
            {amountLabel(held.chemicalId, held.remaining)} · lot {held.lot} · CAS{" "}
            {CHEM[held.chemicalId].cas}
          </p>
          <p className={s.inHandG}>
            {CHEM[held.chemicalId].ghs.join(" · ")}{" "}
            <button
              type="button"
              className={s.inline}
              onClick={() => onSource("clp-annex-vi")}
            >
              CLP Annex VI
            </button>
          </p>
          <button type="button" className={s.act} onClick={onCancel}>
            Put back
          </button>
        </div>
      ) : (
        <p className={s.benchEmpty}>
          Nothing in hand. Pick a bottle from a cabinet or the van.
        </p>
      )}
      {receiving.length > 0 && (
        <ul className={s.van}>
          {receiving.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className={s.vanBtn}
                onClick={() => onPick(b)}
              >
                Off the van: {CHEM[b.chemicalId].name}{" "}
                {amountLabel(b.chemicalId, b.remaining)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {refusal && (
        <div className={s.refuse} data-kind={refusal.kind}>
          <p className={s.refuseK}>Refused</p>
          <p className={s.refuseT}>{refusal.title}</p>
          <p className={s.refuseB}>{refusal.body}</p>
          <button
            type="button"
            className={s.inline}
            onClick={() => onSource(refusal.source)}
          >
            {SOURCES[refusal.source].short}
            {SOURCES[refusal.source].verified ? "" : " — unverified"}
          </button>
        </div>
      )}
    </div>
  );
}

function Matrix({
  held,
  pair,
  onPair,
}: {
  held: CompatGroup | null;
  pair: [CompatGroup, CompatGroup] | null;
  onPair: (p: [CompatGroup, CompatGroup]) => void;
}) {
  return (
    <div className={s.matrix} role="table" aria-label="Compatibility matrix">
      <div className={s.mxHead} role="row">
        <span className={s.mxCorner} />
        {GROUPS.map((g) => (
          <span
            key={g}
            className={`${s.mxH} ${held === g ? s.mxOn : ""}`}
            title={GROUP_LABEL[g]}
          >
            {GROUP_SHORT[g]}
          </span>
        ))}
      </div>
      {GROUPS.map((row) => (
        <div key={row} className={s.mxRow} role="row">
          <span className={`${s.mxH} ${held === row ? s.mxOn : ""}`}>
            {GROUP_SHORT[row]}
          </span>
          {GROUPS.map((col) => {
            const cell = matrixCell(row, col);
            const active = Boolean(pair && pair[0] === row && pair[1] === col);
            return (
              <button
                key={col}
                type="button"
                className={[
                  s.mxC,
                  cell.ok ? s.mxOk : s.mxBad,
                  active ? s.mxSel : "",
                  held === row || held === col ? s.mxHi : "",
                ].join(" ")}
                onClick={() => onPair([row, col])}
                aria-label={`${GROUP_LABEL[row]} and ${GROUP_LABEL[col]}: ${
                  cell.ok ? "allowed" : "refused"
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
