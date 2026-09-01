"use client";

/**
 * Drawn portraits.
 *
 * There is a reason these are drawings and not photographs, and it is not that
 * the project has no image files. For most of what has been lost there is no
 * photograph — the record is a line of catalogue copy, and a line of catalogue
 * copy is what a drawing is made from. So the portrait is built from the same
 * parameters the description carries: how long the pod, how many seeds, how
 * ruffled the leaf. It is an engraving of a written sentence, and the caption
 * beside it says so.
 *
 * Varieties still in the collection are drawn with hatching, because somebody
 * can go and look at one. Varieties that are gone are drawn in outline with a
 * sparse stipple: all edge, no substance.
 *
 * Everything here is geometry generated from a seeded generator, so a given
 * variety always draws identically, on the server and in the browser.
 */

import { useMemo } from "react";

import type { PortraitForm, Variety } from "./data/varieties";

type Pt = [number, number];
type Shape = Variety["shape"];

const W = 120;
const H = 150;

function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quad(a: Pt, b: Pt, c: Pt): (t: number) => Pt {
  return (t: number) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * b[0] + t * t * c[0],
      u * u * a[1] + 2 * u * t * b[1] + t * t * c[1],
    ];
  };
}

/** A closed outline swept along a centreline with a varying half-width. */
function ribbon(
  centre: (t: number) => Pt,
  half: (t: number) => number,
  steps = 46
): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = centre(t);
    const back = centre(Math.max(0, t - 0.004));
    const fwd = centre(Math.min(1, t + 0.004));
    let dx = fwd[0] - back[0];
    let dy = fwd[1] - back[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = half(t);
    left.push([p[0] - dy * w, p[1] + dx * w]);
    right.push([p[0] + dy * w, p[1] - dx * w]);
  }
  return path([...left, ...right.reverse()]);
}

function path(pts: Pt[], close = true): string {
  const body = pts
    .map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");
  return close ? `${body} Z` : body;
}

/** Closed polar outline, for heads and rosettes and fruit. */
function polar(
  cx: number,
  cy: number,
  radius: (a: number) => number,
  squash = 1,
  steps = 96
): string {
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = radius(a);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * squash]);
  }
  return path(pts);
}

const smooth = (u: number) => u * u * (3 - 2 * u);

type Drawn = {
  /** Outline paths, stroked, and used together as the shading clip. */
  outline: string[];
  /** Interior detail, drawn lighter. */
  detail: string[];
};

function drawPod(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.75;
  const stretch = shape.stretch ?? 0.6;
  const count = Math.max(3, Math.round(shape.count ?? 6));
  const len = 58 + 46 * stretch;
  const lean = 8 + rnd() * 10;
  const centre = quad([38, 30], [40 + lean + 34, 34 + len * 0.42], [56, 30 + len]);
  const w = 5.6 + 5.4 * size;
  const half = (t: number) =>
    w * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.5) +
    0.9 * Math.sin(t * Math.PI * count) * (t > 0.08 && t < 0.94 ? 1 : 0);

  const outline = [ribbon(centre, half)];
  const detail: string[] = [];

  for (let i = 0; i < count; i++) {
    const t = 0.1 + ((i + 0.5) / count) * 0.82;
    const p = centre(t);
    const r = half(t) * 0.46;
    detail.push(
      polar(p[0], p[1], () => r, 1, 20)
    );
  }
  // Stalk and calyx at the top, and a tendril, which is how a pea is legible.
  const stalk = centre(0);
  detail.push(path([[stalk[0] - 1, stalk[1]], [stalk[0] - 9, stalk[1] - 11]], false));
  const tendril: Pt[] = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const a = t * Math.PI * 2.4;
    const rad = 7 * (1 - t * 0.55);
    tendril.push([stalk[0] - 9 + Math.cos(a) * rad - rad, stalk[1] - 11 - t * 10 + Math.sin(a) * rad * 0.5]);
  }
  detail.push(path(tendril, false));
  return { outline, detail };
}

