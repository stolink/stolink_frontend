import { useState } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Sword } from "lucide-react";
import CharacterDetailModal from "@/components/common/CharacterDetailModal";
import type { Character } from "@/types";
import { DEMO_CHARACTERS } from "@/data/demoData";
import { roleLabels } from "./constants";

// Components & Hooks
import { CharacterNode } from "./components/CharacterNode";
import { NetworkControls } from "./components/NetworkControls";
import { NetworkDetailPanel } from "./components/NetworkDetailPanel";
import { useWorldGraph } from "./hooks/useWorldGraph";

const nodeTypes = {
  character: CharacterNode,
};

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

export default function WorldPage() {
  const [characters] = useState<Character[]>(DEMO_CHARACTERS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Graph Logic Hook
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    relationTypeFilter,
    setRelationTypeFilter,
    selectedCharacter,
    setSelectedCharacter,
    handleNodeClick,
    clearFilter,
  } = useWorldGraph(characters);

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

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

        {/* Character Graph */}
        <TabsContent value="graph" className="flex-1 m-0">
          <div className="h-full relative">
            {/* Controls & Legend */}
            <NetworkControls
              relationTypeFilter={relationTypeFilter}
              onFilterChange={setRelationTypeFilter}
            />

            {/* Detail Sidebar */}
            <NetworkDetailPanel
              selectedCharacter={selectedCharacter}
              characters={characters}
              edges={edges}
              onClose={() => setSelectedCharacter(null)}
              onViewProfile={() => setIsModalOpen(true)}
            />

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={clearFilter}
              nodeTypes={nodeTypes}
              fitView
              className="bg-white"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            >
              <Controls className="!bottom-20 !left-auto !right-4" />
              <Background color="#e2e8f0" gap={40} size={1} />
            </ReactFlow>
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
            ))}{" "}
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
