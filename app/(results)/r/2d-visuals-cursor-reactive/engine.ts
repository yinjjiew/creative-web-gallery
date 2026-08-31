import {
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  harmonicAmplitudes,
} from "./shader";

/**
 * The instrument: a WebGL2 plate, the parameter model that drives it, and all
 * the input wiring. React owns none of this — the loop writes uniforms, not
 * state, so a 120 Hz pointer never causes a render.
 *
 * The mapping is the point. The cursor's offset from the centre of the plate is
 * read directly as the *difference* between the two rulings: horizontal offset
 * separates their periods, vertical offset separates their orientations. Those
 * two quantities are the two components of the moiré wave vector, so the figure
 * you get points at your cursor and tightens as you move away from the middle.
 * The centre is where the fringe spacing runs longest, and the response is
 * shaped so the sensitive ground near it is navigable rather than merely
 * twitchy.
 *
 * Everything geometric is stated as a number of fringes across the plate rather
 * than as a spacing in pixels. Fringe spacing is the wrong invariant: a figure
 * of four beautiful arcs on a desktop is less than one arc on a phone, which is
 * a flat grey field. Counting fringes instead makes the same gesture produce a
 * proportionate figure at any size or aspect ratio.
 */

export type Readout = {
  /** Fractional difference between the two periods. */
  dPeriod: number;
  /** Angle between the two rulings, radians. */
  dTheta: number;
  /** Moiré fringe spacing at the plate centre, CSS pixels. */
  fringe: number;
  drifting: boolean;
};

export type PlateOptions = {
  reducedMotion: boolean;
  onReadout: (r: Readout) => void;
  onFirstInput: () => void;
  onAnnounce: (text: string) => void;
};

export type PlateHandle = {
  dispose: () => void;
  setReducedMotion: (reduced: boolean) => void;
};

/**
 * Ruling period, CSS pixels — fine, but never a grey mush — and the floor on
 * that period measured in the physical samples actually available. A buffer
 * below CSS resolution would dissolve a 5.6 pixel ruling toward flat grey, so
 * on a machine that has to draw small the ruling coarsens to stay legible.
 *
 * The figure does not move when it does. Every fringe count below is converted
 * into a period difference *through* the period, so the difference of the two
 * wave vectors comes out as the count over the plate whatever the ruling is.
 */
const BASE_PERIOD = 5.6;
const PERIOD_SAMPLES = 4.5;
/**
 * Fringes the cursor lays across the plate at full travel, one axis each. This
 * is the quantity held constant across viewports, and everything else about the
 * figure is derived from it.
 */
const FRINGE_SPAN = 13;
/**
 * The figure's standing curvature, as a difference in quadratic bend between
 * the two layers, in fringes at the plate edge. Opposite signs in x and y make
 * the figures hyperbolic rather than concentric rings.
 */
const CURVE_X = 2.6;
const CURVE_Y = -1.9;
/** A standing shear as well, which tilts the figure off the plate's own axes. */
const CURVE_XY = 1.4;
/**
 * Where the plate rests before it is touched, and where the drift returns to.
 * Well clear of exact alignment, so a visitor who never moves — which is every
 * touch visitor, since there is no hover — is met by a real figure.
 */
const IDLE_U = 0.42;
const IDLE_V = -0.34;
/** Response curve. Above 1 it opens out the sensitive ground near the centre. */
const SHAPE = 1.5;
/** Half duty maximises the depth of the beat: the figure runs black to white. */
const DUTY = 0.5;
const AMPLITUDES = new Float32Array(harmonicAmplitudes(DUTY));
/** Harmonics summed, as an index into AMPLITUDES: 4 means up to the seventh. */
const TERMS = 4;

/** Differential phase creep at rest, cycles per second. Moves whole fringes. */
const PHASE_DRIFT = 0.04;
/**
 * Cursor speed, CSS px/s, that fully deflects the layers against each other,
 * and how far that deflection goes: fringes of shear and of extra bow, and
 * cycles of relative phase, all of which relax back through a spring.
 */
const VELOCITY_REFERENCE = 1900;
const SHEAR_GAIN = 2.4;
const BOW_GAIN = 1.8;
const KICK_GAIN = 0.5;

