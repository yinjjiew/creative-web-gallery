/**
 * XPBD cloth for a gathered length of heavy silk.
 *
 * Stretch is nearly rigid (charmeuse does not give on the bias the way jersey
 * does). Bend is almost free — that is the drape. A heavier hem, like a sewn
 * weight, keeps the line of the bottom edge. The top is pinned closer than the
 * rest width so the extra cloth has to buckle into folds.
 */

export const COLS = 16;
export const ROWS = 22;
export const WIDTH = 1;
export const REST = WIDTH / COLS;
export const HEIGHT = ROWS * REST;
export const GATHER = 0.7;

const GRAVITY = -11.2;
const DAMPING = 0.028;
const STRETCH_COMP = 2e-8;
const SHEAR_COMP = 5e-7;
const BEND_COMP = 1.6e-3;
const ITERATIONS = 10;
const MAX_SPEED = 6.4;
const FLOOR_FRICTION = 0.42;
const WALL_Z = -0.1;
const FRONT_Z = 0.38;

export const FLOOR = -HEIGHT * 0.5 - 0.16;
export const RAIL_Y = HEIGHT * 0.5 + 0.008;
export const RAIL_WIDTH = WIDTH * GATHER + 0.1;

type Kind = "stretch" | "shear" | "bend";

type Particle = {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  pz: number;
  w: number;
  w0: number;
  pinned: boolean;
  pinX: number;
  pinY: number;
  pinZ: number;
  col: number;
  row: number;
};

type Constraint = {
  a: number;
  b: number;
  rest: number;
  compliance: number;
  lambda: number;
  alive: boolean;
  kind: Kind;
};

type Face = {
  a: number;
  b: number;
  c: number;
  alive: boolean;
};

export type Mode = "grab" | "pin" | "cut";

function idx(col: number, row: number) {
  return row * (COLS + 1) + col;
}

function segsCross(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const cdx = dx - cx;
  const cdy = dy - cy;
  const den = abx * cdy - aby * cdx;
  if (Math.abs(den) < 1e-10) return false;
  const acx = cx - ax;
  const acy = cy - ay;
  const t = (acx * cdy - acy * cdx) / den;
  const u = (acx * aby - acy * abx) / den;
  return t > 0.002 && t < 0.998 && u > 0.002 && u < 0.998;
}

export class Cloth {
  readonly particles: Particle[] = [];
  readonly constraints: Constraint[] = [];
  readonly faces: Face[] = [];
  readonly count: number;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly tangents: Float32Array;
  readonly uvs: Float32Array;
  indices: Uint16Array;

  grabbed: number[] = [];
  grabOX: number[] = [];
  grabOY: number[] = [];
  grabOZ: number[] = [];

  private facesDirty = true;

  constructor() {
    this.count = (COLS + 1) * (ROWS + 1);
    this.positions = new Float32Array(this.count * 3);
    this.normals = new Float32Array(this.count * 3);
    this.tangents = new Float32Array(this.count * 3);
    this.uvs = new Float32Array(this.count * 2);
    this.indices = new Uint16Array(COLS * ROWS * 6);
    this.seed();
    this.sync();
  }

  reset() {
    this.grabbed.length = 0;
    this.seed();
    this.sync();
  }

  dropRail() {
    for (const p of this.particles) {
      if (p.row === 0 && p.pinned) {
        p.pinned = false;
        p.w = p.w0;
      }
    }
  }

