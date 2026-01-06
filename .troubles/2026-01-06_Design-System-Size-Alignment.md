# 디자인 시스템 규격 외 사이즈 및 텍스트 척도 수정

## Issue Description

AI 코드 리뷰에서 `EditorToolbar.tsx` 컴포넌트 내 하드코딩된 사이즈(`h-8`, `w-8`)와 디자인 시스템에 정의되지 않은 텍스트 척도(`text-xs`, `text-[10px]`)가 사용되고 있다는 점이 🔴 치명적 이슈로 지적되었습니다.

- 파일: `src/components/editor/EditorToolbar.tsx`
- 라인: 142, 202, 213, 228 등 다수
- 에러 유형: 🔴 치명적

## Solution Strategy

1. **디자인 시스템 토큰 확장**: `tailwind.config.ts`에 `fontSize.xs`와 `spacing.icon-sm`을 명시적으로 추가하여 공식 규격으로 편입하였습니다.
2. **버튼 컴포넌트 표준화**: `src/components/ui/button-variants.ts`에 `icon-sm` 사이즈 변형을 추가하여 32x32px 아이콘 버튼을 위한 시맨틱한 방법을 제공하였습니다.
3. **컴포넌트 리팩토링**: `EditorToolbar.tsx`의 원시 `<button>` 엘리먼트를 공통 `Button` 컴포넌트로 교체하고, `size="icon-sm"` 및 `text-xs` 토큰을 사용하도록 수정하였습니다.

### 변경 전 (예시)

```tsx
<button
  type="button"
  className={cn(
    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
    isActive ? "bg-mocha-400/30" : "text-mocha-500",
  )}
>
  <Icon />
</button>
```

### 변경 후 (예시)

```tsx
<Button
  variant="ghost"
  size="icon-sm"
  className={cn("rounded-lg", isActive ? "bg-mocha-400/30" : "text-mocha-500")}
>
  <Icon />
</Button>
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run type-check` 통과 완료
- **검증 방법**: `gh pr view`를 통한 AI 리뷰 지적 사항 전수 조사 및 수정 확인
