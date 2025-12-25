import { useCallback, useMemo } from "react";
import {
  useDocumentStore,
  localDocumentRepository,
} from "@/repositories/LocalDocumentRepository";
import type {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/types/document";

/**
 * Hook to access the entire document tree for a project
 */
export function useDocumentTree(projectId: string) {
  const documents = useDocumentStore((state) =>
    Object.values(state.documents).filter((doc) => doc.projectId === projectId),
  );

  const tree = buildTree(documents);

  return {
    documents,
    tree,
    isLoading: false,
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
  const children = useDocumentStore((state) => {
    return Object.values(state.documents).filter(
      (doc) =>
        doc.projectId === projectId && doc.parentId === (parentId ?? undefined),
    );
  });

  return {
    children: children.sort((a, b) => a.order - b.order),
    isLoading: false,
  };
}

/**
 * Hook to get and save document content for a specific document
 * Saves to backend API and syncs wordCount/updatedAt from response
 */
export function useDocumentContent(id: string | null) {
  const content = useDocumentStore((state) =>
    id ? state.documents[id]?.content || "" : "",
  );

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!id) return;

      try {
        // Optimistic update - immediate UI feedback
        const { _setContent } = useDocumentStore.getState();
        _setContent(id, newContent);

        // Sync to backend
        const { documentService } = await import("@/services/documentService");
        const response = await documentService.updateContent(id, newContent);

        // Update wordCount and updatedAt from backend response
        if (response.success && response.data) {
          const { _update } = useDocumentStore.getState();
          _update(id, {
            metadata: { wordCount: response.data.wordCount },
            updatedAt: response.data.updatedAt,
          });
          console.log(`✅ Saved to backend: ${response.data.wordCount} words`);
        }
      } catch (error) {
        console.error("❌ Failed to save content:", error);
        // TODO: Show error toast to user
        // Rollback on error
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
        // Optimistic update - update all documents locally first
        const { _setBulkContent } = useDocumentStore.getState();
        _setBulkContent(updates);

        // Then sync each to backend
        const { documentService } = await import("@/services/documentService");
        await Promise.all(
          Object.entries(updates).map(([id, content]) =>
            documentService.updateContent(id, content),
          ),
        );

        console.log(`✅ Bulk saved ${Object.keys(updates).length} documents`);
      } catch (error) {
        console.error("❌ Bulk save failed:", error);
        // TODO: Implement rollback for bulk operations
      }
    },
    [],
  );

  return {
    bulkSaveContent,
  };
}
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
 * Used for Scrivenings View
 */
export function useDescendantDocuments(parentId: string, projectId: string) {
  const documents = useDocumentStore((state) => state.documents);

  // Use useMemo to re-calculate flattened list whenever documents change
  // Optimization: This might be expensive if many documents change.
  // Ideally should use a selector that only listens to relevant docs.
  // For now, simple memoization is fine for local.
  const flatDocuments = useMemo(() => {
    const result: (typeof documents)[string][] = [];

    // Add parent first
    const parent = documents[parentId];
    if (parent && parent.projectId === projectId) {
      result.push(parent);
    }

    // Recursive helper
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
  }, [documents, parentId, projectId]); // Re-run when any document changes (simplest trigger)

  return {
    documents: flatDocuments,
    isLoading: false,
  };
}

// Helper function to build tree
function buildTree(documents: Document[]) {
  const map = new Map<string, Document & { children: Document[] }>();
  const roots: (Document & { children: Document[] })[] = [];

  // First pass: create all nodes
  documents.forEach((doc) => {
    map.set(doc.id, { ...doc, children: [] });
  });

  // Second pass: build relationships
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
}
