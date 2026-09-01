"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import s from "./arch.module.css";
import {
  type ArchGeom,
  type ArchKind,
  type Load,
  type Pt,
  beamMoment,
  buildArch,
  catenaryA,
  centerlineY,
  circularRadius,
  clamp,
  closedPath,
  hangingCatenaryY,
  hangingPoints,
  pathFrom,
  reportThrust,
  safestThrust,
  spreadMechanism,
  standingCatenaryY,
  svgPoint,
  threeHingeH,
  viewToModel,
} from "./statics";

const q = (n: number) => n.toFixed(4);

const STONE = "#c9c6ba";
const STONE_LINE = "#2a2620";
const INK = "#14120f";
const MUTE = "#6a655c";
const THRUST = "#a33b18";
const CHAIN = "#1c4038";
const PAPER = "#dde0d6";

function Slider({
  label,
  value,
  min,
  max,
  step,
  readout,
  valueText,
  onInput,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  readout: string;
  valueText: string;
  onInput: (n: number) => void;
}) {
  const id = useId();
  return (
    <div className={s.control}>
      <div className={s.controlTop}>
        <label htmlFor={id}>{label}</label>
        <span className={s.controlValue}>{readout}</span>
      </div>
      <input
        id={id}
        className={s.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onInput(Number(e.target.value))}
      />
    </div>
  );
}

function Figure({
  id,
  n,
  title,
  children,
  caption,
  live,
  state,
}: {
  id: string;
  n: string;
  title: string;
  children: ReactNode;
  caption: string;
  live?: string;
  state?: "safe" | "tension" | "out";
}) {
  return (
    <figure className={s.figure} id={id}>
      <figcaption className={s.figHead}>
        <span className={s.figN}>Fig. {n}</span>
        <span>{title}</span>
      </figcaption>
      {children}
      <p className={s.figCaption}>{caption}</p>
      {live ? (
        <p className={s.figLive} data-state={state} aria-live="polite">
          {live}
        </p>
      ) : null}
    </figure>
  );
}

function useSvgDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
  ox: number,
  oy: number,
  scale: number,
  onMove: (model: Pt) => void,
) {
  const down = useRef(false);
  const fire = useCallback(
    (e: ReactPointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const view = svgPoint(svg, e.clientX, e.clientY);
      onMove(viewToModel(view, ox, oy, scale));
    },
    [svgRef, ox, oy, scale, onMove],
  );
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      down.current = true;
      fire(e);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (!down.current) return;
      fire(e);
    },
    onPointerUp: () => {
      down.current = false;
    },
    onPointerCancel: () => {
      down.current = false;
    },
  };
}

function Drawn({
  children,
  viewBox,
  aria,
  svgRef,
  drag,
}: {
  children: ReactNode;
  viewBox: string;
  aria: string;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  drag?: ReturnType<typeof useSvgDrag>;
  ratio?: string;
}) {
  return (
    <div className={s.plate}>
      <svg ref={svgRef} viewBox={viewBox} role="img" aria-label={aria} {...drag}>
        {children}
      </svg>
    </div>
  );
}

function masonryPath(arch: ArchGeom): string {
  return closedPath(arch.extrados, arch.intrados);
}

function jointsMarks(arch: ArchGeom): ReactNode {
  return arch.joints.map((j, i) => (
    <line
      key={i}
      x1={q(j.inn.x)}
      y1={q(j.inn.y)}
      x2={q(j.out.x)}
      y2={q(j.out.y)}
      stroke={STONE_LINE}
      strokeWidth={0.035}
      opacity={0.35}
    />
  ));
}

function kernBand(arch: ArchGeom): string {
  const t = arch.thickness / 6;
  const inner = arch.centerline.map((p, i) => {
    const q =
      i < arch.centerline.length - 1 ? arch.centerline[i + 1] : arch.centerline[i - 1];
    const tx = q.x - p.x;
    const ty = q.y - p.y;
    const n = Math.hypot(tx, ty) || 1;
    const nx = -ty / n;
    const ny = tx / n;
    return { x: p.x - nx * t, y: p.y - ny * t };
  });
  const outer = arch.centerline.map((p, i) => {
    const q =
      i < arch.centerline.length - 1 ? arch.centerline[i + 1] : arch.centerline[i - 1];
    const tx = q.x - p.x;
    const ty = q.y - p.y;
    const n = Math.hypot(tx, ty) || 1;
    const nx = -ty / n;
    const ny = tx / n;
    return { x: p.x + nx * t, y: p.y + ny * t };
  });
  return closedPath(outer, inner);
}

