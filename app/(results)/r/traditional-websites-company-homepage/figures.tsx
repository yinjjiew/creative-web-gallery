/**
 * Drawings, not pictures. Each figure is a circuit or a working section
 * labelled with item letters; the key lives in HTML so the type stays
 * readable when the drawing scales down to a phone.
 */

type FigProps = {
  className?: string;
  title?: string;
};

const ink = "currentColor";

export function CircuitPlan({ className, title = "Closed-return circuit, plan" }: FigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 280"
      fill="none"
      role="img"
      aria-labelledby="fig-circuit-title"
    >
      <title id="fig-circuit-title">{title}</title>
      {/* Outer circuit */}
      <path
        d="M88 56h464q28 0 28 28v112q0 28-28 28H88q-28 0-28-28V84q0-28 28-28z"
        stroke={ink}
        strokeWidth="1.4"
      />
      <path
        d="M132 96h376q12 0 12 12v64q0 12-12 12H132q-12 0-12-12v-64q0-12 12-12z"
        stroke={ink}
        strokeWidth="1"
        opacity="0.45"
      />
      {/* Contraction */}
      <path d="M248 96l56 16v56l-56 16" stroke={ink} strokeWidth="1.4" />
      {/* Test section */}
      <rect x="304" y="112" width="88" height="56" stroke={ink} strokeWidth="1.6" />
      {/* Diffuser */}
      <path d="M392 112l56-16v88l-56-16" stroke={ink} strokeWidth="1.4" />
      {/* Corner vanes — four corners */}
      <path d="M76 68l16 16M84 64l16 16M68 76l16 16" stroke={ink} strokeWidth="0.9" />
      <path d="M548 68l-16 16M540 64l-16 16M556 76l-16 16" stroke={ink} strokeWidth="0.9" />
      <path d="M548 212l-16-16M540 216l-16-16M556 204l-16-16" stroke={ink} strokeWidth="0.9" />
      <path d="M76 212l16-16M84 216l16-16M68 204l16-16" stroke={ink} strokeWidth="0.9" />
      {/* Fan */}
      <circle cx="100" cy="140" r="18" stroke={ink} strokeWidth="1.3" />
      <path d="M100 124v32M88 132h24M88 148h24" stroke={ink} strokeWidth="1" />
      {/* Flow arrow through test section */}
      <path d="M318 140h58" stroke={ink} strokeWidth="1.1" markerEnd="url(#lk-arrow)" />
      <defs>
        <marker id="lk-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0 0l8 3-8 3" stroke={ink} strokeWidth="1" />
        </marker>
      </defs>
      {/* Item letters */}
      <g
        fontFamily="var(--lk-sans), ui-sans-serif, sans-serif"
        fontSize="13"
        fill={ink}
        letterSpacing="0.04em"
      >
        <text x="168" y="84" textAnchor="middle">
          A
        </text>
        <text x="262" y="84" textAnchor="middle">
          B
        </text>
        <text x="348" y="102" textAnchor="middle">
          C
        </text>
        <text x="432" y="84" textAnchor="middle">
          D
        </text>
        <text x="80" y="48" textAnchor="middle">
          E
        </text>
        <text x="100" y="194" textAnchor="middle">
          F
        </text>
      </g>
    </svg>
  );
}

export function OpenJet({ className, title = "¾-open jet, section" }: FigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 220"
      fill="none"
      role="img"
      aria-labelledby="fig-jet-title"
    >
      <title id="fig-jet-title">{title}</title>
      {/* Nozzle */}
      <path d="M40 48h140l48 28v68l-48 28H40" stroke={ink} strokeWidth="1.4" />
      {/* Jet */}
      <path d="M228 76h200" stroke={ink} strokeWidth="1" strokeDasharray="6 4" />
      <path d="M228 144h200" stroke={ink} strokeWidth="1" strokeDasharray="6 4" />
      <path d="M248 110h120" stroke={ink} strokeWidth="1.1" markerEnd="url(#lk-arrow-j)" />
      {/* Car, drawn */}
      <path
        d="M292 128h84l12-22h28v22h16v18H276v-18h16z"
        stroke={ink}
        strokeWidth="1.3"
      />
      <circle cx="304" cy="150" r="8" stroke={ink} strokeWidth="1.2" />
      <circle cx="388" cy="150" r="8" stroke={ink} strokeWidth="1.2" />
      {/* Collector */}
      <path d="M452 76l48-28h100v124H500l-48-28V76z" stroke={ink} strokeWidth="1.4" />
      <defs>
        <marker id="lk-arrow-j" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0 0l8 3-8 3" stroke={ink} strokeWidth="1" />
        </marker>
      </defs>
      <g
        fontFamily="var(--lk-sans), ui-sans-serif, sans-serif"
        fontSize="13"
        fill={ink}
        letterSpacing="0.04em"
      >
        <text x="110" y="36">
          A
        </text>
        <text x="318" y="64">
          B
        </text>
        <text x="340" y="188">
          C
        </text>
        <text x="540" y="36">
          D
        </text>
      </g>
    </svg>
  );
}

