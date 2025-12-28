import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatsPage from "@/pages/stats/StatsPage";
import ExportPage from "@/pages/export/ExportPage";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "export">("stats");

  return (
    <div className="h-full w-full flex flex-col bg-paper">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "stats" | "export")} className="h-full flex flex-col">
        {/* 탭 헤더 */}
        <div className="border-b bg-white px-6 py-3 shrink-0">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="stats" className="px-6">
              통계
            </TabsTrigger>
            <TabsTrigger value="export" className="px-6">
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
