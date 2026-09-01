"use client";

import s from "./orbit.module.css";
import type { Reading, Stage } from "./sim";

export type Snap = {
  you: Reading;
  them: Reading | null;
  phase: number;
  relSpeed: number;
  simTime: number;
  coasting: boolean;
  crashed: boolean;
  unbound: boolean;
  inAtmo: boolean;
  stage: Stage;
  youCurve: { alt: number; speed: number }[];
  themCurve: { alt: number; speed: number }[];
};

function fmtAlt(m: number): string {
  if (!Number.isFinite(m)) return "—";
  if (m < 0) return `${(m / 1000).toFixed(0)} km`;
  if (Math.abs(m) >= 1_000_000) return `${(m / 1_000_000).toFixed(2)} Mm`;
  return `${(m / 1000).toFixed(1)} km`;
}

function fmtSpeed(ms: number): string {
  return `${(ms / 1000).toFixed(3)} km/s`;
}

function fmtPeriod(sec: number): string {
  if (!Number.isFinite(sec)) return "unbound";
  return `${(sec / 60).toFixed(1)} min`;
}

function fmtEnergy(e: number): string {
  return `${(e / 1e6).toFixed(2)} MJ/kg`;
}

function fmtH(h: number): string {
  return `${(h / 1e10).toFixed(3)}×10¹⁰ m²/s`;
}

function fmtPhase(rad: number): string {
  const deg = (rad * 180) / Math.PI;
  const km = Math.abs(rad) * (6371 + 400);
  const side = deg > 0.05 ? "ahead" : deg < -0.05 ? "behind" : "abeam";
  return `${Math.abs(deg).toFixed(1)}° ${side} · ~${km.toFixed(0)} km of arc`;
}

const ALT_MAX = 1_400_000;
const V_MIN = 6_400;
const V_MAX = 8_400;

function vx(alt: number, w: number): number {
  return 8 + (Math.max(0, Math.min(ALT_MAX, alt)) / ALT_MAX) * (w - 16);
}

function vy(speed: number, h: number): number {
  const t = (speed - V_MIN) / (V_MAX - V_MIN);
  return h - 10 - Math.max(0, Math.min(1, t)) * (h - 20);
}

function circularPath(w: number, h: number): string {
  const MU = 3.986004418e14;
  const R = 6_371_000;
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const alt = (i / 40) * ALT_MAX;
    const v = Math.sqrt(MU / (R + alt));
    pts.push(`${i === 0 ? "M" : "L"}${vx(alt, w).toFixed(1)},${vy(v, h).toFixed(1)}`);
  }
  return pts.join(" ");
}

