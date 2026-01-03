import { useState, useMemo, useCallback } from "react";
import {
  LayoutGrid,
  GripVertical,
  FileText,
  Edit3,
  Check,
  X,
  Pin,
  FolderOpen,
} from "lucide-react";
import { useDocumentTree, useDocumentMutations } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";
import type { DocumentTreeNode } from "@/types/document";
import { motion, AnimatePresence } from "framer-motion";

interface CorkboardViewProps {
  folderId: string;
  projectId: string;
  onSelectSection?: (id: string) => void;
}

interface CorkboardCard {
  id: string;
  title: string;
  synopsis: string;
  type: "folder" | "text" | "scrivenings";
  order: number;
  wordCount: number;
}

/**
 * 코르크보드 뷰 - 인덱스 카드 기반 시놉시스 관리
 *
 * 기능:
 * - 문서를 카드 형태로 표시
 * - 시놉시스 인라인 편집
 * - 드래그앤드롭으로 순서 변경 (유체 애니메이션)
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
      visited = new Set<string>(),
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
    [documents],
  ); // documents가 변경될 때만 재생성

  const cards = useMemo(
    () => findChildDocuments(tree, folderId).sort((a, b) => a.order - b.order),
    [tree, folderId, findChildDocuments],
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

    await reorderDocuments(folderId, newOrder);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  if (cards.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 bg-[#E6DCCF] h-full"
        style={{
          backgroundImage: `radial-gradient(#D6CCC0 2px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="bg-white/50 p-8 rounded-full mb-4 shadow-inner">
          <LayoutGrid className="w-12 h-12 opacity-50 text-stone-500" />
        </div>
        <p className="text-sm font-medium text-stone-600">
          이 폴더는 비어있습니다
        </p>
        <p className="text-xs mt-1 text-stone-500">
          새 카드를 추가해 이야기를 정리해보세요
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto p-8 relative"
      style={{
        backgroundColor: "#EBE3D9", // Warm cork background
        backgroundImage: `
                url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23D6CCC0' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")
            `,
      }}
    >
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/cork-board.png")`,
        }}
      />

      {/* 헤더 */}
      <div className="relative sticky top-0 z-10 flex items-center gap-2 mb-6 px-4 py-3 bg-white/80 backdrop-blur-md rounded-xl border border-stone-200/50 shadow-sm max-w-fit mx-auto">
        <LayoutGrid className="w-4 h-4 text-stone-500" />
        <h2 className="text-sm font-bold text-stone-800">코르크보드</h2>
        <div className="w-px h-3 bg-stone-300 mx-1" />
        <span className="text-xs font-medium text-stone-500">
          {cards.length} Cards
        </span>
      </div>

      {/* 카드 그리드 */}
      <motion.div
        layout
        className="relative grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start pb-20"
      >
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              layoutId={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={card.id}
              draggable={editingCardId !== card.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onDragStart={(e) => handleDragStart(e as any, card.id)}
              onDragOver={handleDragOver}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onDrop={(e) => handleDrop(e as any, card.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative bg-white rounded-sm shadow-md hover:shadow-xl transition-all cursor-pointer select-none",
                "min-h-[220px] flex flex-col",
                draggedId === card.id && "opacity-40 scale-95 rotate-3",
                draggedId && draggedId !== card.id && "scale-[0.98] opacity-80",
              )}
              style={{
                boxShadow:
                  "2px 4px 12px -2px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)", // Add slight rotation randomly later?
              }}
              onClick={() => {
                if (editingCardId !== card.id && onSelectSection) {
                  onSelectSection(card.id);
                }
              }}
            >
              {/* 핀 효과 */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-sm">
                <Pin
                  className={cn(
                    "w-6 h-6 fill-current",
                    card.type === "folder" ? "text-amber-500" : "text-rose-500",
                  )}
                />
              </div>

              {/* 드래그 핸들 */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-stone-300 hover:text-stone-500">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* 카드 헤더 */}
              <div className="px-4 pt-5 pb-3 border-b border-stone-100 flex flex-col gap-1 items-center text-center">
                <h3 className="text-sm font-bold text-stone-800 line-clamp-2 px-2 leading-tight">
                  {card.title}
                </h3>
                <div className="flex items-center gap-1.5">
                  {card.type === "folder" ? (
                    <FolderOpen className="w-3 h-3 text-amber-500" />
                  ) : (
                    <FileText className="w-3 h-3 text-stone-400" />
                  )}
                  <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                    {card.type === "folder" ? "Chapter" : "Scene"}
                  </span>
                </div>
              </div>

              {/* 시놉시스 영역 - 인덱스 카드 줄무늬 배경 */}
              <div
                className="flex-1 px-4 py-3 relative bg-[#FEFEFA]"
                style={{
                  backgroundImage:
                    "linear-gradient(#E8E8E8 1px, transparent 1px)",
                  backgroundSize: "100% 24px",
                  lineHeight: "24px",
                }}
              >
                {editingCardId === card.id ? (
                  <div
                    className="h-full flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={editingSynopsis}
                      onChange={(e) => setEditingSynopsis(e.target.value)}
                      placeholder="시놉시스를 입력하세요..."
                      className="flex-1 w-full resize-none bg-transparent border-none p-0 text-xs text-stone-700 focus:outline-none leading-[24px]"
                      style={{ lineHeight: "24px" }}
                      autoFocus
                    />
                    <div className="flex gap-1 mt-2 justify-end absolute bottom-2 right-2 bg-white/90 p-1 rounded-lg border shadow-sm">
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded hover:bg-rose-50 text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 rounded hover:bg-green-50 text-green-600"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-stone-600 line-clamp-5 leading-[24px]">
                      {card.synopsis || (
                        <span className="text-stone-300 italic text-[11px]">
                          (시놉시스 미작성)
                        </span>
                      )}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(card);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white border border-stone-200 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-stone-50 transition-all text-stone-500"
                      title="시놉시스 편집"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              {/* 카드 풋터 */}
              <div className="px-3 py-2 border-t border-stone-100 flex items-center justify-between bg-stone-50/50 rounded-b-sm">
                <span className="text-[10px] font-medium text-stone-400">
                  {card.wordCount > 0
                    ? `${card.wordCount.toLocaleString()} words`
                    : "Empty"}
                </span>
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    card.synopsis
                      ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]"
                      : "bg-stone-200",
                  )}
                  title={card.synopsis ? "Completed" : "Draft"}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
