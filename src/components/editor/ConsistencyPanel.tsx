import { AlertTriangle, CheckCircle, RefreshCw, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConsistencyIssue {
  id: string;
  type: 'warning' | 'error';
  category: string;
  chapter: string;
  line: number;
  description: string;
  detail: string;
}

// Mock data
const mockIssues: ConsistencyIssue[] = [
  {
    id: '1',
    type: 'warning',
    category: '캐릭터 모순',
    chapter: '3장',
    line: 42,
    description: '"아린은 물을 무서워한다"고 설정했으나',
    detail: '"아린이 강에 뛰어들었다"',
  },
  {
    id: '2',
    type: 'error',
    category: '아이템 누락',
    chapter: '5장',
    line: 12,
    description: '"마법 지팡이"를 사용했으나',
    detail: '획득 기록이 없음',
  },
];

export default function ConsistencyPanel() {
  const warningCount = mockIssues.filter((i) => i.type === 'warning').length;
  const errorCount = mockIssues.filter((i) => i.type === 'error').length;

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          마지막 검사: 5분 전
        </div>
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
              'p-3 rounded-lg border',
              issue.type === 'error' ? 'border-status-error/30 bg-red-50' : 'border-status-warning/30 bg-amber-50'
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={cn(
                    'h-4 w-4',
                    issue.type === 'error' ? 'text-status-error' : 'text-status-warning'
                  )}
                />
                <span className="font-medium text-sm">{issue.category}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {issue.chapter} {issue.line}줄
              </span>
            </div>

            <div className="text-sm text-stone-700 space-y-1 mb-2">
              <p>{issue.description}</p>
              <p className="text-stone-500">→ {issue.detail}</p>
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
