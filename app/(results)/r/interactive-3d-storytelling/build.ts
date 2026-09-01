import * as THREE from "three";

import { shown, type Span } from "./years";

export type Dated = {
  object: THREE.Object3D;
  spans: readonly Span[];
};

export type Kit = {
  box: THREE.BoxGeometry;
  cyl: THREE.CylinderGeometry;
  sph: THREE.SphereGeometry;
  cone: THREE.ConeGeometry;
  torus: THREE.TorusGeometry;
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];
  texs: THREE.Texture[];
  lambert: (color: number, extra?: THREE.MeshLambertMaterialParameters) => THREE.MeshLambertMaterial;
  phong: (color: number, extra?: THREE.MeshPhongMaterialParameters) => THREE.MeshPhongMaterial;
  basic: (color: number, extra?: THREE.MeshBasicMaterialParameters) => THREE.MeshBasicMaterial;
  boxAt: (
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx?: number,
    ry?: number,
    rz?: number
  ) => THREE.Mesh;
  cylAt: (
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    rx?: number,
    ry?: number,
    rz?: number
  ) => THREE.Mesh;
  sphAt: (
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    r: number
  ) => THREE.Mesh;
  tex: (source: HTMLCanvasElement, rx?: number, ry?: number) => THREE.CanvasTexture;
  dated: (object: THREE.Object3D, spans: readonly Span[]) => Dated;
  dispose: () => void;
};

export function makeKit(): Kit {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);
  const sph = new THREE.SphereGeometry(1, 14, 10);
  const cone = new THREE.ConeGeometry(1, 1, 10);
  const torus = new THREE.TorusGeometry(1, 0.12, 8, 18);
  const geos: THREE.BufferGeometry[] = [box, cyl, sph, cone, torus];
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = [];

  const lambert = (color: number, extra: THREE.MeshLambertMaterialParameters = {}) => {
    const m = new THREE.MeshLambertMaterial({ color, ...extra });
    mats.push(m);
    return m;
  };

  const phong = (color: number, extra: THREE.MeshPhongMaterialParameters = {}) => {
    const m = new THREE.MeshPhongMaterial({ color, ...extra });
    mats.push(m);
    return m;
  };

  const basic = (color: number, extra: THREE.MeshBasicMaterialParameters = {}) => {
    const m = new THREE.MeshBasicMaterial({ color, ...extra });
    mats.push(m);
    return m;
  };

  const place = (
    mesh: THREE.Mesh,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0
  ) => {
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const boxAt: Kit["boxAt"] = (parent, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(box, mat);
    mesh.scale.set(sx, sy, sz);
    return place(mesh, parent, x, y, z, rx, ry, rz);
  };

  const cylAt: Kit["cylAt"] = (parent, mat, x, y, z, r, h, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(cyl, mat);
    mesh.scale.set(r, h, r);
    return place(mesh, parent, x, y, z, rx, ry, rz);
  };

  const sphAt: Kit["sphAt"] = (parent, mat, x, y, z, r) => {
    const mesh = new THREE.Mesh(sph, mat);
    mesh.scale.set(r, r, r);
    return place(mesh, parent, x, y, z);
  };

  const tex = (source: HTMLCanvasElement, rx = 1, ry = 1) => {
    const t = new THREE.CanvasTexture(source);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    texs.push(t);
    return t;
  };

  const dated = (object: THREE.Object3D, spans: readonly Span[]) => ({ object, spans });

  const dispose = () => {
    for (const g of geos) g.dispose();
    for (const m of mats) m.dispose();
    for (const t of texs) t.dispose();
  };

  return {
    box,
    cyl,
    sph,
    cone,
    torus,
    geos,
    mats,
    texs,
    lambert,
    phong,
    basic,
    boxAt,
    cylAt,
    sphAt,
    tex,
    dated,
    dispose,
  };
}

export function applyDated(items: readonly Dated[], year: number) {
  for (const item of items) {
    const on = shown(year, item.spans);
    if (item.object.visible !== on) item.object.visible = on;
  }
}
