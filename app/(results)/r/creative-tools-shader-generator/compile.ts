import {
  BLEND_LABEL,
  KIND_LABEL,
  glslFloat,
  glslVec3,
  hexToRgb,
  type Blend,
  type Kind,
  type Layer,
} from "./types";

export type UniformValue = number | [number, number, number];

export type Compiled = {
  preview: string;
  exported: string;
  uniforms: Record<string, UniformValue>;
};

const LIB = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  float n = hash12(p);
  return vec2(n, hash12(p + n + 19.19));
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * valueNoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec2 warp2(vec2 p, float amt) {
  float n1 = fbm(p);
  float n2 = fbm(p + vec2(5.2, 1.3));
  return p + amt * (vec2(n1, n2) * 2.0 - 1.0);
}

float worley(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash22(n + g);
      vec2 r = g + o - f;
      md = min(md, dot(r, r));
    }
  }
  return sqrt(md);
}

vec2 rotateUv(vec2 uv, float turns) {
  float a = turns * 3.14159265;
  float c = cos(a);
  float s = sin(a);
  vec2 p = uv - 0.5;
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5;
}

vec3 blendNormal(vec3 b, vec3 s) { return s; }
vec3 blendMultiply(vec3 b, vec3 s) { return b * s; }
vec3 blendScreen(vec3 b, vec3 s) { return 1.0 - (1.0 - b) * (1.0 - s); }
vec3 blendAdd(vec3 b, vec3 s) { return min(b + s, vec3(1.0)); }
vec3 blendSubtract(vec3 b, vec3 s) { return max(b - s, vec3(0.0)); }

vec3 blendOverlay(vec3 b, vec3 s) {
  return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
}

vec3 blendSoftLight(vec3 b, vec3 s) {
  vec3 d = mix(
    b - (1.0 - 2.0 * s) * b * (1.0 - b),
    b + (2.0 * s - 1.0) * (sqrt(max(b, vec3(0.0))) - b),
    step(0.5, s)
  );
  return clamp(d, 0.0, 1.0);
}

vec3 blendBurn(vec3 b, vec3 s) {
  return 1.0 - min(vec3(1.0), (1.0 - b) / max(s, vec3(1.0e-5)));
}

vec3 blendDodge(vec3 b, vec3 s) {
  return min(vec3(1.0), b / max(1.0 - s, vec3(1.0e-5)));
}

