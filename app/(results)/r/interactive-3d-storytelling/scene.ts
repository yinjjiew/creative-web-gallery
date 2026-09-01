/**
 * The room that does not move: two walls, a window that is replaced once,
 * a jamb that keeps a child's numbers, and the street that climbs up and
 * takes the light. apply() is the only thing time is allowed to touch.
 */

import * as THREE from "three";

import { applyDated, makeKit, type Dated, type Kit } from "./build";
import { buildProps } from "./props";
import {
  brick,
  floralPaper,
  jambFace,
  magnoliaPaint,
  peachPaint,
  plaster,
  skyView,
  streetView,
  woodFloor,
} from "./textures";

export type RoomScene = {
  root: THREE.Group;
  apply: (year: number, reduce: boolean) => void;
  dispose: () => void;
};

const WALL_H = 2.62;
const SILL = 0.88;
const HEAD = 2.18;
const WIN_Z0 = 0.62;
const WIN_Z1 = 1.94;

export function buildScene(): RoomScene {
  const kit = makeKit();
  const root = new THREE.Group();
  const dated: Dated[] = [];

  const floorMap = kit.tex(woodFloor(), 2.4, 3);
  const floralMap = kit.tex(floralPaper(), 2.2, 2.4);
  const peachMap = kit.tex(peachPaint(), 1, 1);
  const magMap = kit.tex(magnoliaPaint(), 1, 1);
  const plasMap = kit.tex(plaster(), 1.6, 1.8);
  const brickMap = kit.tex(brick(), 4, 6);
  const skyMap = kit.tex(skyView(), 1, 1);
  skyMap.wrapS = THREE.ClampToEdgeWrapping;
  skyMap.wrapT = THREE.ClampToEdgeWrapping;
  const viewMap = kit.tex(streetView(1962), 1, 1);
  viewMap.wrapS = THREE.ClampToEdgeWrapping;
  viewMap.wrapT = THREE.ClampToEdgeWrapping;
  const viewMat = kit.basic(0xffffff, { map: viewMap });
  const view = kit.boxAt(root, viewMat, -0.72, 1.53, (WIN_Z0 + WIN_Z1) / 2, 0.03, 1.42, 1.46);
  view.castShadow = false;
  let viewYear = 1962;

  const papers = {
    floral: kit.lambert(0xffffff, { map: floralMap }),
    peach: kit.lambert(0xffffff, { map: peachMap }),
    magnolia: kit.lambert(0xffffff, { map: magMap }),
    plaster: kit.lambert(0xffffff, { map: plasMap }),
  };
  const paperMeshes: THREE.Mesh[] = [];

  const floorMat = kit.lambert(0xffffff, { map: floorMap });
  const plasterMat = kit.lambert(0xc8b8a4);
  const woodMat = kit.lambert(0x6a4e32);
  const creamMat = kit.lambert(0xd8c8b0);
  const ceilingMat = kit.lambert(0xe6ddd0);
  const outsideMat = kit.lambert(0xffffff, { map: brickMap });
  const skyMat = kit.basic(0xffffff, { map: skyMap });
  const glassSash = kit.phong(0x9ab0b8, {
    transparent: true,
    opacity: 0.18,
    shininess: 80,
    depthWrite: false,
  });
  const glassPvc = kit.phong(0xa8c0c8, {
    transparent: true,
    opacity: 0.22,
    shininess: 90,
    depthWrite: false,
  });
  const tapeMat = kit.lambert(0x8a6a3a);
  const stainMat = kit.lambert(0x3a2a18, { transparent: true, opacity: 0.55 });
  const radMat = kit.lambert(0xd4c6b0);
  const dripPeach = kit.lambert(0xc49a78);
  const dripMag = kit.lambert(0xd8d0c0);

  kit.boxAt(root, floorMat, 1.7, -0.02, 1.7, 3.5, 0.04, 3.6);
  kit.boxAt(root, ceilingMat, 1.7, WALL_H + 0.02, 1.7, 3.5, 0.04, 3.6);

  function wallPanel(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    face: "x" | "z"
  ) {
    kit.boxAt(root, plasterMat, x, y, z, sx, sy, sz);
    const paper = kit.boxAt(
      root,
      papers.floral,
      x + (face === "x" ? 0.046 : 0),
      y,
      z + (face === "z" ? 0.046 : 0),
      face === "x" ? 0.006 : sx,
      sy,
      face === "z" ? 0.006 : sz
    );
    paper.castShadow = false;
    paperMeshes.push(paper);
  }

  // Window wall (x ≈ 0), four panels around the opening.
  wallPanel(-0.04, SILL / 2, 1.75, 0.08, SILL, 3.5, "x");
  wallPanel(-0.04, (HEAD + WALL_H) / 2, 1.75, 0.08, WALL_H - HEAD, 3.5, "x");
  wallPanel(-0.04, (SILL + HEAD) / 2, WIN_Z0 / 2, 0.08, HEAD - SILL, WIN_Z0, "x");
  wallPanel(-0.04, (SILL + HEAD) / 2, (WIN_Z1 + 3.5) / 2, 0.08, HEAD - SILL, 3.5 - WIN_Z1, "x");

  // Back wall and the lintel over the door opening.
  wallPanel(1.36, WALL_H / 2, -0.04, 2.72, WALL_H, 0.08, "z");
  wallPanel(3.12, (2.12 + WALL_H) / 2, -0.04, 0.8, WALL_H - 2.12, 0.08, "z");

  kit.boxAt(root, woodMat, 1.7, 0.06, 0.03, 3.4, 0.12, 0.04);
  kit.boxAt(root, woodMat, 0.03, 0.06, 1.7, 0.04, 0.12, 3.4);
  const rail = new THREE.Group();
  root.add(rail);
  kit.boxAt(rail, woodMat, 1.36, 2.16, 0.03, 2.72, 0.025, 0.03);
  kit.boxAt(rail, woodMat, 0.03, 2.16, 1.75, 0.03, 0.025, 3.5);
  dated.push(kit.dated(rail, [[1962, 2020]]));
  kit.boxAt(root, kit.lambert(0x1c1814), 3.18, 1.06, -0.55, 0.86, 2.12, 0.8);

  // Window recess.
  kit.boxAt(root, creamMat, -0.08, SILL - 0.03, (WIN_Z0 + WIN_Z1) / 2, 0.2, 0.06, WIN_Z1 - WIN_Z0 + 0.08);
  kit.boxAt(root, creamMat, -0.08, HEAD + 0.03, (WIN_Z0 + WIN_Z1) / 2, 0.2, 0.06, WIN_Z1 - WIN_Z0 + 0.08);
  kit.boxAt(root, creamMat, -0.08, (SILL + HEAD) / 2, WIN_Z0 - 0.03, 0.2, HEAD - SILL, 0.06);
  kit.boxAt(root, creamMat, -0.08, (SILL + HEAD) / 2, WIN_Z1 + 0.03, 0.2, HEAD - SILL, 0.06);

  const sash = new THREE.Group();
  root.add(sash);
  const sashWood = kit.lambert(0xe8e0d4);
  const sashDark = kit.lambert(0x4a4034);
  kit.boxAt(sash, sashWood, -0.02, (SILL + HEAD) / 2, (WIN_Z0 + WIN_Z1) / 2, 0.05, HEAD - SILL, 0.05);
  kit.boxAt(sash, sashWood, -0.02, SILL + 0.03, (WIN_Z0 + WIN_Z1) / 2, 0.04, 0.05, WIN_Z1 - WIN_Z0);
  kit.boxAt(sash, sashWood, -0.02, HEAD - 0.03, (WIN_Z0 + WIN_Z1) / 2, 0.04, 0.05, WIN_Z1 - WIN_Z0);
  kit.boxAt(sash, sashWood, -0.02, (SILL + HEAD) / 2, WIN_Z0 + 0.03, 0.04, HEAD - SILL, 0.05);
  kit.boxAt(sash, sashWood, -0.02, (SILL + HEAD) / 2, WIN_Z1 - 0.03, 0.04, HEAD - SILL, 0.05);
  kit.boxAt(sash, sashWood, -0.02, (SILL + HEAD) / 2, (WIN_Z0 + WIN_Z1) / 2, 0.03, 0.04, WIN_Z1 - WIN_Z0);
  kit.boxAt(sash, sashWood, -0.02, (SILL + HEAD) / 2, (WIN_Z0 + WIN_Z1) / 2, 0.03, HEAD - SILL, 0.04);
  kit.boxAt(
    sash,
    glassSash,
    -0.02,
    SILL + (HEAD - SILL) * 0.28,
    (WIN_Z0 + WIN_Z1) / 2,
    0.01,
    (HEAD - SILL) * 0.42,
    WIN_Z1 - WIN_Z0 - 0.12
  );
  kit.boxAt(
    sash,
    glassSash,
    -0.02,
    SILL + (HEAD - SILL) * 0.72,
    (WIN_Z0 + WIN_Z1) / 2,
    0.01,
    (HEAD - SILL) * 0.42,
    WIN_Z1 - WIN_Z0 - 0.12
  );
  const tape = new THREE.Group();
  sash.add(tape);
  kit.boxAt(tape, tapeMat, -0.01, SILL + 0.42, 1.18, 0.005, 0.22, 0.018);
  kit.boxAt(tape, tapeMat, -0.01, SILL + 0.42, 1.18, 0.005, 0.018, 0.22);
  kit.boxAt(tape, sashDark, -0.018, SILL + 0.38, 1.22, 0.004, 0.28, 0.004, 0, 0, 0.4);
  dated.push(kit.dated(tape, [[1979, 2005]]));
  dated.push(kit.dated(sash, [[1962, 2005]]));

  const pvc = new THREE.Group();
  root.add(pvc);
  const pvcMat = kit.lambert(0xf2f0ea);
  const vent = kit.lambert(0xb8b4ac);
  kit.boxAt(pvc, pvcMat, -0.02, (SILL + HEAD) / 2, WIN_Z0 + 0.04, 0.08, HEAD - SILL, 0.1);
  kit.boxAt(pvc, pvcMat, -0.02, (SILL + HEAD) / 2, WIN_Z1 - 0.04, 0.08, HEAD - SILL, 0.1);
  kit.boxAt(pvc, pvcMat, -0.02, SILL + 0.05, (WIN_Z0 + WIN_Z1) / 2, 0.08, 0.12, WIN_Z1 - WIN_Z0);
  kit.boxAt(pvc, pvcMat, -0.02, HEAD - 0.05, (WIN_Z0 + WIN_Z1) / 2, 0.08, 0.1, WIN_Z1 - WIN_Z0);
  kit.boxAt(pvc, vent, -0.02, HEAD - 0.14, (WIN_Z0 + WIN_Z1) / 2, 0.04, 0.03, 0.42);
  kit.boxAt(
    pvc,
    glassPvc,
    -0.02,
    (SILL + HEAD) / 2,
    (WIN_Z0 + WIN_Z1) / 2,
    0.012,
    HEAD - SILL - 0.28,
    WIN_Z1 - WIN_Z0 - 0.22
  );
  kit.boxAt(pvc, kit.lambert(0xc8c4bc), -0.002, (SILL + HEAD) / 2 + 0.08, WIN_Z1 - 0.16, 0.02, 0.1, 0.04);
  dated.push(kit.dated(pvc, [[2005, 2025]]));

  // Radiator — painted with the room, drips on the boards date the two coats.
  const rad = new THREE.Group();
  root.add(rad);
  for (let i = 0; i < 9; i++) {
    kit.boxAt(rad, radMat, 0.16, 0.28, 0.78 + i * 0.1, 0.1, 0.52, 0.07);
  }
  kit.cylAt(rad, radMat, 0.16, 0.08, 1.18, 0.03, 0.82, 0, 0, Math.PI / 2);
  kit.cylAt(rad, radMat, 0.16, 0.5, 1.18, 0.025, 0.82, 0, 0, Math.PI / 2);
  const drips = new THREE.Group();
  root.add(drips);
  kit.boxAt(drips, dripPeach, 0.22, 0.008, 0.92, 0.04, 0.004, 0.09);
  kit.boxAt(drips, dripPeach, 0.2, 0.008, 1.4, 0.03, 0.004, 0.06);
  dated.push(kit.dated(drips, [[1983, 2025]]));
  const drips2 = new THREE.Group();
  root.add(drips2);
  kit.boxAt(drips2, dripMag, 0.24, 0.01, 1.08, 0.035, 0.004, 0.07);
  dated.push(kit.dated(drips2, [[2008, 2025]]));

  const stain = kit.boxAt(root, stainMat, 1.02, 0.006, 0.86, 0.46, 0.004, 0.36);
  stain.castShadow = false;

  const crack = new THREE.Group();
  root.add(crack);
  kit.boxAt(crack, kit.lambert(0x5a4a3c), 1.55, 1.35, 0.01, 0.01, 0.55, 0.004, 0, 0, 0.18);
  kit.boxAt(crack, kit.lambert(0x5a4a3c), 1.62, 1.12, 0.01, 0.01, 0.22, 0.004, 0, 0, -0.5);
  dated.push(kit.dated(crack, [[1978, 1983], [2020, 2025]]));

  const jambGroup = new THREE.Group();
  root.add(jambGroup);
  kit.boxAt(jambGroup, woodMat, 2.08, 1.06, 0.06, 0.1, 2.12, 0.08);
  const jambMap = kit.tex(jambFace(1962), 1, 1);
  jambMap.wrapS = THREE.ClampToEdgeWrapping;
  jambMap.wrapT = THREE.ClampToEdgeWrapping;
  const jambMat = kit.lambert(0xffffff, { map: jambMap });
  const jambPlane = kit.boxAt(jambGroup, jambMat, 2.02, 1.06, 0.06, 0.008, 2.12, 0.078);
  jambPlane.castShadow = false;
  let jambYear = 1962;

  const socketOld = new THREE.Group();
  root.add(socketOld);
  kit.boxAt(socketOld, kit.lambert(0xc8bca8), 0.04, 0.38, 2.28, 0.02, 0.1, 0.14);
  kit.cylAt(socketOld, kit.lambert(0x2a241c), 0.055, 0.4, 2.25, 0.012, 0.01, 0, 0, Math.PI / 2);
  kit.cylAt(socketOld, kit.lambert(0x2a241c), 0.055, 0.4, 2.31, 0.012, 0.01, 0, 0, Math.PI / 2);
  dated.push(kit.dated(socketOld, [[1962, 1988]]));

  const socketNew = new THREE.Group();
  root.add(socketNew);
  kit.boxAt(socketNew, kit.lambert(0xe8e4dc), 0.04, 0.38, 2.28, 0.02, 0.11, 0.16);
  kit.boxAt(socketNew, kit.lambert(0x2c2c2c), 0.052, 0.4, 2.28, 0.01, 0.06, 0.1);
  dated.push(kit.dated(socketNew, [[1988, 2025]]));

  const switchOld = new THREE.Group();
  root.add(switchOld);
  kit.boxAt(switchOld, kit.lambert(0x3a2a22), 2.48, 1.22, 0.02, 0.08, 0.12, 0.03);
  kit.boxAt(switchOld, kit.lambert(0x2a1c16), 2.48, 1.22, 0.04, 0.03, 0.05, 0.02);
  dated.push(kit.dated(switchOld, [[1962, 1994]]));

  const switchNew = new THREE.Group();
  root.add(switchNew);
  kit.boxAt(switchNew, kit.lambert(0xf0ece4), 2.48, 1.22, 0.02, 0.08, 0.12, 0.03);
  kit.boxAt(switchNew, kit.lambert(0xe4e0d8), 2.48, 1.22, 0.04, 0.028, 0.04, 0.018);
  dated.push(kit.dated(switchNew, [[1994, 2025]]));

  const hook = kit.cylAt(root, kit.lambert(0x8a8a82), 2.58, 1.55, 0.04, 0.008, 0.06, Math.PI / 2, 0, 0);

  buildOutside(root, kit, dated, outsideMat, skyMat);
  dated.push(...buildProps(root, kit, hook));

  const sun = new THREE.DirectionalLight(0xffe6c4, 2.35);
  sun.position.set(-12.5, 9.2, 2.4);
  sun.target.position.set(0.9, 0.5, 1.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 34;
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -6;
  sun.shadow.bias = -0.0008;
  root.add(sun);
  root.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xc8d4e4, 0x6a5a48, 0.55);
  root.add(hemi);
  const fill = new THREE.PointLight(0xfff2dc, 8, 6, 2);
  fill.position.set(0.35, 1.7, 1.25);
  root.add(fill);

  const sunColor = new THREE.Color();
  const hemiSky = new THREE.Color();
  const last = { year: -1, paper: "" };

  const apply = (year: number, reduce: boolean) => {
    const y = reduce ? Math.round(year) : year;
    if (Math.abs(y - last.year) < 0.0008) return;
    last.year = y;

    applyDated(dated, y);

    const paper =
      y < 1983 ? "floral" : y < 2008 ? "peach" : y < 2020 ? "magnolia" : "plaster";
    if (paper !== last.paper) {
      last.paper = paper;
      const mat = papers[paper];
      for (const mesh of paperMeshes) mesh.material = mat;
      if (y < 1983) radMat.color.set(0xd4c6b0);
      else if (y < 2008) radMat.color.set(0xddb89a);
      else if (y < 2020) radMat.color.set(0xe6dece);
      else radMat.color.set(0xd8cfc0);
    }

    const jy = Math.floor(y);
    if (jy !== jambYear) {
      jambYear = jy;
      const next = jambFace(jy);
      jambMap.image = next;
      jambMap.needsUpdate = true;
    }
    const vy = y < 1976 ? 1962 : y < 1998 ? 1976 : y < 2012 ? 1998 : 2012;
    if (vy !== viewYear) {
      viewYear = vy;
      viewMap.image = streetView(vy);
      viewMap.needsUpdate = true;
    }

    if (y < 1964) stainMat.opacity = 0;
    else if (y < 2023) stainMat.opacity = 0.58;
    else stainMat.opacity = 0.22;
    stain.visible = y >= 1964;

    let block = 0;
    if (y >= 1976) block += 0.2;
    if (y >= 1998) block += 0.26;
    if (y >= 2012) block += 0.34;
    const t = Math.min(1, Math.max(0, (y - 1962) / 62));
    sunColor.setRGB(1, 0.9 - t * 0.12, 0.72 - t * 0.08);
    hemiSky.setRGB(0.78 - t * 0.12, 0.83 - t * 0.04, 0.9);
    sun.color.copy(sunColor);
    hemi.color.copy(hemiSky);
    sun.intensity = 2.4 * (1 - block);
    hemi.intensity = 0.48 + block * 0.28;
    fill.intensity = 9 * (1 - block * 0.55);
    fill.color.setRGB(1, 0.95 - t * 0.1, 0.86 - t * 0.16);
  };

  apply(1962, false);

  return {
    root,
    apply,
    dispose: () => kit.dispose(),
  };
}

