import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { User } from "lucide-react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { CharacterHoverCard } from "./CharacterHoverCard";
import { DEMO_CHARACTERS } from "./CharacterMention";

export default function CharacterNodeView({ node }: NodeViewProps) {
  const id = node.attrs.id as string;
  const label = node.attrs.label as string;

  // Find character data from DEMO_CHARACTERS
  const character = DEMO_CHARACTERS.find(
    (c) => c.id === id || c.name === label
  );

  // Extract extras data for display
  const description = character?.extras?.설명 as string | undefined;
  const age = character?.extras?.나이 as number | undefined;
  const traits = character?.extras?.성격 as string[] | undefined;

  return (
    <NodeViewWrapper className="inline-flex items-center align-middle">
      <Tippy
        content={
          character ? (
            <CharacterHoverCard
              name={character.name}
              role={character.role ?? "기타"}
              description={description}
              age={age}
              trait={traits?.[0]}
              avatar={character.imageUrl}
            />
          ) : (
            <div className="p-2 text-sm text-stone-500">캐릭터 정보 없음</div>
          )
        }
        interactive={true}
        placement="bottom"
        animation="shift-away"
        theme="light-border"
        delay={[100, 0]}
        appendTo={() => document.body}
      >
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-indigo-50 text-indigo-700 rounded text-sm font-medium border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors select-none">
          <User className="w-3 h-3" />
          {label}
        </span>
      </Tippy>
    </NodeViewWrapper>
  );
}
