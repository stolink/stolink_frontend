import { useState, useMemo, useCallback } from "react";
import {
  LayoutGrid,
  GripVertical,
  FileText,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { useDocumentTree, useDocumentMutations } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";
import type { DocumentTreeNode } from "@/types/document";

interface CorkboardViewProps {
  folderId: string;
  projectId: string;
  onSelectSection?: (id: string) => void;
}

interface CorkboardCard {
  id: string;
  title: string;
  synopsis: string;
  type: "folder" | "text";
  order: number;
  wordCount: number;
}

/**
 * 코르크보드 뷰 - 인덱스 카드 기반 시놉시스 관리
 *
 * 기능:
 * - 문서를 카드 형태로 표시
 * - 시놉시스 인라인 편집
 * - 드래그앤드롭으로 순서 변경
 * - 카드 클릭 시 해당 문서로 이동
 */
export default function CorkboardView({
  folderId,
  projectId,
  onSelectSection,
}: CorkboardViewProps) {
  const { tree, documents } = useDocumentTree(projectId);
  const { updateDocument, reorderDocuments } = useDocumentMutations(projectId);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingSynopsis, setEditingSynopsis] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 현재 폴더의 자식 문서들을 카드로 변환 (순환 참조 방지 적용)
  const findChildDocuments = useCallback(
    (
      nodes: DocumentTreeNode[],
      parentId: string,
      visited = new Set<string>()
    ): CorkboardCard[] => {
      for (const node of nodes) {
        if (visited.has(node.id)) continue;
        visited.add(node.id);

        if (node.id === parentId) {
          // 이 폴더의 자식들 반환
          return (node.children || []).map((child) => {
            const doc = documents.find((d) => d.id === child.id);
            // 안전한 wordCount 접근
            const content = doc?.content;
            const wordCount = typeof content === "string" ? content.length : 0;

            return {
              id: child.id,
              title: child.title,
              synopsis: doc?.synopsis || "",
              type: child.type,
              order: doc?.order ?? 0,
              wordCount,
            };
          });
        }
        // 재귀 탐색
        if (node.children?.length) {
          const found = findChildDocuments(node.children, parentId, visited);
          if (found.length > 0) return found;
        }
      }
      return [];
    },
    [documents]
  ); // documents가 변경될 때만 재생성

  const cards = useMemo(
    () => findChildDocuments(tree, folderId).sort((a, b) => a.order - b.order),
    [tree, folderId, findChildDocuments]
  );

  const handleStartEdit = (card: CorkboardCard) => {
    setEditingCardId(card.id);
    setEditingSynopsis(card.synopsis);
  };

  const handleSaveEdit = async () => {
    if (!editingCardId) return;
    await updateDocument(editingCardId, { synopsis: editingSynopsis });
    setEditingCardId(null);
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditingSynopsis("");
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedId(cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // 순서 재배치
    const currentOrder = cards.map((c) => c.id);
    const dragIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    const newOrder = [...currentOrder];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    await reorderDocuments(newOrder);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8">
        <LayoutGrid className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">이 폴더에 문서가 없습니다</p>
        <p className="text-xs mt-1">왼쪽 사이드바에서 새 문서를 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-stone-50/50">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="w-4 h-4 text-stone-500" />
        <h2 className="text-sm font-semibold text-stone-700">코르크보드</h2>
        <span className="text-xs text-stone-400">{cards.length}개 카드</span>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable={editingCardId !== card.id}
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, card.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative bg-amber-50 border border-amber-200/60 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer",
              "min-h-[160px] flex flex-col",
              draggedId === card.id && "opacity-50 ring-2 ring-amber-400",
              draggedId && draggedId !== card.id && "ring-1 ring-amber-300/50"
            )}
            onClick={() => {
              if (editingCardId !== card.id && onSelectSection) {
                onSelectSection(card.id);
              }
            }}
          >
            {/* 드래그 핸들 */}
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-4 h-4 text-amber-400" />
            </div>

            {/* 카드 헤더 */}
            <div className="px-3 pt-3 pb-2 border-b border-amber-200/40">
              <div className="flex items-start gap-2">
                <FileText
                  className={cn(
                    "w-4 h-4 shrink-0 mt-0.5",
                    card.type === "folder" ? "text-amber-600" : "text-amber-500"
                  )}
                />
                <h3 className="text-sm font-medium text-stone-800 line-clamp-2 flex-1">
                  {card.title}
                </h3>
              </div>
            </div>

            {/* 시놉시스 영역 */}
            <div className="flex-1 px-3 py-2 relative">
              {editingCardId === card.id ? (
                <div
                  className="h-full flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <textarea
                    value={editingSynopsis}
                    onChange={(e) => setEditingSynopsis(e.target.value)}
                    placeholder="시놉시스를 입력하세요..."
                    className="flex-1 w-full resize-none bg-white border border-amber-300 rounded p-2 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 rounded hover:bg-amber-200/50 text-stone-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 rounded hover:bg-amber-200/50 text-amber-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-stone-600 line-clamp-4">
                    {card.synopsis || (
                      <span className="text-stone-400 italic">
                        시놉시스 없음
                      </span>
                    )}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(card);
                    }}
                    className="absolute bottom-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-amber-200/50 transition-opacity text-amber-600"
                    title="시놉시스 편집"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* 카드 풋터 */}
            <div className="px-3 py-1.5 border-t border-amber-200/40 flex items-center justify-between">
              <span className="text-xs text-amber-600/70">
                {card.wordCount > 0
                  ? `${card.wordCount.toLocaleString()}자`
                  : "-"}
              </span>
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  card.synopsis ? "bg-green-400" : "bg-stone-300"
                )}
                title={card.synopsis ? "시놉시스 있음" : "시놉시스 없음"}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
