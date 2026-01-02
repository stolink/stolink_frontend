import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatsPage from "@/pages/stats/StatsPage";
import ExportPage from "@/pages/export/ExportPage";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "export">("stats");

  return (
    <div className="h-full w-full flex flex-col bg-paper">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "stats" | "export")}
        className="h-full flex flex-col relative"
      >
        {/* Floating Glass Header (Centered) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-2 py-1.5 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 shrink-0">
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger
              value="stats"
              className="px-6 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all font-bold"
            >
              통계
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="px-6 py-2 rounded-xl text-sm border border-transparent data-[state=active]:bg-white data-[state=active]:border-stone-200 data-[state=active]:shadow-sm data-[state=active]:text-stone-900 data-[state=inactive]:text-stone-500 data-[state=inactive]:hover:text-stone-700 data-[state=inactive]:hover:bg-white/50 transition-all font-bold"
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
