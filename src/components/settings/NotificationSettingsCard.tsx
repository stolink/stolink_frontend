import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SettingRow } from "@/components/ui/setting-row";

export function NotificationSettingsCard() {
  const {
    goalNotification,
    foreshadowingNotification,
    aiSuggestionNotification,
    setGoalNotification,
    setForeshadowingNotification,
    setAiSuggestionNotification,
  } = useNotificationStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="transition-all duration-300 hover:shadow-paper border-mocha-100 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl text-espresso-900">
            <Bell className="h-5 w-5 text-mocha-500" />
            알림
          </CardTitle>
          <CardDescription className="text-muted-foreground font-serif">
            알림 설정을 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow title="집필 목표 알림" description="일일 목표 달성 알림">
            <Switch
              checked={goalNotification}
              onChange={setGoalNotification}
              className="data-[state=checked]:bg-mocha-500"
            />
          </SettingRow>

          <SettingRow
            title="미회수 복선 알림"
            description="일정 기간 미회수 복선 알림"
          >
            <Switch
              checked={foreshadowingNotification}
              onChange={setForeshadowingNotification}
              className="data-[state=checked]:bg-mocha-500"
            />
          </SettingRow>

          <SettingRow title="AI 제안 알림" description="AI가 분석 완료 시 알림">
            <Switch
              checked={aiSuggestionNotification}
              onChange={setAiSuggestionNotification}
              className="data-[state=checked]:bg-mocha-500"
            />
          </SettingRow>
        </CardContent>
      </Card>
    </motion.div>
  );
}
