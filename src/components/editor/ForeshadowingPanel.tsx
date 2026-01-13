import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Trash2,
  AlertCircle,
  MapPin,
  Edit2,
  Check,
  X,
  Users,
  Plus,
  Package,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useForeshadowingStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useParams } from "react-router-dom";
import { DEMO_CHARACTERS, DEMO_ITEMS } from "@/data/demoData";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ForeshadowingPanelProps {
  documentId?: string | null;
  sectionTitle?: string;
  /** 새로 생성된 복선 ID (포커스 이동용) */
  newForeshadowingId?: string | null;
  /** 위치 클릭 시 에디터 이동 콜백 */
  onNavigateToPosition?: (documentId: string) => void;
}

const ForeshadowingPanel = ({
  documentId,
  sectionTitle,
  newForeshadowingId,
  onNavigateToPosition,
}: ForeshadowingPanelProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const foreshadowings = useForeshadowingStore(
    useShallow((state) =>
      projectId
        ? Object.values(state.foreshadowings).filter(
            (fs) => fs.projectId === projectId && fs.status === "pending",
          )
        : [],
    ),
  );

  const { markAsRecovered, deleteForeshadowing, updateForeshadowing } =
    useForeshadowingStore(
      useShallow((state) => ({
        markAsRecovered: state.markAsRecovered,
        deleteForeshadowing: state.deleteForeshadowing,
        updateForeshadowing: state.updateForeshadowing,
      })),
    );

  // 제목 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // 연관 요소 편집 상태
  const [editingRelatedId, setEditingRelatedId] = useState<string | null>(null);
  const [relatedSearchQuery, setRelatedSearchQuery] = useState("");
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0);
  const relatedInputRef = useRef<HTMLInputElement>(null);

  // 새 복선 생성 시 해당 카드의 제목 Input에 자동 포커스
  useEffect(() => {
    if (newForeshadowingId) {
      // 약간의 딜레이 후 편집 모드 진입
      const timer = setTimeout(() => {
        const fs = foreshadowings.find((f) => f.id === newForeshadowingId);
        if (fs) {
          setEditingId(fs.id);
          setEditValue(fs.tag);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [newForeshadowingId, foreshadowings]);

  // 편집 모드 시 Input 포커스
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleRecover = (id: string, documentId?: string) => {
    const fs = foreshadowings.find((f) => f.id === id);
    const appearance = fs?.appearances.find((a) => !a.isRecovery);

    markAsRecovered(id, {
      documentId: documentId || appearance?.documentId || "unknown",
      sectionTitle: sectionTitle || appearance?.sectionTitle || "알 수 없음",
    });

    toast({
      title: "복선이 회수되었습니다",
      description: `"${fs?.tag}" 복선이 회수 완료 처리되었습니다.`,
      variant: "success",
    });
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const fs = foreshadowings.find((f) => f.id === deleteId);
      deleteForeshadowing(deleteId);
      toast({
        title: "복선이 삭제되었습니다",
        description: `"${fs?.tag}" 복선이 목록에서 삭제되었습니다.`,
        variant: "destructive",
      });
      setDeleteId(null);
    }
  };

  const handleStartEdit = (fs: { id: string; tag: string }) => {
    setEditingId(fs.id);
    setEditValue(fs.tag);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateForeshadowing(editingId, { tag: editValue.trim() });
      toast({
        title: "복선이 수정되었습니다",
        description: `태그 이름이 "${editValue.trim()}"(으)로 변경되었습니다.`,
        variant: "success",
      });
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  // 줄 번호와 노드 위치 정보는 더 이상 사용하지 않으므로 handleLocationClick 제거
  // onNavigateToPosition을 콜백으로 직접 사용함

  // 연관 캐릭터/아이템 이름 조회
  const getRelatedNames = (relatedIds?: string[]) => {
    if (!relatedIds || relatedIds.length === 0) return null;

    const names = relatedIds
      .map((id) => {
        const char = DEMO_CHARACTERS.find((c) => c._id === id);
        if (char)
          return {
            id,
            name: char.profile?.name || "Unknown",
            type: "character" as const,
          };
        const item = DEMO_ITEMS.find((i) => i.id === id);
        if (item) return { id, name: item.name, type: "item" as const };
        return null;
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      type: "character" | "item";
    }[];

    return names.length > 0 ? names : null;
  };

  // 연관 요소 검색 결과
  const getFilteredRelatedOptions = (currentIds: string[] = []) => {
    // @나 #으로 시작하는 경우 해당 문자 제거 후 검색
    const query = relatedSearchQuery.toLowerCase().replace(/^[@#]/, "");

    if (
      !query &&
      !relatedSearchQuery.startsWith("@") &&
      !relatedSearchQuery.startsWith("#")
    ) {
      return [];
    }

    const characters = DEMO_CHARACTERS.filter(
      (c) =>
        !currentIds.includes(c._id) &&
        (c.profile?.name || "").toLowerCase().includes(query),
    ).map((c) => ({
      id: c._id,
      name: c.profile?.name || "Unknown",
      type: "character" as const,
    }));
    const items = DEMO_ITEMS.filter(
      (i) => !currentIds.includes(i.id) && i.name.toLowerCase().includes(query),
    ).map((i) => ({ id: i.id, name: i.name, type: "item" as const }));
    return [...characters, ...items].slice(0, 5);
  };

  // 연관 요소 추가
  const handleAddRelated = (fsId: string, relatedId: string) => {
    const fs = foreshadowings.find((f) => f.id === fsId);
    if (fs) {
      const newIds = [...(fs.relatedCharacterIds || []), relatedId];
      updateForeshadowing(fsId, { relatedCharacterIds: newIds });
    }
    setRelatedSearchQuery("");
    setEditingRelatedId(null);
  };

  // 연관 요소 제거
  const handleRemoveRelated = (fsId: string, relatedId: string) => {
    const fs = foreshadowings.find((f) => f.id === fsId);
    if (fs) {
      const newIds = (fs.relatedCharacterIds || []).filter(
        (id) => id !== relatedId,
      );
      updateForeshadowing(fsId, { relatedCharacterIds: newIds });
    }
  };

  if (foreshadowings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground p-6 text-center">
        {/* Empty State Illustration - Sage Theme */}
        <div className="w-20 h-20 mb-6 bg-sage-50 rounded-full flex items-center justify-center relative">
          <Sparkles className="w-8 h-8 text-sage-300" />
          <div className="absolute top-1 right-2 w-2 h-2 bg-sage-400 rounded-full animate-ping" />
        </div>
        <h3 className="text-sm font-bold text-sage-900 mb-1">
          미회수 복선이 없습니다
        </h3>
        <p className="text-xs text-sage-600 leading-relaxed max-w-[200px]">
          에디터에서 텍스트를 드래그하거나
          <br /># 태그를 입력해 복선을 기록해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cloud-50/50">
      {/* 헤더 */}
      <div className="p-4 border-b border-sage-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sage-100 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-sage-600" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-sage-900">미회수 복선</h2>
            <span className="text-[10px] text-sage-500 font-medium tracking-wide uppercase">
              Pending Foreshadowings ({foreshadowings.length})
            </span>
          </div>
        </div>
      </div>

      {/* 복선 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-sage-200">
        <AnimatePresence>
          {foreshadowings.map((fs) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={fs.id}
              className={cn(
                "group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300",
                "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r-full before:transition-all",
                fs.importance === "major"
                  ? "border-amber-100/60 shadow-amber-900/5 hover:border-amber-200 before:bg-amber-400"
                  : "border-sage-100/60 shadow-sage-900/5 hover:border-sage-200 before:bg-sage-300",
                newForeshadowingId === fs.id &&
                  "ring-2 ring-sage-400 ring-offset-2 ring-offset-cloud-50",
              )}
            >
              {/* 헤더: 제목 편집 + 삭제 버튼 */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* 복선 아이콘 - 세이지 그린 테마 */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm",
                      fs.importance === "major"
                        ? "bg-gradient-to-br from-amber-50 to-amber-100"
                        : "bg-gradient-to-br from-sage-50 to-sage-100",
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "w-4 h-4",
                        fs.importance === "major"
                          ? "text-amber-600"
                          : "text-sage-600",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === fs.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="h-8 text-sm font-bold bg-white border-sage-200 focus:ring-sage-400"
                          placeholder="복선 제목"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 hover:bg-sage-100"
                          onClick={handleSaveEdit}
                        >
                          <Check className="w-3.5 h-3.5 text-sage-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 hover:bg-rose-50"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 group/title">
                          <h4
                            className="text-sm font-bold text-st-espresso-900 truncate cursor-pointer hover:text-sage-700 hover:underline decoration-sage-300 underline-offset-4 decoration-2"
                            onClick={() => handleStartEdit(fs)}
                            title="클릭하여 제목 편집"
                          >
                            #{fs.tag}
                          </h4>
                          <button
                            onClick={() => handleStartEdit(fs)}
                            className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 rounded hover:bg-sage-100"
                          >
                            <Edit2 className="w-3 h-3 text-sage-400" />
                          </button>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] self-start px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wider",
                            fs.importance === "major"
                              ? "bg-amber-100/80 text-amber-700"
                              : "bg-sage-100/80 text-sage-700",
                          )}
                        >
                          {fs.importance === "major" ? "Major" : "Minor"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 -mt-1 -mr-1 text-mocha-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(fs.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* 요약 (드래그한 텍스트) */}
              {fs.description && (
                <div className="relative mb-4 group/desc">
                  <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-cloud-200 scrollbar-track-transparent pr-1">
                    <p className="text-[13px] text-mocha-600 leading-relaxed italic bg-cloud-50/50 p-3 rounded-xl border border-cloud-100/80 shadow-inner group-hover/desc:bg-cloud-50 transition-colors">
                      "{fs.description}"
                    </p>
                  </div>
                </div>
              )}

              {/* 연관 요소 (인물/아이템) */}
              <div className="mb-4">
                {(() => {
                  const relatedItems = getRelatedNames(fs.relatedCharacterIds);
                  return (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-mocha-400 uppercase tracking-wider mr-1">
                        Related
                      </span>
                      {relatedItems && relatedItems.length > 0 && (
                        <>
                          {relatedItems.map((item) => (
                            <span
                              key={item.id}
                              className={cn(
                                "inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-semibold transition-all shadow-sm hover:shadow-md",
                                item.type === "character"
                                  ? "bg-white border border-indigo-100 text-indigo-700 hover:border-indigo-200"
                                  : "bg-white border border-amber-100 text-amber-700 hover:border-amber-200",
                              )}
                            >
                              {item.type === "character" ? (
                                <Users className="w-2.5 h-2.5 opacity-70" />
                              ) : (
                                <Package className="w-2.5 h-2.5 opacity-70" />
                              )}
                              {item.name}
                              <button
                                onClick={() =>
                                  handleRemoveRelated(fs.id, item.id)
                                }
                                className="ml-1 hover:bg-cloud-100 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </span>
                          ))}
                        </>
                      )}

                      {/* 연관 요소 추가 UI */}
                      {editingRelatedId === fs.id ? (
                        <div className="relative ml-1">
                          <Input
                            ref={relatedInputRef}
                            value={relatedSearchQuery}
                            onChange={(e) => {
                              setRelatedSearchQuery(e.target.value);
                              setFocusedOptionIndex(0);
                            }}
                            onKeyDown={(e) => {
                              const options = getFilteredRelatedOptions(
                                fs.relatedCharacterIds,
                              );
                              if (options.length === 0) return;

                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setFocusedOptionIndex(
                                  (prev) => (prev + 1) % options.length,
                                );
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setFocusedOptionIndex(
                                  (prev) =>
                                    (prev - 1 + options.length) %
                                    options.length,
                                );
                              } else if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddRelated(
                                  fs.id,
                                  options[focusedOptionIndex].id,
                                );
                              } else if (e.key === "Escape") {
                                setEditingRelatedId(null);
                                setRelatedSearchQuery("");
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setEditingRelatedId(null);
                                setRelatedSearchQuery("");
                              }, 200);
                            }}
                            placeholder="검색..."
                            className="h-6 w-32 text-xs bg-white border-sage-200 focus:ring-sage-400"
                            autoFocus
                          />
                          {relatedSearchQuery && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-cloud-100 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto p-1">
                              {getFilteredRelatedOptions(
                                fs.relatedCharacterIds,
                              ).map((option, index) => (
                                <button
                                  key={option.id}
                                  className={cn(
                                    "w-full px-2 py-1.5 text-left text-xs flex items-center gap-2 rounded-md transition-colors",
                                    focusedOptionIndex === index
                                      ? "bg-sage-50 text-sage-900"
                                      : "text-mocha-600 hover:bg-cloud-50",
                                  )}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() =>
                                    handleAddRelated(fs.id, option.id)
                                  }
                                >
                                  {option.type === "character" ? (
                                    <Users
                                      className={cn(
                                        "w-3 h-3",
                                        focusedOptionIndex === index
                                          ? "text-sage-500"
                                          : "text-mocha-400",
                                      )}
                                    />
                                  ) : (
                                    <Package
                                      className={cn(
                                        "w-3 h-3",
                                        focusedOptionIndex === index
                                          ? "text-sage-500"
                                          : "text-mocha-400",
                                      )}
                                    />
                                  )}
                                  <span className="flex-1 truncate font-medium">
                                    {option.name}
                                  </span>
                                </button>
                              ))}
                              {getFilteredRelatedOptions(fs.relatedCharacterIds)
                                .length === 0 && (
                                <div className="px-2 py-1.5 text-xs text-mocha-400 text-center">
                                  결과 없음
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRelatedId(fs.id);
                            setRelatedSearchQuery("");
                            setFocusedOptionIndex(0);
                          }}
                          className="flex items-center justify-center w-5 h-5 rounded-full border border-dashed border-cloud-300 text-mocha-400 hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all ml-1"
                          title="연관 요소 추가"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 위치 정보 (클릭 시 섹션 이동) */}
              <div className="border-t border-cloud-100 pt-3 flex items-center justify-between gap-2">
                {fs.appearances.length > 0 &&
                fs.appearances[0].sectionTitle &&
                fs.appearances[0].sectionTitle !== "알 수 없음" &&
                fs.appearances[0].documentId ? (
                  <button
                    className="flex-1 flex items-center gap-1.5 text-[10px] text-mocha-500 hover:text-sage-600 hover:bg-sage-50 px-2 py-1.5 rounded-lg transition-colors group/loc"
                    onClick={() =>
                      onNavigateToPosition?.(fs.appearances[0].documentId!)
                    }
                    title="해당 섹션으로 이동"
                  >
                    <MapPin className="w-3 h-3 shrink-0 text-mocha-300 group-hover/loc:text-sage-400 transition-colors" />
                    <span className="truncate max-w-[120px] font-medium">
                      {fs.appearances[0].sectionTitle}
                    </span>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}

                {/* 회수 버튼 */}
                <Button
                  size="sm"
                  className={cn(
                    "h-7 text-[10px] font-bold px-3 transition-all shadow-sm",
                    "bg-white border text-sage-600 hover:text-sage-700",
                    "border-sage-200 hover:border-sage-300 hover:bg-sage-50",
                    "group/btn",
                  )}
                  onClick={() =>
                    handleRecover(
                      fs.id,
                      documentId || fs.appearances[0]?.documentId,
                    )
                  }
                >
                  <span className="mr-1.5 w-3 h-3 rounded-full border border-sage-300 flex items-center justify-center group-hover/btn:border-sage-400 group-hover/btn:bg-sage-200 transition-colors">
                    <Check className="w-2 h-2 text-transparent group-hover/btn:text-sage-600" />
                  </span>
                  회수 완료
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>복선을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 복선 데이터는 복구할 수 없습니다. 정말 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForeshadowingPanel;
