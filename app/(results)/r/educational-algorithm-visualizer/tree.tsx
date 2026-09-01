"use client";

/**
 * A complete binary tree of failed choices — the search the backtracker
 * actually walks. Drawn once per change; drag or arrow keys to turn. No
 * continuous loop, because this machine has no GPU worth spinning for.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

import s from "./essay.module.css";

const INK = 0x14181c;
const FAIL = 0x9c2b24;
const PAPER = 0xdfe6e8;

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function layout(depth: number): { pos: Float32Array; edges: Float32Array; colors: Float32Array; count: number } {
  const levels = Math.max(1, Math.min(depth, 7));
  const count = 2 ** levels - 1;
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const edgeVerts: number[] = [];
  const width = 6.4;
  const fail = new THREE.Color(FAIL);
  const ink = new THREE.Color(INK);

  for (let i = 0; i < count; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const first = 2 ** level - 1;
    const offset = i - first;
    const slots = 2 ** level;
    const x = ((offset + 0.5) / slots) * width - width / 2;
    const y = -level * 0.72;
    const z = Math.sin(offset * 1.7 + level) * 0.08 * level;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    const t = level / Math.max(1, levels - 1);
    const c = ink.clone().lerp(fail, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    if (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      edgeVerts.push(
        pos[parent * 3],
        pos[parent * 3 + 1],
        pos[parent * 3 + 2],
        x,
        y,
        z,
      );
    }
  }
  return { pos, edges: new Float32Array(edgeVerts), colors, count };
}

export default function Tree({
  depth,
  caption,
}: {
  depth: number;
  caption: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }

    renderer.setClearColor(PAPER, 1);
    renderer.setPixelRatio(1);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    let az = 0.18;
    let pol = 1.05;
    const dist = 9.2;

    const { pos, edges, colors } = layout(depth);
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    ptsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pts = new THREE.Points(
      ptsGeo,
      new THREE.PointsMaterial({ size: 0.09, vertexColors: true, sizeAttenuation: true }),
    );
    scene.add(pts);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(edges, 3));
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.62 }),
    );
    scene.add(lines);

    const place = () => {
      camera.position.set(
        dist * Math.sin(pol) * Math.sin(az),
        dist * Math.cos(pol) + 0.4,
        dist * Math.sin(pol) * Math.cos(az),
      );
      camera.lookAt(0, -1.6, 0);
    };

    const fit = () => {
      const w = host.clientWidth || 320;
      const h = host.clientHeight || 220;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const draw = () => {
      place();
      renderer.render(scene, camera);
    };

    fit();
    draw();

    let dragging = false;
    let lx = 0;
    let ly = 0;
    let raf = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      host.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      az += (e.clientX - lx) * 0.006;
      pol = Math.min(1.45, Math.max(0.35, pol + (e.clientY - ly) * 0.005));
      lx = e.clientX;
      ly = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        draw();
      });
    };
    const onUp = () => {
      dragging = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") az -= 0.12;
      else if (e.key === "ArrowRight") az += 0.12;
      else if (e.key === "ArrowUp") pol = Math.max(0.35, pol - 0.08);
      else if (e.key === "ArrowDown") pol = Math.min(1.45, pol + 0.08);
      else return;
      e.preventDefault();
      draw();
    };

    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.tabIndex = 0;
    host.addEventListener("keydown", onKey);

    const ro = new ResizeObserver(() => {
      fit();
      draw();
    });
    ro.observe(host);

    if (!reduceMotion()) {
      az += 0.35;
      draw();
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("keydown", onKey);
      ptsGeo.dispose();
      lineGeo.dispose();
      (pts.material as THREE.Material).dispose();
      (lines.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [depth]);

  return (
    <div
      className={s.treeHost}
      ref={hostRef}
      role="img"
      aria-label={caption}
    >
      <span className={s.treeNote}>{caption}</span>
    </div>
  );
}
