import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import {
  useCharacters,
  useCharacter,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useRegenerateCharacterImage,
  characterKeys,
} from "./useCharacters";
import { characterService } from "@/services/characterService";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("characterKeys", () => {
  it("should generate correct query keys", () => {
    expect(characterKeys.all).toEqual(["characters"]);
    expect(characterKeys.lists()).toEqual(["characters", "list"]);
    expect(characterKeys.list("project-1")).toEqual([
      "characters",
      "list",
      "project-1",
    ]);
    expect(characterKeys.details()).toEqual(["characters", "detail"]);
    expect(characterKeys.detail("char-1")).toEqual([
      "characters",
      "detail",
      "char-1",
    ]);
  });
});

describe("useCharacters", () => {
  it("should fetch characters for a project", async () => {
    const { result } = renderHook(() => useCharacters("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should not fetch when projectId is empty", () => {
    const { result } = renderHook(() => useCharacters(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useCharacters("project-1", { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useCharacter", () => {
  it("should fetch single character by id", async () => {
    const { result } = renderHook(() => useCharacter("char-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe("char-1");
  });

  it("should not fetch when id is empty", () => {
    const { result } = renderHook(() => useCharacter(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useCharacter("char-1", { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useCreateCharacter", () => {
  it("should create a new character", async () => {
    vi.spyOn(characterService, "create").mockResolvedValueOnce({
      data: {
        id: "new-char-id",
        projectId: "project-1",
        name: "새캐릭터",
        description: "Test",
        imageUrl: "",
        extras: {},
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useCreateCharacter());

    await result.current.mutateAsync({
      projectId: "project-1",
      payload: {
        name: "새캐릭터",
        description: "Test",
      },
    });

    expect(characterService.create).toHaveBeenCalledWith("project-1", {
      name: "새캐릭터",
      description: "Test",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useUpdateCharacter", () => {
  it("should update character with optimistic update", async () => {
    vi.spyOn(characterService, "update").mockResolvedValueOnce({
      data: {
        id: "char-1",
        name: "Updated Name",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useUpdateCharacter());

    await result.current.mutateAsync({
      id: "char-1",
      payload: { name: "Updated Name" },
    });

    expect(characterService.update).toHaveBeenCalledWith("char-1", {
      name: "Updated Name",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should update multiple fields", async () => {
    vi.spyOn(characterService, "update").mockResolvedValueOnce({
      data: {
        id: "char-1",
        name: "Updated Name",
        description: "Updated Description",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useUpdateCharacter());

    await result.current.mutateAsync({
      id: "char-1",
      payload: {
        name: "Updated Name",
        description: "Updated Description",
      },
    });

    expect(characterService.update).toHaveBeenCalledWith("char-1", {
      name: "Updated Name",
      description: "Updated Description",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should provide mutation function", () => {
    const { result } = renderHook(() => useUpdateCharacter());

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });
});

describe("useDeleteCharacter", () => {
  it("should delete character", async () => {
    vi.spyOn(characterService, "delete").mockResolvedValueOnce({
      data: { id: "char-1" },
    });

    const { result } = renderHook(() => useDeleteCharacter());

    await result.current.mutateAsync("char-1");

    expect(characterService.delete).toHaveBeenCalledWith("char-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should handle delete errors", async () => {
    const error = new Error("Delete failed");
    vi.spyOn(characterService, "delete").mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDeleteCharacter());

    await expect(result.current.mutateAsync("char-1")).rejects.toThrow(
      "Delete failed",
    );
  });
});

describe("useRegenerateCharacterImage", () => {
  it("should trigger image regeneration job", async () => {
    vi.spyOn(characterService, "regenerateImage").mockResolvedValueOnce({
      data: {
        jobId: "job-123",
        status: "pending",
      },
    });

    const { result } = renderHook(() => useRegenerateCharacterImage());

    await result.current.mutateAsync("char-1");

    expect(characterService.regenerateImage).toHaveBeenCalledWith("char-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
