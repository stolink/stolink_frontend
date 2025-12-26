/**
 * BookReaderModal - Backward Compatibility Re-export
 *
 * 이 파일은 기존 import 경로를 유지하기 위한 re-export입니다.
 * 실제 구현은 src/components/reader/ 폴더에 리팩토링되었습니다.
 *
 * @see src/components/reader/BookReaderModal.tsx - 메인 컴포넌트
 * @see src/components/reader/hooks/useBookReader.ts - 상태 관리 훅
 */

export { BookReaderModal } from "@/components/reader/BookReaderModal";
export type { Chapter, Theme, ViewMode } from "@/components/reader";
