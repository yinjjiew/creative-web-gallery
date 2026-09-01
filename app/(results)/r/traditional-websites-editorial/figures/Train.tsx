/** Process train — editorial line drawing, not a site plan. */
export function Train() {
  return (
    <svg
      viewBox="0 0 720 220"
      role="img"
      aria-label="Treatment train from intake to outgoing main"
    >
      <rect width="720" height="220" fill="#e7d9b8" />
      <text
        x="16"
        y="22"
        fill="#9c2f14"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        letterSpacing="1.4"
      >
        INTAKE → OUTGOING
      </text>
      {[
        [48, "Screen"],
        [158, "Coagulate"],
        [278, "Flocculate"],
        [408, "Clarify"],
        [528, "Filter"],
        [638, "Contact"],
      ].map(([x, label], i) => (
        <g key={label} transform={`translate(${x}, 0)`}>
          <rect
            x="-42"
            y="48"
            width="84"
            height="88"
            fill="none"
            stroke="#1c1710"
            strokeWidth="1.25"
          />
          {i === 3 && (
            <path
              d="M-28 120 L0 78 L28 120"
              fill="none"
              stroke="#1c1710"
              strokeWidth="1"
            />
          )}
          {i === 4 && (
            <>
              <line x1="-28" y1="72" x2="28" y2="72" stroke="#1c1710" />
              <line x1="-28" y1="86" x2="28" y2="86" stroke="#1c1710" />
              <line x1="-28" y1="100" x2="28" y2="100" stroke="#1c1710" />
            </>
          )}
          {i === 5 && (
            <rect
              x="-28"
              y="64"
              width="56"
              height="52"
              fill="none"
              stroke="#9c2f14"
              strokeDasharray="3 2"
            />
          )}
          {i < 5 && (
            <path
              d="M46 92 H66"
              stroke="#1c1710"
              strokeWidth="1.25"
              markerEnd="url(#arr)"
            />
          )}
          <text
            x="0"
            y="160"
            textAnchor="middle"
            fill="#1c1710"
            fontFamily="ui-monospace, monospace"
            fontSize="11"
          >
            {label}
          </text>
        </g>
      ))}
      <path
        d="M20 190 C 120 170, 220 210, 360 186 S 580 160, 700 188"
        fill="none"
        stroke="#9c2f14"
        strokeWidth="1"
        opacity="0.7"
      />
      <text
        x="16"
        y="210"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="11"
        fontStyle="italic"
      >
        sludge and washwater return under the train
      </text>
      <defs>
        <marker
          id="arr"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6 Z" fill="#1c1710" />
        </marker>
      </defs>
    </svg>
  );
}
