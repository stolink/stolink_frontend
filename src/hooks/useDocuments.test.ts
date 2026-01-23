import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import {
  useDocumentTree,
  useDocument,
  useChildDocuments,
  useDocumentContent,
  useBulkDocumentContent,
  useDocumentMutations,
  useDescendantDocuments,
  documentKeys,
} from "./useDocuments";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import {
  documentService,
  type BackendDocument,
  type DocumentType,
} from "@/services/documentService";
// Document type is used implicitly in test data

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("documentKeys", () => {
  it("should generate correct query keys", () => {
    expect(documentKeys.all).toEqual(["documents"]);
    expect(documentKeys.trees()).toEqual(["documents", "tree"]);
    expect(documentKeys.tree("project-1")).toEqual([
      "documents",
      "tree",
      "project-1",
    ]);
    expect(documentKeys.details()).toEqual(["documents", "detail"]);
    expect(documentKeys.detail("doc-1")).toEqual([
      "documents",
      "detail",
      "doc-1",
    ]);
    expect(documentKeys.contents()).toEqual(["documents", "content"]);
    expect(documentKeys.content("doc-1")).toEqual([
      "documents",
      "content",
      "doc-1",
    ]);
  });
});

describe("useDocumentTree", () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: {} });
  });

  it("should fetch and build document tree", async () => {
    const { result } = renderHook(() => useDocumentTree("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toBeDefined();
    expect(result.current.tree).toBeDefined();
    expect(Array.isArray(result.current.tree)).toBe(true);
  });

  it("should sync fetched documents to Zustand store", async () => {
    const { result } = renderHook(() => useDocumentTree("project-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const storeDocuments = useDocumentStore.getState().documents;
    expect(Object.keys(storeDocuments).length).toBeGreaterThan(0);
  });

  it("should return empty tree for empty project", async () => {
    vi.spyOn(documentService, "getTree").mockResolvedValueOnce({
      data: [],
    });

    const { result } = renderHook(() => useDocumentTree("empty-project"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual([]);
    expect(result.current.tree).toEqual([]);
  });

  it("should handle 404 errors gracefully", async () => {
    const error404 = {
      response: { status: 404 },
    };
    vi.spyOn(documentService, "getTree").mockRejectedValueOnce(error404);

    const { result } = renderHook(() => useDocumentTree("not-found"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual([]);
    expect(result.current.tree).toEqual([]);
  });

  it("should build tree with parent-child relationships", async () => {
    const mockDocs: BackendDocument[] = [
      {
        id: "doc-1",
        projectId: "project-1",
        title: "Chapter 1",
        type: "folder" as unknown as DocumentType,
        parentId: undefined,
        order: 0,
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        isPublished: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        children: [
          {
            id: "doc-2",
            projectId: "project-1",
            title: "Scene 1",
            type: "text" as unknown as DocumentType,
            parentId: "doc-1",
            order: 0,
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            isPublished: false,
            createdAt: "2025-01-02T00:00:00Z",
            updatedAt: "2025-01-02T00:00:00Z",
            children: [],
          },
        ],
      },
    ];

    vi.spyOn(documentService, "getTree").mockResolvedValueOnce({
      data: mockDocs,
    });

    const { result } = renderHook(() => useDocumentTree("project-1"));

    await waitFor(
      () => {
        expect(result.current.tree.length).toBe(1);
      },
      { timeout: 2000 },
    );

    expect(result.current.tree[0].id).toBe("doc-1");
    expect(result.current.tree[0].children.length).toBe(1);
    expect(result.current.tree[0].children[0].id).toBe("doc-2");
  });

  it("should sort tree nodes by order and createdAt", async () => {
    const mockDocs: BackendDocument[] = [
      {
        id: "doc-3",
        projectId: "project-1",
        title: "Chapter 3",
        type: "folder",
        order: 2,
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        isPublished: false,
        createdAt: "2025-01-03T00:00:00Z",
        updatedAt: "2025-01-03T00:00:00Z",
        children: [],
      },
      {
        id: "doc-1",
        projectId: "project-1",
        title: "Chapter 1",
        type: "folder",
        order: 0,
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        isPublished: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        children: [],
      },
      {
        id: "doc-2",
        projectId: "project-1",
        title: "Chapter 2",
        type: "folder",
        order: 1,
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        isPublished: false,
        createdAt: "2025-01-02T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
        children: [],
      },
    ];

    vi.spyOn(documentService, "getTree").mockResolvedValueOnce({
      data: mockDocs,
    });

    const { result } = renderHook(() => useDocumentTree("project-1"));

    await waitFor(() => {
      expect(result.current.tree.length).toBe(3);
    });

    expect(result.current.tree[0].id).toBe("doc-1");
    expect(result.current.tree[1].id).toBe("doc-2");
    expect(result.current.tree[2].id).toBe("doc-3");
  });
});

describe("useDocument", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Test Document",
          type: "text",
          content: "Test content",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 12,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });
  });

  it("should return document by id", () => {
    const { result } = renderHook(() => useDocument("doc-1"));

    expect(result.current.document).toBeDefined();
    expect(result.current.document?.id).toBe("doc-1");
    expect(result.current.document?.title).toBe("Test Document");
    expect(result.current.isLoading).toBe(false);
  });

  it("should return null for non-existent document", () => {
    const { result } = renderHook(() => useDocument("non-existent"));

    expect(result.current.document).toBeNull();
  });

  it("should return null when id is null", () => {
    const { result } = renderHook(() => useDocument(null));

    expect(result.current.document).toBeNull();
  });

  it("should provide updateDocument function", () => {
    const { result } = renderHook(() => useDocument("doc-1"));

    expect(result.current.updateDocument).toBeDefined();
    expect(typeof result.current.updateDocument).toBe("function");
  });

  it("should update document title", async () => {
    const { result } = renderHook(() => useDocument("doc-1"));

    await result.current.updateDocument({ title: "Updated Title" });

    const state = useDocumentStore.getState().documents;
    expect(state["doc-1"].title).toBe("Updated Title");
  });
});

describe("useChildDocuments", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Chapter 1",
          type: "folder",
          parentId: undefined,
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-2": {
          id: "doc-2",
          projectId: "project-1",
          title: "Scene 1",
          type: "text",
          parentId: "doc-1",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-3": {
          id: "doc-3",
          projectId: "project-1",
          title: "Scene 2",
          type: "text",
          parentId: "doc-1",
          content: "",
          synopsis: "",
          order: 1,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });
  });

  it("should return children of a parent document", () => {
    const { result } = renderHook(() =>
      useChildDocuments("doc-1", "project-1"),
    );

    expect(result.current.children).toHaveLength(2);
    expect(result.current.children[0].id).toBe("doc-2");
    expect(result.current.children[1].id).toBe("doc-3");
  });

  it("should sort children by order", () => {
    const { result } = renderHook(() =>
      useChildDocuments("doc-1", "project-1"),
    );

    expect(result.current.children[0].order).toBe(0);
    expect(result.current.children[1].order).toBe(1);
  });

  it("should return root documents when parentId is null", () => {
    const { result } = renderHook(() => useChildDocuments(null, "project-1"));

    expect(result.current.children).toHaveLength(1);
    expect(result.current.children[0].id).toBe("doc-1");
  });

  it("should return empty array for parent with no children", () => {
    const { result } = renderHook(() =>
      useChildDocuments("doc-2", "project-1"),
    );

    expect(result.current.children).toEqual([]);
  });
});

