# StoLink Editor V2.0 기능 명세서 (Enhanced)

> **"Prosumer-Grade Writing Environment"**
>
> Scrivener의 **세밀한 제어(Control)**와 Ulysses의 **심미적 완성도(Aesthetics)**를 웹(React/Tiptap) 환경에서 구현하기 위한 포괄적인 기능 모음입니다.
> 사용자가 "이런 옵션도 있어?"라고 느낄 정도로 세분화된 커스터마이징을 지원하되, **스마트 프리셋**으로 접근성을 유지합니다.

---

## 1. 타이포그래피 엔진 (Typography Engine)

전문 작가들이 가장 민감하게 반응하는 텍스트 렌더링 옵션입니다. 모든 값은 CSS Variable로 연동되어 즉시 반영됩니다.

### 1.1 폰트 시스템 (Typography)

- **Primary Font**: 본문 폰트 선택
  - **System**: San Francisco (Mac), Segoe UI (Win), Pretendard (Web)
  - **Serif(명조)**: 리디바탕(Ridi Batang), 나눔명조, KoPub 바탕, Source Han Serif
  - **Sans(고딕)**: Pretendard, Noto Sans KR, Spoqa Han Sans
  - **Mono(고정폭)**: D2Coding, JetBrains Mono (교정용 추천)
  - **사용자 폰트**: 로컬 컴퓨터에 설치된 폰트 이름 입력 지원 (Advanced)
- **Heading Font**: 제목용 폰트 별도 지정 기능

### 1.2 미세 조정 (Micro-Typography)

- **Font Size**: `14px` ~ `32px` (1px 단위 조절 또는 슬라이더)
- **Line Height (줄간격)**: `1.0` ~ `3.0` (0.1 단위 정밀 조절). _기본값: 1.8_
- **Letter Spacing (자간)**: `-0.05em` ~ `0.1em`. 한글은 좁게(-0.03em), 영문은 넓게 설정하는 프리셋 제공.
- **Paragraph Spacing (문단 간격)**:
  - **Spacing After**: 문단 뒤 공백 (엔터키 남발 방지). `0` ~ `2em`
  - **Spacing Before**: 문단 앞 공백.
- **First Line Indent (들여쓰기)** ⭐ **[핵심]**
  - 국내 웹소설/도서 표준인 "문단 첫 줄 들여쓰기" 지원.
  - 옵션: `없음`, `1글자(1em)`, `2글자(2em)`, `사용자 지정(px)`
  - _구현 참조_: CSS `text-indent` 속성 활용. 제목(Heading)에는 적용하지 않는 예외 처리 필수.

### 1.3 정렬 및 레이아웃 (Alignment & Layout)

- **Text Alignment**: 왼쪽 정렬, 양쪽 정렬(Justify), 중앙 정렬, 오른쪽 정렬.
  - _양쪽 정렬_ 시 한글 단어 끊김(Word Break) 처리 옵션: `keep-all` vs `break-all`.
- **Editor Width (편집폭)**:
  - `Narrow (640px)`: 스마트폰 호흡
  - `Standard (720px)`: 단행본 호흡
  - `Wide (960px)`: 태블릿/PC 호흡
  - `Full Width`: 꽉 찬 화면

---

## 2. 시각적 경험 및 테마 (Visual Experience)

### 2.1 테마 및 색상 (Theme Customization)

단순 라이트/다크를 넘어 요소별 색상 오버라이딩을 지원합니다.

- **Background Tone**:
  - `Pure White (#FFFFFF)`
  - `Eye-care Paper (#FAF9F6)`: 미색, 눈 피로 감소
  - `Sepia (#F4ECD8)`
  - `Dark Grey (#2D2D2D)`: 완전 블랙이 아닌 차콜 그레이
  - `True Black (#000000)`: OLED 최적화
- **Texture Overlay**: 종이 질감, 노이즈 패턴 투명도 조절 기능.
- **Syntax Colors**:
  - **본문 색상**
  - **대화문 색상** ("따옴표 안의 텍스트 색상" 별도 지정 가능)
  - **지문 색상**
  - **인용구/주석 색상**

### 2.2 커서 및 선택 (Caret & Selection)

작가의 숨결이 느껴지는 커서 옵션.

- **Caret Style**:
  - **Width**: `1px` (Thin) ~ `4px` (Block)
  - **Color**: 테마 종속 또는 커스텀 컬러(예: 형광 연두)
  - **Blink**: `깜빡임`, `부드럽게 숨쉬기(Phase)`, `고정(Solid)`
