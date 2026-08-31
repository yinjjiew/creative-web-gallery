"use client";

/**
 * The mixture chart.
 *
 * Success rate up the page; across the page, the fraction of a treatment's
 * cases that were small stones. A treatment is a straight line, because a
 * weighted average is linear in its weights: at the far left it would have been
 * given only large stones, at the far right only small ones. Its actual overall
 * rate is a marker sitting on that line at its actual case mix.
 *
 * The consequence is that the two things prose has to say one after the other
 * are visible at once — the lines can stay apart (one treatment better in both
 * kinds of case) while the markers cross (the other better overall).
 *
 * Every coordinate is computed from the integer counts, so the picture and the
 * table beside it cannot disagree.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import styles from "./reversal.module.css";
import {
  MIN_CELL,
  Y_MAX,
  Y_MIN,
  clamp,
  mix,
  overall,
  pct,
  pooled,
  rate,
  ratesOf,
  setMix,
  shiftSuccesses,
  type Arm,
  type Rates,
  type Setup,
} from "./model";

type ArmKey = "a" | "b";
type Target =
  | { kind: "mix"; arm: ArmKey }
  | { kind: "rate"; arm: ArmKey; stratum: "small" | "large" };

type Props = {
  setup: Setup;
  onChange: (next: Setup) => void;
  labels: { a: string; b: string; aShort: string; bShort: string };
  strata: { small: string; large: string };
};

const PAD = { top: 30, right: 26, bottom: 82, left: 60 };
const TINT = "var(--tint)";

export default function MixtureChart({
  setup,
  onChange,
  labels,
  strata,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const holderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(860);

  useLayoutEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const measure = () => setWidth(Math.round(holder.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  const compact = width < 560;
  const height = Math.round(clamp(width * 0.66, 380, 500));
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const X = (t: number) => PAD.left + t * plotW;
  const Y = (r: number) =>
    PAD.top + ((Y_MAX - clamp(r, Y_MIN, Y_MAX)) / (Y_MAX - Y_MIN)) * plotH;
  const baseY = Y(Y_MIN);

  /* ------------------------------------------------------------- dragging */

  /**
   * A gesture on a mix handle carries the arm's two success rates as they stood
   * when it began, so that a drag across the whole width re-rounds every
   * intermediate value from those and not from its own last answer. Without it
   * the rounding compounds and the lines creep while the reader is being told
   * that only the weights are moving. See `setMix`.
   */
  const dragRef = useRef<{ target: Target; hold: Rates } | null>(null);
  const keyHoldRef = useRef<{ arm: ArmKey; hold: Rates } | null>(null);

  const applyPointer = useCallback(
    (target: Target, hold: Rates, clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const box = svg.getBoundingClientRect();
      const px = ((clientX - box.left) / box.width) * width;
      const py = ((clientY - box.top) / box.height) * height;
      const arm = setup[target.arm];

      if (target.kind === "mix") {
        const t = clamp((px - PAD.left) / plotW, 0, 1);
        const n = arm.small.total + arm.large.total;
        onChange({
          ...setup,
          [target.arm]: setMix(arm, Math.round(t * n), hold),
        });
        return;
      }

      const wanted = clamp(
        Y_MAX - ((py - PAD.top) / plotH) * (Y_MAX - Y_MIN),
        Y_MIN,
        Y_MAX
      );
      const cell = arm[target.stratum];
      const nextArm: Arm = {
        ...arm,
        [target.stratum]: {
          total: cell.total,
          successes: Math.round(
            clamp(
              wanted * cell.total,
              Math.ceil(Y_MIN * cell.total),
              cell.total
            )
          ),
        },
      };
      onChange({ ...setup, [target.arm]: nextArm });
    },
    [height, onChange, plotH, plotW, setup, width]
  );

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      event.preventDefault();
      applyPointer(drag.target, drag.hold, event.clientX, event.clientY);
    };
    const end = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [applyPointer]);

  const startDrag = (target: Target) => (event: React.PointerEvent) => {
    event.preventDefault();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    const hold = ratesOf(setup[target.arm]);
    dragRef.current = { target, hold };
    applyPointer(target, hold, event.clientX, event.clientY);
  };

  /* ------------------------------------------------------------- keyboard */

  const onKey = (target: Target) => (event: React.KeyboardEvent) => {
    const arm = setup[target.arm];
    const fine = event.shiftKey ? 10 : 1;
    const forward = event.key === "ArrowRight" || event.key === "ArrowUp";
    const back = event.key === "ArrowLeft" || event.key === "ArrowDown";

    if (target.kind === "mix") {
      const n = arm.small.total + arm.large.total;
      let wanted: number | null = null;
      if (forward) wanted = arm.small.total + fine;
      else if (back) wanted = arm.small.total - fine;
      else if (event.key === "PageUp") wanted = arm.small.total + 25;
      else if (event.key === "PageDown") wanted = arm.small.total - 25;
      else if (event.key === "Home") wanted = MIN_CELL;
      else if (event.key === "End") wanted = n - MIN_CELL;
      if (wanted === null) return;
      event.preventDefault();
      const held = keyHoldRef.current;
      const hold =
        held && held.arm === target.arm ? held.hold : ratesOf(arm);
      if (!held || held.arm !== target.arm) {
        keyHoldRef.current = { arm: target.arm, hold };
      }
      onChange({ ...setup, [target.arm]: setMix(arm, wanted, hold) });
      return;
    }

    let step: number | null = null;
    if (forward) step = fine;
    else if (back) step = -fine;
    else if (event.key === "PageUp") step = 25;
    else if (event.key === "PageDown") step = -25;
    if (step === null) return;
    event.preventDefault();
    onChange({
      ...setup,
      [target.arm]: {
        ...arm,
        [target.stratum]: shiftSuccesses(arm[target.stratum], step),
      },
    });
  };

  /* --------------------------------------------------------------- drawing */

  const yTicks = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const xTicks = compact ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];

  const armInfo = (key: ArmKey) => {
    const arm = setup[key];
    return {
      key,
      arm,
      className: key === "a" ? styles.armA : styles.armB,
      name: key === "a" ? labels.a : labels.b,
      short: key === "a" ? labels.aShort : labels.bShort,
      mix: mix(arm),
      overall: overall(arm),
      smallRate: rate(arm.small),
      largeRate: rate(arm.large),
    };
  };

  const A = armInfo("a");
  const B = armInfo("b");

  // Value tags sit on the rate axis at each marker's height; nudge them apart
  // when the two overall rates are close, so neither becomes unreadable.
  let yTagA = Y(A.overall);
  let yTagB = Y(B.overall);
  if (Math.abs(yTagA - yTagB) < 15) {
    const mid = (yTagA + yTagB) / 2;
    const shift = yTagA <= yTagB ? -7.5 : 7.5;
    yTagA = mid + shift;
    yTagB = mid - shift;
  }

  // Mix tags hang under the axis; drop the second one a line if they collide.
  const stackB = Math.abs(X(A.mix) - X(B.mix)) < (compact ? 58 : 96);

  // A rate tick is dropped when one of the two value tags is sitting on it.
  const tagged = (y: number) =>
    Math.abs(y - yTagA) < 14 || Math.abs(y - yTagB) < 14;

  // Direct labels ride the middle of each line, clear of the handles at both
  // ends, offset to whichever side of the line has nothing else on it.
  const labelX = 0.5;
  const labelRate = (info: ReturnType<typeof armInfo>) =>
    info.largeRate + labelX * (info.smallRate - info.largeRate);
  const aAbove = labelRate(A) >= labelRate(B);

  return (
    <div className={styles.chartHolder} ref={holderRef}>
      <svg
        ref={svgRef}
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Mixture chart: overall success rate against case mix"
        aria-describedby={`${uid}-desc`}
      >
        <desc id={`${uid}-desc`}>
          {`${labels.a}: ${pct(A.smallRate)} on ${strata.small}, ${pct(A.largeRate)} on ${strata.large}, case mix ${pct(A.mix)}, overall ${pct(A.overall)}. ${labels.b}: ${pct(B.smallRate)} on ${strata.small}, ${pct(B.largeRate)} on ${strata.large}, case mix ${pct(B.mix)}, overall ${pct(B.overall)}.`}
        </desc>

        {yTicks.map((t) => (
          <g key={t}>
            <line
              className={styles.gridLine}
              x1={X(0)}
              x2={X(1)}
              y1={Y(t)}
              y2={Y(t)}
            />
            {!tagged(Y(t)) && (
              <text
                className={styles.axisText}
                x={PAD.left - 9}
                y={Y(t) + 3.5}
                textAnchor="end"
              >
                {Math.round(t * 100)}
                {t === 1 ? "%" : ""}
              </text>
            )}
          </g>
        ))}

        <text
          className={styles.axisTitle}
          x={2}
          y={PAD.top - 14}
          textAnchor="start"
        >
          success rate
        </text>

        <line
          className={styles.axisLine}
          x1={X(0)}
          x2={X(1)}
          y1={baseY}
          y2={baseY}
        />

        {xTicks.map((t) => (
          <g key={t}>
            <line
              className={styles.gridLine}
              x1={X(t)}
              x2={X(t)}
              y1={baseY}
              y2={baseY + 5}
            />
            <text
              className={styles.axisText}
              x={X(t)}
              y={baseY + 17}
              textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"}
            >
              {Math.round(t * 100)}
              {t === 1 ? "%" : ""}
            </text>
          </g>
        ))}

        <text
          className={styles.axisText}
          x={X(0)}
          y={baseY + 30}
          textAnchor="start"
        >
          {compact ? "all large" : `all ${strata.large}`}
        </text>
        <text
          className={styles.axisText}
          x={X(1)}
          y={baseY + 30}
          textAnchor="end"
        >
          {compact ? "all small" : `all ${strata.small}`}
        </text>
        <text
          className={styles.axisTitle}
          x={X(0.5)}
          y={height - 7}
          textAnchor="middle"
        >
          {compact
            ? "case mix →"
            : `case mix — share of a treatment's cases that were ${strata.small}`}
        </text>

        {[A, B].map((info) => {
          const mixX = X(info.mix);
          const mixY = Y(info.overall);
          const n = info.arm.small.total + info.arm.large.total;
          const tagY = info.key === "a" ? yTagA : yTagB;
          const stacked = info.key === "b" && stackB;
          const mixTagY = baseY + (stacked ? 62 : 47);
          const labelAbove = info.key === "a" ? aAbove : !aAbove;

          return (
            <g key={info.key} className={info.className}>
              {/* every overall rate this treatment could have had */}
              <line
                className={styles.armLine}
                stroke="currentColor"
                x1={X(0)}
                y1={Y(info.largeRate)}
                x2={X(1)}
                y2={Y(info.smallRate)}
              />

              <line
                className={styles.dropLine}
                stroke="currentColor"
                x1={mixX}
                y1={mixY}
                x2={mixX}
                y2={mixTagY - 11}
              />
              <line
                className={styles.dropLine}
                stroke="currentColor"
                x1={X(0)}
                y1={mixY}
                x2={mixX}
                y2={mixY}
              />

              <text
                className={styles.armLabel}
                fill="currentColor"
                x={X(labelX)}
                y={Y(labelRate(info)) + (labelAbove ? -13 : 22)}
                textAnchor="middle"
              >
                {compact ? info.short : info.name}
              </text>

              {(["large", "small"] as const).map((stratum) => {
                const cell = info.arm[stratum];
                const r = rate(cell);
                const cx = X(stratum === "large" ? 0 : 1);
                const cy = Y(r);
                return (
                  <g
                    key={stratum}
                    className={`${styles.handle} ${styles.handleRate}`}
                    role="slider"
                    tabIndex={0}
                    aria-label={`${info.name}: success rate on ${strata[stratum]}`}
                    aria-orientation="vertical"
                    aria-valuemin={Math.round(Y_MIN * 100)}
                    aria-valuemax={100}
                    aria-valuenow={Number((r * 100).toFixed(1))}
                    aria-valuetext={`${pct(r)} — ${cell.successes} of ${cell.total} cases. This treatment overall: ${pct(info.overall)}.`}
                    onPointerDown={startDrag({
                      kind: "rate",
                      arm: info.key,
                      stratum,
                    })}
                    onKeyDown={onKey({ kind: "rate", arm: info.key, stratum })}
                  >
                    <circle cx={cx} cy={cy} r={19} fill="transparent" />
                    <circle
                      className={styles.handleRing}
                      cx={cx}
                      cy={cy}
                      r={11}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      style={{ fill: TINT }}
                      stroke="currentColor"
                      strokeWidth={1.6}
                    />
                  </g>
                );
              })}

              <g
                className={`${styles.handle} ${styles.handleMix}`}
                role="slider"
                tabIndex={0}
                aria-label={`${info.name}: case mix, the share of its cases that were ${strata.small}`}
                aria-valuemin={Math.round((MIN_CELL / n) * 1000) / 10}
                aria-valuemax={Math.round(((n - MIN_CELL) / n) * 1000) / 10}
                aria-valuenow={Number((info.mix * 100).toFixed(1))}
                aria-valuetext={`${pct(info.mix)} ${strata.small} — ${info.arm.small.total} of ${n} cases. Overall success ${pct(info.overall)}, ${pooled(info.arm).successes} of ${n}.`}
                onPointerDown={startDrag({ kind: "mix", arm: info.key })}
                onKeyDown={onKey({ kind: "mix", arm: info.key })}
                onBlur={() => {
                  keyHoldRef.current = null;
                }}
              >
                <circle cx={mixX} cy={mixY} r={22} fill="transparent" />
                <circle
                  className={styles.handleRing}
                  cx={mixX}
                  cy={mixY}
                  r={13}
                />
                <circle
                  cx={mixX}
                  cy={mixY}
                  r={7}
                  fill="currentColor"
                  style={{ stroke: TINT }}
                  strokeWidth={2.5}
                />
              </g>

              <rect
                x={2}
                y={tagY - 8}
                width={PAD.left - 11}
                height={16}
                style={{ fill: TINT }}
              />
              <text
                className={styles.valueTag}
                fill="currentColor"
                x={PAD.left - 9}
                y={tagY + 4}
                textAnchor="end"
              >
                {pct(info.overall)}
              </text>

              <text
                className={styles.valueTag}
                fill="currentColor"
                x={clamp(mixX, PAD.left + 40, width - PAD.right - 40)}
                y={mixTagY}
                textAnchor="middle"
              >
                {pct(info.mix)}
                {!compact && (
                  <tspan className={styles.axisText} dx="7">
                    {info.arm.small.total} of {n}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
