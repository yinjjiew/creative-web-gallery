/**
 * A cloth is warp, weft, and a binary lift at every crossing.
 * Yarns do not mix. Tone is which thread is on the face.
 */

export type RGB = [number, number, number];

export type Yarn = { name: string; rgb: RGB };

export type Palette = {
  id: string;
  name: string;
  note: string;
  yarns: Yarn[];
};

export type Draft = {
  id: string;
  name: string;
  /** Repeating unit; true = warp on the face. */
  unit: boolean[][];
};

export type Cloth = {
  cols: number;
  rows: number;
  /** Warp yarn index per end, length = cols. */
  warp: Uint8Array;
  /** Weft yarn index per pick, length = rows. */
  weft: Uint8Array;
  /** true = warp up. Length = cols * rows, row-major. */
  lift: Uint8Array;
  palette: Palette;
  draft: Draft;
};

export const PALETTES: Palette[] = [
  {
    id: "fleece",
    name: "Fleece",
    note: "Undyed hoggett and a little soot",
    yarns: [
      { name: "bone", rgb: [236, 226, 208] },
      { name: "oatmeal", rgb: [196, 176, 148] },
      { name: "fawn", rgb: [158, 124, 92] },
      { name: "ash", rgb: [132, 128, 120] },
      { name: "slate", rgb: [78, 76, 74] },
      { name: "soot", rgb: [28, 26, 24] },
    ],
  },
  {
    id: "indigo",
    name: "Vat",
    note: "Calico dressed in the vat",
    yarns: [
      { name: "calico", rgb: [236, 228, 210] },
      { name: "mist", rgb: [164, 184, 196] },
      { name: "woad", rgb: [74, 110, 148] },
      { name: "vat", rgb: [28, 52, 96] },
      { name: "midnight", rgb: [14, 22, 40] },
    ],
  },
  {
    id: "madder",
    name: "Madder",
    note: "Root, rust, and a cream warp",
    yarns: [
      { name: "cream", rgb: [240, 226, 204] },
      { name: "blush", rgb: [214, 154, 138] },
      { name: "brick", rgb: [164, 64, 52] },
      { name: "umber", rgb: [92, 52, 36] },
      { name: "pitch", rgb: [32, 22, 18] },
    ],
  },
  {
    id: "ink",
    name: "Ink",
    note: "Two yarns. The brutal case",
    yarns: [
      { name: "paper", rgb: [236, 230, 216] },
      { name: "ink", rgb: [18, 18, 16] },
    ],
  },
  {
    id: "copper",
    name: "Verdigris",
    note: "Linen, moss, and oxidised metal",
    yarns: [
      { name: "linen", rgb: [228, 216, 188] },
      { name: "sage", rgb: [148, 160, 124] },
      { name: "moss", rgb: [72, 96, 68] },
      { name: "copper", rgb: [168, 96, 56] },
      { name: "pitch", rgb: [24, 28, 26] },
    ],
  },
];

function row(bits: number[]): boolean[] {
  return bits.map((b) => b === 1);
}

