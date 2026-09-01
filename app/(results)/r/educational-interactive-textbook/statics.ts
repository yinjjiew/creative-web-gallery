/**
 * Plane statics for the chapter.
 *
 * Vertical loads only. A funicular (hanging chain, or the thrust line of an
 * arch) then has constant horizontal force H, and its ordinate is the
 * simply-supported bending moment of those loads divided by H. Sign: y is up.
 * A cable sags, y = chord − M/H. An arch rises, y = chord + M/H.
 *
 * This is graphic statics, not a time-stepping simulation. Infinite compressive
 * strength, no sliding, no tensile strength — Heyman's three assumptions.
 */

export type Pt = { x: number; y: number };

export type Load = {
  x: number;
  w: number;
};

export type Joint = {
  /** Intrados end of the joint (soffit). */
  inn: Pt;
  /** Extrados end of the joint. */
  out: Pt;
  /** Centerline point on the joint. */
  mid: Pt;
};

export type ArchKind = "circular" | "catenary" | "pointed";

export type ArchGeom = {
  kind: ArchKind;
  span: number;
  rise: number;
  thickness: number;
  joints: Joint[];
  loads: Load[];
  totalWeight: number;
  centerline: Pt[];
  intrados: Pt[];
  extrados: Pt[];
};

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(a: Pt, s: number): Pt {
  return { x: a.x * s, y: a.y * s };
}

export function norm(a: Pt): Pt {
  const n = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / n, y: a.y / n };
}

/** Unit normal pointing toward the extrados of a hill-shaped arch y(x). */
export function upNormal(tx: number, ty: number): Pt {
  return norm({ x: -ty, y: tx });
}

/**
 * Circle through the two springings (−L/2, 0), (L/2, 0) and the crown (0, rise).
 * For a semicircle, rise = L/2 and the centre sits on the springing line.
 */
export function circularRadius(span: number, rise: number): number {
  const half = span / 2;
  return (rise * rise + half * half) / (2 * rise);
}

export function circularCenter(rise: number, radius: number): Pt {
  return { x: 0, y: rise - radius };
}

/**
 * Catenary parameter a for a chain of span L and sag s:
 *   a (cosh(L / 2a) − 1) = s
 * Solved in the ξ = L / 2a variable, which is well-conditioned.
 */
export function catenaryA(span: number, sag: number): number {
  if (sag <= 1e-9) return 1e9;
  const target = (2 * sag) / span;
  let lo = 1e-6;
  let hi = 12;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    const val = (Math.cosh(mid) - 1) / mid;
    if (val < target) lo = mid;
    else hi = mid;
  }
  const xi = (lo + hi) / 2;
  return span / (2 * xi);
}

/** Hanging catenary through (±span/2, 0) with sag downward. y up, so mid is −sag. */
export function hangingCatenaryY(x: number, span: number, sag: number): number {
  const a = catenaryA(span, sag);
  return a * (Math.cosh(x / a) - 1) - sag;
}

/** Standing catenary through (±span/2, 0) with rise upward. */
export function standingCatenaryY(x: number, span: number, rise: number): number {
  const a = catenaryA(span, rise);
  return rise - a * (Math.cosh(x / a) - 1);
}

/**
 * Pointed (two-centre) arch of span L and rise r > L/2.
 * Centres sit on the springing line; the two arcs meet at a cusp at the crown.
 * When r = L/2 the construction collapses to a single semicircle.
 */
export function pointedCenters(span: number, rise: number): { cx: number; R: number } {
  const half = span / 2;
  const cx = (rise * rise - half * half) / span;
  const R = Math.hypot(cx, rise);
  return { cx, R };
}

export function pointedY(x: number, span: number, rise: number): number {
  const { cx, R } = pointedCenters(span, rise);
  if (x <= 0) {
    const dx = x - cx;
    return Math.sqrt(Math.max(0, R * R - dx * dx));
  }
  const dx = x + cx;
  return Math.sqrt(Math.max(0, R * R - dx * dx));
}

export function centerlineY(kind: ArchKind, x: number, span: number, rise: number): number {
  const half = span / 2;
  const xx = clamp(x, -half, half);
  if (kind === "catenary") return standingCatenaryY(xx, span, rise);
  if (kind === "pointed" && rise > span / 2 + 1e-6) return pointedY(xx, span, rise);
  const R = circularRadius(span, rise);
  const c = circularCenter(rise, R);
  return c.y + Math.sqrt(Math.max(0, R * R - xx * xx));
}

export function centerlineSlope(kind: ArchKind, x: number, span: number, rise: number): number {
  const h = span * 1e-4;
  return (centerlineY(kind, x + h, span, rise) - centerlineY(kind, x - h, span, rise)) / (2 * h);
}

