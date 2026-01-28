import type { Meta, StoryObj } from "@storybook/react";
import { EditorContent } from "./EditorContent";
import type { Document } from "@/types/document";

const meta: Meta<typeof EditorContent> = {
  title: "Editor/EditorContent",
  component: EditorContent,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-screen w-full bg-paper">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EditorContent>;

const mockDocuments: Document[] = [
  {
    id: "folder-1",
    projectId: "p1",
    title: "Chapter 1",
    type: "folder",
    children: [
      {
        id: "doc-1",
        projectId: "p1",
        title: "Scene 1",
        type: "text",
        content: "It was a dark and stormy night...",
      },
    ],
  },
] as unknown as Document[];

const baseArgs = {
  selectedFolderId: "folder-1",
  selectedSectionId: "doc-1",
  projectId: "p1",
  isFocusMode: false,
  currentContent: "<h1>Chapter 1</h1><p>It was a dark and stormy night...</p>",
  currentSectionTitle: "Scene 1",
  onCharacterCountChange: () => {},
  onContentChange: () => {},
  documents: mockDocuments,
  isDemo: true,
  splitView: { enabled: false, direction: "horizontal" as const },
  viewMode: "editor" as const,
};

export const EditorMode: Story = {
  args: {
    ...baseArgs,
  },
};

export const SplitView: Story = {
  args: {
    ...baseArgs,
    splitView: { enabled: true, direction: "vertical" as const },
  },
};