function drawRoot(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.75;
  const stretch = shape.stretch ?? 0.5;
  const len = 38 + 66 * stretch;
  const top = 46;
  const drift = (rnd() - 0.5) * 7;
  const centre = quad([60, top], [60 + drift, top + len * 0.6], [59 + drift * 1.4, top + len]);
  const r = 11 + 15 * size;
  const half = (t: number) =>
    r *
    Math.pow(1 - t, 0.5) *
    (0.5 + 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 3.1)), 0.7));

  const outline = [ribbon(centre, half)];
  const detail: string[] = [];

  // Growth rings across the root, the mark of a seed-catalogue engraving.
  for (let i = 1; i <= 6; i++) {
    const t = i / 7.5;
    const p = centre(t);
    const w = half(t) * 0.92;
    detail.push(
      path(
        [
          [p[0] - w, p[1] - 1.5],
          [p[0] - w * 0.4, p[1] + 1.6],
          [p[0] + w * 0.4, p[1] + 1.6],
          [p[0] + w, p[1] - 1.5],
        ],
        false
      )
    );
  }
  // Rootlets.
  for (let i = 0; i < 4; i++) {
    const t = 0.72 + i * 0.07;
    const p = centre(Math.min(0.99, t));
    const dir = i % 2 ? 1 : -1;
    detail.push(
      path(
        [p, [p[0] + dir * 7, p[1] + 4], [p[0] + dir * 11, p[1] + 11]],
        false
      )
    );
  }
  // Leaf tuft.
  const crown: Pt = centre(0);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.34;
    const l = 26 + rnd() * 14;
    const tip: Pt = [crown[0] + Math.cos(a) * l, crown[1] + Math.sin(a) * l];
    const mid: Pt = [
      crown[0] + Math.cos(a) * l * 0.5 + (i - 2) * 3,
      crown[1] + Math.sin(a) * l * 0.5,
    ];
    outline.push(ribbon(quad(crown, mid, tip), (t) => 3.4 * Math.sin(Math.PI * t), 20));
  }
  return { outline, detail };
}

function drawGourd(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.8;
  const stretch = shape.stretch ?? 0.5;
  const len = 40 + 74 * stretch;
  const top = 34 + (1 - stretch) * 12;
  const drift = (rnd() - 0.5) * 6;
  const centre = quad([60, top], [60 + drift * 2, top + len * 0.5], [59, top + len]);
  const r = 12 + 17 * size;
  const half = (t: number) => r * Math.pow(Math.sin(Math.PI * t), 0.42);

  const outline = [ribbon(centre, half)];
  const detail: string[] = [];
  for (const k of [-0.72, -0.34, 0.34, 0.72]) {
    const pts: Pt[] = [];
    for (let i = 2; i <= 42; i++) {
      const t = i / 44;
      const p = centre(t);
      pts.push([p[0] + half(t) * k, p[1]]);
    }
    detail.push(path(pts, false));
  }
  const stalk = centre(0);
  detail.push(
    ribbon(
      quad(stalk, [stalk[0] + 3, stalk[1] - 8], [stalk[0] - 2, stalk[1] - 15]),
      (t) => 2.6 * (1 - t * 0.5),
      12
    )
  );
  return { outline, detail };
}

function drawBulb(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.7;
  const stretch = shape.stretch ?? 0.4;
  const s = 0.12 + 0.58 * stretch;
  const r = 9 + 15 * size;
  const top = 26;
  const bottom = 126;
  const centre = quad([60, top], [60 + (rnd() - 0.5) * 4, (top + bottom) / 2], [60, bottom]);
  const half = (t: number) => {
    if (t < s) return r * 0.26;
    const u = (t - s) / (1 - s);
    const cap = u > 0.86 ? Math.max(0, 1 - smooth((u - 0.86) / 0.14)) : 1;
    return r * (0.26 + 0.74 * Math.pow(Math.sin(Math.PI * u), 0.62)) * (0.3 + 0.7 * cap);
  };

  const outline = [ribbon(centre, half)];
  const detail: string[] = [];
  for (const k of [-0.62, -0.2, 0.2, 0.62]) {
    const pts: Pt[] = [];
    for (let i = Math.round(s * 44) + 1; i <= 42; i++) {
      const t = i / 44;
      const p = centre(t);
      pts.push([p[0] + half(t) * k, p[1]]);
    }
    detail.push(path(pts, false));
  }
  // Basal roots.
  const base = centre(1);
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * 2.6;
    detail.push(
      path([[base[0] + dx * 0.5, base[1] - 1], [base[0] + dx, base[1] + 6 + (i % 2) * 4]], false)
    );
  }
  // Blades.
  const neck = centre(Math.max(0.02, s * 0.6));
  for (let i = 0; i < 3; i++) {
    const dir = i === 1 ? 0 : i === 0 ? -1 : 1;
    const tip: Pt = [neck[0] + dir * (14 + rnd() * 8), neck[1] - 26 - rnd() * 12];
    outline.push(
      ribbon(quad(neck, [neck[0] + dir * 5, neck[1] - 18], tip), (t) => 3.2 * Math.sin(Math.PI * t) + 0.6, 18)
    );
  }
  return { outline, detail };
}

