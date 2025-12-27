import { useState, useRef, useEffect, useMemo } from "react";
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
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
}: ChapterTreeProps) {
  const chapters = useMemo(() => initialChapters, [initialChapters]);
  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<"chapter" | "section">(
    "chapter",
  );
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const [showContainerMenu, setShowContainerMenu] = useState(false);
  const [containerMenuPosition, setContainerMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      addingType,
    );
    setNewChapterTitle("");
    setIsAdding(false);
    setAddingToParent(null);
  };

  const handleStartAddChild = (
    parentId: string,
    type: "chapter" | "section" = "chapter",
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

  // Drag End Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder: Create new ordered array
        const newOrder = [...chapters];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);

        const orderedIds = newOrder.map((c) => c.id);
        onReorderChapter?.(null, orderedIds); // null = root level
      }
    }
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

  // Root level item IDs for SortableContext
  const rootItemIds = useMemo(() => chapters.map((c) => c.id), [chapters]);

  return (
    <div
      className="flex-1 flex flex-col min-h-full py-1"
      onContextMenu={handleContainerContextMenu}
    >
      {chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
            <Folder className="h-6 w-6 text-stone-300" />
          </div>
          <p className="text-sm font-medium text-stone-600 mb-1">
            챕터가 비어있습니다
          </p>
          <p className="text-xs text-stone-400 mb-4">
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
          onDragEnd={handleDragEnd}
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="flex items-center gap-2 px-2 py-1.5 mt-2 bg-sage-50 rounded-md border border-sage-200 mx-1">
          <FileText className="h-4 w-4 text-sage-400 shrink-0" />
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
            <Plus className="h-3.5 w-3.5 text-sage-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5 text-stone-400" />
          </Button>
        </div>
      )}

      {/* Add button */}
      {chapters.length > 0 && !isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-stone-500 mt-2 mx-1 hover:text-sage-600 hover:bg-sage-50"
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
