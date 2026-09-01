"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { makeMagnetCanvas, makePaperCanvas } from "./paper";
import styles from "./plate.module.css";
import { hitMagnet, type MagnetHit } from "./physics";
import { particleCount, Sim, type Preset } from "./sim";

export type { Preset };

export type FieldHandle = {
  preset: (kind: Preset) => void;
  tap: () => void;
  flip: () => void;
};

type Props = {
  fontFamily: string;
  reducedMotion: boolean;
  onReady: (handle: FieldHandle) => void;
  onFailed: () => void;
  onPreset: (kind: Preset) => void;
  onCaption: (text: string) => void;
  onAnnounce: (text: string) => void;
};

type Drag = {
  index: number;
  mode: MagnetHit;
  ox: number;
  oy: number;
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Field({
  fontFamily,
  reducedMotion,
  onReady,
  onFailed,
  onPreset,
  onCaption,
  onAnnounce,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const onReadyRef = useRef(onReady);
  const onFailedRef = useRef(onFailed);
  const onPresetRef = useRef(onPreset);
  const onCaptionRef = useRef(onCaption);
  const onAnnounceRef = useRef(onAnnounce);
  onReadyRef.current = onReady;
  onFailedRef.current = onFailed;
  onPresetRef.current = onPreset;
  onCaptionRef.current = onCaption;
  onAnnounceRef.current = onAnnounce;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!hasWebGL()) {
      const fallback = paintFallback(host, fontFamily, reducedMotion, {
        onReady: (h) => onReadyRef.current(h),
        onPreset: (k) => onPresetRef.current(k),
        onCaption: (t) => onCaptionRef.current(t),
        onAnnounce: (t) => onAnnounceRef.current(t),
      });
      if (!fallback) onFailedRef.current();
      return fallback;
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0xe2d8c4, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = styles.stage;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Iron filings on paper over bar magnets. Drag a magnet to change the field.",
    );
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -8, 8);
    camera.position.z = 4;

    const paperTex = new THREE.CanvasTexture(makePaperCanvas(1024));
    paperTex.colorSpace = THREE.SRGBColorSpace;
    paperTex.anisotropy = 4;
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: paperTex, toneMapped: false }),
    );
    paper.position.z = -1;
    scene.add(paper);

    const magTex = new THREE.CanvasTexture(makeMagnetCanvas(fontFamily));
    magTex.colorSpace = THREE.SRGBColorSpace;
    const magMat = new THREE.MeshBasicMaterial({
      map: magTex,
      transparent: true,
      toneMapped: false,
    });
    const magGeo = new THREE.PlaneGeometry(1, 1);
    const magMeshes: THREE.Mesh[] = [];

    const selectMat = new THREE.LineBasicMaterial({
      color: 0x1a1612,
      transparent: true,
      opacity: 0.35,
    });
    const select = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, -0.5, 0),
        new THREE.Vector3(0.5, -0.5, 0),
        new THREE.Vector3(0.5, 0.5, 0),
        new THREE.Vector3(-0.5, 0.5, 0),
      ]),
      selectMat,
    );
    select.position.z = 0.05;
    scene.add(select);

    const sizeUniform = { value: 10 };
    const filingMat = new THREE.ShaderMaterial({
      uniforms: { uSize: sizeUniform },
      vertexShader: FILING_VERT,
      fragmentShader: FILING_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    let filings: THREE.Points | null = null;
    let posAttr: THREE.BufferAttribute | null = null;
    let sim: Sim | null = null;

    const world = { w: 80, h: 50 };
    let drag: Drag | null = null;
    let dirty = true;
    let running = true;
    let raf = 0;
    let last = performance.now();
    let warmed = false;

    const syncWorld = (w: number, h: number) => {
      world.w = w;
      world.h = h;
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      paper.scale.set(w, h, 1);
      paperTex.repeat.set(w / 70, h / 70);
      sim?.setBounds(w, h);
    };

    const ensureSim = () => {
      const rect = host.getBoundingClientRect();
      const count = particleCount(rect.width, rect.height, reducedRef.current);
      if (sim && sim.count === count) return sim;
      if (filings) {
        scene.remove(filings);
        filings.geometry.dispose();
        filings = null;
        posAttr = null;
      }
      sim = new Sim(count);
      sim.setBounds(world.w, world.h);
      sim.applyPreset("unlike");
      if (reducedRef.current) sim.settle(24);
      sim.snapAngles();

      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = sim.px[i];
        pos[i * 3 + 1] = sim.py[i];
      }
      posAttr = new THREE.BufferAttribute(pos, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", posAttr);
      geo.setAttribute("angle", new THREE.BufferAttribute(sim.angle, 1).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute("shade", new THREE.BufferAttribute(sim.shade, 1));
      geo.setAttribute("flen", new THREE.BufferAttribute(sim.length, 1));
      const points = new THREE.Points(geo, filingMat);
      points.frustumCulled = false;
      scene.add(points);
      filings = points;
      dirty = true;
      return sim;
    };

    const syncMagnets = (s: Sim) => {
      while (magMeshes.length < s.magnets.length) {
        const mesh = new THREE.Mesh(magGeo, magMat);
        mesh.position.z = -0.08;
        scene.add(mesh);
        magMeshes.push(mesh);
      }
      for (let i = 0; i < magMeshes.length; i++) {
        const mesh = magMeshes[i];
        const m = s.magnets[i];
        if (!m) {
          mesh.visible = false;
          continue;
        }
        mesh.visible = true;
        mesh.position.x = m.x;
        mesh.position.y = m.y;
        mesh.rotation.z = m.angle + (m.flipped ? Math.PI : 0);
        mesh.scale.set(m.length, m.width, 1);
      }
      const sel = s.magnets[s.selected];
      if (sel) {
        select.visible = true;
        select.position.x = sel.x;
        select.position.y = sel.y;
        select.rotation.z = sel.angle;
        select.scale.set(sel.length + 0.7, sel.width + 0.7, 1);
      } else {
        select.visible = false;
      }
    };

    const writeFilings = (s: Sim) => {
      if (!posAttr) return;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < s.count; i++) {
        arr[i * 3] = s.px[i];
        arr[i * 3 + 1] = s.py[i];
      }
      posAttr.needsUpdate = true;
      const ang = filings?.geometry.getAttribute("angle");
      if (ang) ang.needsUpdate = true;
    };

    const report = (s: Sim) => {
      onPresetRef.current(s.preset);
      onCaptionRef.current(s.caption());
      onAnnounceRef.current(s.announce());
    };

    const afterChange = (s: Sim) => {
      s.refreshPoles();
      if (reducedRef.current) {
        s.settle(16);
      } else {
        s.stir = Math.max(s.stir, 0.35);
        s.snapAngles();
      }
      dirty = true;
      report(s);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      let worldH = 64;
      let worldW = worldH * aspect;
      if (aspect < 0.85) {
        worldW = 56;
        worldH = worldW / aspect;
      }
      syncWorld(worldW, worldH);
      sizeUniform.value = (w / worldW) * dpr * 1.08;
      ensureSim();
      dirty = true;
    };

    const toWorld = (clientX: number, clientY: number) => {
      const r = renderer.domElement.getBoundingClientRect();
      return {
        x: ((clientX - r.left) / r.width) * world.w - world.w / 2,
        y: -(((clientY - r.top) / r.height) * world.h - world.h / 2),
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      const s = sim;
      if (!s) return;
      const p = toWorld(e.clientX, e.clientY);
      for (let i = s.magnets.length - 1; i >= 0; i--) {
        const hit = hitMagnet(p.x, p.y, s.magnets[i], 0.7);
        if (!hit) continue;
        s.selected = i;
        drag = { index: i, mode: hit, ox: p.x - s.magnets[i].x, oy: p.y - s.magnets[i].y };
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        dirty = true;
        return;
      }
      s.tap();
      dirty = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || !sim) return;
      const m = sim.magnets[drag.index];
      if (!m) return;
      const p = toWorld(e.clientX, e.clientY);
      if (drag.mode === "body") {
        m.x = p.x - drag.ox;
        m.y = p.y - drag.oy;
      } else if (drag.mode === "endN") {
        m.angle = Math.atan2(p.y - m.y, p.x - m.x);
      } else {
        m.angle = Math.atan2(p.y - m.y, p.x - m.x) + Math.PI;
      }
      sim.clampMagnet(m);
      sim.refreshPoles();
      if (reducedRef.current) {
        sim.snapAngles();
      } else {
        sim.stir = Math.max(sim.stir, 0.25);
      }
      dirty = true;
      e.preventDefault();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drag) return;
      drag = null;
      if (sim) {
        if (reducedRef.current) sim.settle(20);
        report(sim);
      }
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const s = sim;
      if (!s) return;
      const step = e.shiftKey ? 2.4 : 1.1;
      if (e.key === "ArrowLeft") {
        s.nudgeSelected(-step, 0);
        afterChange(s);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        s.nudgeSelected(step, 0);
        afterChange(s);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        s.nudgeSelected(0, step);
        afterChange(s);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        s.nudgeSelected(0, -step);
        afterChange(s);
        e.preventDefault();
      } else if (e.key === "[" || e.key === "{") {
        s.rotateSelected(-0.12);
        afterChange(s);
      } else if (e.key === "]" || e.key === "}") {
        s.rotateSelected(0.12);
        afterChange(s);
      } else if (e.key === "f" || e.key === "F") {
        s.flipSelected();
        afterChange(s);
      } else if (e.key === " " || e.key === "t" || e.key === "T") {
        s.tap();
        dirty = true;
        e.preventDefault();
      } else if (e.key === "1") {
        s.applyPreset("unlike");
        if (reducedRef.current) s.settle(16);
        report(s);
        dirty = true;
      } else if (e.key === "2") {
        s.applyPreset("like");
        if (reducedRef.current) s.settle(16);
        report(s);
        dirty = true;
      } else if (e.key === "3") {
        s.applyPreset("single");
        if (reducedRef.current) s.settle(16);
        report(s);
        dirty = true;
      }
    };

    const handle: FieldHandle = {
      preset: (kind) => {
        const s = sim;
        if (!s) return;
        s.applyPreset(kind);
        if (reducedRef.current) s.settle(16);
        report(s);
        dirty = true;
      },
      tap: () => {
        sim?.tap();
        dirty = true;
      },
      flip: () => {
        const s = sim;
        if (!s) return;
        s.flipSelected();
        afterChange(s);
      },
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = sim;
      if (s) {
        if (!reducedRef.current && warmed) {
          s.step(dt);
          dirty = true;
        } else if (drag) {
          s.snapAngles();
          dirty = true;
        }
        if (dirty) {
          syncMagnets(s);
          writeFilings(s);
          dirty = false;
        }
      }
      renderer.render(scene, camera);
      warmed = true;
      raf = requestAnimationFrame(tick);
    };

    resize();
    ensureSim();
    if (sim) {
      syncMagnets(sim);
      writeFilings(sim);
      report(sim);
    }
    onReadyRef.current(handle);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("keydown", onKey);

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("keydown", onKey);
      canvas.remove();
      paper.geometry.dispose();
      (paper.material as THREE.Material).dispose();
      paperTex.dispose();
      magGeo.dispose();
      magMat.dispose();
      magTex.dispose();
      select.geometry.dispose();
      selectMat.dispose();
      if (filings) {
        filings.geometry.dispose();
      }
      filingMat.dispose();
      renderer.dispose();
    };
  }, [fontFamily, reducedMotion]);

  return <div ref={hostRef} className={styles.host} />;
}

