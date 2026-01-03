import {
  PanelRightClose,
  Bot,
  Info,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import AIAssistantPanel from "@/components/editor/AIAssistantPanel";
import ConsistencyPanel from "@/components/editor/ConsistencyPanel";
import InspectorPanel from "@/components/editor/InspectorPanel";
import ForeshadowingPanel from "@/components/editor/ForeshadowingPanel";

export type RightSidebarTab =
  | "inspector"
  | "foreshadowing"
  | "ai"
  | "consistency";

interface EditorRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: RightSidebarTab;
  onTabChange: (tab: RightSidebarTab) => void;
  documentId?: string | null;
  /** AI 챗봇에서 사용할 프로젝트 ID */
  projectId?: string | null;
  sectionTitle?: string;
  /** 새로 생성된 복선 ID (포커스 이동용) */
  newForeshadowingId?: string | null;
  /** 위치 클릭 시 에디터 이동 콜백 */
  onNavigateToPosition?: (documentId: string) => void;
}

export default function EditorRightSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  documentId = null,
  projectId = null,
  sectionTitle = "",
  newForeshadowingId,
  onNavigateToPosition,
}: EditorRightSidebarProps) {
  if (!isOpen) return null;

  // Tab configuration for icon-only display
  const tabs = [
    {
      value: "foreshadowing",
      icon: Sparkles,
      label: "복선",
      tourId: "foreshadowing-panel",
    },
    { value: "ai", icon: Bot, label: "AI", tourId: "ai-panel" },
    {
      value: "consistency",
      icon: AlertTriangle,
      label: "체크",
      tourId: undefined,
    },
    { value: "inspector", icon: Info, label: "정보", tourId: undefined },
  ] as const;

  return (
    <aside className="w-72 border-l border-mocha-100 bg-cloud-50 hidden lg:flex shrink-0 overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Toggle Button - Left Edge Strip */}
      <button
        onClick={onClose}
        className="w-5 h-full border-r border-mocha-100/50 bg-mocha-50/30 hover:bg-mocha-100/50 flex items-center justify-center text-mocha-400 hover:text-mocha-600 transition-colors shrink-0"
        title="사이드바 닫기"
      >
        <PanelRightClose className="h-3.5 w-3.5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-cloud-50/50">
        {/* Header with Tabs - Icon-only with active label */}
        <div className="px-2 pt-2.5 pb-2 shrink-0 bg-transparent z-10">
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as RightSidebarTab)}
            className="w-full"
          >
            <TabsList className="flex w-full h-9 bg-mocha-50/50 p-0.5 rounded-lg border border-mocha-100/40 gap-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex-1 h-8 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5",
                      "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-espresso-800",
                      "text-mocha-400 hover:text-mocha-500 hover:bg-mocha-100/30",
                    )}
                    data-tour={tab.tourId}
                    title={tab.label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {isActive && (
                      <span className="text-[10px] font-semibold tracking-tight">
                        {tab.label}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Panel Content */}
        <div
          className={cn(
            "flex-1",
            activeTab === "ai" ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {activeTab === "inspector" && (
            <InspectorPanel documentId={documentId} />
          )}
          {activeTab === "foreshadowing" && (
            <ForeshadowingPanel
              newForeshadowingId={newForeshadowingId}
              documentId={documentId}
              sectionTitle={sectionTitle}
              onNavigateToPosition={onNavigateToPosition}
            />
          )}
          {activeTab === "ai" && <AIAssistantPanel projectId={projectId} />}
          {activeTab === "consistency" && <ConsistencyPanel />}
        </div>
      </div>
    </aside>
  );
}
