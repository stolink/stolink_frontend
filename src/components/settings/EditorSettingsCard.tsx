import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, ChevronRight } from "lucide-react";
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@stolink/ui";
import { Switch } from "@/components/ui/switch";
import { SettingRow } from "@/components/ui/setting-row";
import { Button } from "@stolink/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditorSettingsPanel } from "@/components/editor/settings/EditorSettingsPanel";
import type { SystemSettings } from "@/types/editorSettings";

const AUTO_SAVE_OPTIONS: {
  value: SystemSettings["autoSaveInterval"];
  label: string;
}[] = [
  { value: "realtime", label: "실시간" },
  { value: "5s", label: "5초" },
  { value: "1m", label: "1분" },
  { value: "manual", label: "수동" },
];

export function EditorSettingsCard() {
  const [showFullSettings, setShowFullSettings] = useState(false);

  const { system, behavior, setAutoSaveInterval, setPerformanceMode } =
    useEditorSettingStore();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="transition-all duration-300 hover:shadow-paper border-mocha-100 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2  text-xl text-espresso-900">
              <Settings2 className="h-5 w-5 text-mocha-500" />
              에디터 설정
            </CardTitle>
            <CardDescription className="text-muted-foreground ">
              에디터 환경을 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              title="자동 저장"
              description="문서가 자동으로 저장되는 간격"
            >
              <Select
                value={system.autoSaveInterval}
                onValueChange={(value) =>
                  setAutoSaveInterval(
                    value as SystemSettings["autoSaveInterval"],
                  )
                }
              >
                <SelectTrigger className="w-[100px] border-mocha-200 focus:ring-mocha-400 bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_SAVE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow
              title="성능 모드"
              description="타이핑 시 반응 속도 향상 (디바운싱 활성화)"
            >
              <Switch
                checked={behavior.performanceMode}
                onChange={setPerformanceMode}
              />
            </SettingRow>

            <div className="pt-2 border-t border-mocha-100">
              <Button
                intent="ghost"
                className="w-full justify-between text-muted-foreground hover:text-mocha-600 hover:bg-mocha-50"
                onClick={() => setShowFullSettings(true)}
              >
                <span>전체 에디터 설정</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showFullSettings} onOpenChange={setShowFullSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>에디터 설정</DialogTitle>
          </DialogHeader>
          <EditorSettingsPanel />
        </DialogContent>
      </Dialog>
    </>
  );
}
