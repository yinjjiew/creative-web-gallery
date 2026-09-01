/** One ordinary hour of system frequency, drawn as an editorial plate. */
export function GridFig() {
  const w = 640;
  const h = 280;
  const pad = { l: 48, r: 16, t: 28, b: 36 };
  const pts = [
    [0, 50.02],
    [4, 49.97],
    [8, 50.01],
    [14, 50.03],
    [22, 50.0],
    [31, 49.96],
    [36, 50.04],
    [44, 50.06],
    [48, 50.03],
    [55, 50.01],
    [60, 50.02],
  ];
  const x = (m: number) => pad.l + (m / 60) * (w - pad.l - pad.r);
  const y = (hz: number) =>
    pad.t + ((50.15 - hz) / 0.3) * (h - pad.t - pad.b);
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p[0])},${y(p[1])}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="System frequency over one hour, annotated"
    >
      <rect width={w} height={h} fill="#e7d9b8" />
      <rect
        x={pad.l}
        y={y(50.08)}
        width={w - pad.l - pad.r}
        height={y(49.92) - y(50.08)}
        fill="#c4b089"
        opacity="0.35"
      />
      <line
        x1={pad.l}
        x2={w - pad.r}
        y1={y(50)}
        y2={y(50)}
        stroke="#8c7a52"
        strokeDasharray="3 3"
      />
      <path d={d} fill="none" stroke="#1c1710" strokeWidth="1.5" />
      {[
        [4, 49.97, "2"],
        [31, 49.96, "4"],
        [44, 50.06, "5"],
      ].map(([m, hz, n]) => (
        <g key={n}>
          <circle cx={x(Number(m))} cy={y(Number(hz))} r="7" fill="#9c2f14" />
          <text
            x={x(Number(m))}
            y={y(Number(hz)) + 3.5}
            textAnchor="middle"
            fill="#efe4cc"
            fontFamily="ui-monospace, monospace"
            fontSize="9"
          >
            {n}
          </text>
        </g>
      ))}
      <text
        x={pad.l}
        y={18}
        fill="#9c2f14"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        letterSpacing="1.2"
      >
        Hz · 27 AUG · 12:00–13:00
      </text>
      {["49.90", "50.00", "50.10"].map((label) => (
        <text
          key={label}
          x={pad.l - 8}
          y={y(Number(label)) + 3}
          textAnchor="end"
          fill="#4a4338"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
        >
          {label}
        </text>
      ))}
      {["12:00", "12:30", "13:00"].map((label, i) => (
        <text
          key={label}
          x={x(i * 30)}
          y={h - 10}
          textAnchor="middle"
          fill="#4a4338"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
