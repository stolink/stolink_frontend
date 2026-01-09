/**
 * Mood Background Shader
 * 부드럽게 흐르는 오로라/구름 같은 몽환적인 배경 쉐이더
 */

export const moodVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const moodFragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uAmbient;
uniform float uIntensity;

varying vec2 vUv;

// === Noise Functions ===
// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    // Octaves
    for (int i = 0; i < 4; i++) {
        total += snoise(p * frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return total;
}

void main() {
    vec2 uv = vUv;
    float time = uTime * 0.15; // 느리게 흐르도록

    // 1. 유동적인 좌표 왜곡 (Domain Warping)
    vec2 q = vec2(0.0);
    q.x = fbm(uv + 0.1 * time);
    q.y = fbm(uv + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);

    float f = fbm(uv + r);

    // 2. 색상 혼합 메커니즘
    // uColor1과 uColor2를 노이즈 값(f)에 따라 믹스
    vec3 colorMix = mix(uColor1, uColor2, clamp(f * f * 4.0, 0.0, 1.0));

    // uAmbient 색상을 배경으로 깔고 위에서 믹스
    vec3 finalColor = mix(uAmbient, colorMix, f);

    // 3. 비네팅 및 부드러운 하이라이트
    float vignette = 1.0 - distance(uv, vec2(0.5));
    finalColor *= (0.8 + 0.4 * vignette);

    // 4. 전체적인 강도 조절 (너무 진하지 않게)
    // 파스텔 톤 유지를 위해 흰색과 살짝 믹스
    finalColor = mix(finalColor, vec3(1.0), 0.1);

    // 강도 적용
    finalColor *= (0.9 + 0.1 * uIntensity);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
