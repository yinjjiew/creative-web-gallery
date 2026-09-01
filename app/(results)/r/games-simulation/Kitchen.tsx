"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Sound } from "./audio";
import Jar from "./Jar";
import {
  PLACE_NAME,
  STEP_HOURS,
  WATCH_HOURS_PER_SEC,
  WEEKDAYS,
  advance,
  bakeLoaf,
  clockLabel,
  feed,
  hoochOf,
  moveTo,
  phOf,
  placeTemp,
  ripeForOven,
  riseWord,
  seedCulture,
  smellOf,
  step,
  stir,
  volumeOf,
  type Culture,
  type Flour,
  type Loaf,
  type Place,
} from "./sim";
import s from "./starter.module.css";

type Note = { id: number; text: string };

const INTRO: Note[] = [
  {
    id: 1,
    text:
      "A jar left on the table. Someone kept this culture before you — yeasts and lactic bacteria sharing the same flour.",
  },
  {
    id: 2,
    text:
      "Warmth is not only speed. Heat favours the lactic bacteria and a yogurt sour. A cool sill favours acetic sharpness. The fridge nearly stops both.",
  },
  {
    id: 3,
    text:
      "A model of two populations, not a measurement. The loaf will be a consequence of how you keep the jar. Lift the lid.",
  },
];

function phaseOf(hour: number): "dawn" | "day" | "dusk" | "night" {
  if (hour >= 21 || hour < 5.5) return "night";
  if (hour < 8) return "dawn";
  if (hour >= 17.5) return "dusk";
  return "day";
}

function nextNoteId(notes: Note[]) {
  return notes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
}

