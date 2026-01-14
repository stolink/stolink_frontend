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
import { RelationshipDeepAnalysisModal } from "@/components/CharacterGraph/RelationshipDeepAnalysis";
import { generateAnalysisData } from "@/components/CharacterGraph/RelationshipDeepAnalysis/utils/analysisCalculations";
import type { AnalysisDiff } from "@/types/analysisTypes";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import { calculateDiffFromSnapshot } from "@/utils/analysisUtils";

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

  // Character.relationships에서 관계 데이터 추출 (이벤트 히스토리 포함)
  // [Fix] Defined early to avoid ReferenceError in useProjectAnalysis callback or useEffect deps
  const links: RelationshipLink[] = useRelationshipLinks(
    characters,
    projectEvents
  );

  // Snapshot Ref for diff calculation
  const snapshotRef = useRef<{
    characters: Character[];
    links: RelationshipLink[];
  } | null>(null);

  // Track if we are waiting for data refresh after analysis
  const [isWaitingForRefresh, setIsWaitingForRefresh] = useState(false);

  const updateCharacterMutation = useUpdateCharacter();

  const setJobId = useAnalysisBufferStore((state) => state.setJobId);
  const setAnalyzing = useAnalysisBufferStore((state) => state.setAnalyzing);

  const [analysisDiff, setAnalysisDiff] = useState<AnalysisDiff | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [isDebugAnalyzing, setIsDebugAnalyzing] = useState(false);

  // 관계 상세 분석 모달 상태
  const [relationshipAnalysisData, setRelationshipAnalysisData] =
    useState<RelationshipDeepAnalysisData | null>(null);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [pendingHighlightNames, setPendingHighlightNames] = useState<string[]>(
    []
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
    flushAndAnalyze,
  } = useProjectAnalysis(projectId ?? null, {
    onAnalysisComplete: (result) => {
      // guard: Check acknowledgement
      if (
        projectId &&
        sessionStorage.getItem(`analysis_acknowledged_${projectId}`) === "true"
      ) {
        return;
      }
      // 분석 완료 애니메이션 표시 (결과 유무와 관계없이)
      setShowCompletionAnimation(true);

      console.group("🏁 Analysis Complete Visualization");
      console.log("📥 Raw Analysis Result:", result);
      console.log("📸 Snapshot stored:", snapshotRef.current);
      console.groupEnd();

      // Trigger waiting state for data refresh
      // Diff calculation will happen in useEffect once data is updated
      setIsWaitingForRefresh(true);
    },
  });

  // Check for Pending Analysis View (from Editor)
  useEffect(() => {
    if (projectId) {
      const pendingView = sessionStorage.getItem(
        `analysis_pending_view_${projectId}`
      );
      if (pendingView === "true") {
        console.log("📬 Found pending analysis view from Editor");
        sessionStorage.removeItem(`analysis_pending_view_${projectId}`);
        // Trigger the completion flow immediately
        setTimeout(() => setIsWaitingForRefresh(true), 0);
      }
    }
  }, [projectId]);

  const analyzeMutation = useAnalyzeStory();

  const handleStartAnalysis = async () => {
    if (!projectId) return;

    // 중복 호출 방지: 이미 분석 중이면 리턴
    if (isPolling) return;

    // Capture Snapshot before starting
    console.log("📸 Capturing Snapshot for Diff...");
    const snapshot = {
      characters: [...characters],
      links: [...links], // links are derived, but capturing current state is safe
    };
    snapshotRef.current = snapshot;

    // Persist to sessionStorage to survive page reloads
    try {
      sessionStorage.setItem(
        `analysis_snapshot_${projectId}`,
        JSON.stringify(snapshot)
      );
      // Reset flags for new session
      sessionStorage.setItem(`analysis_acknowledged_${projectId}`, "false");
      sessionStorage.removeItem(`analysis_pending_view_${projectId}`);
    } catch (e) {
      console.warn("Failed to save snapshot to sessionStorage", e);
    }

    // 만약 버퍼에 변경사항이 있다면, 단순히 전체 분석을 새로 날리는 게 아니라
    // 변경사항 점검을 포함한 triggerAnalysis 호출을 우선함
    const hasBufferChanges = useAnalysisBufferStore
      .getState()
      .hasUnanalyzedChanges();

    if (hasBufferChanges) {
      await flushAndAnalyze();
      return;
    }

    try {
      const result = await analyzeMutation.mutateAsync({
        projectId,
        documentIds: [], // Empty means analyze all for now
      });
      if (result.data?.jobId) {
        setJobId(result.data.jobId);
        setAnalyzing(true);
      }
    } catch (_err) {
      // Analysis failed
      snapshotRef.current = null; // Clear snapshot on error
    }
  };

  // Effect: Calculate Diff when Data Refreshes after Analysis
  useEffect(() => {
    if (isWaitingForRefresh && !isPolling) {
      // [Fix] Allow diff calculation even if snapshot is missing (treat as fresh start)
      // Check if data seems "fresh" or different (or just assume it is after query invalidation)

      // 1. Try to get snapshot from Ref
      let prev = snapshotRef.current;

      // 2. If missing (e.g. reload), try SessionStorage
      if (!prev && projectId) {
        try {
          const stored = sessionStorage.getItem(
            `analysis_snapshot_${projectId}`
          );
          if (stored) {
            prev = JSON.parse(stored);
            console.log("📦 Restored Snapshot from SessionStorage");
          }
        } catch (e) {
          console.error("Failed to restore snapshot from storage", e);
        }
      }

      // 3. Fallback to empty (Fresh Start)
      if (!prev) {
        prev = { characters: [], links: [] };
      }

      const currentChars = characters;
      const currentLinks = links;

      console.log("🔄 Calculating Snapshot Diff...", {
        prevChars: prev.characters.length,
        nextChars: currentChars.length,
      });

      const diff = calculateDiffFromSnapshot(
        prev.characters,
        prev.links,
        currentChars,
        currentLinks
      );

      console.log("📉 Snapshot Diff Result:", diff);

      // Fix: Wrap state updates in setTimeout to avoid "set-state-in-effect" warning
      setTimeout(() => {
        setAnalysisDiff(diff);

        // Set highlighting
        const namesToHighlight = [
          ...diff.newCharacters.map((c) => c.profile.name),
          ...diff.updatedCharacters.map((u) => {
            const char = currentChars.find((c) => c._id === u.id);
            return char?.profile.name || "";
          }),
        ].filter(Boolean);
        setPendingHighlightNames(namesToHighlight);

        // Reset wait state
        setIsWaitingForRefresh(false);
        snapshotRef.current = null; // Clear snapshot ref
        if (projectId) {
          sessionStorage.removeItem(`analysis_snapshot_${projectId}`); // Clear storage
        }
      }, 0);

      // Open modal
      setTimeout(() => {
        setShowCompletionAnimation(false);
        setIsAnalysisModalOpen(true);
      }, 1500);
    }
  }, [isWaitingForRefresh, isPolling, characters, links, projectId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  // 그래프 하이라이팅용 경량 상태 (즉시 반응)
  const [graphFocusId, setGraphFocusId] = useState<string | null>(null);

  const [relationTypeFilter, setRelationTypeFilter] = useState<
    UIRelationType | "all"
  >("all");

  // Feature Flag: Canvas vs SVG 그래프 전환 (Canvas가 기본값)
  // Canvas 그래프 강제 활성화 (디버깅)
  useEffect(() => {
    // Debug info removed
  }, []);

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
                (nc) => nc.profile.name === c.profile.name
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

  // Global Keyboard Shortcuts (Cmd+K for Debug Analysis, ESC for Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Meta+K or Ctrl+K) - Trigger Debug Analysis
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();

        // Prevent multiple triggers
        if (isDebugAnalyzing || showCompletionAnimation || isAnalysisModalOpen)
          return;

        console.log("🛠️ Debug Analysis Triggered");
        setIsDebugAnalyzing(true);

        // 1. Simulate Analysis Phase (3s)
        setTimeout(() => {
          setIsDebugAnalyzing(false);
          setShowCompletionAnimation(true);

          // Generate Mock Diff
          const mockDiff: AnalysisDiff = {
            newCharacters: [],
            updatedCharacters: [],
            newRelations: [],
            updatedRelations: [],
            removedRelations: [],
          };

          setAnalysisDiff(mockDiff);

          // 2. Simulate Success Phase (1.5s) -> Open Modal
          setTimeout(() => {
            setShowCompletionAnimation(false);
            setIsAnalysisModalOpen(true);
          }, 1500);
        }, 3000);
        return;
      }

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
  }, [isDebugAnalyzing, showCompletionAnimation, isAnalysisModalOpen]);

  // Sync selectedCharacter with latest data from characters array
  // We use useMemo to derive the active character data to avoid cascading renders
  const activeCharacter = useMemo(() => {
    if (!selectedCharacter || characters.length === 0) return selectedCharacter;
    const updated = characters.find((c) => c._id === selectedCharacter._id);
    return updated ? updated : selectedCharacter;
  }, [characters, selectedCharacter]);

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
      setIsRelationshipModalOpen(false);
      setRelationshipAnalysisData(null);
      return;
    }

    // 링크의 source와 target ID 추출
    const sourceId =
      typeof link.source === "string"
        ? link.source
        : (link.source as { id: string }).id;
    const targetId =
      typeof link.target === "string"
        ? link.target
        : (link.target as { id: string }).id;

    // 캐릭터 찾기
    const sourceChar = characters.find((c) => c._id === sourceId);
    const targetChar = characters.find((c) => c._id === targetId);

    if (!sourceChar || !targetChar) {
      console.warn("캐릭터를 찾을 수 없습니다:", sourceId, targetId);
      return;
    }

    // 분석 데이터 생성
    const analysisData = generateAnalysisData(
      sourceChar,
      targetChar,
      link.relationTypes || [link.type],
      link.strength || 5,
      projectEvents,
      link.description
    );

    setRelationshipAnalysisData(analysisData);
    setIsRelationshipModalOpen(true);
  };

  return (
    <div className="h-full w-full flex flex-col bg-paper overflow-hidden relative selection:bg-mocha-100 selection:text-mocha-900">
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL LOADING OVERLAY (Shutter Animation)
          이미지 생성(image 타입)은 백그라운드에서 조용히 진행되므로 오버레이 표시 안 함
      ───────────────────────────────────────────────────────────── */}

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
          {/* Analysis Overlay (Scoped to Graph) */}
          <AnimatePresence>
            {((isPolling && currentJobType !== "image") ||
              isDebugAnalyzing ||
              showCompletionAnimation) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-paper/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto"
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
                          : isDebugAnalyzing
                            ? "분석 시뮬레이션 중 (Debug)"
                            : isStuck
                              ? "분석이 지연되고 있습니다"
                              : "세계관 분석 중"}
                    </h2>
                    <div className="flex flex-col items-center gap-4">
                      <p
                        className={cn(
                          "text-mocha-500",
                          !showCompletionAnimation &&
                            !isStuck &&
                            "animate-pulse"
                        )}
                      >
                        {showCompletionAnimation
                          ? "분석된 결과를 불러오고 있습니다..."
                          : currentJobType === "image"
                            ? "캐릭터의 새로운 모습을 그리고 있습니다..."
                            : isDebugAnalyzing
                              ? "디버그 모드에서 분석 과정을 테스트하고 있습니다..."
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
                              {isDebugAnalyzing
                                ? 65
                                : Math.round(analysisProgress)}
                              %
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
                    disabled={analyzeMutation.isPending || isPolling}
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
                    } catch (_e) {
                      // Failed to save node position
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
                    } catch (_e) {
                      // Failed to save node position
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
                    disabled={analyzeMutation.isPending || isPolling}
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
        projectId={projectId}
        onClose={() => setIsModalOpen(false)}
        onSave={async (updatedChar) => {
          // 캐릭터 수정 후 추가로 월드 페이지에서 처리할 로직이 있다면 여기에 작성
          console.log("[WorldPage] Character updated:", updatedChar._id);
        }}
      />

      {/* Analysis Result Summary Modal */}
      {analysisDiff && (
        <AnalysisSummaryModal
          isOpen={isAnalysisModalOpen}
          onClose={() => {
            setIsAnalysisModalOpen(false);
            setAnalysisDiff(null);
            // Mark as acknowledged so notifications stop appearing
            if (projectId) {
              sessionStorage.setItem(
                `analysis_acknowledged_${projectId}`,
                "true"
              );
            }
          }}
          diff={analysisDiff}
        />
      )}

      {/* Relationship Deep Analysis Modal */}
      <RelationshipDeepAnalysisModal
        isOpen={isRelationshipModalOpen}
        onClose={() => {
          setIsRelationshipModalOpen(false);
          setRelationshipAnalysisData(null);
        }}
        data={relationshipAnalysisData}
        onNavigateToEvent={(eventId) => {
          // 이벤트로 이동하는 로직 (추후 구현 가능)
          console.log("Navigate to event:", eventId);
        }}
      />
    </div>
  );
}
