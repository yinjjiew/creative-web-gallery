"use client";

/**
 * next/dynamic with ssr: false lives here — a Client Component — so the
 * WebGL scene is never prerendered and never lands in a shared chunk.
 */

import dynamic from "next/dynamic";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./core.module.css";
import {
  CODA,
  HORIZONS,
  INTRO,
  KIND_LABEL,
  PROVENANCE,
} from "./horizons";
import {
  formatLinear,
  formatLogMetres,
  formatYears,
  linearMetres,
  logMetres,
  yearsAt,
} from "./time";

const serif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-scroll-controlled";

function nearestId(t: number) {
  let best = "";
  let dist = 0.055;
  for (const h of HORIZONS) {
    const d = Math.abs(h.t - t);
    if (d < dist) {
      dist = d;
      best = h.id;
    }
  }
  return best;
}

export default function Core() {
  const progressRef = useRef(0);
  const depthRef = useRef<HTMLElement>(null);
  const yearsRef = useRef<HTMLElement>(null);
  const linearRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState("");

  const writeReadout = useCallback((t: number) => {
    const years = yearsAt(t);
    if (depthRef.current) depthRef.current.textContent = formatLogMetres(logMetres(t));
    if (yearsRef.current) yearsRef.current.textContent = formatYears(years);
    if (linearRef.current) {
      linearRef.current.textContent = formatLinear(linearMetres(years));
    }
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastT = -1;
    const sample = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, window.scrollY / max));
      progressRef.current = t;
      if (Math.abs(t - lastT) > 0.0003) {
        lastT = t;
        writeReadout(t);
        const id = nearestId(t);
        setActive((prev) => (prev === id ? prev : id));
      }
    };
    const tick = () => {
      sample();
      raf = requestAnimationFrame(tick);
    };
    sample();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", sample);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sample);
    };
  }, [writeReadout]);

  const go = useCallback((t: number) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, t * max);
  }, []);

  return (
    <div className={`${serif.variable} ${sans.variable} ${styles.page}`}>
      <h1 className={styles.sr}>Core — a vertical section through deep time</h1>

      <div className={styles.stage} aria-hidden="true">
        <Stage progressRef={progressRef} />
      </div>

      <div className={styles.well}>
        <article className={styles.intro}>
          <p className={styles.kicker}>{INTRO.kicker}</p>
          <h2 className={styles.title}>{INTRO.title}</h2>
          {INTRO.body.map((p) => (
            <p className={styles.lede} key={p.slice(0, 24)}>
              {p}
            </p>
          ))}
          <ul className={styles.contents}>
            {HORIZONS.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => go(h.t)}>
                  {h.thumb}
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.provenance}>{PROVENANCE}</p>
        </article>

        {HORIZONS.map((h) => (
          <article
            key={h.id}
            className={styles.note}
            data-active={active === h.id}
            style={{ ["--t" as string]: String(h.t) }}
          >
            <p className={styles.kicker}>{h.kicker}</p>
            <h2 className={styles.title}>{h.title}</h2>
            <p className={styles.body}>{h.body}</p>
            <span className={styles.kind}>{KIND_LABEL[h.kind]}</span>
          </article>
        ))}

        <article className={styles.coda} style={{ ["--t" as string]: "1" }}>
          <p className={styles.kicker}>{CODA.kicker}</p>
          <h2 className={styles.title}>{CODA.title}</h2>
          <p className={styles.body}>{CODA.body}</p>
        </article>
      </div>

      <div className={styles.hud}>
        <p className={styles.word}>Core</p>
        <a className={styles.task} href={TASK}>
          Task
        </a>
        <dl className={styles.instrument}>
          <div>
            <dt>Log depth</dt>
            <dd>
              <strong ref={depthRef}>surface</strong>
            </dd>
          </div>
          <div>
            <dt>Years before now</dt>
            <dd>
              <strong ref={yearsRef}>this year</strong>
            </dd>
          </div>
          <div>
            <dt>Linear equivalent</dt>
            <dd>
              <strong ref={linearRef}>0.0 µm</strong>
            </dd>
          </div>
          <div>
            <dt>Axis</dt>
            <dd>log₁₀ time</dd>
          </div>
        </dl>
        <p className={styles.scale}>
          240 m of log-time. The steel rod is linear: 1 mm = 18,900 years. The
          bead on it is where you would actually be.
        </p>
      </div>
    </div>
  );
}
