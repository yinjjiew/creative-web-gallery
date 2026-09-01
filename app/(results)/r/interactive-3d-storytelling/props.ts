/**
 * Objects that arrive and leave. Each one dates a period, implies who was
 * here, or pays off something already planted. Nothing is furniture for its
 * own sake.
 */

import * as THREE from "three";

import { type Dated, type Kit } from "./build";
import { laceAlpha, rushSeat } from "./textures";

export function buildProps(root: THREE.Group, kit: Kit, hook: THREE.Object3D): Dated[] {
  const items: Dated[] = [];
  const add = (object: THREE.Object3D, spans: Dated["spans"]) => {
    root.add(object);
    items.push(kit.dated(object, spans));
    return object;
  };

  add(table(kit), [[1962, 2007]]);
  add(chair(kit), [[1962, 2007]]);
  add(burn(kit), [[1972, 2007]]);
  add(cushion(kit), [[1981, 1994]]);
  add(sewingMachine(kit), [[1962, 1970]]);
  add(spools(kit), [[1962, 1970]]);
  add(pins(kit), [[1962, 1970]]);
  add(fabric(kit), [[1962, 1970]]);
  add(thimble(kit, 0.78, 0.775, 0.4), [[1962, 1965]]);
  add(radio(kit), [[1962, 1974]]);
  add(milk(kit), [[1962, 1970]]);
  add(curtain(kit, laceAlpha()), [[1962, 1981]]);

  add(ashtray(kit), [[1970, 1981]]);
  add(papers(kit), [[1970, 1981]]);
  add(heater(kit), [[1970, 1981]]);
  add(bottles(kit), [[1970, 1981]]);
  add(netCurtain(kit), [[1981, 1994]]);

  add(goldfish(kit), [[1981, 1994]]);
  add(rabbit(kit), [[1986, 1994]]);
  add(satchel(kit), [[1984, 1994]]);
  add(shoes(kit), [[1983, 1991]]);
  add(beaker(kit), [[1982, 1994]]);

  add(crates(kit), [[1994, 2007]]);
  add(turntable(kit), [[1994, 2007]]);
  add(speaker(kit), [[1994, 2007]]);
  add(crt(kit), [[1998, 2007]]);
  add(minidiscs(kit), [[1999, 2005]]);
  add(phone(kit), [[2001, 2006]]);
  add(poster(kit), [[1995, 2007]]);
  add(mug(kit), [[1994, 2007]]);
  add(sheetOnWindow(kit), [[1996, 2001]]);

  add(stool(kit), [[2007, 2016]]);
  add(scrubs(kit), [[2007, 2016]]);
  add(lanyard(kit, hook), [[2007, 2016]]);
  add(clock(kit), [[2007, 2016]]);
  add(tiredPlant(kit), [[2008, 2016]]);
  add(sanitizer(kit), [[2010, 2016]]);
  add(blind(kit), [[2007, 2016]]);

  add(daybed(kit), [[2016, 2019]]);
  add(fakePlant(kit), [[2016, 2019]]);
  add(lamp(kit), [[2016, 2019]]);
  add(suitcase(kit), [[2017, 2018], [2018.4, 2019]]);
  add(ringLight(kit), [[2018, 2019]]);

  add(ladder(kit), [[2020, 2022]]);
  add(openBoard(kit), [[2021, 2023]]);
  add(foundCloth(kit), [[2022, 2025]]);
  add(thimble(kit, 1.08, 0.03, 1.02), [[2022, 2024]]);
  add(thimble(kit, 0.2, SILL + 0.02, 1.55), [[2024, 2025]]);
  add(realPlant(kit), [[2023, 2025]]);
  add(scraper(kit), [[2020, 2022]]);

  add(shadeFabric(kit), [[1962, 1994]]);
  add(bareBulb(kit), [[1994, 2007], [2019, 2025]]);
  add(paperLantern(kit), [[2007, 2016]]);
  add(spot(kit), [[2016, 2019]]);

  return items;
}

const SILL = 0.88;

