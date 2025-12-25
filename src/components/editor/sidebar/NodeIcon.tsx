import { FileText, Folder, FolderOpen, Lightbulb } from "lucide-react";
import type { ChapterNode } from "./types";

// Node icon component based on type
export function NodeIcon({
  node,
  isExpanded,
}: {
  node: ChapterNode;
  isExpanded: boolean;
}) {
  if (node.isPlot) {
    return <Lightbulb className="h-4 w-4 text-yellow-500" />;
  }

  switch (node.type) {
    case "part":
    case "chapter":
      // Folders (Parts & Chapters)
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-sage-600" />
      ) : (
        <Folder className="h-4 w-4 text-sage-600" />
      );
    case "section":
    default:
      // Files (Sections)
      return <FileText className="h-4 w-4 text-stone-500" />;
  }
}
