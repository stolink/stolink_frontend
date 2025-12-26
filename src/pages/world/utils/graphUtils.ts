import type { Node, Edge } from "reactflow";
import type { Character } from "@/types";
import { type RelationType, relationshipColors } from "../constants";

// 노드 위치 계산 (Force-directed 스타일 - 반발력 적용)
export const generateNodePositions = (characters: Character[]) => {
  const centerX = 800;
  const centerY = 500;

  // 더 넓은 간격으로 스파이럴 배치 (옵시디언 스타일)
  return characters.map((char, index) => {
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

// 관계 데이터 파싱 및 엣지 생성
export const generateEdgesFromData = (characters: Character[]) => {
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

  characters.forEach((sourceChar) => {
    const relationships = sourceChar.extras?.["관계"] as string[] | undefined;
    if (!relationships) return;

    relationships.forEach((relStr) => {
      // '이름 (관계)' 파싱
      const match = relStr.match(/^(.+?)\s*\((.+?)\)$/);
      if (!match) return;

      const targetName = match[1].trim();
      const relationLabel = match[2].trim();

      const targetChar = characters.find(
        (c) =>
          c.name.includes(targetName) ||
          targetName.includes(c.name.split(" ")[0])
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

// 포커스된 노드와 연결된 노드 ID 계산
export const getConnectedNodeIds = (
  nodes: Node[],
  edges: Edge[],
  nodeId: string,
  relType: RelationType | "all"
) => {
  const connectedIds = new Set<string>([nodeId]);

  edges.forEach((edge) => {
    const edgeType = edge.data?.type as RelationType;
    const matchesType = relType === "all" || edgeType === relType;

    if (matchesType) {
      if (edge.source === nodeId) connectedIds.add(edge.target);
      if (edge.target === nodeId) connectedIds.add(edge.source);
    }
  });

  return connectedIds;
};