function table(kit: Kit) {
  const g = new THREE.Group();
  const wood = kit.lambert(0x6e5030);
  const dark = kit.lambert(0x4a3420);
  kit.boxAt(g, wood, 0.95, 0.74, 0.42, 1.05, 0.04, 0.52);
  kit.boxAt(g, dark, 0.52, 0.37, 0.22, 0.05, 0.7, 0.05);
  kit.boxAt(g, dark, 1.38, 0.37, 0.22, 0.05, 0.7, 0.05);
  kit.boxAt(g, dark, 0.52, 0.37, 0.62, 0.05, 0.7, 0.05);
  kit.boxAt(g, dark, 1.38, 0.37, 0.62, 0.05, 0.7, 0.05);
  return g;
}

function chair(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.72, 0, 1.52);
  g.rotation.y = 0.72;
  const wood = kit.lambert(0x5a3e26);
  const rushMap = kit.tex(rushSeat(), 1, 1);
  const rush = kit.lambert(0xffffff, { map: rushMap });
  kit.boxAt(g, rush, 0, 0.46, 0, 0.4, 0.035, 0.38);
  kit.boxAt(g, wood, -0.16, 0.23, -0.15, 0.035, 0.46, 0.035);
  kit.boxAt(g, wood, 0.16, 0.23, -0.15, 0.035, 0.46, 0.035);
  kit.boxAt(g, wood, -0.16, 0.23, 0.15, 0.035, 0.46, 0.035);
  kit.boxAt(g, wood, 0.16, 0.23, 0.15, 0.035, 0.46, 0.035);
  kit.boxAt(g, wood, -0.16, 0.72, 0.16, 0.035, 0.52, 0.035);
  kit.boxAt(g, wood, 0.16, 0.72, 0.16, 0.035, 0.52, 0.035);
  kit.boxAt(g, wood, 0, 0.78, 0.16, 0.32, 0.03, 0.03);
  kit.boxAt(g, wood, 0, 0.62, 0.16, 0.32, 0.025, 0.03);
  kit.boxAt(g, wood, -0.2, 0.58, 0, 0.03, 0.03, 0.32);
  kit.boxAt(g, wood, 0.2, 0.58, 0, 0.03, 0.03, 0.32);
  return g;
}

function burn(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.72, 0, 1.52);
  g.rotation.y = 0.72;
  const scorch = kit.lambert(0x2a1c12);
  const m = kit.sphAt(g, scorch, -0.1, 0.482, -0.08, 0.045);
  m.scale.set(0.08, 0.01, 0.06);
  return g;
}

function cushion(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.72, 0, 1.52);
  g.rotation.y = 0.72;
  const knit = kit.lambert(0x7a4a52);
  kit.boxAt(g, knit, 0, 0.5, 0, 0.38, 0.07, 0.36);
  kit.boxAt(g, kit.lambert(0x6a3e46), 0, 0.5, 0, 0.26, 0.072, 0.08);
  return g;
}

function sewingMachine(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.72, 0.76, 0.4);
  const black = kit.phong(0x1a1a1c, { shininess: 40 });
  const gold = kit.phong(0xb08a3a, { shininess: 70 });
  const chrome = kit.phong(0xc8c8c4, { shininess: 90 });
  kit.boxAt(g, black, 0, 0.05, 0, 0.38, 0.07, 0.18);
  kit.boxAt(g, gold, 0, 0.075, 0, 0.382, 0.008, 0.182);
  kit.boxAt(g, black, 0.13, 0.16, 0, 0.08, 0.16, 0.1);
  kit.boxAt(g, black, 0.0, 0.26, 0, 0.26, 0.07, 0.09);
  kit.boxAt(g, black, -0.12, 0.2, 0, 0.08, 0.12, 0.09);
  kit.cylAt(g, chrome, 0.18, 0.16, 0.06, 0.045, 0.02, Math.PI / 2, 0, 0);
  kit.cylAt(g, chrome, -0.12, 0.32, 0, 0.008, 0.08);
  kit.cylAt(g, kit.lambert(0x7a2020), -0.12, 0.37, 0, 0.018, 0.03);
  kit.cylAt(g, chrome, -0.12, 0.12, 0, 0.006, 0.08);
  return g;
}