export const DRAFTS: Draft[] = [
  {
    id: "tabby",
    name: "Tabby",
    unit: [row([1, 0]), row([0, 1])],
  },
  {
    id: "twill22",
    name: "Twill 2/2",
    unit: [row([1, 1, 0, 0]), row([0, 1, 1, 0]), row([0, 0, 1, 1]), row([1, 0, 0, 1])],
  },
  {
    id: "twill31",
    name: "Twill 3/1",
    unit: [row([1, 1, 1, 0]), row([0, 1, 1, 1]), row([1, 0, 1, 1]), row([1, 1, 0, 1])],
  },
  {
    id: "satin",
    name: "Satin 5",
    unit: [
      row([1, 0, 0, 0, 0]),
      row([0, 0, 1, 0, 0]),
      row([0, 0, 0, 0, 1]),
      row([0, 1, 0, 0, 0]),
      row([0, 0, 0, 1, 0]),
    ],
  },
  {
    id: "basket",
    name: "Basket",
    unit: [row([1, 1, 0, 0]), row([1, 1, 0, 0]), row([0, 0, 1, 1]), row([0, 0, 1, 1])],
  },
  {
    id: "herring",
    name: "Herringbone",
    unit: [
      row([1, 1, 0, 0, 0, 0, 1, 1]),
      row([0, 1, 1, 0, 0, 1, 1, 0]),
      row([0, 0, 1, 1, 1, 1, 0, 0]),
      row([1, 0, 0, 1, 1, 0, 0, 1]),
    ],
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function draftById(id: string): Draft {
  return DRAFTS.find((d) => d.id === id) ?? DRAFTS[0];
}

function dist2(a: RGB, b: RGB): number {
  const r = a[0] - b[0];
  const g = a[1] - b[1];
  const bl = a[2] - b[2];
  return 0.3 * r * r + 0.59 * g * g + 0.11 * bl * bl;
}

function sampleBilinear(src: ImageData, u: number, v: number): RGB {
  const w = src.width;
  const h = src.height;
  const x = Math.max(0, Math.min(w - 1.001, u * w - 0.5));
  const y = Math.max(0, Math.min(h - 1.001, v * h - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const d = src.data;
  const at = (ix: number, iy: number): RGB => {
    const o = (iy * w + ix) * 4;
    return [d[o], d[o + 1], d[o + 2]];
  };
  const a = at(x0, y0);
  const b = at(x1, y0);
  const c = at(x0, y1);
  const e = at(x1, y1);
  const mix = (p: RGB, q: RGB, t: number): RGB => [
    p[0] + (q[0] - p[0]) * t,
    p[1] + (q[1] - p[1]) * t,
    p[2] + (q[2] - p[2]) * t,
  ];
  return mix(mix(a, b, fx), mix(c, e, fx), fy);
}

function draftLift(draft: Draft, i: number, j: number): boolean {
  const u = draft.unit;
  const row = u[j % u.length];
  return row[i % row.length];
}

function luma(c: RGB): number {
  return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
}

function splitYarns(yarns: Yarn[]): { dark: Yarn[]; light: Yarn[] } {
  const order = yarns.map((y, i) => ({ y, i, l: luma(y.rgb) })).sort((a, b) => a.l - b.l);
  if (order.length === 1) return { dark: yarns, light: yarns };
  if (order.length === 2) {
    return { dark: [order[0].y], light: [order[1].y] };
  }
  const mid = Math.ceil(order.length / 2);
  return {
    dark: order.slice(0, mid).map((x) => x.y),
    light: order.slice(mid).map((x) => x.y),
  };
}

function yarnIndex(yarns: Yarn[], yarn: Yarn): number {
  const i = yarns.indexOf(yarn);
  return i >= 0 ? i : 0;
}

/**
 * Dark yarns dress the warp, light yarns dress the weft — the mill constraint
 * that makes a picture possible. Each end / pick is still one yarn. The
 * repeating draft is honoured on close calls; Jacquard inverts a crossing
 * only when one yarn is a clearly better match. Residual is diffused, never
 * mixed onto a thread.
 */
export function weave(
  source: ImageData,
  palette: Palette,
  draft: Draft,
  sett: number,
): Cloth {
  const aspect = source.height / source.width;
  const cols = Math.max(16, Math.round(sett));
  const rows = Math.max(16, Math.round(sett * aspect));
  const yarns = palette.yarns;
  const { dark, light } = splitYarns(yarns);

  const cells: RGB[] = new Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      cells[j * cols + i] = sampleBilinear(
        source,
        (i + 0.5) / cols,
        (j + 0.5) / rows,
      );
    }
  }

  const warp = new Uint8Array(cols);
  const weft = new Uint8Array(rows);

  // Repeating colourway: dark ends, light picks. A column never averages
  // the whole picture into mud; tone is which yarn is on the face.
  for (let i = 0; i < cols; i++) {
    warp[i] = yarnIndex(yarns, dark[i % dark.length]);
  }
  for (let j = 0; j < rows; j++) {
    weft[j] = yarnIndex(yarns, light[j % light.length]);
  }

  const lift = decideLifts(cells, cols, rows, warp, weft, yarns, draft);
  return { cols, rows, warp, weft, lift, palette, draft };
}

function decideLifts(
  cells: RGB[],
  cols: number,
  rows: number,
  warp: Uint8Array,
  weft: Uint8Array,
  yarns: Yarn[],
  draft: Draft,
  into?: Uint8Array,
): Uint8Array {
  const lift = into ?? new Uint8Array(cols * rows);
  const errR = new Float32Array(cols * rows);
  const errG = new Float32Array(cols * rows);
  const errB = new Float32Array(cols * rows);

  const push = (i: number, j: number, w: number, r: number, g: number, b: number) => {
    if (i < 0 || i >= cols || j < 0 || j >= rows) return;
    const o = j * cols + i;
    errR[o] += r * w;
    errG[o] += g * w;
    errB[o] += b * w;
  };

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const o = j * cols + i;
      const src = cells[o];
      const target: RGB = [
        src[0] + errR[o],
        src[1] + errG[o],
        src[2] + errB[o],
      ];
      const wr = yarns[warp[i]].rgb;
      const wf = yarns[weft[j]].rgb;
      const drafted = draftLift(draft, i, j);
      const srcL = luma(target);
      const wL = luma(wr);
      const fL = luma(wf);
      // The repeating draft is the dither. Tone is which yarn clears the
      // threshold — never a mix, never a tint of the source.
      const threshold = (wL + fL) / 2 + (drafted ? -16 : 16);
      const warpIsLighter = wL > fL;
      const eWarp = dist2(target, wr);
      const eWeft = dist2(target, wf);
      const warpUp =
        Math.abs(eWarp - eWeft) > 2200
          ? eWarp < eWeft
          : srcL > threshold
            ? warpIsLighter
            : !warpIsLighter;
      lift[o] = warpUp ? 1 : 0;
      const shown = warpUp ? wr : wf;
      const r = target[0] - shown[0];
      const g = target[1] - shown[1];
      const b = target[2] - shown[2];
      push(i + 1, j, 7 / 16, r, g, b);
      push(i - 1, j + 1, 3 / 16, r, g, b);
      push(i, j + 1, 5 / 16, r, g, b);
      push(i + 1, j + 1, 1 / 16, r, g, b);
    }
  }
  return lift;
}

export function faceYarn(cloth: Cloth, i: number, j: number): { yarn: Yarn; warpUp: boolean } {
  const { cols, warp, weft, lift, palette } = cloth;
  const o = j * cols + i;
  const warpUp = lift[o] === 1;
  const idx = warpUp ? warp[i] : weft[j];
  return { yarn: palette.yarns[idx], warpUp };
}

/** Tiny 4-column window of the repeating draft, for the ticket chips. */
export function draftPreview(draft: Draft): boolean[] {
  const out: boolean[] = [];
  for (let j = 0; j < 4; j++) {
    const row = draft.unit[j % draft.unit.length];
    for (let i = 0; i < 4; i++) out.push(row[i % row.length]);
  }
  return out;
}

