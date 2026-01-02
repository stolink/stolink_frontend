import { BookOpen, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CharacterAppearancesProps {
  appearances: string[];
}

export function CharacterAppearances({
  appearances,
}: CharacterAppearancesProps) {
  return (
    <div className="space-y-4">
      <h3 className="editorial-section-heading">
        <BookOpen className="h-5 w-5 text-primary/70" />
        등장 정보
      </h3>

      {appearances.length > 0 ? (
        <div className="space-y-3">
          {appearances.slice(0, 5).map((chapter, idx) => (
            <div
              key={idx}
              className="timeline-item editorial-fade-in"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <a
                href="#"
                className="block editorial-card p-4 hover-lift group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-stone-900 group-hover:text-primary transition-colors">
                      {chapter}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            </div>
          ))}

          {appearances.length > 5 && (
            <div className="flex items-center justify-center pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-primary hover:text-primary hover:bg-primary/5"
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
