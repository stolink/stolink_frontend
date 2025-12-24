import { useState } from "react";
import { Share2, Trash2, Settings, Bell, Palette, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Toggle } from "@/components/ui/toggle";
import { SettingRow } from "@/components/ui/setting-row";

export default function SettingsPage() {
  const [autoSave, setAutoSave] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [typingSound, setTypingSound] = useState(false);
  const [goalNotification, setGoalNotification] = useState(true);
  const [foreshadowingNotification, setForeshadowingNotification] =
    useState(true);

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          icon={Settings}
          title="관리"
          description="작품 정보 및 설정을 관리하세요"
        />

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              에디터 설정
            </CardTitle>
            <CardDescription>에디터 환경을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow title="자동 저장" description="30초마다 자동 저장">
              <Toggle checked={autoSave} onChange={setAutoSave} />
            </SettingRow>
            <SettingRow title="맞춤법 검사" description="실시간 맞춤법 표시">
              <Toggle checked={spellCheck} onChange={setSpellCheck} />
            </SettingRow>
            <SettingRow title="타이핑 사운드" description="타자기 효과음">
              <Toggle checked={typingSound} onChange={setTypingSound} />
            </SettingRow>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림
            </CardTitle>
            <CardDescription>알림 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              title="집필 목표 알림"
              description="일일 목표 달성 알림"
            >
              <Toggle
                checked={goalNotification}
                onChange={setGoalNotification}
              />
            </SettingRow>
            <SettingRow
              title="미회수 복선 알림"
              description="일정 기간 미회수 복선 알림"
            >
              <Toggle
                checked={foreshadowingNotification}
                onChange={setForeshadowingNotification}
              />
            </SettingRow>
          </CardContent>
        </Card>

        {/* Share */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              공유
            </CardTitle>
            <CardDescription>
              읽기 전용 링크를 생성하여 다른 사람과 공유합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input placeholder="공유 링크가 여기에 표시됩니다" readOnly />
              <Button className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                링크 생성
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              생성된 링크는 선택한 기간 동안만 유효합니다
            </p>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              접근 권한
            </CardTitle>
            <CardDescription>
              협업자를 초대하고 권한을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <Lock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>협업 기능은 프로 플랜에서 사용할 수 있습니다</p>
              <Button variant="outline" className="mt-4">
                플랜 업그레이드
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">위험 구역</CardTitle>
            <CardDescription>
              주의: 이 작업은 되돌릴 수 없습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              작품 삭제
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