function spools(kit: Kit) {
  const g = new THREE.Group();
  const cols = [0x7a2028, 0x1a3a5a, 0xc8b070];
  cols.forEach((c, i) => {
    kit.cylAt(g, kit.lambert(c), 1.22 + i * 0.06, 0.79, 0.28, 0.016, 0.05);
    kit.cylAt(g, kit.lambert(0xe8dcc4), 1.22 + i * 0.06, 0.79, 0.28, 0.01, 0.054);
  });
  return g;
}

function pins(kit: Kit) {
  const g = new THREE.Group();
  kit.sphAt(g, kit.lambert(0xa82828), 1.08, 0.79, 0.28, 0.028);
  kit.cylAt(g, kit.lambert(0xc8c8c4), 1.07, 0.82, 0.27, 0.002, 0.04, 0.4, 0, 0.2);
  kit.cylAt(g, kit.lambert(0xc8c8c4), 1.09, 0.825, 0.29, 0.002, 0.035, -0.3, 0, -0.15);
  return g;
}

function fabric(kit: Kit) {
  const g = new THREE.Group();
  kit.cylAt(g, kit.lambert(0x3a4a62), 1.22, 0.8, 0.54, 0.055, 0.28, 0, 0, Math.PI / 2);
  kit.boxAt(g, kit.lambert(0x4a5a72), 1.18, 0.765, 0.42, 0.2, 0.008, 0.16, 0, 0.2, 0);
  return g;
}

function thimble(kit: Kit, x: number, y: number, z: number) {
  const g = new THREE.Group();
  const copper = kit.phong(0xb06a38, { shininess: 80 });
  const mesh = new THREE.Mesh(kit.cone, copper);
  mesh.position.set(x, y + 0.012, z);
  mesh.scale.set(0.02, 0.032, 0.02);
  mesh.castShadow = true;
  g.add(mesh);
  return g;
}

function radio(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.28, 0.82, 0.42);
  const bakelite = kit.phong(0x2e241c, { shininess: 30 });
  kit.boxAt(g, bakelite, 0, 0, 0, 0.22, 0.12, 0.12);
  kit.boxAt(g, kit.lambert(0xc8c0a8), 0, 0.02, 0.062, 0.16, 0.05, 0.004);
  kit.cylAt(g, kit.lambert(0xc8b070), 0.07, 0.03, 0.064, 0.016, 0.01, Math.PI / 2, 0, 0);
  kit.cylAt(g, kit.lambert(0x1a1a1a), -0.06, 0.03, 0.064, 0.012, 0.008, Math.PI / 2, 0, 0);
  return g;
}

function milk(kit: Kit) {
  const g = new THREE.Group();
  const glass = kit.phong(0xe8f0f4, { transparent: true, opacity: 0.45, shininess: 70 });
  kit.cylAt(g, glass, 0.2, SILL + 0.1, 1.52, 0.03, 0.16);
  kit.cylAt(g, kit.lambert(0xf4f0e4), 0.2, SILL + 0.08, 1.52, 0.026, 0.1);
  kit.cylAt(g, kit.lambert(0xe8e0c8), 0.2, SILL + 0.18, 1.52, 0.034, 0.022);
  return g;
}

