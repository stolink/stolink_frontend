import { useMemo } from "react";
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
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
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
}

export function TreeItem({
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
}: TreeItemProps) {
  const hasChildren = (node.children?.length || 0) > 0;
  const isPart = node.type === "part";
  const isSelected = node.id === selectedId;

  // Sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  // DnD Sensors for children (simplified - pointer only for nested contexts)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Child IDs for nested SortableContext
  const childIds = useMemo(
    () => node.children?.map((c) => c.id) ?? [],
    [node.children],
  );

  // Handle child reorder with error logging
  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && node.children) {
      const children = node.children;
      const oldIndex = children.findIndex((c) => c.id === active.id);
      const newIndex = children.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        console.error("Invalid drag indices:", {
          oldIndex,
          newIndex,
          activeId: active.id,
          overId: over.id,
        });
        return;
      }

      const newOrder = [...children];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      const orderedIds = newOrder.map((c) => c.id);
      onReorder?.(node.id, orderedIds);
    }
  };

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
    isPart,
    onSelect,
    onRename,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "opacity-50 z-50")}
      data-tree-item
    >
      {/* 트리 연결선 컴포넌트 */}
      <TreeLines level={level} isLast={isLast} parentLines={parentLines} />

      {/* Item row */}
      <div
        ref={itemRef}
        className={cn(
          "relative flex items-center gap-1.5 py-1 pr-2 rounded-md cursor-pointer group select-none transition-colors duration-100",
          "hover:bg-stone-50",
          isSelected && "bg-sage-50",
          isDragging && "shadow-lg ring-2 ring-sage-400 bg-white",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          className="p-0.5 cursor-grab active:cursor-grabbing hover:bg-stone-200 rounded transition-colors shrink-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5 text-stone-400" />
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-sage-500 rounded-r" />
        )}

        {/* Status indicator */}
        {node.status && (
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
            className="p-0.5 hover:bg-stone-200 rounded transition-colors shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
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
              className="w-full text-sm bg-white border border-sage-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-sage-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm truncate",
                  isSelected ? "font-medium text-sage-900" : "text-stone-700",
                  node.isPlot && "italic text-stone-500",
                )}
              >
                {node.title}
              </span>
              {/* Character count */}
              {!isPart && (node.characterCount || 0) > 0 && (
                <span className="text-[10px] text-stone-400 shrink-0 tabular-nums">
                  {formatCharCount(node.characterCount!)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons (hover) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPart && onAddChild && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node.id);
              }}
              className="p-1 hover:bg-sage-100 rounded transition-colors"
              title="추가"
            >
              <Plus className="h-3.5 w-3.5 text-sage-600" />
            </button>
          )}
          <button
            onClick={handleMenuButtonClick}
            className="p-1 hover:bg-stone-200 rounded transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-stone-500" />
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

      {/* Children with nested DndContext */}
      {hasChildren && isExpanded && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChildDragEnd}
        >
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
                  parentLines={[...parentLines, !isLast]}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                  onRename={onRename}
                  onDelete={onDelete}
                  onReorder={onReorder}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

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