function curvePath(
  pts: { alt: number; speed: number }[],
  w: number,
  h: number,
): string {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${vx(p.alt, w).toFixed(1)},${vy(p.speed, h).toFixed(1)}`)
    .join(" ");
}

export default function Instruments({ snap }: { snap: Snap }) {
  const w = 280;
  const h = 118;
  const you = snap.you;
  const them = snap.them;

  const ribbonW = 280;
  const mid = ribbonW / 2;
  const youX = mid - (snap.phase / Math.PI) * (ribbonW / 2 - 12);

  return (
    <div>
      <dl className={s.triad} aria-live="polite">
        <div className={s.cell}>
          <dt>Altitude</dt>
          <dd className={s.mono}>{fmtAlt(you.alt)}</dd>
          <small>
            peri {fmtAlt(you.altPeri)}
            <br />
            apo {fmtAlt(you.altApo)}
          </small>
        </div>
        <div className={s.cell}>
          <dt>Speed</dt>
          <dd className={s.mono}>{fmtSpeed(you.speed)}</dd>
          <small>circular here {fmtSpeed(you.speedCircular)}</small>
        </div>
        <div className={s.cell}>
          <dt>Period</dt>
          <dd className={s.mono}>{fmtPeriod(you.period)}</dd>
          <small>circular here {fmtPeriod(you.periodCircular)}</small>
        </div>
      </dl>

      <div className={s.plots}>
        <figure className={s.plot}>
          <figcaption>Vis-viva — speed against altitude</figcaption>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label="Speed versus altitude. The faint curve is every circular orbit. Your path leaves it when the orbit is an ellipse."
          >
            <rect width={w} height={h} fill="#191712" />
            <path d={circularPath(w, h)} fill="none" stroke="#6e685c" strokeWidth="1" />
            {snap.youCurve.length > 1 && (
              <path
                d={curvePath(snap.youCurve, w, h)}
                fill="none"
                stroke="#d4784a"
                strokeWidth="1.3"
              />
            )}
            {snap.themCurve.length > 1 && (
              <path
                d={curvePath(snap.themCurve, w, h)}
                fill="none"
                stroke="#7aa3c7"
                strokeWidth="1"
                opacity="0.7"
              />
            )}
            <circle cx={vx(you.alt, w)} cy={vy(you.speed, h)} r="3.2" fill="#d4784a" />
            {them && (
              <circle
                cx={vx(them.alt, w)}
                cy={vy(them.speed, h)}
                r="2.6"
                fill="#7aa3c7"
              />
            )}
            <text x="10" y="12" fill="#6e685c" fontSize="8" fontFamily="ui-monospace, monospace">
              8.4 km/s
            </text>
            <text x="10" y={h - 4} fill="#6e685c" fontSize="8" fontFamily="ui-monospace, monospace">
              6.4
            </text>
            <text
              x={w - 6}
              y={h - 4}
              fill="#6e685c"
              fontSize="8"
              fontFamily="ui-monospace, monospace"
              textAnchor="end"
            >
              1 400 km
            </text>
          </svg>
        </figure>

        {them && (
          <figure className={s.plot}>
            <figcaption>Earth-centred angle — target fixed at the mark</figcaption>
            <svg
              viewBox={`0 0 ${ribbonW} 36`}
              role="img"
              aria-label={fmtPhase(snap.phase)}
            >
              <rect width={ribbonW} height="36" fill="#191712" />
              <line x1="12" y1="18" x2={ribbonW - 12} y2="18" stroke="#3d3931" strokeWidth="1" />
              <line x1={mid} y1="8" x2={mid} y2="28" stroke="#7aa3c7" strokeWidth="1.5" />
              <circle
                cx={Math.max(10, Math.min(ribbonW - 10, youX))}
                cy="18"
                r="4"
                fill="#d4784a"
              />
              <text x="12" y="33" fill="#6e685c" fontSize="8" fontFamily="ui-monospace, monospace">
                behind
              </text>
              <text
                x={ribbonW - 12}
                y="33"
                fill="#6e685c"
                fontSize="8"
                fontFamily="ui-monospace, monospace"
                textAnchor="end"
              >
                ahead
              </text>
            </svg>
            <p className={s.keys}>{fmtPhase(snap.phase)}</p>
          </figure>
        )}
      </div>

      <p className={s.conserved}>
        <span data-hold={snap.coasting && you.bound ? "yes" : "no"}>
          ε {fmtEnergy(you.energy)}
        </span>
        <span data-hold={snap.coasting && you.bound ? "yes" : "no"}>
          h {fmtH(you.h)}
        </span>
      </p>
      <p className={s.keys}>
        Specific energy and angular momentum hold while you coast. They move when
        a burn does work.
      </p>

      {snap.crashed && (
        <p className={s.flags} role="status">
          Radius is at the surface. The desk stops there.
        </p>
      )}
      {snap.unbound && !snap.crashed && (
        <p className={s.flags} role="status">
          Energy is non-negative. This path does not close.
        </p>
      )}
      {snap.inAtmo && !snap.crashed && (
        <p className={s.flags} role="status">
          Below 80 km the real atmosphere would already be doing work. The desk
          is still vacuum — labelled, not modelled.
        </p>
      )}
      {them && snap.stage !== "period" && (
        <p className={s.keys}>
          Closing speed {fmtSpeed(snap.relSpeed)}
          {them.period !== you.period && Number.isFinite(you.period) && Number.isFinite(them.period)
            ? ` · your lap is ${you.period < them.period ? "shorter" : "longer"}`
            : ""}
        </p>
      )}
    </div>
  );
}
