import { useState, useRef, useEffect, useCallback } from "react";
import type { ChapterNode } from "../types";

interface UseTreeItemOptions {
  node: ChapterNode;
  onRename?: (id: string, newTitle: string) => void;
}

interface MenuPosition {
  x: number;
  y: number;
}

/**
 * TreeItem 상태 관리 커스텀 훅
 * 펼침/접힘, 이름 변경, 컨텍스트 메뉴 로직 캡슐화
 */
export function useTreeItem({ node, onRename }: UseTreeItemOptions) {
  // 상태
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 0,
    y: 0,
  });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const [isHovered, setIsHovered] = useState(false);

  // Refs
  const renameInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // 파생 상태
  const hasChildren = (node.children?.length || 0) > 0;
  const isPart = node.type === "part";

  // 이름 변경 입력 포커스
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // F2 단축키 핸들링
  useEffect(() => {
    if (!isHovered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && !isRenaming) {
        e.preventDefault();
        setIsRenaming(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, isRenaming]);

  // 펼침/접힘 토글
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // 이름 변경 제출
  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim() && renameValue !== node.title) {
      onRename?.(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  }, [renameValue, node.title, node.id, onRename]);

  // 이름 변경 취소
  const cancelRename = useCallback(() => {
    setIsRenaming(false);
    setRenameValue(node.title);
  }, [node.title]);

  // 컨텍스트 메뉴 열기
  const openContextMenu = useCallback((x: number, y: number) => {
    setMenuPosition({ x, y });
    setShowMenu(true);
  }, []);

  // 메뉴 버튼 클릭
  const handleMenuButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      openContextMenu(rect.right, rect.top);
    },
    [openContextMenu]
  );

  // 우클릭
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openContextMenu(e.clientX, e.clientY);
    },
    [openContextMenu]
  );

  // 호버 핸들러
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return {
    // State
    isExpanded,
    showMenu,
    menuPosition,
    isRenaming,
    renameValue,
    isHovered,
    hasChildren,
    isPart,

    // Refs
    renameInputRef,
    itemRef,

    // Actions
    toggleExpand,
    setIsExpanded,
    setShowMenu,
    setIsRenaming,
    setRenameValue,
    handleRenameSubmit,
    cancelRename,
    handleMenuButtonClick,
    handleContextMenu,
    handleMouseEnter,
    handleMouseLeave,
  };
}
