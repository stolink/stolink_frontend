// Document Repository - Abstract interface for data access
// Allows swapping between Zustand (local) and API (backend) implementations

import type {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentTreeNode,
} from "@/types/document";

export interface IDocumentRepository {
  // === Query Operations ===
  getByProject(projectId: string): Promise<Document[]>;
  getById(id: string): Promise<Document | null>;
  getChildren(parentId: string | null, projectId: string): Promise<Document[]>;

  // === Mutation Operations ===
  create(input: CreateDocumentInput): Promise<Document>;
  update(id: string, input: UpdateDocumentInput): Promise<Document>;
  delete(id: string): Promise<void>;

  // === Batch Operations ===
  reorder(parentId: string | null, orderedIds: string[]): Promise<void>;

  // === Content Operations (separate for optimization) ===
  getContent(id: string): Promise<string>;
  updateContent(id: string, content: string): Promise<void>;
  bulkUpdateContent(updates: Record<string, string>): Promise<void>;
}

// Helper function to build tree from flat list
export function buildDocumentTree(documents: Document[]): DocumentTreeNode[] {
  const map = new Map<string, DocumentTreeNode>();
  const roots: DocumentTreeNode[] = [];

  // Create nodes
  documents.forEach((doc) => {
    map.set(doc.id, { ...doc, children: [] });
  });

  // Build tree
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

  // Sort children by order
  const sortChildren = (nodes: DocumentTreeNode[]): void => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((node) => sortChildren(node.children));
  };

  sortChildren(roots);
  return roots;
}
