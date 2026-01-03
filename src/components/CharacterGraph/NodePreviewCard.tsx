import { motion } from "framer-motion";
import type { Character } from "@/types";
import { ROLE_LABELS, STATUS_CONFIG } from "./constants";
import { getInitial, ROLE_GRADIENTS } from "./utils";

interface NodePreviewCardProps {
  character: Character;
  position: { x: number; y: number };
}

/**
 * 노드 호버 시 표시되는 캐릭터 미니 프리뷰 카드
 * Enhanced with initial-based avatars and Framer Motion animations
 */
export function NodePreviewCard({ character, position }: NodePreviewCardProps) {
  const statusConfig = character.status
    ? STATUS_CONFIG[character.status]
    : null;

  // 화면 경계 체크를 위한 오프셋 조정
  const adjustedX = Math.min(position.x + 16, window.innerWidth - 300);
  const adjustedY = Math.min(position.y + 16, window.innerHeight - 200);

  const role = character.role || "other";
  const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.other;
  const initial = getInitial(character.profile?.name || "?");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-stone-200 overflow-hidden w-[280px]">
        {/* 헤더: 이미지 + 기본 정보 */}
        <div className="flex items-start gap-3 p-3 bg-stone-50/50">
          {/* 아바타 - 이니셜 기반 with 그라데이션 */}
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm">
            {character.imageUrl ? (
              <img
                src={character.imageUrl}
                alt={character.profile?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                }}
              >
                <span className="text-white font-bold text-xl drop-shadow-sm">
                  {initial}
                </span>
              </div>
            )}
          </div>

          {/* 이름, 역할, 진영 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 truncate">
                {character.profile?.name || "이름 없음"}
              </h3>
              {/* 상태 배지 */}
              {statusConfig &&
                character.status !== "alive" &&
                character.status !== "생존" && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                )}
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs px-1.5 py-0.5 bg-mocha-100 text-mocha-700 rounded font-medium">
                {ROLE_LABELS[character.role || "other"] || character.role}
              </span>
              {character.profile?.faction?.name && (
                <span className="text-xs text-stone-500">
                  {character.profile.faction.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 성격 키워드 */}
        {character.personality?.coreTraits &&
          character.personality.coreTraits.length > 0 && (
            <div className="px-3 py-2 border-t border-stone-100">
              <div className="flex flex-wrap gap-1">
                {character.personality.coreTraits
                  .slice(0, 3)
                  .map((trait, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full"
                    >
                      {trait}
                    </span>
                  ))}
              </div>
            </div>
          )}

        {/* 관계 수 */}
        {character.relations?.graph && character.relations.graph.length > 0 && (
          <div className="px-3 py-2 border-t border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span>
                관계{" "}
                <strong className="text-mocha-600">
                  {character.relations.graph.length}
                </strong>
                명
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
