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
    null,
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

  const handleNodeClick = (character: Character) => {
    const nextChar = selectedCharacter?.id === character.id ? null : character;
    setSelectedCharacter(nextChar);
    setGraphFocusId(nextChar?.id || null);
  };

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setGraphFocusId(character.id);
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
      evolved_from: link.evolved_from,
      since: link.since,
      history: link.history,
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
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
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
