import { BookOpen, ChevronRight } from "lucide-react";

interface CharacterAppearancesProps {
  appearances: string[];
}

export function CharacterAppearances({
  appearances,
}: CharacterAppearancesProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
        <BookOpen className="h-4 w-4" /> Appearances
      </h3>
      <div className="space-y-2">
        {appearances.length > 0 ? (
          <>
            {appearances.slice(0, 3).map((chapter, idx) => (
              <a
                key={idx}
                href="#"
                className="flex items-center justify-between p-2.5 rounded border border-stone-200 bg-stone-50/50 hover:bg-white hover:shadow-sm hover:border-primary/30 transition-all group"
              >
                <span className="text-xs font-bold text-stone-700">
                  {chapter}
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-primary" />
              </a>
            ))}
            {appearances.length > 3 && (
              <div className="flex items-center justify-center pt-2">
                <button className="text-xs font-bold text-primary hover:underline">
                  View All Mentions ({appearances.length})
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-stone-400">등장 정보가 없습니다</p>
        )}
      </div>
    </div>
  );
}
