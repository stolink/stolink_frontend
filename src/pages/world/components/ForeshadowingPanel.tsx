import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForeshadowingStore } from "@/stores";
import type { Foreshadowing } from "@/types";
import { Sparkles, CheckCircle, MapPin, ArrowRight } from "lucide-react";

interface ForeshadowingPanelProps {
  projectId: string;
  /** 복선 위치로 이동하는 콜백 (에디터 페이지로 라우팅) */
  onNavigateToSection?: (documentId: string, sectionTitle: string) => void;
}

export function ForeshadowingPanel({ projectId, onNavigateToSection }: ForeshadowingPanelProps) {
  const { getByStatus } = useForeshadowingStore();
  const foreshadowings = getByStatus(projectId, "recovered");
  const isLoading = false; // Store is local/persisted


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">복선 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (foreshadowings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">
          회수된 복선이 없습니다
        </h3>
        <p className="text-stone-500 max-w-md text-sm">
          에디터에서 미회수 복선을 회수 처리하면
          <br /> 이곳에서 상세한 회수 내역을 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: Foreshadowing['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">미회수</Badge>;
      case 'recovered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">회수 완료</Badge>;
      case 'ignored':
        return <Badge variant="outline" className="bg-stone-100 text-stone-600 border-stone-200">무시</Badge>;
      default:
        return null;
    }
  };

  const getImportanceBadge = (importance?: Foreshadowing['importance']) => {
    if (!importance || importance !== 'major') return null;
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">중요</Badge>
    );
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foreshadowings.map((foreshadowing) => (
          <Card key={foreshadowing.id} className="bg-[#FAF9F6] border border-stone-200/60 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sage-600" />
                  {foreshadowing.tag}
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {getStatusBadge(foreshadowing.status)}
                  {getImportanceBadge(foreshadowing.importance)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {foreshadowing.description && (
                <p className="text-sm text-stone-600">{foreshadowing.description}</p>
              )}

              {/* 등장 위치 (클릭 시 해당 섹션으로 이동) */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-stone-500">등장 위치</p>
                <div className="space-y-1.5">
                  {foreshadowing.appearances.slice(0, 3).map((appearance, idx) => (
                    <button
                      key={idx}
                      className="flex items-center gap-2 w-full text-left p-2.5 rounded-lg border border-stone-200 bg-white hover:bg-sage-50 hover:border-sage-300 transition-colors group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (appearance.documentId && onNavigateToSection) {
                          onNavigateToSection(
                            appearance.documentId,
                            appearance.sectionTitle || appearance.chapterTitle || "알 수 없음"
                          );
                        }
                      }}
                      title={appearance.documentId ? "클릭하여 해당 섹션으로 이동" : "문서 ID가 없어 이동할 수 없습니다"}
                      disabled={!appearance.documentId || !onNavigateToSection}
                    >
                      <MapPin className="w-3.5 h-3.5 text-sage-500 group-hover:text-sage-600 shrink-0" />
                      <span className="text-xs font-medium text-stone-700 flex-1 truncate group-hover:text-sage-700">
                        {appearance.sectionTitle || appearance.chapterTitle || "알 수 없음"}
                      </span>
                      {appearance.isRecovery && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-sage-50 text-sage-700 border-sage-200">
                          회수
                        </Badge>
                      )}
                      {appearance.documentId && onNavigateToSection && (
                        <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-sage-500 shrink-0" />
                      )}
                    </button>
                  ))}
                  {foreshadowing.appearances.length > 3 && (
                    <p className="text-xs text-stone-400 text-center pt-1">
                      +{foreshadowing.appearances.length - 3}개 더보기
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
