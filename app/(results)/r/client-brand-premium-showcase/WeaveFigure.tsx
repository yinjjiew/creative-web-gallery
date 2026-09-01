"use client";

/**
 * The cloth figure: the modelled patch, its controls, and the still drawings
 * that stand in for it when there is no WebGL.
 *
 * The controls are the argument. "Trace one end" follows a single warp yarn
 * through the cloth, which is the chain-of-custody claim expressed in geometry
 * rather than in adjectives. "Against a blend" rebuilds the same weave with an
 * even yarn, which is the honest trade-off shown instead of merely conceded.
 * Neither is a colourway picker.
 */
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { Draft, Section } from "./figures";
import type { Lot } from "./data/lots";
import type { View } from "./Weave";
import type { WeaveParams } from "./weave";
import s from "./mill.module.css";

const Weave = dynamic(() => import("./Weave"), {
  ssr: false,
  loading: () => (
    <div className={s.canvasHost} aria-hidden="true" />
  ),
});

const VIEW_LABELS: [View, string][] = [
  ["face", "Face on"],
  ["rake", "Raking light"],
  ["edge", "Edge on"],
  ["back", "Reverse"],
];

/** Fibre-diameter variation of a blended commercial coating yarn, per cent. */
const BLEND_CV = 12.5;

function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    return Boolean(
      probe.getContext("webgl2") ??
        probe.getContext("webgl") ??
        probe.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export default function WeaveFigure({ lot }: { lot: Lot }) {
  const [view, setView] = useState<View>("face");
  const [trace, setTrace] = useState(false);
  const [blend, setBlend] = useState(false);
  /**
   * Null until the browser has been asked. The still section drawing is what
   * the server renders and what a machine without WebGL keeps, so the figure is
   * never a hole in the page and there is nothing to hydrate wrongly.
   */
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    setSupported(hasWebGL());
  }, []);

  const params = useMemo<WeaveParams>(
    () => ({
      ends: 14,
      picks: 14,
      // Twelve ends and twelve picks to the centimetre, from the mill's spec.
      pitch: 1 / 1.2,
      radius: 0.36,
      cv: blend ? BLEND_CV : lot.cv,
      // At true scale the unevenness is a fraction of a pixel. Stated in the
      // caption, because an unlabelled exaggeration is a lie.
      exaggeration: 3,
      hex: lot.hex,
      hexAlt: lot.hexAlt,
      mottle: blend ? 0.15 : lot.dye ? 0.4 : 0.85,
      traced: trace ? 6 : null,
      segments: 88,
      sides: 9,
    }),
    [lot, trace, blend]
  );

  return (
    <div className={s.figureBlock}>
      <div className={s.plate}>
        {supported === true ? (
          <Weave params={params} view={view} />
        ) : (
          <div style={{ padding: "1.4rem 1.2rem 0.6rem" }}>
            <Section colour={lot.hex} />
            <p className={s.caption}>
              {supported === false
                ? "This browser will not give us WebGL, so the cloth stays a section drawing: nine warp ends in a row, one pick of weft crossing over two and under two. The rise and fall is the crimp, and it is the same fact either way."
                : "Drawing the cloth."}
            </p>
          </div>
        )}
        <div className={s.plateBadge}>
          ≈ 11.7 mm across
          <br />
          12 ends × 12 picks / cm
        </div>
        <div className={s.plateScale}>
          <span>{blend ? "modelled blend" : lot.code}</span>
        </div>
      </div>

      {supported === true ? (
        <>
          <div className={s.controls} role="group" aria-label="How to look at the cloth">
            {VIEW_LABELS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={s.ctrl}
                aria-pressed={view === key}
                onClick={() => {
                  setView(key);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={s.controls} role="group" aria-label="What the cloth is showing">
            <button
              type="button"
              className={s.ctrl}
              aria-pressed={trace}
              onClick={() => {
                setTrace((was) => !was);
              }}
            >
              Trace one end
            </button>
            <button
              type="button"
              className={s.ctrl}
              aria-pressed={blend}
              onClick={() => {
                setBlend((was) => !was);
              }}
            >
              Against a blend
            </button>
          </div>
        </>
      ) : null}

      <p className={s.caption}>
        <b>What is measured and what is drawn.</b> The interlacement, the sett and
        the yarn diameter are the mill&rsquo;s own spec for this cloth: two-and-two
        twill, twelve ends and twelve picks to the centimetre, yarn 0.72 mm. The
        unevenness along each yarn is generated from{" "}
        {blend
          ? `a blended coating yarn's fibre-diameter variation of about ${String(BLEND_CV)}%`
          : `${lot.farm}'s measured fibre-diameter variation of ${lot.cv.toFixed(1)}%`}{" "}
        and then exaggerated three times, because at true scale it is smaller than
        a pixel. It is a drawing with arithmetic behind it, not a photograph and
        not a scan.
      </p>

      {trace ? (
        <p className={s.caption}>
          One warp end, picked out in red, over two picks and under two the whole
          way across. Turn it edge on and you can follow it through the thickness
          of the cloth. Every end in this patch came off one flock in one June;
          that is the only sentence on this site that a photograph could not have
          told you.
        </p>
      ) : null}

      {blend ? (
        <p className={s.caption}>
          The same weave in an even yarn, which is what a mill buying from a
          hundred farms can hold to. Flatter, more regular, and it is genuinely
          the better cloth if what you want is predictability. It is also the
          cloth about which nothing can be said except that it is wool.
        </p>
      ) : null}

      <div className={s.twoUp}>
        <div>
          <p className={s.h4}>The draft</p>
          <Draft />
          <p className={s.caption}>
            How a weaver writes it down. Each column is a warp end, each row a
            pick, and a filled square means the end lifts. Two up, two down,
            stepping one place across for every pick: the step is the diagonal.
          </p>
        </div>
        <div>
          <p className={s.h4}>In section</p>
          <Section colour={lot.hex} />
          <p className={s.caption}>
            The same cloth cut across. The weft does not lie flat; it climbs over
            two ends and dives under the next two, and that crimp is why 640
            grams of wool per square metre is 2.1 mm thick and full of air rather
            than a board.
          </p>
        </div>
      </div>
    </div>
  );
}
