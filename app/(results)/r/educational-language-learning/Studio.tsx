"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LESSONS,
  SOURCES,
  boundaries,
  diagnose,
  phraseContour,
  resample,
  sandhiChanged,
  spokenPinyin,
  surfaceOf,
  surfaceLabel,
  underlyingPinyin,
  type Item,
  type Point,
} from "./linguistics";
import {
  HIGH_VOICE,
  LOW_VOICE,
  MID_VOICE,
  estimateRegister,
  hzToChao,
  medianFilter,
  normalizeTimes,
  type Register,
} from "./pitch";
import Staff from "./Staff";
import s from "./studio.module.css";
import { openMic, playContour, playItem, resume, type MicHandle } from "./voice";

type Path = "undecided" | "mic" | "draw" | "shape";
type MicState = "idle" | "asking" | "on" | "denied" | "missing";

const HANDLE_TS = [0, 0.25, 0.5, 0.75, 1];

function itemOf(lesson: number, index: number): Item {
  const L = LESSONS[lesson] ?? LESSONS[0];
  return L?.items[index] ?? L?.items[0] ?? LESSONS[0]!.items[0]!;
}

function flattenHz(samples: number[], next: number[]) {
  const out = samples.concat(next);
  return out.length > 400 ? out.slice(out.length - 400) : out;
}

