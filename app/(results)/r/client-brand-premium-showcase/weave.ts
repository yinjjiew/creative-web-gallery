/**
 * Builds the geometry of a patch of two-and-two twill, yarn by yarn.
 *
 * Why this is here at all: the only thing about this coat that cannot be
 * photographed is what the cloth *is*. A photograph of tweed shows a surface. It
 * cannot show a single warp end travelling over two picks and under two through
 * the thickness of the cloth, cannot show the crimp that makes 640 g/m² warm
 * rather than merely heavy, and cannot attribute a difference between two years'
 * cloth to the thing that causes it — the evenness of the yarn. So the cloth is
 * modelled rather than pictured, and the model is driven by each lot's own
 * figures.
 *
 * WHAT IS REAL AND WHAT IS DRAWN. The interlacement, the sett (12 ends and 12
 * picks to the centimetre) and the yarn diameter are the mill's stated spec. The
 * yarn's unevenness along its length is generated from the lot's coefficient of
 * fibre-diameter variation and then exaggerated about three times, because at
 * true scale it is invisible on a screen. The interface says so beside the
 * figure. No claim is made that this is a scan of a real cloth; it is a drawing
 * with arithmetic behind it.
 *
 * Emits plain typed arrays so that `three` is only ever imported by the
 * component that mounts a canvas.
 */

export type WeaveParams = {
  /** Warp ends across the patch. */
  ends: number;
  /** Weft picks down the patch. */
  picks: number;
  /** Distance between yarn centres, mm. Twelve to the centimetre. */
  pitch: number;
  /** Yarn radius, mm. */
  radius: number;
  /**
   * Coefficient of variation of fibre diameter within the lot, per cent. Drives
   * how much the yarn's own diameter wanders along its length.
   */
  cv: number;
  /** Multiplier on the unevenness so that it is visible at screen scale. */
  exaggeration: number;
  /** Cloth colour, sRGB hex. */
  hex: string;
  /** Second cloth colour: kemp, a lighter sort, or a dye that took unevenly. */
  hexAlt: string;
  /** How strongly the two colours mix from yarn to yarn, 0–1. */
  mottle: number;
  /** Warp end to pick out in the stamp red, or null. */
  traced: number | null;
  /** Samples along each yarn. */
  segments: number;
  /** Vertices around each yarn. */
  sides: number;
};

export type WeaveGeometry = {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  /** Extent of the patch in mm, for the scale bar and the camera. */
  extent: number;
};

const TRACE_HEX = "#a03d20";
/** Yarns other than the traced one are washed out so the traced one reads. */
const MUTED_MIX = 0.62;
const MUTED_HEX = "#cfcabc";

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/**
 * three's colour management treats buffer colours as already being in the
 * linear working space, so an sRGB hex has to be converted or every cloth comes
 * out looking bleached.
 */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Deterministic hash so a lot always looks the same as itself. */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth, seeded, band-limited wobble in [-1, 1]. Three sines is plenty. */