describe("useDocumentContent", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Test",
          type: "text",
          content: "Local content",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 13,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });
  });

  it("should fetch document content", async () => {
    vi.spyOn(documentService, "getContent").mockResolvedValueOnce({
      success: true,
      data: {
        content: "Fetched content",
        page: 1,
        totalPages: 1,
        hasNext: false,
      },
    });

    const { result } = renderHook(() => useDocumentContent("doc-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.content).toBe("Fetched content");
  });

  it("should use local content when fetch returns null", async () => {
    vi.spyOn(documentService, "getContent").mockResolvedValueOnce({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: null as any,
    });

    const { result } = renderHook(() => useDocumentContent("doc-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.content).toBe("Local content");
  });

  it("should handle 404 errors and use local cache", async () => {
    const error404 = {
      response: { status: 404 },
    };
    vi.spyOn(documentService, "getContent").mockRejectedValueOnce(error404);

    const { result } = renderHook(() => useDocumentContent("doc-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.content).toBe("Local content");
  });

  it("should save content with optimistic update", async () => {
    vi.spyOn(documentService, "updateContent").mockResolvedValueOnce({
      success: true,
      data: {
        id: "doc-1",
        wordCount: 20,
        updatedAt: "2025-01-02T00:00:00Z",
        page: 1,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => useDocumentContent("doc-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.saveContent("New content");

    const state = useDocumentStore.getState().documents;
    expect(state["doc-1"].content).toBe("New content");
  });

  it("should rollback on save error", async () => {
    vi.spyOn(documentService, "updateContent").mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useDocumentContent("doc-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const originalContent = "Local content";
    await result.current.saveContent("New content").catch(() => {});

    const state = useDocumentStore.getState().documents;
    expect(state["doc-1"].content).toBe(originalContent);
  });

  it("should return empty string for null id", () => {
    const { result } = renderHook(() => useDocumentContent(null));

    expect(result.current.content).toBe("");
  });
});

describe("useBulkDocumentContent", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Doc 1",
          type: "text",
          content: "Content 1",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 9,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-2": {
          id: "doc-2",
          projectId: "project-1",
          title: "Doc 2",
          type: "text",
          content: "Content 2",
          synopsis: "",
          order: 1,
          metadata: {
            status: "draft",
            wordCount: 9,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });
  });

  it("should get content for multiple documents", () => {
    // getContent test removed as useBulkDocumentContent does not expose it
  });

  it("should save bulk content", () => {
    const { result } = renderHook(() => useBulkDocumentContent());

    result.current.bulkSaveContent({
      "doc-1": "Updated 1",
      "doc-2": "Updated 2",
    });

    const state = useDocumentStore.getState().documents;
    expect(state["doc-1"].content).toBe("Updated 1");
    expect(state["doc-2"].content).toBe("Updated 2");
  });

  it("should return empty string for non-existent document", () => {
    // getContent test removed as useBulkDocumentContent does not expose it
  });
});

describe("useDocumentMutations", () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: {} });
    vi.clearAllMocks();
  });

  it("should create a new document", async () => {
    vi.spyOn(documentService, "create").mockResolvedValueOnce({
      success: true,
      data: {
        id: "new-doc-id",
        projectId: "project-1",
        title: "New Document",
        type: "text" as unknown as DocumentType,
        content: "",
        synopsis: "",
        order: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: "draft" as any,
        wordCount: 0,
        includeInCompile: true,
        isPublished: false,
        children: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useDocumentMutations("project-1"));

    await result.current.createDocument({
      type: "text",
      title: "New Document",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const state = useDocumentStore.getState().documents;
    expect(state["new-doc-id"]).toBeDefined();
    expect(state["new-doc-id"].title).toBe("New Document");
  });

  it("should update document", async () => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Old Title",
          type: "text",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });

    vi.spyOn(documentService, "update").mockResolvedValueOnce({
      success: true,
      data: {
        id: "doc-1",
        projectId: "project-1",
        title: "Updated Title",
        type: "text" as unknown as DocumentType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: "draft" as any,
        wordCount: 0,
        includeInCompile: true,
        isPublished: false,
        order: 0,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    });

    const { result } = renderHook(() => useDocumentMutations("project-1"));

    await result.current.updateDocument("doc-1", {
      title: "Updated Title",
    });

    const state = useDocumentStore.getState().documents;
    expect(state["doc-1"].title).toBe("Updated Title");
  });

  it("should delete document", async () => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "To Delete",
          type: "text",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });

    vi.spyOn(documentService, "delete").mockResolvedValueOnce({
      success: true,
      data: null,
    });

    const { result } = renderHook(() => useDocumentMutations("project-1"));

    await result.current.deleteDocument("doc-1");

    const state = useDocumentStore.getState().documents;
    expect(state["doc-1"]).toBeUndefined();
  });

  it("should reorder documents", async () => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Doc 1",
          type: "text",
          parentId: undefined,
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-2": {
          id: "doc-2",
          projectId: "project-1",
          title: "Doc 2",
          type: "text",
          parentId: undefined,
          content: "",
          synopsis: "",
          order: 1,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });

    const { result } = renderHook(() => useDocumentMutations("project-1"));

    result.current.reorderDocuments(null, ["doc-2", "doc-1"]);

    const state = useDocumentStore.getState().documents;
    expect(state["doc-2"].order).toBe(0);
    expect(state["doc-1"].order).toBe(1);
  });
});

