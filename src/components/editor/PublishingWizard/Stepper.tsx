/**
 * Stepper - 3단계 진행 상태 표시 컴포넌트
 * 커뮤니티 배포 마법사의 현재 단계를 시각적으로 표시
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperProps {
  currentStep: 1 | 2 | 3;
  steps?: Array<{ label: string; description?: string }>;
}

const defaultSteps = [
  { label: "선택", description: "섹션 선택" },
  { label: "설정", description: "배포 방식" },
  { label: "완료", description: "최종 확인" },
];

export function Stepper({ currentStep, steps = defaultSteps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 bg-cloud-50 border-b border-cloud-200">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;

        return (
          <div key={step.label} className="flex items-center">
            {/* 스텝 원형 */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  isCompleted && "bg-sage-500 text-white",
                  isActive && "bg-mocha-500 text-white",
                  isPending && "bg-cloud-200 text-espresso-500",
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-sage-700",
                  isActive && "text-mocha-700",
                  isPending && "text-espresso-400",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* 연결선 (마지막 스텝 제외) */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-3",
                  stepNumber < currentStep ? "bg-sage-500" : "bg-cloud-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
