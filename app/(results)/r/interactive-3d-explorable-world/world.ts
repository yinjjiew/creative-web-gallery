/**
 * Everything on the rock, made of primitives and one heightfield.
 *
 * The island is small on purpose. Density comes from the works around the
 * landing and from things that are not always there, not from more vertices.
 */

import * as THREE from "three";

export type World = {
  root: THREE.Group;
  sea: THREE.Mesh;
  seaPositions: Float32Array;
  seaBase: Float32Array;
  seaColors: Float32Array;
  tower: THREE.Group;
  lanternGlass: THREE.Mesh;
  optic: THREE.Mesh;
  beamCone: THREE.Mesh;
  beamSpot: THREE.SpotLight;
  beamTarget: THREE.Object3D;
  windowPane: THREE.Mesh;
  cottageLamp: THREE.PointLight;
  lanternPoint: THREE.PointLight;
  boat: THREE.Group;
  dawnBirds: THREE.Group;
  fulmars: THREE.Group;
  raven: THREE.Group;
  flag: THREE.Mesh;
  stars: THREE.Points;
  sky: THREE.Mesh;
  paintSky: (zenith: [number, number, number], horizon: [number, number, number]) => void;
  peak: THREE.Vector3;
  dispose: () => void;
};

const BASALT = new THREE.Color(0x7a7e74);
const WET = new THREE.Color(0x4e5650);
const LICHEN = new THREE.Color(0x6a7460);
const SALT = new THREE.Color(0xd8d4c8);
const CONCRETE = 0x8a8680;
const WASH = 0xc4c0b4;
const SLATE = 0x2e3234;
const RUST = 0x6a3a28;
const RED = 0x8a2c22;
const WOOD = 0x4a3a2c;

export function rockHeight(x: number, z: number) {
  const dx = x - 0.12;
  const dz = z + 0.18;
  const r = Math.hypot(dx * 0.9, dz * 1.12);
  let h = (1 - Math.pow(Math.min(1, r / 2.28), 1.55)) * 1.42;

  if (x < -0.15) {
    const cliff = smooth(-0.15, -1.35, x);
    h += cliff * 0.55;
    h *= 1 - smooth(-1.55, -1.95, x) * 0.85;
  }

  const cove = Math.hypot(x - 1.15, z - 0.62);
  if (cove < 0.95) {
    h *= 0.42 + cove * 0.55;
  }

  h += 0.13 * Math.sin(dx * 3.2 + 0.3) * Math.cos(dz * 2.6);
  h += 0.055 * Math.sin(dx * 7.4 - dz * 5.1);
  h += 0.028 * Math.sin(dx * 13.5 + dz * 10.2);

  if (r > 2.35) h = -0.55 - (r - 2.35) * 0.35;
  return h;
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function mat(
  color: number,
  extras: THREE.MeshLambertMaterialParameters = {}
) {
  return new THREE.MeshLambertMaterial({ color, ...extras });
}

function box(
  geo: THREE.BoxGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  ry = 0
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.y = ry;
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

function buildRock(owned: THREE.BufferGeometry[]) {
  const nx = 48;
  const nz = 40;
  const width = 5.5;
  const depth = 4.7;
  const positions = new Float32Array(nx * nz * 3);
  const colors = new Float32Array(nx * nz * 3);
  const indices: number[] = [];
  const peak = new THREE.Vector3(0, 0, 0);

  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const i = iz * nx + ix;
      const x = (ix / (nx - 1) - 0.5) * width;
      const z = (iz / (nz - 1) - 0.5) * depth;
      const y = rockHeight(x, z);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      if (y > peak.y && Math.hypot(x, z) < 1.6) {
        peak.set(x, y, z);
      }
    }
  }

  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  owned.push(geo);

  const normals = geo.getAttribute("normal");
  const c = new THREE.Color();
  for (let i = 0; i < nx * nz; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const ny = normals.getY(i);
    const nxn = normals.getX(i);
    const t = Math.min(1, Math.max(0, y / 1.35));
    c.copy(WET).lerp(BASALT, t);
    if (nxn < -0.25) c.lerp(LICHEN, 0.35);
    if (t > 0.72 && ny > 0.45) c.lerp(SALT, 0.4);
    if (y < 0.12) c.lerp(WET, 0.55);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: false })
  );
  return { mesh, peak };
}

