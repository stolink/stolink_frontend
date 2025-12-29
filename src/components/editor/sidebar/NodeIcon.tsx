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
    case "chapter":
      // Folders (Chapters)
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-mocha-500" />
      ) : (
        <Folder className="h-4 w-4 text-mocha-500" />
      );
    case "section":
    default:
      // Files (Sections)
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}
