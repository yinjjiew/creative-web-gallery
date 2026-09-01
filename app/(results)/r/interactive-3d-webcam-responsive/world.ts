/**
 * One basin in wet limestone, a carbide lamp, a hide sill. The third dimension
 * is the distance from the glass to the ledge — the animal's whole argument.
 */

import * as THREE from "three";

export type World = {
  root: THREE.Group;
  water: THREE.Mesh;
  waterBase: Float32Array;
  waterPos: Float32Array;
  lampFlame: THREE.Mesh;
  lampLight: THREE.PointLight;
  dispose: () => void;
};

const LIMESTONE = new THREE.Color(0xc4ae8c);
const WET = new THREE.Color(0x6e5844);
const BONE = new THREE.Color(0xe8d8bc);
const RUST = new THREE.Color(0x6a3220);
const IRON = new THREE.Color(0x2c2420);
const WATER = 0x1e4a48;

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function rockHeight(x: number, z: number) {
  const pool = Math.hypot(x * 0.82, (z + 0.12) * 1.04);
  let h: number;
  if (pool < 1.38) {
    h = -0.06 + pool * 0.035;
  } else {
    const rim = Math.min(1, (pool - 1.38) / 0.7);
    h = 0.1 + rim * rim * 1.55;
  }

  const far = smooth(0.15, -1.85, z);
  h += far * (0.72 + Math.max(0, Math.abs(x) - 0.15) * 0.35);
  const near = smooth(-0.2, 1.85, z);
  h += near * 0.42;
  const sides = Math.max(0, Math.abs(x) - 1.15);
  h += sides * 0.85;

  h += 0.07 * Math.sin(x * 3.05 + z * 2.15) * Math.cos(z * 2.6);
  h += 0.032 * Math.sin(x * 8.2 - z * 6.4);
  h += 0.014 * Math.sin(x * 15.1 + z * 11.8);
  return h;
}

function lambert(color: number | THREE.Color, extras: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extras });
}

