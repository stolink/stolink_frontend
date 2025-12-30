import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Sword, Sparkles } from "lucide-react";
import CharacterDetailModal from "@/components/common/CharacterDetailModal";
import { RelationshipDetailSheet } from "@/components/CharacterGraph/RelationshipDetailSheet";
import type {
  Character,
  RelationType,
  RelationshipLink,
  DetailedRelationship,
  CharacterNode,
} from "@/types";
import { roleLabels } from "./constants";

// D3 CharacterGraph
import {
  CharacterGraph,
  type CharacterGraphRef,
} from "@/components/CharacterGraph";
import { CharacterSearchOverlay } from "@/components/CharacterGraph/CharacterSearchOverlay";

// Hooks
import { useCharacters } from "@/hooks/useCharacters";

// Utils
// extractRelationshipLinks removed (replaced by useRelationshipLinks hook)

// Components
import { NetworkControlsD3 } from "./components/NetworkControlsD3";
import { NetworkDetailPanelD3 } from "./components/NetworkDetailPanelD3";
import { ForeshadowingPanel } from "./components/ForeshadowingPanel";

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

export default function WorldPage() {
  const { id: projectId } = useParams<{ id: string }>();

  // Fetch Characters
  // projectId is guaranteed to be string here
  const { data: characters = [], isLoading } = useCharacters(projectId || "", {
    enabled: !!projectId,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  // 그래프 하이라이팅용 경량 상태 (즉시 반응)
  const [graphFocusId, setGraphFocusId] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<DetailedRelationship | null>(null);

  const [relationTypeFilter, setRelationTypeFilter] = useState<
    RelationType | "all"
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

  const enrichCharacterWithMockData = (character: Character): Character => {
    const mockExtras = MOCK_EXTRAS[character.id];
    if (!mockExtras) return character;

    return {
      ...character,
      extras: {
        ...character.extras,
        ...mockExtras,
      },
    };
  };

  const handleNodeClick = (character: Character) => {
    const enrichedChar = enrichCharacterWithMockData(character);
    const nextChar =
      selectedCharacter?.id === enrichedChar.id ? null : enrichedChar;
    setSelectedCharacter(nextChar);
    setGraphFocusId(nextChar?.id || null);
  };

  const handleCardClick = (character: Character) => {
    const enrichedChar = enrichCharacterWithMockData(character);
    setSelectedCharacter(enrichedChar);
    setGraphFocusId(enrichedChar.id);
    setIsModalOpen(true);
  };

  const handleLinkClick = (link: RelationshipLink) => {
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
      relation_type: link.type,
      strength: link.strength,

      // Use mapped data from link (originally from DB)
      description: link.description,
      bidirectional: link.bidirectional,
      evolved_from: isJavertValjean ? "hostile" : link.evolved_from,
      since: isJavertValjean ? "1815년 툴롱 감옥" : link.since,
      history: mockHistory || link.history,
    };
    setSelectedRelationship(detailedRel);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            캐릭터 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  const handleSearchSelect = async (character: Character) => {
    // 1. 그래프 하이라이팅 즉시 적용 (가벼움)
    setGraphFocusId(character.id);

    // React 렌더링과 D3 애니메이션이 겹치지 않도록 프레임 분리 (Double RAF)
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    // 2. 줌 애니메이션 실행 (부하 없음 - 리렌더링 최소화 상태)
    if (graphRef.current) {
      await graphRef.current.focusNode(character.id);
    }

    // 3. 애니메이션 종료 후 상세 패널 표시 (무거운 리렌더링 지연)
    setSelectedCharacter(character);
  };

  return (
    <div className="h-full w-full flex flex-col bg-paper">
      <Tabs defaultValue="graph" className="h-full flex flex-col">
        {/* Tab Header */}
        <div className="px-6 py-3 border-b bg-white shrink-0">
          <TabsList>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              캐릭터 관계도
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              캐릭터 목록
            </TabsTrigger>
            <TabsTrigger value="places" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              장소
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              아이템
            </TabsTrigger>
            <TabsTrigger
              value="foreshadowing"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              복선
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Character Graph - D3.js */}
        <TabsContent value="graph" className="flex-1 m-0 overflow-hidden">
          <div className="h-full w-full relative">
            {/* Search Overlay */}
            <CharacterSearchOverlay
              characters={characters}
              onSelect={handleSearchSelect}
              onSearch={setSearchHighlightedIds}
            />

            {/* Controls & Legend */}
            <NetworkControlsD3
              relationTypeFilter={relationTypeFilter}
              onFilterChange={setRelationTypeFilter}
            />

            {/* Detail Sidebar */}
            <NetworkDetailPanelD3
              selectedCharacter={selectedCharacter}
              characters={characters}
              links={links}
              onClose={() => setSelectedCharacter(null)}
              onViewProfile={() => setIsModalOpen(true)}
            />

            {/* D3 CharacterGraph */}
            <CharacterGraph
              characters={characters}
              links={links}
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              selectedNodeId={graphFocusId || selectedCharacter?.id || null}
              relationTypeFilter={relationTypeFilter}
              highlightedNodeIds={searchHighlightedIds}
              ref={graphRef}
            />
          </div>
        </TabsContent>

        {/* Characters List */}
        <TabsContent value="characters" className="flex-1 m-0 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {characters.map((character) => (
              <Card
                key={character.id}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleCardClick(character)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {character.imageUrl ? (
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-input bg-muted shrink-0">
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="w-full h-full object-cover grayscale opacity-90 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                        />
                      </div>
                    ) : (
                      <span className="text-3xl flex items-center justify-center w-12 h-12 bg-cloud-50 rounded-full">
                        {character.role === "protagonist"
                          ? "🦸"
                          : character.role === "antagonist"
                            ? "🦹"
                            : character.role === "mentor"
                              ? "🧙"
                              : "👤"}
                      </span>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {character.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {roleLabels[character.role || "other"]}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {Object.entries(character.extras || {})
                    .slice(0, 2)
                    .map(([key, value]) => (
                      <p key={key}>
                        {key}: {String(value)}
                      </p>
                    ))}
                  {Object.keys(character.extras || {}).length > 2 && (
                    <p className="text-xs text-mocha-500">
                      +{Object.keys(character.extras || {}).length - 2}개 항목
                      더보기
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Places */}
        <TabsContent value="places" className="flex-1 m-0 overflow-y-auto">
          <div className="p-6 space-y-2 max-w-4xl mx-auto">
            {places.map((place) => (
              <Card key={place.id} className="cursor-pointer hover:bg-cloud-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-mocha-500" />
                    <div>
                      <p className="font-medium">{place.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {place.type}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    등장: {place.chapters.join(", ")}장
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Items */}
        <TabsContent value="items" className="flex-1 m-0 overflow-y-auto">
          <div className="p-6 space-y-2 max-w-4xl mx-auto">
            {items.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:bg-cloud-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sword className="h-5 w-5 text-mocha-500" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    소유: {item.owner}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Foreshadowing */}
        <TabsContent value="foreshadowing" className="flex-1 m-0">
          <ForeshadowingPanel projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {}} // Read-only in this view for now
      />

      {/* Relationship Detail Sidebar */}
      <RelationshipDetailSheet
        relationship={selectedRelationship}
        isOpen={!!selectedRelationship}
        onClose={() => setSelectedRelationship(null)}
        sourceName={
          characters.find((c) => c.id === selectedRelationship?.source)?.name ||
          selectedRelationship?.source
        }
        targetName={
          characters.find((c) => c.id === selectedRelationship?.target)?.name ||
          selectedRelationship?.target
        }
      />
    </div>
  );
}