- **Highlight Current Line**: 현재 커서가 있는 줄의 배경색을 은은하게 강조 (On/Off).
  - Ulysses 스타일의 주변부 Dimming 기능 포함.

### 2.3 뷰 모드 (View Modes)

- **Typewriter Mode (타자기 모드)**:
  - **Center**: 커서를 항상 화면 중앙에 고정.
  - **Top**: 화면 상단 1/3 지점에 고정.
  - **Bottom**: 화면 하단 1/3 지점에 고정.
  - _Smooth Scroll_: 타이핑 시 부드럽게 스크롤할지, 즉시 이동할지 옵션.
- **Zen Mode (집중 모드)**: 모든 UI(사이드바, 헤더, 툴바) 숨김. `F11` 전체화면 연동.

---

## 3. 고급 집필 보조 (Advanced Writing Aids)

### 3.1 스마트 문장 부호 (Smart Punctuation)

- **Smart Quotes**: 곧은 따옴표(`"`, `'`)를 둥근 따옴표(`“`, `”`, `‘`, `’`)로 자동 변환.
- **Smart Dashes**: `--` 입력 시 엠대시(`—`)로 변환.
- **Smart Ellipsis**: `...` 입력 시 말줄임표(`…`)로 변환.
- **Hangul Jamo Fix**: 한글 자소 분리 현상 방지 및 교정 (브라우저 호환성 보완).

### 3.2 언어적 투시 (Linguistic Focus) - "StoLink X-Ray"

문장의 구조를 분석하여 시각화합니다.

- **Dialogue Highlight**: 대화문만 100% 불투명도, 지문은 30%로 흐리게 처리. (대화 호흡 점검용)
- **Adverb/Adjective Highlight**: 부사/형용사 과다 사용 감지 (빨간색/파란색 틴트).
- **Paragraph Length Map**: 문단 길이에 따라 측면 바에 히트맵 표시 (호흡 조절용).

### 3.3 통계 및 목표 (Stats & Goals)

- **Target Counter**: 일일 목표(예: 5,000자) 대비 진행률 프로그레스 바.
- **Session Duration**: 집필 시간 타이머 (뽀모도로 통합 가능).
- **Read Time estimate**: 독자 기준 예상 완독 시간 표시.

---

## 4. 시스템 동작 (System Behaviors)

### 4.1 자동 저장 및 스냅샷

- **Auto-Save Interval**: `실시간`, `5초`, `1분`, `수동 저장` 옵션.
- **Snapshot**: 세션 종료 시 또는 특정 분량 달성 시 자동 스냅샷 생성.

### 4.2 스크롤 및 네비게이션

- **Overscroll (여백 스크롤)**: 문서의 끝이 화면 바닥에 있지 않고, 중앙까지 올라올 수 있도록 하단에 가상 여백(50vh) 추가.
- **Mini-map**: 우측 스크롤바 영역에 챕터 구조나 복선 위치를 미니맵으로 시각화.

---

## 5. 구현 전략 요약 (Implementation Strategy)

이 많은 기능을 성능 저하 없이 구현하기 위한 아키텍처입니다.

1.  **CSS Variable 기반 스타일링**: 리렌더링 없이 즉각적인 스타일 변경을 위해 React State가 아닌 CSS Variable 업데이트 방식을 사용합니다.
    ```tsx
    // EditorContainer.style
    {
      "--editor-font-family": settings.fontFamily,
      "--editor-font-size": `${settings.fontSize}px`,
      "--editor-line-height": settings.lineHeight,
      "--editor-text-indent": settings.indent ? '1em' : '0',
    }
    ```
2.  **Tiptap Extensions**:
    - `TypewriterExtension`: Scroll State 및 DOM 좌표 계산 로직 캡슐화.
    - `FocusExtension`: Decoration을 활용한 흐림 효과 처리.
    - `SmartPunctuation`: `InputRule`을 활용한 정규식 치환.
3.  **Zustand Persist**:
    - `useEditorSettingStore`를 생성하여 모든 사용자 설정을 `localStorage`에 영구 저장.

---

## 6. 개발 우선순위 (Roadmap)

1.  **Phase 1 (Basic)**: 폰트(종류/크기/행간), 들여쓰기, 테마(Light/Dark), 하단 여백(Overscroll).
2.  **Phase 2 (Interaction)**: 타자기 모드(Center), 스마트 따옴표, 커서 스타일.
3.  **Phase 3 (Pro Analysis)**: 대화문 하이라이팅, 문단 호흡 분석, 커스텀 테마 빌더.
