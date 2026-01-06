/**
 * Writing Patterns Card Component
 *
 * Displays writing activity patterns by day of week.
 * Premium design matching StatsPage aesthetic with natural shadows.
 */

import { Clock, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWritingStatsStore } from "@/stores/useWritingStatsStore";

export function WritingPatternsCard() {
  const { getHistory } = useWritingStatsStore();

  const patterns = useMemo(() => {
    const history = getHistory(365);

    const byDayOfWeek = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
    };
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    history.forEach((entry) => {
      const date = new Date(entry.date);
      const dayIndex = date.getDay();
      const dayKey = dayNames[dayIndex] as keyof typeof byDayOfWeek;
      byDayOfWeek[dayKey] += entry.wordCount;
    });

    const maxDay = Object.entries(byDayOfWeek).reduce(
      (max, [day, count]) => (count > max.count ? { day, count } : max),
      { day: "mon", count: 0 },
    );

    const dayLabels: Record<string, string> = {
      mon: "월요일",
      tue: "화요일",
      wed: "수요일",
      thu: "목요일",
      fri: "금요일",
      sat: "토요일",
      sun: "일요일",
    };

    return {
      byDayOfWeek,
      mostProductiveDay: dayLabels[maxDay.day] || "월요일",
      totalDays: history.filter((h) => h.wordCount > 0).length,
    };
  }, [getHistory]);

  const maxDayCount = Math.max(...Object.values(patterns.byDayOfWeek));

  return (
    <Card className="border-none shadow-sm bg-white relative overflow-hidden group hover:shadow-paper-hover transition-all duration-300">
      {/* Subtle accent border matching StatsPage style */}
      <div className="absolute left-0 top-0 w-1.5 h-full bg-[#7A8C6F]" />

      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#7A8C6F]" />
          집필 패턴
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Most productive day - highlighted with subtle glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.05,
            type: "spring",
            stiffness: 300,
            damping: 24,
          }}
          className="flex items-center justify-between p-3 bg-[#f8f7f5] rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Clock className="w-4 h-4 text-[#7A8C6F]" />
            </div>
            <span className="text-sm font-medium text-[#3D302A]">
              가장 활발한 요일
            </span>
          </div>
          <span className="font-bold text-[#7A8C6F]">
            {patterns.mostProductiveDay}
          </span>
        </motion.div>

        {/* Day distribution bars */}
        <div className="space-y-2">
          <div className="text-xs text-[#8D8B88] uppercase tracking-wider mb-2">
            요일별 총 집필량
          </div>
          {Object.entries(patterns.byDayOfWeek).map(([day, count], index) => {
            const dayLabels: Record<string, string> = {
              mom: "월",
              tue: "화",
              wed: "수",
              thu: "목",
              fri: "금",
              sat: "토",
              sun: "일",
            };
            const widthPercent =
              maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;

            return (
              <motion.div
                key={day}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.15 + index * 0.03,
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
              >
                <span className="text-xs w-6 text-[#3D302A] font-medium">
                  {dayLabels[day]}
                </span>
                <div className="flex-1 h-3 bg-[#F1F0EC] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#7A8C6F] to-[#A47764] rounded-full"
                    style={{
                      boxShadow: "0 1px 2px rgba(122, 140, 111, 0.15)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{
                      duration: 0.5,
                      ease: [0.19, 1, 0.22, 1], // organic easing
                      delay: 0.2 + index * 0.03,
                    }}
                  />
                </div>
                <span className="text-xs w-16 text-right text-[#A47764] font-medium">
                  {count.toLocaleString()}자
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-3 text-center text-xs text-[#8D8B88] border-t border-[#F1F0EC]"
        >
          최근 1년간{" "}
          <span className="font-bold text-[#3D302A]">
            {patterns.totalDays}일
          </span>{" "}
          동안 집필했습니다
        </motion.div>
      </CardContent>
    </Card>
  );
}
