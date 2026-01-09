// src/components/CharacterGraph/RelationshipDeepAnalysis/components/EmotionCollisionEffect/collisionShader.ts

import \* as THREE from "three";

export const collisionVertexShader = `  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelMatrix * vec4(position, 1.0);
  }`;

export const collisionFragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uStrength1; // 0.0 ~ 10.0
uniform float uStrength2; // 0.0 ~ 10.0
uniform vec2 uResolution;

varying vec2 vUv;

// --- [Noise Functions from your Blob Vertex Shader] ---
vec3 mod289(vec3 x) { return x - floor(x _ (1.0 / 289.0)) _ 289.0; }
vec2 mod289(vec2 x) { return x - floor(x _ (1.0 / 289.0)) _ 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
const vec4 C = vec4(0.211324865405187, // (3.0-sqrt(3.0))/6.0
0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
-0.577350269189626, // -1.0 + 2.0 * C.x
0.024390243902439); // 1.0 / 41.0
vec2 i = floor(v + dot(v, C.yy) );
vec2 x0 = v - i + dot(i, C.xx);
vec2 i1;
i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
vec4 x12 = x0.xyxy + C.xxzz;
x12.xy -= i1;
i = mod289(i);
vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
m = m*m ;
m = m*m ;
vec3 x = 2.0 _ fract(p _ C.www) - 1.0;
vec3 h = abs(x) - 0.5;
vec3 ox = floor(x + 0.5);
vec3 a0 = x - ox;
m _= 1.79284291400159 - 0.85373472095314 _ ( a0*a0 + h*h );
vec3 g;
g.x = a0.x _ x0.x + h.x _ x0.y;
g.yz = a0.yz _ x12.xz + h.yz _ x12.yw;
return 130.0 \* dot(m, g);
}

// Fractal Brownian Motion (Cloud texture)
float fbm(vec2 p) {
float total = 0.0;
float amplitude = 0.5;
float frequency = 1.0;
for (int i = 0; i < 5; i++) {
total += snoise(p _ frequency) _ amplitude;
amplitude _= 0.5;
frequency _= 2.0;
}
return total;
}

void main() {
// Normalize coordinates
vec2 uv = vUv;

    // 1. Dynamic Flow (Domain Warping)
    // 연기가 흐르는 듯한 유동적인 좌표 변형
    vec2 q = vec2(0.);
    q.x = fbm(uv + 0.1 * uTime);
    q.y = fbm(uv + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

    float f = fbm(uv + r); // 최종 노이즈 텍스처

    // 2. Collision Logic (Tug of War)
    // 강도 비율에 따라 중앙 경계선 이동 (5:5면 0.5, 7:3이면 0.7 지점)
    float totalStrength = uStrength1 + uStrength2 + 0.001;
    float balancePoint = uStrength1 / totalStrength;

    // 중앙에서의 혼합을 부드럽게 만들기 위해 노이즈(f)를 섞음
    // uv.x가 balancePoint에 가까울수록 turbulent하게 섞임
    float mixNoise = snoise(uv * 4.0 + vec2(uTime * 0.5, 0.0));
    float edge = smoothstep(balancePoint - 0.15, balancePoint + 0.15, uv.x + mixNoise * 0.1);

    // 3. Color Mixing
    // 단순 mix가 아니라 노이즈 패턴에 따라 색상이 섞임 (Energy Beam 느낌)
    vec3 col1 = uColor1 * (1.0 + f * 0.5); // 텍스처 깊이감 추가
    vec3 col2 = uColor2 * (1.0 + f * 0.5);

    // 중앙 충돌 지점의 발광 효과 (Energy Flash)
    float glow = 1.0 - abs((uv.x + mixNoise * 0.05) - balancePoint) * 4.0;
    glow = clamp(glow, 0.0, 1.0);
    glow = pow(glow, 3.0) * 0.8; // 중앙일수록 강하게 발광

    vec3 mixedColor = mix(col1, col2, edge);

    // Additive mixing for glow (충돌 에너지가 빛나는 느낌)
    mixedColor += vec3(1.0, 1.0, 0.9) * glow;

    // 4. Alpha Masking (가장자리를 부드럽게)
    float alphaX = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
    float alphaY = smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.6, uv.y);
    float alpha = alphaX * alphaY * 0.9;

    gl_FragColor = vec4(mixedColor, alpha);

}
`;
`;

### 2. R3F 컴포넌트 (EmotionCollisionEffect)

`Blob.tsx`의 구조를 따라가되, PlaneGeometry를 사용하여 배경으로 깔아줍니다. `hexToRgb` 등의 유틸리티를 내부에서 처리하여 사용성을 높였습니다.

```tsx
// src/components/CharacterGraph/RelationshipDeepAnalysis/components/EmotionCollisionEffect/index.tsx

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  collisionVertexShader,
  collisionFragmentShader,
} from "./collisionShader";

interface EmotionCollisionEffectProps {
  sourceColor: string;
  targetColor: string;
  sourceStrength: number;
  targetStrength: number;
  className?: string;
}

const CollisionMesh = ({
  sourceColor,
  targetColor,
  sourceStrength,
  targetStrength,
}: Omit<EmotionCollisionEffectProps, "className">) => {
  const mesh = useRef<THREE.Mesh>(null);

  // 색상 변환 (HEX -> RGB Normalized)
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(sourceColor) },
      uColor2: { value: new THREE.Color(targetColor) },
      uStrength1: { value: sourceStrength },
      uStrength2: { value: targetStrength },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
  }, [sourceColor, targetColor, sourceStrength, targetStrength]);

  useFrame((state) => {
    if (mesh.current) {
      // 시간 업데이트 (부드러운 흐름)
      (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value =
        state.clock.getElapsedTime();

      // 강도값 부드러운 보간 (Lerp) - 수치가 팍팍 튀지 않게
      const currentS1 = (mesh.current.material as THREE.ShaderMaterial).uniforms
        .uStrength1.value;
      const currentS2 = (mesh.current.material as THREE.ShaderMaterial).uniforms
        .uStrength2.value;

      (
        mesh.current.material as THREE.ShaderMaterial
      ).uniforms.uStrength1.value = THREE.MathUtils.lerp(
        currentS1,
        sourceStrength,
        0.05,
      );
      (
        mesh.current.material as THREE.ShaderMaterial
      ).uniforms.uStrength2.value = THREE.MathUtils.lerp(
        currentS2,
        targetStrength,
        0.05,
      );
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]} scale={[1, 1, 1]}>
      {/* 화면 전체를 덮는 Plane */}
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        vertexShader={collisionVertexShader}
        fragmentShader={collisionFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending} // 빛나는 효과를 위해 Additive Blending 사용
        depthWrite={false}
      />
    </mesh>
  );
};

const EmotionCollisionEffect: React.FC<EmotionCollisionEffectProps> = (
  props,
) => {
  return (
    <div className={props.className}>
      <Canvas
        camera={{ position: [0, 0, 2], isOrthographicCamera: true, zoom: 100 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]} // 고해상도 지원
      >
        <CollisionMesh {...props} />
      </Canvas>
    </div>
  );
};

export default EmotionCollisionEffect;
```