vec3 blendDifference(vec3 b, vec3 s) { return abs(b - s); }
`.trim();

function blendCall(blend: Blend): string {
  switch (blend) {
    case "normal":
      return "blendNormal";
    case "multiply":
      return "blendMultiply";
    case "screen":
      return "blendScreen";
    case "overlay":
      return "blendOverlay";
    case "softlight":
      return "blendSoftLight";
    case "add":
      return "blendAdd";
    case "subtract":
      return "blendSubtract";
    case "burn":
      return "blendBurn";
    case "dodge":
      return "blendDodge";
    case "difference":
      return "blendDifference";
  }
}

function kindBody(kind: Kind, p: ParamNames): string {
  switch (kind) {
    case "fill":
      return `
  rgb = ${p.colorA};
  cover = 1.0;`;
    case "drift":
      return `
  vec2 pd = warp2(uv * ${p.scale} + ${p.seed}, ${p.warp});
  float nd = fbm(pd);
  nd = smoothstep(0.5 - ${p.sharp} * 0.49, 0.5 + ${p.sharp} * 0.49, nd);
  rgb = mix(${p.colorA}, ${p.colorB}, nd);
  cover = nd;`;
    case "grain":
      return `
  float ng = hash12(uv * ${p.scale} + ${p.seed} * 13.17);
  rgb = mix(${p.colorA}, ${p.colorB}, ng);
  cover = mix(0.25, 1.0, ${p.sharp}) * ng;`;
    case "vein":
      return `
  vec2 pv = rotateUv(uv, ${p.rotate});
  pv = warp2(pv * ${p.scale} + ${p.seed}, ${p.warp} * 1.8);
  float nv = abs(sin(pv.x * 6.283185 + fbm(pv) * 6.0));
  nv = pow(clamp(nv, 0.0, 1.0), mix(1.2, 9.0, ${p.sharp}));
  rgb = mix(${p.colorA}, ${p.colorB}, nv);
  cover = nv;`;
    case "cell":
      return `
  float nc = worley(uv * ${p.scale} + ${p.seed} * 3.1);
  nc = smoothstep(mix(0.05, 0.45, 1.0 - ${p.sharp}), mix(0.35, 0.95, ${p.sharp}), nc);
  rgb = mix(${p.colorA}, ${p.colorB}, nc);
  cover = nc;`;
    case "band":
      return `
  vec2 pb = rotateUv(uv, ${p.rotate});
  float nb = pb.x * ${p.scale} + ${p.warp} * (fbm(pb * 2.4) - 0.5) * 2.0;
  nb = 0.5 + 0.5 * sin(nb * 6.283185);
  nb = smoothstep(0.5 - ${p.sharp} * 0.48, 0.5 + ${p.sharp} * 0.48, nb);
  rgb = mix(${p.colorA}, ${p.colorB}, nb);
  cover = nb;`;
    case "fiber":
      return `
  vec2 pf = rotateUv(uv, ${p.rotate}) * ${p.scale};
  float wx = 0.5 + 0.5 * sin(pf.x * 6.283185);
  float wy = 0.5 + 0.5 * sin(pf.y * 6.283185);
  float cell = hash12(floor(pf));
  float nf = mix(wx, wy, 0.5) * mix(0.72, 1.0, cell);
  nf = mix(nf, smoothstep(0.35, 0.65, nf), ${p.sharp});
  rgb = mix(${p.colorA}, ${p.colorB}, nf);
  cover = nf;`;
    case "speck":
      return `
  vec2 ps = floor(uv * ${p.scale} + ${p.seed} * 7.3);
  float ns = hash12(ps);
  float keep = step(1.0 - mix(0.018, 0.22, ${p.sharp}), ns);
  float hole = hash12(ps + 4.2);
  rgb = mix(${p.colorA}, ${p.colorB}, hole);
  cover = keep;`;
    case "ridge":
      return `
  vec2 pr = warp2(uv * ${p.scale} + ${p.seed}, ${p.warp});
  float nr = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    nr += abs(valueNoise(pr) * 2.0 - 1.0) * amp;
    pr *= 2.04;
    amp *= 0.5;
  }
  nr = 1.0 - nr;
  nr = smoothstep(0.5 - ${p.sharp} * 0.45, 0.5 + ${p.sharp} * 0.45, nr);
  rgb = mix(${p.colorA}, ${p.colorB}, nr);
  cover = nr;`;
    case "wash":
      return `
  vec2 pw = (uv - 0.5) * (0.55 + ${p.scale} * 0.12);
  float nw = length(pw);
  nw = smoothstep(0.15, mix(0.45, 1.15, 1.0 - ${p.sharp} * 0.4), nw);
  rgb = mix(${p.colorA}, ${p.colorB}, nw);
  cover = nw;`;
  }
}

type ParamNames = {
  colorA: string;
  colorB: string;
  scale: string;
  rotate: string;
  seed: string;
  sharp: string;
  warp: string;
};

function previewParams(i: number): ParamNames {
  return {
    colorA: `uL${i}_colorA`,
    colorB: `uL${i}_colorB`,
    scale: `uL${i}_scale`,
    rotate: `uL${i}_rotate`,
    seed: `uL${i}_seed`,
    sharp: `uL${i}_sharp`,
    warp: `uL${i}_warp`,
  };
}

function bakedParams(layer: Layer): ParamNames {
  return {
    colorA: glslVec3(layer.colorA),
    colorB: glslVec3(layer.colorB),
    scale: glslFloat(layer.scale),
    rotate: glslFloat(layer.rotate / 180),
    seed: glslFloat(layer.seed),
    sharp: glslFloat(layer.sharpness),
    warp: glslFloat(layer.warp),
  };
}

function sampleFn(index: number, layer: Layer, params: ParamNames): string {
  const invert = layer.invert ? "  cover = 1.0 - cover;\n" : "";
  return `vec4 sample_${index}(vec2 uv) {
  vec3 rgb = ${params.colorA};
  float cover = 1.0;
  {
${kindBody(layer.kind, params)}
  }
${invert}  return vec4(rgb, clamp(cover, 0.0, 1.0));
}`;
}

function visibleLayers(stack: Layer[]): Layer[] {
  return stack.filter((l) => l.visible);
}

function compositeBody(layers: Layer[], opacityOf: (i: number, layer: Layer) => string): string {
  if (layers.length === 0) {
    return "  return vec3(0.92, 0.88, 0.80);\n";
  }
  const lines: string[] = [
    "  vec4 s0 = sample_0(uv);",
    `  vec3 color = mix(vec3(0.902, 0.867, 0.784), s0.rgb, clamp(s0.a * ${opacityOf(0, layers[0]!)}, 0.0, 1.0));`,
    "  float prev = s0.a;",
  ];
  for (let i = 1; i < layers.length; i++) {
    const L = layers[i]!;
    const clip = L.clip ? `s.a *= prev;\n  ` : "";
    lines.push(`  {`);
    lines.push(`    vec4 s = sample_${i}(uv);`);
    if (clip) lines.push(`    ${clip.trim()}`);
    lines.push(`    float a = s.a * ${opacityOf(i, L)};`);
    lines.push(`    vec3 bl = ${blendCall(L.blend)}(color, s.rgb);`);
    lines.push(`    color = mix(color, bl, clamp(a, 0.0, 1.0));`);
    lines.push(`    prev = s.a;`);
    lines.push(`  }`);
  }
  lines.push("  return clamp(color, 0.0, 1.0);");
  return `${lines.join("\n")}\n`;
}

function headerComment(layers: Layer[], recipeName: string): string {
  const rows = layers.map((L, i) => {
    const op = Math.round(L.opacity * 100);
    const clip = L.clip ? " clip" : "";
    const inv = L.invert ? " inv" : "";
    return `//   ${String(i).padStart(2, " ")}  ${L.name.padEnd(12, " ")} ${KIND_LABEL[L.kind].toLowerCase().padEnd(7, " ")} ${BLEND_LABEL[L.blend].toLowerCase().padEnd(12, " ")} ${String(op).padStart(3, " ")}%${clip}${inv}`;
  });
  return `//  Substrate — ${recipeName}
//  Procedural material compiled from a layer stack.
//  Bottom of the list is the bed; each line above is a deposit.
//  Blend modes are the Porter/Photoshop identities; coverage is
//  the generator's own mask, times opacity, optionally clipped
//  to the deposit beneath.
//
//  Layers (bottom → surface):
${rows.join("\n")}
//
//  Usage, WebGL 1:
//    precision highp float;
//    uniform vec2 uResolution;
//    // paste this file as the fragment shader
//
//  Shadertoy:
//    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
//      fragColor = vec4(substrate(fragCoord), 1.0);
//    }
`;
}

