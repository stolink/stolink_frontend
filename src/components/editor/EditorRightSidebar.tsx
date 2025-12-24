import { PanelRightClose, FileText, Bot, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ForeshadowingPanel from "@/components/editor/ForeshadowingPanel";
import AIAssistantPanel from "@/components/editor/AIAssistantPanel";
import ConsistencyPanel from "@/components/editor/ConsistencyPanel";

export type RightSidebarTab = "foreshadowing" | "ai" | "consistency";

interface EditorRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: RightSidebarTab;
  onTabChange: (tab: RightSidebarTab) => void;
}

export default function EditorRightSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: EditorRightSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 min-w-[280px] border-l border-stone-200 bg-white flex flex-col shrink-0">
      {/* Header with Tabs */}
      <div className="h-12 px-2 border-b border-stone-100 flex items-center justify-between shrink-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as RightSidebarTab)}
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger
              value="foreshadowing"
              className="text-xs px-2 h-7"
              data-tour="foreshadowing-panel"
            >
              <FileText className="h-3 w-3 mr-1" />
              복선
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="text-xs px-2 h-7"
              data-tour="ai-panel"
            >
              <Bot className="h-3 w-3 mr-1" />
              AI
            </TabsTrigger>
            <TabsTrigger value="consistency" className="text-xs px-2 h-7">
              <CheckCircle className="h-3 w-3 mr-1" />
              체크
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 ml-1 text-stone-400 hover:text-stone-600"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel Content */}
      <div
        className={cn(
          "flex-1",
          activeTab === "ai" ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {activeTab === "foreshadowing" && <ForeshadowingPanel />}
        {activeTab === "ai" && <AIAssistantPanel />}
        {activeTab === "consistency" && <ConsistencyPanel />}
      </div>
    </aside>
  );
}
