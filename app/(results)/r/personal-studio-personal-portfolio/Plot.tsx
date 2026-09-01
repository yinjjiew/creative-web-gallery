"use client";

import { useId } from "react";

import {
  RECORDINGS,
  seasonOf,
  type Filter,
  type Recording,
  type Season,
} from "./data";
import s from "./ambit.module.css";

const W = 1000;
const H = 520;
const PAD = { l: 46, r: 18, t: 20, b: 32 };

const SEASON_BANDS: { id: Season; y0: number; y1: number }[] = [
  { id: "winter", y0: 1, y1: 59 },
  { id: "spring", y0: 60, y1: 151 },
  { id: "summer", y0: 152, y1: 243 },
  { id: "autumn", y0: 244, y1: 334 },
  { id: "winter", y0: 335, y1: 366 },
];

export function point(r: Recording) {
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = PAD.l + (r.hourFrac / 24) * iw + ((r.year - 2015) / 11 - 0.5) * 9;
  const y = PAD.t + ((r.yearday - 1) / 365) * ih;
  const rad = 2.1 + (r.durationMin / 48) * 3.2;
  return { x, y, rad };
}

function nearest(px: number, py: number, recs: Recording[]) {
  let best: Recording | null = null;
  let bestD = 22;
  for (const r of recs) {
    const p = point(r);
    const d = Math.hypot(p.x - px, p.y - py);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

export default function Plot({
  visible,
  selected,
  playing,
  filter,
  onSelect,
  onPlay,
  onHour,
  onSeason,
}: {
  visible: Recording[];
  selected: string | null;
  playing: string | null;
  filter: Filter;
  onSelect: (r: Recording) => void;
  onPlay: (r: Recording) => void;
  onHour: (h: number) => void;
  onSeason: (s: Season) => void;
}) {
  const uid = useId();
  const vis = new Set(visible.map((r) => r.id));

  function svgPoint(event: React.PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    return loc;
  }

  function onPointer(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    const loc = svgPoint(event);
    if (!loc) return;
    const hit = nearest(loc.x, loc.y, visible.length ? visible : RECORDINGS);
    if (!hit) return;
    onSelect(hit);
    onPlay(hit);
  }

  return (
    <svg
      className={s.plot}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Four hundred recordings plotted by hour of day and day of the year. Mark size is how long she left the microphone open. Click a mark to listen. Click a season band or an hour to follow that thread."
      onPointerDown={onPointer}
    >
      <title>The archive, plotted by hour and season</title>
      {SEASON_BANDS.map((b, i) => {
        const y = PAD.t + ((b.y0 - 1) / 365) * (H - PAD.t - PAD.b);
        const h = ((b.y1 - b.y0 + 1) / 365) * (H - PAD.t - PAD.b);
        const active = filter.season === b.id;
        return (
          <rect
            key={`${b.id}-${i}`}
            x={PAD.l}
            y={y}
            width={W - PAD.l - PAD.r}
            height={h}
            className={active ? s.bandOn : s.band}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSeason(b.id);
            }}
          />
        );
      })}

      {["Jan", "Apr", "Jul", "Oct"].map((label, i) => {
        const day = [1, 91, 182, 274][i];
        const y = PAD.t + ((day - 1) / 365) * (H - PAD.t - PAD.b);
        return (
          <text key={label} x={8} y={y + 10} className={s.tick}>
            {label}
          </text>
        );
      })}

      {[0, 6, 12, 18, 24].map((h) => {
        const x = PAD.l + (h / 24) * (W - PAD.l - PAD.r);
        return (
          <g key={h}>
            <line x1={x} y1={PAD.t} x2={x} y2={H - PAD.b} className={s.grid} />
            <text
              x={x}
              y={H - 10}
              textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}
              className={s.tick}
            >
              {String(h === 24 ? 0 : h).padStart(2, "0")}h
            </text>
          </g>
        );
      })}

      {Array.from({ length: 24 }, (_, h) => {
        const x = PAD.l + (h / 24) * (W - PAD.l - PAD.r);
        const w = (W - PAD.l - PAD.r) / 24;
        return (
          <rect
            key={`h-${h}`}
            x={x}
            y={H - PAD.b}
            width={w}
            height={PAD.b}
            className={filter.hour === h ? s.hourOn : s.hourHit}
            onPointerDown={(e) => {
              e.stopPropagation();
              onHour(h);
            }}
          />
        );
      })}

      {RECORDINGS.map((r) => {
        const p = point(r);
        const on = vis.has(r.id);
        const isPlay = r.id === playing;
        const isSel = r.id === selected;
        return (
          <circle
            key={r.id}
            cx={p.x}
            cy={p.y}
            r={isPlay ? p.rad + 1.4 : p.rad}
            className={
              isPlay ? s.markPlay : isSel ? s.markSel : on ? s.mark : s.markDim
            }
          />
        );
      })}

      <text x={PAD.l} y={14} className={s.tick}>
        hour of the day →
      </text>
      <text
        x={12}
        y={PAD.t + 4}
        className={s.tick}
        transform={`rotate(-90 12 ${PAD.t + 80})`}
      >
        day of the year
      </text>
      <desc id={uid}>
        Each mark is a recording. Horizontal position is the hour she went.
        Vertical position is the day of the year. Size is the length of the take.
      </desc>
    </svg>
  );
}
