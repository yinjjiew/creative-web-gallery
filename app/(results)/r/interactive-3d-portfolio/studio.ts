/**
 * The room, the chest, the table, the work. Everything is boxes and planes.
 * One millimetre is one millimetre: a card is 85 mm and an A1 sheet is not.
 */

import * as THREE from "three";

import { makeEdgeTexture, makePaperTextures } from "./paper";
import { PIECES, type Piece } from "./work";

export const MM = 0.001;

export const CHEST = {
  x: -0.56,
  z: 0,
  w: 1.08,
  d: 0.76,
  h: 0.8,
};

export const TABLE = {
  x: 0.7,
  z: 0.05,
  w: 1.12,
  d: 0.8,
  h: 0.73,
};

export const TRAVEL = 0.56;
const FACE = 0.168;
const TOP = 0.03;
const BOTTOM = 0.046;
const RAIL = 0.014;
const INNER_W = 0.98;

export type DrawerRig = {
  id: number;
  group: THREE.Group;
  handle: THREE.Object3D;
  open: number;
  target: number;
  vel: number;
};

export type PieceRig = {
  piece: Piece;
  group: THREE.Group;
  closed: THREE.Object3D;
  spread: THREE.Object3D | null;
  restPos: THREE.Vector3;
  restRot: THREE.Euler;
  tablePos: THREE.Vector3;
  tableRot: THREE.Euler;
  mass: number;
};

export type Studio = {
  root: THREE.Group;
  drawers: DrawerRig[];
  pieces: Map<string, PieceRig>;
  tableTop: THREE.Object3D;
  look: THREE.Vector3;
  dispose: () => void;
};

function mat(
  color: number,
  extras: ConstructorParameters<typeof THREE.MeshLambertMaterial>[0] = {},
) {
  return new THREE.MeshLambertMaterial({
    color,
    ...extras,
  });
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material | THREE.Material[],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  return mesh;
}

function drawerFloorY(id: number) {
  const topY = CHEST.h - TOP;
  const faceTop = topY - id * (FACE + RAIL);
  return faceTop - FACE + 0.01;
}

function layoutRest(piece: Piece): THREE.Vector3 {
  const d = Math.max(piece.dMm * MM, 0.0012);
  const y = -FACE / 2 + 0.01 + d / 2;

  switch (piece.id) {
    case "broth":
      return new THREE.Vector3(-0.3, y, 0.02);
    case "fjord":
      return new THREE.Vector3(-0.02, y, -0.02);
    case "glass-hours":
      return new THREE.Vector3(0.28, y, 0.01);
    case "season":
      return new THREE.Vector3(-0.02, y, -0.01);
    case "type-walk":
      return new THREE.Vector3(0.04, y + 0.002, 0.03);
    case "harvest":
      return new THREE.Vector3(0.12, y + 0.004, 0.06);
    case "bruun-letter":
      return new THREE.Vector3(-0.22, y, -0.04);
    case "bruun-card":
      return new THREE.Vector3(0.18, y, 0.08);
    case "havn":
      return new THREE.Vector3(0.3, y, 0.08);
    case "ore":
      return new THREE.Vector3(0.24, y, -0.12);
    case "nord-salt":
      return new THREE.Vector3(-0.22, y, 0);
    case "birch":
      return new THREE.Vector3(0.02, y, 0.04);
    case "stub":
      return new THREE.Vector3(0.26, y, -0.06);
    default:
      return new THREE.Vector3(0, y, 0);
  }
}

function makePrinted(piece: Piece, maps: Record<string, THREE.CanvasTexture>, edge: THREE.Texture) {
  const w = piece.wMm * MM;
  const h = piece.hMm * MM;
  const d = Math.max(piece.dMm * MM, 0.0012);
  const map = maps[piece.id];
  const face = new THREE.MeshLambertMaterial({ map });
  const side = new THREE.MeshLambertMaterial({ map: edge, color: 0xe8dcc4 });
  const back = new THREE.MeshLambertMaterial({
    color: piece.kind === "book" ? 0x2a2420 : 0xe6dcc8,
  });
  const geo = new THREE.BoxGeometry(w, d, h);
  const mesh = new THREE.Mesh(geo, [side, side, face, back, side, side]);
  mesh.userData = { kind: "piece", id: piece.id };

  const hitW = Math.max(w, 0.07);
  const hitH = Math.max(h, 0.05);
  const hit = new THREE.Mesh(
    new THREE.PlaneGeometry(hitW, hitH),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  );
  hit.rotation.x = -Math.PI / 2;
  hit.position.y = d / 2 + 0.001;
  hit.userData = { kind: "piece", id: piece.id };

  const group = new THREE.Group();
  group.add(mesh);
  group.add(hit);
  group.userData = { kind: "piece", id: piece.id };
  return { group, closed: mesh, w, h, d };
}

