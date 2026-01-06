import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useShareSettings,
  useCreateShareLink,
  useDeleteShareLink,
} from "@/hooks/useShare";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingRow } from "@/components/ui/setting-row";

interface ShareSettingsCardProps {
  projectId: string;
}

export function ShareSettingsCard({ projectId }: ShareSettingsCardProps) {
  const { data: shareSettings, isLoading } = useShareSettings(projectId);
  const createShare = useCreateShareLink();
  const deleteShare = useDeleteShareLink();

  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("7");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const shareUrl = shareSettings
    ? `${window.location.origin}/share/${shareSettings.shareId}`
    : "";

  const handleCreateShare = () => {
    createShare.mutate({
      projectId,
      options: {
        password: passwordEnabled ? password : undefined,
        expiresIn: expiresIn === "unlimited" ? undefined : expiresIn,
      },
    });
  };

  const handleDeleteShare = () => {
    deleteShare.mutate(projectId);
    setShowDeleteConfirm(false);
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Toast would be nice here
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="transition-all duration-300 hover:shadow-paper border-mocha-100 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl text-espresso-900">
              <Share2 className="h-5 w-5 text-mocha-500" />
              공유
            </CardTitle>
            <CardDescription className="text-muted-foreground font-serif">
              프로젝트를 읽기 전용으로 공유할 수 있는 링크를 생성합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {shareSettings ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-secondary/50 border-mocha-200 focus-visible:ring-mocha-400 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    title="링크 복사"
                    className="border-mocha-200 hover:bg-mocha-50 text-mocha-600 hover:text-mocha-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shareUrl, "_blank")}
                    title="새 탭에서 열기"
                    className="border-mocha-200 hover:bg-mocha-50 text-mocha-600 hover:text-mocha-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg space-y-2 text-sm border border-mocha-100/50">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">만료일</span>
                    <span className="font-medium text-espresso-900">
                      {shareSettings.expiresAt
                        ? new Date(shareSettings.expiresAt).toLocaleDateString()
                        : "무제한"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">접근 보호</span>
                    <span className="font-medium text-espresso-900">
                      {shareSettings.hasPassword ? "비밀번호 설정됨" : "공개"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200 transition-colors"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  공유 링크 삭제
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <SettingRow
                  title="비밀번호 보호"
                  description="링크 접근 시 비밀번호 요구"
                >
                  <Switch
                    checked={passwordEnabled}
                    onChange={setPasswordEnabled}
                    className="data-[state=checked]:bg-mocha-500"
                  />
                </SettingRow>

                {passwordEnabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="pl-4 border-l-2 border-mocha-200/50"
                  >
                    <Label
                      htmlFor="share-password"
                      className="text-espresso-900"
                    >
                      접근 비밀번호
                    </Label>
                    <Input
                      id="share-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="mt-1.5 border-mocha-200 focus-visible:ring-mocha-400 bg-white/80"
                    />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label className="text-espresso-900">유효 기간</Label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger className="border-mocha-200 focus:ring-mocha-400 bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7일</SelectItem>
                      <SelectItem value="30">30일</SelectItem>
                      <SelectItem value="unlimited">무제한</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateShare}
                  className="w-full bg-mocha-500 hover:bg-mocha-600 text-white shadow-sm hover:shadow-md transition-all active:scale-95"
                  disabled={
                    createShare.isPending || (passwordEnabled && !password)
                  }
                >
                  {createShare.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  링크 생성하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공유 링크 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 공유 링크를 삭제하시겠습니까? 더 이상 외부에서 이 작품에
              접근할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteShare}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
