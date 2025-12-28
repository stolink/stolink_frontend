import { NavLink, useNavigate } from "react-router-dom";
import {
  PenLine,
  Clapperboard,
  BookOpen,
  BarChart3,
  Settings,
  User,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ActivityBarProps {
  projectId: string;
}

interface ActivityBarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

function ActivityBarItem({ to, icon: Icon, label, onClick }: ActivityBarItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "relative flex items-center justify-center w-full h-12 group transition-colors",
          isActive
            ? "text-sage-600"
            : "text-stone-500 hover:text-sage-600"
        )
      }
      title={label}
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5" />

          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sage-600 rounded-r" />
          )}

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {label}
          </div>
        </>
      )}
    </NavLink>
  );
}

export function ActivityBar({ projectId }: ActivityBarProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const navItems = [
    { to: `/projects/${projectId}/editor`, label: "에디터", icon: PenLine },
    { to: `/projects/${projectId}/studio`, label: "스튜디오", icon: Clapperboard },
    { to: `/projects/${projectId}/world`, label: "리소스", icon: BookOpen },
    { to: `/projects/${projectId}/stats`, label: "분석", icon: BarChart3 },
    { to: `/projects/${projectId}/settings`, label: "프로젝트 설정", icon: Settings },
  ];

  return (
    <aside
      className="w-16 bg-stone-100 border-r border-stone-200 flex flex-col items-center shrink-0"
      role="navigation"
      aria-label="주요 네비게이션"
    >
      {/* Top: Home (Library) */}
      <div className="w-full border-b border-stone-200">
        <button
          onClick={() => navigate("/library")}
          className="flex items-center justify-center w-full h-14 text-stone-500 hover:text-sage-600 hover:bg-stone-50 transition-colors group relative"
          title="서재로 이동"
          aria-label="서재로 이동"
        >
          <Home className="h-5 w-5" />

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            서재
          </div>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 w-full py-2">
        {navItems.map((item) => (
          <ActivityBarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>

      {/* Bottom: User */}
      <div className="w-full border-t border-stone-200 py-2">
        <button
          onClick={() => navigate("/library")}
          className="flex items-center justify-center w-full h-12 hover:bg-stone-50 transition-colors group relative"
          title={user?.nickname || "사용자"}
          aria-label="사용자 메뉴"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-sage-200 text-sage-700">
              {user?.nickname?.[0]?.toUpperCase() || "ME"}
            </AvatarFallback>
          </Avatar>

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {user?.nickname || "사용자"}
          </div>
        </button>
      </div>
    </aside>
  );
}
