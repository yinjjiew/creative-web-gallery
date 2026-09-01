"use client";

import { monthStarts, shortDate, whole, type Day, type Pence } from "./money";
import {
  cashOn,
  floorOn,
  PATHS,
  type PathKey,
  type Projection,
} from "./project";
import { TODAY } from "./scenario";
import s from "./runway.module.css";

const VB_W = 760;
const VB_H = 292;
const PAD = { t: 14, r: 12, b: 28, l: 58 };

function ticks(min: Pence, max: Pence): Pence[] {
  const span = Math.max(max - min, 100_000);
  const rough = span / 4;
  const nice = [50_000, 100_000, 200_000, 250_000, 500_000, 1_000_000].reduce((best, n) =>
    Math.abs(n - rough) < Math.abs(best - rough) ? n : best
  );
  const start = Math.ceil(min / nice) * nice;
  const out: Pence[] = [];
  for (let v = start; v <= max; v += nice) out.push(v);
  if (!out.includes(0) && min < 0 && max > 0) out.push(0);
  return out.sort((a, b) => a - b);
}

export default function Chart({
  projection,
  from,
  to,
  markDay,
  markLabel,
}: {
  projection: Projection;
  from: Day;
  to: Day;
  markDay: Day;
  markLabel: string;
}) {
  const innerW = VB_W - PAD.l - PAD.r;
  const innerH = VB_H - PAD.t - PAD.b;
  const span = Math.max(1, to - from);

  let lo: Pence = 0;
  let hi: Pence = 1;
  for (const path of PATHS) {
    for (let d = from; d <= to; d += 1) {
      const cash = cashOn(projection.paths[path], d);
      const floor = floorOn(projection.paths[path], d);
      lo = Math.min(lo, cash);
      hi = Math.max(hi, cash, floor);
    }
  }
  const padY = Math.max(80_000, Math.round((hi - lo) * 0.08));
  const minY = lo - padY;
  const maxY = hi + padY;

  const xOf = (d: Day) => PAD.l + ((d - from) / span) * innerW;
  const yOf = (v: Pence) => PAD.t + innerH - ((v - minY) / (maxY - minY)) * innerH;

  const series = (path: PathKey, pick: (d: Day) => Pence) => {
    const pts: string[] = [];
    for (let d = from; d <= to; d += 1) {
      pts.push(`${xOf(d).toFixed(1)},${yOf(pick(d)).toFixed(1)}`);
    }
    return pts;
  };

  const fastCash = series("fast", (d) => cashOn(projection.paths.fast, d));
  const slowCash = series("slow", (d) => cashOn(projection.paths.slow, d));
  const expectedCash = series("expected", (d) => cashOn(projection.paths.expected, d));
  const expectedFloor = series("expected", (d) => floorOn(projection.paths.expected, d));

  const band = `${fastCash.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ")} ${slowCash
    .slice()
    .reverse()
    .map((p) => `L${p}`)
    .join(" ")} Z`;

  const floorArea = `${expectedFloor
    .map((p, i) => (i === 0 ? `M${p}` : `L${p}`))
    .join(" ")} L${xOf(to).toFixed(1)},${yOf(0).toFixed(1)} L${xOf(from).toFixed(1)},${yOf(0).toFixed(1)} Z`;

  const months = monthStarts(from, to);
  const yTicks = ticks(minY, maxY);

  const taxDays = [
    ...new Set(
      projection.paths.expected.taxPayments
        .filter((p) => p.due > from && p.due <= to && p.amount > 0)
        .map((p) => p.due)
    ),
  ];

  const receiptDays = [
    ...new Set(
      projection.receipts.map((r) => r.dayByPath.expected).filter((d) => d >= from && d <= to)
    ),
  ];

  const label = [
    `Cash from ${shortDate(from)} to ${shortDate(to)}.`,
    `Band is best-case to worst-case arrival.`,
    `Hatched area is tax recognised and not yet paid, on the usual path.`,
    `${markLabel} marked.`,
  ].join(" ");

  return (
    <div className={s.chartFrame}>
      <svg
        className={s.chartSvg}
        viewBox={`0 0 ${String(VB_W)} ${String(VB_H)}`}
        role="img"
        aria-label={label}
      >
        <defs>
          <pattern
            id="run-tax-hatch"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="5" stroke="#7a5c20" strokeWidth="1" opacity="0.55" />
          </pattern>
        </defs>

        {yTicks.map((v) => (
          <g key={`y-${String(v)}`}>
            <line
              x1={PAD.l}
              x2={VB_W - PAD.r}
              y1={yOf(v)}
              y2={yOf(v)}
              stroke={v === 0 ? "#1a2218" : "#8a9a84"}
              strokeWidth={v === 0 ? 1 : 0.5}
              opacity={v === 0 ? 0.7 : 0.55}
            />
            <text
              x={PAD.l - 8}
              y={yOf(v) + 3.5}
              textAnchor="end"
              fill="#5a6856"
              fontSize="9"
              fontFamily="var(--run-mono), ui-monospace, monospace"
            >
              {whole(v)}
            </text>
          </g>
        ))}

        {months.map((d) => (
          <g key={`m-${String(d)}`}>
            <line
              x1={xOf(d)}
              x2={xOf(d)}
              y1={PAD.t}
              y2={PAD.t + innerH}
              stroke="#8a9a84"
              strokeWidth="0.5"
              opacity="0.5"
            />
            <text
              x={xOf(d) + 3}
              y={VB_H - 8}
              fill="#5a6856"
              fontSize="9"
              fontFamily="var(--run-mono), ui-monospace, monospace"
            >
              {shortDate(d)}
            </text>
          </g>
        ))}

        <path d={floorArea} fill="url(#run-tax-hatch)" opacity="0.85" />
        <path
          d={expectedFloor.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ")}
          fill="none"
          stroke="#7a5c20"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        <path d={band} fill="rgba(26, 34, 24, 0.14)" />
        <path
          d={fastCash.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ")}
          fill="none"
          stroke="#1a2218"
          strokeWidth="0.75"
          opacity="0.45"
        />
        <path
          d={slowCash.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ")}
          fill="none"
          stroke="#1a2218"
          strokeWidth="0.75"
          opacity="0.45"
        />
        <path
          d={expectedCash.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ")}
          fill="none"
          stroke="#1a2218"
          strokeWidth="1.6"
        />

        {receiptDays.map((d) => (
          <line
            key={`r-${String(d)}`}
            x1={xOf(d)}
            x2={xOf(d)}
            y1={PAD.t + innerH - 6}
            y2={PAD.t + innerH}
            stroke="#1f4a38"
            strokeWidth="1.5"
          />
        ))}

        {taxDays.map((d) => (
          <line
            key={`t-${String(d)}`}
            x1={xOf(d)}
            x2={xOf(d)}
            y1={PAD.t}
            y2={PAD.t + innerH}
            stroke="#7a5c20"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.7"
          />
        ))}

        {markDay >= from && markDay <= to ? (
          <g>
            <line
              x1={xOf(markDay)}
              x2={xOf(markDay)}
              y1={PAD.t}
              y2={PAD.t + innerH}
              stroke="#8c2f28"
              strokeWidth="1.25"
              strokeDasharray="4 3"
            />
            <text
              x={Math.min(xOf(markDay) + 5, VB_W - PAD.r - 4)}
              y={PAD.t + 11}
              fill="#8c2f28"
              fontSize="9"
              fontFamily="var(--run-serif), Palatino, serif"
            >
              {markLabel}
            </text>
          </g>
        ) : null}

        <line
          x1={xOf(TODAY)}
          x2={xOf(TODAY)}
          y1={PAD.t}
          y2={PAD.t + innerH}
          stroke="#1a2218"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
