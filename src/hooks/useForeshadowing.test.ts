import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import {
  useForeshadowing,
  useUnresolvedForeshadowing,
  useForeshadowingDetail,
  useCreateForeshadowing,
  useUpdateForeshadowing,
  useDeleteForeshadowing,
  useAddAppearance,
  useRecoverForeshadowing,
  foreshadowingKeys,
} from "./useForeshadowing";
import { foreshadowingService } from "@/services/foreshadowingService";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("foreshadowingKeys", () => {
  it("should generate correct query keys", () => {
    expect(foreshadowingKeys.all).toEqual(["foreshadowing"]);
    expect(foreshadowingKeys.lists()).toEqual(["foreshadowing", "list"]);
    expect(foreshadowingKeys.list("project-1")).toEqual([
      "foreshadowing",
      "list",
      "project-1",
      undefined,
    ]);
    expect(foreshadowingKeys.list("project-1", { status: "pending" })).toEqual([
      "foreshadowing",
      "list",
      "project-1",
      { status: "pending" },
    ]);
    expect(foreshadowingKeys.unresolved("project-1")).toEqual([
      "foreshadowing",
      "list",
      "project-1",
      "unresolved",
    ]);
    expect(foreshadowingKeys.details()).toEqual(["foreshadowing", "detail"]);
    expect(foreshadowingKeys.detail("foreshadow-1")).toEqual([
      "foreshadowing",
      "detail",
      "foreshadow-1",
    ]);
  });
});

describe("useForeshadowing", () => {
  it("should fetch foreshadowing items", async () => {
    const { result } = renderHook(() => useForeshadowing("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should fetch with status filter", async () => {
    const spy = vi.spyOn(foreshadowingService, "getAll");

    const { result } = renderHook(() =>
      useForeshadowing("project-1", { status: "pending" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(spy).toHaveBeenCalledWith("project-1", { status: "pending" });
  });

  it("should not fetch when projectId is empty", () => {
    const { result } = renderHook(() => useForeshadowing(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useForeshadowing("project-1", undefined, { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useUnresolvedForeshadowing", () => {
  it("should fetch unresolved foreshadowing items", async () => {
    const { result } = renderHook(() =>
      useUnresolvedForeshadowing("project-1"),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should not fetch when projectId is empty", () => {
    const { result } = renderHook(() => useUnresolvedForeshadowing(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useUnresolvedForeshadowing("project-1", { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useForeshadowingDetail", () => {
  it("should fetch foreshadowing detail", async () => {
    const { result } = renderHook(() => useForeshadowingDetail("foreshadow-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe("foreshadow-1");
  });

  it("should not fetch when id is empty", () => {
    const { result } = renderHook(() => useForeshadowingDetail(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useForeshadowingDetail("foreshadow-1", { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useCreateForeshadowing", () => {
  it("should create a new foreshadowing", async () => {
    vi.spyOn(foreshadowingService, "create").mockResolvedValueOnce({
      data: {
        id: "new-foreshadow",
        projectId: "project-1",
        tag: "새로운_복선",
        description: "Test",
        status: "pending",
        importance: "major",
        appearances: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useCreateForeshadowing());

    await result.current.mutateAsync({
      projectId: "project-1",
      payload: {
        tag: "새로운_복선",
        description: "Test",
      },
    });

    expect(foreshadowingService.create).toHaveBeenCalledWith("project-1", {
      tag: "새로운_복선",
      description: "Test",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useUpdateForeshadowing", () => {
  it("should update foreshadowing", async () => {
    vi.spyOn(foreshadowingService, "update").mockResolvedValueOnce({
      data: {
        id: "foreshadow-1",
        projectId: "project-1",
        tag: "Updated Tag",
        status: "pending",
        appearances: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useUpdateForeshadowing());

    await result.current.mutateAsync({
      id: "foreshadow-1",
      payload: { tag: "Updated Tag" },
    });

    expect(foreshadowingService.update).toHaveBeenCalledWith("foreshadow-1", {
      tag: "Updated Tag",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should update status", async () => {
    vi.spyOn(foreshadowingService, "update").mockResolvedValueOnce({
      data: {
        id: "foreshadow-1",
        projectId: "project-1",
        tag: "Test Tag",
        status: "recovered",
        appearances: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useUpdateForeshadowing());

    await result.current.mutateAsync({
      id: "foreshadow-1",
      payload: { status: "recovered" },
    });

    expect(foreshadowingService.update).toHaveBeenCalledWith("foreshadow-1", {
      status: "recovered",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useDeleteForeshadowing", () => {
  it("should delete foreshadowing", async () => {
    vi.spyOn(foreshadowingService, "delete").mockResolvedValueOnce({
      data: null,
    });

    const { result } = renderHook(() => useDeleteForeshadowing());

    await result.current.mutateAsync("foreshadow-1");

    expect(foreshadowingService.delete).toHaveBeenCalledWith("foreshadow-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useAddAppearance", () => {
  it("should add appearance to foreshadowing", async () => {
    vi.spyOn(foreshadowingService, "addAppearance").mockResolvedValueOnce({
      data: {
        id: "foreshadow-1",
        projectId: "project-1",
        tag: "Test Tag",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        appearances: [
          {
            chapterId: "chapter-1",
            chapterTitle: "Chapter 1",
            line: 10,
            context: "Foreshadowing context",
            isRecovery: false,
          },
        ],
      },
    });

    const { result } = renderHook(() => useAddAppearance());

    await result.current.mutateAsync({
      id: "foreshadow-1",
      appearance: {
        chapterId: "chapter-1",
        chapterTitle: "Chapter 1",
        line: 10,
        context: "Foreshadowing context",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    expect(foreshadowingService.addAppearance).toHaveBeenCalledWith(
      "foreshadow-1",
      {
        chapterId: "chapter-1",
        chapterTitle: "Chapter 1",
        line: 10,
        context: "Foreshadowing context",
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useRecoverForeshadowing", () => {
  it("should mark foreshadowing as recovered", async () => {
    vi.spyOn(foreshadowingService, "recover").mockResolvedValueOnce({
      data: {
        id: "foreshadow-1",
        projectId: "project-1",
        tag: "Test Tag",
        status: "recovered",
        appearances: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useRecoverForeshadowing());

    await result.current.mutateAsync({
      id: "foreshadow-1",
      recoveryInfo: {
        sectionTitle: "Chapter 5",
        isRecovery: true,
        chapterId: "chapter-5",
        chapterTitle: "Chapter 5",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, // Cast as any because service param might differ from internal Appearance type
    });

    expect(foreshadowingService.recover).toHaveBeenCalledWith("foreshadow-1", {
      sectionTitle: "Chapter 5",
      isRecovery: true,
      chapterId: "chapter-5",
      chapterTitle: "Chapter 5",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
