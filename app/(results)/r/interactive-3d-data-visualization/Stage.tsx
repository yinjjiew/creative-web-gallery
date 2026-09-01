"use client";

/**
 * Orthographic plate. Map is looking down; section is looking along strike.
 * Events sit at true depth. The smear is a projection; the plate is the same
 * points seen from the side.
 */

import {
  type MutableRefObject,
  useEffect,
  useRef,
} from "react";
import * as THREE from "three";

import { CATALOG, type DepthBand, type Quake } from "./catalog";
import {
  COAST,
  depthToY,
  extentKm,
  LAT_MAX,
  LAT_MIN,
  latToZ,
  LON_MAX,
  LON_MIN,
  lonToX,
  STRIKE_RAD,
  TRENCH,
} from "./geo";
import styles from "./slab.module.css";

const INK = 0x1c1812;
const RUST = 0x8a3d28;
const VIEW_KM = 640;

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function pixelRatioFor(w: number, h: number) {
  const dpr = Math.min(1.25, window.devicePixelRatio || 1);
  const budget = 1_100_000;
  const area = Math.max(1, w * h) * dpr * dpr;
  return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
}

function markRadius(mw: number) {
  return 6.2 + (mw - 4.5) * 2.6;
}

function visibleQuake(
  q: Quake,
  minMw: number,
  yearFrom: number,
  yearTo: number,
  depth: DepthBand,
) {
  if (q.mw < minMw - 1e-6) return false;
  const y = Math.floor(q.year);
  if (y < yearFrom || y > yearTo) return false;
  if (depth === "shallow" && q.depthKm > 70) return false;
  if (depth === "mid" && (q.depthKm <= 70 || q.depthKm > 150)) return false;
  if (depth === "deep" && q.depthKm <= 150) return false;
  return true;
}

function paintMap() {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const toX = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * w;
  const toY = (lat: number) => (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * h;

  ctx.fillStyle = "#d9d4c6";
  ctx.fillRect(0, 0, w, h);

  let seed = 17;
  const rng = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = rng() > 0.5 ? "rgba(255,250,240,0.07)" : "rgba(40,32,20,0.05)";
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
  }

  ctx.beginPath();
  ctx.moveTo(toX(LON_MIN), toY(LAT_MIN));
  ctx.lineTo(toX(LON_MIN), toY(LAT_MAX));
  ctx.lineTo(toX(COAST[COAST.length - 1][1]), toY(LAT_MAX));
  for (let i = COAST.length - 1; i >= 0; i--) {
    ctx.lineTo(toX(COAST[i][1]), toY(COAST[i][0]));
  }
  ctx.closePath();
  ctx.fillStyle = "#c4b394";
  ctx.fill();
  ctx.strokeStyle = "#1c1812";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX(TRENCH[0][1]), toY(TRENCH[0][0]));
  for (let i = 1; i < TRENCH.length; i++) {
    ctx.lineTo(toX(TRENCH[i][1]), toY(TRENCH[i][0]));
  }
  ctx.strokeStyle = "#8a3d28";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(28,24,18,0.18)";
  ctx.lineWidth = 1;
  ctx.font = "500 15px sans-serif";
  ctx.fillStyle = "rgba(28,24,18,0.45)";
  ctx.textAlign = "left";
  for (let lat = 37; lat <= 40; lat++) {
    ctx.beginPath();
    ctx.moveTo(0, toY(lat));
    ctx.lineTo(w, toY(lat));
    ctx.stroke();
    ctx.fillText(`${lat}°N`, 14, toY(lat) - 6);
  }
  ctx.textAlign = "center";
  for (const lon of [140, 142, 144]) {
    ctx.beginPath();
    ctx.moveTo(toX(lon), 0);
    ctx.lineTo(toX(lon), h);
    ctx.stroke();
    ctx.fillText(`${lon}°E`, toX(lon), h - 16);
  }

  ctx.fillStyle = "#1c1812";
  ctx.font = "600 20px serif";
  ctx.textAlign = "center";
  ctx.fillText("HONSHU", toX(140.35), toY(38.35));
  ctx.fillStyle = "#5c564c";
  ctx.font = "500 16px serif";
  ctx.fillText("PACIFIC", toX(144.15), toY(37.15));
  ctx.fillStyle = "#8a3d28";
  ctx.font = "600 13px sans-serif";
  ctx.fillText("TRENCH", toX(144.35), toY(38.85));

  ctx.fillStyle = "#1c1812";
  ctx.beginPath();
  ctx.arc(toX(140.869), toY(38.268), 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "500 13px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Sendai", toX(140.869) - 8, toY(38.268) + 4);

  ctx.strokeStyle = "#1c1812";
  ctx.lineWidth = 1.5;
  const nx = toX(144.55);
  const ny = toY(40.55);
  ctx.beginPath();
  ctx.moveTo(nx, ny + 22);
  ctx.lineTo(nx, ny - 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(nx - 6, ny - 14);
  ctx.lineTo(nx, ny - 26);
  ctx.lineTo(nx + 6, ny - 14);
  ctx.stroke();
  ctx.fillStyle = "#1c1812";
  ctx.font = "600 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", nx, ny - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function lineFrom(latLon: [number, number][], y: number, color: number) {
  const pts = latLon.map(([lat, lon]) => new THREE.Vector3(lonToX(lon), y, latToZ(lat)));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
}

function makeLabel(text: string, hex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 160, 40);
  ctx.fillStyle = hex;
  ctx.font = "600 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 80, 20);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  sprite.scale.set(48, 12, 1);
  return sprite;
}

