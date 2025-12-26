import type { Editor, Range } from "@tiptap/core";
import type { ReactNode } from "react";

/**
 * 슬래시 커맨드 아이템 타입
 */
export interface SlashCommandItem {
  title: string;
  icon: ReactNode;
  command: (params: SlashCommandParams) => void;
}

/**
 * 슬래시 커맨드 실행 파라미터
 */
export interface SlashCommandParams {
  editor: Editor;
  range: Range;
}

/**
 * 슬래시 커맨드 suggestion 옵션
 */
export interface SlashSuggestionOptions {
  char: string;
  command: (params: {
    editor: Editor;
    range: Range;
    props: { command: (params: SlashCommandParams) => void };
  }) => void;
}