export default function Studio() {
  const [lesson, setLesson] = useState(0);
  const [index, setIndex] = useState(0);
  const [path, setPath] = useState<Path>("undecided");
  const [mic, setMic] = useState<MicState>("idle");
  const [recording, setRecording] = useState(false);
  const [produced, setProduced] = useState<Point[] | null>(null);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [register, setRegister] = useState<Register | null>(null);
  const [voice, setVoice] = useState<Register>(MID_VOICE);
  const [handles, setHandles] = useState<number[]>([3, 3, 3, 3, 3]);
  const [focusHandle, setFocusHandle] = useState(0);
  const [reduced, setReduced] = useState(false);

  const hzPool = useRef<number[]>([]);
  const rec = useRef<{ t0: number; pts: Point[]; hz: number[] } | null>(null);
  const micRef = useRef<MicHandle | null>(null);
  const drawBuf = useRef<Point[]>([]);
  const liveRef = useRef<Point[] | null>(null);

  const item = itemOf(lesson, index);
  const L = LESSONS[lesson] ?? LESSONS[0]!;
  const target = useMemo(() => phraseContour(item.syllables), [item]);
  const marks = useMemo(() => boundaries(item.syllables), [item]);
  const surface = useMemo(() => surfaceOf(item.syllables), [item]);
  const changed = sandhiChanged(item.syllables);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setProduced(null);
    liveRef.current = null;
    setFeedback(null);
    setOk(null);
    setHandles([3, 3, 3, 3, 3]);
    drawBuf.current = [];
  }, [lesson, index]);

  useEffect(() => {
    return () => {
      micRef.current?.stop();
    };
  }, []);

  const applyResult = useCallback(
    (pts: Point[]) => {
      const clean = resample(medianFilter(normalizeTimes(pts)), 40);
      setProduced(clean);
      liveRef.current = null;
      const d = diagnose(clean, item.syllables, register !== null);
      setFeedback(d.lines);
      setOk(d.ok);
    },
    [item, register],
  );

  const hearTarget = useCallback(async () => {
    await resume();
    playItem(item.syllables, voice);
  }, [item, voice]);

  const hearMine = useCallback(async () => {
    if (!produced || produced.length < 2) return;
    await resume();
    playContour(produced, { duration: 0.55 + 0.28 * item.syllables.length, register: voice });
  }, [produced, item, voice]);

  const chooseDraw = useCallback(() => {
    setPath("draw");
    setFeedback([
      "Draw the tone left to right on the staff, as if writing the pitch. The comparison is the same as with a voice — shape against shape.",
    ]);
    setOk(null);
  }, []);

  const chooseShape = useCallback(() => {
    setPath("shape");
    setHandles(target.map((p) => p.y).length ? sampleHandles(target) : [3, 3, 3, 3, 3]);
    setFeedback([
      "Five points make a line. Up and down change height; left and right pick a point. Enter judges the shape. This is the same comparison, without a microphone or a drawing hand.",
    ]);
    setOk(null);
  }, [target]);

  const requestMic = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMic("missing");
      setPath("draw");
      setFeedback([
        "This browser has no microphone API. Draw the tone on the staff instead — left to right. The judgement is the same.",
      ]);
      return false;
    }
    setMic("asking");
    try {
      await resume();
      const handle = await openMic(() => {});
      handle.stop();
      setMic("on");
      setPath("mic");
      setFeedback([
        "Hold Say it and speak the syllable. Pitch is measured in this tab. Nothing is stored, and nothing is sent.",
      ]);
      return true;
    } catch {
      setMic("denied");
      setPath("draw");
      setFeedback([
        "The microphone is off. That is fine. Draw the tone on the staff, left to right, as if writing the pitch. You will get the same kind of comment.",
      ]);
      return false;
    }
  }, []);

  const startRecord = useCallback(async () => {
    if (recording) return;
    if (mic !== "on") {
      const granted = await requestMic();
      if (!granted) return;
    }
    rec.current = { t0: performance.now(), pts: [], hz: [] };
    setRecording(true);
    liveRef.current = [];
    setProduced(null);
    setFeedback(null);
    setOk(null);
    try {
      const handle = await openMic((hz) => {
        const session = rec.current;
        if (!session) return;
        if (hz) {
          session.hz.push(hz);
          hzPool.current = flattenHz(hzPool.current, [hz]);
          const est = register ?? estimateRegister(hzPool.current);
          if (!register && est) setRegister(est);
          const used = register ?? est ?? MID_VOICE;
          const t = (performance.now() - session.t0) / 1000;
          session.pts.push({ t, y: hzToChao(hz, used) });
          liveRef.current = session.pts;
        }
      });
      micRef.current = handle;
    } catch {
      setRecording(false);
      setMic("denied");
      setPath("draw");
      setFeedback([
        "The microphone closed. Draw the tone instead. The staff still compares shape to shape.",
      ]);
    }
  }, [mic, recording, register, requestMic]);

  const stopRecord = useCallback(() => {
    micRef.current?.stop();
    micRef.current = null;
    setRecording(false);
    const session = rec.current;
    rec.current = null;
    if (!session || session.pts.length < 6) {
      liveRef.current = null;
      setFeedback([
        "I couldn’t find a pitch. Come closer, hold the vowel, and try once more — or draw the tone on the staff.",
      ]);
      setOk(false);
      return;
    }
    const est = estimateRegister(hzPool.current);
    if (est) setRegister(est);
    applyResult(session.pts);
  }, [applyResult]);

  const onDraw = useCallback(
    (point: Point, done: boolean) => {
      if (path !== "draw") return;
      const buf = drawBuf.current;
      const last = buf[buf.length - 1];
      if (!last || point.t >= last.t - 0.002) {
        buf.push(point);
      } else {
        buf.push({ t: last.t + 0.002, y: point.y });
      }
      liveRef.current = buf.slice();
      if (done) {
        const pts = buf.slice();
        drawBuf.current = [];
        if (pts.length < 6) {
          liveRef.current = null;
          setFeedback(["The stroke was too short. Draw across the staff, left to right."]);
          setOk(false);
          return;
        }
        applyResult(pts);
      }
    },
    [path, applyResult],
  );

  const submitHandles = useCallback(() => {
    const pts = HANDLE_TS.map((t, i) => ({ t, y: handles[i] ?? 3 }));
    applyResult(pts);
  }, [handles, applyResult]);

  const onKey = useCallback(
    (event: React.KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === " " && path === "mic") {
        event.preventDefault();
        if (event.type === "keydown" && !event.repeat && !recording) void startRecord();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        void hearTarget();
        return;
      }
      if (path !== "shape") return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setFocusHandle((n) => Math.min(HANDLE_TS.length - 1, n + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setFocusHandle((n) => Math.max(0, n - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHandles((hs) => hs.map((y, i) => (i === focusHandle ? Math.min(5, y + 0.25) : y)));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHandles((hs) => hs.map((y, i) => (i === focusHandle ? Math.max(1, y - 0.25) : y)));
      } else if (event.key === "Enter") {
        event.preventDefault();
        submitHandles();
      }
    },
    [path, recording, startRecord, hearTarget, focusHandle, submitHandles],
  );

  useEffect(() => {
    const up = (e: KeyboardEvent) => {
      if (e.key === " " && recording) {
        e.preventDefault();
        stopRecord();
      }
    };
    window.addEventListener("keyup", up);
    return () => window.removeEventListener("keyup", up);
  }, [recording, stopRecord]);

  const go = (l: number, i = 0) => {
    setLesson(l);
    setIndex(i);
  };

  const nextItem = () => {
    const cur = LESSONS[lesson];
    if (!cur) return;
    if (index + 1 < cur.items.length) setIndex(index + 1);
    else if (lesson + 1 < LESSONS.length) go(lesson + 1, 0);
  };

  const prevItem = () => {
    if (index > 0) setIndex(index - 1);
    else if (lesson > 0) {
      const prev = LESSONS[lesson - 1];
      go(lesson - 1, (prev?.items.length ?? 1) - 1);
    }
  };

  const handleLine = HANDLE_TS.map((t, i) => ({ t, y: handles[i] ?? 3 }));
  const drawing = path === "draw" && !recording;
  const shownProduced = path === "shape" && !produced ? handleLine : produced;

  return (
    <div className={s.root} onKeyDown={onKey}>
      <a className={s.escape} href="/tasks/educational-language-learning">
        prompt
      </a>

      <header className={s.mast}>
        <p className={s.kicker}>Mandarin · production</p>
        <h1 className={s.title}>Tone</h1>
        <p className={s.lead}>
          You cannot hear your own pitch reliably. That is why a second tone can stay
          flat for years while every multiple-choice exercise is marked correct. This
          page makes the contour visible: a target, your line, and a sentence that names
          what to fix. The staff is relative. A low voice and a high voice succeed on
          the same shape.
        </p>
      </header>

      <section className={s.honesty} aria-label="Microphone">
        <p>
          If you speak, pitch is measured <em>here</em>, in this tab. Audio is not
          stored and not sent anywhere. Recording a voice is a lot to ask. You can
          refuse and still practise: draw the tone, or place five points with the
          keys.
        </p>
        <div className={s.paths}>
          <button
            type="button"
            className={path === "mic" ? s.pathOn : s.path}
            onClick={() => void requestMic()}
          >
            Use the microphone
          </button>
          <button
            type="button"
            className={path === "draw" ? s.pathOn : s.path}
            onClick={chooseDraw}
          >
            I’ll draw instead
          </button>
          <button
            type="button"
            className={path === "shape" ? s.pathOn : s.path}
            onClick={chooseShape}
          >
            Place the line
          </button>
        </div>
        {mic === "denied" && (
          <p className={s.aside}>
            Permission was refused. The drawing path is the same exercise: produce a
            contour, see it against the target, read what to change.
          </p>
        )}
        {mic === "missing" && (
          <p className={s.aside}>No microphone API in this browser. Drawing still works.</p>
        )}
        {register && path === "mic" && (
          <p className={s.aside}>
            The staff is now your range ({Math.round(register.lo)}–{Math.round(register.hi)}{" "}
            Hz). Height comments refer to that, not to a piano key.
          </p>
        )}
        {path === "mic" && !register && (
          <p className={s.aside}>
            Until there is enough of your voice to map a range, comments will be about
            shape — rise, fall, dip — not about sitting too high or too low.
          </p>
        )}
      </section>

      <nav className={s.rail} aria-label="Lessons">
        {LESSONS.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            className={i === lesson ? s.railOn : s.railBtn}
            onClick={() => go(i, 0)}
            aria-current={i === lesson ? "step" : undefined}
          >
            <span className={s.num}>{entry.numeral}</span>
            {entry.title}
          </button>
        ))}
      </nav>

      <p className={s.dek}>{L.dek}</p>

      <article className={s.card}>
        <div className={s.word}>
          <p className={s.han} lang="zh-Hans">
            {item.syllables.map((syl) => syl.han).join("")}
          </p>
          <p className={s.py}>
            <span className={s.spoken}>{spokenPinyin(item.syllables)}</span>
            {changed && (
              <span className={s.under}>
                {" "}
                underlying {underlyingPinyin(item.syllables)}
              </span>
            )}
          </p>
          <ul className={s.chips}>
            {item.syllables.map((syl, i) => (
              <li key={`${syl.han}-${i}`}>
                <b lang="zh-Hans">{syl.han}</b> {surfaceLabel(surface[i] ?? "1")}
              </li>
            ))}
          </ul>
        </div>
        <p className={s.note}>{item.note}</p>

        <Staff
          target={target}
          produced={shownProduced}
          liveRef={liveRef}
          marks={marks}
          drawing={drawing}
          onDraw={onDraw}
        />

        {path === "shape" && (
          <div className={s.handles} role="group" aria-label="Contour points">
            {HANDLE_TS.map((t, i) => (
              <button
                key={t}
                type="button"
                className={i === focusHandle ? s.handleOn : s.handle}
                onClick={() => setFocusHandle(i)}
                aria-label={`Point ${i + 1}, level ${(handles[i] ?? 3).toFixed(1)}`}
              >
                {i + 1}
                <span>{(handles[i] ?? 3).toFixed(1)}</span>
              </button>
            ))}
          </div>
        )}

        <div className={s.legend} aria-hidden="true">
          <span className={s.legT}>target</span>
          <span className={s.legY}>yours</span>
        </div>

        <div className={s.controls}>
          <button type="button" className={s.btn} onClick={() => void hearTarget()}>
            Hear it
          </button>
          <div className={s.voices} role="group" aria-label="Playback voice">
            <button
              type="button"
              className={voice === LOW_VOICE ? s.vOn : s.v}
              onClick={() => setVoice(LOW_VOICE)}
            >
              lower
            </button>
            <button
              type="button"
              className={voice === MID_VOICE ? s.vOn : s.v}
              onClick={() => setVoice(MID_VOICE)}
            >
              mid
            </button>
            <button
              type="button"
              className={voice === HIGH_VOICE ? s.vOn : s.v}
              onClick={() => setVoice(HIGH_VOICE)}
            >
              higher
            </button>
          </div>
          <button
            type="button"
            className={s.btn}
            onClick={() => void hearMine()}
            disabled={!produced}
          >
            Hear your shape
          </button>
          {path === "mic" || path === "undecided" ? (
            <button
              type="button"
              className={recording ? s.holdOn : s.hold}
              onPointerDown={(e) => {
                e.preventDefault();
                void startRecord();
              }}
              onPointerUp={stopRecord}
              onPointerCancel={stopRecord}
              onPointerLeave={() => {
                if (recording) stopRecord();
              }}
              aria-pressed={recording}
            >
              {recording ? "Listening…" : "Say it"}
            </button>
          ) : path === "draw" ? (
            <p className={s.hint}>Draw on the staff, left to right.</p>
          ) : (
            <button type="button" className={s.btn} onClick={submitHandles}>
              Judge this line
            </button>
          )}
        </div>

        <p className={s.voiceNote}>
          Hear it in a lower voice and a higher one. The shape does not change. That
          is the argument for a relative staff: tone is not a note.
        </p>

        {feedback && (
          <div className={ok === null ? s.fbInfo : ok ? s.fbOk : s.fb} role="status">
            {feedback.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}

        <div className={s.stepper}>
          <button type="button" className={s.step} onClick={prevItem} disabled={lesson === 0 && index === 0}>
            Previous
          </button>
          <p className={s.pos}>
            {L.title} · {index + 1} / {L.items.length}
          </p>
          <button
            type="button"
            className={s.step}
            onClick={nextItem}
            disabled={lesson === LESSONS.length - 1 && index === L.items.length - 1}
          >
            Next
          </button>
        </div>
      </article>

      <section className={s.essay}>
        <h2>Beyond the four arrows</h2>
        <p>
          Isolation drills teach 214 as “the third tone.” In a sentence the rise is
          usually gone. Two thirds in a row, and the first is no longer a third tone
          at all. A suffix like 子 or 吗 has no contour of its own; it borrows a
          height. 不 flips before a fourth tone. None of that is advanced material.
          It is what 你好吗 actually is.
        </p>
        <p>
          Feedback here will not give you a percentage. Seventy-two is not a
          correction. “Your second tone starts too high and stops rising too early”
          is. If the microphone is off, the same sentence can be said of a line you
          drew. The skill being trained is the contour, not the bravery of speaking
          into a laptop.
        </p>
        {!reduced && (
          <p className={s.quiet}>
            Motion on this page is the line being drawn. If you have asked the system
            to reduce motion, the staff still updates; it just does not chase the
            stroke.
          </p>
        )}
      </section>

      <footer className={s.foot}>
        <h2 className={s.footH}>Where the shapes come from</h2>
        <ul>
          {SOURCES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={s.keys}>
          H hears the target. In microphone mode, hold space to speak. In place-the-line
          mode, arrows move a point; enter judges it.
        </p>
      </footer>
    </div>
  );
}

function sampleHandles(target: Point[]): number[] {
  return HANDLE_TS.map((t) => {
    let y = 3;
    for (let i = 1; i < target.length; i++) {
      const a = target[i - 1];
      const b = target[i];
      if (!a || !b) continue;
      if (t <= b.t) {
        const u = (t - a.t) / (b.t - a.t || 1);
        y = a.y + (b.y - a.y) * u;
        break;
      }
      y = b.y;
    }
    return y;
  });
}