export function compile(stack: Layer[], recipeName: string): Compiled {
  const layers = visibleLayers(stack);
  const uniforms: Record<string, UniformValue> = {
    uZoom: 1,
    uPanX: 0,
    uPanY: 0,
    uAspect: 1,
  };

  const previewUniforms: string[] = [
    "uniform float uZoom;",
    "uniform float uPanX;",
    "uniform float uPanY;",
    "uniform float uAspect;",
  ];
  const previewFns: string[] = [];
  const exportFns: string[] = [];

  layers.forEach((L, i) => {
    const p = previewParams(i);
    previewUniforms.push(
      `uniform vec3 ${p.colorA};`,
      `uniform vec3 ${p.colorB};`,
      `uniform float ${p.scale};`,
      `uniform float ${p.rotate};`,
      `uniform float ${p.seed};`,
      `uniform float ${p.sharp};`,
      `uniform float ${p.warp};`,
      `uniform float uL${i}_opacity;`,
    );
    uniforms[p.colorA] = hexToRgb(L.colorA);
    uniforms[p.colorB] = hexToRgb(L.colorB);
    uniforms[p.scale] = L.scale;
    uniforms[p.rotate] = L.rotate / 180;
    uniforms[p.seed] = L.seed;
    uniforms[p.sharp] = L.sharpness;
    uniforms[p.warp] = L.warp;
    uniforms[`uL${i}_opacity`] = L.opacity;
    previewFns.push(sampleFn(i, L, p));
    exportFns.push(sampleFn(i, L, bakedParams(L)));
  });

  const previewComposite = `vec3 composite(vec2 uv) {\n${compositeBody(layers, (i) => `uL${i}_opacity`)}}`;
  const exportComposite = `vec3 composite(vec2 uv) {\n${compositeBody(layers, (_i, L) => glslFloat(L.opacity))}}`;

  const preview = `varying vec2 vUv;
${previewUniforms.join("\n")}

${LIB}

${previewFns.join("\n\n")}

${previewComposite}

void main() {
  vec2 uv = (vUv - 0.5) / max(uZoom, 0.05) + 0.5;
  uv.x += uPanX;
  uv.y += uPanY;
  uv.x *= uAspect;
  vec3 srgb = composite(uv);
  // ShaderMaterial output is treated as linear; our stack is authored in sRGB.
  gl_FragColor = vec4(pow(max(srgb, vec3(0.0)), vec3(2.2)), 1.0);
}
`;

  const exported = `${headerComment(layers, recipeName)}
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 uResolution;

${LIB}

${exportFns.join("\n\n")}

${exportComposite}

vec3 substrate(vec2 fragCoord) {
  vec2 res = max(uResolution, vec2(1.0));
  vec2 uv = fragCoord / res.y;
  uv.x -= 0.5 * (res.x / res.y - 1.0);
  return composite(uv);
}

void main() {
  gl_FragColor = vec4(substrate(gl_FragCoord.xy), 1.0);
}
`;

  return { preview, exported, uniforms };
}

export const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
