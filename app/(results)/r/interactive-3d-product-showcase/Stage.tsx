"use client";

/**
 * The stage: one WebGL canvas, one 2D trace, one simulation, one animation loop.
 *
 * Two decisions worth naming.
 *
 * The lever drag is done in screen space. On pointer down the handle is
 * raycast; on each move, the handle's screen displacement per unit of travel is
 * measured by finite difference and the pointer's motion is projected onto it.
 * Projecting onto the swing plane instead would have been simpler and would have
 * failed exactly where the camera looks along that plane, which is the default
 * three-quarter view.
 *
 * The readouts that change every frame are written straight to the DOM rather
 * than held in React state. Sixty renders a second of a component this size is
 * not free, and pressure is a needle, not application state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { read, type Reading } from "./analysis";
import { buildEnvironment, HORIZON, makeBackdropTexture } from "./environment";
import styles from "./leva.module.css";
import { buildMachine, handlePosition } from "./machine";
import {
  createSim,
  HAND_MAX,
  setHand,
  stepHeldHand,
  stepSim,
  STROKE_ML,
  type Phase,
  type PressInput,
  type Sample,
} from "./physics";
import { drawTrace } from "./trace";
import { SIM_NOTE, VIEWS } from "./copy";

const PHASE_TEXT: Record<Phase, string> = {
  charged: `Charged · ${STROKE_ML} ml in the cylinder`,
  pulling: "Pulling",
  spent: "Stroke spent",
  refilling: "Refilling the cylinder",
};

/** Camera limits, chosen so the object is always the subject. */
const PHI_MIN = 0.44;
const PHI_MAX = 1.44;
const THETA_LIMIT = 2.45;
const RADIUS_MIN = 0.34;
const RADIUS_MAX = 1.35;
/** Fixed simulation step. The render loop catches up in whole steps of this. */
const SIM_STEP = 1 / 120;