export default function Kitchen() {
  const live = useId();
  const sound = useRef<Sound | null>(null);
  if (!sound.current) sound.current = new Sound();

  const cultureRef = useRef<Culture>(seedCulture());
  const hourRef = useRef(7.2);
  const dayRef = useRef(0);
  const [culture, setCulture] = useState<Culture>(cultureRef.current);
  const [hour, setHour] = useState(7.2);
  const [day, setDay] = useState(0);
  const [lidOff, setLidOff] = useState(false);
  const [ratio, setRatio] = useState(2);
  const [hydration, setHydration] = useState(100);
  const [flour, setFlour] = useState<Flour>("white");
  const [notes, setNotes] = useState<Note[]>(INTRO);
  const [loaf, setLoaf] = useState<Loaf | null>(null);
  const [reduce, setReduce] = useState(false);
  const [announce, setAnnounce] = useState("A jar on the table.");
  const lastRise = useRef(riseWord(cultureRef.current));
  const lastHooch = useRef(false);
  const notedRipe = useRef(false);
  const bookRef = useRef<HTMLElement | null>(null);
  const lidRef = useRef(false);

  useEffect(() => {
    bookRef.current?.scrollTo({ top: bookRef.current.scrollHeight });
  }, [notes]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const publish = useCallback(() => {
    setCulture({ ...cultureRef.current });
    setHour(hourRef.current);
    setDay(dayRef.current);
  }, []);

  const write = useCallback((text: string) => {
    setNotes((prev) => [...prev.slice(-10), { id: nextNoteId(prev), text }]);
    setAnnounce(text);
  }, []);

  const fold = useCallback(
    (hours: number) => {
      cultureRef.current = advance(cultureRef.current, hours, hourRef.current);
      const next = hourRef.current + hours;
      dayRef.current += Math.floor(next / 24);
      hourRef.current = ((next % 24) + 24) % 24;
      publish();
    },
    [publish],
  );

  useEffect(() => {
    if (!lidOff) return;
    let acc = 0;
    let last = performance.now();
    let pub = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt * WATCH_HOURS_PER_SEC;
      let n = 0;
      while (acc >= STEP_HOURS && n < 20) {
        const h = hourRef.current;
        cultureRef.current = step(
          {
            ...cultureRef.current,
            temp: placeTemp(cultureRef.current.place, h),
          },
          STEP_HOURS,
        );
        const nxt = h + STEP_HOURS;
        if (nxt >= 24) dayRef.current += 1;
        hourRef.current = nxt % 24;
        acc -= STEP_HOURS;
        n += 1;
      }
      pub += dt;
      if (pub > 0.32) {
        pub = 0;
        const c = cultureRef.current;
        const rise = riseWord(c);
        if (rise !== lastRise.current) {
          lastRise.current = rise;
          if (rise === "doubled") {
            write(`It has doubled. ${smellOf(c)}.`);
          } else if (rise === "fallen") {
            write("It has fallen. The structure gave out — acids, and no food left.");
            notedRipe.current = false;
          } else if (rise === "domed") {
            write("The paste is doming above the band.");
          }
        }
        const hooch = hoochOf(c) > 0.16;
        if (hooch && !lastHooch.current) {
          lastHooch.current = true;
          write("A grey liquid on top. Hooch — the yeasts are hungry.");
        }
        if (!hooch) lastHooch.current = false;
        if (ripeForOven(c) && !notedRipe.current && rise === "doubled") {
          notedRipe.current = true;
          write("This is the moment bakers take it. Still sweet under the tang.");
        }
        setCulture({ ...c });
        setHour(hourRef.current);
        setDay(dayRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [lidOff, write]);

  const wake = useCallback(() => {
    sound.current?.ensure();
  }, []);

  const liftLid = useCallback(() => {
    if (lidRef.current) return;
    lidRef.current = true;
    wake();
    sound.current?.lid();
    setLidOff(true);
    const c = cultureRef.current;
    write(
      `Lid off. ${smellOf(c)}. ${hoochOf(c) > 0.1 ? "A film of hooch." : "The paste is slack."} I should feed it.`,
    );
  }, [wake, write]);

  const doStir = useCallback(() => {
    if (!lidRef.current) {
      liftLid();
      return;
    }
    wake();
    sound.current?.lid();
    cultureRef.current = stir(cultureRef.current);
    publish();
    write("Stirred. It collapsed a little — the gas went.");
  }, [liftLid, publish, wake, write]);

  const doFeed = useCallback(() => {
    if (!lidRef.current) {
      liftLid();
      return;
    }
    wake();
    sound.current?.feed();
    cultureRef.current = feed(cultureRef.current, ratio, hydration, flour);
    lastRise.current = riseWord(cultureRef.current);
    notedRipe.current = false;
    lastHooch.current = false;
    publish();
    const hydWord = hydration <= 70 ? "stiff" : hydration >= 118 ? "loose" : "a batter";
    write(
      `Fed 1:${ratio}:${ratio} ${flour}, ${hydWord}, left in ${PLACE_NAME[cultureRef.current.place]}. The acids dilute. The clock is the rest of the work.`,
    );
  }, [flour, hydration, liftLid, publish, ratio, wake, write]);

  const doMove = useCallback(
    (place: Place) => {
      if (!lidRef.current) liftLid();
      wake();
      sound.current?.setDown();
      cultureRef.current = moveTo(cultureRef.current, place, hourRef.current);
      publish();
      const t = cultureRef.current.temp;
      write(
        `Jar on ${PLACE_NAME[place]}. About ${Math.round(t)}°. ` +
          (place === "warm"
            ? "The lactic bacteria will like this more than the yeasts."
            : place === "sill"
              ? "Cool. If it sours, it will be acetic — vinegar, not yogurt."
              : place === "fridge"
                ? "Almost still. A week is a long time here; a day is nothing."
                : "The ordinary counter. Both populations can work."),
      );
    },
    [liftLid, publish, wake, write],
  );

  const doTea = useCallback(() => {
    if (!lidRef.current) liftLid();
    wake();
    fold(2);
    write(`Put the kettle on. Two hours. ${clockLabel(hourRef.current)}. ${smellOf(cultureRef.current)}.`);
  }, [fold, liftLid, wake, write]);

  const doSleep = useCallback(() => {
    if (!lidRef.current) liftLid();
    wake();
    const until = hourRef.current < 7 ? 7 - hourRef.current : 24 - hourRef.current + 7;
    fold(until);
    write(
      `${WEEKDAYS[dayRef.current % 7]} morning. ${smellOf(cultureRef.current)}. The jar spent the night in ${PLACE_NAME[cultureRef.current.place]}.`,
    );
  }, [fold, liftLid, wake, write]);

  const doBake = useCallback(() => {
    wake();
    sound.current?.oven();
    const baked = bakeLoaf(cultureRef.current);
    setLoaf(baked);
    write(`Baked. ${baked.line} ${baked.notes[0] ?? ""}`);
  }, [wake, write]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") {
        e.preventDefault();
        if (!lidRef.current) liftLid();
        else doFeed();
        return;
      }
      if (k === "f") doFeed();
      else if (k === "1") doMove("fridge");
      else if (k === "2") doMove("sill");
      else if (k === "3") doMove("counter");
      else if (k === "4") doMove("warm");
      else if (k === "t") doTea();
      else if (k === "n") doSleep();
      else if (k === "b") doBake();
      else if (k === "j") doStir();
      else if (k === "[") setHydration((h) => (h <= 60 ? 125 : h <= 100 ? 60 : 100));
      else if (k === "]") setHydration((h) => (h >= 125 ? 60 : h >= 100 ? 125 : 100));
      else if (k === "q") setFlour("white");
      else if (k === "w") setFlour("wheat");
      else if (k === "e") setFlour("rye");
      else if (k === "-" || k === "_") setRatio((r) => (r <= 1 ? 5 : r === 2 ? 1 : 2));
      else if (k === "=" || k === "+") setRatio((r) => (r >= 5 ? 1 : r === 1 ? 2 : 5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doBake, doFeed, doMove, doSleep, doStir, doTea, liftLid]);

  const phase = phaseOf(hour);
  const vol = volumeOf(culture);
  const pH = phOf(culture);
  const yeastMark = Math.min(1, culture.yeast / 1.4);
  const labMark = Math.min(1, culture.lab / 1.6);
  const hands = {
    hour: ((hour % 12) / 12) * 360 + (hour % 1) * 30,
    minute: (hour % 1) * 360,
  };

  return (
    <div
      className={s.room}
      data-phase={phase}
      data-place={culture.place}
      data-lid={lidOff ? "off" : "on"}
    >
      <div className={s.wall} aria-hidden="true" />
      <div className={s.window} aria-hidden="true">
        <div className={s.sky} />
        <div className={s.sash} />
      </div>

      <div className={s.clock} aria-hidden="true">
        <span className={s.clockFace}>
          <i className={s.hourHand} style={{ transform: `rotate(${hands.hour}deg)` }} />
          <i className={s.minuteHand} style={{ transform: `rotate(${hands.minute}deg)` }} />
        </span>
        <span className={s.clockDay}>
          {WEEKDAYS[day % 7]}
          <br />
          {clockLabel(hour)}
        </span>
      </div>

      <div className={s.table}>
        <div className={s.grain} aria-hidden="true" />

        <div className={s.stage} data-place={culture.place}>
          <button
            type="button"
            className={`${s.spot} ${s.fridge}`}
            data-on={culture.place === "fridge"}
            onClick={() => doMove("fridge")}
          >
            fridge
            <em>4°</em>
          </button>
          <button
            type="button"
            className={`${s.spot} ${s.sill}`}
            data-on={culture.place === "sill"}
            onClick={() => doMove("sill")}
          >
            sill
            <em>cool</em>
          </button>
          <button
            type="button"
            className={`${s.spot} ${s.counter}`}
            data-on={culture.place === "counter"}
            onClick={() => doMove("counter")}
          >
            counter
            <em>21°</em>
          </button>
          <button
            type="button"
            className={`${s.spot} ${s.warm}`}
            data-on={culture.place === "warm"}
            onClick={() => doMove("warm")}
          >
            warm
            <em>30°</em>
          </button>

          <div className={s.jarSlot}>
            <Jar culture={culture} lidOff={lidOff} reduce={reduce} onJar={doStir} />
            {!lidOff ? <p className={s.liftHint}>lift the lid</p> : null}
          </div>
        </div>

        {loaf ? <LoafBoard loaf={loaf} flour={culture.flour} /> : null}

        <div className={s.tools} role="group" aria-label="Keeping the culture">
          <div className={s.bags} role="group" aria-label="Flour">
            {(["white", "wheat", "rye"] as Flour[]).map((f) => (
              <button
                key={f}
                type="button"
                className={s.bag}
                data-flour={f}
                data-on={flour === f}
                onClick={() => setFlour(f)}
              >
                {f === "wheat" ? "whole wheat" : f}
              </button>
            ))}
          </div>
          <div className={s.recipe} role="group" aria-label="Feed">
            <span className={s.recipeLabel}>I keep 1 part</span>
            {([1, 2, 5] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={s.chip}
                data-on={ratio === r}
                onClick={() => setRatio(r)}
              >
                1:{r}:{r}
              </button>
            ))}
            {([60, 100, 125] as const).map((h) => (
              <button
                key={h}
                type="button"
                className={s.chip}
                data-on={hydration === h}
                onClick={() => setHydration(h)}
              >
                {h <= 70 ? "stiff" : h >= 118 ? "loose" : "batter"}
              </button>
            ))}
            <button type="button" className={s.feed} onClick={doFeed}>
              feed the jar
            </button>
          </div>
          <div className={s.waits}>
            <button type="button" className={s.wait} onClick={doTea}>
              put the kettle on
            </button>
            <button type="button" className={s.wait} onClick={doSleep}>
              go to bed
            </button>
            <button type="button" className={s.bake} onClick={doBake}>
              bake a loaf
            </button>
          </div>
        </div>
      </div>

      <aside className={s.book} aria-label="Notebook" ref={bookRef}>
        <p className={s.bookHead}>
          {WEEKDAYS[day % 7]} · {clockLabel(hour)}
        </p>
        <p className={s.bookRise}>
          {riseWord(culture)}
          {lidOff ? ` · ${smellOf(culture)}` : ""}
          {vol >= 1.7 ? " · above the band" : ""}
        </p>
        <div className={s.sketch} aria-hidden="true">
          <span className={s.stroke} style={{ width: `${18 + yeastMark * 72}%` }} />
          <em>yeasts</em>
          <span className={s.stroke} data-lab="1" style={{ width: `${18 + labMark * 72}%` }} />
          <em>lactic bacteria</em>
        </div>
        <p className={s.modelNote}>
          Imagined from the rise and the smell — a model, not a count. Typical ripe
          cultures sit near pH 3.8–4.2; this jar is modelled at {pH.toFixed(1)}.
        </p>
        <ol className={s.entries}>
          {notes.map((n) => (
            <li key={n.id}>{n.text}</li>
          ))}
        </ol>
        <p className={s.keys}>
          Space lifts the lid, then feeds. F feed · 1 fridge · 2 sill · 3 counter · 4
          warm · T kettle · N night · B bake · J stir
        </p>
        <Link href="/tasks/games-simulation" className={s.back}>
          the task
        </Link>
      </aside>

      <p className={s.srOnly} aria-live="polite" id={live}>
        {announce}
      </p>

    </div>
  );
}

function LoafBoard({ loaf, flour }: { loaf: Loaf; flour: Flour }) {
  const holes = crumb(loaf.openness);
  const h = 52 + loaf.spring * 38;
  const crust = 28 + loaf.crust * 40;
  const rye = flour === "rye" ? 12 : flour === "wheat" ? 6 : 0;
  return (
    <div className={s.board} aria-label={loaf.line}>
      <svg viewBox="0 0 120 100" className={s.loaf} role="img" aria-hidden="true">
        <ellipse cx="60" cy="88" rx="38" ry="6" fill="rgba(60,40,20,0.18)" />
        <path
          d={`M18 78 C 22 ${88 - h * 0.15}, 28 ${88 - h}, 60 ${88 - h} C 92 ${88 - h}, 98 ${88 - h * 0.15}, 102 78 C 90 86, 30 86, 18 78 Z`}
          fill={`hsl(${28 - rye}, ${34 + loaf.crust * 10}%, ${crust}%)`}
        />
        <path
          d={`M26 76 C 32 ${80 - h * 0.55}, 48 ${82 - h * 0.7}, 60 ${82 - h * 0.68} C 74 ${82 - h * 0.7}, 90 ${80 - h * 0.5}, 96 76 C 84 80, 38 81, 26 76 Z`}
          fill={`hsl(${36 - rye}, 42%, ${Math.min(72, crust + 18)}%)`}
        />
        {holes.map((o, i) => (
          <circle
            key={i}
            cx={o.x}
            cy={o.y + (88 - h) * 0.15}
            r={o.r}
            fill={`hsla(${32 - rye}, 30%, ${22 + loaf.crust * 8}%, 0.45)`}
          />
        ))}
      </svg>
      <p className={s.loafLine}>{loaf.line}</p>
      <p className={s.loafNote}>{loaf.notes[1] ?? loaf.notes[0]}</p>
    </div>
  );
}

function crumb(openness: number) {
  const n = Math.round(3 + openness * 16);
  const holes: { x: number; y: number; r: number }[] = [];
  let seed = 17;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < n; i++) {
    holes.push({
      x: 32 + rand() * 56,
      y: 48 + rand() * 28,
      r: 0.8 + rand() * (1.2 + openness * 2.6),
    });
  }
  return holes;
}
