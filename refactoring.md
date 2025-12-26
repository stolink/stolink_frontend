# 리팩토링 현황 (2024-12-26 최신)

> ESLint `complexity` 규칙 기준: **CC >= 15**

---

## 📊 복잡도 분석 결과

```bash
npx eslint "src/**/*.{ts,tsx}" --rule '{"complexity": ["warn", 15]}'
```

### 현재 CC >= 15 대상 (5개)

| #   | 파일                       | 함수                 | CC  | 상태                    |
| --- | -------------------------- | -------------------- | --- | ----------------------- |
| 1   | `TreeItem.tsx`             | TreeItem             | 33  | 🔧 훅 생성됨, 적용 필요 |
| 2   | `EditorPage.tsx`           | EditorPage           | 31  | 🔧 훅 생성됨, 적용 필요 |
| 3   | `CharacterDetailModal.tsx` | CharacterDetailModal | 20  | 🔧 훅 생성됨, 적용 필요 |
| 4   | `WorldPage.tsx`            | CharacterNode        | 17  | 🚨 분석 필요            |
| 5   | `WorldPage.tsx`            | Arrow function       | 21  | 🚨 분석 필요            |

---

## ✅ 완료된 리팩토링

### Phase 1-3: 커스텀 훅/타입 추출

| 대상                 | 생성된 파일                                          |
| -------------------- | ---------------------------------------------------- |
| TreeItem             | `useTreeItem.ts`, `TreeLines.tsx`, `treeItemMenu.ts` |
| EditorPage           | `useEditorDocuments.ts`, `useEditorKeyboard.ts`      |
| CharacterDetailModal | `useCharacterData.ts`, `characterConstants.ts`       |
| SlashCommand         | `slashCommand.types.ts` (10개 any 제거)              |

### Phase 4: 훅/유틸리티 분리

| 대상             | CC  | 결과                         |
| ---------------- | --- | ---------------------------- |
| useJobPolling.ts | 19  | ✅ `handlePollResponse` 분리 |
| LibraryPage.tsx  | 21  | ✅ `apiUtils.ts` 분리        |

---

## 📈 개선 현황

| 항목        | 시작 | 현재 |
| ----------- | ---- | ---- |
| CC>=15 경고 | 7개  | 5개  |
| 신규 파일   | 0개  | 12개 |

---

## 🔧 남은 작업

1. TreeItem: 생성된 훅을 메인 컴포넌트에 적용
2. EditorPage: 생성된 훅을 메인 컴포넌트에 적용
3. CharacterDetailModal: 생성된 훅을 완전 적용
4. WorldPage: CharacterNode 및 Arrow function 분석 후 분리