function sampleXs(span: number, n: number): number[] {
  const half = span / 2;
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) xs.push(-half + (span * i) / n);
  return xs;
}

function offsetCurve(kind: ArchKind, span: number, rise: number, xs: number[], offset: number): Pt[] {
  return xs.map((x) => {
    const y = centerlineY(kind, x, span, rise);
    const dydx = centerlineSlope(kind, x, span, rise);
    const nrm = upNormal(1, dydx);
    return { x: x + nrm.x * offset, y: y + nrm.y * offset };
  });
}

/**
 * Build a plane arch. Voussoir weights sit at equal-arc-length centroids, so a
 * circular arch is heavier per unit of span near the springings — which is the
 * actual self-weight, not a uniform deck load.
 */
export function buildArch(
  kind: ArchKind,
  span: number,
  rise: number,
  thickness: number,
  nVoussoirs = 16,
): ArchGeom {
  const samples = 64;
  const xs = sampleXs(span, samples);
  const halfT = thickness / 2;
  const centerline = xs.map((x) => ({ x, y: centerlineY(kind, x, span, rise) }));
  const extrados = offsetCurve(kind, span, rise, xs, halfT);
  const intrados = offsetCurve(kind, span, rise, xs, -halfT);

  const joints: Joint[] = [];
  const loads: Load[] = [];
  const n = nVoussoirs;

  const arcXs: number[] = [];
  const arcLen: number[] = [0];
  let total = 0;
  const fine = sampleXs(span, n * 12);
  for (let i = 0; i < fine.length; i++) {
    arcXs.push(fine[i]);
    if (i > 0) {
      const a = { x: fine[i - 1], y: centerlineY(kind, fine[i - 1], span, rise) };
      const b = { x: fine[i], y: centerlineY(kind, fine[i], span, rise) };
      total += dist(a, b);
      arcLen.push(total);
    }
  }

  const atArc = (s: number): number => {
    const target = clamp(s, 0, total);
    for (let i = 1; i < arcLen.length; i++) {
      if (arcLen[i] >= target) {
        const t = (target - arcLen[i - 1]) / (arcLen[i] - arcLen[i - 1] || 1);
        return arcXs[i - 1] + (arcXs[i] - arcXs[i - 1]) * t;
      }
    }
    return arcXs[arcXs.length - 1];
  };

  for (let i = 0; i <= n; i++) {
    const x = atArc((total * i) / n);
    const y = centerlineY(kind, x, span, rise);
    const dydx = centerlineSlope(kind, x, span, rise);
    const nrm = upNormal(1, dydx);
    const mid = { x, y };
    joints.push({
      mid,
      inn: { x: x - nrm.x * halfT, y: y - nrm.y * halfT },
      out: { x: x + nrm.x * halfT, y: y + nrm.y * halfT },
    });
  }

  for (let i = 0; i < n; i++) {
    const x = atArc((total * (i + 0.5)) / n);
    const a = joints[i].mid;
    const b = joints[i + 1].mid;
    loads.push({ x, w: dist(a, b) * thickness });
  }

  const totalWeight = loads.reduce((s, l) => s + l.w, 0);
  return {
    kind,
    span,
    rise,
    thickness,
    joints,
    loads,
    totalWeight,
    centerline,
    intrados,
    extrados,
  };
}

export function beamReactions(loads: Load[], x0: number, x1: number): { Ra: number; Rb: number } {
  const L = x1 - x0;
  const momentAboutLeft = loads.reduce((s, l) => s + l.w * (l.x - x0), 0);
  const Rb = momentAboutLeft / L;
  const W = loads.reduce((s, l) => s + l.w, 0);
  return { Ra: W - Rb, Rb };
}

/** Sagging moment of downward point loads on a simply-supported span. */
export function beamMoment(loads: Load[], x: number, x0: number, x1: number): number {
  const { Ra } = beamReactions(loads, x0, x1);
  let M = Ra * (x - x0);
  for (const l of loads) {
    if (l.x < x - 1e-12) M -= l.w * (x - l.x);
  }
  return M;
}

/**
 * Thrust-line ordinate. y up. The line runs from `start` to a point with the
 * same construction at `end`. H is the (constant) horizontal thrust.
 */
export function thrustY(loads: Load[], x: number, H: number, start: Pt, end: Pt): number {
  const L = end.x - start.x;
  const momentAboutEnd = loads.reduce((s, l) => s + l.w * (end.x - l.x), 0);
  const V0 = (H * (end.y - start.y) + momentAboutEnd) / L;
  return (
    start.y +
    (1 / H) *
      (V0 * (x - start.x) -
        loads.filter((l) => l.x < x - 1e-12).reduce((s, l) => s + l.w * (x - l.x), 0))
  );
}

