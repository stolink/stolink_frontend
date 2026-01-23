import { describe, it, expect } from "vitest";
import {
  documentService,
  mapBackendToFrontend,
  type BackendDocument,
} from "./documentService";

describe("mapBackendToFrontend", () => {
  it("should convert backend document to frontend format", () => {
    const backendDoc: BackendDocument = {
      id: "doc-1",
      projectId: "project-1",
      type: "text",
      title: "Test Document",
      content: "Test content",
      synopsis: "Test synopsis",
      order: 0,
      status: "draft",
      wordCount: 12,
      includeInCompile: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      isPublished: false,
    };

    const frontendDoc = mapBackendToFrontend(backendDoc);

    expect(frontendDoc.id).toBe("doc-1");
    expect(frontendDoc.type).toBe("text");
    expect(frontendDoc.metadata.status).toBe("draft");
    expect(frontendDoc.metadata.wordCount).toBe(12);
    expect(frontendDoc.characterIds).toEqual([]);
    expect(frontendDoc.foreshadowingIds).toEqual([]);
  });

  it("should handle missing optional fields", () => {
    const backendDoc: BackendDocument = {
      id: "doc-2",
      projectId: "project-1",
      type: "folder",
      title: "Chapter 1",
      order: 0,
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      isPublished: false,
    };

    const frontendDoc = mapBackendToFrontend(backendDoc);

    expect(frontendDoc.content).toBe("");
    expect(frontendDoc.synopsis).toBe("");
    expect(frontendDoc.metadata.keywords).toEqual([]);
    expect(frontendDoc.metadata.notes).toBe("");
  });

  it("should normalize type to lowercase", () => {
    const backendDoc: BackendDocument = {
      id: "doc-3",
      projectId: "project-1",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "FOLDER" as any, // Cast to avoid build error while keeping logic test
      title: "Test",
      order: 0,
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      isPublished: false,
    };

    const frontendDoc = mapBackendToFrontend(backendDoc);

    expect(frontendDoc.type).toBe("folder");
  });
});

describe("documentService", () => {
  describe("getTree", () => {
    it("should fetch document tree for a project", async () => {
      const result = await documentService.getTree("project-1");

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should handle params", async () => {
      const result = await documentService.getTree("project-1", {
        tree: true,
        type: "folder",
      });

      expect(result).toBeDefined();
    });
  });

  describe("getById", () => {
    it("should fetch a single document", async () => {
      const result = await documentService.getById("doc-1");

      expect(result).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create a new document", async () => {
      const result = await documentService.create("project-1", {
        type: "text",
        title: "New Document",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should create with optional fields", async () => {
      const result = await documentService.create("project-1", {
        type: "folder",
        title: "New Chapter",
        parentId: "doc-1",
        synopsis: "Chapter synopsis",
        targetWordCount: 5000,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a document", async () => {
      const result = await documentService.update("doc-1", {
        title: "Updated Title",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should update with multiple fields", async () => {
      const result = await documentService.update("doc-1", {
        title: "Updated Title",
        synopsis: "Updated synopsis",
        metadata: { status: "revised" },
      });

      expect(result).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete a document", async () => {
      const result = await documentService.delete("doc-1");

      expect(result).toBeDefined();
    });
  });

  describe("getContent", () => {
    it("should fetch document content", async () => {
      const result = await documentService.getContent("doc-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("updateContent", () => {
    it("should update document content", async () => {
      const result = await documentService.updateContent(
        "doc-1",
        "New content",
      );

      expect(result).toBeDefined();
    });
  });

  describe("reorder", () => {
    it("should reorder documents", async () => {
      const result = await documentService.reorder(null, ["doc-2", "doc-1"]);

      expect(result).toBeDefined();
    });

    it("should reorder with parentId", async () => {
      const result = await documentService.reorder("parent-1", [
        "child-1",
        "child-2",
      ]);

      expect(result).toBeDefined();
    });
  });

  describe("bulkUpdate", () => {
    it("should perform bulk update", async () => {
      const updates = [
        { id: "doc-1", changes: { title: "Updated 1" } },
        { id: "doc-2", changes: { title: "Updated 2" } },
      ];

      const result = await documentService.bulkUpdate(updates);

      expect(result).toBeDefined();
    });
  });
});
