import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@stolink/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  defaultTitle?: string;
  isSubSection?: boolean;
}

export function CreateSectionModal({
  isOpen,
  onClose,
  onCreate,
  defaultTitle = "새 섹션",
  isSubSection = false,
}: CreateSectionModalProps) {
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 모달 열림 시 초기화 패턴
      setTitle(defaultTitle);
    }
  }, [isOpen, defaultTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isSubSection ? "새 하위 섹션 만들기" : "새 섹션 만들기"}
            </DialogTitle>
            <DialogDescription>
              현재 커서 위치를 기준으로 내용을 분리하여 새로운{" "}
              {isSubSection ? "하위 " : ""}섹션을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                제목
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" intent="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
