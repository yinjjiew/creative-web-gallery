/**
 * Three passes over a sheet: a brush that writes water and soot, a step of
 * the wet process, and a reading of what the paper now looks like.
 *
 * The field is mass, not appearance. R is water, G is mobile pigment, B is
 * pigment the fibres have already taken. Nothing here is a blur of the mark.
 */

export const VERTEX = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p * 0.5;
  gl_Position = vec4(p - 1.0, 0.0, 1.0);
}
`;

export const DEPOSIT = `#version 300 es
precision highp float;

uniform sampler2D uField;
uniform sampler2D uPaper;
uniform vec2 uSize;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uWater;
uniform float uPigment;
uniform float uDry;
uniform float uPack;

in vec2 vUv;
out vec4 fragColor;

float capsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = (p - a) * uSize;
  vec2 ba = (b - a) * uSize;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) / max(r, 0.5);
}

void main() {
  vec4 s = texture(uField, vUv) * uPack;
  vec4 paper = texture(uPaper, vUv);
  float height = paper.b;
  float absorb = paper.g;

  float d = capsule(vUv, uA, uB, uRadius);
  // Soft belly, harder shoulder — a loaded brush, not a gaussian stamp.
  float core = 1.0 - smoothstep(0.0, 0.72, d);
  float fringe = 1.0 - smoothstep(0.45, 1.05, d);
  float mask = max(core, fringe * 0.45);

  // A dry flick only kisses the high fibres. A loaded stroke floods the valleys.
  float tooth = mix(1.0, smoothstep(0.28, 0.72, height), uDry);
  float skip = mix(1.0, step(0.18, fract(height * 17.3 + absorb * 9.1)), uDry * 0.85);
  mask *= tooth * mix(1.0, skip, uDry);

  float addW = uWater * mask * (0.7 + 0.3 * absorb);
  float addM = uPigment * mask * (0.55 + 0.45 * (1.0 - uDry));

  // Water on an existing mark lifts a little deposited soot back into solution.
  float lift = min(s.b, addW * 0.28 * s.b / max(s.b + 0.05, 0.05));
  float W = s.r + addW;
  float M = s.g + addM + lift;
  float D = s.b - lift;

  fragColor = vec4(W, M, D, 1.0) / uPack;
}
`;

export const STEP = `#version 300 es
precision highp float;

uniform sampler2D uField;
uniform sampler2D uPaper;
uniform vec2 uInv;
uniform vec2 uSize;
uniform float uDt;
uniform float uDiffW;
uniform float uDiffP;
uniform float uEvap;
uniform float uAbsorb;
uniform float uCapillary;
uniform float uPack;

in vec2 vUv;
out vec4 fragColor;

vec4 at(vec2 uv) {
  return texture(uField, clamp(uv, 0.0, 1.0)) * uPack;
}

