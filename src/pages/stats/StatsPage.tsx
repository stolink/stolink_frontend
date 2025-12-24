import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  Users,
  MapPin,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default function StatsPage() {
  // Mock 통계 데이터
  const stats = {
    totalCharacters: 45230,
    totalChapters: 12,
    totalSections: 28,
    writingDays: 45,
    avgDailyWords: 1005,
    characters: 8,
    places: 5,
    items: 12,
    foreshadowings: {
      total: 15,
      pending: 7,
      recovered: 8,
    },
  };

  const weeklyProgress = [
    { day: "월", count: 1200 },
    { day: "화", count: 890 },
    { day: "수", count: 1450 },
    { day: "목", count: 0 },
    { day: "금", count: 2100 },
    { day: "토", count: 1800 },
    { day: "일", count: 950 },
  ];

  const maxCount = Math.max(...weeklyProgress.map((d) => d.count));

  return (
    <div className="h-full overflow-y-auto bg-paper p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          icon={BarChart3}
          title="통계"
          description="작품의 진행 상황과 집필 통계를 확인하세요"
        />

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            value={stats.totalCharacters}
            label="총 글자수"
            color="sage"
          />
          <StatCard
            icon={Calendar}
            value={`${stats.writingDays}일`}
            label="집필 일수"
            color="amber"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.avgDailyWords}
            label="일평균 글자"
            color="blue"
          />
          <StatCard
            icon={Clock}
            value={stats.totalSections}
            label="총 섹션 수"
            color="purple"
          />
        </div>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주간 집필량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyProgress.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-sage-200 rounded-t transition-all hover:bg-sage-300"
                    style={{
                      height: `${maxCount > 0 ? (day.count / maxCount) * 100 : 0}%`,
                      minHeight: day.count > 0 ? "8px" : "2px",
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {day.day}
                  </span>
                  <span className="text-xs font-medium">
                    {day.count > 0 ? day.count.toLocaleString() : "-"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            value={stats.characters}
            label="등장인물"
            color="sage"
            centered
          />
          <StatCard
            icon={MapPin}
            value={stats.places}
            label="장소"
            color="amber"
            centered
          />
          <StatCard
            icon={Package}
            value={stats.items}
            label="아이템"
            color="blue"
            centered
          />
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🔮</span>
              </div>
              <p className="text-2xl font-bold">
                <span className="text-amber-500">
                  {stats.foreshadowings.pending}
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-green-500">
                  {stats.foreshadowings.recovered}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                복선 (미회수/회수)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
