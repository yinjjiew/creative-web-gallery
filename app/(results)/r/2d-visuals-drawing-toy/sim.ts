import { makeSheet } from "./paper";
import { DEPOSIT, RENDER, STEP, VERTEX } from "./shader";

/**
 * GPU wet media. React is not in this file. The loop writes fields, the
 * pointer is an input to those fields, and the mark is whatever the water
 * and the fibre do with that input after the hand has gone.
 */

export type SimHandle = {
  dispose: () => void;
  setReducedMotion: (reduced: boolean) => void;
  newSheet: () => void;
  drop: (loaded: boolean) => void;
};

export type SimOptions = {
  reducedMotion: boolean;
  onAnnounce: (text: string) => void;
};

const MAX_VIEW = 1.15e6;
const MAX_SIM = 5.2e5;
const MIN_SIDE = 2;

const SPEED_DRY = 920;
const SPEED_WET = 55;

const clamp = (x: number, lo: number, hi: number) =>
  x < lo ? lo : x > hi ? hi : x;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function makeTexture(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internal: number,
  format: number,
  type: number,
  data: ArrayBufferView | null,
  filter: number,
) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
  return tex;
}

function makeTarget(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internal: number,
  type: number,
  filter: number,
) {
  const tex = makeTexture(gl, w, h, internal, gl.RGBA, type, null, filter);
  if (!tex) return null;
  const fbo = gl.createFramebuffer();
  if (!fbo) {
    gl.deleteTexture(tex);
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0,
  );
  const ok =
    gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!ok) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    return null;
  }
  return { tex, fbo };
}

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

function chooseFormat(gl: WebGL2RenderingContext) {
  gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("EXT_color_buffer_half_float");
  gl.getExtension("OES_texture_float_linear");
  gl.getExtension("OES_texture_half_float_linear");

  const tries: { internal: number; type: number; pack: number }[] = [
    { internal: gl.RGBA16F, type: gl.HALF_FLOAT, pack: 1 },
    { internal: gl.RGBA32F, type: gl.FLOAT, pack: 1 },
    { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE, pack: 2 },
  ];

  for (const fmt of tries) {
    const probe = makeTarget(gl, 4, 4, fmt.internal, fmt.type, gl.NEAREST);
    if (probe) {
      gl.deleteFramebuffer(probe.fbo);
      gl.deleteTexture(probe.tex);
      return fmt;
    }
  }
  return null;
}

function fit(cssW: number, cssH: number, budget: number) {
  let w = Math.max(MIN_SIDE, Math.round(cssW));
  let h = Math.max(MIN_SIDE, Math.round(cssH));
  const pixels = w * h;
  if (pixels > budget) {
    const s = Math.sqrt(budget / pixels);
    w = Math.max(MIN_SIDE, Math.round(w * s));
    h = Math.max(MIN_SIDE, Math.round(h * s));
  }
  return { w, h };
}

function loc(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
  return gl.getUniformLocation(program, name);
}

