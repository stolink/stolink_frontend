/**
 * Chapter Balance Card Component
 *
 * Displays chapter-by-chapter word count distribution.
 * Premium design with natural shadows and subtle glassmorphism elements.
 */

import { AlertCircle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@stolink/ui";
import { useChapterBalance } from "@/hooks/useChapterBalance";

interface ChapterBalanceCardProps {
  projectId: string;
}

// Framer Motion variants for smooth reveals
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export function ChapterBalanceCard({ projectId }: ChapterBalanceCardProps) {
  const { data: analysis, isLoading } = useChapterBalance(projectId);

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm bg-white relative overflow-hidden">
        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#A47764]" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#A47764]" />
            챕터 밸런스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[#8D8B88]">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.chapters.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white relative overflow-hidden">
        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#A47764]" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#A47764]" />
            챕터 밸런스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[#8D8B88]">챕터가 없습니다</div>
        </CardContent>
      </Card>
    );
  }

  const maxWordCount = Math.max(...analysis.chapters.map((c) => c.wordCount));

  return (
    <Card className="border-none shadow-paper bg-white relative overflow-hidden group hover:shadow-paper-floating transition-all duration-300 rounded-xl">
      {/* Subtle accent border */}
      <div className="absolute left-0 top-0 w-1 h-full bg-mocha-500" />

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-espresso-900 flex items-center gap-2 tracking-tight">
          <BarChart3 className="w-5 h-5 text-mocha-500/60" />
          챕터별 분량 밸런스
        </CardTitle>
        {analysis.unbalancedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1 text-xs text-orange-600 mt-1"
          >
            <AlertCircle className="w-3 h-3" />
            {analysis.unbalancedCount}개 챕터 분량 불균형
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Average indicator */}
        <div className="flex justify-between items-center text-xs font-bold text-mocha-400 uppercase tracking-widest">
          <span>평균 글자 수</span>
          <span className="text-espresso-900">
            {Math.round(analysis.average).toLocaleString()} 자
          </span>
        </div>

        {/* Chapter bars with stagger animation */}
        <motion.div
          className="space-y-2 max-h-64 overflow-y-auto pr-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            // Custom scrollbar styling
            scrollbarWidth: "thin",
            scrollbarColor: "#BD9B8D #F1F0EC",
          }}
        >
          {analysis.chapters.map((chapter) => {
            const widthPercent = (chapter.wordCount / maxWordCount) * 100;
            return (
              <motion.div
                key={chapter.id}
                className="space-y-1"
                variants={itemVariants}
              >
                <div className="flex justify-between text-xs font-bold">
                  <span className="truncate max-w-[60%] text-espresso-900">
                    {chapter.title}
                  </span>
                  <span className="text-mocha-500">
                    {chapter.wordCount.toLocaleString()} 자
                  </span>
                </div>

                {/* Progress bar with natural shadow */}
                <div className="relative h-2 bg-cloud-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      chapter.isUnbalanced
                        ? "bg-gradient-to-r from-orange-400 to-orange-500"
                        : "bg-gradient-to-r from-[#BD9B8D] to-[#A47764]"
                    }`}
                    style={{
                      boxShadow: chapter.isUnbalanced
                        ? "0 1px 2px rgba(234, 88, 12, 0.2)"
                        : "0 1px 2px rgba(164, 119, 100, 0.15)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{
                      duration: 0.5,
                      ease: [0.19, 1, 0.22, 1], // organic easing
                      delay: 0.1,
                    }}
                  />
                </div>

                {chapter.isUnbalanced && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[10px] text-orange-600"
                  >
                    평균 대비 {chapter.deviation > 0 ? "+" : ""}
                    {Math.round(chapter.deviation)}%
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <div className="pt-4 border-t border-cloud-100 grid grid-cols-2 gap-3 text-xs font-bold">
          <div className="p-3 bg-cloud-50 rounded-xl border border-cloud-100 group-hover:border-mocha-200 transition-colors">
            <span className="text-mocha-400 block mb-1 uppercase tracking-widest text-[10px]">
              최대 분량
            </span>
            <span className="text-espresso-900 block truncate font-bold">
              {analysis.longest.title}
            </span>
            <span className="text-mocha-500">
              {analysis.longest.wordCount.toLocaleString()} 자
            </span>
          </div>
          <div className="p-3 bg-cloud-50 rounded-xl border border-cloud-100 group-hover:border-mocha-200 transition-colors">
            <span className="text-mocha-400 block mb-1 uppercase tracking-widest text-[10px]">
              최소 분량
            </span>
            <span className="text-espresso-900 block truncate font-bold">
              {analysis.shortest.title}
            </span>
            <span className="text-mocha-500">
              {analysis.shortest.wordCount.toLocaleString()} 자
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
