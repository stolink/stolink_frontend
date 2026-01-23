import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  AnalysisCharacterInfo,
  AsymmetricStrength,
} from "@/types/relationshipAnalysis";

interface AsymmetricStrengthGraphProps {
  sourceCharacter: AnalysisCharacterInfo;
  targetCharacter: AnalysisCharacterInfo;
  asymmetricStrength: AsymmetricStrength;
  sourceColor: string;
  targetColor: string;
  className?: string;
}

/**
 * 비대칭 정도 계산
 */
function calculateAsymmetry(asymmetric: AsymmetricStrength) {
  const source = asymmetric.sourceToTarget.total;
  const target = asymmetric.targetToSource.total;
  const average = (source + target) / 2;
  const delta = Math.abs(source - target);

  let stronger: "source" | "target" | "equal" = "equal";
  if (delta >= 0.5) {
    stronger = source > target ? "source" : "target";
  }

  return { source, target, average, delta, stronger };
}

/**
 * Tug-of-War 스타일 비대칭 관계 강도 그래프
 */
export function AsymmetricStrengthGraph({
  sourceCharacter,
  targetCharacter,
  asymmetricStrength,
  sourceColor,
  targetColor,
  className,
}: AsymmetricStrengthGraphProps) {
  const { source, target, average, delta, stronger } =
    calculateAsymmetry(asymmetricStrength);

  // 막대 너비 계산 (0-10 → 0-100%)
  const maxValue = 10;
  const sourceWidth = (source / maxValue) * 100;
  const targetWidth = (target / maxValue) * 100;

  // 차이 메시지
  const getDeltaMessage = () => {
    if (stronger === "equal") return "균형 잡힌 관계";
    const name =
      stronger === "source" ? sourceCharacter.name : targetCharacter.name;
    return `${name}이(가) ${delta.toFixed(1)} 더 깊이 생각`;
  };

  return (
    <div
      className={cn(
        "bg-white/40 backdrop-blur-xl rounded-2xl p-5 border border-white/60 shadow-xl",
        className,
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-[14px] font-black text-espresso-500 uppercase tracking-[0.2em]">
          유대 균형
        </span>
      </div>

      {/* Tug-of-War 막대 그래프 */}
      <div className="relative">
        {/* 이름 라벨 */}
        <div className="flex justify-between items-center mb-2 px-1">
          <span
            className="text-[13px] font-bold truncate max-w-[80px]"
            style={{ color: sourceColor }}
          >
            {sourceCharacter.name}
          </span>
          <span
            className="text-[13px] font-bold truncate max-w-[80px]"
            style={{ color: targetColor }}
          >
            {targetCharacter.name}
          </span>
        </div>

        {/* 막대 컨테이너 */}
        <div className="relative h-8 bg-espresso-900/5 rounded-full overflow-hidden">
          {/* 중앙선 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-espresso-900/20 z-10" />

          {/* 왼쪽 막대 (Source → Target) */}
          <motion.div
            className="absolute right-1/2 top-0 bottom-0 rounded-l-full"
            style={{
              background: `linear-gradient(to left, ${sourceColor}, ${sourceColor}80)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${sourceWidth / 2}%` }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          />

          {/* 오른쪽 막대 (Target → Source) */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 rounded-r-full"
            style={{
              background: `linear-gradient(to right, ${targetColor}, ${targetColor}80)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${targetWidth / 2}%` }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1], delay: 0.1 }}
          />

          {/* 수치 라벨 */}
          <div className="absolute inset-0 flex items-center justify-between px-3 z-20">
            <motion.span
              className="text-[14px] font-black text-white drop-shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {source.toFixed(1)}
            </motion.span>
            <motion.span
              className="text-[14px] font-black text-white drop-shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {target.toFixed(1)}
            </motion.span>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="flex justify-between items-center mt-3 px-1">
          {/* 평균 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-espresso-400 uppercase tracking-wider">
              평균
            </span>
            <span className="text-[13px] font-bold text-espresso-700">
              {average.toFixed(1)}
            </span>
          </div>

          {/* 비대칭 표시 */}
          <motion.div
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[13px] font-bold",
              stronger === "equal"
                ? "bg-mocha-100 text-mocha-600"
                : "bg-espresso-900/5 text-espresso-600",
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            {stronger !== "equal" && (
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    stronger === "source" ? sourceColor : targetColor,
                }}
              />
            )}
            <span>{getDeltaMessage()}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AsymmetricStrengthGraph;
