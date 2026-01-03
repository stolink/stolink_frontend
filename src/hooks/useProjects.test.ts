import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useProjectStats,
  useDuplicateProject,
  projectKeys,
} from "./useProjects";
import { useAuthStore } from "@/stores";
import { projectService } from "@/services/projectService";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("projectKeys", () => {
  it("should generate correct query keys", () => {
    expect(projectKeys.all).toEqual(["projects"]);
    expect(projectKeys.lists()).toEqual(["projects", "list"]);
    expect(projectKeys.list({ search: "test" })).toEqual([
      "projects",
      "list",
      { search: "test" },
    ]);
    expect(projectKeys.details()).toEqual(["projects", "detail"]);
    expect(projectKeys.detail("project-1")).toEqual([
      "projects",
      "detail",
      "project-1",
    ]);
    expect(projectKeys.stats("project-1")).toEqual([
      "projects",
      "detail",
      "project-1",
      "stats",
    ]);
  });
});

describe("useProjects", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: "user-1", email: "test@example.com", nickname: "Test" },
      isAuthenticated: true,
    });
  });

  it("should fetch projects when authenticated", async () => {
    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should not fetch when not authenticated", () => {
    useAuthStore.setState({ isAuthenticated: false, user: null });

    const { result } = renderHook(() => useProjects());

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch with params", async () => {
    const spy = vi.spyOn(projectService, "getAll");

    const { result } = renderHook(() =>
      useProjects({ search: "test", genre: "fantasy" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(spy).toHaveBeenCalledWith({ search: "test", genre: "fantasy" });
  });
});

describe("useProject", () => {
  it("should fetch single project by id", async () => {
    const { result } = renderHook(() => useProject("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe("project-1");
  });

  it("should not fetch when id is empty", () => {
    const { result } = renderHook(() => useProject(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useProject("project-1", { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useCreateProject", () => {
  it("should create a new project", async () => {
    vi.spyOn(projectService, "create").mockResolvedValueOnce({
      data: {
        id: "new-project",
        title: "New Project",
        description: "Test description",
        genre: "fantasy",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        order: 0,
      },
    });

    const { result } = renderHook(() => useCreateProject());

    await result.current.mutateAsync({
      title: "New Project",
      genre: "fantasy",
      description: "Test description",
    });

    expect(projectService.create).toHaveBeenCalledWith({
      title: "New Project",
      genre: "fantasy",
      description: "Test description",
    });
  });

  it("should invalidate project lists on success", async () => {
    vi.spyOn(projectService, "create").mockResolvedValueOnce({
      data: {
        id: "new-project",
        title: "New Project",
        description: "",
        genre: "fantasy",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        order: 0,
      },
    });

    const { result } = renderHook(() => useCreateProject());

    await result.current.mutateAsync({
      title: "New Project",
      genre: "fantasy",
      description: "",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useUpdateProject", () => {
  it("should update project with optimistic update", async () => {
    vi.spyOn(projectService, "update").mockResolvedValueOnce({
      data: {
        id: "project-1",
        title: "Updated Title",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useUpdateProject());

    await result.current.mutateAsync({
      id: "project-1",
      payload: { title: "Updated Title" },
    });

    expect(projectService.update).toHaveBeenCalledWith("project-1", {
      title: "Updated Title",
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should provide mutation function", () => {
    const { result } = renderHook(() => useUpdateProject());

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });
});

describe("useDeleteProject", () => {
  it("should delete project with optimistic removal", async () => {
    vi.spyOn(projectService, "delete").mockResolvedValueOnce({
      data: { id: "project-1" },
    });

    const { result } = renderHook(() => useDeleteProject());

    await result.current.mutateAsync("project-1");

    expect(projectService.delete).toHaveBeenCalledWith("project-1");
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should handle delete errors", async () => {
    const error = new Error("Delete failed");
    vi.spyOn(projectService, "delete").mockRejectedValueOnce(error);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useDeleteProject());

    await expect(result.current.mutateAsync("project-1")).rejects.toThrow(
      "Delete failed",
    );

    expect(console.error).toHaveBeenCalled();
  });
});

describe("useProjectStats", () => {
  it("should fetch project statistics", async () => {
    vi.spyOn(projectService, "getStats").mockResolvedValueOnce({
      data: {
        wordCount: 5000,
        characterCount: 3,
        documentCount: 10,
        foreshadowingCount: 5,
      },
    });

    const { result } = renderHook(() => useProjectStats("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.wordCount).toBe(5000);
  });

  it("should not fetch when id is empty", () => {
    const { result } = renderHook(() => useProjectStats(""));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() =>
      useProjectStats("project-1", { enabled: false }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useDuplicateProject", () => {
  it("should duplicate a project", async () => {
    vi.spyOn(projectService, "duplicate").mockResolvedValueOnce({
      data: {
        id: "duplicated-project",
        title: "Test Project (Copy)",
        description: "",
        genre: "fantasy",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        order: 1,
      },
    });

    const { result } = renderHook(() => useDuplicateProject());

    await result.current.mutateAsync("project-1");

    expect(projectService.duplicate).toHaveBeenCalledWith("project-1");
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should invalidate project lists on success", async () => {
    vi.spyOn(projectService, "duplicate").mockResolvedValueOnce({
      data: {
        id: "duplicated-project",
        title: "Copy",
        description: "",
        genre: "fantasy",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        order: 1,
      },
    });

    const { result } = renderHook(() => useDuplicateProject());

    await result.current.mutateAsync("project-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
