/**
 * 수묵화 스타일 SVG 필터
 */

export function InkWashFilters() {
  return (
    <defs>
      {/* 1. 메인 수묵화 효과 - 가지/줄기용 (번짐 효과) */}
      <filter id="ink-wash" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.03"
          numOctaves="3"
          result="noise"
          seed={42}
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* 2. 갈필(Dry Brush) 효과 - 얇은 가지용 */}
      <filter id="dry-brush" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="turbulence"
          baseFrequency="0.06"
          numOctaves="2"
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        <feGaussianBlur stdDeviation="0.2" />
      </filter>

      {/* 3. 열매(노드) 그림자 - 은은한 먹 번짐 */}
      <filter id="ink-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
        <feFlood floodColor="#3D302A" floodOpacity="0.12" />
        <feComposite in2="blur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* 4. 노드 호버 효과 - 부드러운 글로우 */}
      <filter id="ink-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
        <feFlood floodColor="#A47764" floodOpacity="0.3" />
        <feComposite in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* 5. 먹 농담 그라데이션 - 줄기/가지 */}
      <linearGradient id="ink-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3D302A" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#5C4940" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#7D5A4B" stopOpacity="0.5" />
      </linearGradient>

      {/* 6. 가지 끝 페이드 */}
      <linearGradient id="branch-fade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3D302A" stopOpacity="0.7" />
        <stop offset="60%" stopColor="#5C4940" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#7D5A4B" stopOpacity="0.2" />
      </linearGradient>

      {/* 7. 종이 질감 배경 패턴 */}
      <pattern
        id="paper-texture"
        patternUnits="userSpaceOnUse"
        width="100"
        height="100"
      >
        <filter id="paper-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100"
          height="100"
          fill="#F1F0EC"
          filter="url(#paper-noise)"
          opacity="0.04"
        />
      </pattern>

      {/* 8. 수평 여백 마스크 (양 끝 페이드) */}
      {/* 8. 수평 여백 마스크 (양 끝 페이드) */}
      <linearGradient id="edge-fade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="5%" stopColor="white" stopOpacity="1" />
        <stop offset="95%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* 9. 줄기용 그라데이션 (진한 먹 -> 흐린 먹) */}
      <linearGradient id="ink-gradient-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2A201C" stopOpacity="0.95" />
        <stop offset="30%" stopColor="#3D302A" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#5C4940" stopOpacity="0.6" />
      </linearGradient>

      {/* 10. 강한 수묵 번짐 효과 (줄기용) */}
      <filter id="ink-wash-heavy" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="4"
          result="noise"
          seed={100}
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="6"
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feGaussianBlur stdDeviation="0.5" />
      </filter>

      {/* 11. 갈필 패턴 (Dry Brush Texture) */}
      <pattern
        id="dry-brush-pattern"
        patternUnits="userSpaceOnUse"
        width="200"
        height="200"
      >
        <image
          href="data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E"
          width="200"
          height="200"
        />
      </pattern>

      {/* 12. 트렁크 그라데이션 (유기적인 나무 색상) */}
      <linearGradient id="trunk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2A1F1A" stopOpacity="0.95" />
        <stop offset="20%" stopColor="#3D302A" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#4A3D35" stopOpacity="0.85" />
        <stop offset="80%" stopColor="#5C4940" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#6B5548" stopOpacity="0.65" />
      </linearGradient>

      {/* 13. 가지 그라데이션 (트렁크에서 끝으로 페이드) */}
      <linearGradient id="branch-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3D302A" stopOpacity="0.85" />
        <stop offset="30%" stopColor="#5C4940" stopOpacity="0.7" />
        <stop offset="70%" stopColor="#7D5A4B" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#9D7A6B" stopOpacity="0.3" />
      </linearGradient>

      {/* 14. 나무 껍질 텍스처 패턴 */}
      <pattern
        id="bark-texture"
        patternUnits="userSpaceOnUse"
        width="60"
        height="60"
      >
        <rect width="60" height="60" fill="#3D302A" fillOpacity="0.1" />
        <line
          x1="0"
          y1="10"
          x2="60"
          y2="12"
          stroke="#2A1F1A"
          strokeWidth="1"
          strokeOpacity="0.15"
        />
        <line
          x1="0"
          y1="25"
          x2="60"
          y2="23"
          stroke="#2A1F1A"
          strokeWidth="0.5"
          strokeOpacity="0.1"
        />
        <line
          x1="0"
          y1="40"
          x2="60"
          y2="42"
          stroke="#2A1F1A"
          strokeWidth="1"
          strokeOpacity="0.12"
        />
        <line
          x1="0"
          y1="55"
          x2="60"
          y2="53"
          stroke="#2A1F1A"
          strokeWidth="0.5"
          strokeOpacity="0.08"
        />
      </pattern>
    </defs>
  );
}
