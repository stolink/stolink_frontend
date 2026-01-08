// =====================================================
// 👤 Character Portrait Panel Component
// 캐릭터 초상화 + 레이더 차트 패널
// =====================================================

import { motion } from "framer-motion";
import type {
  AnalysisCharacterInfo,
  RelationshipAttributes,
} from "@/types/relationshipAnalysis";
import { RelationshipRadarChart } from "./RelationshipRadarChart";
import { cn } from "@/lib/utils";

interface CharacterPortraitPanelProps {
  /** 캐릭터 정보 */
  character: AnalysisCharacterInfo;
  /** 관계 속성 (이 캐릭터 → 상대방) */
  attributes: RelationshipAttributes;
  /** 상대방 이름 (라벨용) */
  targetName: string;
  /** 패널 위치 (왼쪽/오른쪽) */
  position: "left" | "right";
  /** 애니메이션 딜레이 (초) */
  animationDelay?: number;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 이니셜 아바타 생성
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CharacterPortraitPanel({
  character,
  attributes,
  targetName,
  position,
  animationDelay = 0,
  className,
}: CharacterPortraitPanelProps) {
  const isLeft = position === "left";
  const radarColor = isLeft ? "teal" : "rose";

  return (
    <motion.div
      className={cn("flex flex-col items-center gap-4 p-4", className)}
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
    >
      {/* Portrait */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: animationDelay + 0.1 }}
      >
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-cloud-200 shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-cloud-200 shadow-md">
            <span className="text-2xl font-bold text-white font-serif">
              {getInitials(character.name)}
            </span>
          </div>
        )}

        {/* Glow Ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full animate-pulse",
            isLeft ? "ring-2 ring-teal-500/30" : "ring-2 ring-rose-500/30",
          )}
          style={{ animationDelay: `${animationDelay}s` }}
        />
      </motion.div>

      {/* Name */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: animationDelay + 0.2 }}
      >
        <h3 className="text-lg font-bold text-espresso-900 font-serif">
          {character.name}
        </h3>
        <p className="text-xs text-espresso-500 mt-1">
          → {targetName}에 대한 마음
        </p>
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: animationDelay + 0.3 }}
      >
        <RelationshipRadarChart
          attributes={attributes}
          size={180}
          color={radarColor}
          animationDelay={animationDelay + 0.4}
          showLabels={true}
        />
      </motion.div>
    </motion.div>
  );
}

export default CharacterPortraitPanel;