  nearest(x: number, y: number, maxDist: number) {
    let best = -1;
    let bestD = maxDist * maxDist;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  beginGrab(i: number) {
    this.releaseGrab();
    const origin = this.particles[i];
    const cluster = [i];
    for (const c of this.constraints) {
      if (!c.alive || c.kind === "bend") continue;
      const other = c.a === i ? c.b : c.b === i ? c.a : -1;
      if (other >= 0 && !cluster.includes(other)) cluster.push(other);
    }
    this.grabbed = cluster;
    for (const g of cluster) {
      const p = this.particles[g];
      this.grabOX.push(p.x - origin.x);
      this.grabOY.push(p.y - origin.y);
      this.grabOZ.push(p.z - origin.z);
      p.w = 0;
      p.px = p.x;
      p.py = p.y;
      p.pz = p.z;
    }
  }

  moveGrab(x: number, y: number, z: number) {
    for (let n = 0; n < this.grabbed.length; n++) {
      const p = this.particles[this.grabbed[n]];
      p.x = x + this.grabOX[n];
      p.y = y + this.grabOY[n];
      p.z = z + this.grabOZ[n];
      p.px = p.x;
      p.py = p.y;
      p.pz = p.z;
    }
  }

  releaseGrab() {
    for (const i of this.grabbed) {
      const p = this.particles[i];
      if (!p.pinned) p.w = p.w0;
    }
    this.grabbed.length = 0;
    this.grabOX.length = 0;
    this.grabOY.length = 0;
    this.grabOZ.length = 0;
  }

  togglePin(i: number) {
    const p = this.particles[i];
    if (this.grabbed.includes(i)) return p.pinned;
    p.pinned = !p.pinned;
    if (p.pinned) {
      p.pinX = p.x;
      p.pinY = p.y;
      p.pinZ = p.z;
      p.w = 0;
    } else {
      p.w = p.w0;
    }
    return p.pinned;
  }

  cutSegment(ax: number, ay: number, bx: number, by: number) {
    if ((bx - ax) ** 2 + (by - ay) ** 2 < REST * REST * 0.04) return false;
    let cut = false;
    for (const c of this.constraints) {
      if (!c.alive || c.kind === "bend") continue;
      const pa = this.particles[c.a];
      const pb = this.particles[c.b];
      if (segsCross(ax, ay, bx, by, pa.x, pa.y, pb.x, pb.y)) {
        this.killConstraint(c);
        cut = true;
      }
    }
    if (cut) this.facesDirty = true;
    return cut;
  }

  step(dt: number, breeze: number) {
    const dt2 = dt * dt;
    for (const p of this.particles) {
      if (p.w === 0) {
        if (p.pinned) {
          p.x = p.pinX;
          p.y = p.pinY;
          p.z = p.pinZ;
          p.px = p.x;
          p.py = p.y;
          p.pz = p.z;
        }
        continue;
      }
      let vx = p.x - p.px;
      let vy = p.y - p.py;
      let vz = p.z - p.pz;
      const wind =
        breeze *
        Math.sin(p.x * 5.2 + p.y * 2.1 + p.row * 0.15) *
        (p.row / ROWS);
      vx = (vx + wind * dt2) * (1 - DAMPING);
      vy = (vy + GRAVITY * dt2) * (1 - DAMPING);
      vz = (vz + wind * 0.45 * dt2) * (1 - DAMPING);
      const speed = Math.hypot(vx, vy, vz);
      if (speed > MAX_SPEED * dt) {
        const s = (MAX_SPEED * dt) / speed;
        vx *= s;
        vy *= s;
        vz *= s;
      }
      p.px = p.x;
      p.py = p.y;
      p.pz = p.z;
      p.x += vx;
      p.y += vy;
      p.z += vz;
    }

    for (const c of this.constraints) c.lambda = 0;

    for (let k = 0; k < ITERATIONS; k++) {
      for (const c of this.constraints) {
        if (!c.alive) continue;
        if (c.kind === "bend" && k % 2 === 1) continue;
        this.project(c, dt);
      }
      this.holdPins();
      this.limitStretch();
    }

    this.collide();
    this.holdPins();
    this.sync();
  }

  private seed() {
    this.particles.length = 0;
    this.constraints.length = 0;
    this.faces.length = 0;
    this.facesDirty = true;

    const topY = HEIGHT * 0.5;

    for (let j = 0; j <= ROWS; j++) {
      for (let i = 0; i <= COLS; i++) {
        const u = i / COLS;
        const v = j / ROWS;
        const gathered = (u - 0.5) * GATHER;
        const x0 = j === 0 ? gathered : u - 0.5;
        const z0 = 0.055 * Math.sin(u * Math.PI * 4) * v;
        const hem = j === ROWS ? 0.55 : 1;
        const p: Particle = {
          x: x0,
          y: topY - j * REST,
          z: z0,
          px: x0,
          py: topY - j * REST,
          pz: z0,
          w: j === 0 ? 0 : hem,
          w0: hem,
          pinned: j === 0,
          pinX: gathered,
          pinY: topY,
          pinZ: 0,
          col: i,
          row: j,
        };
        this.particles.push(p);
        const o = this.particles.length - 1;
        this.uvs[o * 2] = u;
        this.uvs[o * 2 + 1] = 1 - v;
      }
    }

    const add = (
      a: number,
      b: number,
      rest: number,
      compliance: number,
      kind: Kind,
    ) => {
      const c: Constraint = {
        a,
        b,
        rest,
        compliance,
        lambda: 0,
        alive: true,
        kind,
      };
      this.constraints.push(c);
    };

    for (let j = 0; j <= ROWS; j++) {
      for (let i = 0; i <= COLS; i++) {
        const a = idx(i, j);
        if (i < COLS) add(a, idx(i + 1, j), REST, STRETCH_COMP, "stretch");
        if (j < ROWS) add(a, idx(i, j + 1), REST, STRETCH_COMP, "stretch");
        if (i < COLS && j < ROWS) {
          const diag = REST * Math.SQRT2;
          add(a, idx(i + 1, j + 1), diag, SHEAR_COMP, "shear");
          add(idx(i + 1, j), idx(i, j + 1), diag, SHEAR_COMP, "shear");
        }
        if (i < COLS - 1) add(a, idx(i + 2, j), REST * 2, BEND_COMP, "bend");
        if (j < ROWS - 1) add(a, idx(i, j + 2), REST * 2, BEND_COMP, "bend");
      }
    }

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const a = idx(i, j);
        const b = idx(i + 1, j);
        const c = idx(i, j + 1);
        const d = idx(i + 1, j + 1);
        this.faces.push({ a, b, c, alive: true });
        this.faces.push({ a: b, b: d, c, alive: true });
      }
    }
  }

  warm(steps: number) {
    const dt = 1 / 120;
    for (let i = 0; i < steps; i++) this.step(dt, 0);
  }

  private project(c: Constraint, dt: number) {
    const pa = this.particles[c.a];
    const pb = this.particles[c.b];
    let dx = pa.x - pb.x;
    let dy = pa.y - pb.y;
    let dz = pa.z - pb.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1e-7) return;
    const w = pa.w + pb.w;
    if (w < 1e-8) return;
    const C = dist - c.rest;
    const alpha = c.compliance / (dt * dt);
    const dLambda = (-C - alpha * c.lambda) / (w + alpha);
    c.lambda += dLambda;
    const s = dLambda / dist;
    pa.x += s * dx * pa.w;
    pa.y += s * dy * pa.w;
    pa.z += s * dz * pa.w;
    pb.x -= s * dx * pb.w;
    pb.y -= s * dy * pb.w;
    pb.z -= s * dz * pb.w;
  }

  private holdPins() {
    for (const p of this.particles) {
      if (!p.pinned) continue;
      p.x = p.pinX;
      p.y = p.pinY;
      p.z = p.pinZ;
    }
  }

  private limitStretch() {
    for (const c of this.constraints) {
      if (!c.alive || c.kind !== "stretch") continue;
      const pa = this.particles[c.a];
      const pb = this.particles[c.b];
      let dx = pa.x - pb.x;
      let dy = pa.y - pb.y;
      let dz = pa.z - pb.z;
      const dist = Math.hypot(dx, dy, dz);
      const limit = c.rest * 1.16;
      if (dist <= limit) continue;
      const w = pa.w + pb.w;
      if (w < 1e-8) continue;
      const corr = (dist - limit) / dist;
      pa.x -= dx * corr * (pa.w / w);
      pa.y -= dy * corr * (pa.w / w);
      pa.z -= dz * corr * (pa.w / w);
      pb.x += dx * corr * (pb.w / w);
      pb.y += dy * corr * (pb.w / w);
      pb.z += dz * corr * (pb.w / w);
    }
  }

  private collide() {
    for (const p of this.particles) {
      if (p.w === 0) continue;
      if (p.y < FLOOR) {
        p.y = FLOOR;
        p.py = p.y + (p.py - p.y) * 0.08;
        p.px = p.x + (p.px - p.x) * FLOOR_FRICTION;
        p.pz = p.z + (p.pz - p.z) * FLOOR_FRICTION;
      }
      if (p.z < WALL_Z) {
        p.z = WALL_Z;
        p.pz = p.z;
      } else if (p.z > FRONT_Z) {
        p.z = FRONT_Z;
        p.pz = p.z;
      }
    }
  }

  private killConstraint(c: Constraint) {
    if (!c.alive) return;
    c.alive = false;
    for (const f of this.faces) {
      if (!f.alive) continue;
      const hit =
        (f.a === c.a || f.b === c.a || f.c === c.a) &&
        (f.a === c.b || f.b === c.b || f.c === c.b);
      if (hit) f.alive = false;
    }
    if (c.kind === "stretch") {
      const pa = this.particles[c.a];
      const pb = this.particles[c.b];
      const di = pb.col - pa.col;
      const dj = pb.row - pa.row;
      for (const other of this.constraints) {
        if (!other.alive || other.kind !== "bend") continue;
        const oa = this.particles[other.a];
        const ob = this.particles[other.b];
        const spans =
          (oa.col <= pa.col && ob.col >= pb.col && oa.row === pa.row && ob.row === pb.row) ||
          (oa.row <= pa.row && ob.row >= pb.row && oa.col === pa.col && ob.col === pb.col);
        const aligned =
          (di !== 0 && oa.row === pa.row && ob.row === pa.row) ||
          (dj !== 0 && oa.col === pa.col && ob.col === pa.col);
        if (spans && aligned) other.alive = false;
      }
    }
  }

  private rebuildIndex() {
    let n = 0;
    for (const f of this.faces) if (f.alive) n++;
    if (this.indices.length < n * 3) this.indices = new Uint16Array(n * 3);
    let w = 0;
    for (const f of this.faces) {
      if (!f.alive) continue;
      this.indices[w++] = f.a;
      this.indices[w++] = f.b;
      this.indices[w++] = f.c;
    }
    this.indices = this.indices.subarray(0, w);
    this.facesDirty = false;
  }

  private sync() {
    const pos = this.positions;
    const nor = this.normals;
    const tan = this.tangents;
    nor.fill(0);
    tan.fill(0);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const o = i * 3;
      pos[o] = p.x;
      pos[o + 1] = p.y;
      pos[o + 2] = p.z;
    }

    for (const f of this.faces) {
      if (!f.alive) continue;
      const ax = pos[f.a * 3];
      const ay = pos[f.a * 3 + 1];
      const az = pos[f.a * 3 + 2];
      const bx = pos[f.b * 3];
      const by = pos[f.b * 3 + 1];
      const bz = pos[f.b * 3 + 2];
      const cx = pos[f.c * 3];
      const cy = pos[f.c * 3 + 1];
      const cz = pos[f.c * 3 + 2];
      const ux = bx - ax;
      const uy = by - ay;
      const uz = bz - az;
      const vx = cx - ax;
      const vy = cy - ay;
      const vz = cz - az;
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      nor[f.a * 3] += nx;
      nor[f.a * 3 + 1] += ny;
      nor[f.a * 3 + 2] += nz;
      nor[f.b * 3] += nx;
      nor[f.b * 3 + 1] += ny;
      nor[f.b * 3 + 2] += nz;
      nor[f.c * 3] += nx;
      nor[f.c * 3 + 1] += ny;
      nor[f.c * 3 + 2] += nz;
    }

    for (let i = 0; i < this.particles.length; i++) {
      const o = i * 3;
      const len = Math.hypot(nor[o], nor[o + 1], nor[o + 2]);
      if (len > 1e-8) {
        nor[o] /= len;
        nor[o + 1] /= len;
        nor[o + 2] /= len;
      } else {
        nor[o] = 0;
        nor[o + 1] = 0;
        nor[o + 2] = 1;
      }
      const p = this.particles[i];
      let tx = 1;
      let ty = 0;
      let tz = 0;
      if (p.col < COLS) {
        const r = this.particles[idx(p.col + 1, p.row)];
        tx = r.x - p.x;
        ty = r.y - p.y;
        tz = r.z - p.z;
      } else if (p.col > 0) {
        const l = this.particles[idx(p.col - 1, p.row)];
        tx = p.x - l.x;
        ty = p.y - l.y;
        tz = p.z - l.z;
      }
      const tlen = Math.hypot(tx, ty, tz);
      if (tlen > 1e-8) {
        tan[o] = tx / tlen;
        tan[o + 1] = ty / tlen;
        tan[o + 2] = tz / tlen;
      } else {
        tan[o] = 1;
        tan[o + 1] = 0;
        tan[o + 2] = 0;
      }
    }

    if (this.facesDirty) this.rebuildIndex();
  }
}
