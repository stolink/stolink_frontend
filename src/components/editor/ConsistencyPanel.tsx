import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConsistencyIssue {
  id: string;
  type: "warning" | "error";
  category: string;
  chapter: string;
  line: number;
  description: string;
  detail: string;
}

// Mock data
const mockIssues: ConsistencyIssue[] = [
  {
    id: "1",
    type: "error",
    category: "생존 인물 모순",
    chapter: "4권 5장",
    line: 124,
    description: "팡틴은 1권에서 병으로 사망했으나",
    detail: "코제트 앞에 팡틴이 다시 등장함",
  },
  {
    id: "2",
    type: "warning",
    category: "캐릭터 설정",
    chapter: "2권 3장",
    line: 58,
    description: "장발장은 몽트뢰유 시절 이미 백발이 되었으나",
    detail: "검은 머리칼로 묘사됨",
  },
  {
    id: "3",
    type: "warning",
    category: "위치 모순",
    chapter: "3권 1장",
    line: 12,
    description: "자베르는 현재 파리에 파견 중이나",
    detail: "몽트뢰유 경찰서에 있는 것으로 묘사됨",
  },
];

export default function ConsistencyPanel() {
  const warningCount = mockIssues.filter((i) => i.type === "warning").length;
  const errorCount = mockIssues.filter((i) => i.type === "error").length;

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">마지막 검사: 5분 전</div>
        <Button variant="outline" size="sm" className="text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          다시 검사
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-status-error">
            <AlertTriangle className="h-4 w-4" />
            <span>오류: {errorCount}</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 text-status-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>경고: {warningCount}</span>
          </div>
        )}
        {errorCount === 0 && warningCount === 0 && (
          <div className="flex items-center gap-1 text-status-success">
            <CheckCircle className="h-4 w-4" />
            <span>문제 없음</span>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {mockIssues.map((issue) => (
          <div
            key={issue.id}
            className={cn(
              "p-3 rounded-lg border",
              issue.type === "error"
                ? "border-status-error/30 bg-red-50"
                : "border-status-warning/30 bg-amber-50",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={cn(
                    "h-4 w-4",
                    issue.type === "error"
                      ? "text-status-error"
                      : "text-status-warning",
                  )}
                />
                <span className="font-medium text-sm">{issue.category}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {issue.chapter} {issue.line}줄
              </span>
            </div>

            <div className="text-sm text-foreground space-y-1 mb-2">
              <p>{issue.description}</p>
              <p className="text-muted-foreground">→ {issue.detail}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                <ArrowRight className="h-3 w-3 mr-1" />
                이동
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <X className="h-3 w-3 mr-1" />
                무시
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Passed Items */}
      <div className="mt-4 pt-4 border-t">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CheckCircle className="h-4 w-4 text-status-success" />
          통과 항목 보기 (15개)
        </button>
      </div>
    </div>
  );
}
