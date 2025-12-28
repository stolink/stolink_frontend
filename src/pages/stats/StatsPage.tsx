import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  Users,
  MapPin,
  Package,
  Target,
  Trophy,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useWritingStatsStore } from "@/stores/useWritingStatsStore";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const {
    dailyGoal,
    setDailyGoal,
    currentStreak,
    longestStreak,
    getTodayCount,
    getHistory,
    dailyStats,
  } = useWritingStatsStore();

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());

  const todayCount = getTodayCount();
  const progress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  const handleSaveGoal = () => {
    const goal = parseInt(tempGoal, 10);
    if (!isNaN(goal) && goal > 0) {
      setDailyGoal(goal);
      setIsEditingGoal(false);
    }
  };

  // 히트맵 데이터 (지난 365일)
  const history = useMemo(() => {
    const rawHistory = getHistory(365);
    return rawHistory.map((stat) => ({
      date: stat.date,
      count: stat.wordCount,
    }));
  }, [dailyStats]); // dailyStats가 바뀌면 갱신

  // 히트맵 색상 결정
  const getLevelColor = (count: number) => {
    if (count === 0) return "bg-stone-100";
    if (count < dailyGoal * 0.25) return "bg-sage-200";
    if (count < dailyGoal * 0.5) return "bg-sage-300";
    if (count < dailyGoal * 1.0) return "bg-sage-400";
    return "bg-sage-600";
  };

  // 주 단위로 데이터 그룹화 (히트맵 그리드용 - ProductivityDashboard 로직 재사용)
  const weeks = useMemo(() => {
    const weeksData: { date: string; count: number }[][] = [];
    const totalWeeks = 52;
    const totalDays = totalWeeks * 7;
    const paddingDays = totalDays - history.length;

    // 데이터 채우기
    const padded = [
      ...Array(Math.max(0, paddingDays)).fill({ date: "", count: 0 }),
      ...history,
    ];
    const sliced = padded.slice(-totalDays);

    // 열(주) 단위로 묶기
    for (let i = 0; i < totalWeeks; i++) {
      weeksData.push(sliced.slice(i * 7, (i + 1) * 7));
    }

    return weeksData;
  }, [history]);

  // 총 글자수 계산 (dailyStats 합계)
  const totalWritten = useMemo(() => {
    return Object.values(dailyStats).reduce((acc, curr) => acc + curr, 0);
  }, [dailyStats]);

  // 집필 일수
  const writingDays = useMemo(() => {
    return Object.values(dailyStats).filter((count) => count > 0).length;
  }, [dailyStats]);

  // 일평균 (집필 일수 기준)
  const avgDaily = writingDays > 0 ? Math.round(totalWritten / writingDays) : 0;

  return (
    <div className="h-full overflow-y-auto bg-paper p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          icon={BarChart3}
          title="통계 분석"
          description="작품의 진행 상황과 집필 습관을 분석합니다"
        />

        {/* Goal & Streak Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 일일 목표 */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-stone-500">
                <Target className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  오늘 목표
                </span>
              </div>
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-20 h-8 text-sm border border-sage-300 rounded px-2 focus:outline-none focus:ring-2 focus:ring-sage-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGoal}
                    className="text-sm text-sage-600 font-bold hover:underline"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempGoal(dailyGoal.toString());
                    setIsEditingGoal(true);
                  }}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                >
                  목표 수정
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold text-stone-800">
                {todayCount.toLocaleString()}
              </span>
              <span className="text-lg text-stone-500">
                / {dailyGoal.toLocaleString()}자
              </span>
            </div>

            {/* 프로그레스 바 */}
            <div className="mt-4 h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-stone-500 mt-2 text-right font-medium">
              {progress}% 달성
            </p>
          </div>

          {/* 스트릭 */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Flame
                className={cn(
                  "w-5 h-5",
                  currentStreak > 0 ? "text-amber-500" : "text-stone-400"
                )}
              />
              <span className="text-sm font-semibold uppercase tracking-wider">
                현재 스트릭
              </span>
            </div>
            <div>
              <span className="text-4xl font-bold text-stone-800">
                {currentStreak}
              </span>
              <span className="text-lg text-stone-500 ml-1">일 연속</span>
            </div>
            <p className="text-sm text-stone-400 mt-2">
              매일 조금이라도 써보세요!
            </p>
          </div>

          {/* 최장 기록 */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                최장 기록
              </span>
            </div>
            <div>
              <span className="text-4xl font-bold text-stone-800">
                {longestStreak}
              </span>
              <span className="text-lg text-stone-500 ml-1">일</span>
            </div>
            <p className="text-sm text-stone-400 mt-2">
              나의 최고 기록을 깨보세요
            </p>
          </div>
        </div>

        {/* Heatmap Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-stone-500" />
                연간 집필 히트맵
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <span>적음</span>
                <div className="flex gap-0.5 mx-1">
                  <div className="w-3 h-3 bg-stone-100 rounded-sm" />
                  <div className="w-3 h-3 bg-sage-200 rounded-sm" />
                  <div className="w-3 h-3 bg-sage-300 rounded-sm" />
                  <div className="w-3 h-3 bg-sage-400 rounded-sm" />
                  <div className="w-3 h-3 bg-sage-600 rounded-sm" />
                </div>
                <span>많음</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 min-w-max mx-auto justify-center">
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-1">
                    {week.map((day, dIndex) => (
                      <div
                        key={dIndex}
                        className={cn(
                          "w-3 h-3 rounded-sm transition-colors relative group",
                          getLevelColor(day.count)
                        )}
                        title={`${day.date}: ${day.count}자`}
                      >
                        {day.date && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 pointer-events-none whitespace-nowrap">
                            <div className="bg-stone-800 text-white text-[10px] py-1 px-2 rounded flex items-center gap-1.5 shadow-xl">
                              <span className="font-medium">{day.date}</span>
                              <span className="w-px h-2 bg-stone-600" />
                              <span>{day.count.toLocaleString()}자</span>
                            </div>
                            <div className="w-2 h-2 bg-stone-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-stone-400 px-4">
                <span>1년 전</span>
                <span>오늘</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            value={totalWritten.toLocaleString()}
            label="누적 집필량"
            color="sage"
          />
          <StatCard
            icon={Calendar}
            value={`${writingDays.toLocaleString()}일`}
            label="총 집필 일수"
            color="amber"
          />
          <StatCard
            icon={TrendingUp}
            value={avgDaily.toLocaleString()}
            label="일평균 글자"
            color="blue"
          />
          <StatCard
            icon={Clock}
            value={"-"} // TODO: 총 시간 추적 기능 추가 시 연동
            label="총 집필 시간"
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}