describe("useDescendantDocuments", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Chapter 1",
          type: "folder",
          parentId: undefined,
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-2": {
          id: "doc-2",
          projectId: "project-1",
          title: "Scene 1",
          type: "text",
          parentId: "doc-1",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-3": {
          id: "doc-3",
          projectId: "project-1",
          title: "Subsection",
          type: "text",
          parentId: "doc-2",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });
  });

  it("should return all descendants including parent", () => {
    const { result } = renderHook(() =>
      useDescendantDocuments("doc-1", "project-1"),
    );

    expect(result.current.documents).toHaveLength(3);
    expect(result.current.documents[0].id).toBe("doc-1");
    expect(result.current.documents[1].id).toBe("doc-2");
    expect(result.current.documents[2].id).toBe("doc-3");
  });

  it("should return empty array for null parentId", () => {
    const { result } = renderHook(() =>
      useDescendantDocuments(null, "project-1"),
    );

    expect(result.current.documents).toEqual([]);
  });

  it("should return only parent if it has no children", () => {
    const { result } = renderHook(() =>
      useDescendantDocuments("doc-3", "project-1"),
    );

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].id).toBe("doc-3");
  });

  it("should traverse deeply nested hierarchy", () => {
    useDocumentStore.setState({
      documents: {
        "doc-1": {
          id: "doc-1",
          projectId: "project-1",
          title: "Level 1",
          type: "folder",
          parentId: undefined,
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-2": {
          id: "doc-2",
          projectId: "project-1",
          title: "Level 2",
          type: "folder",
          parentId: "doc-1",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-3": {
          id: "doc-3",
          projectId: "project-1",
          title: "Level 3",
          type: "text",
          parentId: "doc-2",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        "doc-4": {
          id: "doc-4",
          projectId: "project-1",
          title: "Level 4",
          type: "text",
          parentId: "doc-3",
          content: "",
          synopsis: "",
          order: 0,
          metadata: {
            status: "draft",
            wordCount: 0,
            includeInCompile: true,
            keywords: [],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      },
    });

    const { result } = renderHook(() =>
      useDescendantDocuments("doc-1", "project-1"),
    );

    expect(result.current.documents).toHaveLength(4);
    expect(result.current.documents[0].id).toBe("doc-1");
    expect(result.current.documents[1].id).toBe("doc-2");
    expect(result.current.documents[2].id).toBe("doc-3");
    expect(result.current.documents[3].id).toBe("doc-4");
  });
});
