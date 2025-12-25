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
  UpdateDocumentInput,
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
  const content = useDocumentStore((state) =>
    id ? state.documents[id]?.content || "" : "",
  );

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!id) return;

      try {
        const { _setContent } = useDocumentStore.getState();
        _setContent(id, newContent);

        const { documentService } = await import("@/services/documentService");
        const response = await documentService.updateContent(id, newContent);

        if (response.success && response.data) {
          const { _update } = useDocumentStore.getState();
          _update(id, {
            metadata: { wordCount: response.data.wordCount },
            updatedAt: response.data.updatedAt,
          });
        }
      } catch (error) {
        console.error("Failed to save content:", error);
        const originalContent = await localDocumentRepository.getContent(id);
        const { _setContent } = useDocumentStore.getState();
        _setContent(id, originalContent);
      }
    },
    [id],
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
        const { _setBulkContent } = useDocumentStore.getState();
        _setBulkContent(updates);

        const { documentService } = await import("@/services/documentService");
        await Promise.all(
          Object.entries(updates).map(([id, content]) =>
            documentService.updateContent(id, content),
          ),
        );
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
  const createDocument = useCallback(
    async (input: CreateDocumentInput) => {
      return await localDocumentRepository.create({
        ...input,
        projectId,
      });
    },
    [projectId],
  );

  const updateDocument = useCallback(
    async (id: string, input: UpdateDocumentInput) => {
      return await localDocumentRepository.update(id, input);
    },
    [],
  );

  const deleteDocument = useCallback(async (id: string) => {
    await localDocumentRepository.delete(id);
  }, []);

  const reorderDocuments = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      await localDocumentRepository.reorder(parentId, orderedIds);
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
