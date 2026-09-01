/**
 * A modelled olm — pale, nearly blind, gills that do the talking. Geometry is
 * a spine of tapers plus three pairs of fans. Nothing is imported.
 */

import * as THREE from "three";

import type { Mind } from "./mind";

export type Creature = {
  root: THREE.Group;
  gills: THREE.Mesh[];
  dispose: () => void;
  pose: (m: Mind, time: number, reduce: boolean) => void;
};

function skin(color: number, extras: THREE.MeshPhongMaterialParameters = {}) {
  return new THREE.MeshPhongMaterial({
    color,
    emissive: 0x2c1c16,
    emissiveIntensity: 0.16,
    shininess: 22,
    specular: 0x664840,
    ...extras,
  });
}

export function buildCreature(): Creature {
  const root = new THREE.Group();
  root.scale.set(2.15, 1.45, 2.35);
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const bodyMat = skin(0xf3e0d0);
  const gillMat = skin(0xc44a44, {
    transparent: true,
    opacity: 0.9,
    emissive: 0x401010,
    emissiveIntensity: 0.32,
    side: THREE.DoubleSide,
  });
  const eyeMat = skin(0x2a1c18, { emissiveIntensity: 0, shininess: 4 });
  mats.push(bodyMat, gillMat, eyeMat);

  const headGeo = new THREE.SphereGeometry(0.072, 8, 6);
  headGeo.scale(0.82, 0.7, 1.28);
  geos.push(headGeo);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.z = 0.04;
  root.add(head);

  const snoutGeo = new THREE.SphereGeometry(0.038, 6, 5);
  snoutGeo.scale(0.7, 0.55, 1.15);
  geos.push(snoutGeo);
  const snout = new THREE.Mesh(snoutGeo, bodyMat);
  snout.position.set(0, -0.004, 0.11);
  head.add(snout);

  const eyeGeo = new THREE.SphereGeometry(0.006, 5, 4);
  geos.push(eyeGeo);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.032, 0.02, 0.05);
  eyeR.position.set(0.032, 0.02, 0.05);
  head.add(eyeL, eyeR);

  const segs: THREE.Mesh[] = [];
  const radii = [0.058, 0.054, 0.046, 0.034, 0.022];
  const lengths = [0.1, 0.11, 0.12, 0.13, 0.15];
  let along = 0.1;
  for (let i = 0; i < radii.length; i++) {
    const geo = new THREE.CapsuleGeometry(radii[i], lengths[i], 2, 6);
    geo.rotateX(Math.PI / 2);
    geos.push(geo);
    const mesh = new THREE.Mesh(geo, bodyMat);
    mesh.position.z = -along;
    along += lengths[i]! + radii[i]! * 0.35;
    segs.push(mesh);
    root.add(mesh);
  }

  const gills: THREE.Mesh[] = [];
  const fan = new THREE.PlaneGeometry(0.08, 0.11, 4, 3);
  const fanPos = fan.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < fanPos.count; i++) {
    const x = fanPos.getX(i);
    const y = fanPos.getY(i);
    const flare = 0.45 + Math.max(0, y) * 1.55;
    fanPos.setXYZ(i, x * flare, y, Math.sin(x * 22 + y * 6) * 0.014 + Math.abs(x) * 0.05);
  }
  fan.computeVertexNormals();
  geos.push(fan);
  for (let pair = 0; pair < 3; pair++) {
    for (const side of [-1, 1]) {
      const g = new THREE.Mesh(fan, gillMat);
      g.position.set(side * (0.038 + pair * 0.005), 0.018, 0.01 - pair * 0.024);
      g.rotation.z = side * (0.95 + pair * 0.16);
      g.rotation.y = side * 0.3;
      head.add(g);
      gills.push(g);
    }
  }

  const thighGeo = new THREE.CapsuleGeometry(0.009, 0.04, 1, 4);
  const footGeo = new THREE.SphereGeometry(0.01, 4, 3);
  geos.push(thighGeo, footGeo);
  const legs: THREE.Group[] = [];
  for (const [sx, sz] of [
    [-1, -0.14],
    [1, -0.14],
    [-1, -0.32],
    [1, -0.32],
  ] as const) {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(thighGeo, bodyMat);
    thigh.rotation.z = sx * 1.05;
    thigh.position.set(sx * 0.012, -0.01, 0);
    const foot = new THREE.Mesh(footGeo, bodyMat);
    foot.position.set(sx * 0.038, -0.038, 0.004);
    foot.scale.set(1.4, 0.55, 1.1);
    leg.add(thigh, foot);
    leg.position.set(sx * 0.04, -0.02, sz);
    root.add(leg);
    legs.push(leg);
  }

  const bases = segs.map((s) => s.position.clone());

  return {
    root,
    gills,
    pose(m, time, reduce) {
      root.position.set(m.x, m.y, m.z);
      root.rotation.y = m.heading;

      const wave = reduce ? 0 : m.undulation;
      for (let i = 0; i < segs.length; i++) {
        const base = bases[i]!;
        const sway = Math.sin(time * 3.1 - i * 0.9) * wave * (0.008 + i * 0.006);
        segs[i]!.position.set(base.x + sway, base.y, base.z);
      }
      head.rotation.y = reduce ? 0 : Math.sin(time * 1.4) * wave * 0.12;
      head.position.x = reduce ? 0 : Math.sin(time * 3.1) * wave * 0.006;

      const pulse = 0.78 + Math.sin(time * (m.freeze > 0.5 ? 1.5 : 3.6)) * 0.16;
      const bloom = 0.58 + m.bloom * 0.85;
      for (let i = 0; i < gills.length; i++) {
        const g = gills[i]!;
        const side = i % 2 === 0 ? -1 : 1;
        g.scale.set(bloom * pulse, bloom, 1);
        g.rotation.z = side * (0.82 + m.bloom * 0.5 + (i >> 1) * 0.14);
        const mat = g.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = 0.26 + Math.max(0, m.bloom - 0.35) * 0.65;
      }

      for (let i = 0; i < legs.length; i++) {
        const walk = reduce ? 0 : Math.sin(time * 4.8 + i * 1.7) * m.undulation * 0.4;
        legs[i]!.rotation.x = walk;
      }
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}
