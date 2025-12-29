import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateBookCardProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function CreateBookCard({ onClick, disabled }: CreateBookCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-input bg-transparent p-6 text-center transition-all hover:border-mocha-400 hover:bg-mocha-400/10 focus:outline-none focus:ring-2 focus:ring-mocha-400 focus:ring-offset-2",
        disabled &&
          "opacity-50 cursor-not-allowed hover:border-input hover:bg-transparent"
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cloud-50 text-muted-foreground shadow-sm transition-colors group-hover:bg-white group-hover:text-mocha-500">
        <Plus className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h3 className="font-outfit text-xl font-semibold text-foreground">
          {disabled ? "Creating..." : "Create New Book"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Start a fresh manuscript, plot an outline, or import a file.
        </p>
      </div>
    </button>
  );
}
