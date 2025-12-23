import { BarChart3, TrendingUp, Calendar, Clock, FileText, Users, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    { day: '월', count: 1200 },
    { day: '화', count: 890 },
    { day: '수', count: 1450 },
    { day: '목', count: 0 },
    { day: '금', count: 2100 },
    { day: '토', count: 1800 },
    { day: '일', count: 950 },
  ];

  const maxCount = Math.max(...weeklyProgress.map(d => d.count));

  return (
    <div className="h-full overflow-y-auto bg-paper p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-sage-500" />
            통계
          </h1>
          <p className="text-muted-foreground mt-1">
            작품의 진행 상황과 집필 통계를 확인하세요
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-sage-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCharacters.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">총 글자수</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.writingDays}일</p>
                  <p className="text-xs text-muted-foreground">집필 일수</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgDailyWords.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">일평균 글자</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSections}</p>
                  <p className="text-xs text-muted-foreground">총 섹션 수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주간 집필량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-sage-200 rounded-t transition-all hover:bg-sage-300"
                    style={{
                      height: `${maxCount > 0 ? (day.count / maxCount) * 100 : 0}%`,
                      minHeight: day.count > 0 ? '8px' : '2px'
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                  <span className="text-xs font-medium">{day.count > 0 ? day.count.toLocaleString() : '-'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-sage-500 mb-2" />
              <p className="text-2xl font-bold">{stats.characters}</p>
              <p className="text-xs text-muted-foreground">등장인물</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">{stats.places}</p>
              <p className="text-xs text-muted-foreground">장소</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.items}</p>
              <p className="text-xs text-muted-foreground">아이템</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🔮</span>
              </div>
              <p className="text-2xl font-bold">
                <span className="text-amber-500">{stats.foreshadowings.pending}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-green-500">{stats.foreshadowings.recovered}</span>
              </p>
              <p className="text-xs text-muted-foreground">복선 (미회수/회수)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