function arrow(from: Pt, to: Pt, color: string, width = 0.07): ReactNode {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const head = 0.28;
  return (
    <g stroke={color} fill={color} strokeWidth={width}>
      <line x1={q(from.x)} y1={q(from.y)} x2={q(to.x)} y2={q(to.y)} />
      <polygon
        points={[
          [to.x, to.y],
          [to.x - head * Math.cos(ang - 0.4), to.y - head * Math.sin(ang - 0.4)],
          [to.x - head * Math.cos(ang + 0.4), to.y - head * Math.sin(ang + 0.4)],
        ]
          .map((p) => p.map((n) => n.toFixed(4)).join(","))
          .join(" ")}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ Fig. I */

export function LintelFig() {
  const [span, setSpan] = useState(8);
  const [load, setLoad] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const ox = 320;
  const oy = 328;
  const scale = 22;
  const half = span / 2;
  const beamY = 9.2;
  const h = 1.15;
  const rise = 2.15;
  const arch = useMemo(() => buildArch("circular", span, rise, 1.15, 3), [span, rise]);
  const H = threeHingeH(arch, [{ x: 0, w: load * 2 }]);
  const W = arch.totalWeight + load * 2;
  const moment = (load * span) / 4;
  const drag = useSvgDrag(svgRef, ox, oy, scale, (m) => {
    setLoad(clamp(beamY + 2.4 - m.y, 0.25, 3.2));
  });

  return (
    <Figure
      id="fig-lintel"
      n="I"
      title="A lintel, and then three stones"
      caption="The same opening, the same downward load. In the beam the bottom must stretch. In the arch every joint is being squeezed. The red arrows at the springings are the outward push the abutments have to answer — that is the price of having no tension."
      live={`Lintel midspan moment grows with span × load. Arch horizontal thrust H  =  ${(H / W).toFixed(2)} × weight.`}
    >
      <Drawn
        svgRef={svgRef}
        viewBox="0 0 640 360"
        aria="A loaded lintel above a three-stone arch. Drag the load."
        drag={drag}
        ratio="640 / 360"
      >
          <g transform={`translate(${ox} ${oy}) scale(${scale} ${-scale})`}>
            <rect x={q(-half - 0.45)} y={q(beamY - 1.85)} width="0.7" height="1.85" fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
            <rect x={q(half - 0.25)} y={q(beamY - 1.85)} width="0.7" height="1.85" fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
            <rect x={q(-half)} y={q(beamY)} width={q(span)} height={q(h)} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
            <rect
              x={q(-half)}
              y={q(beamY)}
              width={q(span)}
              height={q(h / 2)}
              fill="rgba(163,59,24,0.28)"
            />
            <path
              d={`M ${q(-half)} ${q(beamY + h)} L ${q(half)} ${q(beamY + h)}`}
              stroke={CHAIN}
              strokeWidth={0.055}
              fill="none"
            />
            <path
              d={`M ${q(-half)} ${q(beamY)} L ${q(half)} ${q(beamY)}`}
              stroke={THRUST}
              strokeWidth={0.055}
              strokeDasharray="0.18 0.12"
              fill="none"
            />
            {arrow({ x: 0, y: beamY + h + 0.15 + load * 0.85 }, { x: 0, y: beamY + h + 0.08 }, INK, 0.08)}
            <circle cx={0} cy={q(beamY + h + 0.15 + load * 0.85)} r={0.18} fill={INK} />
            <path
              d={masonryPath(arch)}
              fill={STONE}
              stroke={STONE_LINE}
              strokeWidth={0.045}
            />
            {jointsMarks(arch)}
            {arrow({ x: 0, y: rise + 1.2 + load * 0.7 }, { x: 0, y: rise + arch.thickness / 2 + 0.12 }, INK, 0.08)}
            <circle cx={0} cy={q(rise + 1.2 + load * 0.7)} r={0.18} fill={INK} />
            {arrow(
              { x: -half, y: 0 },
              { x: -half - (H / W) * 2.4, y: 0 },
              THRUST,
              0.07,
            )}
            {arrow(
              { x: half, y: 0 },
              { x: half + (H / W) * 2.4, y: 0 },
              THRUST,
              0.07,
            )}
            {arrow({ x: -half, y: 0 }, { x: -half, y: -1.15 }, INK, 0.06)}
            {arrow({ x: half, y: 0 }, { x: half, y: -1.15 }, INK, 0.06)}
          </g>
      </Drawn>
      <div className={`${s.controls} ${s.two}`}>
        <Slider
          label="Span of the opening"
          value={span}
          min={5.5}
          max={11}
          step={0.1}
          readout={span.toFixed(1)}
          valueText={`span ${span.toFixed(1)}`}
          onInput={setSpan}
        />
        <Slider
          label="Load on the crown"
          value={load}
          min={0.25}
          max={3.2}
          step={0.05}
          readout={load.toFixed(2)}
          valueText={`load ${load.toFixed(2)}`}
          onInput={setLoad}
        />
      </div>
      <p className={s.legend}>
        <span>
          <i className={`${s.swatch} ${s.chain}`} />
          compression
        </span>
        <span>
          <i className={`${s.swatch} ${s.thrust}`} />
          tension, and the outward thrust
        </span>
        <span>Moment in the lintel (midspan) {moment.toFixed(2)}</span>
      </p>
    </Figure>
  );
}

/* ----------------------------------------------------------------- Fig. II */

export function RiseFig() {
  const [rise, setRise] = useState(3.6);
  const [kind, setKind] = useState<ArchKind>("circular");
  const span = 10;
  const arch = useMemo(
    () => buildArch(kind, span, rise, 1.05, 14),
    [kind, rise],
  );
  const H = threeHingeH(arch);
  const W = arch.totalWeight;
  const angle = (Math.atan2(W / 2, H) * 180) / Math.PI;
  const deckH = W / (8 * (rise / span));
  const svgRef = useRef<SVGSVGElement>(null);
  const ox = 320;
  const oy = 300;
  const scale = 26;
  const drag = useSvgDrag(svgRef, ox, oy, scale, (m) => {
    const next = clamp(m.y, 1.8, kind === "pointed" ? 7.4 : 5);
    setRise(next);
    if (next > 5.05 && kind === "circular") setKind("pointed");
  });

  const deckPts = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -span / 2 + (span * i) / 40;
      const y = rise * (1 - (2 * x / span) ** 2);
      pts.push({ x, y });
    }
    return pts;
  }, [rise, span]);

  return (
    <Figure
      id="fig-rise"
      n="II"
      title="Rise is a force"
      caption="Three-hinge funicular through the springing mid-points and the crown. The red arrows are H; the black ones are the vertical reactions. A uniform load spread along the span would give H = W L / 8r — the dashed parabola. Self-weight of the masonry is heavier near the sides, so the real H is a little different. The difference is visible. It is also small next to what happens when you flatten the arch."
      live={`H  =  ${(H / W).toFixed(2)} × weight, arriving at ${angle.toFixed(0)}° from the horizontal. Halve the rise and you roughly double the push.`}
    >
      <Drawn
        svgRef={svgRef}
        viewBox="0 0 640 360"
        aria="An arch whose rise you can drag. Horizontal thrust is drawn at the springings."
        drag={drag}
        ratio="640 / 360"
      >
          <g transform={`translate(${ox} ${oy}) scale(${scale} ${-scale})`}>
            <path d={masonryPath(arch)} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
            {jointsMarks(arch)}
            <path
              d={pathFrom(deckPts)}
              fill="none"
              stroke={MUTE}
              strokeWidth={0.035}
              strokeDasharray="0.16 0.12"
              opacity={0.75}
            />
            <circle
              cx={0}
              cy={q(rise)}
              r={0.22}
              fill={PAPER}
              stroke={INK}
              strokeWidth={0.06}
            />
            {arrow({ x: -span / 2, y: 0 }, { x: -span / 2 - (H / W) * 3.2, y: 0 }, THRUST, 0.075)}
            {arrow({ x: span / 2, y: 0 }, { x: span / 2 + (H / W) * 3.2, y: 0 }, THRUST, 0.075)}
            {arrow({ x: -span / 2, y: 0 }, { x: -span / 2, y: -1.35 }, INK, 0.06)}
            {arrow({ x: span / 2, y: 0 }, { x: span / 2, y: -1.35 }, INK, 0.06)}
            <line
              x1={q(-span / 2)}
              y1={0}
              x2={q(span / 2)}
              y2={0}
              stroke={MUTE}
              strokeWidth={0.03}
            />
          </g>
      </Drawn>
      <div className={`${s.controls} ${s.two}`}>
        <Slider
          label="Rise"
          value={rise}
          min={1.8}
          max={kind === "pointed" ? 7.4 : 5}
          step={0.05}
          readout={`${rise.toFixed(2)}  ·  r/L ${(rise / span).toFixed(2)}`}
          valueText={`rise ${rise.toFixed(2)}`}
          onInput={(v) => {
            setRise(v);
            if (v > 5.02) setKind("pointed");
            if (v <= 5 && kind === "pointed") setKind("circular");
          }}
        />
        <div className={s.control}>
          <div className={s.controlTop}>
            <span>Deck-load formula W L / 8r</span>
            <span className={s.controlValue}>{(deckH / W).toFixed(2)} × W</span>
          </div>
          <div className={s.controlTop}>
            <span>Self-weight, three-hinge</span>
            <span className={s.controlValue}>{(H / W).toFixed(2)} × W</span>
          </div>
        </div>
      </div>
      <div className={s.toggles} role="group" aria-label="Arch shape">
        {(
          [
            ["circular", "Circular"],
            ["catenary", "Catenary"],
            ["pointed", "Pointed"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={s.toggle}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              if (k === "pointed" && rise < 5.1) setRise(5.4);
              if (k !== "pointed" && rise > 5) setRise(4.6);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p className={s.legend}>
        <span>
          <i className={`${s.swatch} ${s.thrust}`} />
          horizontal thrust
        </span>
        <span>
          <i className={s.swatch} style={{ background: MUTE }} />
          parabola of a uniform deck load
        </span>
        <span>Drag the crown, or use the slider</span>
      </p>
    </Figure>
  );
}

/* ---------------------------------------------------------------- Fig. III */

export function ChainFig() {
  const [span, setSpan] = useState(10);
  const [sag, setSag] = useState(3.4);
  const [invert, setInvert] = useState(false);
  const [showCircle, setShowCircle] = useState(true);
  const [showPara, setShowPara] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const ox = 320;
  const oy = invert ? 300 : 70;
  const scale = 24;
  const a = catenaryA(span, sag);
  const half = span / 2;

  const chain: Pt[] = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 64; i++) {
      const x = -half + (span * i) / 64;
      const y = invert ? standingCatenaryY(x, span, sag) : hangingCatenaryY(x, span, sag);
      pts.push({ x, y });
    }
    return pts;
  }, [span, sag, invert, half]);

  const circle: Pt[] = useMemo(() => {
    const R = circularRadius(span, sag);
    const cy = invert ? sag - R : -(sag - R);
    const pts: Pt[] = [];
    for (let i = 0; i <= 48; i++) {
      const x = -half + (span * i) / 48;
      const y = cy + (invert ? 1 : -1) * Math.sqrt(Math.max(0, R * R - x * x));
      pts.push({ x, y });
    }
    return pts;
  }, [span, sag, invert, half]);

  const para: Pt[] = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 48; i++) {
      const x = -half + (span * i) / 48;
      const y = (invert ? 1 : -1) * sag * (1 - (2 * x / span) ** 2);
      pts.push({ x, y });
    }
    return pts;
  }, [span, sag, invert, half]);

  const drag = useSvgDrag(svgRef, ox, oy, scale, (m) => {
    if (Math.abs(m.x) > half * 0.72) {
      setSpan(clamp(Math.abs(m.x) * 2, 6, 13));
      return;
    }
    const next = invert ? clamp(m.y, 1.4, 5.6) : clamp(-m.y, 1.4, 5.6);
    setSag(next);
  });

  return (
    <Figure
      id="fig-chain"
      n="III"
      title="As hangs the flexible line"
      caption="A uniform chain hangs in a catenary — not a circle, not a parabola. The circle through the same three points is drawn as a faint arc so the difference is not a matter of faith. A parabola is what a cable does under load that is uniform across the span, a deck rather than its own links. Invert the chain and every pull becomes a push."
      live={`Catenary parameter a  =  ${a.toFixed(2)}. ${invert ? "Inverted: the same curve, now in compression." : "Hanging: every link is in pure tension."}`}
    >
      <Drawn
        svgRef={svgRef}
        viewBox="0 0 640 360"
        aria="A hanging chain. Drag the middle to change the sag, or a support to change the span."
        drag={drag}
        ratio="640 / 360"
      >
          <g transform={`translate(${ox} ${oy}) scale(${scale} ${-scale})`}>
            {showCircle ? (
              <path d={pathFrom(circle)} fill="none" stroke={MUTE} strokeWidth={0.04} opacity={0.7} />
            ) : null}
            {showPara ? (
              <path
                d={pathFrom(para)}
                fill="none"
                stroke={MUTE}
                strokeWidth={0.035}
                strokeDasharray="0.14 0.1"
              />
            ) : null}
            <path
              d={pathFrom(chain)}
              fill="none"
              stroke={invert ? THRUST : CHAIN}
              strokeWidth={0.1}
              strokeLinecap="round"
            />
            {chain
              .filter((_, i) => i % 4 === 0)
              .map((p, i) => (
                <circle key={i} cx={q(p.x)} cy={q(p.y)} r={0.11} fill={invert ? THRUST : CHAIN} />
              ))}
            <circle cx={q(-half)} cy={0} r={0.2} fill={PAPER} stroke={INK} strokeWidth={0.06} />
            <circle cx={q(half)} cy={0} r={0.2} fill={PAPER} stroke={INK} strokeWidth={0.06} />
          </g>
      </Drawn>
      <div className={`${s.controls} ${s.two}`}>
        <Slider
          label="Span"
          value={span}
          min={6}
          max={13}
          step={0.1}
          readout={span.toFixed(1)}
          valueText={`span ${span.toFixed(1)}`}
          onInput={setSpan}
        />
        <Slider
          label={invert ? "Rise" : "Sag"}
          value={sag}
          min={1.4}
          max={5.6}
          step={0.05}
          readout={sag.toFixed(2)}
          valueText={`${invert ? "rise" : "sag"} ${sag.toFixed(2)}`}
          onInput={setSag}
        />
      </div>
      <div className={s.toggles}>
        <button
          type="button"
          className={s.toggle}
          aria-pressed={invert}
          onClick={() => setInvert((v) => !v)}
        >
          Invert
        </button>
        <button
          type="button"
          className={s.toggle}
          aria-pressed={showCircle}
          onClick={() => setShowCircle((v) => !v)}
        >
          Circle through the same three points
        </button>
        <button
          type="button"
          className={s.toggle}
          aria-pressed={showPara}
          onClick={() => setShowPara((v) => !v)}
        >
          Parabola of a deck load
        </button>
      </div>
    </Figure>
  );
}

