/**
 * A sheet of xuan: long fibres in a mould direction, faint laid lines, pulp
 * clouds, and the occasional bark speck. The ink later has to negotiate this
 * field — absorbency, sizing, height and grain are not decoration. They are
 * the conductivity the water walks.
 */

export type SheetMaps = {
  width: number;
  height: number;
  /** RGB albedo, A = height. */
  albedo: Uint8Array;
  /** R fibre angle, G absorbency, B height, A sizing. */
  props: Uint8Array;
};

const clamp = (x: number, lo: number, hi: number) =>
  x < lo ? lo : x > hi ? hi : x;

function hash(ix: number, iy: number, seed: number) {
  const n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.709) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(
  x: number,
  y: number,
  seed: number,
  octaves: number,
  lacunarity = 2,
  gain = 0.5,
) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  let n = 0;
  for (let i = 0; i < octaves; i++) {
    v += a * valueNoise(x * f, y * f, seed + i * 19);
    n += a;
    a *= gain;
    f *= lacunarity;
  }
  return v / n;
}

export function makeSheet(
  width: number,
  height: number,
  seed: number,
): SheetMaps {
  const albedo = new Uint8Array(width * height * 4);
  const props = new Uint8Array(width * height * 4);
  const aspect = width / Math.max(height, 1);

  // Mould grain: slightly off the long side, with a slow wander.
  const grain = 0.11 + (hash(seed, 3, 1) - 0.5) * 0.08;
  const cg = Math.cos(grain);
  const sg = Math.sin(grain);

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const px = u * aspect;
      const py = v;

      const along = px * cg + py * sg;
      const across = -px * sg + py * cg;

      // Stretched noise is the fibre itself — long in the grain, short across.
      const fibre =
        fbm(along * 22, across * 3.1, seed + 2, 5) * 0.72 +
        fbm(along * 54, across * 9.5, seed + 5, 3) * 0.28;

      const pulp = fbm(px * 3.2, py * 3.4, seed + 8, 4);
      const flock = fbm(px * 11, py * 12, seed + 11, 3);

      // Laid lines from the mould screen: a faint ridge every few millimetres.
      const laid = 0.5 + 0.5 * Math.sin(across * Math.PI * 46 + fibre * 1.4);
      const chain = 0.5 + 0.5 * Math.sin(along * Math.PI * 7.5);

      const wander = (fbm(px * 1.6, py * 1.7, seed + 14, 3) - 0.5) * 0.16;
      const angle = clamp((grain + wander + (fibre - 0.5) * 0.12) / Math.PI, 0, 1);

      const heightField = clamp(
        0.42 +
          (fibre - 0.5) * 0.38 +
          (pulp - 0.5) * 0.16 +
          (laid - 0.5) * 0.1 +
          (chain - 0.5) * 0.04 +
          (flock - 0.5) * 0.12,
        0,
        1,
      );

      // Unsized patches drink; sized patches resist. Both exist on one sheet.
      const absorbency = clamp(
        0.48 + (pulp - 0.5) * 0.5 + (fibre - 0.5) * 0.22 + (flock - 0.5) * 0.18,
        0.12,
        0.95,
      );
      const sizing = clamp(
        0.4 + (0.5 - pulp) * 0.35 + (hash(x, y, seed + 21) - 0.5) * 0.08,
        0.08,
        0.88,
      );

      // Bark specks — a few dark inclusions in the furnish.
      const speckN = hash(x, y, seed + 29);
      const speck = speckN > 0.996 ? (speckN - 0.996) / 0.004 : 0;

      const warm = 0.84 + (pulp - 0.5) * 0.07 + (fibre - 0.5) * 0.06;
      const green = 0.802 + (pulp - 0.5) * 0.055 + (fibre - 0.5) * 0.04 - speck * 0.28;
      const cool = 0.718 + (pulp - 0.5) * 0.04 - (laid - 0.5) * 0.03 - speck * 0.26;

      const i = (y * width + x) * 4;
      albedo[i] = clamp(warm * 255, 0, 255);
      albedo[i + 1] = clamp(green * 255, 0, 255);
      albedo[i + 2] = clamp(cool * 255, 0, 255);
      albedo[i + 3] = heightField * 255;

      props[i] = angle * 255;
      props[i + 1] = absorbency * 255;
      props[i + 2] = heightField * 255;
      props[i + 3] = sizing * 255;
    }
  }

  return { width, height, albedo, props };
}