function buildSea(owned: THREE.BufferGeometry[]) {
  const rings = 12;
  const segs = 28;
  const radius = 16;
  const verts = (rings + 1) * segs;
  const positions = new Float32Array(verts * 3);
  const colors = new Float32Array(verts * 3);
  const indices: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const rad = (r / rings) * radius;
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const i = r * segs + s;
      positions[i * 3] = Math.cos(a) * rad;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(a) * rad;
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const s2 = (s + 1) % segs;
      const a = r * segs + s;
      const b = r * segs + s2;
      const c = (r + 1) * segs + s;
      const d = (r + 1) * segs + s2;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  owned.push(geo);

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 28,
      specular: new THREE.Color(0x2a3330),
      flatShading: false,
    })
  );
  return {
    mesh,
    positions,
    base: positions.slice(),
    colors,
  };
}

function cssRgb(c: [number, number, number]) {
  const r = Math.round(c[0] * 255);
  const g = Math.round(c[1] * 255);
  const b = Math.round(c[2] * 255);
  return `rgb(${r},${g},${b})`;
}

function buildSky(owned: THREE.BufferGeometry[], ownedM: THREE.Material[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;

  function paintSky(zenith: [number, number, number], horizon: [number, number, number]) {
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, cssRgb(zenith));
    g.addColorStop(0.42, cssRgb([
      zenith[0] * 0.55 + horizon[0] * 0.45,
      zenith[1] * 0.55 + horizon[1] * 0.45,
      zenith[2] * 0.55 + horizon[2] * 0.45,
    ]));
    g.addColorStop(0.72, cssRgb(horizon));
    g.addColorStop(1, cssRgb([
      horizon[0] * 0.55,
      horizon[1] * 0.58,
      horizon[2] * 0.55,
    ]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    tex.needsUpdate = true;
  }
  paintSky([0.22, 0.22, 0.3], [0.78, 0.42, 0.3]);

  const geo = new THREE.SphereGeometry(26, 24, 14);
  owned.push(geo);
  const matSky = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  ownedM.push(matSky);
  return { mesh: new THREE.Mesh(geo, matSky), paintSky, tex };
}

function lighthouse(peak: THREE.Vector3, owned: THREE.BufferGeometry[], mats: THREE.Material[]) {
  const g = new THREE.Group();
  g.position.copy(peak);

  const wash = mat(WASH);
  const red = mat(RED);
  const dark = mat(SLATE);
  const rust = mat(RUST);
  const glass = new THREE.MeshLambertMaterial({
    color: 0xffe8c0,
    transparent: true,
    opacity: 0.38,
    emissive: new THREE.Color(0xffe0a0),
    emissiveIntensity: 0,
  });
  const opticMat = new THREE.MeshLambertMaterial({
    color: 0xfff4d0,
    emissive: new THREE.Color(0xffe8b0),
    emissiveIntensity: 0.15,
  });
  mats.push(wash, red, dark, rust, glass, opticMat);

  const plinthG = new THREE.CylinderGeometry(0.5, 0.56, 0.18, 10);
  const shaftG = new THREE.CylinderGeometry(0.3, 0.4, 1.55, 12);
  const ringG = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 12);
  const deckG = new THREE.CylinderGeometry(0.46, 0.46, 0.04, 12);
  const lanternG = new THREE.CylinderGeometry(0.26, 0.26, 0.38, 10);
  const opticG = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8);
  const domeG = new THREE.SphereGeometry(0.27, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const ballG = new THREE.SphereGeometry(0.045, 6, 5);
  const postG = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 5);
  const railG = new THREE.TorusGeometry(0.44, 0.012, 5, 16);
  const doorG = new THREE.BoxGeometry(1, 1, 1);
  owned.push(plinthG, shaftG, ringG, deckG, lanternG, opticG, domeG, ballG, postG, railG, doorG);

  const plinth = new THREE.Mesh(plinthG, wash);
  plinth.position.y = 0.09;
  g.add(plinth);

  const shaft = new THREE.Mesh(shaftG, wash);
  shaft.position.y = 0.95;
  g.add(shaft);

  const band = new THREE.Mesh(ringG, red);
  band.position.y = 1.18;
  g.add(band);

  const door = box(doorG, dark, 0.28, 0.32, 0.18, 0.14, 0.38, 0.06, -0.4);
  g.add(door);

  for (let i = 0; i < 3; i++) {
    const w = box(doorG, dark, 0.22, 0.62 + i * 0.32, -0.22, 0.08, 0.12, 0.04, 0.5);
    g.add(w);
  }

  const deck = new THREE.Mesh(deckG, dark);
  deck.position.y = 1.74;
  g.add(deck);

  const rail = new THREE.Mesh(railG, rust);
  rail.position.y = 1.86;
  rail.rotation.x = Math.PI / 2;
  g.add(rail);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const post = new THREE.Mesh(postG, rust);
    post.position.set(Math.cos(a) * 0.44, 1.85, Math.sin(a) * 0.44);
    g.add(post);
  }

  const lanternGlass = new THREE.Mesh(lanternG, glass);
  lanternGlass.position.y = 1.96;
  g.add(lanternGlass);

  const optic = new THREE.Mesh(opticG, opticMat);
  optic.position.y = 1.96;
  g.add(optic);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bar = box(doorG, dark, Math.cos(a) * 0.25, 1.96, Math.sin(a) * 0.25, 0.03, 0.36, 0.03);
    g.add(bar);
  }

  const dome = new THREE.Mesh(domeG, red);
  dome.position.y = 2.15;
  g.add(dome);

  const ball = new THREE.Mesh(ballG, rust);
  ball.position.y = 2.46;
  g.add(ball);

  const vane = box(doorG, rust, 0, 2.52, 0, 0.22, 0.02, 0.04);
  g.add(vane);

  return { group: g, lanternGlass, optic, lanternY: 1.96 };
}

