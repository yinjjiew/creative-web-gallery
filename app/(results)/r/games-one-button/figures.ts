/**
 * Silhouettes.
 *
 * Both performers are drawn as one stick skeleton, stroked in solid black with
 * round joins so the limbs fuse into a single shape. Everything is measured in
 * metres and posed in a local frame where "up" is towards the pivot, which is
 * why the same figure reads correctly hanging from a bar, folded into a tuck, or
 * inverted over a catch bar: the pose is expressed relative to the body, and the
 * body is rotated by the physics.
 *
 * No sprites, no image assets. A poster is drawn, not stamped.
 */

export interface P {
  x: number;
  y: number;
}

export interface Pose {
  /** Lean of the torso away from the body axis. */
  torso: number;
  /** Hip fold. 0 is a straight line from shoulder to foot. */
  hip: number;
  /** Knee bend. */
  knee: number;
  /** Arm angle from the torso axis. 0 reaches straight overhead. */
  shoulder: number;
  elbow: number;
  /** Separation between the near and far limb of a pair, for a little depth. */
  splay: number;
}

export const POSES = {
  /** Standing on the board, both hands up on the fly bar. */
  board: { torso: 0.03, hip: 0.03, knee: 0.1, shoulder: 0.0, elbow: 0.06, splay: 0.26 },
  /** Hanging off the bar, stretched, on the way through the bottom. */
  hang: { torso: 0.0, hip: -0.2, knee: 0.26, shoulder: 0.0, elbow: 0.08, splay: 0.24 },
  /** The forward beat: hips lead, legs sweep well ahead. */
  beatFwd: { torso: -0.14, hip: -0.66, knee: 0.28, shoulder: 0.0, elbow: 0.06, splay: 0.2 },
  /** The back beat: arched, knees breaking, legs swept behind. */
  beatBack: { torso: 0.18, hip: 0.66, knee: 0.78, shoulder: 0.0, elbow: 0.05, splay: 0.2 },
  /** In the air, stretched, hands out for the catcher. */
  fly: { torso: 0.0, hip: -0.34, knee: 0.24, shoulder: -0.62, elbow: 0.16, splay: 0.28 },
  /** Tucked for a somersault: knees to chest, hands on the shins. */
  tuck: { torso: 0.6, hip: -2.25, knee: 2.3, shoulder: -1.75, elbow: 1.1, splay: 0.12 },
  /** Caught: hanging from the catcher's wrists, legs long. */
  caught: { torso: 0.05, hip: 0.3, knee: 0.44, shoulder: 0.0, elbow: 0.08, splay: 0.24 },
  /** Loose, on the way to the net. */
  loose: { torso: 0.24, hip: -0.9, knee: 1.0, shoulder: -1.3, elbow: 0.65, splay: 0.42 },
  /** Sitting in the net. */
  netted: { torso: 0.62, hip: -1.7, knee: 1.5, shoulder: -1.0, elbow: 0.6, splay: 0.45 },
} satisfies Record<string, Pose>;

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const m = (x: number, y: number) => x + (y - x) * t;
  return {
    torso: m(a.torso, b.torso),
    hip: m(a.hip, b.hip),
    knee: m(a.knee, b.knee),
    shoulder: m(a.shoulder, b.shoulder),
    elbow: m(a.elbow, b.elbow),
    splay: m(a.splay, b.splay),
  };
}

/* Segment lengths, metres. A 1.78 m performer. */
const HIP_DROP = 0.2;
const TORSO = 0.56;
const NECK = 0.15;
const HEAD_R = 0.115;
const UPPER_ARM = 0.31;
const FOREARM = 0.31;
const THIGH = 0.45;
const SHIN = 0.44;

const rot = (v: P, a: number): P => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};
const add = (a: P, b: P, k = 1): P => ({ x: a.x + b.x * k, y: a.y + b.y * k });

export interface Skeleton {
  hip: P;
  shoulder: P;
  head: P;
  /** Two arms and two legs, near limb first. */
  arms: [P, P][];
  legs: [P, P][];
}

/**
 * Build the joint positions in world space.
 *
 * `root` is the centre of mass, `angle` rotates the whole body (0 = head up),
 * and `reach` optionally aims the arms at a point in the world, which is what
 * makes a flyer visibly ask for the catcher's hands.
 */
export function skeleton(
  root: P,
  angle: number,
  pose: Pose,
  reach?: P | null
): Skeleton {
  const up = rot({ x: 0, y: -1 }, angle);
  const hip = add(root, up, -HIP_DROP);
  const torsoDir = rot(up, pose.torso);
  const shoulder = add(hip, torsoDir, TORSO);
  const head = add(shoulder, torsoDir, NECK + HEAD_R);

  const arms: [P, P][] = [];
  for (const side of [1, -1]) {
    if (reach) {
      // Holding or asking for something specific: solve the arm so the hand is
      // exactly on it. Both elbows break the same way, as real ones do —
      // breaking them opposite ways only widens the torso into a wedge.
      arms.push(
        twoBone(shoulder, reach, UPPER_ARM, FOREARM, side > 0 ? 1 : 0.55)
      );
      continue;
    }
    const dir = rot(torsoDir, pose.shoulder + side * pose.splay * 0.5);
    const elbow = add(shoulder, dir, UPPER_ARM);
    const hand = add(elbow, rot(dir, side * pose.elbow), FOREARM);
    arms.push([elbow, hand]);
  }

  const legs: [P, P][] = [];
  const down = { x: -up.x, y: -up.y };
  for (const side of [1, -1]) {
    const dir = rot(down, pose.hip + side * pose.splay * 0.6);
    const knee = add(hip, dir, THIGH);
    const foot = add(knee, rot(dir, -pose.knee), SHIN);
    legs.push([knee, foot]);
  }

  return { hip, shoulder, head, arms, legs };
}

