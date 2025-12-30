import {
  PanelRightClose,
  Bot,
  Info,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  sectionTitle = "",
  newForeshadowingId,
  onNavigateToPosition,
}: EditorRightSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 min-w-[280px] border-l border-border bg-card flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
      {/* Header with Tabs */}
      <div className="h-12 px-2 border-b border-border/50 flex items-center justify-between shrink-0 bg-stone-50/50">
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
              <Info className="h-3 w-3 mr-1 text-blue-600" />
              정보
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 ml-1 text-stone-400 hover:text-stone-600"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
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
        {activeTab === "ai" && <AIAssistantPanel />}
        {activeTab === "consistency" && <ConsistencyPanel />}
      </div>
    </aside>
  );
}

