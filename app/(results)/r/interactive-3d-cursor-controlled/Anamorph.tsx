"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./anamorph.module.css";

const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-display",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-cursor-controlled";

export default function Anamorph() {
  const pageRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef(false);
  const [held, setHeld] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const touch = window.matchMedia("(pointer: coarse)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setCoarse(touch.matches);
      setReduce(motion.matches);
    };
    sync();
    touch.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      touch.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  const askMark = useCallback(() => {
    seekRef.current = true;
  }, []);

  return (
    <div
      ref={pageRef}
      className={`${display.variable} ${sans.variable} ${styles.page}`}
      data-held={held ? "1" : "0"}
      data-input={coarse ? "touch" : "mouse"}
    >
      <Stage pageRef={pageRef} seekRef={seekRef} onHeld={setHeld} />

      <div className={styles.hud}>
        <header className={styles.top}>
          <h1 className={styles.word}>Anamorph</h1>
          <Link className={styles.task} href={TASK}>
            Task
          </Link>
        </header>

        <div className={styles.panel}>
          <p className={styles.lede}>
            A hanging cast. The eye you are moving is the whole apparatus.
          </p>
          <details className={styles.more}>
            <summary>A note on looking</summary>
            <p className={styles.deskCopy}>
              Holbein once stretched a figure across a drawing-room floor so
              that it only held from one mark in the boards. The trick is not a
              picture hiding inside another picture. It is a reminder that an
              image is a relationship between an object and a body — and that
              most of the places a body can stand are the wrong ones.
            </p>
            <p className={styles.deskCopy}>
              These fragments were never a smashed whole. They were placed so
              that one viewpoint would invent one. The rest of the room is the
              view you have not taken.
            </p>
            <p className={styles.deskCopy}>
              The cursor is the viewpoint. A careless sweep will not hold — the
              chips stay on edge until the hand slows. Arrow keys also move the
              eye.
            </p>
            <p className={styles.phoneCopy}>
              There is no cursor here. Your finger is the eye: touch the cast to
              look, then lift to regard. Fast hunting keeps the chips on edge. A
              slow hand is what the work was built for.
            </p>
            <p>
              A modelled anamorphosis. Plaster, iron and paper, written rather
              than scanned. The workshop light is typical, not photographed.
            </p>
          </details>
        </div>

        <footer className={styles.foot}>
          <p className={`${styles.meta} ${styles.deskCopy}`}>
            Cursor steers the eye. Invented geometry — nothing scanned.
            {reduce ? " Reduced motion is on." : ""}
          </p>
          <p className={`${styles.meta} ${styles.phoneCopy}`}>
            Your finger is the eye. Touch, then lift to regard. Invented
            geometry — nothing scanned.
            {reduce ? " Reduced motion is on." : ""}
          </p>
          {reduce ? (
            <button type="button" className={styles.mark} onClick={askMark}>
              The mark on the floor
            </button>
          ) : null}
        </footer>
      </div>

      <div className={styles.live} aria-live="polite">
        {held ? "The fragments have aligned." : ""}
      </div>
    </div>
  );
}
