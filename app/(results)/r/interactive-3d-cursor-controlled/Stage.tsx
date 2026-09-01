"use client";

/**
 * Cursor is the camera. The camera is the work.
 *
 * Mapping is a walk along the gallery wall, not an orbit — no roll, a short
 * travel, heavy damping. Fast motion is treated as flailing: the eye lags and
 * the chips tumble off-axis, so sweeping through the mark cannot hold a face.
 * Warmth is the only guide.
 */

import {
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
} from "react";
import * as THREE from "three";

import styles from "./anamorph.module.css";
import {
  alignment,
  buildShards,
  cameraAt,
  LOOK,
  START_UV,
  SWEET_UV,
  viewError,
} from "./figure";

const SOOT = new THREE.Color(0x161310);
const PAPER = new THREE.Color(0xefe6d6);
const COOL_KEY = new THREE.Color(0xb7c2c8);
const WARM_KEY = new THREE.Color(0xf0c48a);
const COOL_WIN = new THREE.Color(0xc5ced4);
const WARM_WIN = new THREE.Color(0xf3d7a8);

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1.35, window.devicePixelRatio || 1);
  const budget = 1_200_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

function plasterTexture(hex: string, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 256);
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 1600; i++) {
    const light = rng() > 0.5;
    ctx.fillStyle = light
      ? `rgba(255,252,246,${(0.03 + rng() * 0.07).toFixed(3)})`
      : `rgba(36,28,20,${(0.03 + rng() * 0.06).toFixed(3)})`;
    ctx.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2.4, 1 + rng() * 2.2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 2.2);
  return texture;
}

function buildRoom() {
  const root = new THREE.Group();
  const wallTex = plasterTexture("#e8e2d4", 11);
  const floorTex = plasterTexture("#c4bbac", 23);
  const wallMat = new THREE.MeshLambertMaterial({
    color: 0xe6dfd2,
    map: wallTex ?? undefined,
  });
  const floorMat = new THREE.MeshLambertMaterial({
    color: 0xb4ab9c,
    map: floorTex ?? undefined,
  });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xcdc6b8 });

  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.2), wallMat);
  back.position.set(0, 0.22, -0.38);
  root.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.2), wallMat);
  left.position.set(-1.34, 0.22, 0.66);
  left.rotation.y = Math.PI / 2;
  root.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.2), wallMat);
  right.position.set(1.34, 0.22, 0.66);
  right.rotation.y = -Math.PI / 2;
  root.add(right);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.1), floorMat);
  floor.position.set(0, -0.88, 0.66);
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.1), wallMat);
  ceil.position.set(0, 1.22, 0.66);
  ceil.rotation.x = Math.PI / 2;
  root.add(ceil);

  const skirting = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.07, 0.03), trimMat);
  skirting.position.set(0, -0.84, -0.36);
  root.add(skirting);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.025, 0.025), trimMat);
  rail.position.set(0, 1.02, -0.36);
  root.add(rail);

  const windowMat = new THREE.MeshBasicMaterial({
    color: COOL_WIN,
    transparent: true,
    opacity: 0.78,
  });
  const lightWell = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.28), windowMat);
  lightWell.position.set(-1.33, 0.38, 0.72);
  lightWell.rotation.y = Math.PI / 2;
  root.add(lightWell);

  const mullion = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 1.28, 0.02),
    new THREE.MeshLambertMaterial({ color: 0x9a9388 })
  );
  mullion.position.set(-1.325, 0.38, 0.72);
  root.add(mullion);

  return {
    root,
    windowMat,
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if ("map" in mat && mat.map instanceof THREE.Texture) mat.map.dispose();
            mat.dispose();
          }
        }
      });
    },
  };
}

