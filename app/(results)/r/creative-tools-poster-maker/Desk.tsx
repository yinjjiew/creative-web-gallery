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

import s from "./desk.module.css";
import { FORMAT_BY_ID, FORMATS, aspectLabel } from "./formats";
import { INK_BY_ID, INKS, type InkSet } from "./inks";
import { makeHousePlate, rasterizeFile } from "./plate";
import { drawPoster, fileStem, type Copy, type Fonts, type Reading } from "./render";
import {
  HIERARCHIES,
  SYSTEMS,
  aspectOf,
  type Hierarchy,
  type SystemId,
} from "./systems";
import {
  TREATMENTS,
  treatPlate,
  type Cut,
  type Gravity,
  type Ruling,
  type Treatment,
} from "./treat";

const TASK_PATH = "/tasks/creative-tools-poster-maker";
const REDUCED = "(prefers-reduced-motion: reduce)";

const DEFAULT_COPY: Copy = {
  kicker: "Open call",
  headline: "Room Tone",
  dek: "Submissions for the winter programme. Film, writing, and work that needs a dark room.",
  meta: "closes 3 Nov · The Drill Hall · midnight",
};

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

function readFonts(el: HTMLElement | null): Fonts {
  if (!el) {
    return { display: "Syne, sans-serif", serif: "Literata, serif" };
  }
  const cs = getComputedStyle(el);
  return {
    display: cs.getPropertyValue("--sig-display").trim() || "Syne, sans-serif",
    serif: cs.getPropertyValue("--sig-serif").trim() || "Literata, serif",
  };
}

