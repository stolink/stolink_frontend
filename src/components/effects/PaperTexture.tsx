/**
 * PaperTexture
 *
 * 버전 4: SVG 프로시저럴 노이즈 기반 종이 질감
 * 이미지 없이 무한 확장 가능한 순수 SVG 텍스처입니다.
 */

import { cn } from "@/lib/utils";

interface PaperTextureProps {
  /** 불투명도 (0-1) */
  opacity?: number;
  /** 추가 클래스 */
  className?: string;
  /** 노이즈 강도 (baseFrequency) */
  intensity?: number;
}

export function PaperTexture({
  opacity = 0.08,
  className,
  intensity = 0.04,
}: PaperTextureProps) {
  const svgId = `paper-noise-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none z-0", className)}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={svgId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={intensity}
              numOctaves={5}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="mono"
            />
            <feComponentTransfer in="mono" result="final">
              <feFuncA type="linear" slope={opacity * 3} intercept={0} />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter={`url(#${svgId})`}
          style={{ mixBlendMode: "multiply" }}
        />
      </svg>
    </div>
  );
}

export default PaperTexture;
