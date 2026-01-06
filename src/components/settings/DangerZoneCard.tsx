import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeleteProject, useProject } from "@/hooks/useProjects";
import { Button } from "@stolink/ui";
import { Input } from "@stolink/ui";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@stolink/ui";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DangerZoneCardProps {
  projectId: string;
}

export function DangerZoneCard({ projectId }: DangerZoneCardProps) {
  const navigate = useNavigate();
  const { data: project } = useProject(projectId);
  const deleteProject = useDeleteProject();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmName !== project?.title) return;

    setIsDeleting(true);
    try {
      await deleteProject.mutateAsync(projectId);
      navigate("/library"); // Redirect to library after deletion
    } catch (error) {
      console.error("Failed to delete project:", error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="border-red-200 transition-all duration-300 hover:shadow-md hover:border-red-300 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600  text-xl">
              <AlertTriangle className="h-5 w-5" />
              위험 구역
            </CardTitle>
            <CardDescription className="text-muted-foreground ">
              작품 삭제 등 되돌릴 수 없는 작업을 수행합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors">
              <div className="space-y-1">
                <h4 className="font-medium text-red-900 ">작품 삭제</h4>
                <p className="text-sm text-red-700 ">
                  모든 데이터가 영구적으로 삭제됩니다. 복구할 수 없습니다.
                </p>
              </div>
              <Button
                intent="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              정말 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                이 작업은 되돌릴 수 없습니다. 프로젝트{" "}
                <strong>{project?.title}</strong>의 모든 문서, 캐릭터, 관계도
                데이터가 영구적으로 삭제됩니다.
              </p>
              <div className="space-y-2">
                <Label className="text-foreground">
                  확인을 위해 프로젝트 이름을 입력해주세요:
                </Label>
                <div className="p-2 bg-secondary rounded  text-sm select-all">
                  {project?.title}
                </div>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="프로젝트 이름 입력"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <Button
              intent="destructive"
              disabled={confirmName !== project?.title || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              삭제 실행
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
