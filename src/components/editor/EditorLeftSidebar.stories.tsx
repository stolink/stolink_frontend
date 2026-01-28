import type { Meta, StoryObj } from "@storybook/react";
import EditorLeftSidebar from "./EditorLeftSidebar";

const meta: Meta<typeof EditorLeftSidebar> = {
  title: "Editor/EditorLeftSidebar",
  component: EditorLeftSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: { control: "boolean" },
    onToggle: { action: "toggled" },
    onSelectChapter: { action: "selected" },
  },
  decorators: [
    (Story) => (
      <div className="h-screen flex">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EditorLeftSidebar>;

const mockChapters = [
  {
    id: "folder-1",
    title: "제1장: 시작",
    type: "chapter" as const,
    children: [
      { id: "doc-1", title: "1화. 소환", type: "section" as const },
      { id: "doc-2", title: "2화. 각성", type: "section" as const },
    ],
  },
  {
    id: "folder-2",
    title: "제2장: 모험",
    type: "chapter" as const,
    children: [
      { id: "doc-3", title: "3화. 만남", type: "section" as const },
      { id: "doc-4", title: "4화. 위기", type: "section" as const },
    ],
  },
];

export const Expanded: Story = {
  args: {
    isOpen: true,
    chapters: mockChapters,
    selectedChapterId: "doc-1",
    projectTitle: "용사님 비켜주세요",
    totalChars: 12500,
    onAddChapter: async () => null,
    onRenameChapter: () => {},
    onDeleteChapter: () => {},
    onReorderChapter: () => {},
    onMoveToFolder: () => {},
  },
};

export const Collapsed: Story = {
  args: {
    ...Expanded.args,
    isOpen: false,
  },
};

export const Empty: Story = {
  args: {
    ...Expanded.args,
    chapters: [],
    projectTitle: "새 프로젝트",
    totalChars: 0,
  },
};
