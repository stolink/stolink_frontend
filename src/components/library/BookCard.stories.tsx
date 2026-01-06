import type { Meta, StoryObj } from "@storybook/react";
import { BookCard } from "./BookCard";

const meta: Meta<typeof BookCard> = {
  title: "Library/BookCard",
  component: BookCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "cloud" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Writing: Story = {
  args: {
    title: "The Wind in the Willows",
    author: "Kenneth Grahame",
    status: "Writing",
    genre: "Fantasy",
    progress: 45,
    lastEdited: "2 hours ago",
    length: "45.2k words",
  },
};

export const Complete: Story = {
  args: {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    status: "Complete",
    genre: "Romance",
    progress: 100,
    lastEdited: "1 year ago",
    length: "120k words",
  },
};

export const EditMode: Story = {
  args: {
    ...Writing.args,
    isEditMode: true,
    isSelected: false,
    onSelect: () => console.log("Selected"),
  },
};

export const Selected: Story = {
  args: {
    ...Writing.args,
    isEditMode: true,
    isSelected: true,
    onSelect: () => console.log("Selected"),
  },
};

export const WithCover: Story = {
  args: {
    ...Writing.args,
    coverImage:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2730&ixlib=rb-4.0.3",
  },
};
