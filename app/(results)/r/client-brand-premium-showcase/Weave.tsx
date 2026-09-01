"use client";

/**
 * The cloth, modelled. Loaded only through next/dynamic with ssr disabled, so
 * three never runs during prerender and never lands in a shared chunk.
 *
 * Deliberately not a product turntable. It does not spin, there is no
 * reflection, no environment, no floor and no bloom, and it is the size of a
 * plate in a book rather than a hero. It renders one frame when something
 * changes and then stops, which is also the only sensible thing to do on a
 * machine with no GPU.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { buildWeave, type WeaveParams } from "./weave";
import s from "./mill.module.css";

export type View = "face" | "rake" | "edge" | "back";

/** Azimuth and polar angle, radians, for each named view. */
const VIEWS: Record<View, [number, number]> = {
  face: [0.22, 0.2],
  rake: [0.5, 1.02],
  edge: [0.02, 1.5],
  back: [-0.3, Math.PI - 0.28],
};

export default function Weave({
  params,
  view,
  onReady,
}: {
  params: WeaveParams;
  view: View;
  onReady?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  /** Live scene handles, so param changes rebuild rather than remount. */
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    distance: number;
    azimuth: number;
    polar: number;
    render: () => void;
  } | null>(null);

  // ---------------------------------------------------------------- mount
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        // Playwright and any other screenshot path reads the canvas outside the
        // frame it was drawn in, and without this the capture is empty.
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }

    renderer.setClearAlpha(0);
    // No GPU here. Two device pixels per CSS pixel is not worth the seconds.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(28, 1, 1, 400);

    const sky = new THREE.HemisphereLight(0xffffff, 0x9c968a, 1.35);
    scene.add(sky);

    const key = new THREE.DirectionalLight(0xfff6e8, 2.5);
    key.position.set(-0.55, -0.7, 1.1);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xdfe4ea, 0.7);
    fill.position.set(0.9, 0.5, 0.35);
    scene.add(fill);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0,
      side: THREE.FrontSide,
    });

    const geometry = new THREE.BufferGeometry();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const state = {
      renderer,
      scene,
      camera,
      mesh,
      material,
      distance: 34,
      azimuth: VIEWS.face[0],
      polar: VIEWS.face[1],
      render: () => {
        const { azimuth, polar, distance } = state;
        camera.position.set(
          distance * Math.sin(polar) * Math.sin(azimuth),
          -distance * Math.sin(polar) * Math.cos(azimuth),
          distance * Math.cos(polar)
        );
        camera.up.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      },
    };
    sceneRef.current = state;

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width < 2 || height < 2) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      state.render();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    // ------------------------------------------------------------ dragging
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const down = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      host.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      event.preventDefault();
      state.azimuth += (event.clientX - lastX) * 0.008;
      state.polar = Math.max(
        0.06,
        Math.min(Math.PI - 0.06, state.polar + (event.clientY - lastY) * 0.008)
      );
      lastX = event.clientX;
      lastY = event.clientY;
      state.render();
    };
    const up = (event: PointerEvent) => {
      dragging = false;
      if (host.hasPointerCapture(event.pointerId)) {
        host.releasePointerCapture(event.pointerId);
      }
    };

    host.addEventListener("pointerdown", down);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerup", up);
    host.addEventListener("pointercancel", up);

    // Keyboard is a first-class route through this, not a courtesy.
    const key2 = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 0.35 : 0.12;
      let handled = true;
      switch (event.key) {
        case "ArrowLeft":
          state.azimuth -= step;
          break;
        case "ArrowRight":
          state.azimuth += step;
          break;
        case "ArrowUp":
          state.polar = Math.max(0.06, state.polar - step);
          break;
        case "ArrowDown":
          state.polar = Math.min(Math.PI - 0.06, state.polar + step);
          break;
        default:
          handled = false;
      }
      if (handled) {
        event.preventDefault();
        state.render();
      }
    };
    host.addEventListener("keydown", key2);

    return () => {
      observer.disconnect();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      host.removeEventListener("keydown", key2);
      sceneRef.current = null;
      mesh.geometry.dispose();
      material.dispose();
      sky.dispose();
      key.dispose();
      fill.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  // -------------------------------------------------------------- geometry
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    const woven = buildWeave(params);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(woven.positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(woven.normals, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(woven.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(woven.indices, 1));
    geometry.computeBoundingSphere();

    const previous = state.mesh.geometry;
    state.mesh.geometry = geometry;
    previous.dispose();

    // Frame the patch: half its diagonal, at the camera's half-angle.
    const half = woven.extent * 0.62;
    state.distance = half / Math.tan((28 * Math.PI) / 360);
    state.render();
    onReady?.();
  }, [params, onReady]);

  // ------------------------------------------------------------------ view
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const [azimuth, polar] = VIEWS[view];
    state.azimuth = azimuth;
    state.polar = polar;
    state.render();
  }, [view]);

  return (
    <div
      ref={hostRef}
      className={s.canvasHost}
      tabIndex={0}
      role="img"
      aria-label="A model of the cloth: warp and weft yarns interlacing two over, two under, seen at about ten millimetres across. Drag it, or focus it and use the arrow keys, to turn it. The named views underneath reach the same positions without a pointer."
    />
  );
}