export default function Stage({
  pageRef,
  seekRef,
  onHeld,
}: {
  pageRef: RefObject<HTMLDivElement | null>;
  seekRef: MutableRefObject<boolean>;
  onHeld: Dispatch<SetStateAction<boolean>>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapEl = wrapRef.current;
    const pageEl = pageRef.current;
    if (!wrapEl || !pageEl) return;
    const wrap: HTMLDivElement = wrapEl;
    const page: HTMLDivElement = pageEl;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(pixelRatioFor(wrap.clientWidth, wrap.clientHeight));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0xd8d2c6, 1);
    if (!wrap.isConnected) {
      renderer.dispose();
      return;
    }
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const room = buildRoom();
    scene.add(room.root);

    const hemi = new THREE.HemisphereLight(0xe4e8ec, 0x6a5e50, 0.92);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(COOL_KEY, 1.28);
    key.position.set(-2.4, 1.6, 1.8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf0ebe2, 0.46);
    fill.position.set(1.8, 0.6, 2.2);
    scene.add(fill);
    const bounce = new THREE.DirectionalLight(0xe8dcc8, 0.22);
    bounce.position.set(0.2, -1.4, 0.8);
    scene.add(bounce);

    const shards = buildShards();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial();
    const cloud = new THREE.InstancedMesh(geo, mat, shards.length);
    cloud.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(cloud);

    const dummy = new THREE.Object3D();
    const sweet = new THREE.Vector3();
    cameraAt(SWEET_UV.u, SWEET_UV.v, sweet);
    const color = new THREE.Color();
    const soot = SOOT.clone();
    const paper = PAPER.clone();

    function stamp(i: number, wind: number, settle: number) {
      const s = shards[i];
      dummy.position.set(s.x, s.y, s.z);
      dummy.lookAt(sweet);
      dummy.rotateZ(s.roll * settle);
      dummy.rotateX(Math.sin(s.phase) * s.wobble * settle + wind * Math.sin(s.phase + 1.7) * 0.34);
      dummy.rotateY(Math.cos(s.phase * 1.3) * s.wobble * 0.45 * settle + wind * Math.cos(s.phase) * 0.28);
      dummy.scale.set(s.sx, s.sy, s.sz);
      dummy.updateMatrix();
      cloud.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < shards.length; i++) {
      stamp(i, 0, 1);
      color.setRGB(shards[i].r, shards[i].g, shards[i].b);
      cloud.setColorAt(i, color);
    }
    cloud.instanceMatrix.needsUpdate = true;
    if (cloud.instanceColor) cloud.instanceColor.needsUpdate = true;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.12, 20);
    const camPos = new THREE.Vector3();
    const look = LOOK.clone();

    let u = START_UV.u;
    let v = START_UV.v;
    let uWant = START_UV.u;
    let vWant = START_UV.v;
    let lastWantU = uWant;
    let lastWantV = vWant;
    let speed = 0;
    let heldAmt = 0;
    let announced = false;
    let touching = false;
    let lastContrast = -1;

    function applyProjection() {
      const aspect = Math.max(0.45, wrap.clientWidth / Math.max(1, wrap.clientHeight));
      const base = Math.tan((38 * Math.PI) / 360);
      camera.aspect = aspect;
      camera.fov =
        aspect >= 1.1
          ? 36
          : Math.min(44, (2 * Math.atan(base * (1.1 / aspect)) * 180) / Math.PI);
      camera.updateProjectionMatrix();
    }

    function applyCamera() {
      cameraAt(u, v, camPos);
      camera.position.copy(camPos);
      camera.lookAt(look);
    }

    applyProjection();
    applyCamera();

    function setWant(clientX: number, clientY: number) {
      uWant = clamp(clientX / Math.max(1, window.innerWidth), 0.02, 0.98);
      vWant = clamp(clientY / Math.max(1, window.innerHeight), 0.02, 0.98);
    }

    function onPointerMove(event: PointerEvent) {
      if (seekRef.current) return;
      if (event.pointerType === "touch" && !touching) return;
      if (event.pointerType === "mouse" || event.pointerType === "pen" || touching) {
        setWant(event.clientX, event.clientY);
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      touching = true;
      seekRef.current = false;
      wrap.setPointerCapture(event.pointerId);
      setWant(event.clientX, event.clientY);
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerType === "touch") touching = false;
    }

    function onKeyDown(event: KeyboardEvent) {
      const tag = event.target instanceof HTMLElement ? event.target.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SUMMARY" || tag === "A") return;
      const step = event.shiftKey ? 0.012 : 0.04;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        uWant = clamp(uWant - step, 0.02, 0.98);
        seekRef.current = false;
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        uWant = clamp(uWant + step, 0.02, 0.98);
        seekRef.current = false;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        vWant = clamp(vWant - step, 0.02, 0.98);
        seekRef.current = false;
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        vWant = clamp(vWant + step, 0.02, 0.98);
        seekRef.current = false;
      } else if (event.key === "Home") {
        event.preventDefault();
        seekRef.current = true;
      }
    }

    let running = true;
    let last = performance.now();
    const keyColor = new THREE.Color();
    const winColor = new THREE.Color();

    function step(dt: number, now: number) {
      if (seekRef.current) {
        uWant = SWEET_UV.u;
        vWant = SWEET_UV.v;
        if (viewError(u, v) < 0.012) seekRef.current = false;
      }

      const inst = clamp(
        Math.hypot(uWant - lastWantU, vWant - lastWantV) / Math.max(dt, 1 / 240),
        0,
        6
      );
      lastWantU = uWant;
      lastWantV = vWant;
      speed += (inst - speed) * (1 - Math.exp(-dt * 7));

      const track = reduce
        ? 14
        : seekRef.current
          ? 5.5
          : 11 / (1 + speed * 3.4);
      const follow = 1 - Math.exp(-dt * track);
      u += (uWant - u) * follow;
      v += (vWant - v) * follow;
      applyCamera();

      const align = alignment(u, v);
      const err = viewError(u, v);
      const snap = coarse ? 0.072 : 0.048;
      const still = speed < (coarse ? 0.28 : 0.16);
      const wantHold = err < snap && still;
      const holdRate = wantHold ? 3.1 : 4.4;
      heldAmt = THREE.MathUtils.damp(heldAmt, wantHold ? 1 : 0, holdRate, dt);

      const heldNow = heldAmt > 0.72;
      if (heldNow !== announced) {
        announced = heldNow;
        onHeld(heldNow);
      }

      page.style.setProperty("--align", align.toFixed(3));
      page.dataset.held = heldNow ? "1" : "0";

      const contrast = align * 0.52 + heldAmt * 0.48;
      if (Math.abs(contrast - lastContrast) > 0.008) {
        lastContrast = contrast;
        for (let i = 0; i < shards.length; i++) {
          const s = shards[i];
          color.setRGB(s.r, s.g, s.b);
          if (s.role === "figure") color.lerp(soot, contrast);
          else if (s.role === "field") color.lerp(paper, contrast);
          cloud.setColorAt(i, color);
        }
        if (cloud.instanceColor) cloud.instanceColor.needsUpdate = true;
      }

      keyColor.copy(COOL_KEY).lerp(WARM_KEY, align);
      key.color.copy(keyColor);
      key.intensity = 1.22 + align * 0.38;
      hemi.intensity = 0.86 + align * 0.18;
      winColor.copy(COOL_WIN).lerp(WARM_WIN, align);
      room.windowMat.color.copy(winColor);
      renderer.toneMappingExposure = 1.02 + align * 0.12;

      const wind = reduce ? 0 : speed * 0.85;
      const settle = reduce ? 0.35 : 1 - heldAmt * 0.92;
      const t = now * 0.001;
      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        const gust =
          wind * (0.55 + 0.45 * Math.sin(t * 1.4 + s.phase)) +
          (reduce ? 0 : (1 - align) * 0.03 * Math.sin(t * 0.55 + s.phase));
        stamp(i, gust, settle);
      }
      cloud.instanceMatrix.needsUpdate = true;
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt, now);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    function resize() {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      applyProjection();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(frame);

    return () => {
      running = false;
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      room.dispose();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onHeld, pageRef, seekRef]);

  return (
    <div
      ref={wrapRef}
      className={styles.stage}
      tabIndex={0}
      role="application"
      aria-label="A hanging sculpture. Moving the pointer moves your eye. Arrow keys also move the eye. Home seeks the aligned view."
    />
  );
}
