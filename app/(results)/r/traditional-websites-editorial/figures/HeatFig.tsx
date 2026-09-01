export function HeatFig() {
  return (
    <svg
      viewBox="0 0 640 240"
      role="img"
      aria-label="District heat from energy centre to radiator, losses marked"
    >
      <rect width="640" height="240" fill="#e7d9b8" />
      {[
        [70, "1 Centre"],
        [190, "2 Main"],
        [320, "3 Riser"],
        [450, "4 HIU"],
        [570, "5 Room"],
      ].map(([x, label]) => (
        <g key={label} transform={`translate(${x}, 0)`}>
          <circle cx="0" cy="86" r="18" fill="none" stroke="#1c1710" />
          <text
            x="0"
            y="130"
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
        d="M88 86 H172 M208 86 H302 M338 86 H432 M468 86 H552"
        stroke="#1c1710"
        strokeWidth="1.5"
      />
      <path
        d="M88 86 H552"
        stroke="#9c2f14"
        strokeWidth="6"
        opacity="0.18"
        strokeLinecap="round"
      />
      <path
        d="M88 86 H552"
        stroke="#9c2f14"
        strokeWidth="2"
        opacity="0.9"
        strokeLinecap="round"
        strokeDasharray="520 80"
      />
      <text
        x="20"
        y="24"
        fill="#9c2f14"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        letterSpacing="1.2"
      >
        FLOW · LOSS AS THINNING
      </text>
      <text
        x="20"
        y="200"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="12"
        fontStyle="italic"
      >
        Typical scheme: a third of the heat can leave before the radiator.
      </text>
      <text
        x="20"
        y="220"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="12"
        fontStyle="italic"
      >
        The thinning is the argument.
      </text>
    </svg>
  );
}
