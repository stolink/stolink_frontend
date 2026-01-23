# 🛡️ 테크니컬 챌린지: 보안 아키텍처 및 런타임 안정성

> **주제**: 사용자 생성 콘텐츠(UGC)를 다루는 플랫폼에서의 XSS 방어 전략과, TypeScript의 정적 타입을 런타임까지 확장하는 안정성 설계 사례입니다.

---

## Challenge 7: 에디터 콘텐츠를 위한 Zero-Trust XSS 방어 시스템

### 🛑 문제 상황 (Problem)

Rich Text Editor는 본질적으로 HTML을 저장하고 렌더링해야 합니다. 사용자가 `<script>` 태그나 `javascript:` 프로토콜이 포함된 악성 코드를 붙여넣기 하거나 저장할 경우, 이를 조회하는 다른 사용자에게 **XSS(Cross-Site Scripting)** 공격이 실행될 치명적인 보안 위협이 있었습니다.
단순히 HTML 태그를 제거하면 에디터의 서식(Bold, Italic 등)이 깨지고, 허용하면 보안이 뚫리는 딜레마가 있었습니다.

### 🧩 해결 전략 (Solution)

**"Allow-list Sanitization Architecture"**를 구축하여, 신뢰할 수 있는 태그와 속성만 선택적으로 허용하는 정제 파이프라인을 구현했습니다. `DOMPurify` 라이브러리를 커스터마이징하여 프로젝트 전용 태그(`character-mention` 등)까지 안전하게 처리했습니다.

```typescript
import DOMPurify from "dompurify";

// 1. 허용할 태그 (Strict Allow-list)
const ALLOWED_TAGS = [
  "p",
  "b",
  "i",
  "em",
  "strong",
  "h1",
  "h2",
  "h3",
  "character-mention", // 커스텀 Web Component 허용
  "foreshadowing-tag",
];

// 2. 허용할 속성 (Data Attribute 포함)
const ALLOWED_ATTR = ["class", "data-id", "data-label", "href"];

export function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // 3. 위험한 프로토콜 차단 (javascript:, vbscript: 등)
    FORBID_TAGS: ["script", "iframe", "object"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
}
```

### 📈 성과 (Impact)

- **OWASP Top 10 방어**: Stored XSS 공격 벡터 원천 차단.
- **기능과 보안의 균형**: 에디터의 풍부한 서식 기능은 유지하면서 악성 스크립트만 정밀 타격.
- **확장성**: 새로운 커스텀 태그 추가 시 화이트리스트만 업데이트하면 되는 유연한 구조.

---

## Challenge 8: 런타임 타입 가드(Type Guard)와 API 계약 검증

### 🛑 문제 상황 (Problem)

TypeScript는 컴파일 타임에만 타입을 보장하므로, 런타임에 외부 시스템(Backend API)에서 예상치 못한 데이터가 넘어오면 앱이 크래시(White Screen of Death) 되거나 정의되지 않은 동작을 수행했습니다.
기존 코드에는 `as any`나 `as Project`와 같은 **타입 단언(Type Assertion)**이 산재해 있어, "서버가 보낸 데이터가 항상 옳다"는 위험한 가정을 하고 있었습니다.

### 🧩 해결 전략 (Solution)

**"Defensive Runtime Validation"** 전략을 도입하여, 컴파일 타임의 타입 시스템을 런타임 영역으 확장했습니다.

1.  **Strict Type Guards**: `axios.isAxiosError`와 같은 사용자 정의 타입 가드(User-Defined Type Guard) 사용.
2.  **Schema Validation**: API 응답 데이터를 그대로 믿지 않고, 검증 로직을 통과해야만 사용.

```typescript
// Before: 위험한 타입 단언 (서버가 null을 보내면 런타임 에러)
const data = response.data as Character[];
return data.map((c) => c.name); // Crash if data is null

// After: 런타임 방어 로직
interface ApiResponse<T> {
  data: T;
  message: string;
}

async function fetchCharacters(): Promise<Character[]> {
  const response = await client.get("/api/characters");

  // 1. 구조적 유효성 검사 (Structural Validation)
  if (!response.data || !Array.isArray(response.data.data)) {
    // 2. 명시적 에러 처리 (조용한 실패 방지)
    console.warn("Invalid API Schema:", response.data);
    return []; // Fallback 데이터 반환으로 UI 크래시 방지
  }

  return response.data.data;
}

// Error Handling
try {
  await apiCall();
} catch (error) {
  // 3. 타입 좁히기 (Type Narrowing)
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    navigate("/not-found"); // 예측 가능한 처리
  }
}
```

### 📈 성과 (Impact)

- **Crash Free User Experience**: 잘못된 API 응답에도 앱이 멈추지 않고 Graceful Degradation(우아한 저하) 수행.
- **디버깅 시간 단축**: "undefined is not an object" 같은 모호한 에러 대신, "Invalid API Schema"라는 명확한 원인 파악 가능.
- **코드 신뢰도 향상**: `any` 타입 사용을 지양하는 엔지니어링 문화 정착.