export function buildStudio(): Studio {
  const maps = makePaperTextures();
  const edge = makeEdgeTexture();
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [
    ...Object.values(maps),
    edge,
  ];

  const plaster = mat(0xe4ddd0);
  const floorMat = mat(0xcfc4b0);
  const steel = mat(0x3e4641);
  const steelFace = mat(0x4a534d);
  const copper = mat(0x9a6b42);
  const oak = mat(0xb7a78c);
  const railWood = mat(0xa89880);
  disposables.push(plaster, floorMat, steel, steelFace, copper, oak, railWood);

  const floor = box(5.2, 0.04, 4.2, floorMat);
  floor.position.set(0.1, -0.02, 0.2);
  root.add(floor);

  const back = box(5.2, 2.3, 0.06, plaster);
  back.position.set(0.1, 1.13, -1.22);
  root.add(back);

  const left = box(0.06, 2.3, 4.2, plaster);
  left.position.set(-1.92, 1.13, 0.2);
  root.add(left);

  const window = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.35),
    new THREE.MeshBasicMaterial({ color: 0xfff6ea }),
  );
  window.position.set(-1.886, 1.28, 0.15);
  window.rotation.y = Math.PI / 2;
  root.add(window);
  disposables.push(window.geometry, window.material);

  const sill = box(0.08, 0.04, 1.22, oak);
  sill.position.set(-1.86, 0.58, 0.15);
  root.add(sill);

  const chest = new THREE.Group();
  chest.position.set(CHEST.x, 0, CHEST.z);

  const sideL = box(0.04, CHEST.h, CHEST.d, steel);
  sideL.position.set(-CHEST.w / 2 + 0.02, CHEST.h / 2, 0);
  const sideR = box(0.04, CHEST.h, CHEST.d, steel);
  sideR.position.set(CHEST.w / 2 - 0.02, CHEST.h / 2, 0);
  const backP = box(CHEST.w - 0.02, CHEST.h, 0.03, steel);
  backP.position.set(0, CHEST.h / 2, -CHEST.d / 2 + 0.015);
  const top = box(CHEST.w, TOP, CHEST.d, steel);
  top.position.set(0, CHEST.h - TOP / 2, 0);
  const bottom = box(CHEST.w, BOTTOM, CHEST.d, steel);
  bottom.position.set(0, BOTTOM / 2, 0);
  chest.add(sideL, sideR, backP, top, bottom);

  for (let i = 0; i < 3; i++) {
    const rail = box(CHEST.w - 0.08, RAIL, CHEST.d - 0.04, steel);
    const y = drawerFloorY(i) - 0.01 - RAIL / 2;
    rail.position.set(0, y, 0.01);
    chest.add(rail);
  }

  const drawers: DrawerRig[] = [];
  const pieces = new Map<string, PieceRig>();

  for (let i = 0; i < 4; i++) {
    const group = new THREE.Group();
    const y = drawerFloorY(i) + FACE / 2 - 0.01;
    group.position.set(0, y, 0);

    const bin = box(INNER_W, 0.03, 0.66, railWood);
    bin.position.set(0, -FACE / 2 + 0.02, 0.02);
    bin.userData = { kind: "drawer", drawer: i };
    group.add(bin);
    const wallL = box(0.012, 0.045, 0.64, railWood);
    wallL.position.set(-INNER_W / 2 + 0.006, -FACE / 2 + 0.042, 0.02);
    const wallR = wallL.clone();
    wallR.position.x = INNER_W / 2 - 0.006;
    const wallB = box(INNER_W, 0.045, 0.012, railWood);
    wallB.position.set(0, -FACE / 2 + 0.042, -0.3);
    group.add(wallL, wallR, wallB);

    const face = box(CHEST.w - 0.09, FACE - 0.01, 0.022, steelFace);
    face.position.set(0, 0, CHEST.d / 2 - 0.02);
    face.userData = { kind: "drawer", drawer: i };
    group.add(face);

    const handle = box(0.072, 0.012, 0.016, copper);
    handle.position.set(0, 0.01, CHEST.d / 2 + 0.006);
    handle.userData = { kind: "handle", drawer: i };
    group.add(handle);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.11, 0.022),
      new THREE.MeshLambertMaterial({
        map: maps[`label-${i}`],
      }),
    );
    label.position.set(-CHEST.w / 2 + 0.16, 0.01, CHEST.d / 2 - 0.008);
    group.add(label);
    disposables.push(label.geometry, label.material);

    chest.add(group);
    drawers.push({
      id: i,
      group,
      handle,
      open: i === 0 ? 0.58 : 0,
      target: i === 0 ? 0.58 : 0,
      vel: 0,
    });
    group.position.z = drawers[i].open * TRAVEL;
  }

  root.add(chest);

  const table = new THREE.Group();
  table.position.set(TABLE.x, 0, TABLE.z);
  const topSlab = box(TABLE.w, 0.028, TABLE.d, oak);
  topSlab.position.y = TABLE.h - 0.014;
  const apron = box(TABLE.w - 0.06, 0.05, TABLE.d - 0.06, oak);
  apron.position.y = TABLE.h - 0.05;
  const legs: THREE.Mesh[] = [];
  for (const [lx, lz] of [
    [-TABLE.w / 2 + 0.06, -TABLE.d / 2 + 0.06],
    [TABLE.w / 2 - 0.06, -TABLE.d / 2 + 0.06],
    [-TABLE.w / 2 + 0.06, TABLE.d / 2 - 0.06],
    [TABLE.w / 2 - 0.06, TABLE.d / 2 - 0.06],
  ] as const) {
    const leg = box(0.05, TABLE.h - 0.03, 0.05, oak);
    leg.position.set(lx, (TABLE.h - 0.03) / 2, lz);
    legs.push(leg);
    table.add(leg);
  }
  table.add(topSlab, apron);

  const gridMat = new THREE.MeshLambertMaterial({
    map: maps.grid,
    emissive: 0xf0e8d4,
    emissiveIntensity: 0.16,
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.62), gridMat);
  grid.rotation.x = -Math.PI / 2;
  grid.position.set(0, TABLE.h + 0.0008, -0.02);
  grid.userData = { kind: "table" };
  table.add(grid);
  disposables.push(grid.geometry, gridMat);

  const ruler = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.004, 0.018),
    new THREE.MeshLambertMaterial({
      map: maps.ruler,
      color: 0xc4a06a,
    }),
  );
  ruler.position.set(-0.22, TABLE.h + 0.003, 0.3);
  table.add(ruler);
  disposables.push(ruler.geometry, ruler.material as THREE.Material);

  const tableTop = new THREE.Object3D();
  tableTop.position.set(TABLE.x, TABLE.h, TABLE.z);
  root.add(tableTop);
  root.add(table);

  for (const piece of PIECES) {
    const built = makePrinted(piece, maps, edge);
    const restPos = layoutRest(piece);
    const restRot = new THREE.Euler(0, 0, 0);
    const d = Math.max(piece.dMm * MM, 0.0012);
    const tablePos = new THREE.Vector3(
      TABLE.x,
      TABLE.h + d / 2 + 0.001,
      TABLE.z - 0.03,
    );
    const tableRot = new THREE.Euler(0, 0, 0);

    let spread: THREE.Object3D | null = null;
    if (piece.kind === "book") {
      const spreadMap = maps[`${piece.id}-spread`] ?? maps[piece.id];
      const spreadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(piece.wMm * MM * 1.85, piece.hMm * MM),
        new THREE.MeshLambertMaterial({
          map: spreadMap,
          side: THREE.DoubleSide,
        }),
      );
      spreadMesh.rotation.x = -Math.PI / 2;
      spreadMesh.position.y = d / 2 + 0.0015;
      spreadMesh.visible = false;
      spreadMesh.userData = { kind: "piece", id: piece.id };
      built.group.add(spreadMesh);
      spread = spreadMesh;
      disposables.push(spreadMesh.geometry, spreadMesh.material as THREE.Material);
    }

    built.group.position.copy(restPos);
    const drawer = drawers[piece.drawer];
    drawer.group.add(built.group);

    const volume = (piece.wMm * piece.hMm * piece.dMm) / 1_000_000;
    pieces.set(piece.id, {
      piece,
      group: built.group,
      closed: built.closed,
      spread,
      restPos,
      restRot,
      tablePos,
      tableRot,
      mass: Math.max(0.08, volume),
    });
  }

  const look = new THREE.Vector3(0.1, 0.46, 0.12);

  function dispose() {
    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of materials) m.dispose();
      }
    });
    for (const d of disposables) d.dispose();
  }

  return { root, drawers, pieces, tableTop, look, dispose };
}
