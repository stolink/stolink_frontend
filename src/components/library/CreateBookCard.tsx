import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateBookCardProps {
  onClick?: () => void;
}

export function CreateBookCard({ onClick }: CreateBookCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-stone-200 bg-transparent p-6 text-center transition-all hover:border-sage-400 hover:bg-sage-50/50 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 text-stone-400 shadow-sm transition-colors group-hover:bg-white group-hover:text-sage-500">
        <Plus className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h3 className="font-outfit text-xl font-semibold text-stone-900">
          Create New Book
        </h3>
        <p className="text-sm text-stone-500">
          Start a fresh manuscript, plot an outline, or import a file.
        </p>
      </div>
    </button>
  );
}
