"use client";

/**
 * One canvas, one locked camera. The only gesture is time: drag the room,
 * turn the wheel, or move the rail. The viewpoint never leaves the corner.
 */

import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import styles from "./occupants.module.css";
import { buildScene } from "./scene";
import { clampYear, nearestYear, YEAR_MIN } from "./years";

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const budget = 1_400_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

export default function Stage({
  yearRef,
  reduceRef,
  onYear,
}: {
  yearRef: MutableRefObject<number>;
  reduceRef: MutableRefObject<boolean>;
  onYear: (year: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb7a88c);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.12, 48);
    const look = new THREE.Vector3();
    const crop = (aspect: number) => {
      if (aspect < 0.85) {
        camera.fov = 42;
        camera.position.set(2.88, 1.54, 2.42);
        look.set(1.15, 0.98, 0.92);
      } else {
        camera.fov = 36;
        camera.position.set(3.2, 1.48, 2.82);
        look.set(1.18, 0.94, 0.86);
      }
      camera.lookAt(look);
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    wrap.appendChild(renderer.domElement);

    const room = buildScene();
    scene.add(room.root);

    const drag = {
      id: -1,
      x: 0,
      year: YEAR_MIN,
    };

    let leftover = 4;
    let lastApplied = Number.NaN;

    const fit = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      camera.aspect = w / h;
      crop(w / h);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      leftover = 3;
    };
    fit();

    const write = (year: number) => {
      const next = reduceRef.current ? nearestYear(year) : clampYear(year);
      yearRef.current = next;
      onYear(next);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      drag.id = event.pointerId;
      drag.x = event.clientX;
      drag.year = yearRef.current;
      wrap.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (drag.id !== event.pointerId) return;
      const px = event.pointerType === "touch" ? 5.2 : 7.4;
      write(drag.year + (event.clientX - drag.x) / px);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (drag.id !== event.pointerId) return;
      drag.id = -1;
      write(nearestYear(yearRef.current));
      if (wrap.hasPointerCapture(event.pointerId)) {
        wrap.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const step = event.shiftKey ? 5 : event.deltaMode === 1 ? 1 : 0.035;
      const delta = event.deltaX + event.deltaY;
      write(yearRef.current + (event.shiftKey ? Math.sign(delta) * step : delta * step));
    };

    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    let frame = 0;
    const tick = () => {
      const y = yearRef.current;
      try {
        room.apply(y, reduceRef.current);
      } catch {
        /* a mid-year texture swap must not kill the loop */
      }
      if (y !== lastApplied) {
        lastApplied = y;
        leftover = 3;
      }
      if (leftover > 0) {
        renderer.render(scene, camera);
        leftover -= 1;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      wrap.removeEventListener("wheel", onWheel);
      room.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onYear, reduceRef, yearRef]);

  return (
    <div
      ref={wrapRef}
      className={styles.stage}
      tabIndex={0}
      role="application"
      aria-label="The room. Drag sideways to move through years."
    />
  );
}
