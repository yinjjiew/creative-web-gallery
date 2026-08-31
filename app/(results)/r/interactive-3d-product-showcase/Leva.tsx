"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { Archivo, Spline_Sans_Mono } from "next/font/google";

import {
  ARGUMENT,
  BOX,
  DISCLOSURE,
  HERO,
  PARTS,
  PRICE,
  PURCHASE,
  REPAIR,
  SPECS,
  VIEWS,
} from "./copy";
import styles from "./leva.module.css";

/**
 * Archivo for words, Spline Sans Mono for anything measurable. The division is
 * the page's only real typographic idea: everything the machine tells you is set
 * in mono, everything we tell you is not.
 */
const text = Archivo({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});
const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.stagePlaceholder} />,
});

const TASK_PATH = "/tasks/interactive-3d-product-showcase";

export default function Leva() {
  const [view, setView] = useState(VIEWS[0].id);
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const goToView = useCallback((id: string) => {
    setView(id);
    const node = stageRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, []);

  return (
    <div className={`${text.variable} ${mono.variable} ${styles.page}`}>
      <header className={styles.topbar}>
        <div className={`${styles.wrap} ${styles.topbarInner}`}>
          <p className={styles.wordmark}>Leva</p>
          <span className={styles.topbarNote}>Manual lever espresso</span>
          <span className={styles.topbarSpacer} />
          <span className={styles.topbarPrice}>{PRICE}</span>
          <button
            type="button"
            className={styles.button}
            onClick={() => dialogRef.current?.showModal()}
          >
            Reserve
          </button>
        </div>
      </header>

      <main>
        <div className={styles.wrap}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>{HERO.eyebrow}</p>
              <h1 className={styles.headline}>{HERO.headline}</h1>
            </div>
            <p className={styles.lede}>{HERO.lede}</p>
          </section>
        </div>

        <div className={styles.wrap} ref={stageRef}>
          <Stage view={view} onViewChange={setView} />
        </div>

        <div className={styles.wrap}>
          <section className={styles.section} aria-labelledby="argument">
            <p className={styles.sectionLabel} id="argument">
              01 — The argument
            </p>
            <div className={styles.argument}>
              {ARGUMENT.map((item) => (
                <div key={item.heading}>
                  <h3>{item.heading}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="anatomy">
            <p className={styles.sectionLabel} id="anatomy">
              02 — Anatomy
            </p>
            <div className={styles.anatomy}>
              {VIEWS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={styles.anatomyRow}
                  aria-current={view === preset.id}
                  onClick={() => goToView(preset.id)}
                >
                  <span className={styles.anatomyName}>{preset.label}</span>
                  <span className={styles.anatomyNote}>{preset.note}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="specification">
            <p className={styles.sectionLabel} id="specification">
              03 — Specification
            </p>
            <dl className={styles.table}>
              {SPECS.map(([key, value]) => (
                <div className={styles.tableRow} key={key}>
                  <dt className={styles.tableKey}>{key}</dt>
                  <dd className={styles.tableValue}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.section} aria-labelledby="box">
            <p className={styles.sectionLabel} id="box">
              04 — In the box, and after
            </p>
            <div className={styles.twoUp}>
              <div>
                <ul className={styles.list}>
                  {BOX.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={styles.prose}>{REPAIR.body}</p>
                <dl className={styles.table}>
                  {PARTS.map(([key, value]) => (
                    <div className={styles.tableRow} key={key}>
                      <dt className={styles.tableKey}>{key}</dt>
                      <dd className={`${styles.tableValue} ${styles.numeric}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="purchase">
            <p className={styles.sectionLabel} id="purchase">
              05 — Purchase
            </p>
            <div className={styles.buy}>
              <div>
                <h3 className={styles.verdictTitle}>{PURCHASE.heading}</h3>
                <p className={styles.prose}>{PURCHASE.body}</p>
                <p className={styles.aside}>{PURCHASE.aside}</p>
              </div>
              <div className={styles.priceBlock}>
                <p className={styles.price}>{PURCHASE.price}</p>
                <p className={styles.priceNote}>{PURCHASE.priceNote}</p>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => dialogRef.current?.showModal()}
                >
                  {PURCHASE.cta}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.wrap}>
          <footer className={styles.footer}>
            <p className={styles.disclosure}>{DISCLOSURE}</p>
            <a className={styles.backlink} href={TASK_PATH}>
              The brief ↗
            </a>
          </footer>
        </div>
      </main>

      <dialog ref={dialogRef} className={styles.dialog}>
        <h3>Before you reach for a card</h3>
        <p>
          You cannot buy this. Leva is a reference implementation — a page built to
          answer a brief about how you would sell a manual lever espresso machine,
          not a machine.
        </p>
        <p>
          The rest of it is as true as it can be. The lever ratio, the piston area,
          the stroke volume and the load at the handle are all consistent with one
          another, and the curve you drew a moment ago came out of a physical model
          of a lever group rather than a canned animation. If you want one of these
          for real, the machines it is modelled on are made in Italy and have been
          for seventy years.
        </p>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </dialog>
    </div>
  );
}
