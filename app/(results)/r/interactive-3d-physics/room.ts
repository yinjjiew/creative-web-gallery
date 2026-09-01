/**
 * A small gallery: white plaster, raking window, pale floor. The mobile
 * is the only object. Scale is a room you could stand in, not a void.
 */
import * as THREE from "three";

export function buildRoom() {
  const group = new THREE.Group();
  const owned: (THREE.BufferGeometry | THREE.Material)[] = [];

  const mat = (
    color: number,
    extra: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0] = {}
  ) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      metalness: 0,
      ...extra,
    });
    owned.push(m);
    return m;
  };

  const box = (
    material: THREE.Material,
    pos: [number, number, number],
    size: [number, number, number]
  ) => {
    const g = new THREE.BoxGeometry(...size);
    owned.push(g);
    const mesh = new THREE.Mesh(g, material);
    mesh.position.set(...pos);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  const plaster = mat(0xf3eee6);
  const floor = mat(0xcec6b8, { roughness: 0.84 });
  const ceiling = mat(0xf7f3ec);
  const reveal = mat(0xe7e0d4);
  const glass = mat(0xf4f7fb, {
    roughness: 0.08,
    metalness: 0,
    emissive: 0xf3ead8,
    emissiveIntensity: 0.42,
  });
  const rail = mat(0xddd6c8);

  // Floor, three walls, ceiling. Open on the camera side.
  box(floor, [0, -0.04, 0.2], [7.4, 0.08, 6.2]);
  box(plaster, [0, 2.15, -2.55], [7.4, 4.4, 0.12]);
  const wash = mat(0xf7f2e8, {
    roughness: 0.88,
    emissive: 0xfff3dc,
    emissiveIntensity: 0.08,
  });
  box(wash, [-1.15, 2.2, -2.48], [2.6, 3.6, 0.02]);
  box(plaster, [-3.55, 2.15, 0.15], [0.12, 4.4, 5.6]);
  box(plaster, [3.55, 2.15, 0.15], [0.12, 4.4, 5.6]);
  box(ceiling, [0, 4.34, 0.15], [7.4, 0.08, 5.6]);

  // Picture rail and a thin skirting — enough architecture to hold scale.
  box(rail, [0, 3.42, -2.48], [7.1, 0.03, 0.04]);
  box(rail, [0, 0.1, -2.48], [7.1, 0.08, 0.03]);

  // Window on the left wall, set back, so light rakes the back wall.
  box(reveal, [-3.42, 2.35, -0.35], [0.08, 2.5, 1.85]);
  const pane = box(glass, [-3.38, 2.35, -0.35], [0.02, 2.28, 1.62]);
  pane.castShadow = false;
  pane.receiveShadow = false;

  const mullion = mat(0xe2dbd0);
  box(mullion, [-3.37, 2.35, -0.35], [0.03, 2.3, 0.03]);
  box(mullion, [-3.37, 2.35, -0.35], [0.03, 0.03, 1.62]);

  return {
    group,
    dispose() {
      for (const item of owned) item.dispose();
    },
  };
}

export function buildLights(scene: THREE.Scene) {
  const hemi = new THREE.HemisphereLight(0xe8eef4, 0xc9c0b2, 0.42);
  scene.add(hemi);

  // Window sun: warm, low, raking. This is the photograph.
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.15);
  sun.position.set(-4.2, 3.6, 0.4);
  sun.target.position.set(0.2, 1.6, -1.4);
  sun.intensity = 2.45;
  sun.castShadow = true;
  sun.shadow.mapSize.set(768, 768);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 14;
  sun.shadow.camera.left = -3.2;
  sun.shadow.camera.right = 3.2;
  sun.shadow.camera.top = 3.4;
  sun.shadow.camera.bottom = -2.2;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  const fill = new THREE.DirectionalLight(0xe4ebf4, 0.35);
  fill.position.set(2.8, 2.4, 3.2);
  scene.add(fill);

  const bounce = new THREE.PointLight(0xffe8c8, 4.5, 8, 2);
  bounce.position.set(-1.6, 1.1, 0.8);
  scene.add(bounce);

  return {
    dispose() {
      scene.remove(hemi, sun, sun.target, fill, bounce);
    },
  };
}

export function buildEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const geo = new THREE.BoxGeometry();
  const owned: (THREE.BufferGeometry | THREE.Material)[] = [geo];

  const wall = new THREE.MeshLambertMaterial({ color: 0xf2ebe2, side: THREE.BackSide });
  owned.push(wall);
  const room = new THREE.Mesh(geo, wall);
  room.scale.set(10, 7, 10);
  scene.add(room);

  const pane = new THREE.MeshLambertMaterial({
    color: 0x000000,
    emissive: 0xfff3d8,
    emissiveIntensity: 3.2,
  });
  owned.push(pane);
  const windowMesh = new THREE.Mesh(geo, pane);
  windowMesh.position.set(-4.4, 2.4, -0.4);
  windowMesh.scale.set(0.08, 3.2, 2.4);
  scene.add(windowMesh);

  const floor = new THREE.MeshLambertMaterial({ color: 0xc8bfb0 });
  owned.push(floor);
  const slab = new THREE.Mesh(geo, floor);
  slab.position.set(0, -1.6, 0);
  slab.scale.set(9, 0.2, 9);
  scene.add(slab);

  const key = new THREE.PointLight(0xfff0d4, 420, 20, 2);
  key.position.set(-4, 3.2, 0.2);
  scene.add(key);
  const fill = new THREE.PointLight(0xe8eef6, 180, 18, 2);
  fill.position.set(3.2, 2.8, 3);
  scene.add(fill);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0, 0.1, 20);
  pmrem.dispose();
  for (const item of owned) item.dispose();

  return {
    texture: target.texture,
    dispose() {
      target.dispose();
    },
  };
}
