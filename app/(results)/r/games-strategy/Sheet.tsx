import {
  COLS,
  HYDRO,
  LAST,
  ROWS,
  barrier,
  channelBeside,
  forecast,
  inundated,
  isWet,
  surface,
  type Cell,
  type Game,
} from "./engine";
import s from "./levee.module.css";

const CW = 40;
const CH = 40;
const PAD = { l: 50, t: 34, r: 24, b: 30 };

type Props = {
  game: Game;
  cursor: { x: number; y: number } | null;
  reduce: boolean;
  onPick: (c: Cell) => void;
};

function hachure(x: number, y: number, w: number, h: number, seed: number) {
  const parts: string[] = [];
  for (let i = -h; i < w + h; i += 4.4) {
    const o = ((seed * 13) % 5) * 0.3;
    parts.push(`M${x + i + o} ${y} l${h * 0.16} ${h}`);
  }
  return parts.join(" ");
}

function stipple(x: number, y: number, w: number, h: number, seed: number) {
  const parts: string[] = [];
  let n = seed * 17 + 3;
  for (let i = 0; i < 11; i++) {
    n = (n * 1103515245 + 12345) >>> 0;
    const px = x + 4 + (n % (w - 8));
    const py = y + 4 + ((n >>> 8) % (h - 8));
    parts.push(`M${px} ${py} h0.85 v0.85 h-0.85 z`);
  }
  return parts.join(" ");
}

function waterLines(x: number, y: number, w: number, h: number, depth: number) {
  const parts: string[] = [];
  const step = depth > 0.8 ? 3.8 : 5;
  for (let i = 5; i < h - 2; i += step) {
    const wob = Math.sin((y + i) * 0.18) * 1.6;
    parts.push(`M${x + 2.5} ${y + i + wob} q${w / 4} 1.4 ${w / 2} 0 t${w / 2 - 5} 0`);
  }
  return parts.join(" ");
}

function fillFor(c: Cell): string {
  if (c.use === "sea") return "#35505e";
  if (c.use === "channel") {
    const d = Math.min(1, c.water / 3.2);
    return d > 0.55 ? "#17303c" : d > 0.25 ? "#243c4a" : "#3d5866";
  }
  if (c.lost) return "#8a7d68";
  if (c.water > 0.28) return "#54707c";
  if (c.water > 0.1) return "#84949a";
  if (c.use === "marsh") return "#9aa08c";
  if (c.use === "town" || c.use === "port") return "#c6b6a6";
  if (c.use === "hamlet") return "#c4b8a0";
  if (c.use === "upland") return "#b9b5a9";
  return "#b8b19b";
}

function spot(c: Cell): boolean {
  if (c.use === "channel") return (c.x + c.y) % 2 === 0;
  if (c.use === "sea" || c.use === "upland") return false;
  if (c.name) return true;
  return c.use === "field" && (c.x + c.y) % 3 === 0;
}

function edge(a: Cell, b: Cell): { x1: number; y1: number; x2: number; y2: number } {
  const ax = PAD.l + a.x * CW;
  const ay = PAD.t + a.y * CH;
  if (b.x === a.x + 1) return { x1: ax + CW, y1: ay + 2, x2: ax + CW, y2: ay + CH - 2 };
  if (b.x === a.x - 1) return { x1: ax, y1: ay + 2, x2: ax, y2: ay + CH - 2 };
  if (b.y === a.y + 1) return { x1: ax + 2, y1: ay + CH, x2: ax + CW - 2, y2: ay + CH };
  return { x1: ax + 2, y1: ay, x2: ax + CW - 2, y2: ay };
}