export function thrustPoints(loads: Load[], H: number, start: Pt, end: Pt, n = 56): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = start.x + ((end.x - start.x) * i) / n;
    pts.push({ x, y: thrustY(loads, x, H, start, end) });
  }
  return pts;
}

export function hangingPoints(loads: Load[], H: number, start: Pt, end: Pt, n = 56): Pt[] {
  const arch = thrustPoints(loads, H, start, end, n);
  const chord = (x: number) => start.y + ((end.y - start.y) * (x - start.x)) / (end.x - start.x);
  return arch.map((p) => ({ x: p.x, y: 2 * chord(p.x) - p.y }));
}

export function jointParam(joint: Joint, pt: Pt): number {
  const vx = joint.out.x - joint.inn.x;
  const vy = joint.out.y - joint.inn.y;
  const wx = pt.x - joint.inn.x;
  const wy = pt.y - joint.inn.y;
  const d = vx * vx + vy * vy || 1;
  return (wx * vx + wy * vy) / d;
}

/**
 * Where the thrust line crosses a joint, as a parameter s:
 * 0 at the intrados, 1 at the extrados. Outside the masonry if s ∉ [0, 1].
 */
export function jointS(joint: Joint, loads: Load[], H: number, start: Pt, end: Pt): number {
  const g = (s: number) => {
    const p = lerp(joint.inn, joint.out, s);
    return thrustY(loads, p.x, H, start, end) - p.y;
  };
  const dx = joint.out.x - joint.inn.x;
  if (Math.abs(dx) < 1e-8) {
    const x = joint.mid.x;
    const y = thrustY(loads, x, H, start, end);
    return (y - joint.inn.y) / (joint.out.y - joint.inn.y || 1);
  }
  let lo = -1.5;
  let hi = 2.5;
  let glo = g(lo);
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const gm = g(mid);
    if (glo * gm <= 0) {
      hi = mid;
    } else {
      lo = mid;
      glo = gm;
    }
  }
  return (lo + hi) / 2;
}

export type ThrustReport = {
  points: Pt[];
  start: Pt;
  end: Pt;
  H: number;
  jointS: number[];
  /** Max |s − 0.5| × 2: 0 on the centreline, 1 at a face, >1 outside. */
  maxEcc: number;
  /** Joints where |s − 0.5| ≥ 1/3 — tension has appeared (middle-third). */
  tensionJoints: number[];
  /** Joints where s is outside [0, 1] — a hinge, or worse. */
  hingeJoints: number[];
  inside: boolean;
  inKern: boolean;
};

export function eccentricityOf(s: number): number {
  return Math.abs(s - 0.5) * 2;
}

export function reportThrust(
  arch: ArchGeom,
  H: number,
  eLeft: number,
  eRight: number,
  extra: Load[] = [],
): ThrustReport {
  const loads = arch.loads.concat(extra);
  const j0 = arch.joints[0];
  const j1 = arch.joints[arch.joints.length - 1];
  const start = lerp(j0.inn, j0.out, (eLeft + 1) / 2);
  const end = lerp(j1.inn, j1.out, (eRight + 1) / 2);
  const points = thrustPoints(loads, H, start, end);
  const ss = arch.joints.map((j) => jointS(j, loads, H, start, end));
  const eccs = ss.map(eccentricityOf);
  const maxEcc = eccs.reduce((m, e) => Math.max(m, e), 0);
  const tensionJoints = ss
    .map((s, i) => (eccentricityOf(s) > 1 / 3 + 1e-6 ? i : -1))
    .filter((i) => i >= 0);
  const hingeJoints = ss
    .map((s, i) => (s < -0.01 || s > 1.01 ? i : -1))
    .filter((i) => i >= 0);
  return {
    points,
    start,
    end,
    H,
    jointS: ss,
    maxEcc,
    tensionJoints,
    hingeJoints,
    inside: maxEcc <= 1 + 1e-3,
    inKern: maxEcc <= 1 / 3 + 1e-3,
  };
}

/**
 * Search H and the two springing eccentricities for the safest thrust line
 * (smallest peak eccentricity). Used when the figure should show whether *any*
 * line still lives in the masonry.
 */
export function safestThrust(arch: ArchGeom, extra: Load[] = []): ThrustReport {
  const W = arch.totalWeight + extra.reduce((s, l) => s + l.w, 0);
  const Mmid = beamMoment(
    arch.loads.concat(extra),
    0,
    -arch.span / 2,
    arch.span / 2,
  );
  const H0 = Math.max(Mmid / Math.max(arch.rise, 1e-6), W * 0.08);
  let best: ThrustReport | null = null;
  const Hfactors = [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05, 1.2, 1.4, 1.7, 2.1, 2.6];
  const es = [-0.85, -0.5, -0.2, 0, 0.2, 0.5, 0.85];
  for (const f of Hfactors) {
    for (const eL of es) {
      for (const eR of es) {
        const r = reportThrust(arch, H0 * f, eL, eR, extra);
        if (!best || r.maxEcc < best.maxEcc) best = r;
      }
    }
  }
  return best ?? reportThrust(arch, H0, 0, 0, extra);
}

