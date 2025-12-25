import { useChildDocuments } from "@/hooks/useDocuments";
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

interface OutlineViewProps {
  folderId: string | null;
  projectId: string;
}

export default function OutlineView({ folderId, projectId }: OutlineViewProps) {
  const { children, isLoading } = useChildDocuments(folderId, projectId);

  if (isLoading)
    return <div className="p-8 text-stone-400">Loading outline...</div>;

  return (
    <div className="flex-1 overflow-auto p-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">아웃라인</h1>
          <p className="text-stone-500 text-sm mt-1">
            섹션별 시놉시스와 진행 상태를 한눈에 파악합니다.
          </p>
        </header>

        <div className="border rounded-lg overflow-hidden border-stone-200 shadow-sm">
          <Table>
            <TableHeader className="bg-stone-50">
              <TableRow>
                <TableHead className="w-[300px]">제목</TableHead>
                <TableHead>시놉시스</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="text-right w-[100px]">글자 수</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="hover:bg-stone-50/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sage-500" />
                      <span className="truncate">{doc.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-stone-500 text-sm line-clamp-1 italic">
                      {doc.synopsis || "작성된 시놉시스가 없습니다."}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 h-5"
                    >
                      {doc.metadata?.status ?? "작성 중"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-stone-600 font-mono text-xs">
                    {(doc.metadata.wordCount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <button className="p-1 hover:bg-stone-100 rounded text-stone-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {children.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-stone-400 italic"
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
