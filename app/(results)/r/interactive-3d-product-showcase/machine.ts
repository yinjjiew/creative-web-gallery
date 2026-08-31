/**
 * The machine, built in code. Everything is in metres at real size, because the
 * proportions are the point: a lever espresso machine is a small object with a
 * long arm, and getting that relationship wrong makes it read as a toy.
 *
 * The linkage is not a fudge. The handle sits 300 mm from the pivot, the
 * connecting rod is pinned to the lever 27.5 mm from it, and the piston is
 * constrained to the group axis, so the rod swings a little as it goes down and
 * the piston follows a real slider-crank solution. That geometry gives 25 mm of
 * piston travel and a ratio of about 11 : 1, which are the numbers physics.ts is
 * built on. The visible mechanism and the simulated one are the same mechanism.
 */
import * as THREE from "three";

import {
  GAUGE_MAX,
  GAUGE_SWEEP,
  makeBadgeTexture,
  makeBenchTexture,
  makeContactShadowTexture,
  makeDialTexture,
  makeWalnutTexture,
} from "./environment";

const PIVOT = new THREE.Vector3(0, 0.263, 0.052);
/** Handle centre distance from the pivot. */
const LEVER_LENGTH = 0.3;
/** Where the connecting rod is pinned to the lever. */
const CRANK = 0.0275;
/** Group axis, which the piston is constrained to. */
const GROUP_Z = 0.078;
/** Lever angle above horizontal at rest and at the bottom of the stroke. */
const ANGLE_UP = (40 * Math.PI) / 180;
const ANGLE_DOWN = (-13.5 * Math.PI) / 180;
/** Piston crown height at the top of the stroke. */
const PISTON_TOP_Y = 0.249;
/** Where the spout ends and the glass stands. */
const SPOUT_Y = 0.102;
const GLASS_Y = 0.0304;

const ROD_LENGTH = (() => {
  const y = PIVOT.y + CRANK * Math.sin(ANGLE_UP);
  const z = PIVOT.z + CRANK * Math.cos(ANGLE_UP);
  return Math.hypot(GROUP_Z - z, y - PISTON_TOP_Y);
})();

export function leverAngle(travel: number) {
  return ANGLE_UP + (ANGLE_DOWN - ANGLE_UP) * travel;
}

/** Where the middle of the wooden handle is, for a given travel. */
export function handlePosition(travel: number, into = new THREE.Vector3()) {
  const a = leverAngle(travel);
  return into.set(
    0,
    PIVOT.y + LEVER_LENGTH * Math.sin(a),
    PIVOT.z + LEVER_LENGTH * Math.cos(a)
  );
}

export interface Machine {
  root: THREE.Group;
  /** Meshes worth raycasting for the lever grab. */
  grabTargets: THREE.Object3D[];
  setTravel(travel: number): void;
  setPressure(bar: number): void;
  setPour(flow: number, delivered: number, integrity: number): void;
  dispose(): void;
}

/** Collects everything disposable so unmount is a single pass. */
class Bin {
  geometries = new Set<THREE.BufferGeometry>();
  materials = new Set<THREE.Material>();
  textures = new Set<THREE.Texture>();

  g<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.add(geometry);
    return geometry;
  }
  m<T extends THREE.Material>(material: T): T {
    this.materials.add(material);
    return material;
  }
  t<T extends THREE.Texture>(texture: T): T {
    this.textures.add(texture);
    return texture;
  }
  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    for (const t of this.textures) t.dispose();
  }
}

/** A box with real chamfers, which is how a machined part catches light. */
function chamferedBox(
  bin: Bin,
  width: number,
  height: number,
  depth: number,
  radius: number
) {
  const w = width / 2 - radius;
  const d = depth / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-w - radius, -d);
  shape.lineTo(-w - radius, d);
  shape.quadraticCurveTo(-w - radius, d + radius, -w, d + radius);
  shape.lineTo(w, d + radius);
  shape.quadraticCurveTo(w + radius, d + radius, w + radius, d);
  shape.lineTo(w + radius, -d);
  shape.quadraticCurveTo(w + radius, -d - radius, w, -d - radius);
  shape.lineTo(-w, -d - radius);
  shape.quadraticCurveTo(-w - radius, -d - radius, -w - radius, -d);

  const bevel = Math.min(radius * 0.6, height * 0.22);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bevel, 0);
  geometry.computeVertexNormals();
  return bin.g(geometry);
}

