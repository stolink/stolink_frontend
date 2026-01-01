import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForeshadowingStore } from "@/stores";
import type { Foreshadowing } from "@/types";
import { Sparkles, CheckCircle, MapPin, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyIndicator } from "./EmptyIndicator";

interface ForeshadowingPanelProps {
  projectId: string;
  /** 복선 위치로 이동하는 콜백 (에디터 페이지로 라우팅) */
  onNavigateToSection?: (documentId: string, sectionTitle: string) => void;
}

export function ForeshadowingPanel({
  projectId,
  onNavigateToSection,
}: ForeshadowingPanelProps) {
  const { getByStatus, getByProject } = useForeshadowingStore();
  const [activeStatus, setActiveStatus] =
    useState<Foreshadowing["status"]>("pending");

  const foreshadowings = getByStatus(projectId, activeStatus);
  const allForeshadowings = getByProject(projectId);

  const pendingCount = allForeshadowings.filter(
    (f) => f.status === "pending",
  ).length;
  const recoveredCount = allForeshadowings.filter(
    (f) => f.status === "recovered",
  ).length;

  const isLoading = false; // Store is local/persisted

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            복선 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Foreshadowing["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-mocha-50 text-mocha-700 border-mocha-200"
          >
            미회수
          </Badge>
        );
      case "recovered":
        return (
          <Badge
            variant="outline"
            className="bg-sage-50 text-sage-700 border-sage-200"
          >
            회수 완료
          </Badge>
        );
      default:
        return null;
    }
  };

  const getImportanceBadge = (importance?: Foreshadowing["importance"]) => {
    if (!importance || importance !== "major") return null;
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        중요
      </Badge>
    );
  };

  return (
    <div className="flex h-full bg-stone-50/30 overflow-hidden">
      {/* 왼쪽 사이드 내비게이션 */}
      <div className="w-48 border-r bg-white/50 flex flex-col p-3 gap-2 shrink-0">
        <button
          onClick={() => setActiveStatus("pending")}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeStatus === "pending"
              ? "bg-mocha-500 text-white shadow-md shadow-mocha-900/10"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
          )}
        >
          <div className="flex items-center gap-2">
            <Clock
              className={cn(
                "w-4 h-4",
                activeStatus === "pending" ? "text-white" : "text-mocha-500",
              )}
            />
            <span>미회수 복선</span>
          </div>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeStatus === "pending"
                ? "bg-white/20 text-white"
                : "bg-mocha-50 text-mocha-600",
            )}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveStatus("recovered")}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeStatus === "recovered"
              ? "bg-sage-500 text-white shadow-md shadow-sage-900/10"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
              className={cn(
                "w-4 h-4",
                activeStatus === "recovered" ? "text-white" : "text-sage-500",
              )}
            />
            <span>회수 완료</span>
          </div>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeStatus === "recovered"
                ? "bg-white/20 text-white"
                : "bg-sage-50 text-sage-600",
            )}
          >
            {recoveredCount}
          </span>
        </button>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-6">
        {foreshadowings.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyIndicator
              icon={activeStatus === "pending" ? Sparkles : CheckCircle}
              title={
                activeStatus === "pending"
                  ? "미회수 복선이 없습니다"
                  : "회수 완료된 복선이 없습니다"
              }
              description={
                activeStatus === "pending"
                  ? "에디터에서 # 태그를 입력해 새로운 복선을 기록해보세요."
                  : "미회수 복선을 회수 처리하면 이곳에서 상세한 회수 내역을 확인할 수 있습니다."
              }
              className="w-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-start">
            {foreshadowings.map((fs) => (
              <Card
                key={fs.id}
                className={cn(
                  "group relative overflow-hidden bg-white border-stone-200/80 transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]",
                  "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r-full before:transition-all",
                  fs.importance === "major"
                    ? "before:bg-red-400 border-red-100/50 shadow-red-900/5"
                    : activeStatus === "pending"
                      ? "before:bg-mocha-400 border-stone-200/60 shadow-stone-900/5"
                      : "before:bg-sage-400 border-stone-200/60 shadow-stone-900/5",
                )}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold text-stone-800 flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          fs.importance === "major"
                            ? "bg-red-50"
                            : activeStatus === "pending"
                              ? "bg-mocha-50"
                              : "bg-sage-50",
                        )}
                      >
                        <Sparkles
                          className={cn(
                            "w-4 h-4",
                            fs.importance === "major"
                              ? "text-red-500"
                              : activeStatus === "pending"
                                ? "text-mocha-500"
                                : "text-sage-600",
                          )}
                        />
                      </div>
                      <span className="truncate">#{fs.tag}</span>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1 shrink-0">
                      {getImportanceBadge(fs.importance)}
                      {getStatusBadge(fs.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  {fs.description && (
                    <div className="bg-stone-50/80 p-3 rounded-lg border border-stone-100 italic">
                      <p className="text-[13px] text-stone-600 leading-relaxed">
                        "{fs.description}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> 연관 타임라인
                    </p>
                    <div className="space-y-2">
                      {fs.appearances.map((appearance, idx) => (
                        <button
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 w-full text-left p-3 rounded-xl border border-stone-200 bg-white hover:bg-sage-50 hover:border-sage-300 transition-all group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                            appearance.isRecovery &&
                              "border-sage-200 bg-sage-50/30",
                          )}
                          onClick={() => {
                            if (appearance.documentId && onNavigateToSection) {
                              onNavigateToSection(
                                appearance.documentId,
                                appearance.sectionTitle ||
                                  appearance.chapterTitle ||
                                  "알 수 없음",
                              );
                            }
                          }}
                          disabled={
                            !appearance.documentId || !onNavigateToSection
                          }
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                              appearance.isRecovery
                                ? "bg-sage-100 text-sage-600"
                                : "bg-stone-100 text-stone-500 group-hover:bg-white group-hover:text-sage-600",
                            )}
                          >
                            {appearance.isRecovery ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-700 truncate group-hover:text-sage-700">
                              {appearance.sectionTitle ||
                                appearance.chapterTitle ||
                                "알 수 없음"}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {appearance.isRecovery
                                ? "복선 회수가 이루어진 시점"
                                : "복선이 처음 등장한 시점"}
                            </p>
                          </div>
                          {appearance.documentId && onNavigateToSection && (
                            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-sage-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
