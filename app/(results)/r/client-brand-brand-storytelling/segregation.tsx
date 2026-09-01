"use client";

/**
 * §4 — open-pollinated and hybrid, honestly.
 *
 * The brief is explicit that hybrids are not villains, and the audience would
 * spot it instantly if they were made into one. So this section does the fair
 * version: an F1 is uniform and vigorous and those are real advantages that
 * real growers really want, and the reason you cannot keep one by saving its
 * seed is Mendel rather than malice.
 *
 * The three trays are a cartoon of segregation at three loci — stated as a
 * cartoon in the caption, because it is one. Sowing the saved seed again gives
 * a different tray every time, which is the entire argument and is much harder
 * to disbelieve than a sentence saying the same thing.
 */

import { useMemo, useState } from "react";

import s from "./kirkwall.module.css";

type Plant = { height: number; leaf: number; fruit: number };

function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRAY = 12;

/** 1 : 2 : 1 at one locus, which is what selfing a heterozygote gives. */
function locus(r: () => number): number {
  const x = r();
  if (x < 0.25) return 0;
  if (x < 0.75) return 0.5;
  return 1;
}

/**
 * An open-pollinated variety is not a clone: it is a population with real
 * variation inside it, which is the thing that lets it cope with a bad year.
 * So the tray is drawn tight but not identical.
 */
function openPollinated(seed: number): Plant[] {
  const r = rngFrom(seed);
  return Array.from({ length: TRAY }, () => ({
    height: 0.5 + (r() - 0.5) * 0.24,
    leaf: 0.52 + (r() - 0.5) * 0.26,
    fruit: 0.5 + (r() - 0.5) * 0.22,
  }));
}

/** Every F1 plant has the same genotype, so the tray really is this uniform. */
function f1(): Plant[] {
  return Array.from({ length: TRAY }, () => ({
    height: 0.68,
    leaf: 0.7,
    fruit: 0.66,
  }));
}

/** Selfing the F1: each locus segregates independently. */
function f2(seed: number): Plant[] {
  const r = rngFrom(seed);
  return Array.from({ length: TRAY }, () => {
    const h = locus(r);
    const l = locus(r);
    const f = locus(r);
    // Half the vigour of the F1 is lost in the F2, which is the ordinary
    // behaviour of heterosis rather than a punishment for saving seed.
    const vigour = (h + l + f) / 3 > 0.5 ? 0.06 : 0;
    return { height: h * 0.9 + 0.05 + vigour, leaf: l * 0.9 + 0.05, fruit: f * 0.9 + 0.05 };
  });
}

function Glyph({ p }: { p: Plant }) {
  const top = 36 - (9 + 21 * p.height);
  const pairs = 2 + Math.round(p.leaf * 3);
  const r = 1.6 + 3.4 * p.fruit;
  const leaves: string[] = [];
  for (let i = 0; i < pairs; i++) {
    const y = 36 - ((i + 1) / (pairs + 1)) * (36 - top);
    const w = 3 + 5 * p.leaf;
    leaves.push(`M 15 ${y.toFixed(1)} q ${(-w).toFixed(1)} -1.6 ${(-w * 1.25).toFixed(1)} 1.4`);
    leaves.push(`M 15 ${y.toFixed(1)} q ${w.toFixed(1)} -1.6 ${(w * 1.25).toFixed(1)} 1.4`);
  }
  return (
    <svg
      className={s.segCell}
      viewBox="0 0 30 40"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth={0.9} strokeLinecap="round">
        <path d={`M 15 37 L 15 ${top.toFixed(1)}`} />
        {leaves.map((d, i) => (
          <path d={d} key={i} />
        ))}
        <circle cx={15} cy={top - r * 0.6} r={r} />
      </g>
    </svg>
  );
}

function Tray({
  title,
  chip,
  plants,
  caption,
}: {
  title: string;
  chip?: string;
  plants: Plant[] | null;
  caption: string;
}) {
  return (
    <div className={s.segPanel}>
      <div className={s.segPanelHead}>
        <span className={s.segTitle}>{title}</span>
        {chip ? <span className={s.chip}>{chip}</span> : null}
      </div>
      <div className={s.segTray}>
        {plants
          ? plants.map((p, i) => <Glyph p={p} key={i} />)
          : Array.from({ length: TRAY }, (_, i) => (
              <span className={s.segCellEmpty} key={i} />
            ))}
      </div>
      <p className={s.segCaption}>{caption}</p>
    </div>
  );
}

export default function Segregation() {
  const [sowing, setSowing] = useState(0);
  const op = useMemo(() => openPollinated(11), []);
  const hybrid = useMemo(() => f1(), []);
  const saved = useMemo(
    () => (sowing === 0 ? null : f2(1000 + sowing * 7919)),
    [sowing]
  );

  return (
    <div>
      <div className={s.segGrid}>
        <Tray
          title="Open-pollinated"
          plants={op}
          caption="A variety kept by saving seed. Not identical plants — a population with variation inside it, which is what lets some of it cope with a cold year. Sow the seed you saved and you get this again."
        />
        <Tray
          title="F1 hybrid"
          plants={hybrid}
          caption="Two inbred parent lines crossed each year. Every plant has the same genotype, so the tray is genuinely this uniform, and hybrids are often more vigorous than either parent (note 9). If you need everything to mature in one week, this is not marketing."
        />
        <Tray
          title="Seed saved from that hybrid"
          chip={saved ? `sowing ${String(sowing)}` : undefined}
          plants={saved}
          caption={
            saved
              ? "The F1 was heterozygous at every locus, so its offspring segregate. Some are fine, some are nothing like the parent, and next year’s tray is different again. Nobody did this to you; it is how inheritance works."
              : "Twelve empty cells. Sow the saved seed and see what comes up."
          }
        />
      </div>

      <div className={s.segActions}>
        <button
          type="button"
          className={s.button}
          onClick={() => {
            setSowing((n) => n + 1);
          }}
        >
          {sowing === 0 ? "sow the saved seed" : "sow it again"}
        </button>
        {sowing > 1 ? (
          <span className={s.mark}>
            {sowing} sowings, {sowing} different trays
          </span>
        ) : null}
        <span className={s.plateCap} style={{ marginTop: 0 }}>
          A cartoon of segregation at three loci. Real varieties differ at
          thousands and the picture is messier, but not in a way that helps.
        </span>
      </div>
    </div>
  );
}
