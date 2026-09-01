"use client";

/**
 * One canvas, one clock, one orbit.
 *
 * The miniature is turned in the hand — drag, pinch, arrows — rather than
 * walked. Time is a second axis of the same exploration: the rail, the brackets,
 * and the running clock all write the same hour, and the hour decides what is
 * allowed to be on the rock.
 */

import {
  type MutableRefObject,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import * as THREE from "three";

import { Weather } from "./audio";
import {
  formatHour,
  happeningsAt,
  periodLabel,
  skyAt,
  sunDirection,
  type Happenings,
} from "./cycle";
import styles from "./faro.module.css";
import { buildWorld } from "./world";

const STEP = 1 / 60;
const DAY = 150;
const PHI_MIN = 0.28;
const PHI_MAX = 1.22;
const RADIUS_MIN = 5.2;
const RADIUS_MAX = 16;
const HOME = { theta: 0.98, phi: 1.12, radius: 11.4 };

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function wrapHour(h: number) {
  return ((h % 24) + 24) % 24;
}

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1.25, window.devicePixelRatio || 1);
  const budget = 1_100_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

export default function Stage({
  playingRef,
  mutedRef,
  hourRef,
  clockRef,
  captionRef,
  periodLabelRef,
  railRef,
  onPeriod,
  onPlayingChange,
}: {
  playingRef: MutableRefObject<boolean>;
  mutedRef: MutableRefObject<boolean>;
  hourRef: MutableRefObject<number>;
  clockRef: RefObject<HTMLSpanElement | null>;
  captionRef: RefObject<HTMLParagraphElement | null>;
  periodLabelRef: RefObject<HTMLSpanElement | null>;
  railRef: RefObject<HTMLInputElement | null>;
  onPeriod: (period: string) => void;
  onPlayingChange: (playing: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const periodNow = useRef("dusk");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) playingRef.current = false;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(pixelRatioFor(wrap.clientWidth, wrap.clientHeight));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    renderer.setClearColor(0x6a5040, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x6a5040, 14, 24);

    const world = buildWorld();
    scene.add(world.root);

    const hemi = new THREE.HemisphereLight(0xb0b8c0, 0x2a2820, 0.7);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.1);
    sun.position.set(6, 8, 3);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.15, 48);
    const cam = { ...HOME };
    const want = { ...HOME };
    const vel = { theta: 0, phi: 0 };
    const look = new THREE.Vector3(world.peak.x * 0.25, 0.72, world.peak.z * 0.2);
    const fill = new THREE.DirectionalLight(0xc8d0d8, 0.28);
    fill.position.set(-5, 3.2, 2.4);
    scene.add(fill);

    function applyProjection() {
      const aspect = Math.max(0.4, wrap.clientWidth / Math.max(1, wrap.clientHeight));
      const base = Math.tan((38 * Math.PI) / 360);
      camera.aspect = aspect;
      camera.fov = aspect >= 1.15 ? 38 : Math.min(56, (2 * Math.atan(base * (1.15 / aspect)) * 180) / Math.PI);
      camera.updateProjectionMatrix();
    }

    function applyCamera() {
      const s = Math.sin(cam.phi);
      camera.position.set(
        look.x + cam.radius * s * Math.sin(cam.theta),
        look.y + cam.radius * Math.cos(cam.phi),
        look.z + cam.radius * s * Math.cos(cam.theta)
      );
      camera.lookAt(look);
    }

    applyProjection();
    applyCamera();

    const weather = new Weather();
    let gestured = false;

    const pointers = new Map<number, { x: number; y: number }>();
    let pinching = false;
    let pinchStart = 0;
    let pinchRadius = HOME.radius;

    function wake() {
      if (gestured) {
        weather.ensure();
        return;
      }
      gestured = true;
      weather.ensure();
    }

    function onPointerDown(event: PointerEvent) {
      wrap.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      wrap.dataset.grab = "orbit";
      wake();
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchRadius = want.radius;
        pinching = true;
      }
    }

    function onPointerMove(event: PointerEvent) {
      const prev = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!prev || pointers.size === 0) return;

      if (pointers.size >= 2 && pinching) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 8) {
          want.radius = clamp((pinchRadius * pinchStart) / Math.max(8, d), RADIUS_MIN, RADIUS_MAX);
        }
        return;
      }

      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      want.theta -= dx * 0.0058;
      want.phi = clamp(want.phi - dy * 0.0048, PHI_MIN, PHI_MAX);
      vel.theta = -dx * 0.00035;
      vel.phi = -dy * 0.00028;
    }

    function endPointer(event: PointerEvent) {
      pointers.delete(event.pointerId);
      wrap.releasePointerCapture?.(event.pointerId);
      if (pointers.size < 2) pinching = false;
      if (pointers.size === 0) wrap.dataset.grab = "";
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      wake();
      want.radius = clamp(want.radius * Math.exp(event.deltaY * 0.0012), RADIUS_MIN, RADIUS_MAX);
    }

    function jumpHour(h: number) {
      hourRef.current = wrapHour(h);
      if (railRef.current) railRef.current.value = String(hourRef.current);
    }

    function onKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "BUTTON" || tag === "A") {
        if (event.key !== " " && event.key !== "[" && event.key !== "]") return;
      }
      const step = event.shiftKey ? 0.2 : 0.09;
      switch (event.key) {
        case "ArrowLeft":
          want.theta += step;
          break;
        case "ArrowRight":
          want.theta -= step;
          break;
        case "ArrowUp":
          want.phi = clamp(want.phi - step * 0.55, PHI_MIN, PHI_MAX);
          break;
        case "ArrowDown":
          want.phi = clamp(want.phi + step * 0.55, PHI_MIN, PHI_MAX);
          break;
        case "+":
        case "=":
          want.radius = clamp(want.radius * 0.88, RADIUS_MIN, RADIUS_MAX);
          break;
        case "-":
        case "_":
          want.radius = clamp(want.radius * 1.14, RADIUS_MIN, RADIUS_MAX);
          break;
        case "Home":
          want.theta = HOME.theta;
          want.phi = HOME.phi;
          want.radius = HOME.radius;
          break;
        case "[":
          jumpHour(hourRef.current - 0.35);
          onPlayingChange(false);
          break;
        case "]":
          jumpHour(hourRef.current + 0.35);
          onPlayingChange(false);
          break;
        case "1":
          jumpHour(7.7);
          break;
        case "2":
          jumpHour(12);
          break;
        case "3":
          jumpHour(17.35);
          break;
        case "4":
          jumpHour(21.2);
          break;
        case " ":
          event.preventDefault();
          onPlayingChange(!playingRef.current);
          break;
        default:
          return;
      }
      event.preventDefault();
      wake();
    }

    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", endPointer);
    wrap.addEventListener("pointercancel", endPointer);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    const rail = railRef.current;
    rail?.addEventListener("pointerdown", wake);

    const seaPos = world.seaPositions;
    const seaBase = world.seaBase;
    const seaCol = world.seaColors;
    const seaAttr = world.sea.geometry.getAttribute("position") as THREE.BufferAttribute;
    const seaColAttr = world.sea.geometry.getAttribute("color") as THREE.BufferAttribute;
    const foam = new THREE.Color(0xd4d4cc);
    const deep = new THREE.Color(0x3a4c48);
    const shallow = new THREE.Color(0x5a7066);
    const scratch = new THREE.Color();
    const beamDir = new THREE.Vector3();
    const coneFrom = new THREE.Vector3(0, 1, 0);
    const coneTo = new THREE.Vector3();
    const lanternPos = world.beamCone.position.clone();

    let beamAngle = 0.4;
    let acc = 0;
    let frames = 0;
    let last = performance.now();
    let uiT = 0;
    let hornClock = 0;
    let running = true;
    let lastCaption = "";

    function placeBoat(h: Happenings) {
      const boat = world.boat;
      if (h.boat === "hidden") {
        boat.visible = false;
        return;
      }
      boat.visible = true;
      const t = h.boatT;
      let x = 0;
      let z = 0;
      let y = 0.02;
      let rot = 0;
      if (h.boat === "south") {
        x = 2.2 + (1 - t) * 8;
        z = 3.4 + (1 - t) * 4;
        rot = -2.4;
      } else if (h.boat === "offing") {
        x = 2.15 + Math.sin(t * 2) * 0.15;
        z = 2.6;
        rot = -0.6;
      } else if (h.boat === "west") {
        x = 2.1 - t * 10;
        z = 2.4 - t * 2.2;
        rot = 2.6;
      } else {
        x = 3.2 + (1 - t) * 7;
        z = 3.8 + (1 - t) * 3;
        rot = -2.5;
      }
      boat.position.set(x, y + Math.sin(t * 8) * 0.03, z);
      boat.rotation.y = rot;
      boat.rotation.z = Math.sin(t * 6) * 0.04;
    }

    function placeBirds(h: Happenings, time: number) {
      world.dawnBirds.visible = h.dawnBirds > 0.05;
      world.fulmars.visible = h.fulmars > 0.05;
      world.raven.visible = h.raven > 0.05;
      world.flag.visible = h.flag > 0.2;

      if (world.dawnBirds.visible) {
        world.dawnBirds.children.forEach((child, i) => {
          const a = time * 0.35 + i * 2.1;
          const r = 2.2 + i * 0.35;
          child.position.set(
            -1.2 + Math.cos(a) * r,
            1.4 + Math.sin(a * 2 + i) * 0.35 + h.dawnBirds * 0.8,
            -0.4 + Math.sin(a) * r
          );
          child.rotation.y = -a + Math.PI / 2;
        });
      }

      if (world.fulmars.visible) {
        world.fulmars.children.forEach((child, i) => {
          const a = time * 0.55 + i * 3.2;
          child.position.set(
            -1.6 + Math.cos(a) * 1.1,
            1.8 + Math.sin(a * 3) * 0.45,
            0.2 + Math.sin(a * 1.4) * 0.8
          );
          child.rotation.y = -a;
        });
      }

      if (world.raven.visible) {
        const p = world.peak;
        world.raven.position.set(p.x + 0.42, p.y + 1.9, p.z + 0.12);
        world.raven.rotation.y = 0.8;
      }

      if (world.flag.visible) {
        world.flag.rotation.y = Math.sin(time * 4.2) * 0.35 * h.wind;
        world.flag.scale.x = 0.7 + h.wind * 0.45;
      }
    }

    function applySky(hour: number) {
      const sky = skyAt(hour);
      world.paintSky(sky.zenith, sky.horizon);
      (scene.fog as THREE.Fog).color.setRGB(...sky.fog);
      renderer.setClearColor(new THREE.Color().setRGB(...sky.horizon), 1);
      hemi.color.setRGB(...sky.zenith).multiplyScalar(1.15);
      hemi.groundColor.setRGB(...sky.ground);
      hemi.intensity = sky.hemi * 1.2;
      sun.color.setRGB(...sky.sun);
      sun.intensity = sky.sunIntensity * 1.15;
      fill.intensity = 0.18 + sky.hemi * 0.22;
      const dir = sunDirection(hour);
      sun.position.set(dir[0] * 12, dir[1] * 12, dir[2] * 12);
      renderer.toneMappingExposure = sky.exposure;
    }

    function applyLamp(h: Happenings) {
      const glass = world.lanternGlass.material as THREE.MeshLambertMaterial;
      const optic = world.optic.material as THREE.MeshLambertMaterial;
      glass.emissiveIntensity = 0.15 + h.beam * 1.6;
      glass.opacity = 0.32 + h.beam * 0.25;
      optic.emissiveIntensity = 0.2 + h.beam * 2.4;
      world.lanternPoint.intensity = h.beam * 4.2;
      const pane = world.windowPane.material as THREE.MeshLambertMaterial;
      pane.emissiveIntensity = h.windowLit * 1.8;
      world.cottageLamp.intensity = h.windowLit * 1.6;
      const star = world.stars.material as THREE.PointsMaterial;
      star.opacity = h.night * 0.85;
      world.stars.visible = h.night > 0.15;
    }

    function applyBeam(h: Happenings) {
      const cone = world.beamCone.material as THREE.MeshBasicMaterial;
      cone.opacity = h.beam * 0.16;
      world.beamSpot.intensity = h.beam * 7.2;
      world.beamCone.visible = h.beam > 0.04;
      world.beamSpot.visible = h.beam > 0.04;

      const reach = 12;
      const tx = lanternPos.x + Math.sin(beamAngle) * reach;
      const tz = lanternPos.z + Math.cos(beamAngle) * reach;
      world.beamTarget.position.set(tx, 0.04, tz);
      world.beamSpot.target.updateMatrixWorld();
      beamDir.set(tx - lanternPos.x, 0.04 - lanternPos.y, tz - lanternPos.z).normalize();
      world.beamCone.position.copy(lanternPos).addScaledVector(beamDir, 4.6);
      world.beamCone.quaternion.setFromUnitVectors(coneFrom, coneTo.copy(beamDir).negate());
    }

    function stepSea(time: number, swell: number, still: boolean) {
      const amp = still ? 0.014 : 0.07 + swell * 0.06;
      const n = seaPos.length / 3;
      for (let i = 0; i < n; i++) {
        const x = seaBase[i * 3];
        const z = seaBase[i * 3 + 2];
        const r = Math.hypot(x, z);
        const near = 1 - smoothstep(1.6, 3.2, r);
        const wave =
          Math.sin(x * 0.55 + time * 1.1) * amp +
          Math.sin(z * 0.72 + time * 0.82 + 1.3) * amp * 0.65 +
          Math.sin((x + z) * 0.35 + time * 0.4) * amp * 0.4;
        const y = wave * (1 - near * 0.7);
        seaPos[i * 3 + 1] = y;

        const foamAmt = near * (x < 0.2 ? 0.85 : 0.28) * (0.45 + swell * 0.4);
        const shore = 1 - smoothstep(2.1, 4.8, r);
        scratch.copy(deep).lerp(shallow, shore);
        scratch.lerp(foam, foamAmt * Math.max(0, y * 6 + 0.15));
        seaCol[i * 3] = scratch.r;
        seaCol[i * 3 + 1] = scratch.g;
        seaCol[i * 3 + 2] = scratch.b;
      }
      seaAttr.needsUpdate = true;
      seaColAttr.needsUpdate = true;
    }

    function smoothstep(a: number, b: number, x: number) {
      const t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    }

    function writeUi(hour: number, h: Happenings) {
      const clock = formatHour(hour);
      const period = periodLabel(h.period);
      if (clockRef.current) clockRef.current.textContent = clock;
      if (periodLabelRef.current) periodLabelRef.current.textContent = period;
      if (railRef.current && document.activeElement !== railRef.current) {
        railRef.current.value = String(hour);
      }
      if (h.caption !== lastCaption) {
        lastCaption = h.caption;
        if (captionRef.current) captionRef.current.textContent = h.caption;
      }
      if (h.period !== periodNow.current) {
        periodNow.current = h.period;
        onPeriod(h.period);
      }
    }

    function step(dt: number, now: number) {
      if (playingRef.current && !reduce) {
        hourRef.current = wrapHour(hourRef.current + dt * (24 / DAY));
      }

      if (!pinching && pointers.size === 0 && !reduce) {
        want.theta += vel.theta;
        want.phi = clamp(want.phi + vel.phi, PHI_MIN, PHI_MAX);
        vel.theta *= 0.94;
        vel.phi *= 0.94;
      }

      const k = reduce ? 1 : 1 - Math.exp(-dt * 9);
      cam.theta += (want.theta - cam.theta) * k;
      cam.phi += (want.phi - cam.phi) * k;
      cam.radius += (want.radius - cam.radius) * k;
      applyCamera();

      const hour = hourRef.current;
      const h = happeningsAt(hour);
      applySky(hour);
      applyLamp(h);
      if (h.beam > 0.02) beamAngle += dt * ((Math.PI * 2) / 4.6);
      applyBeam(h);
      placeBoat(h);
      placeBirds(h, now * 0.001);
      if (frames > 0) stepSea(now * 0.001, h.swell, reduce);

      if (gestured) {
        weather.set({ wind: h.wind, swell: h.swell, beam: h.beam, muted: mutedRef.current });
        if (h.beam > 0.5) {
          weather.tick(now * 0.001);
          hornClock += dt;
          if (hornClock > 2.4) {
            weather.horn(now * 0.001);
            hornClock = 0;
          }
        }
        if (h.dawnBirds > 0.4 || h.fulmars > 0.5) weather.gull(now * 0.001);
      }

      uiT += dt;
      if (uiT > 0.12) {
        uiT = 0;
        writeUi(hour, h);
      }
    }

    writeUi(hourRef.current, happeningsAt(hourRef.current));
    applySky(hourRef.current);

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        step(STEP, now);
        acc -= STEP;
        steps += 1;
      }
      renderer.render(scene, camera);
      frames += 1;
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
    requestAnimationFrame(frame);

    return () => {
      running = false;
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", endPointer);
      wrap.removeEventListener("pointercancel", endPointer);
      wrap.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      rail?.removeEventListener("pointerdown", wake);
      weather.dispose();
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [
    captionRef,
    clockRef,
    hourRef,
    mutedRef,
    onPeriod,
    periodLabelRef,
    onPlayingChange,
    playingRef,
    railRef,
  ]);

  return (
    <div
      ref={wrapRef}
      className={styles.stage}
      tabIndex={0}
      role="application"
      aria-label="Faro, a miniature lighthouse island. Drag to turn. Arrow keys also turn. The clock at the bottom changes the hour."
    />
  );
}
