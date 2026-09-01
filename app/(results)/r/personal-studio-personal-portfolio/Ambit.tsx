"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  KINDS,
  KIND_LABEL,
  PLACES,
  RECORDINGS,
  SEASONS,
  YEARS,
  attentionLine,
  byId,
  clock,
  dur,
  filterRecordings,
  longDate,
  nextIn,
  prevIn,
  seasonOf,
  threadActive,
  type Filter,
  type Kind,
  type Recording,
  type Season,
} from "./data";
import Plot from "./Plot";
import { createAudio, type AmbitAudio } from "./audio";
import s from "./ambit.module.css";

const STEP = 1 / 30;

function placeCounts(base: Filter) {
  const counts = new Map<string, number>();
  for (const r of filterRecordings({ ...base, placeId: undefined })) {
    counts.set(r.placeId, (counts.get(r.placeId) ?? 0) + 1);
  }
  return counts;
}

function kindCounts(base: Filter) {
  const counts = new Map<Kind, number>();
  for (const r of filterRecordings({ ...base, kind: undefined })) {
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
  }
  return counts;
}

function hourCounts(base: Filter) {
  const counts = new Array<number>(24).fill(0);
  for (const r of filterRecordings({ ...base, hour: undefined })) {
    counts[r.hour] += 1;
  }
  return counts;
}

