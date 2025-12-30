// Document Types - Flat list structure (Hierarchy removed)
// Replaces separate Chapter/Scene types with a single linear list

export interface Document {
  // === Core Fields ===
  id: string;
  projectId: string; // duplicate removed
  parentId?: string; // Restored for proper hierarchy support
  type: "folder" | "text" | "scrivenings"; // Restored type

  // === Content ===
  title: string;
  content: string; // HTML content
  synopsis: string;

  // === Ordering ===
  order: number; // Global order in project

  // === Metadata ===
  metadata: DocumentMetadata;

  // === Relationships ===
  characterIds: string[];
  foreshadowingIds: string[];

  // === Timestamps ===
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  status: DocumentStatus;
  label?: string; // Tag/Label
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords: string[]; // 태그 배열
  notes: string; // 작가 메모
}

export type DocumentStatus = "draft" | "revised" | "final";

// Create/Update Inputs
export interface CreateDocumentInput {
  projectId: string;
  title: string;
  synopsis?: string;
  targetWordCount?: number;
  order?: number;
  parentId?: string;
  type: "folder" | "text" | "scrivenings";
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  synopsis?: string;
  order?: number;
  parentId?: string;
  metadata?: Partial<DocumentMetadata>;
  characterIds?: string[];
  foreshadowingIds?: string[];
}

// Restored DocumentTreeNode for Repository usage
export interface DocumentTreeNode extends Document {
  children: DocumentTreeNode[];
}
