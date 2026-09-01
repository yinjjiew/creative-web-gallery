import * as THREE from "three";

import { CORE_WORLD, YEAR_MAX, tAtYears, yearsAt } from "./time";

const T_KPG = tAtYears(66e6);
const T_PERM = tAtYears(251.9e6);
const T_CAMB = tAtYears(538.8e6);
const T_GOE = tAtYears(2.45e9);

const CORE_R = 0.38;

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type RGB = { r: number; g: number; b: number };

function mix(a: RGB, b: RGB, t: number): RGB {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
}

function rgb(r: number, g: number, b: number): RGB {
  return { r, g, b };
}

/**
 * Conventional lithology by age. Colours are the classroom set, not a sample.
 * Banded iron and the K–Pg clay are the two intervals drawn as themselves.
 */
function lithology(years: number): RGB {
  if (years < 18) return rgb(132, 134, 136);
  if (years < 80) return rgb(168, 150, 132);
  if (years < 220) return rgb(118, 96, 78);
  if (years < 2_000) return rgb(166, 130, 92);
  if (years < 11_700) return rgb(186, 148, 102);
  if (years < 2.58e6) {
    const cycle = 0.5 + 0.5 * Math.sin((years / 100_000) * Math.PI * 2);
    return mix(rgb(222, 208, 176), rgb(168, 164, 154), cycle);
  }
  if (years < 23e6) return rgb(206, 176, 128);
  if (years < 66e6) return rgb(196, 164, 112);
  if (years < 145e6) return rgb(236, 228, 208);
  if (years < 201e6) return rgb(198, 176, 124);
  if (years < 252e6) return rgb(186, 92, 68);
  if (years < 299e6) return rgb(172, 84, 62);
  if (years < 359e6) return rgb(86, 88, 92);
  if (years < 419e6) return rgb(186, 104, 70);
  if (years < 487e6) return rgb(132, 148, 118);
  if (years < 539e6) return rgb(196, 172, 128);
  if (years < 720e6) return rgb(128, 118, 132);
  if (years < 2.4e9) return rgb(148, 86, 86);
  if (years < 2.52e9) return rgb(186, 72, 56);
  if (years < 4.0e9) return rgb(86, 108, 92);
  return rgb(62, 58, 56);
}