/** Seconds the cursor's last point is held before the drift takes over. */
const HOLD = 2.6;
const HANDBACK = 5.0;

/**
 * Ceiling on the drawing buffer, and the size of the very first frame.
 * Correctness does not depend on resolution — the band limit is measured from
 * screen-space derivatives, so a smaller buffer simply dissolves more of the
 * fine ruling into grey — which means the plate can open at a size any machine
 * can draw immediately and climb to full resolution once its speed is known.
 *
 * The floor is low, because it costs nothing: the ruling coarsens with the
 * sample rate, so a small buffer prints a chunkier plate rather than a greyer
 * one, and the interference figure is identical either way.
 */
const MAX_PIXELS = 5.4e6;
const FIRST_PIXELS = 0.8e6;
const MIN_PIXELS = 0.26e6;

/** Band limit and gain crossfade, in cycles per physical pixel. */
const WINDOW: [number, number] = [0.3, 0.47];
const BAND: [number, number] = [0.02, 0.09];
const square = (x: number) => x * x;

/**
 * The figure — the beat between the layers — is printed at full strength, the
 * rulings that cause it a little under, so the plate reads as interference
 * first and texture second. EXPOSURE is the summed amplitude that reaches pure
 * white through the shoulder.
 */
const FIGURE_GAIN = 2.0;
const RULING_GAIN = 0.8;
const EXPOSURE = 0.55;

const KEY_STEP = 0.014;
const KEY_STEP_COARSE = 0.09;

const clamp = (x: number, lo: number, hi: number) =>
  x < lo ? lo : x > hi ? hi : x;

const shape = (x: number) => Math.sign(x) * Math.pow(Math.abs(x), SHAPE);

