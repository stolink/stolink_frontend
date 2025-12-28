import { useState } from "react";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Foreshadowing {
  id: string;
  tag: string;
  status: "pending" | "recovered";
  chapter: string;
  line: number;
  description: string;
  recoveredChapter?: string;
}

// Mock data
const mockForeshadowings: Foreshadowing[] = [
  {
    id: "1",
    tag: "전설의검",
    status: "pending",
    chapter: "1장",
    line: 32,
    description: "노인이 건넨 검",
  },
  {
    id: "2",
    tag: "숨겨진과거",
    status: "recovered",
    chapter: "1장",
    line: 45,
    description: "주인공의 어린 시절 암시",
    recoveredChapter: "5장",
  },
  {
    id: "3",
    tag: "예언의조각",
    status: "pending",
    chapter: "2장",
    line: 12,
    description: "마을 노파의 예언",
  },
];

export default function ForeshadowingPanel() {
  const [filter, setFilter] = useState<"all" | "current">("all");
  const [foreshadowings] = useState<Foreshadowing[]>(mockForeshadowings);

  const pendingCount = foreshadowings.filter(
    (f) => f.status === "pending",
  ).length;
  const recoveredCount = foreshadowings.filter(
    (f) => f.status === "recovered",
  ).length;

  return (
    <div className="p-3">
      {/* Filter */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "current")}
        className="mb-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="text-xs">
            전체
          </TabsTrigger>
          <TabsTrigger value="current" className="text-xs">
            현재 챕터
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-status-warning" />
          <span>미회수: {pendingCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-status-success" />
          <span>회수됨: {recoveredCount}</span>
        </div>
      </div>

      {/* Foreshadowing List */}
      <div className="space-y-3">
        {foreshadowings.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
              item.status === "recovered" && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-medium text-sage-700">#{item.tag}</span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  item.status === "pending"
                    ? "bg-status-warning/10 text-status-warning"
                    : "bg-status-success/10 text-status-success",
                )}
              >
                {item.status === "pending" ? "미회수" : "회수됨"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                📍 등장: {item.chapter} ({item.line}번째 줄)
              </p>
              {item.status === "recovered" && item.recoveredChapter && (
                <p className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  회수: {item.recoveredChapter}
                </p>
              )}
              <p>📝 {item.description}</p>
            </div>

            {item.status === "pending" && (
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" className="text-xs h-7">
                  회수 처리
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  이동
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
