import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Sword } from "lucide-react";
import CharacterDetailModal from "@/components/common/CharacterDetailModal";
import type { Character, RelationType, RelationshipLink } from "@/types";
import type { RelationshipType } from "@/services/relationshipService";
import { roleLabels } from "./constants";

// D3 CharacterGraph
import { CharacterGraph } from "@/components/CharacterGraph";

// Hooks
import { useCharacters } from "@/hooks/useCharacters";
import { useRelationships } from "@/hooks/useRelationships";

// Components
import { NetworkControlsD3 } from "./components/NetworkControlsD3";
import { NetworkDetailPanelD3 } from "./components/NetworkDetailPanelD3";

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

/**
 * 백엔드 RelationshipType → 프론트 RelationType 변환
 */
function mapRelationshipType(backendType: RelationshipType): RelationType {
  switch (backendType) {
    case "friendly":
      return "friend";
    case "romantic":
      return "lover";
    case "hostile":
      return "enemy";
    case "family":
      return "friend"; // 가족도 친구 관계로 분류
    case "neutral":
    default:
      return "friend"; // 중립도 일단 friend로
  }
}

/**
 * 백엔드 데이터 구조를 유연하게 받기 위한 인터페이스
 */
interface RawRelationship {
  id?: string;
  sourceId?: string;
  targetId?: string;
  source?: { id: string; name?: string };
  target?: { id: string; name?: string };
  relationships?: RawRelationship[]; // Character에 포함된 경우
  type?: string;
  strength?: number;
  description?: string;
  extras?: { description?: string };
  [key: string]: unknown;
}

export default function WorldPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [relationTypeFilter, setRelationTypeFilter] = useState<
    RelationType | "all"
  >("all");

  // Fetch Characters & Relationships from API
  const { data: characters = [], isLoading: isLoadingCharacters } =
    useCharacters(projectId || "", { enabled: !!projectId });

  // 백엔드가 /relationships 엔드포인트에서 Character[] 배열 또는 Relationship[] 배열을 리턴할 수 있음
  const { data: rawData = [], isLoading: isLoadingRelationships } =
    useRelationships(projectId || "", { enabled: !!projectId });

  const charactersWithRelationships = rawData as unknown as RawRelationship[];

  // ESC 키로 선택 해제
  useEffect(() => {
    if (!selectedCharacter) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCharacter(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCharacter]);

  // Character.relationships에서 관계 데이터 추출 (백엔드 응답 구조 수정 필요)
  const links: RelationshipLink[] = useMemo(() => {
    const characterIds = new Set(characters.map((c) => c.id));
    const allLinks: RelationshipLink[] = [];
    const processedPairs = new Set<string>(); // 중복 방지

    console.log("🔍 Characters Count:", characters.length);
    console.log("🔍 Data Source Count:", charactersWithRelationships.length);

    // 각 캐릭터의 relationships 배열을 순회
    // 만약 charactersWithRelationships가 Relationship[] 배열인 경우도 고려하여 처리
    if (Array.isArray(charactersWithRelationships)) {
      charactersWithRelationships.forEach((item: RawRelationship) => {
        // Case 1: item이 Character이고 그 안에 relationships가 있는 경우
        if (item.relationships && Array.isArray(item.relationships)) {
          const sourceId = item.id;
          if (sourceId) {
            item.relationships.forEach((rel) => {
              const targetId = rel.targetId || rel.target?.id;
              if (targetId) processRel(sourceId, targetId, rel);
            });
          }
        }
        // Case 2: item 자체가 Relationship인 경우
        else {
          const sourceId = item.sourceId || item.source?.id;
          const targetId = item.targetId || item.target?.id;
          if (sourceId && targetId) {
            processRel(sourceId, targetId, item);
          }
        }
      });
    }

    function processRel(
      sourceId: string,
      targetId: string,
      rel: RawRelationship,
    ) {
      if (!sourceId || !targetId) {
        console.warn(`❌ Missing ID in relationship:`, {
          sourceId,
          targetId,
          rel,
        });
        return;
      }

      if (!characterIds.has(sourceId) || !characterIds.has(targetId)) {
        // 가끔 백엔드에서 삭제된 캐릭터의 관계가 남아있을 수 있음
        return;
      }

      const relType = (rel.type || "friendly") as RelationshipType;
      const strength = rel.strength || 5;

      // 양방향 중복 방지 (A-B와 B-A를 같은 것으로 취급)
      const pairKey =
        sourceId < targetId
          ? `${sourceId}-${targetId}`
          : `${targetId}-${sourceId}`;

      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      allLinks.push({
        id: rel.id || `${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: mapRelationshipType(relType),
        strength,
        label: rel.description || rel.extras?.description,
      });
    }

    console.log("✅ Valid links mapped:", allLinks.length);
    return allLinks;
  }, [charactersWithRelationships, characters]);

  const handleNodeClick = (character: Character) => {
    setSelectedCharacter((prev) =>
      prev?.id === character.id ? null : character,
    );
  };

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  // 로딩 상태 처리
  const isLoading = isLoadingCharacters || isLoadingRelationships;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            캐릭터 및 관계 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Tabs defaultValue="graph" className="h-full flex flex-col">
        <div className="px-4 py-2 border-b bg-paper">
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
          </TabsList>
        </div>

        {/* Character Graph - D3.js */}
        <TabsContent value="graph" className="flex-1 m-0">
          <div className="h-full relative">
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
              selectedNodeId={selectedCharacter?.id || null}
              relationTypeFilter={relationTypeFilter}
            />
          </div>
        </TabsContent>

        {/* Characters List */}
        <TabsContent
          value="characters"
          className="flex-1 m-0 p-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <Card
                key={character.id}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleCardClick(character)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {character.imageUrl ? (
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="w-full h-full object-cover grayscale opacity-90 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                        />
                      </div>
                    ) : (
                      <span className="text-3xl flex items-center justify-center w-12 h-12 bg-stone-50 rounded-full">
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
                    <p className="text-xs text-sage-500">
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
        <TabsContent value="places" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="space-y-2">
            {places.map((place) => (
              <Card key={place.id} className="cursor-pointer hover:bg-stone-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-sage-500" />
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
        <TabsContent value="items" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:bg-stone-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sword className="h-5 w-5 text-sage-500" />
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
      </Tabs>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {}} // Read-only in this view for now
      />
    </div>
  );
}
