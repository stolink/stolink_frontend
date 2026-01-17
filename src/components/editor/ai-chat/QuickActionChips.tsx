import { motion } from "framer-motion";
import { Sparkles, BookOpen, User, Feather } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionChipsProps {
  onSelectAction: (action: string) => void;
  disabled?: boolean;
}

const ACTIONS = [
  {
    icon: Sparkles,
    label: "개연성 체크",
    prompt:
      "현재 작성된 내용의 개연성을 분석하고, 논리적 오류가 있다면 지적해줘.",
    color: "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200",
  },
  {
    icon: BookOpen,
    label: "다음 전개 제안",
    prompt:
      "이 다음 장면으로 이어질 수 있는 흥미로운 전개 방향을 3가지만 제안해줘.",
    color: "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    icon: User,
    label: "캐릭터 심리 분석",
    prompt: "현재 장면에서 등장인물들의 심리 상태와 숨겨진 의도를 분석해줘.",
    color: "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200",
  },
  {
    icon: Feather,
    label: "문체 교정",
    prompt: "작성된 문장을 더 매끄럽고 문학적인 표현으로 다듬어줘.",
    color:
      "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
  },
];

export function QuickActionChips({
  onSelectAction,
  disabled,
}: QuickActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center px-4 pb-2">
      {ACTIONS.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectAction(action.prompt)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap transition-all shadow-sm",
            action.color,
            disabled && "opacity-50 cursor-not-allowed grayscale",
            !disabled && "hover:shadow-md hover:scale-105 active:scale-95",
          )}
        >
          <action.icon className="w-3 h-3" />
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
