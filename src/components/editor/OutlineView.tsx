import { useState } from "react";
import { useDescendantDocumentsWithLevel } from "@/hooks/useDocuments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, MoreHorizontal } from "lucide-react";
import type { Document } from "@/types/document";

interface OutlineViewProps {
  folderId: string | null;
  projectId: string;
  onSelectSection?: (id: string) => void;
  onSynopsisUpdate?: (id: string, synopsis: string) => void;
}

interface OutlineRowProps {
  doc: Document & { level: number };
  onSelect: (id: string) => void;
  onSynopsisEdit: (id: string, newSynopsis: string) => void;
}

function OutlineRow({ doc, onSelect, onSynopsisEdit }: OutlineRowProps) {
  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [synopsis, setSynopsis] = useState(doc.synopsis || "");

  return (
    <TableRow
      className="hover:bg-muted/50/50 transition-colors cursor-pointer"
      onClick={() => onSelect(doc.id)}
    >
      <TableCell className="font-medium">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${doc.level * 24}px` }}
        >
          {/* 계층 표시 점 */}
          {doc.level > 0 && (
            <div className="flex items-center gap-0.5 mr-1">
              {Array.from({ length: doc.level }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-mocha-300"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
          <FileText className="w-4 h-4 text-mocha-500 shrink-0" />
          <span className="truncate">{doc.title}</span>
        </div>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {isEditingSynopsis ? (
          <input
            autoFocus
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            onBlur={() => {
              setIsEditingSynopsis(false);
              if (synopsis !== doc.synopsis) {
                onSynopsisEdit(doc.id, synopsis);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setIsEditingSynopsis(false);
                onSynopsisEdit(doc.id, synopsis);
              }
              if (e.key === "Escape") {
                setIsEditingSynopsis(false);
                setSynopsis(doc.synopsis || "");
              }
            }}
            className="w-full text-sm bg-card border border-mocha-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-mocha-500"
          />
        ) : (
          <span
            className="text-muted-foreground text-sm line-clamp-1 italic cursor-text hover:bg-muted rounded px-2 py-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingSynopsis(true);
            }}
          >
            {synopsis || "작성된 시놉시스가 없습니다."}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 h-5"
        >
          {doc.metadata?.status ?? "작성 중"}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-foreground font-mono text-xs">
        {(doc.metadata.wordCount || 0).toLocaleString()}
      </TableCell>
      <TableCell>
        <button
          className="p-1 hover:bg-muted rounded text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </TableCell>
    </TableRow>
  );
}

export default function OutlineView({
  folderId,
  projectId,
  onSelectSection,
  onSynopsisUpdate,
}: OutlineViewProps) {
  const { documents, isLoading } = useDescendantDocumentsWithLevel(
    folderId,
    projectId,
    { textOnly: true }
  );

  const handleRowClick = (docId: string) => {
    onSelectSection?.(docId);
  };

  const handleSynopsisEdit = (docId: string, newSynopsis: string) => {
    onSynopsisUpdate?.(docId, newSynopsis);
  };

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading outline...</div>;

  return (
    <div className="flex-1 overflow-auto p-6 bg-card">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">아웃라인</h1>
          <p className="text-muted-foreground text-sm mt-1">
            섹션별 시놉시스와 진행 상태를 한눈에 파악합니다. 행을 클릭하면 단일
            뷰로 전환됩니다.
          </p>
        </header>

        <div className="border rounded-lg overflow-hidden border-border shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">제목</TableHead>
                <TableHead>시놉시스</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="text-right w-[100px]">글자 수</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <OutlineRow
                  key={doc.id}
                  doc={doc}
                  onSelect={handleRowClick}
                  onSynopsisEdit={handleSynopsisEdit}
                />
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground italic"
                  >
                    이 폴더에 섹션이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
