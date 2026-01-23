import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatsPage from "@/pages/stats/StatsPage";
import ExportPage from "@/pages/export/ExportPage";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "export">("stats");

  return (
    <div className="h-full w-full flex flex-col bg-paper selection:bg-mocha-100">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "stats" | "export")}
        className="h-full flex flex-col relative"
      >
        {/* Floating Glass Header (Centered) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-1.5 py-1.5 bg-paper/70 backdrop-blur-xl rounded-2xl shadow-paper-floating border border-cloud-200 shrink-0">
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger
              value="stats"
              className="px-6 py-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-mocha-500 data-[state=active]:text-white text-mocha-500 hover:text-mocha-500"
            >
              통계
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="px-6 py-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-mocha-500 data-[state=active]:text-white text-mocha-500 hover:text-mocha-500"
            >
              파일
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="stats" className="mt-0 h-full">
            <StatsPage />
          </TabsContent>

          <TabsContent value="export" className="mt-0 h-full">
            <ExportPage />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
