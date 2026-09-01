"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import styles from "./drape.module.css";
import { Cloth, COLS, FLOOR, HEIGHT, RAIL_WIDTH, RAIL_Y, ROWS, WIDTH, type Mode } from "./sim";
import { fragmentShader, vertexShader } from "./silk";

export type { Mode };

export type ClothHandle = {
  setMode: (mode: Mode) => void;
  drop: () => void;
  reset: () => void;
};

type Props = {
  fontFamily: string;
  reducedMotion: boolean;
  mode: Mode;
  onReady: (handle: ClothHandle) => void;
  onFailed: () => void;
  onAnnounce: (text: string) => void;
};

const DT = 1 / 120;
const MAX_STEPS = 4;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function makePlaster() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#2c261f");
  g.addColorStop(0.72, "#241f1a");
  g.addColorStop(1, "#161310");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const img = ctx.getImageData(0, 0, 512, 512);
  const data = img.data;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const grain = (n - Math.floor(n) - 0.5) * 10;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.85));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.7));
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export default function ClothView({
  reducedMotion,
  mode,
  onReady,
  onFailed,
  onAnnounce,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  const reducedRef = useRef(reducedMotion);
  modeRef.current = mode;
  reducedRef.current = reducedMotion;
  const onReadyRef = useRef(onReady);
  const onFailedRef = useRef(onFailed);
  const onAnnounceRef = useRef(onAnnounce);
  onReadyRef.current = onReady;
  onFailedRef.current = onFailed;
  onAnnounceRef.current = onAnnounce;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!hasWebGL()) {
      onFailedRef.current();
      return;
    }

    let modeNow: Mode = modeRef.current;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x241f1a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = styles.stage;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.dataset.mode = modeNow;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "A hanging length of ivory silk. Drag to grab a fold, or use Grab, Pin and Cut.",
    );
    host.appendChild(renderer.domElement);

    const cloth = new Cloth();
    let pointerId = -1;
    let lastX = 0;
    let lastY = 0;
    let lastCutX = 0;
    let lastCutY = 0;
    let hemHeld = false;
    const hemIndex = Math.floor(COLS / 2) + (COLS + 1) * ROWS;
    const tug = { x: 0, y: 0 };
    let acc = 0;
    let last = performance.now();
    let idle = 0;
    let running = true;
    let frame = 0;
    let age = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -4, 8);
    camera.position.set(0, -0.04, 3);
    camera.lookAt(0, -0.04, 0);

    const plasterTex = new THREE.CanvasTexture(makePlaster());
    plasterTex.colorSpace = THREE.SRGBColorSpace;
    plasterTex.wrapS = THREE.RepeatWrapping;
    plasterTex.wrapT = THREE.RepeatWrapping;
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ map: plasterTex, toneMapped: false }),
    );
    wall.position.z = -0.18;
    scene.add(wall);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x161310, toneMapped: false }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR - 0.002, 0.2);
    scene.add(floor);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(cloth.positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(cloth.normals, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(cloth.uvs, 2));
    geo.setAttribute("aTangent", new THREE.BufferAttribute(cloth.tangents, 3));
    geo.setIndex(new THREE.BufferAttribute(cloth.indices, 1));

    const uniforms = {
      uColor: { value: new THREE.Color(0.91, 0.86, 0.76) },
      uBack: { value: new THREE.Color(0.58, 0.52, 0.44) },
      uLightDir: { value: new THREE.Vector3(-0.42, 0.58, 0.7).normalize() },
      uLightColor: { value: new THREE.Color(1.02, 0.97, 0.88) },
      uFillDir: { value: new THREE.Vector3(0.62, 0.08, 0.38).normalize() },
      uFillColor: { value: new THREE.Color(0.28, 0.3, 0.36) },
      uAmbient: { value: new THREE.Color(0.13, 0.11, 0.09) },
      uCamera: { value: camera.position.clone() },
    };

    const silk = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, silk);
    scene.add(mesh);

    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, RAIL_WIDTH, 12),
      new THREE.MeshBasicMaterial({ color: 0xc4a05a, toneMapped: false }),
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, RAIL_Y, 0);
    scene.add(rail);

    const pinGeo = new THREE.SphereGeometry(0.012, 8, 6);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xc4a05a, toneMapped: false });
    const pins = new THREE.InstancedMesh(pinGeo, pinMat, cloth.count);
    pins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(pins);
    const pinDummy = new THREE.Object3D();

    const writeMesh = () => {
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geo.attributes.normal as THREE.BufferAttribute).needsUpdate = true;
      (geo.attributes.aTangent as THREE.BufferAttribute).needsUpdate = true;
      geo.setIndex(new THREE.BufferAttribute(cloth.indices, 1));
      geo.computeBoundingSphere();

      let drawn = 0;
      for (const p of cloth.particles) {
        if (!p.pinned) continue;
        pinDummy.position.set(p.x, p.y, p.z + 0.012);
        pinDummy.updateMatrix();
        pins.setMatrixAt(drawn, pinDummy.matrix);
        drawn++;
      }
      pins.count = drawn;
      pins.instanceMatrix.needsUpdate = true;
    };
    writeMesh();

    const cursor = new THREE.Vector3();
    const worldFromEvent = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ndcY = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      cursor.set(ndcX, ndcY, 0).unproject(camera);
      return { x: cursor.x, y: cursor.y };
    };

    const pickRadius = () => Math.max(WIDTH * 0.12, (camera.right - camera.left) * 0.055);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      event.preventDefault();
      renderer.domElement.setPointerCapture(event.pointerId);
      pointerId = event.pointerId;
      const w = worldFromEvent(event);
      lastX = w.x;
      lastY = w.y;
      lastCutX = w.x;
      lastCutY = w.y;
      idle = 0;
      const i = cloth.nearest(w.x, w.y, pickRadius());
      if (i < 0) return;
      const current = modeRef.current;
      if (current === "grab") {
        cloth.beginGrab(i);
        onAnnounceRef.current("Holding a fold.");
      } else if (current === "pin") {
        const on = cloth.togglePin(i);
        onAnnounceRef.current(on ? "Pinned." : "Pin drawn.");
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      event.preventDefault();
      const w = worldFromEvent(event);
      const current = modeRef.current;
      if (current === "grab" && cloth.grabbed.length) {
        cloth.moveGrab(w.x, w.y, cloth.particles[cloth.grabbed[0]].z);
      } else if (current === "cut") {
        cloth.cutSegment(lastCutX, lastCutY, w.x, w.y);
        lastCutX = w.x;
        lastCutY = w.y;
      }
      lastX = w.x;
      lastY = w.y;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      if (modeRef.current === "grab" && cloth.grabbed.length) {
        cloth.releaseGrab();
        onAnnounceRef.current("Released.");
      } else if (modeRef.current === "cut") {
        onAnnounceRef.current("Cut.");
      }
      pointerId = -1;
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "BUTTON" || target.tagName === "A")
      ) {
        return;
      }
      const key = event.key;
      if (key === " " || key.startsWith("Arrow")) event.preventDefault();
      if (key === " ") {
        if (!hemHeld) {
          cloth.beginGrab(hemIndex);
          hemHeld = true;
          const p = cloth.particles[hemIndex];
          tug.x = p.x;
          tug.y = p.y;
          onAnnounceRef.current("Holding the hem.");
        } else {
          cloth.releaseGrab();
          hemHeld = false;
          onAnnounceRef.current("Released.");
        }
      } else if (key.startsWith("Arrow")) {
        if (!hemHeld && !cloth.grabbed.length) {
          cloth.beginGrab(hemIndex);
          hemHeld = true;
          const p = cloth.particles[hemIndex];
          tug.x = p.x;
          tug.y = p.y;
        }
        const step = 0.028;
        if (key === "ArrowLeft") tug.x -= step;
        if (key === "ArrowRight") tug.x += step;
        if (key === "ArrowUp") tug.y += step;
        if (key === "ArrowDown") tug.y -= step;
        if (cloth.grabbed.length) {
          cloth.moveGrab(tug.x, tug.y, cloth.particles[cloth.grabbed[0]].z);
        }
      }
    };

    const fit = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const halfH = Math.max(HEIGHT * 0.64, (WIDTH * 0.72) / aspect);
      camera.left = -halfH * aspect;
      camera.right = halfH * aspect;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    };

    const tick = (now: number) => {
      if (!running) return;
      frame = requestAnimationFrame(tick);
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += real;
      idle += real;
      age += real;
      let steps = 0;
      const breeze =
        reducedRef.current || idle < 1.2 || cloth.grabbed.length
          ? 0
          : 0.55 * Math.sin(now * 0.0011);
      while (acc >= DT && steps < MAX_STEPS) {
        cloth.step(DT, breeze);
        acc -= DT;
        steps++;
      }
      if (age < 0.7) cloth.warm(2);
      if (acc > DT) acc = DT;
      writeMesh();
      renderer.render(scene, camera);
    };

    const handle: ClothHandle = {
      setMode: (next) => {
        modeNow = next;
        renderer.domElement.dataset.mode = next;
        if (next !== "grab") {
          cloth.releaseGrab();
          hemHeld = false;
        }
      },
      drop: () => {
        cloth.releaseGrab();
        hemHeld = false;
        cloth.dropRail();
      },
      reset: () => {
        cloth.releaseGrab();
        hemHeld = false;
        cloth.reset();
        writeMesh();
      },
    };

    const onLost = () => onFailedRef.current();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    fit();
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    const onMenu = (event: Event) => event.preventDefault();
    window.addEventListener("keydown", onKey);
    renderer.domElement.addEventListener("contextmenu", onMenu);
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    onReadyRef.current(handle);
    last = performance.now();
    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("contextmenu", onMenu);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      cloth.releaseGrab();
      geo.dispose();
      silk.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      plasterTex.dispose();
      rail.geometry.dispose();
      (rail.material as THREE.Material).dispose();
      wall.geometry.dispose();
      (wall.material as THREE.Material).dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className={styles.host} />;
}
