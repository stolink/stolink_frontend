// Document Hooks - Abstraction layer for components
// Components use these hooks instead of directly accessing repository

import { useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useDocumentStore,
  localDocumentRepository,
} from "@/repositories/LocalDocumentRepository";
import { buildDocumentTree } from "@/repositories/DocumentRepository";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/types/document";

// Get the repository (can be swapped for API version later)
const getRepository = () => localDocumentRepository;

/**
 * Hook for document tree data
 * Returns tree structure for sidebar and sync state
 */
export function useDocumentTree(projectId: string) {
  // Use shallow comparison to prevent unnecessary re-renders
  const documentIds = useDocumentStore(
    useShallow((state) =>
      Object.keys(state.documents).filter(
        (id) => state.documents[id].projectId === projectId,
      ),
    ),
  );

  const allDocuments = useDocumentStore((state) => state.documents);

  const documents = useMemo(
    () => documentIds.map((id) => allDocuments[id]).filter(Boolean),
    [documentIds, allDocuments],
  );

  const tree = useMemo(() => buildDocumentTree(documents), [documents]);

  return {
    tree,
    documents,
    isLoading: false,
  };
}

/**
 * Hook for single document data and mutations
 */
export function useDocument(id: string | null) {
  const document = useDocumentStore((state) =>
    id ? state.documents[id] : null,
  );

  const updateDocument = useCallback(
    async (updates: UpdateDocumentInput) => {
      if (!id) return;
      await getRepository().update(id, updates);
    },
    [id],
  );

  const deleteDocument = useCallback(async () => {
    if (!id) return;
    await getRepository().delete(id);
  }, [id]);

  return {
    document,
    updateDocument,
    deleteDocument,
    isLoading: false,
  };
}

/**
 * Hook for document content (separate for editor optimization)
 */
export function useDocumentContent(id: string | null) {
  const content = useDocumentStore((state) =>
    id ? state.documents[id]?.content || "" : "",
  );

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!id) return;
      await getRepository().updateContent(id, newContent);
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
 * Hook for document mutations (create, reorder)
 */
export function useDocumentMutations(projectId: string) {
  const createDocument = useCallback(
    async (input: Omit<CreateDocumentInput, "projectId">) => {
      return await getRepository().create({ ...input, projectId });
    },
    [projectId],
  );

  const reorderDocuments = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      await getRepository().reorder(parentId, orderedIds);
    },
    [],
  );

  return {
    createDocument,
    reorderDocuments,
  };
}

/**
 * Hook for bulk document content updates (Scrivenings View)
 */
export function useBulkDocumentContent() {
  const bulkSaveContent = useCallback(async (updates: Record<string, string>) => {
    await getRepository().bulkUpdateContent(updates);
  }, []);

  return {
    bulkSaveContent,
  };
}

/**
 * Hook for children documents (for corkboard view)
 */
export function useChildDocuments(parentId: string | null, projectId: string) {
  // Use shallow comparison for the IDs array
  const childIds = useDocumentStore(
    useShallow((state) =>
      Object.keys(state.documents).filter((id) => {
        const doc = state.documents[id];
        return (
          doc.projectId === projectId &&
          doc.parentId === (parentId ?? undefined)
        );
      }),
    ),
  );

  const allDocuments = useDocumentStore((state) => state.documents);

  const children = useMemo(
    () =>
      childIds
        .map((id) => allDocuments[id])
        .filter(Boolean)
        .sort((a, b) => a.order - b.order),
    [childIds, allDocuments],
  );

  return {
    children,
    isLoading: false,
  };
}
