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

import {
  DEFAULT_FAMILY,
  GRID,
  RADII,
  WEIGHTS,
  clampGrid,
  density,
  dist,
  drawMarks,
  markLabel,
  same,
  uid,
  type Family,
  type Mark,
  type Point,
} from "./marks";
import { SEED } from "./seed";
import {
  downloadSvg,
  emitPunch,
  emitSheet,
  emitSprite,
  specLine,
  type Punch,
} from "./system";
import s from "./foundry.module.css";

const TASK = "/tasks/creative-tools-svg-icon-maker";
const REDUCED = "(prefers-reduced-motion: reduce)";

type Tool = "line" | "poly" | "rect" | "ring" | "dot";

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "line", label: "Line", hint: "Two points." },
  { id: "poly", label: "Poly", hint: "Points, then Enter." },
  { id: "rect", label: "Rect", hint: "Two corners." },
  { id: "ring", label: "Ring", hint: "Centre, then rim." },
  { id: "dot", label: "Dot", hint: "One point." },
];

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(REDUCED);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const a = [...values].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2;
}

function toGrid(e: { clientX: number; clientY: number }, el: Element): Point {
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * GRID;
  const y = ((e.clientY - r.top) / r.height) * GRID;
  return [clampGrid(x), clampGrid(y)];
}

function PunchGlyph({
  marks,
  family,
  size,
  title,
  className,
}: {
  marks: Mark[];
  family: Family;
  size: number;
  title?: string;
  className?: string;
}) {
  const ops = drawMarks(marks, family);
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {ops.map((op) =>
        op.circle ? (
          <circle
            key={op.key}
            cx={op.circle.cx}
            cy={op.circle.cy}
            r={op.circle.r}
            stroke={op.fill === "currentColor" ? "none" : "currentColor"}
            strokeWidth={op.strokeWidth}
            strokeLinecap={op.cap}
            strokeLinejoin={op.join}
            fill={op.fill}
          />
        ) : (
          <path
            key={op.key}
            d={op.d}
            stroke="currentColor"
            strokeWidth={op.strokeWidth}
            strokeLinecap={op.cap}
            strokeLinejoin={op.join}
            fill="none"
          />
        )
      )}
    </svg>
  );
}

function draftGhost(
  tool: Tool,
  draft: Point[],
  hover: Point | null,
  family: Family
): Mark | null {
  const tip = hover ?? draft[draft.length - 1];
  if (!tip) return null;
  if (tool === "line" && draft[0] && !same(draft[0], tip)) {
    return { id: "ghost", kind: "line", a: draft[0], b: tip };
  }
  if (tool === "poly" && draft.length >= 1) {
    const pts = same(draft[draft.length - 1]!, tip) ? draft : [...draft, tip];
    if (pts.length < 2) return null;
    return { id: "ghost", kind: "poly", points: pts };
  }
  if (tool === "rect" && draft[0] && !same(draft[0], tip)) {
    return { id: "ghost", kind: "rect", a: draft[0], b: tip };
  }
  if (tool === "ring" && draft[0]) {
    const r = dist(draft[0], tip);
    if (r < 1) return null;
    return { id: "ghost", kind: "circle", c: draft[0], r };
  }
  if (tool === "dot" && hover) {
    return { id: "ghost", kind: "dot", c: hover };
  }
  return null;
}

