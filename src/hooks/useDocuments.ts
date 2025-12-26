import { useCallback, useMemo, useEffect } from "react";
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
} from "@/services/documentService";

/**
 * Hook to access the entire document tree for a project
 */
export function useDocumentTree(projectId: string) {
  const { _syncProjectDocuments } = useDocumentStore();

  const { data: fetchedDocuments, isLoading: isFetching } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      try {
        const response = await documentService.getTree(projectId);
        const backendDocs = response.data || [];

        // Flatten nested tree structure into a flat array
        const flattenTree = (docs: any[]): any[] => {
          const result: any[] = [];
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
        if ((error as any)?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!projectId,
    staleTime: 5000,
    refetchOnMount: true, // Refetch on mount but respect staleTime
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if ((error as any)?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sync fetched documents to Zustand store
  useEffect(() => {
    if (fetchedDocuments && fetchedDocuments.length > 0) {
      _syncProjectDocuments(projectId, fetchedDocuments);
    }
  }, [projectId, fetchedDocuments, _syncProjectDocuments]);

  // Zustand store documents as fallback
  const storeDocuments = useDocumentStore(
    useShallow((state) =>
      Object.values(state.documents).filter(
        (doc) => doc.projectId === projectId
      )
    )
  );

  // Use fetched documents if available, otherwise fall back to store
  const documents =
    fetchedDocuments && fetchedDocuments.length > 0
      ? fetchedDocuments
      : storeDocuments;

  const tree = useMemo(() => buildTree(documents), [documents]);

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
    id ? state.documents[id] : null
  );

  const updateDocument = useCallback(
    async (updates: UpdateDocumentInput) => {
      if (!id) return;
      await localDocumentRepository.update(id, updates);
    },
    [id]
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
          doc.parentId === (parentId ?? undefined)
      )
    )
  );

  return {
    children: [...children].sort((a, b) => a.order - b.order),
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
    id ? state.documents[id]?.content || "" : ""
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
        if ((error as any)?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5000,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if ((error as any)?.response?.status === 404) {
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
    [id, _setContent, queryClient]
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
            documentService.updateContent(id, content)
          )
        );
      } catch (error) {
        console.error("Bulk save failed:", error);
      }
    },
    []
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
      } catch (error: any) {
        console.error(
          "[useDocumentMutations] Failed to create document:",
          error
        );
      }
      return null;
    },
    [projectId, _create, queryClient]
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
    [_update]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        const response = await documentService.delete(id);
        const isSuccess =
          // Check for 204 No Content as well, combined with other success codes
          response.success ||
          response.status === "OK" ||
          response.code === 200 ||
          response.code === 204;

        // Since API might return empty body for delete, relax the check
        if (isSuccess || !response.error) {
          _delete(id);
          // Invalidate documents query to refetch tree with deleted document removed
          queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
        }
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    },
    [projectId, _delete, queryClient]
  );

  const reorderDocuments = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      try {
        await documentService.reorder(parentId, orderedIds);
      } catch (error) {
        console.error("Failed to reorder documents:", error);
      }
    },
    []
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
  projectId: string
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

export function buildTree(documents: Document[]): DocumentTreeNode[] {
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

  return roots.sort((a, b) => a.order - b.order);
}
