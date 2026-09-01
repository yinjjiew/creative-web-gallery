"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { meanQuality, type Segment, type Work } from "./engine";

type Props = {
  segments: Segment[];
  work: Work;
  reduced: boolean;
};

/**
 * The piece, turned in the shop light.
 *
 * A lathe of the worked profile, bent and flattened by the blows that made it.
 * Two lights only: the forge, warm and low, and a cool fill from the rafters.
 * No environment map, no shadows — software GL has to finish a frame.
 */
export default function Piece({ segments, work, reduced }: Props) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0.9, 0.45, 3.4);
    camera.lookAt(0, 0, 0);

    const forge = new THREE.PointLight(0xff6a28, 18, 12, 2);
    forge.position.set(-2.2, 0.2, 1.4);
    scene.add(forge);
    const fill = new THREE.DirectionalLight(0xb8c4d0, 0.35);
    fill.position.set(1.4, 2.2, 1.6);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0x2a221c, 0.45));

    const geo = lathe(segments, work.id);
    const q = meanQuality(segments);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(
        0.07,
        0.12 + (1 - q) * 0.18,
        0.22 + q * 0.12
      ),
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const setSize = () => {
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();

    let yaw = 0.4;
    let pitch = 0.15;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let live = true;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.008;
      pitch = clamp(pitch + (e.clientY - lastY) * 0.006, -0.8, 0.8);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(setSize);
    ro.observe(el);

    const tick = () => {
      if (!live) return;
      if (!reduced && !dragging) yaw += 0.004;
      mesh.rotation.y = yaw;
      mesh.rotation.x = pitch;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [segments, work.id, reduced]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={`The finished ${work.name}, turned in the light. Drag to turn it.`}
    />
  );
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lathe(segments: Segment[], id: string) {
  const pts: THREE.Vector2[] = [];
  const n = segments.length;
  for (let i = 0; i < n; i++) {
    const seg = segments[i];
    const y = (i / Math.max(1, n - 1) - 0.5) * 2.35;
    const r = 0.03 + seg.r * 0.2 * (1 - seg.flat * 0.55);
    pts.push(new THREE.Vector2(r, y));
  }
  const geo = new THREE.LatheGeometry(pts, 16);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = clamp((v.y + 1.175) / 2.35, 0, 1);
    const si = Math.min(n - 1, Math.round(t * (n - 1)));
    const seg = segments[si];
    const bend = seg.bend * 0.55;
    if (id === "hook") {
      const a = bend * 1.7;
      const cy = v.y;
      const cz = v.z;
      v.y = cy * Math.cos(a) - cz * Math.sin(a) - bend * 0.15;
      v.z = cy * Math.sin(a) + cz * Math.cos(a);
    } else {
      v.x += bend * 0.12 * Math.sin(t * Math.PI);
    }
    v.x += (seg.nick - 0.5) * 0.015 * Math.sin(i * 1.7);
    if (seg.flat > 0.05) v.z *= 1 - seg.flat * 0.55;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
