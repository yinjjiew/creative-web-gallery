"use client";

/**
 * The object, drawn.
 *
 * No photograph. The body is a small machined ingot that sits behind the ear
 * and is meant to be seen — a watch case at ear scale. Two views: worn, so the
 * scale is honest, and on the bench, so the metal can be looked at the way a
 * case is looked at. Finish changes the alloy, not the shape.
 */
import type { Finish } from "./data";
import s from "./kestrel.module.css";

function defs(finish: Finish, prefix: string) {
  const { body, wire, hardware } = finish;
  return (
    <defs>
      <linearGradient id={`${prefix}-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={body.c} />
        <stop offset="38%" stopColor={body.a} />
        <stop offset="100%" stopColor={body.b} />
      </linearGradient>
      <linearGradient id={`${prefix}-side`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={body.a} />
        <stop offset="100%" stopColor={body.b} />
      </linearGradient>
      <linearGradient id={`${prefix}-wire`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={wire.a} />
        <stop offset="100%" stopColor={wire.b} />
      </linearGradient>
      <linearGradient id={`${prefix}-hw`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={hardware.c} />
        <stop offset="55%" stopColor={hardware.a} />
        <stop offset="100%" stopColor={hardware.b} />
      </linearGradient>
      <linearGradient id={`${prefix}-sheen`} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
        <stop offset="35%" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
      </linearGradient>
      <pattern
        id={`${prefix}-hatch`}
        width="3.5"
        height="3.5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(24)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="3.5"
          stroke={body.b}
          strokeWidth="0.65"
          opacity="0.4"
        />
      </pattern>
    </defs>
  );
}

function Ingot({
  prefix,
  finish,
  width,
  height,
}: {
  prefix: string;
  finish: Finish;
  width: number;
  height: number;
}) {
  const r = Math.min(width, height) * 0.36;
  return (
    <g>
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={r}
        fill={`url(#${prefix}-body)`}
        stroke={finish.body.b}
        strokeWidth="1.15"
      />
      {finish.hatch ? (
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={r}
          fill={`url(#${prefix}-hatch)`}
        />
      ) : null}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={r}
        fill={`url(#${prefix}-sheen)`}
      />
      {/* Face plane — a machined chamfer, not a gadget bevel */}
      <rect
        x={width * 0.14}
        y={height * 0.1}
        width={width * 0.52}
        height={height * 0.8}
        rx={r * 0.7}
        fill="none"
        stroke={finish.body.c}
        strokeWidth="0.7"
        opacity="0.55"
      />
    </g>
  );
}

function Ports({
  cx,
  cy,
  finish,
  gap = 13,
}: {
  cx: number;
  cy: number;
  finish: Finish;
  gap?: number;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="2.3" fill={finish.body.b} />
      <circle cx={cx} cy={cy + gap} r="2.3" fill={finish.body.b} />
      <circle cx={cx} cy={cy} r="0.85" fill={finish.body.c} />
      <circle cx={cx} cy={cy + gap} r="0.85" fill={finish.body.c} />
    </g>
  );
}

function Screw({
  cx,
  cy,
  prefix,
  finish,
  r = 4.4,
}: {
  cx: number;
  cy: number;
  prefix: string;
  finish: Finish;
  r?: number;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#${prefix}-hw)`}
        stroke={finish.hardware.b}
        strokeWidth="0.75"
      />
      <path
        d={`M${cx - r * 0.45} ${cy}h${r * 0.9}M${cx} ${cy - r * 0.45}v${r * 0.9}`}
        stroke={finish.hardware.b}
        strokeWidth="0.75"
      />
    </g>
  );
}

/** A right ear, face toward the right. Linear, not a portrait. */
function Ear() {
  return (
    <g fill="none" stroke="#6a6e67" strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round">
      <path d="M124 42c22-24 62-28 86-8 22 18 28 52 22 86-4 24-8 44-4 66 3 20-8 42-28 52-18 10-42 8-60-6-16-12-26-32-30-52" />
      <path d="M136 78c14-16 38-18 54-4 14 12 16 34 10 52-4 14-12 26-8 40 2 12-6 26-20 32" />
      <path d="M152 122c10 6 22 6 30-4 8-10 6-24-2-32" />
      <path d="M164 176c8 12 6 28-2 38-8 10-22 14-34 8" />
      <path d="M178 138c6 10 6 22 0 34" />
    </g>
  );
}

export function Worn({ finish }: { finish: Finish }) {
  const p = `worn-${finish.id}`;
  return (
    <svg
      className={s.figureSvg}
      viewBox="0 0 280 320"
      role="img"
      aria-label={`The Kestrel One in ${finish.name}, worn on the right ear.`}
    >
      {defs(finish, p)}
      <Ear />
      <g transform="translate(88 56) rotate(-16)">
        <Ingot prefix={p} finish={finish} width={30} height={86} />
        <Ports cx={19} cy={18} finish={finish} />
        <Screw cx={15} cy={68} prefix={p} finish={finish} />
      </g>
      <path
        d="M122 88c22 10 34 26 38 46 3 14 2 28-4 40"
        fill="none"
        stroke={`url(#${p}-wire)`}
        strokeWidth="2.35"
        strokeLinecap="round"
      />
      <ellipse
        cx="158"
        cy="180"
        rx="8.5"
        ry="11"
        fill={`url(#${p}-hw)`}
        stroke={finish.hardware.b}
        strokeWidth="0.8"
      />
      <ellipse
        cx="158"
        cy="180"
        rx="14"
        ry="17"
        fill="none"
        stroke="#6a6e67"
        strokeWidth="1.1"
        opacity="0.75"
      />
    </svg>
  );
}

export function Bench({ finish }: { finish: Finish }) {
  const p = `bench-${finish.id}`;
  return (
    <svg
      className={s.figureSvg}
      viewBox="0 0 400 240"
      role="img"
      aria-label={`The Kestrel One in ${finish.name}, on the bench. 22 millimetres long.`}
    >
      {defs(finish, p)}
      <ellipse cx="198" cy="198" rx="118" ry="9" fill="#d4d6d0" />
      <g transform="translate(108 54) rotate(-20)">
        <Ingot prefix={p} finish={finish} width={148} height={58} />
        <Ports cx={28} cy={22} finish={finish} gap={14} />
        <Screw cx={122} cy={29} prefix={p} finish={finish} r={7} />
        <text
          x="74"
          y="34"
          textAnchor="middle"
          fill={finish.body.b}
          fontSize="10"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="1.6"
          opacity="0.5"
        >
          K1
        </text>
      </g>
      <path
        d="M252 84c40 10 58 30 66 54"
        fill="none"
        stroke={`url(#${p}-wire)`}
        strokeWidth="3.1"
        strokeLinecap="round"
      />
      <ellipse
        cx="326"
        cy="148"
        rx="11"
        ry="14"
        fill={`url(#${p}-hw)`}
        stroke={finish.hardware.b}
        strokeWidth="0.85"
      />
      <ellipse
        cx="326"
        cy="148"
        rx="18"
        ry="22"
        fill="none"
        stroke="#6a6e67"
        strokeWidth="1.15"
        opacity="0.7"
      />
      <g stroke="#3a3d38" fill="#3a3d38" strokeWidth="0.85">
        <path d="M128 190h116" />
        <path d="M128 186v8" />
        <path d="M244 186v8" />
      </g>
      <text
        x="186"
        y="214"
        textAnchor="middle"
        fill="#141613"
        fontSize="13"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        22.0 mm
      </text>
    </svg>
  );
}

export function Case() {
  return (
    <svg
      className={s.figureSvg}
      viewBox="0 0 260 150"
      role="img"
      aria-label="The charging case: a small tin that holds the pair overnight."
    >
      <rect x="28" y="28" width="204" height="88" rx="10" fill="#d9dbd5" stroke="#5c605a" strokeWidth="1.4" />
      <rect x="28" y="28" width="204" height="18" rx="10" fill="#c9ccc5" stroke="#5c605a" strokeWidth="1.4" />
      <rect x="28" y="40" width="204" height="6" fill="#c9ccc5" />
      <ellipse cx="92" cy="86" rx="28" ry="12" fill="#eef0ec" stroke="#8a8e87" strokeWidth="1.1" />
      <ellipse cx="168" cy="86" rx="28" ry="12" fill="#eef0ec" stroke="#8a8e87" strokeWidth="1.1" />
      <text
        x="130"
        y="132"
        textAnchor="middle"
        fill="#3a3d38"
        fontSize="12"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        The tin. Three charges in reserve.
      </text>
    </svg>
  );
}

export function Spectacles() {
  return (
    <svg
      className={s.figureSvg}
      viewBox="0 0 280 120"
      role="img"
      aria-label="A pair of spectacles, drawn in the same line as the hearing aid."
    >
      <g
        fill="none"
        stroke="#3a3d38"
        strokeWidth="2.15"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="16" y="36" width="100" height="60" rx="20" />
        <rect x="164" y="36" width="100" height="60" rx="20" />
        <path d="M116 64h48" />
        <path d="M16 56c-10-2-16 6-16 14" />
        <path d="M264 56c10-2 16 6 16 14" />
      </g>
    </svg>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 16c8-2 14-10 18-14 2 6 4 10 10 14-8 1-14 2-20 8 0-4-2-6-8-8z"
        fill="currentColor"
      />
      <path d="M30 12c4 1 8 2 9 5-4 0-7 1-10 3-1-3-1-6 1-8z" fill="currentColor" />
    </svg>
  );
}
