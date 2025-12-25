import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "reactflow";
import type { Node, Edge, NodeProps } from "reactflow";
import "reactflow/dist/style.css";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  MapPin,
  Sword,
  X,
  ZoomIn,
  ZoomOut,
  Save,
  Filter,
} from "lucide-react";
import CharacterDetailModal from "@/components/common/CharacterDetailModal";
import type { Character, CharacterRole } from "@/types";
import { cn } from "@/lib/utils";
import { DEMO_CHARACTERS } from "@/data/demoData";

// 관계 타입 정의
type RelationType =
  | "friendship"
  | "conflict"
  | "romance"
  | "family"
  | "neutral";

const relationshipColors: Record<RelationType, string> = {
  friendship: "#22c55e", // 초록
  conflict: "#ef4444", // 빨강
  romance: "#ec4899", // 핑크
  family: "#1f2937", // 검정
  neutral: "#9ca3af", // 회색 (점선용)
};

const relationshipLabels: Record<RelationType, string> = {
  friendship: "우정",
  conflict: "갈등",
  romance: "로맨스",
  family: "가족",
  neutral: "중립",
};

// Custom Character Node - reference 디자인 반영
function CharacterNode({ data, selected }: NodeProps) {
  const isProtagonist = data.role === "protagonist";
  const isDimmed = data.dimmed; // 필터링 시 블러 처리
  const isHighlighted = data.highlighted; // 필터링 시 하이라이트

  // 역할별 노드 크기
  const nodeSize = isProtagonist ? "w-24 h-24" : "w-16 h-16";
  const avatarPx = isProtagonist ? 96 : 64; // px 값

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center gap-2 transition-all duration-300",
        isDimmed && "opacity-20 blur-[1px] pointer-events-none",
        isHighlighted && "scale-110",
      )}
    >
      {/* 원형 아바타 */}
      <div
        className={cn(
          "relative rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer",
          nodeSize,
          isProtagonist
            ? "border-4 border-blue-500 shadow-xl hover:scale-105"
            : "border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:scale-105",
          selected && "ring-4 ring-blue-300",
          isHighlighted &&
            "ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]",
        )}
      >
        {/* Handles 위치를 아바타 중심에 맞춤 */}
        <Handle
          type="target"
          position={Position.Left}
          className="!opacity-0 !w-2 !h-2"
          style={{ left: -4, top: avatarPx / 2 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!opacity-0 !w-2 !h-2"
          style={{ right: -4, top: avatarPx / 2 }}
        />

        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              !isHighlighted &&
                "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100",
              isHighlighted && "grayscale-0 opacity-100",
            )}
          />
        ) : (
          <span
            className={cn(
              "transition-all",
              isProtagonist ? "text-3xl" : "text-2xl",
            )}
          >
            {data.role === "protagonist"
              ? "🦸"
              : data.role === "antagonist"
                ? "🦹"
                : data.role === "mentor"
                  ? "🧙"
                  : "👤"}
          </span>
        )}
      </div>

      {/* 이름 라벨 */}
      <div
        className={cn(
          "whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold shadow-md",
          isProtagonist
            ? "bg-slate-900 text-white tracking-wide"
            : "bg-white text-slate-800 border border-slate-200",
          isHighlighted && "bg-yellow-400 text-slate-900 border-yellow-500",
        )}
      >
        {data.name}
      </div>
    </div>
  );
}

const nodeTypes = {
  character: CharacterNode,
};

const roleLabels: Record<CharacterRole, string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  supporting: "조연",
  mentor: "멘토",
  sidekick: "조력자",
  other: "기타",
};

// 100개의 더미 캐릭터 생성
// 100개 캐릭터 생성 로직 제거 -> DEMO_CHARACTERS 사용

