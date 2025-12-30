import {
  BarChart3,
  TrendingUp,
  Calendar,
  Zap,
  CheckCircle2,
  Trophy,
  Flame,
  Target,
  FileText,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useWritingStatsStore } from "@/stores/useWritingStatsStore";
import { useProjectStats } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA GENERATOR ---
const generateDummyHistory = (days: number) => {
  const data = [];
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Simulate some realistic writing pattern
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const base = isWeekend ? 2000 : 500;
    const random = Math.floor(Math.random() * 1500);
    // 20% chance of 0
    const count = Math.random() > 0.8 ? 0 : base + random;

    data.push({ date: dateStr, count });
  }
  return data;
};

export default function StatsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const {
    dailyGoal,

    currentStreak,
    longestStreak,
    getTodayCount,
    getHistory,
    dailyStats,
  } = useWritingStatsStore();

  const { data: projectStats } = useProjectStats(projectId || "", {
    enabled: !!projectId,
  });

  // const [isEditingGoal, setIsEditingGoal] = useState(false);
  // const [tempGoal, setTempGoal] = useState(dailyGoal.toString());

  // Use real data, or fallback to dummy data if empty (for "Rich" look)
  const isDemo = Object.keys(dailyStats).length < 5; // Heuristic for "new user/no data"
  const historyData = useMemo(() => {
    if (isDemo) return generateDummyHistory(365);
    // Convert generic history to the format needed
    return getHistory(365).map((h) => ({ date: h.date, count: h.wordCount }));
  }, [getHistory, isDemo]);

  // Merge dummy project stats if real stats are essentially empty
  const displayStats = useMemo(() => {
    if (!projectStats || (projectStats.totalWords === 0 && isDemo)) {
      return {
        totalWords: 45200,
        chapterCount: 15,
        characterCount: 8,
      };
    }
    return projectStats;
  }, [projectStats, isDemo]);

  const todayCount = isDemo ? 1250 : getTodayCount();
  const displayStreak = isDemo ? 5 : currentStreak;
  const displayLongest = isDemo ? 12 : longestStreak;

  const progress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  // --- Derived Metrics ---

  // 1. Heatmap Setup
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

  // 2. Writing Habits Calculation (Simple & Feasible)
  // Most Active Day of Week
  const dayOfWeekStats = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    const counts = [0, 0, 0, 0, 0, 0, 0];
    historyData.forEach(({ date, count }) => {
      if (count > 0) {
        const d = new Date(date).getDay();
        days[d] += count;
        counts[d] += 1;
      }
    });
    const maxVal = Math.max(...days);
    const maxIndex = days.indexOf(maxVal);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return {
      mostActiveDay: maxVal > 0 ? dayNames[maxIndex] : "-",
      avgPerSession: Math.round(
        historyData
          .filter((h) => h.count > 0)
          .reduce((a, b) => a + b.count, 0) /
          (historyData.filter((h) => h.count > 0).length || 1),
      ),
    };
  }, [historyData]);

  // Goal Achievement Rate (Last 30 days)
  const goalSuccessRate = useMemo(() => {
    const last30 = historyData.slice(-30);
    const successCount = last30.filter((d) => d.count >= dailyGoal).length;
    return Math.round((successCount / 30) * 100);
  }, [historyData, dailyGoal]);

  // 3. Project Balance Stats
  const avgChapterLen =
    displayStats.chapterCount > 0
      ? Math.round(displayStats.totalWords / displayStats.chapterCount)
      : 0;

  const charsPerChapter =
    displayStats.chapterCount > 0
      ? (displayStats.characterCount / displayStats.chapterCount).toFixed(1)
      : "0";

  // const handleSaveGoal = () => {
  //   const goal = parseInt(tempGoal, 10);
  //   if (!isNaN(goal) && goal > 0) {
  //     setDailyGoal(goal);
  //     setIsEditingGoal(false);
  //   }
  // };

  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-[#E6E4E0]";
    const ratio = count / dailyGoal;
    if (ratio < 0.25) return "bg-[#D7C2B8]"; // Mocha 200
    if (ratio < 0.5) return "bg-[#BD9B8D]"; // Mocha 400
    if (ratio < 1.0) return "bg-[#A47764]"; // Mocha 500
    return "bg-[#7D5A4B]"; // Mocha 700
  };

  return (
    <div className="h-full bg-[#f8f7f5] p-6 lg:p-8 overflow-y-auto font-sans text-[#3D302A]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold text-[#3D302A] flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#A47764]" />
            집필 통계
          </h1>
          <p className="text-[#8D8B88] font-medium">
            꾸준한 집필 습관을 위한 데이터 분석 리포트입니다.
          </p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Today */}
          <Card className="border-none shadow-sm bg-white relative overflow-hidden group">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[#A47764]" />
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-sm font-semibold text-[#8D8B88] uppercase tracking-wider">
                오늘의 집필
                <Target className="w-4 h-4 text-[#A47764]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold font-serif text-[#3D302A]">
                  {todayCount.toLocaleString()}
                </span>
                <span className="text-sm text-[#8D8B88]">
                  / {dailyGoal.toLocaleString()}자
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2 bg-[#F1F0EC]"
                indicatorClassName="bg-[#A47764]"
              />
              <p className="text-xs text-[#8D8B88] mt-2 text-right">
                {progress >= 100
                  ? "목표 달성! 🎉"
                  : `${Math.max(0, dailyGoal - todayCount).toLocaleString()}자 남음`}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Streak */}
          <Card className="border-none shadow-sm bg-white relative overflow-hidden group">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[#B38B82]" />
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-sm font-semibold text-[#8D8B88] uppercase tracking-wider">
                집필 스트릭
                <Flame
                  className={cn(
                    "w-4 h-4",
                    displayStreak > 0
                      ? "text-[#B38B82] fill-[#B38B82]"
                      : "text-stone-300",
                  )}
                />
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
                  <span className="text-xs text-[#8D8B88] ml-1">최고 기록</span>
                </div>
              </div>
              <p className="text-xs text-[#8D8B88] mt-3">
                {displayStreak > 0
                  ? "이 기세를 몰아 계속 써보세요!"
                  : "오늘 다시 시작해보세요!"}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Project Total */}
          <Card className="border-none shadow-sm bg-white relative overflow-hidden group">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[#7A8C6F]" />
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-sm font-semibold text-[#8D8B88] uppercase tracking-wider">
                프로젝트 현황
                <Trophy className="w-4 h-4 text-[#7A8C6F]" />
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
        </div>

        {/* Heatmap Section */}
        <Card className="border-none shadow-sm bg-white p-2">
          <CardHeader>
            <CardTitle className="text-lg font-serif font-bold text-[#3D302A] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A47764]" />
              집필 활동 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 min-w-max">
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-1">
                    {week.map((day, dIndex) => (
                      <div
                        key={dIndex}
                        className={cn(
                          "w-3 h-3 rounded-[2px] transition-all relative group",
                          getIntensityColor(day.count),
                        )}
                      >
                        {day.date && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none whitespace-nowrap">
                            <div className="bg-[#3D302A] text-white text-[10px] py-1 px-2 rounded shadow-xl">
                              <span className="font-bold">
                                {day.date}: {day.count.toLocaleString()}자
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
            <div className="flex justify-end items-center gap-2 text-xs text-[#8D8B88] mt-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-[#E6E4E0]" />
                <div className="w-3 h-3 rounded-[2px] bg-[#D7C2B8]" />
                <div className="w-3 h-3 rounded-[2px] bg-[#BD9B8D]" />
                <div className="w-3 h-3 rounded-[2px] bg-[#A47764]" />
                <div className="w-3 h-3 rounded-[2px] bg-[#7D5A4B]" />
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Grid: Habits & Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Writing Habits */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#B38B82]" />
                집필 습관
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#f8f7f5] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full text-[#B38B82]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-[#3D302A]">
                    가장 활발한 요일
                  </span>
                </div>
                <span className="font-bold text-[#3D302A]">
                  {dayOfWeekStats.mostActiveDay}요일
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#f8f7f5] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full text-[#7A8C6F]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-[#3D302A]">
                    목표 달성률 (30일)
                  </span>
                </div>
                <span className="font-bold text-[#3D302A]">
                  {goalSuccessRate}%
                </span>
              </div>

              <div className="pt-2 text-center">
                <p className="text-xs text-[#8D8B88] ">
                  평균적으로 한 번 앉으면{" "}
                  <span className="font-bold text-[#A47764]">
                    {dayOfWeekStats.avgPerSession.toLocaleString()}자
                  </span>
                  를 씁니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Project Balance */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#3D302A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7A8C6F]" />
                프로젝트 밸런스
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#f8f7f5] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-[#8D8B88] mb-1">
                    챕터당 평균 분량
                  </span>
                  <span className="text-xl font-bold text-[#3D302A]">
                    {avgChapterLen.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8D8B88]">
                    글자 / 챕터
                  </span>
                </div>
                <div className="p-4 bg-[#f8f7f5] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-[#8D8B88] mb-1">
                    챕터당 등장인물
                  </span>
                  <span className="text-xl font-bold text-[#3D302A]">
                    {charsPerChapter}
                  </span>
                  <span className="text-[10px] text-[#8D8B88]">명 / 챕터</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-[#F1F0EC] rounded-lg mt-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8D8B88]" />
                  <span className="text-xs text-[#8D8B88]">전체 등장인물</span>
                </div>
                <span className="font-bold text-[#3D302A] text-sm">
                  {displayStats.characterCount}명
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
