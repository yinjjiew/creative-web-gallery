"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import Furniture, { type FurnitureShow } from "./Furniture";
import { readZones, LOCK_DIM, type Reading } from "./engine/check";
import { DEVICES, DEVICE_BY_ID, furnitureFor, toFrac } from "./engine/devices";
import { PALETTES, PALETTE_BY_ID } from "./engine/inks";
import {
  plateAngle,
  plateSlip,
  press,
  pressAsync,
  type Recipe,
} from "./engine/press";
import {
  DEFAULT_RECIPE,
  RULING_MAX,
  RULING_MIN,
  decodeRecipe,
  encodeRecipe,
  fileName,
} from "./engine/recipe";
import { Rng, randomEdition, stepEdition } from "./engine/rng";
import { SCORES, type ScoreId } from "./engine/scores";
import s from "./press.module.css";

const TASK_PATH = "/tasks/creative-tools-wallpaper-generator";

const REDUCED = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

type Dial = {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  readout: string;
  set: (v: number) => void;
};

function Slider({ dial }: { dial: Dial }) {
  const id = useId();
  return (
    <div className={s.dial}>
      <div className={s.dialHead}>
        <label htmlFor={id}>{dial.label}</label>
        <span className={s.dialValue}>{dial.readout}</span>
      </div>
      <input
        id={id}
        className={s.range}
        type="range"
        min={dial.min}
        max={dial.max}
        value={dial.value}
        aria-describedby={`${id}-hint`}
        onChange={(e) => dial.set(Number(e.target.value))}
      />
      <p className={s.dialHint} id={`${id}-hint`}>
        {dial.hint}
      </p>
    </div>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionHead}>
        <span className={s.sectionIndex}>{index}</span>
        <span>{title}</span>
        <span className={s.sectionRule} aria-hidden="true" />
      </h2>
      {children}
    </section>
  );
}

