import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// CardContent removed if truly unused. Lint said Card and CardContent were unused.
// I'll check if I should remove it entirely.
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

// D3 CharacterGraph (내장 컨트롤 사용)
import {
  CharacterGraph,
  type CharacterGraphRef,
  AnalysisSummaryModal,
} from "@/components/CharacterGraph";
import { calculateAnalysisDiff } from "@/utils/analysisUtils";
import type { AnalysisResultData } from "@/types/analysisResult";
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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

// Mock Places
const places = [
  { id: "1", name: "왕국 아르카나", type: "지역", chapters: [1, 3, 5] },
  { id: "2", name: "금지된 숲", type: "지역", chapters: [2, 4] },
  { id: "3", name: "마법사 탑", type: "건물", chapters: [3, 6] },
];

// Mock Items
const items = [
  { id: "1", name: "전설의 검", type: "무기", owner: "주인공" },
  { id: "2", name: "마법 지팡이", type: "무기", owner: "현자 가온" },
  { id: "3", name: "예언서", type: "문서", owner: "없음" },
];

import { useRelationshipLinks } from "@/hooks/useRelationshipLinks";

// Mock extras data for 장발장 and 자베르
const MOCK_EXTRAS: Record<
  string,
  Record<string, string | number | string[]>
> = {
  "lm-001": {
    // 장발장 - 기본 정보
    나이: "약 45세",
    성별: "남성",
    직업: "전 죄수 → 공장주 → 시장",
    출생지: "프랑스 파베롤",
    // 외모 정보
    신장: "180cm",
    체격: "매우 건장함",
    머리카락: "백발 (은빛)",
    눈: "깊고 온화한 눈빛",
    특징: "굳은 손, 잔잔한 미소",
    // 성격 및 내면
    성격: ["자비로움", "희생적", "고독함", "속죄의식"],
    약점: "과거에 대한 죄책감",
    목표: "코제트의 행복",
    특기: "초인적 완력, 정원 가꾸기",
    명대사: "사랑하는 것, 그것이 전부다",
    // 등장 정보
    등장: [
      "1권 2장 - 디뉴 마을",
      "1권 5장 - 몽트뢰유",
      "3권 8장 - 파리",
      "4권 12장 - 바리케이드",
      "5권 9장 - 코제트의 결혼",
    ],
    // 관계 정보
    관계: [
      "코제트 (양녀)",
      "자베르 (숙적)",
      "미리엘 주교 (은인)",
      "판틴 (약속)",
      "마리우스 (사위)",
    ],
  },
  "lm-002": {
    // 자베르 - 기본 정보
    나이: "약 50세",
    성별: "남성",
    직업: "경감",
    출생지: "감옥 (부모 모두 죄수)",
    // 외모 정보
    신장: "175cm",
    체격: "야위고 단단함",
    머리카락: "검은색, 짧게 정돈",
    눈: "날카롭고 차가운 시선",
    특징: "구레나룻, 경직된 표정",
    // 성격 및 내면
    성격: ["냉혹함", "정의감", "완고함", "흑백논리"],
    약점: "융통성 없음",
    목표: "법의 완벽한 집행",
    특기: "추적, 법률 지식, 변장",
    명대사: "법 앞에 예외는 없다",
    // 등장 정보
    등장: [
      "1권 2장 - 툴롱 감옥",
      "1권 7장 - 법정",
      "3권 5장 - 파리 추격",
      "4권 12장 - 바리케이드",
      "5권 4장 - 하수도",
    ],
    // 관계 정보
    관계: [
      "장발장 (숙적/추적 대상)",
      "테나르디에 (정보원)",
      "마리우스 (구출 대상)",
    ],
  },
};

