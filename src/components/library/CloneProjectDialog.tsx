import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloneProject } from "@/hooks/useCloneProject";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { Project } from "@/types";

interface CloneProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CloneProjectDialog: React.FC<CloneProjectDialogProps> = ({
  project,
  open,
  onOpenChange,
}) => {
  const { mutate: cloneProject, isPending } = useCloneProject();
  const [newTitle, setNewTitle] = useState(`${project.title} (복사본)`);

  const handleClone = () => {
    if (!newTitle.trim()) {
      console.error("프로젝트 제목을 입력해주세요.");
      return;
    }

    cloneProject(
      { projectId: project.id, request: { newTitle } },
      {
        onSuccess: () => {
          onOpenChange(false);
          setNewTitle(`${project.title} (복사본)`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>프로젝트 복제</DialogTitle>
          <DialogDescription>
            "{project.title}" 프로젝트를 복제합니다.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              💡 모든 챕터, 캐릭터, 복선이 함께 복제됩니다.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="newTitle">새 프로젝트 제목</Label>
            <Input
              id="newTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="복제된 프로젝트의 제목을 입력하세요"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button onClick={handleClone} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                복제 중...
              </>
            ) : (
              "복제"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
