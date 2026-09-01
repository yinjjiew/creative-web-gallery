/** Japan Trench window, Tohoku segment. Units are kilometres unless noted. */

export const ORIGIN_LAT = 38.3;
export const ORIGIN_LON = 142.2;
export const LAT_MIN = 36.2;
export const LAT_MAX = 41.0;
export const LON_MIN = 139.15;
export const LON_MAX = 145.05;

export const KM_PER_DEG_LAT = 110.947;
export const KM_PER_DEG_LON =
  111.32 * Math.cos((ORIGIN_LAT * Math.PI) / 180);

export const DEPTH_MAX_KM = 280;
export const VE_DEFAULT = 2;
export const STRIKE_RAD = (15 * Math.PI) / 180;

/** Pacific coast of Tohoku, south to north. Generalised. */
export const COAST: [number, number][] = [
  [36.2, 140.58],
  [36.55, 140.72],
  [36.95, 140.9],
  [37.35, 141.02],
  [37.75, 141.0],
  [38.05, 140.92],
  [38.28, 141.08],
  [38.42, 141.32],
  [38.68, 141.52],
  [39.0, 141.78],
  [39.35, 141.98],
  [39.65, 142.02],
  [39.95, 141.96],
  [40.25, 141.83],
  [40.55, 141.52],
  [41.0, 141.38],
];

/** Trench axis, south to north. After USGS Slab2 Japan trench. */
export const TRENCH: [number, number][] = [
  [36.2, 142.95],
  [36.6, 143.28],
  [37.0, 143.55],
  [37.4, 143.78],
  [37.8, 143.96],
  [38.2, 144.06],
  [38.6, 144.14],
  [39.0, 144.18],
  [39.4, 144.16],
  [39.8, 144.06],
  [40.2, 143.88],
  [40.6, 143.68],
  [41.0, 143.48],
];

/**
 * Distance west of the trench (km) → interface depth (km).
 * Piecewise fit to USGS Slab2 Japan contours near 38°N (Hayes et al. 2018).
 */
const SLAB_PROFILE: [number, number][] = [
  [0, 0],
  [40, 9],
  [80, 15],
  [120, 20],
  [160, 26],
  [200, 38],
  [240, 54],
  [280, 76],
  [320, 104],
  [360, 140],
  [400, 182],
  [440, 228],
  [480, 278],
];

export function lonToX(lon: number) {
  return (lon - ORIGIN_LON) * KM_PER_DEG_LON;
}

export function latToZ(lat: number) {
  return (lat - ORIGIN_LAT) * KM_PER_DEG_LAT;
}

export function depthToY(depthKm: number, ve: number) {
  return -depthKm * ve;
}

export function xToLon(x: number) {
  return ORIGIN_LON + x / KM_PER_DEG_LON;
}

export function zToLat(z: number) {
  return ORIGIN_LAT + z / KM_PER_DEG_LAT;
}

function interpLon(lat: number, line: [number, number][]) {
  if (lat <= line[0][0]) return line[0][1];
  const last = line[line.length - 1];
  if (lat >= last[0]) return last[1];
  for (let i = 1; i < line.length; i++) {
    const [aLat, aLon] = line[i - 1];
    const [bLat, bLon] = line[i];
    if (lat <= bLat) {
      const t = (lat - aLat) / (bLat - aLat);
      return aLon + t * (bLon - aLon);
    }
  }
  return last[1];
}

export function trenchLon(lat: number) {
  return interpLon(lat, TRENCH);
}

export function coastLon(lat: number) {
  return interpLon(lat, COAST);
}

export function interpProfile(kmWest: number) {
  if (kmWest <= SLAB_PROFILE[0][0]) return SLAB_PROFILE[0][1];
  const last = SLAB_PROFILE[SLAB_PROFILE.length - 1];
  if (kmWest >= last[0]) return last[1];
  for (let i = 1; i < SLAB_PROFILE.length; i++) {
    const [ax, ad] = SLAB_PROFILE[i - 1];
    const [bx, bd] = SLAB_PROFILE[i];
    if (kmWest <= bx) {
      const t = (kmWest - ax) / (bx - ax);
      return ad + t * (bd - ad);
    }
  }
  return last[1];
}

/** Modelled Slab2 interface depth, or null if east of the outer-rise window. */
export function slabDepthKm(lon: number, lat: number): number | null {
  const west = (trenchLon(lat) - lon) * KM_PER_DEG_LON;
  if (west < -40 || west > 490) return null;
  if (west < 0) return Math.max(0, -west * 0.12);
  return interpProfile(west);
}

export function extentKm() {
  return {
    west: lonToX(LON_MIN),
    east: lonToX(LON_MAX),
    south: latToZ(LAT_MIN),
    north: latToZ(LAT_MAX),
  };
}

export function inWindow(lat: number, lon: number) {
  return (
    lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX
  );
}
