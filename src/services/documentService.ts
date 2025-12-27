import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Document as FrontendDocument,
  UpdateDocumentInput as FrontendUpdateDocumentInput,
} from "@/types/document";

export type DocumentType = "folder" | "text";
export type DocumentStatus = "draft" | "revised" | "final";

// Backend API response format
export interface BackendDocument {
  id: string;
  projectId: string;
  parentId?: string;
  type: DocumentType;
  title: string;
  content?: string;
  synopsis?: string;
  order: number;
  status: DocumentStatus;
  label?: string;
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  children?: BackendDocument[];
}

// Alias for backwards compatibility
export type Document = BackendDocument;

// Convert backend document to frontend document
export function mapBackendToFrontend(doc: BackendDocument): FrontendDocument {
  // Normalize type to lowercase (backend may return uppercase)
  const normalizedType = (doc.type?.toLowerCase() || "text") as DocumentType;

  return {
    id: doc.id,
    projectId: doc.projectId,
    parentId: doc.parentId,
    type: normalizedType,
    title: doc.title,
    content: doc.content || "",
    synopsis: doc.synopsis || "",
    order: doc.order,
    metadata: {
      status: doc.status,
      label: doc.label,
      labelColor: doc.labelColor,
      wordCount: doc.wordCount,
      targetWordCount: doc.targetWordCount,
      includeInCompile: doc.includeInCompile,
      keywords: doc.keywords || [],
      notes: doc.notes || "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Backend API request payloads
export interface BackendCreateDocumentInput {
  type: DocumentType;
  title: string;
  projectId: string; // Backend expects projectId in body
  parentId?: string;
  synopsis?: string;
  targetWordCount?: number;
}

export interface BackendUpdateDocumentInput {
  title?: string;
  content?: string;
  synopsis?: string;
  order?: number;
  status?: DocumentStatus;
  label?: string;
  labelColor?: string;
  targetWordCount?: number;
  includeInCompile?: boolean;
  keywords?: string[];
  notes?: string;
}

// Re-export for service layer - includes projectId for backend
export type CreateDocumentInput = BackendCreateDocumentInput;
export type UpdateDocumentInput = FrontendUpdateDocumentInput;

export const documentService = {
  // Get document tree for a project
  getTree: async (
    projectId: string,
    params?: { tree?: boolean; type?: DocumentType },
  ) => {
    const response = await api.get<ApiResponse<Document[]>>(
      `/projects/${projectId}/documents`,
      { params: { tree: true, ...params } },
    );
    return response.data;
  },

  // Get single document
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    return response.data;
  },

  // Create document
  create: async (
    projectId: string,
    payload: Omit<BackendCreateDocumentInput, "projectId">,
  ) => {
    const response = await api.post<ApiResponse<Document>>(
      `/projects/${projectId}/documents`,
      { ...payload, projectId },
    );
    return response.data;
  },

  // Update document metadata
  update: async (id: string, payload: UpdateDocumentInput) => {
    const response = await api.patch<ApiResponse<Document>>(
      `/documents/${id}`,
      payload,
    );
    return response.data;
  },

  // Delete document
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/documents/${id}`);
    return response.data;
  },

  // Get content only
  getContent: async (id: string) => {
    const response = await api.get<ApiResponse<{ content: string }>>(
      `/documents/${id}/content`,
    );
    return response.data;
  },

  // Update content only
  updateContent: async (id: string, content: string) => {
    const response = await api.patch<
      ApiResponse<{ id: string; wordCount: number; updatedAt: string }>
    >(`/documents/${id}/content`, { content });
    return response.data;
  },

  // Reorder documents
  reorder: async (parentId: string | null, orderedIds: string[]) => {
    const response = await api.post<ApiResponse<null>>("/documents/reorder", {
      parentId,
      orderedIds,
    });
    return response.data;
  },

  // Bulk update
  bulkUpdate: async (
    updates: { id: string; changes: UpdateDocumentInput }[],
  ) => {
    const response = await api.post<ApiResponse<null>>(
      "/documents/bulk-update",
      { updates },
    );
    return response.data;
  },
};
