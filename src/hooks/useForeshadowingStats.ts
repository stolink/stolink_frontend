/**
 * useForeshadowingStats Hook
 *
 * Calculates foreshadowing statistics from the foreshadowing list.
 * Does not make additional API calls - computes from existing data.
 */

import { useMemo } from "react";
import { useForeshadowing } from "./useForeshadowing";
import type { ForeshadowingStats } from "@/types/stats";

export function useForeshadowingStats(projectId: string): {
  data: ForeshadowingStats | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const {
    data: foreshadowingList,
    isLoading,
    error,
  } = useForeshadowing(projectId);

  const stats = useMemo<ForeshadowingStats | undefined>(() => {
    if (!foreshadowingList) return undefined;

    const totalCount = foreshadowingList.length;
    const pendingCount = foreshadowingList.filter(
      (f) => f.status === "pending",
    ).length;
    const recoveredCount = foreshadowingList.filter(
      (f) => f.status === "recovered",
    ).length;
    const ignoredCount = foreshadowingList.filter(
      (f) => f.status === "ignored",
    ).length;

    // Calculate recovery rate: recovered / (recovered + pending) * 100
    const activeTotal = recoveredCount + pendingCount;
    const recoveryRate =
      activeTotal > 0 ? Math.round((recoveredCount / activeTotal) * 100) : 0;

    // Filter unresolved items (status = pending)
    const unresolvedItems = foreshadowingList
      .filter((f) => f.status === "pending")
      .map((f) => ({
        id: f.id,
        tag: f.tag,
        description: f.description,
        appearances: f.appearances || [],
        createdAt: f.createdAt,
      }));

    return {
      totalCount,
      pendingCount,
      recoveredCount,
      ignoredCount,
      recoveryRate,
      unresolvedItems,
    };
  }, [foreshadowingList]);

  return {
    data: stats,
    isLoading,
    error,
  };
}
