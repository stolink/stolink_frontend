/**
 * InteractiveLightOverlay
 *
 * 버전 1: SVG 필터 기반 동적 광원 효과
 * 마우스 위치에 따라 미묘한 빛 반사를 생성합니다.
 *
 * 원리: SVG feSpecularLighting + fePointLight의 좌표를
 * 마우스 커서 위치와 연동하여 "살아있는 질감"을 연출합니다.
 */

import { useCallback, useRef, useState, useEffect } from "react";

interface InteractiveLightOverlayProps {
  /** 광원 효과를 적용할 영역의 ID (SVG 필터 참조용) */
  id?: string;
  /** 활성화 여부 */
  enabled?: boolean;
  /** 광원 색상 */
  lightColor?: string;
  /** 광원 강도 (0-1) */
  intensity?: number;
  /** 추가 클래스 */
  className?: string;
}

export function InteractiveLightOverlay({
  id = "interactive-light",
  enabled = true,
  lightColor = "#ffffff",
  intensity = 0.15,
  className = "",
}: InteractiveLightOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<SVGFEPointLightElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 마우스 이동 핸들러 (throttled via rAF)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!lightRef.current || !containerRef.current || !enabled) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 빛의 이동 범위를 제한하여 자연스러운 반사광 연출
      const boundedX = Math.max(0, Math.min(rect.width, x));
      const boundedY = Math.max(0, Math.min(rect.height, y));

      // requestAnimationFrame으로 성능 최적화
      requestAnimationFrame(() => {
        if (lightRef.current) {
          lightRef.current.setAttribute("x", String(boundedX));
          lightRef.current.setAttribute("y", String(boundedY));
        }
      });
    },
    [enabled]
  );

  // 호버 시에만 이벤트 리스너 활성화 (최적화)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    if (isHovered) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isHovered, handleMouseMove, enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ pointerEvents: "auto" }}
      aria-hidden="true"
    >
      {/* SVG Filter Definition */}
      <svg
        className="absolute w-0 h-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id={id} x="0%" y="0%" width="100%" height="100%">
            {/* 표면 질감 생성 */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            {/* 광원 효과 */}
            <feSpecularLighting
              in="noise"
              surfaceScale="2"
              specularConstant="0.8"
              specularExponent="20"
              lightingColor={lightColor}
              result="specular"
            >
              <fePointLight ref={lightRef} x="50%" y="50%" z="200" />
            </feSpecularLighting>
            {/* 합성 */}
            <feComposite
              in="specular"
              in2="SourceAlpha"
              operator="in"
              result="specular-masked"
            />
          </filter>
        </defs>
      </svg>

      {/* 광원 효과 레이어 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          filter: `url(#${id})`,
          opacity: isHovered ? intensity : intensity * 0.3,
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}

export default InteractiveLightOverlay;
