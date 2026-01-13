import { motion } from "framer-motion";
import { Users, ArrowRight, ArrowLeftRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContextCard, RelationshipCardData } from "@/hooks/useChatStream";

// 관계 타입별 색상 (디자인 시스템 준수)
const RELATION_COLORS: Record<string, string> = {
  friendly: "#15803D", // Dark Green
  ally: "#15803D",
  friend: "#15803D",
  hostile: "#F44336", // Red
  enemy: "#F44336",
  rival: "#F44336",
  romantic: "#FF4081", // Vivid Blossom
  lover: "#FF4081",
  family: "#A47764", // Mocha
  neutral: "#6B7280", // Gray
};

// 관계 타입 한글 레이블
const RELATION_LABELS: Record<string, string> = {
  friendly: "우호",
  ally: "동맹",
  friend: "친구",
  hostile: "적대",
  enemy: "적",
  rival: "라이벌",
  romantic: "연인",
  lover: "연인",
  family: "가족",
  neutral: "중립",
};

interface ChatRelationshipCardProps {
  card: ContextCard;
  onViewDetails: (actionUrl: string) => void;
}

/**
 * 챗봇 관계 카드 컴포넌트
 * 두 캐릭터 간의 관계 정보를 시각적으로 표시
 */
export function ChatRelationshipCard({
  card,
  onViewDetails,
}: ChatRelationshipCardProps) {
  const data = card.data as RelationshipCardData;

  // 첫 번째 타입 기준으로 색상 결정
  const primaryType = data.types[0]?.toLowerCase() || "neutral";
  const color = RELATION_COLORS[primaryType] || RELATION_COLORS.neutral;

  // 타입 레이블 (복수일 경우 쉼표로 연결)
  const typeLabels = data.types
    .map((t) => RELATION_LABELS[t.toLowerCase()] || t)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-xl border border-mocha-100/50 shadow-paper overflow-hidden"
    >
      {/* 헤더 */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ backgroundColor: `${color}10` }}
      >
        <Users className="w-4 h-4" style={{ color }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color }}
        >
          관계 정보
        </span>
      </div>

      {/* 본문 */}
      <div className="p-4 space-y-3">
        {/* 캐릭터 연결 */}
        <div className="flex items-center justify-center gap-3">
          {/* Source */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-cloud-100 flex items-center justify-center text-espresso-600 font-bold text-sm">
              {data.sourceCharacter.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-espresso-800 mt-1 block truncate max-w-[60px]">
              {data.sourceCharacter.name}
            </span>
          </div>

          {/* 관계 화살표 */}
          <div className="flex flex-col items-center gap-1">
            {data.bidirectional ? (
              <ArrowLeftRight className="w-5 h-5" style={{ color }} />
            ) : (
              <ArrowRight className="w-5 h-5" style={{ color }} />
            )}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {typeLabels}
            </span>
          </div>

          {/* Target */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-cloud-100 flex items-center justify-center text-espresso-600 font-bold text-sm">
              {data.targetCharacter.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-espresso-800 mt-1 block truncate max-w-[60px]">
              {data.targetCharacter.name}
            </span>
          </div>
        </div>

        {/* 강도 게이지 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-espresso-500">
            <span>관계 강도</span>
            <span className="font-bold">{data.strength}/10</span>
          </div>
          <div className="h-2 w-full bg-cloud-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(data.strength / 10) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        {/* 설명 */}
        {data.description && (
          <p className="text-sm text-espresso-600 leading-relaxed line-clamp-2">
            {data.description}
          </p>
        )}

        {/* 자세히 보기 버튼 */}
        <button
          onClick={() => onViewDetails(card.actionUrl)}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-lg",
            "text-sm font-medium transition-colors",
            "bg-cloud-50 hover:bg-cloud-100 text-espresso-700",
          )}
        >
          <ExternalLink className="w-4 h-4" />
          관계 상세 보기
        </button>
      </div>
    </motion.div>
  );
}
