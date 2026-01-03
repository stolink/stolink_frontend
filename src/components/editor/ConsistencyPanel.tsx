import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="flex flex-col h-full bg-stone-50/30">
      {/* Header */}
      <div className="px-4 py-3 border-b border-mocha-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">설정 오류 검사</h3>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-white border-mocha-200 hover:bg-mocha-50 hover:text-mocha-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          다시 검사
        </Button>
      </div>

      {/* Stats Banner */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2 p-1 bg-stone-50 rounded-xl border border-stone-200/60 shadow-inner">
          <div
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              errorCount > 0
                ? "bg-rose-100 text-rose-700 shadow-sm"
                : "text-stone-400",
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            오류 {errorCount}
          </div>
          <div className="w-px h-6 bg-stone-200" />
          <div
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              warningCount > 0
                ? "bg-amber-100 text-amber-700 shadow-sm"
                : "text-stone-400",
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            경고 {warningCount}
          </div>
          <div className="w-px h-6 bg-stone-200" />
          <div
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              errorCount === 0 && warningCount === 0
                ? "bg-sage-100 text-sage-700 shadow-sm"
                : "text-stone-400",
            )}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            정상
          </div>
        </div>
        <div className="mt-2 text-[10px] text-right text-stone-400">
          마지막 검사: 5분 전
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-stone-200">
        <AnimatePresence>
          {mockIssues.map((issue) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={issue.id}
              className={cn(
                "group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300",
                "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r-full before:transition-all",
                issue.type === "error"
                  ? "border-rose-100 hover:border-rose-200 before:bg-rose-400 shadow-rose-900/5"
                  : "border-amber-100 hover:border-amber-200 before:bg-amber-400 shadow-amber-900/5",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                      issue.type === "error"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-amber-100 text-amber-600",
                    )}
                  >
                    {issue.type === "error" ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-bold text-sm",
                      issue.type === "error"
                        ? "text-rose-900"
                        : "text-amber-900",
                    )}
                  >
                    {issue.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-100">
                  <FileText className="w-3 h-3 text-stone-400" />
                  <span className="text-[10px] font-medium text-stone-500">
                    {issue.chapter} · {issue.line}줄
                  </span>
                </div>
              </div>

              <div className="text-sm space-y-2 mb-4">
                <p className="text-stone-800 leading-relaxed font-medium">
                  "{issue.description}"
                </p>
                <div className="flex items-start gap-2 bg-stone-50/80 p-2.5 rounded-lg text-xs border border-stone-100">
                  <ArrowRight className="w-3.5 h-3.5 text-mocha-400 shrink-0 mt-0.5" />
                  <p className="text-stone-600 leading-relaxed">
                    {issue.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 shadow-sm transition-all"
                >
                  <ArrowRight className="h-3 w-3 mr-1.5 text-stone-400" />
                  위치로 이동
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 px-0 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="무시하기"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Area */}
      <div className="p-4 pt-2">
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-stone-300 text-xs font-medium text-stone-500 hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50/50 transition-all group">
          <CheckCircle className="w-4 h-4 text-stone-300 group-hover:text-sage-500 transition-colors" />
          <span>통과된 항목 보기 (15개)</span>
        </button>
      </div>
    </div>
  );
}