export default function Ambit() {
  const [filter, setFilter] = useState<Filter>({});
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [panel, setPanel] = useState<"read" | "licence">("read");
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [need, setNeed] = useState("");
  const audio = useRef<AmbitAudio | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const advancing = useRef(false);

  const applied: Filter = { ...filter, q: query };
  const visible = useMemo(() => filterRecordings(applied), [filter, query]);
  const selectedRec = selected ? byId(selected) : null;
  const playingRec = playingId ? byId(playingId) : null;
  const reading = selectedRec ?? playingRec;
  const listening = Boolean(playingId && !paused);

  const countsByPlace = useMemo(() => placeCounts(applied), [filter, query]);
  const places = useMemo(
    () => [...PLACES].sort((a, b) => (countsByPlace.get(b.id) ?? 0) - (countsByPlace.get(a.id) ?? 0)),
    [countsByPlace],
  );

  const hours = useMemo(() => hourCounts(applied), [filter, query]);
  const kinds = useMemo(() => kindCounts(applied), [filter, query]);

  useEffect(() => {
    audio.current = createAudio();
    return () => audio.current?.stop();
  }, []);

  const start = useCallback(async (rec: Recording) => {
    advancing.current = false;
    setSelected(rec.id);
    setPlayingId(rec.id);
    setPaused(false);
    setPlayhead(0);
    setPanel("read");
    await audio.current?.unlock();
    await audio.current?.play(rec);
  }, []);

  const togglePause = useCallback(() => {
    if (!playingId) {
      const rec = selectedRec ?? visible[0];
      if (rec) void start(rec);
      return;
    }
    if (paused) {
      audio.current?.resume();
      setPaused(false);
    } else {
      audio.current?.pause();
      setPaused(true);
    }
  }, [paused, playingId, selectedRec, start, visible]);

  const stop = useCallback(() => {
    audio.current?.stop();
    setPlayingId(null);
    setPaused(false);
    setPlayhead(0);
  }, []);

  useEffect(() => {
    if (!playingId || paused) return;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        setPlayhead((p) => p + STEP);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playingId, paused]);

  useEffect(() => {
    if (!playingId || paused) return;
    const rec = byId(playingId);
    if (!rec) return;
    if (playhead < rec.impressionSec) return;
    if (advancing.current) return;
    advancing.current = true;
    const nxt = nextIn(visible, playingId);
    if (nxt) void start(nxt);
  }, [playhead, playingId, paused, visible, start]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typing && event.key !== "Escape") return;
      if (event.key === "Escape") {
        if (typing) {
          (event.target as HTMLElement).blur();
          return;
        }
        if (panel === "licence") {
          setPanel("read");
          return;
        }
        stop();
        return;
      }
      if (event.key === "l" && !typing) {
        setPanel((p) => (p === "licence" ? "read" : "licence"));
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        if (tag === "BUTTON" || tag === "A") return;
        if (event.key === " ") event.preventDefault();
        if (event.key === "Enter" && selectedRec && selectedRec.id !== playingId) {
          void start(selectedRec);
          return;
        }
        togglePause();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "n" || event.key === "]") {
        event.preventDefault();
        const nxt = nextIn(visible, selected ?? playingId ?? "");
        if (!nxt) return;
        setSelected(nxt.id);
        if (playingId && (event.key === "n" || event.key === "]")) void start(nxt);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "p" || event.key === "[") {
        event.preventDefault();
        const prv = prevIn(visible, selected ?? playingId ?? "");
        if (!prv) return;
        setSelected(prv.id);
        if (playingId && (event.key === "p" || event.key === "[")) void start(prv);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nxt = nextIn(visible, selected ?? playingId ?? "");
        if (nxt) setSelected(nxt.id);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prv = prevIn(visible, selected ?? playingId ?? "");
        if (prv) setSelected(prv.id);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, playingId, selected, selectedRec, start, stop, togglePause, visible]);

  useEffect(() => {
    if (!selected) return;
    const row = listRef.current?.querySelector(`[data-id="${selected}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function toggleDim<K extends keyof Filter>(key: K, value: Filter[K]) {
    setFilter((f) => (f[key] === value ? { ...f, [key]: undefined } : { ...f, [key]: value }));
  }

  function toggleStar(id: string) {
    setShortlist((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  }

  const shortRecs = shortlist.map(byId).filter((r): r is Recording => Boolean(r));
  const mailBody = [
    name ? `From: ${name}` : "",
    project ? `Project: ${project}` : "",
    need ? `Need: ${need}` : "",
    "",
    shortRecs.length
      ? `Shortlist:\n${shortRecs.map((r) => `${r.cat} — ${r.place}, ${longDate(r)}, ${clock(r.hour, r.minute)}, ${dur(r.durationMin)}, ${KIND_LABEL[r.kind]}`).join("\n")}`
      : "Shortlist: (none yet)",
    "",
    "The previews on ambit are synthesized impressions. Please send masters as 96 kHz / 24-bit WAV.",
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");

  const mailto = `mailto:signe.vale@ambit.field?subject=${encodeURIComponent(
    project ? `Ambit enquiry — ${project}` : "Ambit enquiry",
  )}&body=${encodeURIComponent(mailBody)}`;

  return (
    <main className={`${s.page} ${listening ? s.listening : ""}`}>
      <header className={s.mast}>
        <div className={s.brand}>
          <h1>Ambit</h1>
          <span className={s.who}>Signe Vale · field recordings · 2015–2026</span>
        </div>
        <nav className={s.nav}>
          <button
            type="button"
            aria-pressed={panel === "licence"}
            onClick={() => setPanel((p) => (p === "licence" ? "read" : "licence"))}
          >
            Licence{shortlist.length ? ` · ${shortlist.length}` : ""}
          </button>
          <Link className={s.task} href="/tasks/personal-studio-personal-portfolio">
            Task
          </Link>
        </nav>
      </header>

      <p className={s.lede}>
        Four hundred takes, plotted by <em>the hour she went</em> and <em>the day of the year</em>.
        Mark size is how long the microphone stayed open.
      </p>

      <div className={`${s.work} ${threadActive(applied) ? s.threaded : ""}`}>
        <aside className={s.threads} aria-label="Threads">
          <label className={s.searchLab}>
            <span>Find</span>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="thaw, silo, 04, Hanoi"
              aria-label="Search the archive"
              enterKeyHint="search"
            />
          </label>

          <p className={s.threadRead}>{attentionLine(visible)}</p>

          {threadActive(applied) ? (
            <button type="button" className={s.clear} onClick={() => { setFilter({}); setQuery(""); }}>
              Clear thread
            </button>
          ) : null}

          <h2>Season</h2>
          <div className={s.chips} role="group" aria-label="Season">
            {SEASONS.map((season) => (
              <button
                key={season}
                type="button"
                aria-pressed={filter.season === season}
                onClick={() => toggleDim("season", season)}
              >
                {season}
              </button>
            ))}
          </div>

          <h2>Hour</h2>
          <div className={s.hours} role="group" aria-label="Hour of day">
            {hours.map((n, h) => (
              <button
                key={h}
                type="button"
                aria-pressed={filter.hour === h}
                disabled={n === 0}
                onClick={() => toggleDim("hour", h)}
                title={`${n} recordings`}
              >
                {String(h).padStart(2, "0")}
              </button>
            ))}
          </div>

          <h2>Kind of sound</h2>
          <div className={s.chips} role="group" aria-label="Kind of sound">
            {KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={filter.kind === kind}
                disabled={!kinds.get(kind)}
                onClick={() => toggleDim("kind", kind)}
              >
                {KIND_LABEL[kind]}
                <em>{kinds.get(kind) ?? 0}</em>
              </button>
            ))}
          </div>

          <h2>Year</h2>
          <div className={s.chips} role="group" aria-label="Year">
            {YEARS.map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={filter.year === year}
                onClick={() => toggleDim("year", year)}
              >
                {year}
              </button>
            ))}
          </div>

          <h2>Place</h2>
          <ul className={s.places}>
            {places.map((place) => {
              const n = countsByPlace.get(place.id) ?? 0;
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    aria-pressed={filter.placeId === place.id}
                    disabled={n === 0}
                    onClick={() => toggleDim("placeId", place.id)}
                  >
                    <span>{place.name}</span>
                    <em>{n}</em>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className={s.plotWrap}>
          <Plot
            visible={visible}
            selected={selected}
            playing={playingId}
            filter={applied}
            onSelect={(r) => setSelected(r.id)}
            onPlay={(r) => void start(r)}
            onHour={(h) => toggleDim("hour", h)}
            onSeason={(season) => toggleDim("season", season)}
          />
        </div>

        {threadActive(applied) ? (
          <div className={s.list} ref={listRef} role="listbox" aria-label="Sessions in this thread">
            {visible.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                data-id={r.id}
                aria-selected={r.id === selected}
                className={`${s.row} ${r.id === playingId ? s.rowPlay : ""}`}
                onClick={() => {
                  setSelected(r.id);
                  void start(r);
                }}
              >
                <span className={s.rowCat}>{r.cat}</span>
                <span className={s.rowPlace}>{r.place}</span>
                <span className={s.rowMeta}>
                  {clock(r.hour, r.minute)} · {dur(r.durationMin)} · {KIND_LABEL[r.kind]}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className={s.listHint} ref={listRef}>
            Follow a place, a season, an hour or a kind of sound and the register opens. The whole
            archive stays on the plot.
          </div>
        )}

        <section className={s.reading} aria-live="polite">
          {panel === "licence" ? (
            <Licence
              shortRecs={shortRecs}
              name={name}
              project={project}
              need={need}
              mailto={mailto}
              onName={setName}
              onProject={setProject}
              onNeed={setNeed}
              onRemove={toggleStar}
            />
          ) : reading ? (
            <Take
              rec={reading}
              listed={shortlist.includes(reading.id)}
              onList={() => toggleStar(reading.id)}
              onPlay={() => void start(reading)}
              onPlace={() => toggleDim("placeId", reading.placeId)}
              onHour={() => toggleDim("hour", reading.hour)}
              onSeason={() => toggleDim("season", seasonOf(reading.month))}
              onKind={() => toggleDim("kind", reading.kind)}
            />
          ) : (
            <Empty />
          )}
        </section>
      </div>

      <footer className={s.player}>
        {playingRec ? (
          <Player
            rec={playingRec}
            paused={paused}
            playhead={playhead}
            onToggle={togglePause}
            onStop={stop}
            onNext={() => {
              const nxt = nextIn(visible, playingRec.id);
              if (nxt) void start(nxt);
            }}
            onPrev={() => {
              const prv = prevIn(visible, playingRec.id);
              if (prv) void start(prv);
            }}
          />
        ) : (
          <p className={s.playerIdle}>
            Silent. Click a mark, a row, or a season band. Space plays. N and P move in the
            thread. Listening continues while you wander.
          </p>
        )}
      </footer>
    </main>
  );
}

function Empty() {
  return (
    <div className={s.empty}>
      <h2>A thread, or a mark</h2>
      <p>
        The plot is the work: she goes out before six, she returns to March, she waits. Click a
        season, an hour, a place — or a mark, and listen.
      </p>
      <p>
        A modelled archive. Places are real; dates, notes and takes are written for this site. Sound
        is synthesized from each session&apos;s character, not her masters. The field is silent until
        you choose.
      </p>
    </div>
  );
}

function Take({
  rec,
  listed,
  onList,
  onPlay,
  onPlace,
  onHour,
  onSeason,
  onKind,
}: {
  rec: Recording;
  listed: boolean;
  onList: () => void;
  onPlay: () => void;
  onPlace: () => void;
  onHour: () => void;
  onSeason: () => void;
  onKind: () => void;
}) {
  return (
    <article className={s.take}>
      <p className={s.takeCat}>{rec.cat}</p>
      <h2>{rec.place}</h2>
      <p className={s.takeReg}>{rec.region}</p>
      <p className={s.takeFacts}>
        <button type="button" onClick={onPlace}>
          {rec.place}
        </button>
        <button type="button" onClick={onSeason}>
          {seasonOf(rec.month)}
        </button>
        <button type="button" onClick={onHour}>
          {clock(rec.hour, rec.minute)}
        </button>
        <button type="button" onClick={onKind}>
          {KIND_LABEL[rec.kind]}
        </button>
      </p>
      <p className={s.takeWhen}>
        {longDate(rec)} · master {dur(rec.durationMin)} · she waited {rec.stillnessMin}′ before
        rolling · {rec.lat.toFixed(2)}°, {rec.lon.toFixed(2)}°
      </p>
      <div className={s.pair}>
        <p>
          <span>After</span>
          {rec.sought}
        </p>
        <p>
          <span>What happened</span>
          {rec.found}
        </p>
      </div>
      <div className={s.takeActs}>
        <button type="button" className={s.primary} onClick={onPlay}>
          Listen
        </button>
        <button type="button" aria-pressed={listed} onClick={onList}>
          {listed ? "On the shortlist" : "Shortlist for licence"}
        </button>
      </div>
    </article>
  );
}

function Player({
  rec,
  paused,
  playhead,
  onToggle,
  onStop,
  onNext,
  onPrev,
}: {
  rec: Recording;
  paused: boolean;
  playhead: number;
  onToggle: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const t = Math.min(playhead, rec.impressionSec);
  const pct = (t / rec.impressionSec) * 100;
  return (
    <div className={s.now}>
      <div className={s.nowMain}>
        <p className={s.nowTitle}>
          {rec.place}
          <span>
            {rec.cat} · {clock(rec.hour, rec.minute)} · impression, not the {dur(rec.durationMin)}{" "}
            master
          </span>
        </p>
        <div className={s.meter} aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className={s.nowActs}>
        <button type="button" onClick={onPrev} aria-label="Previous in thread">
          Prev
        </button>
        <button type="button" className={s.primary} onClick={onToggle}>
          {paused ? "Continue" : "Pause"}
        </button>
        <button type="button" onClick={onNext} aria-label="Next in thread">
          Next
        </button>
        <button type="button" onClick={onStop}>
          Stop
        </button>
      </div>
    </div>
  );
}

function Licence({
  shortRecs,
  name,
  project,
  need,
  mailto,
  onName,
  onProject,
  onNeed,
  onRemove,
}: {
  shortRecs: Recording[];
  name: string;
  project: string;
  need: string;
  mailto: string;
  onName: (v: string) => void;
  onProject: (v: string) => void;
  onNeed: (v: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={s.licence}>
      <h2>Licence</h2>
      <p>
        Previews on this page are synthesized impressions. Masters are 96 kHz / 24-bit WAV, delivered
        after invoice. Credit: <em>Recording: Signe Vale / Ambit</em>.
      </p>
      <h3>Standard sync</h3>
      <p>
        Non-exclusive use in one named film, game, installation or broadcast. Territory and term on
        the invoice. The title stays in the catalogue.
      </p>
      <h3>Exclusive</h3>
      <p>
        Buy-out of a title. It is withdrawn from the catalogue on delivery. Quote the catalogue
        number.
      </p>
      <h3>Shortlist</h3>
      {shortRecs.length === 0 ? (
        <p className={s.hint}>Star takes as you listen. They collect here.</p>
      ) : (
        <ul>
          {shortRecs.map((r) => (
            <li key={r.id}>
              <span>
                {r.cat} · {r.place}
              </span>
              <button type="button" onClick={() => onRemove(r.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <h3>Enquire</h3>
      <p className={s.hint}>
        No form is sent from this page. The button opens a message to signe.vale@ambit.field with
        your shortlist in the body — a composed address for this modelled studio.
      </p>
      <label>
        Name
        <input value={name} onChange={(e) => onName(e.target.value)} autoComplete="name" />
      </label>
      <label>
        Project
        <input value={project} onChange={(e) => onProject(e.target.value)} />
      </label>
      <label>
        What you need
        <textarea value={need} onChange={(e) => onNeed(e.target.value)} rows={4} />
      </label>
      <a className={s.primary} href={mailto}>
        Open the enquiry
      </a>
    </div>
  );
}
