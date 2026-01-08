import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Users,
  MapPin,
  Sword,
  Sparkles,
  Network,
  UserRound,
  X,
} from "lucide-react";
import CharacterDetailDialog from "@/components/common/CharacterDetailDialog";
import { RelationshipDetailSheet } from "@/components/CharacterGraph/RelationshipDetailSheet";
import type {
  Character,
  RelationshipLink,
  DetailedRelationship,
  CharacterNode,
} from "@/types";
import type { UIRelationType } from "@/components/CharacterGraph/constants";
import { roleLabels } from "./constants";

import {
  CharacterGraph,
  type CharacterGraphRef,
  AnalysisSummaryModal,
} from "@/components/CharacterGraph";
import { calculateAnalysisDiff } from "@/utils/analysisUtils";
import type { AnalysisDiff } from "@/types/analysisTypes";

// Hooks
import { useCharacters, useUpdateCharacter } from "@/hooks/useCharacters";
import { useAnalyzeStory } from "@/hooks/useAI";
import { useProjectAnalysis } from "@/hooks/useProjectAnalysis";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { useQueryClient } from "@tanstack/react-query";

// Components
import { NetworkDetailPanelD3 } from "./components/NetworkDetailPanelD3";
import { ForeshadowingPanel } from "./components/ForeshadowingPanel";
import { EmptyIndicator } from "./components/EmptyIndicator";
import { Button } from "@stolink/ui";

// Mock Places
const places: {
  id: string;
  name: string;
  type: string;
  extras?: { chapters?: string[] };
}[] = [
  {
    id: "1",
    name: "왕국 아르카나",
    type: "지역",
    extras: { chapters: ["1", "3", "5"] },
  },
  {
    id: "2",
    name: "금지된 숲",
    type: "지역",
    extras: { chapters: ["2", "4"] },
  },
  {
    id: "3",
    name: "마법사 탑",
    type: "건물",
    extras: { chapters: ["3", "6"] },
  },
];

// Mock Items
const items: {
  id: string;
  name: string;
  type: string;
  extras?: { owner?: string };
}[] = [
  { id: "1", name: "전설의 검", type: "무기", extras: { owner: "주인공" } },
  {
    id: "2",
    name: "마법 지팡이",
    type: "무기",
    extras: { owner: "현자 가온" },
  },
  { id: "3", name: "예언서", type: "문서", extras: { owner: "없음" } },
];

import { useRelationshipLinks } from "@/hooks/useRelationshipLinks";
import { useProjectEvents } from "@/hooks/useEvents";

