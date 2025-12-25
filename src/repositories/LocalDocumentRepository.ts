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
  _delete: (id: string) => void;
  _setContent: (id: string, content: string) => void;
  _setBulkContent: (updates: Record<string, string>) => void;
  _setAll: (documents: Document[]) => void;
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
    })),
    { name: "sto-link-documents" },
  ),
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
    projectId: string,
  ): Promise<Document[]> {
    const { documents } = this.getStore();
    return Object.values(documents)
      .filter(
        (doc) =>
          doc.projectId === projectId &&
          doc.parentId === (parentId ?? undefined),
      )
      .sort((a, b) => a.order - b.order);
  }

  async create(input: CreateDocumentInput): Promise<Document> {
    const store = this.getStore();

    // Calculate order
    const siblings = Object.values(store.documents).filter(
      (doc) =>
        doc.projectId === input.projectId && doc.parentId === input.parentId,
    );
    const order = siblings.length;

    const now = new Date().toISOString();
    const newDoc: Document = {
      id: generateId(),
      projectId: input.projectId,
      parentId: input.parentId,
      type: input.type,
      title: input.title,
      content: "",
      synopsis: input.synopsis || "",
      order,
      metadata: {
        ...createDefaultMetadata(),
        targetWordCount: input.targetWordCount,
      },
      characterIds: [],
      foreshadowingIds: [],
      createdAt: now,
      updatedAt: now,
    };

    store._create(newDoc);
    return newDoc;
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    const store = this.getStore();
    const doc = store.documents[id];
    if (!doc) throw new Error(`Document not found: ${id}`);

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
