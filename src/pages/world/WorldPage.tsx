import { AnimatePresence, motion } from "framer-motion";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CharacterDetailDialog from "@/components/common/CharacterDetailDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Network, Sparkles, UserRound, Users, X } from "lucide-react";

import type { UIRelationType } from "@/components/CharacterGraph/constants";
import type { Character, RelationshipLink } from "@/types";
import { roleLabels } from "./constants";

import {
  AnalysisSummaryModal,
  CharacterGraph,
  type CharacterGraphRef,
} from "@/components/CharacterGraph";
import {
  CharacterGraphCanvas,
  type CharacterGraphCanvasRef,
} from "@/components/CharacterGraph/CanvasGraph";
import type { AnalysisDiff } from "@/types/analysisTypes";
import { calculateAnalysisDiff } from "@/utils/analysisUtils";

// Hooks
import { useAnalyzeStory } from "@/hooks/useAI";
import { useCharacters, useUpdateCharacter } from "@/hooks/useCharacters";
import { useProjectAnalysis } from "@/hooks/useProjectAnalysis";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";

// Components
import { Button } from "@stolink/ui";
import { EmptyIndicator } from "./components/EmptyIndicator";
import { ForeshadowingPanel } from "./components/ForeshadowingPanel";
import { NetworkDetailPanelD3 } from "./components/NetworkDetailPanelD3";

import { useProjectEvents } from "@/hooks/useEvents";
import { useRelationshipLinks } from "@/hooks/useRelationshipLinks";

// Feature Flag: Canvas vs SVG 그래프 전환 (Canvas가 기본값)
const USE_CANVAS_GRAPH = true;

