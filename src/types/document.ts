// Document Types - Unified model for Scrivener-like structure
// Replaces separate Chapter/Scene types with a single recursive hierarchy

export type DocumentType = "folder" | "text";

export interface Document {
  // === Core Fields ===
  id: string;
  projectId: string;
  parentId?: string;
  type: DocumentType;

  // === Content ===
  title: string;
  content: string; // Only used for 'text' type
  synopsis: string; // Shown on corkboard cards

  // === Ordering ===
  order: number;

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
  label?: string; // POV character, location, etc.
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords: string[];
  notes: string;
}

export type DocumentStatus = "draft" | "revised" | "final";

// Tree structure for display
export interface DocumentTreeNode extends Document {
  children: DocumentTreeNode[];
}

// Input types
export interface CreateDocumentInput {
  projectId: string;
  parentId?: string;
  type: DocumentType;
  title: string;
  synopsis?: string;
  targetWordCount?: number;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  synopsis?: string;
  order?: number;
  metadata?: Partial<DocumentMetadata>;
  characterIds?: string[];
  foreshadowingIds?: string[];
}