export function paintCore(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const years = yearsAt(t);
    const base = lithology(years);
    const bedId = Math.floor(t * 220 + hash(t * 12, 1.7) * 3);
    const bed = bedId % 2 === 0 ? 1.1 : 0.86;
    const kpg = Math.abs(t - T_KPG) < 0.005;
    const joint =
      Math.abs(t - T_PERM) < 0.002 || Math.abs(t - T_CAMB) < 0.002;
    const coal = years > 300e6 && years < 320e6 && hash(Math.floor(y / 3), 9) > 0.72;
    const bir = Math.abs(t - T_GOE) < 0.014;
    for (let x = 0; x < w; x++) {
      const scratch = hash(x * 0.55, 3.1) * 0.025;
      const grain = (hash(x * 1.1, y * 0.8) - 0.5) * 0.07;
      let { r, g, b } = base;
      if (bir) {
        const band = Math.floor(y / 3) % 2 === 0;
        const iron = band ? rgb(154, 56, 42) : rgb(96, 96, 98);
        r = iron.r;
        g = iron.g;
        b = iron.b;
      }
      if (coal) {
        r = 16;
        g = 16;
        b = 18;
      }
      if (joint) {
        r = r * 0.45;
        g = g * 0.45;
        b = b * 0.45;
      }
      if (kpg) {
        r = 12;
        g = 10;
        b = 10;
      }
      const n = bed + scratch + grain;
      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r * n));
      d[i + 1] = Math.max(0, Math.min(255, g * n));
      d[i + 2] = Math.max(0, Math.min(255, b * n));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function paintConcrete(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const pour = y % 40 < 2 ? 0.9 : 1;
    for (let x = 0; x < w; x++) {
      const n = 0.96 + hash(x * 0.18, y * 0.18) * 0.06;
      const v = 214 * n * pour;
      const i = (y * w + x) * 4;
      d[i] = v;
      d[i + 1] = v * 0.96;
      d[i + 2] = v * 0.9;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function texFrom(
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w: number,
  h: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context");
  paint(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export type World = {
  bead: THREE.Mesh;
  sky: THREE.DirectionalLight;
  lamp: THREE.PointLight;
  dispose: () => void;
};

export function buildWorld(scene: THREE.Scene): World {
  const ownedG: THREE.BufferGeometry[] = [];
  const ownedM: THREE.Material[] = [];
  const ownedT: THREE.Texture[] = [];

  const coreTex = texFrom(paintCore, 256, 1536);
  coreTex.wrapS = THREE.ClampToEdgeWrapping;
  coreTex.wrapT = THREE.ClampToEdgeWrapping;
  const wallTex = texFrom(paintConcrete, 128, 512);
  wallTex.repeat.set(1, 12);
  ownedT.push(coreTex, wallTex);

  const coreMat = new THREE.MeshLambertMaterial({ map: coreTex });
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex });
  const steelMat = new THREE.MeshLambertMaterial({ color: 0x6a7074 });
  const brassMat = new THREE.MeshLambertMaterial({
    color: 0xd4a24a,
    emissive: 0x8a5a18,
    emissiveIntensity: 0.55,
  });
  const lipMat = new THREE.MeshLambertMaterial({ color: 0xc8c0b4 });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xb8b0a4 });
  const crateMat = new THREE.MeshLambertMaterial({ color: 0x8a6240 });
  ownedM.push(coreMat, wallMat, steelMat, brassMat, lipMat, floorMat, crateMat);

  const h = CORE_WORLD;
  const barrel = new THREE.CylinderGeometry(CORE_R, CORE_R, h, 40, 1, true);
  const face = new THREE.PlaneGeometry(CORE_R * 2, h);
  const capG = new THREE.CircleGeometry(CORE_R, 32);
  const capMat = new THREE.MeshLambertMaterial({ color: 0x8a8c8e });
  ownedG.push(barrel, face, capG);
  ownedM.push(capMat);
  const coreBack = new THREE.Mesh(barrel, coreMat);
  const coreFace = new THREE.Mesh(face, coreMat);
  coreFace.position.z = CORE_R + 0.004;
  const cap = new THREE.Mesh(capG, capMat);
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = h / 2;
  const core = new THREE.Group();
  core.add(coreBack, coreFace, cap);
  core.position.set(0.18, -h / 2, 0);
  scene.add(core);

  const ruleG = new THREE.PlaneGeometry(0.032, h);
  const ruleMat = new THREE.MeshLambertMaterial({ color: 0xb08a48 });
  ownedG.push(ruleG);
  ownedM.push(ruleMat);
  const rule = new THREE.Mesh(ruleG, ruleMat);
  rule.position.set(0.18 + CORE_R - 0.012, -h / 2, CORE_R + 0.006);
  scene.add(rule);

  const rodG = new THREE.CylinderGeometry(0.02, 0.02, h, 10);
  ownedG.push(rodG);
  const rod = new THREE.Mesh(rodG, steelMat);
  rod.position.set(-0.46, -h / 2, CORE_R * 0.7);
  scene.add(rod);

  const beadG = new THREE.SphereGeometry(0.07, 16, 12);
  ownedG.push(beadG);
  const bead = new THREE.Mesh(beadG, brassMat);
  bead.position.set(-0.46, 0, CORE_R * 0.7);
  const beadLamp = new THREE.PointLight(0xffc66a, 0.65, 1.6, 2);
  bead.add(beadLamp);
  scene.add(bead);

  const wallH = h + 10;
  const backW = new THREE.PlaneGeometry(5.2, wallH);
  const sideW = new THREE.PlaneGeometry(4.2, wallH);
  ownedG.push(backW, sideW);
  const wallBack = new THREE.Mesh(backW, wallMat);
  wallBack.position.set(0.1, -h / 2, -1.55);
  const wallL = new THREE.Mesh(sideW, wallMat);
  wallL.position.set(-1.75, -h / 2, 0.2);
  wallL.rotation.y = Math.PI / 2;
  const wallR = new THREE.Mesh(sideW, wallMat);
  wallR.position.set(1.95, -h / 2, 0.2);
  wallR.rotation.y = -Math.PI / 2;
  scene.add(wallBack, wallL, wallR);

  const floorG = new THREE.PlaneGeometry(6, 5);
  ownedG.push(floorG);
  const pit = new THREE.Mesh(floorG, floorMat);
  pit.rotation.x = -Math.PI / 2;
  pit.position.set(0.1, -h - 0.02, 0.3);
  scene.add(pit);

  const labG = new THREE.PlaneGeometry(8, 3.2);
  ownedG.push(labG);
  const lab = new THREE.Mesh(labG, lipMat);
  lab.rotation.x = -Math.PI / 2;
  lab.position.set(0.2, 0.02, 3.25);
  scene.add(lab);

  const lipG = new THREE.BoxGeometry(5.4, 0.16, 0.36);
  const lipSide = new THREE.BoxGeometry(0.36, 0.16, 3.2);
  ownedG.push(lipG, lipSide);
  const lipB = new THREE.Mesh(lipG, lipMat);
  lipB.position.set(0.1, 0.1, -1.55);
  const lipL = new THREE.Mesh(lipSide, lipMat);
  lipL.position.set(-1.75, 0.1, 0);
  const lipR = new THREE.Mesh(lipSide, lipMat);
  lipR.position.set(1.95, 0.1, 0);
  scene.add(lipB, lipL, lipR);

  const crateG = new THREE.BoxGeometry(0.7, 0.38, 0.48);
  ownedG.push(crateG);
  const crate = new THREE.Mesh(crateG, crateMat);
  crate.position.set(1.45, 0.29, 2.35);
  scene.add(crate);

  const skyG = new THREE.PlaneGeometry(4.6, 3.6);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xfffaf3 });
  ownedG.push(skyG);
  ownedM.push(skyMat);
  const opening = new THREE.Mesh(skyG, skyMat);
  opening.rotation.x = Math.PI / 2;
  opening.position.set(0.1, 7.2, 0.15);
  scene.add(opening);

  const sky = new THREE.DirectionalLight(0xfff6ea, 1.35);
  sky.position.set(0.6, 6, 5);
  const hemi = new THREE.HemisphereLight(0xf6f1e8, 0x7a7268, 1.05);
  const faceKey = new THREE.DirectionalLight(0xfffaf2, 0.7);
  faceKey.position.set(0.1, 0.4, 6);
  const lamp = new THREE.PointLight(0xffe2b8, 0.25, 10, 1.2);
  scene.add(sky, hemi, faceKey, lamp);

  scene.fog = new THREE.Fog(0xcfc7bb, 14, 42);
  scene.background = new THREE.Color(0xcfc7bb);

  return {
    bead,
    sky,
    lamp,
    dispose() {
      for (const g of ownedG) g.dispose();
      for (const m of ownedM) m.dispose();
      for (const t of ownedT) t.dispose();
    },
  };
}

export function beadY(years: number) {
  return -(years / YEAR_MAX) * CORE_WORLD;
}

export { CORE_R };
