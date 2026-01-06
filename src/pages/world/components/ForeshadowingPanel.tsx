import { useState } from "react";
import { Badge } from "@stolink/ui";
import { useForeshadowingStore } from "@/stores";
import type { Foreshadowing } from "@/types";
import {
  Sparkles,
  CheckCircle,
  MapPin,
  ArrowRight,
  Clock,
  BookMarked,
} from "lucide-react";
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
            intent="outline"
            className="bg-mocha-50 text-mocha-700 border-mocha-200"
          >
            미회수
          </Badge>
        );
      case "recovered":
        return (
          <Badge
            intent="outline"
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
      <Badge intent="outline" className="bg-red-50 text-red-700 border-red-200">
        중요
      </Badge>
    );
  };

  return (
    <div className="flex h-full bg-cloud-50 overflow-hidden editorial-fade-in">
      {/* 왼쪽 사이드 내비게이션 - Editorial Style */}
      <div className="w-56 border-r border-cloud-100 bg-cloud-50 flex flex-col p-4 gap-3 shrink-0">
        <div className="flex items-center gap-2 px-2 mb-2">
          <BookMarked className="h-4 w-4 text-primary" />
          <span className="editorial-label">복선 현황</span>
        </div>

        <button
          onClick={() => setActiveStatus("pending")}
          className={cn(
            "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border",
            activeStatus === "pending"
              ? "bg-mocha-500 text-white border-mocha-500 shadow-paper-floating"
              : "text-stone-500 border-transparent hover:bg-cloud-100",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                activeStatus === "pending" ? "bg-white/20" : "bg-primary/10",
              )}
            >
              <Clock
                className={cn(
                  "w-4 h-4",
                  activeStatus === "pending" ? "text-white" : "text-primary",
                )}
              />
            </div>
            <span>미회수</span>
          </div>
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full font-bold min-w-[28px] text-center",
              activeStatus === "pending"
                ? "bg-white/20 text-white"
                : "bg-primary/10 text-primary",
            )}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveStatus("recovered")}
          className={cn(
            "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border",
            activeStatus === "recovered"
              ? "bg-emerald-500 text-white border-emerald-500 shadow-paper-floating"
              : "text-stone-500 border-transparent hover:bg-cloud-100",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                activeStatus === "recovered" ? "bg-white/20" : "bg-emerald-50",
              )}
            >
              <CheckCircle
                className={cn(
                  "w-4 h-4",
                  activeStatus === "recovered"
                    ? "text-white"
                    : "text-emerald-500",
                )}
              />
            </div>
            <span>회수 완료</span>
          </div>
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full font-bold min-w-[28px] text-center",
              activeStatus === "recovered"
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-emerald-600",
            )}
          >
            {recoveredCount}
          </span>
        </button>

        <div className="mt-auto pt-4 border-t border-cloud-100">
          <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-3 px-2 font-bold">
            통계
          </div>
          <div className="p-3 bg-white border border-cloud-100 rounded-xl shadow-paper">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase">
              <span className="text-stone-400">총 복선</span>
              <span className="text-stone-900">{allForeshadowings.length}</span>
            </div>
            <div className="mt-3 h-1.5 bg-cloud-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-mocha-500 rounded-full transition-all"
                style={{
                  width: `${allForeshadowings.length > 0 ? (recoveredCount / allForeshadowings.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-8">
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
            {foreshadowings.map((fs, cardIdx) => (
              <div
                key={fs.id}
                className={cn(
                  "bg-white border border-cloud-200 rounded-2xl group relative overflow-hidden transition-all duration-300 hover:border-mocha-300 shadow-paper",
                  fs.importance === "major" && "ring-1 ring-red-100",
                )}
                style={{ animationDelay: `${cardIdx * 60}ms` }}
              >
                {/* Color Bar Indicator */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    fs.importance === "major"
                      ? "bg-rose-400"
                      : activeStatus === "pending"
                        ? "bg-primary"
                        : "bg-emerald-400",
                  )}
                />

                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          fs.importance === "major"
                            ? "bg-rose-50"
                            : activeStatus === "pending"
                              ? "bg-primary/10"
                              : "bg-emerald-50",
                        )}
                      >
                        <Sparkles
                          className={cn(
                            "w-5 h-5",
                            fs.importance === "major"
                              ? "text-rose-500"
                              : activeStatus === "pending"
                                ? "text-primary"
                                : "text-emerald-500",
                          )}
                        />
                      </div>
                      <h3 className="editorial-name text-base truncate">
                        #{fs.tag}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 shrink-0">
                      {getImportanceBadge(fs.importance)}
                      {getStatusBadge(fs.status)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 pb-5 space-y-4">
                  {fs.description && (
                    <div className="pull-quote py-3 px-4 text-sm">
                      "{fs.description}"
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="editorial-section-heading text-xs">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      연관 타임라인
                    </div>
                    <div className="space-y-2">
                      {fs.appearances.map((appearance, idx) => (
                        <button
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 w-full text-left p-3 rounded-xl border border-cloud-50 bg-cloud-50 hover:bg-mocha-50 hover:border-mocha-200 transition-all group/item shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                            appearance.isRecovery &&
                              "border-emerald-100 bg-emerald-50",
                          )}
                          style={{
                            animationDelay: `${cardIdx * 60 + idx * 40}ms`,
                          }}
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
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                              appearance.isRecovery
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-stone-100 text-stone-500 group-hover/item:bg-primary/10 group-hover/item:text-primary",
                            )}
                          >
                            {appearance.isRecovery ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-700 truncate group-hover/item:text-primary transition-colors">
                              {appearance.sectionTitle ||
                                appearance.chapterTitle ||
                                "알 수 없음"}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {appearance.isRecovery
                                ? "복선 회수 시점"
                                : "최초 등장"}
                            </p>
                          </div>
                          {appearance.documentId && onNavigateToSection && (
                            <ArrowRight className="w-4 h-4 text-stone-300 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
