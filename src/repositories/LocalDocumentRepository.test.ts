import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LocalDocumentRepository,
  useDocumentStore,
} from "./LocalDocumentRepository";
import type { Document } from "@/types/document";

// Mock idb-keyval
vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("LocalDocumentRepository", () => {
  let repository: LocalDocumentRepository;

  beforeEach(() => {
    // Reset store before each test
    useDocumentStore.setState({ documents: {} });
    repository = new LocalDocumentRepository();
  });

  describe("getByProject", () => {
    it("should return documents for a specific project", async () => {
      // Arrange
      const doc1: Document = {
        id: "doc-1",
        projectId: "project-1",
        title: "Chapter 1",
        type: "folder",
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
      };

      const doc2: Document = {
        ...doc1,
        id: "doc-2",
        title: "Chapter 2",
        order: 1,
      };

      const doc3: Document = {
        ...doc1,
        id: "doc-3",
        projectId: "project-2",
        title: "Different Project",
      };

      useDocumentStore.getState()._create(doc1);
      useDocumentStore.getState()._create(doc2);
      useDocumentStore.getState()._create(doc3);

      // Act
      const result = await repository.getByProject("project-1");

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("doc-1");
      expect(result[1].id).toBe("doc-2");
    });

    it("should return empty array if no documents found", async () => {
      const result = await repository.getByProject("non-existent-project");
      expect(result).toEqual([]);
    });

    it("should sort documents by order", async () => {
      const doc1: Document = {
        id: "doc-1",
        projectId: "project-1",
        title: "Chapter 3",
        type: "folder",
        content: "",
        synopsis: "",
        order: 2,
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
      };

      const doc2: Document = {
        ...doc1,
        id: "doc-2",
        title: "Chapter 1",
        order: 0,
      };

      const doc3: Document = {
        ...doc1,
        id: "doc-3",
        title: "Chapter 2",
        order: 1,
      };

      useDocumentStore.getState()._create(doc1);
      useDocumentStore.getState()._create(doc2);
      useDocumentStore.getState()._create(doc3);

      const result = await repository.getByProject("project-1");

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("Chapter 1");
      expect(result[1].title).toBe("Chapter 2");
      expect(result[2].title).toBe("Chapter 3");
    });
  });

  describe("getById", () => {
    it("should return document by id", async () => {
      const doc: Document = {
        id: "doc-1",
        projectId: "project-1",
        title: "Test Doc",
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
      };

      useDocumentStore.getState()._create(doc);

      const result = await repository.getById("doc-1");

      expect(result).toEqual(doc);
    });

    it("should return null if document not found", async () => {
      const result = await repository.getById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("getChildren", () => {
    it("should return children of a parent document", async () => {
      const parent: Document = {
        id: "parent-1",
        projectId: "project-1",
        title: "Parent Folder",
        type: "folder",
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
      };

      const child1: Document = {
        ...parent,
        id: "child-1",
        title: "Child 1",
        parentId: "parent-1",
        type: "text",
        order: 0,
      };

      const child2: Document = {
        ...parent,
        id: "child-2",
        title: "Child 2",
        parentId: "parent-1",
        type: "text",
        order: 1,
      };

      const otherDoc: Document = {
        ...parent,
        id: "other-1",
        title: "Other Doc",
        order: 0,
      };

      useDocumentStore.getState()._create(parent);
      useDocumentStore.getState()._create(child1);
      useDocumentStore.getState()._create(child2);
      useDocumentStore.getState()._create(otherDoc);

      const result = await repository.getChildren("parent-1", "project-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("child-1");
      expect(result[1].id).toBe("child-2");
    });

    it("should return root documents when parentId is null", async () => {
      const root1: Document = {
        id: "root-1",
        projectId: "project-1",
        title: "Root 1",
        type: "folder",
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
      };

      const root2: Document = {
        ...root1,
        id: "root-2",
        title: "Root 2",
        order: 1,
      };

      const child: Document = {
        ...root1,
        id: "child-1",
        title: "Child",
        parentId: "root-1",
      };

      useDocumentStore.getState()._create(root1);
      useDocumentStore.getState()._create(root2);
      useDocumentStore.getState()._create(child);

      const result = await repository.getChildren(null, "project-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("root-1");
      expect(result[1].id).toBe("root-2");
    });
  });

  describe("getAllDescendants", () => {
    it("should return all descendants recursively", async () => {
      const parent: Document = {
        id: "parent",
        projectId: "project-1",
        title: "Parent",
        type: "folder",
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
      };

      const child1: Document = {
        ...parent,
        id: "child-1",
        title: "Child 1",
        parentId: "parent",
        order: 0,
      };

      const child2: Document = {
        ...parent,
        id: "child-2",
        title: "Child 2",
        parentId: "parent",
        order: 1,
      };

      const grandchild: Document = {
        ...parent,
        id: "grandchild",
        title: "Grandchild",
        parentId: "child-1",
        order: 0,
      };

      useDocumentStore.getState()._create(parent);
      useDocumentStore.getState()._create(child1);
      useDocumentStore.getState()._create(child2);
      useDocumentStore.getState()._create(grandchild);

      const result = await repository.getAllDescendants("parent", "project-1");

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("child-1");
      expect(result[1].id).toBe("grandchild");
      expect(result[2].id).toBe("child-2");
    });

    it("should return empty array if parent has no children", async () => {
      const parent: Document = {
        id: "parent",
        projectId: "project-1",
        title: "Parent",
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
      };

      useDocumentStore.getState()._create(parent);

      const result = await repository.getAllDescendants("parent", "project-1");

      expect(result).toEqual([]);
    });
  });

  describe("_syncProjectDocuments", () => {
    it("should sync documents and remove old ones", () => {
      // Arrange: 기존 문서 3개
      const oldDoc1: Document = {
        id: "old-1",
        projectId: "project-1",
        title: "Old Doc 1",
        type: "text",
        content: "Old content 1",
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
      };

      const oldDoc2: Document = {
        ...oldDoc1,
        id: "old-2",
        title: "Old Doc 2",
        content: "Old content 2",
      };

      const otherProjectDoc: Document = {
        ...oldDoc1,
        id: "other-1",
        projectId: "project-2",
        title: "Other Project Doc",
      };

      useDocumentStore.getState()._create(oldDoc1);
      useDocumentStore.getState()._create(oldDoc2);
      useDocumentStore.getState()._create(otherProjectDoc);

      // Act: 새로운 문서로 동기화 (old-1은 유지, old-2는 제거, new-1 추가)
      const newDocs: Document[] = [
        {
          id: "old-1",
          projectId: "project-1",
          title: "Updated Old Doc 1",
          type: "text",
          content: "", // 서버에서는 content 없음
          synopsis: "New synopsis",
          order: 0,
          metadata: {
            status: "revised",
            wordCount: 0,
            includeInCompile: true,
            keywords: ["updated"],
            notes: "",
          },
          characterIds: [],
          foreshadowingIds: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
        {
          id: "new-1",
          projectId: "project-1",
          title: "New Doc",
          type: "folder",
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
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      useDocumentStore.getState()._syncProjectDocuments("project-1", newDocs);

      // Assert
      const state = useDocumentStore.getState().documents;

      // old-1은 업데이트되었지만 content는 보존됨
      expect(state["old-1"]).toBeDefined();
      expect(state["old-1"].title).toBe("Updated Old Doc 1");
      expect(state["old-1"].content).toBe("Old content 1"); // 보존됨!
      expect(state["old-1"].synopsis).toBe("New synopsis");
      expect(state["old-1"].metadata.status).toBe("revised");

      // old-2는 삭제됨
      expect(state["old-2"]).toBeUndefined();

      // new-1은 추가됨
      expect(state["new-1"]).toBeDefined();
      expect(state["new-1"].title).toBe("New Doc");

      // other project 문서는 유지됨
      expect(state["other-1"]).toBeDefined();
    });

    it("should preserve local content when server sends empty content", () => {
      const localDoc: Document = {
        id: "doc-1",
        projectId: "project-1",
        title: "Local Doc",
        type: "text",
        content: "Important local content",
        synopsis: "",
        order: 0,
        metadata: {
          status: "draft",
          wordCount: 23,
          includeInCompile: true,
          keywords: [],
          notes: "Local notes",
        },
        characterIds: [],
        foreshadowingIds: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      useDocumentStore.getState()._create(localDoc);

      // 서버에서 content 없이 전송 (트리 fetch는 content를 포함하지 않음)
      const serverDocs: Document[] = [
        {
          ...localDoc,
          content: "", // 빈 문자열로 전송
          metadata: {
            status: "draft",
            wordCount: 23,
            includeInCompile: true,
            keywords: [],
            notes: "", // 트리 fetch에서는 빈 값으로 옴
          },
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      useDocumentStore
        .getState()
        ._syncProjectDocuments("project-1", serverDocs);

      const state = useDocumentStore.getState().documents;

      // content는 보존됨 (빈 문자열이면 기존 content 유지)
      expect(state["doc-1"].content).toBe("Important local content");
      // metadata는 shallow merge되므로, 서버가 빈 문자열을 보내면 덮어씌워짐
      // 이는 의도된 동작: 서버가 명시적으로 빈 값을 보내면 그 값을 사용
      expect(state["doc-1"].metadata.notes).toBe("");
      // 다른 필드는 업데이트됨
      expect(state["doc-1"].updatedAt).toBe("2025-01-02T00:00:00Z");
    });
  });

  describe("_reorder", () => {
    it("should update order and parentId of documents", () => {
      const doc1: Document = {
        id: "doc-1",
        projectId: "project-1",
        title: "Doc 1",
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
      };

      const doc2: Document = {
        ...doc1,
        id: "doc-2",
        title: "Doc 2",
        order: 1,
      };

      const doc3: Document = {
        ...doc1,
        id: "doc-3",
        title: "Doc 3",
        order: 2,
      };

      useDocumentStore.getState()._create(doc1);
      useDocumentStore.getState()._create(doc2);
      useDocumentStore.getState()._create(doc3);

      // Reorder: doc-3, doc-1, doc-2 under parent-1
      useDocumentStore
        .getState()
        ._reorder("parent-1", ["doc-3", "doc-1", "doc-2"]);

      const state = useDocumentStore.getState().documents;

      expect(state["doc-3"].order).toBe(0);
      expect(state["doc-3"].parentId).toBe("parent-1");

      expect(state["doc-1"].order).toBe(1);
      expect(state["doc-1"].parentId).toBe("parent-1");

      expect(state["doc-2"].order).toBe(2);
      expect(state["doc-2"].parentId).toBe("parent-1");
    });

    it("should handle null parentId (move to root)", () => {
      const doc: Document = {
        id: "doc-1",
        projectId: "project-1",
        title: "Doc 1",
        type: "text",
        content: "",
        synopsis: "",
        parentId: "old-parent",
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
      };

      useDocumentStore.getState()._create(doc);

      useDocumentStore.getState()._reorder(null, ["doc-1"]);

      const state = useDocumentStore.getState().documents;

      expect(state["doc-1"].parentId).toBeUndefined();
      expect(state["doc-1"].order).toBe(0);
    });
  });
});
