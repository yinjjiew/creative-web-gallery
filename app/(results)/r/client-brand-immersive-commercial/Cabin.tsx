"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import Book from "./Book";
import Window from "./Window";
import { startNight } from "./audio";
import {
  BERTH,
  COMPARE,
  COPY,
  MARKS,
  SERVICE,
  clockAt,
  hourAt,
} from "./data";
import styles from "./natt.module.css";

type Tab = "hour" | "berth" | "bill" | "rest";

const TABS: { id: Tab; label: string }[] = [
  { id: "hour", label: "This hour" },
  { id: "berth", label: "The berth" },
  { id: "bill", label: "The bill" },
  { id: "rest", label: "The rest" },
];

export default function Cabin() {
  const strapId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const audioRef = useRef<Awaited<ReturnType<typeof startNight>>>(null);
  const [night, setNight] = useState(0);
  const [lamp, setLamp] = useState(true);
  const [tab, setTab] = useState<Tab>("hour");
  const [open, setOpen] = useState(false);
  const [pulled, setPulled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [live, setLive] = useState("");
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: coarse)");
    const apply = () => {
      setReduced(motion.matches);
      setCoarse(pointer.matches);
    };
    apply();
    motion.addEventListener("change", apply);
    pointer.addEventListener("change", apply);
    return () => {
      motion.removeEventListener("change", apply);
      pointer.removeEventListener("change", apply);
    };
  }, []);

  const hour = hourAt(night);
  const near = MARKS.find((mark) => Math.abs(night - mark.t) < 0.035);
  const clock = near ? near.clock : clockAt(night);

  const applyNight = useCallback(
    (next: number, fromGesture: boolean) => {
      const n = Math.min(1, Math.max(0, next));
      setNight(n);
      if (fromGesture && !pulled) {
        setPulled(true);
        void startNight().then((handle) => {
          audioRef.current = handle;
        });
      }
    },
    [pulled],
  );

  const fromClientY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return null;
    const box = track.getBoundingClientRect();
    if (box.height < 8) return null;
    const raw = (clientY - box.top) / box.height;
    const padded = (raw - 0.05) / 0.9;
    return Math.min(1, Math.max(0, padded));
  }, []);

  const snapNight = useCallback(
    (n: number) => {
      if (n >= 0.93) return 1;
      if (n <= 0.04) return 0;
      return n;
    },
    [],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const n = fromClientY(event.clientY);
      if (n === null) return;
      applyNight(n, true);
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        setNight((n) => snapNight(n));
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyNight, fromClientY, snapNight]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (open) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const step = reduced ? 0.2 : 0.05;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        applyNight(night + step, true);
      } else if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        applyNight(night - step, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        applyNight(0, true);
      } else if (event.key === "End") {
        event.preventDefault();
        applyNight(1, true);
      } else if (event.key === "l" || event.key === "L") {
        setLamp((v) => !v);
      } else if (event.key === "1") setTab("hour");
      else if (event.key === "2") setTab("berth");
      else if (event.key === "3") setTab("bill");
      else if (event.key === "4") setTab("rest");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyNight, night, open, reduced]);

  useEffect(() => {
    if (!pulled) return;
    const id = window.setTimeout(() => {
      setLive(`${clock}, ${hour.place}. ${hour.land}.`);
    }, 160);
    return () => window.clearTimeout(id);
  }, [clock, hour.land, hour.place, pulled]);

  const dim = night > 0.3 && night < 0.88 && !lamp;
  const arrived = night >= 0.96;

  return (
    <main
      className={styles.root}
      data-dim={dim ? "true" : "false"}
      data-dawn={night > 0.86 ? "true" : "false"}
      data-lamp={lamp ? "true" : "false"}
      data-arrived={arrived ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
    >
      <header className={styles.top}>
        <p className={styles.wordmark}>{SERVICE.operator}</p>
        <p className={styles.run}>
          {SERVICE.number}
          <span>
            {SERVICE.from.time} → {SERVICE.to.time}
          </span>
        </p>
        <Link
          className={styles.brief}
          href="/tasks/client-brand-immersive-commercial"
          prefetch={false}
        >
          The brief
        </Link>
      </header>

      <section className={styles.compartment} aria-label="Two-berth compartment">
        <div className={styles.frame}>
          <div
            className={styles.pane}
            ref={trackRef}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              const n = fromClientY(event.clientY);
              if (n !== null) applyNight(n, true);
            }}
          >
            <Window night={night} lamp={lamp} />
            <div className={styles.gasket} aria-hidden="true" />
            <div className={styles.shade} aria-hidden="true" />
            <div
              className={styles.wash}
              style={{
                opacity: night < 0.5 ? night * 0.55 : (1 - night) * 0.55,
              }}
              aria-hidden="true"
            />
            <p className={styles.place}>
              <span className={styles.clock}>{clock}</span>
              <span>{hour.place}</span>
            </p>
            <div
              className={styles.strap}
              role="slider"
              id={strapId}
              tabIndex={0}
              aria-label="The night, from boarding in Brussels to waking in Berlin"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(night * 100)}
              aria-valuetext={`${clock}, ${hour.place}`}
              aria-orientation="vertical"
            >
              <span className={styles.rail} aria-hidden="true" />
              <span className={styles.handle} style={{ top: `${night * 100}%` }}>
                <span className={styles.handleMark} />
                {night < 0.04 ? <span className={styles.pull}>Pull</span> : null}
              </span>
            </div>
          </div>
          <div className={styles.marks} role="group" aria-label="The night, by the hour">
            {MARKS.map((mark) => (
              <button
                key={mark.clock}
                type="button"
                className={styles.mark}
                data-now={
                  Math.abs(night - mark.t) < 0.08 || (mark.t === 1 && arrived)
                    ? "true"
                    : "false"
                }
                onClick={() => applyNight(mark.t, true)}
              >
                <span>{mark.clock}</span>
                <em>{mark.name}</em>
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            {pulled
              ? `${clock} · ${hour.place}`
              : coarse
                ? "Pull the night. Drag the window, or tap Berlin."
                : "Pull the night. Drag the window, tap an hour, or use the arrows."}
          </p>
        </div>

        <div className={styles.wall}>
          <div className={styles.plate} aria-hidden="true">
            <span>BERTH</span>
            <strong>{SERVICE.compartment}</strong>
          </div>
          <h1 className={styles.claim}>
            {arrived ? (
              <>
                You went to sleep in Brussels.
                <br />
                This is Berlin.
              </>
            ) : (
              <>
                Go to sleep <em>here</em>.
                <br />
                Wake up <em>there</em>.
              </>
            )}
          </h1>
          <p className={styles.lede}>{COPY.flight}</p>
          <div className={styles.toggles}>
            <button
              type="button"
              className={styles.lamp}
              aria-pressed={lamp}
              onClick={() => setLamp((v) => !v)}
            >
              {lamp ? "Reading light on" : "Reading light off"}
            </button>
            {pulled ? (
              <button
                type="button"
                className={styles.lamp}
                aria-pressed={!muted}
                onClick={() => {
                  const handle = audioRef.current;
                  if (!handle) return;
                  if (muted) handle.unmute();
                  else handle.mute();
                  setMuted(!muted);
                }}
              >
                {muted ? "Sound off" : "Sound on"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.pocket} aria-label="Compartment pocket">
        <div className={styles.tabs} role="tablist" aria-label="Cards in the pocket">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={styles.tab}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.card} role="tabpanel">
          {tab === "hour" ? (
            <>
              <p className={styles.cardKicker}>
                {clock} · {hour.land}
              </p>
              <h2 className={styles.cardTitle}>{hour.place}</h2>
              <p>{hour.note}</p>
              <p>{hour.dining}</p>
            </>
          ) : null}
          {tab === "berth" ? (
            <>
              <p className={styles.cardKicker}>
                {BERTH.bunkW} × {BERTH.bunkL} cm
              </p>
              <h2 className={styles.cardTitle}>It is not a hotel</h2>
              <p>{COPY.berth}</p>
              <p>{COPY.sleep}</p>
            </>
          ) : null}
          {tab === "bill" ? (
            <>
              <p className={styles.cardKicker}>The only fair sum</p>
              <h2 className={styles.cardTitle}>
                Flight {COMPARE.flightEur} € + hotel {COMPARE.hotelEur} € ={" "}
                {COMPARE.combinedEur} €
              </h2>
              <p>{COPY.compare}</p>
              <p>
                A shared berth on {SERVICE.number} is 134 €. The compartment to
                yourself is 248 €. The flight alone is {COMPARE.flightEur} €
                and {COMPARE.flightHours}, which is the number everyone quotes,
                and the wrong one. Hotel: {COMPARE.hotelNote}.
              </p>
              <p>{COPY.carbon}</p>
            </>
          ) : null}
          {tab === "rest" ? (
            <>
              <p className={styles.cardKicker}>Luggage · border · access</p>
              <h2 className={styles.cardTitle}>The working service</h2>
              <p>
                Two large cases at the foot of the bunks, a third on the rack.
                You walk on with them. There is no desk and no performance.
              </p>
              <p>
                Brussels to Berlin is Schengen. You change country in your
                sleep. The attendant has your name. You are not asked to stand
                in a corridor.
              </p>
              <p>{COPY.access}</p>
              <p className={styles.fine}>{COPY.provenance}</p>
            </>
          ) : null}
        </div>
      </section>

      <footer className={styles.floor}>
        <p className={styles.fine}>{COPY.provenance}</p>
        <button type="button" className={styles.cta} onClick={() => setOpen(true)}>
          Book a berth
        </button>
      </footer>

      {open ? (
        <Book
          onClose={() => setOpen(false)}
          onDone={(text) => {
            setLive(text);
          }}
        />
      ) : null}

      <p className={styles.live} aria-live="polite">
        {live}
      </p>
    </main>
  );
}
