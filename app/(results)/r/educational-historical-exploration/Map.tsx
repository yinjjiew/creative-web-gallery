"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import styles from "./broad.module.css";
import {
  BROAD,
  BUILDINGS,
  CELLS,
  HOUSES,
  JUNCTION,
  NAMED,
  PUMPS,
  SIZE,
  STREETS,
  YARDS_250,
  polyPath,
  project,
  ringPath,
  streetPath,
  type House,
} from "./soho";

export type Overlays = {
  hinterland: boolean;
  circle: boolean;
  elevation: boolean;
};

export type Pick =
  | { type: "pump"; id: string }
  | { type: "building"; id: string }
  | { type: "house"; id: string }
  | { type: "named"; id: string }
  | null;

type Props = {
  day: number;
  overlays: Overlays;
  pick: Pick;
  onPick: (next: Pick) => void;
  opened: Set<string>;
};

const BAR = 4.6;

export default function Map({ day, overlays, pick, onPick, opened }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const clip = useId();
  const [cam, setCam] = useState({ x: SIZE.x * 0.48, y: SIZE.y * 0.48, k: 1.15 });
  const camRef = useRef(cam);
  camRef.current = cam;

  useEffect(() => {
    if (window.innerWidth < 720) {
      setCam({ x: SIZE.x * 0.5, y: SIZE.y * 0.5, k: 1.7 });
    }
  }, []);
  const drag = useRef<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    armed: boolean;
  } | null>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = camRef.current;
      const point = (() => {
        const r = el.getBoundingClientRect();
        const sx = ((e.clientX - r.left) / r.width) * SIZE.x;
        const sy = ((e.clientY - r.top) / r.height) * SIZE.y;
        return {
          x: c.x + (sx - SIZE.x / 2) / c.k,
          y: c.y + (sy - SIZE.y / 2) / c.k,
        };
      })();
      const nextK = Math.min(3.2, Math.max(0.72, c.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      setCam({
        k: nextK,
        x: point.x - ((point.x - c.x) * c.k) / nextK,
        y: point.y - ((point.y - c.y) * c.k) / nextK,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as Element;
    if (!target.closest("[data-pan]")) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, armed: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const el = svg.current;
    if (!el) return;
    const pixel = Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y);
    if (!drag.current.armed) {
      if (pixel < 7) return;
      drag.current.armed = true;
    }
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.x) / r.width) * SIZE.x;
    const dy = ((e.clientY - drag.current.y) / r.height) * SIZE.y;
    setCam((c) => ({
      ...c,
      x: drag.current!.cx - dx / c.k,
      y: drag.current!.cy - dy / c.k,
    }));
  };

  const endDrag = () => {
    drag.current = null;
  };

  const zoom = (dir: number) => {
    setCam((c) => ({ ...c, k: Math.min(3.2, Math.max(0.72, c.k * (dir > 0 ? 1.2 : 0.83))) }));
  };

  const reset = () => {
    const mobile = typeof window !== "undefined" && window.innerWidth < 720;
    setCam({ x: SIZE.x * 0.48, y: SIZE.y * 0.48, k: mobile ? 1.7 : 1.15 });
  };

  const j = project(JUNCTION.lon, JUNCTION.lat);
  const b = project(BROAD.lon, BROAD.lat);

  return (
    <div className={styles.mapWrap}>
      <svg
        ref={svg}
        className={styles.map}
        viewBox={`0 0 ${SIZE.x.toFixed(1)} ${SIZE.y.toFixed(1)}`}
        role="img"
        aria-label="Reconstructed plan of Soho around Broad Street, with cholera deaths as bars and street pumps as circles."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <defs>
          <clipPath id={clip}>
            <rect x="0" y="0" width={SIZE.x} height={SIZE.y} />
          </clipPath>
          <radialGradient id="elev" cx={String(b.x)} cy={String(b.y)} r="280" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5a4030" stopOpacity="0.22" />
            <stop offset="1" stopColor="#5a4030" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect data-pan className={styles.ground} x="0" y="0" width={SIZE.x} height={SIZE.y} />
        <g
          clipPath={`url(#${clip})`}
          transform={`translate(${SIZE.x / 2} ${SIZE.y / 2}) scale(${cam.k}) translate(${-cam.x} ${-cam.y})`}
        >
          {overlays.elevation && (
            <rect
              x={-40}
              y={-40}
              width={SIZE.x + 80}
              height={SIZE.y + 80}
              fill="url(#elev)"
              style={{ pointerEvents: "none" }}
            />
          )}

          {overlays.hinterland &&
            CELLS.map((cell) => (
              <path
                key={cell.id}
                d={polyPath(cell.poly)}
                className={
                  cell.id === "broad" ? styles.cellBroad : styles.cell
                }
              />
            ))}

          {overlays.circle && (
            <circle
              cx={j.x}
              cy={j.y}
              r={YARDS_250}
              className={styles.circle250}
            />
          )}

          {BUILDINGS.map((building) => (
            <path
              key={building.id}
              d={ringPath(building.ring)}
              className={
                pick?.type === "building" && pick.id === building.id
                  ? styles.buildingOn
                  : styles.building
              }
              onClick={(e) => {
                e.stopPropagation();
                onPick({ type: "building", id: building.id });
              }}
              tabIndex={0}
              role="button"
              aria-label={building.name}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick({ type: "building", id: building.id });
                }
              }}
            />
          ))}

          {STREETS.map((street) => (
            <path data-pan key={street.name} d={streetPath(street)} className={styles.street} />
          ))}

          {HOUSES.map((house) => (
            <Bars
              key={house.id}
              house={house}
              day={day}
              active={pick?.type === "house" && pick.id === house.id}
              onPick={() => onPick({ type: "house", id: house.id })}
            />
          ))}

          {NAMED.map((item) => {
            const p = project(item.lon, item.lat);
            return (
              <circle
                key={item.id}
                cx={p.x}
                cy={p.y}
                r={5.2}
                className={
                  pick?.type === "named" && pick.id === item.id
                    ? styles.namedOn
                    : styles.named
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onPick({ type: "named", id: item.id });
                }}
                tabIndex={0}
                role="button"
                aria-label={item.label}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick({ type: "named", id: item.id });
                  }
                }}
              />
            );
          })}

          {PUMPS.map((pump) => {
            const p = project(pump.lon, pump.lat);
            const on = pick?.type === "pump" && pick.id === pump.id;
            return (
              <g
                key={pump.id}
                transform={`translate(${p.x} ${p.y})`}
                className={on ? styles.pumpOn : styles.pump}
                onClick={(e) => {
                  e.stopPropagation();
                  onPick({ type: "pump", id: pump.id });
                }}
                tabIndex={0}
                role="button"
                aria-label={`${pump.name} pump`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick({ type: "pump", id: pump.id });
                  }
                }}
              >
                <circle r={pump.id === "broad" ? 7.2 : 5.6} />
                <circle r={pump.id === "broad" ? 2.4 : 1.8} className={styles.pumpEye} />
              </g>
            );
          })}

          {BUILDINGS.filter((b) => b.kind === "workhouse" || b.kind === "brewery").map(
            (building) => {
              const xs = building.ring.map((p) => project(p.lon, p.lat).x);
              const ys = building.ring.map((p) => project(p.lon, p.lat).y);
              const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
              const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
              const seen = building.paper ? opened.has(building.paper) : false;
              return (
                <text
                  key={`${building.id}-label`}
                  x={cx}
                  y={cy}
                  className={seen ? styles.bLabelOpen : styles.bLabel}
                >
                  {building.name}
                </text>
              );
            },
          )}

          <text className={styles.sLabel} x={project(-0.1369, 51.5135).x} y={project(-0.1369, 51.5135).y}>
            Broad Street
          </text>
          <text
            className={styles.sLabel}
            x={project(-0.13635, 51.51415).x}
            y={project(-0.13635, 51.51415).y}
            transform={`rotate(-90 ${project(-0.13635, 51.51415).x} ${project(-0.13635, 51.51415).y})`}
          >
            Cambridge St
          </text>
          <text className={styles.sLabel} x={project(-0.1377, 51.5142).x} y={project(-0.1377, 51.5142).y} transform={`rotate(-90 ${project(-0.1377, 51.5142).x} ${project(-0.1377, 51.5142).y})`}>
            Poland St
          </text>
          <text className={styles.sLabel} x={project(-0.1368, 51.5155).x} y={project(-0.1368, 51.5155).y}>
            Oxford Street
          </text>
          <text className={styles.sLabel} x={project(-0.1374, 51.51175).x} y={project(-0.1374, 51.51175).y}>
            Golden Square
          </text>

          <g className={styles.scaleG} transform={`translate(28 ${SIZE.y - 36})`}>
            <line x1="0" y1="0" x2={YARDS_250 * 0.4} y2="0" />
            <line x1="0" y1="-4" x2="0" y2="4" />
            <line x1={YARDS_250 * 0.4} y1="-4" x2={YARDS_250 * 0.4} y2="4" />
            <text x={YARDS_250 * 0.2} y="16">
              100 yards
            </text>
          </g>
        </g>
      </svg>
      <div className={styles.mapTools}>
        <button type="button" className={styles.icon} onClick={() => zoom(1)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className={styles.icon} onClick={() => zoom(-1)} aria-label="Zoom out">
          −
        </button>
        <button type="button" className={styles.icon} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

function Bars({
  house,
  day,
  active,
  onPick,
}: {
  house: House;
  day: number;
  active: boolean;
  onPick: () => void;
}) {
  const shown = house.days.filter((d) => d <= day).length;
  if (shown === 0) return null;
  const ux = house.nx;
  const uy = house.ny;
  const len = Math.hypot(ux, uy) || 1;
  const nx = ux / len;
  const ny = uy / len;
  const px = -ny;
  const py = nx;
  const w = 2.1;
  const nodes: ReactNode[] = [];
  for (let i = 0; i < shown; i++) {
    const cx = house.x + nx * (BAR * (i + 0.55));
    const cy = house.y + ny * (BAR * (i + 0.55));
    const d = [
      `${cx - px * w - nx * 1.6},${cy - py * w - ny * 1.6}`,
      `${cx + px * w - nx * 1.6},${cy + py * w - ny * 1.6}`,
      `${cx + px * w + nx * 1.6},${cy + py * w + ny * 1.6}`,
      `${cx - px * w + nx * 1.6},${cy - py * w + ny * 1.6}`,
    ].join(" ");
    nodes.push(<polygon key={i} points={d} />);
  }
  return (
    <g
      className={active ? styles.barsOn : house.special ? styles.barsQuiet : styles.bars}
      onClick={(e) => {
        e.stopPropagation();
        onPick();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${house.deaths} death${house.deaths === 1 ? "" : "s"} on ${house.street}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
    >
      {nodes}
    </g>
  );
}
