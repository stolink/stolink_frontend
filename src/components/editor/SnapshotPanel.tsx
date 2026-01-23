import { useState } from "react";
import {
  History,
  Plus,
  Trash2,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
  GitCommit,
  Calendar,
} from "lucide-react";
import { useDocumentSnapshots } from "@/stores/useSnapshotStore";
import { Button } from "@stolink/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { motion, AnimatePresence } from "framer-motion";

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
 * 타임라인 스타일의 UI로 변경하여 이력을 더 직관적으로 보여줍니다.
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
      newSnapshotDesc.trim() || undefined,
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 메인 패널 - 슬라이드 오버 효과 */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 w-[400px] bg-white border-l border-cloud-200 shadow-2xl z-50 flex flex-col"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cloud-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cloud-100 rounded-lg text-espresso-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-espresso-900">
                히스토리
              </h2>
              <p className="text-xs text-espresso-400 font-medium">
                History & Snapshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cloud-50 rounded-full transition-colors text-espresso-400 hover:text-espresso-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 현재 문서 정보 & 저장 버튼 */}
        <div className="px-6 py-4 bg-cloud-50 border-b border-cloud-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-bold text-espresso-400 uppercase tracking-wider mb-0.5">
              CURRENT DOCUMENT
            </p>
            <p className="text-sm font-bold text-espresso-800 truncate max-w-[200px]">
              {documentTitle || "제목 없음"}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            disabled={!documentId}
            className="h-8 bg-mocha-600 hover:bg-mocha-700 text-white shadow-sm font-medium text-xs px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            스냅샷 저장
          </Button>
        </div>

        {/* 타임라인 목록 */}
        <div className="flex-1 overflow-y-auto bg-cloud-50/30 p-6">
          {!documentId ? (
            <div className="flex flex-col items-center justify-center h-40 text-espresso-400 text-sm">
              <FileText className="w-8 h-8 mb-2 opacity-20" />
              문서를 선택하세요
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 bg-cloud-100 rounded-full flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-espresso-300" />
              </div>
              <h3 className="text-sm font-bold text-espresso-600 mb-1">
                저장된 스냅샷이 없습니다
              </h3>
              <p className="text-xs text-espresso-500 max-w-[200px] leading-relaxed">
                작업 중간중간 중요한 순간을 기록해두세요. 언제든지 과거로 돌아갈
                수 있습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                첫 스냅샷 만들기
              </Button>
            </div>
          ) : (
            <div className="relative pl-4 space-y-6">
              {/* 타임라인 수직선 - Absolute Positioned Line */}
              <div className="absolute left-[23px] top-2 bottom-0 w-px bg-cloud-200" />

              <AnimatePresence>
                {[...snapshots].reverse().map((snapshot) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={snapshot.id}
                    className="relative pl-8"
                  >
                    {/* 타임라인 노드 */}
                    <div className="absolute left-[19px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-mocha-400 z-10 shadow-[0_0_0_4px_rgba(255,255,255,1)]" />

                    <div
                      className="group bg-white border border-cloud-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-mocha-300 transition-all cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === snapshot.id ? null : snapshot.id,
                        )
                      }
                    >
                      {/* 헤더 정보 */}
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="text-sm font-bold text-espresso-800 flex items-center gap-2">
                            {snapshot.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center text-[11px] text-espresso-400 font-medium bg-cloud-50 px-1.5 py-0.5 rounded-md">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(snapshot.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button className="text-espresso-300 hover:text-espresso-500 p-0.5 rounded transition-colors group-hover:bg-cloud-50">
                          {expandedId === snapshot.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {snapshot.description && (
                        <p className="text-xs text-espresso-500 mt-2 line-clamp-2 border-t border-cloud-50 pt-2">
                          {snapshot.description}
                        </p>
                      )}

                      {/* 확장 패널 */}
                      <AnimatePresence>
                        {expandedId === snapshot.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 bg-cloud-50 rounded-lg p-3 border border-cloud-100 text-xs text-espresso-600 font-serif leading-relaxed line-clamp-4 italic mb-3">
                              "
                              {snapshot.content
                                .replace(/<[^>]*>/g, "")
                                .slice(0, 150) || "내용 없음"}
                              ..."
                            </div>

                            <div className="flex gap-2 border-t border-cloud-100 pt-3">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmRestoreId(snapshot.id);
                                }}
                                className="flex-1 h-8 text-xs bg-white border border-cloud-200 hover:border-mocha-300 hover:text-mocha-700 text-espresso-600 shadow-sm"
                              >
                                <RotateCcw className="w-3 h-3 mr-1.5" />이
                                버전으로 복원
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSnapshot(snapshot.id);
                                }}
                                className="h-8 w-8 p-0 text-espresso-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* 스냅샷 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 overflow-hidden shadow-2xl rounded-xl">
          <DialogHeader className="px-6 py-4 border-b border-cloud-100 bg-cloud-50/50">
            <DialogTitle className="text-base font-bold text-espresso-800 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-mocha-500" />
              현재 상태 스냅샷 저장
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-espresso-500 uppercase tracking-wider mb-1.5 block">
                스냅샷 이름 *
              </label>
              <input
                type="text"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                placeholder="예: 챕터1 완성본, 수정 전 백업..."
                className="w-full px-3 py-2 border border-cloud-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mocha-500/20 focus:border-mocha-400 transition-all font-medium text-espresso-800 placeholder:text-espresso-300"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-espresso-500 uppercase tracking-wider mb-1.5 block">
                메모 (선택)
              </label>
              <textarea
                value={newSnapshotDesc}
                onChange={(e) => setNewSnapshotDesc(e.target.value)}
                placeholder="주요 변경 사항이나 남기고 싶은 말을 적어주세요."
                rows={3}
                className="w-full px-3 py-2 border border-cloud-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mocha-500/20 focus:border-mocha-400 transition-all text-espresso-700 placeholder:text-espresso-300"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-cloud-100 bg-cloud-50/30">
            <Button
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
              className="text-espresso-500 hover:text-espresso-800"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateSnapshot}
              disabled={!newSnapshotName.trim()}
              className="bg-mocha-600 hover:bg-mocha-700 text-white shadow-md font-medium"
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 복원 확인 다이얼로그 */}
      <Dialog
        open={!!confirmRestoreId}
        onOpenChange={() => setConfirmRestoreId(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-xl border-none shadow-2xl p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-espresso-900 mb-2">
                스냅샷을 복원하시겠습니까?
              </h3>
              <p className="text-sm text-espresso-500 leading-relaxed">
                현재 작성 중인 내용이 덮어씌워지며, <br />이 작업은 되돌릴 수
                없습니다.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmRestoreId(null)}
              className="flex-1 h-11 border-cloud-200"
            >
              취소
            </Button>
            <Button
              onClick={() =>
                confirmRestoreId && handleRestore(confirmRestoreId)
              }
              className="flex-1 h-11 bg-espresso-900 hover:bg-black text-white"
            >
              복원하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
