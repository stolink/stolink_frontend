/**
 * 사건 노드 컴포넌트 (나무 가지 끝의 열매)
 */
import { createElement } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BranchNode } from "./types";
import { getImportanceLevel } from "./types";
import { getEventTypeIcon, getEventTypeConfig } from "./constants";

interface BiographyEventNodeProps {
  node: BranchNode;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (index: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.6 + index * 0.08,
    },
  }),
};

const floatingAnimation = {
  y: [0, -3, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export function BiographyEventNode({
  node,
  index,
  isSelected,
  onClick,
}: BiographyEventNodeProps) {
  const { event, x, y, angle } = node;
  const config = getEventTypeConfig(event.event_type);
  const icon = getEventTypeIcon(event.event_type);
  const isMajor = getImportanceLevel(event.importance) === "major";

  // 라벨 위치 결정 (위쪽/아래쪽)
  const isAbove = angle < 0;
  const labelY = isAbove ? -38 : 38;

  return (
    <motion.g
      custom={index}
      variants={nodeVariants}
      initial="hidden"
      animate="visible"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {/* 열매 본체 */}
      <motion.g
        animate={floatingAnimation}
        whileHover={{
          scale: 1.12,
          transition: { type: "spring" as const, stiffness: 400 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 배경 원 (글로우) */}
        <motion.circle
          cx={x}
          cy={y}
          r={isMajor ? 26 : 22}
          fill={config.accentColor}
          opacity={isSelected ? 0.4 : 0.15}
          filter="url(#ink-shadow)"
          animate={{
            opacity: isSelected ? 0.5 : 0.15,
            r: isSelected ? (isMajor ? 30 : 26) : isMajor ? 26 : 22,
          }}
          transition={{ duration: 0.2 }}
        />

        {/* 메인 원 */}
        <circle
          cx={x}
          cy={y}
          r={isMajor ? 22 : 18}
          fill="#F1F0EC"
          stroke={config.color}
          strokeWidth={isMajor ? 2.5 : 2}
          className="transition-all duration-200"
        />

        {/* 아이콘 (foreignObject로 lucide-react 사용) */}
        <foreignObject
          x={x - (isMajor ? 11 : 9)}
          y={y - (isMajor ? 11 : 9)}
          width={isMajor ? 22 : 18}
          height={isMajor ? 22 : 18}
        >
          <div
            className="flex items-center justify-center w-full h-full"
            style={{ color: config.color }}
          >
            {createElement(icon, {
              className: cn("shrink-0", isMajor ? "w-4 h-4" : "w-3.5 h-3.5"),
            })}
          </div>
        </foreignObject>
      </motion.g>

      {/* 라벨 (타이틀) */}
      <motion.g
        initial={{ opacity: 0, y: isAbove ? 10 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 + index * 0.08, duration: 0.3 }}
      >
        {/* 라벨 배경 */}
        <rect
          x={x - 50}
          y={y + labelY - 10}
          width={100}
          height={20}
          rx={4}
          fill="white"
          fillOpacity={0.85}
          className="pointer-events-none"
        />

        {/* 타이틀 텍스트 */}
        <text
          x={x}
          y={y + labelY + 4}
          textAnchor="middle"
          className={cn(
            "text-xs font-medium pointer-events-none",
            "fill-espresso-900",
          )}
          style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: 11,
          }}
        >
          {event.narrative_summary.length > 10
            ? `${event.narrative_summary.slice(0, 10)}...`
            : event.narrative_summary}
        </text>

        {/* 참여자 수 표시 */}
        {event.participants.length > 0 && (
          <text
            x={x}
            y={y + labelY + 16}
            textAnchor="middle"
            className="text-[9px] fill-stone-400 pointer-events-none"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            {event.participants.length}명 참여
          </text>
        )}
      </motion.g>

      {/* 중요 사건 표시 (major) */}
      {isMajor && (
        <motion.circle
          cx={x + 16}
          cy={y - 16}
          r={4}
          fill={config.color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 + index * 0.08, type: "spring" as const }}
        />
      )}
    </motion.g>
  );
}