function drawHead(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.85;
  const ruffle = shape.ruffle ?? 0.3;
  const R = 30 + 12 * size;
  const cy = 78;
  const p1 = rnd() * 6;
  const outline = [
    polar(60, cy, (a) => R * (1 + 0.05 * Math.sin(3 * a + p1) + 0.03 * Math.cos(7 * a)), 0.9),
  ];
  const detail: string[] = [];
  // Wrapped leaves: nested arcs across the head.
  for (let i = 1; i <= 4; i++) {
    const k = i / 5;
    const w = R * (1 - k * 0.72);
    detail.push(
      path(
        [
          [60 - R * 0.92, cy + 6 - k * 4],
          [60 - w * 0.7, cy - R * 0.55 * (1 - k * 0.4)],
          [60, cy - R * 0.86 * (1 - k * 0.35)],
          [60 + w * 0.7, cy - R * 0.55 * (1 - k * 0.4)],
          [60 + R * 0.92, cy + 6 - k * 4],
        ],
        false
      )
    );
  }
  detail.push(path([[60, cy - R * 0.86], [60, cy + R * 0.7]], false));
  // Two outer leaves, ruffled at the edge.
  for (const dir of [-1, 1]) {
    const base: Pt = [60 + dir * R * 0.62, cy + R * 0.6];
    const tip: Pt = [60 + dir * (R + 22), cy + R * 0.05];
    outline.push(
      ribbon(
        quad(base, [60 + dir * (R + 10), cy + R * 0.8], tip),
        (t) => (9 + 5 * size) * Math.sin(Math.PI * t) * (1 + ruffle * 0.4 * Math.sin(t * 13)),
        26
      )
    );
  }
  return { outline, detail };
}

function drawKale(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.85;
  const ruffle = shape.ruffle ?? 0.6;
  const count = Math.max(4, Math.round(shape.count ?? 6));
  const stemTop = 44 - 12 * size;
  const stem = quad([60, 142], [58, 100], [60, stemTop]);
  const outline = [ribbon(stem, (t) => 4.2 - 1.8 * t, 20)];
  const detail: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = 0.18 + (i / (count - 1)) * 0.78;
    const base = stem(t);
    const dir = i % 2 ? 1 : -1;
    const jitter = rnd() * 0.5;
    const l = (26 + 22 * size) * (0.7 + 0.5 * t + jitter * 0.3);
    const lift = -0.55 - 0.5 * t;
    const tip: Pt = [base[0] + dir * l, base[1] + lift * l * 0.7];
    const mid: Pt = [base[0] + dir * l * 0.55, base[1] + lift * l * 0.15];
    outline.push(
      ribbon(
        quad(base, mid, tip),
        (u) =>
          (6.5 + 4 * size) *
          Math.sin(Math.PI * u) *
          (1 + ruffle * 0.55 * Math.sin(u * (9 + i)))
      )
    );
    detail.push(path([base, mid, tip], false));
  }
  return { outline, detail };
}

function drawRosette(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.8;
  const ruffle = shape.ruffle ?? 0.6;
  const R = 30 + 14 * size;
  const cy = 82;
  const outline: string[] = [];
  const detail: string[] = [];
  for (let i = 0; i < 3; i++) {
    const k = 1 - i * 0.3;
    const freq = 7 + i * 3 + Math.round(rnd() * 2);
    const ph = rnd() * 6;
    outline.push(
      polar(
        60,
        cy,
        (a) => R * k * (1 + (0.1 + ruffle * 0.14) * Math.sin(freq * a + ph)),
        0.82
      )
    );
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    detail.push(
      path(
        [
          [60 + Math.cos(a) * R * 0.14, cy + Math.sin(a) * R * 0.12],
          [60 + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.78],
        ],
        false
      )
    );
  }
  return { outline, detail };
}