export default function Sheet({ game, cursor, reduce, onPick }: Props) {
  const W = COLS * CW + PAD.l + PAD.r;
  const H = ROWS * CH + PAD.t + PAD.b;
  const next = HYDRO[Math.min(game.day + 1, LAST)] ?? game.stage;

  const cells = [];
  const banks = [];
  const marks = [];
  const labels = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = game.cells[y]?.[x];
      if (!c) continue;
      const px = PAD.l + x * CW;
      const py = PAD.t + y * CH;
      const selected = cursor?.x === x && cursor?.y === y;
      const ch = channelBeside(game, c);
      const fate = forecast(game, c);
      const old = c.use === "field" && c.x <= 2;

      cells.push(
        <g key={`c-${x}-${y}`}>
          <rect
            x={px}
            y={py}
            width={CW}
            height={CH}
            fill={fillFor(c)}
            onPointerDown={(e) => {
              e.preventDefault();
              onPick(c);
            }}
          />
          {c.use === "upland" && (
            <path
              d={hachure(px, py, CW, CH, x * 7 + y)}
              fill="none"
              stroke="#1a1814"
              strokeWidth="0.55"
              opacity="0.26"
              pointerEvents="none"
            />
          )}
          {c.use === "field" && !isWet(c) && (
            <path
              d={stipple(px, py, CW, CH, x * 11 + y * 3)}
              fill="#1a1814"
              opacity="0.2"
              pointerEvents="none"
            />
          )}
          {isWet(c) && c.use !== "upland" && (
            <path
              d={waterLines(px, py, CW, CH, c.water)}
              fill="none"
              stroke={c.use === "channel" || c.use === "sea" ? "#d7d0c2" : "#1a1814"}
              strokeWidth="0.55"
              opacity={
                reduce
                  ? 0.18
                  : c.use === "channel"
                    ? 0.28
                    : 0.18 + Math.min(0.16, c.water * 0.05)
              }
              pointerEvents="none"
            />
          )}
          {spot(c) && (
            <text
              x={px + 3.5}
              y={py + 9}
              fill={c.use === "channel" ? "#d7d0c2" : "#1a1814"}
              opacity={c.use === "channel" ? 0.55 : 0.4}
              fontSize="7"
              fontFamily="var(--label), sans-serif"
              pointerEvents="none"
            >
              {c.use === "channel" ? surface(c).toFixed(1) : c.elev.toFixed(1)}
            </text>
          )}
          {(c.use === "town" || c.use === "port") && (
            <rect
              x={px + CW / 2 - (c.use === "port" ? 5 : 3.5)}
              y={py + CH / 2 - (c.use === "port" ? 5 : 3.5)}
              width={c.use === "port" ? 10 : 7}
              height={c.use === "port" ? 10 : 7}
              fill={inundated(c) ? "#9a2e1e" : "#6b2e26"}
              pointerEvents="none"
            />
          )}
          {c.use === "hamlet" && (
            <circle
              cx={px + CW / 2}
              cy={py + CH / 2}
              r="3.5"
              fill={inundated(c) ? "#9a2e1e" : "#6b2e26"}
              pointerEvents="none"
            />
          )}
          {selected && (
            <rect
              x={px + 1.4}
              y={py + 1.4}
              width={CW - 2.8}
              height={CH - 2.8}
              fill="none"
              stroke="#9a2e1e"
              strokeWidth="1.6"
              pointerEvents="none"
            />
          )}
        </g>
      );

      if (ch && (c.crest > 0 || c.cut)) {
        const e = edge(c, ch);
        const thick = 2.1 + Math.min(2.6, c.crest * 0.75);
        const warn = fate === "overtop" || fate === "cut";
        banks.push(
          <line
            key={`b-${x}-${y}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={warn ? "#9a2e1e" : c.braced ? "#3c4a32" : "#1a1814"}
            strokeWidth={thick}
            strokeDasharray={c.cut ? "2.2 2" : old || c.strength < 0.56 ? "5 2.4" : undefined}
            strokeLinecap="butt"
            pointerEvents="none"
          />
        );
        marks.push(
          <text
            key={`m-${x}-${y}`}
            x={(e.x1 + e.x2) / 2 + (ch.x > c.x ? -8 : ch.x < c.x ? 8 : 0)}
            y={(e.y1 + e.y2) / 2 + (ch.y > c.y ? -5 : 9)}
            textAnchor="middle"
            fill={warn ? "#9a2e1e" : "#1a1814"}
            fontSize="7.2"
            fontFamily="var(--label), sans-serif"
            opacity={c.use === "marsh" && !selected && !warn ? 0.45 : 0.85}
            pointerEvents="none"
          >
            {c.cut ? "CUT" : barrier(c).toFixed(1)}
          </text>
        );
      }

      if (c.name) {
        const port = c.use === "port";
        labels.push(
          <text
            key={`n-${x}-${y}`}
            x={port ? px + CW * 2 + 6 : px + CW / 2}
            y={port ? py + CH / 2 + 4 : py - 5}
            textAnchor={port ? "start" : "middle"}
            fill="#1a1814"
            fontSize="11"
            fontFamily="var(--display), serif"
            fontStyle="italic"
            pointerEvents="none"
          >
            {c.name}
          </text>
        );
      }
    }
  }

  const gMax = 3.6;
  const gH = ROWS * CH - 24;
  const gX = 17;
  const gY = PAD.t + 12;
  const yAt = (v: number) => gY + gH - (v / gMax) * gH;

  return (
    <svg
      className={s.chart}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Parish survey of the delta. Water in the channel. Banks drawn as crests."
      tabIndex={0}
    >
      <rect x="0" y="0" width={W} height={H} fill="#c6c2b6" />
      <path
        d={`M${PAD.l} ${PAD.t} H${PAD.l + COLS * CW} V${PAD.t + ROWS * CH} H${PAD.l} Z`}
        fill="none"
        stroke="#1a1814"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {cells}
      {banks}
      {marks}
      {labels}

      <g aria-hidden="true" transform={`translate(${PAD.l + COLS * CW - 18}, ${PAD.t + 16})`}>
        <line x1="0" y1="10" x2="0" y2="-10" stroke="#1a1814" strokeWidth="1" />
        <path d="M0 -12 l-3.2 6 h6.4 z" fill="#1a1814" />
        <text
          y="20"
          textAnchor="middle"
          fill="#1a1814"
          fontSize="8"
          fontFamily="var(--label), sans-serif"
        >
          N
        </text>
      </g>

      <text
        x={PAD.l + 4}
        y={PAD.t + ROWS * CH + 18}
        fill="#1a1814"
        opacity="0.45"
        fontSize="8"
        fontFamily="var(--label), sans-serif"
      >
        Crests on the banks · soundings in the channel · modelled feet
      </text>

      <g aria-hidden="true">
        <line x1={gX} y1={gY} x2={gX} y2={gY + gH} stroke="#1a1814" strokeWidth="1.2" />
        {[0, 1, 2, 3].map((t) => (
          <g key={t}>
            <line
              x1={gX - 4}
              y1={yAt(t)}
              x2={gX + 5}
              y2={yAt(t)}
              stroke="#1a1814"
              strokeWidth="1"
            />
            <text
              x={gX - 6}
              y={yAt(t) + 3}
              textAnchor="end"
              fill="#1a1814"
              opacity="0.55"
              fontSize="8"
              fontFamily="var(--label), sans-serif"
            >
              {t}
            </text>
          </g>
        ))}
        <rect
          x={gX + 1}
          y={yAt(game.stage)}
          width="6"
          height={Math.max(0, yAt(0) - yAt(game.stage))}
          fill="#2c4250"
          opacity="0.88"
        />
        <line
          x1={gX - 2}
          y1={yAt(next)}
          x2={gX + 11}
          y2={yAt(next)}
          stroke="#9a2e1e"
          strokeWidth="1.15"
        />
        <text
          x={gX + 1}
          y={gY - 8}
          fill="#1a1814"
          opacity="0.5"
          fontSize="8"
          fontFamily="var(--label), sans-serif"
        >
          STG
        </text>
      </g>
    </svg>
  );
}
