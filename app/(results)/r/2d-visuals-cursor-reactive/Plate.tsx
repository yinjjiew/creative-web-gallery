"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Readout } from "./engine";
import styles from "./moire.module.css";

const Field = dynamic(() => import("./Field"), {
  ssr: false,
  loading: () => <span className={styles.canvasPending} aria-hidden="true" />,
});

const sign = (x: number) => (x < 0 ? "-" : "+");

function formatAngle(radians: number) {
  const deg = (radians * 180) / Math.PI;
  return `${sign(deg)}${Math.abs(deg).toFixed(3)}\u00b0`;
}

function formatPeriod(fraction: number) {
  const pct = fraction * 100;
  return `${sign(pct)}${Math.abs(pct).toFixed(2)}%`;
}

function formatFringe(px: number) {
  if (!Number.isFinite(px)) return "\u2014";
  return `${Math.round(px)} px`;
}

export default function Plate() {
  const angleRef = useRef<HTMLSpanElement>(null);
  const periodRef = useRef<HTMLSpanElement>(null);
  const fringeRef = useRef<HTMLSpanElement>(null);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [invitation, setInvitation] = useState("move slowly");

  // There is nothing to move on a device with no pointer, so the invitation has
  // to name the gesture that actually works. The media query settles it on
  // load; the first touch settles it for anything the query gets wrong.
  useEffect(() => {
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => setInvitation(coarse.matches ? "drag slowly" : "move slowly");
    apply();
    coarse.addEventListener("change", apply);

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") setInvitation("drag slowly");
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      coarse.removeEventListener("change", apply);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const onReadout = useCallback((r: Readout) => {
    if (periodRef.current) {
      periodRef.current.textContent = formatPeriod(r.dPeriod);
    }
    if (angleRef.current) angleRef.current.textContent = formatAngle(r.dTheta);
    if (fringeRef.current) {
      fringeRef.current.textContent = formatFringe(r.fringe);
    }
  }, []);

  const onFirstInput = useCallback(() => setTouched(true), []);

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Moir&eacute;</h1>
        <p className={styles.caption}>Two rulings in near-alignment</p>
      </header>

      <div
        className={styles.plate}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <Field onReadout={onReadout} onFirstInput={onFirstInput} />
      </div>

      <footer className={styles.foot}>
        <div
          className={`${styles.readout} ${touched ? styles.readoutLive : ""}`}
        >
          <p className={styles.invitation} aria-hidden={touched}>
            {invitation}
          </p>
          <dl className={styles.values} aria-hidden={!touched}>
            <div className={styles.cell}>
              <dt>Period</dt>
              <dd ref={periodRef}>+0.00%</dd>
            </div>
            <div className={styles.cell}>
              <dt>Angle</dt>
              <dd ref={angleRef}>+0.000&deg;</dd>
            </div>
            <div className={styles.cell}>
              <dt>Fringe</dt>
              <dd ref={fringeRef}>&mdash;</dd>
            </div>
          </dl>
        </div>

        <p className={`${styles.keys} ${focused ? styles.keysShown : ""}`}>
          Arrows fine &middot; Shift coarse &middot; 0 aligns &middot; Space
          drifts
        </p>

        <Link className={styles.link} href="/tasks/2d-visuals-cursor-reactive">
          Task
        </Link>
      </footer>
    </>
  );
}
