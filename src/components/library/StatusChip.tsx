import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ✅ API 형식 통일 - 대문자만 사용
export type ProjectStatusType = "EDITING" | "COMPLETED";

interface StatusChipProps {
    // 현재 상태
    status: ProjectStatusType;
    // 상태 변경 콜백
    onStatusChange: (status: ProjectStatusType) => void;
    // 비활성화 여부
    disabled?: boolean;
}

// 상태별 라벨 정의
const STATUS_LABELS: Record<ProjectStatusType, string> = {
    EDITING: "Writing",
    COMPLETED: "Complete",
};

/**
 * 상태 변경 드롭다운 칩 컴포넌트
 * - 클릭 시 드롭다운 메뉴 표시
 * - Writing(EDITING)/Complete(COMPLETED) 상태 선택 가능
 * - Complete 상태 시 초록색 배경으로 시각적 피드백
 */
export function StatusChip({
    status,
    onStatusChange,
    disabled = false,
}: StatusChipProps) {
    const [isOpen, setIsOpen] = useState(false);

    // 상태에 따른 스타일 결정
    const isCompleted = status === "COMPLETED";

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        // 기본 스타일
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200",
                        // 호버 효과
                        "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1",
                        // 상태별 스타일
                        isCompleted
                            ? "bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-300"
                            : "bg-sage-100 text-sage-700 hover:bg-sage-200 focus:ring-sage-300",
                        // 비활성화 스타일
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {/* 상태 인디케이터 도트 */}
                    <span
                        className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isCompleted ? "bg-green-500" : "bg-sage-500"
                        )}
                    />
                    {/* 상태 라벨 */}
                    <span>{STATUS_LABELS[status]}</span>
                    {/* 드롭다운 화살표 */}
                    <ChevronDown
                        className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )}
                    />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Writing(EDITING) 옵션 */}
                <DropdownMenuItem
                    onClick={() => {
                        onStatusChange("EDITING");
                        setIsOpen(false);
                    }}
                    className="flex items-center justify-between gap-2"
                >
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sage-500" />
                        <span>Writing</span>
                    </div>
                    {status === "EDITING" && <Check className="h-4 w-4 text-sage-600" />}
                </DropdownMenuItem>

                {/* Complete(COMPLETED) 옵션 */}
                <DropdownMenuItem
                    onClick={() => {
                        onStatusChange("COMPLETED");
                        setIsOpen(false);
                    }}
                    className="flex items-center justify-between gap-2"
                >
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Complete</span>
                    </div>
                    {status === "COMPLETED" && (
                        <Check className="h-4 w-4 text-green-600" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
