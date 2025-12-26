import { TrendingUp } from "lucide-react";

interface CharacterArcProps {
  progress: number;
}

export function CharacterArc({ progress }: CharacterArcProps) {
  return (
    <div>
      <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
        <TrendingUp className="h-4 w-4" /> Character Arc
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-stone-600">
          <span>진행률</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1.5 border border-stone-200">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-stone-400 mt-1 leading-normal">
          캐릭터 아크 진행 상황을 표시합니다.
        </p>
      </div>
    </div>
  );
}
