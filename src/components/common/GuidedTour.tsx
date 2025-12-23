import { useState, useEffect, useLayoutEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function GuidedTour({
  steps,
  isOpen,
  onClose,
  onComplete,
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  // 타겟 요소 위치 계산 (useLayoutEffect로 변경)
  useLayoutEffect(() => {
    if (!isOpen || !step?.target) return;

    const updatePosition = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // 초기 위치 설정
    const timer = setTimeout(updatePosition, 100);

    // 리사이즈/스크롤 이벤트 리스너
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, step?.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || !step) return null;

  return (
    <>
      {/* Backdrop with spotlight */}
      <div className="fixed inset-0 z-[100]">
        {/* Dark overlay with cutout for target */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border */}
        {targetRect && (
          <div
            className="absolute border-2 border-sage-400 rounded-lg pointer-events-none animate-pulse"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      {/* 고정 위치 하단 중앙 툴팁 - 버튼 위치가 일정해서 마우스 이동 최소화 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[101] w-[400px] bg-white rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-100 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-sage-600" />
            </div>
            <span className="text-sm font-medium text-sage-600">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 mx-4 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-5">{step.content}</p>

        {/* Navigation - 버튼이 항상 같은 위치에 있어서 클릭이 편함 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            건너뛰기
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={cn(currentStep === 0 && 'opacity-50 cursor-not-allowed')}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <Button size="sm" onClick={handleNext} className="min-w-[80px]">
              {currentStep === steps.length - 1 ? '완료!' : '다음'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
