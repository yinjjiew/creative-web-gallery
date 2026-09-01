import { LINES, STANZAS } from "./poem";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

/**
 * Bake a cotton sheet, light it, and take input.
 *
 * The impression is a height field: letters go down, the rag rises in a
 * cockle around them, and the tooth, laid lines and a slow cockle of the
 * whole sheet are the rest of the surface. Lighting is the only live part.
 * Moving the lamp changes which faces of each letter catch and which stay
 * in the valley — the glyphs themselves, not their position.
 *
 * The honest limit: the cockle is a blur of the letter mask, not cotton
 * yielding around a steel face. The light is physical; the dent is painted.
 */

export type PlateOptions = {
  fontFamily: string;
  reducedMotion: boolean;
  lifted: boolean;
  onAnnounce: (text: string) => void;
  onToggleLift: () => void;
};

export type PlateHandle = {
  dispose: () => void;
  setReducedMotion: (reduced: boolean) => void;
  setLifted: (lifted: boolean) => void;
};

const MAX_PIXELS = 1.7e6;
const KEY_STEP = 0.028;
const KEY_STEP_COARSE = 0.09;
const LAMP_Z = 0.155;
const IDLE_U = 0.47;
const IDLE_V = 0.7;

const clamp = (x: number, lo: number, hi: number) =>
  x < lo ? lo : x > hi ? hi : x;

const clampInt = (x: number, lo: number, hi: number) => {
  const i = x | 0;
  return i < lo ? lo : i > hi ? hi : i;
};

function hash(ix: number, iy: number, seed: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed * 1442695041;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

function idleLamp(w: number, h: number) {
  const p = paperRect(w, h);
  return {
    u: (p.x + p.w * 0.5) / w,
    v: 1 - (p.y + p.h * 0.34) / h,
  };
}

function paperRect(w: number, h: number) {
  const top = Math.max(52, h * 0.072);
  const bot = Math.max(56, h * 0.078);
  const side = Math.max(22, w * 0.05);
  let pw = w - side * 2;
  let ph = h - top - bot;
  if (w > 640) {
    const aspect = 0.73;
    if (pw / ph > aspect) pw = ph * aspect;
  }
  return { x: (w - pw) / 2, y: top + (h - top - bot - ph) / 2, w: pw, h: ph };
}

function blur(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
): Float32Array {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Float32Array(src.length);
  const dst = new Float32Array(src.length);
  const extent = r * 2 + 1;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[row + clampInt(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / extent;
      acc += src[row + clampInt(x + r + 1, 0, w - 1)];
      acc -= src[row + clampInt(x - r, 0, w - 1)];
    }
  }

  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[clampInt(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc / extent;
      acc += tmp[clampInt(y + r + 1, 0, h - 1) * w + x];
      acc -= tmp[clampInt(y - r, 0, h - 1) * w + x];
    }
  }
  return dst;
}

function fitType(
  ctx: CanvasRenderingContext2D,
  family: string,
  maxW: number,
  maxH: number,
) {
  let lo = 11;
  let hi = 72;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    ctx.font = `400 ${mid}px ${family}, Georgia, serif`;
    const widest = LINES.reduce(
      (m, line) => Math.max(m, ctx.measureText(line).width),
      0,
    );
    const block = mid * (STANZAS.length - 1) * 0.7 + mid * LINES.length * 1.38;
    if (widest <= maxW && block <= maxH) lo = mid;
    else hi = mid;
  }
  return lo;
}

