// useDocumentHooks.ts

import { useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import {
  useDocumentStore,
  localDocumentRepository,
} from "@/repositories/LocalDocumentRepository";
import type {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  Document,
  CreateDocumentInput,
} from "@/types/document";
import { documentService } from "@/services/documentService";

/**
 * Hook to access the entire document tree for a project
 */
export function useDocumentTree(projectId: string) {
  const { _syncProjectDocuments } = useDocumentStore();

  // Fetch documents from backend and sync to local store
  const { data: fetchedDocuments, isLoading: isFetching } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      const response = await documentService.getTree(projectId);
      return response.data || [];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute stale time to prevent too frequent refetches on re-renders, but ensures fresh data on reload
  });

  // Sync to store when data is fetched
  useEffect(() => {
    if (fetchedDocuments) {
      _syncProjectDocuments(projectId, fetchedDocuments);
    }
  }, [projectId, fetchedDocuments, _syncProjectDocuments]);

  const documents = useDocumentStore(
    useShallow((state) =>
      Object.values(state.documents).filter(
        (doc) => doc.projectId === projectId,
      ),
    ),
  );

  const tree = buildTree(documents);

  return {
    documents,
    tree,
    isLoading: isFetching,
  };
}

/**
 * Hook to get a single document by ID
 */
export function useDocument(id: string | null) {
  const document = useDocumentStore((state) =>
    id ? state.documents[id] : null,
  );

  const updateDocument = useCallback(
    async (updates: UpdateDocumentInput) => {
      if (!id) return;
      await localDocumentRepository.update(id, updates);
    },
    [id],
  );

  return {
    document,
    updateDocument,
    isLoading: false,
  };
}

/**
 * Hook to get child documents of a parent
 */
export function useChildDocuments(parentId: string | null, projectId: string) {
  const children = useDocumentStore(
    useShallow((state) =>
      Object.values(state.documents).filter(
        (doc) =>
          doc.projectId === projectId &&
          doc.parentId === (parentId ?? undefined),
      ),
    ),
  );

  return {
    children: children.sort((a, b) => a.order - b.order),
    isLoading: false,
  };
}

/**
 * Hook to get and save document content for a specific document
 */
export function useDocumentContent(id: string | null) {
  const { _setContent } = useDocumentStore();
  const content = useDocumentStore((state) =>
    id ? state.documents[id]?.content || "" : "",
  );

  // Fetch content from backend if it's missing or we want to ensure freshness
  useQuery({
    queryKey: ["document-content", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await documentService.getContent(id);
      const isSuccess =
        response.success || response.status === "OK" || response.code === 200;
      if (isSuccess && response.data) {
        _setContent(id, response.data.content);
        return response.data.content;
      }
      return null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!id) return;

      // Capture original content for rollback
      const originalContent =
        useDocumentStore.getState().documents[id]?.content || "";

      try {
        console.log(`[useDocuments] Saving content for ${id}...`);
        // Optimistic update
        _setContent(id, newContent);

        const response = await documentService.updateContent(id, newContent);
        console.log("[useDocuments] Save response:", response);

        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;

        if (isSuccess && response.data) {
          const { _update } = useDocumentStore.getState();
          _update(id, {
            metadata: {
              ...useDocumentStore.getState().documents[id]?.metadata,
              wordCount: response.data.wordCount,
            },
            updatedAt: response.data.updatedAt,
          });
        }
      } catch (error) {
        console.error("Failed to save content:", error);
        // Rollback to captured original content
        _setContent(id, originalContent);
      }
    },
    [id, _setContent],
  );

  return {
    content,
    saveContent,
    isLoading: false,
  };
}

/**
 * Hook for bulk document content operations (Scrivenings view)
 */
export function useBulkDocumentContent() {
  const bulkSaveContent = useCallback(
    async (updates: Record<string, string>) => {
      try {
        console.log(
          `[useDocuments] Bulk saving ${Object.keys(updates).length} documents...`,
        );
        const { _setBulkContent } = useDocumentStore.getState();
        _setBulkContent(updates);

        const results = await Promise.all(
          Object.entries(updates).map(([id, content]) =>
            documentService.updateContent(id, content),
          ),
        );
        console.log("[useDocuments] Bulk save completed:", results);
      } catch (error) {
        console.error("Bulk save failed:", error);
      }
    },
    [],
  );

  return {
    bulkSaveContent,
  };
}

/**
 * Hook for document mutations (create, update, delete, reorder)
 */
export function useDocumentMutations(projectId: string) {
  const { _create, _update, _delete } = useDocumentStore();

  const createDocument = useCallback(
    async (input: Omit<CreateDocumentInput, "projectId">) => {
      try {
        const payload: CreateDocumentInput = {
          ...input,
          projectId,
        };
        const response = await documentService.create(projectId, payload);
        const isSuccess =
          response.success ||
          response.status === "OK" ||
          response.status === "CREATED" ||
          response.code === 200 ||
          response.code === 201;
        if (isSuccess && response.data) {
          _create(response.data);
          return response.data;
        }
      } catch (error) {
        console.error("Failed to create document:", error);
      }
      return null;
    },
    [projectId, _create],
  );

  const updateDocument = useCallback(
    async (id: string, input: UpdateDocumentInput) => {
      try {
        const response = await documentService.update(id, input);
        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;
        if (isSuccess && response.data) {
          _update(id, response.data);
          return response.data;
        }
      } catch (error) {
        console.error("Failed to update document:", error);
      }
      return null;
    },
    [_update],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        const response = await documentService.delete(id);
        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;
        if (isSuccess) {
          _delete(id);
        }
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    },
    [_delete],
  );

  const reorderDocuments = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      try {
        const response = await documentService.reorder(parentId, orderedIds);
        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;
        if (isSuccess) {
          // Local update logic for reordering if needed,
          // but usually we can just invalidate the tree query
        }
      } catch (error) {
        console.error("Failed to reorder documents:", error);
      }
    },
    [],
  );

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    reorderDocuments,
  };
}

/**
 * Hook for fetching a document and all its descendants (flattened)
 */
export function useDescendantDocuments(parentId: string, projectId: string) {
  const documents = useDocumentStore((state) => state.documents);

  const flatDocuments = useMemo(() => {
    const result: (typeof documents)[string][] = [];

    const parent = documents[parentId];
    if (parent && parent.projectId === projectId) {
      result.push(parent);
    }

    const traverse = (currentId: string) => {
      const children = Object.values(documents)
        .filter((d) => d.parentId === currentId && d.projectId === projectId)
        .sort((a, b) => a.order - b.order);

      for (const child of children) {
        result.push(child);
        traverse(child.id);
      }
    };

    traverse(parentId);
    return result;
  }, [documents, parentId, projectId]);

  return {
    documents: flatDocuments,
    isLoading: false,
  };
}

// Helper function to build tree
function buildTree(documents: Document[]) {
  const map = new Map<string, Document & { children: Document[] }>();
  const roots: (Document & { children: Document[] })[] = [];

  documents.forEach((doc) => {
    map.set(doc.id, { ...doc, children: [] });
  });

  documents.forEach((doc) => {
    const node = map.get(doc.id);
    if (!node) return;

    if (doc.parentId) {
      const parent = map.get(doc.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => a.order - b.order);
}
