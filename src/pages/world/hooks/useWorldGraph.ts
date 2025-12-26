import { useState, useCallback, useEffect } from "react";
import { useNodesState, useEdgesState, type Node, type Edge } from "reactflow";
import type { Character } from "@/types";
import { type RelationType } from "../constants";
import {
  generateNodePositions,
  generateEdgesFromData,
  getConnectedNodeIds,
} from "../utils/graphUtils";

export function useWorldGraph(characters: Character[]) {
  // 초기 데이터 생성
  const initialPositions = generateNodePositions(characters);
  const initialNodesData: Node[] = characters.map((char, index) => ({
    id: char.id,
    type: "character",
    position: initialPositions[index],
    data: {
      ...char,
      image: char.imageUrl,
    },
  }));
  const initialEdgesData: Edge[] = generateEdgesFromData(characters);

  // ReactFlow 상태
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);

  // 필터링 상태
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [relationTypeFilter, setRelationTypeFilter] = useState<
    RelationType | "all"
  >("all");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );

  // 필터링 효과 적용
  useEffect(() => {
    if (!focusedNodeId) {
      // 필터 해제 - 모든 노드 원래 상태로
      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          data: { ...node.data, dimmed: false, highlighted: false },
        }))
      );
      setEdges((edges) =>
        edges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            strokeOpacity: edge.data?.type === "neutral" ? 0.4 : 0.6,
            strokeWidth: edge.source === "1" || edge.target === "1" ? 1.5 : 1,
          },
        }))
      );
      return;
    }

    const connectedIds = getConnectedNodeIds(
      nodes,
      edges,
      focusedNodeId,
      relationTypeFilter
    );

    // 노드 업데이트
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          dimmed: !connectedIds.has(node.id),
          highlighted: node.id === focusedNodeId,
        },
      }))
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
      })
    );
  }, [
    focusedNodeId,
    relationTypeFilter,
    setNodes,
    setEdges,
    // dependencies minimized
  ]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // 이미 포커스된 노드 클릭시 해제
      if (focusedNodeId === node.id) {
        setFocusedNodeId(null);
        return;
      }

      setFocusedNodeId(node.id);

      const character = characters.find((c) => c.id === node.id);
      if (character) {
        setSelectedCharacter(character);
      }
    },
    [focusedNodeId, characters]
  );

  const clearFilter = useCallback(() => {
    setFocusedNodeId(null);
    setRelationTypeFilter("all");
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    focusedNodeId,
    setFocusedNodeId,
    relationTypeFilter,
    setRelationTypeFilter,
    selectedCharacter,
    setSelectedCharacter,
    handleNodeClick,
    clearFilter,
  };
}