function curtain(kit: Kit, alpha: HTMLCanvasElement) {
  const g = new THREE.Group();
  const map = kit.tex(alpha, 3, 4);
  const mat = kit.lambert(0xf4eee4, {
    alphaMap: map,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  kit.boxAt(g, mat, 0.03, 1.48, 0.78, 0.006, 1.16, 0.28).castShadow = false;
  kit.boxAt(g, mat, 0.03, 1.48, 1.78, 0.006, 1.16, 0.28).castShadow = false;
  return g;
}

function netCurtain(kit: Kit) {
  const g = new THREE.Group();
  const mat = kit.lambert(0xe8e4dc, {
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  kit.boxAt(g, mat, 0.05, 1.52, 1.28, 0.008, 1.28, 1.3).castShadow = false;
  return g;
}

function ashtray(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.18, 0.765, 0.4);
  kit.cylAt(g, kit.lambert(0x8a8a82), 0, 0.01, 0, 0.055, 0.018);
  kit.cylAt(g, kit.lambert(0x3a3a34), 0, 0.012, 0, 0.042, 0.01);
  const butt = kit.lambert(0xc8b8a0);
  kit.cylAt(g, butt, 0.02, 0.02, 0.01, 0.006, 0.04, 0, 0, 1.1);
  kit.cylAt(g, kit.lambert(0x4a2018), 0.03, 0.02, 0.02, 0.007, 0.012);
  return g;
}

function papers(kit: Kit) {
  const g = new THREE.Group();
  const pink = kit.lambert(0xe8b0b8);
  const cream = kit.lambert(0xe8e0d0);
  kit.boxAt(g, pink, 0.62, 0.765, 0.48, 0.22, 0.006, 0.16, 0, 0.15, 0);
  kit.boxAt(g, cream, 0.64, 0.772, 0.5, 0.2, 0.005, 0.15, 0, -0.1, 0);
  kit.boxAt(g, pink, 0.61, 0.778, 0.47, 0.21, 0.005, 0.14, 0, 0.05, 0);
  return g;
}

function heater(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.42, 0, 2.05);
  const cream = kit.lambert(0xd8d0c0);
  const rust = kit.lambert(0x6a3a28);
  kit.cylAt(g, cream, 0, 0.28, 0, 0.12, 0.48);
  kit.cylAt(g, rust, 0, 0.54, 0, 0.08, 0.06);
  kit.cylAt(g, kit.lambert(0x2a2a28), 0, 0.58, 0, 0.03, 0.08);
  kit.boxAt(g, cream, 0, 0.04, 0, 0.16, 0.04, 0.16);
  return g;
}

function bottles(kit: Kit) {
  const g = new THREE.Group();
  const brown = kit.phong(0x4a2a18, { transparent: true, opacity: 0.7, shininess: 50 });
  kit.cylAt(g, brown, 0.38, 0.12, 0.55, 0.028, 0.2);
  kit.cylAt(g, brown, 0.38, 0.24, 0.55, 0.016, 0.08);
  kit.cylAt(g, brown, 0.46, 0.1, 0.62, 0.028, 0.16);
  kit.cylAt(g, brown, 0.46, 0.2, 0.62, 0.016, 0.06);
  return g;
}

function goldfish(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.88, 0.76, 0.42);
  const glass = kit.phong(0xc8e0e4, { transparent: true, opacity: 0.28, shininess: 80, depthWrite: false });
  kit.sphAt(g, glass, 0, 0.14, 0, 0.13);
  kit.sphAt(g, kit.lambert(0x6a9aaa, { transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.12, 0, 0.11);
  kit.cylAt(g, kit.lambert(0x8a6a48), 0, 0.02, 0, 0.1, 0.03);
  const fish = kit.sphAt(g, kit.lambert(0xd45a20), 0.02, 0.13, 0.01, 0.028);
  fish.scale.set(0.04, 0.02, 0.018);
  return g;
}

function rabbit(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.28, 0.58, 1.42);
  const fur = kit.lambert(0xc8b8a8);
  const inner = kit.lambert(0xe8c0c0);
  kit.sphAt(g, fur, 0, 0.05, 0, 0.055);
  kit.sphAt(g, fur, 0.02, 0.1, 0.01, 0.038);
  kit.cylAt(g, fur, -0.01, 0.15, 0.0, 0.012, 0.06, 0.3, 0, 0);
  kit.cylAt(g, fur, 0.04, 0.15, 0.0, 0.012, 0.06, -0.2, 0, 0);
  kit.cylAt(g, inner, -0.01, 0.15, 0.008, 0.007, 0.05, 0.3, 0, 0);
  return g;
}

function satchel(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.85, 0, 0.32);
  const leather = kit.lambert(0x4a2c1c);
  kit.boxAt(g, leather, 0, 0.12, 0, 0.22, 0.16, 0.08);
  kit.boxAt(g, kit.lambert(0x3a2014), 0, 0.2, 0.02, 0.22, 0.04, 0.08);
  kit.boxAt(g, kit.lambert(0x8a6a28), 0, 0.16, 0.05, 0.04, 0.03, 0.01);
  return g;
}

function shoes(kit: Kit) {
  const g = new THREE.Group();
  const red = kit.lambert(0x8a2028);
  kit.boxAt(g, red, 1.62, 0.03, 0.72, 0.08, 0.04, 0.16, 0, 0.2, 0);
  kit.boxAt(g, red, 1.72, 0.03, 0.78, 0.08, 0.04, 0.16, 0, 0.35, 0);
  kit.boxAt(g, kit.lambert(0xe8e0d4), 1.62, 0.05, 0.68, 0.07, 0.02, 0.06);
  return g;
}

function beaker(kit: Kit) {
  const g = new THREE.Group();
  kit.cylAt(g, kit.lambert(0xe07040), 1.32, 0.8, 0.55, 0.028, 0.07);
  kit.cylAt(g, kit.lambert(0xf0d0b0), 1.32, 0.8, 0.55, 0.02, 0.05);
  return g;
}

function crates(kit: Kit) {
  const g = new THREE.Group();
  const milk = kit.lambert(0xc8c8c4);
  kit.boxAt(g, milk, 1.95, 0.14, 0.38, 0.34, 0.28, 0.28);
  kit.boxAt(g, milk, 1.98, 0.42, 0.4, 0.34, 0.28, 0.28);
  const sleeve = kit.lambert(0x1a1a1c);
  for (let i = 0; i < 5; i++) {
    kit.boxAt(g, sleeve, 1.95, 0.08 + i * 0.035, 0.38, 0.3, 0.02, 0.24);
    kit.boxAt(g, sleeve, 1.98, 0.36 + i * 0.035, 0.4, 0.3, 0.02, 0.24);
  }
  kit.boxAt(g, kit.lambert(0x8a2020), 1.95, 0.1, 0.38, 0.3, 0.02, 0.24);
  kit.boxAt(g, kit.lambert(0x20408a), 1.98, 0.4, 0.4, 0.3, 0.02, 0.24);
  return g;
}

function turntable(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.72, 0.76, 0.42);
  const plinth = kit.lambert(0x2a2a2c);
  kit.boxAt(g, plinth, 0, 0.03, 0, 0.36, 0.05, 0.28);
  kit.cylAt(g, kit.lambert(0x1a1a1c), -0.02, 0.06, 0, 0.1, 0.02);
  kit.cylAt(g, kit.phong(0x8a8a88, { shininess: 60 }), -0.02, 0.07, 0, 0.09, 0.012);
  kit.boxAt(g, kit.lambert(0xc8c8c4), 0.12, 0.08, 0.04, 0.012, 0.01, 0.14, 0, 0, 0.4);
  kit.boxAt(g, kit.lambert(0x1a1a1c), 0.14, 0.055, -0.08, 0.04, 0.02, 0.04);
  return g;
}

