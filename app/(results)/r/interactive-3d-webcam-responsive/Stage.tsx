"use client";

/**
 * One basin, one animal, one sensing loop. The visitor does not steer the
 * creature. They occupy the hide, and the hide has nerves.
 */

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

import { CaveAir } from "./audio";
import { buildCreature } from "./creature";
import { createMind, noteFor, stepMind, type Mood } from "./mind";
import { CameraSense, HandSense, emptySense, finishSense } from "./sense";
import styles from "./timid.module.css";
import { buildWorld, stampWater, type Ripple } from "./world";

export type Reading = {
  mood: Mood;
  note: string;
  energy: number;
  source: "none" | "camera" | "hand";
  trust: number;
  acquaintance: number;
};

export type CameraStatus = "live" | "denied" | "missing";

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1.2, window.devicePixelRatio || 1);
  const budget = 900_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

function drawTrace(line: SVGPolylineElement | null, history: number[]) {
  if (!line) return;
  const n = history.length;
  const w = 280;
  const h = 36;
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = (i / Math.max(1, n - 1)) * w;
    const y = h - 3 - history[i]! * (h - 8);
    d += `${i === 0 ? "" : " "}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  line.setAttribute("points", d);
}

export default function Stage({
  watching,
  onCameraStatus,
  onReading,
  traceRef,
}: {
  watching: boolean;
  onCameraStatus: (status: CameraStatus) => void;
  onReading: (reading: Reading) => void;
  traceRef: RefObject<SVGPolylineElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const watchRef = useRef(watching);
  const statusRef = useRef(onCameraStatus);
  const readingRef = useRef(onReading);
  watchRef.current = watching;
  statusRef.current = onCameraStatus;
  readingRef.current = onReading;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(pixelRatioFor(wrap.clientWidth, wrap.clientHeight));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x6a5a48, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x6a5a48, 6.5, 12);

    const world = buildWorld();
    scene.add(world.root);
    const animal = buildCreature();
    scene.add(animal.root);

    const shadeGeo = new THREE.CircleGeometry(0.2, 18);
    shadeGeo.rotateX(-Math.PI / 2);
    const shadeMat = new THREE.MeshBasicMaterial({
      color: 0x0c1010,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 0.192;
    shade.renderOrder = 3;
    scene.add(shade);

    scene.add(new THREE.HemisphereLight(0xe8d8b8, 0x2a2218, 0.78));
    const fill = new THREE.DirectionalLight(0xf0e0c0, 0.42);
    fill.position.set(0.8, 2.6, 2.4);
    scene.add(fill);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.12, 16);
    const look = new THREE.Vector3(0.04, 0.1, 0.02);
    const camPos = new THREE.Vector3(0.12, 0.92, 1.58);

    function applyProjection() {
      const aspect = Math.max(0.45, wrap.clientWidth / Math.max(1, wrap.clientHeight));
      const base = Math.tan((34 * Math.PI) / 360);
      camera.aspect = aspect;
      camera.fov = aspect >= 1.05 ? 34 : Math.min(50, (2 * Math.atan(base * (1.05 / aspect)) * 180) / Math.PI);
      camera.updateProjectionMatrix();
    }

    applyProjection();
    camera.position.copy(camPos);
    camera.lookAt(look);

    const mind = createMind();
    const sense = emptySense();
    const camSense = new CameraSense();
    const hand = new HandSense();
    const air = new CaveAir();
    const ripples: Ripple[] = [];
    const history: number[] = Array.from({ length: 72 }, () => 0);

    let pointerX = 0;
    let pointerY = 0;
    let pointerOver = false;
    let pointerHeld = false;
    let keyX = 0;
    let keyY = 0;
    let usingKeys = false;
    const keys = new Set<string>();
    let lastRead = 0;
    let lastMood = mind.mood;
    let lastSudden = 0;
    let running = true;
    let last = performance.now() / 1000;
    let elapsed = 0;
    let camLive = false;
    let starting = false;
    let camFailed = false;

    async function syncCamera() {
      if (!watchRef.current) {
        if (camLive) camSense.stop();
        camLive = false;
        camFailed = false;
        return;
      }
      if (camLive || starting || camFailed) return;
      starting = true;
      const status = await camSense.start();
      starting = false;
      if (!running) {
        camSense.stop();
        return;
      }
      camLive = status === "live";
      camFailed = !camLive;
      statusRef.current(status);
      if (!camLive) camSense.stop();
    }

    function worldFromSense() {
      return {
        x: clamp(sense.cx, -1, 1) * 1.05,
        z: 0.35 - clamp(sense.cy, -1, 1) * 0.95,
      };
    }

    function addRipple(power: number) {
      const p = worldFromSense();
      ripples.push({ x: p.x, z: p.z, t: 0, p: power });
      if (ripples.length > 6) ripples.shift();
    }

    const onPointer = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerY = -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
      pointerOver = e.type !== "pointerleave" && e.type !== "pointercancel";
      if (e.type === "pointerdown") {
        pointerHeld = true;
        wrap.setPointerCapture(e.pointerId);
        wrap.focus({ preventScroll: true });
        air.resume();
        addRipple(0.45);
      }
      if (e.type === "pointerup" || e.type === "pointercancel") pointerHeld = false;
      if (e.type === "pointerleave") pointerOver = false;
      usingKeys = false;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") return;
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === " " ||
        e.key === "Home"
      ) {
        e.preventDefault();
      }
      if (e.type === "keydown") {
        keys.add(e.key);
        air.resume();
        usingKeys = true;
        pointerOver = true;
        if (e.key === "Home") {
          keyX = 0;
          keyY = 0;
        }
      } else {
        keys.delete(e.key);
      }
    };

    wrap.addEventListener("pointerdown", onPointer);
    wrap.addEventListener("pointermove", onPointer);
    wrap.addEventListener("pointerup", onPointer);
    wrap.addEventListener("pointerleave", onPointer);
    wrap.addEventListener("pointercancel", onPointer);
    wrap.addEventListener("keydown", onKey);
    wrap.addEventListener("keyup", onKey);

    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      applyProjection();
    });
    ro.observe(wrap);

    const onVis = () => {
      if (document.hidden) camSense.stop();
      else void syncCamera();
    };
    document.addEventListener("visibilitychange", onVis);

    function tick(ms: number) {
      if (!running) return;
      const t = ms / 1000;
      const dt = Math.min(0.05, t - last);
      last = t;
      elapsed += dt;
      void syncCamera();

      if (keys.has("ArrowLeft")) keyX = clamp(keyX - dt * 0.7, -1, 1);
      if (keys.has("ArrowRight")) keyX = clamp(keyX + dt * 0.7, -1, 1);
      if (keys.has("ArrowUp")) keyY = clamp(keyY + dt * 0.7, -1, 1);
      if (keys.has("ArrowDown")) keyY = clamp(keyY - dt * 0.7, -1, 1);
      const jab = keys.has("Shift") && (keys.has("ArrowLeft") || keys.has("ArrowRight") || keys.has("ArrowUp") || keys.has("ArrowDown"));

      if (usingKeys) {
        hand.feed(keyX, keyY, true, keys.has(" ") || jab, t);
      } else {
        hand.feed(pointerX, pointerY, pointerOver || pointerHeld, pointerHeld, t);
      }

      if (camLive) {
        camSense.sample(sense);
      } else {
        hand.sample(sense, t);
      }
      finishSense(sense, dt);

      if (jab) {
        sense.sudden = true;
        sense.spike = 1;
        sense.energy = Math.max(sense.energy, 0.7);
      }

      const wasAlarmed = mind.alarm;
      stepMind(mind, sense, dt, reduce);
      if (mind.alarm > 0.85 && wasAlarmed < 0.7 && t - lastSudden > 0.6) {
        lastSudden = t;
        addRipple(1);
        air.startle();
      } else if (sense.sudden && t - lastSudden > 0.9) {
        lastSudden = t;
        addRipple(0.75);
      }

      animal.pose(mind, elapsed, reduce);

      const at = worldFromSense();
      shade.position.x += (at.x - shade.position.x) * (reduce ? 1 : 0.18);
      shade.position.z += (at.z - shade.position.z) * (reduce ? 1 : 0.18);
      const shadeOn = sense.presence ? 0.1 + sense.occupancy * 0.2 : 0.03;
      shadeMat.opacity += (shadeOn - shadeMat.opacity) * 0.2;
      const sc = 0.7 + sense.occupancy * 1.1;
      shade.scale.set(sc, 1, sc);

      for (const r of ripples) r.t += dt;
      while (ripples.length && ripples[0]!.t > 4) ripples.shift();
      stampWater(world, ripples, elapsed, reduce);

      const flicker = reduce ? 1 : 0.92 + Math.sin(elapsed * 7.2) * 0.05 + Math.sin(elapsed * 19) * 0.02;
      world.lampLight.intensity = 4.05 * flicker;
      world.lampFlame.scale.set(0.65 * flicker, 1.1 * flicker, 0.65 * flicker);

      const leanX = reduce ? 0 : sense.cx * 0.1;
      const leanY = reduce ? 0 : sense.cy * 0.05;
      camera.position.set(camPos.x + leanX, camPos.y + leanY, camPos.z);
      camera.lookAt(look.x + leanX * 0.4, look.y, look.z);

      history.push(Math.min(1, sense.energy * 0.92 + 0.03 + Math.sin(elapsed * 1.15) * 0.018));
      if (history.length > 72) history.shift();
      if ((ms | 0) % 3 === 0) {
        drawTrace(traceRef.current, history);
      }

      air.tick(elapsed, mind.mood === "at-glass" || mind.mood === "offering" || mind.mood === "coming");

      if (t - lastRead > 0.14 || mind.mood !== lastMood) {
        lastRead = t;
        lastMood = mind.mood;
        readingRef.current({
          mood: mind.mood,
          note: noteFor(mind.mood),
          energy: sense.energy,
          source: sense.source,
          trust: mind.trust,
          acquaintance: mind.acquaintance,
        });
      }

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    renderer.render(scene, camera);

    return () => {
      running = false;
      camSense.stop();
      air.dispose();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointerdown", onPointer);
      wrap.removeEventListener("pointermove", onPointer);
      wrap.removeEventListener("pointerup", onPointer);
      wrap.removeEventListener("pointerleave", onPointer);
      wrap.removeEventListener("pointercancel", onPointer);
      wrap.removeEventListener("keydown", onKey);
      wrap.removeEventListener("keyup", onKey);
      animal.dispose();
      world.dispose();
      shadeGeo.dispose();
      shadeMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [traceRef]);

  useEffect(() => {
    watchRef.current = watching;
  }, [watching]);

  return (
    <div
      ref={wrapRef}
      className={styles.stage}
      tabIndex={0}
      aria-label="A limestone hide. Move slowly. Sudden motion startles the animal."
    />
  );
}
