// src/components/CharacterGraph/RelationshipDeepAnalysis/components/AsymmetricStrengthGraph.tsx

import React from "react";
import { motion } from "framer-motion";
import { AnalysisCharacterInfo } from "@/types/relationshipAnalysis"; // 경로 확인 필요
import { AsymmetricStrength } from "@/types/relationshipAnalysis";

interface AsymmetricStrengthGraphProps {
sourceCharacter: AnalysisCharacterInfo;
targetCharacter: AnalysisCharacterInfo;
asymmetricStrength: AsymmetricStrength;
sourceColor: string;
targetColor: string;
className?: string;
}

const AsymmetricStrengthGraph: React.FC<AsymmetricStrengthGraphProps> = ({
sourceCharacter,
targetCharacter,
asymmetricStrength,
sourceColor,
targetColor,
className = "",
}) => {
const sValue = asymmetricStrength.sourceToTarget.total;
const tValue = asymmetricStrength.targetToSource.total;
const total = sValue + tValue;

// 퍼센트 계산 (최소 10%는 확보하여 시각적으로 너무 작아지지 않게 함)
const sPercent = Math.max(10, (sValue / total) _ 100);
const tPercent = Math.max(10, (tValue / total) _ 100);

// 누가 더 강한지
const diff = Math.abs(sValue - tValue).toFixed(1);
const isSourceStronger = sValue > tValue;

return (

<div className={`flex flex-col items-center w-full ${className}`}>
{/_ 1. 상단 라벨 (이름 및 수치) _/}
<div className="flex justify-between w-full text-xs font-medium text-gray-400 mb-2 px-1">
<span style={{ color: sourceColor }}>
{sourceCharacter.name} ({sValue.toFixed(1)})
</span>
<span style={{ color: targetColor }}>
{targetCharacter.name} ({tValue.toFixed(1)})
</span>
</div>

      {/* 2. Tug of War Bar (SVG + Motion) */}
      <div className="relative w-full h-4 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
        {/* Source Bar (Left) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(sValue / (sValue + tValue)) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-0 top-0 h-full"
          style={{
            background: `linear-gradient(90deg, ${sourceColor}00 0%, ${sourceColor}CC 100%)`,
            borderRight: `2px solid ${sourceColor}`,
            boxShadow: `0 0 10px ${sourceColor}66`
          }}
        />

        {/* Target Bar (Right) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(tValue / (sValue + tValue)) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute right-0 top-0 h-full"
          style={{
            background: `linear-gradient(-90deg, ${targetColor}00 0%, ${targetColor}CC 100%)`,
            borderLeft: `2px solid ${targetColor}`,
            boxShadow: `0 0 10px ${targetColor}66`
          }}
        />

        {/* Center Indicator (평균선) */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-white/20 -translate-x-1/2" />
      </div>

      {/* 3. 하단 분석 텍스트 */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-[10px] text-gray-500 flex items-center gap-2"
      >
        <span>관계의 무게추:</span>
        <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-bold">
            {diff}
        </span>
        <span>만큼</span>
        <span style={{ color: isSourceStronger ? sourceColor : targetColor, fontWeight: 'bold' }}>
          {isSourceStronger ? sourceCharacter.name : targetCharacter.name}
        </span>
        <span>쪽이 더 큼</span>
      </motion.div>
    </div>

);
};

export default AsymmetricStrengthGraph;
