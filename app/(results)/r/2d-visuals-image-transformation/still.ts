/**
 * The no-upload default: a still life painted on the machine, not a photograph.
 * Large tonal masses so a coarse sett still reads; hard edges so zoom has
 * something to resolve into threads.
 */

function hash(ix: number, iy: number): number {
  let n = ix * 374761393 + iy * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function vnoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0);
  const b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1);
  const d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number): number {
  return vnoise(x, y) * 0.55 + vnoise(x * 2.2, y * 2.2) * 0.3 + vnoise(x * 4.4, y * 4.4) * 0.15;
}

function clamp(v: number, a = 0, b = 1): number {
  return v < a ? a : v > b ? b : v;
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smooth(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

function sdEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  return Math.hypot((x - cx) / rx, (y - cy) / ry) - 1;
}

function sdBox(x: number, y: number, cx: number, cy: number, hx: number, hy: number): number {
  const dx = Math.abs(x - cx) - hx;
  const dy = Math.abs(y - cy) - hy;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
}

export function paintStillLife(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 5.5, v * 5.5);
      const grain = (hash(x, y) - 0.5) * 8;

      // Wall: mid plaster, brighter toward the window.
      const wallLight = clamp(0.48 + (0.55 - u) * 0.55 + n * 0.06);
      let r = mix(110, 176, wallLight);
      let g = mix(92, 148, wallLight);
      let b = mix(76, 122, wallLight);

      // Window — a large cool pane with a hard cross of muntins.
      const win = sdBox(u, v, 0.2, 0.28, 0.175, 0.23);
      const muntinV = Math.abs(u - 0.2) < 0.016;
      const muntinH = Math.abs(v - 0.28) < 0.014;
      const frame = win < 0.028 && win > -0.01;
      if (win < -0.01 && !muntinV && !muntinH) {
        const sky = clamp(1.2 - v * 0.85);
        const hill = smooth(0.34, 0.38, v + (u - 0.2) * 0.06);
        r = mix(226, 88, hill) * sky;
        g = mix(232, 112, hill) * sky;
        b = mix(238, 78, hill);
      } else if (frame || ((muntinV || muntinH) && win < 0.02)) {
        r = 32;
        g = 24;
        b = 18;
      }

      // Table — a dark band the objects sit on.
      const tableY = 0.64 + (u - 0.5) * 0.03;
      if (v > tableY) {
        const depth = clamp((v - tableY) / 0.4);
        const wood = fbm(u * 10, v * 2.4);
        r = mix(86, 40, depth) + wood * 8;
        g = mix(60, 30, depth) + wood * 5;
        b = mix(40, 22, depth);
      }

      const shadow = Math.min(
        1,
        Math.exp(-Math.hypot(u - 0.56, (v - 0.69) * 2.2) * 12) * 0.62 +
          Math.exp(-Math.hypot(u - 0.78, (v - 0.68) * 2.4) * 14) * 0.48,
      );
      if (v > tableY) {
        r *= 1 - shadow * 0.5;
        g *= 1 - shadow * 0.5;
        b *= 1 - shadow * 0.42;
      }

      // Jug — a tall ceramic, lit from the window.
      const jugBody = sdEllipse(u, v, 0.54, 0.54, 0.115, 0.175);
      const jugNeck = sdEllipse(u, v, 0.54, 0.35, 0.042, 0.08);
      const jug = Math.min(jugBody, jugNeck);
      if (jug < 0) {
        const nx = (u - 0.54) / 0.115;
        const light = clamp(0.28 + (-nx) * 0.7 + n * 0.05);
        const k = 1 - smooth(-0.018, 0.0, jug);
        r = mix(r, mix(52, 232, light), k);
        g = mix(g, mix(46, 210, light), k);
        b = mix(b, mix(40, 188, light), k);
        const spec = Math.exp(-((nx + 0.48) ** 2) * 26 - ((v - 0.48) ** 2) * 14);
        r += spec * 80;
        g += spec * 70;
        b += spec * 55;
      }

      const handle = Math.abs(Math.hypot(u - 0.67, v - 0.52) - 0.07) - 0.016;
      if (handle < 0 && u > 0.6) {
        const light = clamp(0.35 + (0.66 - u) * 5);
        r = mix(64, 220, light);
        g = mix(56, 198, light);
        b = mix(48, 178, light);
      }

      // Pear — warm, readable mass to the right of the jug.
      const pear = Math.min(
        sdEllipse(u, v, 0.8, 0.58, 0.1, 0.115),
        sdEllipse(u, v, 0.8, 0.49, 0.062, 0.062),
      );
      if (pear < 0) {
        const nx = (u - 0.8) / 0.1;
        const light = clamp(0.3 + (-nx) * 0.65 + n * 0.08);
        const k = 1 - smooth(-0.016, 0.0, pear);
        r = mix(r, mix(70, 226, light), k);
        g = mix(g, mix(78, 168, light * 0.9), k);
        b = mix(b, mix(24, 52, light * 0.35), k);
        const spec = Math.exp(-((nx + 0.38) ** 2) * 20 - ((v - 0.56) ** 2) * 14);
        r += spec * 46;
        g += spec * 32;
      }

      if (sdBox(u, v, 0.795, 0.418, 0.008, 0.032) < 0) {
        r = 48;
        g = 32;
        b = 18;
      }
      if (sdEllipse(u, v, 0.84, 0.42, 0.04, 0.018) < 0) {
        r = 48 + n * 18;
        g = 96 + n * 14;
        b = 32;
      }

      // Foreground linen — a pale weft-facing field.
      const fold =
        sdBox(u, v, 0.4, 0.88, 0.32, 0.085 + Math.sin(u * 16) * 0.014) +
        Math.sin(u * 20 + v * 6) * 0.014;
      if (fold < 0 && v > 0.76) {
        const crease = Math.abs(Math.sin(u * 12 + v * 2.5));
        const linen = clamp(0.82 + n * 0.05 - crease * 0.2);
        const k = 1 - smooth(-0.02, 0.012, fold);
        r = mix(r, mix(176, 240, linen), k);
        g = mix(g, mix(164, 228, linen), k);
        b = mix(b, mix(142, 204, linen), k);
      }

      r = clamp(r + grain, 0, 255);
      g = clamp(g + grain, 0, 255);
      b = clamp(b + grain * 0.75, 0, 255);

      const o = (y * width + x) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
  }

  return new ImageData(data, width, height);
}

export function imageFromBitmap(bmp: ImageBitmap, max = 640): ImageData {
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(32, Math.round(bmp.width * scale));
  const h = Math.max(32, Math.round(bmp.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return paintStillLife(512, 512);
  ctx.drawImage(bmp, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}