function drawFruit(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.7;
  const lobes = Math.max(3, Math.round(shape.count ?? 5));
  const R = 24 + 15 * size;
  const cy = 84;
  const ph = rnd() * 3;
  const outline = [
    polar(60, cy, (a) => R * (1 + 0.05 * Math.cos(lobes * a + ph)), 0.88),
  ];
  const detail: string[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = ((i + 0.5) / lobes) * Math.PI * 2 + ph / lobes;
    detail.push(
      path(
        [
          [60 + Math.cos(a) * R * 0.06, cy - R * 0.6],
          [60 + Math.cos(a) * R * 0.75, cy + Math.sin(a) * R * 0.2],
          [60 + Math.cos(a) * R * 0.5, cy + R * 0.72],
        ],
        false
      )
    );
  }
  // Calyx and stalk.
  const top: Pt = [60, cy - R * 0.86];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.62;
    const tip: Pt = [top[0] + Math.cos(a) * 17, top[1] + Math.sin(a) * 13 + 4];
    outline.push(
      ribbon(quad(top, [top[0] + Math.cos(a) * 9, top[1] + Math.sin(a) * 8], tip), (t) => 2.6 * Math.sin(Math.PI * t) + 0.4, 14)
    );
  }
  detail.push(path([top, [top[0] + 1, top[1] - 13]], false));
  return { outline, detail };
}

function drawSpike(shape: Shape, rnd: () => number): Drawn {
  const size = shape.size ?? 0.8;
  const count = Math.max(5, Math.round(shape.count ?? 9));
  const rachis = quad([58, 140], [64, 100], [60, 46]);
  const outline = [ribbon(rachis, () => 1.5, 18)];
  const detail: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = 0.16 + (i / (count - 1)) * 0.82;
    const base = rachis(t);
    for (const dir of [-1, 1]) {
      const l = (11 + 5 * size) * (0.85 + rnd() * 0.25);
      const tip: Pt = [base[0] + dir * l * 0.62, base[1] - l];
      outline.push(
        ribbon(
          quad(base, [base[0] + dir * l * 0.55, base[1] - l * 0.4], tip),
          (u) => 2.9 * Math.sin(Math.PI * u) + 0.4,
          14
        )
      );
      const awn = 30 + 16 * size + rnd() * 8;
      detail.push(
        path(
          [tip, [tip[0] + dir * awn * 0.3, tip[1] - awn * 0.6], [tip[0] + dir * awn * 0.52, tip[1] - awn]],
          false
        )
      );
    }
  }
  return { outline, detail };
}

const DRAW: Record<PortraitForm, (s: Shape, r: () => number) => Drawn> = {
  pod: drawPod,
  root: drawRoot,
  gourd: drawGourd,
  bulb: drawBulb,
  head: drawHead,
  kale: drawKale,
  rosette: drawRosette,
  fruit: drawFruit,
  spike: drawSpike,
};

export default function Portrait({
  id,
  form,
  shape,
  complete,
  className,
}: {
  id: string;
  form: PortraitForm;
  shape: Shape;
  /** True when the variety is still in the collection: drawn with substance. */
  complete: boolean;
  className?: string;
}) {
  const { outline, detail, shading } = useMemo(() => {
    const rnd = makeRng(seedOf(id));
    const drawn = DRAW[form](shape, rnd);
    const marks: string[] = [];
    if (complete) {
      for (let x = -H; x < W + H; x += 3.4) {
        marks.push(path([[x, 0], [x + H, H]], false));
      }
    } else {
      const stip = makeRng(seedOf(`${id}-stipple`));
      for (let i = 0; i < 150; i++) {
        const x = stip() * W;
        const y = stip() * H;
        marks.push(path([[x, y], [x + 0.7, y]], false));
      }
    }
    return { ...drawn, shading: marks };
  }, [id, form, shape, complete]);

  const clip = `pt-${id}`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          {outline.map((d, i) => (
            <path d={d} key={i} />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`} opacity={complete ? 0.28 : 0.4}>
        {shading.map((d, i) => (
          <path
            d={d}
            key={i}
            fill="none"
            stroke="currentColor"
            strokeWidth={complete ? 0.55 : 1.1}
            strokeLinecap="round"
          />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
        {detail.map((d, i) => (
          <path d={d} key={`d${String(i)}`} strokeWidth={0.5} opacity={0.62} />
        ))}
        {outline.map((d, i) => (
          <path d={d} key={`o${String(i)}`} strokeWidth={1} />
        ))}
      </g>
    </svg>
  );
}