export interface Brush {
  /** World metres → screen pixels. */
  to: (p: P) => P;
  scale: number;
  ctx: CanvasRenderingContext2D;
}

function stroke(b: Brush, a: P, c: P, width: number) {
  const p = b.to(a);
  const q = b.to(c);
  b.ctx.lineWidth = Math.max(1.1, width * b.scale);
  b.ctx.beginPath();
  b.ctx.moveTo(p.x, p.y);
  b.ctx.lineTo(q.x, q.y);
  b.ctx.stroke();
}

export function drawSkeleton(b: Brush, s: Skeleton, weight = 1) {
  const { ctx } = b;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Far limbs first, a shade thinner, so the figure has a front and a back.
  stroke(b, s.hip, s.arms[1][0], 0.0);
  stroke(b, s.arms[1][0], s.arms[1][1], 0.075 * weight);
  stroke(b, s.shoulder, s.arms[1][0], 0.08 * weight);
  stroke(b, s.hip, s.legs[1][0], 0.105 * weight);
  stroke(b, s.legs[1][0], s.legs[1][1], 0.08 * weight);

  stroke(b, s.hip, s.shoulder, 0.185 * weight);
  stroke(b, s.hip, s.legs[0][0], 0.135 * weight);
  stroke(b, s.legs[0][0], s.legs[0][1], 0.1 * weight);
  stroke(b, s.shoulder, s.arms[0][0], 0.1 * weight);
  stroke(b, s.arms[0][0], s.arms[0][1], 0.09 * weight);

  const h = b.to(s.head);
  ctx.beginPath();
  ctx.arc(h.x, h.y, HEAD_R * b.scale * weight, 0, Math.PI * 2);
  ctx.fill();
}

/** Mean hand position, which is where chalk leaves the fingers. */
export function hands(s: Skeleton): P {
  return {
    x: (s.arms[0][1].x + s.arms[1][1].x) / 2,
    y: (s.arms[0][1].y + s.arms[1][1].y) / 2,
  };
}

/**
 * Two-bone inverse kinematics, so a hand lands exactly where it is reaching and
 * the elbow breaks to one side instead of the arm reading as one straight line.
 */
function twoBone(
  shoulder: P,
  target: P,
  upper: number,
  fore: number,
  side: number
): [P, P] {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  let d = Math.hypot(dx, dy);
  const reach = upper + fore;
  if (d < 1e-4) d = 1e-4;
  const ux = dx / d;
  const uy = dy / d;
  const dc = Math.min(d, reach * 0.995);
  const a = (dc * dc + upper * upper - fore * fore) / (2 * dc);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const elbow = {
    x: shoulder.x + ux * a - uy * h * side,
    y: shoulder.y + uy * a + ux * h * side,
  };
  const hand = { x: shoulder.x + ux * dc, y: shoulder.y + uy * dc };
  return [elbow, hand];
}

/**
 * The catcher, hanging by the knees over the catch bar with arms extended.
 *
 * Built outwards from the bar along the cable, with a slight counter-lean at the
 * hips so the body is an S rather than a stick, and the arms solved so the hands
 * sit exactly on the hand radius the simulation uses for the catch. The shins
 * fold back above the bar, which is the shape that makes a knee hang legible.
 */
export function catcherSkeleton(
  bar: P,
  handTarget: P,
  outward: P,
  swingTheta: number
): Skeleton {
  const down = outward;
  const up = { x: -down.x, y: -down.y };
  const sign = Math.sign(swingTheta || 1);
  const lean = 0.3 * sign;

  const knee = { x: bar.x, y: bar.y };
  const hip = add(knee, rot(down, -lean), 0.55);
  const torsoDir = rot(down, lean * 0.62);
  const shoulder = add(hip, torsoDir, 0.68);
  const head = add(shoulder, rot(torsoDir, lean * 0.5), NECK + HEAD_R);

  const arms: [P, P][] = [
    twoBone(shoulder, handTarget, UPPER_ARM, FOREARM, 1),
    twoBone(shoulder, handTarget, UPPER_ARM, FOREARM, 0.5),
  ];

  // Shins folded back over the bar, crossing it at an angle: that crossing is
  // the single detail that makes a knee hang legible in silhouette.
  const legs: [P, P][] = [];
  for (const side of [1, -1]) {
    const dir = rot(up, side * 0.22 + 0.62 * sign);
    const foot = add(knee, dir, SHIN * 0.86);
    legs.push([knee, foot]);
  }

  return { hip, shoulder, head, arms, legs };
}
