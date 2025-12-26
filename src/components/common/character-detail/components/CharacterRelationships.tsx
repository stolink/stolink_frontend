import { Users, User } from "lucide-react";

interface Relationship {
  name: string;
  relation: string;
}

interface CharacterRelationshipsProps {
  relationships: Relationship[];
}

export function CharacterRelationships({
  relationships,
}: CharacterRelationshipsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
        <Users className="h-4 w-4" /> Relationships
      </h3>
      <div className="space-y-3">
        {relationships.length > 0 ? (
          relationships.map((rel, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-700 group-hover:text-primary">
                  {rel.name}
                  {rel.relation && (
                    <span className="text-[10px] font-normal text-stone-400 ml-1">
                      ({rel.relation})
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-400">관계 정보가 없습니다</p>
        )}
      </div>
    </div>
  );
}
