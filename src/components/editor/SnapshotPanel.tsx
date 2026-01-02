import { useState } from "react";
import {
  History,
  Plus,
  Trash2,
  RotateCcw,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { useDocumentSnapshots } from "@/stores/useSnapshotStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SnapshotPanelProps {
  documentId: string | null;
  currentContent: string;
  documentTitle: string;
  onRestore: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 스냅샷 패널 - 문서 버전 관리 UI
 *
 * 기능:
 * - 현재 상태 스냅샷 저장
 * - 스냅샷 목록 표시
 * - 스냅샷 복원 (현재 내용을 스냅샷 내용으로 대체)
 * - 스냅샷 삭제
 */
export default function SnapshotPanel({
  documentId,
  currentContent,
  documentTitle,
  onRestore,
  isOpen,
  onClose,
}: SnapshotPanelProps) {
  const { snapshots, createSnapshot, deleteSnapshot, restoreSnapshot } =
    useDocumentSnapshots(documentId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDesc, setNewSnapshotDesc] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) return;

    createSnapshot(
      newSnapshotName.trim(),
      currentContent,
      newSnapshotDesc.trim() || undefined
    );

    setNewSnapshotName("");
    setNewSnapshotDesc("");
    setShowCreateDialog(false);
  };

  const handleRestore = (snapshotId: string) => {
    const snapshot = restoreSnapshot(snapshotId);
    if (snapshot) {
      onRestore(snapshot.content);
      setConfirmRestoreId(null);
      onClose();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 메인 패널 */}
      <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-lg z-50 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">스냅샷</h2>
            <span className="text-xs text-muted-foreground">
              ({snapshots.length})
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateDialog(true)}
              disabled={!documentId}
              className="h-7"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              저장
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 현재 문서 정보 */}
        {documentId && (
          <div className="px-4 py-2 bg-muted/50 border-b border-border">
            <p className="text-xs text-muted-foreground">현재 문서</p>
            <p className="text-sm font-medium text-foreground truncate">
              {documentTitle || "제목 없음"}
            </p>
          </div>
        )}

        {/* 스냅샷 목록 */}
        <div className="flex-1 overflow-y-auto">
          {!documentId ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              문서를 선택하세요
            </div>
          ) : snapshots.length === 0 ? (
            <div className="p-6 text-center">
              <History className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                저장된 스냅샷이 없습니다
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                "저장" 버튼으로 현재 상태를 기록하세요
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[...snapshots].reverse().map((snapshot) => (
                <div key={snapshot.id} className="group">
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === snapshot.id ? null : snapshot.id
                      )
                    }
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {expandedId === snapshot.id ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {snapshot.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(snapshot.createdAt)}
                      </p>
                    </div>
                  </button>

                  {/* 확장 콘텐츠 */}
                  {expandedId === snapshot.id && (
                    <div className="px-4 py-3 bg-muted/50 border-t border-border">
                      {snapshot.description && (
                        <p className="text-xs text-foreground mb-3">
                          {snapshot.description}
                        </p>
                      )}

                      {/* 미리보기 */}
                      <div className="bg-card border border-border rounded-lg p-2 mb-3">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          미리보기
                        </p>
                        <p className="text-xs text-foreground line-clamp-3">
                          {snapshot.content
                            .replace(/<[^>]*>/g, "")
                            .slice(0, 200) || "(빈 문서)"}
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmRestoreId(snapshot.id)}
                          className="flex-1 h-8 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          복원
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSnapshot(snapshot.id)}
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            💡 스냅샷은 문서당 최대 10개 저장됩니다
          </p>
        </div>
      </div>

      {/* 스냅샷 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>스냅샷 저장</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                스냅샷 이름 *
              </label>
              <input
                type="text"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                placeholder="예: 1차 수정 전"
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mocha-500/20 focus:border-mocha-400"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                설명 (선택)
              </label>
              <textarea
                value={newSnapshotDesc}
                onChange={(e) => setNewSnapshotDesc(e.target.value)}
                placeholder="이 스냅샷에 대한 메모..."
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mocha-500/20 focus:border-mocha-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateSnapshot}
              disabled={!newSnapshotName.trim()}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 복원 확인 다이얼로그 */}
      <Dialog
        open={!!confirmRestoreId}
        onOpenChange={() => setConfirmRestoreId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>스냅샷 복원</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground py-4">
            현재 작성 중인 내용이 스냅샷 내용으로 대체됩니다.
            <br />
            계속하시겠습니까?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestoreId(null)}>
              취소
            </Button>
            <Button
              onClick={() =>
                confirmRestoreId && handleRestore(confirmRestoreId)
              }
            >
              복원
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
