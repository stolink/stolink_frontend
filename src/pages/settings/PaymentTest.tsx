import { useEffect, useRef, useState } from "react";
import {
  loadPaymentWidget,
  type PaymentWidgetInstance,
} from "@tosspayments/payment-widget-sdk";
import { nanoid } from "nanoid";
import { Button } from "@stolink/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@stolink/ui";
import { Badge } from "@stolink/ui";
import { CreditCard, Sparkles, Check } from "lucide-react";

// 토스페이먼츠 테스트 클라이언트 키 (개발용)
const clientKey =
  import.meta.env.VITE_TOSS_CLIENT_KEY ||
  "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
const customerKey = nanoid(); // 고객 식별 키 (실제로는 유저 ID 사용)

interface PlanOption {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["프로젝트 3개", "AI 분석 월 10회", "기본 내보내기"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9900,
    features: [
      "무제한 프로젝트",
      "AI 분석 무제한",
      "고급 내보내기",
      "우선 지원",
    ],
    recommended: true,
  },
  {
    id: "team",
    name: "Team",
    price: 29900,
    features: ["Pro 기능 전체", "팀 협업", "API 접근", "전용 지원"],
  },
];

export function PaymentTest() {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 결제위젯 초기화
  useEffect(() => {
    if (!selectedPlan || selectedPlan.price === 0) return;

    const initWidget = async () => {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);
        paymentWidgetRef.current = paymentWidget;

        // 결제 방법 UI 렌더링
        paymentWidget.renderPaymentMethods(
          "#payment-methods",
          { value: selectedPlan.price },
          { variantKey: "DEFAULT" },
        );

        setIsWidgetReady(true);
      } catch (error) {
        console.error("결제위젯 초기화 실패:", error);
      }
    };

    initWidget();

    return () => {
      paymentWidgetRef.current = null;
      setIsWidgetReady(false);
    };
  }, [selectedPlan]);

  // 결제 요청
  const handlePayment = async () => {
    if (!paymentWidgetRef.current || !selectedPlan) return;

    setIsProcessing(true);
    try {
      await paymentWidgetRef.current.requestPayment({
        orderId: nanoid(),
        orderName: `StoLink ${selectedPlan.name} 플랜`,
        customerName: "테스트 사용자",
        customerEmail: "test@example.com",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("결제 요청 실패:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 플랜 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPlan?.id === plan.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            } ${plan.recommended ? "relative" : ""}`}
            onClick={() => setSelectedPlan(plan)}
          >
            {plan.recommended && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                추천
              </Badge>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {selectedPlan?.id === plan.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
                  {plan.price === 0
                    ? "무료"
                    : `₩${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">/월</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 결제 위젯 영역 */}
      {selectedPlan && selectedPlan.price > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              결제 정보
            </CardTitle>
            <CardDescription>
              {selectedPlan.name} 플랜 - ₩{selectedPlan.price.toLocaleString()}
              /월
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 토스페이먼츠 결제 방법 UI */}
            <div id="payment-methods" className="min-h-[200px]" />

            <Button
              onClick={handlePayment}
              disabled={!isWidgetReady || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                "처리 중..."
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {selectedPlan.name} 플랜 구독하기
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              테스트 카드: 4330000000000000 (만료일/CVC 아무거나)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
