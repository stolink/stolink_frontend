import { useState } from "react";
import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import {
  PenLine,
  BookOpen,
  BarChart3,
  Download,
  Settings,
  User,
  LogOut,
  Eye,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { BookReaderModal } from "@/components/common/BookReaderModal";

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReader, setShowReader] = useState(false);

  // 미리보기용 데모 챕터 데이터 (충분한 분량)
  const demoChapters = [
    {
      id: "ch1",
      title: "1장: 운명의 밤",
      content: `건조한 날씨가 계속되던 어느 봄날, 마을 외곽의 오래된 숲속에서 한 아이가 태어났다. 그 아이의 울음소리는 어디선가 불어온 바람을 타고 멀리 퍼져나갔다. 마을 사람들은 그 소리를 듣고도 아무도 그쪽으로 가려 하지 않았다. 숲은 오래전부터 금기의 땅이었기 때문이다.

그날 밤, 하늘에는 유난히 밝은 별이 떠 있었다. 마을 사람들은 그것이 좋은 징조라고 수군대며 이야기했지만, 장로의 집에서 어둠 속을 지키던 노인만이 그 의미를 진정으로 알고 있었다. 그는 고대 문헌에서 이 별에 대해 읽은 적이 있었다. "운명의 별"이라 불리는 그것은 천 년에 한 번 나타난다고 했다.

"이 아이는... 특별한 운명을 타고났다." 노인은 흐릿한 눈으로 아이를 바라보며 중얼거렸다. 그의 손은 미세하게 떨리고 있었다. 그것이 기쁨 때문인지 두려움 때문인지는 그 자신도 알 수 없었다.

아이의 어머니는 출산의 고통 속에서도 미소를 잃지 않았다. "이 아이는 큰 인물이 될 거예요." 그녀의 목소리는 약했지만 확신에 차 있었다. 하지만 그녀는 알지 못했다. 자신의 아이가 짊어지게 될 운명의 무게를.

노인은 방을 나서며 밤하늘을 올려다보았다. 별은 여전히 빛나고 있었다. 하지만 그 빛 속에는 어딘가 불길한 그림자가 드리워져 있는 것 같았다. "시작되는구나..." 그는 읊조렸다. "천 년 만에 다시, 모든 것이 시작되는구나."

다음 날 아침, 마을에는 이상한 소문이 돌기 시작했다. 숲속에서 태어난 아이가 기이한 힘을 가지고 있다는 것이었다. 물론 그것은 단순한 미신일 수도 있었다. 하지만 마을 사람들의 눈빛은 이미 경계심으로 물들어 있었다.`,
    },
    {
      id: "ch2",
      title: "2장: 첫 만남",
      content: `십 년의 세월이 흐른 뒤, 소년은 마을의 가장 큰 나무 아래에서 목검을 수련하고 있었다. 그의 움직임은 정확하고 날카로웠다. 누가 가르쳐 준 것도 아닌데, 그는 마치 태어날 때부터 검을 잡아 본 것처럼 자연스러웠다.

확 트인 공터. 나무 기둥에 걸어둔 향주머니에 목검이 정확히 꽂혔다. 소년은 만족스러운 듯 고개를 끄덕였다. 하지만 그의 눈빛에는 어딘가 공허함이 서려 있었다. 마을에서 그를 친구로 받아들이는 아이는 거의 없었다. "저주받은 아이"라는 낙인이 그를 따라다녔기 때문이다.

"오늘은 어때?" 뒤에서 들려온 목소리에 소년이 돌아보았다. 그 순간, 시간이 멈춘 것 같았다.

그곳에 있던 것은 소년과 비슷한 또래의 한 소녀였다. 은발이 바람에 날리고, 눈은 맑은 하늘빛 같았다. 그녀는 이 마을 사람이 아니었다. 그녀의 옷차림과 분위기는 어딘가 먼 곳에서 왔음을 말해주고 있었다.

"누... 누구세요?" 소년이 더듬거리며 물었다. 처음 보는 얼굴에, 그것도 자신에게 먼저 말을 거는 사람에게 그는 어떻게 반응해야 할지 몰랐다.

소녀는 미소를 지었다. "나? 나는 그냥 여행자야. 이 마을을 지나가던 길에 네 수련하는 모습을 봤어. 꽤 대단하더라." 그녀의 말투는 친근했지만, 그 눈 속에는 무언가를 숨기고 있는 듯한 깊이가 있었다.

"정말요?" 소년의 얼굴에 처음으로 밝은 빛이 떠올랐다. 누군가가 그를 인정해주는 것은 정말 오랜만이었다. 아니, 어쩌면 처음이었을지도 모른다.

"응, 정말이야. 하지만..." 소녀는 소년의 목검을 가리키며 말했다. "그 검술, 어디서 배운 거야? 보통이 아닌데."

소년은 고개를 저었다. "배운 적 없어요. 그냥... 할 수 있게 됐어요." 그의 대답에 소녀의 눈빛이 미묘하게 변했다. 하지만 소년은 그것을 눈치채지 못했다.`,
    },
    {
      id: "ch3",
      title: "3장: 시련",
      content: `"막아야 한다!" 소년이 소리쳤다. 그러나 그의 목소리는 폭풍우 속에 묻히고 말았다. 하늘은 검은 구름으로 뒤덮이고, 번개가 끊임없이 내리치고 있었다. 이런 날씨는 이 마을에서 본 적이 없었다.

검은 기운이 마을을 덮쳤다. 그 속에서 소년은 어린 시절부터 자신을 따라다니던 이상한 느낌을 다시 한번 감지했다. 가슴 속에서 뜨거운 무언가가 꿈틀거리고 있었다. 그것은 두려움이 아니었다. 오히려 그 반대에 가까웠다.

"결국 움직이는군." 어둠 속에서 누군가의 목소리가 들려왔다. 그 목소리는 차갑고 메마른 것이었다. 마치 오랜 세월 동안 어둠 속에 잠들어 있었던 것이 깨어난 것 같았다.

소년이 고개를 들었다. 어둠 속에서 두 눈이 붉게 빛나고 있었다. 거대한 형체가 서서히 모습을 드러냈다. 그것은 이 세상의 것이 아닌 듯한 괴물이었다. 온몸이 검은 비늘로 덮여 있었고, 입에서는 독기가 피어오르고 있었다.

"천 년을 기다렸다..." 괴물이 입을 열었다. "운명의 아이여, 드디어 만나게 되었군."

소년은 두려움에 멈춰 서야 했지만, 그의 몸은 오히려 앞으로 나아갔다. 목검을 쥔 손에 힘이 들어갔다. "당신이... 뭔데요?" 그의 목소리는 떨리지 않았다. 스스로도 놀라울 정도로.

"나는 네가 태어난 그날 밤부터 널 지켜봐왔다." 괴물이 말했다. "네 안에 잠든 힘... 그것은 나의 것이었다. 천 년 전, 한 인간에게 빼앗긴 나의 힘. 이제 되찾을 때가 되었다."

바람이 거세게 불었다. 소년의 은발이 휘날렸다. 그의 눈이 순간 금빛으로 빛났다. 본인도 몰랐던 힘이 깨어나려 하고 있었다.

"이 아이를 건드리지 마!" 어디선가 익숙한 목소리가 들려왔다. 돌아보니 그 은발의 소녀가 서 있었다. 하지만 그녀의 모습은 처음 만났을 때와는 완전히 달랐다. 그녀의 손에는 빛나는 검이 들려 있었고, 온몸에서 푸른 오오라가 피어오르고 있었다.`,
    },
  ];

  const navItems = [
    { to: `/projects/${id}/editor`, label: "에디터", icon: PenLine },
    { to: `/projects/${id}/studio`, label: "스튜디오", icon: Clapperboard },
    { to: `/projects/${id}/world`, label: "설정집", icon: BookOpen },
    { to: `/projects/${id}/stats`, label: "통계", icon: BarChart3 },
    { to: `/projects/${id}/export`, label: "파일", icon: Download },
    { to: `/projects/${id}/settings`, label: "관리", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-paper">
      {/* Header */}
      <header className="h-14 border-b bg-paper flex items-center justify-between px-4 shrink-0 z-20 relative">
        {/* Left: Navigation & Title */}
        <div className="flex items-center gap-4 min-w-[240px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/library")}
              className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-stone-100 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span className="text-sm font-medium">서재</span>
            </button>
            <div className="h-6 w-px bg-stone-200" />
            <img
              src="/src/assets/main_logo.png"
              alt="Sto-Link"
              className="h-12 w-auto"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-semibold text-sm text-foreground">
                마법사의 여정
              </h1>
              <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-[10px] font-medium text-stone-600 border border-stone-200">
                DRAFT 1
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">저장됨</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center p-1 bg-stone-100/50 rounded-lg border border-transparent">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-tour={item.to.includes("world") ? "world-tab" : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-sage-600 shadow-sm border-stone-200"
                    : "text-muted-foreground hover:text-foreground hover:bg-stone-200/50",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-3 min-w-[240px] justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowReader(true)}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden lg:inline">미리보기</span>
          </Button>

          {/* User Menu Dropdown Trigger (Avatar) */}
          <div className="relative pl-2 border-l border-stone-200">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full border-2 border-white bg-sage-200 flex items-center justify-center text-xs font-medium text-sage-700 hover:ring-2 hover:ring-sage-200 transition-all focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              {user?.nickname?.[0] || "ME"}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border z-50 py-2 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b">
                    <p className="font-medium text-sm">
                      {user?.nickname || "작가님"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                  <div className="py-1">
                    <NavLink
                      to="/library"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-stone-50 transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />내 서재
                    </NavLink>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-stone-50 transition-colors">
                      <User className="h-4 w-4" />
                      프로필 설정
                    </button>
                  </div>
                  <div className="border-t pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Book Reader Modal */}
      <BookReaderModal
        isOpen={showReader}
        onClose={() => setShowReader(false)}
        chapters={demoChapters}
        bookTitle="마법사의 여정"
      />
    </div>
  );
}