export function buildWorld(): World {
  const root = new THREE.Group();
  const trash: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const rockGeo = new THREE.PlaneGeometry(5.2, 5.2, 36, 36);
  rockGeo.rotateX(-Math.PI / 2);
  trash.push(rockGeo);
  const pos = rockGeo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = rockHeight(x, z);
    pos.setY(i, y);
    const wetness = y < 0.22 ? 0.55 : y < 0.5 ? 0.22 : 0.04;
    c.copy(LIMESTONE).lerp(WET, wetness);
    if (y > 0.55) c.lerp(BONE, 0.42);
    const n = 0.92 + ((Math.sin(x * 19 + z * 13) + 1) * 0.04);
    colors[i * 3] = c.r * n;
    colors[i * 3 + 1] = c.g * n;
    colors[i * 3 + 2] = c.b * n;
  }
  rockGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  rockGeo.computeVertexNormals();
  const rockMat = lambert(0xffffff, { vertexColors: true });
  mats.push(rockMat);
  const rock = new THREE.Mesh(rockGeo, rockMat);
  root.add(rock);

  const waterGeo = new THREE.PlaneGeometry(2.85, 2.95, 22, 22);
  waterGeo.rotateX(-Math.PI / 2);
  trash.push(waterGeo);
  const waterPos = waterGeo.attributes.position as THREE.BufferAttribute;
  const waterBase = waterPos.array.slice() as Float32Array;
  const waterMat = new THREE.MeshPhongMaterial({
    color: WATER,
    transparent: true,
    opacity: 0.36,
    shininess: 72,
    specular: 0x8eb8b0,
    depthWrite: false,
  });
  mats.push(waterMat);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.185;
  water.renderOrder = 2;
  root.add(water);

  const ceilGeo = new THREE.SphereGeometry(3.6, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  ceilGeo.scale(1.2, 0.72, 1.25);
  trash.push(ceilGeo);
  const ceilMat = lambert(0x7a6854, { side: THREE.BackSide });
  mats.push(ceilMat);
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.set(0, 0.35, -0.15);
  root.add(ceil);

  const ledgeGeo = new THREE.BoxGeometry(2.1, 0.55, 0.85);
  trash.push(ledgeGeo);
  const ledgeMat = lambert(0x6e5a44);
  mats.push(ledgeMat);
  const ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
  ledge.position.set(0.15, 0.42, -1.55);
  ledge.rotation.x = 0.18;
  ledge.rotation.z = -0.04;
  root.add(ledge);

  const toothGeo = new THREE.ConeGeometry(0.09, 0.42, 5);
  const toothMat = lambert(0xb8a888);
  trash.push(toothGeo);
  mats.push(toothMat);
  for (const [x, z] of [
    [-0.85, -1.15],
    [-0.4, -1.42],
    [0.55, -1.38],
    [1.05, -0.95],
    [-1.2, -0.35],
  ] as const) {
    const t = new THREE.Mesh(toothGeo, toothMat);
    t.position.set(x, rockHeight(x, z) + 0.28, z);
    t.rotation.z = (x > 0 ? -1 : 1) * 0.18;
    root.add(t);
  }

  const pebbleGeo = new THREE.SphereGeometry(1, 5, 4);
  trash.push(pebbleGeo);
  const pebbleMat = lambert(0x7a6854);
  mats.push(pebbleMat);
  for (const [x, z, s] of [
    [-0.62, 0.55, 0.07],
    [0.74, 0.22, 0.09],
    [-0.2, 0.8, 0.05],
    [0.4, -0.55, 0.06],
    [-0.95, 0.15, 0.08],
  ] as const) {
    const p = new THREE.Mesh(pebbleGeo, pebbleMat);
    p.position.set(x, 0.02, z);
    p.scale.set(s, s * 0.55, s * 1.15);
    p.rotation.y = x * 2;
    root.add(p);
  }

  const lamp = new THREE.Group();
  const iron = lambert(IRON);
  const rust = lambert(RUST);
  mats.push(iron, rust);
  const tankGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.16, 8);
  const armGeo = new THREE.BoxGeometry(0.018, 0.018, 0.28);
  const cageGeo = new THREE.TorusGeometry(0.045, 0.006, 5, 8);
  const flameGeo = new THREE.SphereGeometry(0.028, 6, 5);
  trash.push(tankGeo, armGeo, cageGeo, flameGeo);
  const tank = new THREE.Mesh(tankGeo, rust);
  tank.position.set(0, -0.12, 0);
  const arm = new THREE.Mesh(armGeo, iron);
  arm.position.set(0.02, 0.02, 0.1);
  const cage = new THREE.Mesh(cageGeo, iron);
  cage.position.set(0, 0.08, 0);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc878 });
  mats.push(flameMat);
  const lampFlame = new THREE.Mesh(flameGeo, flameMat);
  lampFlame.position.set(0, 0.08, 0);
  lampFlame.scale.set(0.7, 1.15, 0.7);
  lamp.add(tank, arm, cage, lampFlame);
  lamp.position.set(-0.58, 0.58, 0.42);
  lamp.rotation.y = 0.55;
  lamp.scale.setScalar(1.55);
  root.add(lamp);

  const lampLight = new THREE.PointLight(0xffc070, 4.2, 5.4, 1.15);
  lampLight.position.copy(lamp.position).add(new THREE.Vector3(0.06, 0.08, 0.04));
  root.add(lampLight);

  const sillGeo = new THREE.BoxGeometry(3.4, 0.08, 0.34);
  const postGeo = new THREE.BoxGeometry(0.07, 1.6, 0.07);
  trash.push(sillGeo, postGeo);
  const sillMat = lambert(0x2a221c);
  mats.push(sillMat);
  const sill = new THREE.Mesh(sillGeo, sillMat);
  sill.position.set(0, 0.22, 1.38);
  const postL = new THREE.Mesh(postGeo, sillMat);
  postL.position.set(-1.58, 0.95, 1.36);
  const postR = new THREE.Mesh(postGeo, sillMat);
  postR.position.set(1.58, 0.95, 1.36);
  root.add(sill, postL, postR);

  return {
    root,
    water,
    waterBase,
    waterPos: waterPos.array as Float32Array,
    lampFlame,
    lampLight,
    dispose() {
      trash.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

export type Ripple = { x: number; z: number; t: number; p: number };

export function stampWater(world: World, ripples: Ripple[], time: number, reduce: boolean) {
  const pos = world.waterPos;
  const base = world.waterBase;
  for (let i = 0; i < pos.length; i += 3) {
    const x = base[i]!;
    const z = base[i + 2]!;
    let y = 0;
    if (!reduce) {
      y += Math.sin(x * 3.4 + time * 1.6) * Math.cos(z * 2.8 + time * 1.1) * 0.006;
    }
    for (const r of ripples) {
      const d = Math.hypot(x - r.x, z - r.z);
      const wave = d * 11 - r.t * 6.5;
      const env = Math.exp(-r.t * 1.15 - d * 0.85);
      y += Math.sin(wave) * env * r.p * 0.045;
    }
    pos[i + 1] = y;
  }
  const attr = world.water.geometry.attributes.position as THREE.BufferAttribute;
  attr.needsUpdate = true;
}
