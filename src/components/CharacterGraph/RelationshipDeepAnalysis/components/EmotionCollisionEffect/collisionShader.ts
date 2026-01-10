/**
 * Emotion Collision Shader v3.1 - "Energy Beam Clash with Multi-Color"
 * 4f8553f 버전의 비주얼 이펙트(Energy Beam)와 현재의 3색 혼합 로직을 통합함.
 */

export const collisionVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const collisionFragmentShader = `
uniform float uTime;

// A→B (왼쪽에서 오른쪽)
uniform vec3 uColorA1;
uniform vec3 uColorA2;
uniform vec3 uColorA3;
uniform float uIntensityA1;
uniform float uIntensityA2;
uniform float uIntensityA3;
uniform float uStrengthA;

// B→A (오른쪽에서 왼쪽)
uniform vec3 uColorB1;
uniform vec3 uColorB2;
uniform vec3 uColorB3;
uniform float uIntensityB1;
uniform float uIntensityB2;
uniform float uIntensityB3;
uniform float uStrengthB;

uniform vec2 uResolution;

varying vec2 vUv;

// === Noise Functions (Simplex-like) ===
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
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

// Fractal Brownian Motion
float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    total += snoise(p * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total;
}

// 색상 혼합 (최신 3색 혼합 로직)
vec3 blendColors(vec3 c1, vec3 c2, vec3 c3, float i1, float i2, float i3) {
  float total = i1 + i2 + i3 + 0.001;
  return (c1 * i1 + c2 * i2 + c3 * i3) / total;
}

void main() {
  vec2 uv = vUv;
  float time = uTime;

  // 강도 정규화 (0-10 → 0-1)
  float strengthA = clamp(uStrengthA / 10.0, 0.0, 1.0);
  float strengthB = clamp(uStrengthB / 10.0, 0.0, 1.0);

  // === Domain Warping (유동적 연기 텍스처) ===
  vec2 q = vec2(0.0);
  q.x = fbm(uv + 0.3 * time);
  q.y = fbm(uv + vec2(1.0));

  vec2 r = vec2(0.0);
  r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.4 * time);
  r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.36 * time);

  float f = fbm(uv + r);

  // === Tug of War 밸런스 포인트 ===
  float totalStrength = strengthA + strengthB + 0.001;
  float balancePoint = strengthA / totalStrength;

  // 노이즈로 경계선 흔들림
  float mixNoise = snoise(uv * 4.0 + vec2(time * 0.8, 0.0));
  float edge = smoothstep(balancePoint - 0.2, balancePoint + 0.2, uv.x + mixNoise * 0.12);

  // === 양쪽 색상 계산 ===
  vec3 colorA = blendColors(uColorA1, uColorA2, uColorA3, uIntensityA1, uIntensityA2, uIntensityA3);
  vec3 colorB = blendColors(uColorB1, uColorB2, uColorB3, uIntensityB1, uIntensityB2, uIntensityB3);

  // 텍스처 깊이감 추가
  colorA *= (1.0 + f * 0.4);
  colorB *= (1.0 + f * 0.4);

  // === 중앙 충돌 발광 효과 (Energy Flash) ===
  float glow = 1.0 - abs((uv.x + mixNoise * 0.06) - balancePoint) * 3.5;
  glow = clamp(glow, 0.0, 1.0);
  glow = pow(glow, 2.5) * 1.2;

  // 시간에 따른 펄스 효과
  float pulse = 0.8 + 0.2 * sin(time * 4.0 + mixNoise * 3.0);
  glow *= pulse;

  // === 색상 혼합 ===
  vec3 mixedColor = mix(colorA, colorB, edge);

  // 충돌 지점 발광 (Additive Glow)
  vec3 glowColor = mix(colorA, colorB, 0.5); // 두 색상의 중간
  glowColor = mix(glowColor, vec3(1.0, 1.0, 0.95), 0.4); // 약간 흰색 섞어서 빛나게
  mixedColor += glowColor * glow * 0.8;

  // === 에너지 스트림 효과 ===
  // 왼쪽에서 오른쪽으로 흐르는 에너지
  float streamA = sin(uv.x * 8.0 - time * 8.0 + uv.y * 2.0) * 0.5 + 0.5;
  streamA *= smoothstep(0.0, balancePoint, uv.x) * smoothstep(balancePoint + 0.1, balancePoint - 0.1, uv.x);
  streamA *= strengthA;

  // 오른쪽에서 왼쪽으로 흐르는 에너지
  float streamB = sin(uv.x * 8.0 + time * 8.0 - uv.y * 2.0) * 0.5 + 0.5;
  streamB *= smoothstep(1.0, balancePoint, uv.x) * smoothstep(balancePoint - 0.1, balancePoint + 0.1, uv.x);
  streamB *= strengthB;

  mixedColor += colorA * streamA * 0.15;
  mixedColor += colorB * streamB * 0.15;

  // === Alpha 계산 ===
  // 기본 알파 (연기 텍스처 기반)
  float baseAlpha = 0.3 + f * 0.25;

  // 양쪽 강도에 따른 알파
  float sideAlphaA = smoothstep(0.0, 0.3, uv.x) * smoothstep(balancePoint + 0.3, balancePoint - 0.1, uv.x);
  float sideAlphaB = smoothstep(1.0, 0.7, uv.x) * smoothstep(balancePoint - 0.3, balancePoint + 0.1, uv.x);
  float sideAlpha = sideAlphaA * strengthA + sideAlphaB * strengthB;

  // 중앙 glow 알파
  float glowAlpha = glow * 0.6;

  float finalAlpha = baseAlpha * sideAlpha + glowAlpha;

  // 상하 가장자리 페이드
  float edgeFadeY = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
  finalAlpha *= edgeFadeY;

  // 알파 범위 (더 선명하게)
  finalAlpha = clamp(finalAlpha, 0.0, 0.85);

  // HDR 느낌의 밝기 부스트
  mixedColor = pow(mixedColor, vec3(0.9));

  gl_FragColor = vec4(mixedColor, finalAlpha);
}
`;
