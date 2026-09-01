"use client";

/**
 * The bench is a score. The plot is the primary object — a polyline from a
 * driver in [0, 1] onto one Fraunces axis. Letters are phase-offset readers
 * of that same function. Changing the driver does not change the function;
 * it only changes what x means.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import s from "./bench.module.css";
import { emitDocument, emitSnippet, fileStem } from "./emit";
import {
  AXES,
  AXIS_BY_ID,
  PIECES,
  PIECE_BY_ID,
  PERIODS,
  STAGGERS,
  clamp,
  driverAt,
  formulaOf,
  mapAxis,
  periodLabel,
  sampleCurve,
  settingsFor,
  staggerLabel,
  wrap01,
  type AxisId,
  type Driver,
  type Knot,
} from "./score";

const TASK_PATH = "/tasks/creative-tools-typography-playground";
const REDUCED = "(prefers-reduced-motion: reduce)";
const MAX_LINE = 28;
const RADIUS = 180;

const PAD = { l: 56, r: 18, t: 16, b: 28 };

type Box = { w: number; h: number };

function gx(t: number, w: number): number {
  return PAD.l + clamp(t, 0, 1) * Math.max(1, w - PAD.l - PAD.r);
}

function gy(y: number, h: number): number {
  return PAD.t + (1 - clamp(y, 0, 1)) * Math.max(1, h - PAD.t - PAD.b);
}

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

function proximityOf(
  index: number,
  letters: Array<HTMLSpanElement | null>,
  pointer: { x: number; y: number } | null,
  hot: number | null
): number {
  if (pointer) {
    const el = letters[index];
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
    return clamp(1 - d / RADIUS, 0, 1);
  }
  if (hot !== null) return clamp(1 - Math.abs(index - hot) / 3, 0, 1);
  return 0;
}

function curvePoints(knots: Knot[], box: Box): string {
  if (box.w < 8 || box.h < 8) return "";
  const samples: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    samples.push(`${gx(t, box.w).toFixed(1)},${gy(sampleCurve(knots, t), box.h).toFixed(1)}`);
  }
  return samples.join(" ");
}

export default function Bench() {
  const uid = useId();
  const reduced = usePrefersReducedMotion();

  const first = PIECES[0];
  const [pieceId, setPieceId] = useState(first.id);
  const [line, setLine] = useState(first.line);
  const [driver, setDriver] = useState<Driver>(first.driver);
  const [period, setPeriod] = useState(first.period);
  const [stagger, setStagger] = useState(first.stagger);
  const [axisId, setAxisId] = useState<AxisId>(first.axis);
  const [knots, setKnots] = useState<Knot[]>(() => first.knots.map((k) => ({ ...k })));
  const [playing, setPlaying] = useState(true);
  const [selected, setSelected] = useState(-1);
  const [box, setBox] = useState<Box>({ w: 0, h: 0 });
  const [hot, setHot] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<Array<HTMLSpanElement | null>>([]);
  const playheadRef = useRef<SVGLineElement>(null);
  const beadsRef = useRef<SVGGElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const plotRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<Box>({ w: 0, h: 0 });

  const clockRef = useRef(0);
  const playingRef = useRef(playing);
  const reducedRef = useRef(reduced);
  const driverRef = useRef(driver);
  const periodRef = useRef(period);
  const staggerRef = useRef(stagger);
  const axisRef = useRef(axisId);
  const knotsRef = useRef(knots);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const hotRef = useRef<number | null>(null);
  const dragRef = useRef<null | { kind: "knot" | "head"; index: number }>(null);

  playingRef.current = playing;
  reducedRef.current = reduced;
  driverRef.current = driver;
  periodRef.current = period;
  staggerRef.current = stagger;
  axisRef.current = axisId;
  knotsRef.current = knots;
  hotRef.current = hot;
  boxRef.current = box;

  const axis = AXIS_BY_ID.get(axisId)!;
  const chars = line.length === 0 ? [" "] : line.split("").slice(0, MAX_LINE);
  if (lettersRef.current.length > chars.length) {
    lettersRef.current.length = chars.length;
  }
  const formula = formulaOf({ axis: axisId, driver, stagger });

  const emitInput = useMemo(
    () => ({
      title: PIECE_BY_ID.get(pieceId)?.title ?? "Piece",
      line: line || "kinesis",
      driver,
      period,
      stagger,
      axis: axisId,
      knots,
    }),
    [pieceId, line, driver, period, stagger, axisId, knots]
  );

  const snippet = useMemo(() => emitSnippet(emitInput), [emitInput]);

  const loadPiece = useCallback(
    (id: string) => {
      const piece = PIECE_BY_ID.get(id);
      if (!piece) return;
      setPieceId(id);
      setLine(piece.line);
      setDriver(piece.driver);
      setPeriod(piece.period);
      setStagger(piece.stagger);
      setAxisId(piece.axis);
      setKnots(piece.knots.map((k) => ({ ...k })));
      setSelected(-1);
      clockRef.current = 0;
      setPlaying(piece.driver === "time" && !reduced);
    },
    [reduced]
  );

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  const paint = useCallback(() => {
    const currentAxis = AXIS_BY_ID.get(axisRef.current)!;
    const currentKnots = knotsRef.current;
    const currentDriver = driverRef.current;
    const currentStagger = staggerRef.current;
    const clock = clockRef.current;
    const letters = lettersRef.current;
    const pointer = pointerRef.current;
    const focus = hotRef.current;

    let firstValue = mapAxis(currentAxis, sampleCurve(currentKnots, clock));

    letters.forEach((el, i) => {
      if (!el) return;
      const prox = proximityOf(i, letters, pointer, focus);
      const t = driverAt(currentDriver, clock, i, currentStagger, prox);
      const y = sampleCurve(currentKnots, t);
      const value = mapAxis(currentAxis, y);
      if (i === 0) firstValue = value;
      el.style.fontVariationSettings = settingsFor(currentAxis, value);
    });

    if (readoutRef.current) {
      readoutRef.current.textContent = `${currentAxis.id} ${currentAxis.id === "WONK" || currentAxis.id === "SOFT" || currentAxis.id === "opsz" ? firstValue.toFixed(currentAxis.decimals) : Math.round(firstValue)}`;
    }

    const size = boxRef.current;
    const head = playheadRef.current;
    if (head) {
      const x = gx(clock, size.w).toFixed(1);
      head.setAttribute("x1", x);
      head.setAttribute("x2", x);
      head.setAttribute("visibility", currentDriver === "pointer" ? "hidden" : "visible");
    }

    const beads = beadsRef.current;
    if (beads) {
      const nodes = beads.querySelectorAll("text");
      nodes.forEach((node, i) => {
        const prox = proximityOf(i, letters, pointer, focus);
        const t = driverAt(currentDriver, clock, i, currentStagger, prox);
        const y = sampleCurve(currentKnots, t);
        node.setAttribute("x", gx(t, size.w).toFixed(1));
        node.setAttribute("y", gy(y, size.h).toFixed(1));
      });
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (driverRef.current === "time" && playingRef.current && !reducedRef.current) {
        clockRef.current = wrap01(clockRef.current + dt / periodRef.current);
      } else if (driverRef.current === "scroll") {
        const well = wellRef.current;
        if (well) {
          const max = well.scrollHeight - well.clientHeight;
          clockRef.current = max <= 0 ? 0 : well.scrollTop / max;
        }
      }
      paint();
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [paint]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width < 8 || rect.height < 8) return;
      const next = { w: rect.width, h: rect.height };
      boxRef.current = next;
      setBox(next);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const clientToGraph = useCallback((clientX: number, clientY: number) => {
    const svg = plotRef.current;
    const size = boxRef.current;
    if (!svg || size.w < 8) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left - PAD.l) / Math.max(1, size.w - PAD.l - PAD.r);
    const y = 1 - (clientY - rect.top - PAD.t) / Math.max(1, size.h - PAD.t - PAD.b);
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
  }, []);

  const moveKnot = useCallback((index: number, x: number, y: number) => {
    setKnots((prev) => {
      const next = prev.map((k) => ({ ...k }));
      if (!next[index]) return prev;
      next[index] = { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
      return next;
    });
  }, []);

  useEffect(() => {
    const onMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const point = clientToGraph(event.clientX, event.clientY);
      if (drag.kind === "knot") {
        moveKnot(drag.index, point.x, point.y);
      } else {
        clockRef.current = point.x;
        if (driverRef.current === "time") setPlaying(false);
        if (driverRef.current === "scroll") {
          const well = wellRef.current;
          if (well) {
            const max = well.scrollHeight - well.clientHeight;
            well.scrollTop = point.x * max;
          }
        }
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clientToGraph, moveKnot]);

  const onKnotKey = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const knot = knots[index];
    if (!knot) return;
    const step = event.shiftKey ? 0.08 : 0.03;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveKnot(index, knot.x, knot.y + step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveKnot(index, knot.x, knot.y - step);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveKnot(index, knot.x - step, knot.y);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveKnot(index, knot.x + step, knot.y);
    } else if ((event.key === "Backspace" || event.key === "Delete") && knots.length > 2) {
      event.preventDefault();
      setKnots((prev) => prev.filter((_, i) => i !== index));
      setSelected(Math.max(0, index - 1));
    }
  };

  const onPlotPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    const point = clientToGraph(event.clientX, event.clientY);
    const hit = knots.findIndex((k) => Math.hypot(k.x - point.x, k.y - point.y) < 0.06);
    if (hit >= 0) {
      setSelected(hit);
      dragRef.current = { kind: "knot", index: hit };
      return;
    }
    if (driver !== "pointer") {
      dragRef.current = { kind: "head", index: -1 };
      clockRef.current = point.x;
      if (driver === "time") setPlaying(false);
    }
  };

  const onPlotDoubleClick = (event: MouseEvent<SVGSVGElement>) => {
    const point = clientToGraph(event.clientX, event.clientY);
    setKnots((prev) => [...prev, { x: point.x, y: point.y }].sort((a, b) => a.x - b.x));
  };

  const onStagePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (driver !== "pointer") return;
    pointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const onStageLeave = () => {
    pointerRef.current = null;
  };

  const onLetterKey = (index: number, event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = Math.min(chars.length - 1, index + 1);
      setHot(next);
      lettersRef.current[next]?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const next = Math.max(0, index - 1);
      setHot(next);
      lettersRef.current[next]?.focus();
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied("Copied the running snippet.");
    } catch {
      setCopied("Clipboard was refused — select the snippet and copy it yourself.");
    }
  };

  const downloadPage = () => {
    const html = emitDocument(emitInput);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileStem(emitInput.title, emitInput.line)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(`Wrote ${a.download}. Open it without this bench.`);
  };

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    if (box.w < 8 || box.h < 8) return lines;
    for (let i = 0; i <= 4; i++) {
      const y = gy(i / 4, box.h);
      lines.push({ x1: PAD.l, y1: y, x2: box.w - PAD.r, y2: y, key: `h${i}` });
    }
    for (let i = 0; i <= 4; i++) {
      const x = gx(i / 4, box.w);
      lines.push({ x1: x, y1: PAD.t, x2: x, y2: box.h - PAD.b, key: `v${i}` });
    }
    return lines;
  }, [box]);

  return (
    <div className={s.shell}>
      <header className={s.mast}>
        <div className={s.brand}>
          <p className={s.mark}>Kinesis</p>
          <p className={s.lede}>
            A score for type that exists in time. Variable-font axes are functions
            of a driver — the clock, the pointer, or the scroll — read once per
            letter with a phase offset. The wave is that offset, not a preset.
            Fraunces by Undercase Type, self-hosted through next/font; the four
            axes on the rail are the real ones in the face.
          </p>
        </div>
        <Link className={s.brief} href={TASK_PATH}>
          brief
        </Link>
      </header>

      <aside className={s.pieces} aria-label="Starting compositions">
        {PIECES.map((piece) => (
          <button
            key={piece.id}
            type="button"
            className={s.piece}
            aria-pressed={piece.id === pieceId}
            onClick={() => loadPiece(piece.id)}
          >
            <span className={s.pieceTitle}>{piece.title}</span>
            <span className={s.pieceBlurb}>{piece.blurb}</span>
          </button>
        ))}
      </aside>

      <section className={s.stage} aria-label="The line">
        <div
          ref={stageRef}
          className={s.line}
          onPointerMove={onStagePointer}
          onPointerDown={onStagePointer}
          onPointerLeave={onStageLeave}
        >
          {chars.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              ref={(el) => {
                lettersRef.current[i] = el;
              }}
              className={s.glyph}
              tabIndex={driver === "pointer" ? 0 : -1}
              onFocus={() => setHot(i)}
              onBlur={() => setHot((h) => (h === i ? null : h))}
              onKeyDown={(event) => onLetterKey(i, event)}
            >
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </div>
        <label className={s.lineField}>
          <span className={s.sr}>The line</span>
          <input
            className={s.lineInput}
            value={line}
            maxLength={MAX_LINE}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => setLine(event.target.value.slice(0, MAX_LINE))}
            aria-describedby={`${uid}-line-hint`}
          />
        </label>
        <p id={`${uid}-line-hint`} className={s.hint}>
          {driver === "pointer"
            ? "Move across the letters, or tab and walk them with the arrows."
            : driver === "scroll"
              ? "Scroll the rail, or drag the playhead on the plot."
              : reduced
                ? "Motion is paused. Play writes the clock; drag the playhead to scrub."
                : "The clock is running. Drag the playhead to scrub; pause to hold a frame."}
        </p>
      </section>

      <section className={s.score} aria-label="The curve">
        <div className={s.scoreHead}>
          <p className={s.formula} aria-live="polite">
            {formula}
          </p>
          <span ref={readoutRef} className={s.readout} aria-hidden="true">
            {axis.id}
          </span>
        </div>

        <div className={s.plotRow}>
          <div className={s.plotFrame} ref={frameRef}>
          <svg
            ref={plotRef}
            className={s.plot}
            viewBox={box.w > 0 ? `0 0 ${box.w} ${box.h}` : "0 0 100 220"}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Curve of ${axis.name} over ${driver}. Drag knots to reshape. Double-click to add a knot.`}
            onPointerDown={onPlotPointerDown}
            onDoubleClick={onPlotDoubleClick}
          >
            {gridLines.map((lineMark) => (
              <line
                key={lineMark.key}
                x1={lineMark.x1}
                y1={lineMark.y1}
                x2={lineMark.x2}
                y2={lineMark.y2}
                className={s.grid}
              />
            ))}
            <text className={s.axisHi} x={8} y={PAD.t + 9}>
              {axis.max}
            </text>
            <text className={s.axisLo} x={8} y={box.h - PAD.b + 3}>
              {axis.min}
            </text>
            <text className={s.axisX} x={PAD.l} y={box.h - 8}>
              0
            </text>
            <text className={s.axisX} x={box.w - PAD.r - 8} y={box.h - 8}>
              1
            </text>
            <polyline className={s.curve} points={curvePoints(knots, box)} />
            <line
              ref={playheadRef}
              className={s.head}
              x1={gx(0, box.w)}
              x2={gx(0, box.w)}
              y1={PAD.t}
              y2={box.h - PAD.b}
            />
            <g ref={beadsRef} className={s.beads}>
              {chars.map((ch, i) => (
                <text key={`bead-${i}`} className={s.bead}>
                  {ch === " " ? "" : ch}
                </text>
              ))}
            </g>
          </svg>

          <div className={s.knotLayer} aria-label="Curve knots">
            {knots.map((knot, i) => (
              <button
                key={`knot-${i}`}
                type="button"
                className={s.knot}
                style={{
                  left: box.w > 0 ? `${(gx(knot.x, box.w) / box.w) * 100}%` : 0,
                  top: box.h > 0 ? `${(gy(knot.y, box.h) / box.h) * 100}%` : 0,
                }}
                aria-label={`${axis.name} ${Math.round(knot.x * 100)} percent through the driver`}
                aria-valuemin={axis.min}
                aria-valuemax={axis.max}
                aria-valuenow={Math.round(mapAxis(axis, knot.y))}
                role="slider"
                aria-pressed={selected === i}
                onFocus={() => setSelected(i)}
                onKeyDown={(event) => onKnotKey(i, event)}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelected(i);
                  dragRef.current = { kind: "knot", index: i };
                }}
              />
            ))}
          </div>
          </div>

          {driver === "scroll" ? (
            <div
              ref={wellRef}
              className={s.well}
              tabIndex={0}
              aria-label="Scroll rail. Progress drives the curve."
            >
              <div className={s.wellInner}>
                <span>0</span>
                <span>¼</span>
                <span>½</span>
                <span>¾</span>
                <span>1</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <nav className={s.rail} aria-label="What the curve means">
        <fieldset className={s.set}>
          <legend>Driver</legend>
          {(["time", "pointer", "scroll"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={s.chip}
              aria-pressed={driver === id}
              onClick={() => {
                setDriver(id);
                setPlaying(id === "time" && !reduced);
              }}
            >
              {id === "time" ? "clock" : id}
            </button>
          ))}
        </fieldset>

        <fieldset className={s.set}>
          <legend>Axis</legend>
          {AXES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={s.chip}
              aria-pressed={axisId === item.id}
              onClick={() => setAxisId(item.id)}
              title={item.note}
            >
              {item.name}
            </button>
          ))}
        </fieldset>

        {driver === "time" ? (
          <fieldset className={s.set}>
            <legend>Period</legend>
            {PERIODS.map((item) => (
              <button
                key={item}
                type="button"
                className={s.chip}
                aria-pressed={period === item}
                onClick={() => setPeriod(item)}
              >
                {periodLabel(item)}
              </button>
            ))}
            <button type="button" className={s.textBtn} onClick={() => setPlaying((p) => !p)}>
              {playing && !reduced ? "pause" : "play"}
            </button>
          </fieldset>
        ) : null}

        {driver !== "pointer" ? (
          <fieldset className={s.set}>
            <legend>Phase</legend>
            {STAGGERS.map((item) => (
              <button
                key={item}
                type="button"
                className={s.chip}
                aria-pressed={stagger === item}
                onClick={() => setStagger(item)}
              >
                {staggerLabel(item)}
              </button>
            ))}
          </fieldset>
        ) : null}
      </nav>

      <section className={s.notes} aria-label="The axes">
        <dl>
          {AXES.map((item) => (
            <div key={item.id} className={s.note}>
              <dt>
                {item.id}
                <span>
                  {item.min}–{item.max}
                </span>
              </dt>
              <dd>{item.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className={s.export}>
        <button
          type="button"
          className={s.exportToggle}
          aria-expanded={sheet}
          onClick={() => setSheet((open) => !open)}
        >
          {sheet ? "Hide the artifact" : "Take the artifact"}
        </button>
        {sheet ? (
          <div className={s.sheet}>
            <p>
              Time compiles to CSS keyframes and <code>animation-delay</code> per
              letter. Pointer and scroll compile to a script that samples this
              same polyline. Load Fraunces with <code>SOFT</code>, <code>WONK</code>{" "}
              and <code>opsz</code> or the variation settings will be ignored.
            </p>
            <div className={s.exportRow}>
              <button type="button" className={s.chip} onClick={() => void copySnippet()}>
                Copy snippet
              </button>
              <button type="button" className={s.chip} onClick={downloadPage}>
                Download HTML
              </button>
            </div>
            <pre className={s.code} tabIndex={0}>
              {snippet}
            </pre>
            <p className={s.live} role="status">
              {copied}
            </p>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