function speaker(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.38, 0, 0.55);
  kit.boxAt(g, kit.lambert(0x2a2a28), 0, 0.28, 0, 0.22, 0.48, 0.2);
  kit.cylAt(g, kit.lambert(0x1a1a1a), 0.11, 0.36, 0, 0.07, 0.02, 0, 0, Math.PI / 2);
  kit.cylAt(g, kit.lambert(0x1a1a1a), 0.11, 0.2, 0, 0.05, 0.02, 0, 0, Math.PI / 2);
  return g;
}

function crt(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.18, 0.76, 0.4);
  const beige = kit.lambert(0xc8c0b0);
  kit.boxAt(g, beige, 0, 0.16, 0, 0.32, 0.28, 0.28);
  kit.boxAt(g, kit.lambert(0x1a2a22), 0, 0.17, 0.145, 0.26, 0.2, 0.02);
  kit.boxAt(g, beige, 0.18, 0.04, 0.2, 0.12, 0.02, 0.32, 0, 0.2, 0);
  kit.boxAt(g, kit.lambert(0x2a2a28), 0.22, 0.05, 0.32, 0.08, 0.012, 0.12);
  return g;
}

function minidiscs(kit: Kit) {
  const g = new THREE.Group();
  const cases = [0x2a5a8a, 0x8a2a3a, 0x2a7a4a, 0xc8c8c4];
  cases.forEach((c, i) => {
    kit.boxAt(g, kit.lambert(c), 1.42, 0.768 + i * 0.012, 0.55, 0.08, 0.008, 0.08, 0, i * 0.08, 0);
  });
  return g;
}

