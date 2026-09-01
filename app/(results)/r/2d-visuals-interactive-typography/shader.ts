/**
 * Relief lighting for a baked cotton sheet.
 *
 * The height field is the impression; the fragment shader only asks how a
 * close lamp would see it. Normals come from finite differences, the lamp is a
 * point a little above the rag, and paper is a wrapped diffuse — a thick
 * scatterer, not a plastic highlight. Ink is a darker albedo in the valley,
 * mixed by a uniform so the same type can be a blind dent or a readable print.
 *
 * Nothing is drawn as a glowing orb. The lamp exists only as its consequence
 * on the surface, which is how a real raking light is seen.
 */

export const VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p * 0.5;
  gl_Position = vec4(p - 1.0, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uSheet;
uniform sampler2D uForm;
uniform vec2 uSize;
uniform vec2 uInvTexel;
uniform vec3 uLight;
uniform vec4 uPaper;
uniform float uLift;
uniform float uInk;
uniform float uBump;
uniform float uAmbient;
uniform vec3 uBench;

in vec2 vUv;
out vec4 fragColor;

vec3 srgbDecode(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(2.2));
}

vec3 srgbEncode(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

void main() {
  vec4 sheet = texture(uSheet, vUv);
  vec4 form = texture(uForm, vUv);
  float height = sheet.a;
  float paper = form.g;
  float letter = form.r;

  float hL = texture(uSheet, vUv + vec2(-uInvTexel.x, 0.0)).a;
  float hR = texture(uSheet, vUv + vec2(uInvTexel.x, 0.0)).a;
  float hD = texture(uSheet, vUv + vec2(0.0, -uInvTexel.y)).a;
  float hU = texture(uSheet, vUv + vec2(0.0, uInvTexel.y)).a;

  // Neighbours off the sheet are flattened so the deckle is a thin edge,
  // not a book-block cliff.
  float pL = texture(uForm, vUv + vec2(-uInvTexel.x, 0.0)).g;
  float pR = texture(uForm, vUv + vec2(uInvTexel.x, 0.0)).g;
  float pD = texture(uForm, vUv + vec2(0.0, -uInvTexel.y)).g;
  float pU = texture(uForm, vUv + vec2(0.0, uInvTexel.y)).g;
  hL = mix(height, hL, pL);
  hR = mix(height, hR, pR);
  hD = mix(height, hD, pD);
  hU = mix(height, hU, pU);

  vec3 N = normalize(vec3((hL - hR) * uBump, (hD - hU) * uBump, 1.0));

  // Distance is measured on the sheet, not the bench, so a phrase-sized
  // lamp stays a phrase on a phone and on a wide desk.
  vec2 paperSize = max(uPaper.zw, vec2(1e-4));
  vec2 local = (vUv - uPaper.xy) / paperSize;
  vec2 lampL = (uLight.xy - uPaper.xy) / paperSize;
  float paperAspect = (uPaper.z * uSize.x) / max(uPaper.w * uSize.y, 1.0);
  vec3 pos = vec3(local.x * paperAspect, local.y, height * 0.04);
  vec3 lamp = vec3(lampL.x * paperAspect, lampL.y, uLight.z);
  vec3 toL = lamp - pos;
  float dist = length(toL);
  vec3 L = toL / max(dist, 1e-4);

  float wrap = 0.42;
  float ndotl = dot(N, L);
  float diff = max((ndotl + wrap) / (1.0 + wrap), 0.0);
  float atten = 1.0 / (0.38 + dist * dist * 38.0);

  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 42.0);

  // Grazing light on the leading lip of a dent — the one highlight a
  // thumb would find on a real impression.
  float rake = pow(max(1.0 - abs(ndotl), 0.0), 3.0) * letter;

  vec3 Lwin = normalize(vec3(-0.52, 0.78, 0.3));
  float winDiff = max((dot(N, Lwin) + wrap) / (1.0 + wrap), 0.0);
  vec3 Hwin = normalize(Lwin + V);
  float winSpec = pow(max(dot(N, Hwin), 0.0), 36.0);

  float k = uLift;
  float light = mix(diff * atten * 1.28, winDiff * 1.12, k);
  float shine = mix(spec * atten * 0.22 + rake * atten * 0.18, winSpec * 0.1, k);
  float amb = mix(uAmbient, 0.26, k);

  vec3 paperLin = srgbDecode(sheet.rgb);
  vec3 inkLin = srgbDecode(vec3(0.17, 0.12, 0.09));
  // Ink sits in the valley and is a little less scattering than the plateau.
  float inkAmt = letter * mix(0.1, 1.0, uInk);
  vec3 albedo = mix(paperLin, inkLin, inkAmt);
  shine *= mix(1.0, 0.45, inkAmt);

  vec3 color = albedo * (amb + light) + vec3(1.0, 0.97, 0.9) * shine;
  vec3 bench = srgbDecode(uBench);
  color = mix(bench, color, paper);

  fragColor = vec4(srgbEncode(color), 1.0);
}
`;
