/**
 * Two ruled line fields, multiplied, resolved in the frequency domain.
 *
 * The naive way to draw a grating is `step(0.5, fract(x / period))`, and it is
 * wrong here: every frequency above half a pixel folds back down the spectrum
 * and produces beat patterns that belong to the sampling grid rather than to
 * the two fields. Those fakes look convincing, change when the window resizes,
 * and are the reason most moiré demos are worthless.
 *
 * So nothing is rasterised. Each layer is a square wave of duty d, written as
 * its Fourier series
 *
 *     sq(p) = d + SUM (2 / pi k) sin(pi k d) cos(2 pi k p)
 *
 * and the plate is the product of two of them, which expands into a finite sum
 * of pure cosines with phases n*pA +/- m*pB. Every one of those components has
 * a known screen-space frequency, |grad(n*pA +/- m*pB)| in cycles per physical
 * pixel, taken from the derivatives of the two smooth phase fields. Each is
 * admitted at full amplitude while it is comfortably resolvable, tapered as it
 * approaches the sampling limit, and is exactly zero beyond it.
 *
 * That is what makes the interference honest. The difference components
 * n*pA - m*pB are the moiré: they can sit at a thousandth of the carrier
 * frequency, so they survive the taper untouched while the carrier that
 * produced them dissolves into flat grey. The figures are the ones a perfect
 * optical stack would put on paper, band-limited to the display, and they do
 * not change when the device pixel ratio does.
 *
 * The tone mapping is deliberately affine — an offset plus a frequency
 * dependent gain, which is a linear filter — so it cannot manufacture new
 * frequencies either.
 *
 * The ruling is half duty, whose series contains only the odd harmonics, so
 * term i means harmonic 0, 1, 3, 5, 7. Their amplitudes arrive as uniforms and
 * `uTerms` sets how many are summed.
 */

