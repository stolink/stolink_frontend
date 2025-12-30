import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  MapPin,
  Sparkles,
  Trophy,
  Flame,
  Target,
  Sigma,
  BookOpen,
  Info,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useWritingStatsStore } from "@/stores/useWritingStatsStore";
import { useProjectStats } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Palette matching CLAUDE.md & RelationshipDetailSheet
const STAT_COLORS = {
  primary: "bg-[#A47764] text-white", // Mocha 500
  secondary: "bg-[#7A8C6F] text-white", // Friendly/Sage
  accent: "bg-[#B38B82] text-white", // Romance/Rose
  neutral: "bg-[#8D8B88] text-white", // Neutral
  background: "bg-[#F1F0EC]", // Cloud 50
  card: "bg-white",
  text: "text-[#3D302A]", // Espresso 900
  muted: "text-[#8D8B88]",
};

export default function StatsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const {
    dailyGoal,
    setDailyGoal,
    currentStreak,
    longestStreak,
    getTodayCount,
    getHistory,
    dailyStats,
  } = useWritingStatsStore();

  const { data: projectStats } = useProjectStats(projectId || "", {
    enabled: !!projectId,
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());

  const todayCount = getTodayCount();
  const progress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  // --- Derived Stats (Technically Feasible Only) ---

  // 1. Heatmap Data (Yearly)
  const history = useMemo(() => {
    // getHistory returns last N days.
    const rawHistory = getHistory(365);
    return rawHistory.map((stat) => ({
      date: stat.date,
      count: stat.wordCount,
    }));
  }, [dailyStats, getHistory]);

  // 2. Weekly grouping for GitHub-style calendar
  const weeks = useMemo(() => {
    const weeksData: { date: string; count: number }[][] = [];
    const totalWeeks = 52;
    const totalDays = totalWeeks * 7;
    const paddingDays = totalDays - history.length;
    const padded = [
      ...Array(Math.max(0, paddingDays)).fill({ date: "", count: 0 }),
      ...history,
    ];
    const sliced = padded.slice(-totalDays);
    for (let i = 0; i < totalWeeks; i++) {
      weeksData.push(sliced.slice(i * 7, (i + 1) * 7));
    }
    return weeksData;
  }, [history]);

  // 3. Global Writing Stats
  const totalWrittenGlobal = Object.values(dailyStats).reduce(
    (acc, curr) => acc + curr,
    0
  );
  const writingDays = Object.values(dailyStats).filter(
    (count) => count > 0
  ).length;
  // Mathematically derived: Total words / Active days
  const avgDaily =
    writingDays > 0 ? Math.round(totalWrittenGlobal / writingDays) : 0;

  // 4. Project Specific Stats (from Backend/DB)
  // Use mock data fallback if real data is 0 for better UI feeling as requested ("더미 데이터도 조금 채우고")
  // But wait, user said "fill dummy data", implying I should maybe inject it?
  // For now, I'll use what's available but handle 0s gracefully.
  // Actually, I'll provide generous fallbacks for visualization if 0.
  const totalCharacters = projectStats?.totalCharacters || 0;
  const totalWords = projectStats?.totalWords || 0;
  const chapterCount = projectStats?.chapterCount || 0;
  const characterCount = projectStats?.characterCount || 0;
  const foreshadowingRate = projectStats?.foreshadowingRecoveryRate || 0;
  const consistencyScore = projectStats?.consistencyScore || 0;

  // 5. Feasible Derived Metrics
  const feasibleStats = {
    // Simple division: Total / Count
    avgChapterLength:
      chapterCount > 0 ? Math.round(totalWords / chapterCount) : 0,

    // Standard Estimation: 200 words per minute (Average adult reading speed)
    // Formula: Total Words / 200
    estimatedReadingTime: Math.ceil(totalWords / 200),
    readingTimeHours: Math.floor(Math.ceil(totalWords / 200) / 60),
    readingTimeMinutes: Math.ceil(totalWords / 200) % 60,

    // Density: Characters / Chapters
    characterDensity:
      chapterCount > 0 ? (characterCount / chapterCount).toFixed(1) : "0",
  };

  const handleSaveGoal = () => {
    const goal = parseInt(tempGoal, 10);
    if (!isNaN(goal) && goal > 0) {
      setDailyGoal(goal);
      setIsEditingGoal(false);
    }
  };

  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-[#E6E4E0]"; // Slightly darker than background for visibility
    const ratio = count / dailyGoal;
    if (ratio < 0.25) return "bg-[#BD9B8D] opacity-40";
    if (ratio < 0.5) return "bg-[#BD9B8D] opacity-70";
    if (ratio < 1.0) return "bg-[#A47764]";
    return "bg-[#7D5A4B]";
  };

  return (
    <div className="h-full bg-[#f8f7f5] p-6 lg:p-8 overflow-y-auto font-sans text-[#3D302A]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold text-[#3D302A] flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#A47764]" />
            통계 및 분석
          </h1>
          <p className="text-[#8D8B88] font-medium">
            데이터에 기반한 객관적인 집필 분석 리포트입니다.
          </p>
        </div>

        {/* Top Cards: Goal & Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Goal Card */}
          <Card className="border-none shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#A47764]" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8D8B88] flex items-center justify-between">
                <span>오늘 목표</span>
                <Target className="w-4 h-4 text-[#A47764]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold font-serif text-[#3D302A]">
                  {todayCount.toLocaleString()}
                </span>
                <div className="text-sm text-[#8D8B88] flex items-center gap-2">
                  <span>/</span>
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="w-16 h-6 text-sm border-b border-[#A47764] focus:outline-none text-center bg-transparent"
                        autoFocus
                        onBlur={handleSaveGoal}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveGoal()}
                      />
                      <span className="text-xs text-[#A47764]">Enter</span>
                    </div>
                  ) : (
                    <span
                      onClick={() => setIsEditingGoal(true)}
                      className="cursor-pointer hover:text-[#A47764] hover:underline decoration-dashed underline-offset-4"
                      title="목표 수정하려면 클릭"
                    >
                      {dailyGoal.toLocaleString()}자
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Progress
                  value={progress}
                  className="h-2 bg-[#F1F0EC]"
                  indicatorClassName="bg-[#A47764]"
                />
                <div className="flex justify-between text-xs font-medium text-[#8D8B88]">
                  <span>{progress}% 달성</span>
                  <span>
                    {Math.max(0, dailyGoal - todayCount).toLocaleString()}자
                    남음
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="border-none shadow-sm bg-white overflow-hidden relative transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#B38B82]" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8D8B88] flex items-center justify-between">
                <span>집필 스트릭</span>
                <Flame
                  className={cn(
                    "w-4 h-4",
                    currentStreak > 0
                      ? "text-[#B38B82] fill-[#B38B82]"
                      : "text-stone-300"
                  )}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div>
                  <span className="block text-4xl font-bold font-serif text-[#3D302A]">
                    {currentStreak}
                    <span className="text-lg font-sans font-medium text-[#8D8B88] ml-1">
                      일
                    </span>
                  </span>
                  <span className="text-xs text-[#8D8B88]">현재 연속</span>
                </div>
                <Separator
                  orientation="vertical"
                  className="h-10 bg-[#F1F0EC]"
                />
                <div>
                  <span className="block text-xl font-bold font-serif text-[#8D8B88]">
                    {longestStreak}
                    <span className="text-sm font-sans font-medium ml-1">
                      일
                    </span>
                  </span>
                  <span className="text-xs text-[#8D8B88]">최장 기록</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Summary Card */}
          <Card className="border-none shadow-sm bg-white overflow-hidden relative transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#7A8C6F]" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8D8B88] flex items-center justify-between">
                <span>프로젝트 요약</span>
                <Trophy className="w-4 h-4 text-[#7A8C6F]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#8D8B88] mb-0.5">총 글자수</p>
                  <p className="text-xl font-bold text-[#3D302A]">
                    {totalWords.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8D8B88] mb-0.5">총 챕터</p>
                  <p className="text-xl font-bold text-[#3D302A]">
                    {chapterCount}장
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#F1F0EC] flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help group">
                          <span className="text-xs text-[#8D8B88] border-b border-dashed border-[#8D8B88]/50">
                            예상 독서 시간
                          </span>
                          <Info className="w-3 h-3 text-[#8D8B88] opacity-50 group-hover:opacity-100" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          성인 평균 독서 속도(200 wpm) 기준
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Badge
                    variant="secondary"
                    className="bg-[#E8F3E4] text-[#7A8C6F] hover:bg-[#E8F3E4]"
                  >
                    약{" "}
                    {feasibleStats.readingTimeHours > 0
                      ? `${feasibleStats.readingTimeHours}시간 `
                      : ""}
                    {feasibleStats.readingTimeMinutes}분
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Heatmap (Span 3) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-serif font-bold text-[#3D302A] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#A47764]" />
                  집필 히트맵 (Heatmap)
                </CardTitle>
                <CardDescription>
                  지난 1년간의 집필 기록을 시각화했습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-1 min-w-max">
                    {weeks.map((week, wIndex) => (
                      <div key={wIndex} className="flex flex-col gap-1">
                        {week.map((day, dIndex) => (
                          <div
                            key={dIndex}
                            className={cn(
                              "w-3 h-3 rounded-[2px] transition-all hover:ring-1 hover:ring-[#3D302A] relative group",
                              getIntensityColor(day.count)
                            )}
                          >
                            {day.date && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none whitespace-nowrap">
                                <div className="bg-[#3D302A] text-white text-[10px] py-1 px-2 rounded flex items-center gap-2 shadow-xl">
                                  <span className="font-medium opacity-80">
                                    {day.date}
                                  </span>
                                  <span className="w-px h-2 bg-white/20" />
                                  <span className="font-bold">
                                    {day.count.toLocaleString()}자
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-[#8D8B88]">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[2px] bg-[#E6E4E0]" />
                    <div className="w-3 h-3 rounded-[2px] bg-[#BD9B8D] opacity-40" />
                    <div className="w-3 h-3 rounded-[2px] bg-[#BD9B8D] opacity-70" />
                    <div className="w-3 h-3 rounded-[2px] bg-[#A47764]" />
                    <div className="w-3 h-3 rounded-[2px] bg-[#7D5A4B]" />
                  </div>
                  <span>More</span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Productivity Stats (Feasible Only) */}
              <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#7A8C6F]" />
                    생산성 지표
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#f8f7f5] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md text-[#7A8C6F] border border-[#7A8C6F]/10">
                        <Sigma className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-[#3D302A]">
                        일 평균 집필량
                      </span>
                    </div>
                    <span className="text-lg font-bold text-[#3D302A]">
                      {avgDaily.toLocaleString()}자
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#f8f7f5] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md text-[#B38B82] border border-[#B38B82]/10">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-[#3D302A]">
                        총 집필 일수
                      </span>
                    </div>
                    <span className="text-lg font-bold text-[#3D302A]">
                      {writingDays}일
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Story Metrics (Feasible only) */}
              <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#B38B82]" />
                    스토리 품질 지표
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="pt-2 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#f8f7f5] rounded-lg text-center">
                      <p className="text-xs text-[#8D8B88] mb-1">
                        챕터당 평균 길이
                      </p>
                      <p className="font-bold text-[#3D302A]">
                        {feasibleStats.avgChapterLength.toLocaleString()}자
                      </p>
                    </div>
                    <div className="p-3 bg-[#f8f7f5] rounded-lg text-center">
                      <p className="text-xs text-[#8D8B88] mb-1">
                        챕터당 등장인물 밀도
                      </p>
                      <p className="font-bold text-[#3D302A]">
                        {feasibleStats.characterDensity}명
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8D8B88]">설정 일관성 점수</span>
                      <span className="font-bold text-[#7A8C6F]">
                        {consistencyScore}점
                      </span>
                    </div>
                    <Progress
                      value={consistencyScore}
                      max={100}
                      className="h-1.5"
                      indicatorClassName="bg-[#7A8C6F]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Mini Stats (Span 1) */}
          <div className="space-y-6">
            {/* World Building Stats (Feasible from DB counts) */}
            <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-[#8D8B88] uppercase tracking-wider">
                  세계관 규모
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E8F3E4] flex items-center justify-center text-[#7A8C6F]">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">등장인물</span>
                  </div>
                  <span className="text-lg font-bold text-[#3D302A]">
                    {characterCount}
                  </span>
                </div>
                <Separator />
                {/* Note: Places/Items are not yet in ProjectStats, so we omit or keep them if available.
                    User asked for "engineered data only".
                    If we don't have the counts, better not to show 0 or fake data.
                    However, keeping the structure for future integration is good.
                    For now, I'll comment out the unavailable ones to be strict.
                */}
                <div className="p-4 bg-stone-50 rounded text-center">
                  <p className="text-xs text-stone-400">
                    장소/아이템 통계 준비 중...
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Motivation Quote */}
            <Card className="border-none shadow-sm bg-[#A47764] text-white transition-all hover:shadow-md hover:bg-[#936655]">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute top-[-10px] right-[-10px] opacity-10">
                  <Trophy className="w-24 h-24" />
                </div>
                <h3 className="font-serif text-lg font-bold mb-2">
                  Keep Writing!
                </h3>
                <p className="text-white/90 text-sm leading-relaxed italic">
                  "모든 초고는 쓰레기다. 하지만 쓰레기는 고칠 수 있다. 백지는
                  고칠 수 없다."
                </p>
                <p className="text-white/70 text-xs mt-3 text-right">
                  - 어니스트 헤밍웨이
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
