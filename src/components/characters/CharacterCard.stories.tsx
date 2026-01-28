import type { Meta, StoryObj } from "@storybook/react";
import { CharacterCard } from "./CharacterCard";

const meta: Meta<typeof CharacterCard> = {
  title: "Characters/CharacterCard",
  component: CharacterCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    character: {
      control: "object",
    },
    onClick: { action: "clicked" },
  },
  decorators: [
    (Story) => (
      <div className="w-[200px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CharacterCard>;

export const Default: Story = {
  args: {
    character: {
      _id: "char-1",
      projectId: "proj-1",
      role: "protagonist",
      profile: {
        name: "김철수",
        age: "28",
        gender: "남성",
        occupation: "회사원",
        backstory:
          "평범한 회사원이던 어느 날, 이세계로 소환되어 용사가 되었다. 집으로 돌아가기 위해 마왕을 물리쳐야 한다.",
        appearance: "검은 머리, 평범한 인상",
        personality: "성실함, 겁이 많음",
        goals: "집으로 귀환",
      },
      relationships: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    index: 0,
  },
};

export const WithImage: Story = {
  args: {
    character: {
      ...Default.args!.character!,
      imageUrl: "https://placehold.co/300x400/png",
    },
  },
};

export const Antagonist: Story = {
  args: {
    character: {
      ...Default.args!.character!,
      role: "antagonist",
      profile: {
        ...Default.args!.character!.profile,
        name: "마왕 자드",
        backstory: "세상을 지배하려는 암흑의 군주.",
      },
    },
  },
};

export const Mentor: Story = {
  args: {
    character: {
      ...Default.args!.character!,
      role: "mentor",
      profile: {
        ...Default.args!.character!.profile,
        name: "현자 간달프",
        backstory: "오랜 세월을 살아온 현자. 주인공을 이끈다.",
      },
    },
  },
};
