import { ArrowLeft, Play, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DemoHeaderProps {
  isTourCompleted: boolean;
  onStartTour: () => void;
}

export default function DemoHeader({
  isTourCompleted,
  onStartTour,
}: DemoHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2 bg-gradient-to-r from-sage-500 to-sage-600 text-white flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-white hover:bg-card/20"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          홈으로
        </Button>
        <span className="text-sm opacity-90">
          🎮 데모 모드 - "마법사의 여정" 체험 중
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!isTourCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartTour}
            className="text-white hover:bg-card/20"
          >
            <Play className="h-4 w-4 mr-1" />
            가이드 투어
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => navigate("/auth")}
          className="bg-card text-sage-600 hover:bg-card/90"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          회원가입하고 시작
        </Button>
      </div>
    </div>
  );
}
