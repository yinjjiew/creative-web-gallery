/**
 * Nested mobile as an XPBD tree of rigid triangles.
 *
 * Each arm is a bearing hung on a drop wire, then a rigid triangle: the
 * bearing sits slightly above the bar (stable, long-period) with two ends.
 * A child hangs from a parent's end, so a shove on a leaf is a force on one
 * mass; the constraints walk that impulse up the armature, across the sibling,
 * and back down. A weak torsional memory in the wire returns the designed
 * silhouette over the same long settle. Nothing here is keyed.
 */

export type Particle = {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  pz: number;
  fx: number;
  fy: number;
  fz: number;
  invMass: number;
  mass: number;
};

export type Constraint = {
  a: number;
  b: number;
  rest: number;
  lambda: number;
};

export type LeafId =
  | "wrack"
  | "glass"
  | "limpet"
  | "stone"
  | "mussel"
  | "brick"
  | "drift";

export type Arm = {
  id: string;
  hang: number;
  pivot: number;
  left: number;
  right: number;
  restYaw: number;
  rise: number;
  span: number;
  leftLen: number;
  rightLen: number;
};

export type Leaf = {
  id: LeafId;
  particle: number;
  arm: number;
  end: "left" | "right";
};

export type Mobile = {
  particles: Particle[];
  constraints: Constraint[];
  arms: Arm[];
  leaves: Leaf[];
  hook: number;
  rootPivot: number;
};

export type Grab = {
  particle: number;
  x: number;
  y: number;
  z: number;
  strength: number;
};

const G = 7.4;
const ITERATIONS = 36;
const YAW_K = 0.07;
const AIR = 0.00105;
const HARD_AIR = 0.0055;
const RELAX_STEPS = 20;
const SETTLE_STEPS = 120;
const COMPLIANCE = 4e-7;
const SLEEP_E = 0.0007;

export const LEAF_MASS: Record<LeafId, number> = {
  wrack: 1.72,
  glass: 0.52,
  limpet: 0.48,
  stone: 0.34,
  mussel: 0.86,
  brick: 0.7,
  drift: 0.64,
};

type EndSpec = { leaf: LeafId } | { child: Omit<ArmSpec, "id">; id: string };

type ArmSpec = {
  id: string;
  span: number;
  rise: number;
  drop: number;
  yaw: number;
  left: EndSpec;
  right: EndSpec;
};

/**
 * Proportions first, then the pivot walks to the centre of mass so each
 * arm hangs level. Heavier side sits closer to the bearing — the usual
 * maker's correction, not a visual cheat.
 */
const DESIGN: ArmSpec = {
  id: "root",
  span: 1.86,
  rise: 0.068,
  drop: 0.7,
  yaw: 0.3,
  left: {
    id: "west",
    child: {
      span: 0.9,
      rise: 0.048,
      drop: 0.46,
      yaw: -0.74,
      left: { leaf: "wrack" },
      right: {
        id: "inlet",
        child: {
          span: 0.56,
          rise: 0.038,
          drop: 0.32,
          yaw: 0.98,
          left: { leaf: "glass" },
          right: {
            id: "pocket",
            child: {
              span: 0.34,
              rise: 0.03,
              drop: 0.22,
              yaw: -0.44,
              left: { leaf: "limpet" },
              right: { leaf: "stone" },
            },
          },
        },
      },
    },
  },
  right: {
    id: "east",
    child: {
      span: 1.14,
      rise: 0.052,
      drop: 0.42,
      yaw: 1.16,
      left: {
        id: "cove",
        child: {
          span: 0.52,
          rise: 0.036,
          drop: 0.26,
          yaw: -0.9,
          left: { leaf: "mussel" },
          right: { leaf: "brick" },
        },
      },
      right: { leaf: "drift" },
    },
  },
};

const JOINT = 0.14;
const BAR = 0.09;

function particle(x: number, y: number, z: number, mass: number): Particle {
  return {
    x,
    y,
    z,
    px: x,
    py: y,
    pz: z,
    fx: 0,
    fy: 0,
    fz: 0,
    invMass: mass > 0 ? 1 / mass : 0,
    mass,
  };
}

function endMass(end: EndSpec): number {
  if ("leaf" in end) return LEAF_MASS[end.leaf] + BAR;
  return JOINT + BAR + subtreeMass(end.child);
}

function subtreeMass(spec: Omit<ArmSpec, "id">): number {
  return JOINT + endMass(spec.left) + endMass(spec.right);
}