function phone(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.16, SILL + 0.02, 1.62);
  kit.boxAt(g, kit.lambert(0x1a1a1e), 0, 0.012, 0, 0.042, 0.018, 0.11);
  kit.boxAt(g, kit.lambert(0x3a4a38), 0, 0.02, -0.02, 0.03, 0.004, 0.022);
  kit.boxAt(g, kit.lambert(0x2a2a2c), 0, 0.02, 0.03, 0.028, 0.002, 0.04);
  return g;
}

function poster(kit: Kit) {
  const g = new THREE.Group();
  kit.boxAt(g, kit.lambert(0x1a1a1c), 2.15, 1.55, 0.015, 0.42, 0.58, 0.006);
  kit.boxAt(g, kit.lambert(0xc45a2a), 2.15, 1.62, 0.02, 0.36, 0.2, 0.004);
  kit.boxAt(g, kit.lambert(0xe8d8b0), 2.15, 1.38, 0.02, 0.36, 0.22, 0.004);
  return g;
}

function mug(kit: Kit) {
  const g = new THREE.Group();
  kit.cylAt(g, kit.lambert(0xe8e0d4), 1.38, 0.8, 0.28, 0.03, 0.07);
  kit.cylAt(g, kit.lambert(0x4a2a18, { transparent: true, opacity: 0.5 }), 1.38, 0.79, 0.28, 0.024, 0.03);
  kit.boxAt(g, kit.lambert(0xe8e0d4), 1.42, 0.8, 0.28, 0.03, 0.04, 0.012);
  return g;
}

function sheetOnWindow(kit: Kit) {
  const g = new THREE.Group();
  kit.boxAt(g, kit.lambert(0x2a2030), 0.03, 1.48, 1.28, 0.008, 1.15, 1.22).castShadow = false;
  return g;
}

function stool(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.38, 0, 1.05);
  const pine = kit.lambert(0xc8a060);
  kit.cylAt(g, pine, 0, 0.42, 0, 0.16, 0.04);
  kit.cylAt(g, pine, -0.1, 0.21, -0.1, 0.02, 0.42);
  kit.cylAt(g, pine, 0.1, 0.21, -0.1, 0.02, 0.42);
  kit.cylAt(g, pine, 0, 0.21, 0.12, 0.02, 0.42);
  return g;
}

function scrubs(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.38, 0.46, 1.05);
  kit.boxAt(g, kit.lambert(0x4a7a8a), 0, 0.03, 0, 0.28, 0.05, 0.2);
  kit.boxAt(g, kit.lambert(0x3e6e7e), 0, 0.06, 0, 0.24, 0.03, 0.16);
  return g;
}

function lanyard(kit: Kit, hook: THREE.Object3D) {
  const g = new THREE.Group();
  const blue = kit.lambert(0x1a3a7a);
  kit.boxAt(g, blue, hook.position.x, hook.position.y - 0.12, hook.position.z + 0.03, 0.012, 0.22, 0.004);
  kit.boxAt(g, kit.lambert(0xe8e4d8), hook.position.x, hook.position.y - 0.26, hook.position.z + 0.04, 0.07, 0.1, 0.008);
  kit.boxAt(g, kit.lambert(0x2a5a8a), hook.position.x, hook.position.y - 0.23, hook.position.z + 0.045, 0.06, 0.03, 0.004);
  return g;
}

