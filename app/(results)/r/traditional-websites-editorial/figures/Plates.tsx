import type { JSX } from "react";

type PlateId = "boards" | "oil" | "tram" | "busbar" | "handle" | "yard";

function Boards() {
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label="Switchboard from the gangway">
      <rect width="800" height="420" fill="#d8c9a4" />
      <rect x="40" y="36" width="720" height="348" fill="#c4b089" stroke="#1c1710" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(${70 + i * 115}, 70)`}>
          <rect
            width="96"
            height="260"
            fill="#b7a57a"
            stroke="#1c1710"
            strokeWidth="1.2"
          />
          <circle cx="48" cy="48" r="22" fill="none" stroke="#1c1710" strokeWidth="2" />
          <line x1="48" y1="26" x2="48" y2="70" stroke="#9c2f14" strokeWidth="2" />
          <rect x="28" y="100" width="40" height="14" fill="none" stroke="#1c1710" />
          <rect x="22" y="140" width="52" height="70" fill="none" stroke="#1c1710" />
          <text
            x="48"
            y="240"
            textAnchor="middle"
            fill="#1c1710"
            fontFamily="ui-monospace, monospace"
            fontSize="11"
          >
            {["N1", "N2", "YARD", "S1", "S2", "SPARE"][i]}
          </text>
        </g>
      ))}
      <text
        x="52"
        y="400"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        labels as found — 1935 under 1987
      </text>
    </svg>
  );
}

function Oil() {
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label="Oil-filled breaker, section">
      <rect width="800" height="420" fill="#d8c9a4" />
      <ellipse cx="400" cy="340" rx="120" ry="22" fill="none" stroke="#1c1710" />
      <path
        d="M280 340 V140 H520 V340"
        fill="#c4b089"
        stroke="#1c1710"
        strokeWidth="1.4"
      />
      <path
        d="M300 320 V180 H500 V320"
        fill="none"
        stroke="#1c1710"
        strokeDasharray="4 3"
      />
      <path d="M360 210 H440" stroke="#9c2f14" strokeWidth="3" />
      <circle cx="360" cy="210" r="8" fill="none" stroke="#1c1710" strokeWidth="1.5" />
      <circle cx="440" cy="210" r="8" fill="none" stroke="#1c1710" strokeWidth="1.5" />
      <line x1="400" y1="140" x2="400" y2="88" stroke="#1c1710" strokeWidth="2" />
      <rect x="372" y="56" width="56" height="32" fill="none" stroke="#1c1710" />
      <text
        x="400"
        y="400"
        textAnchor="middle"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        tank, oil, the arc that must not find air
      </text>
    </svg>
  );
}

function Handle() {
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label="Throw handle, worn">
      <rect width="800" height="420" fill="#d8c9a4" />
      <rect x="340" y="80" width="36" height="220" fill="#c4b089" stroke="#1c1710" />
      <path
        d="M358 120 Q 520 90, 580 160"
        fill="none"
        stroke="#1c1710"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M358 120 Q 520 90, 580 160"
        fill="none"
        stroke="#9c2f14"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="588" cy="168" rx="22" ry="16" fill="#b7a57a" stroke="#1c1710" />
      <path
        d="M348 280 H 250 V 310"
        fill="none"
        stroke="#1c1710"
        strokeWidth="1.5"
      />
      <text
        x="240"
        y="340"
        fill="#1c1710"
        fontFamily="ui-monospace, monospace"
        fontSize="12"
      >
        INTERLOCK
      </text>
      <text
        x="400"
        y="400"
        textAnchor="middle"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        worn to a hand that has left the building
      </text>
    </svg>
  );
}

function Busbar() {
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label="Live busbar behind the panel">
      <rect width="800" height="420" fill="#d8c9a4" />
      <rect x="80" y="60" width="640" height="300" fill="#c9ba93" stroke="#1c1710" />
      {[140, 210, 280].map((y) => (
        <g key={y}>
          <rect
            x="140"
            y={y}
            width="520"
            height="22"
            fill="#b0894a"
            stroke="#1c1710"
          />
          <circle cx="168" cy={y + 11} r="5" fill="#1c1710" />
          <circle cx="632" cy={y + 11} r="5" fill="#1c1710" />
        </g>
      ))}
      <path
        d="M200 70 C 240 120, 280 80, 320 140"
        fill="none"
        stroke="#9c2f14"
        strokeWidth="1"
        opacity="0.7"
      />
      <text
        x="400"
        y="400"
        textAnchor="middle"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        six minutes at the inspection window — heat on the glass
      </text>
    </svg>
  );
}

function Tram() {
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label="Work car under the wire">
      <rect width="800" height="420" fill="#d8c9a4" />
      <line x1="40" y1="70" x2="760" y2="70" stroke="#1c1710" strokeWidth="1.5" />
      <path d="M420 70 V 130" stroke="#1c1710" />
      <path d="M390 130 H450 L430 150 H410 Z" fill="none" stroke="#1c1710" />
      <rect x="180" y="168" width="440" height="130" fill="#c4b089" stroke="#1c1710" />
      <rect x="200" y="188" width="70" height="50" fill="none" stroke="#1c1710" />
      <rect x="530" y="188" width="70" height="50" fill="none" stroke="#1c1710" />
      <circle cx="250" cy="318" r="22" fill="none" stroke="#1c1710" strokeWidth="2" />
      <circle cx="550" cy="318" r="22" fill="none" stroke="#1c1710" strokeWidth="2" />
      <text
        x="400"
        y="400"
        textAnchor="middle"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        work car, 11:40 — nobody looked up
      </text>
    </svg>
  );
}

function Yard() {
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label="The yard looking back at the switch-house">
      <rect width="800" height="420" fill="#d8c9a4" />
      <rect x="220" y="120" width="280" height="170" fill="#c4b089" stroke="#1c1710" />
      <path d="M200 120 L360 60 L540 120" fill="none" stroke="#1c1710" strokeWidth="1.5" />
      <rect x="340" y="210" width="44" height="80" fill="none" stroke="#1c1710" />
      <rect x="250" y="150" width="50" height="36" fill="none" stroke="#1c1710" />
      <rect x="420" y="150" width="50" height="36" fill="none" stroke="#1c1710" />
      <line x1="40" y1="300" x2="760" y2="300" stroke="#1c1710" />
      <path d="M80 300 L 80 250 L 200 250 L 200 300" fill="none" stroke="#1c1710" />
      <text
        x="400"
        y="400"
        textAnchor="middle"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        switch-house, four o’clock — the city does not know the name
      </text>
    </svg>
  );
}

const PLATES: Record<PlateId, () => JSX.Element> = {
  boards: Boards,
  oil: Oil,
  handle: Handle,
  busbar: Busbar,
  tram: Tram,
  yard: Yard,
};

export function PlateFigure({ id }: { id: PlateId }) {
  const Fig = PLATES[id];
  return <Fig />;
}
