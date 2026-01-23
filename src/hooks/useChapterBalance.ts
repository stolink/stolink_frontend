/**
 * useChapterBalance Hook
 *
 * Calculates chapter balance analysis from document tree.
 * Identifies unbalanced chapters (±50% deviation from average).
 * Uses documentCharCounts from stats store for real-time sync.
 */

import { useMemo } from "react";
import { useDocumentTree } from "./useDocuments";
import { useWritingStatsStore } from "@/stores/useWritingStatsStore";
import type { ChapterBalanceAnalysis } from "@/types/stats";

export function useChapterBalance(projectId: string): {
  data: ChapterBalanceAnalysis | undefined;
  isLoading: boolean;
} {
  const { documents, isLoading } = useDocumentTree(projectId);

  // 스토어에서 문서별 글자수 구독 (실시간 동기화)
  const documentCharCounts = useWritingStatsStore((s) => s.documentCharCounts);

  const analysis = useMemo<ChapterBalanceAnalysis | undefined>(() => {
    if (!documents || documents.length === 0) return undefined;

    // Filter text documents (chapters)
    const chapters = documents.filter((d) => d.type === "text");

    if (chapters.length === 0) return undefined;

    // 스토어에 값이 있으면 사용, 없으면 metadata에서 가져옴
    const getWordCount = (docId: string, fallback: number) => {
      return documentCharCounts[docId] ?? fallback;
    };

    // Calculate average word count
    const totalWords = chapters.reduce(
      (sum, c) => sum + getWordCount(c.id, c.metadata.wordCount || 0),
      0
    );
    const average = chapters.length > 0 ? totalWords / chapters.length : 0;

    // Analyze each chapter
    const analyzedChapters = chapters.map((c) => {
      const wordCount = getWordCount(c.id, c.metadata.wordCount || 0);
      const deviation =
        average > 0 ? ((wordCount - average) / average) * 100 : 0;
      const isUnbalanced = Math.abs(deviation) > 50;

      return {
        id: c.id,
        title: c.title,
        wordCount,
        deviation,
        isUnbalanced,
      };
    });

    // Find longest and shortest using store values
    const chaptersWithCounts = chapters.map((c) => ({
      ...c,
      wordCount: getWordCount(c.id, c.metadata.wordCount || 0),
    }));
    const sorted = [...chaptersWithCounts].sort(
      (a, b) => b.wordCount - a.wordCount
    );
    const longest = {
      id: sorted[0].id,
      title: sorted[0].title,
      wordCount: sorted[0].wordCount,
      order: sorted[0].order,
    };
    const shortest = {
      id: sorted[sorted.length - 1].id,
      title: sorted[sorted.length - 1].title,
      wordCount: sorted[sorted.length - 1].wordCount,
      order: sorted[sorted.length - 1].order,
    };

    const unbalancedCount = analyzedChapters.filter(
      (c) => c.isUnbalanced
    ).length;

    return {
      chapters: analyzedChapters,
      average,
      longest,
      shortest,
      unbalancedCount,
    };
  }, [documents, documentCharCounts]);

  return {
    data: analysis,
    isLoading,
  };
}
