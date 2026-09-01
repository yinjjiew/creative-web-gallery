import {
  cellAt,
  flooded,
  markOf,
  onBoat,
  sounding,
  type Level,
  type State,
} from "./engine";
import s from "./tide.module.css";

type Props = {
  level: Level;
  state: State;
  reduce: boolean;
};

export default function Chart({ level, state, reduce }: Props) {
  const mark = markOf(state.phase);
  const cw = 72;
  const ch = 72;
  const pad = 36;
  const W = level.w * cw + pad * 2;
  const H = level.h * ch + pad * 2;

  const cells = [];
  for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
      const cell = cellAt(level, x, y)!;
      const wet = flooded(cell, mark);
      const px = pad + x * cw;
      const py = pad + y * ch;
      const isGoal = level.goal.x === x && level.goal.y === y;
      const isBoat = !!(state.boat && state.boat.x === x && state.boat.y === y);
      const isTimber = state.timbers.some((t) => t.x === x && t.y === y);
      const isPlayer = state.player.x === x && state.player.y === y;

      if (cell.kind === "rock") {
        cells.push(
          <g key={`${x}-${y}`}>
            <rect x={px} y={py} width={cw} height={ch} fill="#c9bb94" />
            <path
              d={hachure(px, py, cw, ch, x + y)}
              fill="none"
              stroke="#1c1812"
              strokeWidth="0.7"
              opacity="0.55"
            />
          </g>
        );
        continue;
      }

      let fill = "#d8cba8";
      if (cell.kind === "channel") fill = wet ? "#7d8d82" : "#c4b48a";
      else if (cell.kind === "reef") fill = wet ? "#6f8278" : "#b4a57c";
      else if (wet) fill = cell.elev === 0 ? "#88988c" : "#93a196";
      else if (cell.elev === 0) fill = "#cbb888";
      else if (cell.elev === 1) fill = "#d2c49a";

      cells.push(
        <g key={`${x}-${y}`}>
          <rect x={px} y={py} width={cw} height={ch} fill={fill} />
          {wet ? (
            <path
              d={waterLines(px, py, cw, ch, mark)}
              fill="none"
              stroke="#1c1812"
              strokeWidth="0.55"
              opacity={reduce ? 0.18 : 0.22 + mark * 0.06}
            />
          ) : cell.elev < 2 ? (
            <path
              d={stipple(px, py, cw, ch)}
              fill="#1c1812"
              opacity="0.2"
            />
          ) : (
            <path
              d={landGrain(px, py, cw, ch)}
              fill="none"
              stroke="#1c1812"
              strokeWidth="0.45"
              opacity="0.12"
            />
          )}
          {cell.kind === "reef" && !wet && (
            <path
              d={reefMarks(px, py, cw, ch)}
              fill="none"
              stroke="#1c1812"
              strokeWidth="1.1"
              opacity="0.65"
            />
          )}
          {wet && cell.kind !== "reef" && (
            <text
              x={px + cw - 8}
              y={py + ch - 8}
              textAnchor="end"
              fill="#1c1812"
              opacity="0.45"
              fontSize="11"
              fontFamily="var(--figures), ui-monospace, monospace"
            >
              {sounding(x, y)}
            </text>
          )}
          {!wet && cell.elev === 0 && (
            <text
              x={px + 8}
              y={py + 16}
              fill="#1c1812"
              opacity="0.4"
              fontSize="9"
              fontStyle="italic"
              fontFamily="var(--display), serif"
            >
              dries
            </text>
          )}
          {isGoal && (
            <g transform={`translate(${px + cw / 2},${py + ch / 2})`}>
              <path
                d="M0-14 L3-3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3-3 Z"
                fill="none"
                stroke="#1c1812"
                strokeWidth="1.4"
              />
              <circle r="3.2" fill="#1c1812" />
            </g>
          )}
          {isTimber && (
            <g transform={`translate(${px + cw / 2},${py + ch / 2})`}>
              <rect
                x="-22"
                y="-7"
                width="44"
                height="14"
                rx="1"
                fill="#5c4630"
                stroke="#1c1812"
                strokeWidth="1"
              />
              <path
                d="M-16-3 H16 M-16 3 H16"
                stroke="#d4c7a5"
                strokeWidth="0.7"
                opacity="0.55"
              />
            </g>
          )}
          {isBoat && (
            <g transform={`translate(${px + cw / 2},${py + ch / 2 + (isPlayer && onBoat(state) ? 0 : 0)})`}>
              <path
                d="M-18 6 L-12 -6 L10 -6 L20 6 Z"
                fill={onBoat(state) ? "#8b2a3e" : "#1c1812"}
                stroke="#1c1812"
                strokeWidth="1"
              />
              <path d="M2 -6 V-16" stroke="#1c1812" strokeWidth="1.1" />
              <path d="M2 -16 L10 -8 H2 Z" fill="#d4c7a5" stroke="#1c1812" strokeWidth="0.8" />
            </g>
          )}
          {isPlayer && !onBoat(state) && (
            <g transform={`translate(${px + cw / 2},${py + ch / 2})`}>
              <circle r="10" fill="none" stroke="#8b2a3e" strokeWidth="2" />
              <path d="M-13 0 H13 M0 -13 V13" stroke="#8b2a3e" strokeWidth="1.4" />
            </g>
          )}
        </g>
      );
    }
  }

  return (
    <svg
      className={s.chart}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${level.harbour}, plate ${level.plate}`}
    >
      <defs>
        <pattern id="paper" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 0" stroke="#1c1812" strokeWidth="0.2" opacity="0.06" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="#d4c7a5" />
      <rect width={W} height={H} fill="url(#paper)" />
      <rect
        x="8"
        y="8"
        width={W - 16}
        height={H - 16}
        fill="none"
        stroke="#1c1812"
        strokeWidth="1.2"
      />
      <rect
        x="12"
        y="12"
        width={W - 24}
        height={H - 24}
        fill="none"
        stroke="#1c1812"
        strokeWidth="0.5"
      />
      {ticks(W, H)}
      <text
        x={22}
        y={28}
        fill="#1c1812"
        opacity="0.55"
        fontSize="10"
        fontFamily="var(--figures), ui-monospace, monospace"
      >
        SOUNDINGS IN MARKS · MODELLED
      </text>
      {cells}
      <g transform={`translate(${W - 56},${H - 58})`} opacity="0.7">
        <circle r="16" fill="none" stroke="#1c1812" strokeWidth="0.8" />
        <path d="M0-16 V16 M-16 0 H16" stroke="#1c1812" strokeWidth="0.6" />
        <path d="M0-16 L3-8 H-3 Z" fill="#1c1812" />
        <text
          y="-20"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--figures), ui-monospace, monospace"
          fill="#1c1812"
        >
          N
        </text>
      </g>
      {state.failed && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          fill="#8b2a3e"
          fontSize="28"
          fontFamily="var(--display), serif"
          fontStyle="italic"
        >
          Overboard
        </text>
      )}
    </svg>
  );
}

function hachure(x: number, y: number, w: number, h: number, seed: number) {
  let d = "";
  const step = 5 + (seed % 3);
  for (let i = -h; i < w + h; i += step) {
    d += `M${x + i} ${y} L${x + i + h} ${y + h} `;
  }
  return d;
}

function waterLines(x: number, y: number, w: number, h: number, mark: number) {
  let d = "";
  const step = 7 - mark;
  for (let i = 10; i < h - 6; i += step) {
    d += `M${x + 6} ${y + i} Q${x + w / 2} ${y + i + 1.2} ${x + w - 6} ${y + i} `;
  }
  return d;
}

function stipple(x: number, y: number, w: number, h: number) {
  let d = "";
  for (let i = 10; i < w - 6; i += 11) {
    for (let j = 10; j < h - 6; j += 11) {
      d += `M${x + i} ${y + j} l0.8 0 `;
    }
  }
  return d;
}

function landGrain(x: number, y: number, w: number, h: number) {
  return `M${x + 8} ${y + h - 10} h${w - 16}`;
}

function reefMarks(x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M${cx - 10} ${cy} l4 -8 l4 8 l4 -8 l4 8 M${cx - 12} ${cy + 8} h24`;
}

function ticks(W: number, H: number) {
  const marks = [];
  for (let i = 0; i < 9; i++) {
    const x = 20 + ((W - 40) * i) / 8;
    marks.push(
      <path
        key={`t${i}`}
        d={`M${x} 8 v5 M${x} ${H - 8} v-5`}
        stroke="#1c1812"
        strokeWidth="0.7"
      />
    );
  }
  return <g>{marks}</g>;
}
