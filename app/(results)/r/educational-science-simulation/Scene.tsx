"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import type { Craft, SceneLive, Vec } from "./sim";
import { R_EARTH, sampleOrbit, vmag } from "./sim";

const BOARD = 0x211f1a;
const EARTH = 0x3a3730;
const GRID = 0x5c574c;
const YOU = 0xd4784a;
const THEM = 0x7aa3c7;
const RING = 0x3d3931;

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function toXY(p: Vec): { x: number; y: number } {
  return { x: p.x / R_EARTH, y: p.y / R_EARTH };
}

function setPositions(geo: THREE.BufferGeometry, pts: Vec[], z = 0) {
  const attr = geo.getAttribute("position") as THREE.BufferAttribute;
  const n = Math.min(pts.length, attr.count);
  for (let i = 0; i < n; i++) {
    const p = toXY(pts[i]);
    attr.setXYZ(i, p.x, p.y, z);
  }
  attr.needsUpdate = true;
  geo.setDrawRange(0, n);
  geo.computeBoundingSphere();
}

function circlePts(radius: number, n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(t), radius * Math.sin(t), 0));
  }
  return pts;
}

function makeGlobe(): THREE.Group {
  const g = new THREE.Group();
  g.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 28),
      new THREE.MeshLambertMaterial({ color: EARTH, emissive: 0x12100e }),
    ),
  );
  const lineMat = new THREE.LineBasicMaterial({
    color: GRID,
    transparent: true,
    opacity: 0.45,
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= 64; j++) {
      const t = (j / 64) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.sin(t) * Math.cos(a),
          Math.sin(t) * Math.sin(a),
          Math.cos(t),
        ),
      );
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  for (const lat of [0, 0.5236, 1.0472, -0.5236, -1.0472]) {
    const z = Math.sin(lat);
    const rho = Math.cos(lat);
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= 64; j++) {
      const t = (j / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(rho * Math.cos(t), rho * Math.sin(t), z));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  return g;
}

function makeLine(color: number, max: number, opacity = 1): THREE.Line {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(max * 3), 3));
  geo.setDrawRange(0, 0);
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}

function drawFlat(
  ctx: CanvasRenderingContext2D,
  live: SceneLive,
  w: number,
  h: number,
) {
  ctx.fillStyle = "#211f1a";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const need = live.target
    ? Math.max(vmag(live.chaser.r), vmag(live.target.r))
    : vmag(live.chaser.r);
  const span = Math.max(1.35, (need / R_EARTH) * 1.18);
  const s = Math.min(w, h) / (2 * span);

  const px = (p: Vec) => cx + (p.x / R_EARTH) * s;
  const py = (p: Vec) => cy - (p.y / R_EARTH) * s;

  ctx.strokeStyle = "#3d3931";
  ctx.lineWidth = 1;
  for (const alt of [200_000, 400_000, 800_000, 1_500_000]) {
    ctx.beginPath();
    ctx.arc(cx, cy, ((R_EARTH + alt) / R_EARTH) * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#2a2822";
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5c574c";
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * s, cy - Math.sin(a) * s);
    ctx.lineTo(cx - Math.cos(a) * s, cy + Math.sin(a) * s);
    ctx.stroke();
  }

  const orbit = (craft: Craft, color: string) => {
    const pts = sampleOrbit(craft, 80);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(px(p), py(p));
      else ctx.lineTo(px(p), py(p));
    });
    ctx.stroke();
  };
  orbit(live.chaser, "#d4784a");
  if (live.target) orbit(live.target, "#7aa3c7");

  ctx.strokeStyle = "#d4784a";
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  live.trail.forEach((p, i) => {
    if (i === 0) ctx.moveTo(px(p), py(p));
    else ctx.lineTo(px(p), py(p));
  });
  ctx.stroke();
  ctx.globalAlpha = 1;

  const mark = (p: Vec, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px(p), py(p), 4.5, 0, Math.PI * 2);
    ctx.fill();
  };
  mark(live.chaser.r, live.crashed ? "#c9a227" : "#d4784a");
  if (live.target) mark(live.target.r, "#7aa3c7");
}

export default function Scene({
  live,
  reduced,
}: {
  live: React.RefObject<SceneLive>;
  reduced: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    if (!hasWebGL()) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let raf = 0;
      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, reduced ? 1 : 1.5);
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      const tick = () => {
        drawFlat(ctx, live.current, el.clientWidth, el.clientHeight);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas.remove();
      };
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !reduced,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(BOARD, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, reduced ? 1 : 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 20);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xc8c2b4, 0.72));
    const key = new THREE.DirectionalLight(0xf0ebe0, 0.55);
    key.position.set(-2.2, 1.4, 3.2);
    scene.add(key);

    const globe = makeGlobe();
    scene.add(globe);
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(circlePts(1, 96)),
        new THREE.LineBasicMaterial({ color: 0x8a8374 }),
      ),
    );

    const rings = new THREE.Group();
    const ringMat = new THREE.LineBasicMaterial({
      color: RING,
      transparent: true,
      opacity: 0.7,
    });
    for (const alt of [200_000, 400_000, 800_000, 1_500_000]) {
      rings.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(
            circlePts((R_EARTH + alt) / R_EARTH, 96),
          ),
          ringMat,
        ),
      );
    }
    scene.add(rings);

    const youOrbit = makeLine(YOU, 128);
    const themOrbit = makeLine(THEM, 128, 0.85);
    const trail = makeLine(YOU, 240, 0.4);
    scene.add(youOrbit, themOrbit, trail);

    const youMat = new THREE.MeshLambertMaterial({ color: YOU });
    const you = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), youMat);
    const them = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.028, 0),
      new THREE.MeshLambertMaterial({ color: THEM }),
    );
    scene.add(you, them);

    const fit = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    let raf = 0;
    let span = 1.45;
    const tick = () => {
      const L = live.current;
      const youP = toXY(L.chaser.r);
      you.position.set(youP.x, youP.y, 0.02);
      youMat.color.setHex(L.crashed ? 0xc9a227 : YOU);

      if (L.target) {
        const tp = toXY(L.target.r);
        them.visible = true;
        them.position.set(tp.x, tp.y, 0.02);
        themOrbit.visible = true;
        setPositions(themOrbit.geometry, sampleOrbit(L.target, 96));
      } else {
        them.visible = false;
        themOrbit.visible = false;
      }

      setPositions(youOrbit.geometry, sampleOrbit(L.chaser, 96));
      setPositions(trail.geometry, L.trail);

      const far = L.target
        ? Math.max(vmag(L.chaser.r), vmag(L.target.r))
        : vmag(L.chaser.r);
      const want = Math.max(1.38, (far / R_EARTH) * 1.2);
      span = reduced ? want : span + (want - span) * 0.08;

      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      const aspect = w / h;
      if (aspect >= 1) {
        camera.left = -span * aspect;
        camera.right = span * aspect;
        camera.top = span;
        camera.bottom = -span;
      } else {
        camera.left = -span;
        camera.right = span;
        camera.top = span / aspect;
        camera.bottom = -span / aspect;
      }
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      canvas.remove();
    };
  }, [live, reduced]);

  return <div ref={host} style={{ position: "absolute", inset: 0 }} />;
}
