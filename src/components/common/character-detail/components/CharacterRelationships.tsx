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
      <h3 className="font-bold text-relation-neutral text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-input pb-2">
        <Users className="h-4 w-4" /> Relationships
      </h3>
      <div className="space-y-3">
        {relationships.length > 0 ? (
          relationships.map((rel, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-cloud-50 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground group-hover:text-mocha-500">
                  {rel.name}
                  {rel.relation && (
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                      ({rel.relation})
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">관계 정보가 없습니다</p>
        )}
      </div>
    </div>
  );
}
