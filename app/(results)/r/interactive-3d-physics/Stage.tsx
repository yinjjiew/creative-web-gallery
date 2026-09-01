"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  createMobile,
  energy,
  leafById,
  restImpulse,
  stepMobile,
  type Grab,
  type LeafId,
  type Mobile,
} from "./physics";
import { buildEnvironment, buildLights, buildRoom } from "./room";
import {
  barGeometry,
  bearingMaterial,
  hookGeometry,
  leafMaterial,
  makeLeafGeometry,
  stemPoint,
  wireMaterial,
} from "./sculpture";

const SIM = 1 / 120;
const MAX_STEPS = 4;
const Y_UP = new THREE.Vector3(0, 1, 0);
const NUDGE_ORDER: LeafId[] = [
  "wrack",
  "drift",
  "glass",
  "mussel",
  "limpet",
  "brick",
  "stone",
];

type Props = {
  nudgeRef: {
    current: { queued: number; apply: (() => void) | null };
  };
  onStatus: (text: string) => void;
  onHeld: (held: boolean) => void;
};

function pixelRatio(w: number, h: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const budget = 2_200_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

function placeRod(
  mesh: THREE.Mesh,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  radius: number,
  dir: THREE.Vector3
) {
  dir.set(bx - ax, by - ay, bz - az);
  const len = dir.length();
  if (len < 1e-5) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.set(ax, ay, az);
  mesh.scale.set(radius, len, radius);
  mesh.quaternion.setFromUnitVectors(Y_UP, dir.multiplyScalar(1 / len));
}

export default function Stage({ nudgeRef, onStatus, onHeld }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = createMobile();
    const owned: { dispose: () => void }[] = [];

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0xefebe3, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xefebe3);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.12, 24);
    const frameCamera = (w: number) => {
      if (w < 560) {
        camera.fov = 38;
        camera.position.set(0.42, 1.78, 4.05);
      } else {
        camera.fov = 32;
        camera.position.set(0.62, 1.74, 3.42);
      }
      camera.lookAt(0.05, 2.58, -0.3);
      camera.updateProjectionMatrix();
    };

    const env = buildEnvironment(renderer);
    scene.environment = env.texture;
    owned.push(env);

    const room = buildRoom();
    scene.add(room.group);
    owned.push(room);

    const lights = buildLights(scene);
    owned.push(lights);

    const wireMat = wireMaterial();
    const bearMat = bearingMaterial();
    const rodGeo = barGeometry();
    const bearGeo = new THREE.SphereGeometry(0.0075, 10, 8);
    const hookGeo = hookGeometry();
    owned.push(wireMat, bearMat, rodGeo, bearGeo, hookGeo);

    const hanging = new THREE.Group();
    scene.add(hanging);

    const hookMesh = new THREE.Mesh(hookGeo, bearMat);
    hookMesh.castShadow = true;
    const hookP = mobile.particles[mobile.hook];
    hookMesh.position.set(hookP.x, hookP.y + 0.012, hookP.z);
    hanging.add(hookMesh);

    const roseGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.01, 16);
    const rose = new THREE.Mesh(roseGeo, bearMat);
    rose.position.set(hookP.x, hookP.y + 0.04, hookP.z);
    hanging.add(rose);
    owned.push(roseGeo);

    type RodVis = {
      mesh: THREE.Mesh;
      a: number;
      b: number;
      radius: number;
    };
    const rods: RodVis[] = [];
    const addRod = (a: number, b: number, radius: number) => {
      const mesh = new THREE.Mesh(rodGeo, wireMat);
      mesh.castShadow = true;
      hanging.add(mesh);
      rods.push({ mesh, a, b, radius });
    };

    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();
    const tmpC = new THREE.Vector3();
    const tmpD = new THREE.Vector3();

    for (const arm of mobile.arms) {
      addRod(arm.hang, arm.pivot, 0.0026);
      addRod(arm.left, arm.right, 0.0033);
      const stem = new THREE.Mesh(rodGeo, wireMat);
      stem.castShadow = true;
      hanging.add(stem);
      rods.push({
        mesh: stem,
        a: arm.pivot,
        b: -1,
        radius: 0.0024,
      });
      (stem.userData as { arm: typeof arm }).arm = arm;

      const bearing = new THREE.Mesh(bearGeo, bearMat);
      bearing.castShadow = true;
      hanging.add(bearing);
      bearing.userData.follow = arm.pivot;
    }

    const leafMeshes: THREE.Mesh[] = [];
    for (const leaf of mobile.leaves) {
      const geo = makeLeafGeometry(leaf.id);
      const mat = leafMaterial(leaf.id);
      owned.push(geo, mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const grow =
        leaf.id === "wrack"
          ? 1.75
          : leaf.id === "drift"
            ? 1.4
            : leaf.id === "mussel"
              ? 1.7
              : 1.55;
      mesh.scale.setScalar(grow);
      mesh.userData.leaf = leaf;
      hanging.add(mesh);
      leafMeshes.push(mesh);
    }

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane();
    const hit = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const grabOrigin = new THREE.Vector3();
    const pull = new THREE.Vector3();

    let grab: Grab | null = null;
    let pendingImpulse: {
      particle: number;
      x: number;
      y: number;
      z: number;
    } | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let lastX = 0;
    let lastY = 0;
    let travel = 0;
    let lastNudge = 0;
    let status = "";
    let held = false;
    let running = true;
    let last = performance.now();
    let acc = 0;
    let frame = 0;
    let wait = 0;

    const setStatus = (next: string) => {
      if (next === status) return;
      status = next;
      onStatus(next);
    };
    const setHeld = (next: boolean) => {
      if (next === held) return;
      held = next;
      onHeld(next);
    };

    const resize = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      renderer.setPixelRatio(pixelRatio(w, h));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      frameCamera(w);
      renderer.render(scene, camera);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const pointerNdc = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    const worldOnPlane = (event: PointerEvent) => {
      pointerNdc(event);
      raycaster.setFromCamera(ndc, camera);
      camera.getWorldDirection(camDir);
      plane.setFromNormalAndCoplanarPoint(camDir, grabOrigin);
      if (!raycaster.ray.intersectPlane(plane, hit)) return null;
      pull.copy(hit).sub(grabOrigin);
      const max = 0.46;
      if (pull.length() > max) pull.setLength(max);
      return tmpA.copy(grabOrigin).add(pull);
    };

    const nearestLeaf = (event: PointerEvent, maxPx: number) => {
      const rect = pointerNdc(event);
      let best: THREE.Mesh | null = null;
      let bestD = maxPx;
      for (const mesh of leafMeshes) {
        mesh.getWorldPosition(tmpB);
        tmpB.project(camera);
        const dx = ((tmpB.x - ndc.x) * rect.width) / 2;
        const dy = ((tmpB.y - ndc.y) * rect.height) / 2;
        const d = Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = mesh;
        }
      }
      return best;
    };

    const pickLeaf = (event: PointerEvent) => {
      pointerNdc(event);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(leafMeshes, false);
      if (hits[0]?.object instanceof THREE.Mesh) return hits[0].object;
      const fat = event.pointerType === "touch" || wrap.clientWidth < 560 ? 76 : 44;
      return nearestLeaf(event, fat);
    };

    const startGrab = (mesh: THREE.Mesh, event: PointerEvent) => {
      const leaf = mesh.userData.leaf as Mobile["leaves"][number];
      const p = mobile.particles[leaf.particle];
      grabOrigin.set(p.x, p.y, p.z);
      grab = {
        particle: leaf.particle,
        x: p.x,
        y: p.y,
        z: p.z,
        strength: 1,
      };
      pointerX = lastX = event.clientX;
      pointerY = lastY = event.clientY;
      travel = 0;
      setHeld(true);
      ensureLoop();
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      const mesh = pickLeaf(event);
      if (!mesh) return;
      event.preventDefault();
      startGrab(mesh, event);
    };

    const onMove = (event: PointerEvent) => {
      if (!grab) return;
      event.preventDefault();
      pointerX = event.clientX;
      pointerY = event.clientY;
      travel += Math.hypot(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
      const at = worldOnPlane(event);
      if (!at) return;
      grab.x = at.x;
      grab.y = at.y;
      grab.z = at.z;
      stepMobile(mobile, SIM, grab, null, reduce);
    };

    const onUp = (event: PointerEvent) => {
      if (!grab) return;
      const p = grab.particle;
      const rect = renderer.domElement.getBoundingClientRect();
      const vx = ((event.clientX - lastX) / Math.max(rect.width, 1)) * 14;
      const vy = (-(event.clientY - lastY) / Math.max(rect.height, 1)) * 14;
      camera.getWorldDirection(camDir);
      const right = tmpC.crossVectors(camDir, Y_UP).normalize();
      const up = tmpD.crossVectors(right, camDir).normalize();

      grab = null;
      setHeld(false);
      if (travel < 10) {
        runImpulse(restImpulse(mobile, p, reduce ? 0.32 : 0.55));
      } else {
        const scale = THREE.MathUtils.clamp(
          Math.hypot(vx, vy) * (reduce ? 0.55 : 1.15),
          0.16,
          reduce ? 1.1 : 2.6
        );
        runImpulse({
          particle: p,
          x: right.x * vx * scale + up.x * vy * scale,
          y: 0.2 * scale + up.y * vy * scale,
          z: right.z * vx * scale + up.z * vy * scale,
        });
      }
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };

    const runImpulse = (
      impulse: { particle: number; x: number; y: number; z: number },
      steps = 36
    ) => {
      pendingImpulse = impulse;
      for (let i = 0; i < steps; i++) {
        const next = pendingImpulse;
        pendingImpulse = null;
        stepMobile(mobile, SIM, grab, next, reduce);
      }
      acc = 0;
      const ke = paint();
      if (ke > 0.0012 || grab) ensureLoop();
    };

    const shoveLeaf = (id: LeafId, scale: number) => {
      const leaf = leafById(mobile, id);
      runImpulse(restImpulse(mobile, leaf.particle, scale));
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        if (
          event.target instanceof HTMLElement &&
          (event.target.tagName === "BUTTON" || event.target.tagName === "A")
        ) {
          return;
        }
        event.preventDefault();
        shoveLeaf(NUDGE_ORDER[lastNudge % NUDGE_ORDER.length], reduce ? 0.4 : 1.15);
        lastNudge += 1;
        nudgeRef.current.queued = lastNudge;
        return;
      }
      const n = Number(event.key);
      if (n >= 1 && n <= 7) {
        shoveLeaf(NUDGE_ORDER[n - 1], reduce ? 0.36 : 0.95);
      }
    };

    const flushNudge = () => {
      const queued = nudgeRef.current.queued;
      if (queued === lastNudge) return;
      const steps = queued - lastNudge;
      lastNudge = queued;
      const id = NUDGE_ORDER[Math.max(0, lastNudge - 1) % NUDGE_ORDER.length];
      shoveLeaf(id, (reduce ? 0.4 : 1.15) * Math.min(steps, 3));
    };

    const dir = new THREE.Vector3();
    const sync = () => {
      const ps = mobile.particles;
      for (const rod of rods) {
        if (rod.b < 0) {
          const arm = (rod.mesh.userData as { arm: Mobile["arms"][number] }).arm;
          const l = ps[arm.left];
          const r = ps[arm.right];
          const p = ps[arm.pivot];
          stemPoint(
            tmpA.set(l.x, l.y, l.z),
            tmpB.set(r.x, r.y, r.z),
            arm.leftLen,
            arm.span,
            tmpC
          );
          placeRod(rod.mesh, p.x, p.y, p.z, tmpC.x, tmpC.y, tmpC.z, rod.radius, dir);
          continue;
        }
        const a = ps[rod.a];
        const b = ps[rod.b];
        placeRod(rod.mesh, a.x, a.y, a.z, b.x, b.y, b.z, rod.radius, dir);
      }
      hanging.traverse((obj) => {
        if (obj instanceof THREE.Mesh && typeof obj.userData.follow === "number") {
          const p = ps[obj.userData.follow];
          obj.position.set(p.x, p.y, p.z);
        }
      });
      for (const mesh of leafMeshes) {
        const leaf = mesh.userData.leaf as Mobile["leaves"][number];
        const p = ps[leaf.particle];
        const arm = mobile.arms[leaf.arm];
        const other = leaf.end === "left" ? ps[arm.right] : ps[arm.left];
        tmpA.set(p.x - other.x, 0, p.z - other.z);
        if (tmpA.lengthSq() > 1e-8) tmpA.normalize();
        tmpB.set(0, -1, 0).addScaledVector(tmpA, 0.2).normalize();
        mesh.position.set(p.x, p.y, p.z);
        mesh.quaternion.setFromUnitVectors(Y_UP, tmpB);
      }
    };

    sync();

    const paint = () => {
      sync();
      renderer.render(scene, camera);
      const ke = energy(mobile, SIM);
      if (grab) setStatus("held");
      else if (ke > 0.09) setStatus("in motion");
      else if (ke > 0.0012) setStatus("settling");
      else setStatus("at rest");
      return ke;
    };

    let looping = false;
    const tick = (now: number) => {
      if (!running) return;
      const raw = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += raw;
      flushNudge();

      let steps = 0;
      while (acc >= SIM && steps < MAX_STEPS) {
        const impulse = pendingImpulse;
        pendingImpulse = null;
        stepMobile(mobile, SIM, grab, impulse, reduce);
        acc -= SIM;
        steps += 1;
      }
      if (steps === MAX_STEPS) acc = 0;

      const ke = paint();
      if (grab || ke > 0.0012) {
        wait = window.setTimeout(() => {
          frame = requestAnimationFrame(tick);
        }, 32);
      } else {
        looping = false;
      }
    };

    const ensureLoop = () => {
      if (looping || !running) return;
      looping = true;
      last = performance.now();
      acc = 0;
      frame = requestAnimationFrame(tick);
    };

    paint();
    nudgeRef.current.apply = flushNudge;
    flushNudge();
    wrap.dataset.ready = "1";

    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      delete wrap.dataset.ready;
      if (nudgeRef.current.apply === flushNudge) {
        nudgeRef.current.apply = null;
      }
      running = false;
      window.clearTimeout(wait);
      cancelAnimationFrame(frame);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      scene.environment = null;
      for (const item of owned) item.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [nudgeRef, onHeld, onStatus]);

  return <div ref={wrapRef} style={{ position: "absolute", inset: 0 }} />;
}
