/**
 * Writing Patterns Card Component
 *
 * Displays writing activity patterns by day of week.
 * Premium design matching StatsPage aesthetic with natural shadows.
 */

import { Clock, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@stolink/ui";
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
      { day: "mon", count: 0 }
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
    <Card className="border-none shadow-paper bg-white relative overflow-hidden group hover:shadow-paper-floating transition-all duration-300 rounded-xl">
      {/* Subtle accent border matching StatsPage style */}
      <div className="absolute left-0 top-0 w-1 h-full bg-mocha-500" />

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-mocha-200 flex items-center gap-2 uppercase tracking-tight">
          <TrendingUp className="w-4 h-4 text-mocha-500/60" />
          analysis.writing_patterns
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
          className="flex items-center justify-between p-4 bg-cloud-50 border border-cloud-100 rounded-xl group-hover:border-mocha-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-cloud-200 shadow-sm">
              <Clock className="w-4 h-4 text-mocha-500" />
            </div>
            <span className="text-xs font-bold text-mocha-400 uppercase tracking-widest">
              가장 활발한 요일
            </span>
          </div>
          <span className="font-bold text-espresso-900 text-sm">
            {patterns.mostProductiveDay}
          </span>
        </motion.div>

        {/* Day distribution bars */}
        <div className="space-y-2">
          <div className="text-[10px] text-mocha-400 uppercase tracking-widest mb-3 font-bold">
            요일별 데이터 분포
          </div>
          {Object.entries(patterns.byDayOfWeek).map(([day, count], index) => {
            const dayLabels: Record<string, string> = {
              mon: "월",
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
                <span className="text-xs w-6 text-mocha-400 font-bold">
                  {dayLabels[day]}
                </span>
                <div className="flex-1 h-2 bg-cloud-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-mocha-500 rounded-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{
                      duration: 0.5,
                      ease: [0.19, 1, 0.22, 1], // organic easing
                      delay: 0.2 + index * 0.03,
                    }}
                  />
                </div>
                <span className="text-xs w-20 text-right text-mocha-500 font-medium">
                  {count.toLocaleString()} 자
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
          className="pt-4 text-center text-xs text-mocha-400 border-t border-cloud-100 font-medium"
        >
          지난 1년 동안 총 {patterns.totalDays}일의 집필 기록이 있습니다.
        </motion.div>
      </CardContent>
    </Card>
  );
}