function clock(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.16, SILL + 0.04, 1.7);
  kit.boxAt(g, kit.lambert(0x1a1a1c), 0, 0, 0, 0.08, 0.05, 0.1);
  kit.boxAt(g, kit.lambert(0x4a2020), 0, 0.02, 0.052, 0.06, 0.022, 0.006);
  return g;
}

function tiredPlant(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.16, SILL + 0.02, 0.82);
  kit.cylAt(g, kit.lambert(0x8a4a32), 0, 0.05, 0, 0.05, 0.1);
  kit.cylAt(g, kit.lambert(0x4a3a28), 0, 0.08, 0, 0.04, 0.04);
  kit.boxAt(g, kit.lambert(0x6a7a3a), 0.02, 0.16, 0, 0.08, 0.12, 0.02, 0.4, 0.2, 0);
  kit.boxAt(g, kit.lambert(0x8a8a40), -0.02, 0.14, 0.02, 0.07, 0.08, 0.02, -0.5, -0.3, 0);
  return g;
}

function sanitizer(kit: Kit) {
  const g = new THREE.Group();
  kit.cylAt(g, kit.phong(0xc8d8dc, { transparent: true, opacity: 0.55, shininess: 40 }), 0.2, SILL + 0.06, 1.48, 0.018, 0.08);
  kit.boxAt(g, kit.lambert(0x2a2a2c), 0.2, SILL + 0.11, 1.48, 0.02, 0.03, 0.02);
  return g;
}

function blind(kit: Kit) {
  const g = new THREE.Group();
  kit.boxAt(g, kit.lambert(0x4a4a4c), 0.03, 2.08, 1.28, 0.04, 0.07, 1.34);
  kit.boxAt(g, kit.lambert(0x3a3a40), 0.04, 1.55, 1.18, 0.008, 1.04, 1.08).castShadow = false;
  return g;
}

function daybed(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.55, 0, 0.55);
  kit.boxAt(g, kit.lambert(0x8a8680), 0, 0.18, 0, 1.6, 0.2, 0.7);
  kit.boxAt(g, kit.lambert(0x6a6864), 0, 0.32, 0, 1.55, 0.1, 0.66);
  kit.boxAt(g, kit.lambert(0x7a7874), 0.5, 0.38, 0, 0.5, 0.08, 0.4);
  return g;
}

function fakePlant(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.28, 0, 0.42);
  kit.cylAt(g, kit.lambert(0xd8d4cc), 0, 0.16, 0, 0.1, 0.28);
  const leaf = kit.lambert(0x2a5a38);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    kit.boxAt(g, leaf, Math.cos(a) * 0.12, 0.55, Math.sin(a) * 0.08, 0.18, 0.28, 0.02, 0.5, a, 0);
  }
  return g;
}

function lamp(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(2.15, 0, 0.42);
  kit.cylAt(g, kit.lambert(0x2a2a2c), 0, 0.18, 0, 0.08, 0.04);
  kit.cylAt(g, kit.lambert(0xd8d4cc), 0, 0.5, 0, 0.015, 0.64);
  kit.cylAt(g, kit.lambert(0xe8e4dc), 0, 0.88, 0, 0.12, 0.14);
  return g;
}

function suitcase(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(2.05, 0, 1.15);
  kit.boxAt(g, kit.lambert(0x2a3a4a), 0, 0.16, 0, 0.48, 0.28, 0.18);
  kit.boxAt(g, kit.lambert(0xc8c4bc), 0, 0.3, 0, 0.2, 0.03, 0.06);
  return g;
}

function ringLight(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.55, 0, 1.85);
  kit.cylAt(g, kit.lambert(0x2a2a2c), 0, 0.55, 0, 0.02, 1.1);
  kit.cylAt(g, kit.lambert(0x2a2a2c), 0, 0.02, 0, 0.14, 0.03);
  const ring = new THREE.Mesh(kit.torus, kit.lambert(0xf4f0e8, { emissive: new THREE.Color(0x404040) }));
  ring.position.set(0.12, 1.15, 0);
  ring.scale.set(0.18, 0.18, 0.18);
  ring.rotation.y = Math.PI / 2;
  g.add(ring);
  return g;
}

