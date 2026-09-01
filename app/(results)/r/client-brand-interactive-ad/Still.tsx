"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import styles from "./still.module.css";
import Trial from "./Trial";

const Bed = dynamic(() => import("./Bed"), {
  ssr: false,
  loading: () => <span className={styles.pending} aria-hidden="true" />,
});

type Readings = { theirs: number; yours: number };

export default function Still({ monoClass }: { monoClass: string }) {
  const [readings, setReadings] = useState<Readings>({ theirs: 35, yours: 0 });
  const [live, setLive] = useState("");
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: coarse)");
    const apply = () => {
      setReduced(motion.matches);
      setCoarse(pointer.matches);
    };
    apply();
    motion.addEventListener("change", apply);
    pointer.addEventListener("change", apply);
    return () => {
      motion.removeEventListener("change", apply);
      pointer.removeEventListener("change", apply);
    };
  }, []);

  const onReadings = useCallback((theirs: number, yours: number) => {
    setReadings({ theirs, yours });
  }, []);

  const onAnnounce = useCallback((text: string) => {
    setLive(text);
  }, []);

  return (
    <main className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>Still</p>
          <p className={`${styles.time} ${monoClass}`}>02:07</p>
        </div>
        <Link
          className={styles.brief}
          href="/tasks/client-brand-interactive-ad"
          prefetch={false}
        >
          The brief
        </Link>
      </header>

      <h1 className={styles.claim}>
        Their two in the morning{" "}
        <em>is not your problem any more.</em>
      </h1>

      <div className={styles.stage}>
        <Bed
          reduced={reduced}
          onReadings={onReadings}
          onAnnounce={onAnnounce}
        />
        <div className={styles.labels}>
          <p className={`${styles.tag} ${monoClass}`}>Theirs</p>
          <p className={`${styles.tag} ${monoClass}`}>Yours</p>
        </div>
        <div className={styles.meters}>
          <p className={`${styles.mm} ${monoClass}`} data-side="theirs">
            {readings.theirs.toFixed(1)} mm
          </p>
          <p
            className={`${styles.mm} ${monoClass}`}
            data-side="yours"
            data-still={readings.yours < 0.05 ? "true" : "false"}
          >
            {readings.yours.toFixed(1)} mm
          </p>
        </div>
      </div>

      <footer className={styles.floor}>
        <p className={styles.facts}>
          <strong>Each coil lives in its own pocket.</strong> Compression on
          one does not drag the next — James Marshall, 1899. A 40&nbsp;mm
          polymer strip takes the leftover shear, so a wave on this page dies
          at the seam instead of crossing it. Latex and wool, not foam: foam
          isolates too, and it sleeps hot. Queen $1,195 · King $1,495 · Cal
          King $1,495. A hundred nights. We take the old mattress the morning
          we arrive.
        </p>
        <div className={styles.ctaRow}>
          <p className={styles.hint}>
            Press either side. The other does not move.
            <span className={styles.keys}>
              {coarse ? "" : " Keys 1 and 2 sit each half."}
            </span>
          </p>
          <button
            className={styles.cta}
            type="button"
            onClick={() => {
              setOpen(true);
            }}
          >
            Start the hundred-night trial
          </button>
        </div>
      </footer>

      {open ? (
        <Trial
          monoClass={monoClass}
          onClose={() => {
            setOpen(false);
          }}
          onDone={() => {
            setLive("The hundred-night trial is recorded on this device only.");
          }}
        />
      ) : null}

      <p className={styles.live} aria-live="polite">
        {live}
      </p>
    </main>
  );
}
