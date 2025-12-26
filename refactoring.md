# 리팩토링 현황 (2024-12-26 업데이트)

> **14,828 라인(TypeScript 97%)**의 견고한 MVP 단계
> ESLint `complexity` 규칙 기준: **CC >= 15**

---

## 📊 복잡도 분석 결과 (ESLint)

```bash
npx eslint "src/**/*.{ts,tsx}" --rule '{"complexity": ["warn", 15]}'
```

### CC >= 15 대상 목록

| #   | 파일                              | 함수/컴포넌트        | CC     | 상태    |
| --- | --------------------------------- | -------------------- | ------ | ------- |
| 1   | `sidebar/TreeItem.tsx`            | TreeItem             | **33** | 🚨 대기 |
| 2   | `pages/EditorPage.tsx`            | EditorPage           | **31** | 🚨 대기 |
| 3   | `extensions/CharacterNode.tsx`    | async arrow function | **21** | 🚨 대기 |
| 4   | `common/CharacterDetailModal.tsx` | CharacterDetailModal | **20** | 🚨 대기 |
| 5   | `extensions/SlashCommand.tsx`     | async arrow function | **19** | 🚨 대기 |
| 6   | `extensions/CharacterNode.tsx`    | CharacterNode        | **17** | 🚨 대기 |

---

## ✅ 완료된 리팩토링

### BookReaderModal.tsx (CC: 34 → <10)

466라인 단일 파일 → 8개 모듈로 분리:

| 파일                            | 역할                  |
| ------------------------------- | --------------------- |
| `reader/theme.ts`               | 테마 상수 룩업 테이블 |
| `reader/hooks/useBookReader.ts` | 상태 관리 커스텀 훅   |
| `reader/BookReaderModal.tsx`    | Container             |
| `reader/ReaderHeader.tsx`       | 설정 UI               |
| `reader/ReaderFooter.tsx`       | 네비게이션            |
| `reader/ReaderContent.tsx`      | 본문                  |
| `reader/TableOfContents.tsx`    | 목차                  |

---

## 🔧 리팩토링 전략 (공통 패턴)

1. **Custom Hook 추출** - 상태/이펙트 로직 캡슐화
2. **컴포넌트 분리** - UI 섹션별 분리 (SRP)
3. **상수 테이블** - 조건 분기를 룩업 테이블로 대체
4. **Early Return** - 중첩 조건문 평탄화

---

## 📋 우선순위 로드맵

### Phase 1: 가장 높은 복잡도 (CC >= 30)

- [ ] `TreeItem.tsx` (CC: 33) → `useTreeItem` 훅 추출
- [ ] `EditorPage.tsx` (CC: 31) → Container/Presenter 분리

### Phase 2: 중간 복잡도 (CC 20-29)

- [ ] `CharacterNode.tsx` (CC: 21+17) → 로직 분리
- [ ] `CharacterDetailModal.tsx` (CC: 20) → 탭별 컴포넌트 분리

### Phase 3: 낮은 복잡도 (CC 15-19)

- [ ] `SlashCommand.tsx` (CC: 19) → 타입 정의 + 로직 분리
