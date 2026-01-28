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
        age: 28,
        gender: "남성",
        occupation: "회사원",
        backstory:
          "평범한 회사원이던 어느 날, 이세계로 소환되어 용사가 되었다. 집으로 돌아가기 위해 마왕을 물리쳐야 한다.",
        race: "인간",
        mbti: "ISFJ",
        personality: {
          coreTraits: ["성실함", "책임감"],
          flaws: ["우유부단"],
          values: ["가족", "평화"],
        },
        faction: {
          name: "왕국군",
          social: {
            rank: "용사",
            influence: 50,
            factionReputation: {},
          },
        },
      },
      appearance: {
        physique: "보통",
        skinTone: "밝음",
        eyes: "검정",
        nose: "보통",
        mouth: "보통",
        hairStyle: "단정함",
        hairColor: "검정",
        attire: ["갑옷"],
        expression: "결의에 참",
        scarsTattoos: [],
        styleContext: { artStyle: "anime" },
      },
      personality: {
        coreTraits: ["성실함"],
        flaws: [],
        values: [],
      },
      relations: {
        graph: [],
        eventRefs: [],
        locationContext: "",
      },
      currentMood: {
        emotion: "neutral",
        intensity: 5,
        trigger: null,
      },
      inventory: [],
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataVersion: "1.0",
        lockVersion: 1,
      },
      aliases: [],
      status: "active",
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
