"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./loom.module.css";
import { imageFromBitmap } from "./still";
import {
  DRAFTS,
  PALETTES,
  draftById,
  draftPreview,
  paletteById,
} from "./weave";
import type { Crossing, ViewMeta } from "./Cloth";

const Cloth = dynamic(() => import("./Cloth"), {
  ssr: false,
  loading: () => <div className={styles.pending} aria-hidden="true" />,
});

const SETTS = [56, 80, 104, 128];

export default function Sheet() {
  const [draftId, setDraftId] = useState("twill22");
  const [paletteId, setPaletteId] = useState("fleece");
  const [sett, setSett] = useState(80);
  const [source, setSource] = useState<ImageData | null>(null);
  const [sourceLabel, setSourceLabel] = useState("Still life, painted here");
  const [crossing, setCrossing] = useState<Crossing | null>(null);
  const [view, setView] = useState<ViewMeta>({ scale: 0, source: sourceLabel });
  const [reduced, setReduced] = useState(false);
  const [live, setLive] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const apiRef = useRef<{ zoomBy: (f: number) => void; reset: () => void } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        apiRef.current?.zoomBy(1.18);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        apiRef.current?.zoomBy(1 / 1.18);
      } else if (e.key === "0") {
        e.preventDefault();
        apiRef.current?.reset();
      } else if (e.key >= "1" && e.key <= "6") {
        const d = DRAFTS[Number(e.key) - 1];
        if (d) pickDraft(d.id);
      } else if (e.key === "[" || e.key === "]") {
        const i = PALETTES.findIndex((p) => p.id === paletteId);
        const n = e.key === "]" ? i + 1 : i - 1;
        const p = PALETTES[(n + PALETTES.length) % PALETTES.length];
        pickPalette(p.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteId]);

  const onReady = useCallback((api: { zoomBy: (f: number) => void; reset: () => void }) => {
    apiRef.current = api;
  }, []);

  const announce = (text: string) => setLive(text);

  const pickDraft = (id: string) => {
    setDraftId(id);
    announce(`${draftById(id).name}. The draft repeats; the photograph only inverts a crossing when one yarn is a clearly better match.`);
  };

  const pickPalette = (id: string) => {
    setPaletteId(id);
    announce(`${paletteById(id).name}. The loom is redressed. Yarns do not tint the source — they replace it.`);
  };

  const pickSett = (n: number) => {
    setSett(n);
    announce(`${n} ends. Finer sett keeps more of the picture; the threads stay the same yarns.`);
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const bmp = await createImageBitmap(file);
    const data = imageFromBitmap(bmp);
    bmp.close();
    setSource(data);
    setSourceLabel("Your photograph, on this machine");
    announce("Photograph dressed on this machine. Nothing was sent.");
  };

  const restore = () => {
    setSource(null);
    setSourceLabel("Still life, painted here");
    announce("Default still life restored. No photograph is on the loom.");
    apiRef.current?.reset();
  };

  const draft = draftById(draftId);
  const palette = paletteById(paletteId);
  const threads = view.scale >= 8;
  const settLabel = `${sett} ends`;

  return (
    <>
      <Cloth
        draft={draft}
        palette={palette}
        sett={sett}
        source={source}
        sourceLabel={sourceLabel}
        reducedMotion={reduced}
        onCrossing={setCrossing}
        onView={setView}
        onReady={onReady}
      />

      <p className={styles.note}>
        Scroll or pinch into the cloth. A thread is one yarn, end to end.
      </p>

      <section className={styles.ticket} aria-label="Loom ticket">
        <div className={styles.mast}>
          <h1 className={styles.title}>Loom</h1>
          <Link href="/tasks/2d-visuals-image-transformation" className={styles.link}>
            The brief
          </Link>
        </div>
        <p className={styles.lede}>
          A photograph cannot be dyed into cloth. It has to be dressed:{" "}
          <em>each warp a single yarn, each weft another</em>, and at every
          crossing only one of them can show. Tone is the lift — never a mix.
        </p>

        <div className={styles.row} role="group" aria-label="Weave draft">
          {DRAFTS.map((d) => {
            const cells = draftPreview(d);
            return (
              <button
                key={d.id}
                type="button"
                className={styles.chip}
                aria-pressed={d.id === draftId}
                onClick={() => pickDraft(d.id)}
              >
                <span className={styles.draft} aria-hidden="true">
                  {cells.map((on, i) => (
                    <i key={i} className={on ? styles.on : undefined} />
                  ))}
                </span>
                {d.name}
              </button>
            );
          })}
        </div>

        <div className={styles.row} role="group" aria-label="Yarn palette">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.chip}
              aria-pressed={p.id === paletteId}
              onClick={() => pickPalette(p.id)}
            >
              <span className={styles.yarns} aria-hidden="true">
                {p.yarns.map((y) => (
                  <i
                    key={y.name}
                    className={styles.yarn}
                    style={{ background: `rgb(${y.rgb.join(",")})` }}
                  />
                ))}
              </span>
              {p.name}
            </button>
          ))}
        </div>

        <div className={styles.row} role="group" aria-label="Sett">
          {SETTS.map((n) => (
            <button
              key={n}
              type="button"
              className={styles.step}
              aria-pressed={n === sett}
              onClick={() => pickSett(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className={styles.file}
            onClick={() => fileRef.current?.click()}
          >
            Bring a photograph
          </button>
          {source ? (
            <button type="button" className={styles.file} onClick={restore}>
              Restore the still life
            </button>
          ) : null}
          <input
            ref={fileRef}
            className={styles.hidden}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              void onFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <p className={styles.meta}>
          <span>
            <strong>{draft.name}</strong> on {palette.name.toLowerCase()}
          </span>
          <span>{settLabel}</span>
          <span>{sourceLabel}</span>
          <span>{threads ? "At the thread" : "Step closer"}</span>
          {crossing ? (
            <span>
              {crossing.role} · {crossing.yarn} · end {crossing.i + 1} / pick{" "}
              {crossing.j + 1}
            </span>
          ) : null}
        </p>
        <p className={styles.meta}>
          {palette.note}. {source ? "Held on this machine only." : "No file was uploaded."}{" "}
          Plus and minus zoom; arrows pan; zero fits. The first turn of the
          wheel is the first honest look at the structure.
        </p>
      </section>

      <p className={styles.live} role="status" aria-live="polite">
        {live}
      </p>
    </>
  );
}
