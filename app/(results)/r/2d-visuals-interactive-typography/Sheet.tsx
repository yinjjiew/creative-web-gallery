"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { STANZAS } from "./poem";
import styles from "./press.module.css";

const Press = dynamic(() => import("./Press"), {
  ssr: false,
  loading: () => <span className={styles.pending} aria-hidden="true" />,
});

export default function Sheet({ fontFamily }: { fontFamily: string }) {
  const [lifted, setLifted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hint, setHint] = useState("Carry the lamp.");
  const [live, setLive] = useState("");

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)");

    const apply = () => {
      if (motion.matches) {
        setLifted(true);
        setHint("The sheet is held to the window.");
      } else {
        setHint(coarse.matches ? "Drag the lamp." : "Carry the lamp.");
      }
    };
    apply();
    motion.addEventListener("change", apply);
    coarse.addEventListener("change", apply);
    return () => {
      motion.removeEventListener("change", apply);
      coarse.removeEventListener("change", apply);
    };
  }, []);

  const onAnnounce = useCallback((text: string) => {
    setLive(text);
  }, []);

  const toggleLift = useCallback(() => {
    setLifted((was) => {
      const next = !was;
      setHint(next ? "The sheet is held to the window." : "Carry the lamp.");
      setLive(
        next
          ? "The sheet is held to the window. The impression is readable as print."
          : "The sheet is back on the bench. Carry the lamp to read.",
      );
      return next;
    });
  }, []);

  return (
    <>
      {!failed ? (
        <Press
          fontFamily={fontFamily}
          lifted={lifted}
          onAnnounce={onAnnounce}
          onFailed={() => setFailed(true)}
          onToggleLift={toggleLift}
        />
      ) : null}

      {failed ? (
        <article className={`${styles.proof} ${styles.failed}`}>
          {STANZAS.map((stanza, i) => (
            <p key={i}>
              {stanza.map((line, j) => (
                <span key={j}>
                  {j > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>
          ))}
          <footer>
            WebGL 2 was not granted, so the sheet is shown as type on paper
            rather than as an impression.
          </footer>
        </article>
      ) : null}

      <header className={styles.head}>
        <h1 className={styles.title}>Deboss</h1>
        <p className={styles.note}>Cotton rag, the press already gone.</p>
      </header>

      <footer className={styles.foot}>
        <p className={styles.hint}>{hint}</p>
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.act}
            aria-pressed={lifted}
            onClick={toggleLift}
          >
            {lifted ? "Back to the bench" : "Hold to the window"}
          </button>
          <Link
            href="/tasks/2d-visuals-interactive-typography"
            className={styles.link}
          >
            Task
          </Link>
        </div>
      </footer>

      <article className={styles.offscreen}>
        {STANZAS.map((stanza, i) => (
          <p key={i}>
            {stanza.map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        ))}
        <footer>
          Written for this impression. The words are a valley in the rag until
          light is carried, or until the sheet is held to a window. A person
          who would rather simply read is meant to use that window.
        </footer>
      </article>

      <p className={styles.live} aria-live="polite" aria-atomic="true">
        {live}
      </p>
    </>
  );
}