void main() {
  vec4 s = texture(uField, vUv) * uPack;
  vec4 paper = texture(uPaper, vUv);

  float W = s.r;
  float M = s.g;
  float D = s.b;

  float fibre = paper.r * 3.14159265;
  vec2 grain = vec2(cos(fibre), sin(fibre));
  float absorb = paper.g;
  float height = paper.b;
  float sizing = paper.a;

  vec2 dx = vec2(uInv.x, 0.0);
  vec2 dy = vec2(0.0, uInv.y);
  vec4 L = at(vUv - dx);
  vec4 R = at(vUv + dx);
  vec4 Dn = at(vUv - dy);
  vec4 Up = at(vUv + dy);

  float hL = texture(uPaper, clamp(vUv - dx, 0.0, 1.0)).b;
  float hR = texture(uPaper, clamp(vUv + dx, 0.0, 1.0)).b;
  float hDn = texture(uPaper, clamp(vUv - dy, 0.0, 1.0)).b;
  float hUp = texture(uPaper, clamp(vUv + dy, 0.0, 1.0)).b;

  // Conductivity: wet cellulose conducts; sized paper resists; grain prefers
  // its own direction. This is wicking, not isotropic smear.
  float wet = smoothstep(0.018, 0.22, W);
  float k0 = uDiffW * (0.22 + 0.78 * absorb) * (0.5 + 0.5 * (1.0 - sizing));
  k0 *= 0.32 + 1.45 * wet;

  float kL = k0 * (1.0 + 1.4 * abs(dot(grain, vec2(-1.0, 0.0))));
  float kR = k0 * (1.0 + 1.4 * abs(dot(grain, vec2(1.0, 0.0))));
  float kD = k0 * (1.0 + 1.4 * abs(dot(grain, vec2(0.0, -1.0))));
  float kU = k0 * (1.0 + 1.4 * abs(dot(grain, vec2(0.0, 1.0))));

  // A little downhill: water settles into the tooth rather than sitting on it.
  float slope = 0.22;
  float dW =
    kL * (L.r - W) + kR * (R.r - W) + kD * (Dn.r - W) + kU * (Up.r - W);
  dW += slope * (
    kL * (hL - height) * W +
    kR * (hR - height) * W +
    kD * (hDn - height) * W +
    kU * (hUp - height) * W
  );

  float fluxL = kL * (W - L.r);
  float fluxR = kR * (W - R.r);
  float fluxD = kD * (W - Dn.r);
  float fluxU = kU * (W - Up.r);

  float conc = W > 1e-5 ? M / W : 0.0;
  float nL = L.r > 1e-5 ? L.g / L.r : 0.0;
  float nR = R.r > 1e-5 ? R.g / R.r : 0.0;
  float nD = Dn.r > 1e-5 ? Dn.g / Dn.r : 0.0;
  float nU = Up.r > 1e-5 ? Up.g / Up.r : 0.0;

  // Pigment rides the water. It also diffuses, but only where there is water
  // and much more slowly — soot is heavier than the vehicle.
  float ride = 0.92;
  float dM =
    (fluxL > 0.0 ? -fluxL * conc : -fluxL * nL) +
    (fluxR > 0.0 ? -fluxR * conc : -fluxR * nR) +
    (fluxD > 0.0 ? -fluxD * conc : -fluxD * nD) +
    (fluxU > 0.0 ? -fluxU * conc : -fluxU * nU);
  dM *= ride;

  float kP = uDiffP * smoothstep(0.012, 0.1, W);
  dM += kP * ((L.g - M) + (R.g - M) + (Dn.g - M) + (Up.g - M));

  // Capillary pull toward drier neighbours — the contact-line flow that
  // carries soot to the rim as the blot evaporates.
  float wetC = smoothstep(0.02, 0.16, W);
  float wetL = smoothstep(0.02, 0.16, L.r);
  float wetR = smoothstep(0.02, 0.16, R.r);
  float wetDn = smoothstep(0.02, 0.16, Dn.r);
  float wetUp = smoothstep(0.02, 0.16, Up.r);
  float cap = uCapillary;
  float sendL = cap * W * max(wetC - wetL, 0.0);
  float sendR = cap * W * max(wetC - wetR, 0.0);
  float sendD = cap * W * max(wetC - wetDn, 0.0);
  float sendU = cap * W * max(wetC - wetUp, 0.0);
  float recvL = cap * L.r * max(wetL - wetC, 0.0);
  float recvR = cap * R.r * max(wetR - wetC, 0.0);
  float recvD = cap * Dn.r * max(wetDn - wetC, 0.0);
  float recvU = cap * Up.r * max(wetUp - wetC, 0.0);

  dW += (recvL + recvR + recvD + recvU) - (sendL + sendR + sendD + sendU);
  dM +=
    recvL * nL + recvR * nR + recvD * nD + recvU * nU -
    (sendL + sendR + sendD + sendU) * conc;

  W = max(W + uDt * dW, 0.0);
  M = max(M + uDt * dM, 0.0);

  // The contact line: this cell is wet and at least one neighbour is not.
  float dryN =
    (1.0 - wetL) + (1.0 - wetR) + (1.0 - wetDn) + (1.0 - wetUp);
  float edge = clamp(dryN * 0.4, 0.0, 1.0) * smoothstep(0.012, 0.09, W);

  // Evaporation toward the sheet's ambient damp, faster at the rim and on
  // raised fibres. Water leaves; mass of soot does not.
  float ambient = 0.026 + 0.018 * absorb;
  float evap = uEvap * (0.26 + 0.9 * edge) * (0.75 + 0.35 * height);
  evap *= (0.65 + 0.35 * (1.0 - sizing));
  float lost = min(max(W - ambient, 0.0), evap * uDt * max(W, 1e-4));
  W = max(W - lost, 0.0);

  // Absorption: fibres take soot most readily as the film thins — not while
  // the wash is still a puddle, and not after it has gone.
  float bindEnv = smoothstep(0.0, 0.035, W) * (1.0 - smoothstep(0.2, 0.65, W));
  float bindRate = uAbsorb * absorb * bindEnv + edge * (lost / max(uDt, 1e-4)) * 3.4;
  float bound = min(M, bindRate * M * uDt);
  M -= bound;
  D += bound;

  if (W < 0.01) {
    D += M;
    M = 0.0;
  }

  W = min(W, 4.0);
  M = min(M, 4.0);
  D = min(D, 4.0);

  fragColor = vec4(W, M, D, 1.0) / uPack;
}
`;

export const RENDER = `#version 300 es
precision highp float;

