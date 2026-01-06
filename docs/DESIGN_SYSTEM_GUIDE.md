# StoLink Design System Guide: Terminal Pivot

> **"Stories are text data."**
> This guide defines the Monospace-centric design system for StoLink, focusing on IDE-like immersion and content structure.

---

## 1. Core Philosophy

### Minimalist Engineering

We reject traditional decorative typography in favor of **Monospace All-in-One**. The workspace should feel like a professional IDE (VS Code, JetBrains), where the writer is an engineer of their story.

### Content as Data

Typography is a tool for structure, not just aesthetics. We prioritize perfect alignment, fixed character widths, and clear hierarchy.

---

## 2. Typography: The Monospace Mandate

StoLink uses **Strict Monospace** across all UI and content.

### Main Font Stack

- **English/Numbers**: `JetBrains Mono`
- **Korean**: `D2Coding`
- **Fallback**: `Menlo`, `Monaco`, `Consolas`, `monospace`

### Scale & Spacing (Hacker Style)

- **Global `line-height`**: `1.8` (equivalent to `leading-relaxed`) to ensure readability despite the dense monospace feel.
- **UI Labels**: `11px` - `13px` (Small and precise).
- **Body Content**: `16px` - `18px`.
- **Headings**: Use weights (700+) and subtle size increases, keeping the monospace grid intact.

---

## 3. Color Palette: Terminal Immersion

We favor **Deep Dark** surfaces and code-like highlights.

### Midnight Base

- **Midnight 900**: `#0A0A0A` (Main Background)
- **Midnight 800**: `#121212` (Cards / Panels)
- **Midnight 700**: `#1A1A1A` (Borders / Inputs)

### Accent (Mocha Legacy)

- **Mocha Code**: `#A68C72` (Primary Branding / Focus)
- **Mocha Dim**: `rgba(166, 140, 114, 0.2)` (Highlights / Glassmorphism)

---

## 4. Components in Action

### Terminal Toolbar

```tsx
// All UI uses font-mono
<div className="font-mono text-[11px] tracking-tight truncate">
  main.story.chapter_01
</div>
```

### IDE Sidebar

- **Sharp Edges**: Move away from `rounded-2xl` to `rounded-md` or `rounded-none`.
- **Grid Alignment**: Ensure all icons and labels are perfectly aligned on the monospace grid.

---

## 5. Anti-Patterns (The "Not Allowed")

- **Traditional Sans/Serif**: Any use of Pretendard, Inter, or Spectral is a violation of the Terminal Pivot.
- **Soft Rounding**: Avoid `rounded-full` or large border radii; use sharper, professional edges.
- **Floating Shadows**: Use subtle, structured borders instead of soft, large shadows.
- **호버 상태**: `hover:shadow-paper-hover transition-all duration-300`
  - 카드가 살짝 떠오르는 느낌.
- **플로팅/모달**: `shadow-paper-floating`
  - 가장 깊은 그림자. 시선을 집중시켜야 할 때 사용.

---

## ✨ 4. 글래스모피즘 (Glassmorphism)

사이드바나 툴바 등 레이어의 깊이가 필요한 곳에 사용합니다.

```tsx
// 툴바/사이드바 표준 패턴
<div className="bg-white/70 backdrop-blur-md border-r border-mocha-100/30">
```

- **원칙**: 과도한 사용은 지양하고, 배경과의 분리가 필요한 **오버레이 요소**에만 적용하세요.

---

## 🎞️ 5. 모션 및 인터랙션 (Motion)

StoLink의 UI는 살아있는 것처럼 느껴져야 합니다.