export default function Stage({
  view,
  onViewChange,
}: {
  view: string;
  onViewChange: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const pressureRef = useRef<HTMLSpanElement>(null);
  const loadRef = useRef<HTMLSpanElement>(null);
  const yieldRef = useRef<HTMLSpanElement>(null);
  const loadFillRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("charged");
  const [reading, setReading] = useState<Reading | null>(null);
  const [held, setHeld] = useState<PressInput>("release");

  /** Written by React, read by the animation loop. */
  const pressRef = useRef<PressInput>("release");
  const viewRequest = useRef<string | null>(null);

  useEffect(() => {
    viewRequest.current = view;
  }, [view]);

  useEffect(() => {
    if (!wrapRef.current || !chartRef.current) return;
    // Declared non-null rather than narrowed, because the hoisted handlers below
    // would otherwise lose the narrowing.
    const wrap: HTMLDivElement = wrapRef.current;
    const chart: HTMLCanvasElement = chartRef.current;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ------------------------------------------------------------ renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Chrome deserves the extra samples, but a large canvas on a dense display
    // can ask for eight million pixels a frame, which no integrated GPU enjoys.
    // Take the device ratio up to 2 and then trade it back down by area.
    function pixelRatioFor(w: number, h: number) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const budget = 2_600_000;
      const area = Math.max(1, w * h) * dpr * dpr;
      return area <= budget ? dpr : Math.max(1, dpr * Math.sqrt(budget / area));
    }
    renderer.setPixelRatio(pixelRatioFor(wrap.clientWidth, wrap.clientHeight));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Under 1 on purpose. The boiler dome is a mirror pointed at the ceiling, and
    // at 1.0 its highlight clips to a flat white cap that reads as painted plastic.
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // The light and all of the scene except the lever are fixed, so the shadow
    // map does not need redrawing when only the camera has moved — which is most
    // of the time. It is refreshed explicitly below when the mechanism moves.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const environment = buildEnvironment(renderer);
    scene.environment = environment.texture;
    // A photographic cove rather than a floor with a visible edge: a graded wall
    // behind, and fog tuned to the horizon band so the bench dissolves into it.
    const backdrop = makeBackdropTexture();
    scene.background = backdrop;
    // Starts beyond the widest camera pull-back, so it only ever eats the bench.
    scene.fog = new THREE.Fog(HORIZON, 1.5, 4.2);

    const machine = buildMachine();
    scene.add(machine.root);

    // A bright workshop. The lights here are deliberately modest: the machine is
    // almost entirely metal, and a metal surface takes no diffuse light at all, so
    // its brightness comes from the environment map and these only add highlights
    // and the cast shadow. Turning them up washes out the bench without touching
    // the chrome.
    const key = new THREE.DirectionalLight(0xfff4e2, 1.5);
    key.position.set(0.46, 0.95, 0.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.05;
    key.shadow.camera.far = 2.2;
    key.shadow.camera.left = -0.34;
    key.shadow.camera.right = 0.34;
    key.shadow.camera.top = 0.42;
    key.shadow.camera.bottom = -0.1;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.006;
    key.shadow.radius = 3;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe6efff, 0.35);
    fill.position.set(-0.8, 0.5, 0.25);
    scene.add(fill);

    const bounce = new THREE.DirectionalLight(0xffe9c8, 0.2);
    bounce.position.set(0.1, -0.4, 0.7);
    scene.add(bounce);

    const camera = new THREE.PerspectiveCamera(31, 1.4, 0.02, 12);

    /**
     * Widen the field of view as the canvas narrows, so the horizontal extent
     * stays put. Three's fov is vertical, so a phone in portrait would otherwise
     * crop the sides — and the sides are where the lever is, which would leave
     * the one thing the visitor has to grab off the edge of the screen.
     */
    function applyProjection() {
      const aspect = Math.max(0.35, wrap.clientWidth / Math.max(1, wrap.clientHeight));
      const base = Math.tan((31 * Math.PI) / 360);
      const fov =
        aspect >= 1.4
          ? 31
          : (2 * Math.atan(base * (1.4 / aspect)) * 180) / Math.PI;
      camera.aspect = aspect;
      camera.fov = Math.min(58, fov);
      camera.updateProjectionMatrix();
    }
    applyProjection();

    const home = VIEWS[0];
    const cam = {
      theta: home.theta,
      phi: home.phi,
      radius: reduceMotion ? home.radius : home.radius * 1.28,
      targetY: home.targetY,
    };
    const want = { ...cam, radius: home.radius };
    const target = new THREE.Vector3(0, cam.targetY, 0.03);

    function applyCamera() {
      const sinPhi = Math.sin(cam.phi);
      camera.position.set(
        cam.radius * sinPhi * Math.sin(cam.theta),
        cam.radius * Math.cos(cam.phi) + cam.targetY,
        cam.radius * sinPhi * Math.cos(cam.theta)
      );
      target.set(0, cam.targetY, 0.03);
      camera.lookAt(target);
    }
    applyCamera();

    // ------------------------------------------------------------- simulation
    const sim = createSim();
    const ghosts: Sample[][] = [];
    let firmness = 0;
    let hasPulled = false;

    // ---------------------------------------------------------------- input
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointers = new Map<number, { x: number; y: number }>();
    let mode: "none" | "orbit" | "lever" = "none";
    let leverPointerId = -1;
    let handAnchor = 0;
    let pinchStart = 0;
    let pinchRadius = 0;

    const scratchA = new THREE.Vector3();
    const scratchB = new THREE.Vector3();

    /** Pixels of handle travel across the screen per unit of lever travel. */
    function screenGradient(at: number, out: THREE.Vector2) {
      const step = 0.06;
      const a = Math.max(0, Math.min(1 - step, at));
      handlePosition(a, scratchA).project(camera);
      handlePosition(a + step, scratchB).project(camera);
      const halfW = wrap.clientWidth / 2;
      const halfH = wrap.clientHeight / 2;
      out.set(
        ((scratchB.x - scratchA.x) * halfW) / step,
        ((scratchA.y - scratchB.y) * halfH) / step
      );
      return out;
    }
    const gradient = new THREE.Vector2();

    function pointerNdc(event: PointerEvent) {
      const rect = wrap.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
    }

    function hitsLever(event: PointerEvent) {
      pointerNdc(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(machine.grabTargets, false).length > 0;
    }

    function onPointerDown(event: PointerEvent) {
      wrap.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2 && mode !== "lever") {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchRadius = want.radius;
        mode = "orbit";
        return;
      }
      if (mode === "lever") return;

      if (hitsLever(event)) {
        mode = "lever";
        leverPointerId = event.pointerId;
        sim.gripped = true;
        handAnchor = sim.hand;
        hasPulled = true;
        if (hintRef.current) hintRef.current.style.opacity = "0";
        wrap.dataset.grab = "lever";
      } else {
        mode = "orbit";
        wrap.dataset.grab = "orbit";
      }
    }

    function onPointerMove(event: PointerEvent) {
      const previous = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (mode === "none") {
        wrap.dataset.grab = hitsLever(event) ? "hover" : "";
        return;
      }
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;

      if (mode === "lever" && event.pointerId === leverPointerId) {
        screenGradient(sim.travel, gradient);
        const lengthSq = gradient.lengthSq();
        if (lengthSq > 4) {
          handAnchor += (dx * gradient.x + dy * gradient.y) / lengthSq;
          setHand(sim, handAnchor);
        }
        return;
      }

      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 8) {
          want.radius = clamp(
            (pinchRadius * pinchStart) / Math.max(8, distance),
            RADIUS_MIN,
            RADIUS_MAX
          );
        }
        return;
      }

      want.theta = clamp(want.theta - dx * 0.0062, -THETA_LIMIT, THETA_LIMIT);
      want.phi = clamp(want.phi - dy * 0.0055, PHI_MIN, PHI_MAX);
    }

    function endPointer(event: PointerEvent) {
      pointers.delete(event.pointerId);
      wrap.releasePointerCapture?.(event.pointerId);
      if (event.pointerId === leverPointerId) {
        sim.gripped = false;
        leverPointerId = -1;
      }
      if (pointers.size === 0) {
        mode = "none";
        wrap.dataset.grab = "";
      }
      pinchStart = 0;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const scale = Math.exp(event.deltaY * 0.0011);
      want.radius = clamp(want.radius * scale, RADIUS_MIN, RADIUS_MAX);
    }

    function onKeyDown(event: KeyboardEvent) {
      // Only when the canvas itself has focus. The lever button sits inside this
      // element and binds the same arrow keys to press and ease, and without this
      // guard easing off would tilt the camera at the same time.
      if (event.target !== wrap) return;
      const step = event.shiftKey ? 0.22 : 0.09;
      switch (event.key) {
        case "ArrowLeft":
          want.theta = clamp(want.theta + step, -THETA_LIMIT, THETA_LIMIT);
          break;
        case "ArrowRight":
          want.theta = clamp(want.theta - step, -THETA_LIMIT, THETA_LIMIT);
          break;
        case "ArrowUp":
          want.phi = clamp(want.phi - step * 0.6, PHI_MIN, PHI_MAX);
          break;
        case "ArrowDown":
          want.phi = clamp(want.phi + step * 0.6, PHI_MIN, PHI_MAX);
          break;
        case "+":
        case "=":
          want.radius = clamp(want.radius * 0.88, RADIUS_MIN, RADIUS_MAX);
          break;
        case "-":
        case "_":
          want.radius = clamp(want.radius * 1.14, RADIUS_MIN, RADIUS_MAX);
          break;
        case "Home":
          want.theta = home.theta;
          want.phi = home.phi;
          want.radius = home.radius;
          want.targetY = home.targetY;
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", endPointer);
    wrap.addEventListener("pointercancel", endPointer);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("keydown", onKeyDown);

    // ---------------------------------------------------------------- resize
    /** Set whenever something other than the simulation invalidates the frame. */
    let dirty = true;

    function resize() {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setPixelRatio(pixelRatioFor(w, h));
      renderer.setSize(w, h, false);
      applyProjection();
      dirty = true;
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    // ------------------------------------------------- pause when unwatched
    let onScreen = true;
    let frame = 0;
    const intersection = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen && document.visibilityState === "visible") start();
      },
      { threshold: 0.01 }
    );
    intersection.observe(wrap);

    function onVisibility() {
      if (document.visibilityState === "visible" && onScreen) start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    // ------------------------------------------------------------------ loop
    let last = performance.now();
    let simClock = 0;
    let readoutClock = 0;
    let previousPhase: Phase = sim.phase;
    const hintPosition = new THREE.Vector3();

    function tick(now: number) {
      if (!onScreen || document.visibilityState !== "visible") {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
      // The floor at zero is not defensive noise: the timestamp rAF hands us can
      // predate the performance.now() taken at setup, and one negative frame is
      // enough to flip the sign of the easing factor below, which then diverges
      // instead of converging and walks the camera off to infinity.
      const elapsed = Math.max(0, (now - last) / 1000);
      last = now;
      // The simulation is clamped so that a stalled tab cannot teleport the
      // piston. The camera uses real elapsed time, so a slow device still
      // finishes a move in the same wall-clock second rather than in the same
      // number of frames.
      const camDt = Math.min(0.3, elapsed);

      // The simulation runs on its own fixed clock rather than once per frame.
      // Tying it to frames means a machine that cannot hold sixty of them brews
      // in slow motion — the lever crawls, the shot never ends — which is exactly
      // the device most in need of the interaction working. The catch-up is
      // capped so that returning to a backgrounded tab does not run a minute of
      // extraction in one frame.
      simClock += Math.min(0.25, elapsed);
      while (simClock >= SIM_STEP) {
        simClock -= SIM_STEP;

        // Press-and-hold input, from the keyboard or the button. Skipped entirely
        // while a pointer has hold of the lever, which sets the hand directly.
        if (mode !== "lever") {
          const input = pressRef.current;
          if (input === "release") {
            firmness = 0;
            if (sim.gripped) sim.gripped = false;
          } else {
            sim.gripped = true;
            // Symmetrical, so that alternating the two keys holds a pressure
            // steady. An ease that fell faster than the press rose made the
            // plateau — the one shape the page is trying to teach — unplayable.
            firmness = Math.max(0, firmness + (input === "press" ? SIM_STEP : -SIM_STEP));
          }
          stepHeldHand(sim, input, firmness, SIM_STEP);
        }

        stepSim(sim, SIM_STEP);

        if (sim.finished) {
          const shot = sim.finished;
          setReading(read(shot));
          ghosts.unshift(shot.samples);
          if (ghosts.length > 2) ghosts.pop();
          dirty = true;
        }
      }
      if (sim.phase !== previousPhase) {
        previousPhase = sim.phase;
        setPhase(sim.phase);
      }

      // Is anything actually moving? A page left open on a settled machine should
      // not keep a GPU busy drawing the same frame sixty times a second.
      const machineMoving =
        sim.phase !== "charged" ||
        sim.pressure > 0.001 ||
        Math.abs(sim.velocity) > 1e-5 ||
        Math.abs(sim.hand - sim.travel) > 1e-4 ||
        sim.gripped ||
        pressRef.current !== "release";

      if (machineMoving || dirty) {
        machine.setTravel(sim.travel);
        machine.setPressure(sim.pressure);
        machine.setPour(sim.flow, sim.yield, sim.integrity);
        renderer.shadowMap.needsUpdate = true;
      }

      // Camera easing. Damped enough that it never overshoots.
      const requested = viewRequest.current;
      if (requested) {
        viewRequest.current = null;
        const preset = VIEWS.find((v) => v.id === requested);
        if (preset) {
          want.theta = preset.theta;
          want.phi = preset.phi;
          want.radius = preset.radius;
          want.targetY = preset.targetY;
          if (reduceMotion) Object.assign(cam, want);
        }
      }
      const drift =
        Math.abs(want.theta - cam.theta) +
        Math.abs(want.phi - cam.phi) +
        Math.abs(want.radius - cam.radius) +
        Math.abs(want.targetY - cam.targetY);
      if (drift > 1e-4) {
        const ease = 1 - Math.exp(-(reduceMotion ? 40 : 7) * camDt);
        cam.theta += (want.theta - cam.theta) * ease;
        cam.phi += (want.phi - cam.phi) * ease;
        cam.radius += (want.radius - cam.radius) * ease;
        cam.targetY += (want.targetY - cam.targetY) * ease;
        applyCamera();
      }

      if (machineMoving || drift > 1e-4 || dirty) {
        renderer.render(scene, camera);
        drawTrace(chart, {
          samples: sim.samples,
          ghosts,
          live: sim.phase === "pulling",
        });
        dirty = false;
      }

      // Ten readout updates a second is legible; sixty is a blur.
      readoutClock += elapsed;
      if (readoutClock > 0.1) {
        readoutClock = 0;
        if (pressureRef.current) pressureRef.current.textContent = sim.pressure.toFixed(1);
        if (loadRef.current) loadRef.current.textContent = sim.load.toFixed(1);
        if (yieldRef.current) yieldRef.current.textContent = sim.yield.toFixed(0);
        if (loadFillRef.current) {
          loadFillRef.current.style.width = `${Math.min(100, (sim.load / HAND_MAX) * 100)}%`;
        }
      }

      if (!hasPulled && hintRef.current) {
        handlePosition(sim.travel, hintPosition).project(camera);
        const x = (hintPosition.x * 0.5 + 0.5) * wrap.clientWidth;
        const y = (-hintPosition.y * 0.5 + 0.5) * wrap.clientHeight;
        hintRef.current.style.transform = `translate(${Math.round(x + 22)}px, ${Math.round(y - 10)}px)`;
      }
    }

    function start() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
    start();

    // --------------------------------------------------------------- cleanup
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", endPointer);
      wrap.removeEventListener("pointercancel", endPointer);
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("keydown", onKeyDown);
      scene.clear();
      machine.dispose();
      environment.dispose();
      backdrop.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  const setPress = useCallback((next: PressInput) => {
    pressRef.current = next;
    setHeld(next);
  }, []);

  const PRESS_KEYS = [" ", "Enter", "ArrowDown"];
  const EASE_KEYS = ["ArrowUp"];
  const onPullKeyDown = (event: React.KeyboardEvent) => {
    if (PRESS_KEYS.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) setPress("press");
    } else if (EASE_KEYS.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) setPress("ease");
    }
  };
  const onPullKeyUp = (event: React.KeyboardEvent) => {
    if (PRESS_KEYS.includes(event.key) || EASE_KEYS.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      setPress("release");
    }
  };

  const activeView = VIEWS.find((v) => v.id === view) ?? VIEWS[0];

  return (
    <>
      <div className={styles.stage}>
        <div
          ref={wrapRef}
          className={styles.canvasWrap}
          tabIndex={0}
          role="application"
          aria-label="Leva, in three dimensions. Drag the wooden handle to pull a shot, or drag elsewhere to turn the machine. Arrow keys turn it, plus and minus zoom, Home resets. The lever also has its own button below."
        >
          <div ref={hintRef} className={styles.hint} aria-hidden="true">
            Pull this ↓
          </div>
          <div className={styles.stageFoot}>
            <div className={styles.stageFootMain}>
              <p className={styles.viewNote}>{activeView.note}</p>
              <button
                type="button"
                className={styles.pull}
                data-held={held}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setPress("press");
                }}
                onPointerUp={() => setPress("release")}
                onPointerCancel={() => setPress("release")}
                onKeyDown={onPullKeyDown}
                onKeyUp={onPullKeyUp}
                onBlur={() => setPress("release")}
              >
                {held === "press"
                  ? "Pressing — ↑ to ease off"
                  : held === "ease"
                    ? "Easing off"
                    : "Hold to pull the lever"}
              </button>
            </div>
            <div className={styles.views}>
              {VIEWS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={styles.viewButton}
                  aria-pressed={view === preset.id}
                  onClick={() => onViewChange(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Pressure profile</h2>
            <span className={styles.phase} data-phase={phase}>
              {PHASE_TEXT[phase]}
            </span>
          </div>

          <div className={styles.chart}>
            <canvas ref={chartRef} aria-hidden="true" />
          </div>

          <div className={styles.readouts}>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>Pressure</span>
              <span className={styles.readoutValue}>
                <span ref={pressureRef}>0.0</span>
                <span className={styles.readoutUnit}>bar</span>
              </span>
            </div>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>At the handle</span>
              <span className={styles.readoutValue}>
                <span ref={loadRef}>0.9</span>
                <span className={styles.readoutUnit}>kg</span>
              </span>
            </div>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>In the cup</span>
              <span className={styles.readoutValue}>
                <span ref={yieldRef}>0</span>
                <span className={styles.readoutUnit}>ml</span>
              </span>
            </div>
          </div>
          <div className={styles.loadTrack}>
            <div ref={loadFillRef} className={styles.loadFill} />
          </div>

          <div className={styles.verdict} aria-live="polite">
            {reading ? (
              <>
                <h3 className={styles.verdictTitle}>{reading.title}</h3>
                <p className={styles.verdictStats}>
                  {reading.readings.map((r) => (
                    <span key={r.label}>
                      {r.label} <b>{r.value}</b>
                    </span>
                  ))}
                </p>
                {reading.lines.map((line) => (
                  <p key={line.slice(0, 24)}>{line}</p>
                ))}
              </>
            ) : (
              <>
              <p className={styles.waiting}>
                Drag the wooden handle down and hold it against the spring. The
                curve you draw here is the shot, and when you let go this panel will
                tell you what that curve would have made. It will not flatter you.
              </p>
              <p className={styles.waiting}>
                What works: two or three seconds low to wet the grounds, up to
                around nine bar, hold it there, then come off slowly. Going straight
                to the bottom breaks the bed.
              </p>
              <p className={styles.waiting}>
                Without a pointer: focus <kbd>Hold to pull the lever</kbd>, then
                hold <kbd>Space</kbd> to press harder and <kbd>↑</kbd> to ease off.
                Alternating the two holds a pressure steady.
              </p>
              </>
            )}
          </div>

          <p className={styles.simNote}>{SIM_NOTE}</p>
        </div>
      </div>
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