export function SlottedWall({ className, title = "Slotted test section" }: FigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 220"
      fill="none"
      role="img"
      aria-labelledby="fig-slot-title"
    >
      <title id="fig-slot-title">{title}</title>
      <rect x="80" y="36" width="480" height="148" stroke={ink} strokeWidth="1.4" />
      {/* Slots */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 112 + i * 48;
        return <rect key={x} x={x} y="36" width="10" height="148" stroke={ink} strokeWidth="1" />;
      })}
      {/* Model volume */}
      <rect x="250" y="78" width="140" height="64" stroke={ink} strokeWidth="1.2" />
      <path d="M200 110h40" stroke={ink} strokeWidth="1.1" markerEnd="url(#lk-arrow-s)" />
      <defs>
        <marker id="lk-arrow-s" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0 0l8 3-8 3" stroke={ink} strokeWidth="1" />
        </marker>
      </defs>
      <g
        fontFamily="var(--lk-sans), ui-sans-serif, sans-serif"
        fontSize="13"
        fill={ink}
        letterSpacing="0.04em"
      >
        <text x="96" y="28">
          A
        </text>
        <text x="320" y="72" textAnchor="middle">
          B
        </text>
        <text x="188" y="104">
          C
        </text>
      </g>
    </svg>
  );
}

export function RiderJet({ className, title = "Rider in the jet" }: FigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 220"
      fill="none"
      role="img"
      aria-labelledby="fig-rider-title"
    >
      <title id="fig-rider-title">{title}</title>
      <path d="M36 52h120l40 24v68l-40 24H36" stroke={ink} strokeWidth="1.4" />
      <path d="M196 76h280" stroke={ink} strokeWidth="1" strokeDasharray="6 4" />
      <path d="M196 144h280" stroke={ink} strokeWidth="1" strokeDasharray="6 4" />
      <path d="M210 110h80" stroke={ink} strokeWidth="1.1" markerEnd="url(#lk-arrow-r)" />
      {/* Bike */}
      <circle cx="360" cy="148" r="18" stroke={ink} strokeWidth="1.2" />
      <circle cx="430" cy="148" r="18" stroke={ink} strokeWidth="1.2" />
      <path d="M360 148h70" stroke={ink} strokeWidth="1.2" />
      <path d="M378 148l22-36h28" stroke={ink} strokeWidth="1.2" />
      <path d="M400 112v36" stroke={ink} strokeWidth="1.1" />
      {/* Rider, tucked */}
      <circle cx="412" cy="78" r="8" stroke={ink} strokeWidth="1.2" />
      <path d="M408 86l-8 22 14 8" stroke={ink} strokeWidth="1.3" />
      <path d="M400 108h36" stroke={ink} strokeWidth="1.2" />
      <path d="M400 108l-6 28" stroke={ink} strokeWidth="1.2" />
      <defs>
        <marker id="lk-arrow-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0 0l8 3-8 3" stroke={ink} strokeWidth="1" />
        </marker>
      </defs>
      <g
        fontFamily="var(--lk-sans), ui-sans-serif, sans-serif"
        fontSize="13"
        fill={ink}
        letterSpacing="0.04em"
      >
        <text x="88" y="40">
          A
        </text>
        <text x="300" y="64">
          B
        </text>
        <text x="400" y="196">
          C
        </text>
      </g>
    </svg>
  );
}

export function SkierJet({ className, title = "Skier on the plate" }: FigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 220"
      fill="none"
      role="img"
      aria-labelledby="fig-ski-title"
    >
      <title id="fig-ski-title">{title}</title>
      <path d="M36 52h120l40 24v68l-40 24H36" stroke={ink} strokeWidth="1.4" />
      <path d="M196 70h300" stroke={ink} strokeWidth="1" strokeDasharray="6 4" />
      <path d="M196 156h300" stroke={ink} strokeWidth="1" strokeDasharray="6 4" />
      <path d="M210 112h90" stroke={ink} strokeWidth="1.1" markerEnd="url(#lk-arrow-k)" />
      {/* Plate */}
      <path d="M340 168h120" stroke={ink} strokeWidth="1.6" />
      <path d="M348 168v8M452 168v8" stroke={ink} strokeWidth="1.2" />
      {/* Skier, tucked */}
      <circle cx="410" cy="72" r="8" stroke={ink} strokeWidth="1.2" />
      <path d="M406 80l-18 36 28 8" stroke={ink} strokeWidth="1.3" />
      <path d="M388 116h44" stroke={ink} strokeWidth="1.2" />
      <path d="M400 124l-8 44M424 124l12 44" stroke={ink} strokeWidth="1.2" />
      <defs>
        <marker id="lk-arrow-k" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0 0l8 3-8 3" stroke={ink} strokeWidth="1" />
        </marker>
      </defs>
      <g
        fontFamily="var(--lk-sans), ui-sans-serif, sans-serif"
        fontSize="13"
        fill={ink}
        letterSpacing="0.04em"
      >
        <text x="88" y="40">
          A
        </text>
        <text x="320" y="58">
          B
        </text>
        <text x="400" y="200">
          C
        </text>
      </g>
    </svg>
  );
}

export function FIGURE_FOR(klass: string) {
  if (klass === "aeroacoustic") return OpenJet;
  if (klass === "transonic") return SlottedWall;
  if (klass === "sport") return RiderJet;
  return CircuitPlan;
}
