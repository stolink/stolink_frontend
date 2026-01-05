/**
 * 나무 SVG 렌더링 컴포넌트
 * - 수묵화 스타일 트렁크와 가지
 * - 과일처럼 매달린 사건 노드
 */
import { createElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TreeStructure, Branch } from "@/types/biography";
import { getImportanceLevel } from "@/types/biography";
import { getEventTypeIcon, getEventTypeConfig, INK_COLORS } from "./constants";
import { cn } from "@/lib/utils";

interface BiographyTreeRendererProps {
  tree: TreeStructure & { dynamicWidth?: number };
  selectedEventId: string | null;
  onNodeClick: (eventId: string) => void;
}

const branchVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.8 + index * 0.08,
      ease: "easeOut" as const,
    },
  }),
};

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (delay: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay,
    },
  }),
};

export function BiographyTreeRenderer({
  tree,
  selectedEventId,
  onNodeClick,
}: BiographyTreeRendererProps) {
  const { trunk, branches } = tree;

  return (
    <g>
      {/* 트렁크 (수평으로 뻗는 나무 몸통) */}
      <motion.path
        d={trunk.path}
        fill="url(#trunk-gradient)"
        stroke={INK_COLORS.dark}
        strokeWidth={1}
        strokeOpacity={0.4}
        filter="url(#ink-wash-heavy)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* 트렁크 질감 */}
      <motion.path
        d={trunk.path}
        fill="url(#bark-texture)"
        fillOpacity={0.15}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      {/* 가지들 */}
      <AnimatePresence>
        {branches.map((branch, index) => (
          <BranchWithFruit
            key={branch.id}
            branch={branch}
            index={index}
            isSelected={selectedEventId === branch.node.id}
            onNodeClick={onNodeClick}
          />
        ))}
      </AnimatePresence>

      {/* 뿌리 장식 */}
      <motion.g
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <ellipse
          cx={trunk.startX - 5}
          cy={trunk.startY + 20}
          rx={18}
          ry={30}
          fill={INK_COLORS.dark}
          opacity={0.5}
          filter="url(#ink-shadow)"
        />
        <ellipse
          cx={trunk.startX}
          cy={trunk.startY - 15}
          rx={12}
          ry={22}
          fill={INK_COLORS.dark}
          opacity={0.4}
          filter="url(#ink-shadow)"
        />
      </motion.g>
    </g>
  );
}

/** 개별 가지 + 과일(사건) 노드 */
function BranchWithFruit({
  branch,
  index,
  isSelected,
  onNodeClick,
}: {
  branch: Branch;
  index: number;
  isSelected: boolean;
  onNodeClick: (eventId: string) => void;
}) {
  const { node, path } = branch;
  const { event, x, y, angle } = node;
  const config = getEventTypeConfig(event.event_type);
  const icon = getEventTypeIcon(event.event_type);
  const isMajor = getImportanceLevel(event.importance) === "major";

  const nodeDelay = 1.0 + index * 0.1;
  const isAbove = angle < 0;

  // 과일 노드 크기
  const nodeRadius = isMajor ? 28 : 22;
  const iconSize = isMajor ? 16 : 12;

  return (
    <motion.g
      custom={index}
      variants={branchVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 가지 본체 */}
      <motion.path
        d={path}
        fill="url(#branch-gradient)"
        stroke={INK_COLORS.dark}
        strokeWidth={0.5}
        strokeOpacity={0.3}
        filter="url(#dry-brush)"
      />

      {/* 과일 노드 */}
      <motion.g
        custom={nodeDelay}
        variants={nodeVariants}
        initial="hidden"
        animate="visible"
        style={{ cursor: "pointer" }}
        onClick={() => onNodeClick(node.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 과일 그림자 */}
        <motion.ellipse
          cx={x + 3}
          cy={y + 4}
          rx={nodeRadius}
          ry={nodeRadius * 0.85}
          fill={INK_COLORS.dark}
          opacity={0.15}
          filter="url(#ink-shadow)"
        />

        {/* 과일 본체 */}
        <motion.circle
          cx={x}
          cy={y}
          r={nodeRadius}
          fill={config.accentColor}
          stroke={config.color}
          strokeWidth={2.5}
          animate={{
            boxShadow: isSelected ? "0 0 20px rgba(0,0,0,0.3)" : "none",
            scale: isSelected ? 1.05 : 1,
          }}
        />

        {/* 과일 하이라이트 */}
        <circle
          cx={x - nodeRadius * 0.3}
          cy={y - nodeRadius * 0.3}
          r={nodeRadius * 0.25}
          fill="white"
          opacity={0.4}
        />

        {/* 아이콘 */}
        <foreignObject
          x={x - iconSize / 2}
          y={y - iconSize / 2}
          width={iconSize}
          height={iconSize}
        >
          <div
            className="flex items-center justify-center w-full h-full"
            style={{ color: config.color }}
          >
            {createElement(icon, {
              className: cn("shrink-0", isMajor ? "w-4 h-4" : "w-3 h-3"),
            })}
          </div>
        </foreignObject>

        {/* 라벨 */}
        <motion.g
          initial={{ opacity: 0, y: isAbove ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: nodeDelay + 0.15, duration: 0.3 }}
        >
          <rect
            x={x - 50}
            y={y + (isAbove ? -nodeRadius - 26 : nodeRadius + 8)}
            width={100}
            height={20}
            rx={4}
            fill="white"
            fillOpacity={0.92}
            stroke={config.color}
            strokeWidth={1}
            strokeOpacity={0.2}
          />
          <text
            x={x}
            y={y + (isAbove ? -nodeRadius - 12 : nodeRadius + 22)}
            textAnchor="middle"
            className="text-[11px] font-medium pointer-events-none"
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fill: "#3D302A",
            }}
          >
            {event.narrative_summary.length > 8
              ? `${event.narrative_summary.slice(0, 8)}...`
              : event.narrative_summary}
          </text>
        </motion.g>
      </motion.g>
    </motion.g>
  );
}
