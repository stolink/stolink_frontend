import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { User, Package } from "lucide-react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { CharacterHoverCard } from "./CharacterHoverCard";
import { DEMO_CHARACTERS, DEMO_ITEMS } from "@/data/demoData";

export default function CharacterNodeView({ node }: NodeViewProps) {
  const id = node.attrs.id as string;
  const label = node.attrs.label as string;

  // Find character data from DEMO_CHARACTERS
  const character = DEMO_CHARACTERS.find(
    (c) => c.id === id || c.name === label,
  );

  // Find item data from DEMO_ITEMS (if not a character)
  const item = !character
    ? DEMO_ITEMS.find((i) => i.id === id || i.name === label)
    : null;

  // Determine entity type
  const isItem = !!item;
  const isCharacter = !!character;

  // Extract extras data for display (character only)
  const description = character?.extras?.설명 as string | undefined;
  const age = character?.extras?.나이 as number | undefined;
  const traits = character?.extras?.성격 as string[] | undefined;

  // 아이템용 호버 카드 컨텐츠
  const itemDescription = item?.extras?.설명 as string | undefined;
  const itemHoverContent = item ? (
    <div className="p-3 bg-white rounded-lg shadow-lg border min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Package className="w-4 h-4 text-amber-600" />
        <span className="font-semibold text-stone-800">{item.name}</span>
      </div>
      <span className="text-xs text-amber-600 capitalize">{item.type}</span>
      {itemDescription && (
        <p className="text-xs text-stone-500 mt-1">{itemDescription}</p>
      )}
    </div>
  ) : (
    <div className="p-2 text-sm text-muted-foreground">아이템 정보 없음</div>
  );

  return (
    <NodeViewWrapper className="inline-flex items-center align-middle">
      <Tippy
        content={
          isCharacter && character ? (
            <CharacterHoverCard
              name={character.name}
              role={character.role ?? "기타"}
              description={description}
              age={age}
              trait={traits?.[0]}
              avatar={character.imageUrl}
            />
          ) : isItem ? (
            itemHoverContent
          ) : (
            <div className="p-2 text-sm text-muted-foreground">정보 없음</div>
          )
        }
        interactive={true}
        placement="bottom"
        animation="shift-away"
        theme="light-border"
        delay={[100, 0]}
        appendTo={() => document.body}
      >
        {/* 캐릭터: 블루 테마, User 아이콘 */}
        {/* 아이템: 앰버 테마, Package 아이콘 */}
        <span
          className={
            isItem
              ? "inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 bg-amber-50/80 text-amber-900 rounded-md text-[13px] font-semibold border border-amber-200/60 cursor-pointer hover:bg-amber-100/90 hover:border-amber-300/80 transition-all shadow-sm select-none"
              : "inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 bg-mocha-50 text-mocha-700 rounded-md text-[13px] font-semibold border border-mocha-200/60 cursor-pointer hover:bg-mocha-100 hover:border-mocha-300 transition-all shadow-sm select-none"
          }
        >
          {isItem ? (
            <Package className="w-3 h-3" />
          ) : (
            <User className="w-3 h-3" />
          )}
          {label}
        </span>
      </Tippy>
    </NodeViewWrapper>
  );
}
