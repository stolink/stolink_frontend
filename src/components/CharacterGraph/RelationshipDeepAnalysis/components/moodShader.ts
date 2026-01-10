/**
 * Mood Background Shader v2 - "Ethereal Aurora"
 * 부드럽게 흐르는 오로라/구름 같은 몽환적인 배경 쉐이더
 *
 * === Visual Features ===
 * - Domain Warping: 유동적인 연기/구름 텍스처
 * - Multi-layer Aurora: 여러 레이어의 오로라 효과
 * - Soft Color Blending: 관계 타입에 따른 부드러운 색상 혼합
 * - Organic Motion: 자연스러운 움직임
 *
 * === Performance Optimizations ===
 * - Precision qualifiers for mobile compatibility
 * - Time calculations in vertex shader
 * - Optimized 3-octave FBM
 *
 * @see https://tonisagrista.com/blog/2024/rendering-aurorae-nebulae/
 */

export const moodVertexShader = `
uniform float uTime;

varying vec2 vUv;
varying float vTimeOffset1;
varying float vTimeOffset2;
varying float vPulse;

void main() {
  vUv = uv;

  float time = uTime;
  vTimeOffset1 = time * 0.12;
  vTimeOffset2 = time * 0.08;

  // Gentle organic pulse
  vPulse = 0.92 + 0.08 * sin(time * 1.5);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const moodFragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uAmbient;
uniform float uIntensity;

varying vec2 vUv;
varying float vTimeOffset1;
varying float vTimeOffset2;
varying float vPulse;

// === Noise Functions ===
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = step(x0.yx, x0.xy);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m * m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 3-octave FBM
float fbm(vec2 p) {
  return snoise(p) * 0.5 + snoise(p * 2.0) * 0.25 + snoise(p * 4.0) * 0.125;
}

// Aurora vertical streak effect
float auroraLayer(vec2 uv, float time, float speed, float frequency) {
  float streak = sin(uv.x * frequency + time * speed) * 0.5 + 0.5;

  // Vertical gradient (stronger at top)
  float verticalGrad = smoothstep(0.0, 0.7, uv.y) * smoothstep(1.0, 0.5, uv.y);

  // Add noise variation
  float noiseVar = fbm(uv * 3.0 + vec2(time * 0.2, 0.0)) * 0.3 + 0.7;

  return streak * verticalGrad * noiseVar;
}

void main() {
  vec2 uv = vUv;

  // === Domain Warping for organic flow ===
  vec2 q = vec2(
    fbm(uv + vTimeOffset1),
    fbm(uv + vec2(1.0, 0.0))
  );

  vec2 r = vec2(
    fbm(uv + q + vec2(1.7, 9.2) + vTimeOffset2),
    fbm(uv + q + vec2(8.3, 2.8) + vTimeOffset2 * 0.85)
  );

  float f = fbm(uv + r * 0.7);

  // === Multi-layer Aurora Effect ===
  float aurora1 = auroraLayer(uv, vTimeOffset1 * 8.0, 1.5, 8.0);
  float aurora2 = auroraLayer(uv + vec2(0.3, 0.0), vTimeOffset1 * 6.0, -1.2, 12.0);
  float aurora3 = auroraLayer(uv + vec2(0.6, 0.0), vTimeOffset1 * 10.0, 1.8, 6.0);

  float auroraTotal = aurora1 * 0.5 + aurora2 * 0.3 + aurora3 * 0.2;

  // === Color Mixing ===
  // Base gradient from domain warping
  float colorMix = clamp(f * f * 4.0, 0.0, 1.0);
  vec3 baseColor = mix(uColor1, uColor2, colorMix);

  // Blend with ambient
  baseColor = mix(uAmbient, baseColor, 0.6 + f * 0.4);

  // Add aurora color (brighter version of base)
  vec3 auroraColor = mix(uColor1, uColor2, 0.5);
  auroraColor = mix(auroraColor, vec3(1.0), 0.3); // Brighten
  baseColor += auroraColor * auroraTotal * 0.35;

  // === Vignette Effect ===
  float vignette = 1.0 - length(uv - 0.5) * 0.4;
  baseColor *= vignette;

  // === Soft Highlights ===
  float highlight = pow(f, 2.0) * 0.15;
  baseColor += vec3(1.0) * highlight;

  // === Intensity & Pulse ===
  baseColor *= (0.85 + 0.15 * uIntensity);
  baseColor *= vPulse;

  // Mix with white for soft pastel look
  baseColor = mix(baseColor, vec3(1.0), 0.15);

  // Clamp final color
  baseColor = clamp(baseColor, 0.0, 1.0);

  gl_FragColor = vec4(baseColor, 1.0);
}
`;
