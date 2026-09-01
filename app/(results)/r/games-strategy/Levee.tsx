"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Sound } from "./audio";
import Sheet from "./Sheet";
import {
  HYDRO,
  LAST,
  PULSE_DT,
  PULSE_STEPS,
  bankCells,
  beginPulse,
  brace,
  caneLost,
  cellAt,
  clone,
  createGame,
  cut,
  finishPulse,
  forecast,
  peopleLeft,
  placeName,
  raise,
  send,
  settlement,
  step,
  weakest,
  type Cell,
  type Event,
  type Game,
} from "./engine";
import s from "./levee.module.css";

const STEP_MS = 36;

function voice(events: Event[], sound: Sound) {
  const seen = new Set<Event>();
  for (const e of events) {
    if (seen.has(e)) continue;
    seen.add(e);
    if (
      e === "raise" ||
      e === "brace" ||
      e === "cut" ||
      e === "send" ||
      e === "pulse" ||
      e === "breach" ||
      e === "overtop" ||
      e === "drown" ||
      e === "end" ||
      e === "refuse"
    ) {
      sound.play(e);
    }
  }
}

export default function Levee() {
  const [game, setGame] = useState<Game>(() => createGame());
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(() => {
    const w = weakest(createGame());
    return w ? { x: w.x, y: w.y } : null;
  });
  const [muted, setMuted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reduce, setReduce] = useState(false);
  const sound = useRef(new Sound());
  const running = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => sound.current.close();
  }, []);

  const selected = cursor ? cellAt(game, cursor.x, cursor.y) : null;

  const boot = useCallback(() => {
    sound.current.ensure();
    sound.current.setMuted(muted);
    sound.current.setStage(gameRef.current.stage);
  }, [muted]);

  const apply = useCallback((next: Game) => {
    setGame(next);
    sound.current.setStage(next.stage);
    voice(next.events, sound.current);
  }, []);

  const act = useCallback(
    (fn: (g: Game, c: Cell) => boolean) => {
      if (busy || game.ending) return;
      boot();
      const c = selected;
      if (!c) {
        sound.current.play("refuse");
        return;
      }
      const next = clone(game);
      const cell = cellAt(next, c.x, c.y);
      if (!cell || !fn(next, cell)) {
        next.events = ["refuse"];
        voice(next.events, sound.current);
        return;
      }
      apply(next);
    },
    [apply, boot, busy, game, selected]
  );

  const river = useCallback(() => {
    if (busy || game.ending) return;
    boot();
    const next = clone(game);
    beginPulse(next);
    if (next.ending) {
      apply(next);
      return;
    }
    running.current = true;
    setBusy(true);

    const finish = () => {
      finishPulse(next);
      running.current = false;
      setBusy(false);
      apply(clone(next));
    };

    if (reduce) {
      for (let i = 0; i < PULSE_STEPS; i++) step(next, PULSE_DT);
      finish();
      return;
    }

    let i = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      while (acc >= STEP_MS && i < PULSE_STEPS) {
        step(next, PULSE_DT);
        i += 1;
        acc -= STEP_MS;
      }
      setGame(clone(next));
      if (i < PULSE_STEPS) requestAnimationFrame(tick);
      else finish();
    };
    voice(next.events, sound.current);
    requestAnimationFrame(tick);
  }, [apply, boot, busy, game, reduce]);

  const restart = useCallback(() => {
    boot();
    running.current = false;
    setBusy(false);
    const fresh = createGame();
    setGame(fresh);
    const w = weakest(fresh);
    setCursor(w ? { x: w.x, y: w.y } : null);
    sound.current.play("send");
  }, [boot]);

  const moveCur = useCallback(
    (dx: number, dy: number) => {
      boot();
      const list = bankCells(game);
      if (!list.length) return;
      const here = selected ?? list[0]!;
      const next =
        list.find((c) => c.x === here.x + dx && c.y === here.y + dy) ??
        list.find((c) => (dx !== 0 ? c.x === here.x + dx : c.y === here.y + dy)) ??
        list.find((c) => Math.abs(c.x - (here.x + dx)) + Math.abs(c.y - (here.y + dy)) === 1);
      if (next) {
        setCursor({ x: next.x, y: next.y });
        return;
      }
      const i = list.findIndex((c) => c.x === here.x && c.y === here.y);
      const stepDir = dy > 0 || dx > 0 ? 1 : -1;
      const wrap = list[(i + stepDir + list.length) % list.length];
      if (wrap) setCursor({ x: wrap.x, y: wrap.y });
    },
    [boot, game, selected]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          "W",
          "A",
          "S",
          "D",
          "1",
          "2",
          "3",
          "4",
          "r",
          "R",
          "b",
          "B",
          "c",
          "C",
          "e",
          "E",
          " ",
          "Enter",
          "m",
          "M",
          "n",
          "N",
        ].includes(k)
      ) {
        return;
      }
      e.preventDefault();
      boot();
      if (k === "ArrowUp" || k === "w" || k === "W") moveCur(0, -1);
      else if (k === "ArrowDown" || k === "s" || k === "S") moveCur(0, 1);
      else if (k === "ArrowLeft" || k === "a" || k === "A") moveCur(-1, 0);
      else if (k === "ArrowRight" || k === "d" || k === "D") moveCur(1, 0);
      else if (k === "1" || k === "r" || k === "R") {
        if (game.ending) restart();
        else act(raise);
      } else if (k === "2" || k === "b" || k === "B") act(brace);
      else if (k === "3" || k === "c" || k === "C") act(cut);
      else if (k === "4" || k === "e" || k === "E") act(send);
      else if (k === " " || k === "Enter") {
        if (game.ending) restart();
        else river();
      } else if (k === "m" || k === "M") {
        setMuted((m) => {
          sound.current.setMuted(!m);
          return !m;
        });
      } else if (k === "n" || k === "N") restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, boot, game.ending, moveCur, restart, river]);

  const pick = (c: Cell) => {
    boot();
    setCursor({ x: c.x, y: c.y });
  };

  const pop = peopleLeft(game);
  const cane = caneLost(game);
  const places = game.cells.flat().length;
  const fate = selected ? forecast(game, selected) : "dry";
  const canRaise = !!(selected && selected.crest > 0 && !selected.cut && game.stone >= 2 && game.crews >= 1);
  const canBrace = !!(selected && selected.crest > 0 && !selected.cut && !selected.braced && game.crews >= 1);
  const canCut = !!(selected && (selected.crest > 0 || selected.cut) && !selected.cut && game.crews >= 1);
  const canSend = !!(selected && settlement(selected) && !selected.sent && game.crews >= 1);

  const endingTitle =
    game.ending === "lost"
      ? "Lost."
      : game.ending === "trade"
        ? "The trade."
        : game.ending === "seat"
          ? "The seat."
          : game.ending === "held"
            ? "Held."
            : null;

  return (
    <div className={s.sheet}>
      <header className={s.mast}>
        <div className={s.brand}>
          <p className={s.kicker}>Parish survey · modelled hydrograph</p>
          <h1 className={s.title}>Levee</h1>
          <p className={s.parish}>St. Claire Parish, a delta that is not on any chart</p>
        </div>
        <div className={s.meta}>
          Day {game.day} of {LAST}
          <br />
          Stage {game.stage.toFixed(2)}
          {game.day < LAST ? ` · next ${(HYDRO[Math.min(game.day + 1, LAST)] ?? game.stage).toFixed(2)}` : ""}
          <br />
          {pop.now} of {pop.start} still above water
        </div>
      </header>

      <p className={s.teach}>
        Water takes the lowest crest. Raise a bank, hold it for the day, or cut it
        and let the polder go. Elevations are modelled survey feet — not a recorded
        flood. The hydrograph is invented; the water&apos;s habits are not.
      </p>

      <div className={s.stage}>
        <Sheet game={game} cursor={cursor} reduce={reduce} onPick={pick} />
      </div>

      <aside className={s.side}>
        <div>
          <h2>The parish</h2>
          <ul className={s.legend}>
            {townLine(game, "Port Reach")}
            {townLine(game, "Avery")}
            {townLine(game, "Pecan")}
            <li>
              Cane
              <b>
                {cane.lost} / {cane.total} under
              </b>
            </li>
          </ul>
        </div>
        <p>
          A bank fails when the head against it is high and the freeboard is almost
          gone. Closing one spill sends the same pulse to the next-lowest crest.
        </p>
        <p className={s.note}>
          Elevations are modelled survey feet, not a recorded flood. The hydrograph
          is invented; the water&apos;s habits are not. {places} squares on the sheet.
        </p>
        <p className={s.keys}>
          Arrows move · 1 raise · 2 brace · 3 cut · 4 send off · space the river
          · N new sheet · M mute
        </p>
      </aside>

      <div className={s.read} data-warn={fate === "overtop" || fate === "cut" ? "true" : "false"}>
        <span>
          {selected ? (
            <>
              <strong>{placeName(selected)}</strong>
              {selected.crest > 0 || selected.cut
                ? ` · crest ${selected.cut ? "open" : selected.crest.toFixed(2)} · ${fate === "overtop" ? "will take water tomorrow" : fate === "cut" ? "spillway" : fate === "holds" ? "holds tomorrow" : "no bank"}`
                : settlement(selected)
                  ? selected.sent
                    ? " · people already sent"
                    : ` · ${selected.people} still here`
                  : " · no bank"}
            </>
          ) : (
            <strong>Touch a bank.</strong>
          )}
        </span>
        <span>{game.log}</span>
      </div>

      <footer className={s.rail}>
        <div className={s.stats}>
          <span>
            Stone <b>{game.stone}</b>
          </span>
          <span>
            Crews <b>
              {game.crews}/{game.crewsMax}
            </b>
          </span>
          <span>
            Cane <b>{cane.total - cane.lost} dry</b>
          </span>
        </div>
        <div className={s.pads}>
          <button type="button" className={s.btn} disabled={!canRaise || busy} onClick={() => act(raise)}>
            Raise
          </button>
          <button type="button" className={s.btn} disabled={!canBrace || busy} onClick={() => act(brace)}>
            Brace
          </button>
          <button type="button" className={s.btn} disabled={!canCut || busy} onClick={() => act(cut)}>
            Cut
          </button>
          <button type="button" className={s.btn} disabled={!canSend || busy} onClick={() => act(send)}>
            Send
          </button>
          <button
            type="button"
            className={s.btn}
            data-hot="true"
            disabled={busy || !!game.ending}
            onClick={river}
          >
            The river comes
          </button>
          {game.ending && (
            <button type="button" className={s.btn} data-hot="true" onClick={restart}>
              New sheet
            </button>
          )}
        </div>
        <div className={s.corners}>
          <button
            type="button"
            className={s.quiet}
            onClick={() => {
              boot();
              setMuted((m) => {
                sound.current.setMuted(!m);
                return !m;
              });
            }}
          >
            {muted ? "Sound" : "Mute"}
          </button>
          <Link href="/tasks/games-strategy" className={s.quiet}>
            Brief
          </Link>
        </div>
      </footer>

      {endingTitle && (
        <div className={s.stamp} aria-hidden="true">
          <strong>{endingTitle}</strong>
          <span>N — new sheet</span>
        </div>
      )}

      <div className={s.live} aria-live="polite">
        {game.log}
      </div>
    </div>
  );
}

function townLine(game: Game, name: string) {
  const cells = game.cells.flat().filter((c) => {
    if (name === "Port Reach") return c.use === "port";
    if (name === "Avery") return c.use === "town";
    return c.use === "hamlet";
  });
  const people = cells.reduce((n, c) => n + c.people, 0);
  const start = cells.reduce((n, c) => n + c.people0, 0);
  const wet = cells.some((c) => c.water > 0.2);
  const sent = cells.every((c) => c.sent);
  return (
    <li key={name}>
      {name}
      <b>
        {sent ? "sent" : wet ? "wet" : "dry"} · {people}/{start}
      </b>
    </li>
  );
}
