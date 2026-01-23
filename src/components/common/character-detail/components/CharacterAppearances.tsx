import {
  BookOpen,
  ChevronRight,
  MoreHorizontal,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@stolink/ui";

interface CharacterAppearancesProps {
  appearances: string[];
  biography?: string;
}

export function CharacterAppearances({
  appearances,
  biography,
}: CharacterAppearancesProps) {
  return (
    <div className="space-y-4">
      <h3 className="editorial-section-heading">
        <BookOpen className="h-5 w-5 text-mocha-500" />
        등장 정보
      </h3>

      {biography && (
        <div className="editorial-card p-5 mb-6 bg-gradient-to-r from-paper to-white border-l-4 border-l-mocha-400">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="h-4 w-4 text-mocha-600" />
            <span className="text-xs font-bold text-mocha-600 uppercase tracking-wider">
              인물 개요
            </span>
          </div>
          <p className="text-sm text-espresso-700 leading-relaxed line-clamp-3">
            {biography}
          </p>
        </div>
      )}

      {appearances.length > 0 ? (
        <div className="space-y-3">
          {appearances.slice(0, 5).map((chapter, idx) => (
            <div
              key={idx}
              className="timeline-item editorial-fade-in"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <a href="#" className="block editorial-card p-4 hover-lift group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-espresso-900 group-hover:text-mocha-500 transition-colors">
                      {chapter}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-cloud-300 group-hover:text-mocha-500 group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            </div>
          ))}

          {appearances.length > 5 && (
            <div className="flex items-center justify-center pt-4">
              <Button
                intent="ghost"
                size="sm"
                className="gap-2 text-mocha-500 hover:text-mocha-700 hover:bg-mocha-500/5"
              >
                <MoreHorizontal className="h-4 w-4" />
                모두 보기 ({appearances.length}개)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="editorial-empty-state py-12">
          <BookOpen className="editorial-empty-state-icon" />
          <p className="editorial-empty-state-title">등장 정보 없음</p>
          <p className="editorial-empty-state-description">
            이 캐릭터의 등장 정보가 아직 기록되지 않았습니다.
          </p>
        </div>
      )}
    </div>
  );
}
