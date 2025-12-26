import { useEffect, useLayoutEffect } from "react";
import { initializeSampleDocuments } from "@/data/sampleDocuments";
import type { Document } from "@/types/document";

interface UseEditorEffectsOptions {
  isDemo: boolean;
  documents: Document[];
  selectedFolderId: string | null;
  selectedSectionId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  isTourCompleted: boolean;
  isTourActive: boolean;
  setShowTourPrompt: (show: boolean) => void;
}

/**
 * EditorPage 초기화 및 부가 기능 이펙트 훅
 * - 샘플 데이터 초기화
 * - 자동 선택 로직 (useLayoutEffect)
 * - 투어 프롬프트
 */
export function useEditorEffects({
  isDemo,
  documents,
  selectedFolderId,
  selectedSectionId,
  setSelectedFolderId,
  setSelectedSectionId,
  isTourCompleted,
  isTourActive,
  setShowTourPrompt,
}: UseEditorEffectsOptions) {
  // 1. Initialize Sample Data
  useEffect(() => {
    if (!isDemo) {
      initializeSampleDocuments();
    }
  }, [isDemo]);

  // 2. Auto-select first folder when documents load (one-time initialization)
  /* eslint-disable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (isDemo || documents.length === 0) return;
    if (!selectedFolderId) {
      const firstFolder = documents.find((d) => d.type === "folder");
      if (firstFolder) {
        setSelectedFolderId(firstFolder.id);
      }
    }
  }, [isDemo, documents.length > 0]); // Only run when documents first load

  // 3. Auto-select section logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (isDemo || documents.length === 0) return;
    if (!selectedSectionId) {
      // First try to find a section within the selected folder
      if (selectedFolderId) {
        const firstSection = documents.find(
          (d) => d.type === "text" && d.parentId === selectedFolderId
        );
        if (firstSection) {
          setSelectedSectionId(firstSection.id);
          return;
        }
      }
      // If no folder selected or no sections in folder, find any text document
      const anyTextDoc = documents.find((d) => d.type === "text");
      if (anyTextDoc) {
        setSelectedSectionId(anyTextDoc.id);
        // Also set folder if the text doc has a parent folder
        if (anyTextDoc.parentId && !selectedFolderId) {
          setSelectedFolderId(anyTextDoc.parentId);
        }
      }
    }
  }, [isDemo, selectedFolderId, documents.length > 0]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 4. Tour Prompt
  useEffect(() => {
    if (isDemo && !isTourCompleted && !isTourActive) {
      const timer = setTimeout(() => setShowTourPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, isTourCompleted, isTourActive, setShowTourPrompt]);
}
