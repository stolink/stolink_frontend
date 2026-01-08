# Design System Reference

> **AI 참조용**: UI 작업 시 색상, 타이포그래피, 디자인 원칙 참조하세요.

## Mocha & Cloud Dancer Design System

### Primary Colors (Mocha - Vivid Clean Brown)

| Token     | HEX     | 용도                |
| --------- | ------- | ------------------- |
| Mocha 500 | #A6735E | 핵심 브랜드 색상    |
| Mocha 400 | #C69F8F | Hover 상태 (고휘도) |
| Mocha 700 | #7D4E3C | Dark/Active 상태    |

### Surface Colors (Cloud)

| Token        | HEX     | 용도                         |
| ------------ | ------- | ---------------------------- |
| Cloud 50     | #F1F0EC | 메인 배경색 (Cloud Dancer)   |
| Espresso 900 | #3D302A | 본문 텍스트 (12:1 명도 대비) |

### Status Colors

| 이름    | HEX     | 용도               |
| ------- | ------- | ------------------ |
| Success | #059669 | 성공 (Emerald-600) |
| Warning | #D97706 | 경고 (Amber-600)   |
| Error   | #DC2626 | 오류 (Red-600)     |

### Relationship Colors (Vivid & Clear)

| 관계 유형 | HEX     | 설명                     |
| --------- | ------- | ------------------------ |
| Friendly  | #7A8C6F | Muted Olive (신뢰, 협력) |
| Hostile   | #E11D48 | Rose-600 (갈등, 적대)    |
| Romantic  | #DB2777 | Pink-600 (애정, 열정)    |

> **참고**: 관계 강도(Strength)에 따른 색상 구분은 제거되고 통합되었습니다.

---

## Typography (타이포그래피)

### 폰트 패밀리

- **Headings**: "DM Serif Display" (세리프, 표현력)
- **Body**: "Spectral" (세리프, 가독성)
- **Code**: monospace

**규칙**:

- 제목에는 독특한 display 폰트 사용
- 본문은 정제된 세리프로 페어링
- 일반 고딕체는 표현력 있는 텍스트에 지양

### Tailwind 설정

`tailwind.config.js`에 정의된 커스텀 팔레트:

- `mocha`: 브랜드 색상
- `cloud`: 배경 및 서피스
- `sage`: 복선 하이라이트

---

## 디자인 원칙

### Warm & Soft

- Mocha와 Cloud Colors로 따뜻하고 부드러운 분위기
- Cloud Dancer 배경 + Espresso 900 텍스트 (12:1 명도 대비)

### 가독성 확보

- WCAG AAA 준수
- 충분한 명도 대비
- 텍스트 크기 및 행간 최적화

### 일관성

- 모든 UI 요소는 새로운 색체계 준수
- 관계 색상은 Friendly/Hostile/Romantic 3가지만 사용

---

## Design Quality Standards

### Bold Integration

- 일관된 미학에 헌신 (Warm & Soft)
- 일반적인 "AI" 느낌 지양

### Differentiation

- 잊을 수 없는 독특한 인터페이스
- "첫눈에 감탄" 원칙

### Premium Feel

- 단순한 MVP 느낌 지양
- 큐레이팅된 팔레트, 현대적 타이포그래피, 부드러운 그라데이션

### Motion & Interaction

- **framer-motion** 사용 (복잡한 애니메이션)
- **CSS transitions** 사용 (단순한 애니메이션)
- **Staggered reveals**: 페이지 로드 시
- **Hover effects**: 필수
- **Micro-animations**: 버튼, 카드 호버 등

### Composition

- 예상치 못한 레이아웃, 비대칭성, 여백 활용
- "쿠키 커터" 대시보드 지양

### Visual Detail

- 미묘한 텍스처 (grain, noise)
- 소프트 섀도우 (`shadow-paper`, `shadow-paper-hover`, `shadow-paper-floating`)
- 유기적 테두리
- 레이어 투명도 (Glassmorphism, Warm & Soft에 적합)

#### Shadow System (자연스러운 그림자)

**Tailwind Config 정의**:

```js
boxShadow: {
  'paper': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',              // 기본 카드
  'paper-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05)',  // 호버 상태
  'paper-floating': '0 20px 25px -5px rgba(0, 0, 0, 0.05)', // 모달
}
```

**사용 예시**:

- 기본 카드: `shadow-sm` 또는 `shadow-paper`
- 호버 효과: `hover:shadow-paper-hover transition-shadow duration-300`
- 모달/오버레이: `shadow-paper-floating`

#### Glassmorphism (글래스모피즘)

**적용 원칙**:

- Warm & Soft 분위기에 맞는 subtle한 사용
- 과도한 blur 금지 (backdrop-blur-sm 권장)
- 배경색은 white나 cloud-50 기반

**패턴**:

```tsx
// Subtle glassmorphism for highlights
<div className="bg-gradient-to-br from-[#F1F0EC] to-white backdrop-blur-sm">

// Stronger glassmorphism for modals
<div className="bg-white/80 backdrop-blur-xl">
```

**사용 케이스**:

- ✅ Summary cards, highlight boxes
- ✅ Floating panels, tooltips
- ❌ 메인 네비게이션 (명확성 필요)
- ❌ 텍스트 위 직접 사용 (가독성 저하)

---

## Anti-Patterns (절대 금지)

- Generic "AI Slop": 과도하게 사용된 레이아웃, Bootstrap/Material 기본 룩
- Default 브라우저 폰트 (Times New Roman, Arial) 또는 미설정 Inter
- "Placeholders": `generate_image` 도구 또는 실제 에셋 사용
- Flat, lifeless 디자인: 호버 상태나 트랜지션 없음
- **과도한 그림자**: 너무 진하거나 많은 그림자 사용 (shadow-2xl 등)
- **무분별한 Glassmorphism**: 모든 요소에 backdrop-blur 적용
