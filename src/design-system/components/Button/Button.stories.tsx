import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Design System/Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    intent: {
      control: "select",
      options: ["primary", "secondary", "ghost", "outline", "danger", "glass"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
    shape: {
      control: "select",
      options: ["default", "pill", "square"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    intent: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    intent: "secondary",
    children: "Secondary Button",
  },
};

export const Ghost: Story = {
  args: {
    intent: "ghost",
    children: "Ghost Button",
  },
};

export const Danger: Story = {
  args: {
    intent: "destructive",
    children: "Delete Item",
  },
};

export const Glass: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  args: {
    intent: "ghost",
    children: "Glass Effect",
  },
};
