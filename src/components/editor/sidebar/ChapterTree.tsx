import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Folder,
  Plus,
  X,
  FilePlus,
  FolderPlus,
  ChevronsUpDown,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TreeItem } from "./TreeItem";
import { ContextMenu, type MenuItemType } from "./ContextMenu";
import { type ChapterNode, type ChapterTreeProps } from "./types";

// Helper: 전체 트리에서 노드 찾기
function findNodeById(
  nodes: ChapterNode[],
  id: string
): ChapterNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

// Helper: 노드의 부모 ID 찾기
function findParentId(
  nodes: ChapterNode[],
  id: string,
  parentId: string | null = null
): string | null | undefined {
  for (const node of nodes) {
    if (node.id === id) return parentId;
    if (node.children) {
      const found = findParentId(node.children, id, node.id);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

// Helper: 순환 참조 확인 (targetId가 itemId의 하위에 있는지)
function isDescendant(
  nodes: ChapterNode[],
  itemId: string,
  targetId: string
): boolean {
  const item = findNodeById(nodes, itemId);
  if (!item || !item.children) return false;
  for (const child of item.children) {
    if (child.id === targetId) return true;
    if (isDescendant([child], child.id, targetId)) return true;
  }
  return false;
}

// 기본 Mock 데이터
const defaultChapters: ChapterNode[] = [
  {
    id: "part-1",
    title: "1부: 여정의 시작",
    type: "part",
    children: [
      {
        id: "chapter-1-1",
        title: "1.1 운명의 밤",
        type: "chapter",
        characterCount: 2340,
        status: "done",
      },
      {
        id: "chapter-1-2",
        title: "1.2 첫 만남",
        type: "chapter",
        characterCount: 1890,
        status: "inProgress",
      },
      {
        id: "chapter-1-3",
        title: "1.3 시련",
        type: "chapter",
        characterCount: 0,
        isPlot: true,
        status: "todo",
      },
    ],
  },
  {
    id: "part-2",
    title: "2부: 성장",
    type: "part",
    children: [
      {
        id: "chapter-2-1",
        title: "2.1 수련",
        type: "chapter",
        characterCount: 3200,
        status: "revised",
      },
    ],
  },
];

export function ChapterTree({
  chapters: initialChapters = defaultChapters,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapter,
  onMoveToFolder,
}: ChapterTreeProps) {
  const chapters = useMemo(() => initialChapters, [initialChapters]);
  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<"chapter" | "section">(
    "chapter"
  );
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const [showContainerMenu, setShowContainerMenu] = useState(false);
  const [containerMenuPosition, setContainerMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // DnD states
  const [activeId, setActiveId] = useState<string | null>(null);
  // Drop indicator: { id: 타겟 아이템 ID, position: 'before' | 'after' | 'inside' }
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "before" | "after" | "inside";
  } | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    onAddChapter?.(
      newChapterTitle.trim(),
      addingToParent || undefined,
      addingType
    );
    setNewChapterTitle("");
    setIsAdding(false);
    setAddingToParent(null);
  };

  const handleStartAddChild = (
    parentId: string,
    type: "chapter" | "section" = "chapter"
  ) => {
    setAddingToParent(parentId);
    setAddingType(type);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setNewChapterTitle("");
    setIsAdding(false);
    setAddingToParent(null);
  };

  // Root level item IDs for SortableContext
  const rootItemIds = useMemo(() => chapters.map((c) => c.id), [chapters]);

  // Drag Start Handler
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDropIndicator(null);
  };

  // Drag Over Handler - 드롭 위치 감지
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, active } = event;

      if (!over || over.id === active.id) {
        setDropIndicator(null);
        return;
      }

      const overId = over.id as string;
      const overNode = findNodeById(chapters, overId);

      if (!overNode) {
        setDropIndicator(null);
        return;
      }

      // 순환 참조 방지
      if (isDescendant(chapters, active.id as string, overId)) {
        setDropIndicator(null);
        return;
      }

      // 폴더인 경우 -> inside (폴더 안으로 이동)
      if (overNode.type === "chapter" || overNode.type === "part") {
        setDropIndicator({ id: overId, position: "inside" });
      } else {
        // 섹션인 경우 -> 간단하게 after로 처리 (안정성 우선)
        setDropIndicator({ id: overId, position: "after" });
      }
    },
    [chapters]
  );

  // Drag End Handler - 순서 변경 + 폴더 이동 처리
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Cleanup
    setActiveId(null);
    setDropIndicator(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIdValue = active.id as string;
    const overIdValue = over.id as string;

    const activeNode = findNodeById(chapters, activeIdValue);
    const overNode = findNodeById(chapters, overIdValue);

    if (!activeNode || !overNode) return;

    const activeParentId = findParentId(chapters, activeIdValue);
    const overParentId = findParentId(chapters, overIdValue);

    if (activeParentId === undefined || overParentId === undefined) return;

    // Case 1: 폴더 위에 드롭 → 폴더 안으로 이동
    if (overNode.type === "chapter" || overNode.type === "part") {
      // 순환 참조 방지
      if (isDescendant(chapters, activeIdValue, overIdValue)) {
        console.warn("Cannot move item into its own descendant");
        return;
      }

      // 이미 해당 폴더의 자식인 경우 → 순서 변경으로 처리
      if (activeParentId === overIdValue) {
        // 폴더의 자식들 중 순서 변경
        const parent = findNodeById(chapters, overIdValue);
        if (parent?.children) {
          const oldIndex = parent.children.findIndex(
            (c) => c.id === activeIdValue
          );
          // 폴더 자체 위에 드롭한 경우이므로 첫 번째로 이동
          if (oldIndex !== -1 && oldIndex !== 0) {
            const newOrder = [...parent.children];
            const [removed] = newOrder.splice(oldIndex, 1);
            newOrder.unshift(removed);
            onReorderChapter?.(
              overIdValue,
              newOrder.map((c) => c.id)
            );
          }
        }
        return;
      }

      // 폴더로 이동
      onMoveToFolder?.(activeIdValue, overIdValue);
      return;
    }

    // Case 2: 같은 부모 내에서 순서 변경
    if (activeParentId === overParentId) {
      const siblings =
        activeParentId === null
          ? chapters
          : findNodeById(chapters, activeParentId)?.children || [];

      const oldIndex = siblings.findIndex((c) => c.id === activeIdValue);
      let newIndex = siblings.findIndex((c) => c.id === overIdValue);

      // 드롭 인디케이터 위치에 따른 인덱스 보정
      if (dropIndicator?.position === "after") {
        newIndex += 1;
      }

      // 자기 자신보다 뒤로 가는 경우 인덱스 조정 (splice의 특성상)
      if (oldIndex !== -1 && newIndex !== -1) {
        const adjustedNewIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;

        if (oldIndex !== adjustedNewIndex) {
          const newOrder = [...siblings];
          const [removed] = newOrder.splice(oldIndex, 1);
          newOrder.splice(adjustedNewIndex, 0, removed);

          const orderedIds = newOrder.map((c) => c.id);
          onReorderChapter?.(activeParentId, orderedIds);
        }
      }
    }
    // Case 3: 다른 폴더의 섹션 위에 드롭 → 해당 폴더로 이동
    else if (overParentId !== null) {
      // 순환 참조 방지
      if (isDescendant(chapters, activeIdValue, overParentId)) {
        console.warn("Cannot move item into its own descendant");
        return;
      }

      onMoveToFolder?.(activeIdValue, overParentId);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDropIndicator(null);
  };

  // 컨테이너 컨텍스트 메뉴 (빈 공간 우클릭)
  const handleContainerContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isOnItem = target.closest("[data-tree-item]");
    if (isOnItem) return;

    e.preventDefault();
    setContainerMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContainerMenu(true);
  };

  // 컨테이너 컨텍스트 메뉴 아이템
  const containerMenuItems: MenuItemType[] = [
    {
      icon: FilePlus,
      label: "새 문서",
      onClick: () => {
        setAddingType("section");
        setIsAdding(true);
      },
    },
    {
      icon: FolderPlus,
      label: "새 폴더",
      onClick: () => {
        setAddingType("chapter");
        setIsAdding(true);
      },
    },
    { type: "divider" },
    {
      icon: ChevronsUpDown,
      label: "모두 접기/펼치기",
      onClick: () => {
        // TODO: Implement expand/collapse all
      },
    },
  ];

  return (
    <div
      className="flex-1 flex flex-col min-h-full py-1"
      onContextMenu={handleContainerContextMenu}
    >
      {chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Folder className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            챕터가 비어있습니다
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            우클릭하여 새 문서를 만드세요
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />첫 챕터 만들기
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={rootItemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {chapters.map((node, idx) => (
                <TreeItem
                  key={node.id}
                  node={node}
                  selectedId={selectedChapterId}
                  isLast={idx === chapters.length - 1}
                  parentLines={[]}
                  onSelect={onSelectChapter}
                  onAddChild={handleStartAddChild}
                  onRename={onRenameChapter}
                  onDelete={onDeleteChapter}
                  onReorder={onReorderChapter}
                  onMoveToFolder={onMoveToFolder}
                  dropIndicator={dropIndicator}
                  activeId={activeId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="flex items-center gap-2 px-2 py-1.5 mt-2 bg-cloud-50 rounded-md border border-input ml-0 mr-1">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddChapter();
              if (e.key === "Escape") handleCancel();
            }}
            placeholder={
              addingType === "chapter" ? "새 폴더 이름..." : "새 섹션 이름..."
            }
            className="h-7 text-sm border-0 bg-transparent focus-visible:ring-0 px-0"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={handleAddChapter}
            disabled={!newChapterTitle.trim()}
          >
            <Plus className="h-3.5 w-3.5 text-mocha-700" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* Add button */}
      {chapters.length > 0 && !isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground mt-2 ml-0 mr-1 hover:text-mocha-700 hover:bg-mocha-400/10"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />새 챕터 추가
        </Button>
      )}

      {/* Container Context Menu */}
      {showContainerMenu && (
        <ContextMenu
          items={containerMenuItems}
          position={containerMenuPosition}
          onClose={() => setShowContainerMenu(false)}
        />
      )}
    </div>
  );
}

// Re-export types
export type { ChapterNode, ChapterTreeProps } from "./types";
