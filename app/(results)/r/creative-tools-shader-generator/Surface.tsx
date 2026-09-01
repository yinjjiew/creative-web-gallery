"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { VERTEX } from "./compile";
import type { UniformValue } from "./compile";
import s from "./bench.module.css";

type Props = {
  fragment: string;
  uniforms: Record<string, UniformValue>;
  onFail: () => void;
};

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function toThree(value: UniformValue): number | THREE.Vector3 {
  return Array.isArray(value) ? new THREE.Vector3(value[0], value[1], value[2]) : value;
}

function writeUniforms(
  material: THREE.ShaderMaterial,
  uniforms: Record<string, UniformValue>,
) {
  for (const [k, v] of Object.entries(uniforms)) {
    let u = material.uniforms[k];
    if (!u) {
      u = { value: toThree(v) };
      material.uniforms[k] = u;
    }
    if (Array.isArray(v)) {
      if (u.value instanceof THREE.Vector3) u.value.set(v[0], v[1], v[2]);
      else u.value = new THREE.Vector3(v[0], v[1], v[2]);
    } else if (k !== "uZoom" && k !== "uPanX" && k !== "uPanY") {
      u.value = v;
    }
  }
}

export default function Surface({ fragment, uniforms, onFail }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const uniformsRef = useRef(uniforms);
  uniformsRef.current = uniforms;
  const drawRef = useRef<() => void>(() => {});
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const failRef = useRef(onFail);
  failRef.current = onFail;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!hasWebGL()) {
      failRef.current();
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      failRef.current();
      return;
    }

    renderer.setClearColor(0xd8d0be, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = s.canvas;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Live GPU material. Drag to pan, plus and minus to zoom, zero to reset.",
    );
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 4);
    camera.position.z = 1;

    const geo = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: fragment,
      toneMapped: false,
      uniforms: Object.fromEntries(
        Object.entries(uniformsRef.current).map(([k, v]) => [k, { value: toThree(v) }]),
      ),
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geo, material));

    const applyView = () => {
      const u = material.uniforms;
      if (u.uZoom) u.uZoom.value = viewRef.current.zoom;
      if (u.uPanX) u.uPanX.value = viewRef.current.panX;
      if (u.uPanY) u.uPanY.value = viewRef.current.panY;
    };

    const size = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(2, Math.floor(r.width));
      const h = Math.max(2, Math.floor(r.height));
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      if (material.uniforms.uAspect) {
        material.uniforms.uAspect.value = w / h;
      }
    };

    const draw = () => {
      applyView();
      renderer.render(scene, camera);
    };
    drawRef.current = draw;

    size();
    draw();

    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(host);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch0 = 0;

    const onPointerDown = (e: PointerEvent) => {
      renderer.domElement.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinch0 = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        if (pinch0 > 0) {
          viewRef.current.zoom = Math.min(8, Math.max(0.35, viewRef.current.zoom * (dist / pinch0)));
          pinch0 = dist;
          draw();
        }
        return;
      }
      if (!dragging) return;
      const r = host.getBoundingClientRect();
      const zoom = viewRef.current.zoom;
      viewRef.current.panX -= (e.clientX - lastX) / r.width / zoom;
      viewRef.current.panY += (e.clientY - lastY) / r.height / zoom;
      lastX = e.clientX;
      lastY = e.clientY;
      draw();
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch0 = 0;
      if (pointers.size === 0) dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = viewRef.current.zoom * (e.deltaY > 0 ? 0.92 : 1.08);
      viewRef.current.zoom = Math.min(8, Math.max(0.35, next));
      draw();
    };

    const onKey = (e: KeyboardEvent) => {
      const step = 0.06 / viewRef.current.zoom;
      if (e.key === "ArrowLeft") viewRef.current.panX -= step;
      else if (e.key === "ArrowRight") viewRef.current.panX += step;
      else if (e.key === "ArrowUp") viewRef.current.panY += step;
      else if (e.key === "ArrowDown") viewRef.current.panY -= step;
      else if (e.key === "+" || e.key === "=") viewRef.current.zoom = Math.min(8, viewRef.current.zoom * 1.12);
      else if (e.key === "-" || e.key === "_") viewRef.current.zoom = Math.max(0.35, viewRef.current.zoom / 1.12);
      else if (e.key === "0") {
        viewRef.current.zoom = 1;
        viewRef.current.panX = 0;
        viewRef.current.panY = 0;
      } else return;
      e.preventDefault();
      draw();
    };

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("keydown", onKey);

    return () => {
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKey);
      geo.dispose();
      material.dispose();
      renderer.dispose();
      if (el.parentNode === host) host.removeChild(el);
      materialRef.current = null;
    };
    // The renderer is created once; fragment swaps are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    if (material.fragmentShader !== fragment) {
      material.fragmentShader = fragment;
      const next: Record<string, { value: number | THREE.Vector3 }> = {};
      for (const [k, v] of Object.entries(uniforms)) {
        const prev = material.uniforms[k];
        next[k] = { value: prev ? prev.value : toThree(v) };
      }
      material.uniforms = next;
      material.needsUpdate = true;
    }
    writeUniforms(material, uniforms);
    drawRef.current();
  }, [fragment, uniforms]);

  return <div ref={hostRef} className={s.surface} />;
}