- **Framer Motion 활용**:
  - 리스트 로딩 시 `staggerChildren`을 사용하여 리드미컬하게 등장시키세요.
  - `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- **마이크로 애니메이션**:
  - 버튼 클릭 시 `active:scale-95` 적용.
  - 호버 시 색상 전환은 `duration-300` 수준의 부드러운 속도 유지.

---

## 📦 6. 타 레포지토리에서 사용하기 (External Usage)

다른 프로젝트에서 StoLink 디자인 시스템을 적용하는 방법입니다.

### 1) 패키지 설치

`npm`을 통해 핵심 토큰과 UI 컴포넌트를 설치합니다.

```bash
npm install @stolink/tokens @stolink/ui
```

### 2) Tailwind 설정 확장

`tailwind.config.js`에서 StoLink의 테마 설정을 확장해야 합니다.

```typescript
// tailwind.config.js
import { Palette } from "@stolink/tokens";

export default {
  theme: {
    extend: {
      colors: {
        mocha: Palette.mocha,
        cloud: Palette.cloud,
        sage: Palette.sage,
        espresso: Palette.espresso,
      },
      fontFamily: {
        display: ["DM Serif Display", "serif"],
        serif: ["Spectral", "serif"],
      },
      // 핵심 Shadow 시스템 추가
      boxShadow: {
        paper: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "paper-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
        "paper-floating": "0 20px 25px -5px rgba(0, 0, 0, 0.05)",
      },
    },
  },
};
```

### 3) 폰트 글로벌 설정 (CSS)

`index.css` 또는 글로벌 스타일 파일에 웹폰트를 로드하세요.

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Spectral:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap");
```

---

## �️ 7. 실전 코딩 예시 (Design System in Action)

실제로 코드를 작성할 때 어떻게 디자인 시스템을 조합하는지 보여주는 예시입니다.

### 1) 기본 컴포넌트 사용 (`@stolink/ui`)

시맨틱 토큰과 사전에 정의된 Variant를 사용하세요.

```tsx
import { Button, Badge } from "@stolink/ui";
import { Sparkles } from "lucide-react";

export function PremiumAction() {
  return (
    <Button
      intent="primary"
      size="lg"
      className="shadow-paper hover:shadow-paper-hover transition-all"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      AI 스토리 분석 시작
      <Badge intent="secondary" className="ml-2">
        NEW
      </Badge>
    </Button>
  );
}
```

### 2) 커스텀 레이아웃 구현 (Tailwind Tokens)

팔레트와 그림자 시스템을 직접 조합하여 고유한 레이어를 만듭니다.

```tsx
import { cn } from "@/lib/utils";

export function StoryCard({
  title,
  excerpt,
  className,
}: {
  title: string;
  excerpt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white/70 backdrop-blur-md", // Glassmorphism
        "border border-mocha-100/30 shadow-paper", // Border & Shadow
        "hover:border-mocha-300/50 hover:shadow-paper-hover", // Interactive
        "transition-all duration-300 ease-organic", // Smooth Motion
        className,
      )}
    >
      <h3 className="font-display text-xl text-espresso-900 mb-2">{title}</h3>
      <p className="font-serif text-mocha-700 leading-relaxed line-clamp-3">
        {excerpt}
      </p>
    </div>
  );
}
```

### 3) 애니메이션 효과 (`framer-motion`)

작가에게 영감을 주는 부드러운 등장을 구현합니다.

```tsx
import { motion } from "framer-motion";

export function FadeInContent({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }} // ease-organic
    >
      {children}
    </motion.div>
  );
}
```

---

## �🚫 8. 안티 패턴 (Anti-Patterns)

**이런 디자인은 피해주세요:**

- 무채색 그레이(`#666`, `#999`) 남용: 대신 `mocha` 또는 `espresso` 톤을 섞은 그레이를 사용하세요.
- 기본 브라우저 폰트 노출.
- 그림자 없는 플랫한 버튼: 최소한의 입체감과 트랜지션을 부여하세요.
- "딱딱한" 모서리: 모든 카드는 `rounded-xl` 이상의 둥근 모서리를 지향합니다.

---

> [!TIP]
> 더 상세한 기술 명세가 필요하다면 `appendix/design-system.md`를 참조하세요. 코드 적용 중 의문이 생기면 언제든 `@stylist-agent`에게 물어봐주세요!
