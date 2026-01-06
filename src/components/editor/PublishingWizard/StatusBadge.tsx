/**
 * StatusBadge - 게시 상태 배지 컴포넌트
 * Document의 isPublished 상태를 시각적으로 표시
 */

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isPublished: boolean;
  className?: string;
}

const statusStyles = {
  published: "bg-sage-100 text-sage-700",
  unpublished: "bg-stone-100 text-stone-600",
};

const statusLabels = {
  published: "배포됨",
  unpublished: "미배포",
};

export function StatusBadge({ isPublished, className }: StatusBadgeProps) {
  const status = isPublished ? "published" : "unpublished";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export default StatusBadge;
