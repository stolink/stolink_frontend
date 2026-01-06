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
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="border border-mocha-100 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 py-3 px-4 hover:bg-mocha-50/50 transition-colors"
      >
        <div
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isOpen
              ? "bg-mocha-100 text-mocha-700"
              : "bg-cloud-100 text-mocha-500",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-bold text-espresso-800">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-auto text-xs font-medium text-mocha-500 bg-mocha-50 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
        <div className="ml-2 text-mocha-400">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-cloud-50 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground p-6">
        <Info className="w-8 h-8 opacity-20 mb-3" />
        <p className="text-sm font-medium">프로젝트를 선택하세요</p>
      </div>
    );
  }

  if (charLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-mocha-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cloud-50/30">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-mocha-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-mocha-100 rounded-lg">
            <BookOpen className="w-3.5 h-3.5 text-mocha-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-espresso-900">레퍼런스</h3>
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-mocha-100">
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
                placeholder="이 장면에 대한 아이디어, 잊지 말아야 할 설정을 기록하세요..."
                className="w-full h-32 resize-none bg-cloud-50/50 border border-cloud-200 rounded-lg p-3 text-sm text-espresso-800 placeholder:text-mocha-400 focus:outline-none focus:ring-1 focus:ring-mocha-200 focus:border-mocha-300 transition-all leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-mocha-400 font-medium">
                  {notes.length}자
                </span>
                {hasChanges && (
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-xs font-bold text-mocha-600 hover:text-mocha-800 disabled:opacity-50 transition-colors bg-white px-2 py-1 rounded-md border border-mocha-100 shadow-sm"
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
            <div className="text-xs text-mocha-400 text-center py-4 italic bg-cloud-50 rounded-lg border border-dashed border-cloud-200">
              문서를 선택하면 메모를 작성할 수 있습니다
            </div>
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
            <div className="space-y-2">
              {characters.map((char) => (
                <div
                  key={char._id}
                  className="group flex items-start gap-3 p-2 rounded-xl hover:bg-cloud-50 border border-transparent hover:border-cloud-200 transition-all cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm mt-0.5",
                      char.role === "protagonist"
                        ? "bg-gradient-to-br from-indigo-500 to-blue-600"
                        : char.role === "antagonist"
                          ? "bg-gradient-to-br from-rose-500 to-red-600"
                          : "bg-gradient-to-br from-mocha-400 to-mocha-500",
                    )}
                  >
                    {char.profile?.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-espresso-800 truncate group-hover:text-mocha-700 transition-colors">
                        {char.profile?.name || "이름 없음"}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider",
                          char.role === "protagonist"
                            ? "bg-indigo-50 text-indigo-700"
                            : char.role === "antagonist"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-cloud-100 text-mocha-700",
                        )}
                      >
                        {char.role === "protagonist"
                          ? "MAIN"
                          : char.role === "antagonist"
                            ? "ANTAG"
                            : "SUB"}
                      </span>
                    </div>
                    {char.profile?.backstory && (
                      <p className="text-xs text-mocha-500 mt-1 line-clamp-2 leading-relaxed">
                        {String(char.profile.backstory)}
                      </p>
                    )}
                    {char.personality?.coreTraits &&
                      char.personality.coreTraits.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {char.personality.coreTraits
                            .slice(0, 3)
                            .map((trait, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-mocha-500 bg-cloud-100 px-1.5 py-0.5 rounded-full"
                              >
                                #{trait}
                              </span>
                            ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-mocha-400 text-center py-4 bg-cloud-50 rounded-lg border border-dashed border-cloud-200">
              월드 페이지에서 캐릭터를 추가하세요
            </div>
          )}
        </CollapsibleSection>

        {/* 장소 섹션 */}
        <CollapsibleSection
          title="장소"
          icon={MapPin}
          count={0}
          defaultOpen={false}
        >
          <div className="text-xs text-mocha-400 text-center py-4 bg-cloud-50 rounded-lg border border-dashed border-cloud-200">
            등록된 장소가 없습니다
          </div>
        </CollapsibleSection>

        {/* 아이템 섹션 */}
        <CollapsibleSection
          title="아이템"
          icon={Sword}
          count={0}
          defaultOpen={false}
        >
          <div className="text-xs text-mocha-400 text-center py-4 bg-cloud-50 rounded-lg border border-dashed border-cloud-200">
            등록된 아이템이 없습니다
          </div>
        </CollapsibleSection>
      </div>

      {/* 하단 안내 */}
      <div className="px-4 py-3 border-t border-mocha-100 bg-white shrink-0">
        <p className="text-[11px] text-mocha-400 text-center font-medium">
          💡 팁: @멘션으로 캐릭터를 본문에 바로 연결할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
