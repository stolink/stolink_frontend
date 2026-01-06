import { BarChart3, Calendar, Trophy, Flame, Target } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

import { useWritingStatsStore } from "@/stores/useWritingStatsStore";
import { useProjectStats } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChapterBalanceCard } from "@/components/stats/ChapterBalanceCard";
import { WritingPatternsCard } from "@/components/stats/WritingPatternsCard";

// Animation variants for staggered reveals
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export default function StatsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { dailyGoal, currentStreak, longestStreak, getTodayCount, getHistory } =
    useWritingStatsStore();

  const { data: projectStats, isLoading: isStatsLoading } = useProjectStats(
    projectId || "",
    {
      enabled: !!projectId,
    },
  );

  // Real data from IndexedDB
  const historyData = useMemo(() => {
    return getHistory(365).map((h) => ({ date: h.date, count: h.wordCount }));
  }, [getHistory]);

  const displayStats = projectStats || {
    totalWords: 0,
    chapterCount: 0,
    characterCount: 0,
  };

  const todayCount = getTodayCount();
  const displayStreak = currentStreak;
  const displayLongest = longestStreak;
  const progress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  // Heatmap Setup
  const weeks = useMemo(() => {
    const weeksData: { date: string; count: number }[][] = [];
    const totalWeeks = 52;
    const totalDays = totalWeeks * 7;
    const paddingDays = totalDays - historyData.length;
    const padded = [
      ...Array(Math.max(0, paddingDays)).fill({ date: "", count: 0 }),
      ...historyData,
    ];
    const sliced = padded.slice(-totalDays);
    for (let i = 0; i < totalWeeks; i++) {
      weeksData.push(sliced.slice(i * 7, (i + 1) * 7));
    }
    return weeksData;
  }, [historyData]);

  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-[#E6E4E0]";
    const ratio = count / dailyGoal;
    if (ratio < 0.25) return "bg-[#D7C2B8]";
    if (ratio < 0.5) return "bg-[#BD9B8D]";
    if (ratio < 1.0) return "bg-[#A47764]";
    return "bg-[#7D5A4B]";
  };

  // Loading skeleton UI
  if (isStatsLoading) {
    return (
      <div className="h-full bg-[#f8f7f5] p-6 lg:p-8 overflow-y-auto font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>

          {/* Top cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Heatmap skeleton */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>

          {/* Bottom cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="border-none shadow-sm bg-white">
                <CardHeader>
                  <Skeleton className="h-5 w-28" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#f8f7f5] p-6 lg:p-8 overflow-y-auto font-sans text-[#3D302A]">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with fade-in */}
        <motion.div className="flex flex-col gap-2" variants={fadeInVariants}>
          <h1 className="text-3xl font-serif font-bold text-[#3D302A] flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <BarChart3 className="w-8 h-8 text-[#A47764]" />
            </motion.div>
            집필 통계
          </h1>
          <p className="text-[#8D8B88] font-medium">
            꾸준한 집필 습관을 위한 데이터 분석 리포트입니다.
          </p>
        </motion.div>

        {/* Top Cards with stagger animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Today's Writing */}
          <motion.div variants={cardVariants}>
            <Card className="border-none shadow-sm bg-white relative overflow-hidden group hover:shadow-paper-hover transition-all duration-300">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-[#A47764]" />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-sm font-semibold text-[#8D8B88] uppercase tracking-wider">
                  오늘의 집필
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Target className="w-4 h-4 text-[#A47764]" />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <motion.span
                    className="text-4xl font-bold font-serif text-[#3D302A]"
                    key={todayCount}
                    initial={{ scale: 1.1, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {todayCount.toLocaleString()}
                  </motion.span>
                  <span className="text-sm text-[#8D8B88]">
                    / {dailyGoal.toLocaleString()}자
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-2 bg-[#F1F0EC]"
                  indicatorClassName="bg-[#A47764] transition-all duration-500"
                />
                <motion.p
                  className="text-xs text-[#8D8B88] mt-2 text-right"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {progress >= 100
                    ? "목표 달성! 🎉"
                    : `${Math.max(0, dailyGoal - todayCount).toLocaleString()}자 남음`}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Streak */}
          <motion.div variants={cardVariants}>
            <Card className="border-none shadow-sm bg-white relative overflow-hidden group hover:shadow-paper-hover transition-all duration-300">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-[#B38B82]" />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-sm font-semibold text-[#8D8B88] uppercase tracking-wider">
                  집필 스트릭
                  <motion.div
                    animate={
                      displayStreak > 0
                        ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                        : {}
                    }
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Flame
                      className={cn(
                        "w-4 h-4",
                        displayStreak > 0
                          ? "text-[#B38B82] fill-[#B38B82]"
                          : "text-stone-300",
                      )}
                    />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-4xl font-bold font-serif text-[#3D302A]">
                      {displayStreak}
                    </span>
                    <span className="text-sm text-[#8D8B88] ml-1">일 연속</span>
                  </div>
                  <div className="h-8 w-px bg-stone-100" />
                  <div>
                    <span className="text-xl font-bold text-[#8D8B88]">
                      {displayLongest}
                    </span>
                    <span className="text-xs text-[#8D8B88] ml-1">
                      최고 기록
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#8D8B88] mt-3">
                  {displayStreak > 0
                    ? "이 기세를 몰아 계속 써보세요!"
                    : "오늘 다시 시작해보세요!"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Project Total */}
          <motion.div variants={cardVariants}>
            <Card className="border-none shadow-sm bg-white relative overflow-hidden group hover:shadow-paper-hover transition-all duration-300">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-[#7A8C6F]" />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-sm font-semibold text-[#8D8B88] uppercase tracking-wider">
                  프로젝트 현황
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Trophy className="w-4 h-4 text-[#7A8C6F]" />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-[#8D8B88]">총 분량</span>
                    <span className="text-2xl font-bold font-serif text-[#3D302A]">
                      {displayStats.totalWords.toLocaleString()}
                      <span className="text-xs font-sans font-normal ml-1 text-[#8D8B88]">
                        자
                      </span>
                    </span>
                  </div>
                  <Separator className="my-2 bg-[#F1F0EC]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8D8B88]">챕터 수</span>
                    <span className="font-medium text-[#3D302A]">
                      {displayStats.chapterCount}장
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Heatmap Section */}
        <motion.div variants={cardVariants}>
          <Card className="border-none shadow-sm bg-white p-2 hover:shadow-paper-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-serif font-bold text-[#3D302A] flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Calendar className="w-5 h-5 text-[#A47764]" />
                </motion.div>
                집필 활동 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-2">
                <motion.div
                  className="flex gap-1 min-w-max"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: { staggerChildren: 0.005 },
                    },
                  }}
                >
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                      {week.map((day, dIndex) => (
                        <motion.div
                          key={dIndex}
                          className={cn(
                            "w-3 h-3 rounded-[2px] relative group cursor-pointer",
                            getIntensityColor(day.count),
                          )}
                          variants={{
                            hidden: { opacity: 0, scale: 0.5 },
                            visible: { opacity: 1, scale: 1 },
                          }}
                          whileHover={{ scale: 1.5 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                        >
                          {day.date && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none whitespace-nowrap">
                              <motion.div
                                className="bg-[#3D302A] text-white text-[10px] py-1 px-2 rounded shadow-xl"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <span className="font-bold">
                                  {day.date}: {day.count.toLocaleString()}자
                                </span>
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              </div>
              <motion.div
                className="flex justify-end items-center gap-2 text-xs text-[#8D8B88] mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>Less</span>
                <div className="flex gap-1">
                  {["#E6E4E0", "#D7C2B8", "#BD9B8D", "#A47764", "#7D5A4B"].map(
                    (color) => (
                      <motion.div
                        key={color}
                        className="w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: color }}
                        whileHover={{ scale: 1.3 }}
                      />
                    ),
                  )}
                </div>
                <span>More</span>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Grid: Chapter Balance & Writing Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={cardVariants}>
            {projectId && <ChapterBalanceCard projectId={projectId} />}
          </motion.div>
          <motion.div variants={cardVariants}>
            <WritingPatternsCard />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
