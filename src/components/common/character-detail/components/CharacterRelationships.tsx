import { Users, User, ChevronRight } from "lucide-react";

interface Relationship {
  name: string;
  relation: string;
}

interface CharacterRelationshipsProps {
  relationships: Relationship[];
}

// 관계 유형에 따른 색상 클래스 결정
const getRelationshipClass = (relation: string): string => {
  const lowerRelation = relation.toLowerCase();
  if (lowerRelation.includes("적") || lowerRelation.includes("hostile") || lowerRelation.includes("enemy")) {
    return "relationship-hostile";
  }
  if (lowerRelation.includes("연인") || lowerRelation.includes("romantic") || lowerRelation.includes("love")) {
    return "relationship-romantic";
  }
  if (lowerRelation.includes("친구") || lowerRelation.includes("동료") || lowerRelation.includes("friendly") || lowerRelation.includes("ally")) {
    return "relationship-friendly";
  }
  return "";
};

export function CharacterRelationships({
  relationships,
}: CharacterRelationshipsProps) {
  return (
    <div className="space-y-4">
      <h3 className="editorial-section-heading">
        <Users className="h-5 w-5 text-primary/70" />
        인물 관계
      </h3>

      {relationships.length > 0 ? (
        <div className="space-y-2">
          {relationships.map((rel, idx) => {
            const relationClass = getRelationshipClass(rel.relation);
            return (
              <div
                key={idx}
                className={`editorial-card p-4 hover-lift cursor-pointer group flex items-center gap-4 ${relationClass}`}
                style={{
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                  <User className="h-5 w-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-primary transition-colors">
                    {rel.name}
                  </p>
                  {rel.relation && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      {rel.relation}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />

                {/* Color Indicator */}
                {relationClass && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg relationship-indicator"
                    style={{ background: `var(--relationship-color)` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="editorial-empty-state py-12">
          <Users className="editorial-empty-state-icon" />
          <p className="editorial-empty-state-title">관계 정보 없음</p>
          <p className="editorial-empty-state-description">
            이 캐릭터의 관계 정보가 아직 설정되지 않았습니다.
          </p>
        </div>
      )}
    </div>
  );
}
