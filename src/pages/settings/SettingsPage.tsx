import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Share2,
  Trash2,
  Settings,
  Bell,
  Palette,
  Lock,
  Copy,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  useShareSettings,
  useCreateShareLink,
  useDeleteShareLink,
} from "@/hooks/useShare";
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
  const { id: projectId } = useParams<{ id: string }>();

  // Share Hooks
  const { data: shareSettings, isLoading: isLoadingShare } = useShareSettings(
    projectId || "",
  );
  const createShare = useCreateShareLink();
  const deleteShare = useDeleteShareLink();

  const [autoSave, setAutoSave] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [typingSound, setTypingSound] = useState(false);
  const [goalNotification, setGoalNotification] = useState(true);
  const [foreshadowingNotification, setForeshadowingNotification] =
    useState(true);

  if (!projectId) {
    return <div>잘못된 접근입니다. (프로젝트 ID 누락)</div>;
  }

  const handleCreateShare = () => {
    createShare.mutate({ projectId: projectId! });
  };

  const handleDeleteShare = () => {
    if (!projectId) return;
    if (
      confirm(
        "정말로 공유 링크를 삭제하시겠습니까? 더 이상 이 링크로 접근할 수 없습니다.",
      )
    ) {
      deleteShare.mutate(projectId!);
    }
  };

  const shareUrl = shareSettings
    ? `${window.location.origin}/share/${shareSettings.shareId}`
    : "";

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      // Optional: Add toast notification if available
    }
  };

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
            {isLoadingShare ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            ) : shareSettings ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="bg-stone-50" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    title="링크 복사"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shareUrl, "_blank")}
                    title="새 탭에서 열기"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground bg-stone-50 p-3 rounded-md">
                  <span>
                    만료일:{" "}
                    {shareSettings.expiresAt
                      ? new Date(shareSettings.expiresAt).toLocaleDateString()
                      : "무제한"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-auto p-0 px-2"
                    onClick={handleDeleteShare}
                    disabled={deleteShare.isPending}
                  >
                    {deleteShare.isPending ? "삭제 중..." : "링크 삭제"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-stone-500">
                  아직 생성된 공유 링크가 없습니다. 링크를 생성하면 누구나 이
                  작품을 읽을 수 있습니다.
                </p>
                <Button
                  onClick={handleCreateShare}
                  className="w-full sm:w-auto flex items-center gap-2"
                  disabled={createShare.isPending}
                >
                  {createShare.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  링크 생성하기
                </Button>
              </div>
            )}
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