function wobble(u: number, seed: number): number {
  return (
    (Math.sin(u * 11.3 + seed * 6.28) +
      Math.sin(u * 27.7 + seed * 2.71) * 0.6 +
      Math.sin(u * 61.1 + seed * 9.42) * 0.32) /
    1.92
  );
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * 2/2 twill. The end lifts over two picks, drops under two, and the whole
 * pattern steps one place sideways for every pick — which is what puts the
 * diagonal in a twill.
 */
function lifts(end: number, pick: number): boolean {
  return (((end + pick) % 4) + 4) % 4 < 2;
}

export function buildWeave(params: WeaveParams): WeaveGeometry {
  const { ends, picks, pitch, radius, segments, sides } = params;

  const halfW = ((ends - 1) * pitch) / 2;
  const halfH = ((picks - 1) * pitch) / 2;
  /** Yarns run a little past the patch so the edge reads as a cut edge. */
  const overhang = pitch * 1.2;
  /** Interlacement amplitude: warp and weft centres sit a radius either side. */
  const amp = radius * 0.98;
  const unevenness = Math.min(0.55, (params.cv / 100) * params.exaggeration);

  const base = hexToRgb(params.hex);
  const alt = hexToRgb(params.hexAlt);
  const trace = hexToRgb(TRACE_HEX);
  const muted = hexToRgb(MUTED_HEX);

  const yarnCount = ends + picks;
  const vertsPerYarn = segments * sides + 2;
  const trisPerYarn = (segments - 1) * sides * 2 + sides * 2;

  const positions = new Float32Array(yarnCount * vertsPerYarn * 3);
  const normals = new Float32Array(yarnCount * vertsPerYarn * 3);
  const colors = new Float32Array(yarnCount * vertsPerYarn * 3);
  const indices = new Uint32Array(yarnCount * trisPerYarn * 3);

  let vi = 0;
  let ii = 0;

  for (let yarn = 0; yarn < yarnCount; yarn += 1) {
    const isWarp = yarn < ends;
    const index = isWarp ? yarn : yarn - ends;
    const crossCount = isWarp ? picks : ends;
    const seed = hash(yarn * 3.17 + (isWarp ? 0 : 91.3));

    // Colour of this yarn: the two sorts of fleece in the lot, mixed per yarn.
    const isTraced = params.traced !== null && isWarp && index === params.traced;
    let yarnColor = mix(base, alt, hash(yarn * 7.91) * params.mottle);
    if (params.traced !== null) {
      yarnColor = isTraced ? trace : mix(yarnColor, muted, MUTED_MIX);
    }

    const along = isWarp ? -halfH - overhang : -halfW - overhang;
    const span = isWarp ? 2 * (halfH + overhang) : 2 * (halfW + overhang);
    const fixed = isWarp ? -halfW + index * pitch : -halfH + index * pitch;

    const yarnStart = vi;

    for (let sample = 0; sample < segments; sample += 1) {
      const u = sample / (segments - 1);
      const s = along + u * span;

      // Where this sample sits between two crossing yarns, and therefore
      // whether the yarn is riding over or under at this point.
      const crossPos = (s + (isWarp ? halfH : halfW)) / pitch;
      const j0 = Math.max(0, Math.min(crossCount - 2, Math.floor(crossPos)));
      const frac = Math.max(0, Math.min(1, crossPos - j0));
      const sign = (cross: number) => {
        const clamped = Math.max(0, Math.min(crossCount - 1, cross));
        const up = isWarp ? lifts(index, clamped) : !lifts(clamped, index);
        return up ? 1 : -1;
      };
      const z = (sign(j0) + (sign(j0 + 1) - sign(j0)) * smoothstep(frac)) * amp;

      // Tangent from the analytic derivative of the same interpolation, which
      // is cheaper and steadier than differencing neighbouring samples.
      const dz =
        ((sign(j0 + 1) - sign(j0)) * amp * 6 * frac * (1 - frac)) / pitch;

      const px = isWarp ? fixed : s;
      const py = isWarp ? s : fixed;

      let tx = isWarp ? 0 : 1;
      let ty = isWarp ? 1 : 0;
      let tz = dz;
      const tl = Math.hypot(tx, ty, tz);
      tx /= tl;
      ty /= tl;
      tz /= tl;

      // Frame against the cloth normal. Neither warp nor weft ever runs along
      // +Z, so this never degenerates.
      let nx = ty * 1 - tz * 0;
      let ny = tz * 0 - tx * 1;
      let nz = tx * 0 - ty * 0;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;

      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;

      // Yarn diameter wanders along its length. An uneven fleece — one flock,
      // one clip, wide fibre-diameter distribution — gives a yarn that does
      // this more, and that is the whole trade-off, made visible.
      const r =
        radius * (1 + unevenness * wobble(u * segments * 0.16, seed) * 0.5);
      // A slow drift in colour along the yarn, for the undyed lots where the
      // fleece was sorted by eye rather than measured.
      const shadeDrift = 1 + wobble(u * 3.1, seed + 4.4) * 0.06 * params.mottle;

      // 320–380 turns a metre over a patch this size is about five turns, and
      // the shading bands that follow the twist are what make a tube read as a
      // spun yarn. Kept in colour rather than in geometry: nine sides cannot
      // resolve a groove without aliasing into a mess.
      const turns = u * Math.PI * 2 * 5;

      for (let k = 0; k < sides; k += 1) {
        const theta = (k / sides) * Math.PI * 2;
        const rr = r;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        const o = vi * 3;
        positions[o] = px + (nx * cos + bx * sin) * rr;
        positions[o + 1] = py + (ny * cos + by * sin) * rr;
        positions[o + 2] = z + (nz * cos + bz * sin) * rr;

        normals[o] = nx * cos + bx * sin;
        normals[o + 1] = ny * cos + by * sin;
        normals[o + 2] = nz * cos + bz * sin;

        const shade = shadeDrift * (0.94 + 0.06 * Math.cos(2 * (theta + turns)));
        colors[o] = srgbToLinear(Math.min(1, yarnColor[0] * shade));
        colors[o + 1] = srgbToLinear(Math.min(1, yarnColor[1] * shade));
        colors[o + 2] = srgbToLinear(Math.min(1, yarnColor[2] * shade));

        vi += 1;
      }
    }

    // Cut ends, capped so the edge of the patch reads as cloth off the loom.
    for (const end of [0, 1] as const) {
      const ringStart = yarnStart + (end === 0 ? 0 : (segments - 1) * sides);
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let k = 0; k < sides; k += 1) {
        const o = (ringStart + k) * 3;
        cx += positions[o];
        cy += positions[o + 1];
        cz += positions[o + 2];
      }
      const centre = vi;
      const o = centre * 3;
      positions[o] = cx / sides;
      positions[o + 1] = cy / sides;
      positions[o + 2] = cz / sides;
      const dir = end === 0 ? -1 : 1;
      normals[o] = isWarp ? 0 : dir;
      normals[o + 1] = isWarp ? dir : 0;
      normals[o + 2] = 0;
      // Cut ends are paler: this is the inside of the yarn.
      colors[o] = srgbToLinear(Math.min(1, yarnColor[0] * 1.16));
      colors[o + 1] = srgbToLinear(Math.min(1, yarnColor[1] * 1.16));
      colors[o + 2] = srgbToLinear(Math.min(1, yarnColor[2] * 1.16));
      vi += 1;

      for (let k = 0; k < sides; k += 1) {
        const a = ringStart + k;
        const b = ringStart + ((k + 1) % sides);
        if (end === 0) {
          indices[ii] = centre;
          indices[ii + 1] = b;
          indices[ii + 2] = a;
        } else {
          indices[ii] = centre;
          indices[ii + 1] = a;
          indices[ii + 2] = b;
        }
        ii += 3;
      }
    }

    for (let sample = 0; sample < segments - 1; sample += 1) {
      for (let k = 0; k < sides; k += 1) {
        const a = yarnStart + sample * sides + k;
        const b = yarnStart + sample * sides + ((k + 1) % sides);
        const c = yarnStart + (sample + 1) * sides + ((k + 1) % sides);
        const d = yarnStart + (sample + 1) * sides + k;
        indices[ii] = a;
        indices[ii + 1] = b;
        indices[ii + 2] = c;
        indices[ii + 3] = a;
        indices[ii + 4] = c;
        indices[ii + 5] = d;
        ii += 6;
      }
    }
  }

  return {
    positions,
    normals,
    colors,
    indices,
    extent: Math.max(ends, picks) * pitch,
  };
}
