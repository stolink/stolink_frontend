import { TrendingUp } from "lucide-react";

interface CharacterArcProps {
  progress: number;
}

export function CharacterArc({ progress }: CharacterArcProps) {
  // 마일스톤 위치 (25%, 50%, 75%)
  const milestones = [25, 50, 75];

  return (
    <div className="space-y-4">
      <h3 className="editorial-section-heading">
        <TrendingUp className="h-5 w-5 text-primary/70" />
        스토리 진행
      </h3>

      <div className="editorial-card p-5 space-y-4">
        {/* Progress Header */}
        <div className="flex justify-between items-center">
          <span className="magazine-caption not-italic">캐릭터 아크 진행률</span>
          <span className="text-2xl font-semibold text-stone-900 editorial-name">
            {progress}%
          </span>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="editorial-progress">
          <div
            className="editorial-progress-fill"
            style={{ width: `${progress}%` }}
          />
          {milestones.map((milestone) => (
            <div
              key={milestone}
              className="editorial-progress-milestone"
              style={{ left: `${milestone}%` }}
            />
          ))}
        </div>

        {/* Milestone Labels */}
        <div className="flex justify-between text-[10px] text-stone-400 px-1">
          <span>시작</span>
          <span>전개</span>
          <span>클라이맥스</span>
          <span>결말</span>
        </div>

        {/* Description */}
        <p className="text-xs text-stone-500 pt-2 border-t border-stone-100">
          캐릭터의 스토리 아크 진행 상황을 시각화합니다.
          시작부터 결말까지의 여정을 추적하세요.
        </p>
      </div>
    </div>
  );
}
