import { motion } from "framer-motion";
import { Sparkles, Network, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GraphEmptyStateProps {
  onStartAnalysis?: () => void;
  isLoading?: boolean;
}

/**
 * 그래프가 비어있을 때 표시되는 애니메이션 빈 상태 UI
 * Living Constellation 스타일의 모션 그래픽과 단계별 온보딩 힌트 포함
 */
export function GraphEmptyState({
  onStartAnalysis,
  isLoading = false,
}: GraphEmptyStateProps) {
  // 노드 위치 (중앙 기준 상대 좌표)
  const nodes = [
    { x: 0, y: 0, size: 24, delay: 0 },
    { x: -60, y: -40, size: 16, delay: 0.2 },
    { x: 70, y: -30, size: 18, delay: 0.3 },
    { x: -50, y: 50, size: 14, delay: 0.4 },
    { x: 60, y: 45, size: 16, delay: 0.5 },
    { x: 0, y: -70, size: 12, delay: 0.6 },
  ];

  // 엣지 연결 (노드 인덱스 쌍)
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 5],
    [2, 4],
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
      {/* 애니메이션 SVG 일러스트 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-[200px] h-[200px]"
      >
        <svg
          viewBox="-100 -100 200 200"
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          {/* 배경 그라데이션 */}
          <defs>
            <radialGradient id="empty-state-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A47764" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#A47764" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="node-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#A47764" />
              <stop offset="100%" stopColor="#7D5A4B" />
            </linearGradient>
          </defs>

          {/* 배경 원 */}
          <motion.circle
            cx="0"
            cy="0"
            r="90"
            fill="url(#empty-state-bg)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* 엣지 (점선 애니메이션) */}
          {edges.map(([from, to], idx) => (
            <motion.line
              key={`edge-${idx}`}
              x1={nodes[from].x}
              y1={nodes[from].y}
              x2={nodes[to].x}
              y2={nodes[to].y}
              stroke="#A47764"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.5 + idx * 0.1,
                ease: "easeOut",
              }}
            />
          ))}

          {/* 노드 */}
          {nodes.map((node, idx) => (
            <motion.g key={`node-${idx}`}>
              {/* 글로우 */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size + 8}
                fill="#A47764"
                opacity="0"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.15, 0],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 3,
                  delay: node.delay + 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* 메인 노드 */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={idx === 0 ? "url(#node-gradient)" : "#F1F0EC"}
                stroke="#A47764"
                strokeWidth={idx === 0 ? 3 : 2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: node.delay,
                }}
              />
              {/* 중앙 노드 아이콘 */}
              {idx === 0 && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Network
                    x={node.x - 10}
                    y={node.y - 10}
                    width={20}
                    height={20}
                    className="text-white"
                    stroke="white"
                  />
                </motion.g>
              )}
            </motion.g>
          ))}
        </svg>
      </motion.div>

      {/* 온보딩 텍스트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center max-w-md"
      >
        <h3 className="text-xl font-bold text-stone-800 mb-2 flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-mocha-500" />
          캐릭터 관계도를 시작하세요
        </h3>
        <p className="text-stone-500 text-sm leading-relaxed">
          AI가 스토리에서 캐릭터와 관계를 자동으로 분석하여
          <br />
          시각적인 관계도를 생성합니다.
        </p>
      </motion.div>

      {/* 단계별 힌트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex gap-6 text-center"
      >
        {[
          { step: 1, text: "스토리 작성" },
          { step: 2, text: "AI 분석" },
          { step: 3, text: "관계도 생성" },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-mocha-100 text-mocha-600 flex items-center justify-center text-sm font-bold">
              {item.step}
            </div>
            <span className="text-xs text-stone-500">{item.text}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA 버튼 */}
      {onStartAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Button
            onClick={onStartAnalysis}
            disabled={isLoading}
            className="bg-mocha-500 hover:bg-mocha-600 text-white shadow-lg hover:shadow-xl transition-all px-6 py-2.5 rounded-xl"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? "분석 중..." : "세계관 분석 시작하기"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
