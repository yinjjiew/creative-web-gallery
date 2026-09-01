"use client";

/**
 * One canvas, one chest, one table. Drawers pull. Pieces lift. Scale is not
 * a caption — it is the size of the object on the glass.
 */

import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import { createChestSound } from "./audio";
import type { Command } from "./FlatFile";
import styles from "./flatfile.module.css";
import { TRAVEL, buildStudio } from "./studio";
import { PIECES, pieceById, type Piece } from "./work";

const STEP = 1 / 60;
const PHI_MIN = 0.62;
const PHI_MAX = 1.28;
const THETA_MIN = -0.55;
const THETA_MAX = 1.05;
const RADIUS_MIN = 1.35;
const RADIUS_MAX = 3.6;
const HOME = { theta: 0.4, phi: 1.05, radius: 2.58 };

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1, window.devicePixelRatio || 1);
  const budget = 720_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(0.75, dpr * Math.sqrt(budget / area));
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

function bezier(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
) {
  const it = 1 - t;
  out.set(
    it * it * a.x + 2 * it * t * b.x + t * t * c.x,
    it * it * a.y + 2 * it * t * b.y + t * t * c.y,
    it * it * a.z + 2 * it * t * b.z + t * t * c.z,
  );
  return out;
}

function isShown(object: THREE.Object3D) {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

export default function Stage({
  commandRef,
  onPiece,
  onDrawers,
}: {
  commandRef: MutableRefObject<Command | null>;
  onPiece: (piece: Piece | null) => void;
  onDrawers: (open: boolean[]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapEl = wrapRef.current;
    if (!wrapEl) return;
    const wrap: HTMLDivElement = wrapEl;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = wrap.clientWidth < 540;
    const sound = createChestSound();
    let heard = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      wrap.textContent = "This chest needs WebGL. The titles still open the work.";
      return;
    }

    renderer.setClearColor(0xd9d2c4, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setPixelRatio(pixelRatioFor(wrap.clientWidth, wrap.clientHeight));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    wrap.appendChild(renderer.domElement);
    wrap.tabIndex = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd9d2c4);

    const studio = buildStudio();
    scene.add(studio.root);

    const hemi = new THREE.HemisphereLight(0xf4f0e6, 0xb9ae9a, 0.92);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff4e4, 0.85);
    key.position.set(-1.5, 2.1, 0.9);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.12, 20);
    const spherical = new THREE.Spherical(
      narrow ? 3.05 : HOME.radius,
      HOME.phi,
      HOME.theta,
    );
    const want = spherical.clone();
    const look = studio.look.clone();
    const wantLook = look.clone();

    function placeCamera() {
      camera.position.setFromSpherical(spherical).add(look);
      camera.lookAt(look);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hits: THREE.Object3D[] = [];
    studio.root.traverse((n) => {
      if (n.userData?.kind) hits.push(n);
    });

    type Mode = "none" | "orbit" | "drawer";
    let mode: Mode = "none";
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let moved = false;
    let dragDrawer = -1;
    let dragOpen = 0;
    let lastOpen = 0;

    let lifted: string | null = null;
    let pending: string | null = null;
    let liftT = 1;
    let liftFrom = new THREE.Vector3();
    let liftTo = new THREE.Vector3();
    let returning = false;
    let bookOpen = false;
    let selected = PIECES[0].id;
    let lastReport = "";

    function report() {
      const open = studio.drawers.map((d) => d.target > 0.35 || d.open > 0.4);
      const key = `${open.join(",")}|${lifted}`;
      if (key === lastReport) return;
      lastReport = key;
      onDrawers(open);
      onPiece(lifted ? pieceById(lifted) ?? null : null);
    }

    function wake() {
      if (!heard) {
        heard = true;
        sound.scrape(0.2, 0.3);
      }
    }

    function setDrawerTarget(id: number, value: number, exclusive = false) {
      if (exclusive) {
        for (const d of studio.drawers) {
          d.target = d.id === id ? value : 0;
        }
      } else {
        studio.drawers[id].target = clamp(value, 0, 1);
      }
    }

    function toggleDrawer(id: number) {
      const d = studio.drawers[id];
      const next = d.target > 0.45 ? 0 : 1;
      setDrawerTarget(id, next, next > 0);
      wake();
      if (next === 0 && lifted) {
        const p = studio.pieces.get(lifted);
        if (p && p.piece.drawer === id) startReturn();
      }
    }

    function visibility() {
      for (const [id, rig] of studio.pieces) {
        const d = studio.drawers[rig.piece.drawer];
        const flying = id === lifted || (returning && id === lifted);
        rig.group.visible = flying || d.open > 0.14;
      }
    }

    function startLift(id: string) {
      const rig = studio.pieces.get(id);
      if (!rig) return;
      const d = studio.drawers[rig.piece.drawer];
      if (d.open < 0.5) {
        setDrawerTarget(rig.piece.drawer, 1, true);
        pending = id;
        return;
      }
      if (lifted && lifted !== id) {
        pending = id;
        startReturn();
        return;
      }
      if (lifted === id) {
        toggleSpread();
        return;
      }
      scene.attach(rig.group);
      liftFrom.copy(rig.group.position);
      liftTo.copy(rig.tablePos);
      lifted = id;
      selected = id;
      liftT = 0;
      returning = false;
      bookOpen = false;
      if (rig.spread) {
        rig.spread.visible = false;
        rig.closed.visible = true;
      }
      wake();
      sound.rustle(rig.mass);
      pending = null;
    }

    function startReturn() {
      if (!lifted) return;
      const rig = studio.pieces.get(lifted);
      if (!rig) return;
      liftFrom.copy(rig.group.position);
      liftT = 0;
      returning = true;
      bookOpen = false;
      if (rig.spread) {
        rig.spread.visible = false;
        rig.closed.visible = true;
      }
      sound.rustle(rig.mass * 0.7);
    }

    function finishReturn() {
      if (!lifted) return;
      const rig = studio.pieces.get(lifted);
      if (!rig) return;
      studio.drawers[rig.piece.drawer].group.attach(rig.group);
      rig.group.position.copy(rig.restPos);
      rig.group.rotation.copy(rig.restRot);
      lifted = null;
      returning = false;
      liftT = 1;
      report();
      if (pending) {
        const next = pending;
        pending = null;
        startLift(next);
      }
    }

    function toggleSpread() {
      if (!lifted) return;
      const rig = studio.pieces.get(lifted);
      if (!rig?.spread) return;
      bookOpen = !bookOpen;
      rig.spread.visible = bookOpen;
      rig.closed.visible = !bookOpen;
      sound.rustle(0.2);
    }

    function pick(clientX: number, clientY: number) {
      const rect = wrap.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const found = raycaster.intersectObjects(hits, false);
      return found.find((h) => isShown(h.object)) ?? null;
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      wrap.setPointerCapture(event.pointerId);
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      moved = false;
      const hit = pick(event.clientX, event.clientY);
      const kind = hit?.object.userData?.kind;
      if (kind === "handle" || kind === "drawer") {
        mode = "drawer";
        dragDrawer = hit!.object.userData.drawer as number;
        dragOpen = studio.drawers[dragDrawer].open;
        lastOpen = dragOpen;
        wrap.dataset.grab = "drawer";
        wake();
      } else {
        mode = "orbit";
        wrap.dataset.grab = "orbit";
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.hypot(dx, dy) > 5) moved = true;
      if (mode === "drawer" && dragDrawer >= 0) {
        const next = clamp(dragOpen + (-dy + dx * 0.35) / 240, 0, 1);
        studio.drawers[dragDrawer].target = next;
        if (next > 0.2) {
          for (const d of studio.drawers) {
            if (d.id !== dragDrawer) d.target = 0;
          }
        }
        sound.scrape(next, next - lastOpen);
        lastOpen = next;
      } else if (mode === "orbit") {
        want.theta = clamp(want.theta - dx * 0.005, THETA_MIN, THETA_MAX);
        want.phi = clamp(want.phi - dy * 0.004, PHI_MIN, PHI_MAX);
        startX = event.clientX;
        startY = event.clientY;
      }
    }

    function endPointer(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      const hit = pick(event.clientX, event.clientY);
      const kind = hit?.object.userData?.kind;
      if (!moved) {
        if (kind === "handle" || kind === "drawer") {
          toggleDrawer(hit!.object.userData.drawer as number);
        } else if (kind === "piece") {
          startLift(hit!.object.userData.id as string);
        } else if (kind === "table" && lifted) {
          startReturn();
        }
      } else if (mode === "drawer" && dragDrawer >= 0) {
        const d = studio.drawers[dragDrawer];
        d.target = d.open > 0.45 ? 1 : d.open < 0.12 ? 0 : d.target;
        if (d.target > 0.5) {
          for (const other of studio.drawers) {
            if (other.id !== dragDrawer) other.target = 0;
          }
        }
      }
      mode = "none";
      pointerId = -1;
      dragDrawer = -1;
      delete wrap.dataset.grab;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 1.08 : 0.92;
      want.radius = clamp(want.radius * delta, RADIUS_MIN, RADIUS_MAX);
    }

    function cycle(dir: number) {
      const openIds = studio.drawers.filter((d) => d.open > 0.35).map((d) => d.id);
      const pool = (openIds.length ? PIECES.filter((p) => openIds.includes(p.drawer)) : PIECES).map(
        (p) => p.id,
      );
      const i = pool.indexOf(selected);
      selected = pool[(i + dir + pool.length) % pool.length];
    }

    function onKeyDown(event: KeyboardEvent) {
      const n = Number(event.key);
      if (n >= 1 && n <= 4) {
        event.preventDefault();
        toggleDrawer(n - 1);
        return;
      }
      switch (event.key) {
        case "ArrowLeft":
          want.theta = clamp(want.theta + 0.08, THETA_MIN, THETA_MAX);
          event.preventDefault();
          break;
        case "ArrowRight":
          want.theta = clamp(want.theta - 0.08, THETA_MIN, THETA_MAX);
          event.preventDefault();
          break;
        case "ArrowUp":
          want.phi = clamp(want.phi - 0.05, PHI_MIN, PHI_MAX);
          event.preventDefault();
          break;
        case "ArrowDown":
          want.phi = clamp(want.phi + 0.05, PHI_MIN, PHI_MAX);
          event.preventDefault();
          break;
        case "+":
        case "=":
          want.radius = clamp(want.radius * 0.88, RADIUS_MIN, RADIUS_MAX);
          event.preventDefault();
          break;
        case "-":
        case "_":
          want.radius = clamp(want.radius * 1.12, RADIUS_MIN, RADIUS_MAX);
          event.preventDefault();
          break;
        case "[":
          cycle(-1);
          event.preventDefault();
          break;
        case "]":
          cycle(1);
          event.preventDefault();
          break;
        case "Enter":
          startLift(selected);
          event.preventDefault();
          break;
        case "Escape":
          if (lifted) startReturn();
          else studio.drawers.forEach((d) => (d.target = 0));
          event.preventDefault();
          break;
        case "Home":
          want.theta = HOME.theta;
          want.phi = HOME.phi;
          want.radius = narrow ? 3.05 : HOME.radius;
          wantLook.copy(studio.look);
          event.preventDefault();
          break;
        default:
          break;
      }
    }

    function onWindowKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const field = target?.closest("a, button, input, textarea, [contenteditable]");
      if (field && event.key !== "Escape" && !/^[1-4]$/.test(event.key)) return;
      onKeyDown(event);
    }

    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", endPointer);
    wrap.addEventListener("pointercancel", endPointer);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onWindowKey);

    function applySize() {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    applySize();
    const ro = new ResizeObserver(applySize);
    ro.observe(wrap);

    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen) start();
      },
      { threshold: 0.01 },
    );
    io.observe(wrap);

    function onVisibility() {
      if (document.visibilityState === "visible" && onScreen) start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    let frame = 0;
    let last = performance.now();
    let acc = 0;
    let settled = false;

    function start() {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(now: number) {
      if (!onScreen || document.visibilityState !== "visible") {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
      const elapsed = Math.max(0, (now - last) / 1000);
      last = now;
      acc += Math.min(0.25, elapsed);
      const camDt = Math.min(0.08, elapsed);

      const cmd = commandRef.current;
      if (cmd) {
        commandRef.current = null;
        if (cmd.type === "toggle-drawer") toggleDrawer(cmd.drawer);
        if (cmd.type === "lift") startLift(cmd.id);
        if (cmd.type === "return") startReturn();
      }

      while (acc >= STEP) {
        acc -= STEP;
        for (const d of studio.drawers) {
          if (reduce) {
            d.open = d.target;
            d.vel = 0;
          } else {
            const k = 22;
            const damp = 6.5;
            const force = (d.target - d.open) * k - d.vel * damp;
            d.vel += force * STEP;
            d.open = clamp(d.open + d.vel * STEP, 0, 1);
            if (Math.abs(d.target - d.open) < 0.001 && Math.abs(d.vel) < 0.01) {
              d.open = d.target;
              d.vel = 0;
            }
          }
          d.group.position.z = d.open * TRAVEL;
        }

        if (liftT < 1 && lifted) {
          const rig = studio.pieces.get(lifted);
          if (rig) {
            const dur = reduce ? STEP : 0.42 + rig.mass * 0.35;
            liftT = Math.min(1, liftT + STEP / dur);
            const t = ease(liftT);
            if (returning) {
              const home = new THREE.Vector3();
              studio.drawers[rig.piece.drawer].group.localToWorld(home.copy(rig.restPos));
              liftTo.copy(home);
            } else {
              liftTo.copy(rig.tablePos);
            }
            const mid = liftFrom.clone().lerp(liftTo, 0.5);
            mid.y += 0.26 + rig.mass * 0.08;
            bezier(liftFrom, mid, liftTo, t, rig.group.position);
            if (liftT >= 1) {
              if (returning) finishReturn();
              else {
                rig.group.position.copy(rig.tablePos);
                sound.land(rig.mass);
                report();
              }
            }
          }
        }

        if (pending && !returning) {
          const rig = studio.pieces.get(pending);
          if (rig && studio.drawers[rig.piece.drawer].open > 0.52 && lifted !== pending) {
            const id = pending;
            pending = null;
            startLift(id);
          }
        }
      }

      if (lifted) {
        wantLook.set(0.7, 0.62, 0.05);
      } else {
        wantLook.copy(studio.look);
      }

      const k = 1 - Math.exp(-(reduce ? 20 : 5.5) * camDt);
      spherical.theta += (want.theta - spherical.theta) * k;
      spherical.phi += (want.phi - spherical.phi) * k;
      spherical.radius += (want.radius - spherical.radius) * k;
      look.lerp(wantLook, k);
      placeCamera();

      visibility();

      let busy = liftT < 1 || mode !== "none";
      if (!busy) {
        for (const d of studio.drawers) {
          if (Math.abs(d.target - d.open) > 0.001 || Math.abs(d.vel) > 0.002) {
            busy = true;
            break;
          }
        }
      }
      if (!busy) {
        busy =
          Math.abs(want.theta - spherical.theta) > 0.0008 ||
          Math.abs(want.phi - spherical.phi) > 0.0008 ||
          Math.abs(want.radius - spherical.radius) > 0.002 ||
          look.distanceToSquared(wantLook) > 0.000004;
      }

      if (busy || !settled) {
        renderer.render(scene, camera);
        settled = !busy;
      }
      report();
    }

    report();
    start();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", endPointer);
      wrap.removeEventListener("pointercancel", endPointer);
      wrap.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onWindowKey);
      sound.dispose();
      studio.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [commandRef, onDrawers, onPiece]);

  return (
    <div
      ref={wrapRef}
      className={styles.stage}
      role="img"
      aria-label="A daylight studio with a steel plan chest and a light table. Pull a drawer, then lift a piece."
    />
  );
}