export const VERTEX_SHADER = `#version 300 es
precision highp float;

void main() {
  // A quad from the vertex index alone; no attribute buffers to leak.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p - 1.0, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

#define MAX_TERMS 5
#define PI  3.141592653589793
#define TAU 6.283185307179586

uniform vec2  uPlate;    // plate size in CSS pixels
uniform vec2  uHalf;     // half of it, so position normalises to [-1, 1] per axis
uniform float uDpr;      // physical pixels per CSS pixel
uniform vec4  uLayerA;   // cos and sin of the orientation, 1 / period, phase
uniform vec4  uLayerB;
uniform vec4  uWarpA;    // quadratic bend in cycles: x squared, y squared, xy
uniform vec4  uWarpB;
uniform vec2  uWindow;   // squared band limit: whole below x, nothing above y
uniform vec2  uBand;     // squared gain crossfade: figure below x, ruling above y
uniform vec3  uGain;     // gain on the figure, gain on the ruling, 1 / exposure
uniform float uAmp[MAX_TERMS];
uniform int   uTerms;

out vec4 fragColor;

/**
 * Phase of one ruling in cycles, as a smooth function of position, so that its
 * screen-space derivatives are meaningful. Straight parallel lines, plus three
 * quadratic terms — a chirp, a bow, a shear — carried in cycles against a
 * position normalised to the plate, so a coefficient of 1 means exactly one
 * cycle of bend by the edge whatever the plate's size or shape.
 *
 * Against a ruling hundreds of cycles wide that is a fraction of a per cent of
 * distortion, invisible in either layer; opposed between the two it is the
 * entire curvature of the interference figure.
 */
float phaseOf(vec2 q, vec4 layer, vec4 warp) {
  vec2 e = vec2(layer.x * q.x + layer.y * q.y, layer.x * q.y - layer.y * q.x);
  vec2 n = e / uHalf;
  return e.x * layer.z + layer.w
       + warp.x * n.x * n.x + warp.y * n.y * n.y + warp.z * n.x * n.y;
}

/**
 * Amplitude actually carried by a component whose phase gradient is g cycles
 * per physical pixel. Zero above the sampling limit — that taper is the whole
 * anti-aliasing argument — and it gains the low-frequency figure over the fine
 * ruling, which is linear and so introduces nothing.
 *
 * Everything is done on the squared frequency: it saves a square root per
 * component, of which there are dozens per pixel, and the shape of a taper that
 * is flat at the bottom and exactly zero at the top is a free choice anyway.
 */
float transfer(vec2 g) {
  float f2 = dot(g, g);
  if (f2 >= uWindow.y) return 0.0;
  float pass = 1.0 - smoothstep(uWindow.x, uWindow.y, f2);
  float gain = mix(uGain.x, uGain.y, smoothstep(uBand.x, uBand.y, f2));
  return pass * gain;
}

void main() {
  vec2 q = gl_FragCoord.xy / uDpr - 0.5 * uPlate;

  float pA = phaseOf(q, uLayerA, uWarpA);
  float pB = phaseOf(q, uLayerB, uWarpB);

  // Derivatives of the phase, not of anything discontinuous: an accurate local
  // frequency for every component below.
  vec2 gA = vec2(dFdx(pA), dFdy(pA));
  vec2 gB = vec2(dFdx(pB), dFdy(pB));

  float ca[MAX_TERMS], sa[MAX_TERMS], cb[MAX_TERMS], sb[MAX_TERMS];
  float order[MAX_TERMS];

  // Sine and cosine of every odd harmonic, from one pair per layer: stepping
  // two orders at a time is a rotation by twice the fundamental angle.
  float xa = TAU * pA;
  float xb = TAU * pB;
  float c1a = cos(xa), s1a = sin(xa);
  float c1b = cos(xb), s1b = sin(xb);
  float c2a = c1a * c1a - s1a * s1a, s2a = 2.0 * c1a * s1a;
  float c2b = c1b * c1b - s1b * s1b, s2b = 2.0 * c1b * s1b;

  order[0] = 0.0; ca[0] = 1.0; sa[0] = 0.0; cb[0] = 1.0; sb[0] = 0.0;
  order[1] = 1.0; ca[1] = c1a; sa[1] = s1a; cb[1] = c1b; sb[1] = s1b;
  for (int i = 2; i < MAX_TERMS; ++i) {
    order[i] = float(2 * i - 1);
    ca[i] = ca[i - 1] * c2a - sa[i - 1] * s2a;
    sa[i] = sa[i - 1] * c2a + ca[i - 1] * s2a;
    cb[i] = cb[i - 1] * c2b - sb[i - 1] * s2b;
    sb[i] = sb[i - 1] * c2b + cb[i - 1] * s2b;
  }

  // Each ruling on its own: harmonic k against the other layer's mean. The mean
  // of the product itself is dropped, since the exposure below is centred.
  float acc = 0.0;
  for (int i = 1; i <= uTerms; ++i) {
    float amp = uAmp[0] * uAmp[i];
    acc += amp * ca[i] * transfer(order[i] * gA);
    acc += amp * cb[i] * transfer(order[i] * gB);
  }

  // ...and every beat between them. cos(A - B) and cos(A + B) come from the
  // stored sines and cosines, which keeps the beat phase accurate even when it
  // is a thousandth of either carrier.
  for (int i = 1; i <= uTerms; ++i) {
    vec2 gradA = order[i] * gA;
    for (int j = 1; j <= uTerms; ++j) {
      vec2 gradB = order[j] * gB;
      float mixed = ca[i] * cb[j];
      float cross = sa[i] * sb[j];
      acc += 0.5 * uAmp[i] * uAmp[j]
           * ((mixed + cross) * transfer(gradA - gradB)
            + (mixed - cross) * transfer(gradA + gradB));
    }
  }

  // The plate is printed symmetrically about mid grey, and the shoulder is a
  // smooth S rather than a clamp. A hard clamp would sharpen every edge it
  // touched, which is precisely the frequency content the band limit removed;
  // this curve is the one nonlinearity in the pipeline and it stays gentle.
  float v = smoothstep(-1.0, 1.0, acc * uGain.z);
  fragColor = vec4(v, v, v, 1.0);
}
`;

/** Amplitudes of harmonics 0, 1, 3, 5, 7 of a square wave of the given duty. */
export function harmonicAmplitudes(duty: number): number[] {
  const amps = [duty];
  for (let i = 1; i < 5; i++) {
    const k = 2 * i - 1;
    amps.push((2 / (Math.PI * k)) * Math.sin(Math.PI * k * duty));
  }
  return amps;
}