export function createSim(
  canvas: HTMLCanvasElement,
  options: SimOptions,
): SimHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const depositProg = link(gl, VERTEX, DEPOSIT);
  const stepProg = link(gl, VERTEX, STEP);
  const renderProg = link(gl, VERTEX, RENDER);
  if (!depositProg || !stepProg || !renderProg) return null;

  const format = chooseFormat(gl);
  if (!format) return null;

  const vao = gl.createVertexArray();
  if (!vao) return null;
  gl.bindVertexArray(vao);

  const depositU = {
    uField: loc(gl, depositProg, "uField"),
    uPaper: loc(gl, depositProg, "uPaper"),
    uSize: loc(gl, depositProg, "uSize"),
    uA: loc(gl, depositProg, "uA"),
    uB: loc(gl, depositProg, "uB"),
    uRadius: loc(gl, depositProg, "uRadius"),
    uWater: loc(gl, depositProg, "uWater"),
    uPigment: loc(gl, depositProg, "uPigment"),
    uDry: loc(gl, depositProg, "uDry"),
    uPack: loc(gl, depositProg, "uPack"),
  };

  const stepU = {
    uField: loc(gl, stepProg, "uField"),
    uPaper: loc(gl, stepProg, "uPaper"),
    uInv: loc(gl, stepProg, "uInv"),
    uSize: loc(gl, stepProg, "uSize"),
    uDt: loc(gl, stepProg, "uDt"),
    uDiffW: loc(gl, stepProg, "uDiffW"),
    uDiffP: loc(gl, stepProg, "uDiffP"),
    uEvap: loc(gl, stepProg, "uEvap"),
    uAbsorb: loc(gl, stepProg, "uAbsorb"),
    uCapillary: loc(gl, stepProg, "uCapillary"),
    uPack: loc(gl, stepProg, "uPack"),
  };

  const renderU = {
    uField: loc(gl, renderProg, "uField"),
    uAlbedo: loc(gl, renderProg, "uAlbedo"),
    uInv: loc(gl, renderProg, "uInv"),
    uSize: loc(gl, renderProg, "uSize"),
    uPack: loc(gl, renderProg, "uPack"),
  };

  let reduced = options.reducedMotion;
  let seed = (Math.random() * 1e9) | 0;
  let viewW = 0;
  let viewH = 0;
  let simW = 0;
  let simH = 0;
  let read: Target | null = null;
  let write: Target | null = null;
  let paperTex: WebGLTexture | null = null;
  let albedoTex: WebGLTexture | null = null;

  let drawing = false;
  let moved = false;
  let lastUv = { x: 0.5, y: 0.5 };
  let brushUv = { x: 0.5, y: 0.5 };
  let lastT = 0;
  let lastMoveT = 0;
  let lastSpeed = 0;
  let raf = 0;
  let disposed = false;

  const pointers = new Map<
    number,
    { x: number; y: number; t: number; speed: number }
  >();

  function destroyTargets() {
    if (read) {
      gl.deleteFramebuffer(read.fbo);
      gl.deleteTexture(read.tex);
      read = null;
    }
    if (write) {
      gl.deleteFramebuffer(write.fbo);
      gl.deleteTexture(write.tex);
      write = null;
    }
    if (paperTex) {
      gl.deleteTexture(paperTex);
      paperTex = null;
    }
    if (albedoTex) {
      gl.deleteTexture(albedoTex);
      albedoTex = null;
    }
  }

  function seedField() {
    if (!read || !write) return;
    const sheet = makeSheet(simW, simH, seed);
    if (paperTex) gl.deleteTexture(paperTex);
    if (albedoTex) gl.deleteTexture(albedoTex);
    paperTex = makeTexture(
      gl,
      simW,
      simH,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sheet.props,
      gl.LINEAR,
    );
    albedoTex = makeTexture(
      gl,
      simW,
      simH,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sheet.albedo,
      gl.LINEAR,
    );
    if (!paperTex || !albedoTex) return;

    const damp = 0.034 / format!.pack;
    for (const target of [read, write]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, simW, simH);
      gl.clearColor(damp, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const view = fit(cssW * dpr, cssH * dpr, MAX_VIEW);
    const sim = fit(view.w, view.h, MAX_SIM);
    if (
      view.w === viewW &&
      view.h === viewH &&
      sim.w === simW &&
      sim.h === simH &&
      read &&
      write
    ) {
      return;
    }

    viewW = view.w;
    viewH = view.h;
    simW = sim.w;
    simH = sim.h;
    canvas.width = viewW;
    canvas.height = viewH;

    destroyTargets();
    const filter = format!.type === gl.UNSIGNED_BYTE ? gl.LINEAR : gl.NEAREST;
    read = makeTarget(gl, simW, simH, format!.internal, format!.type, filter);
    write = makeTarget(gl, simW, simH, format!.internal, format!.type, filter);
    if (!read || !write) return;
    seedField();
  }

  function swap() {
    const tmp = read;
    read = write;
    write = tmp;
  }

  function drawQuad() {
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function deposit(
    a: { x: number; y: number },
    b: { x: number; y: number },
    water: number,
    pigment: number,
    dry: number,
    radius: number,
  ) {
    if (!read || !write || !paperTex) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(depositProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, paperTex);
    gl.uniform1i(depositU.uField, 0);
    gl.uniform1i(depositU.uPaper, 1);
    gl.uniform2f(depositU.uSize, simW, simH);
    gl.uniform2f(depositU.uA, a.x, a.y);
    gl.uniform2f(depositU.uB, b.x, b.y);
    gl.uniform1f(depositU.uRadius, radius);
    gl.uniform1f(depositU.uWater, water);
    gl.uniform1f(depositU.uPigment, pigment);
    gl.uniform1f(depositU.uDry, dry);
    gl.uniform1f(depositU.uPack, format!.pack);
    drawQuad();
    swap();
  }

  function stepOnce(dt: number) {
    if (!read || !write || !paperTex) return;
    const quiet = reduced;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(stepProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, paperTex);
    gl.uniform1i(stepU.uField, 0);
    gl.uniform1i(stepU.uPaper, 1);
    gl.uniform2f(stepU.uInv, 1 / simW, 1 / simH);
    gl.uniform2f(stepU.uSize, simW, simH);
    gl.uniform1f(stepU.uDt, dt);
    gl.uniform1f(stepU.uDiffW, quiet ? 0.014 : 0.052);
    gl.uniform1f(stepU.uDiffP, quiet ? 0.003 : 0.013);
    gl.uniform1f(stepU.uEvap, quiet ? 0.007 : 0.002);
    gl.uniform1f(stepU.uAbsorb, quiet ? 0.09 : 0.016);
    gl.uniform1f(stepU.uCapillary, quiet ? 0.022 : 0.1);
    gl.uniform1f(stepU.uPack, format!.pack);
    drawQuad();
    swap();
  }

  function render() {
    if (!read || !paperTex || !albedoTex) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, viewW, viewH);
    gl.useProgram(renderProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, albedoTex);
    gl.uniform1i(renderU.uField, 0);
    gl.uniform1i(renderU.uAlbedo, 1);
    gl.uniform2f(renderU.uInv, 1 / simW, 1 / simH);
    gl.uniform2f(renderU.uSize, simW, simH);
    gl.uniform1f(renderU.uPack, format!.pack);
    drawQuad();
  }

  function loadFromSpeed(speed: number, dwell: number, pressure: number) {
    const dry = clamp((speed - SPEED_WET) / (SPEED_DRY - SPEED_WET), 0, 1);
    // A still brush keeps feeding the sheet. Dwell is the other half of load.
    const sit = clamp(dwell * 2.4, 0, 1.6);
    const water = (mix(1.35, 0.055, dry) + sit * 0.7) * pressure;
    const pigment = (mix(1.05, 0.32, dry) + sit * 0.22) * pressure;
    const radius = mix(20, 3.8, dry) + sit * 4;
    return { water, pigment, dry, radius };
  }

  function mix(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function toUv(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
      y: clamp(1 - (clientY - rect.top) / Math.max(rect.height, 1), 0, 1),
    };
  }

  function stroke(
    from: { x: number; y: number },
    to: { x: number; y: number },
    speed: number,
    dwell: number,
    pressure: number,
  ) {
    const load = loadFromSpeed(speed, dwell, pressure);
    const scale = Math.sqrt((simW * simH) / (1280 * 720));
    deposit(from, to, load.water, load.pigment, load.dry, load.radius * scale);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    canvas.setPointerCapture(e.pointerId);
    const uv = toUv(e.clientX, e.clientY);
    const now = performance.now();
    drawing = true;
    moved = false;
    lastUv = uv;
    brushUv = uv;
    lastT = now;
    lastMoveT = now;
    lastSpeed = 0;
    pointers.set(e.pointerId, { x: uv.x, y: uv.y, t: now, speed: 0 });
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    const uv = toUv(e.clientX, e.clientY);
    brushUv = uv;
    const now = performance.now();
    const prev = pointers.get(e.pointerId);
    if (!drawing && e.buttons === 0) {
      lastUv = uv;
      return;
    }
    if (!drawing && e.buttons !== 0) {
      onPointerDown(e);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const dt = Math.max((now - (prev?.t ?? lastT)) / 1000, 1e-4);
    const dx = (uv.x - (prev?.x ?? lastUv.x)) * rect.width;
    const dy = (uv.y - (prev?.y ?? lastUv.y)) * rect.height;
    const speed = Math.hypot(dx, dy) / dt;
    lastSpeed = speed;
    lastMoveT = now;
    if (Math.hypot(dx, dy) > 1.2) moved = true;
    const pressure =
      e.pointerType === "mouse" ? 1 : clamp(e.pressure || 0.6, 0.25, 1);
    stroke(prev ? { x: prev.x, y: prev.y } : lastUv, uv, speed, 0, pressure);
    pointers.set(e.pointerId, { x: uv.x, y: uv.y, t: now, speed });
    lastUv = uv;
    lastT = now;
    e.preventDefault();
  }

  function onPointerUp(e: PointerEvent) {
    const held = (performance.now() - lastT) / 1000;
    if (drawing && !moved) {
      stroke(lastUv, lastUv, 0, clamp(held, 0.12, 1.4), 1);
    }
    pointers.delete(e.pointerId);
    if (pointers.size === 0) drawing = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.08 : 0.018;
    if (e.key === "ArrowLeft") {
      brushUv = { x: clamp(brushUv.x - step, 0, 1), y: brushUv.y };
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      brushUv = { x: clamp(brushUv.x + step, 0, 1), y: brushUv.y };
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      brushUv = { x: brushUv.x, y: clamp(brushUv.y - step, 0, 1) };
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      brushUv = { x: brushUv.x, y: clamp(brushUv.y + step, 0, 1) };
      e.preventDefault();
    } else if (e.key === " " || e.key === "Enter") {
      const loaded = !e.shiftKey;
      dropAt(brushUv, loaded);
      e.preventDefault();
    } else if (e.key === "n" || e.key === "N" || e.key === "Backspace") {
      newSheet();
      e.preventDefault();
    }
  }

  function dropAt(uv: { x: number; y: number }, loaded: boolean) {
    const dry = loaded ? 0.05 : 0.88;
    const water = loaded ? 1.35 : 0.1;
    const pigment = loaded ? 1.05 : 0.32;
    const radius = loaded ? 22 : 5;
    const scale = Math.sqrt((simW * simH) / (1280 * 720));
    if (loaded) {
      deposit(uv, uv, water, pigment, dry, radius * scale);
    } else {
      const tip = {
        x: clamp(uv.x + 0.034, 0, 1),
        y: clamp(uv.y + 0.012, 0, 1),
      };
      deposit(uv, tip, water, pigment, dry, radius * scale);
    }
    options.onAnnounce(
      loaded
        ? "A loaded drop. It will keep moving."
        : "A dry flick. The soot sits on the tooth.",
    );
  }

  function newSheet() {
    seed = (Math.random() * 1e9) | 0;
    if (read && write) seedField();
    options.onAnnounce("A new sheet.");
  }

  function frame(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    resize();
    if (!read || !write) return;

    if (drawing) {
      const sit = (now - lastMoveT) / 1000;
      if (sit > 0.032 && lastSpeed < 40) {
        const pressure = 1;
        stroke(lastUv, lastUv, 0, sit, pressure);
      }
    }

    const steps = reduced ? 1 : 2;
    const stepDt = reduced ? 0.7 : 1;
    for (let i = 0; i < steps; i++) stepOnce(stepDt);
    render();
  }

  resize();
  render();
  raf = requestAnimationFrame(frame);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("keydown", onKeyDown);
      destroyTargets();
      gl.deleteProgram(depositProg);
      gl.deleteProgram(stepProg);
      gl.deleteProgram(renderProg);
      gl.deleteVertexArray(vao);
    },
    setReducedMotion(next) {
      reduced = next;
    },
    newSheet,
    drop(loaded) {
      dropAt(brushUv, loaded);
    },
  };
}