function cottage(peak: THREE.Vector3, owned: THREE.BufferGeometry[], mats: THREE.Material[]) {
  const g = new THREE.Group();
  const hx = peak.x + 0.82;
  const hz = peak.z + 0.72;
  const hy = rockHeight(hx, hz);
  g.position.set(hx, hy, hz);
  g.rotation.y = -0.35;

  const wash = mat(WASH);
  const slate = mat(SLATE);
  const dark = mat(0x2a2420);
  const pane = new THREE.MeshLambertMaterial({
    color: 0x1a1814,
    emissive: new THREE.Color(0xffc070),
    emissiveIntensity: 0,
  });
  mats.push(wash, slate, dark, pane);

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const roofG = new THREE.BoxGeometry(1, 1, 1);
  owned.push(unit, roofG);

  g.add(box(unit, wash, 0, 0.28, 0, 0.95, 0.56, 0.68));
  const roofA = box(roofG, slate, 0, 0.66, 0.16, 1.05, 0.08, 0.48, 0);
  roofA.rotation.x = 0.55;
  g.add(roofA);
  const roofB = box(roofG, slate, 0, 0.66, -0.16, 1.05, 0.08, 0.48, 0);
  roofB.rotation.x = -0.55;
  g.add(roofB);
  g.add(box(unit, wash, 0.42, 0.72, -0.08, 0.14, 0.28, 0.14));
  g.add(box(unit, dark, 0.48, 0.22, 0.12, 0.08, 0.32, 0.04));

  const windowPane = new THREE.Mesh(unit, pane);
  windowPane.position.set(-0.12, 0.3, 0.345);
  windowPane.scale.set(0.22, 0.2, 0.03);
  g.add(windowPane);

  const lamp = new THREE.PointLight(0xffc070, 0, 3.4, 2);
  lamp.position.set(-0.12, 0.32, 0.4);
  g.add(lamp);

  return { group: g, windowPane, lamp };
}

