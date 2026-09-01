"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_SESSION,
  SECTION_OFFER,
  leftNotes,
  offersOf,
  remainingDead,
  spaceOf,
  takenJobs,
  type Offer,
  type Session,
} from "./decide";
import { clear, load, save } from "./persist";
import {
  SECTIONS,
  monthsQuiet,
  perMetre,
  pounds,
  poundsWhole,
  sectionById,
  shopPerMetre,
  titleById,
  type SectionId,
  type Title,
} from "./shop";
import s from "./shelf.module.css";

type Tone = "take" | "leave" | "pick";

let audio: AudioContext | null = null;

function tick(tone: Tone) {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!audio) audio = new Ctor();
  if (audio.state === "suspended") void audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = tone === "take" ? 196 : tone === "leave" ? 131 : 164;
  gain.gain.setValueAtTime(0.035, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export default function Shelf() {
  const [session, setSession] = useState<Session>(DEFAULT_SESSION);
  const [held, setHeld] = useState<string | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [bay, setBay] = useState<SectionId | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const saved = load();
    if (saved) setSession(saved);
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    save(session);
  }, [booted, session]);

  const offers = useMemo(() => offersOf(session), [session]);
  const jobs = useMemo(() => takenJobs(session), [session]);
  const notes = useMemo(() => leftNotes(session), [session]);
  const space = useMemo(() => spaceOf(session), [session]);
  const dead = useMemo(() => remainingDead(), []);
  const current = offers.find((o) => o.id === held) ?? offers[0] ?? null;

  useEffect(() => {
    if (held && !offers.some((o) => o.id === held)) {
      setHeld(offers[0]?.id ?? null);
    }
  }, [held, offers]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A")
      ) {
        return;
      }
      if (event.key === "Escape") {
        setInspectId(null);
        return;
      }
      if (!current) return;
      if (event.key === "Enter") {
        event.preventDefault();
        take(current);
        return;
      }
      if (event.key === "x" || event.key === "X" || event.key === "Backspace") {
        event.preventDefault();
        leave(current);
        return;
      }
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        cycle(1);
        return;
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        cycle(-1);
        return;
      }
      if (current.kind === "order" && (event.key === "[" || event.key === "]")) {
        event.preventDefault();
        bumpOrder(current.id, event.key === "]" ? 1 : -1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function cycle(dir: number) {
    if (!offers.length) return;
    const id = current?.id ?? offers[0].id;
    const i = offers.findIndex((o) => o.id === id);
    const next = offers[(i + dir + offers.length) % offers.length];
    setHeld(next.id);
    setInspectId(null);
    tick("pick");
  }

  function take(offer: Offer) {
    setSession((prev) => ({
      ...prev,
      taken: prev.taken.includes(offer.id) ? prev.taken : [...prev.taken, offer.id],
    }));
    setHeld(null);
    setInspectId(null);
    tick("take");
  }

  function leave(offer: Offer) {
    setSession((prev) => ({
      ...prev,
      left: prev.left.includes(offer.id) ? prev.left : [...prev.left, offer.id],
    }));
    setHeld(null);
    setInspectId(null);
    tick("leave");
  }

  function pickTest(id: string) {
    setSession((prev) => ({ ...prev, testId: id }));
    if (!session.taken.includes("test-face") && !session.left.includes("test-face")) {
      setHeld("test-face");
    }
    setInspectId(id);
    tick("pick");
  }

  function bumpOrder(id: string, dir: number) {
    setSession((prev) => {
      if (id === "order-local") {
        return { ...prev, orderLocal: clamp(prev.orderLocal + dir, 1, 12) };
      }
      if (id === "order-novel") {
        return { ...prev, orderNovel: clamp(prev.orderNovel + dir, 1, 12) };
      }
      return prev;
    });
    setHeld(id);
    tick("pick");
  }

  function reset() {
    clear();
    setSession(DEFAULT_SESSION);
    setHeld(null);
    setInspectId(null);
    setBay(null);
    tick("leave");
  }

  function openBay(id: SectionId) {
    setBay(id);
    const offerId = SECTION_OFFER[id];
    if (offerId && offers.some((o) => o.id === offerId)) {
      setHeld(offerId);
      setInspectId(null);
    }
    tick("pick");
  }

  const mondayLine = jobs.length
    ? `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} for Monday.`
    : "Nothing committed. A recommendation has to change what you would do Monday.";

  const inspect = inspectId ? titleById(inspectId) : null;
  const sundayDone = offers.length === 0;

  return (
    <div className={s.page}>
      <Link className={s.escape} href="/tasks/practical-apps-analytics">
        Task
      </Link>

      <header className={s.mast}>
        <p className={s.shop}>Quire · 14 Silver Street</p>
        <h1 className={s.title}>Sunday sheet</h1>
        <p className={s.when}>
          6 September 2026 · twenty minutes · the scarce thing is a face-out slot
        </p>
      </header>

      <ShelfRun space={space} bay={bay} onBay={openBay} />

      <p className={s.question}>What does Monday look like?</p>
      <p className={s.commit} aria-live="polite">
        {jobs.length === 0
          ? "Nothing committed yet."
          : `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} · ${space.metresFreed.toFixed(1)}m freed · ${space.freeSlots} ${space.freeSlots === 1 ? "slot" : "slots"} opening`}
      </p>

      <div className={s.desk}>
        <section className={s.monday} aria-labelledby="monday-h">
          <div className={s.mondayHead}>
            <h2 id="monday-h" className={s.h2}>
              Monday 7 September
            </h2>
            <p className={s.live}>{mondayLine}</p>
          </div>

          {jobs.length === 0 ? (
            <p className={s.empty}>
              Take a recommendation and it becomes a job — a box to pack, a title
              to turn, an order to raise. Leave it and Monday changes in the
              other direction.
            </p>
          ) : (
            <ol className={s.jobs}>
              {jobs.map((job, i) => (
                <li key={job.id} className={s.job}>
                  <span className={s.jobN}>{i + 1}</span>
                  <div>
                    <p className={s.jobKicker}>{job.kicker}</p>
                    <p className={s.jobBody}>{job.monday}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <dl className={s.tally}>
            <div>
              <dt>Metres freed</dt>
              <dd>{space.metresFreed.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Slots opening</dt>
              <dd>{space.freeSlots}</dd>
            </div>
            <div>
              <dt>Cash in the box</dt>
              <dd>{space.cashReleased === 0 ? "—" : pounds(space.cashReleased)}</dd>
            </div>
            <div>
              <dt>Slots in the shop</dt>
              <dd>{space.freeSlots} open of 240</dd>
            </div>
          </dl>

          {notes.length > 0 ? (
            <ul className={s.leftList}>
              {notes.map((n) => (
                <li key={n.id}>{n.note}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className={s.offerCol} aria-labelledby="offer-h">
          {sundayDone ? (
            <div className={s.done}>
              <h2 id="offer-h" className={s.h2}>
                Sunday is used up
              </h2>
              <p>
                Every recommendation has been taken or left. Monday is the list
                on the left. Reset the sheet if you want the twenty minutes
                again.
              </p>
            </div>
          ) : current ? (
            <OfferCard
              offer={current}
              session={session}
              inspect={inspect}
              onTake={() => take(current)}
              onLeave={() => leave(current)}
              onInspect={setInspectId}
              onBump={bumpOrder}
            />
          ) : null}

          {offers.length > 1 ? (
            <div className={s.queue} role="list" aria-label="Later this Sunday">
              {offers
                .filter((o) => o.id !== current?.id)
                .map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={s.queueItem}
                    role="listitem"
                    onClick={() => {
                      setHeld(o.id);
                      setInspectId(null);
                      tick("pick");
                    }}
                  >
                    <span className={s.queueKicker}>{o.kicker}</span>
                    <span className={s.queueHead}>{o.headline}</span>
                  </button>
                ))}
            </div>
          ) : null}

          <BlindSpot
            dead={dead}
            testId={session.testId}
            locked={
              session.taken.includes("test-face") ||
              session.left.includes("test-face")
            }
            onPick={pickTest}
          />
        </section>
      </div>

      <footer className={s.foot}>
        <p>
          Modelled from three years of typical independent-shop till patterns —
          not a live extract from Quire’s till. Section £/m is last twelve
          months; a title’s face-out weeks run over three years. The long tail
          of two hundred quiet titles is represented by the decisions it
          forces, not by a catalogue.
        </p>
        <p className={s.keys}>
          Enter takes the recommendation · X leaves it · J and K move the pile ·
          [ and ] change an order quantity
        </p>
        <button type="button" className={s.reset} onClick={reset}>
          Reset the Sunday
        </button>
      </footer>
    </div>
  );
}

function ShelfRun({
  space,
  bay,
  onBay,
}: {
  space: ReturnType<typeof spaceOf>;
  bay: SectionId | null;
  onBay: (id: SectionId) => void;
}) {
  const focused = bay ? sectionById(bay) : null;
  const metresNow = focused ? space.metres[focused.id] : 0;
  return (
    <section className={s.run} aria-label="Shelf space, the scarce resource">
      <p className={s.runLead}>
        Two hundred and forty face-out slots. Shop average{" "}
        {poundsWhole(shopPerMetre())} a metre last year. Poetry is the red bay.
        Empty ticks are slots you have just opened. Touch a bay.
      </p>
      <div className={s.bays}>
        {SECTIONS.map((section) => {
          const row = space.slots[section.id];
          const metres = space.metres[section.id];
          const ticks = ticksFor(section.id, row);
          const on = bay === section.id;
          return (
            <button
              key={section.id}
              type="button"
              className={`${s.bay} ${section.id === "poetry" ? s.bayDear : ""} ${section.door ? s.bayDoor : ""} ${on ? s.bayOn : ""}`}
              style={{ flexGrow: metres, flexBasis: `${Math.max(4.5, metres) * 0.85}rem` }}
              aria-pressed={on}
              onClick={() => onBay(section.id)}
            >
              <div className={s.bayMeta}>
                <span className={s.bayName}>{section.name}</span>
                <span className={s.bayM}>{metres.toFixed(1)}m</span>
              </div>
              <div
                className={s.ticks}
                aria-label={`${section.name}: ${row.filled} face-out, ${row.open} open, ${row.trial} on test`}
              >
                {ticks.map((tickState, i) => (
                  <span
                    key={`${section.id}-${i}`}
                    className={
                      tickState === "open"
                        ? s.tickOpen
                        : tickState === "trial"
                          ? s.tickTrial
                          : s.tickFull
                    }
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {focused ? (
        <p className={s.bayRead} aria-live="polite">
          {focused.name}: {metresNow.toFixed(1)}m, {poundsWhole(perMetre(focused))} a
          metre last year
          {focused.id === "poetry"
            ? " — the expensive metre. The till cannot price who comes for a pamphlet and leaves with a novel."
            : focused.door
              ? " — the door. Almost all of that year was June to August."
              : "."}{" "}
          {poundsWhole(shopPerMetre())} is the shop.
        </p>
      ) : null}
    </section>
  );
}

function ticksFor(
  id: SectionId,
  row: { filled: number; open: number; trial: number; total: number }
): Array<"full" | "open" | "trial"> {
  const max = id === "fiction" || id === "children" ? 22 : 16;
  const total = Math.min(row.total, max);
  const scale = row.total === 0 ? 1 : total / row.total;
  const trial = Math.round(row.trial * scale);
  const open = Math.round(row.open * scale);
  const filled = Math.max(0, total - trial - open);
  return [
    ...Array<"full">(filled).fill("full"),
    ...Array<"trial">(trial).fill("trial"),
    ...Array<"open">(open).fill("open"),
  ];
}

function OfferCard({
  offer,
  session,
  inspect,
  onTake,
  onLeave,
  onInspect,
  onBump,
}: {
  offer: Offer;
  session: Session;
  inspect: Title | null;
  onTake: () => void;
  onLeave: () => void;
  onInspect: (id: string | null) => void;
  onBump: (id: string, dir: number) => void;
}) {
  return (
    <article className={s.card} aria-labelledby="offer-h">
      <p className={s.kicker}>{offer.kicker}</p>
      <h2 id="offer-h" className={s.headline}>
        {offer.headline}
      </h2>

      <div className={s.acts} role="group" aria-label="Commit this to Monday">
        <button type="button" className={s.take} onClick={onTake}>
          Do this Monday
        </button>
        <button type="button" className={s.leave} onClick={onLeave}>
          Not this week
        </button>
      </div>

      {offer.kind === "order" ? (
        <div className={s.qty} role="group" aria-label="Order quantity">
          <button
            type="button"
            className={s.qtyBtn}
            onClick={() => onBump(offer.id, -1)}
            aria-label="Fewer copies"
          >
            −
          </button>
          <span className={s.qtyN}>
            {offer.id === "order-local" ? session.orderLocal : session.orderNovel}
          </span>
          <button
            type="button"
            className={s.qtyBtn}
            onClick={() => onBump(offer.id, 1)}
            aria-label="More copies"
          >
            +
          </button>
          <span className={s.qtyHint}>copies · [ and ]</span>
        </div>
      ) : null}

      <p className={s.mondayDo}>
        <span className={s.mondayLabel}>Monday</span>
        {offer.monday}
      </p>
      <p className={s.why}>{offer.why}</p>
      {offer.blind ? (
        <p className={s.blind}>
          <span className={s.blindMark}>Blind spot</span>
          {offer.blind}
        </p>
      ) : null}
      <p className={s.cost}>
        <span className={s.costMark}>If this is wrong</span>
        {offer.costOfWrong}
      </p>

      {offer.titleIds.length ? (
        <ul className={s.chips}>
          {offer.titleIds.map((id) => {
            const title = titleById(id);
            if (!title) return null;
            const on = inspect?.id === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  className={on ? s.chipOn : s.chip}
                  aria-pressed={on}
                  onClick={() => onInspect(on ? null : id)}
                >
                  {title.title}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {inspect && offer.titleIds.includes(inspect.id) ? (
        <TitleFacts title={inspect} />
      ) : null}
    </article>
  );
}

function TitleFacts({ title }: { title: Title }) {
  const never = title.lastSaleDays === null;
  const fog = title.faceOutWeeks <= 1 && (never || (title.lastSaleDays ?? 0) >= 426);
  const display = title.unitsFace >= 5 && title.unitsSpine <= 1;
  return (
    <div className={s.facts}>
      <p className={s.factsTitle}>
        {title.title}
        <span className={s.factsBy}> · {title.author}</span>
      </p>
      <dl className={s.factsDl}>
        <div>
          <dt>Face-out weeks, three years</dt>
          <dd>{title.faceOutWeeks}</dd>
        </div>
        <div>
          <dt>Sold from the face, last year</dt>
          <dd>{title.unitsFace}</dd>
        </div>
        <div>
          <dt>Sold from the spine, last year</dt>
          <dd>{title.unitsSpine}</dd>
        </div>
        <div>
          <dt>Last till ring</dt>
          <dd>{monthsQuiet(title)}</dd>
        </div>
      </dl>
      {fog ? (
        <p className={s.factsNote}>
          The till cannot see this book. A quiet spine is not evidence it is
          unwanted.
        </p>
      ) : null}
      {display ? (
        <p className={s.factsNote}>
          Every recent sale happened while it was face-out. The figure is a
          property of the slot, not of demand.
        </p>
      ) : null}
    </div>
  );
}

function BlindSpot({
  dead,
  testId,
  locked,
  onPick,
}: {
  dead: ReturnType<typeof remainingDead>;
  testId: string;
  locked: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <aside className={s.spot} aria-labelledby="spot-h">
      <h2 id="spot-h" className={s.spotH}>
        The till cannot see the shelf
      </h2>
      <p className={s.spotLead}>
        {dead.unseen} titles have not sold in fourteen months and have never
        stood face-out. Unseen is not unwanted. The modelled handful below are
        the ones you can actually walk to. Choosing one rewrites Monday’s test.
      </p>
      <ul className={s.spotList}>
        {dead.listedUnseen.map((title) => {
          const on = title.id === testId;
          return (
            <li key={title.id}>
              <button
                type="button"
                className={on ? s.spotOn : s.spotBtn}
                aria-pressed={on}
                disabled={locked}
                onClick={() => onPick(title.id)}
              >
                <span className={s.spotTitle}>{title.title}</span>
                <span className={s.spotMeta}>
                  {title.section} · {title.copies} {title.copies === 1 ? "copy" : "copies"} ·{" "}
                  {monthsQuiet(title)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