function lathe(bin: Bin, profile: [number, number][], segments = 64) {
  const points = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  return bin.g(new THREE.LatheGeometry(points, segments));
}

export function buildMachine(): Machine {
  const bin = new Bin();
  const root = new THREE.Group();

  const walnutMap = bin.t(makeWalnutTexture());
  walnutMap.repeat.set(3, 1);
  const dialMap = bin.t(makeDialTexture());
  const badgeMap = bin.t(makeBadgeTexture());
  const benchMap = bin.t(makeBenchTexture());
  const shadowMap = bin.t(makeContactShadowTexture());

  const chrome = bin.m(
    new THREE.MeshPhysicalMaterial({
      color: 0xf4f5f6,
      metalness: 1,
      roughness: 0.055,
      envMapIntensity: 1.3,
    })
  );
  const steel = bin.m(
    new THREE.MeshStandardMaterial({
      color: 0xc4c7c9,
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1,
    })
  );
  const brass = bin.m(
    new THREE.MeshStandardMaterial({
      color: 0xc9a464,
      metalness: 1,
      roughness: 0.19,
      envMapIntensity: 1.05,
    })
  );
  const brassWorn = bin.m(
    new THREE.MeshStandardMaterial({
      color: 0xab8846,
      metalness: 1,
      roughness: 0.36,
      envMapIntensity: 0.95,
    })
  );
  const walnut = bin.m(
    new THREE.MeshPhysicalMaterial({
      map: walnutMap,
      color: 0xb08a6a,
      metalness: 0,
      roughness: 0.44,
      clearcoat: 0.45,
      clearcoatRoughness: 0.32,
      envMapIntensity: 0.7,
    })
  );
  const rubber = bin.m(
    new THREE.MeshStandardMaterial({ color: 0x24231f, metalness: 0, roughness: 0.82 })
  );
  const dialFace = bin.m(
    new THREE.MeshStandardMaterial({ map: dialMap, metalness: 0, roughness: 0.5 })
  );
  const ink = bin.m(
    new THREE.MeshStandardMaterial({ color: 0x1c1b16, metalness: 0.1, roughness: 0.42 })
  );
  const badge = bin.m(
    new THREE.MeshStandardMaterial({ map: badgeMap, metalness: 1, roughness: 0.28 })
  );
  const glass = bin.m(
    new THREE.MeshPhysicalMaterial({
      color: 0xf2f6f5,
      metalness: 0,
      roughness: 0.04,
      ior: 1.52,
      transparent: true,
      opacity: 0.34,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const coffee = bin.m(
    new THREE.MeshPhysicalMaterial({
      color: 0x30170b,
      metalness: 0,
      roughness: 0.22,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    })
  );
  const crema = bin.m(
    new THREE.MeshStandardMaterial({ color: 0xa9702f, metalness: 0, roughness: 0.55 })
  );
  const stream = bin.m(
    new THREE.MeshStandardMaterial({
      color: 0x4a2410,
      metalness: 0,
      roughness: 0.15,
      transparent: true,
      opacity: 0.92,
    })
  );

  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position?: [number, number, number]
  ) => {
    const m = new THREE.Mesh(geometry, material);
    if (position) m.position.set(...position);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // ---------------------------------------------------------------- bench
  // Large enough that fog has finished dissolving it into the backdrop long
  // before the edge; the grid tiles at a true 50 mm.
  const BENCH = 9;
  benchMap.repeat.setScalar(BENCH / 1.4);
  const benchGeometry = bin.g(new THREE.PlaneGeometry(BENCH, BENCH));
  const bench = new THREE.Mesh(
    benchGeometry,
    bin.m(
      new THREE.MeshStandardMaterial({
        map: benchMap,
        metalness: 0,
        roughness: 0.68,
        envMapIntensity: 0.85,
      })
    )
  );
  bench.rotation.x = -Math.PI / 2;
  bench.receiveShadow = true;
  root.add(bench);

  const contact = new THREE.Mesh(
    bin.g(new THREE.PlaneGeometry(0.34, 0.38)),
    bin.m(
      new THREE.MeshBasicMaterial({
        map: shadowMap,
        transparent: true,
        depthWrite: false,
      })
    )
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, 0.0012, 0.005);
  root.add(contact);

  // ---------------------------------------------------------------- base
  // 165 by 205. These machines are far more compact underneath than people
  // remember: the base is barely wider than the boiler, and a generous one makes
  // the whole object read as a squat toy however good the rest of it is.
  const BASE_W = 0.165;
  const BASE_D = 0.205;
  const footGeometry = bin.g(new THREE.CylinderGeometry(0.0105, 0.0115, 0.006, 20));
  for (const [x, z] of [
    [0.059, 0.077],
    [-0.059, 0.077],
    [0.059, -0.077],
    [-0.059, -0.077],
  ]) {
    root.add(mesh(footGeometry, rubber, [x, 0.003, z]));
  }

  const base = mesh(chamferedBox(bin, BASE_W, 0.028, BASE_D, 0.012), steel, [0, 0.006, 0]);
  root.add(base);

  const badgePlate = mesh(bin.g(new THREE.PlaneGeometry(0.05, 0.0125)), badge, [
    0,
    0.021,
    BASE_D / 2 - 0.0018,
  ]);
  badgePlate.castShadow = false;
  root.add(badgePlate);

  // Drip tray: a chrome pan that lifts out of the front of the base, slatted over.
  // It sits on the base rather than floating above it.
  const pan = mesh(chamferedBox(bin, 0.128, 0.0075, 0.076, 0.005), chrome, [
    0,
    0.0235,
    0.0685,
  ]);
  root.add(pan);
  const slat = bin.g(new THREE.BoxGeometry(0.118, 0.0032, 0.0052));
  for (let i = 0; i < 7; i++) {
    root.add(mesh(slat, chrome, [0, 0.0288, 0.0395 + i * 0.0098]));
  }

  // ---------------------------------------------------------------- boiler
  // 130 mm across and 190 tall. The ratio to the 67 mm group head is most of what
  // makes the silhouette read as an espresso machine rather than as two tins.
  const BOILER_R = 0.065;
  // Far enough forward that the boiler wall meets the back of the group casting,
  // which is how the two are actually joined.
  const BOILER_Z = -0.018;
  /**
   * A point on the boiler wall, by bearing from the front. Every fitting is
   * placed this way so that changing the boiler diameter does not leave the taps
   * and glasses floating.
   */
  const onBoiler = (
    bearing: number,
    y: number,
    out = 0
  ): [number, number, number] => [
    (BOILER_R + out) * Math.sin(bearing),
    y,
    BOILER_Z + (BOILER_R + out) * Math.cos(bearing),
  ];

  const boilerProfile: [number, number][] = [
    [0, 0.034],
    [0.068, 0.034],
    [0.068, 0.0425],
    [BOILER_R, 0.048],
    [BOILER_R, 0.205],
  ];
  // Shoulder into a flat crown, so there is somewhere to mount the fittings.
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const a = (t * Math.PI) / 2;
    boilerProfile.push([
      0.04 + (BOILER_R - 0.04) * Math.cos(a),
      0.205 + 0.031 * Math.sin(a),
    ]);
  }
  boilerProfile.push([0.04, 0.236], [0.037, 0.239], [0, 0.239]);
  const boiler = mesh(lathe(bin, boilerProfile, 72), chrome, [0, 0, BOILER_Z]);
  root.add(boiler);

  // Fill cap: a brass hex, offset to the back of the crown.
  const capX = 0.023;
  const capZ = BOILER_Z - 0.027;
  const cap = mesh(bin.g(new THREE.CylinderGeometry(0.0155, 0.017, 0.0135, 6)), brass, [
    capX,
    0.2445,
    capZ,
  ]);
  cap.rotation.y = 0.3;
  root.add(cap);
  root.add(
    mesh(bin.g(new THREE.CylinderGeometry(0.0125, 0.0125, 0.006, 24)), brassWorn, [
      capX,
      0.2535,
      capZ,
    ])
  );

  // Sight glass on the left, with the water level in it.
  const SIGHT = -1.62;
  const sightFitting = bin.g(new THREE.CylinderGeometry(0.006, 0.006, 0.008, 20));
  for (const y of [0.065, 0.17]) {
    root.add(mesh(sightFitting, brass, onBoiler(SIGHT, y, 0.004)));
  }
  const sightTube = new THREE.Mesh(
    bin.g(new THREE.CylinderGeometry(0.0038, 0.0038, 0.101, 16, 1, true)),
    glass
  );
  sightTube.position.set(...onBoiler(SIGHT, 0.1175, 0.004));
  root.add(sightTube);
  root.add(
    mesh(
      bin.g(new THREE.CylinderGeometry(0.0031, 0.0031, 0.05, 14)),
      glass,
      onBoiler(SIGHT, 0.0925, 0.004)
    )
  );

  // Steam tap and wand, also on the left so the gauge side stays clean.
  const tapStem = mesh(
    bin.g(new THREE.CylinderGeometry(0.006, 0.0075, 0.026, 20)),
    brass,
    onBoiler(-1.78, 0.191, 0.008)
  );
  tapStem.rotation.z = Math.PI / 2;
  root.add(tapStem);
  const tapKnob = mesh(
    lathe(bin, [
      [0, 0],
      [0.0115, 0.001],
      [0.0125, 0.006],
      [0.0105, 0.013],
      [0.0075, 0.0155],
      [0, 0.016],
    ]),
    walnut,
    onBoiler(-1.78, 0.191, 0.024)
  );
  tapKnob.rotation.z = Math.PI / 2;
  root.add(tapKnob);

  const WAND = -1.35;
  const wandJoint = mesh(
    bin.g(new THREE.SphereGeometry(0.0075, 20, 14)),
    chrome,
    onBoiler(WAND, 0.142, 0.002)
  );
  root.add(wandJoint);
  const wand = mesh(bin.g(new THREE.CylinderGeometry(0.0032, 0.0028, 0.078, 16)), chrome);
  wand.position.set(...onBoiler(WAND, 0.114, 0.019));
  wand.rotation.set(-0.3, 0, 0.42);
  root.add(wand);
  const wandTip = mesh(bin.g(new THREE.CylinderGeometry(0.0042, 0.0034, 0.009, 16)), brass);
  wandTip.position.set(...onBoiler(WAND, 0.079, 0.036));
  wandTip.rotation.set(-0.3, 0, 0.42);
  root.add(wandTip);

  // ---------------------------------------------------------------- gauge
  const GAUGE_BEARING = 0.62;
  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(...onBoiler(GAUGE_BEARING, 0.176, -0.004));
  gaugeGroup.rotation.set(-0.12, GAUGE_BEARING, 0);
  root.add(gaugeGroup);

  const gaugeStem = mesh(bin.g(new THREE.CylinderGeometry(0.006, 0.007, 0.03, 18)), chrome);
  gaugeStem.rotation.x = Math.PI / 2;
  gaugeStem.position.z = -0.014;
  gaugeGroup.add(gaugeStem);
  const canister = mesh(
    bin.g(new THREE.CylinderGeometry(0.0208, 0.0208, 0.011, 40)),
    chrome
  );
  canister.rotation.x = Math.PI / 2;
  canister.position.z = 0.0045;
  gaugeGroup.add(canister);
  const bezel = mesh(
    lathe(bin, [
      [0.0168, 0.0],
      [0.0212, 0.0],
      [0.0218, 0.0028],
      [0.0214, 0.0098],
      [0.0188, 0.0118],
      [0.0168, 0.0118],
    ]),
    chrome
  );
  bezel.rotation.x = Math.PI / 2;
  bezel.position.z = 0.0038;
  gaugeGroup.add(bezel);
  const face = new THREE.Mesh(bin.g(new THREE.CircleGeometry(0.0168, 48)), dialFace);
  face.position.z = 0.0102;
  gaugeGroup.add(face);
  const cover = new THREE.Mesh(bin.g(new THREE.CircleGeometry(0.0168, 40)), glass);
  cover.position.z = 0.0148;
  gaugeGroup.add(cover);

  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.0108;
  gaugeGroup.add(needlePivot);
  const needle = new THREE.Mesh(bin.g(new THREE.PlaneGeometry(0.0016, 0.0195)), ink);
  needle.position.y = 0.0058;
  needlePivot.add(needle);
  const needleTail = new THREE.Mesh(bin.g(new THREE.PlaneGeometry(0.0026, 0.005)), ink);
  needleTail.position.y = -0.0025;
  needlePivot.add(needleTail);
  const hub = mesh(bin.g(new THREE.CylinderGeometry(0.0022, 0.0022, 0.0016, 16)), brass);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.0122;
  hub.castShadow = false;
  gaugeGroup.add(hub);

  // ---------------------------------------------------------------- group head
  const groupProfile: [number, number][] = [
    [0.0245, 0.133],
    [0.0295, 0.137],
    [0.0295, 0.146],
    [0.0262, 0.149],
    [0.0262, 0.173],
    [0.029, 0.177],
    [0.029, 0.221],
    [0.0255, 0.225],
    [0.0255, 0.234],
    [0.0295, 0.237],
    [0.0295, 0.247],
    [0.014, 0.2495],
    [0.0125, 0.2495],
  ];
  root.add(mesh(lathe(bin, groupProfile, 56), chrome, [0, 0, GROUP_Z]));

  // Water path from boiler to group: visible, because it should be.
  const feed = mesh(bin.g(new THREE.CylinderGeometry(0.0062, 0.0062, 0.026, 20)), chrome);
  feed.rotation.x = Math.PI / 2;
  feed.position.set(0, 0.1935, 0.0415);
  root.add(feed);
  const feedNut = bin.g(new THREE.CylinderGeometry(0.0085, 0.0085, 0.007, 6));
  for (const z of [0.0325, 0.0505]) {
    const nut = mesh(feedNut, brassWorn, [0, 0.1935, z]);
    nut.rotation.x = Math.PI / 2;
    root.add(nut);
  }

  // Bayonet ring the portafilter locks into.
  const bayonet = mesh(
    lathe(bin, [
      [0.0295, 0.125],
      [0.0335, 0.125],
      [0.0335, 0.133],
      [0.0295, 0.134],
    ]),
    chrome,
    [0, 0, GROUP_Z]
  );
  root.add(bayonet);

  // Fasteners. Two on the group flange, four in the corners of the base.
  const boltGeometry = bin.g(new THREE.CylinderGeometry(0.0042, 0.0042, 0.0035, 6));
  for (const [x, y, z, ry] of [
    [0.019, 0.2385, GROUP_Z + 0.019, 0.4],
    [-0.019, 0.2385, GROUP_Z + 0.019, 0.1],
    [0.0705, 0.0215, 0.0885, 0.2],
    [-0.0705, 0.0215, 0.0885, 0.5],
    [0.0705, 0.0215, -0.0885, 0.9],
    [-0.0705, 0.0215, -0.0885, 0.3],
  ]) {
    const bolt = mesh(boltGeometry, brassWorn, [x, y, z]);
    bolt.rotation.y = ry;
    root.add(bolt);
  }

  // ---------------------------------------------------------------- portafilter
  const pf = new THREE.Group();
  pf.position.set(0, 0.0, GROUP_Z);
  root.add(pf);
  pf.add(
    mesh(
      lathe(bin, [
        [0, 0.1105],
        [0.0125, 0.1105],
        [0.0135, 0.1135],
        [0.0245, 0.1175],
        [0.0295, 0.1225],
        [0.0308, 0.1265],
        [0.0308, 0.1305],
        [0.0288, 0.1305],
        [0.0288, 0.124],
        [0.024, 0.1205],
        [0.0115, 0.1155],
        [0.0105, 0.1125],
        [0, 0.1125],
      ]),
      chrome
    )
  );
  const spout = mesh(bin.g(new THREE.CylinderGeometry(0.0048, 0.0032, 0.009, 18)), chrome, [
    0,
    SPOUT_Y + 0.0045,
    GROUP_Z,
  ]);
  root.add(spout);

  // Handle: out to the right at 34°, so it never fights the lever for the view.
  const pfHandle = new THREE.Group();
  pfHandle.position.set(0, 0.125, GROUP_Z);
  pfHandle.rotation.y = -0.6;
  root.add(pfHandle);
  const pfNeck = mesh(bin.g(new THREE.CylinderGeometry(0.0075, 0.0075, 0.022, 18)), chrome);
  pfNeck.position.set(0, 0, 0.041);
  pfNeck.rotation.x = Math.PI / 2;
  pfHandle.add(pfNeck);
  const pfGrip = mesh(
    lathe(bin, [
      [0, 0],
      [0.0105, 0.0015],
      [0.0125, 0.006],
      [0.0142, 0.02],
      [0.0138, 0.04],
      [0.0115, 0.052],
      [0.008, 0.0565],
      [0, 0.0575],
    ]),
    walnut
  );
  pfGrip.rotation.x = Math.PI / 2;
  pfGrip.position.set(0, 0, 0.05);
  pfHandle.add(pfGrip);

  // ---------------------------------------------------------------- lever
  const leverPivot = new THREE.Group();
  leverPivot.position.copy(PIVOT);
  root.add(leverPivot);

  // Bracket cheeks and the pin, fixed to the group rather than the lever.
  const cheek = bin.g(new THREE.BoxGeometry(0.0055, 0.036, 0.026));
  for (const x of [0.0135, -0.0135]) {
    const c = mesh(cheek, chrome, [x, PIVOT.y - 0.014, PIVOT.z + 0.001]);
    root.add(c);
  }
  const pin = mesh(bin.g(new THREE.CylinderGeometry(0.0048, 0.0048, 0.036, 20)), steel, [
    0,
    PIVOT.y,
    PIVOT.z,
  ]);
  pin.rotation.z = Math.PI / 2;
  root.add(pin);

  // The arm: a tapered rod, thicker at the pivot where the moment is.
  const arm = mesh(
    bin.g(new THREE.CylinderGeometry(0.0072, 0.0115, LEVER_LENGTH - 0.03, 24)),
    chrome
  );
  arm.rotation.x = Math.PI / 2;
  arm.position.z = (LEVER_LENGTH - 0.03) / 2 + 0.017;
  leverPivot.add(arm);
  const boss = mesh(bin.g(new THREE.CylinderGeometry(0.0135, 0.0135, 0.03, 24)), chrome);
  boss.rotation.z = Math.PI / 2;
  leverPivot.add(boss);
  // The crank ear the connecting rod is pinned to.
  const ear = mesh(bin.g(new THREE.BoxGeometry(0.03, 0.011, 0.02)), chrome, [
    0,
    0,
    CRANK * 0.6,
  ]);
  leverPivot.add(ear);
  const crankPin = mesh(bin.g(new THREE.CylinderGeometry(0.004, 0.004, 0.034, 16)), steel, [
    0,
    0,
    CRANK,
  ]);
  crankPin.rotation.z = Math.PI / 2;
  leverPivot.add(crankPin);

  const grip = mesh(
    lathe(bin, [
      [0, 0],
      [0.0128, 0.0018],
      [0.0148, 0.008],
      [0.0162, 0.028],
      [0.0158, 0.055],
      [0.0138, 0.072],
      [0.0105, 0.0805],
      [0.0058, 0.0835],
      [0, 0.0838],
    ]),
    walnut
  );
  grip.rotation.x = Math.PI / 2;
  grip.position.z = LEVER_LENGTH - 0.042;
  leverPivot.add(grip);
  const collar = mesh(bin.g(new THREE.CylinderGeometry(0.0085, 0.0085, 0.008, 20)), brass);
  collar.rotation.x = Math.PI / 2;
  collar.position.z = LEVER_LENGTH - 0.046;
  leverPivot.add(collar);

  // A generous invisible sleeve, so grabbing the handle is forgiving on a phone.
  const proxy = new THREE.Mesh(
    bin.g(new THREE.CylinderGeometry(0.032, 0.032, 0.15, 12)),
    bin.m(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }))
  );
  proxy.rotation.x = Math.PI / 2;
  proxy.position.z = LEVER_LENGTH - 0.055;
  proxy.renderOrder = -1;
  leverPivot.add(proxy);

  // ---------------------------------------------------------------- rod, piston
  const rod = mesh(
    bin.g(new THREE.CylinderGeometry(0.0052, 0.0052, ROD_LENGTH, 18)),
    steel
  );
  root.add(rod);
  const rodEye = mesh(bin.g(new THREE.CylinderGeometry(0.0088, 0.0088, 0.011, 18)), chrome);
  root.add(rodEye);
  const pistonCrown = mesh(
    bin.g(new THREE.CylinderGeometry(0.0125, 0.0125, 0.014, 22)),
    brass
  );
  root.add(pistonCrown);

  // ---------------------------------------------------------------- glass
  const GLASS_INNER = 0.019;
  const GLASS_FLOOR = GLASS_Y + 0.0085;
  const glassShell = new THREE.Mesh(
    lathe(
      bin,
      [
        [0, 0],
        [0.0225, 0],
        [0.0228, 0.004],
        [0.0222, 0.009],
        [0.021, 0.028],
        [0.0206, 0.047],
        [0.0194, 0.047],
        [0.0198, 0.028],
        [0.0202, 0.012],
        [0.019, 0.0085],
        [0, 0.0085],
      ],
      48
    ),
    glass
  );
  glassShell.position.set(0, GLASS_Y, GROUP_Z - 0.0025);
  root.add(glassShell);

  const liquid = new THREE.Mesh(
    bin.g(new THREE.CylinderGeometry(GLASS_INNER, GLASS_INNER, 1, 40)),
    coffee
  );
  liquid.position.set(0, GLASS_FLOOR, GROUP_Z - 0.0025);
  liquid.scale.y = 0.0001;
  root.add(liquid);
  const cremaDisc = new THREE.Mesh(
    bin.g(new THREE.CylinderGeometry(GLASS_INNER, GLASS_INNER, 0.0016, 40)),
    crema
  );
  cremaDisc.position.set(0, GLASS_FLOOR, GROUP_Z - 0.0025);
  cremaDisc.visible = false;
  root.add(cremaDisc);

  const jet = new THREE.Mesh(
    bin.g(new THREE.CylinderGeometry(1, 1, 1, 10)),
    stream
  );
  jet.visible = false;
  root.add(jet);

  // ---------------------------------------------------------------- animation
  const linkPoint = new THREE.Vector3();
  const pistonPoint = new THREE.Vector3();
  const midpoint = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();

  function setTravel(travel: number) {
    const t = Math.max(0, Math.min(1, travel));
    const a = leverAngle(t);
    // The arm is modelled lying along +Z, so a rotation of −a lifts it by a.
    leverPivot.rotation.x = -a;

    linkPoint.set(
      0,
      PIVOT.y + CRANK * Math.sin(a),
      PIVOT.z + CRANK * Math.cos(a)
    );
    // Slider-crank: solve for the piston pin on the group axis.
    const dz = GROUP_Z - linkPoint.z;
    const drop = Math.sqrt(Math.max(0, ROD_LENGTH * ROD_LENGTH - dz * dz));
    pistonPoint.set(0, linkPoint.y - drop, GROUP_Z);

    midpoint.addVectors(linkPoint, pistonPoint).multiplyScalar(0.5);
    direction.subVectors(pistonPoint, linkPoint).normalize();
    quaternion.setFromUnitVectors(up, direction);
    rod.position.copy(midpoint);
    rod.quaternion.copy(quaternion);
    rodEye.position.copy(linkPoint);
    rodEye.quaternion.copy(quaternion);
    pistonCrown.position.copy(pistonPoint);
    pistonCrown.position.y -= 0.006;
  }

  function setPressure(bar: number) {
    const clamped = Math.max(0, Math.min(GAUGE_MAX, bar));
    needlePivot.rotation.z = -((clamped / GAUGE_MAX - 0.5) * GAUGE_SWEEP);
  }

  const cupColor = new THREE.Color();
  const cremaColor = new THREE.Color();
  const dark = new THREE.Color(0x2a1409);
  const pale = new THREE.Color(0x8a5a30);
  const cremaDark = new THREE.Color(0x9c6526);
  const cremaPale = new THREE.Color(0xd0ad78);

  function setPour(flow: number, delivered: number, integrity: number) {
    const height = delivered / 1e6 / (Math.PI * GLASS_INNER * GLASS_INNER);
    const surfaceY = GLASS_FLOOR + Math.max(0, height);
    liquid.scale.y = Math.max(0.0001, height);
    liquid.position.y = GLASS_FLOOR + height / 2;

    cremaDisc.visible = delivered > 1.2;
    cremaDisc.position.y = surfaceY - 0.0004;
    // Crema pales as the shot blondes, and a channelled shot never gets dark.
    const blonde = Math.min(1, Math.min(1, delivered / 26) * 0.55 + (1 - integrity) * 0.45);
    crema.color.copy(cremaColor.copy(cremaDark).lerp(cremaPale, blonde));

    if (flow > 0.06) {
      jet.visible = true;
      const radius = Math.min(0.0026, 0.0006 + flow * 0.00042);
      const length = Math.max(0.004, SPOUT_Y - surfaceY);
      jet.scale.set(radius, length, radius);
      jet.position.set(0, SPOUT_Y - length / 2, GROUP_Z - 0.0025);
      stream.color.copy(cupColor.copy(dark).lerp(pale, Math.min(1, blonde * 0.9)));
      stream.opacity = 0.75 + Math.min(0.2, flow * 0.08);
    } else {
      jet.visible = false;
    }
  }

  setTravel(0);
  setPressure(0);
  setPour(0, 0, 1);

  return {
    root,
    grabTargets: [proxy, grip, arm, collar],
    setTravel,
    setPressure,
    setPour,
    dispose: () => bin.dispose(),
  };
}