function works(peak: THREE.Vector3, owned: THREE.BufferGeometry[], mats: THREE.Material[]) {
  const g = new THREE.Group();
  const concrete = mat(CONCRETE);
  const rust = mat(RUST);
  const wood = mat(WOOD);
  const dark = mat(SLATE);
  mats.push(concrete, rust, wood, dark);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
  const pole = new THREE.CylinderGeometry(0.02, 0.02, 1, 5);
  owned.push(unit, cyl, pole);

  const slipX = 1.25;
  const slipZ = 0.7;
  const slip = box(unit, concrete, slipX, 0.06, slipZ, 1.35, 0.08, 0.42, -0.45);
  slip.rotation.z = -0.12;
  g.add(slip);

  g.add(box(unit, concrete, 1.05, 0.14, 0.42, 0.55, 0.12, 0.55, -0.2));

  const winch = box(unit, wood, 0.92, rockHeight(0.92, 0.28) + 0.16, 0.28, 0.32, 0.28, 0.28);
  g.add(winch);

  for (const [x, z] of [
    [0.55, 0.95],
    [0.72, 1.08],
  ] as const) {
    const tank = new THREE.Mesh(cyl, rust);
    tank.position.set(x, rockHeight(x, z) + 0.2, z);
    tank.scale.set(0.36, 0.4, 0.36);
    g.add(tank);
  }

  const flagpole = new THREE.Mesh(pole, dark);
  const fx = peak.x - 0.55;
  const fz = peak.z + 0.45;
  flagpole.position.set(fx, rockHeight(fx, fz) + 0.55, fz);
  flagpole.scale.set(1, 1.1, 1);
  g.add(flagpole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.12),
    new THREE.MeshLambertMaterial({
      color: 0x6a2430,
      side: THREE.DoubleSide,
    })
  );
  owned.push(flag.geometry);
  mats.push(flag.material);
  flag.position.set(fx + 0.12, rockHeight(fx, fz) + 1.02, fz);
  flag.visible = false;
  g.add(flag);

  const westMark = box(unit, mat(0xe8e4d8), -1.15, rockHeight(-1.15, -0.2) + 0.18, -0.2, 0.06, 0.36, 0.18);
  mats.push(westMark.material as THREE.Material);
  g.add(westMark);
  g.add(box(unit, mat(RED), -1.15, rockHeight(-1.15, -0.2) + 0.4, -0.2, 0.06, 0.14, 0.18));

  const reef = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.38, 1),
    new THREE.MeshLambertMaterial({ color: 0x2e3230, flatShading: true })
  );
  owned.push(reef.geometry);
  mats.push(reef.material);
  reef.position.set(-2.35, -0.02, 0.4);
  reef.scale.set(1.1, 0.55, 0.8);
  g.add(reef);

  const crate = box(unit, wood, 1.0, rockHeight(1.0, 0.5) + 0.1, 0.5, 0.16, 0.14, 0.16, 0.3);
  g.add(crate);

  return { group: g, flag };
}

function buildBoat(owned: THREE.BufferGeometry[], mats: THREE.Material[]) {
  const g = new THREE.Group();
  const hullC = mat(0x2a2c2e);
  const cabinC = mat(0xc8c2b4);
  const mastC = mat(0x3a3228);
  mats.push(hullC, cabinC, mastC);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const prow = new THREE.ConeGeometry(0.18, 0.42, 6);
  const mastG = new THREE.CylinderGeometry(0.02, 0.025, 0.7, 5);
  owned.push(unit, prow, mastG);

  g.add(box(unit, hullC, 0, 0, 0, 0.7, 0.16, 0.28));
  const nose = new THREE.Mesh(prow, hullC);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.48, 0, 0);
  g.add(nose);
  g.add(box(unit, cabinC, -0.06, 0.16, 0, 0.28, 0.16, 0.2));
  const mast = new THREE.Mesh(mastG, mastC);
  mast.position.set(0.08, 0.42, 0);
  g.add(mast);
  g.visible = false;
  return g;
}

function bird(owned: THREE.BufferGeometry[], material: THREE.Material) {
  const g = new THREE.Group();
  const wing = new THREE.BoxGeometry(0.28, 0.012, 0.06);
  owned.push(wing);
  const a = new THREE.Mesh(wing, material);
  a.position.set(-0.08, 0, 0);
  a.rotation.z = 0.35;
  const b = new THREE.Mesh(wing, material);
  b.position.set(0.08, 0, 0);
  b.rotation.z = -0.35;
  g.add(a, b);
  return g;
}

