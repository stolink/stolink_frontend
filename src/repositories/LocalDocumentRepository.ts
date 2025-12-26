// Local Document Repository - Zustand-based implementation
// Uses localStorage persistence for offline/demo usage

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentMetadata,
} from "@/types/document";
import type { IDocumentRepository } from "./DocumentRepository";

// Generate unique ID
const generateId = () =>
  `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default metadata
const createDefaultMetadata = (): DocumentMetadata => ({
  status: "draft",
  wordCount: 0,
  includeInCompile: true,
  keywords: [],
  notes: "",
});

// Zustand store for local documents
interface DocumentStore {
  documents: Record<string, Document>;

  // Internal actions (called by repository)
  _create: (doc: Document) => void;
  _update: (id: string, updates: Partial<Document>) => void;
  _updateType: (id: string, type: "folder" | "text") => void;
  _delete: (id: string) => void;
  _setContent: (id: string, content: string) => void;
  _setBulkContent: (updates: Record<string, string>) => void;
  _setAll: (documents: Document[]) => void;
  _syncProjectDocuments: (projectId: string, documents: Document[]) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    immer((set) => ({
      documents: {},

      _create: (doc) => {
        set((state) => {
          state.documents[doc.id] = doc;
        });
      },

      _update: (id, updates) => {
        set((state) => {
          if (state.documents[id]) {
            state.documents[id] = {
              ...state.documents[id],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      },

      _updateType: (id: string, type: "folder" | "text") => {
        set((state) => {
          if (state.documents[id]) {
            state.documents[id].type = type;
            state.documents[id].updatedAt = new Date().toISOString();
          }
        });
      },

      _delete: (id) => {
        set((state) => {
          delete state.documents[id];
        });
      },

      _setContent: (id, content) => {
        set((state) => {
          if (state.documents[id]) {
            state.documents[id].content = content;
            state.documents[id].metadata.wordCount = content.length;
            state.documents[id].updatedAt = new Date().toISOString();
          }
        });
      },

      _setBulkContent: (updates) => {
        set((state) => {
          Object.entries(updates).forEach(([id, content]) => {
            if (state.documents[id]) {
              state.documents[id].content = content;
              state.documents[id].metadata.wordCount = content.length;
              state.documents[id].updatedAt = new Date().toISOString();
            }
          });
        });
      },

      _setAll: (documents) => {
        set((state) => {
          state.documents = {};
          documents.forEach((doc) => {
            state.documents[doc.id] = doc;
          });
        });
      },

      _syncProjectDocuments: (projectId, documents) => {
        set((state) => {
          // 1. Identify IDs of documents being synced
          const incomingIds = new Set(documents.map((d) => d.id));

          // 2. Remove documents for this project that are NO LONGER in the project tree
          Object.keys(state.documents).forEach((id) => {
            if (
              state.documents[id].projectId === projectId &&
              !incomingIds.has(id)
            ) {
              delete state.documents[id];
            }
          });

          // 3. Update or add documents, preserving content/metadata if missing in fetch
          documents.forEach((doc) => {
            const existing = state.documents[doc.id];
            state.documents[doc.id] = {
              ...existing,
              ...doc,
              // Critical: fetch from tree often lacks content. Preserve it if we have it locally.
              content: doc.content || existing?.content || "",
              metadata: {
                ...existing?.metadata,
                ...doc.metadata,
              },
            };
          });
        });
      },
    })),
    { name: "sto-link-documents" }
  )
);

// Repository implementation
export class LocalDocumentRepository implements IDocumentRepository {
  private getStore() {
    return useDocumentStore.getState();
  }

  async getByProject(projectId: string): Promise<Document[]> {
    const { documents } = this.getStore();
    return Object.values(documents)
      .filter((doc) => doc.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<Document | null> {
    const { documents } = this.getStore();
    return documents[id] || null;
  }

  async getChildren(
    parentId: string | null,
    projectId: string
  ): Promise<Document[]> {
    const { documents } = this.getStore();
    return Object.values(documents)
      .filter(
        (doc) =>
          doc.projectId === projectId &&
          doc.parentId === (parentId ?? undefined)
      )
      .sort((a, b) => a.order - b.order);
  }

  async getAllDescendants(
    parentId: string,
    projectId: string
  ): Promise<Document[]> {
    const { documents } = this.getStore();
    const result: Document[] = [];

    // Recursive function to traversing the tree
    const traverse = (currentId: string) => {
      const children = Object.values(documents)
        .filter(
          (doc) => doc.projectId === projectId && doc.parentId === currentId
        )
        .sort((a, b) => a.order - b.order);

      for (const child of children) {
        result.push(child);
        traverse(child.id);
      }
    };

    // First, verify parent exists (optional, but good for safety)
    const parent = documents[parentId];
    if (parent) {
      // Include the parent itself? Scrivenings usually includes the selection + descendants.
      // But this function is named "Descendants".
      // Let's stick to descendants. The hook can combine parent + descendants.
      // Wait, ScriveningsEditor likely wants to show the *selected folder's content* too if it has any?
      // Usually folders in StoLink were just containers. But now user wants "Section under Section".
      // So the "Parent Section" definitely has content.
      // So `ScriveningsEditor` receives `folderId`. It should render `folderId` doc + descendants.

      traverse(parentId);
    }

    return result;
  }

  async create(input: CreateDocumentInput): Promise<Document> {
    throw new Error(
      "Local document creation is not supported. Use backend mutation."
    );
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    const store = this.getStore();
    const doc = store.documents[id];
    if (!doc) {
      // Document not in local store - this happens when backend documents aren't synced locally yet
      console.warn(
        `[LocalDocumentRepository] Document not found in local store: ${id}. Skipping local update.`
      );
      // Return a minimal document to satisfy the interface
      return {
        id,
        projectId: "",
        type: "text",
        title: "",
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const updates: Partial<Document> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.synopsis !== undefined) updates.synopsis = input.synopsis;
    if (input.order !== undefined) updates.order = input.order;
    if (input.characterIds !== undefined)
      updates.characterIds = input.characterIds;
    if (input.foreshadowingIds !== undefined)
      updates.foreshadowingIds = input.foreshadowingIds;
    if (input.metadata) {
      updates.metadata = { ...doc.metadata, ...input.metadata };
    }

    store._update(id, updates);
    return { ...doc, ...updates };
  }

  async delete(id: string): Promise<void> {
    const store = this.getStore();
    // Also delete all children recursively
    const toDelete = [id];
    const findChildren = (parentId: string) => {
      Object.values(store.documents).forEach((doc) => {
        if (doc.parentId === parentId) {
          toDelete.push(doc.id);
          findChildren(doc.id);
        }
      });
    };
    findChildren(id);

    toDelete.forEach((docId) => store._delete(docId));
  }

  async reorder(parentId: string | null, orderedIds: string[]): Promise<void> {
    const store = this.getStore();
    orderedIds.forEach((id, index) => {
      if (store.documents[id]) {
        store._update(id, { order: index });
      }
    });
  }

  async getContent(id: string): Promise<string> {
    const { documents } = this.getStore();
    return documents[id]?.content || "";
  }

  async updateContent(id: string, content: string): Promise<void> {
    this.getStore()._setContent(id, content);
  }

  async bulkUpdateContent(updates: Record<string, string>): Promise<void> {
    this.getStore()._setBulkContent(updates);
  }
}

// Singleton instance
export const localDocumentRepository = new LocalDocumentRepository();