export default function WorldPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const navigate = useNavigate();

  // projectId is guaranteed to be string here
  const { data: realCharacters = [] } = useCharacters(projectId || "", {
    enabled: !!projectId,
  });

  // Switch between real and dummy data
  const characters = realCharacters;

  // 프로젝트 이벤트 로드 (관계 히스토리 표시용)
  const { data: projectEvents = [] } = useProjectEvents(projectId || null, {
    enabled: !!projectId,
  });

  const updateCharacterMutation = useUpdateCharacter();

  const setJobId = useAnalysisBufferStore((state) => state.setJobId);
  const setAnalyzing = useAnalysisBufferStore((state) => state.setAnalyzing);

  const [analysisDiff, setAnalysisDiff] = useState<AnalysisDiff | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [pendingHighlightNames, setPendingHighlightNames] = useState<string[]>(
    [],
  );
  const [analysisChanges, setAnalysisChanges] = useState<
    Record<string, "new" | "updated" | null>
  >({});

  // Polling for analysis status (Global)
  const {
    isAnalyzing: isPolling,
    resetAnalysis,
    analysisProgress,
    isStuck,
    currentJobType,
  } = useProjectAnalysis(projectId ?? null, {
    onAnalysisComplete: (result) => {
      console.log("[WorldPage] onAnalysisComplete called, result:", result);

      // 분석 완료 애니메이션 표시 (결과 유무와 관계없이)
      setShowCompletionAnimation(true);

      if (result) {
        // 백엔드가 결과를 직접 반환한 경우 (SSE에 result 포함)
        const diff = calculateAnalysisDiff(characters, links, result);
        setAnalysisDiff(diff);

        // Capture names for highlighting after query invalidation
        const namesToHighlight = [
          ...diff.newCharacters.map((c) => c.profile.name),
          ...diff.updatedCharacters.map((u) => {
            const char = result.characters.find(
              (c: { name: string }) => c.name === u.id,
            );
            return char?.name || "";
          }),
        ].filter(Boolean);
        setPendingHighlightNames(namesToHighlight);

        // Wait 1.5s for the user to see "Completed" state, then open modal
        setTimeout(() => {
          setShowCompletionAnimation(false);
          setIsAnalysisModalOpen(true);
        }, 1500);
      } else {
        // 백엔드가 결과를 DB에만 저장한 경우 (쿼리 무효화로 데이터 갱신됨)
        // 완료 애니메이션만 표시하고 모달은 생략
        setTimeout(() => {
          setShowCompletionAnimation(false);
        }, 1500);
      }
    },
  });

  const analyzeMutation = useAnalyzeStory();

  const handleStartAnalysis = async () => {
    if (!projectId) return;
    try {
      const result = await analyzeMutation.mutateAsync({
        projectId,
        documentIds: [], // Empty means analyze all for now
      });
      if (result.data?.jobId) {
        setJobId(result.data.jobId);
        setAnalyzing(true);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  // 그래프 하이라이팅용 경량 상태 (즉시 반응)
  const [graphFocusId, setGraphFocusId] = useState<string | null>(null);

  const [relationTypeFilter, setRelationTypeFilter] = useState<
    UIRelationType | "all"
  >("all");

  // Feature Flag: Canvas vs SVG 그래프 전환 (Canvas가 기본값)
  // Canvas 그래프 강제 활성화 (디버깅)
  useEffect(
    () =>
      console.log(
        "Current Graph Mode:",
        USE_CANVAS_GRAPH ? "Canvas (Optimized)" : "SVG (Legacy)",
      ),
    [],
  );

  const graphRef = useRef<CharacterGraphRef | CharacterGraphCanvasRef>(null);
  const [searchHighlightedIds, setSearchHighlightedIds] = useState<
    string[] | null
  >(null);

  // 분석 완료 후 새 캐릭터 하이라이트 효과
  useEffect(() => {
    if (pendingHighlightNames.length > 0 && realCharacters.length > 0) {
      const idsToHighlight = realCharacters
        .filter((c) => pendingHighlightNames.includes(c.profile.name))
        .map((c) => c._id);

      if (idsToHighlight.length > 0) {
        startTransition(() => {
          setSearchHighlightedIds(idsToHighlight);

          // Populate analysisChanges based on diff type
          const newChanges: Record<string, "new" | "updated" | null> = {};
          realCharacters.forEach((c) => {
            if (pendingHighlightNames.includes(c.profile.name)) {
              // Check if it's new or updated (heuristic: if it was in diff.newCharacters)
              const isNew = analysisDiff?.newCharacters.some(
                (nc) => nc.profile.name === c.profile.name,
              );
              newChanges[c._id] = isNew ? "new" : "updated";
            }
          });
          setAnalysisChanges(newChanges);
          setPendingHighlightNames([]);
        });

        // 5초 후 하이라이트 및 배지 해제
        const timer = setTimeout(() => {
          startTransition(() => {
            setSearchHighlightedIds(null);
            setAnalysisChanges({});
          });
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    pendingHighlightNames,
    realCharacters,
    analysisDiff,
    setAnalysisChanges,
    setPendingHighlightNames,
  ]);

  // Global Keyboard Shortcuts (ESC only - Cmd+K removed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // startTransition으로 비긴급 업데이트 처리 (INP 개선)
        startTransition(() => {
          setSelectedCharacter(null);
          setGraphFocusId(null);
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync selectedCharacter with latest data from characters array
  // We use useMemo to derive the active character data to avoid cascading renders
  const activeCharacter = useMemo(() => {
    if (!selectedCharacter || characters.length === 0) return selectedCharacter;
    const updated = characters.find((c) => c._id === selectedCharacter._id);
    return updated ? updated : selectedCharacter;
  }, [characters, selectedCharacter]);

  // Character.relationships에서 관계 데이터 추출 (이벤트 히스토리 포함)
  const links: RelationshipLink[] = useRelationshipLinks(
    characters,
    projectEvents,
  );

  // Critical Guard: Render error if projectId is missing (AFTER hooks)
  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        프로젝트 ID가 유효하지 않습니다.
      </div>
    );
  }

  const handleNodeClick = (character: Character | null) => {
    if (!character) {
      startTransition(() => {
        setSelectedCharacter(null);
        setGraphFocusId(null);
      });
      return;
    }
    const nextChar =
      selectedCharacter?._id === character._id ? null : character;
    startTransition(() => {
      setSelectedCharacter(nextChar);
      setGraphFocusId(nextChar?._id || null);
    });

    // Sidebar will open because selectedCharacter is set
    // Modal will be opened manually from the sidebar's "View Profile" button
  };

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setGraphFocusId(character._id);
    setIsModalOpen(true);
  };

  const handleLinkClick = (link: RelationshipLink | null) => {
    if (!link) {
      // Handle link deselection (if applicable, though usually clicking background just clears node selection)
      return;
    }
    // Link Click logic removed as we use internal Deep Analysis
    console.log("Link clicked:", link);
  };

  return (
    <div className="h-full w-full flex flex-col bg-paper overflow-hidden relative selection:bg-mocha-100 selection:text-mocha-900">
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL LOADING OVERLAY (Shutter Animation)
          이미지 생성(image 타입)은 백그라운드에서 조용히 진행되므로 오버레이 표시 안 함
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {((isPolling && currentJobType !== "image") ||
          showCompletionAnimation) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-paper/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            {/* Emergency Reset Button (Only show while analyzing, not during completion success) */}
            {!showCompletionAnimation && (
              <button
                onClick={() => resetAnalysis()}
                className="absolute top-8 right-8 p-2 hover:bg-destructive/10 text-mocha-400 hover:text-destructive rounded-full transition-all group"
                title="분석 강제 중단 및 상태 초기화"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
            )}

            <div className="flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                {showCompletionAnimation ? (
                  // Success Animation State
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-10 h-10 text-green-600 animate-pulse" />
                  </motion.div>
                ) : (
                  // Analyzing Animation State
                  <>
                    <div className="absolute inset-0 border-4 border-mocha-200 rounded-full animate-ping opacity-20" />
                    <div className="absolute inset-0 border-4 border-t-mocha-500 border-r-transparent border-b-mocha-500 border-l-transparent rounded-full animate-spin" />
                    <div className="absolute inset-4 bg-mocha-100 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-mocha-600" />
                    </div>
                  </>
                )}
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-heading text-espresso-900">
                  {showCompletionAnimation
                    ? "분석 완료!"
                    : currentJobType === "image"
                      ? "캐릭터 이미지 생성 중"
                      : isStuck
                        ? "분석이 지연되고 있습니다"
                        : "세계관 분석 중"}
                </h2>
                <div className="flex flex-col items-center gap-4">
                  <p
                    className={cn(
                      "text-mocha-500",
                      !showCompletionAnimation && !isStuck && "animate-pulse",
                    )}
                  >
                    {showCompletionAnimation
                      ? "분석된 결과를 불러오고 있습니다..."
                      : currentJobType === "image"
                        ? "캐릭터의 새로운 모습을 그리고 있습니다..."
                        : isStuck
                          ? "작업이 중단되었을 수 있습니다. 잠시 후 다시 시도하거나 초기화해주세요."
                          : "AI가 스토리의 흐름을 읽고 있습니다..."}
                  </p>

                  {!showCompletionAnimation && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-64 h-2 bg-cloud-100 rounded-full overflow-hidden border border-cloud-200 shadow-inner">
                        <motion.div
                          className="h-full bg-mocha-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisProgress}%` }}
                          transition={{
                            type: "spring",
                            bounce: 0,
                            duration: 0.5,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-mocha-400 font-mono font-bold text-sm">
                          {Math.round(analysisProgress)}%
                        </span>
                        {isStuck && (
                          <Button
                            onClick={() => resetAnalysis()}
                            size="sm"
                            intent="secondary"
                            className="h-7 px-3 text-xs bg-white/80 hover:bg-white border-mocha-200 text-mocha-600"
                          >
                            초기화 및 재시작
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Tabs defaultValue="graph" className="h-full flex flex-col relative">
        {/* Floating Glass Header - Fixed to Global Header Area */}
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] px-1 py-1 bg-paper/80 backdrop-blur-xl rounded-2xl shadow-paper-floating border border-cloud-200 shrink-0">
          {/* Tab Navigation - Pill Style */}
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger
              value="graph"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-mocha-500 data-[state=active]:text-white data-[state=inactive]:text-mocha-500 data-[state=inactive]:hover:text-mocha-700 data-[state=inactive]:hover:bg-muted transition-all font-medium"
            >
              <Network className="h-3.5 w-3.5" />
              관계도
            </TabsTrigger>
            <TabsTrigger
              value="characters"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-paper data-[state=active]:border-cloud-200 data-[state=active]:shadow-sm data-[state=active]:text-espresso-900 data-[state=inactive]:text-mocha-500 data-[state=inactive]:hover:text-mocha-700 data-[state=inactive]:hover:bg-paper/50 transition-all"
            >
              <UserRound className="h-3.5 w-3.5" />
              캐릭터
            </TabsTrigger>

            <TabsTrigger
              value="foreshadowing"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-paper data-[state=active]:border-cloud-200 data-[state=active]:shadow-sm data-[state=active]:text-espresso-900 data-[state=inactive]:text-mocha-500 data-[state=inactive]:hover:text-mocha-700 data-[state=inactive]:hover:bg-paper/50 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              복선
            </TabsTrigger>

            <TabsTrigger
              value="debug"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs border border-transparent data-[state=inactive]:text-mocha-300 data-[state=inactive]:hover:text-mocha-500 transition-all opacity-50"
            >
              DEBUG
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Character Graph - D3.js (Full Bleed) */}
        <TabsContent
          value="graph"
          className="flex-1 m-0 overflow-hidden relative bg-paper"
        >
          {characters.length === 0 && !isPolling ? (
            <div className="h-full flex items-center justify-center p-6">
              <EmptyIndicator
                icon={Users}
                title="관계도 데이터가 없습니다"
                description="아직 추출된 캐릭터가 없습니다. 세계관 분석을 시작하여 자동으로 관계도를 생성해보세요."
                action={
                  <Button
                    onClick={handleStartAnalysis}
                    className="bg-mocha-500 hover:bg-mocha-600 text-white"
                    disabled={analyzeMutation.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    세계관 분석 시작하기
                  </Button>
                }
              />
            </div>
          ) : (
            <div
              className="h-full w-full relative"
              style={{ height: "100%", contain: "layout" }}
            >
              {/* Polling Indicator Removed (Moved to Global) */}

              {/* Detail Sidebar */}
              <NetworkDetailPanelD3
                selectedCharacter={activeCharacter}
                characters={characters}
                links={links}
                onClose={() => setSelectedCharacter(null)}
                onViewProfile={() => setIsModalOpen(true)}
              />

              {/* CharacterGraph - Canvas (1000+ nodes) or SVG (legacy) */}
              {USE_CANVAS_GRAPH ? (
                <CharacterGraphCanvas
                  characters={characters}
                  links={links}
                  events={projectEvents}
                  onNodeDragEnd={async (node) => {
                    if (node.id.startsWith("temp-node") || !node.x || !node.y)
                      return;
                    try {
                      await updateCharacterMutation.mutateAsync({
                        id: node.id,
                        payload: {
                          graphPosition: { x: node.x, y: node.y },
                        },
                      });
                    } catch (e) {
                      console.error("Failed to save node position:", e);
                    }
                  }}
                  onNodeClick={handleNodeClick}
                  onLinkClick={handleLinkClick}
                  selectedNodeId={graphFocusId || activeCharacter?._id || null}
                  relationTypeFilter={relationTypeFilter}
                  onFilterChange={setRelationTypeFilter}
                  highlightedNodeIds={searchHighlightedIds}
                  onSearchChange={setSearchHighlightedIds}
                  showSearch={true}
                  ref={graphRef as React.RefObject<CharacterGraphCanvasRef>}
                  nodeChanges={analysisChanges}
                />
              ) : (
                <CharacterGraph
                  characters={characters}
                  links={links}
                  events={projectEvents}
                  onNodeDragEnd={async (node) => {
                    if (node.id.startsWith("temp-node") || !node.x || !node.y)
                      return;
                    try {
                      await updateCharacterMutation.mutateAsync({
                        id: node.id,
                        payload: {
                          graphPosition: { x: node.x, y: node.y },
                        },
                      });
                    } catch (e) {
                      console.error("Failed to save node position:", e);
                    }
                  }}
                  onNodeClick={handleNodeClick}
                  onLinkClick={handleLinkClick}
                  selectedNodeId={graphFocusId || activeCharacter?._id || null}
                  relationTypeFilter={relationTypeFilter}
                  onFilterChange={setRelationTypeFilter}
                  highlightedNodeIds={searchHighlightedIds}
                  onSearchChange={setSearchHighlightedIds}
                  showSearch={true}
                  ref={graphRef as React.RefObject<CharacterGraphRef>}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Characters List */}
        <TabsContent value="characters" className="flex-1 m-0 overflow-y-auto">
          {characters.length === 0 && !isPolling ? (
            <div className="h-full flex items-center justify-center p-6 pb-20">
              <EmptyIndicator
                icon={Users}
                title="등록된 캐릭터가 없습니다"
                description="스토리 속에 등장하는 캐릭터들을 AI가 자동으로 찾아드립니다."
                action={
                  <Button
                    onClick={handleStartAnalysis}
                    className="bg-mocha-500 hover:bg-mocha-600 text-white"
                    disabled={analyzeMutation.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    캐릭터 추출하기
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="relative min-h-full">
              {/* Polling Indicator for List */}
              {/* Polling Indicator Removed (Moved to Global) */}

              <div className="pt-20 px-8 pb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {characters.map((character, index) => (
                  <div
                    key={`${character._id || (character as { id?: string }).id || "char"}-${index}`}
                    className="editorial-card group cursor-pointer overflow-hidden aspect-[3/4] flex flex-col hover-lift editorial-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleCardClick(character)}
                  >
                    {/* Image Section - 70% height */}
                    <div className="relative flex-[7] overflow-hidden bg-muted">
                      {character.imageUrl ? (
                        <>
                          <img
                            src={character.imageUrl}
                            alt={character.profile?.name || ""}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl opacity-50 group-hover:opacity-70 transition-opacity">
                            {character.role === "protagonist"
                              ? "🦸"
                              : character.role === "antagonist"
                                ? "🦹"
                                : character.role === "mentor"
                                  ? "🧙"
                                  : "👤"}
                          </span>
                        </div>
                      )}
                      {/* Role Badge */}
                      <div className="floating-badge">
                        {roleLabels[character.role || "other"]}
                      </div>
                    </div>

                    {/* Info Section - 30% height */}
                    <div className="flex-[3] p-4 bg-paper flex flex-col justify-center border-t border-cloud-100">
                      <h3 className="text-base font-bold text-espresso-900 line-clamp-1 group-hover:text-mocha-500 transition-colors">
                        {character.profile?.name ||
                          (character as { name?: string }).name ||
                          "이름 없음"}
                      </h3>
                      {(character.profile?.backstory ||
                        (character as { backstory?: string }).backstory) && (
                        <p className="text-xs text-mocha-400 line-clamp-2 mt-1 leading-relaxed">
                          {character.profile?.backstory ||
                            (character as { backstory?: string }).backstory}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Foreshadowing */}
        <TabsContent value="foreshadowing" className="flex-1 m-0">
          <ForeshadowingPanel
            projectId={projectId}
            onNavigateToSection={(documentId) => {
              // 해당 섹션을 선택한 상태로 에디터 페이지로 이동
              navigate(`/projects/${projectId}/editor`, {
                state: { selectedSectionId: documentId },
              });
            }}
          />
        </TabsContent>
        <TabsContent
          value="debug"
          className="p-4 bg-paper overflow-auto max-h-[600px]"
        >
          <h3 className="text-lg font-bold mb-2">
            Raw Characters Data (First 3)
          </h3>
          <pre className="text-xs bg-slate-100 p-2 rounded">
            {JSON.stringify(characters.slice(0, 3), null, 2)}
          </pre>
        </TabsContent>
      </Tabs>

      {/* Character Detail Dialog */}
      <CharacterDetailDialog
        character={activeCharacter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (updatedChar) => {
          try {
            if (!updateCharacterMutation) return;

            // _id is required for update
            if (!updatedChar._id) {
              console.error("Character ID is missing for update");
              return;
            }

            // TODO: CreateCharacterInput 타입 정의가 appearance/personality를 포함하도록 업데이트 필요
            // 현재는 빌드 에러 방지를 위해 any 캐스팅 사용
            const payload = {
              role: updatedChar.role || "extra",
              status: updatedChar.status || "active",
              profile: {
                ...updatedChar.profile,
                name: updatedChar.profile.name,
              },
              appearance: updatedChar.appearance,
              personality: updatedChar.personality,
            };

            await updateCharacterMutation.mutateAsync({
              id: updatedChar._id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payload: payload as any,
            });
          } catch (error) {
            console.error("Failed to save character:", error);
          }
        }}
      />

      {/* Analysis Result Summary Modal */}
      {analysisDiff && (
        <AnalysisSummaryModal
          isOpen={isAnalysisModalOpen}
          onClose={() => {
            setIsAnalysisModalOpen(false);
            setAnalysisDiff(null);
          }}
          diff={analysisDiff}
        />
      )}
    </div>
  );
}