function split(span: number, mL: number, mR: number) {
  const t = mL + mR;
  return {
    leftLen: (span * mR) / t,
    rightLen: (span * mL) / t,
  };
}

export function createMobile(hookY = 4.26): Mobile {
  const particles: Particle[] = [];
  const constraints: Constraint[] = [];
  const arms: Arm[] = [];
  const leaves: Leaf[] = [];

  const hook = 0;
  particles.push(particle(0.08, hookY, -0.28, 0));

  function attach(spec: ArmSpec, hangIndex: number, yaw: number): number {
    const hangP = particles[hangIndex];
    const pivotIndex = particles.length;
    particles.push(
      particle(hangP.x, hangP.y - spec.drop, hangP.z, JOINT)
    );
    constraints.push({ a: hangIndex, b: pivotIndex, rest: spec.drop, lambda: 0 });

    const mL = endMass(spec.left);
    const mR = endMass(spec.right);
    const { leftLen, rightLen } = split(spec.span, mL, mR);
    const piv = particles[pivotIndex];
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);

    const leftIndex = particles.length;
    particles.push(
      particle(
        piv.x - cy * leftLen,
        piv.y - spec.rise,
        piv.z - sy * leftLen,
        "leaf" in spec.left ? LEAF_MASS[spec.left.leaf] + BAR : JOINT + BAR
      )
    );
    const rightIndex = particles.length;
    particles.push(
      particle(
        piv.x + cy * rightLen,
        piv.y - spec.rise,
        piv.z + sy * rightLen,
        "leaf" in spec.right ? LEAF_MASS[spec.right.leaf] + BAR : JOINT + BAR
      )
    );

    const hypL = Math.hypot(leftLen, spec.rise);
    const hypR = Math.hypot(rightLen, spec.rise);
    constraints.push({ a: pivotIndex, b: leftIndex, rest: hypL, lambda: 0 });
    constraints.push({ a: pivotIndex, b: rightIndex, rest: hypR, lambda: 0 });
    constraints.push({
      a: leftIndex,
      b: rightIndex,
      rest: leftLen + rightLen,
      lambda: 0,
    });

    const armIndex = arms.length;
    arms.push({
      id: spec.id,
      hang: hangIndex,
      pivot: pivotIndex,
      left: leftIndex,
      right: rightIndex,
      restYaw: yaw,
      rise: spec.rise,
      span: spec.span,
      leftLen,
      rightLen,
    });

    const hangEnd = (end: EndSpec, index: number, side: "left" | "right") => {
      if ("leaf" in end) {
        leaves.push({ id: end.leaf, particle: index, arm: armIndex, end: side });
        return;
      }
      attach({ ...end.child, id: end.id }, index, yaw + end.child.yaw);
    };

    hangEnd(spec.left, leftIndex, "left");
    hangEnd(spec.right, rightIndex, "right");
    return armIndex;
  }

  attach(DESIGN, hook, DESIGN.yaw);
  const rootPivot = arms[0]?.pivot ?? 1;

  const mobile: Mobile = {
    particles,
    constraints,
    arms,
    leaves,
    hook,
    rootPivot,
  };
  relax(mobile);
  settle(mobile);
  return mobile;
}

function solve(mobile: Mobile, dt: number) {
  const { particles: ps, constraints } = mobile;
  const alpha = COMPLIANCE / (dt * dt);
  for (const c of constraints) c.lambda = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    for (const c of constraints) {
      const a = ps[c.a];
      const b = ps[c.b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < 1e-8) continue;
      const w = a.invMass + b.invMass;
      if (w === 0) continue;
      const C = d - c.rest;
      const dlambda = (-C - alpha * c.lambda) / (w + alpha);
      c.lambda += dlambda;
      // ∇C is −n on a and +n on b; x += w · ∇C · Δλ.
      const inv = dlambda / d;
      const sx = dx * inv;
      const sy = dy * inv;
      const sz = dz * inv;
      a.x -= sx * a.invMass;
      a.y -= sy * a.invMass;
      a.z -= sz * a.invMass;
      b.x += sx * b.invMass;
      b.y += sy * b.invMass;
      b.z += sz * b.invMass;
    }
  }
}

function zeroVel(mobile: Mobile) {
  for (const p of mobile.particles) {
    p.px = p.x;
    p.py = p.y;
    p.pz = p.z;
    p.fx = 0;
    p.fy = 0;
    p.fz = 0;
  }
}