export default function Desk() {
  const uid = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const bedRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const house = useMemo(() => makeHousePlate(), []);
  const [formatId, setFormatId] = useState("ig-portrait");
  const [systemId, setSystemId] = useState<SystemId>("masthead");
  const [hierarchy, setHierarchy] = useState<Hierarchy>("name");
  const [treatment, setTreatment] = useState<Treatment>("duotone");
  const [inkId, setInkId] = useState("broadsheet");
  const [copy, setCopy] = useState<Copy>(DEFAULT_COPY);
  const [gravity, setGravity] = useState<Gravity>("center");
  const [showGrid, setShowGrid] = useState(false);
  const [cut, setCut] = useState<Cut>("mid");
  const [ruling, setRuling] = useState<Ruling>("medium");
  const [userPlate, setUserPlate] = useState<HTMLCanvasElement | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [fontsReady, setFontsReady] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const reduced = usePrefersReducedMotion();

  const format = FORMAT_BY_ID.get(formatId) ?? FORMATS[0];
  const ink = INK_BY_ID.get(inkId) ?? INKS[0];
  const source = userPlate ?? house;

  const treated = useMemo(
    () => treatPlate(source, source.width, source.height, ink, treatment, cut, ruling),
    [source, ink, treatment, cut, ruling]
  );

  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => {
      if (live) setFontsReady((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, []);

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
    if (box.w < 40 || box.h < 40) return { w: 0, h: 0 };
    const scale = Math.min(box.w / format.w, box.h / format.h);
    return {
      w: Math.max(4, Math.round(format.w * scale)),
      h: Math.max(4, Math.round(format.h * scale)),
    };
  }, [box, format]);

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, grid: boolean) => {
      const fonts = readFonts(shellRef.current);
      return drawPoster({
        ctx,
        w,
        h,
        system: systemId,
        hierarchy,
        ink,
        copy,
        fonts,
        plate: treated,
        plateW: treated.width,
        plateH: treated.height,
        gravity,
        showGrid: grid,
      });
    },
    [copy, gravity, hierarchy, ink, systemId, treated]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fit.w < 4) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.max(2, Math.round(fit.w * dpr));
    const bh = Math.max(2, Math.round(fit.h * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setReading(paint(ctx, bw, bh, showGrid));
  }, [fit, fontsReady, paint, showGrid]);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try {
      const plate = await rasterizeFile(file);
      setUserPlate(plate);
      setUserName(file.name);
      setSaved(null);
    } catch {
      setSaved("That file would not open as a still.");
    }
  }, []);

  const exportPng = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setSaved(null);
    setProgress("setting type");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
    const canvas = document.createElement("canvas");
    canvas.width = format.w;
    canvas.height = format.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      setProgress(null);
      setSaved("This browser would not give us a canvas.");
      return;
    }
    try {
      setProgress("pulling the sheet");
      paint(ctx, format.w, format.h, false);
      setProgress("writing png");
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("no blob");
      const name = `${fileStem(copy, format.id, systemId)}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setSaved(`${name} · ${Math.max(1, Math.round(blob.size / 1024))} KB · ${format.w}×${format.h}`);
    } catch {
      setSaved("The pull failed. Try a smaller stock.");
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      setBusy(false);
      setProgress(null);
    }
  }, [busy, copy, format, paint, systemId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "e") {
        event.preventDefault();
        void exportPng();
      } else if (key === "g") {
        event.preventDefault();
        setShowGrid((v) => !v);
      } else if (key >= "1" && key <= "5") {
        const next = SYSTEMS[Number(key) - 1];
        if (next) setSystemId(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportPng]);

  const patchCopy = (partial: Partial<Copy>) => {
    setCopy((prev) => ({ ...prev, ...partial }));
    setSaved(null);
  };

  const aspect = aspectOf(format.w, format.h);
  const system = SYSTEMS.find((x) => x.id === systemId) ?? SYSTEMS[0];

  return (
    <div
      ref={shellRef}
      className={s.shell}
      style={{ ["--spot" as string]: ink.accent }}
    >
      <header className={s.header}>
        <div className={s.brand}>
          <h1 className={s.wordmark}>Signal</h1>
          <p className={s.tagRow}>
            <span className={s.tag}>Composing desk</span>
            <a className={s.escape} href={TASK_PATH}>
              task
            </a>
          </p>
        </div>
        <div className={s.stocks} role="group" aria-label="Destination stock">
          {FORMATS.map((item) => {
            const tw = 34;
            const th = Math.max(14, Math.round((item.h / item.w) * tw));
            return (
              <button
                key={item.id}
                type="button"
                className={s.stock}
                aria-pressed={item.id === formatId}
                onClick={() => {
                  setFormatId(item.id);
                  setSaved(null);
                }}
              >
                <span
                  className={s.thumb}
                  style={{
                    width: tw,
                    height: th,
                    background: ink.paper,
                    borderColor: ink.ink,
                  }}
                  aria-hidden="true"
                />
                <span className={s.stockName}>{item.name}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className={s.export} onClick={exportPng} disabled={busy}>
          {progress ?? "Pull PNG"}
          <span className={s.exportNote}>
            {format.w}×{format.h}
            {reduced ? "" : " · E"}
          </span>
        </button>
      </header>

      <div className={s.body}>
        <main className={s.stage}>
          <div ref={bedRef} className={s.bed}>
            <canvas
              ref={canvasRef}
              className={s.sheet}
              style={{ width: fit.w, height: fit.h }}
              aria-label={`Poster proof, ${system.name}, ${format.name}`}
            />
          </div>
          <p className={s.caption}>
            <span>
              <strong>{system.name}</strong>
              {" · "}
              {HIERARCHIES.find((h) => h.id === hierarchy)?.name} first
              {" · "}
              reflowed for {aspectLabel(format.w, format.h)}
            </span>
            {reading ? (
              <span className={reading.holds ? s.holds : reading.contrast < 3 ? s.fails : undefined}>
                {reading.contrast.toFixed(1)}:1
                {" · "}
                {reading.note}
              </span>
            ) : null}
          </p>
          <div className={s.stageBar}>
            <button
              type="button"
              className={s.chip}
              aria-pressed={showGrid}
              onClick={() => setShowGrid((v) => !v)}
            >
              Grid
            </button>
            {(["top", "center", "bottom"] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={s.chip}
                aria-pressed={gravity === g}
                onClick={() => setGravity(g)}
              >
                Crop {g}
              </button>
            ))}
          </div>
        </main>

        <aside className={s.rail}>
          <section>
            <h2 className={s.sectionHead}>
              <span className={s.sectionIndex}>A</span>
              System
            </h2>
            <div className={s.systems} role="group" aria-label="Editorial system">
              {SYSTEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={s.system}
                  aria-pressed={systemId === item.id}
                  onClick={() => {
                    setSystemId(item.id);
                    setSaved(null);
                  }}
                >
                  <span className={s.sysIndex}>{item.index}</span>
                  <span>
                    <span className={s.sysName}>{item.name}</span>
                    <span className={s.sysJob}>{item.job}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className={s.sectionHead}>
              <span className={s.sectionIndex}>B</span>
              Hierarchy
            </h2>
            <div className={s.row} role="group" aria-label="Hierarchy">
              {HIERARCHIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${s.choice} ${s.choiceCompact}`}
                  aria-pressed={hierarchy === item.id}
                  onClick={() => setHierarchy(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <p className={s.fileMeta} style={{ marginTop: 8 }}>
              {HIERARCHIES.find((item) => item.id === hierarchy)?.job}
            </p>
          </section>

          <section>
            <h2 className={s.sectionHead}>
              <span className={s.sectionIndex}>C</span>
              Plate
            </h2>
            <div className={s.fileRow}>
              <input
                ref={fileRef}
                id={`${uid}-file`}
                className={s.sr}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void onFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className={s.fileBtn}
                onClick={() => fileRef.current?.click()}
              >
                Bring a still
              </button>
              {userPlate ? (
                <button
                  type="button"
                  className={s.revert}
                  onClick={() => {
                    setUserPlate(null);
                    setUserName(null);
                  }}
                >
                  Revert to house
                </button>
              ) : null}
            </div>
            <p className={s.fileMeta}>
              {userName
                ? userName
                : "House plate — generated for the desk. Replace with your still."}
            </p>
            <div className={s.row} role="group" aria-label="Image treatment" style={{ marginTop: 10 }}>
              {TREATMENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${s.choice} ${s.choiceCompact}`}
                  aria-pressed={treatment === item.id}
                  onClick={() => setTreatment(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <p className={s.fileMeta} style={{ marginTop: 8 }}>
              {TREATMENTS.find((item) => item.id === treatment)?.job}
            </p>
            {treatment === "threshold" ? (
              <div className={s.row} role="group" aria-label="Threshold cut" style={{ marginTop: 8 }}>
                {(["low", "mid", "high"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={s.chip}
                    aria-pressed={cut === item}
                    onClick={() => setCut(item)}
                  >
                    Cut {item}
                  </button>
                ))}
              </div>
            ) : null}
            {treatment === "halftone" ? (
              <div className={s.row} role="group" aria-label="Halftone ruling" style={{ marginTop: 8 }}>
                {(["coarse", "medium", "fine"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={s.chip}
                    aria-pressed={ruling === item}
                    onClick={() => setRuling(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section>
            <h2 className={s.sectionHead}>
              <span className={s.sectionIndex}>D</span>
              Ink
            </h2>
            <div className={s.inks} role="group" aria-label="Ink set">
              {INKS.map((item) => (
                <InkChip
                  key={item.id}
                  ink={item}
                  pressed={inkId === item.id}
                  onClick={() => setInkId(item.id)}
                />
              ))}
            </div>
            <p className={s.fileMeta} style={{ marginTop: 8 }}>
              {ink.note}
            </p>
          </section>

          <section>
            <h2 className={s.sectionHead}>
              <span className={s.sectionIndex}>E</span>
              Copy
            </h2>
            <Field
              id={`${uid}-kicker`}
              label="Kicker"
              value={copy.kicker}
              onChange={(v) => patchCopy({ kicker: v })}
            />
            <Field
              id={`${uid}-head`}
              label="Title"
              value={copy.headline}
              onChange={(v) => patchCopy({ headline: v })}
            />
            <Field
              id={`${uid}-dek`}
              label="Dek"
              value={copy.dek}
              multiline
              onChange={(v) => patchCopy({ dek: v })}
            />
            <Field
              id={`${uid}-meta`}
              label="Fact line"
              value={copy.meta}
              onChange={(v) => patchCopy({ meta: v })}
              hint="Split on ·  for Fact hierarchy"
            />
          </section>

          {saved ? <p className={s.saved}>{saved}</p> : null}
        </aside>
      </div>

    </div>
  );
}

function InkChip({
  ink,
  pressed,
  onClick,
}: {
  ink: InkSet;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={s.ink} aria-pressed={pressed} onClick={onClick}>
      <span className={s.swatch} aria-hidden="true">
        <span style={{ background: ink.paper }} />
        <span style={{ background: ink.ink }} />
        <span style={{ background: ink.accent }} />
      </span>
      <span className={s.inkName}>{ink.name}</span>
    </button>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <span className={s.fileMeta}>{hint}</span> : null}
    </div>
  );
}