/** H that sends the three-hinge funicular through the two springing mid-points and the crown mid-point. */
export function threeHingeH(arch: ArchGeom, extra: Load[] = []): number {
  const loads = arch.loads.concat(extra);
  const x0 = arch.joints[0].mid.x;
  const x1 = arch.joints[arch.joints.length - 1].mid.x;
  const y0 = arch.joints[0].mid.y;
  const y1 = arch.joints[arch.joints.length - 1].mid.y;
  const xc = 0;
  const yc = centerlineY(arch.kind, xc, arch.span, arch.rise);
  const chord = y0 + ((y1 - y0) * (xc - x0)) / (x1 - x0);
  const M = beamMoment(loads, xc, x0, x1);
  return M / Math.max(yc - chord, 1e-6);
}

export function pathFrom(pts: Pt[]): string {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(4)} ${p.y.toFixed(4)}`)
    .join(" ");
}

export function closedPath(outer: Pt[], inner: Pt[]): string {
  const back = inner.slice().reverse();
  return `${pathFrom(outer)} ${pathFrom(back).replace(/^M/, "L")} Z`;
}

export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Pt {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** viewBox → model, given a group translate(ox, oy) scale(s, −s). */
export function viewToModel(p: Pt, ox: number, oy: number, s: number): Pt {
  return { x: (p.x - ox) / s, y: (oy - p.y) / s };
}

export function modelToView(p: Pt, ox: number, oy: number, s: number): Pt {
  return { x: ox + p.x * s, y: oy - p.y * s };
}

/** Typical hinge angles (from the left springing, as a fraction of joints) for a spreading semicircle. */
export function mechanismHinges(nJoints: number): [number, number, number, number] {
  const last = nJoints - 1;
  const leftHaunch = Math.round(last * 0.33);
  const rightHaunch = Math.round(last * 0.67);
  return [0, leftHaunch, rightHaunch, last];
}

export function rotateAbout(p: Pt, origin: Pt, ang: number): Pt {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const x = p.x - origin.x;
  const y = p.y - origin.y;
  return { x: origin.x + c * x - s * y, y: origin.y + s * x + c * y };
}

/**
 * Four-hinge spreading mechanism. The two horns rotate about the springing
 * hinges; the crown is a rigid body that follows the two haunch hinges.
 * `progress` is a kinematic illustration, not a dynamics integration.
 */
function bandSlice(arch: ArchGeom, i0: number, i1: number): Pt[] {
  const n = arch.extrados.length - 1;
  const lastJ = arch.joints.length - 1;
  const a = Math.round((i0 / lastJ) * n);
  const b = Math.round((i1 / lastJ) * n);
  return [...arch.extrados.slice(a, b + 1), ...arch.intrados.slice(a, b + 1).reverse()];
}

/** Map a rigid body from hinge pair (P, Q) onto (P′, Q′). */
function mapRigid(pts: Pt[], fromP: Pt, fromQ: Pt, toP: Pt, toQ: Pt): Pt[] {
  const old = sub(fromQ, fromP);
  const neu = sub(toQ, toP);
  const oldLen2 = old.x * old.x + old.y * old.y || 1;
  const nOld = { x: -old.y, y: old.x };
  const nNew = { x: -neu.y, y: neu.x };
  return pts.map((p) => {
    const rel = sub(p, fromP);
    const t = (rel.x * old.x + rel.y * old.y) / oldLen2;
    const nCoord = (rel.x * nOld.x + rel.y * nOld.y) / oldLen2;
    return add(add(toP, mul(neu, t)), mul(nNew, nCoord));
  });
}

export function spreadMechanism(
  arch: ArchGeom,
  progress: number,
): { left: Pt[]; crown: Pt[]; right: Pt[]; hinges: Pt[] } {
  const [iA, iB, iC, iD] = mechanismHinges(arch.joints.length);
  const A = arch.joints[iA].inn;
  const B = arch.joints[iB].out;
  const C = arch.joints[iC].out;
  const D = arch.joints[iD].inn;
  const ang = progress * 0.16;
  const Bp = rotateAbout(B, A, -ang);
  const Cp = rotateAbout(C, D, ang);
  return {
    left: mapRigid(bandSlice(arch, iA, iB), A, B, A, Bp),
    crown: mapRigid(bandSlice(arch, iB, iC), B, C, Bp, Cp),
    right: mapRigid(bandSlice(arch, iC, iD), D, C, D, Cp),
    hinges: [A, Bp, Cp, D],
  };
}
