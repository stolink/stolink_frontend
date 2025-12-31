import { NavLink, useNavigate } from "react-router-dom";
import { PenLine, BookOpen, BarChart3, Settings } from "lucide-react";
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

function ActivityBarItem({
  to,
  icon: Icon,
  label,
  onClick,
}: ActivityBarItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "relative flex items-center justify-center w-full h-12 group transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-primary",
        )
      }
      title={label}
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5" />

          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />
          )}

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border shadow-md">
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
    { to: `/projects/${projectId}/world`, label: "리소스", icon: BookOpen },
    { to: `/projects/${projectId}/stats`, label: "분석", icon: BarChart3 },
    {
      to: `/projects/${projectId}/settings`,
      label: "프로젝트 설정",
      icon: Settings,
    },
  ];

  return (
    <aside
      className="w-16 bg-secondary border-r border-border flex flex-col items-center shrink-0"
      role="navigation"
      aria-label="주요 네비게이션"
    >
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
      <div className="w-full border-t border-border py-2">
        <button
          onClick={() => navigate("/library")}
          className="flex items-center justify-center w-full h-12 hover:bg-accent transition-colors group relative"
          title={user?.nickname || "사용자"}
          aria-label="사용자 메뉴"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {user?.nickname?.[0]?.toUpperCase() || "ME"}
            </AvatarFallback>
          </Avatar>

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border shadow-md">
            {user?.nickname || "사용자"}
          </div>
        </button>
      </div>
    </aside>
  );
}