/* ----------------------------------------------------------------- Fig. IV */

export function ThrustFig() {
  const span = 10;
  const rise = 5;
  const [thick, setThick] = useState(1.45);
  const [Hfac, setHfac] = useState(1);
  const [eL, setEL] = useState(0);
  const [eR, setER] = useState(0);
  const arch = useMemo(() => buildArch("circular", span, rise, thick, 16), [thick]);
  const H3 = threeHingeH(arch);
  const H = clamp(H3 * Hfac, H3 * 0.4, H3 * 2.8);
  const report = reportThrust(arch, H, eL, eR);
  const svgRef = useRef<SVGSVGElement>(null);
  const ox = 320;
  const oy = 318;
  const scale = 26;

  const drag = useSvgDrag(svgRef, ox, oy, scale, (m) => {
    if (m.x < -span * 0.38) {
      const j = arch.joints[0];
      const sParam =
        ((m.x - j.inn.x) * (j.out.x - j.inn.x) + (m.y - j.inn.y) * (j.out.y - j.inn.y)) /
        (dist2(j.inn, j.out) || 1);
      setEL(clamp(sParam * 2 - 1, -1, 1));
      return;
    }
    if (m.x > span * 0.38) {
      const j = arch.joints[arch.joints.length - 1];
      const sParam =
        ((m.x - j.inn.x) * (j.out.x - j.inn.x) + (m.y - j.inn.y) * (j.out.y - j.inn.y)) /
        (dist2(j.inn, j.out) || 1);
      setER(clamp(sParam * 2 - 1, -1, 1));
      return;
    }
    const start = report.start;
    const end = report.end;
    const chord = start.y + ((end.y - start.y) * (0 - start.x)) / (end.x - start.x);
    const M = beamMoment(arch.loads, 0, start.x, end.x);
    const y = clamp(m.y, 1.2, rise + thick);
    const nextH = M / Math.max(y - chord, 0.35);
    setHfac(clamp(nextH / H3, 0.4, 2.8));
  });

  const state = !report.inside ? "out" : report.inKern ? "safe" : "tension";
  const live = !report.inside
    ? "The line has left the masonry. This arrangement of forces is impossible. The stones will find another, or they will fall."
    : report.inKern
      ? "The line is inside the middle third. Every joint is entirely in compression."
      : "The line is still inside the stone, but it has left the middle third. Part of a joint has opened.";

  const minT = 0.72;
  const thin = thick < 1.05;

  return (
    <Figure
      id="fig-thrust"
      n="IV"
      title="The line of thrust"
      caption="A semicircular arch of uniform thickness, self-weight only. The pale band is the middle third — the kern of a rectangular joint. Drag the red line at the crown to change H; drag an end to move it along the springing. There is no single “true” thrust line. If any line stays inside, the arch can stand."
      live={live}
      state={state}
    >
      <Drawn
        svgRef={svgRef}
        viewBox="0 0 640 380"
        aria="A masonry arch with a draggable thrust line."
        drag={drag}
        ratio="640 / 380"
      >
          <g transform={`translate(${ox} ${oy}) scale(${scale} ${-scale})`}>
            <path d={masonryPath(arch)} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
            <path d={kernBand(arch)} fill="rgba(42,83,72,0.18)" />
            {jointsMarks(arch)}
            <path
              d={pathFrom(report.points)}
              fill="none"
              stroke={THRUST}
              strokeWidth={0.09}
              strokeLinecap="round"
              strokeDasharray={report.inside ? undefined : "0.22 0.12"}
            />
            {arch.joints.map((j, i) => {
              const t = report.jointS[i];
              const on = t >= -0.02 && t <= 1.02;
              const p = {
                x: j.inn.x + (j.out.x - j.inn.x) * clamp(t, -0.15, 1.15),
                y: j.inn.y + (j.out.y - j.inn.y) * clamp(t, -0.15, 1.15),
              };
              const hinge = t < 0.02 || t > 0.98;
              return (
                <circle
                  key={i}
                  cx={q(p.x)}
                  cy={q(p.y)}
                  r={hinge ? 0.13 : 0.07}
                  fill={on ? THRUST : PAPER}
                  stroke={THRUST}
                  strokeWidth={0.04}
                />
              );
            })}
            <circle
              cx={q(report.points[Math.floor(report.points.length / 2)].x)}
              cy={q(report.points[Math.floor(report.points.length / 2)].y)}
              r={0.2}
              fill={PAPER}
              stroke={THRUST}
              strokeWidth={0.06}
            />
          </g>
      </Drawn>
      <div className={`${s.controls} ${s.three}`}>
        <Slider
          label="Horizontal thrust"
          value={Hfac}
          min={0.4}
          max={2.8}
          step={0.02}
          readout={`${(H / arch.totalWeight).toFixed(2)} × W`}
          valueText={`H over weight ${(H / arch.totalWeight).toFixed(2)}`}
          onInput={setHfac}
        />
        <Slider
          label="Thickness"
          value={thick}
          min={minT}
          max={2.2}
          step={0.02}
          readout={`t / R  ${(thick / circularRadius(span, rise)).toFixed(2)}${thin ? "  — thin" : ""}`}
          valueText={`thickness ${thick.toFixed(2)}`}
          onInput={setThick}
        />
        <Slider
          label="Left springing"
          value={eL}
          min={-1}
          max={1}
          step={0.02}
          readout={eL === 0 ? "centre" : eL < 0 ? "toward soffit" : "toward extrados"}
          valueText={`left eccentricity ${eL.toFixed(2)}`}
          onInput={setEL}
        />
      </div>
      <p className={s.legend}>
        <span>
          <i className={`${s.swatch} ${s.kern}`} />
          middle third
        </span>
        <span>
          <i className={`${s.swatch} ${s.thrust}`} />
          thrust line
        </span>
        <span>A semicircle of minimum thickness is about t/R = 0.11. Thin the arch until no line fits.</span>
      </p>
    </Figure>
  );
}

