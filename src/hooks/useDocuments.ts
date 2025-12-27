import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import {
  useDocumentStore,
  localDocumentRepository,
} from "@/repositories/LocalDocumentRepository";
import type {
  Document,
  DocumentTreeNode,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/types/document";
import {
  documentService,
  mapBackendToFrontend,
  type BackendDocument,
} from "@/services/documentService";

/**
 * Hook to access the entire document tree for a project
 */
export function useDocumentTree(projectId: string) {
  const { _syncProjectDocuments } = useDocumentStore();
  const lastSyncedDataRef = useRef<string>("");

  const { data: fetchedDocuments, isLoading: isFetching } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      try {
        const response = await documentService.getTree(projectId);
        const backendDocs = response.data || [];

        // Flatten nested tree structure into a flat array
        const flattenTree = (docs: BackendDocument[]): BackendDocument[] => {
          const result: BackendDocument[] = [];
          for (const doc of docs) {
            result.push(doc);
            if (doc.children && doc.children.length > 0) {
              result.push(...flattenTree(doc.children));
            }
          }
          return result;
        };

        const flatDocs = flattenTree(backendDocs);

        // Convert backend documents to frontend format
        return flatDocs.map(mapBackendToFrontend);
      } catch (error) {
        // 404 means no documents yet - this is normal for new projects
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          404
        ) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!projectId,
    staleTime: 0, // Always refetch to get latest tree from backend
    refetchOnMount: "always", // Force refetch when component mounts
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (
        (error as { response?: { status?: number } })?.response?.status === 404
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sync fetched documents to Zustand store
  useEffect(() => {
    if (fetchedDocuments && fetchedDocuments.length > 0) {
      const dataStr = JSON.stringify(fetchedDocuments);
      if (lastSyncedDataRef.current !== dataStr) {
        lastSyncedDataRef.current = dataStr;
        _syncProjectDocuments(projectId, fetchedDocuments);
      }
    }
  }, [projectId, fetchedDocuments, _syncProjectDocuments]);

  // Zustand store documents as fallback
  const storeDocuments = useDocumentStore(
    useShallow((state) =>
      Object.values(state.documents).filter(
        (doc) => doc.projectId === projectId,
      ),
    ),
  );

  // Use store documents as the primary source of truth to support optimistic updates
  // The store is kept in sync with backend data via the useEffect above
  const documents = storeDocuments;

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

  const sortedChildren = useMemo(() => {
    return [...children].sort((a, b) => a.order - b.order);
  }, [children]);

  return {
    children: sortedChildren,
    isLoading: false,
  };
}

/**
 * Hook to get and save document content for a specific document
 */
export function useDocumentContent(id: string | null) {
  const queryClient = useQueryClient();
  const { _setContent } = useDocumentStore();

  // Zustand store content as fallback
  const storeContent = useDocumentStore((state) =>
    id ? state.documents[id]?.content || "" : "",
  );

  const {
    data: fetchedContent,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["document-content", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const response = await documentService.getContent(id);
        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;
        if (isSuccess && response.data) {
          return response.data.content;
        }
        return null;
      } catch (error) {
        // 404 means content not found - use local cache
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          404
        ) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 0, // Always refetch to get latest content from backend
    refetchOnMount: "always", // Force refetch when component mounts
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (
        (error as { response?: { status?: number } })?.response?.status === 404
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sync fetched content to Zustand store
  useEffect(() => {
    if (id && fetchedContent !== undefined && fetchedContent !== null) {
      _setContent(id, fetchedContent);
    }
  }, [id, fetchedContent, _setContent]);

  // Use fetched content if available, otherwise fall back to store content
  const content =
    fetchedContent !== undefined && fetchedContent !== null
      ? fetchedContent
      : storeContent;

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!id) return;

      const originalContent =
        useDocumentStore.getState().documents[id]?.content || "";

      try {
        _setContent(id, newContent);

        const response = await documentService.updateContent(id, newContent);

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
          // Update react-query cache with new content to prevent stale data on re-fetch
          queryClient.setQueryData(["document-content", id], newContent);
        }
      } catch (error) {
        console.error("Failed to save content:", error);
        _setContent(id, originalContent);
      }
    },
    [id, _setContent, queryClient],
  );

  return {
    content,
    saveContent,
    isLoading: isLoading || isFetching,
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
  const queryClient = useQueryClient();
  const { _create, _update, _delete } = useDocumentStore();

  const createDocument = useCallback(
    async (input: Omit<CreateDocumentInput, "projectId">) => {
      try {
        // Include projectId in payload - backend expects it in body
        const payload = {
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
          // Convert backend document to frontend format
          const frontendDoc = mapBackendToFrontend(response.data);
          _create(frontendDoc);
          // Invalidate documents query to refetch tree with new document
          queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
          return frontendDoc;
        }
      } catch (error: unknown) {
        console.error(
          "[useDocumentMutations] Failed to create document:",
          error,
        );

        // Fallback to local-only creation if backend fails
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 500 || err?.response?.status === 404) {
          const localDocumentRepository =
            await import("@/repositories/LocalDocumentRepository").then(
              (m) => m.localDocumentRepository,
            );

          try {
            const localDoc = await localDocumentRepository.create({
              projectId,
              ...input,
            });
            _create(localDoc);
            return localDoc;
          } catch (localError) {
            console.error(
              "[useDocumentMutations] Local fallback failed:",
              localError,
            );
          }
        }
      }
      return null;
    },
    [projectId, _create, queryClient],
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
      // 1. Snapshot previous order for rollback
      // We explicitly capture state here to avoid closure staleness, though getState() is generally safe.
      const { documents, _reorder } = useDocumentStore.getState();

      const previousSiblingIds = Object.values(documents)
        .filter(
          (doc) =>
            doc.projectId === projectId &&
            doc.parentId === (parentId ?? undefined),
        )
        .sort((a, b) => a.order - b.order)
        .map((doc) => doc.id);

      // 2. Optimistic Update: Update local store immediately
      _reorder(parentId, orderedIds);

      // 3. Sync with Backend
      try {
        await documentService.reorder(parentId, orderedIds);
        // 4. Ensure data consistency by invalidating queries
        queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
      } catch (error) {
        console.error("Failed to reorder documents:", error);
        // 5. Rollback on failure
        if (previousSiblingIds.length > 0) {
          _reorder(parentId, previousSiblingIds);
        }
      }
    },
    [projectId, queryClient],
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
export function useDescendantDocuments(
  parentId: string | null,
  projectId: string,
) {
  const documents = useDocumentStore((state) => state.documents);

  const flatDocuments = useMemo(() => {
    if (!parentId) return [];
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

function buildTree(documents: Document[]): DocumentTreeNode[] {
  const map = new Map<string, DocumentTreeNode>();
  const roots: DocumentTreeNode[] = [];

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

  // Sort children of each node
  map.forEach((node) => {
    node.children.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  return roots.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
