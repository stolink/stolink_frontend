// =====================================================
// 관계 삭제 확인 다이얼로그
// =====================================================

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceName: string;
  targetName: string;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  sourceName,
  targetName,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[420px]">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl font-bold text-espresso-900">
            관계 삭제
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-espresso-600 leading-relaxed">
            <span className="font-bold text-espresso-800">{sourceName}</span>
            와(과){" "}
            <span className="font-bold text-espresso-800">
              {targetName}
            </span>{" "}
            사이의 관계를 삭제하시겠습니까?
            <br />
            <span className="text-rose-500 font-medium mt-2 inline-block">
              이 작업은 되돌릴 수 없습니다.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 sm:justify-center pt-4">
          <AlertDialogCancel
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
