"use client";

/**
 * Where the applications went.
 *
 * Two bars of equal length — one per sex — segmented by department, with each
 * segment's width proportional to that sex's applications and its darkness to
 * the department's combined admission rate. The same weighting argument as the
 * mixture chart, in the one form that suits six groups instead of two: you can
 * see immediately that the men's applications are concentrated in the dark
 * (easy) departments and the women's in the pale (hard) ones.
 */

import { useLayoutEffect, useRef, useState } from "react";

import styles from "./reversal.module.css";
import { berkeleyByRate, berkeleyTotals } from "./data";

const BAR = 44;
const ROW = 96;
const PAD_LEFT = 0;
const PAD_RIGHT = 0;

function ramp(rate: number): string {
  const t = Math.max(0, Math.min(1, rate / 0.7));
  const from = [223, 217, 202];
  const to = [17, 62, 75];
  const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

export default function BerkeleyFigure() {
  const holderRef = useRef<HTMLDivElement>(null);
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

  const departments = berkeleyByRate();
  const totals = berkeleyTotals();
  const inner = width - PAD_LEFT - PAD_RIGHT;
  const legendColumns = width < 560 ? 2 : width < 760 ? 3 : 6;
  const legendRows = Math.ceil(6 / legendColumns);
  const legendTop = ROW * 2 + 12;
  const height = legendTop + legendRows * 17 + 4;

  const rows = [
    { key: "men", label: "Men", pick: (d: (typeof departments)[number]) => d.men, total: totals.men },
    { key: "women", label: "Women", pick: (d: (typeof departments)[number]) => d.women, total: totals.women },
  ] as const;

  return (
    <div className={styles.mosaic} ref={holderRef}>
      <svg
        className={styles.mosaicSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Applications by department. Men: ${totals.men.applied.toLocaleString("en-US")} applications, ${((departments[0].men.applied + departments[1].men.applied) / totals.men.applied * 100).toFixed(0)} per cent of them to the two departments with the highest admission rates. Women: ${totals.women.applied.toLocaleString("en-US")} applications, ${((departments[0].women.applied + departments[1].women.applied) / totals.women.applied * 100).toFixed(0)} per cent to those two.`}
      >
        {rows.map((row, index) => {
          const top = index * ROW + 16;
          let cursor = PAD_LEFT;
          const segments = departments.map((d) => {
            const applied = row.pick(d).applied;
            const w = (applied / row.total.applied) * inner;
            const x = cursor;
            cursor += w;
            return { d, x, w, applied };
          });
          const easyEnd =
            PAD_LEFT +
            ((segments[0].applied + segments[1].applied) / row.total.applied) *
              inner;
          const easyShare =
            ((segments[0].applied + segments[1].applied) /
              row.total.applied) *
            100;

          return (
            <g key={row.key}>
              <text className={styles.mosaicLabel} x={PAD_LEFT} y={top - 4}>
                {row.label}
              </text>
              <text
                className={styles.mosaicSmall}
                x={width - PAD_RIGHT}
                y={top - 4}
                textAnchor="end"
              >
                {row.total.admitted.toLocaleString("en-US")} of{" "}
                {row.total.applied.toLocaleString("en-US")} admitted ·{" "}
                {((row.total.admitted / row.total.applied) * 100).toFixed(1)}%
              </text>

              {/* Letters sit under the bar rather than inside it: a mid-ramp
                  fill has poor contrast with any colour of text. */}
              {segments.map(({ d, x, w }) => (
                <g key={d.code}>
                  <rect
                    x={x}
                    y={top}
                    width={Math.max(0.5, w)}
                    height={BAR}
                    fill={ramp(d.rate)}
                    stroke="var(--paper)"
                    strokeWidth={1}
                  />
                  {w > 13 && (
                    <text
                      className={styles.mosaicSeg}
                      x={x + w / 2}
                      y={top + BAR + 11}
                      textAnchor="middle"
                      fill="var(--ink)"
                    >
                      {d.code}
                    </text>
                  )}
                </g>
              ))}

              <g>
                <path
                  d={`M ${PAD_LEFT + 0.5} ${top + BAR + 19} v 5 H ${easyEnd} v -5`}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={1}
                />
                <text
                  className={styles.mosaicSmall}
                  x={easyEnd + 7}
                  y={top + BAR + 28}
                  fill="var(--ink)"
                >
                  {easyShare.toFixed(1)}%{" "}
                  {width < 620
                    ? "to A and B"
                    : `of ${row.label.toLowerCase()}'s applications went to A and B`}
                </text>
              </g>
            </g>
          );
        })}

        <g>
          {departments.map((d, i) => {
            const column = i % legendColumns;
            const row = Math.floor(i / legendColumns);
            return (
              <g
                key={d.code}
                transform={`translate(${(column * inner) / legendColumns}, ${legendTop + row * 17})`}
              >
                <rect x={0} y={0} width={9} height={9} fill={ramp(d.rate)} />
                <text className={styles.mosaicSmall} x={14} y={8}>
                  {d.code} · {(d.rate * 100).toFixed(1)}% admitted
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