const FILING_VERT = /* glsl */ `
attribute float angle;
attribute float shade;
attribute float flen;
uniform float uSize;
varying float vAngle;
varying float vShade;
void main() {
  vAngle = angle;
  vShade = shade;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(uSize * flen, 2.0);
}
`;

const FILING_FRAG = /* glsl */ `
varying float vAngle;
varying float vShade;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(-vAngle);
  float s = sin(-vAngle);
  vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  if (abs(q.x) > 0.48 || abs(q.y) > 0.11) discard;
  if (abs(q.x) > 0.40 && abs(q.y) > 0.06) discard;
  float iron = 0.10 + vShade * 0.17;
  gl_FragColor = vec4(iron, iron * 0.90, iron * 0.76, 0.95);
}
`;

function paintFallback(
  host: HTMLDivElement,
  fontFamily: string,
  reduced: boolean,
  hooks: {
    onReady: (handle: FieldHandle) => void;
    onPreset: (kind: Preset) => void;
    onCaption: (text: string) => void;
    onAnnounce: (text: string) => void;
  },
): (() => void) | undefined {
  const canvas = document.createElement("canvas");
  canvas.className = styles.stage;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Iron filings on paper over bar magnets. Drag a magnet to change the field.",
  );
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const paper = makePaperCanvas(512);
  const mag = makeMagnetCanvas(fontFamily);
  const world = { w: 80, h: 50 };
  let sim: Sim | null = null;
  let drag: Drag | null = null;
  let raf = 0;
  let last = performance.now();
  let running = true;

  const fit = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    const aspect = r.width / r.height;
    if (aspect < 0.85) {
      world.w = 56;
      world.h = world.w / aspect;
    } else {
      world.h = 64;
      world.w = world.h * aspect;
    }
    const count = Math.min(8000, particleCount(r.width, r.height, reduced));
    if (!sim || sim.count !== count) {
      sim = new Sim(count);
      sim.setBounds(world.w, world.h);
      sim.applyPreset("unlike");
      sim.settle(reduced ? 50 : 24);
    } else {
      sim.setBounds(world.w, world.h);
    }
  };

  const toWorld = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * world.w - world.w / 2,
      y: -(((clientY - r.top) / r.height) * world.h - world.h / 2),
    };
  };

  const report = (s: Sim) => {
    hooks.onPreset(s.preset);
    hooks.onCaption(s.caption());
    hooks.onAnnounce(s.announce());
  };

  const draw = () => {
    const s = sim;
    if (!s) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(paper, 0, 0, w, h);
    const sx = w / world.w;
    const sy = h / world.h;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(sx, -sy);

    ctx.strokeStyle = "rgba(26, 22, 18, 0.22)";
    ctx.lineWidth = 0.06;
    for (let i = 0; i < s.count; i++) {
      const a = s.angle[i];
      const len = s.length[i] * 0.5;
      ctx.beginPath();
      ctx.moveTo(s.px[i] - Math.cos(a) * len, s.py[i] - Math.sin(a) * len);
      ctx.lineTo(s.px[i] + Math.cos(a) * len, s.py[i] + Math.sin(a) * len);
      ctx.stroke();
    }

    for (let i = 0; i < s.magnets.length; i++) {
      const m = s.magnets[i];
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle + (m.flipped ? Math.PI : 0));
      ctx.scale(1, -1);
      ctx.drawImage(mag, -m.length / 2, -m.width / 2, m.length, m.width);
      if (i === s.selected) {
        ctx.strokeStyle = "rgba(26, 22, 18, 0.4)";
        ctx.lineWidth = 0.08;
        ctx.strokeRect(-m.length / 2 - 0.3, -m.width / 2 - 0.3, m.length + 0.6, m.width + 0.6);
      }
      ctx.restore();
    }
    ctx.restore();
  };

  const handle: FieldHandle = {
    preset: (kind) => {
      if (!sim) return;
      sim.applyPreset(kind);
      sim.settle(reduced ? 40 : 20);
      report(sim);
    },
    tap: () => sim?.tap(),
    flip: () => {
      if (!sim) return;
      sim.flipSelected();
      if (reduced) sim.settle(20);
      else sim.snapAngles();
      report(sim);
    },
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!sim) return;
    const p = toWorld(e.clientX, e.clientY);
    for (let i = sim.magnets.length - 1; i >= 0; i--) {
      const hit = hitMagnet(p.x, p.y, sim.magnets[i], 0.7);
      if (!hit) continue;
      sim.selected = i;
      drag = { index: i, mode: hit, ox: p.x - sim.magnets[i].x, oy: p.y - sim.magnets[i].y };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    sim.tap();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag || !sim) return;
    const m = sim.magnets[drag.index];
    const p = toWorld(e.clientX, e.clientY);
    if (drag.mode === "body") {
      m.x = p.x - drag.ox;
      m.y = p.y - drag.oy;
    } else if (drag.mode === "endN") {
      m.angle = Math.atan2(p.y - m.y, p.x - m.x);
    } else {
      m.angle = Math.atan2(p.y - m.y, p.x - m.x) + Math.PI;
    }
    sim.clampMagnet(m);
    sim.refreshPoles();
    if (reduced) sim.snapAngles();
    e.preventDefault();
  };

  const onPointerUp = () => {
    drag = null;
    if (sim) report(sim);
  };

  const tick = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (sim && !reduced) sim.step(dt);
    draw();
    raf = requestAnimationFrame(tick);
  };

  fit();
  if (sim) report(sim);
  hooks.onReady(handle);
  const ro = new ResizeObserver(fit);
  ro.observe(host);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  raf = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.remove();
  };
}
