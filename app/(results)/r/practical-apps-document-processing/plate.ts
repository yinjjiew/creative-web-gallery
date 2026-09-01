import type { FieldId } from "./state";

/** Paper inside the facsimile viewBox, in the SVG’s own units. */
export const PAPER = { x: 40, y: 28, w: 920, h: 640 } as const;

/**
 * Normalised cell geometry, shared by the seed regions and the drawn
 * photograph so a stored bbox still lands on the graphs it came from.
 */
export const ROW0 = 0.248;
export const ROWH = 0.0815;

export const COLS: Record<FieldId, { x: number; w: number }> = {
  when: { x: 0.042, w: 0.132 },
  child: { x: 0.174, w: 0.132 },
  parents: { x: 0.306, w: 0.168 },
  surname: { x: 0.474, w: 0.128 },
  abode: { x: 0.602, w: 0.128 },
  trade: { x: 0.73, w: 0.122 },
  minister: { x: 0.852, w: 0.108 },
};

export function cellRect(lineIndex: number, fieldId: FieldId) {
  const col = COLS[fieldId];
  return {
    x: col.x,
    y: ROW0 + lineIndex * ROWH,
    w: col.w,
    h: 0.074,
  };
}

export function rectToSvg(r: { x: number; y: number; w: number; h: number }) {
  return {
    x: r.x * PAPER.w,
    y: r.y * PAPER.h,
    w: r.w * PAPER.w,
    h: r.h * PAPER.h,
  };
}

export function svgToNorm(x: number, y: number, w: number, h: number) {
  return {
    x: clamp01(x / PAPER.w),
    y: clamp01(y / PAPER.h),
    w: clamp01(w / PAPER.w),
    h: clamp01(h / PAPER.h),
  };
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
