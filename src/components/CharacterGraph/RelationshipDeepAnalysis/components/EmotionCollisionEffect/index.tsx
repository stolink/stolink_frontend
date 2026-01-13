import { useRef, useMemo, useEffect, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import {
  collisionVertexShader,
  collisionFragmentShader,
} from "./collisionShader";
import type { StrengthFactor } from "@/types/relationshipAnalysis";
import isEqual from "lodash-es/isEqual";

/**
 * 관계 타입별 색상 매핑
 */
const RELATION_TYPE_COLORS: Record<string, string> = {
  // Friendly - Premium Darker Tones
  friend: "#15803D", // Green 700 (Original)
  ally: "#059669", // Emerald 600 (Distinct from Friend)
  alliance: "#059669",
  우호: "#15803D",
  친구: "#15803D",
  동료: "#0891B2", // Cyan 600
  coworker: "#0891B2",

  // Hostile - Premium Darker Tones
  hostile: "#E11D48", // Rose 600
  enemy: "#9F1239", // Rose 800 (Deep)
  적대: "#E11D48",
  원수: "#9F1239",
  rival: "#D97706", // Amber 600
  라이벌: "#D97706",

  // Romantic
  romantic: "#DB2777", // Pink 600
  lover: "#DB2777",
  연인: "#DB2777",
  사랑: "#DB2777",
  애정: "#DB2777",

  // Family/Mentor
  family: "#4F5861", // Slate-ish
  mentor: "#7C3AED", // Violet 600
  가족: "#4F5861",
  멘토: "#7C3AED",
  스승: "#7C3AED",

  // Neutral
  neutral: "#9CA3AF",
  중립: "#9CA3AF",

  // Complex
  complex: "#7C3AED",
  복합: "#7C3AED",
};

/**
 * 관계 타입에서 색상 추출
 */
function getColorForType(type: string): string {
  if (!type) return "#A47764";
  const normalized = type.toLowerCase();

  // 1. Direct match check
  if (RELATION_TYPE_COLORS[normalized]) {
    return RELATION_TYPE_COLORS[normalized];
  }

  // 2. Contains check (Iterate keys)
  for (const key in RELATION_TYPE_COLORS) {
    if (normalized.includes(key)) {
      return RELATION_TYPE_COLORS[key];
    }
  }

  // 3. Fallback for known prefixes not in map
  if (normalized.includes("partner")) return "#06B6D4"; // Coworker-like
  if (normalized.includes("student") || normalized.includes("pupil"))
    return "#8B5CF6"; // Mentor-like

  return "#A47764"; // Default mocha
}

/**
 * factors에서 상위 3개 색상과 강도 추출
 */
function extractColorData(factors: StrengthFactor[] | undefined | null): {
  colors: [string, string, string];
  intensities: [number, number, number];
} {
  // factors가 없거나 배열이 아닌 경우 기본값 반환
  const safeFactors = Array.isArray(factors) ? factors : [];
  // 점수 기준 정렬 후 상위 3개
  const sorted = [...safeFactors].sort((a, b) => b.score - a.score).slice(0, 3);

  const colors: [string, string, string] = [
    sorted[0] ? getColorForType(sorted[0].type) : "#A47764",
    sorted[1] ? getColorForType(sorted[1].type) : "#A47764",
    sorted[2] ? getColorForType(sorted[2].type) : "#A47764",
  ];

  const intensities: [number, number, number] = [
    sorted[0]?.score ?? 0,
    sorted[1]?.score ?? 0,
    sorted[2]?.score ?? 0,
  ];

  return { colors, intensities };
}

interface EmotionCollisionEffectProps {
  /** A→B 관계 factors */
  factorsA?: StrengthFactor[];
  /** B→A 관계 factors */
  factorsB?: StrengthFactor[];
  /** A→B 전체 강도 (0-10) */
  strengthA: number;
  /** B→A 전체 강도 (0-10) */
  strengthB: number;
  className?: string;
}

interface CollisionMeshProps {
  factorsA?: StrengthFactor[];
  factorsB?: StrengthFactor[];
  strengthA: number;
  strengthB: number;
}

/**
 * HEX 색상을 THREE.Color로 변환
 */
function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * 연기 충돌 이펙트 메시
 */
function CollisionMesh({
  factorsA,
  factorsB,
  strengthA,
  strengthB,
}: CollisionMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // 색상 데이터 추출 (Memoized to prevent recalc)
  const colorDataA = useMemo(() => extractColorData(factorsA), [factorsA]);

  const colorDataB = useMemo(() => extractColorData(factorsB), [factorsB]);

  // 유니폼 초기값
  // Debug logs
  // Debug logs removed for performance

  // 유니폼 초기값 (Stable ref to prevent re-creation and jumpy uTime)
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uColorA1: { value: hexToThreeColor(colorDataA.colors[0]) },
    uColorA2: { value: hexToThreeColor(colorDataA.colors[1]) },
    uColorA3: { value: hexToThreeColor(colorDataA.colors[2]) },
    uIntensityA1: { value: colorDataA.intensities[0] },
    uIntensityA2: { value: colorDataA.intensities[1] },
    uIntensityA3: { value: colorDataA.intensities[2] },
    uStrengthA: { value: strengthA },
    uColorB1: { value: hexToThreeColor(colorDataB.colors[0]) },
    uColorB2: { value: hexToThreeColor(colorDataB.colors[1]) },
    uColorB3: { value: hexToThreeColor(colorDataB.colors[2]) },
    uIntensityB1: { value: colorDataB.intensities[0] },
    uIntensityB2: { value: colorDataB.intensities[1] },
    uIntensityB3: { value: colorDataB.intensities[2] },
    uStrengthB: { value: strengthB },
    uResolution: {
      value: new THREE.Vector2(viewport.width, viewport.height),
    },
  });

  // Props 변경 시 유니폼 지속 업데이트
  useEffect(() => {
    // materialRef.current.uniforms를 직접 참조하여 실제 셰이더 상태 업데이트
    const material = materialRef.current;
    if (!material || !material.uniforms) return;

    const uniforms = material.uniforms;

    if (uniforms.uColorA1) uniforms.uColorA1.value.set(colorDataA.colors[0]);
    if (uniforms.uColorA2) uniforms.uColorA2.value.set(colorDataA.colors[1]);
    if (uniforms.uColorA3) uniforms.uColorA3.value.set(colorDataA.colors[2]);
    if (uniforms.uIntensityA1)
      uniforms.uIntensityA1.value = colorDataA.intensities[0];
    if (uniforms.uIntensityA2)
      uniforms.uIntensityA2.value = colorDataA.intensities[1];
    if (uniforms.uIntensityA3)
      uniforms.uIntensityA3.value = colorDataA.intensities[2];

    if (uniforms.uColorB1) uniforms.uColorB1.value.set(colorDataB.colors[0]);
    if (uniforms.uColorB2) uniforms.uColorB2.value.set(colorDataB.colors[1]);
    if (uniforms.uColorB3) uniforms.uColorB3.value.set(colorDataB.colors[2]);
    if (uniforms.uIntensityB1)
      uniforms.uIntensityB1.value = colorDataB.intensities[0];
    if (uniforms.uIntensityB2)
      uniforms.uIntensityB2.value = colorDataB.intensities[1];
    if (uniforms.uIntensityB3)
      uniforms.uIntensityB3.value = colorDataB.intensities[2];
  }, [colorDataA, colorDataB]);

  // 애니메이션 프레임
  useFrame((state) => {
    const material = materialRef.current;
    if (!material || !material.uniforms) return;

    const uniforms = material.uniforms;

    // 시간 업데이트 (getElapsedTime 사용으로 연속성 보장)
    if (uniforms.uTime) uniforms.uTime.value = state.clock.getElapsedTime();

    // 강도 부드럽게 전환 (lerp)
    if (uniforms.uStrengthA) {
      uniforms.uStrengthA.value = THREE.MathUtils.lerp(
        uniforms.uStrengthA.value,
        strengthA,
        0.05,
      );
    }
    if (uniforms.uStrengthB) {
      uniforms.uStrengthB.value = THREE.MathUtils.lerp(
        uniforms.uStrengthB.value,
        strengthB,
        0.05,
      );
    }

    // 해상도 업데이트
    if (uniforms.uResolution) {
      uniforms.uResolution.value.set(viewport.width, viewport.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={collisionVertexShader}
        fragmentShader={collisionFragmentShader}
        // eslint-disable-next-line
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * 두 캐릭터 감정이 중앙 벽에서 반사되며 맴도는 연기 충돌 이펙트
 * Memoized to prevent re-renders unless data actually changes
 */
export const EmotionCollisionEffect = memo(
  function EmotionCollisionEffect({
    factorsA,
    factorsB,
    strengthA,
    strengthB,
    className,
  }: EmotionCollisionEffectProps) {
    return (
      <div className={cn("w-full h-full pointer-events-none", className)}>
        <Canvas
          frameloop="always"
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            depth: false,
            stencil: false,
          }}
          camera={{ position: [0, 0, 1], fov: 75 }}
          style={{ background: "transparent" }}
          dpr={Math.min(window.devicePixelRatio, 2)}
        >
          <CollisionMesh
            factorsA={factorsA}
            factorsB={factorsB}
            strengthA={strengthA}
            strengthB={strengthB}
          />
        </Canvas>
      </div>
    );
  },
  (prev, next) => {
    // Custom comparison function for React.memo
    // Primitives check
    if (
      prev.strengthA !== next.strengthA ||
      prev.strengthB !== next.strengthB ||
      prev.className !== next.className
    ) {
      return false;
    }

    // Deep comparison for arrays to avoid re-render on new references with same data
    return (
      isEqual(prev.factorsA, next.factorsA) &&
      isEqual(prev.factorsB, next.factorsB)
    );
  },
);

export default EmotionCollisionEffect;
