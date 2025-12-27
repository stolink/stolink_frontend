# Routing Loop Concern & Style Consistency

## Issue Description

The AI review raised a concern that redirecting to `/` on logout or session expiration might cause an infinite loop if `/` is a protected route. Additionally, a trailing comma was missing in a `cn()` call in `ProjectLayout.tsx`, causing unnecessary diff noise.

- 파일: `src/api/client.ts`, `src/components/layouts/ProjectLayout.tsx`
- 라인: multiple
- 에러 유형: 🔴 치명적 (잠재적 루프) / ⚠️ 경고 (스타일)

## Solution Strategy

1. **Routing Verification**: Verified that `/` renders `LandingPage` which is outside the `ProtectedLayout`. To prevent future confusion, added a clarifying comment in `api/client.ts`.
2. **Style Fix**: Added the missing trailing comma in `ProjectLayout.tsx` to maintain formatting consistency.
3. **Note on Logo**: Decided NOT to restore the logo link in `LibraryPage.tsx` because removing it was an explicit user request, overriding the AI reviewer's suggestion.

### 변경 전

```tsx
// api/client.ts
window.location.href = "/";

// ProjectLayout.tsx
: "text-muted-foreground hover:text-foreground hover:bg-stone-200/50"
```

### 변경 후

```tsx
// api/client.ts
// Redirect to landing page (Publicly accessible, no ProtectedLayout loop)
window.location.href = "/";

// ProjectLayout.tsx
: "text-muted-foreground hover:text-foreground hover:bg-stone-200/50",
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: N/A (Logic check passed)
- **검증 방법**: 코드 리뷰 분석 및 라우팅 테이블 재확인
