import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthCard } from "./AuthCard";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-none bg-transparent shadow-none sm:max-w-[420px]"
        overlayClassName="bg-background/95 backdrop-blur-none"
      >
        {/* 스크린 리더용 타이틀과 설명 (시각적으로는 AuthCard 내부 헤더가 담당) */}
        <DialogTitle className="sr-only">로그인 또는 회원가입</DialogTitle>
        <DialogDescription className="sr-only">
          StoLink 서비스를 이용하기 위해 로그인이 필요합니다.
        </DialogDescription>

        <AuthCard onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
