/**
 * Everything the scene needs that would ordinarily arrive as an asset: the
 * environment the chrome reflects, and four canvas-drawn textures.
 *
 * Polished metal is entirely reflection. With nothing to reflect it renders as a
 * flat grey solid, which is the usual reason a procedural product render looks
 * dead. So the first thing here builds a small room — a bright ceiling, a tall
 * window, a warm bench below, and a few mid-tone masses at chrome height — and
 * pre-filters it into an environment map. The masses matter as much as the
 * lights: they are what puts structure and a horizon into a curved chrome
 * surface instead of an even wash.
 */
import * as THREE from "three";

/** A bright workshop, pre-filtered for image-based lighting. */
export function buildEnvironment(renderer: THREE.WebGLRenderer): {
  texture: THREE.Texture;
  dispose: () => void;
} {
  const scene = new THREE.Scene();
  const box = new THREE.BoxGeometry();
  box.deleteAttribute("uv");

  const owned: (THREE.Material | THREE.BufferGeometry)[] = [box];

  const surface = (color: number, side: THREE.Side = THREE.FrontSide) => {
    const m = new THREE.MeshLambertMaterial({ color, side });
    owned.push(m);
    return m;
  };
  const panel = (intensity: number, color = 0xffffff) => {
    const m = new THREE.MeshLambertMaterial({
      color: 0x000000,
      emissive: color,
      emissiveIntensity: intensity,
    });
    owned.push(m);
    return m;
  };
  const add = (
    material: THREE.Material,
    pos: [number, number, number],
    scale: [number, number, number],
    rotY = 0
  ) => {
    const mesh = new THREE.Mesh(box, material);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.rotation.y = rotY;
    scene.add(mesh);
    return mesh;
  };

  // Emissive panels light themselves but not the room, so the walls and the
  // masses need sources of their own or they contribute nothing but black. This
  // is the usual reason a hand-built environment leaves chrome looking like
  // graphite.
  const overhead = new THREE.PointLight(0xffffff, 640, 34, 2);
  overhead.position.set(0.3, 7.2, 1.2);
  scene.add(overhead);
  const sideLight = new THREE.PointLight(0xdfeaff, 240, 28, 2);
  sideLight.position.set(-5.4, 3.6, 1.6);
  scene.add(sideLight);
  const benchLight = new THREE.PointLight(0xffe9cc, 130, 22, 2);
  benchLight.position.set(1.2, 2.2, 4.6);
  scene.add(benchLight);
  // Washes the four walls evenly at the height the boiler reflects.
  const horizonWash = new THREE.PointLight(0xfffaf0, 430, 26, 2);
  horizonWash.position.set(0, 1.4, 0);
  scene.add(horizonWash);

  // The room is deliberately split. The upper half is a bright ceiling and a
  // near-white wall; the lower half is dark — bench carcass, shadowed floor, the
  // dark mass where the person standing at the machine would be. That division is
  // the whole trick: it is what puts a horizon into a curved chrome surface, so
  // the boiler reads bright on top and dark underneath the way real plate does. A
  // uniformly bright room, however carefully lit, produces cream-coloured
  // plastic.
  add(surface(0xe9e7e1, THREE.BackSide), [0, 3, 0], [17, 9.5, 17]);
  add(surface(0x1e1e1c), [0, -1.5, 0], [16.6, 0.4, 16.6]);
  // Dark below the horizon, light above, with the join just under eye level. The
  // height matters more than it looks: a cylinder's normals are horizontal, so
  // the boiler can only reflect the band straight out from itself. Put the dark
  // half across that band and the chrome goes to gunmetal; keep it below and the
  // same room reads as polished steel. The dark half is built as edge slabs
  // because the environment is rendered from the origin, and a box enclosing the
  // origin is all back-faces.
  const dado = 0x262624;
  for (const [x, z, sx, sz] of [
    [-8.2, 0, 0.4, 16.4],
    [8.2, 0, 0.4, 16.4],
    [0, -8.2, 16.4, 0.4],
    [0, 8.2, 16.4, 0.4],
  ] as const) {
    add(surface(dado), [x, -1.2, z], [sx, 1.7, sz]);
  }

  // A pale bench top, the one bright thing low down: chrome needs one bounce from
  // below or the underside goes black rather than dark.
  add(surface(0xbfae8c), [0, 1.35, 4.6], [13, 0.35, 3.4]);
  // Masses at the height of the machine, mid and dark, for the near reflections.
  // Masses at the height of the machine. These are the dark vertical bands that
  // travel around the boiler as the camera orbits, which is most of what makes a
  // chromed cylinder read as chromed rather than as grey paint.
  add(surface(0x3b3d3a), [-2.4, 3.4, -6.6], [7.5, 0.4, 1.4]);
  add(surface(0x15161a), [1.1, 0.5, 7.2], [4.6, 3.0, 0.6]);
  add(surface(0x1b1c1e), [-6.2, 0.6, -5.2], [1.4, 3.2, 3.0], 0.6);
  add(surface(0x6d6a60), [6.8, 3.2, -1.6], [1.0, 4.4, 6.0], -0.15);
  add(surface(0x8e8b80), [-3.4, 1.4, 2.6], [1.1, 2.2, 1.1], 0.5);
  add(surface(0x24251f), [4.6, 0.6, -3.4], [1.0, 3.2, 1.5], -0.4);

  // The lighting. A wide ceiling bank does most of it; one tall cool window puts a
  // single hard highlight on the boiler to travel as the camera moves.
  // Kept lower than it wants to be: any brighter and every up-facing chrome
  // surface — the drip tray, the base — clips to flat white.
  add(panel(11), [0, 8.6, 0], [11, 0.1, 7]);
  add(panel(6, 0xfff4e2), [0, 8.4, 4.6], [9, 0.1, 2.2]);
  add(panel(46, 0xe6f0ff), [-7.9, 4.6, 0.4], [0.1, 4.4, 4.2]);
  add(panel(8, 0xe6f0ff), [-7.9, 4.4, -4.6], [0.1, 3.6, 2.2]);
  add(panel(5, 0xfff6e8), [7.9, 4.0, 2.2], [0.1, 2.8, 4.0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();

  return {
    texture: target.texture,
    dispose: () => {
      target.dispose();
      for (const item of owned) item.dispose();
    },
  };
}

function canvas(size: number, height = size) {
  const el = document.createElement("canvas");
  el.width = size;
  el.height = height;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return { el, ctx };
}

function finish(el: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(el);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Gauge range in bar. The needle mapping in machine.ts must match. */
export const GAUGE_MAX = 16;
/** Sweep of the dial, radians, symmetrical about twelve o'clock. */
export const GAUGE_SWEEP = (270 * Math.PI) / 180;

/** The pressure gauge dial: printed, not glowing. */
export function makeDialTexture() {
  const S = 512;
  const { el, ctx } = canvas(S);
  const c = S / 2;
  const r = S * 0.46;

  ctx.fillStyle = "#f4f1e8";
  ctx.beginPath();
  ctx.arc(c, c, S / 2, 0, Math.PI * 2);
  ctx.fill();

  const angle = (v: number) => -GAUGE_SWEEP / 2 + (v / GAUGE_MAX) * GAUGE_SWEEP - Math.PI / 2;

  // The useful band, and the band where you are bending the machine.
  const arc = (from: number, to: number, color: string, width: number, radius: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(c, c, radius, angle(from), angle(to));
    ctx.stroke();
  };
  arc(6, 10, "#b8873c", S * 0.045, r * 0.86);
  arc(13, GAUGE_MAX, "#9c3a20", S * 0.03, r * 0.86);
  arc(0, GAUGE_MAX, "#1a1913", S * 0.008, r);

  ctx.lineCap = "butt";
  for (let v = 0; v <= GAUGE_MAX; v += 0.5) {
    const major = v % 2 === 0;
    const a = angle(v);
    const inner = major ? r * 0.78 : r * 0.88;
    ctx.strokeStyle = "#1a1913";
    ctx.lineWidth = major ? S * 0.011 : S * 0.005;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
    ctx.lineTo(c + Math.cos(a) * (r * 0.965), c + Math.sin(a) * (r * 0.965));
    ctx.stroke();
  }

  ctx.fillStyle = "#1a1913";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(S * 0.082)}px ui-sans-serif, system-ui, sans-serif`;
  for (let v = 0; v <= GAUGE_MAX; v += 2) {
    const a = angle(v);
    ctx.fillText(
      String(v),
      c + Math.cos(a) * (r * 0.63),
      c + Math.sin(a) * (r * 0.63)
    );
  }

  ctx.font = `500 ${Math.round(S * 0.058)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#5c584a";
  ctx.fillText("bar", c, c + r * 0.34);
  ctx.font = `600 ${Math.round(S * 0.044)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.letterSpacing = `${S * 0.014}px`;
  ctx.fillText("LEVA", c, c + r * 0.62);

  return finish(el);
}

/** Walnut: quartersawn, so the grain runs the length of the turning. */
export function makeWalnutTexture() {
  const S = 512;
  const { el, ctx } = canvas(S);
  ctx.fillStyle = "#5b3a22";
  ctx.fillRect(0, 0, S, S);

  let seed = 20240517;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let i = 0; i < 220; i++) {
    const y = rand() * S;
    const dark = rand();
    ctx.strokeStyle = `rgba(${dark > 0.7 ? 38 : 96}, ${dark > 0.7 ? 22 : 60}, ${dark > 0.7 ? 12 : 34}, ${0.1 + rand() * 0.4})`;
    ctx.lineWidth = 0.6 + rand() * 3.4;
    ctx.beginPath();
    const amp = 4 + rand() * 16;
    const freq = 1 + rand() * 2.5;
    const phase = rand() * Math.PI * 2;
    ctx.moveTo(0, y);
    for (let x = 0; x <= S; x += 16) {
      ctx.lineTo(x, y + Math.sin((x / S) * Math.PI * 2 * freq + phase) * amp);
    }
    ctx.stroke();
  }

  // A couple of lighter figure bands, so it is not uniformly striped.
  for (let i = 0; i < 5; i++) {
    const y = rand() * S;
    const g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    g.addColorStop(0, "rgba(150,106,64,0)");
    g.addColorStop(0.5, "rgba(150,106,64,0.3)");
    g.addColorStop(1, "rgba(150,106,64,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 30, S, 60);
  }

  const tex = finish(el);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * The bench top: a 50 mm layout grid on paper-coloured steel. Tiles, and fades
 * into the backdrop by fog rather than by a baked vignette.
 */
export function makeBenchTexture() {
  const S = 1024;
  const { el, ctx } = canvas(S);
  ctx.fillStyle = "#cac2ac";
  ctx.fillRect(0, 0, S, S);

  const cells = 28;
  const step = S / cells;
  // Stop one short: the tile repeats, so drawing both edges doubles the seam.
  for (let i = 0; i < cells; i++) {
    const p = i * step;
    const major = i % 4 === 0;
    ctx.strokeStyle = major ? "rgba(52,48,36,0.3)" : "rgba(52,48,36,0.15)";
    ctx.lineWidth = major ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();
  }

  const tex = finish(el);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * The wall behind the bench, as an equirectangular background. Distance fog is
 * matched to the horizon band so the ground plane dissolves into it instead of
 * ending at a visible edge.
 */
export const HORIZON = 0xe7e3d8;

export function makeBackdropTexture() {
  const { el, ctx } = canvas(16, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#f4f2ec");
  g.addColorStop(0.4, "#eeebe3");
  // A wide flat band at exactly the fog colour, so the far edge of the bench
  // dissolves into it without leaving a step.
  g.addColorStop(0.5, "#e7e3d8");
  g.addColorStop(0.72, "#e7e3d8");
  g.addColorStop(1, "#ded9cb");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const tex = finish(el);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

/** A soft blob to sit under the base, so it does not look pasted on. */
export function makeContactShadowTexture() {
  const S = 256;
  const { el, ctx } = canvas(S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(40,36,26,0.5)");
  g.addColorStop(0.45, "rgba(40,36,26,0.3)");
  g.addColorStop(0.78, "rgba(40,36,26,0.07)");
  g.addColorStop(1, "rgba(40,36,26,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return finish(el);
}

/** The engraved brass plate on the front of the base. */
export function makeBadgeTexture() {
  const W = 512;
  const H = 128;
  const { el, ctx } = canvas(W, H);
  ctx.fillStyle = "#c8a463";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#6d5326";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "18px";
  ctx.font = `600 62px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText("LEVA", W / 2 + 9, H / 2 + 4);
  return finish(el);
}
