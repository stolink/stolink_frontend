import { useEffect, useRef, useState } from "react";
import {
    Sparkles,
    Trash2,
    AlertCircle,
    CheckCircle,
    MapPin,
    Edit2,
    Check,
    X,
    Users,
    Plus,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useForeshadowingStore } from "@/stores";
import { useParams } from "react-router-dom";
import { DEMO_CHARACTERS, DEMO_ITEMS } from "@/data/demoData";

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
    const {
        getUnresolved,
        markAsRecovered,
        deleteForeshadowing,
        updateForeshadowing,
    } = useForeshadowingStore();

    const foreshadowings = projectId ? getUnresolved(projectId) : [];

    // 제목 편집 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
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
    };

    const handleDelete = (id: string) => {
        if (window.confirm("이 복선을 삭제하시겠습니까?")) {
            deleteForeshadowing(id);
        }
    };

    const handleStartEdit = (fs: { id: string; tag: string }) => {
        setEditingId(fs.id);
        setEditValue(fs.tag);
    };

    const handleSaveEdit = () => {
        if (editingId && editValue.trim()) {
            updateForeshadowing(editingId, { tag: editValue.trim() });
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
                const char = DEMO_CHARACTERS.find((c) => c.id === id);
                if (char) return { id, name: char.name, type: "character" as const };
                const item = DEMO_ITEMS.find((i) => i.id === id);
                if (item) return { id, name: item.name, type: "item" as const };
                return null;
            })
            .filter(Boolean) as { id: string; name: string; type: "character" | "item" }[];

        return names.length > 0 ? names : null;
    };

    // 연관 요소 검색 결과
    const getFilteredRelatedOptions = (currentIds: string[] = []) => {
        const query = relatedSearchQuery.toLowerCase();
        const characters = DEMO_CHARACTERS
            .filter((c) => !currentIds.includes(c.id) && c.name.toLowerCase().includes(query))
            .map((c) => ({ id: c.id, name: c.name, type: "character" as const }));
        const items = DEMO_ITEMS
            .filter((i) => !currentIds.includes(i.id) && i.name.toLowerCase().includes(query))
            .map((i) => ({ id: i.id, name: i.name, type: "item" as const }));
        return [...characters, ...items].slice(0, 5);
    };

    // 검색어 변경 시 포커스 인덱스 초기화
    useEffect(() => {
        setFocusedOptionIndex(0);
    }, [relatedSearchQuery]);

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
            const newIds = (fs.relatedCharacterIds || []).filter((id) => id !== relatedId);
            updateForeshadowing(fsId, { relatedCharacterIds: newIds });
        }
    };

    if (foreshadowings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground p-6 text-center">
                <Sparkles className="w-10 h-10 mb-4 opacity-20" />
                <h3 className="text-sm font-medium mb-1 text-foreground">
                    미회수 복선이 없습니다
                </h3>
                <p className="text-xs leading-relaxed">
                    에디터에서 텍스트를 드래그하거나
                    <br /># 태그를 입력해 복선을 기록해보세요.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-stone-50/30">
            {/* 헤더 */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-mocha-500" />
                    <h2 className="text-sm font-semibold">
                        미회수 복선 ({foreshadowings.length})
                    </h2>
                </div>
            </div>

            {/* 복선 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {foreshadowings.map((fs) => (
                    <div
                        key={fs.id}
                        className={cn(
                            "group bg-[#FAF9F6] border border-stone-200/60 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-sage-300 transition-all duration-200",
                            newForeshadowingId === fs.id && "ring-2 ring-sage-400",
                        )}
                    >
                        {/* 헤더: 제목 편집 + 삭제 버튼 */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* 복선 아이콘 - 세이지 그린 테마 */}
                                <div className="w-7 h-7 rounded-lg bg-sage-50 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    {editingId === fs.id ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                ref={inputRef}
                                                value={editValue}
                                                onChange={(e) =>
                                                    setEditValue(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveEdit();
                                                    if (e.key === "Escape") handleCancelEdit();
                                                }}
                                                className="h-7 text-sm font-bold"
                                                placeholder="복선 제목"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={handleSaveEdit}
                                            >
                                                <Check className="w-3 h-3 text-green-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={handleCancelEdit}
                                            >
                                                <X className="w-3 h-3 text-red-600" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <h4
                                                className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-mocha-600"
                                                onClick={() => handleStartEdit(fs)}
                                                title="클릭하여 제목 편집"
                                            >
                                                #{fs.tag}
                                            </h4>
                                            <button
                                                onClick={() => handleStartEdit(fs)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Edit2 className="w-3 h-3 text-muted-foreground hover:text-mocha-600" />
                                            </button>
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                            fs.importance === "major"
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-stone-100 text-stone-600",
                                        )}
                                    >
                                        {fs.importance === "major" ? "중요" : "일반"}
                                    </span>
                                </div>
                            </div>
                            {/* 삭제 버튼 - 크기 축소 및 마진 추가 */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 mr-1 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(fs.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>

                        {/* 요약 (드래그한 텍스트) */}
                        {fs.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 bg-stone-50 p-2 rounded border border-stone-100">
                                "{fs.description}"
                            </p>
                        )}

                        {/* 연관 요소 (인물/아이템) - 편집 가능 */}
                        <div className="mb-3">
                            {(() => {
                                const relatedItems = getRelatedNames(fs.relatedCharacterIds);
                                return (
                                    <>
                                        {relatedItems && relatedItems.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {relatedItems.map((item) => (
                                                    <span
                                                        key={item.id}
                                                        className={cn(
                                                            "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
                                                            item.type === "character"
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "bg-amber-50 text-amber-700"
                                                        )}
                                                    >
                                                        {item.type === "character" ? (
                                                            <Users className="w-2.5 h-2.5" />
                                                        ) : (
                                                            <Package className="w-2.5 h-2.5" />
                                                        )}
                                                        {item.name}
                                                        <button
                                                            onClick={() => handleRemoveRelated(fs.id, item.id)}
                                                            className="ml-0.5 hover:text-red-600"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 연관 요소 추가 UI */}
                                        {editingRelatedId === fs.id ? (
                                            <div className="relative">
                                                <Input
                                                    ref={relatedInputRef}
                                                    value={relatedSearchQuery}
                                                    onChange={(e) => setRelatedSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        const options = getFilteredRelatedOptions(fs.relatedCharacterIds);
                                                        if (options.length === 0) return;

                                                        if (e.key === "ArrowDown") {
                                                            e.preventDefault();
                                                            setFocusedOptionIndex((prev) => (prev + 1) % options.length);
                                                        } else if (e.key === "ArrowUp") {
                                                            e.preventDefault();
                                                            setFocusedOptionIndex((prev) => (prev - 1 + options.length) % options.length);
                                                        } else if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddRelated(fs.id, options[focusedOptionIndex].id);
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
                                                    placeholder="@캐릭터 또는 아이템 검색..."
                                                    className="h-7 text-xs"
                                                    autoFocus
                                                />
                                                {relatedSearchQuery && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                                                        {getFilteredRelatedOptions(fs.relatedCharacterIds).map((option, index) => (
                                                            <button
                                                                key={option.id}
                                                                className={cn(
                                                                    "w-full px-2 py-1.5 text-left text-xs flex items-center gap-2 transition-colors",
                                                                    focusedOptionIndex === index ? "bg-mocha-50 text-mocha-700" : "hover:bg-stone-50"
                                                                )}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => handleAddRelated(fs.id, option.id)}
                                                            >
                                                                {option.type === "character" ? (
                                                                    <Users className="w-3 h-3 text-blue-600" />
                                                                ) : (
                                                                    <Package className="w-3 h-3 text-amber-600" />
                                                                )}
                                                                <span className="flex-1 truncate">{option.name}</span>
                                                            </button>
                                                        ))}
                                                        {getFilteredRelatedOptions(fs.relatedCharacterIds).length === 0 && (
                                                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                                                검색 결과가 없습니다
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
                                                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-mocha-600 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                                연관 요소 추가
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* 위치 정보 (클릭 시 섹션 이동) - 라운딩 버튼 스타일 */}
                        {fs.appearances.length > 0 && fs.appearances[0].sectionTitle && fs.appearances[0].sectionTitle !== "알 수 없음" && fs.appearances[0].documentId && (
                            <button
                                className="flex items-center gap-2 text-[11px] text-stone-600 mb-3 bg-white border border-stone-200 px-3 py-2 rounded-lg w-full text-left hover:bg-sage-50 hover:border-sage-300 hover:text-sage-700 transition-colors shadow-sm"
                                onClick={() =>
                                    onNavigateToPosition?.(
                                        fs.appearances[0].documentId!,
                                    )
                                }
                                title="클릭하여 해당 섹션으로 이동"
                            >
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-sage-500" />
                                <span className="truncate flex-1 font-medium">
                                    {fs.appearances[0].sectionTitle}
                                </span>
                                <span className="text-[10px] text-stone-400">이동 →</span>
                            </button>
                        )}

                        {/* 회수 버튼 - 그린 아웃라인 스타일 */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[11px] h-8 font-semibold bg-white border-sage-300 text-sage-700 hover:bg-sage-50 hover:text-sage-800 hover:border-sage-400"
                            onClick={() =>
                                // 현재 에디터의 documentId를 사용 (회수는 현재 섹션에서 이루어짐)
                                handleRecover(fs.id, documentId || fs.appearances[0]?.documentId)
                            }
                        >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-sage-500" />
                            회수 완료
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ForeshadowingPanel;
