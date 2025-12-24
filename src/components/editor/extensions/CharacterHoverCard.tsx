import { Badge } from "@/components/ui/badge";
import { User, Calendar, Sparkles } from "lucide-react";

interface CharacterHoverCardProps {
  name: string;
  role: string;
  description?: string;
  age?: number;
  trait?: string;
  avatar?: string | null;
}

export function CharacterHoverCard({
  name,
  role,
  description,
  age,
  trait,
  avatar,
}: CharacterHoverCardProps) {
  return (
    <div className="w-64 bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 text-white">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-full border-2 border-white/50 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-sm">{name}</h4>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-white/20 text-white border-none"
            >
              {role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {description && (
          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {(age || trait) && (
          <div className="flex items-center gap-3 pt-1 border-t border-stone-100">
            {age && (
              <div className="flex items-center gap-1 text-[10px] text-stone-500">
                <Calendar className="w-3 h-3" />
                <span>{age}세</span>
              </div>
            )}
            {trait && (
              <div className="flex items-center gap-1 text-[10px] text-stone-500">
                <Sparkles className="w-3 h-3" />
                <span>{trait}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
