import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Info,
  Users,
  MapPin,
  Sword,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  StickyNote,
  Save,
} from "lucide-react";
import { useCharacters } from "@/hooks/useCharacters";
import { useDocument } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

interface InspectorPanelProps {
  documentId: string | null;
}

// 아코디언 섹션 컴포넌트
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  count,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{count}</span>
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}

/**
 * 인스펙터 패널 - 스토리 바이블 + 문서 메모
 * 글쓰면서 빠르게 참조하고 메모할 수 있는 패널
 */
export default function InspectorPanel({ documentId }: InspectorPanelProps) {
  const { id: projectId } = useParams<{ id: string }>();

  // 현재 문서 정보 및 메모
  const { document, updateDocument } = useDocument(documentId);
  const [notes, setNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 프로젝트의 캐릭터 목록
  const { data: characters = [], isLoading: charLoading } = useCharacters(
    projectId || "",
    { enabled: !!projectId },
  );

  // 문서 변경 시 메모 로드 (metadata.notes 사용)
  useEffect(() => {
    setNotes(document?.metadata?.notes || "");
    setHasChanges(false);
  }, [document?.metadata?.notes, documentId]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== (document?.metadata?.notes || ""));
  };

  const handleSaveNotes = async () => {
    if (!documentId) return;
    setIsSaving(true);
    try {
      await updateDocument({ metadata: { notes } });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        프로젝트를 선택하세요
      </div>
    );
  }

  if (charLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-3 py-2.5 border-b border-border bg-muted/50/50 shrink-0">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          레퍼런스
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          글쓰면서 참고할 설정과 메모
        </p>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">
        {/* 문서 메모 섹션 */}
        <CollapsibleSection
          title="이 문서 메모"
          icon={StickyNote}
          defaultOpen={true}
        >
          {documentId ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="씬의 목적, 참고사항, 아이디어..."
                className="w-full h-24 resize-none bg-card border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-mocha-500/30 focus:border-mocha-400"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {notes.length}자
                </span>
                {hasChanges && (
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-xs text-mocha-700 hover:text-mocha-800 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    저장
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              문서를 선택하세요
            </p>
          )}
        </CollapsibleSection>

        {/* 캐릭터 섹션 */}
        <CollapsibleSection
          title="캐릭터"
          icon={Users}
          count={characters.length}
          defaultOpen={characters.length > 0 && characters.length <= 5}
        >
          {characters.length > 0 ? (
            <div className="space-y-1.5">
              {characters.map((char) => (
                <div
                  key={char._id}
                  className="group p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                        char.role === "protagonist"
                          ? "bg-amber-500"
                          : char.role === "antagonist"
                            ? "bg-rose-500"
                            : "bg-muted",
                      )}
                    >
                      {char.profile?.name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {char.profile?.name || "이름 없음"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {char.role === "protagonist"
                          ? "주인공"
                          : char.role === "antagonist"
                            ? "적대자"
                            : "조연"}
                        {char.profile?.backstory &&
                          ` · ${String(char.profile.backstory).slice(0, 30)}...`}
                      </p>
                    </div>
                  </div>
                  {char.personality?.coreTraits &&
                    char.personality.coreTraits.length > 0 && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 hidden group-hover:block">
                        {String(char.personality.coreTraits.join(", "))}
                      </p>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              월드 페이지에서 캐릭터를 추가하세요
            </p>
          )}
        </CollapsibleSection>

        {/* 장소 섹션 */}
        <CollapsibleSection
          title="장소"
          icon={MapPin}
          count={0}
          defaultOpen={false}
        >
          <p className="text-xs text-muted-foreground text-center py-2">
            월드 페이지에서 장소를 추가하세요
          </p>
        </CollapsibleSection>

        {/* 아이템 섹션 */}
        <CollapsibleSection
          title="아이템"
          icon={Sword}
          count={0}
          defaultOpen={false}
        >
          <p className="text-xs text-muted-foreground text-center py-2">
            월드 페이지에서 아이템을 추가하세요
          </p>
        </CollapsibleSection>
      </div>

      {/* 하단 안내 */}
      <div className="px-3 py-2 border-t border-border bg-muted/50/30 shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          💡 @멘션으로 캐릭터를 본문에 연결하세요
        </p>
      </div>
    </div>
  );
}