function drawLetters(
  w: number,
  h: number,
  paper: { x: number; y: number; w: number; h: number },
  family: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Float32Array(w * h);

  const innerW = paper.w * 0.72;
  const innerH = paper.h * 0.58;
  const size = fitType(ctx, family, innerW, innerH);
  ctx.font = `400 ${size}px ${family}, Georgia, serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const gap = size * 1.38;
  const stanzaGap = size * 0.72;
  let block = 0;
  for (let s = 0; s < STANZAS.length; s++) {
    block += STANZAS[s].length * gap;
    if (s < STANZAS.length - 1) block += stanzaGap;
  }
  let y = paper.y + paper.h * 0.5 - block * 0.5 + gap * 0.5;
  const cx = paper.x + paper.w * 0.5;

  for (let s = 0; s < STANZAS.length; s++) {
    for (const line of STANZAS[s]) {
      ctx.fillText(line, cx, y);
      y += gap;
    }
    y += stanzaGap;
  }

  const raw = ctx.getImageData(0, 0, w, h).data;
  const mask = new Float32Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = raw[i * 4] / 255;
  return mask;
}

function bake(
  tw: number,
  th: number,
  family: string,
): { sheet: Uint8Array; form: Uint8Array } {
  const paper = paperRect(tw, th);
  const letters = drawLetters(tw, th, paper, family);
  const minDim = Math.min(paper.w, paper.h);
  const dent = blur(letters, tw, th, Math.max(1.1, minDim * 0.0026));
  const dentSoft = blur(dent, tw, th, Math.max(1.2, minDim * 0.0034));
  const cockle = blur(letters, tw, th, Math.max(7, minDim * 0.024));

  const sheet = new Uint8Array(tw * th * 4);
  const form = new Uint8Array(tw * th * 4);

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const i = y * tw + x;
      const u = (x - paper.x) / paper.w;
      const v = (y - paper.y) / paper.h;
      const edge = Math.min(u, 1 - u, v, 1 - v);
      const tear =
        fbm(u * 16, v * 20, 3, 4) * 0.55 + fbm(u * 52, v * 44, 9, 3) * 0.45;
      const inside = edge - 0.011 - (tear - 0.5) * 0.028;
      const paperMask = clamp(inside / 0.012, 0, 1);

      const n1 = fbm(u * 38, v * 36, 1, 4);
      const n2 = fbm(u * 110, v * 14, 5, 3);
      const n3 = fbm(u * 9, v * 8, 12, 3);
      const laid = Math.sin(v * paper.h * 0.42 + n2 * 1.8);
      const chain = Math.sin(u * paper.w * 0.085 + n1 * 0.8);

      let height = 0.5;
      height += (n3 - 0.5) * 0.1;
      height += laid * 0.014;
      height += chain * 0.008;
      height += (n1 - 0.5) * 0.055;
      height += (n2 - 0.5) * 0.03;
      height += cockle[i] * 0.3;
      height -= dentSoft[i] * 0.92;
      height = clamp(height, 0.02, 0.98);

      const fiber = 0.92 + n1 * 0.1 + n2 * 0.04;
      let r = (0.875 + n3 * 0.04) * fiber;
      let g = (0.82 + n1 * 0.03) * fiber;
      let b = (0.725 + n2 * 0.025) * fiber;

      const fleck = hash(x, y, 77);
      if (fleck > 0.993) {
        r *= 0.62;
        g *= 0.55;
        b *= 0.42;
      } else if (fleck > 0.988) {
        r *= 0.84;
        g *= 0.8;
        b *= 0.72;
      }

      const o = i * 4;
      sheet[o] = clamp(r * 255, 0, 255);
      sheet[o + 1] = clamp(g * 255, 0, 255);
      sheet[o + 2] = clamp(b * 255, 0, 255);
      sheet[o + 3] = height * 255;
      form[o] = clamp(dentSoft[i] * 255, 0, 255);
      form[o + 1] = paperMask * 255;
      form[o + 2] = 0;
      form[o + 3] = 255;
    }
  }

  return { sheet, form };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
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

function bindTexture(
  gl: WebGL2RenderingContext,
  unit: number,
  data: Uint8Array,
  w: number,
  h: number,
) {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    data,
  );
  return texture;
}

function bufferSize(cssW: number, cssH: number, dpr: number) {
  let w = Math.max(2, Math.round(cssW * dpr));
  let h = Math.max(2, Math.round(cssH * dpr));
  const pixels = w * h;
  if (pixels > MAX_PIXELS) {
    const s = Math.sqrt(MAX_PIXELS / pixels);
    w = Math.max(2, Math.round(w * s));
    h = Math.max(2, Math.round(h * s));
  }
  return { w, h };
}

export async function createPlate(
  canvas: HTMLCanvasElement,
  options: PlateOptions,
): Promise<PlateHandle | null> {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const program = link(gl);
  if (!program) return null;

  const loc = {
    uSheet: gl.getUniformLocation(program, "uSheet"),
    uForm: gl.getUniformLocation(program, "uForm"),
    uSize: gl.getUniformLocation(program, "uSize"),
    uInvTexel: gl.getUniformLocation(program, "uInvTexel"),
    uLight: gl.getUniformLocation(program, "uLight"),
    uPaper: gl.getUniformLocation(program, "uPaper"),
    uLift: gl.getUniformLocation(program, "uLift"),
    uInk: gl.getUniformLocation(program, "uInk"),
    uBump: gl.getUniformLocation(program, "uBump"),
    uAmbient: gl.getUniformLocation(program, "uAmbient"),
    uBench: gl.getUniformLocation(program, "uBench"),
  };

  try {
    await document.fonts.load(`400 64px ${options.fontFamily}`);
    await document.fonts.load(`italic 400 64px ${options.fontFamily}`);
    await document.fonts.ready;
  } catch {
    /* Georgia is named in the canvas font stack. */
  }

  let reducedMotion = options.reducedMotion;
  let lifted = options.lifted || reducedMotion;
  let disposed = false;
  let contextLost = false;
  let raf = 0;
  let dirty = true;
  let needsBake = true;
  let cssW = 0;
  let cssH = 0;
  let texW = 0;
  let texH = 0;
  let sheetTex: WebGLTexture | null = null;
  let formTex: WebGLTexture | null = null;

  let lightU = IDLE_U;
  let lightV = IDLE_V;
  let heldU = IDLE_U;
  let heldV = IDLE_V;
  let pointing = false;
  let parked = false;
  let announceAt = 0;

  function pointerToUv(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    heldU = clamp((event.clientX - rect.left) / rect.width, 0.02, 0.98);
    heldV = clamp(1 - (event.clientY - rect.top) / rect.height, 0.02, 0.98);
    pointing = true;
    dirty = true;
    start();
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === "mouse" || pointing) pointerToUv(event);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    canvas.setPointerCapture?.(event.pointerId);
    pointerToUv(event);
  }

  function onPointerEnd() {
    pointing = false;
  }

  function onKeyDown(event: KeyboardEvent) {
    const step = event.shiftKey ? KEY_STEP_COARSE : KEY_STEP;
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
        heldU = clamp(heldU - step, 0.04, 0.96);
        break;
      case "ArrowRight":
        heldU = clamp(heldU + step, 0.04, 0.96);
        break;
      case "ArrowUp":
        heldV = clamp(heldV + step, 0.04, 0.96);
        break;
      case "ArrowDown":
        heldV = clamp(heldV - step, 0.04, 0.96);
        break;
      case "Home":
      case "0": {
        const idle = idleLamp(cssW || 1, cssH || 1);
        heldU = idle.u;
        heldV = idle.v;
        break;
      }
      case " ":
      case "Enter":
        options.onToggleLift();
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    dirty = true;
    start();
    if (event.key !== " " && event.key !== "Enter" && performance.now() > announceAt) {
      announceAt = performance.now() + 900;
      window.setTimeout(() => {
        if (!disposed) {
          options.onAnnounce(
            "The lamp has moved. Letter edges facing it catch; the valleys stay dark.",
          );
        }
      }, 800);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(1, rect.width);
    const nextH = Math.max(1, rect.height);
    if (nextW === cssW && nextH === cssH && canvas.width > 0) return;
    cssW = nextW;
    cssH = nextH;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const buf = bufferSize(cssW, cssH, dpr);
    if (canvas.width !== buf.w || canvas.height !== buf.h) {
      canvas.width = buf.w;
      canvas.height = buf.h;
    }
    gl.viewport(0, 0, buf.w, buf.h);
    if (!parked) {
      const idle = idleLamp(cssW, cssH);
      heldU = idle.u;
      heldV = idle.v;
      lightU = idle.u;
      lightV = idle.v;
      parked = true;
    }
    const tex = bufferSize(cssW, cssH, Math.min(1.6, dpr));
    if (tex.w !== texW || tex.h !== texH) {
      texW = tex.w;
      texH = tex.h;
      needsBake = true;
    }
    dirty = true;
  }

  function rebuildSheet() {
    const { sheet, form } = bake(texW, texH, options.fontFamily);
    if (sheetTex) gl.deleteTexture(sheetTex);
    if (formTex) gl.deleteTexture(formTex);
    sheetTex = bindTexture(gl, 0, sheet, texW, texH);
    formTex = bindTexture(gl, 1, form, texW, texH);
    needsBake = false;
  }

  function draw() {
    if (!sheetTex || !formTex) return;
    const lift = lifted ? 1 : 0;
    if (!reducedMotion) {
      lightU += (heldU - lightU) * 0.28;
      lightV += (heldV - lightV) * 0.28;
    } else {
      lightU = heldU;
      lightV = heldV;
    }

    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sheetTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, formTex);
    gl.uniform1i(loc.uSheet, 0);
    gl.uniform1i(loc.uForm, 1);
    gl.uniform2f(loc.uSize, cssW, cssH);
    gl.uniform2f(loc.uInvTexel, 1 / texW, 1 / texH);
    const paper = paperRect(cssW, cssH);
    gl.uniform3f(loc.uLight, lightU, lightV, LAMP_Z);
    gl.uniform4f(
      loc.uPaper,
      paper.x / cssW,
      1 - (paper.y + paper.h) / cssH,
      paper.w / cssW,
      paper.h / cssH,
    );
    gl.uniform1f(loc.uLift, lift);
    gl.uniform1f(loc.uInk, lift > 0.5 ? 0.86 : 0.045);
    gl.uniform1f(loc.uBump, 12.5);
    gl.uniform1f(loc.uAmbient, 0.028);
    gl.uniform3f(loc.uBench, 0.07, 0.062, 0.055);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const still =
      Math.abs(heldU - lightU) < 0.0008 && Math.abs(heldV - lightV) < 0.0008;
    dirty = !still;
  }

  function frame() {
    raf = 0;
    if (disposed || contextLost) return;
    resize();
    if (needsBake && texW > 0 && texH > 0) rebuildSheet();
    if (dirty) draw();
    if (!disposed && dirty) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || disposed || contextLost) return;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      dirty = true;
      start();
    }
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    stop();
  }

  function onContextRestored() {
    contextLost = false;
    needsBake = true;
    dirty = true;
    if (sheetTex) gl.deleteTexture(sheetTex);
    if (formTex) gl.deleteTexture(formTex);
    sheetTex = null;
    formTex = null;
    start();
  }

  const observer = new ResizeObserver(() => {
    dirty = true;
    start();
  });
  observer.observe(canvas);

  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
  canvas.addEventListener("pointerup", onPointerEnd, { passive: true });
  canvas.addEventListener("pointercancel", onPointerEnd, { passive: true });
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  document.addEventListener("visibilitychange", onVisibility);

  start();

  return {
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      if (sheetTex) gl.deleteTexture(sheetTex);
      if (formTex) gl.deleteTexture(formTex);
      gl.deleteProgram(program);
    },
    setReducedMotion(next) {
      reducedMotion = next;
      if (next) {
        lifted = true;
        lightU = heldU;
        lightV = heldV;
      }
      dirty = true;
      start();
    },
    setLifted(next) {
      lifted = next;
      dirty = true;
      start();
    },
  };
}