export default function Press() {
  // Read on the first render rather than in an effect: the tool is mounted
  // client-only, so a shared link prints its own sheet straight away instead of
  // showing the default composition and then replacing it.
  const [recipe, setRecipe] = useState<Recipe>(() =>
    window.location.hash.length > 1 ? decodeRecipe(window.location.hash) : DEFAULT_RECIPE
  );
  const [show, setShow] = useState<FurnitureShow & { dim: boolean }>({
    clock: true,
    icons: false,
    chrome: true,
    dim: false,
  });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reveal, setReveal] = useState<number | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bedRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timers = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();

  const palette = PALETTE_BY_ID.get(recipe.palette) ?? PALETTES[0];
  const device = DEVICE_BY_ID.get(recipe.device) ?? DEVICES[0];
  const score = SCORES.find((x) => x.id === recipe.score) ?? SCORES[0];
  const plates = palette.inks.length;

  /* ---------------------------------------------------------------- state -- */

  useEffect(() => {
    const handle = window.setTimeout(() => {
      window.history.replaceState(null, "", `#${encodeRecipe(recipe)}`);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [recipe]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const runReveal = useCallback(
    (count: number) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      if (reduced) {
        setReveal(null);
        return;
      }
      setReveal(0);
      for (let i = 1; i <= count; i += 1) {
        timers.current.push(
          window.setTimeout(() => setReveal(i === count ? null : i), i * 150)
        );
      }
    },
    [reduced]
  );

  const patch = useCallback((next: Partial<Recipe>) => {
    setRecipe((prev) => ({ ...prev, ...next }));
    setSaved(null);
  }, []);

  const newEdition = useCallback(() => {
    patch({ edition: randomEdition() });
    runReveal(plates);
  }, [patch, plates, runReveal]);

  const stepBy = useCallback(
    (delta: number) => {
      setRecipe((prev) => ({ ...prev, edition: stepEdition(prev.edition, delta) }));
      setSaved(null);
    },
    []
  );

  const rollEverything = useCallback(() => {
    const edition = randomEdition();
    const rng = new Rng(edition);
    const nextPalette = rng.pick(PALETTES);
    setRecipe((prev) => ({
      ...prev,
      edition,
      score: rng.pick(SCORES).id,
      palette: nextPalette.id,
      weight: rng.int(42, 78),
      ruling: rng.int(140, 320),
      slip: rng.int(2, 16),
      hidden: [],
    }));
    setSaved(null);
    runReveal(nextPalette.inks.length);
  }, [runReveal]);

  const setScore = useCallback(
    (id: ScoreId) => {
      patch({ score: id });
      runReveal(plates);
    },
    [patch, plates, runReveal]
  );

  const setPalette = useCallback(
    (id: string) => {
      const next = PALETTE_BY_ID.get(id);
      patch({ palette: id, hidden: recipe.hidden.filter((i) => i < (next?.inks.length ?? 2)) });
      runReveal(next?.inks.length ?? 2);
    },
    [patch, recipe.hidden, runReveal]
  );

  const togglePlate = useCallback(
    (index: number) => {
      setRecipe((prev) => ({
        ...prev,
        hidden: prev.hidden.includes(index)
          ? prev.hidden.filter((i) => i !== index)
          : [...prev.hidden, index],
      }));
    },
    []
  );

  /* ------------------------------------------------------------------ fit -- */

  useEffect(() => {
    const bed = bedRef.current;
    if (!bed) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setBox({ w: rect.width, h: rect.height });
    });
    observer.observe(bed);
    return () => observer.disconnect();
  }, []);

  const fit = useMemo(() => {
    const [pw, ph] = device.px;
    if (box.w < 40 || box.h < 40) return { w: 0, h: 0, scale: 0 };
    const availW = Math.max(80, box.w - 70);
    const availH = Math.max(120, box.h - 86);
    const scale = Math.min(availW / pw, availH / ph, 1);
    return { w: Math.round(pw * scale), h: Math.round(ph * scale), scale };
  }, [box, device]);

  /* ---------------------------------------------------------------- print -- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fit.w < 4) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.max(2, Math.round(fit.w * dpr));
    const bh = Math.max(2, Math.round(fit.h * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    press({
      ctx,
      w: bw,
      h: bh,
      recipe,
      palette,
      device,
      plateLimit: reveal ?? undefined,
    });
    if (reveal === null) setReadings(readZones(canvas, device, show.dim));
  }, [recipe, palette, device, fit, reveal, show.dim]);

  /* --------------------------------------------------------------- export -- */

  const [busy, setBusy] = useState(false);

  const exportSheet = useCallback(async () => {
    if (busy) return;
    const [w, h] = device.px;
    setBusy(true);
    setSaved(null);
    setProgress("mounting plates");
    await new Promise<void>((r) => window.setTimeout(r, 20));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setProgress(null);
      setBusy(false);
      setSaved("this browser would not give us a canvas");
      return;
    }
    try {
      await pressAsync({ ctx, w, h, recipe, palette, device }, (label) => {
        setProgress(
          label === "paper"
            ? "paper"
            : label === "done"
              ? "trimming"
              : `${label} of ${plates}`
        );
      });
      setProgress("writing png");
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("no blob");
      const name = fileName(recipe, w, h);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setSaved(`${name} · ${(blob.size / 1048576).toFixed(1)} MB`);
    } catch {
      setSaved("the press jammed — try a smaller sheet");
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      setProgress(null);
      setBusy(false);
    }
  }, [busy, device, palette, plates, recipe]);

  const copyRecipe = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeRecipe(recipe)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.hash = encodeRecipe(recipe);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }, [recipe]);

  /* ------------------------------------------------------------ shortcuts -- */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        newEdition();
      } else if (key === "[") {
        stepBy(-1);
      } else if (key === "]") {
        stepBy(1);
      } else if (key === "e") {
        event.preventDefault();
        void exportSheet();
      } else if (key === "f") {
        setShow((prev) => ({ ...prev, chrome: !prev.chrome }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportSheet, newEdition, stepBy]);

  /* ----------------------------------------------------------------- copy -- */

  const [pw, ph] = device.px;
  const diagIn = Math.hypot(pw, ph) / device.ppi;
  const lpi = recipe.ruling / diagIn;
  const dotPx = Math.hypot(pw, ph) / recipe.ruling;
  const clockReading = readings.find((r) => r.id === "clock");
  const lightChrome = (clockReading?.luma ?? (palette.stock.dark ? 0.05 : 0.8)) < 0.42;
  const furniture = furnitureFor(device);
  const clockFrac = toFrac(furniture.clock.box, device);

  const dials: Dial[] = [
    {
      label: "Ink weight",
      hint: "Total film across every plate. Low weight leaves paper doing the work.",
      value: recipe.weight,
      min: 0,
      max: 100,
      readout: `${recipe.weight}%`,
      set: (v) => patch({ weight: v }),
    },
    {
      label: "Screen ruling",
      hint: `${recipe.ruling} dot rows across the sheet diagonal — a ${dotPx.toFixed(0)} px cell at export, about ${lpi.toFixed(0)} lpi on a ${diagIn.toFixed(1)}″ panel.`,
      value: recipe.ruling,
      min: RULING_MIN,
      max: RULING_MAX,
      readout: `${recipe.ruling}`,
      set: (v) => patch({ ruling: v }),
    },
    {
      label: "Misregistration",
      hint: "How far the plates drift out of register, as if the paper had shifted on the drum.",
      value: recipe.slip,
      min: 0,
      max: 24,
      readout: `${(recipe.slip / 10).toFixed(1)} mm`,
      set: (v) => patch({ slip: v }),
    },
    {
      label: "Paper grain",
      hint: "Blotch and tooth in the stock. It is what stops flat tone looking like a screen.",
      value: recipe.grain,
      min: 0,
      max: 100,
      readout: `${recipe.grain}%`,
      set: (v) => patch({ grain: v }),
    },
  ];

  const toggles: { key: keyof typeof show; label: string }[] = [
    { key: "clock", label: "Lock clock" },
    { key: "icons", label: device.kind === "laptop" || device.kind === "display" ? "Desk icons" : "Icon grid" },
    { key: "chrome", label: device.kind === "phone" || device.kind === "tablet" ? "Dock" : "Menu bar + dock" },
    { key: "dim", label: "Lock dim" },
  ];

  const groups = Array.from(new Set(DEVICES.map((d) => d.group)));

  return (
    <div className={s.shell} style={{ ["--accent" as string]: palette.inks[0].hex }}>
      <header className={s.masthead}>
        <div className={s.mark}>
          <span className={s.wordmark}>Press</span>
          <span className={s.markMeta}>
            <span className={s.markLine}>Risograph wallpaper works</span>
            <span className={s.markLine2}>
              {plates} spot inks · halftone screened · composed around the clock and the dock
            </span>
          </span>
        </div>

        <div className={s.editionBar}>
          <label className={s.editionLabel} htmlFor="edition">
            Edition
          </label>
          <input
            id="edition"
            className={s.editionInput}
            value={recipe.edition}
            spellCheck={false}
            maxLength={10}
            onChange={(e) =>
              patch({ edition: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "A" })
            }
          />
          <div className={s.stepper}>
            <button type="button" onClick={() => stepBy(-1)} aria-label="Previous edition">
              &lt;
            </button>
            <button type="button" onClick={() => stepBy(1)} aria-label="Next edition">
              &gt;
            </button>
          </div>
          <button type="button" className={s.solid} onClick={newEdition}>
            New edition
          </button>
          <button type="button" className={s.ghost} onClick={rollEverything}>
            Roll everything
          </button>
        </div>
      </header>

      <main className={s.work}>
        <div className={`${s.rail} ${s.railLeft}`}>
          <Section index="01" title="Composition">
            <div className={s.scoreGrid}>
              {SCORES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={s.chip}
                  aria-pressed={recipe.score === item.id}
                  onClick={() => setScore(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <p className={s.note}>{score.note}</p>
          </Section>

          <Section index="02" title="Ink and stock">
            <div className={s.paletteGrid}>
              {PALETTES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={s.swatch}
                  aria-pressed={recipe.palette === item.id}
                  onClick={() => setPalette(item.id)}
                >
                  <span className={s.swatchFace} style={{ background: item.stock.hex }}>
                    {item.inks.map((ink) => (
                      <span key={ink.name} style={{ background: ink.hex, opacity: ink.alpha }} />
                    ))}
                  </span>
                  <span className={s.swatchName}>{item.name}</span>
                </button>
              ))}
            </div>
            <p className={s.note}>{palette.note}</p>
          </Section>

          <Section index="03" title="The press">
            {dials.map((dial) => (
              <Slider key={dial.label} dial={dial} />
            ))}
            <button
              type="button"
              className={s.wideToggle}
              aria-pressed={recipe.quiet}
              onClick={() => patch({ quiet: !recipe.quiet })}
            >
              <span>Hold ink back under the furniture</span>
              <span className={s.toggleState}>{recipe.quiet ? "on" : "off"}</span>
            </button>
            <p className={s.note}>
              Ramps coverage down across the top {Math.round(clockFrac.y * 100 + clockFrac.h * 100)}% and the
              bottom of the sheet, so the clock and the dock sit on quieter paper.
            </p>
          </Section>
        </div>

        <div className={s.bedWrap}>
          <div className={s.bed} ref={bedRef}>
            {fit.w > 0 && (
              <div className={s.stage} style={{ width: fit.w, height: fit.h }}>
                <span className={`${s.crop} ${s.cropTL}`} aria-hidden="true" />
                <span className={`${s.crop} ${s.cropTR}`} aria-hidden="true" />
                <span className={`${s.crop} ${s.cropBL}`} aria-hidden="true" />
                <span className={`${s.crop} ${s.cropBR}`} aria-hidden="true" />
                <span className={s.dimTop} aria-hidden="true">
                  {pw} px
                </span>
                <span className={s.dimSide} aria-hidden="true">
                  {ph} px
                </span>
                <span className={s.dimScale} aria-hidden="true">
                  {(fit.scale * 100).toFixed(0)}% of file
                </span>

                <div className={s.sheet}>
                  <canvas
                    ref={canvasRef}
                    className={s.canvas}
                    style={{ width: fit.w, height: fit.h }}
                    role="img"
                    aria-label={`${score.name} composition, edition ${recipe.edition}, printed in ${palette.inks
                      .map((i) => i.name)
                      .join(" and ")} on ${palette.stock.name} stock, ${pw} by ${ph} pixels.`}
                  />
                  {show.dim && (
                    <div
                      className={s.dim}
                      style={{ background: `rgba(0,0,0,${LOCK_DIM})` }}
                      aria-hidden="true"
                    />
                  )}
                  <Furniture
                    device={device}
                    pxPerPt={fit.h / device.pt[1]}
                    show={show}
                    lightChrome={lightChrome}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={s.strip}>
            <svg className={s.target} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M12 0v24M0 12h24" stroke="currentColor" strokeWidth="0.75" />
            </svg>
            {palette.inks.map((ink, i) => (
              <div key={ink.name} className={s.tintRow} style={{ background: palette.stock.hex }}>
                {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
                  <span key={step} style={{ background: ink.hex, opacity: step * ink.alpha }} />
                ))}
                <em>
                  {plateAngle(i)}° {ink.name}
                </em>
              </div>
            ))}
            <span className={s.stripMeta}>
              {recipe.edition} · {score.name} · {palette.stock.name}
            </span>
          </div>
        </div>

        <div className={`${s.rail} ${s.railRight}`}>
          <Section index="04" title="Plates">
            <ul className={s.plateList}>
              {palette.inks.map((ink, i) => {
                const off = recipe.hidden.includes(i);
                const slip = plateSlip(recipe, i, plates);
                return (
                  <li key={ink.name} className={off ? s.plateOff : undefined}>
                    <span className={s.plateDot} style={{ background: ink.hex }} aria-hidden="true" />
                    <span className={s.plateName}>{ink.name}</span>
                    <span className={s.plateNum}>{plateAngle(i)}°</span>
                    <span className={s.plateNum}>{slip.mm.toFixed(2)}</span>
                    <button
                      type="button"
                      className={s.plateToggle}
                      aria-pressed={!off}
                      onClick={() => togglePlate(i)}
                    >
                      {off ? "off" : "on"}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className={s.note}>
              Screen angle, then drift in millimetres. {palette.inks[0].mode === "opaque"
                ? "Opaque inks on dark stock: they sit on the card rather than tinting it."
                : "Transparent films, so the plates multiply where they overlap."}
            </p>
          </Section>

          <Section index="05" title="Sheet">
            <select
              className={s.select}
              value={recipe.device}
              aria-label="Device"
              onChange={(e) => patch({ device: e.target.value })}
            >
              {groups.map((group) => (
                <optgroup key={group} label={group}>
                  {DEVICES.filter((d) => d.group === group).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.px[0]} × {d.px[1]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <dl className={s.spec}>
              <div>
                <dt>Panel</dt>
                <dd>
                  {pw} × {ph} px
                </dd>
              </div>
              <div>
                <dt>Density</dt>
                <dd>{device.ppi} ppi</dd>
              </div>
              <div>
                <dt>Layout</dt>
                <dd>
                  {device.pt[0]} × {device.pt[1]} pt
                </dd>
              </div>
            </dl>
          </Section>

          <Section index="06" title="Furniture">
            <div className={s.toggleRow}>
              {toggles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={s.chip}
                  aria-pressed={show[t.key]}
                  onClick={() => setShow((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Section>

          <Section index="07" title="Press check">
            <ul className={s.checkList}>
              {readings.map((r) => (
                <li key={r.id}>
                  <span className={s.checkLabel}>{r.label}</span>
                  <span className={s.checkRatio}>
                    {(r.id === "clock" ? r.white : Math.max(r.white, r.black)).toFixed(1)}:1
                  </span>
                  <span className={`${s.checkVerdict} ${s[r.verdict]}`}>
                    <i aria-hidden="true" />
                    {r.verdict}
                  </span>
                  <span className={s.checkCalm}>{r.calm}</span>
                </li>
              ))}
            </ul>
            <p className={s.note}>
              Measured off the preview: contrast of white system type against the printed field, and how
              much the field moves under it. iOS draws the lock clock white whatever the wallpaper does,
              which is why a pale sheet fails there and a dark one does not.
            </p>
          </Section>

          <Section index="08" title="Export">
            <button type="button" className={s.print} onClick={exportSheet} disabled={busy}>
              <span className={s.printLabel}>{busy ? "Pressing" : "Print PNG"}</span>
              <span className={s.printDims}>
                {pw} × {ph}
              </span>
            </button>
            <p className={s.note}>
              {progress
                ? `${progress}…`
                : saved
                  ? saved
                  : "Redrawn off-screen at full panel resolution — the same composition and the same screen, not an upscale of the preview."}
            </p>
            <button type="button" className={s.ghostWide} onClick={copyRecipe}>
              {copied ? "Link copied" : "Copy recipe link"}
            </button>
          </Section>
        </div>
      </main>

      <footer className={s.colophon}>
        <span>
          <em>Press</em> — built for the brief at{" "}
          <a href={TASK_PATH}>{TASK_PATH}</a>
        </span>
        <span className={s.keys}>
          <kbd>R</kbd> new edition <kbd>[</kbd> <kbd>]</kbd> step <kbd>E</kbd> print <kbd>F</kbd> dock
        </span>
        <span className={s.imprint}>
          Ink hexes approximate Riso drum inks; furniture geometry is measured off default iOS, iPadOS,
          macOS and Android layouts and is approximate. Everything is drawn in this browser.
        </span>
      </footer>
    </div>
  );
}
