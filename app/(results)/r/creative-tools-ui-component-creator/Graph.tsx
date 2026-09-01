/**
 * Stations are named poses. Slurs are the journeys. The slur is thicker than
 * the station on purpose — you click the journey, not the skin.
 */

import { useId, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import s from "./desk.module.css";
import { type Doc, type Pose } from "./model";

type Pt = { x: number; y: number };

const VB = { w: 360, h: 168 };

function stations(doc: Doc): Map<string, Pt> {
  const map = new Map<string, Pt>();
  const preset = new Set(
    doc.specimen === "switch" ? ["off", "on", "pending"] : ["rest", "hover", "armed", "pending", "done"]
  );
  if (doc.specimen === "switch") {
    map.set("off", { x: 52, y: 118 });
    map.set("on", { x: 308, y: 118 });
    map.set("pending", { x: 180, y: 40 });
  } else {
    const row = ["rest", "hover", "armed", "pending", "done"];
    row.forEach((id, i) => {
      map.set(id, { x: 28 + i * 76, y: 72 });
    });
  }
  const extras = doc.states.filter((p) => !preset.has(p.id));
  extras.forEach((p, i) => {
    const n = Math.max(1, extras.length);
    map.set(p.id, { x: 36 + (i * 288) / n, y: 154 });
  });
  for (const p of doc.states) {
    if (!map.has(p.id)) {
      map.set(p.id, { x: 180, y: 90 });
    }
  }
  return map;
}

function slur(a: Pt, b: Pt, bias: number): { d: string; mid: Pt } {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const lift = bias + Math.min(36, len * 0.18);
  const c = { x: mx + nx * lift, y: my + ny * lift };
  return {
    d: `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    mid: { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 },
  };
}

function biases(doc: Doc): Map<string, number> {
  const map = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const e of doc.edges) {
    const key = [e.from, e.to].sort().join("|");
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    map.set(e.id, n === 0 ? 1 : -1);
  }
  return map;
}

export function Graph({
  doc,
  selectedEdge,
  selectedState,
  liveState,
  firedEdge,
  wireFrom,
  onSelectEdge,
  onSelectState,
  onWire,
}: {
  doc: Doc;
  selectedEdge: string | null;
  selectedState: string | null;
  liveState: string;
  firedEdge: string | null;
  wireFrom: string | null;
  onSelectEdge: (id: string) => void;
  onSelectState: (id: string) => void;
  onWire: (id: string) => void;
}) {
  const uid = useId();
  const pts = stations(doc);
  const bias = biases(doc);

  function onKey(ev: KeyboardEvent<SVGSVGElement>) {
    if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
    ev.preventDefault();
    const i = doc.edges.findIndex((e) => e.id === selectedEdge);
    const next = ev.key === "ArrowRight" ? i + 1 : i - 1;
    const edge = doc.edges[(next + doc.edges.length) % doc.edges.length];
    if (edge) onSelectEdge(edge.id);
  }

  function hitState(ev: ReactPointerEvent<SVGGElement>, pose: Pose) {
    ev.stopPropagation();
    if (wireFrom) onWire(pose.id);
    else onSelectState(pose.id);
  }

  return (
    <svg
      className={s.graph}
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      role="img"
      aria-label="Stations and the journeys between them. Arrow keys move the selected journey."
      tabIndex={0}
      onKeyDown={onKey}
    >
      <title>State graph</title>
      {doc.edges.map((edge) => {
        const a = pts.get(edge.from);
        const b = pts.get(edge.to);
        if (!a || !b) return null;
        const path = slur(a, b, (bias.get(edge.id) ?? 1) * 22);
        const active = edge.id === selectedEdge;
        const fired = edge.id === firedEdge;
        return (
          <g key={edge.id}>
            <path d={path.d} className={s.slurHit} onPointerDown={() => onSelectEdge(edge.id)} />
            <path
              d={path.d}
              className={`${s.slur} ${active ? s.slurOn : ""} ${fired ? s.slurFire : ""}`}
              markerEnd={`url(#${uid}-ah)`}
            />
            <text
              x={path.mid.x}
              y={path.mid.y - 6}
              textAnchor="middle"
              className={`${s.slurMs} ${active ? s.slurMsOn : ""}`}
            >
              {edge.duration}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id={`${uid}-ah`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 8 4 L 0 7 Z" className={s.arrow} />
        </marker>
      </defs>
      {doc.states.map((pose) => {
        const p = pts.get(pose.id);
        if (!p) return null;
        const live = pose.id === liveState;
        const sel = pose.id === selectedState;
        const wiring = wireFrom === pose.id;
        return (
          <g
            key={pose.id}
            className={`${s.station} ${live ? s.stationLive : ""} ${sel ? s.stationOn : ""} ${wiring ? s.stationWire : ""}`}
            transform={`translate(${p.x} ${p.y})`}
            onPointerDown={(ev) => hitState(ev, pose)}
          >
            <circle r="11" className={s.stationDot} style={{ fill: pose.well }} />
            <circle r="11" className={s.stationRing} />
            <text y="28" textAnchor="middle" className={s.stationName}>
              {pose.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