// 노드 위치 계산 (Force-directed 스타일 - 반발력 적용)
const generateNodePositions = () => {
  const centerX = 800;
  const centerY = 500;

  // 더 넓은 간격으로 스파이럴 배치 (옵시디언 스타일)
  return DEMO_CHARACTERS.map((char, index) => {
    if (index === 0) {
      // 주인공은 중앙에
      return { x: centerX, y: centerY };
    }

    // 황금 각도 스파이럴 배치 (균등 분포)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 137.5도
    const angle = index * goldenAngle;
    const radius = Math.sqrt(index) * 150; // 간격 늘림

    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
};

const nodePositions = generateNodePositions();

const initialNodes: Node[] = DEMO_CHARACTERS.map((char, index) => ({
  id: char.id,
  type: "character",
  position: nodePositions[index],
  data: {
    ...char,
    image: char.imageUrl, // CharacterNode에서 사용하는 image prop 대응
  },
}));

// 관계 데이터 파싱 및 엣지 생성
const generateEdgesFromData = () => {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  const getRelationType = (relString: string): RelationType => {
    if (
      relString.includes("적대자") ||
      relString.includes("원수") ||
      relString.includes("질투") ||
      relString.includes("추적")
    )
      return "conflict";
    if (
      relString.includes("연인") ||
      relString.includes("짝사랑") ||
      relString.includes("사랑")
    )
      return "romance";
    if (
      relString.includes("아버지") ||
      relString.includes("딸") ||
      relString.includes("어머니") ||
      relString.includes("자매") ||
      relString.includes("아들") ||
      relString.includes("사위") ||
      relString.includes("장인")
    )
      return "family";
    if (
      relString.includes("동료") ||
      relString.includes("은인") ||
      relString.includes("구원") ||
      relString.includes("제자") ||
      relString.includes("멘토") ||
      relString.includes("동지")
    )
      return "friendship";
    return "neutral";
  };

  DEMO_CHARACTERS.forEach((sourceChar) => {
    const relationships = sourceChar.extras?.["관계"] as string[] | undefined;
    if (!relationships) return;

    relationships.forEach((relStr) => {
      // '이름 (관계)' 파싱
      const match = relStr.match(/^(.+?)\s*\((.+?)\)$/);
      if (!match) return;

      const targetName = match[1].trim();
      const relationLabel = match[2].trim();

      const targetChar = DEMO_CHARACTERS.find(
        (c) =>
          c.name.includes(targetName) ||
          targetName.includes(c.name.split(" ")[0]),
      ); // 이름 매칭 (간단히)

      if (targetChar) {
        // 엣지 중복 방지 (양방향 하나만)
        const sId = sourceChar.id;
        const tId = targetChar.id;
        const edgeKey = sId < tId ? `${sId}-${tId}` : `${tId}-${sId}`;

        if (edgeSet.has(edgeKey)) return;
        edgeSet.add(edgeKey);

        const relType = getRelationType(relationLabel);

        edges.push({
          id: `e-${sId}-${tId}`,
          source: sId,
          target: tId,
          type: "default",
          style: {
            stroke: relationshipColors[relType],
            strokeWidth: 2,
            strokeOpacity: 0.7,
            strokeDasharray: relType === "neutral" ? "3 3" : undefined,
          },
          data: { type: relType, label: relationLabel },
        });
      }
    });
  });

  return edges;
};

const initialEdges: Edge[] = generateEdgesFromData();

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [characters] = useState<Character[]>(DEMO_CHARACTERS);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 필터링 상태
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [relationTypeFilter, setRelationTypeFilter] = useState<
    RelationType | "all"
  >("all");

  // 포커스된 노드와 연결된 노드 ID 계산
  const getConnectedNodeIds = useCallback(
    (nodeId: string, relType: RelationType | "all") => {
      const connectedIds = new Set<string>([nodeId]);

      initialEdges.forEach((edge) => {
        const edgeType = edge.data?.type as RelationType;
        const matchesType = relType === "all" || edgeType === relType;

        if (matchesType) {
          if (edge.source === nodeId) connectedIds.add(edge.target);
          if (edge.target === nodeId) connectedIds.add(edge.source);
        }
      });

      return connectedIds;
    },
    [],
  );

  // 필터링 적용
  useEffect(() => {
    if (!focusedNodeId) {
      // 필터 해제 - 모든 노드 원래 상태로
      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          data: { ...node.data, dimmed: false, highlighted: false },
        })),
      );
      setEdges((edges) =>
        edges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            strokeOpacity: edge.data?.type === "neutral" ? 0.4 : 0.6,
            strokeWidth: edge.source === "1" || edge.target === "1" ? 1.5 : 1,
          },
        })),
      );
      return;
    }

    const connectedIds = getConnectedNodeIds(focusedNodeId, relationTypeFilter);

    // 노드 업데이트
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          dimmed: !connectedIds.has(node.id),
          highlighted: node.id === focusedNodeId,
        },
      })),
    );

    // 엣지 업데이트
    setEdges((edges) =>
      edges.map((edge) => {
        const edgeType = edge.data?.type as RelationType;
        const matchesType =
          relationTypeFilter === "all" || edgeType === relationTypeFilter;
        const isConnected =
          (edge.source === focusedNodeId || edge.target === focusedNodeId) &&
          matchesType;

        return {
          ...edge,
          style: {
            ...edge.style,
            strokeOpacity: isConnected ? 1 : 0.1,
            strokeWidth: isConnected ? 2.5 : 0.5,
          },
        };
      }),
    );
  }, [
    focusedNodeId,
    relationTypeFilter,
    getConnectedNodeIds,
    setNodes,
    setEdges,
  ]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    // 이미 포커스된 노드 클릭시 해제
    if (focusedNodeId === node.id) {
      setFocusedNodeId(null);
      return;
    }

    setFocusedNodeId(node.id);

    const character = DEMO_CHARACTERS.find((c) => c.id === node.id);
    if (character) {
      setSelectedCharacter(character);
    }
  };

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const clearFilter = useCallback(() => {
    setFocusedNodeId(null);
    setRelationTypeFilter("all");
  }, []);

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
            {/* 좌측 컨트롤 패널 */}
            <div className="absolute left-4 top-4 z-10 bg-white rounded-lg border shadow-sm p-3 space-y-3">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Controls
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-stone-600">100%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8"
                  >
                    <Filter className="h-4 w-4" />
                    Filter View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuRadioGroup
                    value={relationTypeFilter}
                    onValueChange={(v) =>
                      setRelationTypeFilter(v as RelationType | "all")
                    }
                  >
                    <DropdownMenuRadioItem value="all">
                      모든 관계
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="friendship">
                      우호적 (초록)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="conflict">
                      적대적 (빨강)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="romance">
                      로맨스 (핑크)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="family">
                      가족 (검정)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="neutral">
                      중립 (회색)
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8"
              >
                <Save className="h-4 w-4" />
                Save Layout
              </Button>
            </div>

            {/* 하단 범례 */}
            <div className="absolute left-4 bottom-4 z-10 bg-white rounded-lg border shadow-sm p-3">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Relationship Legend
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-green-500" />
                  <span>{relationshipLabels.friendship}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-red-500" />
                  <span>{relationshipLabels.conflict}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-pink-500" />
                  <span>{relationshipLabels.romance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-stone-800" />
                  <span>{relationshipLabels.family}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-stone-400" />
                  <span>{relationshipLabels.neutral}</span>
                </div>
              </div>
            </div>

            {/* 우측 상세 패널 (선택된 캐릭터가 있을 때) */}
            {selectedCharacter && (
              <div className="absolute right-4 top-4 bottom-4 w-72 z-10 bg-white rounded-lg border shadow-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-2xl border-2 border-stone-200">
                      {selectedCharacter.role === "protagonist"
                        ? "🦸"
                        : selectedCharacter.role === "antagonist"
                          ? "🦹"
                          : selectedCharacter.role === "mentor"
                            ? "🧙"
                            : "👤"}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedCharacter.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {roleLabels[selectedCharacter.role || "other"]}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedCharacter(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 border-b">
                  <div className="flex justify-around text-center">
                    <div>
                      <div className="text-2xl font-bold text-stone-800">
                        {
                          edges.filter(
                            (e) =>
                              e.source === selectedCharacter.id ||
                              e.target === selectedCharacter.id,
                          ).length
                        }
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        Connections
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-stone-800">
                        12
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        Scenes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Direct Links</h4>
                  </div>
                  <ul className="space-y-2">
                    {edges
                      .filter(
                        (e) =>
                          e.source === selectedCharacter.id ||
                          e.target === selectedCharacter.id,
                      )
                      .map((edge) => {
                        const otherId =
                          edge.source === selectedCharacter.id
                            ? edge.target
                            : edge.source;
                        const otherChar = characters.find(
                          (c) => c.id === otherId,
                        );
                        const relType =
                          (edge.data?.type as RelationType) || "neutral";
                        return (
                          <li
                            key={edge.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50"
                          >
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm">
                              {otherChar?.role === "antagonist"
                                ? "🦹"
                                : otherChar?.role === "mentor"
                                  ? "🧙"
                                  : "👤"}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {otherChar?.name}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: relationshipColors[relType] }}
                              >
                                • {relationshipLabels[relType]}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsModalOpen(true)}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            )}

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
                    소유자: {item.owner}
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
      />
    </div>
  );
}
