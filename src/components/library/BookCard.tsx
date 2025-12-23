import { Clock, BookOpen, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ProjectStatus = "DRAFTING" | "OUTLINE" | "EDITING" | "IDEA";

interface BookCardProps {
  title: string;
  author: string;
  status: ProjectStatus;
  coverImage?: string;
  location?: string;
  length?: string;
  progress: number;
  lastEdited: string;
  onClick?: () => void;
  onMenuClick?: (e: React.MouseEvent) => void;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  DRAFTING: {
    label: "DRAFTING",
    className: "bg-white text-stone-800 border-stone-200",
  },
  OUTLINE: {
    label: "OUTLINE",
    className: "bg-white text-stone-800 border-stone-200",
  },
  EDITING: {
    label: "EDITING",
    className: "bg-stone-900 text-white border-stone-900",
  },
  IDEA: {
    label: "IDEA",
    className: "bg-white text-stone-800 border-stone-200",
  },
};

export function BookCard({
  title,
  author,
  status,
  coverImage,
  location = "Chapter 1",
  length = "0 W",
  progress,
  lastEdited,
  onClick,
  onMenuClick,
}: BookCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-sage-300 hover:shadow-md cursor-pointer"
    >
      {/* Cover Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-50">
        <Badge
          variant="outline"
          className={cn(
            "absolute left-4 top-4 z-10 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider shadow-sm",
            statusInfo.className,
          )}
        >
          {statusInfo.label}
        </Badge>

        <div className="absolute right-4 top-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/80 p-0 text-stone-600 backdrop-blur-sm hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick?.(e);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Details</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-6">
          <h3 className="font-outfit text-lg font-bold text-stone-900 line-clamp-1 mb-1">
            {title}
          </h3>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
            BY {author}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-dashed border-stone-200 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">
              LOCATION
            </p>
            <p className="text-sm font-semibold text-stone-700">{location}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">
              LENGTH
            </p>
            <p className="text-sm font-semibold text-stone-700">{length}</p>
          </div>
        </div>

        <div className="mt-auto space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600">
                {status === "OUTLINE"
                  ? "Outline Status"
                  : status === "DRAFTING"
                    ? "Overall Progress"
                    : "Revision Status"}
              </span>
              <span className="font-bold text-stone-900">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 bg-stone-100"
              indicatorClassName="bg-stone-900"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Edited {lastEdited}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
