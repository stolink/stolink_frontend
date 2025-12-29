import { useMemo, memo } from "react";
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Plus,
  GripVertical,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { NodeIcon } from "./NodeIcon";
import { ContextMenu } from "./ContextMenu";
import { type ChapterNode, statusColors, formatCharCount } from "./types";
import { useTreeItem } from "./hooks/useTreeItem";
import { useTreeItemMenu } from "./hooks/useTreeItemMenu";
import { TreeLines } from "./TreeLines";

interface TreeItemProps {
  node: ChapterNode;
  level?: number;
  selectedId?: string;
  isLast?: boolean;
  parentLines?: boolean[];
  onSelect?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string, type?: "chapter" | "section") => void;
  onReorder?: (parentId: string | null, orderedIds: string[]) => void;
  onMoveToFolder?: (itemId: string, targetFolderId: string | null) => void;
  dropIndicator?: {
    id: string;
    position: "before" | "after" | "inside";
  } | null;
  activeId?: string | null;
  forceExpanded?: boolean; // 모두 접기/펼치기 제어용
}

export const TreeItem = memo(function TreeItem({
  node,
  level = 0,
  selectedId,
  isLast = false,
  parentLines = [],
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onReorder,
  onMoveToFolder,
  dropIndicator,
  activeId,
  forceExpanded,
}: TreeItemProps) {
  const hasChildren = (node.children?.length || 0) > 0;
  const isSelected = node.id === selectedId;
  const isFolder = node.type === "chapter"; // chapter = 폴더 역할

  // 현재 이 폴더가 드래그 중인 아이템의 부모인지 확인
  const isParentOfActive = useMemo(() => {
    if (!activeId || !node.children) return false;
    return node.children.some((child) => child.id === activeId);
  }, [activeId, node.children]);

  // 드롭 인디케이터 표시 조건
  const showDropBefore =
    dropIndicator?.id === node.id && dropIndicator.position === "before";
  const showDropAfter =
    dropIndicator?.id === node.id && dropIndicator.position === "after";
  const showDropInside =
    dropIndicator?.id === node.id &&
    dropIndicator.position === "inside" &&
    isFolder &&
    !isParentOfActive; // 자기 부모인 경우 하이라이트 제외

  // Sortable hook - 드래그 + 정렬 가능
  // animateLayoutChanges: () => false 로 드래그 중 다른 아이템들이 움직이지 않게 함
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    animateLayoutChanges: () => false, // 드래그 중 레이아웃 애니메이션 비활성화
    data: {
      type: node.id,
      isFolder,
    },
  });

  // Style: 드래그 중인 아이템만 움직임, 다른 아이템은 고정
  const style = useMemo(
    () => ({
      // 드래그 중인 본인만 transform 적용, 다른 아이템은 자리 유지
      transform: isDragging ? CSS.Transform.toString(transform) : undefined,
      transition: isDragging ? undefined : transition,
      // 드래그 중인 원래 위치는 희미하게 표시
      opacity: isDragging ? 0.3 : 1,
    }),
    [transform, transition, isDragging],
  );

  // Child IDs for nested SortableContext
  const childIds = useMemo(
    () => node.children?.map((c) => c.id) ?? [],
    [node.children],
  );

  // 1. 기본 상태 및 동작 훅
  const {
    isExpanded,
    isRenaming,
    setIsRenaming,
    renameValue,
    setRenameValue,
    setIsHovered,
    renameInputRef,
    itemRef,
    handleClick,
    handleDoubleClick,
    handleRenameSubmit,
    handleRenameKeyDown,
    toggleExpand,
  } = useTreeItem({
    initialTitle: node.title,
    nodeId: node.id,
    isFolder,
    onSelect,
    onRename,
    forceExpanded,
  });

  // 2. 컨텍스트 메뉴 훅
  const {
    showMenu,
    setShowMenu,
    menuPosition,
    menuItems,
    handleContextMenu,
    handleMenuButtonClick,
  } = useTreeItemMenu({
    node,
    onAddChild,
    onDelete,
    setIsRenaming,
  });

  const nextParentLines = useMemo(
    () => [...parentLines, !isLast],
    [parentLines, isLast],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "opacity-50 z-50")}
      data-tree-item
    >
      {/* Drop indicator - before (굵은 선 + 동그라미) */}
      {showDropBefore && (
        <div
          className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
          style={{ top: -1, marginLeft: `${level * 12}px` }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex-1 h-0.5 bg-emerald-500 rounded-full" />
        </div>
      )}

      {/* 트리 연결선 제거 - 미니멀 디자인 */}
      <TreeLines level={level} isLast={isLast} parentLines={parentLines} />

      {/* Item row */}
      <div
        ref={itemRef}
        className={cn(
          "relative flex items-center gap-1.5 py-1 pl-1 pr-2 rounded-md cursor-pointer group select-none transition-all duration-150",
          "hover:bg-muted/50",
          isSelected && "bg-mocha-400/20",
          isDragging && "shadow-lg ring-2 ring-mocha-400 bg-card",
          // 폴더 드래그 오버 상태 - 강화된 하이라이트
          showDropInside &&
            !isDragging &&
            !isParentOfActive &&
            "bg-emerald-100 ring-2 ring-emerald-500",
        )}
        style={{ marginLeft: `${level * 12}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
      >
        {/* Drag Handle - Absolute positioned to not take up space */}
        <div
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 p-0.5 cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-all opacity-0 group-hover:opacity-100 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-mocha-500 rounded-r" />
        )}

        {/* Drop target indicator for folders */}
        {showDropInside && !isDragging && !isParentOfActive && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
            여기에 놓기
          </div>
        )}

        {/* Status indicator */}
        {node.status &&
          !(showDropInside && !isDragging && !isParentOfActive) && (
            <div
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-1 ring-white",
                statusColors[node.status],
              )}
              title={getStatusTitle(node.status)}
            />
          )}

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={toggleExpand}
            className="p-0.5 hover:bg-muted rounded transition-colors shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        {/* Icon */}
        <div className="shrink-0">
          <NodeIcon node={node} isExpanded={isExpanded} />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 pr-6">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              className="w-full text-sm bg-card border border-input rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-mocha-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm truncate",
                  isSelected
                    ? "font-medium text-espresso-900"
                    : "text-foreground",
                  node.isPlot && "italic text-muted-foreground",
                )}
              >
                {node.title}
              </span>
              {/* Character count - 섹션에서만 표시 */}
              {!isFolder && (node.characterCount || 0) > 0 && (
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {formatCharCount(node.characterCount!)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons (hover) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 폴더(chapter)에서만 타입 선택 추가 버튼 표시 */}
          {isFolder && onAddChild && (
            <button
              onClick={handleMenuButtonClick}
              className="p-1 hover:bg-mocha-400/10 rounded transition-colors"
              title="추가 (폴더/섹션)"
            >
              <Plus className="h-3.5 w-3.5 text-mocha-500" />
            </button>
          )}
          <button
            onClick={handleMenuButtonClick}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Object Context Menu */}
      {showMenu && (
        <ContextMenu
          items={menuItems}
          position={menuPosition}
          onClose={() => setShowMenu(false)}
        />
      )}

      {/* Children with nested SortableContext */}
      {hasChildren && isExpanded && (
        <SortableContext
          items={childIds}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {node.children?.map((child, idx) => (
              <TreeItem
                key={child.id}
                node={child}
                level={level + 1}
                selectedId={selectedId}
                isLast={idx === (node.children?.length || 0) - 1}
                parentLines={nextParentLines}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onRename={onRename}
                onDelete={onDelete}
                onReorder={onReorder}
                onMoveToFolder={onMoveToFolder}
                dropIndicator={dropIndicator}
                activeId={activeId}
                forceExpanded={forceExpanded}
              />
            ))}
          </div>
        </SortableContext>
      )}

      {/* Drop indicator - after (굵은 선 + 동그라미) */}
      {showDropAfter && (
        <div
          className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
          style={{ bottom: -1, marginLeft: `${level * 12}px` }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex-1 h-0.5 bg-emerald-500 rounded-full" />
        </div>
      )}
    </div>
  );
});

// 헬퍼 함수
function getStatusTitle(status: string) {
  switch (status) {
    case "todo":
      return "구상 중";
    case "inProgress":
      return "집필 중";
    case "done":
      return "탈고 완료";
    case "revised":
      return "퇴고 완료";
    default:
      return "";
  }
}
