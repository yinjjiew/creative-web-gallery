/**
 * Charmeuse is a satin: long weft floats, almost no texture, a travelling
 * highlight that follows the fold rather than the light. The reverse is dull.
 * Lighting and the mesh are the same description — valleys go dark because
 * the normal turns, not because a texture says so.
 */

export const vertexShader = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec2 vUv;

attribute vec3 aTangent;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vTangent = normalize(mat3(modelMatrix) * aTangent);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const fragmentShader = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec2 vUv;

uniform vec3 uColor;
uniform vec3 uBack;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uAmbient;
uniform vec3 uCamera;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamera - vWorld);
  float facing = dot(N, V);
  bool back = facing < 0.0;
  if (back) N = -N;

  vec3 T = normalize(vTangent - N * dot(N, vTangent));
  vec3 B = normalize(cross(N, T));
  vec3 L = normalize(uLightDir);
  vec3 F = normalize(uFillDir);

  float wrap = clamp((dot(N, L) + 0.38) / 1.38, 0.0, 1.0);
  float fill = clamp((dot(N, F) + 0.22) / 1.22, 0.0, 1.0);

  // Vertical folds turn the normal in x; those valleys are where silk goes dark.
  float valley = pow(abs(N.x), 1.35);
  vec3 albedo = mix(uColor, uBack, back ? 0.72 : 0.0);
  albedo *= 1.0 - 0.44 * valley;

  // Satin floats: a whisper of weft, never a grid.
  float satin = 0.992 + 0.008 * sin(vUv.y * 140.0);
  albedo *= satin;

  float selvedge = smoothstep(0.018, 0.0, vUv.x) + smoothstep(0.982, 1.0, vUv.x);
  albedo *= 1.0 - 0.1 * selvedge;

  vec3 H = normalize(L + V);
  float weft = pow(max(1.0 - dot(T, H) * dot(T, H), 0.0), 52.0);
  float warp = pow(max(1.0 - dot(B, H) * dot(B, H), 0.0), 90.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);

  vec3 spec = uLightColor * (weft * 0.62 + warp * 0.22 + fres * 0.16);
  spec += vec3(0.14, 0.1, 0.05) * weft;

  vec3 col = albedo * (uAmbient + uLightColor * wrap * 0.88 + uFillColor * fill * 0.32);
  col += spec * (back ? 0.22 : 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;
