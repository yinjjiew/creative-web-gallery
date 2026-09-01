"use client";

/**
 * One shaft, one camera. Scroll is depth. The brass bead is linear time.
 * Software WebGL: one textured core, four walls, no shadows, no post.
 */

import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import styles from "./core.module.css";
import { beadY, buildWorld, paintCore } from "./scene";
import { CORE_WORLD, yearsAt } from "./time";

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1.25, window.devicePixelRatio || 1);
  const budget = 1_100_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

export default function Stage({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0 };
    let dirty = true;

    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      dirty = true;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 1536;
      const ctx = canvas.getContext("2d");
      if (ctx) paintCore(ctx, 256, 1536);
      const box = document.createElement("div");
      box.className = styles.fallback;
      box.appendChild(canvas);
      wrap.appendChild(box);
      return () => {
        window.removeEventListener("pointermove", onPointer);
        box.remove();
      };
    }

    renderer.setPixelRatio(pixelRatioFor(wrap.clientWidth, wrap.clientHeight));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0xcfc7bb, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.12, 80);
    const world = buildWorld(scene);

    let camY = 0.55;
    let frame = 0;

    const place = (t: number, instant: boolean) => {
      const targetY = -t * CORE_WORLD - 0.28;
      const lift = Math.max(0, 1 - t * 20) * 0.16;
      const nextY = instant || reduce ? targetY : camY + (targetY - camY) * 0.14;
      camY = nextY;
      const phone = wrap.clientHeight > wrap.clientWidth;
      const px = reduce ? 0 : pointer.x * (phone ? 0.04 : 0.1);
      if (phone) {
        camera.position.set(0.18 + px, camY + 0.42 + lift, 3.15 + lift * 0.2);
        camera.lookAt(0.18, camY - 0.55, 0);
      } else {
        camera.position.set(0.04 + px, camY + 0.12 + lift, 3.2 + lift * 0.25);
        camera.lookAt(-0.08, camY - 0.12, 0);
      }
      world.bead.position.y = beadY(yearsAt(t));
      world.sky.intensity = 1.35 * (0.4 + 0.6 * (1 - t));
      world.lamp.intensity = 0.22 + t * 0.55;
      world.lamp.position.set(camera.position.x + 0.2, camera.position.y + 0.3, camera.position.z - 0.4);
      const settled = Math.abs(camY - targetY) < 0.002;
      return !settled;
    };

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 8 || h < 8) return;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const moving = place(progressRef.current, false);
      if (moving) dirty = true;
      if (!dirty) return;
      renderer.render(scene, camera);
      dirty = false;
    };
    place(progressRef.current, true);
    renderer.render(scene, camera);
    dirty = false;
    frame = requestAnimationFrame(tick);

    const onScroll = () => {
      dirty = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progressRef]);

  return <div ref={wrapRef} className={styles.fill} />;
}