function ladder(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(2.15, 0, 0.85);
  g.rotation.z = -0.18;
  const al = kit.lambert(0x9a9a94);
  kit.boxAt(g, al, -0.16, 0.7, 0, 0.03, 1.4, 0.03);
  kit.boxAt(g, al, 0.16, 0.7, 0, 0.03, 1.4, 0.03);
  for (let i = 0; i < 5; i++) {
    kit.boxAt(g, al, 0, 0.2 + i * 0.24, 0, 0.32, 0.02, 0.03);
  }
  return g;
}

function openBoard(kit: Kit) {
  const g = new THREE.Group();
  kit.boxAt(g, kit.lambert(0x1a120c), 1.02, 0.002, 0.88, 0.22, 0.005, 0.55);
  kit.boxAt(g, kit.lambert(0x6a4a2c), 1.28, 0.1, 1.05, 0.16, 0.02, 0.58, 0, 0, 0.62);
  return g;
}

function foundCloth(kit: Kit) {
  const g = new THREE.Group();
  kit.boxAt(g, kit.lambert(0xf4eee4), 1.08, 0.014, 1.02, 0.2, 0.01, 0.14, 0, 0.25, 0);
  return g;
}

function realPlant(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(0.2, SILL + 0.02, 0.84);
  kit.cylAt(g, kit.lambert(0x8a4a32), 0, 0.06, 0, 0.055, 0.12);
  kit.cylAt(g, kit.lambert(0x3a2a1c), 0, 0.1, 0, 0.045, 0.04);
  kit.boxAt(g, kit.lambert(0x2a5a30), 0.03, 0.22, 0, 0.1, 0.18, 0.02, 0.3, 0.2, 0);
  kit.boxAt(g, kit.lambert(0x245028), -0.03, 0.2, 0.02, 0.09, 0.14, 0.02, -0.4, -0.2, 0);
  kit.boxAt(g, kit.lambert(0x2a6028), 0, 0.26, -0.02, 0.08, 0.16, 0.02, 0.1, 0.4, 0);
  return g;
}

function scraper(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(2.35, 0.02, 0.42);
  kit.boxAt(g, kit.lambert(0xc8c4bc), 0, 0.01, 0, 0.08, 0.008, 0.06);
  kit.boxAt(g, kit.lambert(0x3a2a1c), 0.08, 0.012, 0, 0.12, 0.014, 0.022);
  return g;
}

function shadeFabric(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.15, 2.22, 1.05);
  kit.cylAt(g, kit.lambert(0x2a2a28), 0, 0.16, 0, 0.01, 0.22);
  kit.cylAt(g, kit.lambert(0xc4a878), 0, 0.02, 0, 0.14, 0.16);
  return g;
}

function bareBulb(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.15, 2.28, 1.05);
  kit.cylAt(g, kit.lambert(0x2a2a28), 0, 0.1, 0, 0.008, 0.14);
  kit.sphAt(g, kit.lambert(0xf4ecd0, { emissive: new THREE.Color(0x33280c) }), 0, 0.02, 0, 0.035);
  return g;
}

function paperLantern(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.15, 2.15, 1.05);
  kit.sphAt(g, kit.lambert(0xe8dcc4, { emissive: new THREE.Color(0x221c10) }), 0, 0, 0, 0.16);
  kit.cylAt(g, kit.lambert(0x2a2a28), 0, 0.2, 0, 0.008, 0.12);
  return g;
}

function spot(kit: Kit) {
  const g = new THREE.Group();
  g.position.set(1.15, 2.42, 1.05);
  kit.cylAt(g, kit.lambert(0xe8e4dc), 0, 0, 0, 0.05, 0.06);
  kit.cylAt(g, kit.lambert(0x2a2a28), 0, -0.04, 0, 0.04, 0.04);
  return g;
}
