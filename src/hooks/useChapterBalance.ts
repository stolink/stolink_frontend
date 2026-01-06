/**
 * useChapterBalance Hook
 *
 * Calculates chapter balance analysis from document tree.
 * Identifies unbalanced chapters (±50% deviation from average).
 */

import { useMemo } from "react";
import { useDocumentTree } from "./useDocuments";
import type { ChapterBalanceAnalysis } from "@/types/stats";

export function useChapterBalance(projectId: string): {
  data: ChapterBalanceAnalysis | undefined;
  isLoading: boolean;
} {
  const { documents, isLoading } = useDocumentTree(projectId);

  const analysis = useMemo<ChapterBalanceAnalysis | undefined>(() => {
    if (!documents || documents.length === 0) return undefined;

    // Filter text documents (chapters)
    const chapters = documents.filter((d) => d.type === "text");

    if (chapters.length === 0) return undefined;

    // Calculate average word count
    const totalWords = chapters.reduce(
      (sum, c) => sum + (c.metadata.wordCount || 0),
      0,
    );
    const average = totalWords / chapters.length;

    // Analyze each chapter
    const analyzedChapters = chapters.map((c) => {
      const wordCount = c.metadata.wordCount || 0;
      const deviation = ((wordCount - average) / average) * 100;
      const isUnbalanced = Math.abs(deviation) > 50;

      return {
        id: c.id,
        title: c.title,
        wordCount,
        deviation,
        isUnbalanced,
      };
    });

    // Find longest and shortest
    const sorted = [...chapters].sort(
      (a, b) => (b.metadata.wordCount || 0) - (a.metadata.wordCount || 0),
    );
    const longest = {
      id: sorted[0].id,
      title: sorted[0].title,
      wordCount: sorted[0].metadata.wordCount || 0,
      order: sorted[0].order,
    };
    const shortest = {
      id: sorted[sorted.length - 1].id,
      title: sorted[sorted.length - 1].title,
      wordCount: sorted[sorted.length - 1].metadata.wordCount || 0,
      order: sorted[sorted.length - 1].order,
    };

    const unbalancedCount = analyzedChapters.filter(
      (c) => c.isUnbalanced,
    ).length;

    return {
      chapters: analyzedChapters,
      average,
      longest,
      shortest,
      unbalancedCount,
    };
  }, [documents]);

  return {
    data: analysis,
    isLoading,
  };
}
