export function SewerFig() {
  return (
    <svg
      viewBox="0 0 720 260"
      role="img"
      aria-label="Four disagreeing records of the same pipe"
    >
      <rect width="720" height="260" fill="#e7d9b8" />
      {(
        [
          ["Company GIS", "M40 48 H280 L340 88 H520", true],
          ["Borough highway", "M40 108 H200 L260 88 H400", false],
          ["1930s deed", "M300 168 H480 L560 148", false],
          ["2019 pencil", "M320 208 H500 L620 188 H680", true],
        ] as const
      ).map(([title, d, dashed], i) => (
        <g key={title}>
          <text
            x="16"
            y={40 + i * 56}
            fill="#9c2f14"
            fontFamily="ui-monospace, monospace"
            fontSize="10"
            letterSpacing="0.8"
          >
            {title}
          </text>
          <path
            d={String(d)}
            fill="none"
            stroke="#1c1710"
            strokeWidth="1.4"
            strokeDasharray={dashed ? undefined : "5 3"}
          />
        </g>
      ))}
      <rect
        x="300"
        y="36"
        width="80"
        height="200"
        fill="none"
        stroke="#9c2f14"
        strokeDasharray="2 2"
      />
      <text
        x="310"
        y="250"
        fill="#4a4338"
        fontFamily="Georgia, serif"
        fontSize="11"
        fontStyle="italic"
      >
        alley — unadopted
      </text>
    </svg>
  );
}