function buildOutside(
  root: THREE.Group,
  kit: Kit,
  dated: Dated[],
  brickMat: THREE.Material,
  skyMat: THREE.Material
) {
  const sky = kit.boxAt(root, skyMat, -18, 8, 2, 0.4, 22, 28);
  sky.castShadow = false;
  kit.boxAt(root, kit.lambert(0x6a6860), -6, -0.2, 2, 16, 0.2, 20).castShadow = false;

  const terrace = new THREE.Group();
  root.add(terrace);
  kit.boxAt(terrace, brickMat, -8.4, 1.5, 1.4, 3.2, 3.0, 10);
  kit.boxAt(terrace, kit.lambert(0x4a4038), -8.4, 3.12, 1.4, 3.4, 0.24, 10.2);
  for (let i = 0; i < 4; i++) {
    kit.boxAt(terrace, kit.lambert(0x3a4a58), -6.78, 1.7, -1.6 + i * 2.2, 0.04, 1.1, 0.7);
  }
  kit.boxAt(terrace, kit.lambert(0x5a4034), -8.2, 3.7, 0.2, 0.4, 0.9, 0.4);
  dated.push(kit.dated(terrace, [[1962, 2025]]));

  const warehouse = new THREE.Group();
  root.add(warehouse);
  kit.boxAt(warehouse, brickMat, -6.2, 3.2, 1.6, 2.6, 6.4, 9);
  kit.boxAt(warehouse, kit.lambert(0x3a3a38), -6.2, 6.5, 1.6, 2.8, 0.2, 9.2);
  for (let i = 0; i < 3; i++) {
    kit.boxAt(warehouse, kit.lambert(0x2a2c28), -4.88, 2.2 + i * 1.6, 1.6, 0.04, 0.8, 6.4);
  }
  dated.push(kit.dated(warehouse, [[1976, 2025]]));

  const flats = new THREE.Group();
  root.add(flats);
  kit.boxAt(flats, brickMat, -5.1, 6.2, 1.4, 2.2, 12.4, 8.4);
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      kit.boxAt(
        flats,
        kit.lambert(0x1a2830),
        -3.98,
        1.4 + row * 1.7,
        -1.6 + col * 1.9,
        0.05,
        1.0,
        0.9
      );
    }
  }
  dated.push(kit.dated(flats, [[1998, 2025]]));

  const office = new THREE.Group();
  root.add(office);
  const glass = kit.phong(0x6a808c, { shininess: 40 });
  kit.boxAt(office, glass, -4.2, 9.4, 1.5, 1.8, 18.6, 8);
  kit.boxAt(office, kit.lambert(0xc8c8c4), -4.2, 9.4, 1.5, 2.0, 18.8, 0.18);
  for (let i = 0; i < 9; i++) {
    kit.boxAt(office, kit.lambert(0xd0d0cc), -4.2, 1.2 + i * 2.0, 1.5, 1.85, 0.08, 8.1);
  }
  dated.push(kit.dated(office, [[2012, 2025]]));
}
