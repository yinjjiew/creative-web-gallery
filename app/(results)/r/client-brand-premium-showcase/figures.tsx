"use client";

/**
 * Everything drawn rather than photographed.
 *
 * There are no photographs on this site, which suits a brief that rules out
 * windswept models. What replaces them is the drawing a mill would actually
 * have: a grader's flat with dimensions on it, a weaving draft on point paper,
 * a section through the cloth, and a chart of eight years of micron figures.
 * All four are instruments rather than atmosphere.
 */
import type { Lot } from "./data/lots";
import s from "./mill.module.css";

/* ------------------------------------------------------------------- flat */

/**
 * A grader's flat of the coat, front view, in line only.
 *
 * `mode` decides which dimension lines are drawn: the spec sheet shows the
 * garment's own measurements, and the measuring guide shows the visitor where to
 * lay a tape on a coat they already own. Same drawing, because they are the same
 * four measurements, which is the point being made about buying unseen.
 */
export function CoatFlat({
  mode,
  colour,
}: {
  mode: "spec" | "measure";
  colour: string;
}) {
  const ink = "#1b1813";
  const dim = "#8e3a22";

  return (
    <svg
      className={s.drawing}
      viewBox="0 0 320 470"
      role="img"
      aria-label={
        mode === "spec"
          ? "Line drawing of the coat from the front, with its four graded measurements marked: shoulder to shoulder, chest, centre back to cuff, and shoulder to hem."
          : "Line drawing of a coat laid flat, with arrows showing where to lay a tape measure: across the shoulder seams, across the chest under the arms, from the centre back neck to the cuff, and from the high shoulder to the hem."
      }
    >
      <g fill="none" stroke={ink} strokeWidth="1.4" strokeLinejoin="round">
        {/* body, drawn once and mirrored about x = 160 */}
        {[1, -1].map((side) => (
          <g
            key={side}
            transform={side === 1 ? undefined : "translate(320,0) scale(-1,1)"}
          >
            <path
              d="M136,44 L100,50 C90,74 84,100 86,128 C82,210 76,300 70,398 L160,404"
              fill={colour}
              fillOpacity="0.5"
            />
            <path d="M136,44 L100,50 C90,74 84,100 86,128" />
            <path d="M86,128 C82,210 76,300 70,398" />
            <path d="M70,398 L160,404" />
            {/* sleeve */}
            <path
              d="M100,50 C74,86 58,170 52,296 L90,304 C92,240 90,176 86,128"
              fill={colour}
              fillOpacity="0.5"
            />
            <path d="M100,50 C74,86 58,170 52,296 L90,304" />
            <path d="M52,296 L90,304" strokeWidth="1.1" />
            {/* cuff turn */}
            <path d="M53,278 L89,286" strokeWidth="0.8" stroke="#6d685d" />
            {/* pocket */}
            <path d="M84,258 L126,262 L124,306 L82,302 Z" strokeWidth="1.1" />
            <path d="M84,258 L126,262" strokeWidth="1.6" />
          </g>
        ))}

        {/* collar */}
        <path
          d="M136,44 C130,30 132,22 140,18 L180,18 C188,22 190,30 184,44"
          fill={colour}
          fillOpacity="0.7"
        />
        <path d="M136,44 C144,56 152,60 160,60 C168,60 176,56 184,44" />

        {/* front edge of the overlapping right front, and the button stand */}
        <path d="M138,52 L134,404" strokeWidth="1.1" />
        <path d="M160,60 L160,404" strokeWidth="0.7" stroke="#6d685d" strokeDasharray="4 4" />

        {/* buttons on the centre front */}
        {[96, 152, 208, 264, 320, 376].map((y) => (
          <circle key={y} cx="160" cy={y} r="4.2" strokeWidth="1.1" fill="#efece5" />
        ))}

        {/* back-neck seam hint */}
        <path d="M148,20 L172,20" strokeWidth="0.7" stroke="#6d685d" />
      </g>

      <g
        fill="none"
        stroke={dim}
        strokeWidth="1"
        fontFamily="var(--aw-mono), monospace"
        fontSize="9.5"
      >
        <defs>
          <marker
            id="awTick"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M3,0 L3,6" stroke={dim} strokeWidth="1.2" />
          </marker>
        </defs>

        {/* shoulder to shoulder */}
        <path d="M136,44 L136,32 M184,44 L184,32" strokeWidth="0.7" />
        <path d="M136,36 L184,36" markerStart="url(#awTick)" markerEnd="url(#awTick)" />
        <text x="187" y="39" fill={dim}>
          shoulder
        </text>

        {/* chest */}
        <path d="M86,128 L74,128 M234,128 L246,128" strokeWidth="0.7" />
        <path d="M86,134 L234,134" markerStart="url(#awTick)" markerEnd="url(#awTick)" />
        <text x="90" y="150" fill={dim}>
          chest, flat × 2
        </text>

        {/* centre back to cuff, following the seam */}
        <path
          d="M160,26 L136,44 L100,50 C74,86 58,170 52,290"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <circle cx="160" cy="26" r="2.6" fill={dim} stroke="none" />
        <circle cx="52" cy="290" r="2.6" fill={dim} stroke="none" />
        <text x="14" y="248" fill={dim}>
          back to cuff
        </text>

        {/* shoulder to hem */}
        <path d="M184,26 L292,26 M234,404 L292,404" strokeWidth="0.7" />
        <path d="M286,26 L286,404" markerStart="url(#awTick)" markerEnd="url(#awTick)" />
        <text
          x="0"
          y="0"
          fill={dim}
          transform="translate(300,230) rotate(-90)"
          textAnchor="middle"
        >
          shoulder to hem
        </text>
      </g>

      {mode === "measure" ? (
        <text
          x="12"
          y="462"
          fontFamily="var(--aw-mono), monospace"
          fontSize="9"
          fill="#6d685d"
        >
          Lay the coat flat, buttoned, and smooth it. Measure in centimetres.
        </text>
      ) : (
        <text
          x="12"
          y="462"
          fontFamily="var(--aw-mono), monospace"
          fontSize="9"
          fill="#6d685d"
        >
          Single-breasted, six buttons, patch pockets, canvas front, felled lining.
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ draft */

/** The weaving draft on point paper: filled square means the warp lifts. */
export function Draft({ repeats = 3 }: { repeats?: number }) {
  const cell = 13;
  const n = 4 * repeats;
  const size = n * cell;

  const squares: React.ReactElement[] = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      // 2/2 twill: the warp end lifts over two picks, drops under two, and the
      // pattern steps sideways by one each pick. That step is the twill line.
      const up = (i + j) % 4 < 2;
      squares.push(
        <rect
          key={`${String(i)}-${String(j)}`}
          x={i * cell}
          y={j * cell}
          width={cell}
          height={cell}
          fill={up ? "#1b1813" : "none"}
        />
      );
    }
  }

  return (
    <svg
      className={s.drawing}
      viewBox={`-1 -1 ${String(size + 2)} ${String(size + 2)}`}
      role="img"
      aria-label="A weaving draft on point paper for two-and-two twill: filled squares run in diagonal bands two squares wide, stepping one square sideways for each pick."
    >
      <g>{squares}</g>
      <g stroke="#8d8879" strokeWidth="0.6" fill="none">
        {Array.from({ length: n + 1 }, (_, k) => (
          <line key={`v${String(k)}`} x1={k * cell} y1="0" x2={k * cell} y2={size} />
        ))}
        {Array.from({ length: n + 1 }, (_, k) => (
          <line key={`h${String(k)}`} x1="0" y1={k * cell} x2={size} y2={k * cell} />
        ))}
      </g>
      <path
        d={`M0,${String(size)} L${String(size)},0`}
        stroke="#8e3a22"
        strokeWidth="1.2"
        strokeDasharray="5 4"
        fill="none"
      />
    </svg>
  );
}

/** A section through the cloth: one pick of weft crossing four warp ends. */
export function Section({ colour }: { colour: string }) {
  const ends = 9;
  const pitch = 30;
  const r = 11;
  const y = 46;

  const path: string[] = [];
  for (let i = 0; i < ends; i += 1) {
    const x = 20 + i * pitch;
    const over = i % 4 < 2;
    const dy = over ? -(r + 5) : r + 5;
    path.push(`${i === 0 ? "M" : "L"}${String(x)},${String(y + dy)}`);
  }

  return (
    <svg
      className={s.drawing}
      viewBox="0 0 300 96"
      role="img"
      aria-label="A section through the cloth. Nine warp ends are drawn as circles in a row; one weft pick runs across them, passing over two and under two, and rising and falling as it goes. That rise and fall is the crimp that gives the cloth its thickness."
    >
      <rect x="0" y="0" width="300" height="96" fill="none" />
      <path
        d={path.join(" ")}
        fill="none"
        stroke="#8e3a22"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {Array.from({ length: ends }, (_, i) => (
        <circle
          key={i}
          cx={20 + i * pitch}
          cy={y}
          r={r}
          fill={colour}
          stroke="#1b1813"
          strokeWidth="1.1"
        />
      ))}
      <g stroke="#6d685d" strokeWidth="0.7" fill="none">
        <path d="M6,30 L6,62" />
        <path d="M2,30 L10,30 M2,62 L10,62" />
      </g>
      <text
        x="14"
        y="90"
        fontFamily="var(--aw-mono), monospace"
        fontSize="8.5"
        fill="#6d685d"
      >
        cloth thickness ≈ 2.1 mm after fulling
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ chart */

/**
 * Eight years of mean fibre diameter for one lot, against the tolerance a
 * blended cloth is held to. The chart exists to make the trade-off visible
 * rather than merely admitted: the single-flock line wanders outside a band that
 * a blend would never leave.
 */
export function MicronChart({ lot }: { lot: Lot }) {
  const w = 560;
  const h = 190;
  const padL = 40;
  const padR = 14;
  const padT = 22;
  const padB = 34;

  const values = lot.history.map((entry) => entry.micron);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const lo = Math.min(...values) - 1.1;
  const hi = Math.max(...values) + 1.1;

  const x = (i: number) =>
    padL + (i * (w - padL - padR)) / (lot.history.length - 1);
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * (h - padT - padB);

  const line = lot.history
    .map((entry, i) => `${i === 0 ? "M" : "L"}${String(x(i))},${String(y(entry.micron))}`)
    .join(" ");

  /* A blended coating cloth is bought to a specification and held to about
     half a micron either side of it; that is what buying from many flocks is
     for. Drawn as a band so the comparison is a shape, not a sentence. */
  const bandTop = y(mean + 0.5);
  const bandBottom = y(mean - 0.5);

  return (
    <svg
      className={s.drawing}
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      role="img"
      aria-label={`Mean fibre diameter of the ${lot.farm} clip for each year from ${String(lot.history[0].year)} to ${String(lot.history[lot.history.length - 1].year)}, ranging from ${String(Math.min(...values))} to ${String(Math.max(...values))} micrometres, plotted against the half-micron tolerance band a blended cloth would be held to. The line leaves the band in most years.`}
    >
      <rect
        x={padL}
        y={bandTop}
        width={w - padL - padR}
        height={bandBottom - bandTop}
        fill="#8d8879"
        fillOpacity="0.22"
      />
      <line
        x1={padL}
        y1={y(mean)}
        x2={w - padR}
        y2={y(mean)}
        stroke="#6d685d"
        strokeWidth="0.8"
        strokeDasharray="4 4"
      />
      <text
        x={w - padR}
        y={bandTop - 5}
        textAnchor="end"
        fontFamily="var(--aw-mono), monospace"
        fontSize="9"
        fill="#3d3931"
      >
        what a blend holds: ±0.5 µm
      </text>

      <line
        x1={padL}
        y1={padT - 6}
        x2={padL}
        y2={h - padB}
        stroke="#8d8879"
        strokeWidth="0.8"
      />
      <line
        x1={padL}
        y1={h - padB}
        x2={w - padR}
        y2={h - padB}
        stroke="#8d8879"
        strokeWidth="0.8"
      />

      {[Math.ceil(lo), Math.floor(hi)].map((tick) => (
        <g key={tick}>
          <text
            x={padL - 6}
            y={y(tick) + 3}
            textAnchor="end"
            fontFamily="var(--aw-mono), monospace"
            fontSize="9"
            fill="#6d685d"
          >
            {tick}
          </text>
          <line
            x1={padL - 3}
            y1={y(tick)}
            x2={padL}
            y2={y(tick)}
            stroke="#8d8879"
            strokeWidth="0.8"
          />
        </g>
      ))}

      <path d={line} fill="none" stroke="#1b1813" strokeWidth="1.6" />

      {lot.history.map((entry, i) => (
        <g key={entry.year}>
          <circle
            cx={x(i)}
            cy={y(entry.micron)}
            r={i === lot.history.length - 1 ? 4.6 : 3.2}
            fill={i === lot.history.length - 1 ? "#8e3a22" : "#1b1813"}
          />
          <text
            x={x(i)}
            y={y(entry.micron) - 10}
            textAnchor="middle"
            fontFamily="var(--aw-mono), monospace"
            fontSize="9"
            fill={i === lot.history.length - 1 ? "#8e3a22" : "#3d3931"}
          >
            {entry.micron.toFixed(1)}
          </text>
          <text
            x={x(i)}
            y={h - padB + 15}
            textAnchor="middle"
            fontFamily="var(--aw-mono), monospace"
            fontSize="9"
            fill="#6d685d"
          >
            {String(entry.year).slice(2)}
          </text>
        </g>
      ))}

      <text
        x={padL}
        y={h - 6}
        fontFamily="var(--aw-mono), monospace"
        fontSize="9"
        fill="#6d685d"
      >
        mean fibre diameter, µm · {lot.farm}
      </text>
    </svg>
  );
}

/** Eight years of the same cloth's colour, side by side. */
export function ShadeStrip({ lot }: { lot: Lot }) {
  return (
    <svg
      className={s.drawing}
      viewBox="0 0 560 74"
      role="img"
      aria-label={`The colour of ${lot.farm} cloth in each of the last eight years, shown as eight swatches side by side. They are recognisably the same colour and visibly not the same shade.`}
    >
      {lot.history.map((entry, i) => {
        const cw = 560 / lot.history.length;
        return (
          <g key={entry.year}>
            <rect
              x={i * cw}
              y={0}
              width={cw - 3}
              height={48}
              fill={entry.hex}
              stroke="#1b1813"
              strokeWidth="0.7"
            />
            <text
              x={i * cw}
              y={66}
              fontFamily="var(--aw-mono), monospace"
              fontSize="10"
              fill={i === lot.history.length - 1 ? "#8e3a22" : "#6d685d"}
            >
              {entry.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
