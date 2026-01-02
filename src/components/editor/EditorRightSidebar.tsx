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
    <aside className="w-72 border-l border-border bg-card hidden lg:flex shrink-0 overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Toggle Button - Left Edge Strip */}
      <button
        onClick={onClose}
        className="w-5 h-full border-r border-border/50 bg-muted/30 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="사이드바 닫기"
      >
        <PanelRightClose className="h-3.5 w-3.5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Tabs */}
        <div className="h-12 px-2 border-b border-border/50 flex items-center shrink-0 bg-stone-50/50">
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as RightSidebarTab)}
            className="flex-1"
          >
            <TabsList className="grid w-full grid-cols-4 h-8 bg-stone-100/50 p-1">
              <TabsTrigger
                value="foreshadowing"
                className="text-[11px] px-1.5 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                data-tour="foreshadowing-panel"
              >
                <Sparkles className="h-3 w-3 mr-1 text-mocha-600" />
                복선
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="text-[11px] px-1.5 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                data-tour="ai-panel"
              >
                <Bot className="h-3 w-3 mr-1 text-indigo-600" />
                AI
              </TabsTrigger>
              <TabsTrigger
                value="consistency"
                className="text-[11px] px-1.5 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                체크
              </TabsTrigger>
              <TabsTrigger
                value="inspector"
                className="text-[11px] px-1.5 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Info className="h-3 w-3 mr-1 text-indigo-600" />
                정보
              </TabsTrigger>
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