const AZIMUTH = STRIKE_RAD;

export default function Stage({
  tiltRef,
  ve,
  minMw,
  yearFrom,
  yearTo,
  depth,
  selectedId,
  reduceMotion,
  onTilt,
  onSelect,
}: {
  tiltRef: MutableRefObject<number>;
  ve: number;
  minMw: number;
  yearFrom: number;
  yearTo: number;
  depth: DepthBand;
  selectedId: string | null;
  reduceMotion: boolean;
  onTilt: (tilt: number) => void;
  onSelect: (id: string | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ ve, minMw, yearFrom, yearTo, depth, selectedId, reduceMotion, onTilt, onSelect });
  propsRef.current = { ve, minMw, yearFrom, yearTo, depth, selectedId, reduceMotion, onTilt, onSelect };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0xebe4d4, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const root = new THREE.Group();
    // 180° about vertical: lookAt-from-above otherwise draws south-up.
    root.rotation.y = Math.PI;
    scene.add(root);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 10, 4000);
    const dummy = new THREE.Object3D();
    const projected = new THREE.Vector3();

    const ext = extentKm();
    const mapW = ext.east - ext.west;
    const mapH = ext.north - ext.south;
    const mapTex = paintMap();
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(mapW, mapH),
      new THREE.MeshBasicMaterial({
        map: mapTex ?? undefined,
        color: mapTex ? 0xffffff : 0xd9d4c6,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    plate.rotation.x = -Math.PI / 2;
    plate.position.set((ext.west + ext.east) / 2, 0, (ext.south + ext.north) / 2);
    root.add(plate);

    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ext.west, 0, ext.south),
        new THREE.Vector3(ext.east, 0, ext.south),
        new THREE.Vector3(ext.east, 0, ext.north),
        new THREE.Vector3(ext.west, 0, ext.north),
      ]),
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.35 }),
    );
    root.add(frame);
    root.add(lineFrom(TRENCH, 0.4, RUST));
    root.add(lineFrom(COAST, 0.4, INK));

    const ticks: THREE.Line[] = [];
    const tickMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.45 });
    const westRail = ext.west + 18;
    for (const d of [0, 50, 100, 150, 200, 250]) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(westRail, 0, 0),
        new THREE.Vector3(westRail + 14, 0, 0),
      ]);
      const line = new THREE.Line(geo, tickMat);
      line.userData.depth = d;
      ticks.push(line);
      root.add(line);
    }

    const depthLabels: THREE.Sprite[] = [];
    for (const d of [0, 50, 100, 150, 200, 250]) {
      const sprite = makeLabel(d === 0 ? "0 km" : String(d), "#5c564c");
      if (!sprite) continue;
      sprite.userData.depth = d;
      sprite.scale.set(32, 8, 1);
      depthLabels.push(sprite);
      root.add(sprite);
    }

    const westL = makeLabel("W · Honshu", "#5c564c");
    const eastL = makeLabel("E · Pacific", "#5c564c");
    if (westL) {
      westL.position.set(ext.west + 40, 12, 0);
      root.add(westL);
    }
    if (eastL) {
      eastL.position.set(ext.east - 40, 12, 0);
      root.add(eastL);
    }

    const dots = new THREE.InstancedMesh(
      new THREE.CircleGeometry(1, 11),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      }),
      CATALOG.length,
    );
    dots.frustumCulled = false;
    dots.renderOrder = 2;
    dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(dots);

    const ink = new THREE.Color(INK);
    const rust = new THREE.Color(RUST);
    const inkSoft = new THREE.Color(0x3a342c);
    for (let i = 0; i < CATALOG.length; i++) {
      dots.setColorAt(i, CATALOG[i].kind === "observed" ? rust : ink);
    }
    dots.instanceColor?.needsUpdate && (dots.instanceColor.needsUpdate = true);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.55, 28),
      new THREE.MeshBasicMaterial({
        color: RUST,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    ring.visible = false;
    root.add(ring);

    let shown = tiltRef.current;
    let running = true;
    let dirty = true;
    let dragging = false;
    let lastY = 0;
    let travel = 0;
    let lastKey = "";

    const applyCamera = (t: number, veNow: number) => {
      const rect = wrap.getBoundingClientRect();
      const aspect = Math.max(0.4, rect.width / Math.max(1, rect.height));
      camera.left = (-VIEW_KM / 2) * aspect;
      camera.right = (VIEW_KM / 2) * aspect;
      camera.top = VIEW_KM / 2;
      camera.bottom = -VIEW_KM / 2;
      camera.updateProjectionMatrix();

      const phi = t * (Math.PI / 2);
      const r = 760;
      camera.position.set(
        r * Math.sin(phi) * Math.sin(AZIMUTH),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(AZIMUTH),
      );
      camera.up.set(0, Math.sin(phi), Math.cos(phi));
      camera.lookAt(0, -55 * veNow * t, 0);
      camera.updateMatrixWorld(true);

      wrap.parentElement?.style.setProperty(
        "--scale-px",
        `${Math.round((100 / VIEW_KM) * rect.height)}px`,
      );
    };

    const applyMarks = (t: number, veNow: number) => {
      const { minMw: mw, yearFrom: y0, yearTo: y1, depth: band, selectedId: sel } = propsRef.current;
      ring.visible = false;
      for (let i = 0; i < CATALOG.length; i++) {
        const q = CATALOG[i];
        const on = visibleQuake(q, mw, y0, y1, band);
        const x = lonToX(q.lon);
        const z = latToZ(q.lat);
        const y = depthToY(q.depthKm, veNow);
        dummy.position.set(x, y, z);
        dummy.quaternion.copy(camera.quaternion);
        const r = on ? markRadius(q.mw) * (q.kind === "observed" ? 1.15 : 1) : 0;
        dummy.scale.setScalar(r);
        dummy.updateMatrix();
        dots.setMatrixAt(i, dummy.matrix);
        const col = !on ? inkSoft : q.kind === "observed" ? rust : ink;
        dots.setColorAt(i, col);
        if (sel && q.id === sel && on) {
          ring.visible = true;
          ring.position.set(x, y, z);
          ring.quaternion.copy(camera.quaternion);
          ring.scale.setScalar(Math.max(6, r * 1.8));
        }
      }
      dots.instanceMatrix.needsUpdate = true;
      if (dots.instanceColor) dots.instanceColor.needsUpdate = true;

      for (const line of ticks) {
        const d = line.userData.depth as number;
        const y = depthToY(d, veNow);
        const pos = line.geometry.attributes.position;
        pos.setXYZ(0, westRail, y, 0);
        pos.setXYZ(1, westRail + 16, y, 0);
        pos.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = 0.15 + t * 0.5;
      }
      for (const sprite of depthLabels) {
        const d = sprite.userData.depth as number;
        sprite.position.set(westRail - 8, depthToY(d, veNow), 0);
        sprite.material.opacity = t;
      }
      if (westL) westL.material.opacity = 0.25 + t * 0.7;
      if (eastL) eastL.material.opacity = 0.25 + t * 0.7;
    };

    const pickAt = (clientX: number, clientY: number) => {
      const rect = wrap.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const { minMw: mw, yearFrom: y0, yearTo: y1, depth: band, ve: veNow, onSelect: select } =
        propsRef.current;
      let best: string | null = null;
      let bestD = 18;
      for (const q of CATALOG) {
        if (!visibleQuake(q, mw, y0, y1, band)) continue;
        projected.set(lonToX(q.lon), depthToY(q.depthKm, veNow), latToZ(q.lat));
        projected.project(camera);
        if (projected.z < -1 || projected.z > 1) continue;
        const sx = (projected.x * 0.5 + 0.5) * rect.width;
        const sy = (-projected.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(sx - mx, sy - my);
        if (d < bestD) {
          bestD = d;
          best = q.id;
        }
      }
      select(best);
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      dirty = true;
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastY = event.clientY;
      travel = 0;
      wrap.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dy = event.clientY - lastY;
      lastY = event.clientY;
      travel += Math.abs(dy);
      propsRef.current.onTilt(clamp(tiltRef.current + dy / 260, 0, 1));
      dirty = true;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (travel < 7) pickAt(event.clientX, event.clientY);
      dirty = true;
    };

    const tick = () => {
      if (!running) return;
      const p = propsRef.current;
      const key = `${p.ve}|${p.minMw}|${p.yearFrom}|${p.yearTo}|${p.depth}|${p.selectedId}`;
      if (key !== lastKey) {
        lastKey = key;
        dirty = true;
      }
      const target = tiltRef.current;
      const reduce = p.reduceMotion;
      if (reduce) {
        if (shown !== target) {
          shown = target;
          dirty = true;
        }
      } else {
        const next = shown + (target - shown) * 0.14;
        if (Math.abs(next - shown) > 0.0004) {
          shown = next;
          dirty = true;
        } else if (shown !== target && Math.abs(target - shown) <= 0.0004) {
          shown = target;
          dirty = true;
        }
      }
      if (dirty) {
        applyCamera(shown, propsRef.current.ve);
        applyMarks(shown, propsRef.current.ve);
        renderer.render(scene, camera);
        dirty = false;
      }
      requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    resize();
    applyCamera(shown, propsRef.current.ve);
    applyMarks(shown, propsRef.current.ve);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);

    return () => {
      running = false;
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      plate.geometry.dispose();
      (plate.material as THREE.MeshBasicMaterial).map?.dispose();
      (plate.material as THREE.Material).dispose();
      dots.geometry.dispose();
      (dots.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      mapTex?.dispose();
      if (renderer.domElement.parentElement === wrap) {
        wrap.removeChild(renderer.domElement);
      }
    };
  }, [tiltRef]);

  return (
    <div
      ref={wrapRef}
      className={styles.stage}
      tabIndex={0}
      role="application"
      aria-label="Japan Trench hypocentres. Drag vertically from map to section."
    />
  );
}
