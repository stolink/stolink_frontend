import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import {
  useDocumentStore,
  localDocumentRepository,
} from "@/repositories/LocalDocumentRepository";
import { useEditorStore } from "@/stores/useEditorStore";
import { useForeshadowingStore } from "@/stores/useForeshadowingStore";
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
import { handle404 } from "@/lib/errorHandler";

// Query Keys Factory
export const documentKeys = {
  all: ["documents"] as const,
  trees: () => [...documentKeys.all, "tree"] as const,
  tree: (projectId: string) => [...documentKeys.trees(), projectId] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (documentId: string) =>
    [...documentKeys.details(), documentId] as const,
  contents: () => [...documentKeys.all, "content"] as const,
  content: (documentId: string) =>
    [...documentKeys.contents(), documentId] as const,
};

/**
 * Hook to access the entire document tree for a project
 */
export function useDocumentTree(projectId: string) {
  const { _syncProjectDocuments } = useDocumentStore();
  const lastSyncedDataRef = useRef<string>("");

  const { data: fetchedDocuments, isLoading: isFetching } = useQuery({
    queryKey: documentKeys.tree(projectId),
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
        // 404 means no documents yet - return empty array for new projects
        return handle404(error, []) ?? [];
      }
    },
    enabled: !!projectId,
    staleTime: 30000, // 30s - Reduces unnecessary tree refetches while maintaining sync via mutations
    refetchOnMount: "always", // Force refetch when component mounts to ensure latest tree
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

  // Memoize tree building to avoid expensive recalculation on every render
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

  const {
    data: infiniteData,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: documentKeys.content(id || ""),
    queryFn: async ({ pageParam = 1 }) => {
      if (!id) return null;
      try {
        const response = await documentService.getContent(id, pageParam);
        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;
        if (isSuccess && response.data) {
          return {
            content: response.data.content,
            page: response.data.page,
            totalPages: response.data.totalPages,
          };
        }
        return null;
      } catch (error) {
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          404
        ) {
          return null;
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!id,
    staleTime: 60000, // 1 min - Content is stable unless mutated
    gcTime: 1000 * 60 * 10, // 10 mins cache for better UX when switching back to recently visited sections
    retry: (failureCount, error) => {
      if (
        (error as { response?: { status?: number } })?.response?.status === 404
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Zustand store content as fallback
  const storeContent = useDocumentStore((state) =>
    id ? state.documents[id]?.content || "" : "",
  );

  // Aggregate content from all pages
  const aggregatedContent = useMemo(() => {
    if (!infiniteData) {
      return storeContent;
    }
    return infiniteData.pages.map((page) => page?.content || "").join("");
  }, [infiniteData, storeContent]);

  // Use fetched content if available, otherwise fall back to store content
  const content = aggregatedContent;

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!id) return;

      const originalContent =
        useDocumentStore.getState().documents[id]?.content || "";

      try {
        _setContent(id, newContent); // Optimistic update

        // For infinite scroll, saving means saving the WHOLE document (rewrite)
        // We pass page=1 to indicate start, relying on backend to handle full update or split
        const response = await documentService.updateContent(id, newContent, 1);

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

          // Invalidate query to reset pagination to page 1 with new content structure
          queryClient.invalidateQueries({ queryKey: documentKeys.content(id) });
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

/**
 * Hook for bulk document content operations (Scrivenings view)
 * 통합 뷰에서 여러 섹션의 내용을 한 번에 저장
 */
export function useBulkDocumentContent() {
  // 저장 상태를 전역 스토어에서 가져옴 (단일 뷰와 동일한 UI 표시)
  const setSaveStatus = useEditorStore((state) => state.setSaveStatus);

  const bulkSaveContent = useCallback(
    async (updates: Record<string, string>) => {
      if (Object.keys(updates).length === 0) return;

      setSaveStatus("saving");
      try {
        const { _setBulkContent } = useDocumentStore.getState();
        // 1. 로컬 상태 업데이트 (Zustand)
        _setBulkContent(updates);

        // 2. 백엔드 API 호출 (여러 섹션 동시 저장)
        await Promise.all(
          Object.entries(updates).map(([id, content]) =>
            documentService.updateContent(id, content),
          ),
        );
        // 3. 저장 상태 업데이트 (Zustand)
        setSaveStatus("saved");
      } catch (error) {
        console.warn("[bulkSaveContent] Save failed:", error);
        // 에러 시 saved로 유지 (unsaved로 두면 무한 저장 시도 발생)
        // 사용자가 수동으로 재시도할 수 있도록 함
        setSaveStatus("saved");
      }
    },
    [setSaveStatus],
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
  const { _create, _update } = useDocumentStore();

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
          queryClient.invalidateQueries({
            queryKey: documentKeys.tree(projectId),
          });
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
      // 1. Snapshot for rollback (Zustand & React Query)
      const { documents, _delete, _create } = useDocumentStore.getState();
      const deletedDoc = documents[id];
      const previousQueryData = queryClient.getQueryData<Document[]>([
        "documents",
        projectId,
      ]);

      // 2. Optimistic Update
      // 2.1. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: documentKeys.tree(projectId),
      });

      // 2.2. Update React Query Cache (Server State)
      if (previousQueryData) {
        queryClient.setQueryData<Document[]>(["documents", projectId], (old) =>
          old ? old.filter((doc) => doc.id !== id) : [],
        );
      }

      // 2.3. Update Zustand Store (Client State)
      _delete(id);

      try {
        // 3. Sync with Backend
        const response = await documentService.delete(id);
        const isSuccess =
          response.success || response.status === "OK" || response.code === 200;

        if (!isSuccess) {
          throw new Error("Failed to delete document");
        }
      } catch (error) {
        console.error("Failed to delete document:", error);
        // 4. Rollback on failure
        // 4.1. Rollback React Query Cache
        if (previousQueryData) {
          queryClient.setQueryData(["documents", projectId], previousQueryData);
        }
        // 4.2. Rollback Zustand Store
        if (deletedDoc) {
          _create(deletedDoc);
        }
      } finally {
        // 5. Always refetch to ensure data consistency
        queryClient.invalidateQueries({
          queryKey: documentKeys.tree(projectId),
        });

        // 6. 섹션 삭제 시 해당 섹션에 연결된 복선도 삭제 (고아 데이터 방지)
        useForeshadowingStore.getState().deleteByDocumentId(id);
      }
    },
    [projectId, queryClient],
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
        queryClient.invalidateQueries({
          queryKey: documentKeys.tree(projectId),
        });
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

  /**
   * Move document to a different folder (optimistic update)
   */
  const moveDocument = useCallback(
    async (itemId: string, targetFolderId: string | null) => {
      const { documents, _update } = useDocumentStore.getState();
      const document = documents[itemId];

      if (!document) {
        console.error("Document not found:", itemId);
        return;
      }

      // 1. Backup previous parentId for rollback
      const previousParentId = document.parentId;

      // 2. Optimistic Update: Update local store immediately
      _update(itemId, { parentId: targetFolderId ?? undefined });

      // 3. Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: documentKeys.tree(projectId),
      });

      try {
        // 4. Sync with Backend
        await documentService.update(itemId, {
          parentId: targetFolderId ?? undefined,
        });

        // 5. Ensure data consistency by invalidating queries
        queryClient.invalidateQueries({
          queryKey: documentKeys.tree(projectId),
        });
      } catch (error) {
        console.error("Failed to move document:", error);

        // 6. Rollback on failure
        _update(itemId, { parentId: previousParentId });

        // 7. Re-invalidate to ensure consistency
        queryClient.invalidateQueries({
          queryKey: documentKeys.tree(projectId),
        });
      }
    },
    [projectId, queryClient],
  );

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    reorderDocuments,
    moveDocument,
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

/**
 * Hook for fetching a document and all its descendants with level information
 * Useful for hierarchical rendering (e.g., Scrivenings view with indentation)
 */
export function useDescendantDocumentsWithLevel(
  parentId: string | null,
  projectId: string,
  options?: { textOnly?: boolean },
) {
  const documents = useDocumentStore((state) => state.documents);

  const flatDocuments = useMemo(() => {
    if (!parentId) return [];

    type DocumentWithLevel = Document & { level: number };
    const result: DocumentWithLevel[] = [];

    const traverse = (currentId: string, level: number) => {
      const children = Object.values(documents)
        .filter((d) => d.parentId === currentId && d.projectId === projectId)
        .sort((a, b) => a.order - b.order);

      for (const child of children) {
        // textOnly 옵션이면 folder 제외 (하위 탐색은 계속)
        if (options?.textOnly && child.type === "folder") {
          traverse(child.id, level + 1);
          continue;
        }

        result.push({ ...child, level });

        // 폴더인 경우 하위 탐색
        if (child.type === "folder") {
          traverse(child.id, level + 1);
        }
      }
    };

    traverse(parentId, 0);
    return result;
  }, [documents, parentId, projectId, options?.textOnly]);

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
