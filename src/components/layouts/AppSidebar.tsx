import { NavLink, useNavigate } from "react-router-dom";
import {
  PenLine,
  BookOpen,
  BarChart3,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores";
import { useLogout } from "@/hooks/useAuth";
import mainLogo from "@/assets/main_logo.png";

interface AppSidebarProps {
  projectId: string;
  projectTitle?: string;
}

export function AppSidebar({ projectId, projectTitle }: AppSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mutate: performLogout } = useLogout();

  const navItems = [
    { to: `/projects/${projectId}/editor`, label: "에디터", icon: PenLine },
    { to: `/projects/${projectId}/world`, label: "리소스", icon: BookOpen },
    { to: `/projects/${projectId}/stats`, label: "분석", icon: BarChart3 },
    {
      to: `/projects/${projectId}/settings`,
      label: "프로젝트 설정",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    performLogout();
    // navigate is handled by useLogout hook
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <aside
      className="w-64 bg-cloud-50/50 border-r border-border flex flex-col h-screen"
      role="navigation"
      aria-label="메인 네비게이션"
    >
      {/* 상단: 로고 + 프로젝트 제목 */}
      <div className="p-6 border-b border-border">
        <NavLink to="/library" className="block">
          <img
            src={mainLogo}
            alt="Sto-Link"
            className="h-8 mb-3 hover:opacity-80 transition-opacity"
          />
        </NavLink>
        <h2 className="text-sm font-medium text-foreground truncate">
          {projectTitle || "내 작품"}
        </h2>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-mocha-600 shadow-sm border border-cloud-100"
                  : "text-muted-foreground hover:bg-white/60 hover:text-mocha-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn("h-4 w-4", isActive && "text-mocha-600")}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 하단: 유저 영역 */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/library"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60 cursor-pointer transition-colors mb-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user?.nickname?.[0]?.toUpperCase() || "ME"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.nickname || "작가님"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </NavLink>

        <Separator className="my-2" />

        <button
          onClick={handleSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-white/60 hover:text-mocha-600 rounded-lg transition-colors"
        >
          <User className="h-4 w-4" />
          개인 설정
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