uniform sampler2D uField;
uniform sampler2D uAlbedo;
uniform vec2 uInv;
uniform vec2 uSize;
uniform float uPack;

in vec2 vUv;
out vec4 fragColor;

vec3 srgbEncode(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

void main() {
  vec4 s = texture(uField, vUv) * uPack;
  vec4 alb = texture(uAlbedo, vUv);

  float W = s.r;
  float M = s.g;
  float D = s.b;
  float height = alb.a;

  float hL = texture(uAlbedo, vUv + vec2(-uInv.x, 0.0)).a;
  float hR = texture(uAlbedo, vUv + vec2(uInv.x, 0.0)).a;
  float hD = texture(uAlbedo, vUv + vec2(0.0, -uInv.y)).a;
  float hU = texture(uAlbedo, vUv + vec2(0.0, uInv.y)).a;
  vec3 N = normalize(vec3((hL - hR) * 5.2, (hD - hU) * 5.2, 1.0));
  vec3 L = normalize(vec3(-0.28, 0.42, 0.86));
  float wrap = 0.55;
  float diff = max((dot(N, L) + wrap) / (1.0 + wrap), 0.0);

  vec3 paperLin = pow(max(alb.rgb, vec3(0.0)), vec3(2.2));
  paperLin *= 0.78 + 0.32 * diff;

  // A wet patch is a darker, slightly glossier fibre — index matching, not a
  // highlight orb. The sheen is the consequence of a light on a film.
  float wet = smoothstep(0.05, 0.42, W);
  paperLin *= 1.0 - wet * 0.11;
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 38.0) * wet * 0.07;
  paperLin += spec;

  // Beer–Lambert through two populations of soot: still moving, and already
  // taken by the fibre. Deposited ink is warmer and more opaque; mobile ink
  // is a thinner, slightly cooler wash.
  float mobile = M * 2.15;
  float fixedP = D * 2.55;
  float absorbM = 1.0 - exp(-mobile * 1.8);
  float absorbD = 1.0 - exp(-fixedP * 2.4);
  vec3 wash = vec3(0.14, 0.145, 0.155);
  vec3 soot = vec3(0.07, 0.055, 0.045);
  vec3 color = paperLin;
  color = mix(color, color * wash, absorbM);
  color = mix(color, soot, absorbD);

  // A last hair of grain so a dry region is never a flat fill.
  float grain = fract(sin(dot(vUv * uSize, vec2(12.9898, 78.233))) * 43758.5453);
  color *= 0.985 + 0.03 * grain;

  fragColor = vec4(srgbEncode(color), 1.0);
}
`;
