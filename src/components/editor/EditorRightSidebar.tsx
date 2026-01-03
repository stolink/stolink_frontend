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
        {/* Header with Tabs - Refined Style */}
        <div className="h-12 px-2.5 border-b border-mocha-100 flex items-center shrink-0 bg-white/40 sticky top-0 z-10 backdrop-blur-sm">
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as RightSidebarTab)}
            className="flex-1"
          >
            <TabsList className="grid w-full grid-cols-4 h-9 bg-mocha-50/80 p-1 rounded-lg border border-mocha-100/20">
              <TabsTrigger
                value="foreshadowing"
                className="text-[11px] font-medium px-1 h-7 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-mocha-400 transition-all duration-200"
                data-tour="foreshadowing-panel"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                복선
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="text-[11px] font-medium px-1 h-7 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-mocha-400 transition-all duration-200"
                data-tour="ai-panel"
              >
                <Bot className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                Check-bot
              </TabsTrigger>
              <TabsTrigger
                value="consistency"
                className="text-[11px] font-medium px-1 h-7 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-mocha-400 transition-all duration-200"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                체크
              </TabsTrigger>
              <TabsTrigger
                value="inspector"
                className="text-[11px] font-medium px-1 h-7 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-mocha-400 transition-all duration-200"
              >
                <Info className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                정보
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Panel Content */}
        <div
          className={cn(
            "flex-1",
            activeTab === "ai" ? "overflow-hidden" : "overflow-y-auto"
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
