import { useState } from 'react';
import { Share2, Trash2, Settings, Bell, Palette, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Custom Toggle Switch Component
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-organic focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-sage-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-sage-500' : 'bg-stone-200'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
          transition duration-200 ease-organic
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [autoSave, setAutoSave] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [typingSound, setTypingSound] = useState(false);
  const [goalNotification, setGoalNotification] = useState(true);
  const [foreshadowingNotification, setForeshadowingNotification] = useState(true);

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-sage-500" />
            관리
          </h1>
          <p className="text-muted-foreground mt-1">
            작품 정보 및 설정을 관리하세요
          </p>
        </div>

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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">자동 저장</p>
                <p className="text-sm text-muted-foreground">30초마다 자동 저장</p>
              </div>
              <Toggle checked={autoSave} onChange={setAutoSave} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">맞춤법 검사</p>
                <p className="text-sm text-muted-foreground">실시간 맞춤법 표시</p>
              </div>
              <Toggle checked={spellCheck} onChange={setSpellCheck} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">타이핑 사운드</p>
                <p className="text-sm text-muted-foreground">타자기 효과음</p>
              </div>
              <Toggle checked={typingSound} onChange={setTypingSound} />
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">집필 목표 알림</p>
                <p className="text-sm text-muted-foreground">일일 목표 달성 알림</p>
              </div>
              <Toggle checked={goalNotification} onChange={setGoalNotification} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">미회수 복선 알림</p>
                <p className="text-sm text-muted-foreground">일정 기간 미회수 복선 알림</p>
              </div>
              <Toggle checked={foreshadowingNotification} onChange={setForeshadowingNotification} />
            </div>
          </CardContent>
        </Card>

        {/* Share */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              공유
            </CardTitle>
            <CardDescription>읽기 전용 링크를 생성하여 다른 사람과 공유합니다</CardDescription>
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
            <CardDescription>협업자를 초대하고 권한을 관리합니다</CardDescription>
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
            <CardDescription>주의: 이 작업은 되돌릴 수 없습니다</CardDescription>
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

