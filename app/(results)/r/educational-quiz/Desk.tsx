"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { tap, unlockAudio } from "./audio";
import Bench, { type Phase } from "./Bench";
import s from "./naive.module.css";
import {
  choiceByKey,
  DIAGNOSES,
  ITEMS,
  type Choice,
  type SituationId,
} from "./questions";

function readReduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Desk() {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [phase, setPhase] = useState<Phase>("live");
  const [held, setHeld] = useState<Partial<Record<SituationId, Choice>>>({});
  const [reduced, setReduced] = useState(false);
  const [touched, setTouched] = useState(false);
  const [nudge, setNudge] = useState(0);

  const item = ITEMS[index];

  useEffect(() => {
    setReduced(readReduced());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    document.getElementById("naive-root")?.focus({ preventScroll: true });
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = useCallback((i: number) => {
    setIndex(i);
    setChoice(null);
    setPhase("live");
  }, []);

  const pick = useCallback(
    (next: Choice) => {
      unlockAudio();
      tap("shove");
      setTouched(true);
      setChoice(next);
      setHeld((h) => ({ ...h, [item.id]: next }));
      setPhase("run");
      requestAnimationFrame(() => {
        document.getElementById("diagnosis")?.scrollIntoView({
          block: "nearest",
          behavior: reduced ? "auto" : "smooth",
        });
      });
    },
    [item.id, reduced],
  );

  const onSettled = useCallback(() => {
    setPhase("done");
    if (choice && !choice.correct) tap("split");
    else tap("land");
  }, [choice]);

  const onMotion = useCallback(() => {
    unlockAudio();
    tap("shove");
    setTouched(true);
  }, []);

  const replay = useCallback(() => {
    if (!choice) return;
    unlockAudio();
    tap("shove");
    setPhase("live");
    requestAnimationFrame(() => setPhase("run"));
  }, [choice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const letter =
        e.key.length === 1 ? e.key : e.code.replace(/^Key/, "");
      const fromKey =
        choiceByKey(item, letter) ??
        item.choices[Number(e.key) - 1];
      if (fromKey) {
        e.preventDefault();
        pick(fromKey);
        return;
      }
      if (e.target instanceof HTMLButtonElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (choice && phase !== "run") replay();
        else if (!choice) setNudge((n) => n + 1);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        go((index + 1) % ITEMS.length);
      }
      if (e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        go((index + ITEMS.length - 1) % ITEMS.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, choice, phase, pick, replay, go, index, onMotion]);

  const diagnosis = choice ? DIAGNOSES[choice.id] : null;
  const answered = Object.keys(held).length;
  const allRight =
    answered === ITEMS.length &&
    ITEMS.every((it) => held[it.id]?.correct);
  const anyWrong = ITEMS.some((it) => held[it.id] && !held[it.id]?.correct);

  const liveText = useMemo(() => {
    if (!diagnosis || phase === "live") return "";
    return `${diagnosis.theory}. ${diagnosis.body}`;
  }, [diagnosis, phase]);

  return (
    <div className={s.root} id="naive-root" tabIndex={-1}>
      <a className={s.skip} href="#prompt">
        Skip to the question
      </a>
      <Link href="/tasks/educational-quiz" className={s.task}>
        the brief
      </Link>

      <div className={s.shell}>
        <header className={s.mast}>
          <h1>
            Naive <em>Physics</em>
          </h1>
          <p className={s.lede}>
            A wrong answer is not missing knowledge. It is a theory — usually
            the same theory, in classroom after classroom since the early 1980s.
            Each distractor names one. The feedback is the world, run against
            that prediction. No marks. Being right closes the item; being wrong
            is the work.
          </p>
        </header>

        <figure className={s.bench} aria-label={item.title}>
          <div className={s.stage}>
          <Bench
            situation={item.id}
            model={choice?.model ?? "newton"}
            correct={choice?.correct ?? true}
            phase={phase}
            reduced={reduced}
            nudge={nudge}
            onSettled={onSettled}
            onMotion={onMotion}
          />
          </div>
          <figcaption className={s.caption}>
            <span>
              {item.caption}
              {touched ? "" : ` · ${item.action}`}
            </span>
            {phase !== "live" && choice && !choice.correct ? (
              <span className={s.legend} aria-hidden="true">
                <span>
                  <i className={s.swatch} />
                  happens
                </span>
                <span>
                  <i className={s.swatchRust} />
                  predicted
                </span>
              </span>
            ) : null}
          </figcaption>
        </figure>

        <aside className={s.rail}>
          <p className={s.itemNo}>{item.no}</p>
          <h2 className={s.prompt} id="prompt">
            {item.prompt}
          </h2>

          <ul className={s.answers} role="list">
            {item.choices.map((c) => {
              const pressed = choice?.id === c.id;
              const kind =
                phase === "live" ? undefined : c.correct ? "right" : "wrong";
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={s.answer}
                    aria-pressed={pressed}
                    data-kind={pressed ? kind : undefined}
                    onClick={() => pick(c)}
                  >
                    <span className={s.key} aria-hidden="true">
                      {c.key}
                    </span>
                    {c.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {diagnosis && phase !== "live" ? (
            <div className={s.diagnosis} id="diagnosis">
              <p className={s.theory} data-kind={choice?.correct ? "right" : "wrong"}>
                {diagnosis.theory}
              </p>
              <p>{diagnosis.body}</p>
              <p className={s.cite}>{diagnosis.cite}</p>
              <div className={s.actions}>
                <button type="button" className={s.btn} onClick={replay}>
                  Run it again
                </button>
                {index < ITEMS.length - 1 ? (
                  <button
                    type="button"
                    className={s.btnGhost}
                    onClick={() => go(index + 1)}
                  >
                    Next situation
                  </button>
                ) : (
                  <button
                    type="button"
                    className={s.btnGhost}
                    onClick={() => go(0)}
                  >
                    Back to the ice
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className={s.hint}>
              Keys A–D choose a theory. Space flicks, drops, throws, or cuts.
              Drag the puck. The first action is supposed to move something.
            </p>
          )}

          <div className={s.nav} role="navigation" aria-label="Situations">
            {ITEMS.map((it, i) => (
              <button
                key={it.id}
                type="button"
                className={s.dot}
                aria-current={i === index}
                aria-label={it.title}
                data-held={
                  held[it.id] ? (held[it.id]?.correct ? "right" : "wrong") : undefined
                }
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>

        <footer className={s.closer}>
          <div>
            <h2>If you were right on every item</h2>
            {allRight ? (
              <p>
                You already used Newton’s model throughout. This page is a
                diagnostic for theories you do not hold. There is nothing here
                for you to unlearn — which is the only honest thing to say.
              </p>
            ) : anyWrong ? (
              <p>
                The theories that failed are the ones worth keeping:{" "}
                {ITEMS.filter((it) => held[it.id] && !held[it.id]?.correct)
                  .map((it) => DIAGNOSES[held[it.id]!.id].theory)
                  .join("; ")}
                . A score would compete with that.
              </p>
            ) : (
              <p>
                A learner who already has the Newtonian model will learn
                nothing here. That is not a defect. The page is built for the
                other case: a consistent, documented, wrong physics, confronted
                in the situation that refutes it.
              </p>
            )}
          </div>
          <div>
            <h2>The misconceptions, as written down</h2>
            <ol>
              <li>
                McCloskey, M. “Intuitive physics.” Scientific American 248,
                no. 4 (1983): 122–130.
              </li>
              <li>
                McCloskey, M., A. Caramazza, and B. Green. “Curvilinear motion
                in the absence of external forces.” Science 210 (1980):
                1139–1141.
              </li>
              <li>
                Clement, J. “Students’ preconceptions in introductory
                mechanics.” American Journal of Physics 50, no. 1 (1982):
                66–71.
              </li>
              <li>
                Halloun, I. A., and D. Hestenes. “Common sense concepts about
                motion.” American Journal of Physics 53, no. 11 (1985):
                1056–1065.
              </li>
              <li>
                Hestenes, D., M. Wells, and G. Swackhamer. “Force Concept
                Inventory.” The Physics Teacher 30 (1992): 141–158.
              </li>
            </ol>
            <p>
              g = 9.81 m/s². Vacuum, frictionless ice, a horizontal circle on
              a table: the usual teaching idealisations, labelled as such. The
              integrator is semi-implicit Euler at 120 Hz; circular idle motion
              is advanced in angle so the string does not spiral from numerical
              error. The rust paths are not physics. They are the theories
              above, written as kinematics.
            </p>
          </div>
        </footer>
      </div>

      <div className={s.live} role="status" aria-live="polite">
        {liveText}
      </div>
    </div>
  );
}
