import { Sparkles } from "lucide-react";
import type { Character } from "@/types";
import { MAX_FILTERED_ITEMS, EXCLUDED_KEYS } from "../constants";

// 영문 키 → 한글 라벨 매핑
const KEY_LABELS: Record<string, string> = {
  // Stats
  strength: "힘",
  dexterity: "민첩",
  intelligence: "지능",
  constitution: "체력",
  wisdom: "지혜",
  charisma: "매력",
  level: "레벨",
  exp: "경험치",
  hp: "체력",
  mp: "마나",
  attack: "공격력",
  defense: "방어력",
  speed: "속도",
  luck: "행운",
  // Character Info
  age: "나이",
  gender: "성별",
  occupation: "직업",
  birthplace: "출생지",
  nationality: "국적",
  affiliation: "소속",
  title: "칭호",
  status: "상태",
  alignment: "성향",
  backstory: "배경 스토리",
  motivation: "동기",
  goal: "목표",
  fear: "두려움",
  weakness: "약점",
  skill: "스킬",
  skills: "스킬",
  ability: "능력",
  abilities: "능력",
  weapon: "무기",
  equipment: "장비",
  // Appearance
  height: "키",
  weight: "몸무게",
  hair: "머리카락",
  eyes: "눈",
  skin: "피부",
  build: "체격",
  // Misc
  note: "비고",
  notes: "비고",
  memo: "메모",
  quote: "명언",
  catchphrase: "캐치프레이즈",
};

function getLabel(key: string): string {
  const lowerKey = key.toLowerCase();
  return KEY_LABELS[lowerKey] || key;
}

interface CharacterAdditionalDetailsProps {
  character: Character;
}

export function CharacterAdditionalDetails({
  character,
}: CharacterAdditionalDetailsProps) {
  if (!character.extras || Object.keys(character.extras).length === 0) {
    return null;
  }

  const filteredExtras = Object.entries(character.extras)
    .filter(
      ([key]) =>
        !EXCLUDED_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase())),
    )
    .slice(0, MAX_FILTERED_ITEMS);

  if (filteredExtras.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> 추가 정보
      </h3>
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredExtras.map(([key, value]) => (
            <div
              key={key}
              className="p-3 bg-cloud-50 rounded-lg border border-input"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                {getLabel(key)}
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
