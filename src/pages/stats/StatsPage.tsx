import { BarChart3, Calendar, Trophy, Flame, Target } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

import { useWritingStatsStore } from "@/stores/useWritingStatsStore";
import { useProjectStats } from "@/hooks/useProjects";
import { useDocumentTree } from "@/hooks/useDocuments";
import { cn, getPlainTextLength } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@stolink/ui";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/design-system/components/Button";
import { Label } from "@/components/ui/label";
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
  const { dailyGoal, currentStreak, longestStreak, getHistory, setDailyGoal } =
    useWritingStatsStore();

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const handleOpenGoalDialog = () => {
    setGoalInput(dailyGoal.toString());
    setIsGoalDialogOpen(true);
  };

  const handleSaveGoal = () => {
    const newGoal = parseInt(goalInput.replace(/,/g, ""), 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setDailyGoal(newGoal);
      setIsGoalDialogOpen(false);
    }
  };

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

  // Real-time data from local documents cache (instantly updates on typing)
  const { documents } = useDocumentTree(projectId || "");

  // 스토어에서 문서별 글자수 구독 (실시간 동기화)
  const documentCharCounts = useWritingStatsStore((s) => s.documentCharCounts);
  const dailyBaselines = useWritingStatsStore((s) => s.dailyBaselines);
  const currentTotalChars = useWritingStatsStore((s) => s.currentTotalChars);

  const realTimeStats = useMemo(() => {
    if (!documents || documents.length === 0) return null;

    // 스토어에 글자수가 있으면 그걸 사용, 없으면 문서에서 계산
    let wordCount = 0;
    if (Object.keys(documentCharCounts).length > 0) {
      // 스토어 값 사용 (에디터에서 실시간 업데이트됨)
      wordCount = Object.values(documentCharCounts).reduce(
        (acc, count) => acc + count,
        0,
      );
    } else {
      // 폴백: 문서에서 직접 계산
      wordCount = documents.reduce(
        (acc, doc) => acc + getPlainTextLength(doc.content),
        0,
      );
    }

    // 폴더 또는 챕터 타입인 문서의 수 계산
    const chapterCount = documents.filter(
      (doc) => doc.type === "folder" || doc.type === "text",
    ).length;

    return {
      totalWords: wordCount,
      chapterCount: chapterCount,
    };
  }, [documents, documentCharCounts]);

  const displayStats = realTimeStats ||
    projectStats || {
      totalWords: 0,
      chapterCount: 0,
      characterCount: 0,
    };

  // 오늘의 baseline 직접 구독 (상태 변경 시 리렌더링 보장)
  const updateTotalChars = useWritingStatsStore((s) => s.updateTotalChars);

  // Stats 페이지 마운트 시 총 글자수 업데이트 (에디터에서 오지 않은 경우를 위해)
  useEffect(() => {
    if (displayStats.totalWords > 0 && currentTotalChars === 0) {
      updateTotalChars(displayStats.totalWords);
    }
  }, [displayStats.totalWords, currentTotalChars, updateTotalChars]);

  // 오늘의 작성량 계산 (스토어의 currentTotalChars 사용)
  const todayString = new Date().toISOString().split("T")[0];
  const todayBaseline = dailyBaselines[todayString] ?? 0;
  const effectiveTotalChars = currentTotalChars || displayStats.totalWords;
  const todayCount = Math.max(0, effectiveTotalChars - todayBaseline);

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
    if (count === 0) return "bg-muted";
    const ratio = count / dailyGoal;
    if (ratio < 0.25) return "bg-mocha-900/30";
    if (ratio < 0.5) return "bg-mocha-900/60";
    if (ratio < 1.0) return "bg-mocha-700";
    return "bg-mocha-500";
  };

  // Loading skeleton UI
  if (isStatsLoading) {
    return (
      <div className="h-full bg-paper p-6 lg:p-8 overflow-y-auto font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>

          {/* Top cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="border-none shadow-paper bg-paper rounded-xl"
              >
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
          <Card className="border-none shadow-paper bg-paper rounded-xl">
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-paper p-6 lg:p-8 overflow-y-auto selection:bg-mocha-100">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with fade-in */}
        <motion.div className="flex flex-col gap-2" variants={fadeInVariants}>
          <h1 className="text-4xl  font-bold text-espresso-900 flex items-center gap-3 tracking-tight">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <BarChart3 className="w-8 h-8 text-mocha-500" />
            </motion.div>
            집필 통계
          </h1>
          <p className="text-mocha-500 font-medium">
            작품의 집필 데이터와 습관을 분석한 리포트입니다.
          </p>
        </motion.div>

        {/* Top Cards with stagger animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Today's Writing */}
          <motion.div variants={cardVariants}>
            <Card className="border-none shadow-paper bg-paper relative overflow-hidden group hover:shadow-paper-floating transition-all duration-300 rounded-xl">
              <div className="absolute left-0 top-0 w-1 h-full bg-mocha-500" />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-xs font-bold text-mocha-400 uppercase tracking-widest">
                  일일 목표
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    onClick={handleOpenGoalDialog}
                    className="focus:outline-none"
                    aria-label="일일 목표 설정"
                  >
                    <Target className="w-4 h-4 text-mocha-500/60 hover:text-mocha-500 transition-colors" />
                  </motion.button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <motion.span
                    className="text-4xl font-bold text-espresso-900"
                    key={todayCount}
                    initial={{ scale: 1.1, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {todayCount.toLocaleString()}
                  </motion.span>
                  <span className="text-xs text-mocha-500">
                    / {dailyGoal.toLocaleString()} 자
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-2 bg-muted rounded-full overflow-hidden"
                />
                <motion.p
                  className="text-xs text-mocha-500 mt-2 text-right font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {progress >= 100
                    ? "오늘의 목표 달성! 🎉"
                    : `목표까지 ${Math.max(0, dailyGoal - todayCount).toLocaleString()}자 남았습니다.`}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Streak */}
          <motion.div variants={cardVariants}>
            <Card className="border-none shadow-paper bg-paper relative overflow-hidden group hover:shadow-paper-floating transition-all duration-300 rounded-xl">
              <div className="absolute left-0 top-0 w-1 h-full bg-[#B38B82]" />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-xs font-bold text-mocha-400 uppercase tracking-widest">
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
                          : "text-cloud-200",
                      )}
                    />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-4xl font-bold text-espresso-900">
                      {displayStreak}
                    </span>
                    <span className="text-xs text-mocha-500 ml-1 font-medium">
                      일째
                    </span>
                  </div>
                  <div className="h-8 w-px bg-cloud-200" />
                  <div>
                    <span className="text-xl font-bold text-mocha-500">
                      {displayLongest}
                    </span>
                    <span className="text-xs text-mocha-500 ml-1 font-medium">
                      최고 기록
                    </span>
                  </div>
                </div>
                <p className="text-xs text-mocha-500 mt-3 font-medium">
                  {displayStreak > 0
                    ? "꾸준한 집필이 최고의 작품을 만듭니다."
                    : "첫 걸음부터 다시 시작해볼까요?"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Project Total */}
          <motion.div variants={cardVariants}>
            <Card className="border-none shadow-paper bg-paper relative overflow-hidden group hover:shadow-paper-floating transition-all duration-300 rounded-xl">
              <div className="absolute left-0 top-0 w-1 h-full bg-[#7A8C6F]" />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-xs font-bold text-mocha-400 uppercase tracking-widest">
                  작품 현황
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Trophy className="w-4 h-4 text-[#7A8C6F]/60" />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-mocha-500 font-medium">
                      총 글자 수
                    </span>
                    <span className="text-2xl font-bold text-espresso-900">
                      {displayStats.totalWords.toLocaleString()}
                      <span className="text-xs font-normal ml-1 text-mocha-500">
                        자
                      </span>
                    </span>
                  </div>
                  <div className="my-2 h-px bg-muted" />
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-mocha-500">챕터 개수</span>
                    <span className="text-espresso-900">
                      {displayStats.chapterCount}개
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Heatmap Section */}
        <motion.div variants={cardVariants}>
          <Card className="border-none shadow-paper bg-paper p-2 group hover:shadow-paper-floating transition-all duration-300 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-espresso-900 flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Calendar className="w-5 h-5 text-mocha-500/60" />
                </motion.div>
                집필 활동 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-2 pt-16 -mt-10 px-1">
                <motion.div
                  className="flex gap-1 min-w-max"
                  initial="initial"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: { staggerChildren: 0.002 },
                    },
                  }}
                >
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                      {week.map((day, dIndex) => (
                        <motion.div
                          key={dIndex}
                          className="relative w-3 h-3 z-0 hover:z-50"
                          initial="rest"
                          whileHover="hover"
                        >
                          <motion.div
                            className={cn(
                              "w-full h-full rounded-[2px] cursor-pointer",
                              getIntensityColor(day.count),
                            )}
                            variants={{
                              initial: { opacity: 0, scale: 0.5 },
                              visible: { opacity: 1, scale: 1 },
                              rest: { scale: 1 },
                              hover: { scale: 1.5 },
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                          />
                          {day.date && (
                            <motion.div
                              className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap will-change-transform"
                              variants={{
                                rest: { opacity: 0, y: 5, scale: 0.9 },
                                hover: { opacity: 1, y: 0, scale: 1 },
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="bg-espresso-900/90 backdrop-blur-md text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl font-medium border border-white/10 tracking-tight subpixel-antialiased">
                                <span className="block text-center tabular-nums">
                                  {day.date}
                                </span>
                                <span className="block text-center font-bold text-mocha-100">
                                  {day.count.toLocaleString()} 자
                                </span>
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-espresso-900/90" />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              </div>
              <motion.div
                className="flex justify-end items-center gap-2 text-[10px] text-mocha-400 mt-4 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>적게 집필</span>
                <div className="flex gap-1.5">
                  {[
                    "hsl(var(--muted))",
                    "hsla(22, 28%, 52%, 0.2)",
                    "hsla(22, 28%, 52%, 0.5)",
                    "hsl(22, 28%, 39%)",
                    "hsl(22, 28%, 52%)",
                  ].map((color) => (
                    <motion.div
                      key={color}
                      className="w-3 h-3 rounded-[2px]"
                      style={{ backgroundColor: color }}
                      whileHover={{ scale: 1.3 }}
                    />
                  ))}
                </div>
                <span>많이 집필</span>
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

      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>일일 목표 설정</DialogTitle>
            <DialogDescription>
              하루에 작성할 목표 글자 수를 설정하세요. 꾸준한 집필의
              첫걸음입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="daily-goal" className="text-right">
                목표 글자 수
              </Label>
              <Input
                id="daily-goal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="col-span-3"
                type="number"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button intent="outline" onClick={() => setIsGoalDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveGoal} intent="primary">
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
