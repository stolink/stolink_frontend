import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForeshadowing } from "@/hooks/useForeshadowing";
import type { Foreshadowing } from "@/types/foreshadowing";
import { Sparkles } from "lucide-react";

interface ForeshadowingPanelProps {
  projectId: string;
}

export function ForeshadowingPanel({ projectId }: ForeshadowingPanelProps) {
  const { data: foreshadowings = [], isLoading } = useForeshadowing(projectId);

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
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">
          복선이 없습니다
        </h3>
        <p className="text-stone-500 max-w-md">
          에디터에서 <code className="bg-stone-100 px-2 py-1 rounded">#복선:태그명</code> 형식으로
          복선을 작성하면 자동으로 추적됩니다.
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
    if (!importance) return null;
    return importance === 'major' ? (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">주요</Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">부가</Badge>
    );
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foreshadowings.map((foreshadowing) => (
          <Card key={foreshadowing.id} className="hover:shadow-lg transition-shadow">
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

              <div className="space-y-2">
                <p className="text-xs font-medium text-stone-500">등장 위치</p>
                <div className="space-y-1.5">
                  {foreshadowing.appearances.slice(0, 3).map((appearance, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-stone-50 p-2 rounded border border-stone-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-stone-700">
                          {appearance.chapterTitle}
                        </span>
                        {appearance.isRecovery && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200">
                            회수
                          </Badge>
                        )}
                      </div>
                      <p className="text-stone-500 line-clamp-2">{appearance.context}</p>
                    </div>
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
