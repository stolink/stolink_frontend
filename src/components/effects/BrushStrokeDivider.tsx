/**
 * BrushStrokeDivider
 *
 * 버전 4: SVG Path 기반 붓터치 구분선
 * 이미지 없이 벡터로 구현되어 무한 확장 가능합니다.
 */

// import { cn } from "@/lib/utils";

interface BrushStrokeDividerProps {
  /** 색상 */
  color?: string;
  /** 추가 클래스 */
  className?: string;
  /** 높이 (기본 24px) */
  height?: number;
  /** 불투명도 */
  opacity?: number;
}

export function BrushStrokeDivider({
  color = "#2D2A28",
  className,
  height = 24,
  opacity = 0.15,
}: BrushStrokeDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden ${className || ""}`}
      style={{ height }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id="brush-texture"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        {/* 메인 붓터치 스트로크 */}
        <path
          d="M-20,30
             C50,15 100,45 200,28
             S350,35 450,25
             S600,40 750,30
             S900,20 1000,32
             S1150,25 1220,30"
          fill="none"
          stroke={color}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
          filter="url(#brush-texture)"
        />
        {/* 보조 스트로크 (깊이감) */}
        <path
          d="M-10,32
             C60,20 120,40 220,30
             S380,38 480,28
             S630,42 780,32
             S920,22 1020,34
             S1160,28 1210,32"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          opacity={opacity * 0.6}
          filter="url(#brush-texture)"
        />
      </svg>
    </div>
  );
}

export default BrushStrokeDivider;
