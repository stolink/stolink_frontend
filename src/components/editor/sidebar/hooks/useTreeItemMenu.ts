import { useState, type MouseEvent } from "react";
import { FilePlus, Pencil, Trash2 } from "lucide-react";
import type { MenuItemType } from "../ContextMenu";
import type { ChapterNode } from "../types";

interface UseTreeItemMenuProps {
  node: ChapterNode;
  onAddChild?: (parentId: string, type?: "chapter" | "section") => void;
  onDelete?: (id: string) => void;
  setIsRenaming: (isRenaming: boolean) => void;
}

export function useTreeItemMenu({
  node,
  onAddChild,
  onDelete,
  setIsRenaming,
}: UseTreeItemMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleMenuButtonClick = (e: MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.top });
    setShowMenu(true);
  };

  // 폴더(chapter/part)인 경우에만 하위 섹션 추가 가능
  // 섹션(section)에서는 하위 항목 생성 불가
  const isFolder = node.type === "chapter" || node.type === "part";

  const menuItems: MenuItemType[] = [
    // 폴더일 때만 "새 하위 섹션" 메뉴 표시
    ...(isFolder && onAddChild
      ? [
        {
          icon: FilePlus,
          label: "새 하위 섹션",
          onClick: () => onAddChild(node.id, "section"),
        },
        { type: "divider" as const },
      ]
      : []),
    {
      icon: Pencil,
      label: "이름 변경",
      shortcut: "F2",
      onClick: () => setIsRenaming(true),
    },
    { type: "divider" },
    {
      icon: Trash2,
      label: "휴지통으로 이동",
      danger: true,
      onClick: () => onDelete?.(node.id),
    },
  ];

  return {
    showMenu,
    setShowMenu,
    menuPosition,
    menuItems,
    handleContextMenu,
    handleMenuButtonClick,
  };
}
