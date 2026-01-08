import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Design System/Atoms/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    intent: "primary",
    children: "Primary Badge",
  },
};

export const Secondary: Story = {
  args: {
    intent: "secondary",
    children: "Secondary Badge",
  },
};

export const Destructive: Story = {
  args: {
    intent: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    intent: "outline",
    children: "Outline",
  },
};

export const Success: Story = {
  args: {
    intent: "success",
    children: "Success",
  },
};
