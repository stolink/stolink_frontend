## 📋 변경 사항

- **문서 이동 낙관적 업데이트 적용**: moveDocument 함수를 추가하여 폴더 이동 시 UI에 즉시 반영하고, API 실패 시 자동으로 롤백되는 로직을 구현했습니다.
- **폴더 이동 API 지원**: UpdateDocumentInput 타입에 parentId를 추가하여 문서를 다른 폴더로 이동할 수 있도록 백엔드 연동 기반을 마련했습니다.
- **드래그 앤 드롭 UX 혁신**:
  - **드래그 오버레이 제거**: 마우스를 따라다니던 플로팅 박스를 없애 기존 아이템들이 가려지는 문제를 해결했습니다.
  - **직관적인 인디케이터**: 드롭 위치를 표시하는 선을 더 굵게 만들고 왼쪽에 동그라미 점을 추가하여 삽입 위치를 명확히 했습니다.
  - **고정된 레이아웃**: 드래그 중 다른 아이템들이 밀려나지 않도록 수정하여 폴더가 "도망가는" 현상을 방지했습니다.
  - **스마트 하이라이트**: 드래그 중인 아이템의 원래 부모 폴더는 하이라이트 대상에서 제외하여 불필요한 시각적 노이즈를 줄였습니다.
- **드롭 정밀도 향상**: 실시간 마우스 좌표를 기반으로 before/after 위치를 계산하여 시각적 가이드와 실제 드롭 위치가 일치하도록 개선했습니다.

## 📁 변경된 파일

- src/hooks/useDocuments.ts, src/types/document.ts, src/components/editor/sidebar/ChapterTree.tsx, src/components/editor/sidebar/TreeItem.tsx 등

## ✅ 체크리스트

- [x] 빌드 성공 확인 (npm run build)
- [x] 로컬 테스트 완료

## 🔀 Merge 가이드

- Target: dev
- Squash and Merge 권장

Closes stolink/stolink-manage#34
