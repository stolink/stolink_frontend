import { useParams } from "react-router-dom";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectInfoCard } from "@/components/settings/ProjectInfoCard";
import { WritingGoalCard } from "@/components/settings/WritingGoalCard";
import { EditorSettingsCard } from "@/components/settings/EditorSettingsCard";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";
import { ShareSettingsCard } from "@/components/settings/ShareSettingsCard";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";

export default function SettingsPage() {
  const { id: projectId } = useParams<{ id: string }>();

  if (!projectId) {
    return <div>잘못된 접근입니다. (프로젝트 ID 누락)</div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-cloud-50 text-foreground">
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
        {/* Header */}
        <PageHeader
          icon={Settings}
          title="설정"
          description="작품 정보 및 환경을 설정합니다"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <ProjectInfoCard projectId={projectId} />
            <WritingGoalCard />
            <NotificationSettingsCard />
          </div>
          <div className="space-y-6">
            <EditorSettingsCard />
            <ShareSettingsCard projectId={projectId} />
            <DangerZoneCard projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}
