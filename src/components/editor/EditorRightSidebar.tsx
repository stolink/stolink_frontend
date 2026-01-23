import { Bot, Info, Sparkles, Lightbulb } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import AIAssistantPanel from "@/components/editor/AIAssistantPanel";
import InsightsPanel from "@/components/editor/InsightsPanel";
import InspectorPanel from "@/components/editor/InspectorPanel";
import ForeshadowingPanel from "@/components/editor/ForeshadowingPanel";
import type { ConsistencyReport } from "@/types/analysisResult";

export type RightSidebarTab =
  | "inspector"
  | "foreshadowing"
  | "ai"
  | "consistency";

import { useResizable } from "@/hooks/useResizable";

import { useUIStore } from "@/stores/useUIStore";

interface EditorRightSidebarProps {
  documentId?: string | null;
  /** AI 챗봇에서 사용할 프로젝트 ID */
  projectId?: string | null;
  sectionTitle?: string;
  /** 새로 생성된 복선 ID (포커스 이동용) */
  newForeshadowingId?: string | null;
  /** 위치 클릭 시 에디터 이동 콜백 */
  onNavigateToPosition?: (documentId: string) => void;
  /** 분석 결과: 일관성 리포트 */
  consistencyReport?: ConsistencyReport | null;
  /** 분석 진행 중 여부 */
  isAnalyzing?: boolean;
  /** 분석 새로고침 콜백 */
  onRefreshAnalysis?: () => void;
}

export default function EditorRightSidebar({
  documentId = null,
  projectId = null,
  sectionTitle = "",
  newForeshadowingId,
  onNavigateToPosition,
  consistencyReport,
  isAnalyzing,
  onRefreshAnalysis,
}: EditorRightSidebarProps) {
  const isOpen = useUIStore((state) => state.rightSidebarOpen);
  const activeTab = useUIStore((state) => state.rightSidebarTab);
  const onTabChange = useUIStore((state) => state.setRightSidebarTab);
  // Resizable Logic
  const { width, startResizing, isResizing } = useResizable({
    initialWidth: 320,
    minWidth: 260,
    maxWidth: 600,
    direction: "left", // Right sidebar expands to the left
  });

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        "border-l border-mocha-100 bg-cloud-50 hidden lg:flex shrink-0 overflow-visible relative",
        isResizing && "transition-none", // Disable transitions while dragging
      )}
      style={{ width }}
    >
      {/* Resize Handle - Left Edge */}
      <div
        onMouseDown={startResizing}
        className="absolute left-[-4px] top-0 w-[8px] h-full cursor-col-resize z-50 hover:bg-mocha-400/20 active:bg-mocha-400/40 transition-colors"
        title="드래그하여 크기 조절"
      />

      {/* No Edge Buttons Here */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-cloud-50/50">
        {/* Header - Aligned with EditorToolbar (h-[52px]) */}
        <div className="h-[52px] min-h-[52px] px-3 flex items-center shrink-0 border-b border-mocha-100/50 bg-transparent z-10">
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as RightSidebarTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 h-9 bg-mocha-50/40 p-1 rounded-lg border border-mocha-100/30 backdrop-blur-md">
              <TabsTrigger
                value="foreshadowing"
                className="text-[11px] font-semibold h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 text-mocha-400/80 transition-all duration-300 gap-1 hover:text-mocha-500 overflow-hidden"
                data-tour="foreshadowing-panel"
                title="복선 관리"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">복선</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="text-[11px] font-semibold h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 text-mocha-400/80 transition-all duration-300 gap-1 hover:text-mocha-500 overflow-hidden"
                data-tour="ai-panel"
                title="AI 체크봇"
              >
                <Bot className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">AI</span>
              </TabsTrigger>
              <TabsTrigger
                value="consistency"
                className="text-[11px] font-semibold h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 text-mocha-400/80 transition-all duration-300 gap-1 hover:text-mocha-500 overflow-hidden"
                title="개연성 검증"
              >
                <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">검증</span>
              </TabsTrigger>
              <TabsTrigger
                value="inspector"
                className="text-[11px] font-semibold h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-mocha-700 text-mocha-400/80 transition-all duration-300 gap-1 hover:text-mocha-500 overflow-hidden"
                title="문서 정보"
              >
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">정보</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Panel Content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Inspector Panel */}
          <div
            className={cn(
              "absolute inset-0 overflow-y-auto",
              activeTab !== "inspector" &&
                "pointer-events-none opacity-0 invisible",
            )}
          >
            <InspectorPanel documentId={documentId} />
          </div>

          {/* Foreshadowing Panel */}
          <div
            className={cn(
              "absolute inset-0 overflow-y-auto",
              activeTab !== "foreshadowing" &&
                "pointer-events-none opacity-0 invisible",
            )}
          >
            <ForeshadowingPanel
              newForeshadowingId={newForeshadowingId}
              documentId={documentId}
              sectionTitle={sectionTitle}
              onNavigateToPosition={onNavigateToPosition}
            />
          </div>

          {/* AI Assistant Panel */}
          <div
            className={cn(
              "absolute inset-0",
              activeTab !== "ai" && "pointer-events-none opacity-0 invisible",
            )}
          >
            <AIAssistantPanel
              projectId={projectId}
              consistencyReport={consistencyReport}
            />
          </div>

          {/* Insights Panel */}
          <div
            className={cn(
              "absolute inset-0 overflow-y-auto",
              activeTab !== "consistency" &&
                "pointer-events-none opacity-0 invisible",
            )}
          >
            <InsightsPanel
              projectId={projectId}
              consistencyReport={consistencyReport}
              isAnalyzing={isAnalyzing}
              onRefresh={onRefreshAnalysis}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