function drift(t: number) {
  return {
    u: 0.5 * Math.sin(t * 0.0593 + 0.4) + 0.13 * Math.sin(t * 0.1471),
    v: 0.42 * Math.sin(t * 0.0413 + 1.9) + 0.15 * Math.sin(t * 0.1123 + 0.7),
  };
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

const UNIFORMS = [
  "uPlate",
  "uHalf",
  "uDpr",
  "uLayerA",
  "uLayerB",
  "uWarpA",
  "uWarpB",
  "uWindow",
  "uBand",
  "uGain",
  "uAmp",
  "uTerms",
] as const;

type UniformName = (typeof UNIFORMS)[number];

type Gpu = {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  loc: Record<UniformName, WebGLUniformLocation | null>;
};

function build(gl: WebGL2RenderingContext): Gpu {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("could not create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  const vao = gl.createVertexArray();
  if (!vao) throw new Error("could not create vertex array");

  const loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  for (const name of UNIFORMS) {
    loc[name] =
      gl.getUniformLocation(program, name) ??
      gl.getUniformLocation(program, `${name}[0]`);
  }
  return { program, vao, loc };
}

export function createPlate(
  canvas: HTMLCanvasElement,
  options: PlateOptions
): PlateHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  return gl ? mount(canvas, gl, options) : null;
}

function mount(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  options: PlateOptions
): PlateHandle | null {
  let gpu: Gpu | null = null;
  try {
    gpu = build(gl);
  } catch {
    return null;
  }

  let reducedMotion = options.reducedMotion;
  let touched = false;

  // Control point, spring-followed so the pointer feels immediate but never
  // jitters a pattern this sensitive.
  let u = IDLE_U;
  let v = IDLE_V;
  let uRate = 0;
  let vRate = 0;
  let heldU = u;
  let heldV = v;

  let flexX = 0;
  let flexY = 0;
  let flexXRate = 0;
  let flexYRate = 0;
  let kick = 0;
  let kickRate = 0;

  let velX = 0;
  let velY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerSeen = false;
  let pointerStamp = 0;

  let elapsed = 0;
  let idle = HOLD + HANDBACK;
  let drifting = !reducedMotion;
  let lastFrame = 0;
  let dirty = true;

  let cssW = 1;
  let cssH = 1;
  let bufW = 1;
  let bufH = 1;
  let dpr = 1;
  let scale = 0;
  let frameEma = 16;
  let sinceCheck = 0;
  let needsResize = true;

  let raf = 0;
  let running = false;
  let disposed = false;
  let contextLost = false;

  let announceAt = 0;
  let readoutAt = 0;

  /* ------------------------------------------------------------------ sizing */

  function measure() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    const full = cssW * cssH * dpr * dpr;
    if (scale === 0) scale = Math.min(1, Math.sqrt(FIRST_PIXELS / full));
    scale = clamp(scale, Math.min(1, Math.sqrt(MIN_PIXELS / full)), 1);

    const want = full * scale * scale;
    const fit = want > MAX_PIXELS ? Math.sqrt(MAX_PIXELS / want) : 1;
    const ratio = dpr * scale * fit;

    const w = Math.max(1, Math.round(cssW * ratio));
    const h = Math.max(1, Math.round(cssH * ratio));
    if (w !== bufW || h !== bufH) {
      bufW = w;
      bufH = h;
      canvas.width = w;
      canvas.height = h;
    }
    needsResize = false;
    dirty = true;
  }

  const resizeObserver = new ResizeObserver(() => {
    needsResize = true;
  });
  resizeObserver.observe(canvas);

  // devicePixelRatio has no event of its own; a media query pinned to the
  // current value fires when the page moves to another display or is zoomed.
  let dprQuery: MediaQueryList | null = null;
  const onDprChange = () => {
    needsResize = true;
    watchDpr();
  };
  function watchDpr() {
    dprQuery?.removeEventListener("change", onDprChange);
    dprQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`
    );
    dprQuery.addEventListener("change", onDprChange);
  }
  watchDpr();

  /* ------------------------------------------------------------------- input */

  function firstInput() {
    if (touched) return;
    touched = true;
    options.onFirstInput();
  }

  function setPoint(nu: number, nv: number) {
    heldU = clamp(nu, -1, 1);
    heldV = clamp(nv, -1, 1);
    idle = 0;
  }

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const nu = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const nv = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    const now = performance.now();
    if (pointerSeen) {
      const dt = Math.max(8, now - pointerStamp) / 1000;
      const inst = (event.clientX - pointerX) / dt;
      const instY = (event.clientY - pointerY) / dt;
      const k = 0.45;
      velX += (inst - velX) * k;
      velY += (instY - velY) * k;
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerStamp = now;
    pointerSeen = true;

    firstInput();
    setPoint(nu, nv);
    dirty = true;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== "mouse") {
      pointerSeen = false;
      velX = 0;
      velY = 0;
    }
    onPointerMove(event);
  }

  function onPointerEnd() {
    pointerSeen = false;
    velX = 0;
    velY = 0;
  }

  function announce() {
    const r = readout();
    const fringe = Number.isFinite(r.fringe)
      ? `${Math.round(r.fringe)} pixels`
      : "beyond the plate";
    options.onAnnounce(
      `Angle ${((r.dTheta * 180) / Math.PI).toFixed(3)} degrees, ` +
        `period difference ${(r.dPeriod * 100).toFixed(2)} per cent, ` +
        `fringe spacing ${fringe}.`
    );
  }

  function onKeyDown(event: KeyboardEvent) {
    const step = event.shiftKey ? KEY_STEP_COARSE : KEY_STEP;
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
        setPoint(heldU - step, heldV);
        break;
      case "ArrowRight":
        setPoint(heldU + step, heldV);
        break;
      case "ArrowUp":
        setPoint(heldU, heldV + step);
        break;
      case "ArrowDown":
        setPoint(heldU, heldV - step);
        break;
      case "0":
      case "Home":
        setPoint(0, 0);
        break;
      case " ":
      case "Enter":
        drifting = !drifting && !reducedMotion;
        options.onAnnounce(drifting ? "Drift resumed." : "Drift held.");
        announceAt = performance.now() + 1200;
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    firstInput();
    dirty = true;
    if (performance.now() > announceAt) {
      announceAt = performance.now() + 900;
      window.setTimeout(() => {
        if (!disposed) announce();
      }, 850);
    }
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    stop();
  }

  function onContextRestored() {
    try {
      gpu = build(gl);
      contextLost = false;
      needsResize = true;
      dirty = true;
      start();
    } catch {
      gpu = null;
    }
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });
  window.addEventListener("pointercancel", onPointerEnd, { passive: true });
  canvas.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  /* --------------------------------------------------------------- parameters */

  /**
   * The two rulings, derived from the control point and the plate's dimensions.
   *
   * The control point is read as a number of fringes to lay across the plate —
   * FRINGE_SPAN of them at full travel, on each axis — and the relative period
   * and relative angle that produce exactly that count follow from the plate's
   * width and height. A period difference of one part in a thousand is four
   * fringes on a wide desktop plate and one on a phone, so it is the count and
   * not the difference that has to be held steady.
   */
  function layers() {
    // Physical samples per CSS pixel, which is the device pixel ratio until the
    // adaptive scaler has had to give something up.
    const ratio = cssW > 0 ? bufW / cssW : 1;
    const period = Math.max(BASE_PERIOD, PERIOD_SAMPLES / ratio);

    const acrossW = shape(clamp(u, -1, 1)) * FRINGE_SPAN;
    const acrossH = shape(clamp(v, -1, 1)) * FRINGE_SPAN;
    const dPeriod = (acrossW * period) / cssW;
    const dTheta = (acrossH * period) / cssH;

    const inv = 1 / period;
    const invA = inv * (1 - dPeriod / 2);
    const invB = inv * (1 + dPeriod / 2);
    const thetaA = -dTheta / 2;
    const thetaB = dTheta / 2;

    // Fringe spacing is the reciprocal of the difference of the two wave
    // vectors — the quantity the readout reports, and the one that runs away to
    // infinity as the rulings come into exact agreement.
    const kx = invA * Math.cos(thetaA) - invB * Math.cos(thetaB);
    const ky = invA * Math.sin(thetaA) - invB * Math.sin(thetaB);
    const spacing = Math.hypot(kx, ky);
    const fringe = spacing > 1e-9 ? 1 / spacing : Infinity;
    // Past several plate diagonals the number stops meaning anything, and it
    // has to stop meaning anything at the same point on every screen, so the
    // threshold is a multiple of the plate rather than a count of pixels.
    const legible = 8 * Math.hypot(cssW, cssH);

    return {
      dPeriod,
      dTheta,
      invA,
      invB,
      thetaA,
      thetaB,
      fringe: fringe > legible ? Infinity : fringe,
    };
  }

  function readout(): Readout {
    const { dPeriod, dTheta, fringe } = layers();
    return { dPeriod, dTheta, fringe, drifting: drifting && idle > HOLD };
  }

  function integrate(dt: number) {
    elapsed += dt;
    idle += dt;

    let targetU = heldU;
    let targetV = heldV;
    if (drifting && !reducedMotion) {
      const w = clamp((idle - HOLD) / HANDBACK, 0, 1);
      const eased = w * w * (3 - 2 * w);
      const d = drift(elapsed);
      targetU = heldU + (d.u - heldU) * eased;
      targetV = heldV + (d.v - heldV) * eased;
    }

    if (reducedMotion) {
      u = targetU;
      v = targetV;
      uRate = 0;
      vRate = 0;
      flexX = 0;
      flexY = 0;
      kick = 0;
      velX = 0;
      velY = 0;
      return;
    }

    // Decay the measured pointer velocity whether or not events arrive, so the
    // deflection relaxes the moment the hand stops.
    const decay = Math.exp(-dt * 6.5);
    velX *= decay;
    velY *= decay;

    const flexTargetX = clamp(velX / VELOCITY_REFERENCE, -1, 1);
    const flexTargetY = clamp(-velY / VELOCITY_REFERENCE, -1, 1);
    const kickTarget = clamp(
      Math.hypot(velX, velY) / VELOCITY_REFERENCE,
      0,
      1
    );

    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      // Control point: critically damped, ~150 ms to settle.
      let a = 26 * 26 * (targetU - u) - 2 * 26 * uRate;
      uRate += a * h;
      u += uRate * h;
      a = 26 * 26 * (targetV - v) - 2 * 26 * vRate;
      vRate += a * h;
      v += vRate * h;

      // Deflection: under-damped, so a flick overshoots and settles back.
      a = 9 * 9 * (flexTargetX - flexX) - 2 * 0.5 * 9 * flexXRate;
      flexXRate += a * h;
      flexX += flexXRate * h;
      a = 9 * 9 * (flexTargetY - flexY) - 2 * 0.5 * 9 * flexYRate;
      flexYRate += a * h;
      flexY += flexYRate * h;
      a = 11 * 11 * (kickTarget - kick) - 2 * 0.7 * 11 * kickRate;
      kickRate += a * h;
      kick += kickRate * h;
    }
  }

  function draw() {
    if (!gpu) return;
    const { program, vao, loc } = gpu;

    const { invA, invB, thetaA, thetaB } = layers();
    const phase = reducedMotion ? 0 : elapsed * PHASE_DRIFT;
    const kickPhase = kick * KICK_GAIN;

    // Half of each difference goes to each layer, in opposite senses, so the
    // mean orientation and the mean period of the plate never move.
    const bendX = CURVE_X / 2;
    const bendY = (CURVE_Y + flexY * BOW_GAIN) / 2;
    const shear = (CURVE_XY + flexX * SHEAR_GAIN) / 2;

    gl.viewport(0, 0, bufW, bufH);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(loc.uPlate, cssW, cssH);
    gl.uniform2f(loc.uHalf, cssW / 2, cssH / 2);
    gl.uniform1f(loc.uDpr, bufW / cssW);
    gl.uniform4f(
      loc.uLayerA,
      Math.cos(thetaA),
      Math.sin(thetaA),
      invA,
      phase + kickPhase
    );
    gl.uniform4f(
      loc.uLayerB,
      Math.cos(thetaB),
      Math.sin(thetaB),
      invB,
      -phase - kickPhase
    );
    gl.uniform4f(loc.uWarpA, bendX, bendY, shear, 0);
    gl.uniform4f(loc.uWarpB, -bendX, -bendY, -shear, 0);
    gl.uniform2f(loc.uWindow, square(WINDOW[0]), square(WINDOW[1]));
    gl.uniform2f(loc.uBand, square(BAND[0]), square(BAND[1]));
    gl.uniform3f(loc.uGain, FIGURE_GAIN, RULING_GAIN, 1 / EXPOSURE);
    gl.uniform1fv(loc.uAmp, AMPLITUDES);
    gl.uniform1i(loc.uTerms, TERMS);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    dirty = false;
  }

  function adapt(frameMs: number, dt: number) {
    frameEma += (frameMs - frameEma) * 0.3;
    sinceCheck += dt;
    if (sinceCheck < 0.3) return;
    sinceCheck = 0;
    // Reduced motion draws only on demand, so frame timing says nothing about
    // the cost of a draw; the plate simply climbs to full resolution.
    const cheap = reducedMotion || frameEma < 13;
    if (!reducedMotion && frameEma > 26 && scale > 0.05) {
      scale *= 0.72;
      needsResize = true;
      frameEma = 16;
    } else if (cheap && scale < 1) {
      scale = Math.min(1, scale * 1.55);
      needsResize = true;
      frameEma = 16;
    }
  }

  function frame(now: number) {
    if (disposed || contextLost) return;
    raf = requestAnimationFrame(frame);

    const frameMs = lastFrame ? now - lastFrame : 16;
    const dt = clamp(frameMs / 1000, 0, 0.05);
    lastFrame = now;

    if (needsResize) measure();
    integrate(dt);
    adapt(frameMs, dt);

    if (!reducedMotion || dirty) draw();

    if (now - readoutAt > 90) {
      readoutAt = now;
      options.onReadout(readout());
    }
  }

  function start() {
    if (running || disposed || contextLost) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  if (!document.hidden) start();
  else measure();

  return {
    dispose() {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      dprQuery?.removeEventListener("change", onDprChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      if (gpu) {
        gl.deleteProgram(gpu.program);
        gl.deleteVertexArray(gpu.vao);
        gpu = null;
      }
      // Deliberately not calling WEBGL_lose_context: the canvas may be mounted
      // again (React does exactly that in development) and a context lost on
      // purpose never comes back.
    },
    setReducedMotion(reduced: boolean) {
      reducedMotion = reduced;
      if (reduced) drifting = false;
      dirty = true;
    },
  };
}