function relax(mobile: Mobile) {
  const dt = 1 / 120;
  for (let i = 0; i < RELAX_STEPS; i++) solve(mobile, dt);
  zeroVel(mobile);
}

function settle(mobile: Mobile) {
  const dt = 1 / 120;
  for (let i = 0; i < SETTLE_STEPS; i++) {
    stepMobile(mobile, dt, null, null, true, true);
  }
  zeroVel(mobile);
}

function applyYawMemory(mobile: Mobile) {
  const { particles: ps } = mobile;
  for (const arm of mobile.arms) {
    const l = ps[arm.left];
    const r = ps[arm.right];
    const bx = r.x - l.x;
    const bz = r.z - l.z;
    const len = Math.hypot(bx, bz);
    if (len < 1e-5) continue;
    const nx = bx / len;
    const nz = bz / len;
    const rx = Math.cos(arm.restYaw);
    const rz = Math.sin(arm.restYaw);
    const angle = Math.atan2(nx * rz - nz * rx, nx * rx + nz * rz);
    const f = YAW_K * angle;
    const px = -nz;
    const pz = nx;
    const wL = l.mass;
    const wR = r.mass;
    l.fx -= px * f * wL;
    l.fz -= pz * f * wL;
    r.fx += px * f * wR;
    r.fz += pz * f * wR;
  }
}

export function energy(mobile: Mobile, dt: number) {
  let e = 0;
  const inv = 1 / dt;
  for (const p of mobile.particles) {
    if (p.invMass === 0) continue;
    const vx = (p.x - p.px) * inv;
    const vy = (p.y - p.py) * inv;
    const vz = (p.z - p.pz) * inv;
    e += 0.5 * p.mass * (vx * vx + vy * vy + vz * vz);
  }
  return e;
}

export function stepMobile(
  mobile: Mobile,
  dt: number,
  grab: Grab | null,
  impulse: { particle: number; x: number; y: number; z: number } | null,
  reduce: boolean,
  awake = false
) {
  const { particles: ps } = mobile;
  const dt2 = dt * dt;
  const drag = reduce ? HARD_AIR : AIR;

  if (impulse) {
    const p = ps[impulse.particle];
    if (p && p.invMass > 0) {
      p.px -= impulse.x * p.invMass * dt;
      p.py -= impulse.y * p.invMass * dt;
      p.pz -= impulse.z * p.invMass * dt;
    }
  }

  if (!awake && !grab && !impulse && energy(mobile, dt) < SLEEP_E) {
    zeroVel(mobile);
    return;
  }

  for (const p of ps) {
    p.fx = 0;
    p.fy = p.invMass === 0 ? 0 : -G * p.mass;
    p.fz = 0;
  }

  applyYawMemory(mobile);

  if (grab) {
    const p = ps[grab.particle];
    if (p && p.invMass > 0) {
      const vx = (p.x - p.px) / dt;
      const vy = (p.y - p.py) / dt;
      const vz = (p.z - p.pz) / dt;
      const k = (reduce ? 18 : 36) * grab.strength * p.mass;
      const c = (reduce ? 6 : 9) * p.mass;
      p.fx += (grab.x - p.x) * k - vx * c;
      p.fy += (grab.y - p.y) * k - vy * c;
      p.fz += (grab.z - p.z) * k - vz * c;
    }
  }

  for (const p of ps) {
    if (p.invMass === 0) continue;
    const vx = (p.x - p.px) * (1 - drag);
    const vy = (p.y - p.py) * (1 - drag);
    const vz = (p.z - p.pz) * (1 - drag);
    p.px = p.x;
    p.py = p.y;
    p.pz = p.z;
    p.x += vx + p.fx * p.invMass * dt2;
    p.y += vy + p.fy * p.invMass * dt2;
    p.z += vz + p.fz * p.invMass * dt2;
  }

  solve(mobile, dt);

  const h = ps[mobile.hook];
  h.x = h.px;
  h.y = h.py;
  h.z = h.pz;
}

export function leafById(mobile: Mobile, id: LeafId) {
  return mobile.leaves.find((leaf) => leaf.id === id) ?? mobile.leaves[0];
}

export function restImpulse(
  mobile: Mobile,
  particle: number,
  scale: number
) {
  const p = mobile.particles[particle];
  const cx = 0.08;
  const cz = -0.28;
  let dx = p.x - cx;
  let dz = p.z - cz;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  return {
    particle,
    x: dx * scale,
    y: 0.12 * scale,
    z: dz * scale,
  };
}