function buildBirds(owned: THREE.BufferGeometry[], mats: THREE.Material[]) {
  const gull = mat(0xd8d4cc);
  const dark = mat(0x1a1c1c);
  mats.push(gull, dark);
  const dawnBirds = new THREE.Group();
  const fulmars = new THREE.Group();
  const raven = new THREE.Group();
  for (let i = 0; i < 3; i++) dawnBirds.add(bird(owned, gull));
  for (let i = 0; i < 2; i++) fulmars.add(bird(owned, gull));
  const r = bird(owned, dark);
  r.scale.setScalar(1.15);
  raven.add(r);
  dawnBirds.visible = false;
  fulmars.visible = false;
  raven.visible = false;
  return { dawnBirds, fulmars, raven };
}

function buildStars(owned: THREE.BufferGeometry[]) {
  const n = 90;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = 0.15 + Math.random() * 0.85;
    const r = 24;
    pos[i * 3] = Math.cos(a) * r * Math.sqrt(1 - y * y);
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = Math.sin(a) * r * Math.sqrt(1 - y * y);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  owned.push(geo);
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xe8e4d8,
      size: 0.08,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      fog: false,
    })
  );
  return points;
}

export function buildWorld(): World {
  const ownedG: THREE.BufferGeometry[] = [];
  const ownedM: THREE.Material[] = [];
  const root = new THREE.Group();

  const { mesh: rock, peak } = buildRock(ownedG);
  ownedM.push(rock.material as THREE.Material);
  root.add(rock);

  const sea = buildSea(ownedG);
  ownedM.push(sea.mesh.material as THREE.Material);
  root.add(sea.mesh);

  const { mesh: sky, paintSky, tex: skyTex } = buildSky(ownedG, ownedM);
  root.add(sky);

  const light = lighthouse(peak, ownedG, ownedM);
  root.add(light.group);

  const house = cottage(peak, ownedG, ownedM);
  root.add(house.group);

  const station = works(peak, ownedG, ownedM);
  root.add(station.group);

  const boat = buildBoat(ownedG, ownedM);
  root.add(boat);

  const birds = buildBirds(ownedG, ownedM);
  root.add(birds.dawnBirds, birds.fulmars, birds.raven);

  const stars = buildStars(ownedG);
  ownedM.push(stars.material as THREE.Material);
  root.add(stars);

  const coneG = new THREE.ConeGeometry(0.55, 9.2, 12, 1, true);
  ownedG.push(coneG);
  const coneM = new THREE.MeshBasicMaterial({
    color: 0xfff0c8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  ownedM.push(coneM);
  const beamCone = new THREE.Mesh(coneG, coneM);
  beamCone.position.copy(peak);
  beamCone.position.y += light.lanternY;
  root.add(beamCone);

  const beamTarget = new THREE.Object3D();
  root.add(beamTarget);
  const beamSpot = new THREE.SpotLight(0xfff1c4, 0, 20, 0.2, 0.45, 1.4);
  beamSpot.position.copy(beamCone.position);
  beamSpot.target = beamTarget;
  root.add(beamSpot);

  const lanternPoint = new THREE.PointLight(0xffe0a0, 0, 5.5, 2);
  lanternPoint.position.copy(beamCone.position);
  root.add(lanternPoint);

  return {
    root,
    sea: sea.mesh,
    seaPositions: sea.positions,
    seaBase: sea.base,
    seaColors: sea.colors,
    tower: light.group,
    lanternGlass: light.lanternGlass,
    optic: light.optic,
    beamCone,
    beamSpot,
    beamTarget,
    windowPane: house.windowPane,
    cottageLamp: house.lamp,
    lanternPoint,
    boat,
    dawnBirds: birds.dawnBirds,
    fulmars: birds.fulmars,
    raven: birds.raven,
    flag: station.flag,
    stars,
    sky,
    paintSky,
    peak,
    dispose() {
      skyTex.dispose();
      for (const g of ownedG) g.dispose();
      for (const m of ownedM) m.dispose();
    },
  };
}
