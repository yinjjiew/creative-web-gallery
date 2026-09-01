/**
 * The hanging itself: found-shore silhouettes, not Calder's circus discs.
 * Every mesh is generated here. Stem at the origin, body along +Y, so the
 * stage can hang each leaf from its particle.
 */
import * as THREE from "three";

import type { LeafId } from "./physics";

const WIRE = 0x2c2824;
const BEARING = 0x3a3530;

export const LEAF_COLOR: Record<LeafId, number> = {
  wrack: 0x3c4334,
  glass: 0x8fa899,
  limpet: 0xc9b596,
  stone: 0x6a6660,
  mussel: 0x2b3237,
  brick: 0x8a4c3a,
  drift: 0xb4a690,
};

function extrude(shape: THREE.Shape, depth: number, bevel = 0.004) {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
  });
}

function wrack() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.012, 0.02, -0.018, 0.05, -0.016, 0.1);
  s.bezierCurveTo(-0.04, 0.13, -0.07, 0.16, -0.078, 0.22);
  s.bezierCurveTo(-0.08, 0.25, -0.06, 0.268, -0.042, 0.255);
  s.bezierCurveTo(-0.028, 0.21, -0.01, 0.18, 0.002, 0.15);
  s.bezierCurveTo(0.03, 0.2, 0.055, 0.24, 0.072, 0.29);
  s.bezierCurveTo(0.082, 0.312, 0.064, 0.322, 0.05, 0.305);
  s.bezierCurveTo(0.028, 0.25, 0.016, 0.2, 0.014, 0.14);
  s.bezierCurveTo(0.02, 0.08, 0.014, 0.03, 0.008, 0);
  s.closePath();
  const g = extrude(s, 0.01, 0.003);
  g.center();
  g.translate(0, 0.14, 0);
  return g;
}

function glass() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(-0.038, 0.03);
  s.lineTo(-0.052, 0.09);
  s.lineTo(-0.01, 0.15);
  s.lineTo(0.048, 0.128);
  s.lineTo(0.04, 0.042);
  s.closePath();
  const g = extrude(s, 0.014, 0.005);
  g.center();
  g.translate(0, 0.075, 0);
  return g;
}

function limpet() {
  const pts = [
    new THREE.Vector2(0.002, 0),
    new THREE.Vector2(0.046, 0.006),
    new THREE.Vector2(0.04, 0.018),
    new THREE.Vector2(0.022, 0.036),
    new THREE.Vector2(0.008, 0.05),
    new THREE.Vector2(0, 0.056),
  ];
  const g = new THREE.LatheGeometry(pts, 20);
  g.translate(0, 0.01, 0);
  return g;
}

function stone() {
  const g = new THREE.IcosahedronGeometry(0.032, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 0.82 + ((Math.sin(x * 40 + y * 18) + 1) * 0.09);
    pos.setXYZ(i, x * n * 1.15, y * n * 0.78, z * n * 0.95);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.translate(0, 0.02, 0);
  return g;
}

function mussel() {
  const g = new THREE.SphereGeometry(0.044, 18, 12);
  g.scale(0.58, 1.42, 0.36);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 + y * 0.35));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.translate(0, 0.052, 0);
  return g;
}

function brick() {
  const g = new THREE.BoxGeometry(0.062, 0.03, 0.038);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    let nx = x;
    let ny = y;
    let nz = z;
    if (x > 0.02 && y > 0.004 && z > 0.008) {
      nx -= 0.012;
      ny -= 0.006;
    }
    ny += Math.sin(x * 50 + z * 40) * 0.0014;
    pos.setXYZ(i, nx, ny, nz);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.translate(0, 0.02, 0);
  return g;
}

function drift() {
  const g = new THREE.CylinderGeometry(0.018, 0.014, 0.3, 9, 6);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const pinch = 1 + Math.sin(y * 14) * 0.12;
    pos.setXYZ(
      i,
      x * pinch * 1.35 + Math.sin(y * 9) * 0.006,
      y,
      z * pinch * 0.7 + Math.cos(y * 11) * 0.004
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.translate(0, 0.16, 0);
  return g;
}

const MAKERS: Record<LeafId, () => THREE.BufferGeometry> = {
  wrack,
  glass,
  limpet,
  stone,
  mussel,
  brick,
  drift,
};

export function makeLeafGeometry(id: LeafId) {
  return MAKERS[id]();
}

export function leafMaterial(id: LeafId) {
  const rough =
    id === "glass" ? 0.22 : id === "mussel" ? 0.28 : id === "stone" ? 0.7 : 0.62;
  const metal = id === "mussel" ? 0.22 : id === "glass" ? 0.04 : 0;
  return new THREE.MeshStandardMaterial({
    color: LEAF_COLOR[id],
    roughness: rough,
    metalness: metal,
    envMapIntensity: 0.55,
  });
}

export function wireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: WIRE,
    roughness: 0.38,
    metalness: 0.72,
    envMapIntensity: 0.7,
  });
}

export function bearingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: BEARING,
    roughness: 0.32,
    metalness: 0.8,
    envMapIntensity: 0.75,
  });
}

export function hookGeometry() {
  const torus = new THREE.TorusGeometry(0.028, 0.005, 8, 16, Math.PI * 1.15);
  torus.rotateZ(Math.PI * 0.15);
  return torus;
}

export function barGeometry() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 7, 1);
  g.translate(0, 0.5, 0);
  return g;
}

export function stemPoint(
  left: THREE.Vector3,
  right: THREE.Vector3,
  leftLen: number,
  span: number,
  target: THREE.Vector3
) {
  const t = leftLen / span;
  return target.lerpVectors(left, right, t);
}