export default function WorldPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const _queryClient = useQueryClient();

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

  // Polling for analysis status (Global)
  const { isAnalyzing: isPolling, resetAnalysis } = useProjectAnalysis(
    projectId ?? null,
    {
      onAnalysisComplete: (result) => {
        if (result) {
          const diff = calculateAnalysisDiff(characters, links, result);
          setAnalysisDiff(diff);

          // Trigger success animation logic
          setShowCompletionAnimation(true);

          // Wait 1.5s for the user to see "Completed" state, then open modal
          setTimeout(() => {
            setShowCompletionAnimation(false);
            setIsAnalysisModalOpen(true);
          }, 1500);
        }
      },
    }
  );

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
    null
  );
  // 그래프 하이라이팅용 경량 상태 (즉시 반응)
  const [graphFocusId, setGraphFocusId] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<DetailedRelationship | null>(null);

  const [relationTypeFilter, setRelationTypeFilter] = useState<
    UIRelationType | "all"
  >("all");

  const graphRef = useRef<CharacterGraphRef>(null);
  const [searchHighlightedIds, setSearchHighlightedIds] = useState<
    string[] | null
  >(null);

  // Global Keyboard Shortcuts (ESC only - Cmd+K removed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCharacter(null);
        setGraphFocusId(null);
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
    projectEvents
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
      setSelectedCharacter(null);
      setGraphFocusId(null);
      return;
    }
    const nextChar =
      selectedCharacter?._id === character._id ? null : character;
    setSelectedCharacter(nextChar);
    setGraphFocusId(nextChar?._id || null);

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
    // Resolve source/target IDs (D3 replaces strings with objects)
    const sourceId =
      typeof link.source === "object"
        ? (link.source as CharacterNode).id
        : link.source;
    const targetId =
      typeof link.target === "object"
        ? (link.target as CharacterNode).id
        : link.target;

    const detailedRel: DetailedRelationship = {
      ...link, // id, strength, type, description, history, since, evolved_from, bidirectional
      id: link.id,
      target: String(targetId), // DetailedRelationship expects string ID
      source: String(sourceId), // DetailedRelationship expects string ID
      type: link.type, // RelationType is compatible with BackendRelationshipType
      relationType: link.type,
      strength: link.strength,

      // Use mapped data from link (originally from DB)
      description: link.description,
      bidirectional: link.bidirectional,
      evolvedFrom: link.evolvedFrom,
      since: link.since,
      history: link.history,
    };
    setSelectedRelationship(detailedRel);
  };

  return (
    <div className="h-full w-full flex flex-col bg-paper overflow-hidden relative selection:bg-mocha-100 selection:text-mocha-900">
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL LOADING OVERLAY (Shutter Animation)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(isPolling || showCompletionAnimation) && (
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
                  {showCompletionAnimation ? "분석 완료!" : "세계관 분석 중"}
                </h2>
                <p
                  className={cn(
                    "text-mocha-500",
                    !showCompletionAnimation && "animate-pulse"
                  )}
                >
                  {showCompletionAnimation
                    ? "분석된 결과를 불러오고 있습니다..."
                    : "AI가 스토리의 흐름을 읽고 있습니다..."}
                </p>
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
              value="places"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-paper data-[state=active]:border-cloud-200 data-[state=active]:shadow-sm data-[state=active]:text-espresso-900 data-[state=inactive]:text-mocha-500 data-[state=inactive]:hover:text-mocha-700 data-[state=inactive]:hover:bg-paper/50 transition-all"
            >
              <MapPin className="h-3.5 w-3.5" />
              장소
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-paper data-[state=active]:border-cloud-200 data-[state=active]:shadow-sm data-[state=active]:text-espresso-900 data-[state=inactive]:text-mocha-500 data-[state=inactive]:hover:text-mocha-700 data-[state=inactive]:hover:bg-paper/50 transition-all"
            >
              <Sword className="h-3.5 w-3.5" />
              아이템
            </TabsTrigger>
            <TabsTrigger
              value="foreshadowing"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-paper data-[state=active]:border-cloud-200 data-[state=active]:shadow-sm data-[state=active]:text-espresso-900 data-[state=inactive]:text-mocha-500 data-[state=inactive]:hover:text-mocha-700 data-[state=inactive]:hover:bg-paper/50 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              복선
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
            <div className="h-full w-full relative">
              {/* Polling Indicator Removed (Moved to Global) */}

              {/* Detail Sidebar */}
              <NetworkDetailPanelD3
                selectedCharacter={activeCharacter}
                characters={characters}
                links={links}
                onClose={() => setSelectedCharacter(null)}
                onViewProfile={() => setIsModalOpen(true)}
              />

              {/* D3 CharacterGraph - 내장 검색/컨트롤 사용 */}
              <CharacterGraph
                characters={characters}
                links={links}
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
                ref={graphRef}
              />
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
                    key={
                      character._id ||
                      (character as { id?: string }).id ||
                      `char-${index}`
                    }
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

        {/* Places */}
        <TabsContent
          value="places"
          className="flex-1 m-0 overflow-y-auto editorial-fade-in"
        >
          <div className="p-8 max-w-5xl mx-auto h-full">
            {places.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyIndicator
                  icon={MapPin}
                  title="등록된 장소가 없습니다"
                  description="스토리의 배경이 되는 주요 장소들을 기록해보세요."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="editorial-section-heading mb-6">
                  <MapPin className="h-5 w-5 text-mocha-500" />
                  주요 장소
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {places.map((place, idx) => (
                    <div
                      key={place.id}
                      className="editorial-card p-5 hover-lift cursor-pointer group editorial-fade-in"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mocha-100 to-mocha-50 flex items-center justify-center shrink-0 group-hover:from-mocha-200 group-hover:to-mocha-100 transition-all">
                          <MapPin className="h-5 w-5 text-mocha-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="editorial-name text-base group-hover:text-mocha-500 transition-colors">
                            {place.name}
                          </h3>
                          <p className="text-xs text-mocha-400 mt-1">
                            {place.type}
                          </p>
                          <div className="flex items-center gap-1 mt-3">
                            <span className="text-[10px] text-mocha-400 uppercase tracking-wider">
                              등장
                            </span>
                            <div className="flex gap-1">
                              {(place.extras?.chapters || []).map((ch) => (
                                <span
                                  key={ch}
                                  className="text-xs px-1.5 py-0.5 rounded bg-cloud-100 text-mocha-600"
                                >
                                  {ch}장
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Items */}
        <TabsContent
          value="items"
          className="flex-1 m-0 overflow-y-auto editorial-fade-in"
        >
          <div className="p-8 max-w-5xl mx-auto h-full">
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyIndicator
                  icon={Sword}
                  title="등록된 아이템이 없습니다"
                  description="전설의 무기나 중요한 단서가 되는 물건들을 관리해보세요."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="editorial-section-heading mb-6">
                  <Sword className="h-5 w-5 text-mocha-500" />
                  주요 아이템
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="editorial-card p-5 hover-lift cursor-pointer group editorial-fade-in"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0 group-hover:from-amber-200 group-hover:to-amber-100 transition-all">
                          <Sword className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="editorial-name text-base group-hover:text-amber-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-xs text-mocha-400 mt-1">
                            {item.type}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] text-mocha-400 uppercase tracking-wider">
                              소유자
                            </span>
                            <span className="text-xs font-medium text-mocha-600">
                              {item.extras?.owner || "미소유"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      <RelationshipDetailSheet
        relationship={selectedRelationship}
        isOpen={!!selectedRelationship}
        onClose={() => setSelectedRelationship(null)}
        sourceName={
          characters.find(
            (c) =>
              (c._id || (c as { id?: string }).id) ===
              selectedRelationship?.source
          )?.profile?.name ||
          (
            characters.find(
              (c) =>
                (c._id || (c as { id?: string }).id) ===
                selectedRelationship?.source
            ) as { name?: string }
          )?.name ||
          selectedRelationship?.source
        }
        targetName={
          characters.find(
            (c) =>
              (c._id || (c as { id?: string }).id) ===
              selectedRelationship?.target
          )?.profile?.name ||
          (
            characters.find(
              (c) =>
                (c._id || (c as { id?: string }).id) ===
                selectedRelationship?.target
            ) as { name?: string }
          )?.name ||
          selectedRelationship?.target
        }
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
