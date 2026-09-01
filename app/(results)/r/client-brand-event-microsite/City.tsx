"use client";

/**
 * The page is a Saturday (or Sunday) tape. The first door you add occupies
 * an hour. The next door is accepted only if travel, queue and closing time
 * still work. A clash is a hatched block and a sentence, not a toast.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BUILDING_BY_ID,
  BUILDINGS,
  DAY_END,
  DAY_START,
  DISTRICTS,
  TALKS,
  TALK_BY_ID,
  WEEKEND,
  bookingLabel,
  calibreLabel,
  fmt,
  hoursOn,
  type Building,
  type DayId,
} from "./data";
import { evaluate, proposeAdd, proposeTalk, type Fit, type Proposal } from "./schedule";
import s from "./city.module.css";

const STORE = "opencity-tape-v1";
const HOURS = Array.from({ length: 10 }, (_, i) => DAY_START + i * 60);
const HOUR_PX = 56;

type Banner = {
  tone: "rewrite" | "refuse";
  text: string;
  suggestDay?: DayId;
};

type Saved = {
  day: DayId;
  clock: number;
  here: string | null;
  inQueue: boolean;
  buildings: string[];
  talks: string[];
};

function load(): Partial<Saved> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    return {};
  }
}

function tapeCopy(
  day: DayId,
  clock: number,
  here: string | null,
  inQueue: boolean,
  fit: Fit,
): string {
  const dayName = day === "sat" ? "Saturday 13 September" : "Sunday 14 September";
  const lines = [`OPEN CITY  ${dayName}`, `It is ${fmt(clock)}`];
  if (here && inQueue) {
    lines.push(`In the queue at ${BUILDING_BY_ID[here]?.name ?? here}`);
  }
  lines.push("");
  for (const item of fit.items) {
    if (item.kind === "travel") {
      lines.push(`${fmt(item.start)}–${fmt(item.end)}  ${item.travelMin ?? 0} min between doors`);
    } else if (item.kind === "talk") {
      const t = TALK_BY_ID[item.id];
      lines.push(`${fmt(item.start)}–${fmt(item.end)}  TALK  ${t?.title ?? item.id}`);
    } else {
      const b = BUILDING_BY_ID[item.id];
      const q = item.queueMin ? `  queue ${item.queueMin}m` : "";
      lines.push(`${fmt(item.start)}–${fmt(item.end)}  ${b?.name ?? item.id}${q}`);
      if (b) {
        lines.push(`         ${b.access.summary}`);
        if (b.booking !== "none") lines.push(`         ${bookingLabel(b.booking)}`);
      }
    }
  }
  if (fit.clash) {
    lines.push("");
    lines.push(`WILL NOT  ${fit.clash.message}`);
  }
  lines.push("");
  lines.push("Modelled weekend — not the official programme. Walks and queues are authored.");
  return lines.join("\n");
}

function click(ctx: AudioContext, refuse: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = refuse ? "triangle" : "sine";
  osc.frequency.value = refuse ? 140 : 420;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(refuse ? 0.06 : 0.04, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (refuse ? 0.18 : 0.09));
  osc.start(now);
  osc.stop(now + 0.2);
}

export default function City() {
  const saved = useRef<Partial<Saved> | null>(null);
  if (saved.current === null) saved.current = load();

  const [day, setDay] = useState<DayId>(saved.current.day ?? "sat");
  const [clock, setClock] = useState(saved.current.clock ?? 10 * 60);
  const [here, setHere] = useState<string | null>(saved.current.here ?? null);
  const [inQueue, setInQueue] = useState(saved.current.inQueue ?? false);
  const [buildings, setBuildings] = useState<string[]>(saved.current.buildings ?? []);
  const [talks, setTalks] = useState<string[]>(saved.current.talks ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [ghostFit, setGhostFit] = useState<Fit | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORE,
        JSON.stringify({ day, clock, here, inQueue, buildings, talks } satisfies Saved),
      );
    } catch {
      /* private mode */
    }
  }, [day, clock, here, inQueue, buildings, talks]);

  const fit = useMemo(
    () => evaluate(buildings, talks, day, clock, here, inQueue),
    [buildings, talks, day, clock, here, inQueue],
  );

  const shown = ghostFit ?? fit;

  const sound = useCallback((refuse: boolean) => {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!audioRef.current) audioRef.current = new AC();
    const ctx = audioRef.current;
    void ctx.resume();
    click(ctx, refuse);
  }, []);

  const apply = useCallback(
    (next: string[], proposal: Proposal) => {
      if (proposal.type === "ok") {
        setBuildings(proposal.buildings);
        setGhostFit(null);
        setBanner(null);
        sound(false);
        if (!selected) setSelected(proposal.buildings[proposal.buildings.length - 1] ?? null);
        return;
      }
      if (proposal.type === "rewrite") {
        setBuildings(proposal.buildings);
        setGhostFit(null);
        setBanner({ tone: "rewrite", text: proposal.reason });
        sound(false);
        return;
      }
      setGhostFit(proposal.fit);
      setBanner({
        tone: "refuse",
        text: proposal.reason,
        suggestDay: proposal.suggestDay,
      });
      sound(true);
      void next;
    },
    [selected, sound],
  );

  const addDoor = useCallback(
    (id: string) => {
      if (buildings.includes(id)) {
        setBuildings(buildings.filter((x) => x !== id));
        if (here === id) {
          setHere(null);
          setInQueue(false);
        }
        if (selected === id) setSelected(null);
        setBanner(null);
        setGhostFit(null);
        sound(false);
        return;
      }
      const proposal = proposeAdd(buildings, id, talks, day, clock, here, inQueue);
      apply(buildings, proposal);
      setSelected(id);
    },
    [apply, buildings, clock, day, here, inQueue, selected, sound, talks],
  );

  const addTalk = useCallback(
    (id: string) => {
      const t = TALK_BY_ID[id];
      if (!t) return;
      if (talks.includes(id)) {
        setTalks(talks.filter((x) => x !== id));
        setBanner(null);
        setGhostFit(null);
        sound(false);
        return;
      }
      if (t.day !== day) {
        setBanner({
          tone: "refuse",
          text: `“${t.title}” is ${t.day === "sat" ? "Saturday" : "Sunday"} only.`,
          suggestDay: t.day,
        });
        sound(true);
        return;
      }
      const proposal = proposeTalk(buildings, talks, id, day, clock, here, inQueue);
      if (proposal.type === "ok") {
        setTalks([...talks, id]);
        setBanner(null);
        setGhostFit(null);
        sound(false);
        return;
      }
      setGhostFit(proposal.fit);
      setBanner({ tone: "refuse", text: proposal.reason, suggestDay: proposal.suggestDay });
      sound(true);
    },
    [buildings, clock, day, here, inQueue, sound, talks],
  );

  const starters: Building[] = ["pumps", "bunker", "carradale", "asylum"].map(
    (id) => BUILDING_BY_ID[id],
  );
  const rest = BUILDINGS.filter((b) => !starters.some((s) => s.id === b.id));

  const ranked = useMemo(() => {
    const pool = buildings.length === 0 ? starters : BUILDINGS;
    const yes: typeof BUILDINGS = [];
    const no: { id: string; reason: string }[] = [];
    for (const b of pool) {
      if (buildings.includes(b.id)) continue;
      const trial = evaluate([...buildings, b.id], talks, day, clock, here, inQueue);
      if (trial.ok) yes.push(b);
      else no.push({ id: b.id, reason: trial.clash?.message ?? "Will not fit." });
    }
    yes.sort((a, b) => {
      const rank = (c: typeof a.calibre) => (c === "extraordinary" ? 0 : c === "hour" ? 1 : 2);
      return rank(a.calibre) - rank(b.calibre);
    });
    return { yes, no };
  }, [buildings, clock, day, here, inQueue, starters, talks]);

  const empty = buildings.length === 0 && talks.length === 0;
  const selectedBuilding = selected ? BUILDING_BY_ID[selected] : null;
  const itinerary = tapeCopy(day, clock, here, inQueue, fit);
  const tapeH = HOURS.length * HOUR_PX;
  const nowTop = ((clock - DAY_START) / 60) * HOUR_PX;

  const switchDay = useCallback(
    (next: DayId) => {
      setDay(next);
      setGhostFit(null);
      const keep: string[] = [];
      const dropped: string[] = [];
      for (const id of buildings) {
        const trial = evaluate([...keep, id], talks, next, clock, here, inQueue);
        if (trial.ok) keep.push(id);
        else dropped.push(id);
      }
      setBuildings(keep);
      const talkKeep = talks.filter((id) => TALK_BY_ID[id]?.day === next);
      const talkDrop = talks.filter((id) => TALK_BY_ID[id] && TALK_BY_ID[id].day !== next);
      setTalks(talkKeep);
      if (dropped.length || talkDrop.length) {
        const names = [
          ...dropped.map((id) => BUILDING_BY_ID[id]?.name),
          ...talkDrop.map((id) => TALK_BY_ID[id]?.title),
        ]
          .filter(Boolean)
          .join("; ");
        setBanner({
          tone: "rewrite",
          text: `Moved to ${next === "sat" ? "Saturday" : "Sunday"}. Came off the tape: ${names}.`,
        });
      } else {
        setBanner(null);
      }
    },
    [buildings, clock, here, inQueue, talks],
  );

  useEffect(() => {
    if (!banner || !liveRef.current) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    liveRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [banner]);

  useEffect(() => {
    if (ghostFit) return;
    const current = evaluate(buildings, talks, day, clock, here, inQueue);
    if (current.ok || buildings.length === 0) return;
    const keep: string[] = [];
    for (const id of buildings) {
      const trial = evaluate([...keep, id], talks, day, clock, here, inQueue);
      if (trial.ok) keep.push(id);
      else break;
    }
    if (keep.length === buildings.length) return;
    const dropped = buildings.slice(keep.length);
    setBuildings(keep);
    setBanner({
      tone: "rewrite",
      text: `It is ${fmt(clock)}. Came off the tape: ${dropped
        .map((id) => BUILDING_BY_ID[id]?.name)
        .filter(Boolean)
        .join("; ")}.`,
    });
  }, [buildings, clock, day, ghostFit, here, inQueue, talks]);

  function top(min: number) {
    return ((Math.max(DAY_START, Math.min(DAY_END, min)) - DAY_START) / 60) * HOUR_PX;
  }

  return (
    <div className={s.root}>
      <a className={s.skip} href="#tape">
        Skip to the tape
      </a>

      <header className={s.mast}>
        <p className={s.word}>
          Open City
          <em>{WEEKEND}</em>
        </p>
        <h1 className={s.lede}>One weekend. Get inside.</h1>
        <p className={s.note}>
          A hundred and eighty doors open. Most people see four. The failure is
          arriving at four for a building that closes at five after a walk that
          took forty minutes. This is a tape, not a list. Times, walks and
          queues are modelled so a clash can be honest.
        </p>
        <div className={s.days} role="group" aria-label="Which day">
          <button type="button" aria-pressed={day === "sat"} onClick={() => switchDay("sat")}>
            Saturday
          </button>
          <button type="button" aria-pressed={day === "sun"} onClick={() => switchDay("sun")}>
            Sunday
          </button>
        </div>
      </header>

      <div className={s.clock}>
        <span className={s.clockNow} aria-live="polite">
          {fmt(clock)}
        </span>
        <input
          type="range"
          min={DAY_START}
          max={DAY_END}
          step={5}
          value={clock}
          aria-label="It is this time"
          onChange={(e) => {
            setClock(Number(e.target.value));
            setGhostFit(null);
          }}
        />
        <button
          type="button"
          aria-label="Ten minutes earlier"
          onClick={() => {
            setClock((c) => Math.max(DAY_START, c - 10));
            setGhostFit(null);
          }}
        >
          −10
        </button>
        <button
          type="button"
          aria-label="Ten minutes later"
          onClick={() => {
            setClock((c) => Math.min(DAY_END, c + 10));
            setGhostFit(null);
          }}
        >
          +10
        </button>
      </div>

      <div className={s.queueRow}>
        <button
          type="button"
          className={s.queueBtn}
          aria-pressed={inQueue}
          disabled={!here}
          onClick={() => {
            setInQueue((v) => !v);
            setGhostFit(null);
          }}
        >
          {inQueue ? "In the queue" : "I'm in a queue"}
        </button>
        <label className={s.hereLabel}>
          Here
          <select
            value={here ?? ""}
            aria-label="Where you are standing"
            onChange={(e) => {
              const v = e.target.value || null;
              setHere(v);
              if (!v) setInQueue(false);
              setGhostFit(null);
            }}
          >
            <option value="">Not yet inside</option>
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={s.live} aria-live="assertive" ref={liveRef}>
        {banner ? (
          <div className={s.banner} data-tone={banner.tone}>
            <strong>{banner.tone === "refuse" ? "Will not fit" : "Rewritten"}</strong>
            <p>{banner.text}</p>
            <div className={s.bannerActs}>
              {banner.suggestDay ? (
                <button type="button" className={s.daySwitch} onClick={() => switchDay(banner.suggestDay!)}>
                  Switch to {banner.suggestDay === "sat" ? "Saturday" : "Sunday"}
                </button>
              ) : null}
              <button
                type="button"
                className={s.act}
                onClick={() => {
                  setBanner(null);
                  setGhostFit(null);
                }}
              >
                Keep this day
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={s.shell}>
        <div>
          {empty ? (
            <section className={s.section} aria-labelledby="put-on" id="tape">
              <h2 id="put-on">Put a first door on the tape</h2>
              <p className={s.hint}>
                The first tap occupies the morning. Extraordinary first — a
                first-time visitor cannot tell which doors matter. One of these
                is Sunday only; the tape will refuse it today.
              </p>
              <div className={s.doors}>
                {starters.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={s.door}
                    data-calibre={b.calibre}
                    aria-pressed={false}
                    onClick={() => addDoor(b.id)}
                  >
                    <span className={s.doorKind}>
                      {calibreLabel(b.calibre)} · {DISTRICTS[b.district]}
                    </span>
                    <span className={s.doorName}>{b.name}</span>
                    <span className={s.doorMeta}>
                      {dayHours(b.id, day)} · {b.access.stepFree ? "Step-free" : "Not step-free"} ·{" "}
                      {bookingLabel(b.booking)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section id={empty ? "tape-later" : "tape"} className={s.tapeWrap} aria-label="The day's tape" hidden={empty && !shown.ghost}>
            <p className={s.tapeLabel}>
              {day === "sat" ? "Saturday" : "Sunday"} tape
              {buildings.length === 0 ? " — empty. Put a door on it." : ` — ${buildings.length} door${buildings.length === 1 ? "" : "s"}`}
            </p>
            <div className={s.tape} style={{ height: tapeH }}>
              {HOURS.map((h) => (
                <div key={h} className={s.hour}>
                  <span className={s.hourTime}>{fmt(h)}</span>
                  <span className={s.hourLane} />
                </div>
              ))}
              <div className={s.now} style={{ top: nowTop }} aria-hidden="true" />
              <div className={s.blocks}>
                {shown.items.map((item) => {
                  const t0 = top(item.start);
                  const t1 = top(item.end);
                  const h = Math.max(22, t1 - t0);
                  if (item.kind === "travel") {
                    return (
                      <div
                        key={`${item.id}-${item.start}`}
                        className={`${s.block} ${s.blockTravel}`}
                        style={{ top: t0, height: h }}
                      >
                        {item.travelMin} min between doors
                      </div>
                    );
                  }
                  if (item.kind === "talk") {
                    const t = TALK_BY_ID[item.id];
                    return (
                      <div
                        key={item.id}
                        className={s.block}
                        style={{ top: t0, height: h }}
                      >
                        <div className={s.blockName}>{t?.title}</div>
                        <div className={s.blockMeta}>Talk · book · {fmt(item.start)}</div>
                      </div>
                    );
                  }
                  const b = BUILDING_BY_ID[item.id];
                  const isNow = here === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`${s.block} ${isNow ? s.blockNow : ""}`}
                      style={{ top: t0, height: h }}
                    >
                      <button type="button" className={s.stopBtn} onClick={() => setSelected(item.id)}>
                        <div className={s.blockName}>{b?.name}</div>
                        <div className={s.blockMeta}>
                          {fmt(item.start)}–{fmt(item.end)}
                          {item.queueMin ? ` · queue ${item.queueMin}m` : ""}
                          {item.waitMin ? ` · waits to open` : ""}
                        </div>
                      </button>
                    </div>
                  );
                })}
                {shown.ghost ? (
                  <div
                    className={`${s.block} ${s.blockGhost}`}
                    style={{
                      top: top(shown.ghost.start),
                      height: Math.max(36, top(shown.ghost.end) - top(shown.ghost.start)),
                    }}
                  >
                    <div className={s.blockName}>
                      {BUILDING_BY_ID[shown.ghost.id]?.name ?? "Will not fit"}
                    </div>
                    <div className={s.blockMeta}>Clash — not on the tape</div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {empty ? null : (
          <section className={s.section} aria-labelledby="still-fits">
            <h2 id="still-fits">Still fits from here</h2>
            <p className={s.hint}>
              Only what still works after travel and the queue. A door that will
              not fit is listed so you can see why.
            </p>
            <div className={s.doors}>
              {ranked.yes.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={s.door}
                  data-calibre={b.calibre}
                  aria-pressed={buildings.includes(b.id)}
                  onClick={() => addDoor(b.id)}
                >
                  <span className={s.doorKind}>
                    {calibreLabel(b.calibre)} · {DISTRICTS[b.district]}
                  </span>
                  <span className={s.doorName}>{b.name}</span>
                  <span className={s.doorMeta}>
                    {dayHours(b.id, day)} · {b.access.stepFree ? "Step-free" : "Not step-free"} ·{" "}
                    {bookingLabel(b.booking)}
                  </span>
                </button>
              ))}
            </div>
          </section>
          )}

          {buildings.length > 0 && ranked.no.length > 0 ? (
            <section className={`${s.section} ${s.wont}`} aria-labelledby="wont">
              <h2 id="wont">Will not fit this day</h2>
              <div className={s.doors}>
                {ranked.no.slice(0, 4).map((row) => {
                  const b = BUILDING_BY_ID[row.id];
                  return (
                    <button
                      key={row.id}
                      type="button"
                      className={s.door}
                      onClick={() => addDoor(row.id)}
                    >
                      <span className={s.doorKind}>{b ? calibreLabel(b.calibre) : ""}</span>
                      <span className={s.doorName}>{b?.name}</span>
                      <span className={s.doorMeta}>{row.reason}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {buildings.length > 0 ? (
            <section className={s.section} aria-labelledby="more">
              <h2 id="more">The rest of this modelled weekend</h2>
              <p className={s.hint}>
                Not a filter. Names, so you can put a specific door on the tape
                and let the day accept or refuse it.
              </p>
              <div className={s.nameRow}>
                {rest.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={s.nameChip}
                    aria-pressed={buildings.includes(b.id)}
                    onClick={() => addDoor(b.id)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={s.side}>
          {selectedBuilding ? (
            <article className={s.detail} aria-labelledby="door-name">
              <p className={s.doorKind}>
                {calibreLabel(selectedBuilding.calibre)} · {selectedBuilding.kind}
              </p>
              <h3 id="door-name">{selectedBuilding.name}</h3>
              <p>{selectedBuilding.why}</p>
              <dl className={s.facts}>
                <div>
                  <dt>When</dt>
                  <dd>
                    Sat {range(selectedBuilding.sat)} · Sun {range(selectedBuilding.sun)}
                  </dd>
                </div>
                <div>
                  <dt>Inside / queue</dt>
                  <dd>
                    {selectedBuilding.visit} minutes inside. Typical queue {selectedBuilding.queue}{" "}
                    minutes. {selectedBuilding.capacity}
                  </dd>
                </div>
                <div>
                  <dt>Booking</dt>
                  <dd>{bookingLabel(selectedBuilding.booking)}</dd>
                </div>
                <div>
                  <dt>Access</dt>
                  <dd className={selectedBuilding.access.stepFree ? undefined : s.accessNo}>
                    {selectedBuilding.access.summary} {selectedBuilding.access.detail}
                  </dd>
                </div>
                <div>
                  <dt>How to get there</dt>
                  <dd>{selectedBuilding.how}</dd>
                </div>
              </dl>
              <div className={s.bannerActs}>
                <button type="button" className={s.act} onClick={() => addDoor(selectedBuilding.id)}>
                  {buildings.includes(selectedBuilding.id) ? "Take it off the tape" : "Put it on the tape"}
                </button>
                <button
                  type="button"
                  className={s.act}
                  onClick={() => {
                    setHere(selectedBuilding.id);
                    setInQueue(true);
                  }}
                >
                  I&apos;m in this queue
                </button>
              </div>
            </article>
          ) : (
            <article className={s.detail}>
              <h3>The tape is the plan</h3>
              <p>
                Tap a door. It occupies an hour. The next door is accepted only
                if you can still arrive, queue, and leave before it closes. Most
                people manage four or five. A first-time visitor cannot tell
                which are extraordinary — those are offered first.
              </p>
            </article>
          )}

          <section className={s.section} aria-labelledby="talks">
            <h2 id="talks">Talks — separate, mostly booked</h2>
            <div className={s.doors}>
              {TALKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={s.door}
                  aria-pressed={talks.includes(t.id)}
                  onClick={() => addTalk(t.id)}
                >
                  <span className={s.doorKind}>
                    {t.day === "sat" ? "Saturday" : "Sunday"} {fmt(t.start)} · book
                  </span>
                  <span className={s.doorName}>{t.title}</span>
                  <span className={s.doorMeta}>{t.venue}. {t.why}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={s.take} aria-labelledby="take">
            <h2 id="take">Take this with you</h2>
            <p className={s.hint}>
              Plain text for a wet phone on patchy data. Copied on-device. Nothing
              is fetched.
            </p>
            <pre>{itinerary}</pre>
            <button
              type="button"
              className={s.copyBtn}
              onClick={() => {
                void navigator.clipboard?.writeText(itinerary);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? "Copied" : "Copy the tape"}
            </button>
          </section>
        </aside>
      </div>

      <footer className={s.foot}>
        <p>
          Modelled weekend of twenty-two doors and five talks, not the hundred
          and eighty of the real festival. Opening hours, travel minutes and
          queues are authored so the tape can refuse a pair that cannot share a
          day. Not the official Open City programme.
        </p>
        <p>
          <Link href="/tasks/client-brand-event-microsite">Task</Link>
        </p>
      </footer>
    </div>
  );
}

function range(h: { open: number; close: number } | null): string {
  if (!h) return "closed";
  return `${fmt(h.open)}–${fmt(h.close)}`;
}

function dayHours(id: string, day: DayId): string {
  const b = BUILDING_BY_ID[id];
  if (!b) return "";
  const h = hoursOn(b, day);
  return h ? `${fmt(h.open)}–${fmt(h.close)}` : "closed today";
}