function dist2(a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/* ------------------------------------------------------------------ Fig. V */

export function HingeFig() {
  const span = 10;
  const rise = 5;
  const thick = 1.35;
  const arch = useMemo(() => buildArch("circular", span, rise, thick, 16), []);
  const [loadX, setLoadX] = useState(2.4);
  const [loadW, setLoadW] = useState(0.55);
  const [spread, setSpread] = useState(0);
  const extra: Load[] = [{ x: loadX, w: loadW * arch.totalWeight * 0.35 }];
  const report = safestThrust(arch, extra);
  const mech = spreadMechanism(arch, spread);
  const svgRef = useRef<SVGSVGElement>(null);
  const ox = 320;
  const oy = 318;
  const scale = 26;
  const drag = useSvgDrag(svgRef, ox, oy, scale, (m) => {
    if (spread > 0.04) return;
    setLoadX(clamp(m.x, -span / 2 + 0.6, span / 2 - 0.6));
    const top = centerlineY("circular", clamp(m.x, -4.8, 4.8), span, rise) + thick / 2;
    if (m.y > top + 0.4) {
      setLoadW(clamp((m.y - top) * 0.7, 0.2, 3.2));
    }
  });

  const loadY =
    centerlineY("circular", loadX, span, rise) + thick / 2 + 0.15 + loadW * 0.55;

  const live =
    spread > 0.02
      ? "Four hinges. The arch is a mechanism: the crown drops, the haunches kick out. This is how a masonry arch usually dies — not by crushing."
      : !report.inside
        ? "No thrust line will stay in the masonry for this cart. A fourth hinge is trying to form."
        : report.inKern
          ? "A safe line still exists, and it lies in the middle third. Every joint is entirely in compression."
          : "A safe line still exists — the arch can stand — but it has left the middle third. Some joints are partly open. That is not yet a mechanism.";

  const state = spread > 0.02 || !report.inside ? "out" : report.inKern ? "safe" : "tension";

  return (
    <Figure
      id="fig-hinge"
      n="V"
      title="Hinges, not crushing"
      caption="The travelling load is a cart on the extrados. The line shown is the safest funicular of self-weight plus that cart — the one with the smallest peak eccentricity. Open a joint far enough and it becomes a hinge: the stones touch at a point. Slide “abutment spread” to see the four-hinge mechanism a semicircular arch prefers when its feet are allowed to walk apart."
      live={live}
      state={state}
    >
      <Drawn
        svgRef={svgRef}
        viewBox="0 0 640 380"
        aria="An arch with a draggable load and a spreading mechanism."
        drag={drag}
        ratio="640 / 380"
      >
          <g transform={`translate(${ox} ${oy}) scale(${scale} ${-scale})`}>
            {spread < 0.04 ? (
              <>
                <path d={masonryPath(arch)} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
                {jointsMarks(arch)}
                <path
                  d={pathFrom(report.points)}
                  fill="none"
                  stroke={THRUST}
                  strokeWidth={0.09}
                  strokeDasharray={report.inside ? undefined : "0.2 0.12"}
                />
                {[...new Set([
                  ...report.hingeJoints,
                  ...report.tensionJoints.filter(
                    (i) => report.jointS[i] < 0.08 || report.jointS[i] > 0.92,
                  ),
                ])].map((i) => {
                  const j = arch.joints[i];
                  const t = clamp(report.jointS[i], 0, 1);
                  const face = t < 0.5 ? j.inn : j.out;
                  return (
                    <circle
                      key={i}
                      cx={q(face.x)}
                      cy={q(face.y)}
                      r={0.16}
                      fill={PAPER}
                      stroke={THRUST}
                      strokeWidth={0.055}
                    />
                  );
                })}
                {arrow({ x: loadX, y: loadY }, { x: loadX, y: centerlineY("circular", loadX, span, rise) + thick / 2 + 0.1 }, INK, 0.07)}
                <rect
                  x={q(loadX - 0.32)}
                  y={q(loadY)}
                  width={0.64}
                  height={0.38}
                  fill={INK}
                />
              </>
            ) : (
              <>
                <path d={`${pathFrom(mech.left)} Z`} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
                <path d={`${pathFrom(mech.crown)} Z`} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
                <path d={`${pathFrom(mech.right)} Z`} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
                {mech.hinges.map((p, i) => (
                  <circle key={i} cx={q(p.x)} cy={q(p.y)} r={0.18} fill={PAPER} stroke={THRUST} strokeWidth={0.06} />
                ))}
              </>
            )}
          </g>
      </Drawn>
      <div className={`${s.controls} ${s.three}`}>
        <Slider
          label="Cart position"
          value={loadX}
          min={-4.4}
          max={4.4}
          step={0.05}
          readout={loadX.toFixed(2)}
          valueText={`load at ${loadX.toFixed(2)}`}
          onInput={setLoadX}
        />
        <Slider
          label="Cart weight"
          value={loadW}
          min={0.2}
          max={3.2}
          step={0.05}
          readout={`${(loadW * 0.35).toFixed(2)} × arch weight`}
          valueText={`load ${loadW.toFixed(2)}`}
          onInput={setLoadW}
        />
        <Slider
          label="Abutment spread"
          value={spread}
          min={0}
          max={1}
          step={0.01}
          readout={spread === 0 ? "held" : "four-hinge mechanism"}
          valueText={spread === 0 ? "abutments held" : "spreading mechanism"}
          onInput={setSpread}
        />
      </div>
    </Figure>
  );
}

/* ----------------------------------------------------------------- Fig. VI */

export function InvertFig() {
  const span = 10;
  const [kind, setKind] = useState<ArchKind>("circular");
  const [thick, setThick] = useState(1.35);
  const [Hfac, setHfac] = useState(1);
  const rise = kind === "pointed" ? 6.2 : 5;
  const arch = useMemo(() => buildArch(kind, span, rise, thick, 16), [kind, thick, rise]);
  const H3 = threeHingeH(arch);
  const H = clamp(H3 * Hfac, H3 * 0.45, H3 * 2.4);
  const report = reportThrust(arch, H, 0, 0);
  const hang = hangingPoints(arch.loads, H, report.start, report.end);
  const hangShift = 1.15;
  const hung = hang.map((p) => ({ x: p.x, y: p.y - hangShift }));
  const svgRef = useRef<SVGSVGElement>(null);
  const ox = 320;
  const oy = 248;
  const scale = 22;
  const drag = useSvgDrag(svgRef, ox, oy, scale, (m) => {
    if (m.y < 1) {
      const sag = clamp(-m.y + hangShift * 0.2, 1.2, 6);
      const M = beamMoment(arch.loads, 0, report.start.x, report.end.x);
      const nextH = M / sag;
      setHfac(clamp(nextH / H3, 0.45, 2.4));
    } else {
      const start = report.start;
      const end = report.end;
      const chord = start.y + ((end.y - start.y) * (0 - start.x)) / (end.x - start.x);
      const M = beamMoment(arch.loads, 0, start.x, end.x);
      const y = clamp(m.y, 1.4, rise + thick);
      setHfac(clamp(M / Math.max(y - chord, 0.4) / H3, 0.45, 2.4));
    }
  });

  const state = !report.inside ? "out" : report.inKern ? "safe" : "tension";
  const live = report.inside
    ? report.inKern
      ? "The inverted chain lies inside the middle third. The arch can stand, and no joint need open."
      : "The inverted chain is inside the masonry. That is enough. The arch can stand."
    : "This hanging does not fit. Try a deeper sag, a flatter one, a thicker ring, or a catenary arch — the shape that is the chain.";

  return (
    <Figure
      id="fig-invert"
      n="VI"
      title="The whole argument, hanging"
      caption="The chain below is the funicular of the same voussoir weights as the arch above — not a uniform-link ideal, but the hanging that matches these stones. Its inversion is the thrust line. Drag the chain. If you can nest the inverted hanging inside the masonry, you have proved the arch can stand, which is Heyman's safe theorem with a piece of string."
      live={live}
      state={state}
    >
      <Drawn
        svgRef={svgRef}
        viewBox="0 0 640 440"
        aria="A masonry arch above a hanging chain. Drag the chain to fit its inversion inside the stone."
        drag={drag}
        ratio="640 / 440"
      >
          <g transform={`translate(${ox} ${oy}) scale(${scale} ${-scale})`}>
            <path d={masonryPath(arch)} fill={STONE} stroke={STONE_LINE} strokeWidth={0.04} />
            {jointsMarks(arch)}
            <path
              d={pathFrom(report.points)}
              fill="none"
              stroke={THRUST}
              strokeWidth={0.1}
              strokeDasharray={report.inside ? undefined : "0.2 0.11"}
              strokeLinecap="round"
            />
            <path
              d={pathFrom(hung)}
              fill="none"
              stroke={CHAIN}
              strokeWidth={0.09}
              strokeLinecap="round"
            />
            {hung
              .filter((_, i) => i % 5 === 0)
              .map((p, i) => (
                <circle key={i} cx={q(p.x)} cy={q(p.y)} r={0.1} fill={CHAIN} />
              ))}
            <circle
              cx={0}
              cy={q(hung[Math.floor(hung.length / 2)].y)}
              r={0.2}
              fill={PAPER}
              stroke={CHAIN}
              strokeWidth={0.055}
            />
          </g>
      </Drawn>
      <div className={`${s.controls} ${s.two}`}>
        <Slider
          label="Sag of the chain  ·  H"
          value={Hfac}
          min={0.45}
          max={2.4}
          step={0.02}
          readout={`${(H / arch.totalWeight).toFixed(2)} × W`}
          valueText={`H over weight ${(H / arch.totalWeight).toFixed(2)}`}
          onInput={setHfac}
        />
        <Slider
          label="Thickness"
          value={thick}
          min={0.7}
          max={2.1}
          step={0.02}
          readout={`t  =  ${thick.toFixed(2)}`}
          valueText={`thickness ${thick.toFixed(2)}`}
          onInput={setThick}
        />
      </div>
      <div className={s.toggles} role="group" aria-label="Masonry shape">
        {(
          [
            ["circular", "Circular masonry"],
            ["catenary", "Catenary masonry"],
            ["pointed", "Pointed masonry"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={s.toggle}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            {label}
          </button>
        ))}
      </div>
    </Figure>
  );
}

