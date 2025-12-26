import { useState, type MouseEvent } from "react";
import {
  FolderPlus,
  FilePlus,
  Pencil,
  Copy,
  Trash2,
  Folder,
  FileText,
} from "lucide-react";
import type { MenuItemType } from "../ContextMenu";
import type { ChapterNode } from "../types";

interface UseTreeItemMenuProps {
  node: ChapterNode;
  hasChildren: boolean;
  onAddChild?: (parentId: string, type?: "chapter" | "section") => void;
  onDuplicate?: (id: string) => void;
  onConvertType?: (id: string, type: "chapter" | "section") => void;
  onDelete?: (id: string) => void;
  setIsRenaming: (isRenaming: boolean) => void;
}

export function useTreeItemMenu({
  node,
  hasChildren,
  onAddChild,
  onDuplicate,
  onConvertType,
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

  const menuItems: MenuItemType[] = [
    {
      icon: FolderPlus,
      label: "새 폴더 만들기",
      onClick: () => onAddChild?.(node.id, "chapter"),
    },
    {
      icon: FilePlus,
      label: "새 섹션 만들기",
      onClick: () => onAddChild?.(node.id, "section"),
    },
    { type: "divider" },
    {
      icon: Pencil,
      label: "이름 변경",
      shortcut: "F2",
      onClick: () => setIsRenaming(true),
    },
    {
      icon: Copy,
      label: "복제",
      shortcut: "⌘D",
      onClick: () => onDuplicate?.(node.id),
    },
    // Type conversion logic
    ...(node.type === "section"
      ? [
          {
            icon: Folder,
            label: "폴더로 변환",
            onClick: () => onConvertType?.(node.id, "chapter"),
          },
        ]
      : []),
    ...(node.type === "chapter" || node.type === "part"
      ? [
          {
            icon: FileText,
            label: "파일로 변환",
            onClick: () => {
              if (hasChildren) {
                alert("하위 항목이 있는 폴더는 파일로 변환할 수 없습니다.");
                return;
              }
              onConvertType?.(node.id, "section");
            },
          },
        ]
      : []),
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
