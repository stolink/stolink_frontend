import { motion } from "framer-motion";
import { X, Users } from "lucide-react";
import type { Character, RelationshipLink, CharacterNode } from "@/types";
import { RELATION_LABELS } from "./constants";
import { getRelationshipColor } from "./utils";
import { cn } from "@/lib/utils";

interface RelationshipSummaryPanelProps {
  character: Character;
  links: RelationshipLink[];
  nodes: CharacterNode[];
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

/**
 * 선택된 캐릭터의 관계 요약 패널
 */
export function RelationshipSummaryPanel({
  character,
  links,
  nodes,
  onClose,
  onNodeClick,
}: RelationshipSummaryPanelProps) {
  // 이 캐릭터와 관련된 링크만 필터링
  const relatedLinks = links.filter(
    (link) =>
      (typeof link.source === "string" ? link.source : link.source.id) ===
        character._id ||
      (typeof link.target === "string" ? link.target : link.target.id) ===
        character._id,
  );

  // 관계 타입별 분류
  const relationCounts = {
    friendly: relatedLinks.filter((l) => l.type === "friendly").length,
    hostile: relatedLinks.filter((l) => l.type === "hostile").length,
    romantic: relatedLinks.filter((l) => l.type === "romantic").length,
  };

  // 대상 노드 이름 가져오기
  const getTargetName = (link: RelationshipLink): string => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;
    const otherId = sourceId === character._id ? targetId : sourceId;
    const node = nodes.find((n) => n.id === otherId);
    return node?.name || "알 수 없음";
  };

  const getTargetId = (link: RelationshipLink): string => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;
    return sourceId === character._id ? targetId : sourceId;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 top-16 w-[300px] bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-stone-200 z-30 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-mocha-500" />
          <span className="font-bold text-stone-800">
            {character.profile?.name} 관계
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-stone-200 transition-colors"
        >
          <X className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* 관계 수 요약 */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-stone-100 text-sm">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getRelationshipColor("friendly", 5) }}
          />
          <span className="text-stone-600">
            우호{" "}
            <strong className="text-stone-800">
              {relationCounts.friendly}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getRelationshipColor("hostile", 5) }}
          />
          <span className="text-stone-600">
            적대{" "}
            <strong className="text-stone-800">{relationCounts.hostile}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getRelationshipColor("romantic", 5) }}
          />
          <span className="text-stone-600">
            로맨스{" "}
            <strong className="text-stone-800">
              {relationCounts.romantic}
            </strong>
          </span>
        </div>
      </div>

      {/* 관계 리스트 */}
      <div className="max-h-[400px] overflow-y-auto">
        {relatedLinks.length === 0 ? (
          <div className="px-4 py-8 text-center text-stone-400 text-sm">
            관계가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {relatedLinks.map((link) => {
              const color = getRelationshipColor(link.type, link.strength);
              return (
                <div
                  key={link.id}
                  onClick={() => onNodeClick(getTargetId(link))}
                  className="px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800 group-hover:text-mocha-600 transition-colors">
                        {getTargetName(link)}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium",
                        )}
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                      >
                        {RELATION_LABELS[link.type] || link.type}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400">
                      {link.strength}/10
                    </span>
                  </div>
                  {/* 강도 게이지 */}
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(link.strength / 10) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  {/* 설명 (있으면) */}
                  {link.description && (
                    <p className="mt-2 text-xs text-stone-500 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