function enrichCharacterWithMockData(character: Character): Character {
  const mockExtras = MOCK_EXTRAS[character._id];
  if (!mockExtras) return character;

  return {
    ...character,
    // Note: extras doesn't exist in new schema, keep as-is for demo compatibility
  };
}
export default function WorldPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // projectId is guaranteed to be string here
  const { data: characters = [] } = useCharacters(projectId || "", {
    enabled: !!projectId,
  });

  const updateCharacterMutation = useUpdateCharacter();

  const { setJobId, setAnalyzing } = useAnalysisBufferStore();

  const [, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [analysisDiff, setAnalysisDiff] = useState<AnalysisDiff | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Polling for analysis status (Global)
  const { isAnalyzing: isPollingRaw, analysisProgress: progress } =
    useProjectAnalysis(projectId ?? null, {
      onAnalysisComplete: (result) => {
        // 1. 분석 결과 저장 및 Diff 계산
        if (result) {
          console.log("Analysis completed, result:", result);
          const diff = calculateAnalysisDiff(characters, links, result);
          setAnalysisResult(result);
          setAnalysisDiff(diff);
          setIsAnalysisModalOpen(true);
        }

        // 2. 데이터 리프레시 (백엔드에 이미 반영되었을 수 있으므로)
        queryClient.invalidateQueries({
          queryKey: ["characters", "list", projectId],
        });
      },
    });

  // 캐릭터 데이터가 있어도 분석 중이면 로딩 표시 (취소 버튼이 있으므로 안전)
  const isPolling = isPollingRaw;

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
  const [selectedRelationship, setSelectedRelationship] =
    useState<DetailedRelationship | null>(null);

  const [relationTypeFilter, setRelationTypeFilter] = useState<
    UIRelationType | "all"
  >("all");

  const graphRef = useRef<CharacterGraphRef>(null);
  const [searchHighlightedIds, setSearchHighlightedIds] = useState<
    string[] | null
  >(null);

  // ESC Key Handler (Optimized)
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
    return updated ? enrichCharacterWithMockData(updated) : selectedCharacter;
  }, [characters, selectedCharacter]);

  // Character.relationships에서 관계 데이터 추출 (using hook)
  const links: RelationshipLink[] = useRelationshipLinks(characters);

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
    const enrichedChar = enrichCharacterWithMockData(character);
    const nextChar =
      selectedCharacter?._id === enrichedChar._id ? null : enrichedChar;
    setSelectedCharacter(nextChar);
    setGraphFocusId(nextChar?._id || null);

    // Sidebar will open because selectedCharacter is set
    // Modal will be opened manually from the sidebar's "View Profile" button
  };

  const handleCardClick = (character: Character) => {
    const enrichedChar = enrichCharacterWithMockData(character);
    setSelectedCharacter(enrichedChar);
    setGraphFocusId(enrichedChar._id);
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

    // Mock history data for 장발장-자베르 relationship
    const isJavertValjean =
      (sourceId === "lm-001" && targetId === "lm-002") ||
      (sourceId === "lm-002" && targetId === "lm-001");

    const mockHistory = isJavertValjean
      ? [
          {
            eventId: "1",
            title: "툴롱 감옥에서의 첫 만남",
            chapter: "1권 2장",
            type: "hostile" as const,
            reason:
              "교도관 자베르와 죄수 24601호의 관계. 자베르는 장발장을 근본적 악으로 규정하고 감시함.",
            date: "1815년",
          },
          {
            eventId: "2",
            title: "몽트뢰유 시장 시절",
            chapter: "1권 5장",
            type: "hostile" as const,
            reason:
              "마들렌 시장의 정체를 의심하며 집요하게 추적. 시장직 뒤에 숨은 과거를 파헤치려 함.",
            date: "1823년",
          },
          {
            eventId: "3",
            title: "법정에서의 자백",
            chapter: "1권 7장",
            type: "hostile" as const,
            reason:
              "장발장이 스스로 정체를 밝히고 자베르는 그를 다시 체포하려 함. 법 앞에 굴복하지 않는 장발장에 분노.",
            date: "1823년",
          },
          {
            eventId: "4",
            title: "바리케이드의 자비",
            chapter: "4권 12장",
            type: "friendly" as const,
            reason:
              "장발장이 스파이로 잡힌 자베르를 처형하지 않고 풀어줌. 자베르의 세계관에 균열이 시작됨.",
            date: "1832년 6월 5일",
          },
          {
            eventId: "5",
            title: "하수도에서의 해방",
            chapter: "5권 3장",
            type: "friendly" as const,
            reason:
              "자베르가 장발장을 체포하지 않고 석방함. 법과 자비 사이에서 갈등하다 결국 센 강에 투신.",
            date: "1832년 6월 6일",
          },
        ]
      : undefined;

    // Mock data enrichment based on user request example
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
      evolvedFrom: isJavertValjean ? "hostile" : link.evolvedFrom,
      since: isJavertValjean ? "1815년 툴롱 감옥" : link.since,
      history: mockHistory || link.history,
    };
    setSelectedRelationship(detailedRel);
  };

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 overflow-hidden relative">
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL LOADING OVERLAY (Shutter Animation)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPolling && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto overflow-hidden">
            {/* Top Shutter */}
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 left-0 w-full h-1/2 bg-[#FDFCFB] border-b border-stone-100" // Premium paper color
            />

            {/* Bottom Shutter */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-0 w-full h-1/2 bg-[#FDFCFB] border-t border-stone-100"
            />

            {/* Center Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full px-6"
            >
              {/* Logo / Spinner */}
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center relative z-10">
                  <Sparkles className="w-10 h-10 text-mocha-500 animate-pulse" />
                </div>
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-mocha-400 blur-2xl opacity-20 animate-pulse" />
              </div>

              <div className="text-center space-y-3">
                <h3 className="font-display text-3xl font-bold text-stone-800 tracking-tight">
                  세계관 분석 중...
                </h3>
                <p className="text-stone-500 font-sans text-base leading-relaxed">
                  AI가 본문을 읽고 캐릭터와 관계를 추출하고 있습니다.
                  <br />
                  <span className="text-mocha-600 font-bold text-lg mt-2 block">
                    {progress}%
                  </span>
                </p>
                <Progress
                  value={progress}
                  className="h-1.5 w-64 bg-stone-100 mx-auto rounded-full"
                />
              </div>

              {/* Cancel Button */}
              <Button
                variant="ghost"
                className="mt-4 text-stone-400 hover:text-red-500 hover:bg-white/50 transition-colors"
                onClick={() => {
                  if (
                    confirm(
                      "분석 상태가 멈췄거나 너무 오래 걸리나요?\n\n'확인'을 누르면 분석 상태를 초기화하고 결과를 새로고침합니다.",
                    )
                  ) {
                    setJobId(null);
                    setAnalyzing(false);
                    queryClient.invalidateQueries({
                      queryKey: ["characters", projectId],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["relationships", projectId],
                    });
                  }
                }}
              >
                <X className="w-4 h-4 mr-2" />
                분석 취소
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="graph" className="h-full flex flex-col relative">
        {/* Floating Glass Header - Fixed to Global Header Area */}
        <div className="fixed top-1 left-1/2 -translate-x-1/2 z-[60] px-2 py-1.5 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 shrink-0 scale-[0.8] origin-top">
          {/* Tab Navigation - Pill Style with borders */}
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger
              value="graph"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all"
            >
              <Network className="h-3.5 w-3.5" />
              관계도
            </TabsTrigger>
            <TabsTrigger
              value="characters"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all"
            >
              <UserRound className="h-3.5 w-3.5" />
              캐릭터
            </TabsTrigger>
            <TabsTrigger
              value="places"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all"
            >
              <MapPin className="h-3.5 w-3.5" />
              장소
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all"
            >
              <Sword className="h-3.5 w-3.5" />
              아이템
            </TabsTrigger>
            <TabsTrigger
              value="foreshadowing"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              복선
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Character Graph - D3.js (Full Bleed) */}
        <TabsContent
          value="graph"
          className="flex-1 m-0 overflow-hidden relative bg-stone-50"
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
                    <div className="relative flex-[7] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
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
                    <div className="flex-[3] p-4 bg-white flex flex-col justify-center border-t border-stone-100">
                      <h3 className="editorial-name text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {character.profile?.name ||
                          (character as { name?: string }).name ||
                          "이름 없음"}
                      </h3>
                      {(character.profile?.backstory ||
                        (character as { backstory?: string }).backstory) && (
                        <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
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
                  <MapPin className="h-5 w-5 text-primary/70" />
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="editorial-name text-base group-hover:text-primary transition-colors">
                            {place.name}
                          </h3>
                          <p className="text-xs text-stone-400 mt-1">
                            {place.type}
                          </p>
                          <div className="flex items-center gap-1 mt-3">
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                              등장
                            </span>
                            <div className="flex gap-1">
                              {place.chapters.map((ch) => (
                                <span
                                  key={ch}
                                  className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600"
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
                  <Sword className="h-5 w-5 text-primary/70" />
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
                          <p className="text-xs text-stone-400 mt-1">
                            {item.type}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                              소유자
                            </span>
                            <span className="text-xs font-medium text-stone-600">
                              {item.owner}
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
              selectedRelationship?.source,
          )?.profile?.name ||
          (
            characters.find(
              (c) =>
                (c._id || (c as { id?: string }).id) ===
                selectedRelationship?.source,
            ) as { name?: string }
          )?.name ||
          selectedRelationship?.source
        }
        targetName={
          characters.find(
            (c) =>
              (c._id || (c as { id?: string }).id) ===
              selectedRelationship?.target,
          )?.profile?.name ||
          (
            characters.find(
              (c) =>
                (c._id || (c as { id?: string }).id) ===
                selectedRelationship?.target,
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
            setAnalysisResult(null);
            setAnalysisDiff(null);
          }}
          diff={analysisDiff}
        />
      )}
    </div>
  );
}
