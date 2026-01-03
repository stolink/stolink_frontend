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
import { FileText, MoreHorizontal, FolderOpen, AlignLeft } from "lucide-react";
import type { Document } from "@/types/document";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  // Status Badge Colors (Mocha/Sage Theme)
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "final":
        return "bg-sage-100 text-sage-700 border-sage-200";
      case "revised":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "draft":
        return "bg-stone-100 text-stone-600 border-stone-200";
      default:
        return "bg-stone-50 text-stone-500 border-stone-100";
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      layout
      className="group hover:bg-mocha-50/30 transition-colors cursor-pointer border-b border-stone-50 last:border-0"
      onClick={() => onSelect(doc.id)}
    >
      <TableCell className="py-3">
        <div
          className="flex items-center gap-3"
          style={{ paddingLeft: `${doc.level * 24}px` }}
        >
          {/* 계층 라인 표시 */}
          {doc.level > 0 && (
            <div className="absolute left-6 h-full w-px bg-stone-100 -translate-y-1/2 top-0" />
          )}

          <div
            className={cn(
              "p-1.5 rounded-lg transition-colors shrink-0",
              doc.type === "folder"
                ? "bg-amber-50 text-amber-500 group-hover:bg-amber-100"
                : "bg-stone-50 text-stone-400 group-hover:bg-mocha-100 group-hover:text-mocha-500",
            )}
          >
            {doc.type === "folder" ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <span
            className={cn(
              "text-sm font-medium truncate transition-colors",
              doc.type === "folder"
                ? "text-stone-800"
                : "text-stone-600 group-hover:text-mocha-800",
            )}
          >
            {doc.title}
          </span>
        </div>
      </TableCell>

      {/* Synopsis Cell */}
      <TableCell onClick={(e) => e.stopPropagation()} className="py-2">
        {isEditingSynopsis ? (
          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
              setIsEditingSynopsis(false);
              onSynopsisEdit(doc.id, synopsis);
            }}
          >
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
                if (e.key === "Escape") {
                  setIsEditingSynopsis(false);
                  setSynopsis(doc.synopsis || "");
                }
              }}
              className="w-full text-xs font-medium bg-white border border-mocha-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-mocha-100 text-stone-800 shadow-sm"
              placeholder="시놉시스를 입력하세요..."
            />
          </form>
        ) : (
          <div
            className="group/synopsis flex items-center gap-2 cursor-text"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingSynopsis(true);
            }}
          >
            {synopsis ? (
              <span className="text-stone-600 text-xs line-clamp-1 group-hover/synopsis:text-stone-900 transition-colors">
                {synopsis}
              </span>
            ) : (
              <span className="text-stone-300 text-xs italic group-hover/synopsis:text-stone-400">
                클릭하여 시놉시스 작성...
              </span>
            )}
            <AlignLeft className="w-3 h-3 text-stone-300 opacity-0 group-hover/synopsis:opacity-100 transition-opacity" />
          </div>
        )}
      </TableCell>

      {/* Status Badge */}
      <TableCell className="py-2 w-[100px]">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 h-6 border shadow-sm transition-all",
            getStatusColor(doc.metadata?.status),
          )}
        >
          {doc.metadata?.status === "final"
            ? "완료"
            : doc.metadata?.status === "revised"
              ? "수정됨"
              : "초안"}
        </Badge>
      </TableCell>

      {/* Word Count - Mono font number */}
      <TableCell className="text-right py-2 w-[100px]">
        <span className="font-mono text-xs text-stone-500 group-hover:text-mocha-600 transition-colors">
          {(doc.metadata.wordCount || 0).toLocaleString()}
        </span>
      </TableCell>

      {/* Action Menu Trigger */}
      <TableCell className="w-[50px] py-2 text-right">
        <button
          className="p-1.5 rounded-md hover:bg-stone-100 text-stone-300 hover:text-stone-500 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </TableCell>
    </motion.tr>
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
    { textOnly: true },
  );

  const handleRowClick = (docId: string) => {
    onSelectSection?.(docId);
  };

  const handleSynopsisEdit = (docId: string, newSynopsis: string) => {
    onSynopsisUpdate?.(docId, newSynopsis);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-12 text-stone-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-5 h-5 border-2 border-stone-200 border-t-mocha-400 rounded-full"
        />
      </div>
    );

  return (
    <div className="flex-1 overflow-auto bg-stone-50/30">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header Area */}
        <header className="mb-8 pl-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl shadow-inner">
              <AlignLeft className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800">아웃라인</h1>
              <p className="text-xs text-stone-500 font-medium">
                Structure & Synopsis
              </p>
            </div>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed max-w-2xl ml-12">
            작품의 뼈대를 한눈에 파악하고 흐름을 점검하세요. 각 행을 클릭하여
            에디터로 이동하거나, 시놉시스를 직접 수정할 수 있습니다.
          </p>
        </header>

        {/* Table Container - Card Style */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden ring-1 ring-stone-900/5">
          <Table>
            <TableHeader className="bg-stone-50/80 border-b border-stone-100 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] h-10 text-xs font-bold text-stone-500 uppercase tracking-wider pl-6">
                  Title
                </TableHead>
                <TableHead className="h-10 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Synopsis
                </TableHead>
                <TableHead className="w-[100px] h-10 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-right w-[100px] h-10 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Words
                </TableHead>
                <TableHead className="w-[50px] h-10"></TableHead>
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
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-stone-400">
                      <FileText className="w-8 h-8 opacity-20" />
                      <span className="text-sm font-medium">
                        이 폴더에 섹션이 없습니다.
                      </span>
                    </div>
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