export default function Foundry() {
  const [family, setFamily] = useState<Family>(DEFAULT_FAMILY);
  const [punches, setPunches] = useState<Punch[]>(() =>
    SEED.map((p) => ({ ...p, marks: p.marks.map((m) => ({ ...m })) }))
  );
  const [activeId, setActiveId] = useState(SEED[0]!.id);
  const [tool, setTool] = useState<Tool>("line");
  const [draft, setDraft] = useState<Point[]>([]);
  const [hover, setHover] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point>([12, 12]);
  const [plateFocus, setPlateFocus] = useState(false);
  const [keylines, setKeylines] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();
  const hist = useRef<Punch[][]>([]);
  const plateRef = useRef<SVGSVGElement>(null);
  const nameId = useId();
  const liveId = useId();

  const active = punches.find((p) => p.id === activeId) ?? punches[0]!;
  const dens = useMemo(
    () => punches.map((p) => density(p.marks, family.weight)),
    [punches, family.weight]
  );
  const mid = median(dens);

  const snapshot = useCallback(() => {
    hist.current.push(punches.map((p) => ({ ...p, marks: p.marks.map((m) => ({ ...m })) })));
    if (hist.current.length > 40) hist.current.shift();
  }, [punches]);

  const updateActive = useCallback(
    (fn: (p: Punch) => Punch) => {
      snapshot();
      setPunches((all) => all.map((p) => (p.id === active.id ? fn(p) : p)));
    },
    [active.id, snapshot]
  );

  const commit = useCallback(
    (mark: Mark) => {
      updateActive((p) => ({ ...p, marks: [...p.marks, mark] }));
      setDraft([]);
    },
    [updateActive]
  );

  const place = useCallback(
    (p: Point) => {
      setCursor(p);
      if (tool === "dot") {
        commit({ id: uid(), kind: "dot", c: p });
        return;
      }
      if (tool === "line") {
        if (draft.length === 0) {
          setDraft([p]);
          return;
        }
        if (same(draft[0]!, p)) return;
        commit({ id: uid(), kind: "line", a: draft[0]!, b: p });
        return;
      }
      if (tool === "rect") {
        if (draft.length === 0) {
          setDraft([p]);
          return;
        }
        if (same(draft[0]!, p)) return;
        commit({ id: uid(), kind: "rect", a: draft[0]!, b: p });
        return;
      }
      if (tool === "ring") {
        if (draft.length === 0) {
          setDraft([p]);
          return;
        }
        const r = dist(draft[0]!, p);
        if (r < 1) return;
        commit({ id: uid(), kind: "circle", c: draft[0]!, r: Math.round(r) });
        return;
      }
      if (tool === "poly") {
        if (draft.length >= 2 && same(draft[draft.length - 1]!, p)) {
          commit({ id: uid(), kind: "poly", points: draft });
          return;
        }
        setDraft((d) => [...d, p]);
      }
    },
    [commit, draft, tool]
  );

  const finishPoly = useCallback(() => {
    if (tool === "poly" && draft.length >= 2) {
      commit({ id: uid(), kind: "poly", points: draft });
    }
  }, [commit, draft, tool]);

  const cancelDraft = useCallback(() => setDraft([]), []);

  const undo = useCallback(() => {
    const prev = hist.current.pop();
    if (prev) {
      setPunches(prev);
      setDraft([]);
    }
  }, []);

  const deleteLast = useCallback(() => {
    if (draft.length > 0) {
      setDraft((d) => d.slice(0, -1));
      return;
    }
    if (active.marks.length === 0) return;
    updateActive((p) => ({ ...p, marks: p.marks.slice(0, -1) }));
  }, [active.marks.length, draft.length, updateActive]);

  const dropMark = useCallback(
    (id: string) => {
      updateActive((p) => ({ ...p, marks: p.marks.filter((m) => m.id !== id) }));
    },
    [updateActive]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "Escape") {
        cancelDraft();
        return;
      }
      if (e.key === "Enter") {
        finishPoly();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        deleteLast();
        return;
      }
      const toolKey: Record<string, Tool> = {
        "1": "line",
        "2": "poly",
        "3": "rect",
        "4": "ring",
        "5": "dot",
      };
      if (toolKey[e.key]) {
        setTool(toolKey[e.key]!);
        setDraft([]);
        return;
      }
      if (!plateFocus) return;
      const step = e.shiftKey ? 4 : 1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCursor((c) => [clampGrid(c[0] - step), c[1]]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCursor((c) => [clampGrid(c[0] + step), c[1]]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => [c[0], clampGrid(c[1] - step)]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => [c[0], clampGrid(c[1] + step)]);
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        place(cursor);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelDraft, cursor, deleteLast, finishPoly, place, plateFocus, undo]);

  function selectPunch(id: string) {
    setActiveId(id);
    setDraft([]);
  }

  function addPunch() {
    snapshot();
    const id = uid();
    const n = punches.filter((p) => p.name.startsWith("Untitled")).length + 1;
    setPunches((all) => [...all, { id, name: `Untitled ${n}`, marks: [] }]);
    setActiveId(id);
    setDraft([]);
  }

  function duplicatePunch() {
    snapshot();
    const id = uid();
    setPunches((all) => [
      ...all,
      {
        id,
        name: `${active.name} copy`,
        marks: active.marks.map((m) => ({ ...m, id: uid() })),
      },
    ]);
    setActiveId(id);
  }

  function removePunch() {
    if (punches.length <= 1) return;
    snapshot();
    const next = punches.filter((p) => p.id !== active.id);
    setPunches(next);
    setActiveId(next[0]!.id);
    setDraft([]);
  }

  function exportSheet() {
    downloadSvg("stroke-sheet.svg", emitSheet(punches, family));
    setSaved("Sheet written — vector paths, not a picture.");
  }

  function exportSprite() {
    downloadSvg("stroke-sprite.svg", emitSprite(punches, family));
    setSaved("Sprite written — symbols, currentColor, 24-unit bodies.");
  }

  async function copyPunch() {
    const svg = emitPunch(active.marks, family, active.name);
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setSaved("Clipboard blocked. Use Sheet · SVG instead.");
    }
  }

  const ghost = draftGhost(tool, draft, hover ?? (plateFocus ? cursor : null), family);
  const ghostOps = ghost ? drawMarks([ghost], family) : [];

  const lines: number[] = [];
  for (let i = 0; i <= GRID; i++) lines.push(i);

  return (
    <div className={`${s.desk} ${reduced ? s.still : ""}`}>
      <div className={s.sheet}>
        <header className={s.mast}>
          <div className={s.brand}>
            <p className={s.kicker}>A punch for a set</p>
            <h1 className={s.word}>Stroke</h1>
          </div>
          <p className={s.dek}>
            Weight, terminals, joins, corner and optical correction live on the
            family. Every punch inherits them. Change the spec and the whole
            set recuts. Geometry is local; the stroke is not.
          </p>
          <a className={s.escape} href={TASK}>
            task
          </a>
        </header>

        <section className={s.spec} aria-label="Set — the shared stroke">
          <p className={s.specLabel}>
            <span>Set</span>
            <span className={s.specReadout}>{specLine(family)}</span>
          </p>
          <div className={s.specRow}>
            <fieldset className={s.field}>
              <legend>Weight</legend>
              <div className={s.chips} role="group" aria-label="Stroke weight">
                {WEIGHTS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={family.weight === w}
                    aria-label={`Weight ${w}`}
                    className={family.weight === w ? s.chipOn : s.chip}
                    onClick={() => setFamily((f) => ({ ...f, weight: w }))}
                  >
                    <svg viewBox="0 0 28 8" width="28" height="8" aria-hidden>
                      <line
                        x1="2"
                        y1="4"
                        x2="26"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth={w}
                        strokeLinecap={family.cap}
                      />
                    </svg>
                    <span>{w}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className={s.field}>
              <legend>Terminals</legend>
              <div className={s.chips} role="group" aria-label="Stroke terminals">
                {(
                  [
                    ["butt", "Flush"],
                    ["round", "Round"],
                    ["square", "Square"],
                  ] as const
                ).map(([cap, label]) => (
                  <button
                    key={cap}
                    type="button"
                    aria-pressed={family.cap === cap}
                    className={family.cap === cap ? s.chipOn : s.chip}
                    onClick={() => setFamily((f) => ({ ...f, cap }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className={s.field}>
              <legend>Joins</legend>
              <div className={s.chips} role="group" aria-label="Stroke joins">
                {(
                  [
                    ["miter", "Mitre"],
                    ["round", "Round"],
                    ["bevel", "Bevel"],
                  ] as const
                ).map(([join, label]) => (
                  <button
                    key={join}
                    type="button"
                    aria-pressed={family.join === join}
                    className={family.join === join ? s.chipOn : s.chip}
                    onClick={() => setFamily((f) => ({ ...f, join }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className={s.field}>
              <legend>Corner</legend>
              <div className={s.chips} role="group" aria-label="Corner radius">
                {RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={family.radius === r}
                    className={family.radius === r ? s.chipOn : s.chip}
                    onClick={() => setFamily((f) => ({ ...f, radius: r }))}
                  >
                    r{r}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className={s.field}>
              <legend>Optical</legend>
              <button
                type="button"
                role="switch"
                aria-checked={family.optical}
                className={family.optical ? s.chipOn : s.chip}
                onClick={() => setFamily((f) => ({ ...f, optical: !f.optical }))}
              >
                {family.optical ? "On" : "Off"}
                <span className={s.optHint}>
                  {family.optical
                    ? " — circles grow, diagonals hold weight"
                    : " — nominal geometry"}
                </span>
              </button>
            </fieldset>
          </div>
        </section>

        <div className={s.barMobile} aria-label="The set at twenty pixels">
          {punches.map((p) => (
            <button
              key={`m-${p.id}`}
              type="button"
              className={p.id === active.id ? s.barOn : s.barBtn}
              onClick={() => selectPunch(p.id)}
              aria-label={p.name}
            >
              <PunchGlyph marks={p.marks} family={family} size={20} />
            </button>
          ))}
        </div>

        <div className={s.stage}>
          <aside className={s.proof} aria-label="The set">
            <p className={s.colHead}>
              <span>Punches</span>
              <span>{punches.length}</span>
            </p>
            <ul className={s.proofList}>
              {punches.map((p, i) => {
                const hot = p.id === active.id;
                const d = dens[i] ?? 0;
                const heavy = mid > 0 && Math.abs(d - mid) > mid * 0.5;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={hot ? s.proofOn : s.proofBtn}
                      onClick={() => selectPunch(p.id)}
                      aria-current={hot ? "true" : undefined}
                    >
                      <PunchGlyph marks={p.marks} family={family} size={28} />
                      <span className={s.proofName}>{p.name}</span>
                      <span
                        className={heavy ? s.denWarn : s.den}
                        title={`Ink density ${d.toFixed(3)}`}
                      >
                        <i style={{ width: `${Math.min(100, d * 220)}%` }} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className={s.proofActs}>
              <button type="button" className={s.ghostBtn} onClick={addPunch}>
                New punch
              </button>
              <button type="button" className={s.ghostBtn} onClick={duplicatePunch}>
                Duplicate
              </button>
              <button
                type="button"
                className={s.ghostBtn}
                onClick={removePunch}
                disabled={punches.length <= 1}
              >
                Drop
              </button>
            </div>
          </aside>

          <section className={s.plateCol}>
            <div className={s.plateHead}>
              <p className={s.colHead}>
                <span>Local</span>
                <span>24-unit body</span>
              </p>
              <label className={s.nameLab} htmlFor={nameId}>
                Name
              </label>
              <input
                id={nameId}
                className={s.name}
                value={active.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setPunches((all) =>
                    all.map((p) => (p.id === active.id ? { ...p, name } : p))
                  );
                }}
              />
            </div>

            <div className={s.plateWrap}>
              <span className={`${s.crop} ${s.cropTl}`} aria-hidden />
              <span className={`${s.crop} ${s.cropTr}`} aria-hidden />
              <span className={`${s.crop} ${s.cropBl}`} aria-hidden />
              <span className={`${s.crop} ${s.cropBr}`} aria-hidden />
              <svg
                ref={plateRef}
                className={s.plate}
                viewBox="0 0 24 24"
                role="application"
                tabIndex={0}
                aria-label="Icon plate. Arrow keys move the cursor, Space places a point, Enter finishes a polyline, Backspace removes the last mark."
                onFocus={() => setPlateFocus(true)}
                onBlur={() => setPlateFocus(false)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  plateRef.current?.focus();
                  place(toGrid(e, e.currentTarget));
                }}
                onPointerMove={(e) => setHover(toGrid(e, e.currentTarget))}
                onPointerLeave={() => setHover(null)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  finishPoly();
                }}
              >
                <rect width="24" height="24" className={s.plateBed} />
                {keylines &&
                  lines.map((i) => (
                    <g key={i} className={i % 4 === 0 ? s.gridStrong : s.gridFine}>
                      <line x1={i} y1="0" x2={i} y2="24" />
                      <line x1="0" y1={i} x2="24" y2={i} />
                    </g>
                  ))}
                {keylines && (
                  <g className={s.keyline}>
                    <rect x="4" y="4" width="16" height="16" />
                    <circle cx="12" cy="12" r="8" />
                  </g>
                )}
                {drawMarks(active.marks, family).map((op) =>
                  op.circle ? (
                    <circle
                      key={op.key}
                      className={s.ink}
                      cx={op.circle.cx}
                      cy={op.circle.cy}
                      r={op.circle.r}
                      stroke={op.fill === "currentColor" ? "none" : "currentColor"}
                      strokeWidth={op.strokeWidth}
                      strokeLinecap={op.cap}
                      strokeLinejoin={op.join}
                      fill={op.fill}
                    />
                  ) : (
                    <path
                      key={op.key}
                      className={s.ink}
                      d={op.d}
                      stroke="currentColor"
                      strokeWidth={op.strokeWidth}
                      strokeLinecap={op.cap}
                      strokeLinejoin={op.join}
                      fill="none"
                    />
                  )
                )}
                {ghostOps.map((op) =>
                  op.circle ? (
                    <circle
                      key={`g-${op.key}`}
                      className={s.ghost}
                      cx={op.circle.cx}
                      cy={op.circle.cy}
                      r={op.circle.r}
                      strokeWidth={op.strokeWidth}
                      strokeLinecap={op.cap}
                      strokeLinejoin={op.join}
                      fill={op.fill === "currentColor" ? "currentColor" : "none"}
                    />
                  ) : (
                    <path
                      key={`g-${op.key}`}
                      className={s.ghost}
                      d={op.d}
                      strokeWidth={op.strokeWidth}
                      strokeLinecap={op.cap}
                      strokeLinejoin={op.join}
                      fill="none"
                    />
                  )
                )}
                {(hover || plateFocus) && (
                  <g className={s.snap} aria-hidden>
                    {(() => {
                      const p = hover ?? cursor;
                      return (
                        <>
                          <line x1={p[0] - 0.7} y1={p[1]} x2={p[0] + 0.7} y2={p[1]} />
                          <line x1={p[0]} y1={p[1] - 0.7} x2={p[0]} y2={p[1] + 0.7} />
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>

            <div className={s.tools} role="toolbar" aria-label="Drawing tools">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tool === t.id ? s.toolOn : s.tool}
                  aria-pressed={tool === t.id}
                  onClick={() => {
                    setTool(t.id);
                    setDraft([]);
                  }}
                >
                  <span>{t.label}</span>
                  <em>{t.hint}</em>
                </button>
              ))}
              <button
                type="button"
                className={keylines ? s.toolOn : s.tool}
                aria-pressed={keylines}
                onClick={() => setKeylines((v) => !v)}
              >
                <span>Key</span>
                <em>Construction</em>
              </button>
            </div>
            <p className={s.plateHint}>
              {draft.length > 0
                ? tool === "poly"
                  ? `${draft.length} points. Enter or click the last point again to strike.`
                  : "Next point commits the mark."
                : "Click the grid, or focus the plate and use the arrows. Marks snap to the 24-unit body — there is no freehand."}
            </p>
          </section>

          <aside className={s.rail}>
            <p className={s.colHead}>
              <span>Marks</span>
              <span>this punch</span>
            </p>
            {active.marks.length === 0 ? (
              <p className={s.empty}>No marks yet. A punch is a list of grid geometry.</p>
            ) : (
              <ol className={s.marks}>
                {active.marks.map((m) => (
                  <li key={m.id}>
                    <span>{markLabel(m)}</span>
                    <button type="button" className={s.x} onClick={() => dropMark(m.id)} aria-label={`Remove ${markLabel(m)}`}>
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className={s.proofActs}>
              <button type="button" className={s.ghostBtn} onClick={deleteLast}>
                Backspace
              </button>
              <button type="button" className={s.ghostBtn} onClick={undo}>
                Undo
              </button>
            </div>

            <p className={s.colHead}>
              <span>Used at</span>
              <span>true sizes</span>
            </p>
            <div className={s.sizes} aria-label="Active punch at toolbar sizes">
              {[16, 20, 24, 32].map((sz) => (
                <figure key={sz} className={s.sizeFig}>
                  <PunchGlyph marks={active.marks} family={family} size={sz} />
                  <figcaption>{sz}</figcaption>
                </figure>
              ))}
            </div>

            <p className={s.colHead}>
              <span>Toolbar</span>
              <span>the set, 20</span>
            </p>
            <div className={s.bar} aria-label="Full set at twenty pixels">
              {punches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={p.id === active.id ? s.barOn : s.barBtn}
                  onClick={() => selectPunch(p.id)}
                  aria-label={p.name}
                >
                  <PunchGlyph marks={p.marks} family={family} size={20} />
                </button>
              ))}
            </div>
          </aside>
        </div>

        <footer className={s.foot}>
          <div className={s.export}>
            <button type="button" className={s.inkBtn} onClick={exportSheet}>
              Sheet · SVG
            </button>
            <button type="button" className={s.inkBtn} onClick={exportSprite}>
              Sprite · SVG
            </button>
            <button type="button" className={s.ghostBtn} onClick={copyPunch}>
              {copied ? "Copied" : "Copy this punch"}
            </button>
            <p id={liveId} className={s.live} role="status" aria-live="polite">
              {saved ?? ""}
            </p>
          </div>
          <p className={s.colophon}>
            Optical correction is a pair of honest lies: circles overshoot so
            they match squares, and diagonal strokes thicken so they match
            uprights. Density ticks under each punch compare ink load across the
            set — vermillion when a glyph is an outlier. Export is SVG source, a
            designer can paste the sheet into Figma and a developer can drop the
            sprite into a codebase.
          </p>
        </footer>
      </div>
    </div>
  );
}
